const { ObjectId } = require('mongodb');
const moment = require('moment');

const { database } = require('../../../../config/vars');

let db = null;
let connect = null;

exports.configureDatabaseAndConnect = (_db, _connect) => { db = _db; connect = _connect; };

const addNewReport = json => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    db.collection(database.reportCollection)
        .insertOne(json)
        .then(resolve)
        .catch(reject);
});

const getReportSubmissions = projectID => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    db.collection(database.reportCollection)
        .aggregate([
            { $match: { projectID: new ObjectId(projectID) } },
            {
                $lookup: {
                    from: 'user',
                    foreignField: '_id',
                    localField: 'meta.submitted_by',
                    as: 'meta.submitted_by',
                },
            },
            { $project: { report: 0 } },
            {
                $project: {
                    'meta.submitted_at': 1,
                    'meta.submitted_by._id': 1,
                    'meta.submitted_by.name': 1,
                },
            },
            { $unwind: '$meta.submitted_by' },
            { $limit: 10 },
        ])
        .toArray()
        .then(resolve)
        .catch(reject);
});

const prepareFindAndLimitForReport = (projectID, period) => {
    // These are filters when period is 'recent'
    const find = { projectID: new ObjectId(projectID) };
    let limit = 1;

    if (period === 'week') {
        const date = new Date();
        const currentDate = moment().valueOf();
        const dateAWeekBefore = moment()
            .subtract(7, 'd') // Subtract the days
            .subtract(date.getHours(), 'h') // Subtract the remaining hours and minuets as well
            .subtract(date.getMinutes(), 'm') // So that is includes the last whole day
            // like from wed 00:00 last week to wed 8:30 this week
            .valueOf();
        find['meta.submitted_at'] = { $gte: dateAWeekBefore, $lte: currentDate };
        limit = Number.MAX_SAFE_INTEGER;
    } else if (period === 'all') {
        limit = Number.MAX_SAFE_INTEGER;
    }

    return { find, limit };
};

const getSummaryOfReport = (projectID, period) => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    const { find, limit } = prepareFindAndLimitForReport(projectID, period);
    db.collection(database.reportCollection)
        .find(find, { projection: { summary: 1, meta: 1 } })
        .sort({ 'meta.submitted_at': 1 })
        .limit(limit)
        .toArray()
        .then(resolve)
        .catch(reject);
});

const getLintDetailsOfReport = (projectID, period) => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }

    const { find: match, limit } = prepareFindAndLimitForReport(projectID, period);
    db.collection(database.reportCollection)
        .aggregate([
            { $match: match },
            { $sort: { 'meta.submitted_at': 1 } },
            { $limit: limit },
            { $unwind: '$lint' },
            { $group: { _id: { name: '$lint.name', ruleSeverity: '$lint.ruleSeverity' }, count: { $sum: 1 } } },
            { $group: { _id: '$_id.name', file: { $first: '$_id.name' }, output: { $push: { ruleSeverity: '$_id.ruleSeverity', count: '$count' } } } },
            { $project: { _id: 0 } },
        ])
        .toArray()
        .then(resolve)
        .catch(reject);
});

// TODO: Finish This when you deploy CLI!
const getCoverageDetailsOfReport = (projectID, period) => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }

    const { find: match, limit } = prepareFindAndLimitForReport(projectID, period);
    db.collection(database.reportCollection)
        .aggregate([
            { $match: match },
            { $sort: { 'meta.submitted_at': -1 } },
            { $limit: limit },
            { $unwind: '$coverage' },
            {
                $group: {
                    _id: '$coverage.name',
                    name: { $first: '$coverage.name' },
                    output: {
                        $push: {
                            submitted_at: '$meta.submitted_at',
                            coverage: '$coverage',
                            summary: '$summary.coverage',
                        },
                    },
                },
            },
            { $project: { _id: 0 } },
            // { $group: { _id: { name: '$coverage.name' }, count: { $sum: 1 } } },
            // { $group: { _id: '$_id.name', file: { $first: '$_id.name' }, output: { $push: { ruleSeverity: '$_id.ruleSeverity', count: '$count' } } } },
            
        ])
        .toArray()
        .then(resolve)
        .catch(reject);
});

exports.queries = {
    addNewReport,
    getReportSubmissions,
    getSummaryOfReport,
    getLintDetailsOfReport,
    getCoverageDetailsOfReport,
};

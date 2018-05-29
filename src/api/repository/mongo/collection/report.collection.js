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

const getSummaryOfReport = (projectID, period) => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }

    // These are for 'recent'
    const find = { projectID: new ObjectId(projectID) };
    let limit = 1;

    if (period === 'week') {
        const date = new Date();
        const currentDate = moment().valueOf();
        const dateAWeekBefore = moment()
            .subtract(7, 'd') // Subtract the days
            .subtract(date.getHours(), 'h') // Subtract the remaining hours and minues as well
            .subtract(date.getMinutes(), 'm') // So that is includes the last whole day
            // like from wed 00:00 last week to wed 8:30 this week
            .valueOf();
        find['meta.submitted_at'] = { $gte: dateAWeekBefore, $lte: currentDate };
        limit = Number.MAX_SAFE_INTEGER;
    } else if (period === 'all') {
        limit = Number.MAX_SAFE_INTEGER;
    }
    db.collection(database.reportCollection)
        .find(find, { projection: { summary: 1, meta: 1 } })
        .sort({ 'meta.submitted_at': 1 })
        .limit(limit)
        .toArray()
        .then(resolve)
        .catch(reject);
});

const getDetailsOfReport = (projectID, period) => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }

    // These are for 'recent'
    const match = { projectID: new ObjectId(projectID) };
    let limit = 1;

    if (period === 'week') {
        const date = new Date();
        const currentDate = moment().valueOf();
        const dateAWeekBefore = moment()
            .subtract(7, 'd') // Subtract the days
            .subtract(date.getHours(), 'h') // Subtract the remaining hours and minues as well
            .subtract(date.getMinutes(), 'm') // So that is includes the last whole day
            // like from wed 00:00 last week to wed 8:30 this week
            .valueOf();
        match['meta.submitted_at'] = { $gte: dateAWeekBefore, $lte: currentDate };
        limit = Number.MAX_SAFE_INTEGER; // TODO: Is this safe?
    } else if (period === 'all') {
        limit = Number.MAX_SAFE_INTEGER;
    }
    db.collection(database.reportCollection)
        .aggregate([
            { $match: match },
            { $sort: { 'meta.submitted_at': 1 } },
            { $limit: limit },
            { $unwind: '$report' },
            { $group: { _id: { name: '$report.name', ruleSeverity: '$report.ruleSeverity' }, count: { $sum: 1 } } },
            { $group: { _id: '$_id.name', file: { $first: '$_id.name' }, output: { $push: { ruleSeverity: '$_id.ruleSeverity', count: '$count' } } } },
            { $project: { _id: 0 } },
        ])
        .toArray()
        .then(resolve)
        .catch(reject);
});

exports.queries = {
    addNewReport,
    getReportSubmissions,
    getSummaryOfReport,
    getDetailsOfReport,
};
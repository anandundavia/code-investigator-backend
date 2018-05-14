const { MongoClient, ObjectId } = require('mongodb');
const moment = require('moment');

const { database } = require('../../config/vars');
// Holds the current connection to repository
let db = null;

// Whether any connection opening process in ongoing
// Helps keep track of opening only single connection to database
let connectionIsProgress = false;
let connectionPromise = null;

/**
 * Opens the connection to database and saves the connection in 'db' variable.
 * @returns {Promise} A promise that will be resolved to the database connection if successful
 */
const connect = () => new Promise((resolve, reject) => {
    // Check if another promise is pending.
    if (connectionIsProgress) {
        // Yes there is, just return the previous promise
        return connectionPromise;
    }
    // No there is no promise pending. Let us create a new one
    connectionIsProgress = true; // setting the flag
    connectionPromise = new Promise(() => {
        MongoClient.connect(database.uri, (err, client) => {
            if (err) {
                connectionIsProgress = false; // unsetting the flag
                return reject(err);
            }
            db = client.db(database.database);
            connectionIsProgress = false;// unsetting the flag
            return resolve(db);
            // client.db().collection().findOne()
        });
    });
    return connectionPromise;
});

const addNewProject = project => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    db.collection(database.projectCollection)
        .insertOne(project)
        .then(resolve)
        .catch(reject);
});

const addToUsersProjects = (userID, projectID) => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    const update = {
        $addToSet: { projects: new ObjectId(projectID) },
    };
    db.collection(database.userCollection)
        .updateOne({ _id: new ObjectId(userID) }, update)
        .then(resolve)
        .catch(reject);
});

const addToProjectsContributor = (projectID, contributorID) =>
    new Promise(async (resolve, reject) => {
        if (!db) {
            await connect();
        }
        const update = {
            $addToSet: { contributors: new ObjectId(contributorID) },
        };
        db.collection(database.projectCollection)
            .updateOne({ _id: new ObjectId(projectID) }, update)
            .then(resolve)
            .catch(reject);
    });

const isUserAContributor = (userID, projectID) => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    db.collection(database.userCollection)
        .findOne({
            _id: new ObjectId(userID),
            projects: { $eq: new ObjectId(projectID) },
        })
        .then(resolve)
        .catch(reject);
});

const addNewReport = json => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    db.collection(database.reportCollection)
        .insertOne(json)
        .then(resolve)
        .catch(reject);
});

const getUsersProjects = userID => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    db.collection(database.projectCollection)
        .find({ contributors: new ObjectId(userID) })
        .project({ name: 1, created_by: 1 })
        .toArray()
        .then(resolve)
        .catch(reject);
});


const getUserSuggestions = query => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    db.collection(database.userCollection)
        .find({ email: { $regex: `${query}.*@.*` } })
        .project({ name: 1, email: 1 })
        .toArray()
        .then(resolve)
        .catch(reject);
});

const getProject = projectID => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    db.collection(database.projectCollection)
        .findOne({ _id: new ObjectId(projectID) }, { projection: { reports: 0 } })
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
        .find(find, { projection: { summary: 1 } })
        .sort({ 'meta.submitted_at': -1 })
        .limit(limit)
        .toArray()
        .then(resolve)
        .catch(reject);
});

module.exports = {
    connect,
    addNewProject,
    addToUsersProjects,
    isUserAContributor,
    addNewReport,
    getUsersProjects,
    addToProjectsContributor,
    getUserSuggestions,
    getProject,
    getReportSubmissions,
    getSummaryOfReport,
};

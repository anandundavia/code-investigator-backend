const { ObjectId } = require('mongodb');

const { database } = require('../../../../config/vars');

let db = null;
let connect = null;

exports.configureDatabaseAndConnect = (_db, _connect) => { db = _db; connect = _connect; };

const addNewProject = project => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    db.collection(database.projectCollection)
        .insertOne(project)
        .then(resolve)
        .catch(reject);
});

/* eslint-disable max-len */
const addToProjectsContributor = (projectID, contributorID) => new Promise(async (resolve, reject) => {
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
/* eslint-enable max-len */

const getUsersProjects = userID => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    db.collection(database.projectCollection)
        .find({ contributors: new ObjectId(userID) })
        .sort({ 'meta.submitted_at': 1 })
        .toArray()
        .then(resolve)
        .catch(reject);
});

const getProject = projectID => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    db.collection(database.projectCollection)
        .aggregate([
            { $match: { _id: new ObjectId(projectID) } },
            { $unwind: '$contributors' },
            {
                $lookup: {
                    from: 'user',
                    foreignField: '_id',
                    localField: 'contributors',
                    as: 'contributors',
                },
            },
            { $unwind: '$contributors' },
            {
                $project: {
                    'contributors.salt': 0,
                    'contributors.hash': 0,
                    'contributors.meta': 0,
                    'contributors.projects': 0,
                },
            },
            {
                $group: {
                    _id: '$_id',
                    contributors: { $push: '$contributors' },
                    name: { $first: '$name' },
                    created_by: { $first: '$created_by' },
                    meta: { $first: '$meta' },
                    type: { $first: '$type' },
                },
            },
        ])
        .toArray()
        .then(items => resolve(items[0]))
        .catch(reject);
});

const getShallowProject = projectID => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    const fields = { name: true, created_by: true, type: true };
    db.collection(database.projectCollection)
        .findOne({ _id: new ObjectId(projectID) }, { fields })
        .then(resolve)
        .catch(reject);
});

exports.queries = {
    addNewProject,
    addToProjectsContributor,
    getUsersProjects,
    getProject,
    getShallowProject,
};


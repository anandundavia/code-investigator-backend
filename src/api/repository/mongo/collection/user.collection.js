const { ObjectId } = require('mongodb');

const { database } = require('../../../../config/vars');

let db = null;
let connect = null;

exports.configureDatabaseAndConnect = (_db, _connect) => { db = _db; connect = _connect; };

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

const getUserSuggestions = query => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    let regexToUse = `${query}.*@.*`;
    // The query might involve something like someone@xy
    const containsAtRegex = /.*@.*/;
    if (query.match(containsAtRegex)) {
        regexToUse = `${query}.*`;
    }
    db.collection(database.userCollection)
        .find({ email: { $regex: regexToUse } })
        .project({ name: 1, email: 1 })
        .toArray()
        .then(resolve)
        .catch(reject);
});

const getUserSubmissions = userID => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    db.collection(database.userCollection)
        .aggregate([
            { $match: { _id: new ObjectId(userID) } },
            { $unwind: '$projects' },
            {
                $lookup: {
                    from: 'project',
                    foreignField: '_id',
                    localField: 'projects',
                    as: '_project',
                },
            },
            { $unwind: '$_project' },
            {
                $lookup: {
                    from: 'report',
                    foreignField: 'projectID',
                    localField: 'projects',
                    as: '_report',
                },
            },
            { $unwind: '$_report' },
            {
                $lookup: {
                    from: 'user',
                    foreignField: '_id',
                    localField:
                        '_report.meta.submitted_by',
                    as: '_user',
                },
            },
            { $unwind: '$_user' },
            { $sort: { '_report.meta.submitted_at': -1 } },
            {
                $project: {
                    submitted_at: '$_report.meta.submitted_at',
                    project: '$_project.name',
                    projectID: '$_project._id',
                    user: '$_user.name',
                    userID: '$_user._id',
                    summary: '$_report.summary',
                },
            },
            { $limit: 10 },
        ])
        .toArray()
        .then(resolve)
        .catch(reject);
});

const inviteUserToProject = request => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    // TODO: Validate them
    const { invitedUserID, projectID, invitedBy } = request;
    const invitation = {
        invitedBy: new ObjectId(invitedBy),
        projectID: new ObjectId(projectID),
        meta: {
            invited_at: new Date().getTime(),
        },
        accepted: null,
        responded: false,
    };
    const findQuery = { _id: new ObjectId(invitedUserID) };
    const update = { $addToSet: { invitations: invitation } };
    db.collection(database.userCollection)
        .updateOne(findQuery, update)
        .then(resolve)
        .catch(reject);
});

// We are only going to check if the user is invited in the projectr
// We will not check by whom the user was invited
// This way, we will save the user from receiving duplicate
// invitations for same project from different users
const hasActiveInvitation = (userID, projectID) => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    db.collection(database.userCollection)
        .findOne({
            _id: new ObjectId(userID),
            invitations: {
                $elemMatch: {
                    projectID: new ObjectId(projectID),
                    responded: false,
                },
            },
        })
        .then(resolve)
        .catch(reject);
});

const updateInvitation = request => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    const { userID, accepted, projectID } = request;
    const findQuery = {
        _id: new ObjectId(userID),
        'invitations.projectID': new ObjectId(projectID),
        'invitations.responded': false,
    };
    const update = { $set: { 'invitations.$.accepted': accepted, 'invitations.$.responded': true } };
    db.collection(database.userCollection)
        .updateOne(findQuery, update)
        .then(resolve)
        .catch(reject);
});

const getUserInvitations = userID => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    db.collection(database.userCollection)
        .aggregate([
            { $match: { _id: new ObjectId(userID) } },
            { $unwind: '$invitations' },
            {
                $lookup: {
                    from: 'project',
                    foreignField: '_id',
                    localField: 'invitations.projectID',
                    as: '_project',
                },
            },
            { $unwind: '$_project' },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    invitations: 1,
                    _project: {
                        _id: 1,
                        name: 1,
                    },
                },
            },
            {
                $lookup: {
                    from: 'user',
                    foreignField: '_id',
                    localField: 'invitations.invitedBy',
                    as: '_inviter',
                },
            },
            { $unwind: '$_inviter' },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    invitations: 1,
                    _project: 1,
                    _inviter: {
                        _id: 1,
                        name: 1,
                    },
                },
            }, {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    invitations: 1,
                    _project: 1,
                    _inviter: {
                        _id: 1,
                        name: 1,
                    },
                },
            }, {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    invitations: {
                        inviter: '$_inviter',
                        project: '$_project',
                        meta: 1,
                        responded: 1,
                        accepted: 1,
                    },
                },
            },
            {
                $group: {
                    _id: '$_id',
                    email: { $first: '$email' },
                    name: { $first: '$name' },
                    invitations: { $push: '$invitations' },
                },
            },
        ])
        .toArray()
        .then(resolve)
        .catch(reject);
});

const getShallowUser = userID => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    const fields = { name: true, email: true };
    db.collection(database.userCollection)
        .findOne({ _id: new ObjectId(userID) }, { fields })
        .then(resolve)
        .catch(reject);
});

exports.queries = {
    addToUsersProjects,
    isUserAContributor,
    getUserSuggestions,
    getUserSubmissions,
    inviteUserToProject,
    hasActiveInvitation,
    updateInvitation,
    getUserInvitations,
    getShallowUser,
};

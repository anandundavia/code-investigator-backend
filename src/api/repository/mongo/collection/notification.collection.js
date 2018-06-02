const { ObjectId } = require('mongodb');

const { database } = require('../../../../config/vars');

let db = null;
let connect = null;

exports.configureDatabaseAndConnect = (_db, _connect) => { db = _db; connect = _connect; };

const addNewNotification = notification => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    db.collection(database.notificationCollection)
        .insertOne(notification)
        .then(resolve)
        .catch(reject);
});

const getNotifications = (userID, includeAll) => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    const query = { userID: new ObjectId(userID) };
    if (!includeAll) { query.seen = false; }
    db.collection(database.notificationCollection)
        .find(query)
        .sort({ 'meta.submitted_at': 1 })
        .toArray()
        .then(resolve)
        .catch(reject);
});

const markSeen = notificationIDs => new Promise(async (resolve, reject) => {
    if (!db) {
        await connect();
    }
    const bulkWrites = [];
    /* eslint-disable no-plusplus */
    for (let i = 0; i < notificationIDs.length; i++) {
        bulkWrites[i] = {
            updateOne: {
                filter: { _id: new ObjectId(notificationIDs[i]) },
                update: { $set: { seen: true } },
            },
        };
    }
    /* eslint-enable no-plusplus */
    db.collection(database.notificationCollection)
        .bulkWrite(bulkWrites)
        .then(resolve)
        .catch(reject);
});

exports.queries = {
    addNewNotification,
    getNotifications,
    markSeen,
};

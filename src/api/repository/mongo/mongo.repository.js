const { MongoClient } = require('mongodb');

const projectCollection = require('./collection/project.collection');
const reportCollection = require('./collection/report.collection');
const userCollection = require('./collection/user.collection');
const notificationCollection = require('./collection/notification.collection');

const logger = require('../../utils/logger');
const { database } = require('../../../config/vars');

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
            logger.info('Mongo repository connected');
            db = client.db(database.database);
            connectionIsProgress = false;// unsetting the flag
            return resolve(db);
        });
    });
    return connectionPromise;
});

// Asyncronously open the connection
(async () => {
    await connect();
    projectCollection.configureDatabaseAndConnect(db, connect);
    reportCollection.configureDatabaseAndConnect(db, connect);
    userCollection.configureDatabaseAndConnect(db, connect);
    notificationCollection.configureDatabaseAndConnect(db, connect);
})();


module.exports = {
    ...projectCollection.queries,
    ...reportCollection.queries,
    ...userCollection.queries,
    ...notificationCollection.queries,
};

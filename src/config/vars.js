const path = require('path');

// import .env variables
require('dotenv-safe').load({
    path: path.join(__dirname, '../../.env'),
});

module.exports = {
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    uploads: {
        path: 'uploads',
        incoming: 'report',
        // this is the name of the field which will be there in the object
        // that gets stored in the db.
        // ! DO NOT INCLUDE extensions
        files: ['lint', 'summary', 'quality', 'coverage-final', 'coverage-summary'],
    },
    session: {
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    },
    // TODO: As the number of collections increases,
    //  separate them out in database.collections object
    database: {
        uri: process.env.DB_URI,
        database: process.env.DB_DB_NAME,
        userCollection: process.env.DB_USER_COLLECTION,
        projectCollection: process.env.DB_PROJECT_COLLECTION,
        reportCollection: process.env.DB_REPORT_COLLECTION,
        notificationCollection: process.env.DB_NOTIFICATION_COLLECTION,
    },
    corsOptions: {
        origin: (origin, callback) => {
            const whiteList = [
                '10.29.9.66',
                '10.29.9.48',
                'localhost',
                '172.29.182.243',
                'elasticbeanstalk',
            ];
            if (process.env.NODE_ENV === 'development') {
                whiteList.push('chrome-extension'); // To allow Postman in development
            }
            const index = whiteList.findIndex(anIP => origin.includes(anIP));
            if (!origin || index !== -1) {
                callback(null, true);
            } else {
                callback(new Error(`ORIGIN: '${origin}' Not allowed by CORS`));
            }
        },
        credentials: true,
    },
    notifications: {
        type: {
            invite: 'invite',
        },
    },
    projects: {
        supported: ['angular', 'react'],
    },
};

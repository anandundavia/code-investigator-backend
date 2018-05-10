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
        files: ['report', 'summary'],
    },
    session: {
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    },
    database: {
        uri: process.env.DB_URI,
        database: process.env.DB_DB_NAME,
        userCollection: process.env.DB_USER_COLLECTION,
        projectCollection: process.env.DB_PROJECT_COLLECTION,
    },
    corsOptions: {
        origin: (origin, callback) => {
            const whiteList = [
                '10.29.9.66',
                '10.29.9.48',
                'localhost',
            ];
            const index = whiteList.findIndex(anIP => origin.includes(anIP));
            if (!origin || index !== -1) {
                callback(null, true);
            } else {
                callback(new Error(`ORIGIN: '${origin}' Not allowed by CORS`));
            }
        },
        credentials: true,
    },
};

const Joi = require('joi');

module.exports = {

    // GET /v1/notification/:type
    notification: {
        params: {
            type: Joi.string().only('all', 'unseen').required(),
        },
    },

    // POST /v1/notification/update
    update: {
        body: {
            notificationIDs: Joi.array().items(Joi.string()).required(),
        },
    },

};

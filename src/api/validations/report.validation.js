const Joi = require('joi');

module.exports = {

    // POST /v1/project/upload/:projectID
    upload: {
        params: {
            projectID: Joi.string().required(),
        },
    },

    // POST /v1/report/tslint/:projectID/:period?sort=rule
    tslint: {
        params: {
            projectID: Joi.string().required(),
            period: Joi.string().only('recent', 'all', 'week').required(),
        },
        query: {
            sort: Joi.string().default('rule').only('rule', 'file'),
        },
    },

    // GET /v1/report/tslint/:projectID/summary/:period
    summary: {
        params: {
            projectID: Joi.string().required(),
            period: Joi.string().default('recent').only('recent', 'all', 'week').required(),
        },
    },

};

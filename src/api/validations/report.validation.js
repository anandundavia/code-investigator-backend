const Joi = require('joi');

module.exports = {

    // POST /v1/project/upload/:projectID
    upload: {
        params: {
            projectID: Joi.string().required(),
        },
    },

    // GET /v1/report/summary/:projectID/:period/
    summary: {
        projectID: Joi.string().required(),
        period: Joi.string().only('recent', 'all', 'week').required(),
    },

    // GET /v1/report/lint/:projectID/:period/
    lint: {
        params: {
            projectID: Joi.string().required(),
            period: Joi.string().only('recent', 'all', 'week').required(),
        },
    },

    // GET /v1/report/coverage/:projectID/:period/
    coverage: {
        params: {
            projectID: Joi.string().required(),
            period: Joi.string().only('recent', 'all', 'week').required(),
        },
    },

};

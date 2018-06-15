const Joi = require('joi');

module.exports = {

    // POST /v1/project/upload/:projectID
    upload: {
        params: {
            projectID: Joi.string().required(),
        },
    },

    // GET /v1/report/lint/:projectID/:type/:period/
    lint: {
        params: {
            projectID: Joi.string().required(),
            type: Joi.string().only('summary', 'details').required(),
            period: Joi.string().only('recent', 'all', 'week').required(),
        },
    },

    // GET /v1/report/coverage/:projectID/:type/:period/
    coverage: {
        params: {
            projectID: Joi.string().required(),
            type: Joi.string().only('summary', 'details').required(),
            period: Joi.string().only('recent', 'all', 'week').required(),
        },
    },

};

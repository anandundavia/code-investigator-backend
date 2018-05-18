const Joi = require('joi');

module.exports = {

    // POST /v1/project/register
    register: {
        body: {
            name: Joi.string().required(),
            type: Joi.string().required(),
        },
    },

    // POST /v1/project/contributor
    contributor: {
        body: {
            contributorID: Joi.string().required(),
            projectID: Joi.string().required(),
        },
    },

    // GET /v1/project/:projectID
    project: {
        params: {
            projectID: Joi.string().required(),
        },
    },

    // GET /v1/project/:projectID/submissions
    submissions: {
        params: {
            projectID: Joi.string().required(),
        },
    },
};

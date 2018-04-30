const Joi = require('joi');

module.exports = {
    // POST /v1/report/tslint
    tslint: {
        params: {
            period: Joi.string().only('recent', 'all', 'week').required(),
        },
        query: {
            sort: Joi.string().default('rule').only('rule', 'file'),
        },
    },

};

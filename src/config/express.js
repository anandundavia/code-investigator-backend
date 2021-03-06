const express = require('express');
const compress = require('compression');
const helmet = require('helmet');
const morgan = require('morgan');
const expressSession = require('express-session');
const cookieParser = require('cookie-parser');
const { config } = require('usermanagement');

const { logs, session } = require('./vars');
/* eslint-disable-next-line no-unused-vars */
const updatedConfig = require('./users')(config);
const routes = require('../api/routes/v1');
const error = require('../api/middlewares/error');

/**
* Express instance
* @public
*/
const app = express();

// request logging. dev: console | production: file
app.use(morgan(logs));

// parse body params and attache them to req.body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// gzip compression
app.use(compress());

// secure apps by setting various HTTP headers
app.use(helmet());

app.use(cookieParser());
app.use(expressSession(session));

app.use(config.passport.initialize());
app.use(config.passport.session());



// mount api v1 routes
app.use('/v1', routes);

// if error is not an instanceOf APIError, convert it.
app.use(error.converter);

// catch 404 and forward to error handler
app.use(error.notFound);

// error handler, send stacktrace only during development
app.use(error.handler);

module.exports = app;

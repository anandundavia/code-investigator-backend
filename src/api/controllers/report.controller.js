const httpStatus = require('http-status');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const tar = require('tar-stream');
const { ObjectId } = require('mongodb');

const logger = require('../utils/logger');
const { handler: errorHandler } = require('../middlewares/error');
const multer = require('../../config/multer');
const { uploads } = require('../../config/vars');
const {
    isUserAContributor,
    addNewReport,
    getSummaryOfReport,
    getLintDetailsOfReport,
    getCoverageDetailsOfReport,
} = require('../repository');


const unlink = file => new Promise((resolve) => {
    fs.unlink(file.path, (err) => {
        if (err) {
            logger.error(`Failed to delete '${path.basename(file.path)}'. ${JSON.stringify(err)}`);
        } else {
            logger.info(`Deleted '${path.basename(file.path)}'.`);
        }
        resolve();
    });
});

const decompress = file => new Promise((resolve, reject) => {
    const stream = fs.createReadStream(file.path);
    const unzip = zlib.createGunzip();
    stream.pipe(unzip);
    unzip.on('finish', () => { resolve(unzip); });
    unzip.on('error', (err) => { reject(err); });
});

const extract = tarball => new Promise((resolve, reject) => {
    const ext = tar.extract();
    const output = {};
    ext.on('finish', () => { resolve(output); });
    ext.on('error', (err) => { reject(err); });
    ext.on('entry', (header, stream, next) => {
        let x = '';
        stream.on('end', next);
        stream.on('data', (chunk) => { x += chunk; });
        stream.on('finish', () => {
            const filtered = uploads.files
                .filter(aName => path.basename(header.name, '.json') === aName.toLowerCase());
            if (filtered.length > 0) {
                const file = filtered[0];
                output[file] = JSON.parse(x);
            } else {
                logger.warn(`Tarball contains ${header.name} file which is not supported.`);
            }
        });
    });
    tarball.pipe(ext);
});

/**
 * Upload a report
 * @public
 */
exports.upload = async (req, res, next) => {
    try {
        const { projectID } = req.params;
        const isUserAllowed = await isUserAContributor(req.user._id, projectID);
        if (isUserAllowed) {
            const file = await multer(req, res);
            const tarball = await decompress(file);
            const extracted = await extract(tarball);
            const report = {
                projectID: new ObjectId(projectID),
                meta: {
                    submitted_by: new ObjectId(req.user._id),
                    submitted_at: new Date().getTime(),
                },
                ...extracted,
            };
            await addNewReport(report);
            res.status(httpStatus.OK).json({ message: 'UPLOADED' });
            return unlink(file);
        }
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'NOT A CONTRIBUTOR',
        });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

/**
 * Returns the summary of reports according to the params
 * @public
 */
exports.summary = async (req, res, next) => {
    try {
        const { projectID, period } = req.params;
        const isUserAllowed = await isUserAContributor(req.user._id, projectID);
        if (isUserAllowed) {
            const summaryToSend = await getSummaryOfReport(projectID, period);
            return res.status(httpStatus.OK).json(summaryToSend);
        }
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'NOT A CONTRIBUTOR',
        });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};


/**
 * Returns the lint reports (or parts of it) according to the params and query
 * @public
 */
exports.lint = async (req, res, next) => {
    try {
        const { projectID, period } = req.params;
        const isUserAllowed = await isUserAContributor(req.user._id, projectID);
        if (isUserAllowed) {
            const detailsToSend = await getLintDetailsOfReport(projectID, period);
            return res.status(httpStatus.OK).json(detailsToSend);
        }
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'NOT A CONTRIBUTOR',
        });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

/**
 * Returns the coverage reports (or parts of it) according to the params and query
 * @public
 */
exports.coverage = async (req, res, next) => {
    try {
        const { projectID, period } = req.params;
        const isUserAllowed = await isUserAContributor(req.user._id, projectID);
        if (isUserAllowed) {
            const detailsToSend = await getCoverageDetailsOfReport(projectID, period);
            return res.status(httpStatus.OK).json(detailsToSend);
        }
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'NOT A CONTRIBUTOR',
        });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

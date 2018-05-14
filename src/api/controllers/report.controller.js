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
} = require('../repository/mongo.repository');


// TODO: Finish this controller
// const getReportByRule = (user, period) => {
// };

// const getReportByFile = (user, period) => {
// };


/**
 * Upload a report
 * @public
 */
exports.tslint = (req, res, next) => {
    try {
        if (req.user) {
            // const { period } = req.params;
            const { sort } = req.query;

            // switch (sort) {
            //     case 'rule':
            //         getReportByRule(req.user, period);
            //         break;
            //     case 'file':
            //         getReportByFile(req.user, period);
            //         break;
            //     default:
            //         return res.status(httpStatus.BAD_REQUEST).send({ message: `sort type '${sort}' is not implemented yet` });
            // }
            return res.status(httpStatus.BAD_REQUEST).send({ message: `sort type '${sort}' is not implemented yet` });
        }
        return res.status(httpStatus.UNAUTHORIZED).json({ message: 'UNAUTHORIZED' });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};


/**
 * Upload a report
 * @public
 */
exports.summary = async (req, res, next) => {
    try {
        if (req.user) {
            const { projectID, period } = req.params;
            const isUserAllowed = await isUserAContributor(req.user._id, projectID);
            if (isUserAllowed) {
                const summary = await getSummaryOfReport(projectID, period);
                return res.status(httpStatus.OK).json(summary);
            }
            return res.status(httpStatus.BAD_REQUEST).json({
                message: 'NOT A CONTRIBUTOR',
            });
        }
        return res.status(httpStatus.UNAUTHORIZED).json({ message: 'UNAUTHORIZED' });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};


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
                .filter(aName => header.name.includes(aName.toLowerCase()));
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
                report: extracted.report,
                summary: extracted.summary,
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

const httpStatus = require('http-status');
const zlib = require('zlib');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const path = require('path');
const tar = require('tar-stream');

const logger = require('../utils/logger');
const multer = require('../../config/multer');
const { uploads } = require('../../config/vars');
const {
    addNewProject,
    addToUsersProjects,
    isUserAContributor,
    addReportToProject,
    addToProjectsContributor,
} = require('../repository/mongo.repository');
const { handler: errorHandler } = require('../middlewares/error');

/**
 * Register a project
 * @public
 */
exports.register = async (req, res, next) => {
    try {
        const project = {
            name: req.body.name,
            created_by: new ObjectId(req.user._id),
            contributors: [new ObjectId(req.user._id)],
            meta: {
                created_at: new Date().getTime(),
                updated_at: 0,
            },
        };
        await addNewProject(project);
        // When the project is added successfully,
        // It will have _id field in the object
        await addToUsersProjects(req.user._id, project._id);
        return res.status(httpStatus.OK).json({ message: 'REGISTERED', project });
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
                meta: {
                    submitted_by: req.user._id,
                    submitted_at: new Date().getTime(),
                },
                report: extracted.report,
                summary: extracted.summary,
            };
            await addReportToProject(projectID, report);
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
 * Upload a report
 * @public
 */
exports.contributor = async (req, res, next) => {
    try {
        const { contributorID } = req.body;
        const { projectID } = req.body;
        const isUserAllowed = await isUserAContributor(req.user._id, projectID);
        if (isUserAllowed) {
            await addToUsersProjects(contributorID, projectID);
            await addToProjectsContributor(projectID, contributorID);
            return res.status(httpStatus.OK).json({
                message: 'SUCCESS',
            });
        }
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'NOT A CONTRIBUTOR',
        });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

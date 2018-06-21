const httpStatus = require('http-status');
const { ObjectId } = require('mongodb');
const tmp = require('tmp');
const { writeFile } = require('fs');

const {
    addNewProject,
    addToUsersProjects,
    isUserAContributor,
    addToProjectsContributor,
    getProject,
    getReportSubmissions,
} = require('../repository');
const { handler: errorHandler } = require('../middlewares/error');
const { projects } = require('../../config/vars');
const logger = require('../utils/logger');

exports.supported = async (req, res, next) => {
    try {
        return res.status(httpStatus.OK).json(projects.supported);
    } catch (error) {
        return errorHandler(error, req, res);
    }
};


/**
 * Register a project
 * @public
 */
exports.register = async (req, res, next) => {
    try {
        const project = {
            ...req.body,
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


/**
 * Upload a report
 * @public
 */
exports.contributor = async (req, res, next) => {
    try {
        const { contributorID, projectID } = req.body;
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


/**
 * Returns the information about a project
 * @public
 */
exports.project = async (req, res, next) => {
    try {
        const { projectID } = req.params;
        const isUserAllowed = await isUserAContributor(req.user._id, projectID);
        if (isUserAllowed) {
            const project = await getProject(projectID);
            return res.status(httpStatus.OK).json(project);
        }
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'NOT A CONTRIBUTOR',
        });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};


/**
 * Returns the list of submissions summary of reports for a project
 * @public
 */
exports.submissions = async (req, res, next) => {
    try {
        const { projectID } = req.params;
        const isUserAllowed = await isUserAContributor(req.user._id, projectID);
        if (isUserAllowed) {
            const submissions = await getReportSubmissions(projectID);
            return res.status(httpStatus.OK).json(submissions);
        }
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'NOT A CONTRIBUTOR',
        });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

/**
 * Sends the config file to the client
 * @public
 */
exports.downloadConfig = async (req, res, next) => {
    try {
        const { projectID } = req.params;
        const isUserAllowed = await isUserAContributor(req.user._id, projectID);
        if (isUserAllowed) {
            const project = await getProject(projectID);
            delete project.contributors;
            project.meta.config_created_at = new Date().getTime();

            return tmp.file((err, path, fd, cleanupCallback) => {
                if (err) {
                    logger.error('Error while generating temp file');
                    logger.err(err);
                    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                        message: 'SOMETHING WENT WRONG. RE-TRY',
                    });
                }
                return writeFile(path, JSON.stringify(project), (error) => {
                    if (error) {
                        logger.error('Error while writing to temp file');
                        logger.err(error);
                        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
                            message: 'SOMETHING WENT WRONG. RE-TRY',
                        });
                    }
                    return res.download(path, '.config', (resError) => {
                        if (resError) {
                            logger.error('Error while sending the temp file');
                            logger.err(resError);
                        }
                        cleanupCallback();
                    });
                });
            });
        }
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'NOT A CONTRIBUTOR',
        });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

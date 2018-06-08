const httpStatus = require('http-status');
const { ObjectId } = require('mongodb');

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

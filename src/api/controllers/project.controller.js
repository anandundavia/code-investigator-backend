const httpStatus = require('http-status');
const { ObjectId } = require('mongodb');

const {
    addNewProject,
    addToUsersProjects,
    isUserAContributor,
    addToProjectsContributor,
    getProject,
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


/**
 * Returns the information about a project
 * @public
 */
exports.project = async (req, res, next) => {
    try {
        const { projectID } = req.params;
        console.log("projectid", projectID);
        // const isUserAllowed = await isUserAContributor(req.user._id, projectID);
        // if (isUserAllowed) {
            const project = await getProject(projectID);
            return res.status(httpStatus.OK).json(project);
        // }
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'NOT A CONTRIBUTOR',
        });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

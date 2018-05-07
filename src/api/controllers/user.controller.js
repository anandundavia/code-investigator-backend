const httpStatus = require('http-status');

const {
    getUsersProjects,
    getUserSuggestions,
} = require('../repository/mongo.repository');
const { handler: errorHandler } = require('../middlewares/error');

/**
 * Called AFTER the successful login of the user
 */
exports.login = (req, res, next) => {
    const user = Object.assign({}, req.user);
    // TODO: Might want to remove some fields off the user.
    delete user.projects;
    res.json(user);
};

/**
 * Used to clears session and req.user object using passport's req.logout()
 */
exports.logout = (req, res, next) => {
    // Passport adds a method logout to the req object.
    // Which will clear session as well as req.user object
    req.logout();
    res.status(httpStatus.OK).json({ message: 'LOGGED_OUT' });
};

/**
 * Gets the list of the projects of user
 * @public
 */
exports.project = async (req, res, next) => {
    try {
        const projects = await getUsersProjects(req.user._id);
        return res.status(httpStatus.OK).json(projects);
    } catch (error) {
        return errorHandler(error, req, res);
    }
};


/**
 * Gets the suggestions list for given email
 * @public
 */
exports.suggestions = async (req, res, next) => {
    try {
        const { query } = req.params;
        const suggestions = await getUserSuggestions(query);
        return res.status(httpStatus.OK).json({ suggestions });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

/**
 * Gets the basic information of user
 * Email ID, Name, ID
 * @public
 */
exports.me = (req, res, next) => {
    try {
        const user = Object.assign({}, req.user);
        delete user.projects;
        return res.status(httpStatus.OK).json(user);
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

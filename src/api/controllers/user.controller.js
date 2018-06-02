const httpStatus = require('http-status');


const {
    getUsersProjects,
    getUserSuggestions,
    getUserSubmissions,
    isUserAContributor,
    inviteUserToProject,
    hasActiveInvitation,
    updateInvitation,
    addToProjectsContributor,
    addToUsersProjects,
    getUserInvitations,
} = require('../repository');
const Notification = require('../utils/notification');
const { handler: errorHandler } = require('../middlewares/error');

/**
 * Called AFTER the successful login of the user
 */
exports.login = (req, res, next) => {
    const user = Object.assign({}, req.user);
    // TODO: Might want to remove some fields off the user.
    delete user.projects;
    delete user.invitations;
    res.status(httpStatus.OK).json(user);
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
        delete user.invitations;
        return res.status(httpStatus.OK).json(user);
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

/**
 * Gets the basic summary for user
 * Containing the recent submits in the projects he is related to
 * @public
 */
exports.submissions = async (req, res, next) => {
    try {
        const user = Object.assign({}, req.user);
        const submissions = await getUserSubmissions(user._id);
        return res.status(httpStatus.OK).json(submissions);
    } catch (error) {
        return errorHandler(error, req, res);
    }
};


/**
 * Invites the user to the project
 * @public
 */
exports.sendInvite = async (req, res, next) => {
    try {
        const user = Object.assign({}, req.user);
        const { projectID, invitedUserID } = req.body;
        // Only contributors of the project can send invitation to other
        // users
        const isUserAllowed = await isUserAContributor(user._id, projectID);
        if (isUserAllowed) {
            // Check if the invited user is already there in the contributors list!
            // You can not invite a collaborator
            const isInvitedUserAContributor = await isUserAContributor(invitedUserID, projectID);
            if (!isInvitedUserAContributor) {
                // If user has a pending invitation, you can not invite the user
                // If user has responded to the invitation, he/she can be re-invited
                const shouldInvite = await hasActiveInvitation(invitedUserID, projectID);
                if (!shouldInvite) {
                    const invitation = {
                        invitedUserID,
                        projectID,
                        invitedBy: user._id,
                    };
                    await inviteUserToProject(invitation);
                    Notification.createInvitationNotification(invitation);
                    return res.status(httpStatus.OK).json({ message: 'INVITATION SENT' });
                }
                return res.status(httpStatus.BAD_REQUEST).json({
                    message: 'ALREADY INVITED',
                });
            }
            return res.status(httpStatus.BAD_REQUEST).json({
                message: 'ALREADY A CONTRIBUTOR',
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
 * Gets the basic summary for user
 * Containing the recent submits in the projects he is related to
 * @public
 */
exports.updateInvite = async (req, res, next) => {
    try {
        const user = Object.assign({}, req.user);
        const { accepted, projectID } = req.body;
        const isInvited = await hasActiveInvitation(user._id, projectID);
        if (isInvited) {
            const invitation = {
                userID: user._id,
                accepted,
                projectID,
            };
            await updateInvitation(invitation);
            await Notification.updateInvitationNotification(invitation);
            if (accepted) {
                await addToUsersProjects(user._id, projectID);
                await addToProjectsContributor(projectID, user._id);
            }
            return res.status(httpStatus.OK).json({ message: 'RESPONDED' });
        }
        return res.status(httpStatus.BAD_REQUEST).json({
            message: 'NOT INVITED / ALREADY RESPONDED',
        });
    } catch (error) {
        return errorHandler(error, req, res);
    }
};


/**
 * Gets the basic summary for user
 * Containing the recent submits in the projects he is related to
 * @public
 */
exports.getInvite = async (req, res, next) => {
    try {
        const user = Object.assign({}, req.user);
        const invitations = await getUserInvitations(user._id);
        return res.status(httpStatus.OK).json(invitations);
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

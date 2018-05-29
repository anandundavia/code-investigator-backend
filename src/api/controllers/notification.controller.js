const httpStatus = require('http-status');

// const Notification = require('../utils/notification');
const { getNotifications } = require('../repository');
const { handler: errorHandler } = require('../middlewares/error');

/**
 * Gets the notification for the logged in user
 * @public
 */
exports.getNotifications = async (req, res, next) => {
    try {
        const user = Object.assign({}, req.user);
        const { type } = req.params;
        // Types can either be unseen or all
        // If type is not unseen, send all notifications anyways
        const notifications = await getNotifications(user._id, type !== 'unseen');
        return res.status(httpStatus.OK).json(notifications);
    } catch (error) {
        return errorHandler(error, req, res);
    }
};

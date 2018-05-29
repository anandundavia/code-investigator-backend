const { ObjectId } = require('mongodb');

const logger = require('../utils/logger');
const { addNewNotification, getShallowProject, getShallowUser } = require('../repository');
const { notifications } = require('../../config/vars');

class Notification {
    constructor(_userID, _type) {
        this.userID = new ObjectId(_userID);
        this.seen = false;
        this.type = _type;
        this.details = {};
    }

    setDetails(details) {
        this.details = Object.assign({}, details);
    }

    toJSON() {
        return Object.assign({}, this);
    }

    async save() {
        try {
            await addNewNotification(this.toJSON());
        } catch (e) {
            logger.error('Error while adding a new notificaiton');
            logger.error(JSON.stringify(e));
        }
    }

    static async createInvitationNotification(invitation) {
        const { invitedUserID, projectID, invitedBy } = invitation;
        const notification = new Notification(invitedUserID, notifications.type.invite);
        const project = await getShallowProject(projectID);
        const inviter = await getShallowUser(invitedBy);
        notification.setDetails({ project, inviter });
        notification.save();
    }
}
module.exports = Notification;

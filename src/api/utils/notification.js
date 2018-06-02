const { ObjectId } = require('mongodb');

const logger = require('../utils/logger');
const { notifications } = require('../../config/vars');

const {
    addNewNotification,
    getShallowProject,
    getShallowUser,
    updateInvitationNotification,
} = require('../repository');

class Notification {
    constructor(_userID, _type) {
        this.userID = new ObjectId(_userID);
        this.seen = false;
        this.type = _type;
        this.meta = {
            created_at: new Date().getTime(),
        };
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
            logger.error('Error while adding a new notification');
            logger.error(JSON.stringify(e));
        }
    }

    static async createInvitationNotification(invitation) {
        const { invitedUserID, projectID, invitedBy } = invitation;
        const notification = new Notification(invitedUserID, notifications.type.invite);
        const project = await getShallowProject(projectID);
        const inviter = await getShallowUser(invitedBy);
        const details = {
            project,
            inviter,
            accepted: null,
            responded: false,
        };
        notification.setDetails(details);
        notification.save();
    }

    static async updateInvitationNotification(invitation) {
        // Invitation will have userID, projectID, accepted: true/false
        // const { userID, projectID, accepted } = invitation;
        await updateInvitationNotification(invitation);
    }
}
module.exports = Notification;

const express = require('express');
const validate = require('express-validation');

const { update, notification } = require('../../validations/notification.validation');
const authenticated = require('../../middlewares/authenticated');
const controller = require('../../controllers/notification.controller');

const router = express.Router();

router.route('/:type')
    .get(authenticated, validate(notification), controller.getNotifications);

router.route('/update')
    .post(authenticated, validate(update), controller.updateNotifications);

module.exports = router;

const express = require('express');

const authenticated = require('../../middlewares/authenticated');
const controller = require('../../controllers/notification.controller');

const router = express.Router();

router.route('/:type')
    .get(authenticated, controller.getNotifications);

// router.route('/update')
//     .post(authenticated, controller.updateNotifications);

module.exports = router;

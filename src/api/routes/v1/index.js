const express = require('express');

const projectRoutes = require('./project.route');
const userRoutes = require('./user.route');
const reportRoutes = require('./report.route');
const notificationRoutes = require('./notification.route');

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));


router.use('/project', projectRoutes);
router.use('/user', userRoutes);
router.use('/report', reportRoutes);
router.use('/notification', notificationRoutes);

module.exports = router;

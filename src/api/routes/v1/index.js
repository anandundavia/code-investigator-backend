const express = require('express');
const projectRoutes = require('./project.route');
const userRoutes = require('./user.route');
const reportRoutes = require('./report.route');

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));


router.use('/project', projectRoutes);
router.use('/user', userRoutes);
router.use('/report', reportRoutes);

module.exports = router;

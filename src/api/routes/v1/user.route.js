const express = require('express');
const { routes } = require('manage-users');

const controller = require('../../controllers/user.controller');

const router = express.Router();

router
    .route('/signup')
    .post(routes.signup());

router
    .route('/login')
    .post(routes.login(), controller.login);

router.route('/logout')
    .all(controller.logout);

router.route('/project')
    .get(controller.project);


module.exports = router;

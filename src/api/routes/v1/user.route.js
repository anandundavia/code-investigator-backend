const express = require('express');
const validate = require('express-validation');
const { routes } = require('manage-users');

const {
    suggestions,
    signup,
    sendInvite,
    updateInvite,
} = require('../../validations/user.validation');
const controller = require('../../controllers/user.controller');
const authenticated = require('../../middlewares/authenticated');

const router = express.Router();

router.route('/signup')
    .post(validate(signup), routes.signup());

router.route('/login')
    .post(routes.login(), controller.login);

router.route('/password')
    .post(authenticated, routes.changePassword(), controller.changePassword);

router.route('/logout')
    .all(controller.logout);

router.route('/project')
    .get(authenticated, controller.project);

router.route('/suggestions/:query')
    .get(authenticated, validate(suggestions), controller.suggestions);

router.route('/me')
    .get(authenticated, controller.me);

router.route('/me/submissions')
    .get(authenticated, controller.submissions);

router.route('/invite')
    .get(authenticated, controller.getInvite)
    .post(authenticated, validate(sendInvite), controller.sendInvite);

router.route('/invite/respond')
    .post(authenticated, validate(updateInvite), controller.updateInvite);

module.exports = router;

const express = require('express');
const validate = require('express-validation');

const authenticated = require('../../middlewares/authenticated');
const controller = require('../../controllers/project.controller');
const {
    register,
    // contributor,
    project,
    submissions,
} = require('../../validations/project.validation');

const router = express.Router();

router.route('/supported')
    .get(controller.supported);

router
    .route('/register')
    .post(validate(register), authenticated, controller.register);

router
    .route('/:projectID')
    .get(validate(project), authenticated, controller.project);

router
    .route('/:projectID/submissions')
    .get(validate(submissions), authenticated, controller.submissions);

module.exports = router;

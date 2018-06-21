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
    .post(authenticated, validate(register), controller.register);

router
    .route('/:projectID')
    .get(authenticated, validate(project), controller.project);

router
    .route('/:projectID/config')
    .get(authenticated, validate(project), controller.downloadConfig);

router
    .route('/:projectID/submissions')
    .get(authenticated, validate(submissions), controller.submissions);

module.exports = router;

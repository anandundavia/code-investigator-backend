const express = require('express');
const validate = require('express-validation');

const controller = require('../../controllers/project.controller');
const { upload, register, contributor } = require('../../validations/project.validation');
const authenticated = require('../../middlewares/authenticated');

const router = express.Router();

router
    .route('/upload/:projectID')
    .post(validate(upload), authenticated, controller.upload);

router
    .route('/register')
    .post(validate(register), authenticated, controller.register);

router
    .route('/contributor')
    .post(validate(contributor), authenticated, controller.contributor);

module.exports = router;

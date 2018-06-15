const express = require('express');
const validate = require('express-validation');

const controller = require('../../controllers/report.controller');
const { upload, lint, coverage } = require('../../validations/report.validation');
const authenticated = require('../../middlewares/authenticated');

const router = express.Router();

router
    .route('/upload/:projectID')
    .post(authenticated, validate(upload), controller.upload);

router
    .route('/lint/:projectID/:type/:period')
    .get(authenticated, validate(lint), controller.lint);

router
    .route('/coverage/:projectID/:type/:period')
    .get(authenticated, validate(coverage), controller.coverage);


module.exports = router;

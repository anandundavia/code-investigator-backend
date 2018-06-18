const express = require('express');
const validate = require('express-validation');

const controller = require('../../controllers/report.controller');
const authenticated = require('../../middlewares/authenticated');
const {
    summary,
    upload,
    lint,
    coverage,
} = require('../../validations/report.validation');


const router = express.Router();

router
    .route('/upload/:projectID')
    .post(authenticated, validate(upload), controller.upload);

router
    .route('/summary/:projectID/:period')
    .get(authenticated, validate(summary), controller.summary);

router
    .route('/lint/:projectID/:period')
    .get(authenticated, validate(lint), controller.lint);

router
    .route('/coverage/:projectID/:period')
    .get(authenticated, validate(coverage), controller.coverage);


module.exports = router;

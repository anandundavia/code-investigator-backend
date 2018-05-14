const express = require('express');
const validate = require('express-validation');

const controller = require('../../controllers/report.controller');
const { tslint, upload } = require('../../validations/report.validation');
const authenticated = require('../../middlewares/authenticated');

const router = express.Router();

router
    .route('/upload/:projectID')
    .post(validate(upload), authenticated, controller.upload);

router
    .route('/tslint/:projectID/:period')
    .get(validate(tslint), controller.tslint);

module.exports = router;

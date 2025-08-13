const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/teaching-history.controller");

router.get('/', controller.index);
router.get('/export', controller.export);
router.get('/:id', controller.detail);

module.exports = router;



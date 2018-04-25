var express = require('express');
var router = express.Router();
var db = require('../queries/session');

router.get('/:id', db.getCurrentUser);
router.post('/', db.login);
router.delete('/:id', db.logout);

module.exports = router;

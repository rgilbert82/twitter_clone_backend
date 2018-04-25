var express = require('express');
var router = express.Router();
var db = require('../queries/search');

router.get('/:search_field', db.getSearchResults);

module.exports = router;

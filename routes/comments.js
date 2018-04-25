var express = require('express');
var router = express.Router();
var db = require('../queries/comment');

router.post('/', db.createComment);
router.put('/:id', db.updateComment);
router.delete('/:id', db.deleteComment);

module.exports = router;

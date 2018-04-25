var express = require('express');
var router = express.Router();
var db = require('../queries/user');

router.get('/', db.getAllUsers);
router.get('/:slug', db.getUser);
router.get('/:id/tweets', db.getUserTweets);
router.post('/', db.createUser);
router.put('/:id', db.updateUser);
router.delete('/:id', db.deleteUser);

module.exports = router;

var express = require('express');
var router = express.Router();
var db = require('../queries/tweet');

router.get('/:slug', db.getTweet);
router.get('/:id/comments', db.getTweetComments);
router.post('/', db.createTweet);
router.post('/:id/retweet', db.createRetweet);
router.put('/:id', db.updateTweet);
router.delete('/:id', db.deleteTweet);
router.delete('/:id/retweet', db.deleteRetweet);

module.exports = router;

var express = require('express');
var router = express.Router();
var db = require('../queries/follow');

router.get('/:user_id/followers', db.getAllFollowers);
router.get('/:user_id/followings', db.getAllFollowings);
router.get('/:user_id', db.getFollow);
router.post('/', db.createFollow);
router.delete('/:user_id', db.deleteFollow);

module.exports = router;

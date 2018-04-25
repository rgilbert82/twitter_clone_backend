var db = require('../database.js');
var async = require('async');

//=============================================================================
// QUERIES
//=============================================================================

function getAllFollowers(req, res, next) {
  var user_id = req.params.user_id;
  var sql = 'SELECT users.id, users.name, users.username, users.slug FROM users ' +
            'INNER JOIN users_followers ON users_followers.follower_id = users.id ' +
            'WHERE users_followers.user_id = $1;';

  db.any(sql, [user_id])
    .then(function(data) {
      res.status(200)
        .json(data);
    }).catch(function(err) {
      return next(err);
    });
}

//=============================================================================

function getAllFollowings(req, res, next) {
  var user_id = req.params.user_id;
  var sql = 'SELECT users.id, users.name, users.username, users.slug FROM users ' +
            'INNER JOIN users_followers ON users_followers.user_id = users.id ' +
            'WHERE users_followers.follower_id = $1;';

  db.any(sql, [user_id])
    .then(function(data) {
      res.status(200)
        .json(data);
    }).catch(function(err) {
      return next(err);
    });
}

//=============================================================================

function getFollow(req, res, next) {
  var cookie = req.headers.authorization;
  var token = cookie ? cookie.replace('token=', '') : '';
  var user_id = req.params.user_id;

  async.waterfall([
    // Verify User
    function(callback) {
      var sql = 'SELECT * FROM users WHERE token = $1;';
      db.one(sql, [token])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    },
    // Then fetch the follow
    function(follower, callback) {
      var sql = 'SELECT * FROM users_followers WHERE user_id = $1 AND follower_id = $2;';
      db.any(sql, [user_id, follower.id])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    }
  ],
  function(err, results) {
    if (err) {
      return next(err);
    } else {
      res.status(200)
        .json(results);
    }
  });
}

//=============================================================================

function createFollow(req, res, next) {
  var cookie = req.headers.authorization;
  var token = cookie ? cookie.replace('token=', '') : '';
  var user_id = req.body.user_id;

  async.waterfall([
    // Verify User
    function(callback) {
      var sql = 'SELECT * FROM users WHERE token = $1;';
      db.one(sql, [token])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    },
    // Then create the follow
    function(follower, callback) {
      var sql = 'INSERT INTO users_followers (user_id, follower_id) VALUES ($1, $2) returning *;';
      db.one(sql, [user_id, follower.id])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    }
  ],
  function(err, results) {
    if (err) {
      return next(err);
    } else {
      res.status(200)
        .json(results);
    }
  });
}

//=============================================================================

function deleteFollow(req, res, next) {
  var cookie = req.headers.authorization;
  var token = cookie ? cookie.replace('token=', '') : '';
  var following_id = req.params.user_id;

  async.waterfall([
    // Verify User and follow
    function(callback) {
      var sql = 'SELECT * FROM users WHERE token = $1;';
      db.one(sql, [token])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    },
    // Then delete the follow
    function(follower, callback) {
      var sql = 'DELETE FROM users_followers WHERE user_id = $1 AND follower_id = $2;';
      db.result(sql, [following_id, follower.id])
        .then(function(data) {
          callback(null, { status: 'success', message: 'follow deleted' });
        }).catch(function(err) {
          callback(err, null);
        });
    }
  ],
  function(err, results) {
    if (err) {
      return next(err);
    } else {
      res.status(200)
        .json(results);
    }
  });
}

//=============================================================================
// EXPORTS
//=============================================================================

module.exports = {
  getAllFollowers: getAllFollowers,
  getAllFollowings: getAllFollowings,
  getFollow: getFollow,
  createFollow: createFollow,
  deleteFollow: deleteFollow
}

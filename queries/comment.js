var db = require('../database.js');
var async = require('async');

//=============================================================================
// QUERIES
//=============================================================================

function createComment(req, res, next) {
  var body = req.body.body.trim();
  var user_id = req.body.user_id;
  var tweet_id = req.body.tweet_id;
  var cookie = req.headers.authorization;
  var token = cookie ? cookie.replace('token=', '') : '';

  async.waterfall([
    // Verify User
    function(callback) {
      var sql = 'SELECT * FROM users WHERE id = $1 AND token = $2;';
      db.one(sql, [user_id, token])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    },
    // Then create the comment
    function(user, callback) {
      var sql = 'INSERT INTO comments (body, user_id, tweet_id) VALUES ($1, $2, $3) returning *;'
      db.one(sql, [body, user.id, tweet_id])
        .then(function(data) {
          data.name = user.name;
          data.username = user.username;
          data.slug = user.slug;
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

function updateComment(req, res, next) {
  var commentID = req.params.id;
  var body = req.body.body.trim();
  var cookie = req.headers.authorization;
  var token = cookie ? cookie.replace('token=', '') : '';

  async.waterfall([
    // Verify User
    function(callback) {
      var sql = 'SELECT comments.* FROM comments ' +
                'INNER JOIN users ON users.id = comments.user_id ' +
                'WHERE comments.id = $1 AND users.token = $2;';
      db.one(sql, [commentID, token])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    },
    // Then update the comment
    function(comment, callback) {
      var sql = 'UPDATE comments SET body = $2 WHERE id = $1 returning *;';
      db.one(sql, [comment.id, body])
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

function deleteComment(req, res, next) {
  var commentID = req.params.id;
  var cookie = req.headers.authorization;
  var token = cookie ? cookie.replace('token=', '') : '';

  async.waterfall([
    // Verify User
    function(callback) {
      var sql = 'SELECT comments.* FROM comments ' +
                'INNER JOIN users ON users.id = comments.user_id ' +
                'WHERE comments.id = $1 AND users.token = $2;';
      db.one(sql, [commentID, token])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    },
    // Then delete the comment
    function(comment, callback) {
      var sql = 'DELETE FROM comments WHERE id = $1;';
      db.result(sql, [comment.id])
        .then(function(data) {
          callback(null, { status: 'success', message: 'deleted comment' });
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
  createComment: createComment,
  updateComment: updateComment,
  deleteComment: deleteComment
}

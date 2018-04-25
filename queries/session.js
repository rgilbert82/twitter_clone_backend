var db = require('../database.js');
var bcrypt = require('bcrypt');
var randomString = require('../helpers/randomString.js');
var async = require('async');

//=============================================================================
// QUERIES
//=============================================================================

function getCurrentUser(req, res, next) {
  var cookie = req.headers.authorization;
  var token = cookie ? cookie.replace('token=', '') : '';

  async.waterfall([
    // Verify user
    function(callback) {
      var sql = 'SELECT users.id, users.name, users.username, users.slug, users.token ' +
                'FROM users WHERE users.token = $1;';
      db.one(sql, [token])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    },
    // Get followers/following count
    function(user, callback) {
      var sql = 'SELECT COUNT(users_followers.follower_id) AS following, ' +
                '(' +
                  'SELECT COUNT(users_followers.user_id) AS followers ' +
                  'FROM users_followers ' +
                  'WHERE users_followers.user_id = $1' +
                ') ' +
                'FROM users_followers ' +
                'WHERE users_followers.follower_id = $1;';
      db.one(sql, [user.id])
        .then(function(data) {
          user.following = data.following;
          user.followers = data.followers;
          callback(null, user);
        }).catch(function(err) {
          callback(err, null);
        });
    },
    // Get tweets count
    function(user, callback) {
      var sql = 'SELECT COUNT(tweets.id) AS tweet_count, ' +
                '(' +
                  'SELECT COUNT(retweets.id) AS retweet_count ' +
                  'FROM retweets ' +
                  'WHERE retweets.user_id = $1' +
                ') ' +
                'FROM tweets ' +
                'WHERE tweets.user_id = $1;';
      db.one(sql, [user.id])
        .then(function(data) {
          user.tweet_count = data.tweet_count;
          user.retweet_count = data.retweet_count;
          callback(null, user);
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

function login(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  var sql = 'SELECT * FROM users WHERE username = $1;';

  db.one(sql, [username])
    .then(function(data) {
      if (bcrypt.compareSync(password, data.password)) {
        res.status(200)
          .json({ token: data.token });
      } else {
        return next('Oops');
      }
    }).catch(function(err) {
      return next(err);
    });
}

//=============================================================================

function logout(req, res, next) {
  var cookie = req.headers.authorization;
  var token = cookie ? cookie.replace('token=', '') : '';
  var newToken = randomString(32);
  var sql = 'UPDATE users SET token = $2 WHERE token = $1 returning *;';

  db.one(sql, [token, newToken])
    .then(function(data) {
      res.status(200)
        .json({ status: 'SUCCESS' });
    }).catch(function(err) {
      return next(err);
    });
}

//=============================================================================
// EXPORTS
//=============================================================================

module.exports = {
  getCurrentUser: getCurrentUser,
  login: login,
  logout: logout
};

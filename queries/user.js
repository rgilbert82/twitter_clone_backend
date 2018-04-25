var db = require('../database.js');
var bcrypt = require('bcrypt');
var slugify = require('../helpers/slugify.js');
var randomString = require('../helpers/randomString.js');
var async = require('async');

//=============================================================================
// QUERIES
//=============================================================================

function getAllUsers(req, res, next) {
  var sql = 'SELECT users.id, users.name, users.username, users.slug, ' +
            'COUNT(users_followers.user_id) AS followers, ' +
            '(' +
              'SELECT COUNT(users_followers.follower_id) AS following ' +
              'FROM users_followers ' +
              'WHERE users_followers.follower_id = users.id' +
              ') ' +
            'FROM users ' +
            'LEFT JOIN users_followers ON users_followers.user_id = users.id ' +
            'GROUP BY users.id, users.name, users.username, users.slug ' +
            'ORDER BY users.username;';

  db.any(sql)
    .then(function(data) {
      res.status(200)
        .json(data);
    }).catch(function(err) {
      return next(err);
    });
}

//=============================================================================

function getUser(req, res, next) {
  var userSlug = req.params.slug;

  async.waterfall([
    // Get user
    function(callback) {
      var sql = 'SELECT users.id, users.name, users.username, users.slug ' +
                'FROM users WHERE users.slug = $1;';
      db.one(sql, [userSlug])
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

function getUserTweets(req, res, next) {
  var userID = req.params.id;

  // Combine Tweets and Retweets
  async.parallel({
    tweets: function(callback) {
      // var sql = 'SELECT * FROM tweets WHERE user_id = $1 ORDER BY created_at DESC;';
      var sql = 'SELECT users.slug AS user_slug, users.name, users.username, ' +
        'tweets.id, tweets.body, tweets.image, tweets.user_id, tweets.slug, ' +
        'tweets.created_at ' +
        'FROM tweets ' +
        'INNER JOIN users ON users.id = tweets.user_id ' +
        'WHERE tweets.user_id = $1 ' +
        'ORDER BY created_at DESC';
      db.any(sql, [userID])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, {});
        });
    },
    retweets: function(callback) {
      var sql = 'SELECT users.slug AS user_slug, users.name, users.username, ' +
        'tweets.id, tweets.body, tweets.image, tweets.user_id, tweets.slug, ' +
        'tweets.created_at AS tweet_created_at, retweets.created_at, ' +
        'retweets.id AS retweet_id ' +
        'FROM tweets ' +
        'INNER JOIN retweets ON retweets.tweet_id = tweets.id ' +
        'INNER JOIN users ON users.id = tweets.user_id ' +
        'WHERE retweets.user_id = $1 ' +
        'ORDER BY created_at DESC';
      db.any(sql, [userID])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, {});
        });
    }
  }, function(err, results) {
    var allTweets;
    results.retweets.forEach(function(rt) { rt.retweet = true });
    allTweets = results.tweets.concat(results.retweets)
                .sort(function(a, b) { return a.created_at < b.created_at });

    res.status(200)
      .json(allTweets);
  });
}

//=============================================================================

function createUser(req, res, next) {
  var name = req.body.name.trim();
  var username = req.body.username.trim();
  var password = bcrypt.hashSync(req.body.password.trim(), 10);
  var token = randomString(32);
  var slug = slugify(username);
  var sql = 'INSERT INTO users (name, username, password, token, slug) VALUES ($1, $2, $3, $4, $5) returning *;';

  db.one(sql, [name, username, password, token, slug])
    .then(function(data) {
      res.status(200)
        .json(data);
    }).catch(function(err) {
      return next(err);
    });
}

//=============================================================================

function updateUser(req, res, next) {
  var cookie = req.headers.authorization;
  var token = cookie ? cookie.replace('token=', '') : '';
  var userID = req.params.id;
  var name = req.body.name ? req.body.name.trim() : '';
  var username = req.body.username ? req.body.username.trim() : '';
  var password = req.body.password ? bcrypt.hashSync(req.body.password.trim(), 10) : '';

  async.waterfall([
    // Verify User
    function(callback) {
      var sql = 'SELECT * FROM users WHERE id = $1 AND token = $2;';
      db.one(sql, [userID, token])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    },
    // Then update
    function(user, callback) {
      var sql = "UPDATE users SET name = COALESCE(NULLIF($2, ''), name), username = COALESCE(NULLIF($3, ''), username), password = COALESCE(NULLIF($4, ''), password) WHERE id = $1 returning *;";
      db.one(sql, [user.id, name, username, password])
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

function deleteUser(req, res, next) {
  var cookie = req.headers.authorization;
  var token = cookie ? cookie.replace('token=', '') : '';
  var userID = req.params.id;

  async.waterfall([
    // Verify User
    function(callback) {
      var sql = 'SELECT * FROM users WHERE id = $1 AND token = $2;';
      db.one(sql, [userID, token])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    },
    // Then delete
    function(user, callback) {
      var sql = 'DELETE FROM users WHERE id = $1;';
      db.result(sql, [user.id])
        .then(function() {
          callback(null, { status: 'success', message: 'removed user' });
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
  getAllUsers: getAllUsers,
  getUser: getUser,
  getUserTweets: getUserTweets,
  createUser: createUser,
  updateUser: updateUser,
  deleteUser: deleteUser
}

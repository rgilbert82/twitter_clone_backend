var db = require('../database.js');
var randomString = require('../helpers/randomString.js');
var async = require('async');


//=============================================================================
// QUERIES
//=============================================================================

function getTweet(req, res, next) {
  var tweetSlug = req.params.slug;
  var sql = 'SELECT users.name, users.username, users.slug AS user_slug, tweets.* ' +
            'FROM users ' +
            'INNER JOIN tweets ON tweets.user_id = users.id ' +
            'WHERE tweets.slug = $1;';

  db.one(sql, [tweetSlug])
    .then(function(data) {
      res.status(200)
        .json(data);
    }).catch(function(err) {
      return next(err);
    });
}

//=============================================================================

function getTweetComments(req, res, next) {
  var tweetID = req.params.id;
  var sql = 'SELECT users.name, users.username, users.slug, comments.* ' +
            'FROM users ' +
            'INNER JOIN comments ON comments.user_id = users.id ' +
            'WHERE comments.tweet_id = $1 ' +
            'ORDER BY comments.created_at ASC;';

  db.any(sql, [tweetID])
    .then(function(data) {
      res.status(200)
        .json(data);
    }).catch(function(err) {
      return next(err);
    });
}

//=============================================================================

function createTweet(req, res, next) {
  var cookie = req.headers.authorization;
  var token = cookie ? cookie.replace('token=', '') : '';
  var randomSlug  = randomString(20);
  var body = req.body.body.trim();
  var user_id = req.body.user_id;
  var image = req.body.image;

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
    // Then create the tweet
    function(user, callback) {
      var sql = 'INSERT INTO tweets (body, user_id, slug, image) VALUES ($1, $2, $3, $4) returning *;';
      db.one(sql, [body, user.id, randomSlug, image])
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

function updateTweet(req, res, next) {
  var cookie = req.headers.authorization;
  var token = cookie ? cookie.replace('token=', '') : '';
  var tweetID = req.params.id;
  var body = req.body.body.trim();
  var image = req.body.image;

  async.waterfall([
    // Verify user owns tweet
    function(callback) {
      var sql = 'SELECT tweets.* FROM tweets ' +
                'INNER JOIN users ON users.id = tweets.user_id ' +
                'WHERE tweets.id = $1 AND users.token = $2;';
      db.one(sql, [tweetID, token])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    },
    // Then update the tweet
    function(tweet, callback) {
      var sql = "UPDATE tweets SET image = COALESCE(NULLIF($3, ''), image), body = $2 WHERE id = $1 returning *;";
      db.one(sql, [tweet.id, body, image])
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

function deleteTweet(req, res, next) {
  var cookie = req.headers.authorization;
  var token = cookie ? cookie.replace('token=', '') : '';
  var tweetID = req.params.id;

  async.waterfall([
    // Verify user owns tweet
    function(callback) {
      var sql = 'SELECT tweets.* FROM tweets ' +
                'INNER JOIN users ON users.id = tweets.user_id ' +
                'WHERE tweets.id = $1 AND users.token = $2;';
      db.one(sql, [tweetID, token])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    },
    // Then delete the tweet
    function(tweet, callback) {
      var sql = 'DELETE FROM tweets WHERE id = $1;';
      db.result(sql, [tweet.id])
        .then(function(data) {
          callback(null, { status: 'success', message: 'deleted tweet' });
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

function createRetweet(req, res, next) {
  var cookie = req.headers.authorization;
  var token = cookie ? cookie.replace('token=', '') : '';
  var tweet_id = req.params.id;

  async.waterfall([
    // Get current user
    function(callback) {
      var sql = 'SELECT * FROM users WHERE token = $1;';
      db.one(sql, [token])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    },
    // then create the retweet
    function(user, callback) {
      var sql = 'INSERT INTO retweets (user_id, tweet_id) VALUES ($1, $2) returning *;';
      db.one(sql, [user.id, tweet_id])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    },
    // then return the tweet
    function(tweet, callback) {
      var sql = 'SELECT * FROM tweets WHERE id = $1;';
      db.one(sql, [tweet_id])
        .then(function(data) {
          data.retweet = true;
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

function deleteRetweet(req, res, next) {
  var cookie = req.headers.authorization;
  var token = cookie ? cookie.replace('token=', '') : '';
  var retweetID = req.params.id;

  async.waterfall([
    // Verify user owns retweet
    function(callback) {
      var sql = 'SELECT retweets.* FROM retweets ' +
                'INNER JOIN users ON users.id = retweets.user_id ' +
                'WHERE retweets.id = $1 AND users.token = $2;';
      db.one(sql, [retweetID, token])
        .then(function(data) {
          callback(null, data);
        }).catch(function(err) {
          callback(err, null);
        });
    },
    // Then delete the retweet
    function(retweet, callback) {
      var sql = 'DELETE FROM retweets WHERE id = $1;';
      db.result(sql, [retweet.id])
        .then(function(data) {
          callback(null, { status: 'success', message: 'deleted retweet' });
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
  getTweet: getTweet,
  getTweetComments: getTweetComments,
  createTweet: createTweet,
  updateTweet: updateTweet,
  deleteTweet: deleteTweet,
  createRetweet: createRetweet,
  deleteRetweet: deleteRetweet
}

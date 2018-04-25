var db = require('../database.js');
var async = require('async');


//=============================================================================
// QUERIES
//=============================================================================

function getSearchResults(req, res, next) {
  var search_field = String(req.params.search_field);
  var sql = 'SELECT users.slug AS user_slug, users.name, users.username, ' +
    'tweets.id, tweets.body, tweets.image, tweets.user_id, tweets.slug, ' +
    'tweets.created_at ' +
    'FROM tweets ' +
    'INNER JOIN users ON users.id = tweets.user_id ' +
    "WHERE tweets.body LIKE '%#" + search_field + "%' " +
    'ORDER BY created_at DESC;';

  db.any(sql)
    .then(function(data) {
      res.status(200)
        .json(data);
    }).catch(function(err) {
      return next(err);
    });
}

//=============================================================================
// EXPORTS
//=============================================================================

module.exports = {
  getSearchResults: getSearchResults
}

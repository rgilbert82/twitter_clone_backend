var promise = require('bluebird');
var options = { promiseLib: promise };
var pgp = require('pg-promise')(options);
var connectionString;
var db;

if (process.env.DATABASE_URL) {
  pgp.pg.defaults.ssl = true;
  connectionString = process.env.DATABASE_URL;
} else {
  connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/twit';
}

db = pgp(connectionString);

module.exports = db;

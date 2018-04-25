var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var sessions = require('./routes/sessions');
var users = require('./routes/users');
var tweets = require('./routes/tweets');
var comments = require('./routes/comments');
var follows = require('./routes/follows');
var search = require('./routes/search');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser())


app.use(function(req, res, next) {
  if (app.settings.env === 'development') {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  } else {
    res.header("Access-Control-Allow-Origin", "https://rg-tweeter.herokuapp.com");
  }

  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,UPDATE,DELETE");
  res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Authorization, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  next();
});

app.use('/api/v1/sessions', sessions);
app.use('/api/v1/users', users);
app.use('/api/v1/tweets', tweets);
app.use('/api/v1/comments', comments);
app.use('/api/v1/follows', follows);
app.use('/api/v1/search', search);

module.exports = app;

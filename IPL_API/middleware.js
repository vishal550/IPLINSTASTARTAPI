var DBinstance = require('./models/index.js');
var model = require('./models/table.js');
var config = require('./config/config.js');
var sessionCache = {};
const express = require('express');
const app = express();
var url = require('url');

// This function stop repeated requests for Okta auth for x seconds until the session cache is valid
var isCachedSessionActive = function (sessionId) {
  var cachedTime = sessionCache[sessionId];
  if (!cachedTime) {
    return false;
  }
  var currentTime = parseInt((new Date()).getTime() / 1000);
  if (currentTime - cachedTime > config.sessionCache.expiry) {
    return false;
  }
  return true;
};

var cacheSession = function (sessionId) {
  sessionCache[sessionId] = parseInt(new Date().getTime() / 1000);
};

var setCorsHeaders = function (req, res, next) {
  var domain = '*';
  var referer = req.header('Referer');
  if (referer) {
    var parsedUrl = url.parse(referer);
    domain = parsedUrl.protocol + '//' + parsedUrl.host;
  } else if (req.header('Origin')) {
    domain = req.header('Origin');
  }
  res.header('Access-Control-Allow-Origin', domain);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'POST, PUT, GET, OPTIONS, DELETE');
  next();
};

const authentication = (req, res, next) => {
  if(req.method === 'OPTIONS') {
    next();
  }
  else if (req.method === 'GET' || req.method === 'POST') {
    var sessionId = req.method === 'GET' ? req.query.sessionId : req.body.sessionId;
    var empId = req.method === 'GET' ? req.query.empId : req.body.empId;
    var selectSessionQuery = `SELECT session_id FROM public.ml_user where emp_id = ${empId}`;
    console.log('selectQuery in middleWare',selectSessionQuery)
    if (sessionId && sessionId.length) {
      if (isCachedSessionActive(sessionId)) {
        next();
      }
      else {
        DBinstance.query(selectSessionQuery,
          {
            model: model.ml_user
          }).then(function (result) {
            console.log(result[0][0])
            if (result[0][0]) {
              if (result[0][0].session_id == sessionId) {
                next();
              } else {
                next(new Error('Session invalid/inactive'));
              }
            } else {
              next(new Error('Session invalid/inactive'));
            }
          })
      }
    }
    else {
      next(new Error('Session invalid/inactive'));
    }
  } else {
    next(new Error('Session invalid/inactive'));
  }
}

app.use(setCorsHeaders);

app.use(authentication);


module.exports = app;

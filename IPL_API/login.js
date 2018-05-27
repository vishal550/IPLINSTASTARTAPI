var express = require('express');
var login = express();
var DBinstance = require('./models/index.js');
var model = require('./models/table.js');
var config = require('./config/config.js');
var crypto = require('crypto');

var generate_key = function() {
    var sha = crypto.createHash('sha256');
    sha.update(Math.random().toString());
    return sha.digest('hex');
};

login.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

login.post('/login', function (request, response, next) {
    var checkPasswordQuery = `select emp_id from public.ml_user where emp_id = ${request.body.userName} and password = '${request.body.password}'`;
    console.log(checkPasswordQuery);
    DBinstance.query(checkPasswordQuery,
        {
          model: model.ml_user
        }).then(function (result) {
          if (result[0][0]) {
            var session = generate_key().slice(0, 25);
            var updateSession = `update public.ml_user set session_id = '${session}' where emp_id = ${request.body.userName}`;
            DBinstance.query(updateSession,
                {
                  model: model.ml_user
                }).then(function (result) {
                    response.json({
                        sessionId: session
                    })
                });
          } else {
            next(new Error('Enter Valid Credentials'));
          }
        }).catch((err) => {
            next(new Error('Enter Valid Credentials'));
        })
});

login.use(function (err, req, res, next) {
    var ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
    var apiUrl = req.originalUrl;
    console.error({
        message: err.message, stacktrace: err.stack, details: {
            username: "",
            ip: ip,
            apiUrl: apiUrl
        }
    });
    res.status(err.status || 500).send({ message: "Something went wrong.", exception: err.message });
})

module.exports = login
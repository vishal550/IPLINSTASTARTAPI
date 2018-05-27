var DBinstance = require('./index.js');
var Sequelize = DBinstance.Sequelize;
var moment = require('moment');
//parsing,manuplation anfd formatting date
moment().format();
//model defination
var model = {
    match: DBinstance.define('match', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        team1: Sequelize.TEXT,
        team2: Sequelize.TEXT,
        h_a: Sequelize.TEXT,
        match_day: Sequelize.TEXT,
        match_date: Sequelize.DATE,
        match_time: Sequelize.TEXT,
        winner: Sequelize.TEXT
    }),
    ml_user: DBinstance.define('ml_user', {
        emp_id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        name: Sequelize.TEXT,
        ip: Sequelize.TEXT,
        password: Sequelize.TEXT,
        session_id: Sequelize.TEXT,
    }),
    match_time:DBinstance.define('match_time', {
        
    })
}
module.export = model;
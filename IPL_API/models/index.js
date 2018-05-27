var Sequelize = require('sequelize');
var DBinstance = new Sequelize("IPL","vishal","test123$$", { 
	host: '172.31.38.36',
    dialect: "postgres",
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    define: {
        //prevent sequelize from pluralizing table names
        freezeTableName: true,
    },
    logging: false
});

DBinstance
    .authenticate()
    .then(function (err) {
        console.log('Connection has been established successfully.');

    }, function (err) {
        console.log('Unable to connect to the database: ', err);
    });

DBinstance.Sequelize = Sequelize;
module.exports = DBinstance;
var app = require('../app');
var chai = require('chai');
var chaiHttp = require('chai-http');
var server=require("../app.js");
var should=chai.should();
var assert = require('assert');
// const chaiParam = require('chai-param');
// chai.use(chaiParam);
chai.use(chaiHttp);

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present', function() {
      assert.equal(-1, [1,2,3].indexOf(4));
    });
  });
});

/*
describe('On callPoc Get call', function() {
    it('shuld return response status 200', function(done) {
		 chai.request(server)
         .get('/getData')
         .end(function(err, res){
          res.should.have.status(200);
		  res.should.be.json;
         done();
         });
    });
});

describe('On callPoc post call', function() {
    it('shuld return response status 200 and property success', function(done) {
		 let book={		 
	         "client":"google",
           	 "targetedAcc":6
		 }
		 book.client.should.be.a('string');
		 chai.request(server)
         .post('/postData')
		 .send(book)
         .end(function(err, res){
         res.should.have.status(200);
		 res.body.should.have.property('success',true);
         done();
         });
    });
});
describe('On callPoc put call', function() {
	
    it('shuld return response status 200 and property success', function(done) {
		let data= {
	       "client":"google"
         }
		 chai.request(server)
         .put('/putData/8')
		 .send(data)
         .end(function(err, res){
         res.should.have.status(200);
		 res.body.should.have.property('success',true);
         done();
         });
    });
});
describe('On callPoc delete call', function() {
	
    it('shuld return response status 200 and property success', function(done) {
		 chai.request(server)
         .delete('/deleteData/8')
         .end(function(err, res){
         res.should.have.status(200);
		 res.body.should.have.property('success',true);
         done();
         });
    });
*/
const sinon = require('sinon');
const path = require('path');
const sequelizeMockingMocha = require('sequelize-mocking').sequelizeMockingMocha;

describe('client - UserService (using sequelizeMockingMocha) - ', function () {
	 const model=require("../models/table.js");
     const dbInstance=require("../models/index.js");
     const UserService=require("../routes/index.js");
      var sandbox = null;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox && sandbox.restore();
    });
	
   //Load fake data for the users
    sequelizeMockingMocha(
        dbInstance,
        path.resolve(path.join(__dirname, './fake-users-database.json')),
        { 'logging': false }
    );
	
    it('the service shall exist', function () {
       chai.expect(UserService).to.exist;
    });
	
        it('shall returns an array of user', function () {
            return UserService
                .findAll()
                .then(function (users) {
                    chai.expect(users).deep.equals([{
                        'id': 1,
                        'name': 'John',
                    }]);
                });
        });

});

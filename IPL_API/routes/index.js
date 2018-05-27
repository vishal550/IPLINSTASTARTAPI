var express = require('express');
var router = express.Router();
var DBinstance = require('../models/index.js');
var model = require('../models/table.js');
const Moment = require('moment');
const request = require('request');
var _ = require('underscore');
//get match Shedule from model client
/*
router.post('/getLiveScore', (req, res, next) => {
	DBinstance.query(`select * from live_score  where match_id = ${req.body.matchId}`).then(function (result) {
			console.log(result[0][0].unique_id);
			var options = {
			  method: 'post',
			  body: {
				"apikey": "Pont7fxgxgQlDTpZAfbYv3UBzlq2",
				"unique_id" :1034809
			  },
			  json: true,
			  url: 'http://cricapi.com/api/cricketScore'
			}
			request(options,function (err, resp, body) {
			  if (err) {
				console.error('error posting json: ', err)
				next(err);
			  } else {
				  res.send({
					success: true,
					message: "success",
					data: body,
				  });
			  }
			});
		});
});*/



router.post('/getMatchShedule', function (req, res, next) {
	//query for selecting data from client model
	DBinstance.query(`With raw_data as (select m.*, mv.vote, mv.vote_type from match m
join match_vote mv on m.id = mv.match_id
where emp_id = ${req.body.empId})
select (
select array_to_json(array_agg(sq.*)) from (select * from raw_data where winner is null) sq ) as upcoming,
(select array_to_json(array_agg(sq.*)) from (select * from raw_data where winner is not null order by id) sq ) as results`).then(function (result) {
			res.send({
				success: true,
				message: "success",
				data: result[0][0],
			});
		});
});

router.get('/', function (req, res, next) {
	res.send({
		success: true
	});
});

router.post('/postVote', function (req, res, next) {
	if (!req.body.vote || !req.body.voteType) {
		next(new Error('please select vote and votetype'));
	} else {
		var time = Moment().utcOffset(330).format('LT');
		var now = Moment().utcOffset(330).format('YYYY-MM-DD');
		var selectQuery = `select match_time, is_allowed, match_date, voting_end_time from public.match where id = ${req.body.matchId}`;
		DBinstance.query(selectQuery).then(function (result) {
			console.log('result[0][0].is_allowed=============================',time );
			var matchStatus = result[0][0];
			if (result[0][0].is_allowed) {
				var dbDate = Moment(result[0][0].match_date).format('YYYY-MM-DD');
				console.log('now', now);
				console.log('db', dbDate);
				if(Moment(now).isSame(dbDate)) {					
					console.log('date match');
					if (time.split(' ')[1] == 'AM') {
						vote(req).then((result) => {
							res.send(result);
						}).catch((err) => {
							next(err);
						})
					} else if (time.split(' ')[1] == 'PM' && time.split(':')[0] == 12) {
						vote(req).then((result) => {
							res.send(result);
						}).catch((err) => {
							next(err);
						})
					} else {
						if (time.split(':')[0] < parseInt(matchStatus.match_time.split(' ')[0]) - 1) {
							vote(req).then((result) => {
								res.send(result);
							}).catch((err) => {
								console.log(err);
								next(err);
							})
						} else {
							next(new Error('Voting are closed'));
						}
					}
				}
				else if(Moment(now).isBefore(dbDate)) {
					console.log('date before');
					vote(req).then((result) => {
							res.send(result);
						}).catch((err) => {
							next(err);
						})
				}
				else{
					next(new Error('Voting are closed'));
				}
			} else {
				next(new Error('Voting are closed'));
			}
		}).catch((err) => {
			next(err);
		})
	}
});

const vote = (req) => {
	return new Promise((resolve, reject) => {
		var voteQuery = `insert into public.match_vote (match_id, emp_id, vote, vote_type, created_at, updated_at) values (${req.body.matchId}, ${req.body.empId}, '${req.body.vote}', ${req.body.voteType}, now(), now()) on conflict (match_id, emp_id) DO UPDATE SET vote_type = ${req.body.voteType}, vote = '${req.body.vote}',updated_at = now()`;
		console.log(voteQuery);
		DBinstance.query(voteQuery,
			{
				model: model.match_time
			}).then(function (result) {
				resolve({
					success: true,
					message: "successfully saved"
				});
			}).catch((err) => {
				reject(err);
			})
	});
}

router.post('/getReport', function (req, res, next) {
	var selectQuery = `select u.emp_id, u.name,
	SUM((CASE WHEN mv.vote = m.winner 
	THEN CASE WHEN mv.vote_type = false 
		THEN 0 
		ELSE -(m.single)
		 END
	ELSE CASE WHEN mv.vote_type = false 
		THEN m.single 
		ELSE m.double 
		 END
	END)) as amount
	from public.match m, public.match_vote mv
	join ml_user u on u.emp_id = mv.emp_id 
	where m.id = mv.match_id and m.winner is not null
	group by u.emp_id
	order by amount desc`;
	var resArray = {
		'barChart': [],
		'pieChart': [],
		'totalAmount': 0
	}
	DBinstance.query(selectQuery).then(function (result) {
		result[0].forEach(element => {
			resArray.barChart.push({
				c: [{ v: element.name },
				{ v: element.amount }]
			});
			var amt = element.amount < 0 ? 0 : parseInt(element.amount);
			resArray.totalAmount += amt;
			resArray.pieChart.push({
				c: [{ v: element.name },
				{ v: amt }]
			});
		});
		res.send(resArray);
	}).catch((err) => {
		next(err);
	})

});

router.post('/getUserList', (req, res, next) => {
	var selectQuery = `select emp_id,  SUM((CASE WHEN mv.vote = m.winner 
		THEN CASE WHEN mv.vote_type = false 
			THEN 0 
			ELSE -(m.single)
			 END
		ELSE CASE WHEN mv.vote_type = false 
			THEN m.single 
			ELSE m.double 
			 END
		END)) as amount
from match m , match_vote mv where id = match_id and m.winner is not null
group by emp_id
order by emp_id`;
	console.log(selectQuery);
	DBinstance.query(selectQuery).then(function (result) {
		res.send(result[0]);
	}).catch((err) => {
		next(err);
	})
});

router.post('/getUserReport', (req, res, next) => {
	if (!req.body.empId) {
		next(new Error('client id pathe re'));
	} else {
		var selectQuery = `select emp_id, match_id, team1, team2, winner ,vote, case when mv.vote_type = false then 'SINGLE' else 'DOUBLE' END as vote_type,
	SUM((CASE WHEN mv.vote = m.winner 
		THEN CASE WHEN mv.vote_type = false 
			THEN 0 
			ELSE -(m.single)
			 END
		ELSE CASE WHEN mv.vote_type = false 
			THEN m.single 
			ELSE m.double 
			 END
		END)) as amount
	 from match m , match_vote mv where id = match_id and m.winner is not null
	 group by mv.emp_id, match_id, id having emp_id = ${req.body.empIdReport} order by match_id`;
		DBinstance.query(selectQuery).then(function (result) {
			if (result[0]) {
				var resObj = {
					'barChart': []
				}
				result[0].forEach(element => {
					resObj.barChart.push({
						c: [{ v: 'Match ' + element.match_id },
						{ v: parseInt(element.amount) },
						{ v: `${element.team1} vs ${element.team2},winner: ${element.winner},vote: ${element.vote} : ${element.vote_type}` }]
					});
				});
				res.send(resObj);
			} else {
				res.send([]);
			}
		}).catch((err) => {
			next(err);
		})
	}
});

router.post('/getMatchReport', (req, res, next) => {
	if (!req.body.empId) {
		next(new Error('client id pathe re'));
	} else {
		var selectQuery = `select mv.emp_id , u.name, match_id, winner ,vote, case when mv.vote_type = false then 'SINGLE' else 'DOUBLE' END as vote_type,
		SUM((CASE WHEN mv.vote = m.winner 
			THEN CASE WHEN mv.vote_type = false 
				THEN 0 
				ELSE -(m.single)
				 END
			ELSE CASE WHEN mv.vote_type = false 
				THEN m.single 
				ELSE m.double 
				 END
			END)) as amount
		 from match m , match_vote mv join ml_user u on u.emp_id = mv.emp_id where id = match_id and m.winner is not null
		  group by mv.emp_id, match_id, id, u.name having mv.match_id = ${req.body.matchId}`;
		DBinstance.query(selectQuery).then(function (result) {
			if (result[0]) {
				var resObj = {
					'lineChart': []
				}
				result[0].forEach(element => {
					resObj.lineChart.push({
						c: [{ v: element.name },
						{ v: element.amount }]
					});
				});
				res.send(resObj);
			} else {
				res.send([]);
			}
		}).catch((err) => {
			next(err);
		})
	}
});

router.post('/getMatchPointReport', (req, res, next) => {
	if (!req.body.empId) {
		next(new Error('client id pathe re'));
	} else {
		var selectQuery = `select m.id, m.team1 || ' vs ' || m.team2 as match_details, m.winner,
		SUM((CASE WHEN mv.vote = m.winner 
		THEN CASE WHEN mv.vote_type = false 
			THEN 0 
			ELSE -(m.single)
			 END
		ELSE CASE WHEN mv.vote_type = false 
			THEN m.single 
			ELSE m.double 
			 END
		END)) as amount
		from public.match m, public.match_vote mv
		join ml_user u on u.emp_id = mv.emp_id 
		where m.id = mv.match_id and m.winner is not null
		group by m.id
		order by m.id`;
		DBinstance.query(selectQuery).then(function (result) {
			console.log(result[0]);
			var resArray = {
				'barChart': []
			}
			result[0].forEach(element => {
				resArray.barChart.push({
					c: [{ v: 'Match ' + element.id },
					{ v: element.amount },
					{ v: element.match_details + ' - ' + element.amount  }]
				});
			});
			res.send(resArray);
		}).catch((err) => {
			next(err);
		});
	}
});

router.post('/logout', (req, res, next) => {
	if (!req.body.empId) {
		next(new Error('client id pathe re'));
	} else {
		var selectQuery = `update public.ml_user set session_id = null where emp_id = ${req.body.empId}`;
		DBinstance.query(selectQuery).then(function (result) {
			if (result[0]) {
				res.send(true);
			} else {
				res.send(false);
			}
		}).catch((err) => {
			next(err);
		})
	}
});

router.post('/manage', (req, res, next) => {
	if (!req.body.empId) {
		next(new Error('client id pathe re'));
	} else {
		var allowedEmpID = [16808, 6904, 11578];
		if (allowedEmpID.indexOf(parseInt(req.body.empId)) == -1) {
			res.send('false');
		} else {
			if (req.body.isAllowed) {
				var updateQuery = `update match set is_allowed = true, winner = NULL where id = ${req.body.id}`;
				DBinstance.query(updateQuery).then(function (result) {
					res.send('true');
				});
			} else {
				var updateQuery = `update match set is_allowed = false, winner = '${req.body.winner}' where id = ${req.body.id}`;
				DBinstance.query(updateQuery).then(function (result) {
					res.send('true');
				});
			}
		}
	}
});

router.post('/getWinLeaderboard', (req, res, next) => {
	if (!req.body.empId) {
		next(new Error('client id pathe re'));
	} else {
		var selectQuery = `select mv.emp_id, name, Count(*) as wins
			from match_vote mv 
			join ml_user mu on mv.emp_id = mu.emp_id
			join match m on m.id = mv.match_id
			where m.winner  = mv.vote
			group by mv.emp_id, name
			order by wins desc, name`;
		DBinstance.query(selectQuery).then(function (result) {
			if (result[0]) {
				var resObj = [];				
				result[0].forEach(element => {
					resObj.push({
						c: [{ v: element.emp_id }, { v: element.name },
						{ v: element.wins }]
					});
				});
				res.send(resObj);
			} else {
				res.send([]);
			}
		}).catch((err) => {
			next(err);
		})
	}
});

router.post('/getDoubleWinLeaderboard', (req, res, next) => {
	if (!req.body.empId) {
		next(new Error('client id pathe re'));
	} else {
		var selectQuery = `select mv.emp_id, name, Count(CASE when vote_type = true then 1 else null end) as d_wins
from match_vote mv 
join ml_user mu on mv.emp_id = mu.emp_id
join match m on m.id = mv.match_id
where m.winner  = mv.vote
group by mv.emp_id, name
order by d_wins desc, name`;
		DBinstance.query(selectQuery).then(function (result) {
			if (result[0]) {
				var resObj = [];				
				result[0].forEach(element => {
					resObj.push({
						c: [{ v: element.emp_id }, { v: element.name },
						{ v: element.d_wins }]
					});
				});
				res.send(resObj);
			} else {
				res.send([]);
			}
		}).catch((err) => {
			next(err);
		})
	}
});


module.exports = router;
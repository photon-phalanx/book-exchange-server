var express = require('express');
var router = express.Router();

var fs = require('fs');
var co = require('co');
var parse = require('co-busboy');
var config = require('../config.js');
var mongo = require('../mongo.js');
var responseMsg = require('../responsemsg.js');
var accountManager = require('../accountmanager.js');
var bookManager = require('../bookmanager.js');
var messageManager = require('../messagemanager.js');

function setSession(session, account){
    session.uid = account._id;
    delete session.location;
}
function clearSession(session){
    session.uid = undefined;
    session.destroy(function(){});
}

function getUserId(req){
    return req.session.uid;
}
function getUserName(req){
    return req.session.uname;
}

// 中间件，要求用户已经登录
function requireLogin(req, res, next){
    if(getUserId(req)) next();
    else res.json({r: responseMsg.USER_NOT_LOGIN, route: 'login'});
}


exports.getUserId = getUserId;
exports.getUserName = getUserName;
exports.requireLogin = requireLogin;


router.post('/register', function(req, res){ // 完成注册
    // body中有uid，pw
    accountManager.register(req.body).then(function(result){
        res.json(result);
        // 选上系统的入门课程
    });
});

router.post('/login', function(req, res){
    if(getUserId(req)){
        res.json({r: getUserId(req)+responseMsg.USER_ALREADY_LOGIN});
        return;
    }
    if(req.body.uid && req.body.pw){
        co(function*(){
            // body中有uid和pw两个字段
            var result = yield accountManager.login(req.body);
            if(result){
                setSession(req.session, result);
                res.json(result);//TODO 要什么我还不知道呢= =
            } else res.json({r: responseMsg.USER_ID_PASSWORD_WRONG});
        });
    } else res.json({r: responseMsg.USER_ID_PASSWORD_EMPTY});
});

router.delete('/login', function(req, res){
    clearSession(req.session);
    res.json({});
});

/*
router.get('/login', requireLogin, function(req, res){
    co(function*(){
        var cid = req.query.cid, rid = req.query.rid, role = req.query.role,
            uid = getUserId(req);

        res.json(result);
    }).catch(mongo.onError);
});
*/
router.get('/remind',requireLogin,function(req,res) {
    if (req.body.id) req.body.id = mongo.Id(req.body.id);
    accountManager.getRemind(getUserId(req)).then(function (result) {
        res.json(result);
        accountManager.setRemind(getUserId(req), 0);
    });
});

router.post('/count',requireLogin,function(req,res){
    if(req.body.id) req.body.id=mongo.Id(req.body.id);
    bookManager.count(getUserId(req)).then(function (result) {
        res.json(result);
    });
});

router.post('/borrow',requireLogin,function(req,res){
    if(req.body.id) req.body.id=mongo.Id(req.body.id);
    bookManager.searchBorrow(req.body, getUserId(req)).then(function (result) {
       res.json(result);
   });
});

router.post('/lend',requireLogin,function(req,res){
    if(req.body.id) req.body.id=mongo.Id(req.body.id);
    bookManager.searchLend(req.body, getUserId(req)).then(function (result) {
        res.json(result);
    });
});

router.post('/unhandledReader',requireLogin,function(req,res){
    if(req.body.id) req.body.id = mongo.Id(req.body.id);
    bookManager.searchUnhandledReader(req.body, getUserId(req)).then(function (result) {
        res.json(result);
    });
});

router.post('/unhandled',requireLogin,function(req,res){
    if(req.body.id) req.body.id = mongo.Id(req.body.id);
    bookManager.searchUnhandled(req.body, getUserId(req)).then(function (result) {
        res.json(result);
    });
});


router.post('/publish',requireLogin,function(req,res){
    if(req.body.id) req.body.id=mongo.Id(req.body.id);
   // req.body.length = parseInt(req.body.length);
    bookManager.searchPublishment(req.body, getUserId(req)).then(function (result) {
        res.json(result);
    });
});

router.post('/phone',requireLogin,function(req,res){
    accountManager.getTel(req.body.id).then(function (result) {
        res.json(result);
    });
});

router.post('/changePw',function(req,res){
    accountManager.changePw(req.body, getUserId(req)).then(function (result) {
        res.json(result);
    });
});

router.post('/addMessage',requireLogin,function(req,res){
    if(req.body.receiver == getUserId(req)) return res.json({r:responseMsg.USER_YOURSELF});
    messageManager.addMessage(req.body, getUserId(req)).then(function (result) {
        res.json(result);
        accountManager.setRemind(req.body.receiver, 4);
    });
});

router.post('/searchMessage',requireLogin,function(req,res){
    if(req.body.id) req.body.id = mongo.Id(req.body.id);
    messageManager.searchMessage(req.body, getUserId(req)).then(function (result) {
        res.json(result);
    });
});

exports.router = router;

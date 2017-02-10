var express = require('express');
var router = express.Router();

var fs = require('fs');
var co = require('co');
var config = require('../config.js');
var mongo = require('../mongo.js');
var responseMsg = require('../responsemsg.js');
var bookManager = require('../bookmanager.js');
var user = require('./user.js');
var multer = require('multer');
var maxUploadSize=2000000;
var upload = multer({ dest:  config.dir+'/tmp',limits: {fileSize: maxUploadSize} });

router.get('/queryByTime',function(req,res){
    bookManager.queryByDefault(1).then(function(result) {
        res.json(result);
    });
});

router.get('/queryByHot',function(req,res){
    bookManager.queryByDefault(2).then(function(result) {
        res.json(result);
    });
});

router.post('/addBook',user.requireLogin, function(req, res) {
        if(req.body.photo.length > 50*1024) return res.json({r: '文件过大'});
        bookManager.addBook(req.body, user.getUserId(req)).then(function (result) {
            res.json(result);
        });
});

router.post('/query', user.requireLogin, function(req,res){
    bookManager.query(req.body,user.getUserId(req)).then(function (result) {
        res.json(result);
    });
});

router.post('/borrow', user.requireLogin, function(req,res){
    bookManager.borrowBook(req.body.id,user.getUserId(req)).then(function (result) {
        res.json(result);
    });
});

router.post('/changeBook', user.requireLogin, function(req,res){
    bookManager.changeBook(req.body,user.getUserId(req)).then(function (result) {
        res.json(result);
    });
});

router.post('/deleteBook', user.requireLogin, function(req,res){
    bookManager.deleteBook(req.body.id,user.getUserId(req)).then(function (result) {
        res.json(result);
    });
});

router.post('/renew', user.requireLogin, function(req,res){
    bookManager.renewBook(req.body.id,user.getUserId(req)).then(function (result) {
        res.json(result);
    });
});

router.post('/return', user.requireLogin, function(req,res){
    bookManager.returnBook(req.body.id,user.getUserId(req)).then(function (result) {
        res.json(result);
    });
});

router.post('/send', user.requireLogin, function(req,res){
    bookManager.sendBook(req.body.id,user.getUserId(req)).then(function (result) {
        res.json(result);
    });
});

router.post('/get', user.requireLogin, function(req,res){
    bookManager.sendBookReader(req.body.id,user.getUserId(req)).then(function (result) {
        res.json(result);
    });
});
exports.router = router;


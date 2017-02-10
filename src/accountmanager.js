try{
    var bcrypt  = require('co-bcrypt');
} catch (err){
    bcrypt      = require('co-bcryptjs');
}

var config    = require('./config.js');
var crypto    = require('crypto');
var moment    = require('moment');
var mongo     = require('./mongo.js');
var co        = require('co');

var responseMsg = require('./responsemsg');
var accountCollection   = mongo.collection('account');
var bookCollection   = mongo.collection('book');


exports.login = function*(user){
    var [account] = yield accountCollection.find({_id: user.uid}).limit(1).toArray();
    if(account && (yield bcrypt.compare(user.pw, account.pw))){ // 密码正确
        // 更新上次登录时间，不是很关键，所以允许失败
//        accountCollection.updateOne({_id: user.uid},
  //                                  {$set: {last: moment().valueOf()}});
        return account;
    } else return undefined;
};

exports.register = function(user){
    return co(function*(){
        var salt = yield bcrypt.genSalt(10);
        var hash = yield bcrypt.hash(user.pw, salt);
        var r = yield accountCollection.insertOne({_id: user.uid,
                                                   pw: hash,
                                                   email:user.email,
                                                   phone:user.phone,
                                                   last: 0,
                                                   remind:0,
                                                   stime: moment().valueOf()});
        return {};
    }).catch(function(err){
        console.log(err);
        // NOTE 这里可能会随着版本变动而不得不变动
        if(err.code === 11000)
            return {r: responseMsg.USER_ID_EXIST};
        else return {r: '系统繁忙'};
    });
};

exports.getTel = function(id){  //可能不够严谨，什么人可以获取电话需要限制？
    return co(function*(){
        var doc = yield accountCollection.find({_id: id}).limit(1).toArray();
        if(doc.length==0) return {r: '无此用户'};
        return {phone:doc[0].phone};
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })
};

exports.getRemind = function(id){  //可能不够严谨，什么人可以获取电话需要限制？
    return co(function*(){
        var doc = yield accountCollection.find({_id: id}).limit(1).toArray();
        if(doc.length==0) return {r: '无此用户'};
        return {remind:doc[0].remind};
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })
};

exports.changePw = function(body, id){
    return co(function*(){
        var doc = yield accountCollection.find({_id: id}).limit(1).toArray();
        if(doc.length==0) return {r: '无此用户'};
        doc = doc[0];
        if(yield bcrypt.compare(body.oldPw, doc.pw)){
            var salt = yield bcrypt.genSalt(10);
            var hash = yield bcrypt.hash(body.newPw, salt);
            yield accountCollection.updateOne({_id:id},
                {
                    "$set" : {
                        "pw" : hash
                    }
                });
            return {};
        }else return {r: responseMsg.USER_OLD_PASSWORD_WRONG};
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })
};


function code(length){
    // 只产生数字口令，便于以后发送语音
    var r = Math.random();
    while(r == 0) r = Math.random();
    return r.toString().slice(2, 2+length);
    //return crypto.randomBytes(length>>1).toString('hex').toUpperCase();
}

exports.setRemind = function(id,flag){
    return co(function*(){
        var user = yield accountCollection.find({_id: id}).limit(1).toArray();
        user =user[0];
        if (flag !=0){
            if(!(user.remind&flag))yield accountCollection.updateOne({_id: id},{$set:{remind:user.remind|flag}});
        }else{
            yield accountCollection.updateOne({_id: id},{$set:{remind:0}});
        }
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })
};
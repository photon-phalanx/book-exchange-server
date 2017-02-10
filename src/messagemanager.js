var config    = require('./config.js');
var mongo     = require('./mongo.js');
var co        = require('co');
var responseMsg = require('./responsemsg');
var bookCollection   = mongo.collection('book');
var accountCollection   = mongo.collection('account');
var messageCollection   = mongo.collection('message');

exports.addMessage = function(body, user) {
    return co(function*() {
        var collection= yield accountCollection.find({_id:body.receiver}).limit(1).toArray();
        if(collection.length== 0) return {r:responseMsg.USER_NO_ID};
        var doc = yield messageCollection.find({"relation" : {"$all": [user,body.receiver]}}).limit(1).toArray();
        if (doc.length != 0){
            yield messageCollection.updateOne({"relation" : {"$all": [user,body.receiver]}},
                {
                    "$push" : {
                        "comments" : {
                            poster: user,
                            content: body.content
                        }
                    }
                });
        }
        else {
            yield messageCollection.insert({
                relation:[user, body.receiver],
                comments:[{
                    poster: user,
                    content: body.content
                }]
            });
        }
        return {};
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })
};


exports.searchMessage = function(body,user){
    return co(function*(){
        if(body.id){
            var cursor = messageCollection.aggregate([
                {$match : {
                    "relation" : user,
                    "_id" :{"$lt":body.id}
                }
                },
                {$sort :{"_id":-1}},
                {$limit :body.length}
            ]);
        }
        else {
            var cursor = messageCollection.aggregate([
                {$match : {
                    "relation" : user
                }
                },
                {$sort :{"_id":-1}},
                {$limit :body.length}
            ]);
        }
        var docs = yield cursor.toArray();
        return docs;
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })
};
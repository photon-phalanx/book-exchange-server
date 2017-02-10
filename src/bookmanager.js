var config    = require('./config.js');
var mongo     = require('./mongo.js');
var co        = require('co');
var responseMsg = require('./responsemsg');
var setRemind = require('./accountmanager.js').setRemind;
var bookCollection   = mongo.collection('book');
var moment    = require('moment');
var fs = require('fs');
var config = require('./config.js');
var lendTime = 40; //默认借书时间为40天
var borrowNum = 20;//默认最多借书20本
exports.borrowNum = borrowNum;

var writeFile = function (fileName,  data){
    return new Promise(function (resolve, reject){
        fs.writeFile(fileName,data, function(error, data){
            if (error) reject(error);
            resolve(data);
        });
    });
};

exports.queryByDefault = function (flag ){
    return co(function*(){
        var result=[];
    if (flag == 1) result = yield bookCollection.find().sort({stime:-1}).limit(10).toArray();
    else if (flag == 2) result = yield bookCollection.find().sort({hot:-1}).limit(10).toArray();
        return result;
    }).catch(function (err) {
        console.log(err);
         return {r: '系统繁忙'};
    })
};

exports.addBook = function(fields, owner){
    return co(function*(){
        var suffix='/img/'+new Date().valueOf()+'.jpg';
        var path=config.publicDir+suffix;
        //path=path.replace(/[\\]/g,'/');
        //实验后发现fs容错蛮好的，不用考虑斜杠和反斜杠的问题。public为static，只需后缀suffix就能访问
        var base64Data = fields.photo.replace(/^data:image\/\w+;base64,/, "");
        var dataBuffer = new Buffer(base64Data, 'base64');
        //   fs.renameSync(file.path,path);
        yield writeFile(path, dataBuffer);
        var a={
            title : fields.title,
            stime : new Date().valueOf(),
            owner : owner,
            reader : null,
            rdate : null,
            type : fields.type,
            flag : fields.flag,
            ldate : null,
            path :suffix,
            renewflag:0
        };
        yield bookCollection.insertOne(a);
        return {};
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })

};

function calculateTime(date){
   var day = date.getDate();
   var month = date.getMonth();
   var year = date.getFullYear();
   var rdate = new Date (year, month, day+lendTime);
    return rdate.valueOf();
}

exports.borrowBook = function(book,user) {
    return co(function*() {
        book = mongo.Id(book);
        var time = new Date();
        var rdate = calculateTime(time);
        var number = yield bookCollection.count({reader: user},{limit: borrowNum});
        if (number == borrowNum) return {r:responseMsg.BOOK_OVER_LIMIT};
        var collection= yield bookCollection.find({_id:book}).limit(1).toArray();
        if(collection.length==0) return {r:responseMsg.BOOK_NOT_EXIST};
        if(collection[0].reader) return {r:responseMsg.BOOK_HAS_BEEN_LENDED};
        if(collection[0].owner == user) return {r:responseMsg.BOOK_OWNER_OPERATE};
        yield bookCollection.updateOne({_id:book},
            {
                "$set" : {
                    "reader": user,
                    "rdate" : rdate,
                    "ldate" : time.valueOf()
                }
        });
        setRemind(collection[0].owner, 1);
        return {};
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })
};

exports.renewBook = function(book,user) {
    return co(function*() {
        book = mongo.Id(book);
        var collection= yield bookCollection.find({_id:book}).limit(1).toArray();
        if(collection.length==0) return {r:responseMsg.BOOK_NOT_EXIST};
        if(!collection[0].reader) return {r:responseMsg.BOOK_HAS_NOT_BEEN_LENDED};
        if(collection[0].renewflag==1) return {r:responseMsg.BOOK_HAS_BEEN_RENEWED};
        if(collection[0].reader !=user) return {r:responseMsg.HAVE_NO_PERMISSION};
      //  var rdate = calculateTime(new Date(collection[0].rdate));
        var rdate = calculateTime(new Date());

        yield bookCollection.updateOne({_id:book},
            {
                "$set" : {
                    "rdate" : rdate,
                    "renewflag" : 1
                }
            });
        return {};
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })
};

exports.returnBook = function(book,user) {
    return co(function*() {
        book = mongo.Id(book);
        var collection= yield bookCollection.find({_id:book}).limit(1).toArray();
        if(collection.length== 0) return {r:responseMsg.BOOK_NOT_EXIST};
        if(!collection[0].reader) return {r:responseMsg.BOOK_HAS_NOT_BEEN_LENDED};
        if(collection[0].owner != user) return {r:responseMsg.HAVE_NO_PERMISSION};//还书应由主人操作
        yield bookCollection.updateOne({_id:book},
            {
                "$set" : {
                    "reader" : null,
                    "rdate" : null,
                    "renewflag" : 0,
                    "ldate" :null
                }
            });
        return {};
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })
};


exports.sendBook = function(book,user) {
    return co(function*() {
        book = mongo.Id(book);
        var collection= yield bookCollection.find({_id:book}).limit(1).toArray();
        if(collection.length== 0) return {r:responseMsg.BOOK_NOT_EXIST};
        if(collection[0].owner !=user) return {r:responseMsg.HAVE_NO_PERMISSION};//送出书应由主人操作
        if(collection[0].rdate != -1){
           if(collection[0].reader) return {r:responseMsg.BOOK_HAS_BEEN_LENDED};
            else return {r:responseMsg.BOOK_NO_NEEDED};
        }
        fs.unlinkSync(config.publicDir+ collection[0].path);
        yield bookCollection.deleteOne({_id:book});
        return {};
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })
};

exports.sendBookReader = function(book,user) {
    return co(function*() {
        book = mongo.Id(book);
        var collection= yield bookCollection.find({_id:book}).limit(1).toArray();
        if(collection.length== 0) return {r:responseMsg.BOOK_NOT_EXIST};
        if(collection[0].reader) return {r:responseMsg.BOOK_HAS_BEEN_LENDED};
        if(collection[0].owner == user) return {r:responseMsg.BOOK_OWNER_OPERATE};
        yield bookCollection.updateOne({_id:book},
            {
                "$set" : {
                    "reader" : user,
                    "rdate" : -1
                }
            });
        setRemind(collection[0].owner, 2);
        return {};
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })
};


exports.changeBook = function(body,user) {
    return co(function*() {
        body.id = mongo.Id(body.id);
        var collection= yield bookCollection.find({_id:body.id}).limit(1).toArray();
        if(collection.length== 0) return {r:responseMsg.BOOK_NOT_EXIST};
        if(collection[0].owner != user) return {r:responseMsg.HAVE_NO_PERMISSION};
        if(collection[0].reader) return {r:responseMsg.BOOK_HAS_BEEN_LENDED};
        yield bookCollection.updateOne({_id:body.id},
            {
                "$set" : {
                    "flag" : body.flag,
                    "type" : body.type
                }
            });
        return {};
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })
};


exports.deleteBook = function(book,user) {
    return co(function*() {
        book = mongo.Id(book);
        var collection= yield bookCollection.find({_id:book}).limit(1).toArray();
        if(collection.length== 0) return {r:responseMsg.BOOK_NOT_EXIST};
        if(collection[0].owner !=user) return {r:responseMsg.HAVE_NO_PERMISSION};//送出书应由主人操作
        if(collection[0].reader) return {r:responseMsg.BOOK_HAS_BEEN_LENDED};
        fs.unlinkSync(config.publicDir+ collection[0].path);
        yield bookCollection.deleteOne({_id:book});
        return {};
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })
};



function queryFormat(query){
    var result ={},info = [],a;
    a = query.title.split(' ');
    for (var i=0;i<a.length;i++) info.push({"title":new RegExp(a[i],'i')});
    if(query.id) result['_id'] = {"$lt":mongo.Id(query.id)};
    result["$and"] =info;
    if(query.type !==6) result["type"] = query.type;
    result['reader'] =null;
    return result;
}

exports.query =function(body,user){
    return co(function*(){
        var result = queryFormat(body);
        var cursor = bookCollection.aggregate([
            {$match : result
            },
            {$sort :{"_id":-1}},
            {$limit :body.length}
        ]);
        var docs = yield cursor.toArray();
        return docs;
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })
};


exports.searchBorrow =function(body, user){
    return co(function*(){
        if(body.rdate){
            var cursor = bookCollection.aggregate([
                {$match : {
                    "reader" : user,
                    "rdate" :{"$gt":body.rdate}
                }
                },
                {$sort :{"rdate":1}},
                {$limit :body.length}
            ]);
        }
        else {
            var cursor = bookCollection.aggregate([
                {$match : {
                    "reader" : user,
                    "rdate" :{"$gt":0}
                }
                },
                {$sort :{"rdate":1}},
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


exports.searchLend =function(body, user){
    return co(function*(){
        if(body.rdate){
            var cursor = bookCollection.aggregate([
                {$match : {
                    "owner" : user,
                    "rdate" :{"$gt":body.rdate}
                }
                },
                {$sort :{"rdate":1}},
                {$limit :body.length}
            ]);
        }
        else {
            var cursor = bookCollection.aggregate([
                {$match : {
                    "owner" : user,
                    "rdate" :{"$gt":1}
                }
                },
                {$sort :{"rdate":1}},
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

exports.searchUnhandled = function(body,user){    //只有这个是-1，其他都应该不等于-1
    return co(function*(){
        if(body.id){
            var cursor = bookCollection.aggregate([
                {$match : {
                    "owner" : user,
                    "_id" :{"$lt":body.id},
                    "rdate": -1
                }
                },
                {$sort :{"_id":-1}},
                {$limit :body.length}
            ]);
        }
        else {
            var cursor = bookCollection.aggregate([
                {$match : {
                    "owner" : user,
                    "rdate": -1
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

exports.searchUnhandledReader = function(body,user){    //只有这个是-1，其他都应该不等于-1
    return co(function*(){
        if(body.id){
            var cursor = bookCollection.aggregate([
                {$match : {
                    "reader" : user,
                    "_id" :{"$lt":body.id},
                    "rdate": -1
                }
                },
                {$sort :{"_id":-1}},
                {$limit :body.length}
            ]);
        }
        else {
            var cursor = bookCollection.aggregate([
                {$match : {
                    "reader" : user,
                    "rdate": -1
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

exports.searchPublishment =function(body,user){
    return co(function*(){
        if(body.id){
            var cursor = bookCollection.aggregate([
                {$match : {
                    "owner" : user,
                    "_id" :{"$lt":body.id}
                }
                },
                {$sort :{"_id":-1}},
                {$limit :body.length}
            ]);
        }
        else {
            var cursor = bookCollection.aggregate([
                {$match : {"owner" : user}},
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

exports.count = function(id){  //可能不够严谨，什么人可以获取电话需要限制？
    return co(function*(){
        var obj = {};
        var number = yield bookCollection.count({reader: id},{limit: borrowNum});
        obj.borrow = number;
        var number = yield bookCollection.count({owner: id});
        obj.publish = number;
        var number = yield bookCollection.count({owner: id,reader:{"$ne":null}});
        obj.lend = number;
        obj.maxNum = borrowNum;
        return obj;
    }).catch(function (err) {
        console.log(err);
        return {r: '系统繁忙'};
    })
};

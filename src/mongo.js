var MongoClient = require('mongodb').MongoClient,
    ObjectId = require('mongodb').ObjectId;

var config   = require('./config.js');
var logger   = require('./logger.js');

var db;
var dtpCourseBookId = '0';
exports.dtpCourseBookId = dtpCourseBookId;

exports.init = function* () {
    // Use connect method to connect to the Server
    db = yield MongoClient.connect('mongodb://' + config.DBHost + ':' + config.DBPort +'/' + config.DBName);

    return true;
};


exports.collection = function(name){
    return db.collection(name);
};

exports.Id = function(id){
    if(id == dtpCourseBookId) return id;
    try{
        return ObjectId(id);
    }
    catch (err){
        return ObjectId(0);
    }
};
exports.timeMaxId = function(miliseconds){
    var seconds = Math.floor(miliseconds/1000);
    return exports.Id(seconds.toString(16)+'ffffffffffffffff');
    //return ObjectId.createFromTime(seconds);
};
exports.timeStamp = function(id){
    return parseInt(id.toString().substr(0,8), 16)*1000;
};

exports.close = function*(){
    yield db.close();
    return true;
};

exports.onError = function(err){
    logger.debug('mongodb op exception', err);
    logger.ex('mongodb op exception', err);
    return {r: '系统繁忙'};
};

/**
 将_id转换为toId
 */
exports.convertId = function(input, toId){
    if(Array.isArray(input)){
        return input.map(function(i){
            i[toId] = i._id;
            i._id = undefined;
            return i;
        });
    } else {
        input[toId] = input._id;
        input._id = undefined;
        return input;
    }
};

exports.extractProperty = function (array, p){
    p = p || '_id';
    return array.map(function(obj){
        return obj[p];
    });
};

exports.orderById = function(contentArray, idArray){
    var order = {};
    idArray.map((v, i) => order[v] = i);
    return contentArray.sort((a, b) => order[a._id]-order[b._id]);
};
/*
var crypto   = require('crypto');
var algorithm = 'aes128';
var secret = 'iT30 +.';
exports.encryptID = function(mongoID){
    var cipher = crypto.createCipher(algorithm, secret);
    var encrypted = cipher.update(mongoID.id, 'binary', 'hex') + cipher.final('hex');
    return encrypted;
};

exports.decryptID = function(textId){
    var decipher = crypto.createDecipher(algorithm, secret);
    var decrypted = decipher.update(textId, 'hex', 'binary') + decipher.final('binary');
    return decrypted ;
};
*/

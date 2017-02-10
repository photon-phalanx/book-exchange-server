var os = require('os');
var co = require('co'),
    mkdirp = require('co-mkdirp');

exports.HTTPPort  = 8002;

exports.DBHost    = '127.0.0.1';
exports.DBPort    = 27017;
exports.DBName    = 'bs-server';

exports.EMPTY_SCORE = -Infinity; // 必须是一个负数
exports.PARENT_SCORE_REMIND_MASK  = 1 << 21;
exports.STUDENT_SCORE_REMIND_MASK = 1 << 22;
exports.SCORE_REMIND_MASK = 3 << 21; // 前两者之和


var publicRoot    = './';
if(os.platform() == 'linux'){
    publicRoot    = '/home/public/public/';
}

if('production' != process.env.NODE_ENV){
    exports.DBName += '-test';
}
exports.dir=__dirname;
exports.publicDir=__dirname+'/public';
/*
// 相对于publicRoot
var avatarImageDir = publicRoot+'avatar/';
var courseImageDir = publicRoot+'course/';
var bookImageDir   = publicRoot+'book/';

co(function* (){
    yield [
        mkdirp(avatarImageDir),
        mkdirp(courseImageDir),
        mkdirp(bookImageDir)
    ];
}).catch(function(err){
    console.log(err);
});

exports.getAvatarImagePath = function(){
    return avatarImageDir;
};
exports.getCourseImagePath = function(){
    return courseImageDir;
};
exports.getBookImagePath = function(){
    return bookImageDir;
};
exports.getPublicRoot=function(){
    return publicRoot;
};
exports.findSuffix = function (filename){
    var i = filename.lastIndexOf('.');
    if(i > 0) return filename.slice(i);
    return '';
};
*/

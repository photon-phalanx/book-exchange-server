//var number = require('./bookmanager.js').borrowNum;
module.exports = {
    // 描述现在状态的短语：用户应该做的操作或者解释
    USER_NOT_LOGIN: '请先登录',
    USER_ALREADY_LOGIN: '正在使用中，为保障用户数据安全，请退出后再切换用户',
    USER_ID_CONTAIN_CHINESE: '暂不支持注册中文用户名',
    USER_ID_SHORTER_6: '用户名长度不能小于6',
    USER_ID_EMPTY: '用户名不能为空',
    USER_NO_ID: '用户不存在',
    USER_YOURSELF:' 不能对自己进行操作',
    USER_PASSWORD_EMPTY: '密码不能为空',
    USER_ID_PASSWORD_WRONG: '用户名不存在或密码错误',
    USER_ID_EXIST: '用户名已经存在',
    USER_OLD_PASSWORD_WRONG: '密码错误，无信息更新',

    INVALID: '非法请求',
    UNEXPECTED: '请求处理异常，请稍后再试',

    FILE_OVER_LARGE:'上传文件过大',

    BOOK_HAS_BEEN_LENDED: '书本已借出或在交易状态',
    BOOK_HAS_NOT_BEEN_LENDED: '书本未借出',
    BOOK_HAS_BEEN_RENEWED: '书本已续借',
    BOOK_NOT_EXIST: '无此书本',
    HAVE_NO_PERMISSION:'无权限',
    BOOK_NO_NEEDED: '无此需求',
    BOOK_OWNER_OPERATE: '不能对自己发布的书本进行借和送的操作',
    BOOK_OVER_LIMIT:'超过可操作数量的上限,借阅和待确认的书本总和最多为20本'
};

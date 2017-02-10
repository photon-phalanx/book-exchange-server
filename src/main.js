var express = require('express');
var co = require('co');

// var favicon = require('serve-favicon');
var logger       = require('morgan');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var cookieParser = require('cookie-parser');
//var MongoStore = require('connect-mongo')(session);

var config = require('./config.js');

var app = express();
app.use(cookieParser());
// app.use(favicon(__dirname + '/public/img/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'})); // get information from html forms
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));
app.use(express.static(config.publicDir));//用于存放照片
app.use(session({
    name: 'userid',
    resave: false,
    saveUninitialized: false,
    secret: 'bookSystem'// ,
    // cookie : {
    //     maxAge : 3600000 * 12
    // },
    // store : new MongoStore({
    //     db : 'session',
    //     defaultExpirationTime : 3600000 * 12
    // }),
    // unset : 'destroy'
}));

//app.use(express.static(config.getPublicRoot()));
//app.use('/css',express.static(__dirname+'/public/css'));
//app.use('/img',express.static(__dirname+'/public/img'));
//app.use('/js',express.static(__dirname+'/public/js'));

// CORS的问题，或许以后应该把注释掉
app.all('*', function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    next();
});



// development only
if ('development' == app.get('env')) {
  //app.use(express.errorHandler());
}

var mongo = require('./mongo.js');

function startServer() {
    co(function*() {
        if (yield mongo.init()) {
            var http = require('http');
            var user = require('./routes/user.js').router;
            var book = require('./routes/book.js').router;
            //var test = require('./routes/test.js').router;


            http.createServer(app).listen(config.HTTPPort, function () {
                console.log('Express server listening on port ' + config.HTTPPort);
            });

            app.use(function(req, res, next){
                var domain = require('domain').create();
                domain.on('error', function(err){
                    console.error('DOMAIN ERROR CAUGHT\n', err.stack);
                    try {
                        // failsafe shutdown in 5 seconds
                        setTimeout(function(){
                            console.error('Failsafe shutdown.');
                            process.exit(1);
                        }, 5000);

                        // disconnect from the cluster
                        var worker = require('cluster').worker;
                        if(worker) worker.disconnect();

                        // stop taking new requests
                        server.close();

                     //   try {
                            // attempt to use Express error route
                      //      next(err);
                     //   } catch(error){
                            // if Express error route failed, try
                            // plain Node response
                     //       console.error('Express error mechanism failed.\n', error.stack);
                            res.statusCode = 500;
                            res.setHeader('content-type', 'text/plain');
                            res.end('Server error.');
                     //   }
                    } catch(error){
                        console.error('Unable to send 500 response.\n', error.stack);
                    }
                });

                // add the request and response objects to the domain
                domain.add(req);
                domain.add(res);

                domain.run(next);
            });


            app.use('/user', user);
            app.use('/book', book);
            app.get('/',function(req,res){
                res.sendFile('/public/index.html');
            });
          //  app.use('/test', test); //仅个人测试使用，无实际用处
        } else console.log('mongodb init failed!');
    }).catch(function (err) {
        console.log(err);
    });

}

if(require.main === module){
    startServer();
}else {
    module.exports = startServer;
}

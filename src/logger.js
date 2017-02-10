var winston = require('winston');

var myCustomLevels = {
    debug: 0,
    ex: 4
};

module.exports = new (winston.Logger)({
    levels: myCustomLevels,
    transports: [
        new (winston.transports.Console)({
            level: 'debug'
        }),
        new (winston.transports.File)({
            name: 'ex',
            filename: 'ex.log',
            level: 'ex'
        })
    ]
});


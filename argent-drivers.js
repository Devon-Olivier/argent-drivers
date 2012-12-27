var nlcbLottoplusDriver = require('./lottoplus/nlcb.js');
var mongoLottoplusDriver = require('./lottoplus/mongo.js');
var errors = require('./lib/errors.js');

var moment = require('moment');

var lottoplus = {
  nlcb: nlcbLottoplusDriver,
  mongo: mongoLottoplusDriver
};

exports.lottoplus = lottoplus;
exports.moment = moment;
exoprts.errors = errors;

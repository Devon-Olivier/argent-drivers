var nlcbLottoplusDriver = require('./lottoplus/nlcb.js');
var mongoLottoplusDriver = require('./lottoplus/mongo.js');

var lottoplus = {
  nlcb: nlcbLottoplusDriver,
  mongo: mongoLottoplusDriver
};

exports.lottoplus = lottoplus;

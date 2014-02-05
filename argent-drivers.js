var nlcb = require('./lottoplus/nlcb.js');
var mongo = require('./lottoplus/mongo.js');
var errors = require('./lib/errors.js');

var lottoplus = {
  nlcb: nlcb,
  mongo: mongo
};

exports.lottoplus = lottoplus;
exports.errors = errors;

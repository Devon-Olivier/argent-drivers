var util = require('util');

exports.NETWORK = function NETWORK(message, details){
  //Error.call(this, message); //not sure why this doesn't work. The message
  //does not become a property of the object.
  Error.call(this);
  this.message = message;
  this.details = details;
};
util.inherits(exports.NETWORK, Error);

exports.DATABASE = function DATABASE(message, details){
  Error.call(this);
  this.message = message;
  this.details = details;
};
util.inherits(exports.DATABASE, Error);

exports.NODRAW = function NODRAW(message, drawNumber){
  Error.call(this);
  this.message = message;
  this.details = drawNumber;
};
util.inherits(exports.NODRAW, Error);

exports.NODRAWSINRANGE = function NODRAWSINRANGE(message, range){
  Error.call(this);
  this.message = message;
  this.details = range;
};
util.inherits(exports.NODRAWSINRANGE, Error);

exports.DRAWPARSE = function DRAWPARSE(message, details){
  Error.call(this);
  this.message = message;
  this.details = details;
};
util.inherits(exports.DRAWPARSE, Error);

exports.PARTIALRESULTS = function PARTIALRESULTS(message, details){
  Error.call(this);
  this.message = message;
  this.details = details;
};
util.inherits(exports.PARTIALRESULTS, Error);

//TODO should be exports.FATAL
exports.FATALERROR = function FATALERROR(message, details){
  Error.call(this);
  this.message = message;
  this.details = details;
};
util.inherits(exports.FATALERROR, Error);

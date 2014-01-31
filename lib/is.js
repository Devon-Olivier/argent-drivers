var DUTILS = require('./utils');
var MOMENT = require('moment');
/**
 * isNumberRange: value -> take any value and return true if the value is
 * an object with `start` and `end` properties that are numeric.
 **/
var isNumberRange = function isNumberRange(value) {
  return DUTILS.isNumeric(value.start) && DUTILS.isNumeric(value.end);
};

/**
 * isDatish: value -> take any value and return true if the value can represent
 * a date.
 **/
var isDatish = function isDatish(value) {
  if (null === value || undefined === value) {
    return false;
  }
  if ('object' === typeof value) {
    if (Array.isArray(value)) {
      return MOMENT(value).isValid();
    }
    return value instanceof Date;
  }
  return MOMENT(value).isValid();
};

/**
 * isDatishRange: value -> take any value and return true if the value is
 * an object with `start` and `end` properties that are datish.
 **/
var isDatishRange = function isDatishRange(value) {
  return isDatish(value.start) &&  isDatish(value.end);
};

exports.numberRange = isNumberRange;
exports.datish = isDatish;
exports.datishRange = isDatishRange;

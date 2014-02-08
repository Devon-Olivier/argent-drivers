var isNumber = function isNumber(n){
  if(Number.isFinite){
    return Number.isFinite(n);
  }
	return isFinite(n) && (typeof n) === 'number';
};

/**
 * Taken from the jquery source code
 * https://github.com/jquery/jquery/blob/master/src/core.js
 * isNumeric: value -> boolean
 * Consume any javascript value and produce true if it represents a number.
 * @param value any javascript value.
 **/
var isNumeric =  function isNumeric( value ) {
  // parseFloat NaNs numeric-cast false positives (null|true|false|"")
  // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
  // subtraction forces infinities to NaN
  return value - parseFloat( value ) >= 0;
};

//var isDigit = function(char){
//	var charAsNum = +char;//coerce char to a Number
//	return isNumber(charAsNum) && 0 <= charAsNum && charAsNum < 10;
//};

//another way using regular expressions
var isDigit = function isDigit(char){
  return (/^[0-9]$/).test(char);
};

/**********************************************************************
 * return an array of integers from start to end, ie
 * [start, end]. 
 * If end is undefined or null return rangeArray(0, start);
 **********************************************************************/
var rangeArray = function rangeArray(start, end){
  var rangeArr = [];
  if(!(isNumeric(start) && isNumeric(end)) ) {
    throw new TypeError('Expected numeric arguments. Got: ', start, ' and ', end);
  }

  start = +start;
  end = +end;
  if(end === undefined || end === null)
  {
    end = start;
    start = 0;
  }
  for(var i = start; i <= end; i++)
  {
    rangeArr.push(i);
  }
  return rangeArr;
};

/**********************************************************************
 * map(arr, func) -> image of func using the ordered pairs of arr 
 * (viewed as a sequence) as domain.
 **********************************************************************/
var mapPairs = function mapPairs(arr, func){
  //TODO: make sure arr is an array and func is a function
  var image = [];
  for(var i = 0; i < arr.length; i++)
  {
    image[i] = func(i, arr[i]);
  }
  return image;
};

/**********************************************************************
 * If str is a valid 24hr substring returns true and false otherwise. 
 **********************************************************************/ 
var hundredHrString = function(str){
  var regexps = [/^[0-2]$/, /^([01]\d|2[0-3])$/, /^([01]\d|2[0-3]):$/, /^([01]\d|2[0-3]):[0-5]$/, /^([01]\d|2[0-3]):[0-5]\d$/];
  if(regexps.length < str.length)
  {
    return false;
  }
  else
  {
    return regexps[str.length-1].test(str);
  }
};

/**********************************************************************
 * Converts arguments variables to true arrays.
 **********************************************************************/ 
var argumentsToArray = function argumentsToArray(args){
  return [].slice.call(args);
};

/**********************************************************************
 * asyncMap: Map asyncFunction over arr.
 * @param arr an array of values to be mapped
 * @param asyncFunction the asynchronous function to be mapped
 * 
 * asyncMapCallback is called with an array containing the results
 * of calling asyncFunction on each element.
 * if 'results' is the array containing the results given to 
 * asyncMapCallback, then 
 *        results[i] is the results of calling asyncFunction(arr[i]) 
 **********************************************************************/ 
var asyncMap = function asyncMap(arr, asyncFunction, asyncMapCallback){
  var results = [];
  var count = 0;
  arr.forEach(function(value, index){
    asyncFunction(value, function(){
      count--;
      results[index] = argumentsToArray(arguments);
      if(count === 0){
        asyncMapCallback(results);
      }
    });
    count++;
  });
};
exports.mapPairs = mapPairs;
exports.hundredHrString = hundredHrString;
exports.rangeArray = rangeArray;
exports.isDigit = isDigit;
exports.isNumber = isNumber;
exports.isNumeric = isNumeric;
exports.asyncMap = asyncMap;
exports.argumentsToArray = argumentsToArray;

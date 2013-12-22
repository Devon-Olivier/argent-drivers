/************************************************************
 * File: lottoplus.nlcb.js
 * Author: Devon Olivier
 * Year: 2012
 * Purpose: Manages connections and CRUD requests to the lottoplus
 * 	    nlcb database 
 * Platform: node.js
 ***********************************************************/
var JQUERYPATH = '../lib/jquery.js';

//native node modules
var HTTP = require('http');
var QUERYSTRING = require('querystring');

//external node modules
var Q = require('q');
var JSDOM = require('jsdom');
var MOMENT = require('moment');

//native argent modules
var ERROR = require('../lib/errors.js');
var secretaryMaker = require('../lib/secretary.js');
var devonUtil = require('../lib/utils.js');

/************************************************************
 * TODO fix documentation
 * getDrawDateRange(range, drawDateRangeCallback) calls 
 * drawDateRangeCallback with the draws whose dates are 
 * within the range specified by 'range'. The draws passed on to 
 * drawDateRangeCallback shall have dates greater than or equal to
 * the start boundary of the range, and less than the end
 * boundary of the range. i.e. all dates in [start, end).
 * 
 * @param range is an object with properties 'start' and 'end'.
 * Each of these is an object is a Moment 
 * see http://momentjs.com/docs/. The 'start' Moment represents
 * the start boundary of the date range and the 'end' Moment
 * represents the end boundary of the date range.
 * 
 * @param drawDateRangeCallback is called with an array 
 * containing the draws with dates in range if one exists
 * and [] otherwise.
 *
 *
 * getDrawNumberRange calls drawNumberRangeCallback with the draws 
 * whose numbers are within the range specified by 'range'. The 
 * draws passed on to drawNumberRangeCallback shall have numbers 
 * greater than or equal to the start boundary of the range, and 
 * less than the end boundary of the range. i.e. all draw numbers in 
 * [start, end).
 *
 * @param range is an object with properties 'start' and 'end'
 * representing the start and end boundaries of the range
 * respectively.
 *
 * @param drawNumberRangeCallback is called with an array containing 
 * the draws with numbers in range if one exists and [] 
 * otherwise.
 *
 *
 * close closes the database connection
 ***********************************************************/
// a Draw is an Object with the following properties
// number: the draw number
// date: Date object representing the date for this draw
// numbersPlayed: an array of numbers played for this draw
// jackpot: a number representing the jackpot for this draw
// numberOfWinners: a number representing the number of winners for the draw

/**
 * _parsDrawHtml: String -> Draw
 * @param html the html returned from an http post request to nlcb.co.tt/search/<...>
 * @return a promise for a Draw representing the draw from html
 * given:
 *  <table>
 *    <tbody>
 *      <tr> <td>Stupid header with colspan=2</td> </tr>
 *      <tr> <td>Draw #</td> <td>1190</td> </tr>
 *      <tr> <td>Date</td> <td>01-Dec-12</td> </tr>
 *      <tr> <td>Numbers</td> <td> 20, 26, 28, 32, 34 -PB: 8</td> </tr>
 *      <tr> <td>Jackpot</td> <td> $4,987,528.04</td> </tr>
 *      <tr> <td># Winners</td> <td>0</td> </tr>
 *    </tbody>
 *  </table>
 *  expect:
 *  {
 *    number: 1190,
 *    date: new Date('2013 12 1'),
 *    numbersPlayed: [20, 25, 28, 32, 34, 8],
 *    jacpot: 4987528.04,
 *    numberOfWinners: 0
 *  };
 **/

var _parseDrawHtml = function _parseDrawHtml(html){
  //We are receiving bad html which fails when wrapped 
  //by $ so we take out the table fragment and proceed
  //from there
  /**
   * tableHtml: String -> String
   * take the bad html returned by nlcb and return the table fragment of the html
   * @param theHtml the bad html
   * @return the table html code fragment from the bad html if it exists or null
   * otherwise
   **/
  var tableHtml = function tableHtml(theHtml){
    var tableStartMatch = theHtml.match(/<\s*table/i);
    var tableEndMatch = theHtml.match(/<\s*\/\s*table\s*>/i);
    var tableCode = !tableStartMatch || !tableEndMatch?
      null:
      theHtml.substring(tableStartMatch.index, tableEndMatch.index + tableEndMatch[0].length);
    return tableCode;
  };
  
  /**
   * parse: Error Window -> Draw 
   * @param errors errors passed to parse from a jsdom.env call
   * @param window an object representing the dom window object
   * @return a Draw object representing the draw information from
   * the table in the dom window object
   **/
  var parse = function parse(errors, window){
    var parseNumber = function parseNumber(tds){
      //TODO: we probably didn't have to wrap these again
      //	but it is the only way I know how for now
      //console.log(tds[2]);
      var number = $(tds[2]).text().match(/\d+/);
      if(number === null){
        return null;
      }
      //return number && +number[0];
      return +number[0];
    };

    var parseDate = function parseDate(tds){
      //TODO: Handle errors
      return new Date($(tds[4]).text());
    };

    var parseNumbersPlayed = function parseNumbersPlayed(tds){
      var numbersPlayed = $(tds[6]).text().match(/\d+/g);
      if(numbersPlayed === null) {
        return null;
      }
      return numbersPlayed.map(function(n){ return +n;});
    };

    var parseJackopt = function parseJackopt(tds){
      var jackpot = $(tds[8]).text(); 
      jackpot = jackpot.replace(/,\s*/g, '');
      jackpot = jackpot.match(/\d+\.\d+/);
      if(!jackpot){
        return null;
      }
      jackpot = +jackpot[0];

      //sometimes nlcb reports jackpots less than 10 we assume that these
      //are measured in millions
      if(jackpot < 10){
        jackpot *= 1000000;
      }
      return jackpot;
    };

    var parseNumberOfWinners = function parseNumberWinners(tds){
      //TODO: Handle errors
      return +$(tds[10]).text().match(/\d+/); 
    };

    var $ = window.$;
    var wrappedTds = $('td');
    if(wrappedTds.length < 10){
      deferred.reject(new ERROR.DRAWPARSE('Unexpected draw format'));
    }
    else {
      var draw = {};
      draw.number = parseNumber(wrappedTds);
      draw.date = parseDate(wrappedTds);
      draw.numbersPlayed = parseNumbersPlayed(wrappedTds);
      draw.jackpot = parseJackopt(wrappedTds);
      draw.numberOfWinners = parseNumberOfWinners(wrappedTds);
      if(null === draw.number) {
        deferred.reject(new ERROR.DRAWPARSE('Unexpected draw number format'));
      }
      else if (null === draw.date) {
        deferred.reject(new ERROR.DRAWPARSE('Unexpected draw date format'));
      }
      else if (null === draw.numbersPlayed) {
        deferred.reject(new ERROR.DRAWPARSE('Unexpected draw number list format'));
      }
      else if (null === draw.jackpot) {
        deferred.reject(new ERROR.DRAWPARSE('Unexpected draw jackpot format'));
      }
      else if (null === draw.numberOfWinners) {
        deferred.reject(new ERROR.DRAWPARSE('Unexpected draw number of winners format'));
      }
      else {
        deferred.resolve(draw);
      }
    }
  };

  var deferred = Q.defer();
  html = tableHtml(html);

  //if we didn't get a table in the html we assume that
  //the draw does not exist.
  if(html === null){
    deferred.reject(new ERROR.NODRAW());
  }
  else {
    JSDOM.env(html, [JQUERYPATH], parse);
  }
  return deferred.promise;
};
exports.parseDrawHtml = _parseDrawHtml;
/*-----------------------OLD IMPLEMENTATION-------------------
  exports.createDriver = function createDriver(driverOptions){
  var _adapter = Object.create(secretaryMaker.createSecretary());

//TODO _getDrawDate and _getDrawNumber have common logic
//TODO _getDrawNumberRange and _getDrawDateRange have common logic
//Abstract away!!!
var _getDrawDate = function(aMoment, drawDateCallback){
var nlcbDate = {
day: aMoment.format("DD"), 
month: aMoment.format("MMM"), 
year: aMoment.format("YY")
};

var postData = querystring.stringify(nlcbDate);
//TODO should come from settings file like mongo adapter
//OR should it?
var options = {
host: 'www.nlcb.co.tt',
port: 80,
path: '/search/lottoplus/cashQuery.php',
method: 'POST',
headers: {
'Content-Type': 'application/x-www-form-urlencoded',
//'content-length': postData.length,
'Connection': 'keep-alive'
}
}; 

var html = "";
var httpRequest = http.request(options, function(res){
res.setEncoding('utf8');
res.on('data', function(chunk){
html+=chunk;
});

res.on('end', function(){
//TODO handle other possible errors from _parseDrawHtml
_parseDrawHtml(html,function(error, draw){
if(error instanceof ERROR.NODRAW){
error.message = 'Draw does not exist';
error.details = aMoment.toDate();
}
drawDateCallback(error, draw); 
});
});
});
httpRequest.end(postData);

//Listen for HTTP errors
httpRequest.on('error',function(e){
var networkError = new ERROR.NETWORK('HTTP error', e);
drawDateCallback(networkError, null);
});
};

var _getDrawNumber = function _getDrawNumber(number, drawNumberCallback){
var postData = querystring.stringify({'drawno': number});
var options = {
host: 'www.nlcb.co.tt',
port: 80,
path: '/search/lottoplus/FindDraw.php',
method: 'POST',
headers: {
'Content-Type': 'application/x-www-form-urlencoded',
'Connection': 'keep-alive'
}
}; 

var html = "";
var httpRequest = http.request(options, function(res){
res.setEncoding('utf8');
res.on('data', function(chunk){
  html+=chunk;
});

res.on('end', function(){
  //TODO handle other possible errors from _parseDrawHtml
  _parseDrawHtml(html,function(error, draw){
    if(error instanceof ERROR.NODRAW){
      error.message = 'Draw does not exist';
      error.details = number;
    }
    drawNumberCallback(error, draw); 
  });
});
});

httpRequest.end(postData);

//Listen for HTTP errors
httpRequest.on('error',function(e){
  var networkError = new ERROR.NETWORK('HTTP error', e);
  drawNumberCallback(networkError, null);
});
};

var _isAllNoDraw = function _isAllNoDraw(errors){
  return errors.every(function isNoDraw(error){
    return error instanceof ERROR.NODRAW;
  });
}

var _getDrawDateRange = function _getDrawDateRange(range, _drawDateRangeCallback){
  //TODO: validate range

  //console.log('driver.getDrawDateRange:', range);
  var numberOfDaysInRange = range.end.diff(range.start, "days");
  var dates = devonUtil.rangeArray(numberOfDaysInRange - 1).map(function(number){
    return range.start.clone().add('days', number);
  });

  devonUtil.asyncMap(dates, _getDrawDate, function(asyncMapResults){
    var errors = [];
    var results = [];
    var error;
    asyncMapResults.forEach(function(result, index){
      if(result[0] !== null){
        errors.push(result[0]);
      }
      else{
        results.push(result[1]);
      }
    });

    //if no errors
    if(errors.length === 0){
      error = null;
      //console.log('getDrawDateRange: no errors...');
    }
    else{
      //console.log('we have errors deciding what to do');
      //if all draws are ERROR.NODRAW
      if(_isAllNoDraw(errors)){
        //if no draws were returned
        if(results.length === 0){
          //console.log('getDrawDateRange: everything alright...no draws in range');
          error = new ERROR.NODRAWSINRANGE('All draws in range do not exist', range);
        } 
        else{
          //some draws in range didn't exist... we are still ok
          //console.log('getDrawDateRange: everything alright...some draws in range do not exist.');
          //TODO consider returning some error which say that some of the draws didn't exist
          error = null;
        }
      }
      else{ //some errors are not ERROR.NODRAW errors
        if(results.length === 0){//if no draws returned then we can't say if the draws exist or not
          //console.log('getDrawDateRange: cannot determine if every draw exist');
          error = new ERROR.FATALERROR('Cannot get any draws', errors);
        }
        else{//if some draws are returned and we have non ERROR.NODRAW errors, then
          //we must assume that what we have is a partial result set. The draws that 
          //returned non ERROR.DRAW errors may exist!!.
          //console.log('getDrawDateRange: got some draws but not sure if there are any more due to errors');
          error = new ERROR.PARTIALRESULTS('Partial draws', errors);
        }
      }
    }

  _drawDateRangeCallback(error, results); 
  });
}; 

var _getDrawNumberRange = function _getDrawNumberRange(range, _drawNumberRangeCallback){
  //TODO: ensure that range is correct type
  //TODO consider using some sort of assert library here

  //TODO clients should ensure that they pass correct range and we should throw here. Or should we?
  //var rangeError; 
  //TODO we should have a function line range.length()
  //if(range.end - range.start <= 0){
  //  var rangeError = new RangeError('range.end <= range.start');
  //  rangeError.details = range;
  //  return _drawNumberRangeCallback(rangeError, null);
  //}

  //console.log('getDrawDateRange: ...');
  devonUtil.asyncMap(devonUtil.rangeArray(range.start, range.end-1) , _getDrawNumber, function(asyncMapResults){
    var errors = [];
    var results = [];
    var error;
    asyncMapResults.forEach(function(result, index){
      if(result[0] !== null){
        errors.push(result[0]);
      }
      else{
        results.push(result[1]);
      }
    });

    //if no errors
    if(errors.length === 0){
      error = null;
      //console.log('getDrawDateRange: no errors...');
    }
    else{
      //console.log('we have errors deciding what to do');
      //if all draws are ERROR.NODRAW
      if(_isAllNoDraw(errors)){
        //if no draws were returned
        if(results.length === 0){
          console.log('getDrawNumberRange: everything alright...no draws in range');
          error = new ERROR.NODRAWSINRANGE('All draws in range do not exist', range);
        } 
        else{
          //some draws in range didn't exist... we are still ok
          console.log('getDrawNumberRange: everything alright...some draws in range do not exist.');
          error = null;
        }
      }
      else{ //some errors are not ERROR.NODRAW errors
        if(results.length === 0){//if no draws returned then we can't say if the draws exist or not
          console.log('getDrawNumberRange: cannot determine if every draw exist');
          error = new ERROR.FATALERROR('Cannot get any draw', errors);
        }
        else{//if some draws are returned and we have non ERROR.NODRAW errors, then
          //we must assume that what we have is a partial result set. The draws that 
          //returned non ERROR.DRAW errors may exist!!.
          console.log('getDrawNumberRange: got some draws but not sure if there are any more due to errors');
          error = new ERROR.PARTIALRESULTS('Partial draws', errors);
        }
      }
    }

  _drawNumberRangeCallback(error, results); 
  });
}; 

_adapter.getDrawDate = function getDrawDate(aMoment, drawDateCallback){
  var job = function job(jobCallback){
    _getDrawDate(aMoment, jobCallback);
  };
  this.doJob(job, drawDateCallback);
};

_adapter.getDrawDateRange = function getDrawDateRange(range, drawDateRangeCallback){
  var job = function job(jobCallback){
    _getDrawDateRange(range, jobCallback);
  };
  this.doJob(job, drawDateRangeCallback);
};

_adapter.getDrawNumber = function getDrawNumber(number, drawNumberCallback){
  var job = function job(jobCallback){
    _getDrawNumber(number, jobCallback);
  };
  this.doJob(job, drawNumberCallback);
};

_adapter.getDrawNumberRange = function getDrawNumberRange(range, drawNumberRangeCallback){
  var job = function job(jobCallback){
    _getDrawNumberRange(range, jobCallback);
  };
  this.doJob(job, drawNumberRangeCallback);
};

_adapter.close = function close(closeCallback){
  closeCallback();
};
return _adapter; 
}; 

//TODO make this available to clients 
//as an external library maybe?
var _parseDrawHtml = function _parseDrawHtml(html, parseCallback){
  //We are receiving bad html which fails when wrapped 
  //by $ so we take out the table fragment and proceed
  //from there
  var tableStartMatch = html.match(/<\s*table/i);
  var tableEndMatch = html.match(/<\s*\/\s*table\s*>/i);
  var tableHtml;//initialised in the else of the following if 
  var parseError;


  //TODO there is a better way to tell that a draw does not exist
  //we could check the html for the string returned by nlcb.co.tt
  //when a draw does not exist. FIX THIS
  //UPDATE: this seems harder than at first since the message returned
  //for a draw that does not exist is not standard on nlcb.co.tt
  if(!tableStartMatch || !tableEndMatch) {
    parseError = new ERROR.NODRAW();
    parseCallback(parseError, null);
  }
  else {
    tableHtml = html.substring(tableStartMatch.index, tableEndMatch.index + tableEndMatch[0].length);
    jsdom.env(tableHtml, 
        ['../lib/jquery.js'],//it turns out that using a local copy is faster
        function(errors, window){
          //TODO handle errors
          var $ = window.$;
          var wrappedTds = $('td');
          var draw = {};
          //TODO: encapsulate these into functions
          //TODO: we probably didn't have to wrap these again
          //	but it is the only way I know how for now
          draw.number = +$(wrappedTds[2]).text().match(/\d+/g)[0];//we didn't need the 'g' i tink
          draw.date = new Date($(wrappedTds[4]).text());
          draw.numbersPlayed = $(wrappedTds[6]).text().match(/\d+/g).map(function(n){ return +n;});

          draw.jackpot = $(wrappedTds[8]).text(); 
          var jackpotMillionRegexp =  /.*\$(\d+)\s*Million/i;
          var jackpotCommaRegexp = /(\d+[,\s]+)*(\d+)(\.\d+)?/g;
          if(jackpotMillionRegexp.test(draw.jackpot)){
            //TODO fix the following line what if the jackpot is 7 Million or just 7
            //TODO  We should assume that a single digit jackpot, j, means a jackpot of jx10^6
            draw.jackpot = draw.jackpot.replace(jackpotMillionRegexp, '$1000000');
            draw.jackpot = +draw.jackpot;
          }
          else if(jackpotCommaRegexp.test(draw.jackpot)){
            draw.jackpot = draw.jackpot.match(jackpotCommaRegexp)[0];
            draw.jackpot = +draw.jackpot.replace(/[,\s]+/g, "");
          }
          else//format of jackpot unexpected
          {
            //TODO consider passing the partially parsed draw and the jackpot that gave the
            //error in an Error object
            var parseError = new ERROR.DRAWPARSE('unexpected format', tableHtml);
            parseCallback(parseError, null);
          }

          draw.numberOfWinners = +$(wrappedTds[10]).text().match(/\d+/g)[0]; 
          parseCallback(null, draw);
        });
  }
};
*/


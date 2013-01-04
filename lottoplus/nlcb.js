/************************************************************
 * File: lottoplus.nlcb.js
 * Author: Devon Olivier
 * Year: 2012
 * Purpose: Manages connections and CRUD requests to the lottoplus
 * 	    nlcb database 
 * Platform: node.js
 ***********************************************************/
//TODO give these names that would make them easily distinguishable
//as globals
//native modules
var http = require('http');
var querystring = require('querystring');

//external modules
var jsdom = require('jsdom');
var moment = require('moment');

//local modules
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
            error.details = aMoment;
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

  _adapter.getDrawDate(aMoment, drawDateCallback){
    var job = function job(jobCallback){
      _getDrawDate(aMoment, jobCallback);
      this.doJob(job, drawDateCallback);
    };
  };

  _adapter.getDrawDateRange = function(range, drawDateRangeCallback){
    var job = function job(jobCallback){
      _getDrawDateRange(range, jobCallback);
    };
    this.doJob(job, drawDateRangeCallback);
  };

  _adapter.getDrawNumber(number, drawNumberCallback){
    var job = function job(jobCallback){
      _getDrawNumber(number, jobCallback);
      this.doJob(job, drawNumberCallback);
    };
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

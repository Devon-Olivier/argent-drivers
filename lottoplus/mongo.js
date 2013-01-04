/************************************************************
 * File: lottoplus.mongo.js
 * Author: Devon Olivier
 * Year: 2012
 * Purpose: Manages connections and CRUD requests to the lottoplus
 * 	    mongo database 
 * Platform: node.js
 ***********************************************************/
'use strict'
//TODO give these names that would make them easily distinguishable
//as globals
//native modules
var http = require('http');
var events = require('events');

//external modules
var moment = require('moment');
var mongoskin = require('mongoskin');

//local modules
var secretaryMaker = require('../lib/secretary.js');
var devonUtil = require('../lib/utils.js');
var ERROR = require('../lib/errors.js');

/************************************************************
 * TODO fix docs
 * storeDraws(draws, storeDrawsCallback) stores all the draws in draws in the
 * associated database.
 *
 * @param draws an array of draw objects.
 *
 * @param storeDrawsCallback is called with after the store is complete with
 * an error object, which is null if no errors occured during the attempted 
 * store.
 *
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
exports.createDriver = function createDriver(options){
  var _mongoConnectionString = "";

  if(!options.username){
    _mongoConnectionString = "mongodb://" + options.address;
  }
  else{
    //TODO if no password what should we do??
    _mongoConnectionString = "mongodb://" +
      options.username +
      ":" +
      options.password +
      "@" + 
      options.address;
  }
  
  //TODO we should check whether the database correctly opens connection
  var _lottoplusDB = mongoskin.db(_mongoConnectionString);

  var _adapter = Object.create(secretaryMaker.createSecretary());


  //TODO getDrawDateRange and getDrawNumberRange have common logic
  //ABSTRACT AWAY!!
  _adapter.getDrawDate = function getDrawDate(aMoment, drawDateCallback){
    var date = aMoment.toDate();
    var queryObject = {'date': date};
    var job = function(jobCallback){
      _lottoplusDB.collection('draws').findOne(queryObject, function findCallback(error, draw){
        if(error){
          jobCallback(new ERROR.DATABASE('mongo query error', error), null);
          return;
        }
        if(draw === null){
          jobCallback(new ERROR.NODRAW('draw does not exist', date), null);
          return;
        }
        jobCallback(null, draw);
      });
    };
    this.doJob(job, drawDateCallback);
  };

  _adapter.getDrawDateRange = function getDrawDateRange(range, drawDateRangeCallback){
    //TODO: ensure that range is correct type
    var startDate = range.start.toDate();
    var endDate = range.end.toDate();
    var drawDateRangeCallbackError = null;

    var queryObject = {'date': {$gte: startDate, $lt: endDate}};
    var job = function(callback){
      _lottoplusDB.collection('draws').find(queryObject, function findCallback(error, findCursor){
        console.log('draws.find: ', error);
        if(error){
          drawDateRangeCallbackError = new ERROR.DATABASE('mongodb query error', error);
          callback(drawDateRangeCallbackError, null); 
        }
        else{
          findCursor.toArray(function toArrayCallback(error, draws){
            console.log('toArray error: ', error);
            if(error){
              drawDateRangeCallbackError = new ERROR.DATABASE('mongodb query error', error);
              callback(drawDateRangeCallbackError, null); 
              return;
            }

            if(draws.length === 0){
              drawDateRangeCallbackError = new ERROR.NODRAWSINRANGE('All draws in range do not exist', range);
              callback(drawDateRangeCallbackError, null); 
              return;
            }
            callback(drawDateRangeCallbackError, draws); 
          });
          //TODO what other errors?
        }
      });
    };
    this.doJob(job, drawDateRangeCallback);
  };

  _adapter.getDrawNumber = function getDrawNumber(number, drawNumberCallback){
    var queryObject = {'number': number};
    var job = function(jobCallback){
      _lottoplusDB.collection('draws').findOne(queryObject, function findCallback(error, draw){
        if(error){
          jobCallback(new ERROR.DATABASE('mongo query error', error), null);
          return;
        }
        if(draw === null){
          jobCallback(new ERROR.NODRAW('draw does not exist', number), null);
          return;
        }
        jobCallback(null, draw);
      });
    };
    this.doJob(job, drawNumberCallback);
  };

  _adapter.getDrawNumberRange = function getDrawNumberRange(range, drawNumberRangeCallback){
    //TODO: we should make sure the start and end are positive INTEGERS
    var rangeStart = +range.start;
    var rangeEnd = +range.end;
    var drawNumberRangeCallbackError = null;

    //TODO consider using an assert library or something here and disable it in production code
    if(!devonUtil.isNumber(rangeStart)  || rangeStart <= 0){
      throw new TypeError("'range.start' should be coerceable to a number");
    }
    else{
      if(!devonUtil.isNumber(rangeEnd) || rangeStart <= 0){
        throw new TypeError("'range.end' should be coerceable to a number");
      }
      else{
        var queryObject = {'number': {$gte: rangeStart, $lt: rangeEnd}};

        var job = function(callback){
          _lottoplusDB.collection('draws').find(queryObject).toArray(function toArrayCallback(error, draws){
            if(error){
              drawNumberRangeCallbackError = new ERROR.DATABASE('mongodb query error', error);
            }
            else{
              if(draws.length === 0){
                drawNumberRangeCallbackError = new ERROR.NODRAWSINRANGE('All draws in range do not exist', range);
              }
            }
          callback(drawNumberRangeCallbackError, draws); 
          });
        };
        this.doJob(job, drawNumberRangeCallback);
      }
    }
  };

  //TODO handle errors
  _adapter.storeDraws = function(draws, storeDrawsCallback){
    var job = function(callback){
      _lottoplusDB.collection('draws').insert(draws, callback)
    };
    this.doJob(job, storeDrawsCallback);
  }

  //TODO consider treating driver as a state machine.
  //States include disconnected, querying, disconnecting...
  var _closed = false;
  var _setUpToClose = false;//are we waiting for an event to happen in order to close
  _adapter.close= function(closeCallback){
    if(_closed){
      //console.log("[mongo adapter]: database closed already");
      closeCallback();
    }
    else{
      //console.log("[mongo adapter]: database not closed");
      if(!this.hasMoreJobs()){
        //console.log("[mongo adapter]: no more queries going to close database now");
        _lottoplusDB.close(function(){
          _closed = true;
          //console.log("[mongo adapter]: database closed");
          closeCallback();
        });
      }
      else{
        //if not setup to close already do so now
        if(!_setUpToClose){//
          //console.log("[mongo adapter]: setting up adapter to close connection");
          var self = this;
          this.once('no more jobs', function(){
            //console.log("[mongo adapter]: adapter not setup to close any more");
            _setUpToClose = false;
            this.close(closeCallback);
          });
          //console.log("[mongo adapter]: adapter setup to close");
          _setUpToClose = true;
        }
        else{
          //console.log("[mongo adapter]: adapter already setup to close");
        }
      }
    }
  }; 
  return _adapter; 
}; 

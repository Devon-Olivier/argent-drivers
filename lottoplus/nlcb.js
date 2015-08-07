/************************************************************
 * File: nlcb.js
 * Author: Devon Olivier
 * Year: 2015
 * Purpose: Manages connections and read requests to the lottoplus
 * nlcb database at nlcb.co.tt
 * Platform: iojs
 ***********************************************************/
'use strict';
var consoleLog = function () {};
var consoleError = function () {};
module.exports = function(debug) {
  if(debug) {
    consoleLog = console.log;
    consoleError = console.error;
  }
};

//native node modules
const HTTP = require('http');
const QUERYSTRING = require('querystring');
const URL = require('url');

//external node modules
const MOMENT = require('moment');
require('twix');
const LODASH = require('lodash');

//native argent modules
const TYPE = require('./type.js');
const ERRORNAMES = require('./error-names.js');
const NLCBCONF = require('../config/nlcb-conf.json');
const PARSE = require ('./parser.js').parse;
const STORE = require('./table.js').store;
const RETRIEVE = require('./table.js').retrieve;
const MAKETABLE = require('./table.js').makeTable;
/** 
 * a Draw is an Object with the following properties
 * drawNumber:  the draw number
 * drawDate: Date object representing the date for this draw
 * numbersDrawn: an array of numbers played for this draw such
 *                that numbersDrawn[5] is the powerball of the
 *                draw
 * drawjackpot: number representing the jackpot for this draw
 * numberOfWinners: a number representing the number of 
 *                  winners for the draw
 **/

/**
 * requestHtml: options -> promise
 * make http request and return a promise for the html sent back. Options
 * specified in @param options.
 *
 * TODO: improve the documentation of the options parameter
 * @param options an object with properties corresponding to the host, path, 
 * query string, port, http verb, headers etc. for the request. 
 **/
var requestHtml = function requestHtml(options) {

  return new Promise(function (resolve, reject) {
    var httpRequest = HTTP.request(options, function (res) {
      var html = "";
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        html += chunk;
      });

      res.on('end', function () {
        resolve(html);
      });
    });

    httpRequest.on('error', function (e) {
      reject(e);
    })

    httpRequest.end(options.queryString);
  });

};

var installNlcbGet = function installNlcbGet(table) {

  /**
   * getNumber: number -> promise
   * Consume a number and returns a promise for the draw with
   * a number property corresponding to that number.
   * @param number a draw number
   **/
  var getNumber = function getNumber(number) {
    var options = {
      host: NLCBCONF.host,
      port: NLCBCONF.port,
      method: NLCBCONF.method,
      headers: NLCBCONF.headers,
      path: NLCBCONF.getDrawNumberPath,
      queryString: QUERYSTRING.stringify({drawnum: number})
    };

    return requestHtml(options).then(PARSE);
  };
  STORE(table, 'number', getNumber);

  /**
   * getNumberRange: Number-range bePersistent -> promise
   * Consumes an Object with properties 'start' and 'end', that are
   * Number, return a promise for an array of Draws whose date property 
   * is in the range [start, end).
   **/
  var getNumberList = function getNumberList(numberRange) {
    const rangeArray = LODASH.range(numberRange.start, numberRange.end);
    const promiseArray = rangeArray.map(
        function(number) {
          return getNumber(number).catch(function (error) {
            //if there is no draw reported just put null for that
            //draw instead of letting all of them fail
            if(error.name === ERRORNAMES.NODRAW) {
              return null;
            }
            throw error;
          });}
        );
    return Promise.all(promiseArray);
  };
  STORE(table, 'number-range', getNumberList);

  /**
   * getDate: Date -> promise
   * Consume a Date and returns a promise for the draw with a that date
   * @param date representing a draw date;
   **/
  var getDate = function getDate(date) {
    var moment = MOMENT(date);
    var queryObject = {
      day: moment.format('DD'),
      month: moment.format('MMM'),
      year: moment.format('YY')
    };

    var options = {
      host: NLCBCONF.host,
      port: NLCBCONF.port,
      method: NLCBCONF.method,
      headers: NLCBCONF.headers,
      path:  NLCBCONF.getDrawDatePath,
      queryString: QUERYSTRING.stringify(queryObject)
    };

    return requestHtml(options).then(PARSE);
  };
  STORE(table, 'date', getDate);

  // TODO: try do implement this. As of 1st August 2015
  //       nlcb.co.tt has broken query for dates and is
  //       also very slow in http response.
  //       Check for example, getDraw(new Date("2015 1 1")
  /**
   * getDateRange: Date-range -> promise
   * Consumes an Object with properties 'start' and 'end', that are
   * Dates, return a promise for an array of Draws whose date property 
   * is in the range [start, end).
   **/
  //helper for getDateRange. twix doesn't seem to return a standard
  //javascript iterator.
  var mapIterator = function mapIterator (f, iterator) {
    const array = [];
    while(iterator.hasNext()) {
      array.push(f(iterator.next()));
    }
    return array;
  };
  var getDateList = function getDateList (dateRange) {
    const startMoment = MOMENT(dateRange.start);
    const endMoment = MOMENT(dateRange.end);
    endMoment.subtract(1, 'days');
    const twixDateRange = startMoment.twix(endMoment);
    const twixDateRangeIterator = twixDateRange.iterate('days');
    const dateArray = mapIterator(function(moment) {
      return moment.toDate();
    }, twixDateRangeIterator);

    const promiseArray = dateArray.map(
        function(date) {
          return getDate(date)
            .catch(function (error) {
              //if there is no draw reported just put null for that
              //draw instead of letting all of them fail
              if(error.name === ERRORNAMES.NODRAW) {
                return null;
              }
              throw error;
            });
        });
    return Promise.all(promiseArray)
      .then(function(draws){
        return draws.filter(function(draw){
          return draw !== null;
        });
      });
  };
  STORE(table, 'date-range', getDateList);
};
const getTable = MAKETABLE(); 
installNlcbGet(getTable);


/**
 * DrawProperty is any one of the following types:
 *  number
 *  Date
 *  RangeObject: {start: <Date>, end: <Date>} or {start: <number>, end: <number>}
 *
 * getDraw: DrawProperty -> promise
 * Consume a DrawProperty of a set of draws return a promise for those draws
 * specified by the DrawProperty.
 *
 * If the DrawProperty is a number return a promise for the draw with that number
 * If the DrawProperty is a Date, return a promise for the draw on that date.
 * If the DrawProperty is a RangeObject then return a promise for an array of
 * draws in [RangeObject.start, RangeObject.end);
 **/
var getDraw = function getDraw(property) {
  //idea taken from GENERIC OPERATOR discussions in SICP
  var type = TYPE(property);
  if(!type) {
    return Promise.reject(new Error('dont understand type of ', property));
  }

  var getter = RETRIEVE(getTable, type);
  if(getter === undefined) {
    return Promise.reject(new Error("cannot get draw for this type of" +
          " draw property: " + property));
  }
  return getter(property);
};


var getNewJackpot = function getNewJackpot() {
  //TODO: put this in parser.js?
  var parse = function parse(html) {
    const jackpotH1Regexp = /<h1.*?headfit.*?((\d+?,)+?(\d+)\s*?\.\d{2})/;
    const jackpotMatch = html.match(jackpotH1Regexp);
    if(jackpotMatch === null) {
      throw new Error('cannot parse jackpot in ' + html);
    }
    const jackpot = jackpotMatch[1].replace(/,/g,'');
    return +jackpot;
  };


  var options = {
    host: NLCBCONF.host,
    port: NLCBCONF.port,
    method: 'GET',//TODO: store this in config?
    headers: NLCBCONF.headers,
    path: NLCBCONF.getNewJackpotPath,
  };

  return requestHtml(options).then(parse);
};

var consoleLog = function () {};
var consoleError = function () {};
module.exports = function(debug) {
  if(debug) {
    consoleLog = console.log.bind(console);
    consoleError = console.error.bind(console);
  }
  return module.exports;
};

module.exports.getDraw = getDraw;
module.exports.getNewJackpot = getNewJackpot;

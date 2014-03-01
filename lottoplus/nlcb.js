/************************************************************
 * File: lottoplus.nlcb.js
 * Author: Devon Olivier
 * Year: 2013
 * Purpose: Manages connections and read requests to the lottoplus
 * nlcb database 
 * Platform: node.js
 ***********************************************************/
'use strict';

//native node modules
var HTTP = require('http');
var QUERYSTRING = require('querystring');

//external node modules
var Q = require('q');
require('twix');
var JSDOM = require('jsdom');
var MOMENT = require('moment');

//native argent modules
var ERROR = require('../lib/errors.js');
var NLCBCONF = require('../config/nlcb-conf.json');

//local libs
var DUTILS = require('../lib/utils.js');
var IS = require('../lib/is.js');
var JQUERYPATH = '../lib/jquery.js';

/********************************Parser*************************************/
/** 
 * a Draw is an Object with the following properties
 * number: the draw number
 * date: Date object representing the date for this draw
 * numbersPlayed: an array of numbers played for this draw
 * jackpot: a number representing the jackpot for this draw
 * numberOfWinners: a number representing the number of winners for the draw
 **/

/**
 * _parsDrawHtml: String -> promise
 * @param html the html returned from an http post request to nlcb.co.tt/search/<...>
 * @return a promise for a Draw representing the draw from html. If the draw does
 * not exist then the promise gets resolved with null.
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
 *    date: new Date('2012 12 1'),
 *    numbersPlayed: [20, 25, 28, 32, 34, 8],
 *    jacpot: 4987528.04,
 *    numberOfWinners: 0
 *  };
 **/
var _parseDrawHtml = function _parseDrawHtml(html) {

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
  var tableHtml = function tableHtml(theHtml) {
    var tableStartMatch = theHtml.match(/<\s*table/i),
      tableEndMatch = theHtml.match(/<\s*\/\s*table\s*>/i),
      tableCode = !tableStartMatch || !tableEndMatch ?
          null :
          theHtml.substring(tableStartMatch.index,
            tableEndMatch.index + tableEndMatch[0].length);
    return tableCode;
  },

  /**
   * parse: Window -> Draw
   * consume Window object and produce a promise for a Draw represented
   * by the child table of Window.
   * Throws DRAWPARSE if any part of the table cannot be parsed.
   * @param window an object representing the dom window object from a
   * jsdom.env call
   * @return Draw
   **/
    parse = function parse(window) {
      var $ = window.$, wrappedTds = $('td'),
        parseNumber = function parseNumber(tds) {
          //TODO: we probably didn't have to wrap these again
          //but it is the only way I know how for now
          var number = $(tds[2]).text().match(/\d+/);
          if (null === number) {
            throw new ERROR.DRAWPARSE('Unexpected draw number format');
          }
          return +number[0];
        },
        parseDate = function parseDate(tds) {
          var date = MOMENT($(tds[4]).text());
          if (date.isValid()) {
            return date.toDate();
          }
          throw new ERROR.DRAWPARSE('Unexpected draw date format');
        },

        parseNumbersPlayed = function parseNumbersPlayed(tds) {
          var numbersPlayed = $(tds[6]).text().match(/\d+/g);
          if (null === numbersPlayed) {
            throw new ERROR.DRAWPARSE('Unexpected draw number list format');
          }
          return numbersPlayed.map(function (n) { return +n; });
        },

        parseJackopt = function parseJackopt(tds) {
          var jackpot = $(tds[8]).text();
          jackpot = jackpot.replace(/,\s*/g, '');
          jackpot = jackpot.match(/\d+(\.\d+)?/);
          if (!jackpot) {
            throw new ERROR.DRAWPARSE('Unexpected draw jackpot format');
          }
          jackpot = +jackpot[0];

          //sometimes nlcb reports jackpots less than 10 we assume that these
          //are measured in millions
          if (jackpot < 10) {
            jackpot *= 1e6;
          }
          return jackpot;
        },

        parseNumberOfWinners = function parseNumberWinners(tds) {
          var number =  $(tds[10]).text().match(/\d+/);
          if (null === number) {
            throw (new ERROR.DRAWPARSE('Unexpected draw number of winners format'));
          }
          return +number;
        };

      if (wrappedTds.length < 10) {
        throw (new ERROR.DRAWPARSE('Unexpected draw format'));
      }
      var draw = {};
      draw.number = parseNumber(wrappedTds);
      draw.date = parseDate(wrappedTds);
      draw.numbersPlayed = parseNumbersPlayed(wrappedTds);
      draw.jackpot = parseJackopt(wrappedTds);
      draw.numberOfWinners = parseNumberOfWinners(wrappedTds);
      return draw;
    },
    deferred = Q.defer();
  html = tableHtml(html);
  //if we didn't get a table in the html we assume that
  //the draw does not exist.
  if (null === html) {
    return Q.resolve(null);
  }

  JSDOM.env(html, [JQUERYPATH], function (errors, window) {
    if (errors) {
      deferred.reject(errors);
    } else {
      try {
        deferred.resolve(parse(window));
      } catch (e) {
        deferred.reject(e);
      }
    }
  });

  return deferred.promise;
};
/********************************End Parser*********************************/

/**
 * _requestHtml: options -> promise
 * make http request and return a promise for the html sent back. Options
 * specified in @param options.
 *
 * @param options an object with properties corresponding to the host, path, 
 * query string, port, http verb, headers etc. for the request. 
 **/
var _requestHtml = function _requestHtml(options) {
  var deferred = Q.defer(),
    httpRequest = HTTP.request(options, function (res) {
      var html = "";
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        html += chunk;
      });

      res.on('end', function () {
        deferred.resolve(html);
      });
    });

  httpRequest.on('error', function (e) {
    var networkError = new ERROR.NETWORK('HTTP error', e);
    deferred.reject(networkError);
  });

  httpRequest.end(options.queryString);
  return deferred.promise;
};

/**
 *_requestParseHtml: Object, string -> promise
 * Consume an object with properties coresponding to query parameters and a 
 * string and produce promise for a Draw represented by the html returned.
 * If an error occurs set the 'details' property of the error object to the 
 * string argument.
 *
 * @param options an object with properties corresponding to the host, path, 
 * query string, port, http verb, headers etc. for the request. 
 * @errorDetails a string to assign to the 'details' property of the error object
 * in case of error.
 **/
var _requestParseHtml = function _requestParseHtml(options, errorDetails) {
  return _requestHtml(options)
    .then(_parseDrawHtml)
    .then(null, function (error) {
      error.details = errorDetails;
      throw error;
    });
};

/**
 * _getNumber NumericValue -> promise
 * Consume a NumericValue and returns a promise for the draw with
 * a number property corresponding to that NumericValue.
 * @param number a NumericValue representing a draw number
 **/
var _getNumber = function _getNumber(number) {
  var options = Object.create(NLCBCONF);
  options.path = options.getDrawPath;
  options.queryString = QUERYSTRING.stringify({drawno: number});
  return _requestParseHtml(options, 'query made for draw number ' + number);
};

/**
 * _getDate Moment -> promise
 * Consume a Moment and returns a promise for the draw with a date
 * property corresponding to that Moment.
 * @param number a Moment representing a draw date;
 **/
var _getDate = function _getDate(moment) {
  var options = Object.create(NLCBCONF);
  options.path = options.getDatePath;
  var queryObject = {
    day: moment.format("DD"),
    month: moment.format("MMM"),
    year: moment.format("YY")
  };
  options.queryString = QUERYSTRING.stringify(queryObject);
  return _requestParseHtml(options, 'query made for ' + moment.toDate());
};

/**
 * DrawProperty is any one of the following types:
 *  number
 *  string
 *  Date
 *  MOMENT?(considering)
 *  object (with start and end properties of the previous types)
 *
 * getDraw: DrawProperty -> promise
 * Consume a DrawProperty of a set of draws return a promise for those draws
 * specified by the DrawProperty.
 *
 * If the DrawProperty is a number return a promise for the draw with that number
 * property.
 * 
 * If the DrawProperty is an object with properties 'start' and 'end', which are
 * numbers, return a promise for an array of Draws whose number property is
 * in the range [start, end).
 *
 * If the DrawProperty is a string that is coerceable to a Date, return a promise
 * for the draw with that date property.
 *
 * If the DrawProperty is an object with properties 'start' and 'end', that are
 * both coerceable to a Date, return a promise for an array of Draws whose date
 * property is in the range [Date(start), Date(end)).
 *
 * If the DrawProperty is a Date, return a promise for the draw on that date.
 *
 * If the DrawProperty is an object with properties 'start' and 'end', that are
 * Dates, return a promise for an array of Draws whose date property is in the 
 * range [start, end).
 **/
var getDraw = function getDraw(property) {
  if (DUTILS.isNumeric(property)) {
    return _getNumber(+property);
  }

  if (IS.numberRange(property)) {
    var numberPromises = DUTILS.rangeArray(+property.start, +property.end - 1)
      .map(_getNumber);
    return Q.all(numberPromises)
      .then(function(draws) {
        return draws.filter(function (draw) {
          return draw !== null;
        });
      });
  }
  //It is important to ensure that we don't have
  //numeric values or ranges before we consider dates
  //because we are not coercing numeric values to Dates
  if (IS.datish(property)) {
    return _getDate(MOMENT(property));
  }

  if (IS.datishRange(property)) {
    var startMoment = MOMENT(property.start);
    var iter = startMoment.twix(property.end).iterate('days');
    var datePromises = [];
    for (var m=iter.next(); iter.hasNext(); m=iter.next()) {
      datePromises.push(_getDate(m));
    }
    return Q.all(datePromises)
      .then(function (draws) {
        return draws.filter(function (draw) {
          return draw !== null;
        });
      });
  }

  return Q.fcall(function () {
    throw new TypeError('Argument invalid');
  });
};
exports.getDraw = getDraw;
exports.MOMENT = MOMENT;

if (process.env.NODE_ENV==='dev') {
  exports._parseDrawHtml = _parseDrawHtml;
}

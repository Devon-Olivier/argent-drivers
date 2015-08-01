/************************************************************
 * File: nlcb.js
 * Author: Devon Olivier
 * Year: 2015
 * Purpose: Manages connections and read requests to the lottoplus
 * nlcb database at nlcb.co.tt
 * Platform: iojs
 ***********************************************************/
'use strict';

//native node modules
const HTTP = require('http');
const QUERYSTRING = require('querystring');
const URL = require('url');

//external node modules
const MOMENT = require('moment');
require('twix');

//native argent modules
const TYPE = require('./type.js');
const ERROR = require('../lib/errors.js');
const NLCBCONF = require('../config/nlcb-conf.json');
const PARSE = require ('./parser.js').parse;

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



var makeTable = function makeTable() {
  return {};
};

var retrieve = function retrieve(table, type) {
  return table[type];
};

var store = function store(table, type, f) {
  table[type] = f;
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
  store(table, 'number', getNumber);


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
  store(table, 'date', getDate);

  // TODO: try do implement this. As of 1st August 2015
  //       nlcb.co.tt has broken query for dates and is
  //       also very slow in http response.
  //       Check for example, getDraw(new Date("2015 1 1")
  ///**
  // * getDateRange: Date-range -> promise
  // * Consumes an Object with properties 'start' and 'end', that are
  // * Dates, return a promise for an array of Draws whose date property 
  // * is in the range [start, end).
  // **/
  ////helper for getDateRange
  //var mapIterator = function mapIterator (f, iterator) {
  //  var array = [];
  //  while(iterator.hasNext()) {
  //    array.push(f(iterator.next()));
  //  }
  //  return array;
  //};
  //var getDateRange = function getDateRange (dateRange) {
  //  var startMoment = MOMENT(dateRange.start);
  //  var twixDateRange = startMoment.twix(dateRange.end);
  //  var twixDateRangeIterator = twixDateRange.iterate('days');
  //  var datePromises = mapIterator(function(moment) {
  //    return getDate(moment.toDate());
  //  }, twixDateRangeIterator);

  //  return Promise.all(datePromises);
  //};
  //store(table, 'date-range', getDateRange);
};
const getTable = makeTable(); 
installNlcbGet(getTable);


/**
 * DrawProperty is any one of the following types:
 *  number
 *  Date
 *
 * getDraw: DrawProperty -> promise
 * Consume a DrawProperty of a set of draws return a promise for those draws
 * specified by the DrawProperty.
 *
 * If the DrawProperty is a number return a promise for the draw with that number
 * If the DrawProperty is a Date, return a promise for the draw on that date.
 **/
var getDraw = function getDraw(property) {
  //idea taken from GENERIC OPERATOR discussions in SICP
  var getter = retrieve(getTable, TYPE(property));
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

exports.getDraw = getDraw;
exports.getNewJackpot = getNewJackpot;

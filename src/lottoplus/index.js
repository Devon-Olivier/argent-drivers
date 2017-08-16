/**
 * @author: Devon Olivier
 * @file: Manages connections and read requests to the lottoplus
 * nlcb database at nlcb.co.tt
 */

//TODO: IMPROVE ERROR REPORTING AND DETECTING

//native node modules
const URL = require('url');
const HTTP = require('http');
const QUERYSTRING = require('querystring');

//external node modules
const MOMENT = require('moment');
require('twix');
const LODASH = require('lodash');
const REQUEST = require('request-promise-native');

//native argent modules
const TYPE = require('./type.js');
const ERRORNAMES = require('./error-names.js');
const NLCBCONF = require('../../config/nlcb-conf.json');
const PARSE = require ('./parser.js').parse;
const Table = require('./table.js');
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
const get = {};
/**
 * getNumber: number -> promise
 * Consume a number and returns a promise for the draw with
 * a number property corresponding to that number.
 * @param number a draw number
 **/
get.number = function getNumber(number) {
  const urlObject = {
    protocol: NLCBCONF.protocol,
    host: NLCBCONF.host,
    pathname: NLCBCONF.getDrawNumberPath,
  };
  const url = URL.format(urlObject);
  return REQUEST.post(url, {
    form: {
      drawnum: number
    }
  }).then(PARSE);
};

/**
 * getNumberRange: Number-range bePersistent -> promise
 * Consumes an Object with properties 'start' and 'end', that are
 * Number, return a promise for an array of Draws whose date property 
 * is in the range [start, end).
 **/
get.numberRange = function getNumberRange(numberRange) {
  const rangeArray = LODASH.range(numberRange.start, numberRange.end);
  const promiseArray = rangeArray.map(
    function(number) {
      return get.number(number).catch(function (error) {
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

// TODO: As of 1st August 2015 nlcb.co.tt has broken query
//       for dates and is also very slow in http response.
//       Check for example, getDraw(new Date("2015 1 1")
/**
 * getDate: Date -> promise
 * Consume a Date and returns a promise for the draw with a that date
 * @param date representing a draw date;
 **/
get.date = function getDate(date) {
  const moment = MOMENT(date);
  const queryObject = {
    day: moment.format('DD'),
    month: moment.format('MMM'),
    year: moment.format('YY')
  };
  const urlObject = {
    protocol: NLCBCONF.protocol,
    host: NLCBCONF.host,
    pathname: NLCBCONF.getDrawDatePath,//TODO: change "confg...getDrawDatePath" to "...PathName"
  };
  const url = URL.format(urlObject);
  return REQUEST.post(url, {form: queryObject}).then(PARSE);
};

/**
 * getDateRange: Date-range -> promise
 * Consumes an Object with properties 'start' and 'end', that are
 * Dates, return a promise for an array of Draws whose date property 
 * is in the range [start, end).
 **/
get.dateRange = function getDateList (dateRange) {
  const startMoment = MOMENT(dateRange.start);
  const endMoment = MOMENT(dateRange.end);
  endMoment.subtract(1, 'days');//mutating endMoment :(
  const twixDateRange = startMoment.twix(endMoment);
  const dateArray = twixDateRange.toArray('days');
  const promiseArray = dateArray.map(function(date) {
    return get.date(date)
      .catch(function (error) {
        //TODO: this causes the bad effect that some draws are left
        //out of the results without reporting this fact to the user
        
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
const getDraw = function getDraw(property) {
  //idea taken from GENERIC OPERATOR discussions in SICP
  const type = TYPE(property);
  if(!type) {
    return Promise.reject(new Error('dont understand type of ', property));
  }
  return get[type](property);
};


const getNextDraw = function getNextDraw() {
    debugLog('getNextDraw: ');
  //TODO: put this in parser.js?
  const parseJackpot = function parseJackpot(html) {
    debugLog('in parseJackpot of getNextDraw');
    const jackpotH1Regexp = /<h1.*?headfit.*?((\d+?,)+?(\d+)\s*?\.\d{2})/;
    const jackpotMatch = html.match(jackpotH1Regexp);
    if(jackpotMatch === null) {
      throw new Error(`cannot parse jackpot in ${html}`);
    }
    else {
      const jackpot = +jackpotMatch[1].replace(/,/g,'');
      debugLog(`match jackpot: ${jackpot}`);
      return jackpot;
    }
  };

  const parseDate = function parseDate(html) {
    debugLog('in parseDate of getNextDraw');
    var date;
    const dateRegexp = /Lotto[\s\S]*?Plus[\s\S]*?Date[\s\S]*?>(\d{1,2})[\s\S]*?([a-zA-Z]{3})[\s\S]*?(\d{2})/;
    const dateMatch = html.match(dateRegexp);
    if(dateMatch === null) {
      throw new Error('cannot parse date in: ' + html);
    }
    else {
      //debugLog('match date: ', dateMatch);
      const year = dateMatch[3];
      debugLog(`drawYear: ${year}`);
      const month = dateMatch[2];
      debugLog(`drawMonth: ${month}`);
      const day = dateMatch[1];
      debugLog(`drawDay: ${day}`);
      const dateString = `${ year } ${ month } ${  day }`;
      debugLog(`dateString: ${dateString}`);

      const lastDrawDate = MOMENT(dateString, 'YY MMM D', 'en').toDate();
      const satOfDrawWeek = MOMENT(lastDrawDate).day(6).toDate();
      const wedOfNextWeek = MOMENT(lastDrawDate).day(10).toDate();

      if(lastDrawDate >= satOfDrawWeek) {
        date = wedOfNextWeek;
      }
      else { 
        date = satOfDrawWeek;
      }
      //console.log(`last draw date: ${lastDrawDate}`);
      //console.log(`next draw date: ${date}`);
    }
    return date;
  };

  const parseNumber = function parseNumber(html) {
    //console.log('in parseNumber of getNextDraw');
    var number;
    const numberRegexp = /Lotto[\S\s]*?Plus[\S\s]*?Date[\s\S]*?Draw[\S\s]*?#[\s\S]*?>(\d+)/;
    const numberMatch = html.match(numberRegexp);
    //console.log('parseNumber: ', numberMatch);
    if(numberMatch === null) {
      throw new Error(`cannot parse number in ${html}`);
    }
    else {
      number = +numberMatch[1] + 1;
      //console.log(`number: ${number}`);
    }
    return number;
  };

  const numberUrlObject = {
    protocol: NLCBCONF.protocol,
    host: NLCBCONF.host,
    pathname: NLCBCONF.getNextDrawNumberPath
  };
  const numberUrl = URL.format(numberUrlObject);

  const dateUrlObject = {
    protocol: NLCBCONF.protocol,
    host: NLCBCONF.host,
    pathname: NLCBCONF.getNextDrawDatePath
  };
  const dateUrl = URL.format(dateUrlObject);

  const jackpotUrlObject = {
    protocol: NLCBCONF.protocol,
    host: NLCBCONF.host,
    pathname: NLCBCONF.getNextJackpotPath
  };
  const jackpotUrl = URL.format(jackpotUrlObject);
  
  const promises = [
    REQUEST.get(numberUrl).then(parseNumber),
    REQUEST.get(dateUrl).then(parseDate),
    REQUEST.get(jackpotUrl).then(parseJackpot)
  ];
  return Promise.all(promises).then(function(arr) {
    //console.log('all promises returned');
    return {
      drawNumber: arr[0],
      drawDate: arr[1],
      jackpot: arr[2]
    };
  });
};

var debugLog = function () {};
var debugError = function () {};
module.exports = function(debug) {
  if(debug) {
    debugLog = console.log.bind(console);
    debugError = console.error.bind(console);
  }
  return module.exports;
};

module.exports.getDraw = getDraw;
module.exports.getNextDraw = getNextDraw;

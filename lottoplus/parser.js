'use strict';

const MOMENT = require('moment');
const ERROR = require('./error-names.js');
/** 
 * a Draw is an Object with the following properties
 * drawNumber: the draw number
 * drawDate: Date object representing the date for this draw
 * numbersDrawn: an array of numbers played for this draw
 * jackpot: a number representing the jackpot for this draw
 * numberOfWinners: a number representing the number of winners for the draw
 **/

/**
 * parse: String -> promise
 * @param html the html returned from an http post request to nlcb.co.tt/
 * @return a promise for a Draw representing the draw from html. If the draw does
 * not exist then the promise gets resolved with null.
 * given:
 * <h2><strong> Draw #: </strong>1 | <strong> Date: </strong>04-Jul-01<br><strong> Numbers Drawn: </strong> | 4 | 10 | 11 | 12 | 18 and powerball  | 2 | <br><strong> Jackpot: </strong>2691380.55 | <strong> Winners: </strong>0<br></h2>
 *  expect:
 *  {
 *    drawNumber: 1,
 *    drawDate: new Date('2001 7 4'),
 *    numbersDrawn: [20, 25, 28, 32, 34, 8],
 *    jackpot: 4987528.04,
 *    numberOfWinners: 0
 *  };
 *  NOTE: THE RETURNED HTML FROM NLCB IS INCONSISTENT. DRAW NUMBER 1393 HAS A
 *  DRAW STRING OF 22_Nov-12. The '_' is the inconsistency here.
 **/
var parse = function parse(html) {
  var drawh2Regexp = /<h2.*?Draw.*?Winners.*?\d+/;
  var drawNumberRegexp = /Draw\s*#.*?(\d+)/;
  var drawDateRegexp = /Date.*?(\d{2}).*?([a-zA-Z]{3}).*?(\d{2})/;
  var numbersDrawnRegexp = /Drawn.*?(\d+).*?(\d+).*?(\d+).*?(\d+).*?(\d+).*?(\d+)/;
  var jackpotRegexp = /Jackpot.*?(\d+\.\d{2})/;
  var winnersRegexp = /Winners.*?(\d+)/;

  const draw = {};

  const h2match = html.match(drawh2Regexp);
  var h2;
  if(h2match === null){
    debugError('Found no draw in any h2 tag of html: \n');
    const error = new Error('Found no draw in any h2 tag of html: \n', html);
    error.name = ERROR.NODRAW;
    throw error;
  }
  else {
    debugLog('matched an h2 with a draw');
    debugLog('match object: ', h2match);
    h2 = h2match[0];
    debugLog('h2: ', h2);
  }

  var drawNumberMatch = h2.match(drawNumberRegexp);
  if(drawNumberMatch === null) {
    throw new Error("Couldn't parse draw number from h2:\n", h2);
  }
  draw.drawNumber = +drawNumberMatch[1]; 

  var drawDateMatch = h2.match(drawDateRegexp);
  if(drawDateMatch === null) {
    throw new Error("Couldn't parse draw Date from h2:\n", h2);
  }
  else {
    debugLog('matched a date in h2');
    debugLog('match object: ', drawDateMatch);
    const year = drawDateMatch[3];
    debugLog('drawYear: ', year);
    const month = drawDateMatch[2];
    debugLog('drawMonth: ', month);
    const day = drawDateMatch[1];
    debugLog('drawDay: ', day);
    const dateString = year + ' ' + month + ' ' + day;
    debugLog('date: ', dateString);
    draw.drawDate = MOMENT(dateString, 'YY MMM DD', 'en').toDate();
    debugLog('drawDate: ', draw.drawDate);
  }

  var numbersDrawnMatch = h2.match(numbersDrawnRegexp);
  if(numbersDrawnMatch === null) {
    throw new Error("Couldn't parse numbers drawn from h2:\n", h2);
  }
  draw.numbersDrawn = numbersDrawnMatch.slice(1,7).map(function(n) {
    return +n
  });

  var jackpotMatch = h2.match(jackpotRegexp);
  if(jackpotMatch === null) {
    throw new Error("Couldn't parse draw jackpot from h2:\n", h2);
  }
  draw.jackpot = +jackpotMatch[1];

  var numberOfWinnersMatch = h2.match(winnersRegexp);
  if(numberOfWinnersMatch === null) {
    throw new Error("Couldn't parse draw Date from h2:\n", h2);
  }
  draw.numberOfWinners = +numberOfWinnersMatch[1];

  return draw;
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
module.exports.parse = parse;

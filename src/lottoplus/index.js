/**
 * @author: Devon Olivier
 * Get lotttoplus draws by date and number from nlcb database
 * at nlcb.co.tt
 */

// TODO: IMPROVE ERROR REPORTING AND DETECTING

const fetch = require('node-fetch');
const moment = require('moment');
const querystring = require('querystring');
const url = require('url');
require('twix'); // TODO: try moment-range.js

const nlcbConf = require('../../config/nlcb-conf.json');
const { parse } = require('./parser.js');

/*
 * lottoFetch: Object(formData) Object(urlObject) -> Promise
 * Make a request to nlcb.co.tt
 *
 * @param formData is an Object whose key-value pairs are the
 * key-value pairs for an http request of content type
 * application/x-www-form-urlencoded.
 *
 * @param urlObject is an Object whose key-value pairs specify the
 * url at nlcb.co.tt to make the request
 *
 * @return a promise for the html response from nlcb.co.tt
 */
const lottoFetch = async (formData, urlObject) => {
  const lottoUrl = url.format(urlObject);

  const response = await fetch(lottoUrl, {
    body: querystring.stringify(formData),
    headers: nlcbConf.headers,
    method: 'POST',
  });

  const text = await response.text();
  return parse(text);
};

/**
 * a Draw is an Object with the following properties
 * drawNumber:  the draw number
 * drawDate: Date object representing the date for this draw
 * numbersDrawn: an array of numbers played for this draw such
 *               that numbersDrawn[5] is the powerball of the
 *               draw
 * drawjackpot: number representing the jackpot for this draw
 * numberOfWinners: a number representing the number of
 *                  winners for the draw
 */

/**
 * number: number -> promise
 * Consume a number and returns a promise for the draw with
 * a number property corresponding to that number.
 * @param number a draw number
 */
const number = async function number(n) {
  const formData = {
    drawnum: n,
  };

  const urlObject = {
    host: nlcbConf.host,
    pathname: nlcbConf.drawNumberPathname,
    protocol: nlcbConf.protocol,
  };
  return lottoFetch(formData, urlObject);
};

// TODO: As of 1st August 2015 nlcb.co.tt has broken query
//       for dates and is also very slow in http response.
//       Check for example, draw(new Date("2015 1 1")
/**
 * date: Date -> promise
 * Consume a Date and returns a promise for the draw with a that date
 * @param date representing a draw date;
 */
const date = async function date(d) {
  const momentDate = moment(d);
  const formData = {
    day: momentDate.format('DD'),
    month: momentDate.format('MMM'),
    year: momentDate.format('YY'),
  };
  const urlObject = {
    protocol: nlcbConf.protocol,
    host: nlcbConf.host,
    pathname: nlcbConf.drawDatePathname,
  };
  return lottoFetch(formData, urlObject);
};

module.exports.date = date;
module.exports.number = number;

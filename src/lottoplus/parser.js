const MOMENT = require('moment');
const WINSTON = require('winston');

const LOGGER = WINSTON.createLogger({
  transports: [
    new WINSTON.transports.Console({
      colorize: true,
      format: WINSTON.format.simple(),
    }),
  ],
});

/**
 * a Draw is an Object with the following properties
 * drawNumber: the draw number
 * drawDate: Date object representing the date for this draw
 * numbersDrawn: an array of numbers played for this draw
 * jackpot: a number representing the jackpot for this draw
 * numberOfWinners: a number representing the number of winners for the draw
 */

/**
 * parse: String -> promise
 * @param html the html returned from an http post request to nlcb.co.tt/
 * @return a promise for a Draw representing the draw from html. If the draw does
 * not exist then the promise gets resolved with null.
 * given:
 * <h2>
 *  <strong> Draw #: </strong>1 | <strong> Date: </strong>04-Jul-01<br>
 *  <strong> Numbers Drawn: </strong> | 4 | 10 | 11 | 12 | 18 and powerball | 2 | <br>
 *  <strong> Jackpot: </strong>2691380.55 | <strong> Winners: </strong>0<br>
 * </h2>
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
 *
 *  NOTE: DRAW FOR DATE 2018 09 05 RETURNS THE DRAW FOR DATE 2018 09 05
 *
 *  NOTE: Draw # 1782 is not returning any draws
 */
const parse = function parse(html) {
  const regExps = {
    h2: /<h2[\s\S]*?Draw[\s\S]*?Winners[\s\S]*?\d+/,
    number: /Draw\s*#.*?(\d+)/,
    date: /Date.*?(\d{1,2}).*?([a-zA-Z]{3}).*?(\d{2}).*?Numbers/,
    numbers: /Drawn.*?(\d+).*?(\d+).*?(\d+).*?(\d+).*?(\d+).*?(\d+)/,
    jackpot: /Jackpot.*?(\d+(\.\d{2})?)/,
    winners: /Winners.*?(\d+)/,
  };

  const draw = {};

  const h2match = html.match(regExps.h2);
  if (h2match === null) {
    // const errorMsg = `Found no draw in any h2 tag of html: ${html}`;
    const errorMsg = 'Found no draw in any h2 tag of html:';
    LOGGER.error(errorMsg);
    const error = new Error(errorMsg);
    throw error;
  } else {
    LOGGER.info('matched an h2 with a draw');
    LOGGER.info(`match object: ${h2match}`);
    const h2 = h2match[0];
    LOGGER.info(`h2: ${h2}`);

    const drawNumberMatch = h2.match(regExps.number);
    if (drawNumberMatch === null) {
      throw new Error(`Couldn't parse draw number from h2:\n${h2}`);
    }
    draw.drawNumber = +drawNumberMatch[1];

    const drawDateMatch = h2.match(regExps.date);
    if (drawDateMatch === null) {
      throw new Error(`Couldn't parse draw Date from h2:\n${h2}`);
    } else {
      LOGGER.info('matched a date in h2');
      LOGGER.info(`match object: ${drawDateMatch}`);
      const year = drawDateMatch[3];
      LOGGER.info(`drawYear: ${year}`);
      const month = drawDateMatch[2];
      LOGGER.info(`drawMonth: ${month}`);
      const day = drawDateMatch[1];
      LOGGER.info(`drawDay: ${day}`);
      const dateString = `${year} ${month} ${day}`;
      LOGGER.info(`date: ${year} ${month} ${day}`);
      draw.drawDate = MOMENT(dateString, 'YY MMM DD', 'en').toDate();
      LOGGER.info(`drawDate: ${draw.drawDate}`);
    }

    const numbersDrawnMatch = h2.match(regExps.numbers);
    if (numbersDrawnMatch === null) {
      throw new Error(`Couldn't parse numbers drawn from h2:\n${h2}`);
    }
    draw.numbersDrawn = numbersDrawnMatch.slice(1, 7).map(n => +n);

    const jackpotMatch = h2.match(regExps.jackpot);
    if (jackpotMatch === null) {
      LOGGER.info(`jackpot match attempt: ${jackpotMatch}`);
      throw new Error(`Couldn't parse draw jackpot from h2:\n${h2}`);
    } else {
      draw.jackpot = +jackpotMatch[1];
    }

    const numberOfWinnersMatch = h2.match(regExps.winners);
    if (numberOfWinnersMatch === null) {
      throw new Error(`Couldn't parse draw number of winners from h2:\n${h2}`);
    }
    draw.numberOfWinners = +numberOfWinnersMatch[1];

    return draw;
  }
};

// TODO: export function not object
module.exports.parse = parse;
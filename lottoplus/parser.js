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
 **/
var parse = function parse(html) {
  var drawh2Regexp = /<h2.*?Draw.*?h2>/;
  var drawNumberRegexp = /Draw\s*#.*?(\d+)/;
  var drawDateRegexp = /Date.*(\d{2}\-\w{3}\-\d{2})/;
  var numbersDrawnRegexp = /Drawn.*?(\d+).*?(\d+).*?(\d+).*?(\d+).*?(\d+).*?(\d+)/;
  var jackpotRegexp = /Jackpot.*?(\d+\.\d{2})/;
  var winnersRegexp = /Winners.*?(\d+)/;

  var draw = {};

  var h2match = html.match(drawh2Regexp);
  if(h2match === null){
    throw new Error('Found no draw in any h2 tag of html: \n', html);
  }

  var h2 = h2match[0];

  var drawNumberMatch = h2.match(drawNumberRegexp);
  if(drawNumberMatch === null) {
    throw new Error("Couldn't parse draw number from h2:\n", h2);
  }
  draw.drawNumber = +drawNumberMatch[1]; 

  var drawDateMatch = h2.match(drawDateRegexp);
  if(drawDateMatch === null) {
    throw new Error("Couldn't parse draw Date from h2:\n", h2);
  }
  draw.drawDate = new Date(drawDateMatch[1]);

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

exports.parse = parse;

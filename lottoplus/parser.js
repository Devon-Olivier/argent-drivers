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
    throw new Error("Expected html to have draw information in an h2 tag:\n", html);
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
  draw.numbersDrawn = numbersDrawnMatch.slice(1,7).map(function(n){
    return +n;
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

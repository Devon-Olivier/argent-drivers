var SHOULD = require('should');
var parser = require('../lottoplus/parser')();

var drawHtmlArray = [
  '<h2><strong> Draw #: </strong>1 |'+
  '<strong> Date: </strong>04-Jul-01<br>'+
  '<strong> Numbers Drawn: </strong> | 4 | 10 | 11 | 12 | 18 and powerball  | 2 |'+
  '<br><strong> Jackpot: </strong>2691380.55 | '+
  '<strong> Winners: </strong>0<br></h2>',

  '<h2><strong> Draw #: </strong>1393 | '+
  '<strong> Date: </strong>22_nov-14<br>'+
  '<strong> Numbers Drawn: </strong> | 7 | 8 | 18 | 23 | 30 and powerball  | 10 | '+
  '<br><strong> Jackpot: </strong>9671817.28 | '+
  '<strong> Winners: </strong>0<br></h2>',

  '<h2><strong> Draw #: </strong>1464 | '+
  '<strong> Date: </strong>1-Aug-15<br>'+
  '<strong> Numbers Drawn: </strong> | 6 | 11 | 20 | 33 | 35 and powerball  | 2 | '+
  '<br><strong> Jackpot: </strong>2000000 | '+
  '<strong> Winners: </strong>0<br></h2>',

  '<h2><strong> Draw #: </strong>1473 | ' +
  '<strong> Date: </strong>2-Sep-15<br>'+
  '<strong> Numbers Drawn: </strong> | 3 | 6 | 21 | 29 | 34 and powerball  | 5 | '+
  '<br><strong> Jackpot: </strong>2358454.38 | '+
  '<strong> Winners: </strong>0<br></h2>'
];


var expectedDraws = [{
  drawNumber: 1,
  drawDate: new Date('2001 7 4'),
  numbersDrawn: [4, 10, 11, 12, 18, 2],
  jackpot: 2691380.55,
  numberOfWinners: 0}, {
    drawNumber: 1393,
    drawDate: new Date('2014 11 22'),
    numbersDrawn: [7, 8, 18, 23, 30, 10],
    jackpot: 9671817.28,
    numberOfWinners: 0}, {
    drawNumber: 1464,
    drawDate: new Date('2015 8 1'),
    numbersDrawn: [6, 11, 20, 33, 35, 2],
    jackpot: 2000000,
    numberOfWinners: 0}, {
    drawNumber: 1473,
    drawDate: new Date('2015 9 2'),
    numbersDrawn: [3, 6, 21, 29, 34, 5],
    jackpot: 2358454.38,
    numberOfWinners: 0}
];

describe('parser', function(){
  describe('#parser', function(){
    it('should throw on invalid html', function() {
      SHOULD.throws(function(){
        parser.parse("Shit");
      });
    });

    drawHtmlArray.forEach(function(html, i) {
      it('should give parse draw number '+
          expectedDraws[i].drawNumber +
          ' correctly', function(){
        const draw = parser.parse(html);
        draw.should.be.eql(expectedDraws[i]);
      });
    });
  });
});

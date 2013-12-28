var SHOULD = require('should');
var nlcbLottoplusDriver = require('../lottoplus/nlcb');

var html = '<table>' +
  '<tbody>'+
    '<tr> <td>Stupid header with colspan=2</td> </tr>'+
    '<tr> <td>Draw #</td> <td>1190</td> </tr>'+
    '<tr> <td>Date</td> <td>01-Dec-12</td> </tr>'+
    '<tr> <td>Numbers</td> <td> 20, 26, 28, 32, 34 -PB: 8</td> </tr>'+
    '<tr> <td>Jackpot</td> <td> $4,987,528.04</td> </tr>'+
    '<tr> <td># Winners</td> <td>0</td> </tr>'+
  '</tbody>'+
'</table>';
var expectedDraw = {
  number: 1190,
  date: new Date('2012 12 1'),
  numbersPlayed: [20, 26, 28, 32, 34, 8],
  jackpot: 4987528.04,
  numberOfWinners: 0
};

describe('lottoplus-nlcb', function(){
  describe('_parseDrawHtml', function(){
    it('should give draw number 1190', function(){
      nlcbLottoplusDriver._parseDrawHtml(html)
        .then(function(draw){
          draw.should.eql(expectedDraw);
        }).done();
    });
  });
});

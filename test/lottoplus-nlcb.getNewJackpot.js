var SHOULD = require('should');
var nlcbLottoplusDriver = require('../lottoplus/nlcb');

describe('lottoplus-nlcb', function(){
  describe('.getNewJackpot', function(){
    it('should be a number', function(done){
      nlcbLottoplusDriver.getNewJackpot()
        .then(function(jackpot){
          jackpot.should.be.a.Number.and.be.above(0);
          done();
        }, function (error) {
          throw error;
        }).done();
    });
  });
});


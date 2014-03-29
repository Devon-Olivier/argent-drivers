var SHOULD = require('should');
var mongoLottoplusDriver = require('../lottoplus/mongo');

describe('lottoplus-mongo', function(){
  describe('.getNewJackpot', function(){
    it('save correctly', function(done){
      mongoLottoplusDriver.getNewJackpot()
        .then(function(jackpot){
          console.log(jackpot);
          done();
        }, function (error) {
          throw error;
        }).done();
    });
  });
});




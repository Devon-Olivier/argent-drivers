var SHOULD = require('should');
var mongoLottoplusDriver = require('../lottoplus/mongo');

describe('lottoplus-mongo', function(){
  describe('.saveNewJackpot', function(){
    it('save correctly', function(done){
      mongoLottoplusDriver.saveNewJackpot(1e6)
        .then(function(result){
          console.log(result);
          done();
        }, function (error) {
          throw error;
        }).done();
    });
  });
});



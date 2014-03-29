var SHOULD = require('should');
var mongoLottoplusDriver = require('../lottoplus/mongo');
var MOMENT = mongoLottoplusDriver.MOMENT;

var stringDateStart = "2012 12 1";
var dateStart = new Date(stringDateStart);
var arrayDateStart = [2012, 11, 1];

var stringDateEnd = "2012 12 6";
var dateEnd = new Date(stringDateEnd);

var stringNumberStart = '1190';
var numberStart = 1190;
var stringNumberEnd = '1192';
var numberEnd = 1192;

var expectedDraws = [{
  number: 1190,
  date: new Date(stringDateStart),
  numbersPlayed: [20, 26, 28, 32, 34, 8],
  jackpot: 4987528.04,
  numberOfWinners: 0}, {
  number: 1191,
  date: MOMENT(stringDateEnd).subtract(1, 'day').toDate(),
  numbersPlayed: [7, 15, 16, 24, 32, 5],
  jackpot: 5649713.5,
  numberOfWinners: 0}];

describe('mongoLottoplusDriver', function() {
  describe('#getDraw(invalidProperty)', function() {
    it('should throw error for invalid argument', function(done) {
      mongoLottoplusDriver.getDraw('lol')
      .then(function (value) {
        SHOULD.not.exist(value);
        done();
      }, function (error) {
        error.should.be.an.instanceof(TypeError);
        done();
      }).done();
    });
  });
});

describe('mongoLottoplusDriver', function() {
  describe('#getDraw(stringDate)', function() {
    it('should accept string dates', function(done) {
      mongoLottoplusDriver.getDraw(stringDateStart)
      .then(function(draw) {
        draw.should.eql(expectedDraws[0]);
        done(); 
      }).done();
    });
  });
});

describe('mongoLottoplusDriver', function() {
  describe('#getDraw(dateRange)', function() {
    it('should accept ranges with string start and end', function(done) {
      mongoLottoplusDriver.getDraw({start:stringDateStart, end:stringDateEnd})
      .then(function(draws) {
        draws.should.eql(expectedDraws);
        done(); 
      }).done();
    });
  });
});

describe('mongoLottoplusDriver', function() {
  describe('#getDraw(dateRange)', function() {
    it('should accept ranges with Date start and string end', function(done) {
      mongoLottoplusDriver.getDraw({start:dateStart, end:stringDateEnd})
      .then(function(draws) {
        draws.should.eql(expectedDraws);
        done(); 
      }).done();
    });
  });
});

describe('mongoLottoplusDriver', function() {
  describe('#getDraw(dateRange)', function() {
    it('should accept ranges with Date start and end', function(done) {
      mongoLottoplusDriver.getDraw({start:dateStart, end:dateEnd})
      .then(function(draws) {
        draws.should.eql(expectedDraws);
        done(); 
      }).done();
    });
  });
});

describe('mongoLottoplusDriver', function() {
  describe('#getDraw(dateRange)', function() {
    it('should accept ranges with string start and Date end', function(done) {
      mongoLottoplusDriver.getDraw({start:stringDateStart, end:dateEnd})
      .then(function(draws) {
        draws.should.eql(expectedDraws);
        done(); 
      }).done();
    });
  });
});

describe('mongoLottoplusDriver', function() {
  describe('#getDrawNumber(stringNumber)', function() {
    it('should accept numbers in srings', function(done) {
      mongoLottoplusDriver.getDraw(stringNumberStart)
      .then(function(draw) {
        draw.should.eql(expectedDraws[0]);
        done(); 
      },
      function (error) {
        error.should.not.exist();
      }).done();
    });
  });
});

describe('mongoLottoplusDriver', function() {
  describe('#getDraw(numberRange)', function() {
    it('should accept ranges with string start and end', function(done) {
      mongoLottoplusDriver.getDraw({start:stringNumberStart, end:stringNumberEnd})
      .then(function(draws) {
        draws.should.eql(expectedDraws);
        done(); 
      }).done();
    });
  });
});

describe('mongoLottoplusDriver', function() {
  describe('#getDraw(numberRange)', function() {
    it('should accept ranges with number start and string end', function(done) {
      mongoLottoplusDriver.getDraw({start:numberStart, end:stringNumberEnd})
      .then(function(draws) {
        draws.should.eql(expectedDraws);
        done(); 
      }).done();
    });
  });
});

describe('mongoLottoplusDriver', function() {
  describe('#getDraw(numberRange)', function() {
    it('should accept ranges with number start and end', function(done) {
      mongoLottoplusDriver.getDraw({start:numberStart, end:numberEnd})
      .then(function(draws) {
        draws.should.eql(expectedDraws);
        done(); 
      }).done();
    });
  });
});

describe('mongoLottoplusDriver', function() {
  describe('#getDraw(numberRange)', function() {
    it('should accept ranges with string start and Date end', function(done) {
      mongoLottoplusDriver.getDraw({start:stringNumberStart, end:numberEnd})
      .then(function(draws) {
        draws.should.eql(expectedDraws);
        done(); 
      }).done();
    });
  });
});

describe('mongoLottoplusDriver', function() {
  describe('#getDraw(dateAsArray)', function() {
    it('should accept ranges with array representation of a date', function(done) {
      mongoLottoplusDriver.getDraw(arrayDateStart)
      .then(function(draws) {
        draws.should.eql(expectedDraws[0]);
        done(); 
      }).done();
    });
  });
});

describe('mongoLottoplusDriver', function() {
  describe('#saveDraw(draw)', function() {
    it('should save single draw correctly', function(done) {
      var draw = {number: -1310};
      mongoLottoplusDriver.saveDraw(draw)
      .then(function(draws) {
        draws.should.eql([draw]);
        mongoLottoplusDriver.removeDraw(draw).done();
        done(); 
      },
      function (error) {
        error.should.not.be.ok();
        done();
      }).done();
    });
  });
});

describe('mongoLottoplusDriver', function() {
  describe('#saveDraw(draws)', function() {
    it('should save arrays of draws correctly', function(done) {
      var doc1 = {number: -1309};
      var doc2 = {number: -1310};
      var draws = [doc1, doc2];
      mongoLottoplusDriver.saveDraw(draws)
      .then(function(savedDraws) {
        savedDraws.should.eql(draws);
        mongoLottoplusDriver.removeDraw({number: {$lt: 0}})
          .then(function (n) {
            console.log('deleted ' + n + ' docs');
            n.should.eql(2);
            done(); 
          },
          function (error) {
            console.log('error removing docs');
            SHOULD.not.exist(error);
            done(); 
          }).done();
      },
      function (error) {
        SHOULD.not.exist(error);
        done();
      }).done();
    });
  });
});

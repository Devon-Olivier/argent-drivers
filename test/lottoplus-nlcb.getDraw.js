var SHOULD = require('should');
var nlcbLottoplusDriver = require('../lottoplus/nlcb');
var MOMENT = nlcbLottoplusDriver.MOMENT;

var stringDateStart = "2012 12 1";
var dateStart = new Date(stringDateStart);
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
  numberOfWinners: 0},
  null,
  null,
  null, {
  number: 1191,
  date: MOMENT(new Date(stringDateEnd)).subtract(1, 'day').toDate(),
  numbersPlayed: [7, 15, 16, 24, 32, 5],
  jackpot: 5649713.5,
  numberOfWinners: 0}];

describe('nlcbLottoplusDriver', function() {
  describe('#getDraw(stringDate)', function() {
    it('should accept string dates', function(done) {
      nlcbLottoplusDriver.getDraw(stringDateStart)
      .then(function(draw) {
        draw.should.eql(expectedDraws[0]);
        done(); 
      }).done();
    });
  });
});

describe('nlcbLottoplusDriver', function() {
  describe('#getDraw(dateRange)', function() {
    it('should accept ranges with string start and end', function(done) {
      nlcbLottoplusDriver.getDraw({start:stringDateStart, end:stringDateEnd})
      .then(function(draws) {
        draws.should.eql(expectedDraws);
        done(); 
      }).done();
    });
  });
});

describe('nlcbLottoplusDriver', function() {
  describe('#getDraw(dateRange)', function() {
    it('should accept ranges with Date start and string end', function(done) {
      nlcbLottoplusDriver.getDraw({start:dateStart, end:stringDateEnd})
      .then(function(draws) {
        draws.should.eql(expectedDraws);
        done(); 
      }).done();
    });
  });
});

describe('nlcbLottoplusDriver', function() {
  describe('#getDraw(dateRange)', function() {
    it('should accept ranges with Date start and end', function(done) {
      nlcbLottoplusDriver.getDraw({start:dateStart, end:dateEnd})
      .then(function(draws) {
        draws.should.eql(expectedDraws);
        done(); 
      }).done();
    });
  });
});

describe('nlcbLottoplusDriver', function() {
  describe('#getDraw(dateRange)', function() {
    it('should accept ranges with string start and Date end', function(done) {
      nlcbLottoplusDriver.getDraw({start:stringDateStart, end:dateEnd})
      .then(function(draws) {
        draws.should.eql(expectedDraws);
        done(); 
      }).done();
    });
  });
});

describe('nlcbLottoplusDriver', function() {
  describe('#getDrawNumber(stringNumber)', function() {
    it('should accept numbers in srings', function(done) {
      nlcbLottoplusDriver.getDraw(stringNumberStart)
      .then(function(draw) {
        draw.should.eql(expectedDraws[0]);
        done(); 
      }).done();
    });
  });
});

describe('nlcbLottoplusDriver', function() {
  describe('#getDraw(numberRange)', function() {
    it('should accept ranges with string start and end', function(done) {
      nlcbLottoplusDriver.getDraw({start:stringNumberStart, end:stringNumberEnd})
      .then(function(draws) {
        draws.should.eql([expectedDraws[0], expectedDraws[4]]);
        done(); 
      }).done();
    });
  });
});

describe('nlcbLottoplusDriver', function() {
  describe('#getDraw(numberRange)', function() {
    it('should accept ranges with number start and string end', function(done) {
      nlcbLottoplusDriver.getDraw({start:numberStart, end:stringNumberEnd})
      .then(function(draws) {
        draws.should.eql([expectedDraws[0], expectedDraws[4]]);
        done(); 
      }).done();
    });
  });
});

describe('nlcbLottoplusDriver', function() {
  describe('#getDraw(numberRange)', function() {
    it('should accept ranges with number start and end', function(done) {
      nlcbLottoplusDriver.getDraw({start:numberStart, end:numberEnd})
      .then(function(draws) {
        draws.should.eql([expectedDraws[0], expectedDraws[4]]);
        done(); 
      }).done();
    });
  });
});

describe('nlcbLottoplusDriver', function() {
  describe('#getDraw(numberRange)', function() {
    it('should accept ranges with string start and Date end', function(done) {
      nlcbLottoplusDriver.getDraw({start:stringNumberStart, end:numberEnd})
      .then(function(draws) {
        draws.should.eql([expectedDraws[0], expectedDraws[4]]);
        done(); 
      }).done();
    });
  });
});

'use strict';
const SHOULD = require('should');
require('should-promised');

const MOMENT = require('moment');
const mongoLottoplusDriver = require('../lottoplus/mongo')(true);

const drawsForGetTests = [{
  drawNumber: 1,
  drawDate: new Date('2001 7 4'),
  numbersDrawn: [ 4, 10, 11, 12, 18, 2 ],
  jackpot: 2691380.55,
  numberOfWinners: 0}, {
  drawNumber: 2,
  drawDate: new Date('2001 7 7'),
  numbersDrawn: [ 2, 10, 11, 26, 28, 10 ],
  jackpot: 3140281.24,
  numberOfWinners: 0}];

const drawsForSaveTests = [{
  drawNumber: 1190,
  drawDate: new Date( "2012 12 1"),
  numbersDrawn: [20, 26, 28, 32, 34, 8],
  jackpot: 4987528.04,
  numberOfWinners: 0}, {
    drawNumber: 1191,
    drawDate: new Date( "2012 12 6"),
    numbersDrawn: [7, 15, 16, 24, 32, 5],
    jackpot: 5649713.5,
    numberOfWinners: 0}];

const drawsForStatsTest = [{
  drawNumber: 1190,
  drawDate: new Date( "2012 12 1"),
  numbersDrawn: [20, 26, 28, 32, 34, 8],
  jackpot: 4987528.04,
  numberOfWinners: 0}, {
    drawNumber: 1191,
    drawDate: new Date( "2012 12 6"),
    numbersDrawn: [7, 15, 16, 24, 32, 5],
    jackpot: 5649713.5,
    numberOfWinners: 0}];

describe('mongoLottoplusDriver', function() {
  describe('#getDraw(<invalidProperty>)', function() {
    it('should throw error for invalid argument', function() {
      return mongoLottoplusDriver.getDraw('lol').should.be.rejected();
    });
  });

  describe('#getDraw(<number>)', function() {
    it('should accept number', function() {
      const drawNumber = drawsForGetTests[0].drawNumber;
      return mongoLottoplusDriver.getDraw(drawNumber)
        .should.be.fulfilledWith(drawsForGetTests[0]);
    });
  });

  describe('#getDraw(<numberRange>)', function() {
    it('should accept number ranges', function() {
      const startNumber = drawsForGetTests[0].drawNumber;
      const endNumber = drawsForGetTests[drawsForGetTests.length - 1].drawNumber + 1;
      return mongoLottoplusDriver.getDraw({start: startNumber, end: endNumber})
        .should.be.fulfilledWith(drawsForGetTests);
    });
  });

  describe('#getDraw(<date>)', function() {
    it('should accept date', function() {
      const date = drawsForGetTests[0].drawDate;
      return mongoLottoplusDriver.getDraw(date)
        .should.be.fulfilledWith(drawsForGetTests[0]);
    });
  });

  describe('#getDraw(<dateRange>)', function() {
    it('should accept date ranges', function() {
      const dateStart = drawsForGetTests[0].drawDate;
      const dateEnd = MOMENT(drawsForGetTests[drawsForGetTests.length - 1].drawDate)
        .add(1, 'days').toDate();
      return mongoLottoplusDriver.getDraw({start:dateStart, end:dateEnd})
      .should.be.fulfilledWith(drawsForGetTests);
    });
  });

  describe('#saveOneDraw(<draw>)', function() {
    it('should save single draw correctly', function() {
      return mongoLottoplusDriver.saveOneDraw(drawsForSaveTests[0])
        .then(function(result) {
          result.insertedCount.should.be.eql(1);
          return mongoLottoplusDriver.removeOneDraw(drawsForSaveTests[0])
          .then(function(result) {
            result.deletedCount.should.be.eql(1);
          });
        });
    });
  });

  describe('#saveManyDraws(<draws>)', function() {
    it('should save arrays of draws correctly', function() {
      return mongoLottoplusDriver.saveManyDraws(drawsForSaveTests)
        .then(function(result) {
          result.insertedCount.should.be.eql(2);
          const removePromises = drawsForSaveTests.map(function (draw) {
            return mongoLottoplusDriver.removeOneDraw(draw);
          });
          return Promise.all(removePromises).then(function(results) {
            results.forEach(function (result) {
              result.deletedCount.should.be.eql(1);
            });
          });
        });
    });
  });

  describe('#removeOneDraw(<draw>)', function() {
    it('should delete draw correctly', function() {
      return mongoLottoplusDriver.saveOneDraw(drawsForSaveTests[0])
        .then(function(result) {
          result.insertedCount.should.be.eql(1);
          return mongoLottoplusDriver.removeOneDraw(drawsForSaveTests[0])
          .then(function(result) {
            result.deletedCount.should.be.eql(1);
          });
        });
    });
  });

  
  describe('#updateJackpotStats(<jackpotInfo>, #getJackpotStats())', function() {
    it('should compute and save the correct jackpot stats for a new jackpot that is '+
        'higher than the highest in database', function(done) {
          const jackpot = drawsForStatsTest[1].jackpot;
          const drawNumber = drawsForStatsTest[1].drawNumber;
          mongoLottoplusDriver.saveOneDraw(drawsForStatsTest[0])

            .then(function(result) {
              mongoLottoplusDriver.updateJackpotStats({jackpot: jackpot, drawNumber:drawNumber})
                .then(function(result) {

                  mongoLottoplusDriver.getJackpotStats()
                    .then(function(stats) {

                      stats.highest.jackpot.should.be.eql(jackpot);
                      stats.highest.drawNumber.should.be.eql(drawNumber);
                      mongoLottoplusDriver.removeOneDraw(drawsForStatsTest[0]);
                      done();
                    });
                });
            });
        });

    it('should compute and save the correct jackpot stats for a new jackpot that is '+
        'lower than the highest in the database', function(done) {
          const jackpot = drawsForStatsTest[0].jackpot;
          const drawNumber = drawsForStatsTest[0].drawNumber;
          mongoLottoplusDriver.saveOneDraw(drawsForStatsTest[1])
            .then(function(result) {
              mongoLottoplusDriver.updateJackpotStats({jackpot: jackpot, drawNumber:drawNumber})
                .then(function(result) {
                  mongoLottoplusDriver.getJackpotStats()
                    .then(function(stats) {
                      stats.highest.jackpot.should.be.eql(drawsForStatsTest[1].jackpot);
                      stats.highest.drawNumber.should.be.eql(drawsForStatsTest[1].drawNumber);
                      mongoLottoplusDriver.removeOneDraw(drawsForStatsTest[1]);
                      done();
                    });
                });
            });
        });
  });
});


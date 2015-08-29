"use strict";
var nlcbLottoplusDriver = require('../lottoplus/nlcb')(true);
var MOMENT = require('moment');
var SHOULD = require('should');
require('should-promised');

var expectedDraws = [{
  drawNumber: 1190,
  drawDate: new Date("2012 12 1"),
  numbersDrawn: [20, 26, 28, 32, 34, 8],
  jackpot: 4987528.04,
  numberOfWinners: 0}, {
    drawNumber: 1191,
    drawDate: new Date("2012 12 5"),
    numbersDrawn: [7, 15, 16, 24, 32, 5],
    jackpot: 5649713.5,
    numberOfWinners: 0}];


describe('nlcbLottoplusDriver', function() {
  this.timeout(90000);

  describe('#getDraw(<invalidProperty>)', function() {
    it('should throw error for invalid argument', function() {
      return nlcbLottoplusDriver.getDraw('lol').should.be.rejected();
    });
  });

  describe('#getDraw(<number>)', function() {
    it('should accept number', function() {
      return nlcbLottoplusDriver.getDraw(expectedDraws[0].drawNumber)
        .should.be.fulfilledWith(expectedDraws[0]);
    });
  });

  describe('#getDraw(<number-range>)', function() {
    it('should accept ranges with number start and end', function() {
      return nlcbLottoplusDriver.getDraw({
        start:expectedDraws[0].drawNumber, end:expectedDraws[1].drawNumber+1})
        .should.be.fulfilledWith(expectedDraws);
    });
  });

  describe('#getDraw(<date>)', function() {
    it('should accept Date', function(done) {
      nlcbLottoplusDriver.getDraw(expectedDraws[0].drawDate)
        .then(function(draw) {
          draw.should.be.eql(expectedDraws[0]);
          done(); 
        });
    });
  });

  describe('#getDraw(<date-range>)', function() {
    it('should accept ranges with date start and end', function() {
      return nlcbLottoplusDriver.getDraw({
        start: expectedDraws[0].drawDate,
        end:MOMENT(expectedDraws[1].drawDate).add(1, 'days').toDate()
      })
      .should.be.fulfilledWith(expectedDraws);
    });
  });

  describe('#getNextDraw()', function () {
    it('should return a get the latest jackpot, next draw number and date', function () {
      return nlcbLottoplusDriver.getNextDraw()
      .should.be.fulfilled();
    });
  });
});

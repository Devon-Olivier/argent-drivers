/************************************************************
 * File: lottoplus.mongo.js
 * Author: Devon Olivier
 * Year: 2014
 * Purpose: Manages connections and CRUD requests to the lottoplus
 *          mongo database 
 * Platform: node.js
 ***********************************************************/
'use strict';

//external modules
var Q = require('q');
var MONGODB = require('mongodb');
var MOMENT = require('moment');

//local modules
var DUTILS = require('../lib/utils.js');
var IS = require('../lib/is.js');
      
var MONGOCONF = require('../config/mongo-conf.json');
/** 
 * a Draw is an Object with the following properties
 * number: the draw number
 * date: Date object representing the date for this draw
 * numbersPlayed: an array of numbers played for this draw
 * jackpot: a number representing the jackpot for this draw
 * numberOfWinners: a number representing the number of winners for the draw
 **/

/**
 * _getDrawArray: MongoCollection MongoQueryObject -> promise for an array of draws
 **/
var _getDrawArray = function _getDrawArray (collection, queryObject) {
  return Q.invoke(collection, 'find', queryObject, {fields: {_id:0}})
    .then(function (cursor) {
      var deferred = Q.defer();
      var array = [];
      var stream = cursor.stream();

      stream.on('data', function (data) {
        array.push(data);
      });

      stream.on('error', function(error) {
        deferred.reject(error);
      });

      stream.on('end', function () {
        deferred.resolve(array);
      });
      return deferred.promise;
    });
};

/**
 * _getDraw: MongoCollection MongoQueryObject -> promise for a draw
 **/
var _getDraw = function _getDraw (collection, queryObject) {
  var deferred = Q.defer();
  collection.findOne(queryObject, {fields: {_id:0}}, function(error, draw) {
    if(error) {
      deferred.reject(error);
    }
    else {
      deferred.resolve(draw);
    }
  });
  return deferred.promise;
  
  //NOT SURE WHY THIS IS NOT WORKING
  //return Q.invoke(collection, 'findOne', queryObject, {fields: {_id:0}})
  //  .then(function (cursor) {
  //    return cursor;
  //  });
};

/**
 * DrawProperty is any one of the following types:
 *  number
 *  string
 *  Date
 *  MOMENT?(considering)
 *  object (with start and end properties of the previous types)
 *
 * getDraw: DrawProperty -> promise
 * Consume a DrawProperty of a set of draws return a promise for those draws
 * specified by the DrawProperty.
 *
 * If the DrawProperty is numeric return a promise for the draw with that number
 * property.
 * 
 * If the DrawProperty is an object with properties 'start' and 'end', which are
 * numeric, return a promise for an array of Draws whose number property is
 * in the range [start, end).
 *
 * If the DrawProperty is a string that is coerceable to a Date, return a promise
 * for the draw with that date property.
 *
 * If the DrawProperty is an object with properties 'start' and 'end', that are
 * both coerceable to a Date, return a promise for an array of Draws whose date
 * property is in the range [Date(start), Date(end)).
 *
 * else produce TypeError on property
 **/
var getDraw = function (property) {
  return Q.ninvoke(
      MONGODB.MongoClient,
      'connect',
      MONGOCONF.uri,
      {w:1})
    .then(function (db) {
      var doQuery = function doQuery (queryFunc, collection, queryObject) {
        return queryFunc(collection, queryObject)
          .then(function (draws) {
            db.close();
            return draws;
          },
          function (error) {
            db.close();
            throw error;
          });
      };
      return Q.ninvoke(db, 'collection', 'draws')
        .then(function (collection) {
          var queryObject = null;
          if (DUTILS.isNumeric(property)) {
            queryObject = {number: +property};
            return doQuery(_getDraw, collection, queryObject);
          }

          if (IS.numberRange(property)) {
            queryObject = {number: {$gte: +property.start, $lt: +property.end}};
            return doQuery(_getDrawArray, collection, queryObject);
          }

          //It is important to ensure that we don't have
          //numeric values or ranges before we consider dates
          //because we are not coercing numeric values to Dates
          if (IS.datish(property)) {
            queryObject = {date: MOMENT(property).toDate()};
            return doQuery(_getDraw, collection, queryObject);
          }

          if (IS.datishRange(property)) {
            var startMoment = MOMENT(property.start);
            var endMoment = MOMENT(property.end);
            
            queryObject = {date: {$gte: startMoment.toDate(), $lt: endMoment.toDate()}};
            return doQuery(_getDrawArray, collection, queryObject);
          }

          db.close();
          throw new TypeError('Argument invalid');
        });
    });
};

var saveDraw = function saveDraw (draws) {
  return Q.ninvoke(
      MONGODB.MongoClient,
      'connect',
      MONGOCONF.uri,
      {w:1})
    .then(function (db) {
      return Q.ninvoke(db, 'collection', 'draws')
        .then(function (collection) {
          var deferred = Q.defer();
          collection.insert(draws, {w:1}, function (error, savedDraws) {
            if (error) {
              deferred.reject(error);
            }
            else {
              deferred.resolve(savedDraws);
            }
            db.close();
          });
          return deferred.promise;
        });
    });
};

var removeDraw = function removeDraw (queryObject) {
  return Q.ninvoke(
      MONGODB.MongoClient,
      'connect',
      MONGOCONF.uri,
      {w:1})
    .then(function (db) {
      var deferred = Q.defer();
      db.collection('draws').remove(queryObject, {w:1}, function (error, n) {
        if (error) {
          deferred.reject(error);
        }
        else {
          deferred.resolve(n);
        }
        db.close();
      });
      return deferred.promise;
    });
}; 

var saveNewJackpot = function saveNewJackpot (jackpot) {
  return Q.ninvoke(
      MONGODB.MongoClient,
      'connect',
      MONGOCONF.uri,
      {w:1})
  .then(function (db) {
    var deferred = Q.defer();
    db.collection('stats').update({about: 'jackpot'},
      {$set:{newJackpot: jackpot}},
      {upsert: true},
      function (error, result) {
        if (error) {
          deferred.reject(error);
        }
        else {
          deferred.resolve(result);
        }
        db.close();
      });
    return deferred.promise;
  });

};

var getNewJackpot = function getNewJackpot() {
  return Q.ninvoke(
      MONGODB.MongoClient,
      'connect',
      MONGOCONF.uri,
      {w:1})
  .then(function (db) {
    var deferred = Q.defer();
    db.collection('stats').findOne({about: 'jackpot'}, function (error, stats) {
      if (error) {
        deferred.reject(error);
      }
      else {
        deferred.resolve(stats.newJackpot);
      }
    db.close();
    });
    return deferred.promise;
  });
};

exports.getDraw = getDraw;
exports.saveNewJackpot = saveNewJackpot;
exports.getNewJackpot = getNewJackpot;
exports.saveDraw = saveDraw;
exports.removeDraw = removeDraw;
exports.MOMENT = MOMENT;

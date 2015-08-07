/************************************************************
 * File: mongo.js
 * Author: Devon Olivier
 * Year: 2015
 * Purpose: Manages connections and CRUD requests to the lottoplus
 *          mongo database 
 * Platform: iojs
 ***********************************************************/
'use strict';
//native modules

//external modules
const MONGOCLIENT = require('mongodb').MongoClient;
const MOMENT = require('moment');
const LODASH = require('lodash');

const TYPE = require('./type.js');
const MONGOCONF = require('../config/mongo-conf.json');
const STORE = require('./table.js').store;
const RETRIEVE = require('./table.js').retrieve;
const MAKETABLE = require('./table.js').makeTable;

/** 
 * a Draw is an Object with the following properties
 * @param {drawNumber}:  the draw number //NOTE: internally we store this is _id
 * @param {drawDate}: Date object representing the date for this draw
 * @param {numbersDrawn}: an array of numbers played for this draw such
 *                        that numbersDrawn[5] is the powerball of the
 *                        draw
 * @param {drawjackpot}: number representing the jackpot for this draw
 * @param {numberOfWinners}: a number representing the number of 
 *                          winners for the draw
 **/


const installMongoGet = function installMongoGet(table) {

  const mongoDrawToNlcbDraw = function mongoDrawToNlcbDraw(mongoDraw) {
    const nlcbDraw = LODASH.omit(mongoDraw, '_id');
    nlcbDraw.drawNumber = mongoDraw._id;
    return nlcbDraw;
  };

  const getOne = function getOne(uri, queryObject) {
    return MONGOCLIENT.connect(uri)
      .then(function(db) {
        return db.collection('draws').findOne(queryObject)
          .then(function(draw) {
            db.close();
            if(draw === null) {
              return null;
            }
              
            return mongoDrawToNlcbDraw(draw);
          }, function(error) {
            db.close();
            throw error;
          });
      })
  };

  /**
   * getDrawArray: uri MongoQueryObject -> promise for an array of draws
   **/
  const getArray = function getArray (uri, queryObject) {
    return MONGOCLIENT.connect(uri).then(function(db){
      //TODO: streams might be better here instead of toArray
      return db.collection('draws').find(queryObject)
        .toArray()
        .then(function(draws) {
          db.close();
          console.log('getArray got ', draws);
          return draws.map(mongoDrawToNlcbDraw);
        }, function(error) {
          db.close();
          throw error;
        });
    });
  };

  /**
   * getNumber: uri number -> promise
   *
   * Consume a number and returns a promise for the draw with
   * a number property corresponding to that number from the
   * database specified by uri.
   *
   * @param {uri} a mongodb uri
   * @param {number} a draw number
   **/
  var getNumber = function getNumber(uri, number) {
    const queryObject = {_id: number};
    return getOne(uri, queryObject);
  };
  STORE(table, 'number', getNumber);

  /**
   * getNumberRange: uri Number-range -> promise
   * 
   * Consumes an Object with properties 'start' and 'end', that are
   * Number, return a promise for an array of Draws whose date property 
   * is in the range [start, end).
   *
   * @param {uri} a mongodb uri
   * @param {numberRange} {start: <number>, end: <number>}
   **/
  var getNumberList = function getNumberList(uri, numberRange) {
    const queryObject = {_id: {
        $gte: numberRange.start,
        $lt: numberRange.end
      }};
    return getArray(uri, queryObject);
  };
  STORE(table, 'number-range', getNumberList);

  /**
   * getDate: Date -> promise
   *
   * Consume a Date and returns a promise for the draw with a that date
   *
   * @param date representing a draw date;
   **/
  var getDate = function getDate(uri, date) {
    const queryObject = {drawDate: date};
    return getOne(uri, queryObject);
  };
  STORE(table, 'date', getDate);

  // TODO: As of 1st August 2015 nlcb.co.tt has broken query for dates and is
  //       also very slow in http response.
  //       Check for example, getDraw(new Date("2015 1 1") and others. They
  //       return a list of incorrect draws in the html. The parser does not
  //       recognize this and also does not parse any of the draws. FIX THAT!!
  //        
  //      Notice how similar this is to getNumberList can
  //      we generalize? Should we?
  /**
   * getDateRange: Date-range -> promise
   * Consumes an Object with properties 'start' and 'end', that are
   * Dates, return a promise for an array of Draws whose date property 
   * is in the range [start, end).
   **/
  var getDateList = function getDateList (uri, dateRange) {
    const queryObject = {drawDate: {
        $gte: dateRange.start,
        $lt: dateRange.end
      }};
    return getArray(uri, queryObject);
  };
  STORE(table, 'date-range', getDateList);
};
const getTable = MAKETABLE(); 
installMongoGet(getTable);


var getDraw = function getDraw(property) {
  //idea taken from GENERIC OPERATOR discussions in SICP
  var type = TYPE(property);
  console.log(property, ' type is ', type);
  if(!type) {
    return Promise.reject(new Error('dont understand type of ', property));
  }

  var getter = RETRIEVE(getTable, type);
  if(getter === undefined) {
    return Promise.reject(new Error("cannot get draw for this type of" +
          " draw property: " + property));
  }
  return getter(MONGOCONF.uri, property);
};
exports.getDraw = getDraw;

const nlcbDrawToMongoDraw = function nlcbDrawToMongoDraw(nlcbDraw) {
  const mongoDraw = LODASH.omit(nlcbDraw, 'drawNumber');
  mongoDraw._id = nlcbDraw.drawNumber;
  return mongoDraw;
};
const saveOneDraw = function saveOneDraw (uri, draw) {
  console.log('inside saveOneDraw');
  console.log('got ', draw);
  const mongoDraw = nlcbDrawToMongoDraw(draw);
  console.log('will insert ', mongoDraw);
  return MONGOCLIENT.connect(uri)
    .then(function (db) {
      console.log('got db');
      const collection =  db.collection('draws');
        return collection.insertOne(mongoDraw, {w:1})
        .then(function(result) {
          console.log('inserted %s', result.insertedCount);
          db.close();
          return result;
        }, function(error){
          db.close();
          console.log(error);
          throw error;
        });
    });
};
exports.saveOneDraw = function (draws) {
  return saveOneDraw(MONGOCONF.uri, draws);
};

const saveManyDraws = function saveManyDraws (uri, draws) {
  console.log('inside saveManyDraws');
  console.log('got ', draws);
  const mongoDraws = draws.map(function (draw) {
    return nlcbDrawToMongoDraw (draw);
  });
  console.log('will insert ', mongoDraws);
  return MONGOCLIENT.connect(uri)
    .then(function (db) {
      console.log('got db');
      const collection =  db.collection('draws');
      return collection.insertMany(mongoDraws, {w:1})
        .then(function(result) {
          console.log('inserted %s', result.insertedCount);
          db.close();
          return result;
        }, function(error){
          db.close();
          console.log(error);
          throw error;
        });
    });
};
exports.saveManyDraws = function (draws) {
  return saveManyDraws(MONGOCONF.uri, draws);
};


//TODO://use generic operators to do the dispatch on type?
var removeOneDraw = function removeOneDraw (uri, nlcbDraw) {
  console.log('inside removeDraw');
  console.log('asked to delete ', nlcbDraw);
  const mongoDraw = nlcbDrawToMongoDraw(nlcbDraw);
  console.log('abount to delete ', mongoDraw);
  return MONGOCLIENT.connect(uri)
    .then(function (db) {
      console.log('got db');
      const collection = db.collection('draws');
      console.log('got draws collection');
      return collection.deleteOne(mongoDraw, {w:1})
        .then(function(result){ 
          console.log('deleted %s draw', result.deletedCount);
          db.close();
          return result;
        }, function(error) {
          console.log(error);
          db.close();
          throw error;
        });
    });
}; 
exports.removeOneDraw = function(query) {
  return removeOneDraw(MONGOCONF.uri, query);
};

var saveNewJackpot = function saveNewJackpot (uri, jackpot) {
  return MONGOCLIENT.connect(uri)
    .then(function (db) {
      console.log('got db');
      const collection = db.collection('lottoplus-stats');
      console.log('got draws collection');
      collection.removeMany.bind(collection);
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
exports.saveNewJackpot = saveNewJackpot;

var getNewJackpot = function getNewJackpot(uri) {
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
        if (stats) {
          deferred.resolve(stats.newJackpot);
        }
        else {
          deferred.resolve(null);
        }
      }
      db.close();
    });
    return deferred.promise;
  });
};

exports.getNewJackpot = getNewJackpot;

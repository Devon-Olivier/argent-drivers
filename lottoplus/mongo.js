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

//argent submodules
const TYPE = require('./type.js');
const MONGOCONF = require('../config/mongo-conf.json');

//TODO: IMPROVE ERROR REPORTING AND DETECTING

//TODO: convert table.js to object oriented module. It is more functional now
//but it is jus message passing really isn't it? Look at how it is 
//used... STORE(<table>, <type>, <function>) ... which should be
//TABLE.store(<type>, <function>) ent?
const STORE = require('./table.js').store;
const RETRIEVE = require('./table.js').retrieve;
const MAKETABLE = require('./table.js').makeTable;

/** 
 * A Draw is an Object with the following properties
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

  /**
   * getOne: uri, queryObject -> promise for a Draw
   *
   * consume a mongodb uri specifying a database and a mongo query object
   * and return one draws from the database that satisfies the query object
   *
   * @param {uri} the uri specifying the database to use
   * @param {queryObject} the query object
   * @return {Promise} a Promise for a Draw 
   * @api private
   **/
  const getOne = function getOne(uri, queryObject) {
    debugLog('getOne: connecting to ', uri);
    return MONGOCLIENT.connect(uri)
      .then(function(db) {
        debugLog('getOne: connected to ', uri);
        return db.collection('draws').findOne(queryObject)
          .then(function(draw) {
            debugLog('getOne: got a draw: ', draw);
            db.close();
            if(draw === null) {
              return null;
            }
            return mongoDrawToNlcbDraw(draw);
          }, function(error) {
            debugError('getOne: ERROR: ', error);
            db.close();
            throw error;
          });
      })
  };

  /**
   * getDrawArray: uri, MongoQueryObject -> promise for an array of Draws
   *
   * consume a mongodb uri specifying a database and a mongo query object
   * and return a Promise for an array of draws from the database that 
   * satisfies the query object
   *
   * @param {uri} the uri specifying the database to use
   * @param {queryObject} the query object
   * @return {Promise} a Promise for an array of Draws 
   * @api private
   **/
  const getArray = function getArray (uri, queryObject) {
    debugLog('getArray: connecting to ', uri);
    return MONGOCLIENT.connect(uri).then(function(db){
      debugLog('getArray: connected to ', uri);
      //TODO: streams might be better here instead of toArray
      return db.collection('draws').find(queryObject)
        .toArray()
        .then(function(draws) {
          debugLog('getArray: got a draws: ', draws);
          db.close();
          return draws.map(mongoDrawToNlcbDraw);
        }, function(error) {
          db.close();
          debugError('getArray: ERROR: ', error);
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
   * @param {uri} a mongodb uri specifying a database
   * @param {number} a Draw number
   * @return {Promise} for a Draw
   * @api public
   **/
  const getNumber = function getNumber(uri, number) {
    debugLog('getNumber: asked to get: ', number);
    const queryObject = {_id: number};
    debugLog('getNumber: calling getOne with: ', queryObject);
    return getOne(uri, queryObject);
  };
  STORE(table, 'number', getNumber);

  /**
   * getNumberRange: uri Number-range -> promise
   * 
   * Consumes an Object with properties 'start' and 'end', that are
   * Numbers; return a promise for an array of Draws whose date property 
   * is in the range [start, end).
   *
   * @param {uri} a mongodb uri
   * @param {numberRange} {start: <number>, end: <number>}
   * @return {Promise} a promies for an array of Draws
   * @api public
   **/
  const getNumberList = function getNumberList(uri, numberRange) {
    debugLog('getNumberList: asked to get: ', numberRange);
    const queryObject = {_id: {
        $gte: numberRange.start,
        $lt: numberRange.end
      }};
    debugLog('getNumberList: calling getArray with ', queryObject);
    return getArray(uri, queryObject);
  };
  STORE(table, 'number-range', getNumberList);

  /**
   * getDate: uri, Date -> Promise
   *
   * Consume a uri specifying a mongodb database and a  Date and returns 
   * a Promise for the draw with a that date
   *
   * @param {uri} uri specifying a mongo database
   * @param {date} representing a draw date;
   * @return {Promise} for a Draw
   * @api public
   **/
  const getDate = function getDate(uri, date) {
    debugLog('getDate: asked to get: ', date);
    const queryObject = {drawDate: date};
    debugLog('getDate: calling getOne with: ', queryObject);
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
   * getDateRange: uri, Date-range -> promise
   *
   * Consumes an uri specifying a mongodb database and an Object with properties 
   * 'start' and 'end', that are Dates, return a Promise for an array of Draws 
   * whose date property is in the range [start, end).
   *
   * @param {uri} an uri specifying a mongodb database
   * @param {dateRange} Object {start: <Date>, end: <Date>}
   * @return {Promise} for an array of Draws
   * @api public
   **/
  const getDateList = function getDateList (uri, dateRange) {
    debugLog('getDateList: asked to get: ', dateRange);
    const queryObject = {drawDate: {
        $gte: dateRange.start,
        $lt: dateRange.end
      }};
    debugLog('getDateList: calling getArray with ', queryObject);
    return getArray(uri, queryObject);
  };
  STORE(table, 'date-range', getDateList);
};
const getTable = MAKETABLE(); 
installMongoGet(getTable);


const getDraw = function getDraw(property) {
  //idea taken from GENERIC OPERATOR discussions in SICP
  const type = TYPE(property);
  debugLog('getDraw: ', property, ' type is ', type);
  if(!type) {
    return Promise.reject(new Error('dont understand type of ', property));
  }

  const getter = RETRIEVE(getTable, type);
  if(getter === undefined) {
    return Promise.reject(new Error("cannot get draw for this type of" +
          " draw property: " + property));
  }
  return getter(MONGOURI, property);
};


/**
 * nlcbDrawToMongoDraw : Draw -> draw for mongo database
 *
 * consume a Draw as described above and return a draw to ge stored in the
 * mongodb database.
 *
 * @param {Draw} a draw from a mongodb store of draws
 * @return {mongoDraw}
 * @api private
 **/
const nlcbDrawToMongoDraw = function nlcbDrawToMongoDraw(nlcbDraw) {
  const mongoDraw = LODASH.omit(nlcbDraw, 'drawNumber');
  mongoDraw._id = nlcbDraw.drawNumber;
  return mongoDraw;
};

/**
 * mongoDrawToNlcbDraw: draw from mongo database -> Draw
 *
 * consume a draw from the mongodb store of draws and return a
 * draw as described above.
 *
 * @param {mongoDraw} a draw from a mongodb store of draws
 * @return {Draw}
 * @api private
 **/
const mongoDrawToNlcbDraw = function mongoDrawToNlcbDraw(mongoDraw) {
  const nlcbDraw = LODASH.omit(mongoDraw, '_id');
  nlcbDraw.drawNumber = mongoDraw._id;
  return nlcbDraw;
};

/**
 * saveOneDraw: uri, Draw -> Promise for a native mongodb driver resultObject
 *
 * consume a mongodb uri specifying a database and a Draw; attempt to save the
 * Draw and return a Promise for a mongodb native drive resultObject 
 *
 * @param {uri} the uri specifying the database to use
 * @param {draw} the draw to save
 * @return {Promise} a Promise for a resultObject
 * @api public
 **/
const saveOneDraw = function saveOneDraw (uri, draw) {
  debugLog('saveOneDraw: asked to save ', draw);
  const mongoDraw = nlcbDrawToMongoDraw(draw);
  debugLog('saveOneDraw: will insert ', mongoDraw);
  debugLog('saveOneDraw: connecting to ', uri);
  return MONGOCLIENT.connect(uri)
    .then(function (db) {
      debugLog('saveOneDraw: connected to ', uri);
      const collection =  db.collection('draws');
      return collection.insertOne(mongoDraw, {w:1})
        .then(function(result) {
          debugLog('saveOneDraw: inserted %s Draw', result.insertedCount);
          db.close();
          return result;
        }, function(error){
          db.close();
          debugLog('saveOneDraw: ERROR: ', error);
          throw error;
        });
    });
};


/**
 * saveManyDraws: uri, Draws -> Promise for a native mongodb driver resultObject
 *
 * consume a mongodb uri specifying a database and an array of Draws and return a
 * Promise for a mongodb native drive resultObject 
 *
 * @param {uri} the uri specifying the database to use
 * @param {draws} an array of Draws
 * @return {Promise} a Promise for a resultObject
 * @api public
 **/
const saveManyDraws = function saveManyDraws (uri, draws) {
  debugLog('saveManyDraws: asked to save ', draws);
  const mongoDraws = draws.map(function (draw) {
    return nlcbDrawToMongoDraw (draw);
  });
  debugLog('saveManyDraws: will insert ', mongoDraws);
  debugLog('saveManyDraws: connecting to ', uri);
  return MONGOCLIENT.connect(uri)
    .then(function (db) {
      debugLog('saveManyDraws: connected to ', uri);
      const collection =  db.collection('draws');
      return collection.insertMany(mongoDraws, {w:1})
        .then(function(result) {
          debugLog('saveManyDraws: inserted %s Draws', result.insertedCount);
          db.close();
          return result;
        }, function(error){
          db.close();
          debugError('saveManyDraws: ERROR: ', error);
          throw error;
        });
    });
};


/**
 * removeOneDraw: uri, Draw -> Promise for a native mongodb driver resultObject
 *
 * consume a mongodb uri specifying a database and a Draw and return a
 * Promise for a mongodb native driver resultObject 
 *
 * @param {uri} the uri specifying the database to use
 * @param {draws} a Draw 
 * @return {Promise} a Promise for a resultObject
 * @api public
 **/
const removeOneDraw = function removeOneDraw (uri, nlcbDraw) {
  debugLog('removeOneDraw: asked to delete ', nlcbDraw);
  const mongoDraw = nlcbDrawToMongoDraw(nlcbDraw);
  debugLog('removeOneDraw: will delete ', mongoDraw);
  debugLog('removeOneDraw: connecting to ', uri);
  return MONGOCLIENT.connect(uri)
    .then(function (db) {
      debugLog('removeOneDraw: connected to ', uri);
      const collection = db.collection('draws');
      return collection.deleteOne(mongoDraw, {w:1})
        .then(function(result){ 
          debugLog('removeOneDraw: deleted %s draw', result.deletedCount);
          db.close();
          return result;
        }, function(error) {
          debugError('removeOneDraw: ERROR: ', error);
          db.close();
          throw error;
        });
    });
}; 

/**
 * calculateHighestJackpot: uri, newJackpotInfo -> Promise for an object 
 *
 * consume a mongodb uri specifying a database and an object specifying the 
 * draw number and value of the new estimated jackpot for the next lottoplus 
 * draw. return a Promise for a highest jackpot object
 *
 * The highest jackpot object:
 *  {
 *    drawNumber: <number> draw number with highest jackpot
 *    jackpot: <number> highest jackpot
 *  }
 *
 * If newJackpotInfo is null or undefined then the mean is derived from the 
 * database only. Else newJackpotInfo is used in calculating the highest
 * together with the database.
 *
 * @param {uri} the uri specifying the database to use
 * @param {newJackpotInfo} object {drawNumber: <number>, jackpot: <number>} 
 * @return {Promise} a Promise for a highest jackpot object
 * @api private
 **/
const calculateHighestJackpot = function(uri, newJackpotInfo) {
  debugLog('calculateHighestJackpot: new jackpot info is: ',
      newJackpotInfo);
  debugLog('calculateHighestJackpotInfo: connecting to ', uri);
  return MONGOCLIENT.connect(uri)
    .then(function(db) {
      debugLog('calculateHighestJackpotInfo: connected to ', uri);
      return db.collection('draws')
        .find({}, {limit: 1, sort: {jackpot: -1}, fields: {_id: true, jackpot: true}})
        .next()
        .then(function (highestJackpotInfo) {
          db.close();

          debugLog('calculateHighestJackpotInfo: highest jackpot info from database: ', 
              highestJackpotInfo);
          if(newJackpotInfo && newJackpotInfo.jackpot > highestJackpotInfo.jackpot){
            return newJackpotInfo
          }
          return mongoDrawToNlcbDraw(highestJackpotInfo);
        });
    }).catch(function(error) {
      debugError(error);
      db.close();
      throw error;
    });
};

//TODO: getStandardDeviationJackpot = functino getStandardDeviationJackpot(uri){};

/**
 * calculateMeanJackpot: uri, newJackpotInfo -> Promise for an object 
 *
 * consume a mongodb uri specifying a database and an object specifying the 
 * draw number and value of the new estimated jackpot for the next lottoplus 
 * draw. return a Promise for the mean jackpot. 
 *
 * If newJackpotInfo is null or undefined then the mean is derived from the 
 * database only. Else newJackpotInfo is used in calculating the statistics
 * together with the database.
 *
 * @param {uri} the uri specifying the database to use
 * @param {newJackpotInfo} object {drawNumber: <number>, jackpot: <number>} 
 * @return {Promise} a Promise for the mean jackpot 
 * @api private
 **/
const calculateMeanJackpot = function calculateMeanJackpot(uri, newJackpotInfo) {
  debugLog('calculateMeanJackpot: connecting to ', uri);
  return MONGOCLIENT.connect(uri)
    .then(function(db) {
      debugLog('calculateMeanJackpot: connected to ', uri);
      return db.collection('draws')
        .aggregate([
            {$group: {
                       _id: null, 
                       meanJackpot: {$avg: '$jackpot'},
                       count: {$sum: 1}
                     }}
        ])
        .next()
        .then(function (meanJackpotInfo) {
          db.close();

          debugLog('calculateMeanJackpot: mean jackpot info from database: ',
              meanJackpotInfo);
          const meanJackpot = meanJackpotInfo.meanJackpot;
          if(newJackpotInfo) {
            let oldMean = meanJackpot;
            let n = meanJackpotInfo.count;
            let newJackpot = newJackpotInfo.jackpot;
            let newMean = (oldMean * n + newJackpot)/(n+1);
            return LODASH.round(newMean, 2);
          }
          return LODASH.round(meanJackpot, 2);
        });
    }).catch(function(error) {
      debugError(error);
      db.close();
      throw error;
    });
};

/**
 * calculateJackpotStats: uri, newJackpotInfo -> Promise for an object 
 *
 * consume a mongodb uri specifying a database and an object specifying the 
 * draw number and value of the new estimated jackpot for the next lottoplus 
 * draw. Calculates the jackpot statistics and return a Promise for an object 
 * with the stats.
 * 
 * The jackpot stats object: 
 * {
 *  next: {
 *    drawNumber: <number> draw number for next draw
 *    jackpot: <number> estimated jackpot for next draw
 *  },
 *  highest: {
 *     drawNumber: <number> the draw number of the highest jackpot
 *     jackpot: <number> the highest jackpot
 *  },
 *  meanJackpot: <number> the mean jackpot}
 *
 * If newJackpotInfo is null or undefined then the statistics are derived from
 * the database only. Else newJackpotInfo is used in calculating the statistics
 * together with the database.
 *
 * @param {uri} the uri specifying the database to use
 * @param {newJackpotInfo} object {drawNumber: <number>, jackpot: <number>} 
 * @return {Promise} a Promise for a jackpot stats object
 * @api private
 **/
const calculateJackpotStats = function calculateJackpotStats(uri, newJackpotInfo) {
  return calculateHighestJackpot(uri, newJackpotInfo)
    .then(function(highestJackpotInfo) {
      return calculateMeanJackpot(uri, newJackpotInfo)
        .then(function (meanJackpot) {
          var stats = {
            highest: highestJackpotInfo,
            mean: meanJackpot
          };

          if(newJackpotInfo) {
            stats.next = newJackpotInfo;
          }
          return stats;
        });
    });
};

/**
 * updateJackpotStats: uri, newJackpotInfo -> Promise for a native mongodb driver resultObject
 *
 * consume a mongodb uri specifying a database and an object specifying the draw number and
 * value of the new estimated jackpot for the next lottoplus draw.
 *
 * Updates the jackpot statistics  and return a Promise for a mongodb native drive resultObject.
 * If newJackpotInfo is null or undefined then the statistics are derived from the database only.
 * Else the newJackpotInfo is used in computing the statistics together with the database.
 *
 * @param {uri} the uri specifying the database to use
 * @param {newJackpotInfo} object {drawNumber: <number>, jackpot: <number>} 
 * @return {Promise} a Promise for a resultObject
 * @api public
 **/
const updateJackpotStats = function updateJackpotStats (uri, newJackpotInfo) {
  return calculateJackpotStats(uri, newJackpotInfo)
    .then(function(jackpotStats) {
      debugLog('updateJackpotStats: ', jackpotStats);
      return MONGOCLIENT.connect(uri)
        .then(function(db) {
          jackpotStats._id = 'jackpot';
          return db.collection('lottoplusStats')
            .updateOne({_id: 'jackpot'}, jackpotStats, {w:1, upsert: true})
        });
    })
  .catch(function(error) {
    debugError(error);
    db.close();
    throw error
  });
};

const getJackpotStats = function getJackpotStats(uri) {
  debugLog('getJackpotStats: connecting to ', uri);
  return MONGOCLIENT.connect(uri)
    .then(function (db) {
      debugLog('getJackpotStats: connected to ', uri);
      return db.collection('lottoplusStats')
        .findOne({_id: 'jackpot'}, {_id:false})
        .then(function(stats) {
          db.close();
          debugLog('getJackpotStats: stats: ', stats);
          return stats;
        });
    }).catch(function(error) {
      debugError(error);
      db.close();
      throw error;
    });
};

var debugLog = function () {};
var debugError = function () {};
var MONGOURI = MONGOCONF.uri;
module.exports = function(debug) {
  //TODO: add a 'test' mode so that we don't have
  //to be forced to see debug information just to
  //test the module
  if(debug) {
    debugLog = console.log.bind(console);
    debugError = console.error.bind(console);
    MONGOURI = MONGOCONF.debugUri;
    debugLog('MONGOCONF is ', MONGOCONF)
      debugLog('MONGOURI set to ', MONGOURI);
  }
  return module.exports;
};

module.exports.getDraw = getDraw;

module.exports.removeOneDraw = function(query) {
  //TODO: consider making this less general and
  //require only a draw number specifying the
  //draw to delete. Using a query object can be
  //dangerous.
  //Also, deleting draws permanently is probably
  //a bad idea. Maybe we should store deleted
  //draws into another collection.
  return removeOneDraw(MONGOURI, query);
};

module.exports.saveManyDraws = function (draws) {
  return saveManyDraws(MONGOURI, draws);
};

module.exports.saveOneDraw = function (draws) {
  return saveOneDraw(MONGOURI, draws);
};

module.exports.getJackpotStats = function() {
  return getJackpotStats(MONGOURI);
};
module.exports.updateJackpotStats = function (jackpotInfo) {
  return updateJackpotStats(MONGOURI, jackpotInfo);
};

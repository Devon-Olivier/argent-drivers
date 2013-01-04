var DRIVERS = require('../argent-drivers.js');
var moment = DRIVERS.moment;
console.log(DRIVERS);

dbConfig = {
  'database': 'mongo',
  'address': 'localhost:27017/lottoplus?auto_reconnect',
  'username': null,
  'password': null
};

var lottoplusNlcbDriver = DRIVERS.lottoplus.nlcb.createDriver();
var lottoplusMongoDriver = DRIVERS.lottoplus.mongo.createDriver(dbConfig);

lottoplusMongoDriver.getDrawDate(moment('2012 12 2'), function drawNumberCallback(error, draw){
  if(error !== null){
    console.log(error);
    lottoplusMongoDriver.close(function(){});
    return;
  }
  console.log(draw);
  lottoplusMongoDriver.close(function(){});
});

console.log(lottoplusNlcbDriver);
lottoplusNlcbDriver.getDrawNumberRange({start:1, end:2}, function drawNumberRangeCallback(error, draws){
  if(error !== null){
    console.log(error);
    return;
  }
  console.log(draws);
});

var range = {
  start: moment('2012 12 1', 'YYYY MM DD'),
  end: moment('2013 1 1', 'YYYY MM DD')
};
lottoplusNlcbDriver.getDrawDateRange(range, function drawDateRangeCallback(error, draws){
  if(error !== null){
    console.log(error);
    return;
  }
  console.log(draws);
});

var DRIVERS = require('../argent-drivers.js');
console.log(DRIVERS);

var lottoplusNlcbDriver = DRIVERS.lottoplus.nlcb.createDriver();
console.log(lottoplusNlcbDriver);
lottoplusNlcbDriver.getDrawNumberRange({start:1, end:2}, function drawNumberRangeCallback(error, draws){
  if(error !== null){
    console.log(error);
    return;
  }
  console.log(draws);
});

var moment = DRIVERS.moment;
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

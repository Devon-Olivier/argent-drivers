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

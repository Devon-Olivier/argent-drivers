#argent-drivers

Drivers to lottoplus database stores.

###Install dependencies

###depends on

* [node.js](http://nodejs.org)

  It may be best to install nodejs using your distribution's package
  manager on linux.

  On mac osx the best way seems to be to install using 
  [macports](http://www.macports.org/)
  or [homebrew](http://mxcl.github.com/homebrew/).

  Windows users are lord over us all and aware of their download-double-click
  syndrome so they know what to do to install nodejs.

  To install on [arch linux](http://archlinux.org):

  `pacman -Sy nodejs`

###Install argent-drivers

  `git clone https://github.com/Devon-Olivier/argent-drivers.git` to get `argent-drivers`

  `npm install` in the root of the repository installs the node modules 
  dependencies.

###Usage

The lottoplus driver factories are in
```js
var lottoplusDrivers = require('argent-drivers').lottoplus;
```
We are expecting to have others such as playwhe and cashpot.

#### `.lottoplus.nlcb`
Scrapes nlcb.co.tt for lottoplus draws.

Get a scraper:
```js
var nlcbLottoplusDriver = lottoplusDrivers.nlcb.createDriver();
```
####Methods of the scraper

#### `.getDrawDateRange(range, drawDateRangeCallback)`

Get draws in given date-range:

`getDrawDateRange`(`range`, `drawDateRangeCallback`) calls 
`drawDateRangeCallback` with the draws whose dates are 
within the range specified by `range`. The draws passed on to 
`drawDateRangeCallback` shall have dates greater than or equal to
the start boundary of the range, and less than the end
boundary of the range. i.e. all dates in \[`start`, `end`).

`range` is an object with properties `start` and `end`.
Each of these is an instance of Moment---see [moment.js docs]
(http://momentjs.com/docs/). The `start` Moment represents the
start boundary of the date range and the `end` Moment represents 
the end boundary of the date range.

`drawDateRangeCallback` is called with an error object, which
is null if no error occured, and an array containing the 
draws with dates in range that could have been retrieved.

The following prints all draws in December 2012.
```js
var lottoplusDrivers = require('argent-drivers').lottoplus;
var nlcbLottoplusDriver = lottoplusDrivers.nlcb.createDriver();
var MOMENT = require('moment');

var range = {
  start: MOMENT('2012 12 1', 'YYYY MM DD'),
  end: MOMENT('2013 1 1', 'YYYY MM DD')
};

nlcbLottoplusDriver.getDrawDateRange(range, function(error, draws){
  if(error){
    console.log(error);
    return;
  }
  draws.forEach(function(draw){
    console.log(draw);
  });
});
```
#### `.getDrawNumberRange(range, drawNumberRangeCallback)`

Get draws in given number-range:

`getDrawNumberRange`(`range`, `drawNumberRangeCallback`) calls 
`drawNumberRangeCallback` with the draws whose numbers are 
within the range specified by `range`. The draws passed on to 
`drawNumberRangeCallback` shall have numbers greater than or equal to
the start boundary of the range, and less than the end
boundary of the range. i.e. all numbers in \[`start`, `end`).

`range` is an object with number properties `start` and `end`.
`start` represents the start boundary of the number range and 
`end` represents the end boundary of the number range.

`drawNumberRangeCallback` is called with an error object, which
is null if no error occured, and an array containing the 
draws with numbers in range that could have been retrieved.

The following prints draws with numbers from 1 to 10 inclusive.
```js
var lottoplusDrivers = require('argent-drivers').lottoplus;
var nlcbLottoplusDriver = lottoplusDrivers.nlcb.createDriver();

var range = {
  start: 1, 
  end: 11 
};

nlcbLottoplusDriver.getDrawNumberRange(range, function(error, draws){
  if(error){
    console.log(error);
    return;
  }
  draws.forEach(function(draw){
    console.log(draw);
  });
});
```
#### `.lottoplus.mongo`
Stores and retrieves draws from a mongo database.

###Usage

Get a driver:
```js
//Change these to reflect your mongo setup
var dbOptions = {
  'address': 'localhost:27017/lottoplus?auto_reconnect',
  'username': null,
  'password': null
};
var mongoLottoplusDriver = lottoplusDrivers.mongo.createDriver(dbOptions);
```
####Methods of the driver

#### `.getDrawDateRange(range, drawDateRangeCallback)`

Get draws in given date-range:

`getDrawDateRange`(`range`, `drawDateRangeCallback`) calls 
`drawDateRangeCallback` with the draws whose dates are 
within the range specified by `range`. The draws passed on to 
`drawDateRangeCallback` shall have dates greater than or equal to
the start boundary of the range, and less than the end
boundary of the range. i.e. all dates in \[`start`, `end`).

`range` is an object with properties `start` and `end`.
Each of these is an object is an instance of Moment--- 
see [moment.js docs](http://momentjs.com/docs/). The `start` 
Moment represents the start boundary of the date range and the 
`end` Moment represents the end boundary of the date range.

`drawDateRangeCallback` is called with an error object, which
is null if no error occured, and an array containing the 
draws with dates in range that could have been retrieved.

The following prints all draws in December 2012.
```js
var lottoplusDrivers = require('argent-drivers').lottoplus;
var mongoLottoplusDriver = lottoplusDrivers.mongo.createDriver();
var MOMENT = require('moment');

var range = {
  start: MOMENT('2012 12 1', 'YYYY MM DD'),
  end: MOMENT('2013 1 1', 'YYYY MM DD')
};

mongoLottoplusDriver.getDrawDateRange(range, function(error, draws){
  if(error){
    console.log(error);
    return;
  }
  draws.forEach(function(draw){
    console.log(draw);
  });
});
```
#### `.getDrawNumberRange(range, drawNumberRangeCallback)`

Get draws in given number-range:

`getDrawNumberRange`(`range`, `drawNumberRangeCallback`) calls 
`drawNumberRangeCallback` with the draws whose numbers are 
within the range specified by `range`. The draws passed on to 
`drawNumberRangeCallback` shall have numbers greater than or equal to
the start boundary of the range, and less than the end
boundary of the range. i.e. all numbers in \[`start`, `end`).

`range` is an object with number properties `start` and `end`.
`start` represents the start boundary of the number range and 
`end` represents the end boundary of the number range.

`drawNumberRangeCallback` is called with an error object, which
is null if no error occured, and an array containing the 
draws with numbers in range that could have been retrieved.

The following prints draws with numbers from 1 to 10 inclusive.
```js
var lottoplusDrivers = require('argent-drivers').lottoplus;
var mongoLottoplusDriver = lottoplusDrivers.mongo.createDriver();

var range = {
  start: 1, 
  end: 11 
};

mongoLottoplusDriver.getDrawNumberRange(range, function(error, draws){
  if(error){
    console.log(error);
    return;
  }
  draws.forEach(function(draw){
    console.log(draw);
  });
});
```
#### `.storeDraws(draws, storeDrawsCallback)`

Store the draws in the lottoplus mongo database.

`storeDraws`(`draws`, `storeDrawsCallback`) calls `storeDrawsCallback` with
no arguments after storing `draws` in the `draws` collection of the database.

`draws` is an array of objects representing the draws.

#argent-drivers

Drivers to lottoplus database stores.

The project as several parts. The following section lists each part, its purpose and the files and tools needed to make use of it.

###install dependencies

There is currently a bug in contextify which is a dependency of jsdom installation
of dependencies of argent-drivers fail because if it. Working on a solution.

  `npm install` in the root of the repository installs the dependencies.

###usage

The lottoplus driver factories are in
```js
var lottoplusDrivers = require('argent-drivers').lottoplus;
```
We are expecting to have others such as playwhe and cashpot.

#### .lottoplus.nlcb
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
Each of these is an object is an instance of Moment--- 
see [moment.js docs](http://momentjs.com/docs/). The `start` 
Moment represents the start boundary of the date range and the 
`end` Moment represents the end boundary of the date range.

`drawDateRangeCallback` is called with an error object, which
is null if no error occured, and an array containing the 
draws with dates in range that could have been retrieved.

The following prints all draws in december 2012.
```js
var NLCBDRIVER = require('./drivers/lottoplus/nlcb.js').createDriver();
var MOMENT = require('moment');

var range = {
  start: MOMENT('2012 12 1', 'YYYY MM DD'),
  end: MOMENT('2013 1 1', 'YYYY MM DD')
};

NLCBDRIVER.getDrawDateRange(range, function(error, draws){
  if(error){
    console.log(error);
    return;
  }
  draws.forEach(console.log);
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
var NLCBDRIVER = require('./drivers/lottoplus/nlcb.js').createDriver();

var range = {
  start: 1, 
  end: 11 
};

NLCBDRIVER.getDrawNumberRange(range, function(error, draws){
  if(error){
    console.log(error);
    return;
  }
  draws.forEach(console.log);
});
```
## drivers/lottoplus/mongo.js

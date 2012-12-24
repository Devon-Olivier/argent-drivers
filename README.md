#argent-drivers

Drivers to lottoplus database stores.

The project as several parts. The following section lists each part, its purpose and the files and tools needed to make use of it.

###depends on

* [node.js](http://nodejs.org)

  It may be best to install nodejs using your distribution's package
  manager on linux.

  On mac osx the best way seems to be to install using 
  [macports](http://www.macports.org/)
  or [homebrew](http://mxcl.github.com/homebrew/).

  Windows users are lord over us all and aware of their download-double-click
  syndrome so they know what to do.

  To install on [arch linux](http://archlinux.org):

  `pacman -Sy nodejs`
  
* [moment.js](http://momentjs.com)

  Install using [npm](http://npmjs.org):

  `npm install momentjs`
* [jsdom.js](https://github.com/tmpvar/jsdom)
  
  Install using [npm](http://npmjs.org):

  `npm install jsdom`

  running `npm install` in the root of the repository installs the last two for you.

#Les parties du projet

Scrapes nlcb.co.tt for lottoplus draws.
###usage

#### `.createDriver()`

Get a scraper:

```js
var NLCBDRIVER = require('./drivers/lottoplus/nlcb.js').createDriver();
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

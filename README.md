#TODO: UPDATE README

#argent-drivers

NLCB game results scrapers.

##Installation 

Install [node.js](https://nodejs.org)

`argent-drivers` is in the npm repository. To install

`$ npm install argent-drivers`

This is the recommended way to install `argent-drivers`.

You can also get `argent-drivers` from [github.com](https://www.github.com)

`git clone https://github.com/Devon-Olivier/argent-drivers.git` to get `argent-drivers`

`$ npm install` in the root of the repository installs the node modules 
dependencies.

##Usage

###The lottoplus scraper
```js
var lottoplusDrivers = require('argent-drivers').lottoplus;
```
Scrapes nlcb.co.tt for lottoplus draws.

#### `.getDraw(DrawProperty)`

getDraw: DrawProperty -> promise
Consume a DrawProperty of a set of draws return a promise for those draws
specified by the DrawProperty.

DrawProperty is any one of the following types:

1. number
2. Date
3. RangeObject:   
 * {start: < Date >, end: < Date >} or
 * {start: < number >, end: < number >}

If the DrawProperty is a number return a promise for the draw with that number
If the DrawProperty is a Date, return a promise for the draw on that date.
If the DrawProperty is a RangeObject then return a promise for an array of
draws in [RangeObject.start, RangeObject.end);

Get draw of a given date:

The following prints the draw for 1 December, 2012.
```js
#! /usr/bin/env node
var lottoNlcb = require('argent-drivers').lottoplus;
lottoNlcb.getDraw('2012 12 1').then(console.log, console.error);
```

Get draws in given date-range:

The following prints all draws in December 2012.
```js
#! /usr/bin/env node
var lottoNlcb = require('argent-drivers').lottoplus;

var range = {
  start: '2012 12 1',
  end: '2013 1 1'
};

lottoNlcb.getDraw(range).then(console.log, console.error);
```
Get draw of a given number:

The following prints the first lottoplus draw ever.
```js
#! /usr/bin/env node
var lottoNlcb = require('argent-drivers').lottoplus;

lottoNlcb.getDraw(1).then(console.log, console.error);
```
Get draws in given number-range:

The following prints draws with numbers from 1 to 10 inclusive.
```js
#! /usr/bin/env node
var lottoNlcb = require('argent-drivers').lottoplus;

var range = {
  start: 1, 
  end: 11 
};

lottoNlcb.getDraw(range).then(console.log, console.error);
```
### `.getNextDraw()`

getNextDraw: undefined -> Promise for the next Draw

Returns a Promise for the next draw to be played. The `numbersPlayed` and `numberOfWinners` properties are undefined.

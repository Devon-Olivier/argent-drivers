#argent-drivers

Drivers to lottoplus database stores.

##Install dependencies

depends on [node.js](http://nodejs.org)

##Install argent-drivers
  `argent-drivers` is in the npm repository. To install
  
  `$ npm install argent-drivers`
  
  This is the recommended way to install `argent-drivers`.

  You can also get `argent-drivers` from [github.com](https://www.github.com)

  `git clone https://github.com/Devon-Olivier/argent-drivers.git` to get `argent-drivers`

  `$ npm install` in the root of the repository installs the node modules 
  dependencies.

##Usage

The lottoplus drivers
```js
var lottoplusDrivers = require('argent-drivers').lottoplus;
```

### `.lottoplus.nlcb`
Scrapes nlcb.co.tt for lottoplus draws.

#### `.getDraw(drawProperty)`

DrawProperty is any one of the following types:
 number
 string
 Date
 object (with `start` and `end` properties of the previous types)

getDraw: DrawProperty -> promise
Consume a DrawProperty of a set of draws return a promise for those draws
specified by the DrawProperty.

If the DrawProperty is numeric return a promise for the draw with that number
property.

If the DrawProperty is an object with properties `start` and `end`, which are
numeric, return a promise for an array of Draws whose number property is
in the range \[start, end).

If the DrawProperty is a string that is coerceable to a Date, return a promise
for the draw with that date property.

If the DrawProperty is an object with properties `start` and `end`, that are
both coerceable to a Date, return a promise for an array of Draws whose date
property is in the range \[Date(start), Date(end)).

else produce TypeError on property

Get draw of a given date:

The following prints the draw for 1 December, 2012.
```js
#! /usr/bin/env node
var lottoNlcb = require('argent-drivers').lottoplus.nlcb;
lottoNlcb.getDraw('2012 12 1').then(console.log, console.error);
```

Get draws in given date-range:

The following prints all draws in December 2012.
```js
#! /usr/bin/env node
var lottoNlcb = require('argent-drivers').lottoplus.nlcb;

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
var lottoNlcb = require('argent-drivers').lottoplus.nlcb;

lottoNlcb.getDraw(1).then(console.log, console.error);
```
Get draws in given number-range:

The following prints draws with numbers from 1 to 10 inclusive.
```js
#! /usr/bin/env node
var lottoNlcb = require('argent-drivers').lottoplus.nlcb;

var range = {
  start: 1, 
  end: 11 
};

lottoNlcb.getDraw(range).then(console.log, console.error);
```
#### `.getNewJackpot()`

getNewJackpot: -> promise for a number

Return a promise for the latest jackpot from nlcb.co.tt


### `.lottoplus.mongo`
Stores and retrieves draws from a mongo database.

```js
var lottoMongo = require('argent-drivers').lottoplus.mongo;
```
#### `.getDraw(drawProperty)`

The getDraw method of the mongo driver is identical to the nlcb driver. See above for
details.

#### `.saveDraw(draws)`

Store the draws in the lottoplus mongo database.

## .errors

The errors passed to callbacks shall be of one of these found in
`require('argent-drivers').errors` or one of the native Error objects.

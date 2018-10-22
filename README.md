#argent-drivers

NLCB game results scrapers.

##Installation 

`$ npm install argent-drivers`

##Usage

###The lottoplus scraper
```js
const {lottoplus} = require('argent-drivers');
```
Scrapes nlcb.co.tt for lottoplus draws.

#### `.number(n)`
```js
/**
 * number: number -> promise
 * Consume a number and returns a promise for the draw with
 * a number property corresponding to that number.
 * @param {number} a draw number
 */
The following prints the first lottoplus draw ever.
```js
#! /usr/bin/env node
const {lottoplus} = require('argent-drivers');
const draw = await lottoplus.number(1);
console.dir(draw);
```

#### `.date(d)`
```js
/**
 * date: Date -> promise
 * Consume a Date and returns a promise for the draw for that date
 * @param {Date} representing a draw date;
 */
```js
The following prints the draw for 1 December, 2012.
```js
#! /usr/bin/env node
const {lottoplus} = require('argent-drivers');
const draw = await lottoplus.date(new Date('2012 12 1'));
console.dir(draw);
```

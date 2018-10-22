# argent-drivers

NLCB game results scrapers.

## Installation 

`$ npm install argent-drivers`

## Usage

### The lottoplus scraper
```js
const {lottoplus} = require('argent-drivers');
```
Scrapes nlcb.co.tt for lottoplus draws.

#### .number(n)
```js
/**
 * number: number -> promise
 * @param {number} is a draw number
 * @returns a promise for draw number n
 */
```

The following prints the first lottoplus draw ever.

```js
#! /usr/bin/env node
const {lottoplus} = require('argent-drivers');
const draw = await lottoplus.number(1);
console.dir(draw);
```

#### .date(d)
```js
/**
 * date: Date -> promise
 * @param {Date} is a draw date
 * @returns a promise for the draw with date d
 */
```

The following prints the draw for 1 December, 2012.

```js
#! /usr/bin/env node
const {lottoplus} = require('argent-drivers');
const draw = await lottoplus.date(new Date('2012 12 1'));
console.dir(draw);
```

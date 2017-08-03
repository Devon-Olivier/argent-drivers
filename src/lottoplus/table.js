"use strict";

module.exports = class Table {
  constructor() {
  }

  retrieve (type){
    return this[type];
  }

  store (type, f) {
    this[type] = f;
  }
};

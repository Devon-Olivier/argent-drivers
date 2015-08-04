"use strict";
var makeTable = function makeTable() {
  return {};
};

var retrieve = function retrieve(table, type) {
  return table[type];
};

var store = function store(table, type, f) {
  table[type] = f;
};

exports.makeTable = makeTable;
exports.retrieve = retrieve;
exports.store = store;

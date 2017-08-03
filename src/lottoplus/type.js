module.exports = function type (value) {
  if(!value) {
    return;
  }

  //number?
  if(typeof value === 'number'){
    return 'number';
  }

  //number-range?
  if(typeof value.start === 'number' && typeof value.end === 'number') {
    return 'number-range';
  }

  //date?
  if(value instanceof Date) {
    return 'date';
  }

  //date-range
  if(value.start instanceof Date && value.end instanceof Date) {
    return 'date-range';
  }

  //deliberately return undefined as unknown type
};

function shuffle(array) {
  let m = array.length;
  const result = [];

  while (m) {
    const i = Math.floor(Math.random() * m--);
    const me = result[m] || array[m];
    const ie = result[i] || array[i];
    result[i] = me;
    result[m] = ie;
  }

  return result;
}

function flatten(array) {
  return [].concat(...array);
}

exports.shuffle = shuffle;
exports.flatten = flatten;

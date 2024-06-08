// src/index.ts
var mapBy = (arr, predicate) => {
  const call = (item) => predicate(item);
  return Promise.all(arr.map(call));
};
export {
  mapBy
};

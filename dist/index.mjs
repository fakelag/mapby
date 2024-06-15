var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/index.ts
import timersPromises from "timers/promises";
var mapBy = (vec, options, predicate, onErr) => __async(void 0, null, function* () {
  let counter = 0;
  let aborted = false;
  const pending = Array(options.concurrency);
  const result = Array(vec.length);
  const next = () => __async(void 0, null, function* () {
    while (counter < vec.length) {
      if (aborted) {
        break;
      }
      const index = counter++;
      try {
        yield timersPromises.setImmediate();
        result[index] = yield predicate(vec[index]);
      } catch (err) {
        result[index] = void 0;
        onErr == null ? void 0 : onErr(err, vec[index], index);
        if (options.abortOnError) {
          aborted = true;
          throw err;
        }
      }
    }
  });
  const workers = Math.min(options.concurrency, vec.length);
  for (let i = 0; i < workers; ++i) {
    pending.push(next());
  }
  yield Promise.all(pending);
  return result;
});
export {
  mapBy
};

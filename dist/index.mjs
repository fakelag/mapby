// src/mapBy.ts
import timersPromises from "timers/promises";
var mapBy = async (vec, options, predicate, onErr) => {
  var _a;
  let counter = 0;
  let aborted = false;
  const totalRetryCount = (_a = options.retries) != null ? _a : 0;
  const numWorkers = Math.min(options.concurrency, vec.length);
  const pending = Array(numWorkers);
  const result = Array(vec.length);
  const next = async () => {
    let index = counter++;
    let retriesRemaining = totalRetryCount;
    while (index < vec.length) {
      try {
        if (!options.noDefer) {
          await timersPromises.setImmediate();
        }
        if (aborted) {
          break;
        }
        result[index] = await predicate(vec[index], index);
        index = counter++;
        retriesRemaining = totalRetryCount;
      } catch (err) {
        if (retriesRemaining-- > 0) {
          continue;
        }
        onErr == null ? void 0 : onErr(err, vec[index], index);
        if (options.abortOnError) {
          aborted = true;
          throw err;
        }
        result[index] = void 0;
        index = counter++;
        retriesRemaining = totalRetryCount;
      }
    }
  };
  for (let i = 0; i < numWorkers; ++i) {
    pending.push(next());
  }
  await Promise.all(pending);
  return result;
};
export {
  mapBy
};

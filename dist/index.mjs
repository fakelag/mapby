// src/internal/defer.ts
var defer;
if (typeof setImmediate === "function") {
  defer = setImmediate;
} else if (typeof setTimeout === "function") {
  defer = (fn, ...args) => setTimeout(() => fn(...args), 0);
}

// src/mapBy.ts
var mapBy = async (vec, options, predicate, onErr) => {
  var _a;
  if (options.concurrency <= 0) {
    throw new Error("concurrency must be >= 1");
  }
  if (typeof options.retries === "number" && options.retries < 0) {
    throw new Error("retries must be >= 0");
  }
  if (typeof defer !== "function") {
    throw new Error("defer is not supported on your platform");
  }
  if (vec.length === 0) {
    return [];
  }
  let counter = -1;
  let aborted = false;
  const totalRetryCount = (_a = options.retries) != null ? _a : 0;
  const numWorkers = Math.min(options.concurrency, vec.length);
  const result = Array(vec.length);
  const next = async (index, retryCount, done) => {
    if (aborted) {
      done();
      return;
    }
    try {
      result[index] = await predicate(vec[index], index);
    } catch (err) {
      if (retryCount > 0) {
        defer(next, index, retryCount - 1, done);
        return;
      }
      if (onErr) {
        try {
          onErr(err, vec[index], index);
        } catch (e) {
        }
      }
      if (options.abortOnError) {
        aborted = true;
        done(err);
        return;
      }
      result[index] = void 0;
    }
    const nextIndex = ++counter;
    if (nextIndex < vec.length) {
      defer(next, nextIndex, totalRetryCount, done);
    } else {
      done();
    }
  };
  await new Promise((resolve, reject) => {
    let active = numWorkers;
    let error;
    const done = (err) => {
      if (err && error === void 0) {
        error = err;
      }
      if (--active === 0) {
        if (error) reject(error);
        else resolve();
      }
    };
    for (let i = 0; i < numWorkers; ++i) {
      defer(next, ++counter, totalRetryCount, done);
    }
  });
  return result;
};
export {
  mapBy
};

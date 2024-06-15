"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  mapBy: () => mapBy
});
module.exports = __toCommonJS(src_exports);

// src/mapBy.ts
var import_promises = __toESM(require("timers/promises"));
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
          await import_promises.default.setImmediate();
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mapBy
});

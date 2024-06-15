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
var src_exports = {};
__export(src_exports, {
  mapBy: () => mapBy
});
module.exports = __toCommonJS(src_exports);
var import_promises = __toESM(require("timers/promises"));
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
        yield import_promises.default.setImmediate();
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  mapBy
});

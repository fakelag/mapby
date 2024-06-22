let defer: <TArgs extends any[]>(
  fn: (...args: TArgs) => void,
  ...args: TArgs
) => void;

if (typeof setImmediate === 'function') {
  defer = setImmediate;
} else if (typeof setTimeout === 'function') {
  defer = (fn, ...args) => setTimeout(() => fn(...args), 0);
}

export { defer };

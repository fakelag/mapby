import { MapByOptions, validateMapByOptions } from './types';
import { defer } from './internal/defer';

export const mapBy = async <E, R, I, O extends MapByOptions>(
  vec: I[],
  options: O,
  predicate: (item: I, index: number) => Promise<R> | R,
  onErr?: (err: E, item: I, index: number) => void,
): Promise<Array<R | (O['abortOnError'] extends true ? never : undefined)>> => {
  validateMapByOptions(options);

  if (typeof defer !== 'function') {
    throw new Error('defer is not supported on your platform');
  }

  if (vec.length === 0) {
    return [];
  }

  let counter = -1;
  let aborted = false;

  const totalRetryCount = options.retries ?? 0;
  const numWorkers = Math.min(options.concurrency, vec.length);
  const result: Array<R> = Array(vec.length);

  const next = async (
    index: number,
    retryCount: number,
    done: (err?: E) => void,
  ) => {
    if (aborted) {
      done();
      return;
    }

    try {
      result[index] = await predicate(vec[index], index);
    } catch (err: any) {
      if (retryCount > 0) {
        defer(next, index, retryCount - 1, done);
        return;
      }

      if (onErr) {
        try {
          onErr(err, vec[index], index);
        } catch {
          /* noop */
        }
      }

      if (options.abortOnError) {
        aborted = true;
        done(err);
        return;
      }

      (result[index] as any) = undefined;
    }

    const nextIndex = ++counter;
    if (nextIndex < vec.length) {
      defer(next, nextIndex, totalRetryCount, done);
    } else {
      done();
    }
  };

  await new Promise<void>((resolve, reject) => {
    let active = numWorkers;
    let error: E | undefined;

    const done = (err?: E) => {
      if (err && error === undefined) {
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

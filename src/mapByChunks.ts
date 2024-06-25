import { MapByChunkOptions, validateMapByChunkOptions } from './types';
import { defer } from './internal/defer';

export const mapByChunks = async <E, R, I, O extends MapByChunkOptions>(
  vec: I[],
  options: O,
  predicate: (
    chunk: I[],
    startIndex: number,
    endIndex: number,
  ) => Promise<R[]> | R[],
  onErr?: (err: E, chunk: I[], startIndex: number, endIndex: number) => void,
): Promise<Array<R | (O['abortOnError'] extends true ? never : undefined)>> => {
  validateMapByChunkOptions(options);

  if (typeof defer !== 'function') {
    throw new Error('defer is not supported on your platform');
  }

  if (vec.length === 0) {
    return [];
  }

  let nextIndex = -options.chunkSize;
  let aborted = false;

  const totalRetryCount = options.retries ?? 0;
  const numWorkers = Math.min(
    options.concurrency,
    Math.ceil(vec.length / options.chunkSize),
  );
  const result: Array<R> = Array(vec.length);
  const chunkArray: I[][] = Array(numWorkers);

  for (let i = 0; i < numWorkers; ++i) {
    chunkArray[i] = Array(options.chunkSize);
  }

  const next = async (
    id: number,
    startIndex: number,
    retryCount: number,
    done: (err?: E) => void,
  ) => {
    if (aborted) {
      done();
      return;
    }

    const slot = chunkArray[id];
    const endIndex = Math.min(startIndex + options.chunkSize, vec.length);
    const delta = endIndex - startIndex;

    for (let i = 0; i < delta; ++i) {
      slot[i] = vec[startIndex + i];
    }
    if (slot.length > delta) {
      if (slot.length !== options.chunkSize) {
        throw new Error(
          'unreachable. This is a bug in mapby, please report it',
        );
      }
      // Clamp final slot
      slot.length = delta;
    }

    try {
      const resultChunk = await predicate(slot, startIndex, endIndex);

      if (resultChunk.length !== slot.length) {
        throw new Error(
          'predicate result must contain the same number of elements as the input chunk',
        );
      }

      for (let i = 0; i < slot.length; ++i) {
        result[startIndex + i] = resultChunk[i];
      }
    } catch (err: any) {
      if (retryCount > 0) {
        defer(next, id, startIndex, retryCount - 1, done);
        return;
      }

      if (onErr) {
        try {
          onErr(err, slot, startIndex, endIndex);
        } catch {
          /* noop */
        }
      }

      if (options.abortOnError) {
        aborted = true;
        done(err);
        return;
      }

      for (let i = 0; i < slot.length; ++i) {
        (result[startIndex + i] as any) = undefined;
      }
    }

    nextIndex += options.chunkSize;
    if (nextIndex < vec.length) {
      defer(next, id, nextIndex, totalRetryCount, done);
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
      nextIndex += options.chunkSize;
      defer(next, i, nextIndex, totalRetryCount, done);
    }
  });

  return result;
};

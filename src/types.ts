export type MapByOptions<AoE = boolean | undefined> = {
  concurrency: number;
  abortOnError?: AoE;
  retries?: number;
};

export type MapByChunkOptions<AoE = boolean | undefined> = MapByOptions<AoE> & {
  chunkSize: number;
};

export const validateMapByOptions = (opts: MapByOptions) => {
  if (opts.concurrency <= 0) {
    throw new Error('concurrency must be >= 1');
  }

  if (typeof opts.retries === 'number' && opts.retries < 0) {
    throw new Error('retries must be >= 0');
  }
};

export const validateMapByChunkOptions = (opts: MapByChunkOptions) => {
  validateMapByOptions(opts);

  if (opts.chunkSize <= 0) {
    throw new Error('chunkSize must be >= 1');
  }
};

import timersPromises from 'node:timers/promises';

type MapByOptions<AoE = boolean | undefined> = {
    concurrency: number;
    abortOnError?: AoE;
    noDefer?: boolean;
    retries?: number;
};

export const mapBy = async <E extends any, R, I, O extends MapByOptions>(
    vec: I[],
    options: O,
    predicate: (item: I, index: number) => Promise<R>,
    onErr?: (err: E, item: I, index: number) => void,
): Promise<Array<R | (O['abortOnError'] extends true ? never : undefined)>> => {
    let counter = 0;
    let aborted = false;

    const totalRetryCount = options.retries ?? 0;
    const numWorkers = Math.min(options.concurrency, vec.length);
    const pending: Promise<void>[] = Array(numWorkers);
    const result: Array<R> = Array(vec.length);

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
                retriesRemaining = totalRetryCount
            } catch (err: any) {
                if (retriesRemaining-- > 0) {
                    continue;
                }
                onErr?.(err, vec[index], index);

                if (options.abortOnError) {
                    aborted = true;
                    throw err;
                }

                (result[index] as any) = undefined;
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

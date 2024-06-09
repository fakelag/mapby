type MapByOptions = {
    concurrency: number;
    abortOnError?: boolean;
};

export const mapBy = async <E extends any, R, I>(
    vec: I[],
    options: MapByOptions,
    predicate: (item: I) => Promise<R>,
    onErr?: (err: E, item: I, index: number) => void,
): Promise<Array<R>> => {
    let counter = 0;
    let aborted = false;
    const pending: Promise<void>[] = Array(options.concurrency);
    const result: Array<R> = Array(vec.length);

    const next = async () => {
        while (counter < vec.length) {
            if (aborted) {
                break;
            }
            const index = counter++;
            try {
                // @todo - delay execution to next tick
                result[index] = await predicate(vec[index]);
            } catch (err: any) {
                (result[index] as any) = undefined;
                onErr?.(err, vec[index], index);

                if (options.abortOnError) {
                    aborted = true;
                    throw err;
                }
            }
        }
    };

    const workers = Math.min(options.concurrency, vec.length);
    for (let i = 0; i < workers; ++i) {
        pending.push(next());
    }

    await Promise.all(pending);
    return result;
};

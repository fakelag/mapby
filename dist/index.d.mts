type MapByOptions<AoE = boolean | undefined> = {
    concurrency: number;
    abortOnError?: AoE;
    retries?: number;
};
declare const mapBy: <E, R, I, O extends MapByOptions>(vec: I[], options: O, predicate: (item: I, index: number) => Promise<R> | R, onErr?: (err: E, item: I, index: number) => void) => Promise<Array<R | (O["abortOnError"] extends true ? never : undefined)>>;

export { mapBy };

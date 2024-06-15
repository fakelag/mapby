type MapByOptions<AoE = boolean | undefined> = {
    concurrency: number;
    abortOnError?: AoE;
    noDefer?: boolean;
    retries?: number;
};
declare const mapBy: <E extends unknown, R, I, O extends MapByOptions<boolean | undefined>>(vec: I[], options: O, predicate: (item: I, index: number) => Promise<R>, onErr?: (err: E, item: I, index: number) => void) => Promise<Array<R | (O['abortOnError'] extends true ? never : undefined)>>;

export { mapBy };

type MapByOptions = {
    concurrency: number;
    abortOnError?: boolean;
};
declare const mapBy: <E extends unknown, R, I>(vec: I[], options: MapByOptions, predicate: (item: I) => Promise<R>, onErr?: (err: E, item: I, index: number) => void) => Promise<Array<R>>;

export { mapBy };

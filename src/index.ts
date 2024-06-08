export const mapBy = <T>(arr: T[], predicate: (item: T) => Promise<unknown>) => {
    const call = (item: T) => predicate(item);
    return Promise.all(arr.map(call));
};

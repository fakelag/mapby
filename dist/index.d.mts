declare const mapBy: <T>(arr: T[], predicate: (item: T) => Promise<unknown>) => Promise<unknown[]>;

export { mapBy };

export const range = (num: number) =>
  Array(num)
    .fill(0)
    .map((_, i) => i);

export const rangeFrom = (start: number, end: number) =>
  Array(end - start)
    .fill(0)
    .map((_, i) => i + start);

const forAllRecursive = async <Config extends Record<string, Value[]>, Value>(
  entries: readonly [string, Value[]][],
  entryIndex: number,
  invoke: (values: {
    [key in keyof Config]: Config[keyof Config][number];
  }) => void | Promise<void>,
  current: { [key in keyof Config]?: Config[keyof Config][number] },
) => {
  if (entryIndex === entries.length) {
    await invoke(
      current as { [key in keyof Config]: Config[keyof Config][number] },
    );
    return;
  }

  const firstEntry = entries[entryIndex];

  if (!firstEntry) {
    throw new Error('unreachable');
  }

  for (const value of firstEntry[1]) {
    await forAllRecursive(entries, entryIndex + 1, invoke, {
      ...current,
      [firstEntry[0]]: value,
    });
  }
};

export const forAll = async <Config extends Record<string, Value[]>, Value>(
  inputs: Config,
  invoke: (values: {
    [key in keyof Config]: Config[keyof Config][number];
  }) => void | Promise<void>,
) => {
  const entries = Object.entries(inputs);
  const firstEntry = entries[0];

  if (!firstEntry) {
    throw new Error('object needs more than 1 property');
  }

  await forAllRecursive(entries, 0, invoke, {});
};

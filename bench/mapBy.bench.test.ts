import { mapBy } from '../src';
import { range } from '../tests/testUtils';
import { LoopLagSnapshot, during } from 'looplag';

const toMs = (ms: number) => `${ms.toFixed(2)}ms`;

describe('mapBy.bench', () => {
  const input1_000_000 = range(1_000_000);

  const printSnapshot = (snapshot: LoopLagSnapshot) => {
    console.log(
      `Finished with delay avg=${toMs(snapshot.delAvgMs)}, max=${toMs(snapshot.delMaxMs)}, min=${toMs(
        snapshot.delMinMs,
      )} loopCount=${snapshot.loopCount} totalTime=${toMs(snapshot.totalTimeMs)}`,
    );
  };

  it('does not block event loop when mapping with a synchronous (async) predicate', async () => {
    const inp = input1_000_000;

    const { returnValue, exception, snapshot } = await during(() =>
      mapBy(inp, { concurrency: 100 }, async (item) => item * 2),
    );

    expect(exception).not.toBeDefined();
    expect(returnValue).toBeDefined();
    expect(returnValue).toHaveLength(inp.length);

    expect(snapshot.loopCount).toBeGreaterThan(100);
    expect(snapshot.delAvgMs).toBeLessThan(10);

    printSnapshot(snapshot);
  });

  it('does not block event loop when mapping with a synchronous (non-async) predicate', async () => {
    const inp = input1_000_000;

    const { returnValue, exception, snapshot } = await during(() =>
      mapBy(inp, { concurrency: 100 }, (item) => item * 2),
    );

    expect(exception).not.toBeDefined();
    expect(returnValue).toBeDefined();
    expect(returnValue).toHaveLength(inp.length);

    expect(snapshot.loopCount).toBeGreaterThan(100);
    expect(snapshot.delAvgMs).toBeLessThan(10);

    printSnapshot(snapshot);
  });

  it('does not block event loop when mapping with an async predicate', async () => {
    const inp = input1_000_000;

    const { returnValue, exception, snapshot } = await during(() =>
      mapBy(inp, { concurrency: 100 }, async (item) => {
        return new Promise((resolve) => {
          setImmediate(() => resolve(item * 2));
        });
      }),
    );

    expect(exception).not.toBeDefined();
    expect(returnValue).toBeDefined();
    expect(returnValue).toHaveLength(inp.length);

    expect(snapshot.loopCount).toBeGreaterThan(100);
    expect(snapshot.delAvgMs).toBeLessThan(10);

    printSnapshot(snapshot);
  });
});

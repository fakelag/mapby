import { mapByChunks } from '../src';
import { range, rangeFrom, forAll } from './testUtils';

describe('mapByChunks', () => {
  const input0 = range(0);
  const input1 = range(1);
  const input10 = range(10);
  const input100 = range(100);
  const inputs = [input0, input1, input10, input100];

  it('maps a set of inputs to outputs in chunks', async () => {
    await forAll(
      {
        input: range(inputs.length),
        concurrency: rangeFrom(1, 10),
        chunkSize: rangeFrom(1, 10),
      },
      async ({ input, concurrency, chunkSize }) => {
        const inp = inputs[input];
        const result = await mapByChunks(
          inp,
          { concurrency, chunkSize, abortOnError: true },
          (chunk, startIndex, endIndex) => {
            if (endIndex !== startIndex + chunk.length) {
              throw new Error(
                `'endIndex' must equal to startIndex+chunk.length "${startIndex + chunk.length}" was "${endIndex}" input size=${
                  inp.length
                } concurrency=${concurrency} chunkSize=${chunkSize}`,
              );
            }

            return chunk.map(
              (item, index) => `${item * 2}-${startIndex + index}`,
            );
          },
        );

        expect(result).toBeDefined();
        expect(result).toHaveLength(inp.length);

        inp.forEach((val, i) =>
          expect(
            result[i],
            `input size=${inp.length} concurrency=${concurrency} chunkSize=${chunkSize}`,
            { showPrefix: false },
          ).toBe(`${val * 2}-${i}`),
        );
      },
    );
  });
});

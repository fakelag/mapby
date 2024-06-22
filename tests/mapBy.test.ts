import { mapBy } from '../src';
import { range } from './testUtils';

describe('mapBy', () => {
    const input0 = range(0);
    const input1 = range(1);
    const input10 = range(10);
    const input100 = range(100);
    const inputs = [input0, input1, input10, input100];

    it.each([1, 2, 5, 10, 20])('maps a set of inputs to outputs (concurrency %i)', async (concurrency) => {
        const promises = range(inputs.length).map(async (_, n) => {
            const inp = inputs[n];
            const result = await mapBy(inp, { concurrency }, async (item, index) => `${item*2}-${index}`);
            expect(result).toBeDefined();
            expect(result).toHaveLength(inp.length);
            inp.forEach((val, i) => expect(result[i]).toBe(`${val*2}-${i}`));
        });
        await Promise.all(promises);
    });

    it.each
        ([1, 2, 5, 10, 20])
        ('maps a set of inputs to outputs when elements take different amounts of time to process (concurrency %i)',
        async (concurrency) => {
            const promises = range(inputs.length).map(async (_, n) => {
                const inp = inputs[n];
                const result = await mapBy(inp, { concurrency }, async (item, index) => {
                    await new Promise((resolve) => setTimeout(resolve, item % 10));
                    return `${item*2}-${index}`;
                });
                expect(result).toBeDefined();
                expect(result).toHaveLength(inp.length);
                inp.forEach((val, i) => expect(result[i]).toBe(`${val*2}-${i}`));
            });
            await Promise.all(promises);
        });

    it.each([1, 2, 5, 10, 20])('aborts mapping on error when using abortOnError (concurrency %i)', async (concurrency) => {
        const inp = input10;
        const errorAtIndex = 3;
        const errCb = jest.fn();
        let numItemsProcessed = 0;
        const errToThrow = new Error('error from cb');

        await expect(mapBy(inp, { concurrency, abortOnError: true }, async (item, index) => {
            ++numItemsProcessed;
            if (index === errorAtIndex) throw errToThrow;
            return `${item*2}-${index}`;
        }, errCb)).rejects.toThrow(errToThrow);

        expect(numItemsProcessed).toBeLessThanOrEqual(Math.max(errorAtIndex + 1, concurrency));
        expect(errCb).toHaveBeenCalledTimes(1);
        expect(errCb).toHaveBeenCalledWith(errToThrow, inp[errorAtIndex], errorAtIndex);

        await expect(mapBy(inp, { concurrency, abortOnError: true }, async (item, index) => {
            if (index === errorAtIndex) throw errToThrow;
            return `${item*2}-${index}`;
        })).rejects.toThrow(errToThrow);
    });

    it.each([1, 2, 5, 10, 20])('keeps mapping and returns undefined results for errored callbacks (concurrency %i)', async (concurrency) => {
        const inp = input10;
        const errorAtIndex = [3, 8];
        let numItemsProcessed = 0;
        const errCb = jest.fn();
        const errToThrow = new Error('error from cb');

        const result = await mapBy(inp, { concurrency }, async (item, index) => {
            ++numItemsProcessed;
            if (errorAtIndex.includes(index)) throw errToThrow;
            return `${item*2}-${index}`;
        }, errCb);

        expect(result).toBeDefined();
        expect(result).toHaveLength(inp.length);
        inp.forEach((v, i) => {
            expect(result[i]).toBe(errorAtIndex.includes(i) ? undefined : `${v*2}-${i}`)
        });
        expect(numItemsProcessed).toBe(inp.length);
        expect(errCb).toHaveBeenCalledTimes(2);
        expect(errCb).toHaveBeenCalledWith(errToThrow, inp[errorAtIndex[0]], errorAtIndex[0]);
        expect(errCb).toHaveBeenCalledWith(errToThrow, inp[errorAtIndex[1]], errorAtIndex[1]);
    });

    it.each([
        [1, 0],
        [1, 3],
        [20, 0],
        [20, 3],
    ])('maps inputs to outputs with retries (concurrency %i, retries %i)', async (concurrency, retries) => {
        const inp = input10;
        const errorAtIndex = 3;
        const tryCount: Record<number, number> = {};
        inp.forEach((_, i) => tryCount[i] = 0);

        const errCb = jest.fn();
        const errToThrow = new Error('error from cb');

        const result = await mapBy(inp, { concurrency, retries }, async (item, index) => {
            tryCount[index] += 1;
            if (errorAtIndex === index && tryCount[index] < 3) throw errToThrow;
            return { item, index, tryCount: tryCount[index] };
        }, errCb);

        expect(result).toBeDefined();
        expect(result).toHaveLength(inp.length);
        inp.forEach((v, i) => {
            const hasGivenUp = errorAtIndex === i && retries < 3;
            expect(result[i]).toEqual(hasGivenUp
                ? undefined :
                { item: v, index: i, tryCount: errorAtIndex === i ? 3 : 1 },
            )
        });
    });

    it('throws reasonable errors when calling mapBy with invalid settings', async () => {
        const inp = input10;

        await expect(mapBy(inp, { concurrency: 0 }, async (item, index) => `${item*2}-${index}`))
            .rejects.toThrow('concurrency must be >= 1');

        await expect(mapBy(inp, { concurrency: -1 }, async (item, index) => `${item*2}-${index}`))
            .rejects.toThrow('concurrency must be >= 1');

        await expect(mapBy(inp, { retries: -1, concurrency: 1 }, async (item, index) => `${item*2}-${index}`))
            .rejects.toThrow('retries must be >= 0');
    });
});

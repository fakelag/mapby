## mapBy

mapBy is a typescript promise & concurrency utility for NodeJS.

### Install

```
npm i mapby
```

### Usage

```typescript
import { mapBy } from 'mapby';

const input = [1, 2, 3];

const result = await mapBy(
  input,
  {
    /* Limit predicate function to be called max N times concurrently */
    concurrency: 5,
    /* Throw if error is reached, similar to Promise.all */
    abortOnError: true,
    /* Retry up to N times */
    retries: 3,
  },
  async (item, index) => {
    return item * index;
  },
  (err, item, index) => {
    console.error('Error occurred: ', { err, item, index });
  },
);
```

import { test } from 'node:test';
test('a', (t) => { t.skip(); throw new Error('x'); });
test('b', () => {});

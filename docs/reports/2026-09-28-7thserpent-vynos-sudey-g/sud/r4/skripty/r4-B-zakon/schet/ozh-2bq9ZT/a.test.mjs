import { test } from 'node:test';
test('a', { expectFailure: true }, () => { throw new Error('x'); });
test('b', () => {});

import { test } from 'node:test';
test('a', { skip: null }, () => { throw new Error('x'); });
test('b', () => {});

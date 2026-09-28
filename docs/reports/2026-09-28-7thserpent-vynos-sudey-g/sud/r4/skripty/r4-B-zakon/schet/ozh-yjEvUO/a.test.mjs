import { test } from 'node:test';
test('a', async (t) => { await t.test('a1', { skip: null }, () => { throw new Error('x'); }); });
test('b', () => {});

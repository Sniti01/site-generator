import { test } from 'node:test';
test('a', { todo: true }, async (t) => { await t.test('a1', () => { throw new Error('x'); }); });
test('b', () => {});

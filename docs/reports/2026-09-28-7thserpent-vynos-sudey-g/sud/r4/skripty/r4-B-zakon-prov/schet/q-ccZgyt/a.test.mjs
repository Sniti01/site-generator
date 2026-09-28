import { describe, it, test } from 'node:test';
test('a', async (t) => { await t.test('a1', (tt) => { tt.skip(''); throw new Error('x'); }); });

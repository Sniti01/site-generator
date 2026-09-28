import { test, describe, it } from 'node:test';
test('a', () => {});
describe('g', { timeout: 20 }, async () => { await new Promise((r) => setTimeout(r, 300)); it('b', () => {}); });

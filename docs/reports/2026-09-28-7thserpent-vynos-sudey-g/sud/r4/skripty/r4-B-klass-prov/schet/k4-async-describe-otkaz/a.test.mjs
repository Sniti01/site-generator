import { test, describe, it } from 'node:test';
test('a', () => {});
describe('g', async () => { await 0; throw new Error('x'); });

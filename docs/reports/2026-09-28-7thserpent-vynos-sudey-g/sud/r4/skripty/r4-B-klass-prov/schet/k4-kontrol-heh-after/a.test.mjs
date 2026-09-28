import { test, describe, it } from 'node:test';
import { after } from 'node:test';
test('a', () => {});
describe('g', () => { after(() => { throw new Error('h'); }); it('ok', () => {}); });

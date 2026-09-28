import { test, describe, it } from 'node:test';
test('a', () => {});
describe('g', () => { it('b', () => {}); throw new Error('telo nabora'); });

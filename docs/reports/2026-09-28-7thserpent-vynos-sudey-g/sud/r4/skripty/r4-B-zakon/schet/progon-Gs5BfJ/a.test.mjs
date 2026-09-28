import { describe, it } from 'node:test';
describe('g', () => { it('a', () => {}); describe('v', () => { throw new Error('telo'); }); });

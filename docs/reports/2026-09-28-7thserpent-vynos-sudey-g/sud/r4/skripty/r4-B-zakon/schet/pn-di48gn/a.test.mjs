import { describe, it, after, before } from 'node:test';
describe('g', () => { it('a', () => {}); describe('v', () => { throw new Error('telo'); }); });

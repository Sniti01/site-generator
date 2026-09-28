import { describe, it } from 'node:test';
describe('g', () => { it('a', () => { throw new Error('x'); }); it('b', () => {}); });

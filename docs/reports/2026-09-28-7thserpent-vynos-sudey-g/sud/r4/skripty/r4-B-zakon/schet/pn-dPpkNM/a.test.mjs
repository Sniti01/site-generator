import { describe, it, after, before } from 'node:test';
describe('g', () => { it('a', () => { throw new Error('x'); }); it('b', () => {}); });

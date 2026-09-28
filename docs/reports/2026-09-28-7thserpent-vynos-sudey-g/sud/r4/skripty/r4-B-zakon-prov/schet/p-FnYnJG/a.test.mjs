import { describe, it, test, before, after, beforeEach } from 'node:test';
describe('g', () => { it('a', () => { throw new Error('x'); }); it('b', () => {}); });

import { describe, it, test, before, after, beforeEach } from 'node:test';
describe('g', () => { before(() => { throw new Error('h'); }); it('a', () => {}); it('b', () => {}); });

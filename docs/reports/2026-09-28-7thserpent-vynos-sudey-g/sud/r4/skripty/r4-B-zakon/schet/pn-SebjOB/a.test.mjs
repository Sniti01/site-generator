import { describe, it, after, before } from 'node:test';
describe('g', () => { before(() => { throw new Error('h'); }); it('a', () => {}); });

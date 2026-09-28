import { describe, it, test } from 'node:test';
describe('g', { skip: '' }, () => { it('a', () => { throw new Error('x'); }); it('b', () => {}); });

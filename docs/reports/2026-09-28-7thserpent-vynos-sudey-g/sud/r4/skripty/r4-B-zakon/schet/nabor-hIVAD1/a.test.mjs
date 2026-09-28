import { describe, it } from 'node:test';
describe('g', { skip: '' }, () => { it('a', () => { throw new Error('x'); }); });
describe('h', () => { it('ok', () => {}); });

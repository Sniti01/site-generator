import { describe, it } from 'node:test';
describe('g', { skip: null }, () => { throw new Error('telo'); });
describe('h', () => { it('ok', () => {}); });

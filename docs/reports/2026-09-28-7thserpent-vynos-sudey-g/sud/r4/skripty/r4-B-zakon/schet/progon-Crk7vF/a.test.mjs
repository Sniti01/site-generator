import { describe, it, after } from 'node:test';
describe('g', () => { after(() => { throw new Error('a'); }); it('ok', () => {}); });

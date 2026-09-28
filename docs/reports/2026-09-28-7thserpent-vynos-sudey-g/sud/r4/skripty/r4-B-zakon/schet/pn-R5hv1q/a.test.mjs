import { describe, it, after, before } from 'node:test';
describe('g', () => { after(() => { throw new Error('a'); }); it('ok', () => {}); });

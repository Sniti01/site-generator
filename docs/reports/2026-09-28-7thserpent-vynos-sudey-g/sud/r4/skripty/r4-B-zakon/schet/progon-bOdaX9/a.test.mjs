import { describe, it } from 'node:test';
describe.todo('g', () => { it('a', () => { throw new Error('x'); }); });

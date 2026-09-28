import { test, describe, it, before, after, beforeEach } from 'node:test';
const spat = (ms) => new Promise((r) => setTimeout(r, ms));
describe.todo('g', () => { it('a', () => { throw new Error('x'); }); });

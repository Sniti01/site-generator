import { describe, it, test, before, after, beforeEach } from 'node:test';
describe('g', () => { beforeEach(() => { throw new Error('h'); }); it('a', () => {}); });

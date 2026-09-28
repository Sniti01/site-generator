import { describe, it, test, before, after, beforeEach } from 'node:test';
describe('g', async () => { it('a', () => {}); await Promise.reject(new Error('x')); });

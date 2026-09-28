import { describe, it } from 'node:test';
describe('g', async () => { it('a', () => {}); await Promise.reject(new Error('telo')); });

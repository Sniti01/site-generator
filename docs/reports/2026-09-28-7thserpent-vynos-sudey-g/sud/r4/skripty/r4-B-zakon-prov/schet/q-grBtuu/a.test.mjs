import { describe, it, test } from 'node:test';
test('a', { skip: '' }, async () => { await Promise.reject(new Error('x')); });
test('b', () => {});

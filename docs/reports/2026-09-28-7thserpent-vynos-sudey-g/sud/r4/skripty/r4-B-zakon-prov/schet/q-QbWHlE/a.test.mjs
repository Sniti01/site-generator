import { describe, it, test } from 'node:test';
test('a', () => {});
setTimeout(() => Promise.reject(new Error('pozdno')), 10);

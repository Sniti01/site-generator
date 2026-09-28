import { describe, it, test } from 'node:test';
test('a', { todo: false }, () => { throw new Error('x'); });
test('b', () => {});

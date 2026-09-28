import { describe, it, test } from 'node:test';
test('a', { todo: 0 }, () => { throw new Error('x'); });
test('b', () => {});

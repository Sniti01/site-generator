import { describe, it, test } from 'node:test';
test('a', { skip: '' }, () => { throw new Error('x'); });
test('b', () => {});

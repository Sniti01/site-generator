import { describe, it, test } from 'node:test';
test('a', (t) => { t.todo(); throw new Error('x'); });
test('b', () => {});

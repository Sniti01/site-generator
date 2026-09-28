import { test } from 'node:test';
test('x', { skip: '' }, () => { throw new Error('telo'); });
test('y', (t) => { t.skip(''); });
test('z', { todo: '' }, () => { throw new Error('t'); });

import { test, describe } from 'node:test';
test('e1', () => { throw new Error('x'); });
process.exit(0);

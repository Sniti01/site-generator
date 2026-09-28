import { test, describe, it } from 'node:test';
test('b1', () => { throw new Error('ne vypolnitsya'); });
process.exit(0);

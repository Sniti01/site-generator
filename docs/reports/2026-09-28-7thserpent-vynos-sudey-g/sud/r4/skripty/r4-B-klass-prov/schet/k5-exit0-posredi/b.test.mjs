import { test, describe, it } from 'node:test';
test('b1', () => {});
test('b2', () => { process.exit(0); });
test('b3', () => { throw new Error('ne dojdet'); });

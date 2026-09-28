import { describe, it, test } from 'node:test';
test('a', () => {});
test('b', () => { process.exit(0); });
test('c', () => { throw new Error('ne dojdet'); });

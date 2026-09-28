import { test, describe, it } from 'node:test';
test('b1', () => {});
test('b2', () => { process.exit(1); });

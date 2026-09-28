import { test, describe, it } from 'node:test';
test('a', () => {});
setTimeout(() => { throw new Error('posle testov'); }, 50);

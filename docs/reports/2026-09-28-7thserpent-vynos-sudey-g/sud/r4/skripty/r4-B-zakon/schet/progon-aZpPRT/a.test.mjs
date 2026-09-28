import { test, before } from 'node:test';
before(() => { throw new Error('h'); });
test('a', () => {});

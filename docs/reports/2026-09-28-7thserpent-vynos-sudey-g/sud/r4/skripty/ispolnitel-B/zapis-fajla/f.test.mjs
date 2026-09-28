import { test, describe } from 'node:test';
describe.skip('s', () => { test('f1', () => {}); });
test.skip('f2', () => {});

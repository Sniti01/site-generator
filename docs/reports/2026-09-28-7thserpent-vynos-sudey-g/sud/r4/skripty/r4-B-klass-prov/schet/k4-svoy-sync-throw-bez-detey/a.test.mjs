import { test, describe, it } from 'node:test';
test('a', () => {});
describe('g', () => { throw new Error('x'); });

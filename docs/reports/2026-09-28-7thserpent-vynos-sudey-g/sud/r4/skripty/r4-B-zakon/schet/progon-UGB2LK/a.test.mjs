import { test } from 'node:test';
import assert from 'node:assert';
test('a', async (t) => { await t.test('a1', () => {}); });
test('b', () => assert.fail('x'));

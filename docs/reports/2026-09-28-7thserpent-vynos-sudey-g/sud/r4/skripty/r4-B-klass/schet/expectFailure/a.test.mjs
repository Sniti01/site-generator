import { test, describe, it } from 'node:test';
test('xf', { expectFailure: true }, () => { throw new Error('ozhidaemo'); });
test('xp', { expectFailure: true }, () => {});

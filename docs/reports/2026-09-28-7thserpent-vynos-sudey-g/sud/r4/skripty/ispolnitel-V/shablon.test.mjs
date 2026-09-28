// Проба: как --test-name-pattern выбирает подтесты.
import { test } from 'node:test';
test('группа', async (t) => {
  for (const n of ['R4-V-K-1 а', 'R4-V-K-10 б', 'R4-V-K-2 в']) await t.test(n, () => console.log('прогон', n));
});
test('R4-V-K-1 верхний', () => console.log('прогон верхний'));

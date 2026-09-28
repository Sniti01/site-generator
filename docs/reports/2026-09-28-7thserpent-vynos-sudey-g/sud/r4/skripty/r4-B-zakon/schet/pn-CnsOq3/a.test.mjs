import { describe, it, after, before } from 'node:test';
describe('pusto', () => {});
describe('g', () => { it.skip('s', () => {}); it.todo('t'); });
describe('g2', () => { it('a', () => {}); it('b', () => {}); });

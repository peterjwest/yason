import assert from 'assert';
import multiline from 'multiline-ts';
import { describe, it } from 'vitest';

import yason from '../src/index';

describe('index', () => {
  it('Decodes a list', () => {
    const input = multiline`
      - "Hello \\"World\\""
      - 123
      - null
    `;

    assert.deepStrictEqual(yason.decode(input), [
      'Hello "World"',
      123,
      null,
    ]);
  });
});

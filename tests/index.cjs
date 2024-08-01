import { describe, it } from 'vitest';
const assert = require('assert');
const multiline = require('multiline-ts');

const yason = require('../build/wrapper');

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

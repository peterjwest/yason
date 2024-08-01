import assert from 'assert';
import { describe, it } from 'vitest';

import { StringToken, NumberToken, TrueToken, FalseToken, NullToken } from '../src/tokens';
import ValueNode from '../src/ValueNode';

describe('ValueNode', () => {
  it('Creates the correct value for a string token', () => {
    const node = new ValueNode(new StringToken('"some \\"string!\\""'));
    assert.strictEqual(node.getData(), 'some "string!"');
    assert.deepStrictEqual(node.getAst(), {
      whitespace: {},
      type: 'Value',
      value: 'some "string!"',
    });
  });

  it('Creates the correct value from a number token', () => {
    const node = new ValueNode(new NumberToken('123.456'));
    assert.strictEqual(node.getData(), 123.456);
    assert.deepStrictEqual(node.getAst(), {
      whitespace: {},
      type: 'Value',
      value: 123.456,
    });
  });

  it('Creates the correct value from a true token', () => {
    const node = new ValueNode(new TrueToken());
    assert.strictEqual(node.getData(), true);
    assert.deepStrictEqual(node.getAst(), {
      whitespace: {},
      type: 'Value',
      value: true,
    });
  });

  it('Creates the correct value from a false token', () => {
    const node = new ValueNode(new FalseToken());
    assert.strictEqual(node.getData(), false);
    assert.deepStrictEqual(node.getAst(), {
      whitespace: {},
      type: 'Value',
      value: false,
    });
  });

  it('Creates the correct value from a null token', () => {
    const node = new ValueNode(new NullToken());
    assert.strictEqual(node.getData(), null);
    assert.deepStrictEqual(node.getAst(), {
      whitespace: {},
      type: 'Value',
      value: null,
    });
  });
});

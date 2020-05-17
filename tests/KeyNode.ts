import assert from 'assert';

import { StringToken, SymbolToken } from '../src/tokens';
import KeyNode from '../src/KeyNode';

describe('ValueNode', () => {
  it('Creates the correct value for a string token', () => {
    const node = new KeyNode(new StringToken('"some \\"string!\\""'));
    assert.strictEqual(node.getData(), 'some "string!"');
    assert.deepStrictEqual(node.getAst(), {
      afterWhitespace: '',
      beforeWhitespace: '',
      type: 'Value',
      value: 'some "string!"',
    });
  });

  it('Creates the correct value from a symbol token', () => {
    const node = new KeyNode(new SymbolToken('some_symbol'));
    assert.strictEqual(node.getData(), 'some_symbol');
    assert.deepStrictEqual(node.getAst(), {
      afterWhitespace: '',
      beforeWhitespace: '',
      type: 'Value',
      value: 'some_symbol',
    });
  });
});

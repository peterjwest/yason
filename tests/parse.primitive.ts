import assert from 'assert';
import multiline from 'multiline-ts';

import parse from '../src/parse';
import tokenize from '../src/tokenize';

describe('parse', () => {
  it('Parses a string', () => {
    const tokens = tokenize('"Hello \\"World\\""');

    const tree = parse(tokens);
    assert.deepStrictEqual(tree.getData(), 'Hello "World"');
    assert.deepStrictEqual(tree.getAst(), {
      whitespace: {},
      type: 'Value',
      value: 'Hello "World"',
    });
  });

  it('Parses a string with comments and whitespace', () => {
    const tokens = tokenize(multiline`

      # Before document
      "Hello \\"World\\""  # Inline comment

      # After document
    `);

    const tree = parse(tokens);
    assert.deepStrictEqual(tree.getData(), 'Hello "World"');
    assert.deepStrictEqual(tree.getAst(), {
      whitespace: {
        before: '\n# Before document\n',
        after: '  # Inline comment\n\n# After document',
      },
      type: 'Value',
      value: 'Hello "World"',
    });
  });

  it('Parses a number', () => {
    const tokens = tokenize('0.1234');

    const tree = parse(tokens);
    assert.deepStrictEqual(tree.getData(), 0.1234);
    assert.deepStrictEqual(tree.getAst(), {
      whitespace: {},
      type: 'Value',
      value: 0.1234,
    });
  });

  it('Parses a number in E notation', () => {
    const tokens = tokenize('3e2');

    const tree = parse(tokens);
    assert.deepStrictEqual(tree.getData(), 3e2);
    assert.deepStrictEqual(tree.getAst(), {
      whitespace: {},
      type: 'Value',
      value: 3e2,
    });
  });

  it('Parses true', () => {
    const tokens = tokenize('true');

    const tree = parse(tokens);
    assert.deepStrictEqual(tree.getData(), true);
    assert.deepStrictEqual(tree.getAst(), {
      whitespace: {},
      type: 'Value',
      value: true,
    });
  });

  it('Parses false', () => {
    const tokens = tokenize('false');

    const tree = parse(tokens);
    assert.deepStrictEqual(tree.getData(), false);
    assert.deepStrictEqual(tree.getAst(), {
      whitespace: {},
      type: 'Value',
      value: false,
    });
  });

  it('Parses null', () => {
    const tokens = tokenize('null');

    const tree = parse(tokens);
    assert.deepStrictEqual(tree.getData(), null);
    assert.deepStrictEqual(tree.getAst(), {
      whitespace: {},
      type: 'Value',
      value: null,
    });
  });
});

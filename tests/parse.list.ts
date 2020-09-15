import assert from 'assert';
import multiline from 'multiline-ts';

import parse from '../src/parse';
import tokenize from '../src/tokenize';

describe('parse', () => {
  it('Parses a list', () => {
    const tokens = tokenize(multiline`
      - "Hello \\"World\\""
      - 123

      - null
    `);

    const tree = parse(tokens);

    assert.deepStrictEqual(tree.getData(), [
      'Hello "World"',
      123,
      null,
    ]);

    assert.deepStrictEqual(tree.getAst(), {
      whitespace: {},
      type: 'List',
      value: [
        {
          whitespace: {},
          type: 'ListItem',
          value: {
            whitespace: {},
            type: 'Value',
            value: 'Hello "World"',
          },
        },
        {
          whitespace: {},
          type: 'ListItem',
          value: {
            whitespace: {},
            type: 'Value',
            value: 123,
          },
        },
        {
          whitespace: { before: '\n' },
          type: 'ListItem',
          value: {
            whitespace: {},
            type: 'Value',
            value: null,
          },
        },
      ],
    });
  });

  it('Parses a list with comments', () => {
    const tokens = tokenize(multiline`
      # Before document
      - -3.142 # Inline comment

      # Section comment
      - false
      -  null# Final item comment
      # After document
    `);

    const tree = parse(tokens);

    assert.deepStrictEqual(tree.getData(), [
      -3.142,
      false,
      null,
    ]);

    assert.deepStrictEqual(tree.getAst(), {
      whitespace: {
        before: '# Before document\n',
        after: '\n# After document',
      },
      type: 'List',
      value: [
        {
          whitespace: {
            after: ' # Inline comment',
          },
          type: 'ListItem',
          value: {
            whitespace: {},
            type: 'Value',
            value: -3.142,
          },
        },
        {
          whitespace: {
            before: '\n# Section comment\n',
          },
          type: 'ListItem',
          value: {
            whitespace: {},
            type: 'Value',
            value: false,
          },
        },
        {
          whitespace: {
            inner: ' ',
            after: '# Final item comment',
          },
          type: 'ListItem',
          value: {
            whitespace: {},
            type: 'Value',
            value: null,
          },
        },
      ],
    });
  });

  it('Parses a nested list', () => {
    const tokens = tokenize(multiline`
      - "Hello"
      -
          - 123
          -
              - 456
              - 789
      - true
    `);

    const tree = parse(tokens);

    assert.deepStrictEqual(tree.getData(), [
      'Hello',
      [123, [456, 789]],
      true,
    ]);

    assert.deepStrictEqual(tree.getAst(), {
      type: 'List',
      value: [
        {
          type: 'ListItem',
          value: {
            type: 'Value',
            value: 'Hello',
            whitespace: {},
          },
          whitespace: {},
        },
        {
          type: 'ListItem',
          value: {
            type: 'List',
            value: [
              {
                type: 'ListItem',
                value: {
                  type: 'Value',
                  value: 123,
                  whitespace: {},
                },
                whitespace: {},
              },
              {
                type: 'ListItem',
                value: {
                  type: 'List',
                  value: [
                    {
                      type: 'ListItem',
                      value: {
                        type: 'Value',
                        value: 456,
                        whitespace: {},
                      },
                      whitespace: {},
                    },
                    {
                      type: 'ListItem',
                      value: {
                        type: 'Value',
                        value: 789,
                        whitespace: {},
                      },
                      whitespace: {},
                    },
                  ],
                  whitespace: {},
                },
                whitespace: {},
              },
            ],
            whitespace: {},
          },
          whitespace: {},
        },
        {
          type: 'ListItem',
          value: {
            type: 'Value',
            value: true,
            whitespace: {},
          },
          whitespace: {},
        },
      ],
      whitespace: {},
    });
  });

  it('Parses a nested list with comments', () => {
    const tokens = tokenize(multiline`
      # Before comment
      - "Hello" # Inline comment
      - # List item comment
          - 123
          -
              # List block comment
              - 456 # Nested item comment
              - 789 # Final nested item comment
      - true # Final item comment
      # After comment
    `);

    const tree = parse(tokens);

    assert.deepStrictEqual(tree.getData(), [
      'Hello',
      [123, [456, 789]],
      true,
    ]);

    assert.deepStrictEqual(tree.getAst(), {
      type: 'List',
      whitespace: {
        after: '\n# After comment',
        before: '# Before comment\n',
      },
      value: [
        {
          type: 'ListItem',
          whitespace: { after: ' # Inline comment' },
          value: {
            type: 'Value',
            value: 'Hello',
            whitespace: {},
          },
        },
        {
          type: 'ListItem',
          whitespace: {
            inner: ' # List item comment',
          },
          value: {
            type: 'List',
            whitespace: {},
            value: [
              {
                type: 'ListItem',
                value: {
                  type: 'Value',
                  value: 123,
                  whitespace: {},
                },
                whitespace: {},
              },
              {
                type: 'ListItem',
                whitespace: {},
                value: {
                  type: 'List',
                  whitespace: { before: '        # List block comment\n' },
                  value: [
                    {
                      type: 'ListItem',
                      whitespace: { after: ' # Nested item comment' },
                      value: {
                        type: 'Value',
                        value: 456,
                        whitespace: {},
                      },
                    },
                    {
                      type: 'ListItem',
                      whitespace: { after: ' # Final nested item comment' },
                      value: {
                        type: 'Value',
                        value: 789,
                        whitespace: {},
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          type: 'ListItem',
          whitespace: {
            after: ' # Final item comment',
          },
          value: {
            type: 'Value',
            value: true,
            whitespace: {},
          },
        },
      ],
    });
  });

  it('Parses a map nested in a list', () => {
    const tokens = tokenize(multiline`
      - "Hi"
      -
        # Map comment
          foo: 1
          bar: 2
          zim: 3
      - "Hey"
    `);

    const tree = parse(tokens);

    assert.deepStrictEqual(tree.getData(), [
      'Hi',
      { foo: 1, bar: 2, zim: 3 },
      'Hey',
    ]);

    assert.deepStrictEqual(tree.getAst(), {
      type: 'List',
      whitespace: {},
      value: [
        {
          type: 'ListItem',
          whitespace: {},
          value: {
            type: 'Value',
            whitespace: {},
            value: 'Hi',
          },
        },
        {
          type: 'ListItem',
          whitespace: {},
          value: {
            type: 'Map',
            whitespace: { before: '  # Map comment\n' },
            value: [
              {
                type: 'MapItem',
                whitespace: {},
                key: {
                  symbol: true,
                  type: 'Key',
                  value: 'foo',
                  whitespace: {},
                },
                value: {
                  type: 'Value',
                  value: 1,
                  whitespace: {
                    before: ' ',
                  },
                },
              },
              {
                type: 'MapItem',
                whitespace: {},
                key: {
                  symbol: true,
                  type: 'Key',
                  value: 'bar',
                  whitespace: {},
                },
                value: {
                  type: 'Value',
                  value: 2,
                  whitespace: {
                    before: ' ',
                  },
                },
              },
              {
                type: 'MapItem',
                whitespace: {},
                key: {
                  symbol: true,
                  type: 'Key',
                  value: 'zim',
                  whitespace: {},
                },
                value: {
                  type: 'Value',
                  value: 3,
                  whitespace: {
                    before: ' ',
                  },
                },
              },
            ],
          },
        },
        {
          type: 'ListItem',
          whitespace: {},
          value: {
            type: 'Value',
            value: 'Hey',
            whitespace: {},
          },
        },
      ],
    });
  });
});

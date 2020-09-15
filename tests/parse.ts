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

  it('Parses a map', () => {
    const tokens = tokenize(multiline`
      foo:null

      "zig zag": "Hello World"
    `);

    const tree = parse(tokens);

    assert.deepStrictEqual(tree.getData(), {
      foo: null,
      'zig zag': 'Hello World',
    });

    assert.deepStrictEqual(tree.getAst(), {
      whitespace: {},
      type: 'Map',
      value: [
        {
          whitespace: {},
          key: {
            whitespace: {},
            type: 'Key',
            symbol: true,
            value: 'foo',
          },
          type: 'MapItem',
          value: {
            whitespace: {},
            type: 'Value',
            value: null,
          },
        },
        {
          whitespace: { before: '\n' },
          key: {
            whitespace: {},
            type: 'Key',
            symbol: false,
            value: 'zig zag',
          },
          type: 'MapItem',
          value: {
            whitespace: {
              before: ' ',
            },
            type: 'Value',
            value: 'Hello World',
          },
        },
      ],
    });
  });

  it('Parses a map with comments', () => {
    const tokens = tokenize(multiline`
      # Before document
      foo: null
      bar: "Hello World" # Inline comment

      # Section comment
      "zig zag" :3.142 # Final inline comment
      # After document

    `);

    const tree = parse(tokens);

    assert.deepStrictEqual(tree.getData(), {
      foo: null,
      bar: 'Hello World',
      'zig zag': 3.142,
    });

    assert.deepStrictEqual(tree.getAst(), {
      type: 'Map',
      whitespace: {
        before: '# Before document\n',
        after: '\n# After document\n',
      },
      value: [
        {
          type: 'MapItem',
          whitespace: {},
          key: {
            whitespace: {},
            type: 'Key',
            symbol: true,
            value: 'foo',
          },
          value: {
            whitespace: {
              before: ' ',
            },
            type: 'Value',
            value: null,
          },
        },
        {
          type: 'MapItem',
          whitespace: {
            after: ' # Inline comment',
          },
          key: {
            whitespace: {},
            type: 'Key',
            symbol: true,
            value: 'bar',
          },
          value: {
            whitespace: {
              before: ' ',
            },
            type: 'Value',
            value: 'Hello World',
          },
        },
        {
          type: 'MapItem',
          whitespace: {
            before: '\n# Section comment\n',
            after: ' # Final inline comment',
          },
          key: {
            whitespace: {
              inner: ' ',
            },
            type: 'Key',
            symbol: false,
            value: 'zig zag',
          },
          value: {
            whitespace: {},
            type: 'Value',
            value: 3.142,
          },
        },
      ],
    });
  });

  it('Parses a nested map', () => {
    const tokens = tokenize(multiline`
      foo: "Hello"
      bar:
          zim:
              gir: 123
              zig: 1E5
      zip: true
    `);

    const tree = parse(tokens);

    assert.deepStrictEqual(tree.getData(), {
      foo: 'Hello',
      bar: { zim: {
        gir: 123,
        zig: 1e5,
      }},
      zip: true,
    });

    assert.deepStrictEqual(tree.getAst(), {
      type: 'Map',
      whitespace: {},
      value: [
        {
          key: {
            symbol: true,
            type: 'Key',
            value: 'foo',
            whitespace: {},
          },
          type: 'MapItem',
          value: {
            type: 'Value',
            value: 'Hello',
            whitespace: {
              before: ' ',
            },
          },
          whitespace: {},
        },
        {
          key: {
            symbol: true,
            type: 'Key',
            value: 'bar',
            whitespace: {},
          },
          type: 'MapItem',
          whitespace: {},
          value: {
            type: 'Map',
            whitespace: {},
            value: [
              {
                key: {
                  symbol: true,
                  type: 'Key',
                  value: 'zim',
                  whitespace: {},
                },
                type: 'MapItem',
                whitespace: {},
                value: {
                  type: 'Map',
                  whitespace: {},
                  value: [
                    {
                      key: {
                        symbol: true,
                        type: 'Key',
                        value: 'gir',
                        whitespace: {},
                      },
                      type: 'MapItem',
                      whitespace: {},
                      value: {
                        type: 'Value',
                        value: 123,
                        whitespace: {
                          before: ' ',
                        },
                      },
                    },
                    {
                      key: {
                        symbol: true,
                        type: 'Key',
                        value: 'zig',
                        whitespace: {},
                      },
                      type: 'MapItem',
                      whitespace: {},
                      value: {
                        type: 'Value',
                        value: 100000,
                        whitespace: {
                          before: ' ',
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          key: {
            symbol: true,
            type: 'Key',
            value: 'zip',
            whitespace: {},
          },
          type: 'MapItem',
          whitespace: {},
          value: {
            type: 'Value',
            value: true,
            whitespace: {
              before: ' ',
            },
          },
        },
      ],
    });
  });

  it('Parses a nested map with comments', () => {
    const tokens = tokenize(multiline`
      foo: "Hello"
      bar: # Key comment
        # Block comment
          zim:
              gir: 123
              zig: 1E5 # Final nested item comment
      zip: true # Final item comment
    `);

    const tree = parse(tokens);

    assert.deepStrictEqual(tree.getData(), {
      foo: 'Hello',
      bar: { zim: {
        gir: 123,
        zig: 1e5,
      }},
      zip: true,
    });

    assert.deepStrictEqual(tree.getAst(), {
      type: 'Map',
      whitespace: {},
      value: [
        {
          key: {
            symbol: true,
            type: 'Key',
            value: 'foo',
            whitespace: {},
          },
          type: 'MapItem',
          value: {
            type: 'Value',
            value: 'Hello',
            whitespace: {
              before: ' ',
            },
          },
          whitespace: {},
        },
        {
          key: {
            symbol: true,
            type: 'Key',
            value: 'bar',
            whitespace: { after: ' # Key comment' },
          },
          type: 'MapItem',
          whitespace: {},
          value: {
            type: 'Map',
            whitespace: { before: '  # Block comment\n' },
            value: [
              {
                key: {
                  symbol: true,
                  type: 'Key',
                  value: 'zim',
                  whitespace: {},
                },
                type: 'MapItem',
                whitespace: {},
                value: {
                  type: 'Map',
                  whitespace: {},
                  value: [
                    {
                      key: {
                        symbol: true,
                        type: 'Key',
                        value: 'gir',
                        whitespace: {},
                      },
                      type: 'MapItem',
                      whitespace: {},
                      value: {
                        type: 'Value',
                        value: 123,
                        whitespace: {
                          before: ' ',
                        },
                      },
                    },
                    {
                      key: {
                        symbol: true,
                        type: 'Key',
                        value: 'zig',
                        whitespace: {},
                      },
                      type: 'MapItem',
                      whitespace: { after: ' # Final nested item comment' },
                      value: {
                        type: 'Value',
                        value: 100000,
                        whitespace: {
                          before: ' ',
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          key: {
            symbol: true,
            type: 'Key',
            value: 'zip',
            whitespace: {},
          },
          type: 'MapItem',
          whitespace: { after: ' # Final item comment' },
          value: {
            type: 'Value',
            value: true,
            whitespace: {
              before: ' ',
            },
          },
        },
      ],
    });
  });

  it('Parses a list nested in a map', () => {
    const tokens = tokenize(multiline`
      foo: "Hi"
      bar:
        # List comment
          - 1
          - 2
          - 3
      zim: "Hey"
    `);

    const tree = parse(tokens);

    assert.deepStrictEqual(tree.getData(), {
      foo: 'Hi',
      bar: [1, 2, 3],
      zim: 'Hey',
    });

    assert.deepStrictEqual(tree.getAst(), {
      type: 'Map',
      whitespace: {},
      value: [
        {
          key: {
            symbol: true,
            type: 'Key',
            value: 'foo',
            whitespace: {},
          },
          type: 'MapItem',
          whitespace: {},
          value: {
            type: 'Value',
            value: 'Hi',
            whitespace: {
              before: ' ',
            },
          },
        },
        {
          key: {
            symbol: true,
            type: 'Key',
            value: 'bar',
            whitespace: {},
          },
          type: 'MapItem',
          whitespace: {},
          value: {
            type: 'List',
            whitespace: { before: '  # List comment\n' },
            value: [
              {
                type: 'ListItem',
                whitespace: {},
                value: {
                  type: 'Value',
                  value: 1,
                  whitespace: {},
                },
              },
              {
                type: 'ListItem',
                whitespace: {},
                value: {
                  type: 'Value',
                  value: 2,
                  whitespace: {},
                },
              },
              {
                type: 'ListItem',
                whitespace: {},
                value: {
                  type: 'Value',
                  value: 3,
                  whitespace: {},
                },
              },
            ],
          },
        },
        {
          key: {
            symbol: true,
            type: 'Key',
            value: 'zim',
            whitespace: {},
          },
          type: 'MapItem',
          whitespace: {},
          value: {
            type: 'Value',
            value: 'Hey',
            whitespace: {
              before: ' ',
            },
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

  it('Parses a map starting with a string', () => {
    const tokens = tokenize(multiline`
      "zig zag": 3.142
    `);

    const tree = parse(tokens);

    assert.deepStrictEqual(tree.getData(), {
      'zig zag': 3.142,
    });
  });
});

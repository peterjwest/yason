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
          whitespace: {},
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
      -  null
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
            before: '\n\n# Section comment',
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

  it('Parses a map', () => {
    const tokens = tokenize(multiline`
      foo: null
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
            whitespace: {
              before: ' ',
            },
            type: 'Value',
            value: null,
          },
        },
        {
          whitespace: {},
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
      "zig zag" :3.142
      # After document

    `);

    const tree = parse(tokens);

    assert.deepStrictEqual(tree.getData(), {
      foo: null,
      bar: 'Hello World',
      'zig zag': 3.142,
    });

    assert.deepStrictEqual(tree.getAst(), {
      whitespace: {
        before: '# Before document\n',
        after: '\n# After document\n',
      },
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
            whitespace: {
              before: ' ',
            },
            type: 'Value',
            value: null,
          },
        },
        {
          whitespace: {
            after: ' # Inline comment',
          },
          key: {
            whitespace: {},
            type: 'Key',
            symbol: true,
            value: 'bar',
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
        {
          whitespace: {
            before: '\n\n# Section comment',
          },
          key: {
            whitespace: {
              inner: ' ',
            },
            type: 'Key',
            symbol: false,
            value: 'zig zag',
          },
          type: 'MapItem',
          value: {
            whitespace: {},
            type: 'Value',
            value: 3.142,
          },
        },
      ],
    });
  });

  it('Parses nested lists and maps', () => {
    const tokens = tokenize(multiline`
      # Before document
      - null
      # Before list item
      - # List item comment
          foo: "Hello" # Value comment
          bar: # Key comment
              # List comment
              - -1E-3

              # Section comment
              -   true # Inline comment
              -
                  - false
          zim:
              gir: true
      - 123
      # After document

    `);

    const tree = parse(tokens);

    assert.deepStrictEqual(tree.getData(), [
      null,
      {
        foo: 'Hello',
        bar: [-1E-3, true, [false]],
        zim: { gir: true },
      },
      123,
    ]);

    assert.deepStrictEqual(tree.getAst(), {
      whitespace: {
        before: '# Before document\n',
        after: '\n# After document\n',
      },
      type: 'List',
      value: [
        {
          whitespace: {},
          type: 'ListItem',
          value: {
            whitespace: {},
            type: 'Value',
            value: null,
          },
        },
        {
          whitespace: {
            before: '\n# Before list item',
            inner: ' # List item comment',
          },
          type: 'ListItem',
          value: {
            whitespace: {},
            type: 'Map',
            value: [
              {
                whitespace: {
                  after: ' # Value comment',
                },
                key: {
                  whitespace: {},
                  type: 'Key',
                  symbol: true,
                  value: 'foo',
                },
                type: 'MapItem',
                value: {
                  whitespace: {
                    before: ' ',
                  },
                  type: 'Value',
                  value: 'Hello',
                },
              },
              {
                whitespace: {},
                key: {
                  whitespace: {
                    after: ' # Key comment',
                  },
                  type: 'Key',
                  symbol: true,
                  value: 'bar',
                },
                type: 'MapItem',
                value: {
                  whitespace: {
                    before: '\n        # List comment',
                  },
                  type: 'List',
                  value: [
                    {
                      whitespace: {},
                      type: 'ListItem',
                      value: {
                        whitespace: {},
                        type: 'Value',
                        value: -0.001,
                      },
                    },
                    {
                      whitespace: {
                        before: '\n\n        # Section comment',
                        inner: '  ',
                        after: ' # Inline comment',
                      },
                      type: 'ListItem',
                      value: {
                        whitespace: {},
                        type: 'Value',
                        value: true,
                      },
                    },
                    {
                      whitespace: {},
                      type: 'ListItem',
                      value: {
                        whitespace: {},
                        type: 'List',
                        value: [{
                          whitespace: {},
                          type: 'ListItem',
                          value: {
                            whitespace: {},
                            type: 'Value',
                            value: false,
                          },
                        }],
                      },
                    },
                  ],
                },
              },
              {
                whitespace: {},
                key: {
                  whitespace: {},
                  type: 'Key',
                  symbol: true,
                  value: 'zim',
                },
                type: 'MapItem',
                value: {
                  whitespace: {},
                  type: 'Map',
                  value: [
                    {
                      whitespace: {},
                      key: {
                        whitespace: {},
                        type: 'Key',
                        symbol: true,
                        value: 'gir',
                      },
                      type: 'MapItem',
                      value: {
                        whitespace: {
                          before: ' ',
                        },
                        type: 'Value',
                        value: true,
                      },
                    },
                  ],
                },
              },
            ],
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
      ],
    });
  });

  // TODO: Fix this test
  // it('XXX', () => {
  //   const tokens = tokenize(multiline`
  //     "zig zag": 123
  //   `);

  //   const tree = parse(tokens);

  //   assert.deepStrictEqual(tree.getData(), {
  //     foo: null,
  //     bar: 'Hello World',
  //     'zig zag': 3.142,
  //   });
  // });
});

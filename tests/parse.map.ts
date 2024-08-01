import assert from 'assert';
import multiline from 'multiline-ts';
import { describe, it } from 'vitest';

import parse from '../src/parse';
import tokenize from '../src/tokenize';

describe('parse', () => {
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
      type: 'Document',
      indent: undefined,
      whitespace: {},
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
      },
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
      type: 'Document',
      indent: undefined,
      whitespace: {},
      value: {
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
      },
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
      } },
      zip: true,
    });

    assert.deepStrictEqual(tree.getAst(), {
      type: 'Document',
      indent: '    ',
      whitespace: {},
      value: {
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
      },
    });
  });

  it('Parses a nested map indented with tabs', () => {
    const tokens = tokenize(multiline`
      foo: "Hello"
      bar:
      \tzim:
      \t\tgir: 123
      \t\tzig: 1E5
      zip: true
    `);

    const tree = parse(tokens);

    assert.deepStrictEqual(tree.getData(), {
      foo: 'Hello',
      bar: { zim: {
        gir: 123,
        zig: 1e5,
      } },
      zip: true,
    });

    assert.deepStrictEqual(tree.getAst(), {
      type: 'Document',
      indent: '\t',
      whitespace: {},
      value: {
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
      },
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
      } },
      zip: true,
    });

    assert.deepStrictEqual(tree.getAst(), {
      type: 'Document',
      indent: '    ',
      whitespace: {},
      value: {
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
      },
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
      type: 'Document',
      indent: '  ',
      whitespace: {},
      value: {
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
      },
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

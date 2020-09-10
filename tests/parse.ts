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
      afterWhitespace: '',
      beforeWhitespace: '',
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
      afterWhitespace: '  # Inline comment\n\n# After document',
      beforeWhitespace: '\n# Before document\n',
      type: 'Value',
      value: 'Hello "World"',
    });
  });

  it('Parses a number', () => {
    const tokens = tokenize('0.1234');

    const tree = parse(tokens);
    assert.deepStrictEqual(tree.getData(), 0.1234);
    assert.deepStrictEqual(tree.getAst(), {
      afterWhitespace: '',
      beforeWhitespace: '',
      type: 'Value',
      value: 0.1234,
    });
  });

  it('Parses a number in E notation', () => {
    const tokens = tokenize('3e2');

    const tree = parse(tokens);
    assert.deepStrictEqual(tree.getData(), 3e2);
    assert.deepStrictEqual(tree.getAst(), {
      afterWhitespace: '',
      beforeWhitespace: '',
      type: 'Value',
      value: 3e2,
    });
  });

  it('Parses true', () => {
    const tokens = tokenize('true');

    const tree = parse(tokens);
    assert.deepStrictEqual(tree.getData(), true);
    assert.deepStrictEqual(tree.getAst(), {
      afterWhitespace: '',
      beforeWhitespace: '',
      type: 'Value',
      value: true,
    });
  });

  it('Parses false', () => {
    const tokens = tokenize('false');

    const tree = parse(tokens);
    assert.deepStrictEqual(tree.getData(), false);
    assert.deepStrictEqual(tree.getAst(), {
      afterWhitespace: '',
      beforeWhitespace: '',
      type: 'Value',
      value: false,
    });
  });

  it('Parses null', () => {
    const tokens = tokenize('null');

    const tree = parse(tokens);
    assert.deepStrictEqual(tree.getData(), null);
    assert.deepStrictEqual(tree.getAst(), {
      afterWhitespace: '',
      beforeWhitespace: '',
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
      afterWhitespace: '',
      beforeWhitespace: '',
      type: 'List',
      value: [
        {
          afterWhitespace: '',
          beforeWhitespace: '',
          middleWhitespace: '',
          type: 'ListItem',
          value: {
            afterWhitespace: '',
            beforeWhitespace: '',
            type: 'Value',
            value: 'Hello "World"',
          },
        },
        {
          afterWhitespace: '',
          beforeWhitespace: '',
          middleWhitespace: '',
          type: 'ListItem',
          value: {
            afterWhitespace: '',
            beforeWhitespace: '',
            type: 'Value',
            value: 123,
          },
        },
        {
          afterWhitespace: '',
          beforeWhitespace: '',
          middleWhitespace: '',
          type: 'ListItem',
          value: {
            afterWhitespace: '',
            beforeWhitespace: '',
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
      afterWhitespace: '\n# After document',
      beforeWhitespace: '# Before document\n',
      type: 'List',
      value: [
        {
          afterWhitespace: ' # Inline comment',
          beforeWhitespace: '',
          middleWhitespace: '',
          type: 'ListItem',
          value: {
            afterWhitespace: '',
            beforeWhitespace: '',
            type: 'Value',
            value: -3.142,
          },
        },
        {
          afterWhitespace: '',
          beforeWhitespace: '\n\n# Section comment',
          middleWhitespace: '',
          type: 'ListItem',
          value: {
            afterWhitespace: '',
            beforeWhitespace: '',
            type: 'Value',
            value: false,
          },
        },
        {
          afterWhitespace: '',
          beforeWhitespace: '',
          middleWhitespace: ' ',
          type: 'ListItem',
          value: {
            afterWhitespace: '',
            beforeWhitespace: '',
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
      afterWhitespace: '',
      beforeWhitespace: '',
      type: 'Map',
      value: [
        {
          afterWhitespace: '',
          beforeWhitespace: '',
          key: {
            afterWhitespace: '',
            middleWhitespace: '',
            type: 'Key',
            symbol: true,
            value: 'foo',
          },
          type: 'MapItem',
          value: {
            afterWhitespace: '',
            beforeWhitespace: ' ',
            type: 'Value',
            value: null,
          },
        },
        {
          afterWhitespace: '',
          beforeWhitespace: '',
          key: {
            afterWhitespace: '',
            middleWhitespace: '',
            type: 'Key',
            symbol: false,
            value: 'zig zag',
          },
          type: 'MapItem',
          value: {
            afterWhitespace: '',
            beforeWhitespace: ' ',
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
      afterWhitespace: '\n# After document\n',
      beforeWhitespace: '# Before document\n',
      type: 'Map',
      value: [
        {
          afterWhitespace: '',
          beforeWhitespace: '',
          key: {
            afterWhitespace: '',
            middleWhitespace: '',
            type: 'Key',
            symbol: true,
            value: 'foo',
          },
          type: 'MapItem',
          value: {
            afterWhitespace: '',
            beforeWhitespace: ' ',
            type: 'Value',
            value: null,
          },
        },
        {
          afterWhitespace: ' # Inline comment',
          beforeWhitespace: '',
          key: {
            afterWhitespace: '',
            middleWhitespace: '',
            type: 'Key',
            symbol: true,
            value: 'bar',
          },
          type: 'MapItem',
          value: {
            afterWhitespace: '',
            beforeWhitespace: ' ',
            type: 'Value',
            value: 'Hello World',
          },
        },
        {
          afterWhitespace: '',
          beforeWhitespace: '\n\n# Section comment',
          key: {
            afterWhitespace: '',
            middleWhitespace: ' ',
            type: 'Key',
            symbol: false,
            value: 'zig zag',
          },
          type: 'MapItem',
          value: {
            afterWhitespace: '',
            beforeWhitespace: '',
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
      afterWhitespace: '\n# After document\n',
      beforeWhitespace: '# Before document\n',
      type: 'List',
      value: [
        {
          afterWhitespace: '',
          beforeWhitespace: '',
          middleWhitespace: '',
          type: 'ListItem',
          value: {
            afterWhitespace: '',
            beforeWhitespace: '',
            type: 'Value',
            value: null,
          },
        },
        {
          afterWhitespace: '',
          beforeWhitespace: '\n# Before list item',
          middleWhitespace: ' # List item comment',
          type: 'ListItem',
          value: {
            afterWhitespace: '',
            beforeWhitespace: '',
            type: 'Map',
            value: [
              {
                afterWhitespace: ' # Value comment',
                beforeWhitespace: '',
                key: {
                  afterWhitespace: '',
                  middleWhitespace: '',
                  type: 'Key',
                  symbol: true,
                  value: 'foo',
                },
                type: 'MapItem',
                value: {
                  afterWhitespace: '',
                  beforeWhitespace: ' ',
                  type: 'Value',
                  value: 'Hello',
                },
              },
              {
                afterWhitespace: '',
                beforeWhitespace: '',
                key: {
                  afterWhitespace: ' # Key comment',
                  middleWhitespace: '',
                  type: 'Key',
                  symbol: true,
                  value: 'bar',
                },
                type: 'MapItem',
                value: {
                  afterWhitespace: '',
                  beforeWhitespace: '\n        # List comment',
                  type: 'List',
                  value: [
                    {
                      afterWhitespace: '',
                      beforeWhitespace: '',
                      middleWhitespace: '',
                      type: 'ListItem',
                      value: {
                        afterWhitespace: '',
                        beforeWhitespace: '',
                        type: 'Value',
                        value: -0.001,
                      },
                    },
                    {
                      afterWhitespace: ' # Inline comment',
                      beforeWhitespace: '\n\n        # Section comment',
                      middleWhitespace: '  ',
                      type: 'ListItem',
                      value: {
                        afterWhitespace: '',
                        beforeWhitespace: '',
                        type: 'Value',
                        value: true,
                      },
                    },
                    {
                      afterWhitespace: '',
                      beforeWhitespace: '',
                      middleWhitespace: '',
                      type: 'ListItem',
                      value: {
                        afterWhitespace: '',
                        beforeWhitespace: '',
                        type: 'List',
                        value: [{
                          afterWhitespace: '',
                          beforeWhitespace: '',
                          middleWhitespace: '',
                          type: 'ListItem',
                          value: {
                            afterWhitespace: '',
                            beforeWhitespace: '',
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
                afterWhitespace: '',
                beforeWhitespace: '',
                key: {
                  afterWhitespace: '',
                  middleWhitespace: '',
                  type: 'Key',
                  symbol: true,
                  value: 'zim',
                },
                type: 'MapItem',
                value: {
                  afterWhitespace: '',
                  beforeWhitespace: '',
                  type: 'Map',
                  value: [
                    {
                      afterWhitespace: '',
                      beforeWhitespace: '',
                      key: {
                        afterWhitespace: '',
                        middleWhitespace: '',
                        type: 'Key',
                        symbol: true,
                        value: 'gir',
                      },
                      type: 'MapItem',
                      value: {
                        afterWhitespace: '',
                        beforeWhitespace: ' ',
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
          afterWhitespace: '',
          beforeWhitespace: '',
          middleWhitespace: '',
          type: 'ListItem',
          value: {
            afterWhitespace: '',
            beforeWhitespace: '',
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

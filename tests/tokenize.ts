import assert from 'assert';
import multiline from 'multiline-ts';
import { describe, it } from 'vitest';

import tokenize from '../src/tokenize';
import {
  StringToken, NumberToken, TrueToken, FalseToken, NullToken,
  SymbolToken, ColonToken, DashToken, CommaToken,
  SquareOpenToken, SquareCloseToken, CurlyOpenToken, CurlyCloseToken,
  PaddingToken, NewlineToken, LineEndToken, EndToken,
} from '../src/tokens';

describe('tokenize', () => {
  it('Tokenizes an empty string', () => {
    assert.deepStrictEqual(tokenize(''), [new EndToken()]);
  });

  it('Tokenizes a number', () => {
    assert.deepStrictEqual(tokenize('123.456'), [new NumberToken('123.456'), new EndToken()]);
  });

  it('Tokenizes a string', () => {
    assert.deepStrictEqual(tokenize('"hello there"'), [new StringToken('"hello there"'), new EndToken()]);
  });

  it('Tokenizes a boolean', () => {
    assert.deepStrictEqual(tokenize('true'), [new TrueToken(), new EndToken()]);
    assert.deepStrictEqual(tokenize('false'), [new FalseToken(), new EndToken()]);
  });

  it('Tokenizes a null', () => {
    assert.deepStrictEqual(tokenize('null'), [new NullToken(), new EndToken()]);
  });

  it('Tokenizes a map', () => {
    const input = multiline`
      foo:  "bar" # inline comment
      "zim" :123
      gir:null#no padding comment

    `;
    assert.deepStrictEqual(tokenize(input), [
      new SymbolToken('foo'), new ColonToken(), new PaddingToken('  '), new StringToken('"bar"'),
      new LineEndToken(' # inline comment'), new NewlineToken(),

      new StringToken('"zim"'), new PaddingToken(' '), new ColonToken(),
      new NumberToken('123'), new NewlineToken(),

      new SymbolToken('gir'), new ColonToken(), new NullToken(),
      new LineEndToken('#no padding comment'), new NewlineToken(),

      new EndToken(),
    ]);
  });

  it('Tokenizes a list', () => {
    const input = multiline`
      - "hello"
      - "hey y'all"
         #  comment line
      - 01134
    `;
    assert.deepStrictEqual(tokenize(input), [
      new DashToken(), new PaddingToken(' '), new StringToken('"hello"'), new NewlineToken(),

      new DashToken(), new PaddingToken(' '), new StringToken('"hey y\'all"'), new NewlineToken(),

      new LineEndToken('   #  comment line'), new NewlineToken(),

      new DashToken(), new PaddingToken(' '), new NumberToken('01134'), new EndToken(),
    ]);
  });

  it('Tokenizes an array', () => {
    const input = multiline`
      [ # inline comment
        "foo" ,"bar",
          2e+4, null,

      true,
      ]
    `;
    assert.deepStrictEqual(tokenize(input), [
      new SquareOpenToken(),
      new LineEndToken(' # inline comment'), new NewlineToken(),

      new PaddingToken('  '), new StringToken('"foo"'), new PaddingToken(' '), new CommaToken(),
      new StringToken('"bar"'), new CommaToken(), new NewlineToken(),

      new PaddingToken('    '), new NumberToken('2e+4'), new CommaToken(), new PaddingToken(' '),
      new NullToken(), new CommaToken(), new NewlineToken(),

      new NewlineToken(),

      new TrueToken(), new CommaToken(), new NewlineToken(),

      new SquareCloseToken(), new EndToken(),
    ]);
  });

  it('Tokenizes an object', () => {
    const input = multiline`
      {
          "foo" :"bar",   # comment after padding
        zim: 0.123, gir  :
      null,
      }
    `;
    assert.deepStrictEqual(tokenize(input), [
      new CurlyOpenToken(), new NewlineToken(),

      new PaddingToken('    '), new StringToken('"foo"'), new PaddingToken(' '), new ColonToken(),
      new StringToken('"bar"'), new CommaToken(),
      new LineEndToken('   # comment after padding'), new NewlineToken(),

      new PaddingToken('  '), new SymbolToken('zim'), new ColonToken(),
      new PaddingToken(' '), new NumberToken('0.123'), new CommaToken(),
      new PaddingToken(' '), new SymbolToken('gir'),
      new PaddingToken('  '), new ColonToken(), new NewlineToken(),

      new NullToken(), new CommaToken(), new NewlineToken(),

      new CurlyCloseToken(), new EndToken(),
    ]);
  });

  it('Tokenizes an a complex nested structure', () => {
    const input = multiline`
      foo:
        - "bar"
        - -42
        - # comment A
          beep: "boop"
      bar: "zim"
      "gir": .123
      # comment B
      zip: {
         list: [1,2,3],
         zig: [
           true, # comment C
           false,
           null,
         ],
      }
    `;
    assert.deepStrictEqual(tokenize(input), [
      new SymbolToken('foo'), new ColonToken(), new NewlineToken(),

      new PaddingToken('  '), new DashToken(),
      new PaddingToken(' '), new StringToken('"bar"'), new NewlineToken(),

      new PaddingToken('  '), new DashToken(),
      new PaddingToken(' '), new NumberToken('-42'), new NewlineToken(),

      new PaddingToken('  '), new DashToken(),
      new LineEndToken(' # comment A'), new NewlineToken(),

      new PaddingToken('    '), new SymbolToken('beep'), new ColonToken(),
      new PaddingToken(' '), new StringToken('"boop"'), new NewlineToken(),

      new SymbolToken('bar'), new ColonToken(),
      new PaddingToken(' '), new StringToken('"zim"'), new NewlineToken(),

      new StringToken('"gir"'), new ColonToken(),
      new PaddingToken(' '), new NumberToken('.123'), new NewlineToken(),

      new LineEndToken('# comment B'), new NewlineToken(),

      new SymbolToken('zip'), new ColonToken(),
      new PaddingToken(' '), new CurlyOpenToken(), new NewlineToken(),

      new PaddingToken('   '), new SymbolToken('list'), new ColonToken(),
      new PaddingToken(' '), new SquareOpenToken(),
      new NumberToken('1'), new CommaToken(), new NumberToken('2'), new CommaToken(), new NumberToken('3'),
      new SquareCloseToken(), new CommaToken(), new NewlineToken(),

      new PaddingToken('   '), new SymbolToken('zig'), new ColonToken(),
      new PaddingToken(' '), new SquareOpenToken(), new NewlineToken(),

      new PaddingToken('     '), new TrueToken(), new CommaToken(),
      new LineEndToken(' # comment C'), new NewlineToken(),

      new PaddingToken('     '), new FalseToken(), new CommaToken(), new NewlineToken(),

      new PaddingToken('     '), new NullToken(), new CommaToken(), new NewlineToken(),

      new PaddingToken('   '), new SquareCloseToken(), new CommaToken(), new NewlineToken(),

      new CurlyCloseToken(), new EndToken(),
    ]);
  });

  it('Throws an exception when given an unknown token', () => {
    assert.throws(() => tokenize('undefined'), new Error('Unexpected token near "undefined"'));
  });

  it('Throws an exception when given a malformed string', () => {
    assert.throws(() => tokenize('"hello\\"'), new Error('Unexpected token near ""hello\\""'));
  });

  it('Throws an exception when given a malformed number', () => {
    assert.throws(() => tokenize('1..234'), new Error('Unexpected token near "..234"'));
  });
});

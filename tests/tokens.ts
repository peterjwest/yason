import assert from 'assert';

import {
  OptionalToken, CompositeToken, oneOf,
  TrueToken, FalseToken, NullToken, NumberToken, StringToken,
  SymbolToken, ColonToken, DashToken, CommaToken,
  CurlyOpenToken, CurlyCloseToken, SquareOpenToken, SquareCloseToken,
  CommentToken, PaddingToken, NewlineToken,
} from '../src/tokens';

describe('tokens', () => {
  describe('TrueToken', () => {
    describe('parse', () => {
      it('Parses a true token', () => {
        assert.deepStrictEqual(TrueToken.parse('true # some comment \n'), new TrueToken());
      });

      it('Does not parse a string containing "true""', () => {
        assert.strictEqual(TrueToken.parse('"true"'), undefined);
      });

      it('Does not parse a true token after whitespace', () => {
        assert.strictEqual(TrueToken.parse('   true'), undefined);
      });

      it('Does not parse a true token in a comment', () => {
        assert.strictEqual(TrueToken.parse('# true'), undefined);
      });
    });

    describe('matches', () => {
      it('Matches itself', () => {
        const token = new TrueToken();
        assert.strictEqual(TrueToken.matches(token), true);
        assert.strictEqual(new TrueToken().matches(token), true);
      });

      it('Does not match other tokens', () => {
        assert.strictEqual(TrueToken.matches(new FalseToken()), false);
        assert.strictEqual(new TrueToken().matches(new StringToken('"some string"')), false);
      });
    });

    describe('optional', () => {
      it('A true token matches an optional true token', () => {
        assert.strictEqual(TrueToken.optional().matches(new TrueToken()), true);
      });

      it('A non-true token does not match an optional true token', () => {
        assert.strictEqual(TrueToken.optional().matches(new FalseToken()), false);
      });
    });
  });

  describe('FalseToken', () => {
    describe('parse', () => {
      it('Parses a false token', () => {
        assert.deepStrictEqual(FalseToken.parse('false # some comment \n'), new FalseToken());
      });

      it('Does not parse a string containing "false""', () => {
        assert.strictEqual(FalseToken.parse('"false"'), undefined);
      });

      it('Does not parse a false token after whitespace', () => {
        assert.strictEqual(FalseToken.parse('   false'), undefined);
      });

      it('Does not parse a false token in a comment', () => {
        assert.strictEqual(FalseToken.parse('# false'), undefined);
      });
    });
  });

  describe('NullToken', () => {
    describe('parse', () => {
      it('Parses a null token', () => {
        assert.deepStrictEqual(NullToken.parse('null # some comment \n'), new NullToken());
      });

      it('Does not parse a string containing "null""', () => {
        assert.strictEqual(NullToken.parse('"null"'), undefined);
      });

      it('Does not parse a null token after whitespace', () => {
        assert.strictEqual(NullToken.parse('   null'), undefined);
      });

      it('Does not parse a null token in a comment', () => {
        assert.strictEqual(NullToken.parse('# null'), undefined);
      });
    });
  });

  describe('NumberToken', () => {
    describe('parse', () => {
      it('Parses a floating point number token', () => {
        assert.deepStrictEqual(NumberToken.parse('1.234 # some comment \n'), new NumberToken('1.234'));
      });

      it('Parses a negative integer number token', () => {
        assert.deepStrictEqual(NumberToken.parse('-72\n'), new NumberToken('-72'));
      });

      it('Parses an E notation number token', () => {
        assert.deepStrictEqual(NumberToken.parse('2E-6\n - "string"'), new NumberToken('2E-6'));
        assert.deepStrictEqual(NumberToken.parse('1.2e5\n - 123'), new NumberToken('1.2e5'));
      });

      it('Parses a floating point number token with no leading zero', () => {
        assert.deepStrictEqual(NumberToken.parse('.987  '), new NumberToken('.987'));
      });

      it('Does not parse a number token in a string token', () => {
        assert.strictEqual(NumberToken.parse('"1.234"'), undefined);
      });

      it('Does not parse a negative number token with a space', () => {
        assert.strictEqual(NumberToken.parse('- 42'), undefined);
      });
    });
  });

  describe('StringToken', () => {
    describe('parse', () => {
      it('Parses a string token', () => {
        assert.deepStrictEqual(StringToken.parse('"hello world" # some comment \n'), new StringToken('"hello world"'));
      });

      it('Parses a string token with escaped quotes', () => {
        assert.deepStrictEqual(StringToken.parse('"quoted \\"quote\\" marks"\n - "another string"'), new StringToken('"quoted \\"quote\\" marks"'));
      });

      it('Parses a string token with escaped whitespace characters', () => {
        assert.deepStrictEqual(StringToken.parse('"line one\\n \\tline two"\n - "string"'), new StringToken('"line one\\n \\tline two"'));
      });

      it('Parses a string token with a valid escaped unicode character', () => {
        assert.deepStrictEqual(StringToken.parse('"Unicode \\u12ab" # another comment'), new StringToken('"Unicode \\u12ab"'));
      });

      it('Parses a string token with an emoji', () => {
        assert.deepStrictEqual(StringToken.parse('"😇" # another comment'), new StringToken('"😇"'));
      });

      it('Does not parse an unquoted symbol token', () => {
        assert.strictEqual(StringToken.parse('some_symbol'), undefined);
      });

      it('Does not parse a string token after whitespace', () => {
        assert.strictEqual(StringToken.parse(' "string after whitespace"'), undefined);
      });

      it('Does not parse a string token in a comment', () => {
        assert.strictEqual(StringToken.parse('# "string in comment"'), undefined);
      });

      it('Does not parse a string token with single quotes', () => {
        assert.strictEqual(StringToken.parse('\'string in comment\''), undefined);
      });

      it('Does not parse a string with an invalid escaped character', () => {
        assert.deepStrictEqual(StringToken.parse('"\\x" # some comment'), undefined);
      });

      it('Does not parse a string with an escaped end quote', () => {
        assert.deepStrictEqual(StringToken.parse('"\\"'), undefined);
      });

      it('Does not parse a string with an invalid escaped unicode character', () => {
        assert.deepStrictEqual(StringToken.parse('"Unicode \\u12a" # another comment'), undefined);
      });

      it('Does not parse a string with a control character', () => {
        assert.deepStrictEqual(StringToken.parse('"\x00"'), undefined);
      });

      it('Does not parse a string with unescaped whitespace', () => {
        assert.deepStrictEqual(StringToken.parse('"\n"'), undefined);
        assert.deepStrictEqual(StringToken.parse('"\t"'), undefined);
      });
    });
  });

  describe('SymbolToken', () => {
    describe('parse', () => {
      it('Parses a symbol token', () => {
        assert.deepStrictEqual(SymbolToken.parse('key: "value"\n'), new SymbolToken('key'));
      });

      it('Parses a symbol token followed by whitespace', () => {
        assert.deepStrictEqual(SymbolToken.parse('key  : "value"\n'), new SymbolToken('key'));
      });

      it('Parses a symbol token with an emoji', () => {
        assert.deepStrictEqual(SymbolToken.parse('my_🔑_key: 123'), new SymbolToken('my_🔑_key'));
      });

      it('Does not parse an quoted symbol token', () => {
        assert.strictEqual(SymbolToken.parse('"some_symbol":'), undefined);
      });

      it('Does not parse an symbol token with hyphens', () => {
        assert.strictEqual(SymbolToken.parse('some-symbol:'), undefined);
      });

      it('Does not parse a symbol token after whitespace', () => {
        assert.strictEqual(SymbolToken.parse(' some_symbol:'), undefined);
      });

      it('Does not parse a symbol with an escaped whitespace character', () => {
        assert.strictEqual(SymbolToken.parse('some\nkey: "value"'), undefined);
      });

      it('Does not parse a symbol with an escaped unicode character', () => {
        assert.strictEqual(SymbolToken.parse('key_\\u12ab: "value"'), undefined);
      });

      it('Does not parse a symbol with a control character', () => {
        assert.strictEqual(SymbolToken.parse('\x00:'), undefined);
      });

      it('Does not parse a symbol with whitespace', () => {
        assert.strictEqual(SymbolToken.parse('some key:'), undefined);
      });

      it('Does not parse a symbol with significant JSON character', () => {
        assert.strictEqual(SymbolToken.parse('some[key]:'), undefined);
        assert.strictEqual(SymbolToken.parse('some{key}:'), undefined);
      });
    });
  });

  describe('DashToken', () => {
    describe('parse', () => {
      it('Parses a dash token', () => {
        assert.deepStrictEqual(DashToken.parse('- "value"'), new DashToken());
      });

      it('Does not parse a dash token after whitespace', () => {
        assert.strictEqual(DashToken.parse('   - "value"'), undefined);
      });

      it('Does not parse another token', () => {
        assert.strictEqual(DashToken.parse(': "value"'), undefined);
      });
    });
  });

  describe('ColonToken', () => {
    describe('parse', () => {
      it('Parses a colon token', () => {
        assert.deepStrictEqual(ColonToken.parse(': "value"'), new ColonToken());
      });

      it('Does not parse a colon token after whitespace', () => {
        assert.strictEqual(ColonToken.parse('   : "value"'), undefined);
      });

      it('Does not parse another token', () => {
        assert.strictEqual(ColonToken.parse('- "value"'), undefined);
      });
    });
  });

  describe('CommaToken', () => {
    describe('parse', () => {
      it('Parses a comma token', () => {
        assert.deepStrictEqual(CommaToken.parse(', '), new CommaToken());
      });

      it('Does not parse a comma token after whitespace', () => {
        assert.strictEqual(CommaToken.parse(' , '), undefined);
      });

      it('Does not parse another token', () => {
        assert.strictEqual(CommaToken.parse(';'), undefined);
      });
    });
  });

  describe('CurlyOpenToken', () => {
    describe('parse', () => {
      it('Parses a curly open token', () => {
        assert.deepStrictEqual(CurlyOpenToken.parse('{ key: "value"'), new CurlyOpenToken());
      });

      it('Does not parse a curly open token after whitespace', () => {
        assert.strictEqual(CurlyOpenToken.parse(' { key: "value"'), undefined);
      });

      it('Does not parse another token', () => {
        assert.strictEqual(CurlyOpenToken.parse('[ "value"'), undefined);
      });
    });
  });

  describe('CurlyCloseToken', () => {
    describe('parse', () => {
      it('Parses a curly close token', () => {
        assert.deepStrictEqual(CurlyCloseToken.parse('}, '), new CurlyCloseToken());
      });

      it('Does not parse a curly close token after whitespace', () => {
        assert.strictEqual(CurlyCloseToken.parse(' }, '), undefined);
      });

      it('Does not parse another token', () => {
        assert.strictEqual(CurlyCloseToken.parse('],'), undefined);
      });
    });
  });

  describe('SquareOpenToken', () => {
    describe('parse', () => {
      it('Parses a square open token', () => {
        assert.deepStrictEqual(SquareOpenToken.parse('[ "value"'), new SquareOpenToken());
      });

      it('Does not parse a square open token after whitespace', () => {
        assert.strictEqual(SquareOpenToken.parse(' [ "value"'), undefined);
      });

      it('Does not parse another token', () => {
        assert.strictEqual(SquareOpenToken.parse('{ key: "value"'), undefined);
      });
    });
  });

  describe('SquareCloseToken', () => {
    describe('parse', () => {
      it('Parses a square close token', () => {
        assert.deepStrictEqual(SquareCloseToken.parse('], '), new SquareCloseToken());
      });

      it('Does not parse a square close token after whitespace', () => {
        assert.strictEqual(SquareCloseToken.parse(' ], '), undefined);
      });

      it('Does not parse another token', () => {
        assert.strictEqual(SquareCloseToken.parse('},'), undefined);
      });
    });
  });

  describe('CommentToken', () => {
    describe('parse', () => {
      it('Parses a comment', () => {
        assert.deepStrictEqual(CommentToken.parse('# some comment! #:\😈'), new CommentToken('# some comment! #:\😈'));
      });

      it('Parses a comment followed by a newline', () => {
        assert.deepStrictEqual(CommentToken.parse('# some comment! \n'), new CommentToken('# some comment! '));
      });

      it('Parses an empty comment', () => {
        assert.deepStrictEqual(CommentToken.parse('#'), new CommentToken('#'));
      });

      it('Does not parse a comment token after whitespace', () => {
        assert.strictEqual(CommentToken.parse(' # some comment!'), undefined);
      });

      it('Does not parse an invalid style of comment', () => {
        assert.strictEqual(CommentToken.parse('// some comment'), undefined);
      });
    });
  });

  describe('PaddingToken', () => {
    describe('parse', () => {
      it('Parses a padding token made of spaces', () => {
        assert.deepStrictEqual(PaddingToken.parse('    : "hello"'), new PaddingToken('    '));
      });

      it('Parses a padding token made of tabs and spaces', () => {
        assert.deepStrictEqual(PaddingToken.parse(' \t  \t \n  '), new PaddingToken(' \t  \t '));
      });

      it('Does not parse a padding token after whitespace', () => {
        assert.strictEqual(PaddingToken.parse('hello    '), undefined);
      });

      it('Does not parse a padding token after a newline', () => {
        assert.strictEqual(PaddingToken.parse('\n  '), undefined);
      });
    });
  });

  describe('NewlineToken', () => {
    describe('parse', () => {
      it('Parses a newline token', () => {
        assert.deepStrictEqual(NewlineToken.parse('\n\n - "value"'), new NewlineToken());
      });

      it('Does not parse a newline token after whitespace', () => {
        assert.strictEqual(NewlineToken.parse('   \n'), undefined);
      });

      it('Does not parse another token', () => {
        assert.strictEqual(NewlineToken.parse('\t\n'), undefined);
      });
    });
  });

  describe('OptionalToken', () => {
    describe('matches', () => {
      it('A string token matches an optional string token', () => {
        assert.strictEqual(new OptionalToken(StringToken).matches(new StringToken('"hello"')), true);
      });

      it('A non-string token does not match an optional string token', () => {
        assert.strictEqual(new OptionalToken(StringToken).matches(new NumberToken('123')), false);
      });
    });
  });

  describe('CompositeToken', () => {
    describe('matches', () => {
      it('A string token matches a composite token including string', () => {
        assert.strictEqual(new CompositeToken([StringToken, NumberToken]).matches(new StringToken('"hello"')), true);
      });

      it('A true token does not match a composite token not including true', () => {
        assert.strictEqual(new CompositeToken([StringToken, NumberToken]).matches(new TrueToken()), false);
      });
    });
  });

  describe('oneOf', () => {
    describe('matches', () => {
      it('A string token matches a composite token including string', () => {
        assert.strictEqual(oneOf([StringToken, NumberToken]).matches(new StringToken('"hello"')), true);
      });

      it('A true token does not match a composite token not including true', () => {
        assert.strictEqual(oneOf([StringToken, NumberToken]).matches(new TrueToken()), false);
      });
    });
  });
});

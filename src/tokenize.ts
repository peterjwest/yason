import lodash from 'lodash';

import {
  Token, EndToken,
  TrueToken, FalseToken, NullToken, NumberToken, StringToken,
  SymbolToken, ColonToken, DashToken, CommaToken,
  CurlyOpenToken, CurlyCloseToken, SquareOpenToken, SquareCloseToken,
  LineEndToken, PaddingToken, NewlineToken,
} from './tokens';

const parseableTokens = [
  TrueToken, FalseToken, NullToken, NumberToken, StringToken,
  SymbolToken, ColonToken, DashToken, CommaToken,
  CurlyOpenToken, CurlyCloseToken, SquareOpenToken, SquareCloseToken,
  LineEndToken, PaddingToken, NewlineToken,
];

// TODO: Use a generator!
/** Converts a yason string to a list of tokens */
export default function tokenize(input: string) {
  const tokens: Token[] = [];
  let remaining = input;
  while (remaining.length > 0) {
    const found = lodash.find(parseableTokens, (TokenType) => {
      const token = TokenType.parse(remaining);
      if (token) {
        tokens.push(token);
        remaining = remaining.slice(token.value.length);
        return true;
      }
    });
    if (!found) {
      throw Error(`Unexpected token near "${remaining.slice(0, 20)}"`);
    }
  }
  tokens.push(new EndToken());
  return tokens;
}

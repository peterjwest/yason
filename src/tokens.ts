/** Base class for any token */
export abstract class Token {
  /** Check if a token matches this class */
  static matches(token: Token) {
    return token instanceof this;
  }

  /** Check if a token matches this token */
  matches(token: Token) {
    return (this.constructor as typeof Token).matches(token);
  }
}

/** Wrapper to allow a token to be optional in a pattern */
export class OptionalToken extends Token {
  type: Token;

  constructor(type: Token) {
    super();
    this.type = type;
  }

  /** Check if a token matches this instance's type */
  matches(token: Token) {
    return this.type.matches(token);
  }
}

/** Wrapper to allow multiple possible tokens in a pattern */
export class CompositeToken extends Token {
  types: SimpleTokenClass[] = [];

  constructor(types: SimpleTokenClass[]) {
    super();
    this.types = types;
  }

  /** Check if a token matches any of this instance's types */
  matches(token: Token) {
    for (const type of this.types) {
      const match = type.matches(token);
      if (match) return match;
    }
    return false;
  }
}

/** A concrete token which can be matched against a regex */
export class RegexToken extends Token {
  static regex: RegExp;
  value: string;

  /** Create a new token based on this */
  static parse(input: string) {
    const match = input.match(this.regex);
    if (match) return new this();
  }

  /** Convenience method for making an optional token */
  static optional() {
    return new OptionalToken(this);
  }
}

/** A concrete token with a variable string value */
export class ValueToken extends RegexToken {
  constructor(value: string) {
    super();
    this.value = value;
  }

  /** Create a new token based on this */
  static parse(input: string) {
    const match = input.match(this.regex);
    if (match && match[0].length > 0) return new this(match[0]);
  }
}

/** Boolean true  */
export class TrueToken extends RegexToken { static regex = /^true/; value = 'true'; }

/** Boolean false */
export class FalseToken extends RegexToken { static regex = /^false/; value = 'false'; }

/** Null value */
export class NullToken extends RegexToken { static regex = /^null/; value = 'null'; }

/** Number (same format as JSON) */
export class NumberToken extends ValueToken {
  static regex = /^[-]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?/;
}

/** String with double quotes */
export class StringToken extends ValueToken {
  static regex = /^"([^"\\\x00-\x1F\x7F-\x9F]|\\["\\\/bfnrt]|\\u[0-9a-f]{4})+"/;
}

/** An unquoted string which can be used as a map key */
export class SymbolToken extends ValueToken {
  static regex = /^[^\s\\\-\[\]\{\},'":#\x00-\x1F\x7F-\x9F]+(?= *:)/;
}

/** Colon ":" used to separate keys from values */
export class ColonToken extends RegexToken { static regex = /^:/; value = ':'; }

/** Dash "-" token used to indicate list items */
export class DashToken extends RegexToken { static regex = /^-/; value = '-'; }

/** Comma used between array/object items */
export class CommaToken extends RegexToken { static regex = /^,/; value = ','; }

/** Start of a JSON object */
export class CurlyOpenToken extends RegexToken { static regex = /^{/; value = '{'; }

/** End of a JSON object */
export class CurlyCloseToken extends RegexToken { static regex = /^}/; value = '}'; }

/** Start of a JSON array */
export class SquareOpenToken extends RegexToken { static regex = /^\[/; value = '['; }

/** End of a JSON array */
export class SquareCloseToken extends RegexToken { static regex = /^\]/; value = ']'; }

/** Single line comment */
export class LineEndToken extends ValueToken { static regex = /^[\t ]*(#[^\n]*)?(?=\n|$)/; }

/** Padding (whitespace not including newlines) */
export class PaddingToken extends ValueToken { static regex = /^[\t ]+(?=[^#\n])/; }

/** Newline */
export class NewlineToken extends RegexToken { static regex = /^\n/; value = '\n'; }

/** Empty token marking the end of the document */
export class EndToken extends Token {}


/** Union type of all  */
export type SimpleTokenClass = (
  typeof TrueToken | typeof FalseToken | typeof NullToken | typeof NumberToken | typeof StringToken |
  typeof SymbolToken | typeof ColonToken | typeof DashToken | typeof CommaToken |
  typeof CurlyOpenToken | typeof CurlyCloseToken | typeof SquareOpenToken | typeof SquareCloseToken |
  typeof LineEndToken | typeof PaddingToken | typeof NewlineToken | typeof EndToken
);

/** Token representing any primitive value */
export const PrimitiveToken = oneOf([TrueToken, FalseToken, NullToken, NumberToken, StringToken]);

/** Convenience function for making a composite token */
export function oneOf(tokens: SimpleTokenClass[]) {
  return new CompositeToken(tokens);
}

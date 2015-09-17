const _ = require('lodash');

const tokenRegexes = {
  string: /^"([^"\\\x00-\x1F\x7F-\x9F]+|\\[\\\/"bfnrt]|\\u[0-9a-f]{4})*"/,
  number: /^-?(0|[1-9][0-9]*)(\.[0-9]+)?(e[+-][0-9]+)?/i,
  null: /^null/,
  true: /^true/,
  false: /^false/,
  colon: /^:/,
  dash: /^\-/,
  comma: /^,/,
  open_brace: /^{/,
  close_brace: /^}/,
  open_bracket: /^\[/,
  close_bracket: /^\]/,
  newline: /^\n/,
  comment: /^#[^\n]*/,
  symbol: /^[^\-\[\]\{\},'":#\s\x00-\x1F\x7F-\x9F]+/,
  padding: /^[\t ]+/,
  spacing: /^[\t ]*/,
};

const tokenize = function(string) {
  let tokens = [];
  let tokenFound;
  while (string.length > 0) {
    tokenFound = _.findKey(tokenRegexes, function(regex, key) {
      const match = string.match(regex);
      if (match !== null) {
        tokens.push([key, match[0]]);
        string = string.slice(match[0].length);
        return true;
      }
    });
    if (!tokenFound) {
      throw 'Unexpected token near ' + string.slice(0, 10);
    }
  }
  return tokens;
};

const blocks = {
  key: [
    ['padding', 'symbol', 'padding', 'colon', 'padding'], 
    ['padding', 'string', 'padding', 'colon', 'padding'],
    ['padding', 'symbol', 'colon', 'padding'],
    ['padding', 'string', 'colon', 'padding'],
    ['symbol', 'padding', 'colon', 'padding'], 
    ['string', 'padding', 'colon', 'padding'],
    ['symbol', 'colon', 'padding'],
    ['string', 'colon', 'padding'],
    ['padding', 'symbol', 'padding', 'colon'], 
    ['padding', 'string', 'padding', 'colon'],
    ['padding', 'symbol', 'colon'],
    ['padding', 'string', 'colon'],
    ['symbol', 'padding', 'colon'], 
    ['string', 'padding', 'colon'],
    ['symbol', 'colon'],
    ['string', 'colon'],
  ],
  index: [
    ['padding', 'dash', 'padding'],
    ['padding', 'dash'],
    ['dash', 'padding'],
    ['dash'],
  ],
  primitive: [
    ['string'],
    ['number'],
    ['true'],
    ['false'],
    ['null'],
  ],
  pair: [
    ['key', 'primitive'],
    ['key', 'newline', 'pair'],
  ],
  object: [
    ['open_brace', 'pair', 'close_brace'],
  ],
};

const parse = function(input) {
  const tokens = tokenize(input);
  const stack = [];

  Object.keys(blocks).forEach((blockName) => {
    const block = blocks[blockName];
    block.forEach((pattern) => {
      for (let index = 0; index < tokens.length; index++) {
        if (pattern.every((key, offset) => tokens[index + offset] && tokens[index + offset][0] === key)) {
          let patternTokens = tokens.splice(index, pattern.length);
          tokens.splice(index, 0, [blockName, patternTokens]);
        }
      }
    });
  });

  return tokens;

  // const workingSet = [];
  // tokens.forEach(function(token) {
  //   workingSet.push(token.shift());

  // });
};

console.log(parse(
`
foo:
  bar :"zim"
  "gir":
    -"foo"
    -{zip: null}
    - true`
));
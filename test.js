var _ = require('lodash');

var matchLength = function(match) {
  return match ? match[0].length : false;
}

var states = {
  document: {
    START: {
      spacing: ['PRE_ELEMENT']
    },
    PRE_ELEMENT: {
      map: ['POST_ELEMENT'],
      list: ['POST_ELEMENT']
      // object: ['POST_ELEMENT'],
      // array: ['POST_ELEMENT'],
      // value: ['POST_ELEMENT']
    },
    POST_ELEMENT: {
      spacing: ['POST_SPACING']
    },
    POST_SPACING: {
      comment: ['POST_COMMENT']
    },
    POST_COMMENT: {
      end: []
    }
  },

  map: {
    START: {
      indent: ['START', 'PRE_KEY'],
      nothing: ['PRE_KEY']
    },
    PRE_KEY: {
      key: ['POST_KEY']
    },
    POST_KEY: {
      padding: ['PRE_COLON']
    },
    PRE_COLON: {
      colon: ['POST_COLON']
    },
    POST_COLON: {
      comment: ['PRE_NEWLINE_NESTED'],
      padding: ['PRE_VALUE']
    },
    PRE_NEWLINE_NESTED: {
      newline: ['POST_NEWLINE_NESTED']
    },
    POST_NEWLINE_NESTED: {
      spacing: ['PRE_COLLECTION']
    },
    PRE_COLLECTION: {
      map: ['POST_VALUE'],
      list: ['POST_VALUE']
    },
    PRE_VALUE: {
      value: ['POST_VALUE']
    },
    POST_VALUE: {
      comment: ['PRE_NEWLINE_SIBLING'],
      end: []
    },
    PRE_NEWLINE_SIBLING: {
      newline: ['POST_NEWLINE_SIBLING']
    },
    POST_NEWLINE_SIBLING: {
      spacing: ['START']
    }
  },

  list: {
    START: {
      indent: ['START', 'PRE_DASH'],
      nothing: ['PRE_DASH']
    },
    PRE_DASH: {
      dash: ['POST_DASH']
    },
    POST_DASH: {
      comment: ['PRE_NEWLINE_NESTED'],
      padding: ['PRE_VALUE']
    },
    PRE_NEWLINE_NESTED: {
      newline: ['POST_NEWLINE_NESTED']
    },
    POST_NEWLINE_NESTED: {
      spacing: ['PRE_COLLECTION']
    },
    PRE_COLLECTION: {
      map: ['POST_VALUE'],
      list: ['POST_VALUE']
    },
    PRE_VALUE: {
      value: ['POST_VALUE']
    },
    POST_VALUE: {
      comment: ['PRE_NEWLINE_SIBLING'],
      end: []
    },
    PRE_NEWLINE_SIBLING: {
      newline: ['POST_NEWLINE_SIBLING']
    },
    POST_NEWLINE_SIBLING: {
      spacing: ['START']
    }
  },

  spacing: {
    START: {
      comment: ['POST_COMMENT'],
      end: []
    },
    POST_COMMENT: {
      newline: ['POST_NEWLINE']
    },
    POST_NEWLINE: {
      nothing: ['START'],
      end: []
    }
  },

  value: {
    START: {
      string: ['POST_VALUE'],
      number: ['POST_VALUE'],
      object: ['POST_VALUE'],
      // array: ['POST_VALUE'],
      true: ['POST_VALUE'],
      false: ['POST_VALUE'],
      null: ['POST_VALUE']
    },
    POST_VALUE: {
      end: []
    }
  },

  whitespace: {
    START: {
      padding: ['POST_WHITESPACE'],
      spacing: ['POST_WHITESPACE']
    },
    POST_WHITESPACE: {
      end: []
    }
  },

  object: {
    START: {
      open_brace: ['POST_OPEN_BRACE']
    },
    POST_OPEN_BRACE: {
      whitespace: ['PRE_ITEM']
    },
    PRE_ITEM: {
      nothing: ['PRE_KEY', 'POST_ITEM']
    },
    PRE_KEY: {
      key: ['POST_KEY']
    },
    POST_KEY: {
      whitespace: ['PRE_COLON']
    },
    PRE_COLON: {
      colon: ['POST_COLON']
    },
    POST_COLON: {
      whitespace: ['PRE_VALUE']
    },
    PRE_VALUE: {
      value: ['POST_VALUE']
    },
    POST_VALUE: {
      whitespace: ['POST_VALUE_WHITESPACE']
    },
    POST_VALUE_WHITESPACE: {
      comma: ['POST_COMMA'],
      nothing: ['POST_ITEM']
    },
    POST_COMMA: {
      whitespace: ['PRE_KEY']
    },
    POST_ITEM: {
      close_brace: ['POST_CLOSE_BRACE']
    },
    POST_CLOSE_BRACE: {
      end: []
    }
  },

  array: {
    START: {
      open_brace: ['POST_OPEN_BRACE']
    },
    POST_OPEN_BRACE: {
      whitespace: ['PRE_ITEM']
    },
    PRE_ITEM: {
      nothing: ['PRE_VALUE', 'POST_ITEM']
    },
    PRE_VALUE: {
      value: ['POST_VALUE']
    },
    POST_VALUE: {
      whitespace: ['POST_VALUE_WHITESPACE']
    },
    POST_VALUE_WHITESPACE: {
      comma: ['POST_COMMA'],
      nothing: ['POST_ITEM']
    },
    POST_COMMA: {
      whitespace: ['PRE_KEY']
    },
    POST_ITEM: {
      close_brace: ['POST_CLOSE_BRACE']
    },
    POST_CLOSE_BRACE: {
      end: []
    }
  }
};

var indent;

var blocks = {
  colon: function(input) {
    return matchLength(input.match(/^:/));
  },
  // TODO allow string
  key: function(input) {
    return matchLength(input.match(/^[^ :#\x00-\x1F\x7F-\x9F]+/));
  },
  dash: function(input) {
    return matchLength(input.match(/^\-/));
  },
  indent: function(input) {
    // TODO
    return matchLength(input.match(/^ +/));
  },
  padding: function(input) {
    return matchLength(input.match(/^[\t ]*/));
  },
  comment: function(input) {
    return matchLength(input.match(/^[\t ]*(#[^\n]*)?/));
  },
  newline: function(input) {
    return matchLength(input.match(/^\n/));
  },
  true: function(input) {
    return matchLength(input.match(/^true/));
  },
  false: function(input) {
    return matchLength(input.match(/^false/));
  },
  null: function(input) {
    return matchLength(input.match(/^null/));
  },
  comma: function(input) {
    return matchLength(input.match(/^,/));
  },
  open_brace: function(input) {
    return matchLength(input.match(/^{/));
  },
  close_brace: function(input) {
    return matchLength(input.match(/^}/));
  },
  number: function(input) {
    return matchLength(input.match(
      /^-?(0|[1-9][0-9]*)(\.[0-9]+)?(e[+-][0-9]+)?/i
    ));
  },
  string: function(input) {
    return matchLength(input.match(
      /^"([^"\\\x00-\x1F\x7F-\x9F]+|\\[\\\/"bfnrt]|\\u[0-9a-f]{4})*"/
    ));
  },
  end: function() {
    return null;
  },
  nothing: function() {
    return null;
  }
};

var input = [
  'key1: {',
  // '  foo: "3",',
  // '  "bar": {zim : "gir"}',
  '}',
  // 'key2: ',
  // '  ',
  // '  key3: "123" #bar',
  // '  key4 :4 ',
  // ' # foo bar! ',
  // '  key5 : 1E+123 ',
  // '  key6:',
  // '    key7: 7',
  // 'key8:',
  // '  - 9',
  // '  - 10',
  // '  -',
  // '    key11: 11',
  // '    key12: 12',
  // '',
  // ' #x '
].join('\n');

var parseBlock = function(parentBlock, block, childStates, input, divergent, i) {
  var result;

  if (typeof blocks[block] === 'function') {
    var value = blocks[block](input);
    if (value !== false) {
      if (value === null) {
        // console.log(_.repeat('  ', i), 'Running block', block, divergent, '-', '""');
        result = [];
      }
      else {
        // console.log(_.repeat('  ', i), 'Running block', block, divergent, '-', JSON.stringify(input.slice(0, value)));
        result = [[block, input.slice(0, value)]];
      }
    }
  }
  else {
    // console.log(_.repeat('  ', i), 'Parsing block', block, '(', parentBlock, childStates, divergent, ')');
    result = parseState(block, 'START', input, divergent, i+1);
  }
  if (!result) {
    if (!divergent) {
      throw new Error('Block error: ' + JSON.stringify(input));
    }
    return false;
  }

  var newInput = input.slice(_.sum(_.pluck(result, '1.length')));

  if (childStates.length) {
    var childResults = parseStates(parentBlock, childStates, newInput, divergent || childStates.length > 1, i-1);
    if (!childResults) {
      if (!(divergent || childStates.length > 1)) {
        throw new Error('State error: ' + JSON.stringify(newInput));
      }
      return false;
    }
    result = result.concat(childResults);
  }

  if (parentBlock === null && newInput !== '') {
    throw new Error('End error: ' + JSON.stringify(newInput));
  }

  return result;
};

var parseState = function(block, state, input, divergent, i) {
  // console.log(_.repeat('  ', i), 'Parsing state', block, state, '(', divergent, ')');
  var result;
  var stateCount = _.keys(states[block][state]).length;
  _.find(states[block][state], function(states, nestedBlock) {
    result = parseBlock(block, nestedBlock, states, input, divergent || stateCount > 1, i+1);
    if (!result) console.log(_.repeat('  ', i+1), 'Parsing block', nestedBlock, 'FAILED');
    return result;
  });

  return result;
};

var parseStates = function(block, states, input, divergent, i) {
  var result;
  _.find(states, function(state) {
    return result = parseState(block, state, input, divergent, i);
  })
  return result;
};

var parse = function(input) {
  indent = null;
  return parseBlock(null, 'document', [], input, false, 0);
};

var x = parseBlock(null, 'document', [], input, false, 0);
console.log(x);
var xx = x.map(function(y) { return y[1]; }).join('');
// console.log(input);
console.log(xx);
console.log(xx === input ? 'PASS' : 'FAIL');

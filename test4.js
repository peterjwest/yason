const _ = require('lodash');

const tokenRegexes = {
  true: /^true/,
  false: /^false/,
  null: /^null/,
  newline: /^[\t ]*(#[^\n]*)?\n/,
  whitespace: /^(([\t ]*(#[^\n]*)?(\n|$))*)/,
  key: /^([^\-\[\]\{\},'":#\s\x00-\x1F\x7F-\x9F]+)[\t ]*:/,
  padding: /^([\t ]+)/,
};

class Stack {
  constructor(items = []) {
    this.items = items;
  }
  base() {
    return this.items[0];
  }
  current() {
     return this.items[this.items.length - 1];
  }
  push(item) {
    return this.items.push(item);
  }
  pop() {
    return this.items.pop();
  }
}

const blockStates = {
  document: {
    start: (stack, token, index, tokens) => {
      const context = stack.current();
      if (token.type === 'newline') {
        context.whitespace.push(token.value);
        return index + 1;
      }
      context.state = 'body';
      return index;
    },

    body: (stack, token, index, tokens) => {
      const context = stack.current();
      context.state = 'end';

      if (token.type === 'key') {
        const map = { type: 'map', depth: 0, state: 'start', data: [], whitespace: [] };
        context.data.push(map);
        stack.push(map);

        return index;
      }
      throw `Unexpected ${token.type} token "${token.raw}" in ${context.type}`;
    },

    end: (stack, token, index, tokens) => {
      const context = stack.current();

      if (token.type === 'newline') {
        context.whitespace.push(token.value);
        return index + 1;
      }
      throw `Unexpected ${token.type} token "${token.raw}" in ${context.type}`;
    },
  },

  map: {
    start: (stack, token, index, tokens) => {
      const context = stack.current();
      
      if (token.type === 'key') {
        const indent = index > 0 && tokens[index - 1].type === 'padding' ? tokens[index - 1].value : '';
        const depth = indent.length / 2;
        if (depth !== context.depth) throw `depth !== ${context.depth}`;
        context.indent = indent;
        // TODO set global indent OR check indent

        context.state = 'after_key';

        return index + 1;
      }
      throw `Unexpected ${token.type} token "${token.raw}" in ${context.type}`;
    },
    after_key: (stack, token, index, tokens) => {
      const context = stack.current();

      if (token.type === 'newline') {
        context.state = 'after_newline';
        return index + 1;
      }

      if (token.type === 'null') {
        context.state = 'after_newline';
        return index + 1;
      }    

      throw `Unexpected ${token.type} token "${token.raw}" in ${context.type}`;
    },
    after_newline: (stack, token, index, tokens) => {
      const context = stack.current();

      if (token.type === 'newline') {
        context.whitespace.push(token);
        return index + 1;
      }

      if (token.type === 'key') {
        const map = { type: 'map', depth: context.depth + 1, state: 'start', data: [], whitespace: [] };
        context.data.push(map);
        stack.push(map);
        return index;
      }

      throw `Unexpected ${token.type} token "${token.raw}" in ${context.type}`;
    },
  },
};

const tokenize = function(string) {
  let tokens = [];
  let tokenFound;
  let line = 1;
  let char = 1;
  while (string.length > 0) {
    tokenFound = _.findKey(tokenRegexes, function(regex, key) {
      const match = string.match(regex);
      if (match !== null && match[0].length > 0) {
        tokens.push({ type: key, value: match[1] || null, raw: match[0], line: line, char: char });
        string = string.slice(match[0].length);
        line += (match[0].match(/\n/g) || []).length;
        const newlineIndex = match[0].lastIndexOf('\n');
        if (newlineIndex === -1) {
          char += match[0].length;
        } else {
          char = match[0].length - newlineIndex;
        }
        return true;
      }
    });
    if (!tokenFound) {
      throw `Unexpected token near "${string.slice(0, 10)}"`;
    }
  }
  return tokens;
};

const parse = function(input) {
  const tokens = tokenize(input);
  const stack = new Stack([{ type: 'document', state: 'start', data: [], whitespace: [] }]);

  console.log(tokens);

  for (let index = 0; index < tokens.length;) {
    const context = stack.current();
    const token = tokens[index];
    if (!context) throw `Unexpected ${token.type} token "${token.raw}"`;

    // Padding is generally ignored by the parser
    if (token.type === 'padding') {
      index++
      continue;
    };

    // TODO: Get rid of this
    if (!blockStates[context.type] || !blockStates[context.type][context.state]) {
      throw `Unknown block/state ${context.type} ${context.state}`;
    }

    console.log(context.type, context.state, token.type, index);

    index = blockStates[context.type][context.state](stack, token, index, tokens);
  }

  //   if (context.type === 'key') {
  //     if (token.type === 'true' || token.type === 'false' || token.type === 'null') {
  //       const value = { type: 'value', value: null };
  //       context.data.push(value);
  //       stack.pop();
  //       if (stack.length === 0) throw 'stack.length === 0';
  //       context = _.last(stack);
  //     }

  //     else if (token.type === 'key') {
  //       const indent = i > 0 && tokens[i - 1].type === 'padding' ? tokens[i - 1].value : '';
  //       const depth = indent.length / 2;

  //       const map = { type: 'map', depth: depth, indent: indent, data: [] };
  //       context.data.push(map);
  //       stack.push(map);
  //       context = map;
  //     }

  //     else {
  //       throw `Unexpected value "${token.type}"`;
  //     }
  //   }

  //   if (token.type === 'key') {
  //     const indent = i > 0 && tokens[i - 1].type === 'padding' ? tokens[i - 1].value : '';
  //     const depth = indent.length / 2;

  //     if (context.type === 'map') {
  //       if (depth === context.depth + 1) {
  //         const map = { type: 'map', depth: depth, indent: indent, data: [] };
  //         context.data.push(map);
  //         stack.push(map);
  //         context = map;
  //       }
  //       if (depth === context.depth - 1) {
  //         stack.pop();
  //         if (stack.length === 0) throw 'stack.length === 0';
  //         context = _.last(stack);
  //         // Check this is a map (could be list)
  //       }
  //       if (depth > context.depth + 1) throw 'depth > context.depth + 1';
  //       if (depth < context.depth - 1) throw 'depth > context.depth + 1';
  //     }

  //     else if (context.type === 'document') {
  //       if (depth !== 0) throw 'depth !== 0';
  //       const map = { type: 'map', depth: 0, indent: '', data: [] };
  //       context.data.push(map);
  //       stack.push(map);
  //       context = map;
  //     }

  //     else if (context.type !== 'key') {
  //       throw `Unknown context "${context.type}" for key: "${token.value}"`;
  //     }

  //     const key = {
  //       type: 'key',
  //       name: token.value.replace(/^"(.*)"$/g, '$1').replace(/\"/g, '"').replace(/\\n/g, '\n'),
  //       keyType: token.value.match(/^"(.*)"$/) ? 'string' : 'symbol',
  //       data: [],
  //     };
  //     context.data.push(key);
  //     stack.push(key);
  //     context = key;
  //   }

  // TODO: Check for unclosed explicit things

  return stack.base();
};

const x = parse(
` #foo
#bar

foo:
  bar: # Comment 1!
    zim : null
  null null
  gir:null#Comment 2!

  # Comment 3!

# Comment`);

console.log(JSON.stringify(x, null, '  '));

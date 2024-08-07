import lodash from 'lodash';

import {
  EndToken, PrimitiveToken, oneOf,
  TrueToken, FalseToken, NullToken,
  NumberToken, StringToken,
  SymbolToken, DashToken,
  LineEndToken, PaddingToken, NewlineToken,
} from './tokens';
import Node, { PatternAction, WhitespaceAst } from './Node';
import MapNode, { MapAst } from './MapNode';
import ValueNode, { ValueAst } from './ValueNode';
import { JsonList } from './Json';

/** Possible ListNode states */
type ListNodeState = (
  | 'beforeIndent'
  | 'beforeKey'
  | 'beforeValue'
  | 'afterValue'
  | 'beforeNestedValue'
  | 'afterItem'
);


/** Nested types which can be pushed on the stack */
type ListNestedNode = ListNode | MapNode;


/** List AST structure */
export interface ListAst {
  type: 'List';
  whitespace: WhitespaceAst;
  value: ListItemAst[];
}

/** Node reprsenting a list (array) */
export default class ListNode extends Node<ListNodeState, ListNestedNode> {
  state: ListNodeState = 'beforeIndent';
  nesting: number;
  value: ListItemNode[] = [];

  constructor(nesting: number) {
    super();
    this.nesting = nesting;
  }

  /** Get possible actions given a state */
  getActions(state: ListNodeState) {
    return ListNode.actions[state];
  }

  /** Get raw data for the list */
  getData(): JsonList {
    return this.value.map((node) => node.getData());
  }

  /** Get AST data for the list */
  getAst(): ListAst {
    return {
      type: 'List',
      whitespace: lodash.pickBy(this.whitespace, (value) => value),
      value: this.value.map((node) => node.getAst()),
    };
  }

  static actions: { [key: string]: Array<PatternAction<ListNodeState, ListNestedNode>> } = {
    beforeIndent: [
      {
        pattern: [PaddingToken.optional()],
        action: function(this: ListNode, tokens: [] | [PaddingToken], indent?: string) {
          const tokenIndent = (tokens[0] ? tokens[0].value : '');
          if (indent) {
            if (lodash.repeat(indent, this.nesting) !== tokenIndent) {
              throw Error('Invalid indent');
            }
          }

          // TODO: Check indent is only tabs or spaces

          this.state = 'beforeKey';
          return { consumed: tokens.length, indent: indent && this.nesting > 0 ? undefined : tokenIndent };
        },
      },
    ],

    beforeKey: [
      {
        pattern: [DashToken],
        action: function(this: ListNode, tokens: [DashToken]) {
          const item = new ListItemNode();

          // Move whitespace to next item to be more meaningful
          const lastItem = this.value[this.value.length - 1];
          if (lastItem && lastItem.whitespace.after) {
            const index = lastItem.whitespace.after.indexOf('\n');
            if (index !== -1) {
              item.whitespace.before += lastItem.whitespace.after.slice(index + 1);
              lastItem.whitespace.after = lastItem.whitespace.after.slice(0, index);
            }
          }

          this.value.push(item);

          this.state = 'beforeValue';
          return { consumed: tokens.length };
        },
      },
    ],

    beforeValue: [
      {
        pattern: [PaddingToken, PrimitiveToken],
        action: function(
          this: ListNode,
          tokens: [PaddingToken, TrueToken | FalseToken | NullToken | NumberToken | StringToken],
        ) {
          const item = this.value[this.value.length - 1];
          item.value = new ValueNode(tokens[1]);
          item.whitespace.inner += tokens[0].value.slice(1);
          this.state = 'afterValue';
          return { consumed: tokens.length };
        },
      },
      {
        pattern: [LineEndToken.optional(), NewlineToken],
        action: function(this: ListNode, tokens: Array<LineEndToken | NewlineToken>) {
          const item = this.value[this.value.length - 1];
          item.whitespace.inner += tokens[0] instanceof LineEndToken ? tokens[0].value : '';

          this.state = 'beforeNestedValue';
          return { consumed: tokens.length };
        },
      },
    ],

    beforeNestedValue: [
      {
        pattern: [PaddingToken, DashToken],
        action: function(this: ListNode) {
          const item = this.value[this.value.length - 1];
          item.value = new ListNode(this.nesting + 1);

          // Move whitespace additional lines to item value
          if (item.whitespace.after) {
            item.value.whitespace.before += item.whitespace.after;
            item.whitespace.after = '';
          }

          this.state = 'afterItem';
          return { push: item.value };
        },
      },
      {
        pattern: [PaddingToken, oneOf([StringToken, SymbolToken])],
        action: function(this: ListNode) {
          const item = this.value[this.value.length - 1];
          item.value = new MapNode(this.nesting + 1);

          // Move whitespace additional lines to item value
          if (item.whitespace.after) {
            item.value.whitespace.before += item.whitespace.after;
            item.whitespace.after = '';
          }

          this.state = 'afterItem';
          return { push: item.value };
        },
      },
      {
        pattern: [LineEndToken.optional(), NewlineToken],
        action: function(
          this: ListNode,
          tokens: Array<LineEndToken | NewlineToken>,
        ) {
          const item = this.value[this.value.length - 1];
          item.whitespace.after += tokens.map((token) => token.value).join('');
          return { consumed: tokens.length };
        },
      },
    ],

    afterValue: [
      {
        pattern: [LineEndToken.optional(), NewlineToken],
        action: function(this: ListNode, tokens: Array<LineEndToken | NewlineToken>) {
          const item = this.value[this.value.length - 1];
          item.whitespace.after += tokens.map((token) => token.value).join('');
          return { consumed: tokens.length };
        },
      },
      {
        pattern: [],
        action: function(this: ListNode) {
          this.state = 'afterItem';
          return {};
        },
      },
    ],

    afterItem: [
      {
        pattern: [PaddingToken.optional(), oneOf([StringToken, SymbolToken, DashToken])],
        action: function(
          this: ListNode,
          tokens: (
            | [StringToken | SymbolToken | DashToken]
            | [PaddingToken, StringToken | SymbolToken | DashToken]
          ),
          indent: string,
        ) {
          const item = this.value[this.value.length - 1];

          // Hoist value whitespace to item
          item.whitespace.after += item.value.whitespace.after;
          item.value.whitespace.after = '';

          const tokenIndent = tokens[0] instanceof PaddingToken ? tokens[0].value : '';

          // TODO: Improve performance of check
          if (lodash.repeat(indent || '', this.nesting) === tokenIndent) {
            this.state = 'beforeIndent';
            return {};
          }

          // TODO: Improve performance of check
          if (lodash.repeat(indent, this.nesting).slice(0, tokenIndent.length) === tokenIndent) {
            // We're leaving this list, so hoist the whitespace from this item to the list
            const index = item.whitespace.after.indexOf('\n');
            if (index !== -1) {
              this.whitespace.after += item.whitespace.after.slice(index + 1);
              item.whitespace.after = item.whitespace.after.slice(0, index);
            }

            return { pop: true };
          }

          throw Error('Invalid indent');
        },
      },
      {
        pattern: [LineEndToken.optional(), EndToken],
        action: function(this: ListNode, tokens: [EndToken] | [LineEndToken, EndToken]) {
          const item = this.value[this.value.length - 1];
          item.whitespace.after += tokens[0] instanceof LineEndToken ? tokens[0].value : '';

          // We're ending the document, so hoist the whitespace from this item to the list
          const index = item.whitespace.after.indexOf('\n');
          if (index !== -1) {
            this.whitespace.after += item.whitespace.after.slice(index);
            item.whitespace.after = item.whitespace.after.slice(0, index);
          }

          return { consumed: tokens[0] instanceof LineEndToken ? 1 : 0, pop: true };
        },
      },
    ],
  };
}

/** ListItem AST structure */
interface ListItemAst {
  type: 'ListItem';
  whitespace: WhitespaceAst;
  value: ListAst | MapAst | ValueAst;
}

/** Node representing a list item */
class ListItemNode extends Node<'', ListNestedNode | ValueNode> {
  value: ListNestedNode | ValueNode;

  /** Get raw data for the list item value */
  getData() {
    return this.value.getData();
  }

  /** Get AST data for list item */
  getAst(): ListItemAst {
    return {
      type: 'ListItem',
      whitespace: lodash.pickBy(this.whitespace, (value) => value),
      value: this.value.getAst(),
    };
  }
}

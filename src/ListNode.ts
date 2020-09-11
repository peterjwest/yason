import pickBy from 'lodash/pickBy';
import identity from 'lodash/identity';

import {
  EndToken, PrimitiveToken, oneOf,
  TrueToken, FalseToken, NullToken,
  NumberToken, StringToken,
  SymbolToken, DashToken,
  CommentToken, PaddingToken, NewlineToken,
} from './tokens';
import Node, { Action, WhitespaceAst } from './Node';
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
  | 'afterNestedValue'
  | 'afterItem'
);

/** List AST structure */
export interface ListAst {
  type: 'List';
  whitespace: WhitespaceAst;
  value: ListItemAst[];
}

/** Node reprsenting a list (array) */
export default class ListNode extends Node<ListNodeState> {
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
      whitespace: pickBy(this.whitespace, identity),
      value: this.value.map((node) => node.getAst()),
    };
  }

  static actions: { [key: string]: Array<Action<ListNodeState>> } = {
    beforeIndent: [
      {
        pattern: [NewlineToken],
        action: function(this: ListNode, tokens: [NewlineToken]) {
          return { consumed: tokens.length };
        },
      },
      {
        pattern: [PaddingToken],
        action: function(this: ListNode, tokens: [PaddingToken]) {
          // TODO: More sophisticaed indent checking i.e. tabs
          if (tokens[0].value.length % 4 !== 0) {
            throw Error('Invalid indent');
          }
          if (this.nesting !== tokens[0].value.length / 4) {
            throw Error('Invalid indent');
          }
          this.state = 'beforeKey';
          return { consumed: tokens.length };
        },
      },
      {
        pattern: [],
        action: function(this: ListNode, tokens: []) {
          if (this.nesting === 0) {
            this.state = 'beforeKey';
          }
          return {};
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
              item.whitespace.before = lastItem.whitespace.after.slice(index);
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
          item.whitespace.inner = tokens[0].value.slice(1);
          this.state = 'afterValue';
          return { consumed: tokens.length };
        },
      },
      {
        pattern: [PaddingToken.optional(), CommentToken.optional(), NewlineToken],
        action: function(
          this: ListNode,
          tokens: (
            | [NewlineToken]
            | [PaddingToken | CommentToken, NewlineToken]
            | [PaddingToken | CommentToken, PaddingToken | CommentToken, NewlineToken]
          ),
        ) {
          const whitespaceTokens = tokens.slice(0, -1);

          const item = this.value[this.value.length - 1];
          item.whitespace.inner = whitespaceTokens.map((token) => token.value).join('');

          this.state = 'beforeNestedValue';
          return { consumed: whitespaceTokens.length };
        },
      },
    ],

    beforeNestedValue: [
      {
        pattern: [NewlineToken, PaddingToken, DashToken],
        action: function(this: ListNode, tokens: [NewlineToken, PaddingToken, DashToken]) {
          const item = this.value[this.value.length - 1];
          item.value = new ListNode(this.nesting + 1);

          // TODO: Do this as post processing?
          // Move whitespace additional lines to item value
          if (item.whitespace.inner) {
            const index = item.whitespace.inner.indexOf('\n');
            if (index !== -1) {
              item.value.whitespace.before = item.whitespace.inner.slice(index);
              item.whitespace.inner = item.whitespace.inner.slice(0, index);
            }
          }

          this.state = 'afterNestedValue';
          return { push: item.value };
        },
      },
      {
        pattern: [NewlineToken, PaddingToken, oneOf([StringToken, SymbolToken])],
        action: function(this: ListNode, tokens: [NewlineToken, PaddingToken, StringToken | SymbolToken]) {
          const item = this.value[this.value.length - 1];
          item.value = new MapNode(this.nesting + 1);

          // TODO: Do this as post processing?
          // Move whitespace additional lines to item value
          if (item.whitespace.inner) {
            const index = item.whitespace.inner.indexOf('\n');
            if (index !== -1) {
              item.value.whitespace.before = item.whitespace.inner.slice(index);
              item.whitespace.inner = item.whitespace.inner.slice(0, index);
            }
          }

          this.state = 'afterNestedValue';
          return { push: item.value };
        },
      },
      {
        pattern: [NewlineToken, PaddingToken.optional(), CommentToken.optional()],
        action: function(
          this: ListNode,
          tokens: Array<PaddingToken | CommentToken | NewlineToken>,
        ) {
          const item = this.value[this.value.length - 1];
          item.whitespace.after = item.whitespace.after + tokens.map((token) => token.value).join('');
          return { consumed: tokens.length };
        },
      },
    ],

    afterValue: [
      {
        pattern: [oneOf([PaddingToken, CommentToken])],
        action: function(this: ListNode, tokens: [PaddingToken | CommentToken]) {
          const item = this.value[this.value.length - 1];
          item.whitespace.after = item.whitespace.after + tokens[0].value;
          return { consumed: tokens.length };
        },
      },
      {
        pattern: [],
        action: function(this: ListNode, tokens: []) {
          this.state = 'afterItem';
          return {};
        },
      },
    ],

    afterNestedValue: [
      {
        pattern: [],
        action: function(this: ListNode, tokens: []) {
          this.state = 'afterItem';
          return {};
        },
      },
    ],

    afterItem: [
      {
        pattern: [
          NewlineToken,
          PaddingToken.optional(),
          oneOf([StringToken, SymbolToken, DashToken]),
        ],
        action: function(
          this: ListNode,
          tokens: (
            | [NewlineToken, StringToken | SymbolToken | DashToken]
            | [NewlineToken, PaddingToken, StringToken | SymbolToken | DashToken]
          ),
        ) {
          const indentLength = tokens.length === 3 ? tokens[1].value.length : 0;

          if (indentLength !== 0 && indentLength % 4 !== 0)
            throw Error(`Invalid indent ${indentLength}`);

          if (this.nesting === indentLength / 4) {
            this.state = 'beforeIndent';
            return {};
          }

          if (this.nesting > indentLength / 4) {
            // TODO: Do this as post processing?
            // We're leaving this list, so hoist the whitespace from this item to the list
            const item = this.value[this.value.length - 1];
            this.whitespace.after = item.whitespace.after;
            item.whitespace.after = '';

            return { pop: true };
          }

          throw Error('Invalid indent');
        },
      },
      {
        pattern: [NewlineToken, PaddingToken.optional(), CommentToken.optional()],
        action: function(
          this: ListNode,
          tokens: Array<PaddingToken | CommentToken | NewlineToken>,
        ) {
          const item = this.value[this.value.length - 1];
          item.whitespace.after = item.whitespace.after + tokens.map((token) => token.value).join('');
          return { consumed: tokens.length };
        },
      },
      {
        pattern: [EndToken],
        action: function(this: ListNode, tokens: [EndToken]) {
          // TODO: Do this as post processing?
          // We're ending the document, so hoist the whitespace from this item to the map
          const item = this.value[this.value.length - 1];
          this.whitespace.after = item.whitespace.after;
          item.whitespace.after = '';

          return { pop: true };
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
class ListItemNode extends Node<''> {
  value: ListNode | MapNode | ValueNode;

  /** Get raw data for the list item value */
  getData() {
    return this.value.getData();
  }

  /** Get AST data for list item */
  getAst(): ListItemAst {
    return {
      type: 'ListItem',
      whitespace: pickBy(this.whitespace, identity),
      value: this.value.getAst(),
    };
  }
}

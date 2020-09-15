import fromPairs from 'lodash/fromPairs';
import pickBy from 'lodash/pickBy';
import identity from 'lodash/identity';

import {
  EndToken, PrimitiveToken, oneOf,
  TrueToken, FalseToken, NullToken,
  NumberToken, StringToken,
  SymbolToken, ColonToken, DashToken,
  LineEndToken, PaddingToken, NewlineToken,
} from './tokens';
import Node, { Action, WhitespaceAst } from './Node';
import ListNode, { ListAst } from './ListNode';
import ValueNode, { ValueAst } from './ValueNode';
import KeyNode, { KeyAst } from './KeyNode';
import { JsonMap } from './Json';

/** Possible MapNode states */
export type MapNodeState = (
  | 'beforeIndent'
  | 'beforeKey'
  | 'beforeValue'
  | 'beforeNestedValue'
  | 'afterValue'
  | 'afterItem'
);

/** Nested types which can be pushed on the stack */
type MapNestedNode = ListNode | MapNode;

/** Map AST structure */
export interface MapAst {
  type: 'Map';
  whitespace: WhitespaceAst;
  value: MapItemAst[];
}

/** Node reprsenting a map (dictionary) */
export default class MapNode extends Node<MapNodeState, MapNestedNode> {
  state: MapNodeState = 'beforeIndent';
  nesting: number;
  value: MapItemNode[] = [];

  constructor(nesting: number) {
    super();
    this.nesting = nesting;
  }

  /** Get possible actions given a state */
  getActions(state: MapNodeState) {
    return MapNode.actions[state];
  }

  /** Get raw data for the map */
  getData(): JsonMap {
    return fromPairs(this.value.map((item) => [
      item.key.getData(),
      item.getData(),
    ]));
  }

  /** Get AST data for the map */
  getAst(): MapAst {
    return {
      type: 'Map',
      whitespace: pickBy(this.whitespace, identity),
      value: this.value.map((item) => item.getAst()),
    };
  }

  static actions: { [key: string]: Array<Action<MapNodeState, MapNestedNode>> } = {
    beforeIndent: [
      {
        pattern: [PaddingToken.optional()],
        action: function(this: MapNode, tokens: [] | [PaddingToken]) {
          // TODO: More sophisticaed indent checking i.e. tabs
          const indentLength = tokens[0] ? tokens[0].value.length : 0;
          if (indentLength % 4 !== 0) {
            throw Error('Invalid indent');
          }
          if (this.nesting !== indentLength / 4) {
            throw Error('Invalid indent');
          }
          this.state = 'beforeKey';
          return { consumed: tokens.length };
        },
      },
    ],

    beforeKey: [
      {
        pattern: [
          oneOf([StringToken, SymbolToken]), PaddingToken.optional(), ColonToken,
        ],
        action: function(
          this: MapNode,
          tokens: (
            | [StringToken | SymbolToken, ColonToken]
            | [StringToken | SymbolToken, PaddingToken, ColonToken]
          ),
        ) {
          const item = new MapItemNode();
          item.key = new KeyNode(tokens[0]);

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

          if (tokens[1] instanceof PaddingToken) {
            item.key.whitespace.inner += tokens[1].value;
          }
          this.state = 'beforeValue';
          return { consumed: tokens.length };
        },
      },
    ],

    beforeValue: [
      {
        pattern: [PaddingToken.optional(), PrimitiveToken],
        action: function(
          this: MapNode,
          tokens: (
            | [TrueToken | FalseToken | NullToken | NumberToken | StringToken]
            | [PaddingToken, TrueToken | FalseToken | NullToken | NumberToken | StringToken]
          ),
        ) {
          const item = this.value[this.value.length - 1];
          item.value = new ValueNode(tokens[tokens.length - 1]);
          item.value.whitespace.before += tokens[0] instanceof PaddingToken ? tokens[0].value : '';
          this.state = 'afterValue';
          return { consumed: tokens.length };
        },
      },

      {
        pattern: [LineEndToken.optional(), NewlineToken],
        action: function(
          this: MapNode,
          tokens: Array<LineEndToken | NewlineToken>,
        ) {
          const item = this.value[this.value.length - 1];
          item.key.whitespace.after += tokens[0] instanceof LineEndToken ? tokens[0].value : '';

          this.state = 'beforeNestedValue';
          return { consumed: tokens.length };
        },
      },
    ],

    beforeNestedValue: [
      {
        pattern: [PaddingToken, oneOf([StringToken, SymbolToken])],
        action: function(this: MapNode, tokens: [PaddingToken, StringToken | SymbolToken]) {
          const item = this.value[this.value.length - 1];
          item.value = new MapNode(this.nesting + 1);

          // Move whitespace additional lines to item value
          if (item.whitespace.after) {
            item.value.whitespace.before += item.whitespace.after;
            item.whitespace.after = '';
          }

          this.state = 'afterValue';
          return { push: item.value };
        },
      },
      {
        pattern: [PaddingToken, DashToken],
        action: function(this: MapNode, tokens: [PaddingToken, DashToken]) {
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
        pattern: [LineEndToken.optional(), NewlineToken],
        action: function(this: MapNode, tokens: Array<LineEndToken | NewlineToken>) {
          const item = this.value[this.value.length - 1];
          item.whitespace.after += tokens.map((token) => token.value).join('');

          return { consumed: tokens.length };
        },
      },
    ],

    afterValue: [
      {
        pattern: [LineEndToken.optional(), NewlineToken],
        action: function(this: MapNode, tokens: Array<LineEndToken | NewlineToken>) {
          const item = this.value[this.value.length - 1];
          item.whitespace.after += tokens.map((token) => token.value).join('');
          return { consumed: tokens.length };
        },
      },
      {
        pattern: [],
        action: function(this: MapNode, tokens: []) {
          this.state = 'afterItem';
          return {};
        },
      },
    ],

    afterItem: [
      {
        pattern: [PaddingToken.optional(), oneOf([StringToken, SymbolToken, DashToken])],
        action: function(
          this: MapNode,
          tokens: (
            | [StringToken | SymbolToken | DashToken]
            | [PaddingToken, StringToken | SymbolToken | DashToken]
          ),
        ) {
          const item = this.value[this.value.length - 1];

          // Hoist value whitespace to item
          item.whitespace.after += item.value.whitespace.after;
          item.value.whitespace.after = '';

          const indentLength = tokens[0] instanceof PaddingToken ? tokens[0].value.length : 0;

          if (this.nesting === indentLength / 4) {
            this.state = 'beforeIndent';
            return {};
          }

          if (this.nesting > indentLength / 4) {
            // We're leaving this map, so hoist the whitespace from this item to the map
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
        action: function(this: MapNode, tokens: [EndToken] | [LineEndToken, EndToken]) {
          const item = this.value[this.value.length - 1];
          item.whitespace.after += tokens[0] instanceof LineEndToken ? tokens[0].value : '';

          // We're ending the document, so hoist the whitespace from this item to the map
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

/** MapItem AST structure */
interface MapItemAst {
  type: 'MapItem';
  whitespace: WhitespaceAst;
  key: KeyAst;
  value: ListAst | MapAst | ValueAst;
}

/** Node representing a map key/value pair */
export class MapItemNode extends Node<'', MapNestedNode> {
  key: KeyNode;
  value: MapNestedNode | ValueNode;

  /** Get raw data for the map value */
  getData() {
    return this.value.getData();
  }

  /** Get AST data for key/value pair */
  getAst(): MapItemAst {
    return {
      type: 'MapItem',
      whitespace: pickBy(this.whitespace, identity),
      key: this.key.getAst(),
      value: this.value.getAst(),
    };
  }
}

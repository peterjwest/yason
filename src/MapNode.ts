import { fromPairs } from 'lodash';

import {
  EndToken, PrimitiveToken, oneOf,
  TrueToken, FalseToken, NullToken,
  NumberToken, StringToken,
  SymbolToken, ColonToken, DashToken,
  CommentToken, PaddingToken, NewlineToken,
} from './tokens';
import Node, { Action } from './Node';
import ListNode, { ListAst } from './ListNode';
import ValueNode, { ValueAst } from './ValueNode';
import KeyNode, { KeyAst } from './KeyNode';
import { JsonMap } from './Json';

/** Possible MapNode states */
export type MapNodeState = (
  | 'beforeIndent'
  | 'afterValue'
  | 'beforeKey'
  | 'beforeValue'
  | 'beforeNestedValue'
  | 'afterValue'
  | 'afterNestedValue'
  | 'afterItem'
);

/** Map AST structure */
export interface MapAst {
  type: 'Map';
  beforeWhitespace: string;
  afterWhitespace: string;
  indent: string;
  value: MapItemAst[];
}

/** Node reprsenting a map (dictionary) */
export default class MapNode extends Node<MapNodeState> {
  state: MapNodeState = 'beforeIndent';
  beforeWhitespace = '';
  afterWhitespace = '';
  nesting: number;
  indent: string;
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
      beforeWhitespace: this.beforeWhitespace,
      afterWhitespace: this.afterWhitespace,
      indent: this.indent,
      value: this.value.map((item) => item.getAst()),
    };
  }

  static actions: { [key: string]: Array<Action<MapNodeState>> } = {
    beforeIndent: [
      {
        pattern: [NewlineToken],
        action: function(this: MapNode, tokens: [NewlineToken]) {
          this.state = 'beforeIndent';
          return { consumed: tokens.length };
        },
      },
      {
        pattern: [PaddingToken],
        action: function(this: MapNode, tokens: [PaddingToken]) {
          // TODO: More sophisticaed indent checking i.e. tabs
          if (tokens[0].value.length % 4 !== 0) {
            throw Error('Invalid indent');
          }
          this.indent = tokens[0].value;
          if (this.nesting !== tokens[0].value.length / 4) {
            throw Error('Invalid indent');
          }
          this.state = 'beforeKey';
          return { consumed: tokens.length };
        },
      },
      {
        pattern: [],
        action: function(this: MapNode, tokens: []) {
          if (this.nesting === 0) {
            this.state = 'beforeKey';
          }
          return {};
        },
      },
    ],

    beforeKey: [
      {
        pattern: [
          oneOf([StringToken, SymbolToken]),
          PaddingToken.optional(),
          ColonToken,
        ],
        action: function(
          this: MapNode,
          tokens:
            [StringToken | SymbolToken, ColonToken] | [StringToken | SymbolToken, PaddingToken, ColonToken],
        ) {
          const item = new MapItemNode();
          item.key = new KeyNode(tokens[0]);
          item.keyType = tokens[0] instanceof StringToken ? 'StringToken' : 'SymbolToken';

          const lastItem = this.value[this.value.length - 1];
          if (lastItem) {
            item.beforeWhitespace = lastItem.afterWhitespace;
            lastItem.afterWhitespace = '';
          }

          this.value.push(item);

          if (tokens[1] instanceof PaddingToken) {
            item.keyPadding = tokens[1].value;
          }
          this.state = 'beforeValue';
          return { consumed: tokens.length };
        },
      },
    ],

    beforeValue: [
      {
        pattern: [oneOf([PaddingToken, CommentToken])],
        action: function(
          this: MapNode,
          tokens: [PaddingToken | CommentToken],
        ) {
          const item = this.value[this.value.length - 1];
          item.valuePadding = tokens[0].value;
          return { consumed: tokens.length };
        },
      },
      {
        pattern: [PrimitiveToken],
        action: function(
          this: MapNode,
          tokens: [TrueToken | FalseToken | NullToken | NumberToken | StringToken],
        ) {
          const item = this.value[this.value.length - 1];
          item.value = new ValueNode(tokens[0]);
          this.state = 'afterValue';
          return { consumed: tokens.length };
        },
      },
      {
        pattern: [NewlineToken],
        action: function(this: MapNode, tokens: [NewlineToken]) {
          this.state = 'beforeNestedValue';
          return {};
        },
      },
    ],

    beforeNestedValue: [
      {
        pattern: [NewlineToken, PaddingToken, oneOf([StringToken, SymbolToken])],
        action: function(
          this: MapNode, tokens: [NewlineToken, PaddingToken, StringToken | SymbolToken],
        ) {
          const item = this.value[this.value.length - 1];
          item.value = new MapNode(this.nesting + 1);
          // item.value.beforeWhitespace = item.afterWhitespace;
          // item.afterWhitespace = '';
          this.state = 'afterNestedValue';
          return { push: item.value };
        },
      },
      {
        pattern: [NewlineToken, PaddingToken, DashToken],
        action: function(this: MapNode, tokens: [NewlineToken, PaddingToken, DashToken]) {
          const item = this.value[this.value.length - 1];
          item.value = new ListNode(this.nesting + 1);
          // item.value.beforeWhitespace = item.afterWhitespace;
          // item.afterWhitespace = '';
          this.state = 'afterNestedValue';
          return { push: item.value };
        },
      },
      {
        pattern: [NewlineToken, PaddingToken.optional(), CommentToken.optional()],
        action: function(
          this: MapNode,
          tokens: Array<PaddingToken | CommentToken | NewlineToken>,
        ) {
          const item = this.value[this.value.length - 1];
          item.beforeWhitespace += tokens.map((token) => token.value).join('');
          return { consumed: tokens.length };
        },
      },
    ],

    afterValue: [
      {
        pattern: [oneOf([PaddingToken, CommentToken])],
        action: function(
          this: MapNode,
          tokens: [PaddingToken | CommentToken],
        ) {
          const item = this.value[this.value.length - 1];
          item.afterPadding += tokens[0].value;
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

    afterNestedValue: [
      {
        pattern: [],
        action: function(this: MapNode, tokens: []) {
          const item = this.value[this.value.length - 1];
          item.afterWhitespace = item.value.afterWhitespace;
          item.value.afterWhitespace = '';

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
          this: MapNode,
          tokens: (
            | [NewlineToken, StringToken | SymbolToken | DashToken]
            | [NewlineToken, PaddingToken, StringToken | SymbolToken | DashToken]
          ),
        ) {
          const indentLength = tokens.length === 3 ? tokens[1].value.length : 0;

          if (indentLength !== 0 && indentLength % 4 !== 0)
            throw Error('Invalid indent');

          if (this.nesting === indentLength / 4) {
            this.state = 'beforeIndent';
            return {};
          }

          if (this.nesting > indentLength / 4) {
            const item = this.value[this.value.length - 1];
            this.afterWhitespace = item.afterWhitespace;
            item.afterWhitespace = '';
            return { pop: true };
          }

          throw Error('Invalid indent');
        },
      },
      {
        pattern: [NewlineToken, PaddingToken.optional(), CommentToken.optional()],
        action: function(
          this: MapNode,
          tokens: Array<PaddingToken | CommentToken | NewlineToken>,
        ) {
          const item = this.value[this.value.length - 1];
          item.afterWhitespace += tokens.map((token) => token.value).join('');
          return { consumed: tokens.length };
        },
      },
      {
        pattern: [EndToken],
        action: function(this: MapNode, tokens: [EndToken]) {
          const item = this.value[this.value.length - 1];
          this.afterWhitespace = item.afterWhitespace;
          item.afterWhitespace = '';
          return { pop: true };
        },
      },
    ],
  };
}

/** MapItem AST structure */
interface MapItemAst {
  type: 'MapItem';
  beforeWhitespace: string;
  afterWhitespace: string;
  afterPadding: string;
  keyPadding: string;
  valuePadding: string;
  keyType: 'StringToken' | 'SymbolToken';
  key: KeyAst;
  value: ListAst | MapAst | ValueAst;
}

/** Node representing a map key/value pair */
export class MapItemNode {
  beforeWhitespace = '';
  afterWhitespace = '';
  afterPadding = '';
  keyPadding = '';
  valuePadding = '';
  key: KeyNode;
  value: ListNode | MapNode | ValueNode;
  keyType: 'StringToken' | 'SymbolToken';

  /** Get raw data for the map value */
  getData() {
    return this.value.getData();
  }

  /** Get AST data for key/value pair */
  getAst(): MapItemAst {
    return {
      type: 'MapItem',
      beforeWhitespace: this.beforeWhitespace,
      afterWhitespace: this.afterWhitespace,
      afterPadding: this.afterPadding,
      keyPadding: this.keyPadding,
      valuePadding: this.valuePadding,
      keyType: this.keyType,
      key: this.key.getAst(),
      value: this.value.getAst(),
    };
  }
}

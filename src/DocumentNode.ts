import lodash from 'lodash';

import {
  EndToken, PrimitiveToken, oneOf,
  TrueToken, FalseToken, NullToken,
  NumberToken, StringToken,
  SymbolToken, ColonToken, DashToken,
  LineEndToken, PaddingToken, NewlineToken,
} from './tokens';
import { JsonValue } from './Json';
import Node, { WhitespaceAst } from './Node';
import ListNode, { ListAst } from './ListNode';
import MapNode, { MapAst } from './MapNode';
import ValueNode, { ValueAst } from './ValueNode';

/** Possible states of a DocumentNode */
export type DocumentNodeState = 'beforeValue' | 'afterValue';

/** Document AST structure */
export interface DocumentAst {
  type: 'Document';
  indent?: string;
  whitespace: WhitespaceAst;
  value: MapAst | ListAst | ValueAst;
}

/** Nested types which can be pushed on the stack */
type DocumentNestedNode = MapNode | ListNode;

/** Node representing a yason document */
export default class DocumentNode extends Node<DocumentNodeState, DocumentNestedNode> {
  state: DocumentNodeState = 'beforeValue';
  value: DocumentNestedNode | ValueNode;
  indent?: string;

  /** Get possible actions given a state */
  getActions(state: DocumentNodeState) {
    return DocumentNode.actions[state];
  }

  /** Get raw value */
  getData(): JsonValue {
    return this.value.getData();
  }

  /** DocumentNode AST structure */
  getAst(): DocumentAst {
    return {
      type: 'Document',
      indent: this.indent,
      whitespace: lodash.pickBy(this.whitespace, (node) => node),
      value: this.value.getAst(),
    };
  }

  static actions = {
    beforeValue: [
      {
        pattern: [oneOf([StringToken, SymbolToken]), PaddingToken.optional(), ColonToken],
        action: function(this: DocumentNode) {
          this.value = new MapNode(0);

          // Move whitespace to child node, so that DocumentNode has less state
          if (this.whitespace.before) {
            this.value.whitespace.before = this.whitespace.before;
            this.whitespace.before = '';
          }

          this.state = 'afterValue';
          return { push: this.value };
        },
      },
      {
        pattern: [DashToken],
        action: function(this: DocumentNode) {
          this.value = new ListNode(0);

          // Move whitespace to child node, so that DocumentNode has less state
          if (this.whitespace.before) {
            this.value.whitespace.before = this.whitespace.before;
            this.whitespace.before = '';
          }

          this.state = 'afterValue';
          return { push: this.value };
        },
      },
      {
        pattern: [PrimitiveToken, LineEndToken.optional(), oneOf([NewlineToken, EndToken])],
        action: function(
          this: DocumentNode,
          tokens: [TrueToken | FalseToken | NullToken | NumberToken | StringToken],
        ) {
          this.value = new ValueNode(tokens[0]);

          // Move whitespace to child node, so that DocumentNode has less state
          if (this.whitespace.before) {
            this.value.whitespace.before = this.whitespace.before;
            this.whitespace.before = '';
          }

          this.state = 'afterValue';
          return { consumed: 1 };
        },
      },
      {
        pattern: [LineEndToken.optional(), NewlineToken],
        action: function(this: DocumentNode, tokens: Array<LineEndToken | NewlineToken>) {
          this.whitespace.before = this.whitespace.before + tokens.map((token) => token.value).join('');
          return { consumed: tokens.length };
        },
      },
    ],

    afterValue: [
      {
        pattern: [oneOf([LineEndToken, NewlineToken])],
        action: function(
          this: DocumentNode, tokens: [LineEndToken | NewlineToken],
        ) {
          this.value.whitespace.after = this.value.whitespace.after + tokens[0].value;
          return { consumed: tokens.length };
        },
      },
      {
        pattern: [EndToken],
        action: function(this: DocumentNode, tokens: [EndToken]) {
          return { consumed: tokens.length, pop: true };
        },
      },
    ],
  };
}

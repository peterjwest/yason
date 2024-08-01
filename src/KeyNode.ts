import lodash from 'lodash';

import { StringToken, SymbolToken } from './tokens';
import Node, { WhitespaceAst } from './Node';
import ValueNode from './ValueNode';

/** Value AST structure */
export interface KeyAst {
  type: 'Key';
  symbol: boolean;
  whitespace: WhitespaceAst;
  value: string;
}

/** Node to hold primitive values */
export default class KeyNode extends Node<'', ValueNode> {
  value: string;
  symbol: boolean;

  constructor(token: StringToken | SymbolToken) {
    super();
    this.value = token instanceof StringToken ? JSON.parse(token.value) as string : token.value;
    this.symbol = token instanceof SymbolToken;
  }

  /** Get raw value */
  getData(): string {
    return this.value;
  }

  /** ValueNode AST structure */
  getAst(): KeyAst {
    return {
      type: 'Key',
      symbol: this.symbol,
      whitespace: lodash.pickBy(this.whitespace, (value) => value),
      value: this.value,
    };
  }
}

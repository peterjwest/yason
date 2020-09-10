import { StringToken, SymbolToken } from './tokens';
import Node from './Node';

/** Value AST structure */
export interface KeyAst {
  type: 'Key';
  symbol: boolean;
  middleWhitespace: string;
  afterWhitespace: string;
  value: string;
}

/** Node to hold primitive values */
export default class KeyNode extends Node<''> {
  middleWhitespace = '';
  afterWhitespace = '';
  value: string;
  symbol: boolean;

  constructor(token: StringToken | SymbolToken) {
    super();
    this.value = token instanceof StringToken ? JSON.parse(token.value) : token.value;
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
      middleWhitespace: this.middleWhitespace,
      afterWhitespace: this.afterWhitespace,
      value: this.value,
    };
  }
}

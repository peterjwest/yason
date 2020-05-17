import { StringToken, SymbolToken } from './tokens';
import Node from './Node';

/** Value AST structure */
export interface KeyAst {
  type: 'Value';
  beforeWhitespace: string;
  afterWhitespace: string;
  value: string;
}

/** Node to hold primitive values */
export default class KeyNode extends Node<''> {
  beforeWhitespace = '';
  afterWhitespace = '';
  value: string;

  constructor(token: StringToken | SymbolToken) {
    super();
    this.value = token instanceof StringToken ? JSON.parse(token.value) : token.value;
  }

  /** Get raw value */
  getData(): string {
    return this.value;
  }

  /** ValueNode AST structure */
  getAst(): KeyAst {
    return {
      type: 'Value',
      beforeWhitespace: this.beforeWhitespace,
      afterWhitespace: this.afterWhitespace,
      value: this.value,
    };
  }
}

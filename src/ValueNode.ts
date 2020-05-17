import { TrueToken, FalseToken, NullToken, NumberToken, StringToken } from './tokens';
import Node from './Node';
import { JsonPrimitive } from './Json';

/** Value AST structure */
export interface ValueAst {
  type: 'Value';
  beforeWhitespace: string;
  afterWhitespace: string;
  value: JsonPrimitive;
}

/** Node to hold primitive values */
export default class ValueNode extends Node<''> {
  beforeWhitespace = '';
  afterWhitespace = '';
  value: boolean | null | number | string;

  constructor(token: TrueToken | FalseToken | NullToken | NumberToken | StringToken) {
    super();
    if (token instanceof TrueToken) {
      this.value = true;
    } else if (token instanceof FalseToken) {
      this.value = false;
    } else if (token instanceof NullToken) {
      this.value = null;
    } else {
      this.value = JSON.parse(token.value);
    }
  }

  /** Get raw value */
  getData(): JsonPrimitive {
    return this.value;
  }

  /** ValueNode AST structure */
  getAst(): ValueAst {
    return {
      type: 'Value',
      beforeWhitespace: this.beforeWhitespace,
      afterWhitespace: this.afterWhitespace,
      value: this.value,
    };
  }
}

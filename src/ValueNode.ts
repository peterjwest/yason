import lodash from 'lodash';

import { TrueToken, FalseToken, NullToken, NumberToken, StringToken } from './tokens';
import Node, { WhitespaceAst } from './Node';
import { JsonPrimitive } from './Json';

/** Value AST structure */
export interface ValueAst {
  type: 'Value';
  whitespace: WhitespaceAst;
  value: JsonPrimitive;
}

/** Node to hold primitive values */
export default class ValueNode extends Node<'', undefined> {
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
      this.value = JSON.parse(token.value) as string;
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
      whitespace: lodash.pickBy(this.whitespace, (value) => value),
      value: this.value,
    };
  }
}

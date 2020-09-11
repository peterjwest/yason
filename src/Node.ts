import { max } from 'lodash';

import { Token, OptionalToken } from './tokens';

/** Parse action function to run when matched against specified pattern */
export interface Action<State extends string> {
  pattern: Token[];
  /** Parse action */
  action(this: Node<State>, tokens: Token[]): ActionResult;
}

/** Stack changes returned from an action */
export interface ActionResult {
  push?: any; // tslint:disable-line:no-any
  pop?: boolean;
  consumed?: number;
}

/** Whitespace structure for all nodes */
export interface Whitespace {
  before: string;
  inner: string;
  after: string;
}

/** Whitespace output structure, allowing missing properties */
export type WhitespaceAst = Partial<Whitespace>;


/** Check if a set of tokens matches a pattern of tokens */
export function matchesPattern(tokens: Token[], pattern: Token[]) {
  let length = 0;
  for (const token of pattern) {
    if (!tokens[length]) return undefined;

    if (!token.matches(tokens[length])) {
      if (token instanceof OptionalToken) continue;
      else return undefined;
    }
    length++;
  }
  return length;
}

/** Base Node structure to represent any yason structure */
export default class Node<State extends string> {
  whitespace: Whitespace = {
    before: '',
    inner: '',
    after: '',
  };
  state: State;

  /** Get possible actions given a state */
  getActions(state: State): Array<Action<State>> {
    return [];
  }

  /** Run the next action on this node, based on the current state */
  runNextAction(tokens: Token[]) {
    const actions = this.getActions(this.state);

    let result: ActionResult | undefined;
    let length: number | undefined;
    for (const { pattern, action } of actions) {
      length = matchesPattern(tokens, pattern);

      if (length !== undefined) {
        result = action.call(this, tokens.slice(0, length));
        break;
      }
    }
    return { result, length };
  }

  /** Count the maximum number of tokens which can be matched by the Node in this state */
  matchableTokens(): number {
    const actions = this.getActions(this.state);
    return max(actions.map(({ pattern }) => pattern.length)) || 0;
  }
}

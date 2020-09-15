import lodash from 'lodash';

import { Token, OptionalToken } from './tokens';

const { max } = lodash;

/** Parse action function to run when matched against specified pattern */
export interface Action<State extends string, ChildNode> {
  pattern: Token[];
  /** Parse action */
  action(this: Node<State, ChildNode>, tokens: Token[]): ActionResult<ChildNode>;
}

/** Stack changes returned from an action */
export interface ActionResult<Node> {
  push?: Node; // tslint:disable-line:no-any
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


/** Check if a set of tokens could match a pattern, given more tokens */
export function couldMatchPattern(tokens: Token[], pattern: Token[]) {
  let length = 0;
  for (const token of pattern) {
    if (!tokens[length]) break;

    if (!token.matches(tokens[length])) {
      if (token instanceof OptionalToken) continue;
      else return false;
    }
    length++;
  }
  return true;
}


/** Check if a set of tokens matches a pattern of tokens */
export function matchesPattern(tokens: Token[], pattern: Token[]): number | undefined {
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
export default class Node<State extends string, ChildNode> {
  whitespace: Whitespace = {
    before: '',
    inner: '',
    after: '',
  };
  state: State;

  /** Get possible actions given a state */
  getActions(state: State): Array<Action<State, ChildNode>> {
    return [];
  }

  /** Run the next action on this node, based on the current state */
  runNextAction(tokens: Token[]) {
    const actions = this.getActions(this.state);

    /** A matched action and the number of tokens that matched */
    interface Match {
      length: number;
      /** Matched action function */
      action(this: Node<State, ChildNode>, tokens: Token[]): ActionResult<ChildNode>;
    }

    const possibleMatches = (
      actions
      .filter(({ pattern }) => pattern.length > 0 && couldMatchPattern(tokens, pattern))
    );

    const matches: Match[] = (
      possibleMatches
      .map(({ pattern, action }) => ({ length: matchesPattern(tokens, pattern), action }))
      .filter((match): match is Match => match.length !== undefined)
    );

    const finalAction = actions.find(({ pattern }) => pattern.length === 0);
    if (possibleMatches.length === 0 && finalAction) {
      matches.push({ length: 0, action: finalAction.action });
    }

    if (matches.length === 1 && possibleMatches.length <= 1) {
      const length = matches[0].length;
      const result: ActionResult<ChildNode> = matches[0].action.call(this, tokens.slice(0, length));
      return { result, length: length };
    }
  }

  /** Count the maximum number of tokens which can be matched by the Node in this state */
  matchableTokens(): number {
    const actions = this.getActions(this.state);
    return max(actions.map(({ pattern }) => pattern.length)) || 0;
  }
}

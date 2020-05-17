import { last } from 'lodash';

import { Token } from './tokens';
import DocumentNode from './DocumentNode';
import MapNode from './MapNode';
import ListNode from './ListNode';

/** Parse a yason string and return node graph for the data */
export default function parse(tokens: Token[]) {
  const document = new DocumentNode();
  const stack: Array<DocumentNode | MapNode | ListNode> = [document];
  let startIndex = 0;
  let endIndex = 0;
  while (startIndex < tokens.length || stack.length) {
    const currentTokens = tokens.slice(startIndex, endIndex + 1);

    const current = last(stack);

    if (!current) {
      // TODO: Better error message
      throw Error('Stack empty');
    }

    // TODO: Remove
    // console.log(current.constructor.name, current.state, currentTokens);

    const { result, length } = current.runNextAction(currentTokens);

    if (result) {
      if (result.pop) stack.pop();
      if (result.push) stack.push(result.push);
      if (result.consumed !== undefined) {
        if (length && result.consumed > length) {
          throw Error(
            `Parse error in ${current.constructor.name} ${current.state},` +
            `attempted to consume more tokens (${result.consumed}) than available (${length})`,
          );
        }
        startIndex = startIndex + result.consumed || 0;
      }
      if (startIndex > endIndex) endIndex++;
    } else {
      // TODO: Better error message
      if (currentTokens.length >= current.matchableTokens()) {
        throw Error(
          `Parse error in ${current.constructor.name} ${current.state}: ` +
          `'${JSON.stringify(currentTokens)}'`,
        );
      }
      endIndex++;
    }

    if (endIndex > tokens.length) {
      throw Error(
        `Parse error in ${current.constructor.name} ${current.state}, unexpected end of document`,
      );
    }
  }

  return document.value;
}

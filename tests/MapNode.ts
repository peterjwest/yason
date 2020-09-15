import assert from 'assert';
import sinonTest from 'sinon-mocha-test';
import assertStub from 'sinon-assert-stub';

import {
  StringToken, NumberToken, TrueToken, FalseToken,
  PaddingToken, NewlineToken,
  CommaToken, DashToken, ColonToken,
  SquareOpenToken, SquareCloseToken,
  EndToken, oneOf,
} from '../src/tokens';
import Node, { matchesPattern } from '../src/Node';

/** Possible states for TestNode */
type TestNodeState = 'first' | 'middle' | 'last';
/** Mock node for testing matchableTokens */
class TestNode extends Node<TestNodeState> {
  state: TestNodeState = 'first';

  static actions = {
    first: [
      {
        pattern: [StringToken],
        action: () => ({}),
      },
      {
        pattern: [SquareOpenToken, oneOf([TrueToken, FalseToken]), CommaToken.optional(), SquareCloseToken],
        action: () => ({}),
      },
      {
        pattern: [NumberToken],
        action: () => ({}),
      },
    ],
    middle: [],
    last: [
      {
        pattern: [EndToken],
        action: () => ({}),
      },
    ],
  };

  /** Mock actions */
  getActions(state: TestNodeState) {
    return TestNode.actions[state];
  }
}

describe('Node', () => {
  describe('matchesPattern', () => {
    it('Matches a correct token', () => {
      assert.strictEqual(matchesPattern([new StringToken('"hello"')], [StringToken]), 1);
    });

    it('Does not match an incorrect token', () => {
      assert.strictEqual(matchesPattern([new StringToken('"hello"')], [NumberToken]), undefined);
    });

    it('Matches a sequence of correct tokens', () => {
      assert.strictEqual(matchesPattern(
        [new DashToken(), new PaddingToken(' '), new StringToken('"hello"')],
        [DashToken, PaddingToken, StringToken]),
      3);
    });

    it('Does not match a sequence longer than the tokens', () => {
      assert.strictEqual(matchesPattern(
        [new DashToken(), new PaddingToken(' ')],
        [DashToken, PaddingToken, StringToken]),
      undefined);
    });

    it('Matches a sequence which is a leading subset of the tokens', () => {
      assert.strictEqual(matchesPattern(
        [new DashToken(), new PaddingToken(' '), new StringToken('"hello"')],
        [DashToken, PaddingToken]),
      2);
    });

    it('Does not match a sequence which is a trailing subset of the tokens', () => {
      assert.strictEqual(matchesPattern(
        [new DashToken(), new PaddingToken(' '), new StringToken('"hello"')],
        [PaddingToken, StringToken]),
      undefined);
    });

    it('Matches an optional token', () => {
      assert.strictEqual(matchesPattern([new StringToken('"hello"')], [StringToken.optional()]), 1);
    });

    it('Matches the absense of an optional token', () => {
      assert.strictEqual(matchesPattern([new NumberToken('123')], [StringToken.optional()]), 0);
    });

    it('Does not match tokens when additional tokens could form a longer match ', () => {
      assert.strictEqual(matchesPattern(
        [new NumberToken('123')],
        [NumberToken, PaddingToken.optional()],
      ), undefined);
    });

    it('Matches optional tokens in a sequence', () => {
      assert.strictEqual(matchesPattern(
        [new ColonToken(), new PaddingToken(' '), new StringToken('"hello"'), new PaddingToken(' ')],
        [ColonToken, PaddingToken.optional(), StringToken, PaddingToken.optional()],
      ), 4);
    });

    it('Matches the absense of an optional tokens in a sequence', () => {
      assert.strictEqual(matchesPattern(
        [new ColonToken(), new StringToken('"hello"'), new NewlineToken()],
        [ColonToken, PaddingToken.optional(), StringToken, PaddingToken.optional()],
      ), 2);
    });

    it('Matches a correct token against a composite token pattern', () => {
      assert.strictEqual(matchesPattern(
        [new NumberToken('123')],
        [oneOf([NumberToken, StringToken])],
      ), 1);
    });

    it('Does not match an correct token against a composite token pattern', () => {
      assert.strictEqual(matchesPattern(
        [new FalseToken()],
        [oneOf([NumberToken, StringToken])],
      ), undefined);
    });

    it('Matches a sequence of optional and composite tokens', () => {
      assert.strictEqual(matchesPattern(
        [new StringToken('"hello"'), new CommaToken()],
        [oneOf([NumberToken, StringToken]), PaddingToken.optional(), CommaToken],
      ), 2);
    });
  });


  describe('matchableTokens', () => {
    it('Counts the maximum matchable tokens when there are multiple actions', () => {
      const node = new TestNode();
      assert.strictEqual(node.matchableTokens(), 4);
    });

    it('Counts the maximum matchable tokens when there are no actions', () => {
      const node = new TestNode();
      node.state = 'middle';
      assert.strictEqual(node.matchableTokens(), 0);
    });

    it('Counts the maximum matchable tokens when there is one action', () => {
      const node = new TestNode();
      node.state = 'last';
      assert.strictEqual(node.matchableTokens(), 1);
    });
  });

  describe('runNextAction', () => {
    it('Runs the correct action and returns the result', sinonTest((sinon) => {
      const node = new TestNode();
      const actions = [
        sinon.stub(TestNode.actions.first[0], 'action').returns({}),
        sinon.stub(TestNode.actions.first[1], 'action').returns({ consumed: 3 }),
        sinon.stub(TestNode.actions.first[2], 'action').returns({}),
        sinon.stub(TestNode.actions.last[0], 'action').returns({}),
      ];

      const tokens = [
        new SquareOpenToken(), new TrueToken(), new SquareCloseToken(),
      ];

      const result = node.runNextAction(tokens);

      assert.deepStrictEqual(result, { result: { consumed: 3 }, length: 3 });

      assertStub.notCalled(actions[0]);
      assertStub.calledWith(actions[1], [[tokens]]);
      assertStub.notCalled(actions[2]);
      assertStub.notCalled(actions[3]);
    }));

    it('Returns undefined if there is no action', sinonTest((sinon) => {
      const node = new TestNode();
      node.state = 'middle';

      const actions = [
        sinon.stub(TestNode.actions.first[0], 'action').returns({}),
        sinon.stub(TestNode.actions.first[1], 'action').returns({ consumed: 3 }),
        sinon.stub(TestNode.actions.first[2], 'action').returns({}),
        sinon.stub(TestNode.actions.last[0], 'action').returns({}),
      ];

      const result = node.runNextAction([new NumberToken('123')]);
      assert.deepStrictEqual(result, undefined);


      assertStub.notCalled(actions[0]);
      assertStub.notCalled(actions[1]);
      assertStub.notCalled(actions[2]);
      assertStub.notCalled(actions[3]);
    }));
  });

  describe('getActions', () => {
    it('Returns an empty array', () => {
      const node = new Node();
      assert.deepStrictEqual(node.getActions('anything'), []);
    });
  });
});

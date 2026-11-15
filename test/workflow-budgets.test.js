import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkWorkflowBudgets } from '../scripts/check-workflow-budgets.js';

function workflow(args) {
  return `jobs:\n  run:\n    steps:\n      - uses: anthropics/claude-code-action@v1\n        with:\n          claude_args: '${args}'\n`;
}

test('orchestrator budget floor applies to every invocation, even disabled steps', () => {
  for (const filename of ['genesis-orchestrator.yml', 'genesis-events.yml', 'genesis-evolver.yml', 'genesis-ci-failure.yml']) {
    for (const args of ['', '--max-turns 29', '--max-turns nope', '--max-turns $BUDGET']) {
      assert.equal(checkWorkflowBudgets(filename, workflow(args)).length, 1);
    }
    assert.deepEqual(checkWorkflowBudgets(filename, workflow('--max-turns 30')), []);
    assert.deepEqual(checkWorkflowBudgets(filename, workflow('--max-turns=40')), []);
  }
});

test('narrow invocations require a positive explicit budget; ordinary workflows are ignored', () => {
  assert.equal(checkWorkflowBudgets('narrow.yaml', workflow('')).length, 1);
  assert.equal(checkWorkflowBudgets('narrow.yaml', workflow('--max-turns 0')).length, 1);
  assert.deepEqual(checkWorkflowBudgets('narrow.yaml', workflow('--max-turns 5')), []);
  assert.deepEqual(checkWorkflowBudgets('ci.yml', 'jobs: {test: {steps: [{run: "npm test"}]}}'), []);
});

test('shell invocations also require budgets, and comments cannot supply them', () => {
  const source = 'jobs:\n  run:\n    steps:\n      # --max-turns 40\n      - run: claude -p hello\n';
  assert.equal(checkWorkflowBudgets('genesis-events.yml', source).length, 1);
  assert.deepEqual(checkWorkflowBudgets('genesis-events.yml', source.replace('claude -p', 'claude --max-turns 40 -p')), []);
});

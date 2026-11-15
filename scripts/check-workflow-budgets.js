import { readdir, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parse } from 'yaml';

const orchestrators = new Set([
  'genesis-orchestrator', 'genesis-events', 'genesis-evolver', 'genesis-ci-failure',
]);

export function checkWorkflowBudgets(filename, source) {
  const workflow = parse(source);
  const floor = orchestrators.has(filename.replace(/\.ya?ml$/, '')) ? 30 : 1;
  const failures = [];
  for (const [jobName, job] of Object.entries(workflow.jobs ?? {})) {
    for (const [index, step] of (job.steps ?? []).entries()) {
      const action = /^anthropics\/claude-code-action@/.test(step.uses ?? '');
      const shell = /\bclaude\s/.test(step.run ?? '');
      if (!action && !shell) continue;
      const args = action ? (step.with?.claude_args ?? '') : step.run;
      const budgets = [...String(args).matchAll(/--max-turns(?:\s+|=)([^\s"'\\]+)/g)];
      if (!budgets.length || budgets.some(([, value]) => !/^\d+$/.test(value) || Number(value) < floor)) {
        failures.push(`${filename}: ${jobName} step ${index + 1} needs an explicit --max-turns >= ${floor}`);
      }
    }
  }
  return failures;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const directory = new URL('../.github/workflows/', import.meta.url);
  const failures = [];
  for (const filename of (await readdir(directory)).filter(name => /\.ya?ml$/.test(name))) {
    failures.push(...checkWorkflowBudgets(filename, await readFile(new URL(filename, directory), 'utf8')));
  }
  if (failures.length) {
    console.error(failures.join('\n'));
    process.exitCode = 1;
  } else {
    console.log('All Claude workflow invocations have valid turn budgets.');
  }
}

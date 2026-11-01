// Runs every retained module test with Node's test runner. Failures are never
// skipped or filtered: packaging/doc-dependent failures stay visible in the logs.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const modules = ['memory', 'life', 'state', 'persona'];
const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amadeus-module-tests-'));
const rows = [];
let failed = 0;

console.log(`Module test logs: ${outDir}`);
for (const name of modules) {
  const moduleDir = path.join(root, 'src', 'modules', name);
  const testDir = path.join(moduleDir, 'test');
  let files;
  try {
    files = fs.readdirSync(testDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.test.js'))
      .map((entry) => `test/${entry.name}`)
      .sort();
  } catch (err) {
    rows.push({ status: 'FAIL', name, detail: `test directory unreadable: ${err.message}` });
    failed += 1;
    continue;
  }
  if (files.length === 0) {
    rows.push({ status: 'FAIL', name, detail: 'no *.test.js files found' });
    failed += 1;
    continue;
  }

  const logPath = path.join(outDir, `${name}.log`);
  const fd = fs.openSync(logPath, 'w');
  const started = Date.now();
  let result;
  try {
    result = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...files], {
      cwd: moduleDir,
      shell: false,
      stdio: ['ignore', fd, fd],
    });
  } finally {
    fs.closeSync(fd);
  }
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const output = fs.readFileSync(logPath, 'utf8');
  const count = (label) => {
    const match = output.match(new RegExp(`^# ${label} (\\d+)$`, 'm'));
    return match ? match[1] : '?';
  };
  const ok = !result.error && !result.signal && result.status === 0;
  if (!ok) failed += 1;
  const counts = `tests ${count('tests')}, pass ${count('pass')}, fail ${count('fail')}`;
  const reason = result.error ? `, spawn error: ${result.error.message}`
    : result.signal ? `, signal ${result.signal}` : '';
  rows.push({
    status: ok ? 'PASS' : 'FAIL',
    name,
    detail: `${seconds}s, ${counts}${reason}`,
    logPath,
  });
}

for (const row of rows) {
  const log = row.logPath ? `  log: ${row.logPath}` : '';
  console.log(`${row.status} ${row.name.padEnd(8)} ${row.detail}${log}`);
}
if (failed > 0) {
  console.log(`${failed}/${modules.length} module(s) failed; failures preserved in logs (no skips).`);
  process.exitCode = 1;
} else {
  console.log(`All ${modules.length} module test groups passed.`);
}

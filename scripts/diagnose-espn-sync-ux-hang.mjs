import {spawn} from 'node:child_process';

const child = spawn(process.execPath, ['scripts/test-espn-sync-trust-ux.mjs'], {
  stdio:['ignore','pipe','pipe']
});
let stdout = '';
let stderr = '';
child.stdout.on('data', chunk => { stdout += chunk; });
child.stderr.on('data', chunk => { stderr += chunk; });

const timeout = setTimeout(() => {
  child.kill('SIGKILL');
  process.stdout.write(stdout);
  process.stderr.write(stderr);
  console.error('\nESPN Sync UX diagnostic timeout after 60s. Success banner seen:', /ESPN Live Sync trust UX valid:/.test(stdout));
  process.exit(124);
}, 60000);

child.on('exit', code => {
  clearTimeout(timeout);
  process.stdout.write(stdout);
  process.stderr.write(stderr);
  process.exit(code == null ? 1 : code);
});

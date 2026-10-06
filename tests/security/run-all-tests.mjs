/**
 * BeadsILY Unified Security Test Suite Runner
 * Runs all security verification tests using Node's native test runner.
 */

import { run } from 'node:test';
import { spec } from 'node:test/reporters';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testFiles = [
  path.join(__dirname, 'rbac.test.mjs'),
  path.join(__dirname, 'idor.test.mjs'),
  path.join(__dirname, 'csrf-origin.test.mjs'),
  path.join(__dirname, 'turnstile.test.mjs'),
  path.join(__dirname, 'stripe-security.test.mjs'),
  path.join(__dirname, 'privacy-coppa.test.mjs'),
];

console.log('===============================================================');
console.log('       BEADSILY AUTOMATED SECURITY ACCEPTANCE SUITE            ');
console.log('===============================================================');
console.log(`Executing ${testFiles.length} test modules...`);

run({ files: testFiles })
  .on('test:fail', () => {
    process.exitCode = 1;
  })
  .compose(new spec())
  .pipe(process.stdout);

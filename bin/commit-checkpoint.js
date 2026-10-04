#!/usr/bin/env node
'use strict';

const { createCheckpoint } = require('../lib/index');

const args = process.argv.slice(2);
const opts = {};

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '-h' || a === '--help') {
    console.log(`Usage: commit-checkpoint [options]

Writes all modified and newly added files (relative path + full contents)
into a txt file at the repo root.

Options:
  -o, --output <file>   Output file name (default: commit-checkpoint.txt)
  --max-size <bytes>    Skip files larger than this (default: 1048576)
  -h, --help            Show help`);
    process.exit(0);
  } else if (a === '-o' || a === '--output') {
    opts.output = args[++i];
  } else if (a === '--max-size') {
    opts.maxSize = parseInt(args[++i], 10);
  } else {
    console.error(`Unknown option: ${a}`);
    process.exit(1);
  }
}

try {
  const r = createCheckpoint(opts);
  if (r.total === 0) {
    console.log('No modified or new files found. Wrote an empty checkpoint.');
  }
  console.log(`✔ ${r.written}/${r.total} files written to ${r.outPath}`);
  if (r.skipped.length) {
    console.log(`  Skipped (binary/large): ${r.skipped.join(', ')}`);
  }
} catch (e) {
  console.error(`Error: ${e.message}`);
  process.exit(1);
}

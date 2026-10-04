'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { createCheckpoint } = require('../lib/index');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-'));
const sh = (c) => execSync(c, { cwd: dir, stdio: 'ignore' });
sh('git init -q && git config user.email a@b.c && git config user.name t');
fs.writeFileSync(path.join(dir, 'a.txt'), 'one');
fs.writeFileSync(path.join(dir, 'gone.txt'), 'bye');
sh('git add . && git commit -qm init');
fs.writeFileSync(path.join(dir, 'a.txt'), 'two');           // modified
fs.mkdirSync(path.join(dir, 'src/deep'), { recursive: true });
fs.writeFileSync(path.join(dir, 'src/deep/new.js'), 'console.log(1)'); // untracked
fs.writeFileSync(path.join(dir, 'img.bin'), Buffer.from([0, 1, 2])); // binary
fs.unlinkSync(path.join(dir, 'gone.txt'));                  // deleted

const r = createCheckpoint({ cwd: dir });
const out = fs.readFileSync(r.outPath, 'utf8');
assert(out.includes('FILE: a.txt') && out.includes('two'));
assert(out.includes('FILE: src/deep/new.js') && out.includes('console.log(1)'));
assert(out.includes('[skipped: binary file]'));
assert(!out.includes('gone.txt'));
console.log('All tests passed');

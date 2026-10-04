'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEFAULT_OUTPUT = 'commit-checkpoint.txt';
const DEFAULT_MAX_SIZE = 1024 * 1024; // 1 MB per file

function git(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function getRepoRoot(cwd) {
  try {
    return git(['rev-parse', '--show-toplevel'], cwd).trim();
  } catch (e) {
    throw new Error('Not a git repository (or git is not installed).');
  }
}

/** Returns [{ file, status }] for modified, added, renamed and untracked files. */
function getChangedFiles(root) {
  const out = git(['status', '--porcelain=v1', '-z', '-uall'], root);
  const parts = out.split('\0').filter(Boolean);
  const files = [];
  for (let i = 0; i < parts.length; i++) {
    const entry = parts[i];
    const xy = entry.slice(0, 2);
    const file = entry.slice(3);
    if (xy[0] === 'R' || xy[0] === 'C') i++; // skip the "original path" entry
    if (xy.includes('D')) continue; // deleted files have no content
    let status = 'modified';
    if (xy === '??' || xy[0] === 'A') status = 'new';
    else if (xy[0] === 'R') status = 'renamed';
    files.push({ file, status });
  }
  return files;
}

function isBinary(buf) {
  const len = Math.min(buf.length, 8000);
  for (let i = 0; i < len; i++) if (buf[i] === 0) return true;
  return false;
}

function createCheckpoint(options = {}) {
  const cwd = options.cwd || process.cwd();
  const root = getRepoRoot(cwd);
  const outName = options.output || DEFAULT_OUTPUT;
  const outPath = path.resolve(cwd, outName);
  const maxSize = options.maxSize || DEFAULT_MAX_SIZE;

  const changed = getChangedFiles(root).filter(
    (f) => path.resolve(root, f.file) !== outPath
  );

  const sections = [];
  const skipped = [];
  let written = 0;

  for (const { file, status } of changed) {
    const abs = path.join(root, file);
    const rel = file.split(path.sep).join('/');
    let body;
    try {
      const stat = fs.statSync(abs);
      if (!stat.isFile()) continue;
      if (stat.size > maxSize) {
        body = `[skipped: file too large (${stat.size} bytes)]`;
        skipped.push(rel);
      } else {
        const buf = fs.readFileSync(abs);
        if (isBinary(buf)) {
          body = '[skipped: binary file]';
          skipped.push(rel);
        } else {
          body = buf.toString('utf8');
          written++;
        }
      }
    } catch (e) {
      body = `[skipped: ${e.message}]`;
      skipped.push(rel);
    }
    sections.push(
      `${'='.repeat(80)}\nFILE: ${rel}\nSTATUS: ${status}\n${'='.repeat(80)}\n${body}\n`
    );
  }

  const header =
    `COMMIT CHECKPOINT\n` +
    `Generated: ${new Date().toISOString()}\n` +
    `Repository: ${path.basename(root)}\n` +
    `Files: ${changed.length}\n\n`;

  fs.writeFileSync(outPath, header + sections.join('\n'), 'utf8');

  return { outPath, total: changed.length, written, skipped };
}

module.exports = { createCheckpoint, getChangedFiles, getRepoRoot };

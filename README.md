# commit-checkpoint

Run one command and get a single txt file containing every **modified** and **newly added** file in your git repo — with its relative path and full contents. Zero dependencies.

## Install

```bash
npm install -g .          # from this folder
# or run without installing:
npx commit-checkpoint
```

## Usage

```bash
commit-checkpoint                      # writes commit-checkpoint.txt at repo root
commit-checkpoint -o changes.txt       # custom output name
commit-checkpoint --max-size 500000    # skip files over 500 KB
```

## Output format

```
================================================================================
FILE: src/deep/new.js
STATUS: new
================================================================================
<full file contents>
```

Notes: deleted files are omitted, binary/oversized files are listed as skipped, `.gitignore`d files are excluded, and the output file never includes itself. Requires `git` and Node 14+.

## API

```js
const { createCheckpoint } = require('commit-checkpoint');
createCheckpoint({ cwd: process.cwd(), output: 'commit-checkpoint.txt' });
```

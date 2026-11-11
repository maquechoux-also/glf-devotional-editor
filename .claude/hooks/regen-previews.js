#!/usr/bin/env node
// PostToolUse hook: after Claude edits index.html or templates.js, regenerate the
// preview-*.html files so they never go stale. Silent for any other file.
let input = '';
process.stdin.on('data', c => (input += c));
process.stdin.on('end', () => {
  let file = '';
  try { file = JSON.parse(input).tool_input.file_path || ''; } catch (e) { return; }
  if (!/(^|\/)(index\.html|templates\.js)$/.test(file)) return;
  const dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const r = require('child_process').spawnSync('node', ['build-preview.js'], { cwd: dir, encoding: 'utf8' });
  if (r.status !== 0) {
    process.stderr.write('build-preview.js failed:\n' + (r.stderr || r.stdout));
    process.exit(2); // shown to Claude so it fixes the break
  }
});

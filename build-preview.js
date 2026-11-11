// build-preview.js
// Writes the standalone rendered emails from the editor's default content:
//   preview-devotional.html  — Weekly Devotional tab
//   preview-weekly.html      — Weekly News tab
//   preview-letter.html      — Letter tab
// (preview.html is a legacy redirect to preview-devotional.html — not written here.)
//
// Usage: node build-preview.js
//
// The templates come from templates.js, the same file the editor runs, so the
// previews are exactly what the editor's Copy HTML produces on a fresh load.
// Only the form defaults are read out of index.html here.

const fs = require('fs');
const path = require('path');
const T = require('./templates.js');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Form defaults: <input id value> and <textarea id>…</textarea>
const decode = s => s
  .replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&#39;/g, "'")
  .replace(/&amp;/g, '&');
const values = {};
let m;
const inputRe = /<input[^>]*\bid="([^"]+)"[^>]*\bvalue="([^"]*)"/g;
while ((m = inputRe.exec(html))) values[m[1]] = decode(m[2]);
const taRe = /<textarea[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/textarea>/g;
while ((m = taRe.exec(html))) values[m[1]] = decode(m[2]);

// The editor smartens quotes in every field on load (initField), so do the same.
const smarten = obj => Object.fromEntries(
  Object.entries(obj).map(([k, v]) => [k, k === 'theme' ? v : T.smartenQuotes(v)]));
const pick = ids => smarten(Object.fromEntries(ids.map(id => {
  if (!(id in values)) throw new Error('index.html has no default for field "' + id + '"');
  return [id, values[id]];
})));

const outputs = {
  'preview-devotional.html': T.renderDevotionalEmail(pick(T.DEVOTIONAL_FIELDS)),
  'preview-weekly.html': T.renderWeeklyEmail({
    ...pick(T.WEEKLY_FIELDS),
    events: T.SEED_EVENTS.map(smarten),
    announcements: T.ANN_SEED.map(smarten),
  }),
  'preview-letter.html': T.renderLetterEmail(pick(T.LETTER_FIELDS)),
};

for (const [file, out] of Object.entries(outputs)) {
  fs.writeFileSync(path.join(__dirname, file), out);
  console.log('Wrote ' + file + ' (' + out.length + ' bytes)');
}

// build-preview.js
// Reads index.html, extracts the form defaults and the email templates, then writes
// the standalone, shareable rendered emails:
//   preview-devotional.html  — from buildHTML() (Weekly Devotional tab)
//   preview-weekly.html      — from buildWeeklyHTML() (This Week's Events tab)
// (preview.html is a legacy redirect to preview-devotional.html — not written here.)
//
// Usage: node build-preview.js
//
// This mirrors the editor's own JS logic (smartenQuotes, esc, parseBodyContent)
// so the rendered output matches what the in-browser editor produces.

const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

// 1. Extract form default values
const values = {};
let m;
const inputRe = /<input[^>]*\bid="([^"]+)"[^>]*\bvalue="([^"]*)"/g;
while ((m = inputRe.exec(html))) values[m[1]] = m[2];
const taRe = /<textarea[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/textarea>/g;
while ((m = taRe.exec(html))) values[m[1]] = m[2];

// Decode HTML entities found in attribute values
const decode = s => s
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&#39;/g, "'");
for (const k in values) values[k] = decode(values[k]);

// 2. Port helpers from the editor
function smartenQuotes(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      const prev = i > 0 ? text[i - 1] : '';
      out += (prev === '' || /[\s(\[\{]/.test(prev)) ? '“' : '”';
    } else {
      out += ch;
    }
  }
  return out;
}
for (const k in values) values[k] = smartenQuotes(values[k]);

function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function val(id) { return esc((values[id] || '').trim()); }

function parseBodyContent() {
  const raw = (values.body_content || '').trim();
  const blocks = raw.split(/\n[ \t]*\n/).map(b => b.trim()).filter(b => b.length);
  let lastParaIdx = -1;
  blocks.forEach((b, i) => { if (!/^\*\*[\s\S]+\*\*$/.test(b)) lastParaIdx = i; });
  let out = '';
  blocks.forEach((block, idx) => {
    const q = block.match(/^\*\*([\s\S]+)\*\*$/);
    if (q) {
      const qt = esc(q[1].trim());
      out += `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 28px 0; background-color:#eef3f8;">
                <tr bgcolor="#eef3f8">
                  <td width="4" style="background-color:#eac18b; border-radius:3px; min-width:4px; width:4px;" valign="top">&nbsp;</td>
                  <td style="background-color:#eef3f8; border-radius:0 8px 8px 0; padding: 20px 24px;">
                    <p style="margin:0; font-family:'Lora',Georgia,'Times New Roman',serif; font-size:19px; line-height:30px; font-weight:500; font-style:italic; color:#081158;">${qt}</p>
                  </td>
                </tr>
              </table>`;
    } else {
      const mb = idx === lastParaIdx ? '0' : '20px';
      out += `
              <p style="margin:0 0 ${mb} 0; font-family:'Lora',Georgia,'Times New Roman',serif; font-size:17px; line-height:30px; font-weight:400; color:#1a1a2e;">${esc(block)}</p>`;
    }
  });
  return out;
}

// 3. Pull the live buildHTML template out of index.html and interpolate values
const buildRe = /function buildHTML\(\)\s*\{[\s\S]*?return\s+`([\s\S]*?)`;\s*\n\s*\}/;
const buildMatch = html.match(buildRe);
if (!buildMatch) {
  console.error('ERROR: could not locate buildHTML() template in index.html');
  process.exit(1);
}
let template = buildMatch[1];

const vars = {
  preheader:        val('preheader'),
  emailTitle:       val('email_title'),
  emailDate:        val('email_date'),
  scriptureText:    val('scripture_text'),
  scriptureRef:     val('scripture_reference'),
  devotionalTitle:  val('devotional_title'),
  devotionalByline: val('devotional_byline'),
  bodyContent:      parseBodyContent(),
  closingPrayer:    val('closing_prayer'),
  closingGreeting:  val('closing_greeting'),
  closingName:      val('closing_name'),
  shareHeadline:    val('share_headline'),
  // share_body goes into a mailto: URL, so it needs URL-encoding, not HTML-escaping
  shareBody:        encodeURIComponent((values.share_body || '').trim()),
  giveSubtext:      val('give_subtext'),
};

for (const k in vars) {
  template = template.split('${' + k + '}').join(vars[k]);
}

fs.writeFileSync('preview-devotional.html', template);
console.log('Wrote preview-devotional.html (' + template.length + ' bytes)');


// ─────────────────────────────────────────────────────────────
// 4. WEEKLY EVENTS preview — mirrors buildWeeklyHTML() in index.html,
//    rendered from the SEED_EVENTS defaults (the editor's starting content).
// ─────────────────────────────────────────────────────────────

// Pull the four color themes, the seeded events, and the hosted asset URLs
// straight out of index.html so this stays in sync with the editor.
const THEMES = eval('(' + html.match(/const THEMES = (\{[\s\S]*?\});/)[1] + ')');
const SEED_EVENTS = eval('(' + html.match(/const SEED_EVENTS = (\[[\s\S]*?\]);/)[1] + ')');
const asset = name => html.match(new RegExp('const ' + name + " = '([^']+)'"))[1];
const LOGO = asset('LOGO'), RIBBON = asset('RIBBON'), WORDMARK = asset('WORDMARK');

// Zero-width non-joiners in times/dates so iOS Mail can't auto-link them,
// ported from the editor. Text-between-tags only; idempotent.
function protectTimes(html) {
  return html.split(/(<[^>]+>)/).map(part => {
    if (part.startsWith('<')) return part;
    return part
      .replace(/(\d):(\d)/g, '$1:&zwnj;$2')
      .replace(/(\d)(am|pm)\b/gi, '$1&zwnj;$2')
      .replace(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)\s(\d{1,2})\b/gi, '$1 &zwnj;$2');
  }).join('');
}

// Inline formatting, ported from the editor: [text](url) → sky link,
// **bold** → navy strong, *italic* → em, newline → <br>
function formatInline(s) {
  return esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
      url = url.replace(/"/g, '%22');
      if (!/^(https?:\/\/|mailto:)/i.test(url)) url = 'https://' + url;
      return '<a href="' + url + '" target="_blank" style="color:#5b95d2; font-weight:600; text-decoration:underline;">' + text + '</a>';
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#081158;">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

// Event details → first paragraph is the 14px lead, the rest are compact 13px sub-lines.
function eventBody(raw) {
  const blocks = raw.trim().split(/\n[ \t]*\n/).map(b => b.trim()).filter(Boolean);
  return blocks.map((b, i) => {
    const last = i === blocks.length - 1;
    const mb = last ? '0' : (i === 0 ? '12px' : '6px');
    const fs = i === 0 ? '14px' : '13px';
    const lh = i === 0 ? '23px' : '20px';
    return `
                          <p style="margin:0 0 ${mb} 0; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:${fs}; line-height:${lh}; color:#1a1a2e;">${formatInline(b)}</p>`;
  }).join('');
}

function renderEventTiles(events) {
  return events.map((d, i) => {
    const T = THEMES[d.theme] || THEMES['All Church'];
    const dateText = T.onAccent;
    const dow = esc(smartenQuotes(d.dow)), day = esc(smartenQuotes(d.day)), month = esc(smartenQuotes(d.month));
    const group = esc(smartenQuotes(d.group)), title = esc(smartenQuotes(d.title));
    const body = eventBody(smartenQuotes(d.body));
    const tile = `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-radius:12px;">
                <tr>
                  <td class="date-col" width="104" bgcolor="${T.accent}" align="center" valign="middle" style="width:104px; background-color:${T.accent}; border-radius:12px 0 0 12px; padding:22px 0; text-align:center;">
                    <p style="margin:0; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:${dateText};">${dow}</p>
                    <p class="date-num" style="margin:0; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:44px; font-weight:900; line-height:46px; mso-line-height-rule:exactly; color:${dateText};">${day}</p>
                    <p style="margin:0; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:${dateText};">${month}</p>
                  </td>
                  <td class="tile-pad" bgcolor="${T.tile}" valign="top" style="background-color:${T.tile}; border-radius:0 12px 12px 0; padding:22px 26px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="left" style="margin-bottom:10px;">
                      <tr><td bgcolor="${T.accent}" style="background-color:${T.accent}; border-radius:50px; padding:4px 12px; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:${dateText};">${group}</td></tr>
                    </table>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td>
                          <h2 style="margin:0 0 8px 0; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:19px; line-height:24px; font-weight:800; color:#081158;">${title}</h2>${body}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>`;
    const spacer = i < events.length - 1 ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="height:22px; font-size:0; line-height:0;">&nbsp;</td></tr></table>` : '';
    return tile + spacer;
  }).join('');
}

// Announcements, ported from the editor's announceBox()/renderAnnouncements():
// each announcement is inner content only; all of them share ONE rounded box,
// divided by hairline rules. Blank announcements are skipped; zero announcements
// collapse to a white spacer row.
function announceBox(eyebrow, headline, body, quote) {
  if (!eyebrow && !headline && !body && !quote) return '';
  let inner = '';
  if (eyebrow) inner += `
                    <p style="margin:0 0 ${(headline || body || quote) ? '10px' : '0'} 0; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:#5b95d2;">${eyebrow}</p>`;
  if (headline) inner += `
                    <h3 style="margin:0 0 ${(body || quote) ? '12px' : '0'} 0; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:20px; line-height:26px; font-weight:800; color:#081158;">${headline}</h3>`;
  if (body) inner += `
                    <p style="margin:0 0 ${quote ? '16px' : '0'} 0; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:14px; line-height:24px; color:#1a1a2e;">${body}</p>`;
  if (quote) inner += `
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td width="4" valign="top" style="width:4px; min-width:4px; background-color:#eac18b; border-radius:3px; font-size:0; line-height:0;">&nbsp;</td>
                        <td width="18" style="width:18px; font-size:0; line-height:0;">&nbsp;</td>
                        <td valign="top">
                          <p style="margin:0; font-family:'Lora',Georgia,'Times New Roman',serif; font-size:15px; line-height:25px; font-style:italic; color:#081158;">${quote}</p>
                        </td>
                      </tr>
                    </table>`;
  return inner;
}

function renderAnnouncements(list) {
  const blocks = list.map(d => announceBox(
    esc(smartenQuotes(d.eyebrow || '').trim()),
    esc(smartenQuotes(d.headline || '').trim()),
    formatInline(smartenQuotes(d.body || '').trim()),
    formatInline(smartenQuotes(d.quote || '').trim())
  )).filter(Boolean);
  if (!blocks.length) {
    return `
          <!-- (announcements omitted — no content) -->
          <tr><td style="background-color:#ffffff; height:32px; font-size:0; line-height:0;">&nbsp;</td></tr>`;
  }
  const divider = `
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin:24px 0;">
                      <tr><td style="background-color:#c5d3f0; height:1px; font-size:1px; line-height:1px; mso-line-height-rule:exactly;">&nbsp;</td></tr>
                    </table>`;
  return `
          <!-- ANNOUNCEMENTS PANEL -->
          <tr>
            <td style="background-color:#ffffff; padding: 34px 40px 40px 40px;" class="pad-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td bgcolor="#eef3f8" class="tile-pad" style="background-color:#eef3f8; border:1.5px solid #c5d3f0; border-radius:12px; padding:28px 32px;">${blocks.join(divider)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

const ANN_SEED = eval('(' + html.match(/const ANN_SEED = (\[[\s\S]*?\]);/)[1] + ')');

const wMatch = html.match(/function buildWeeklyHTML\(\)\s*\{[\s\S]*?return\s+`([\s\S]*?)`;\s*\n\s*\}/);
if (!wMatch) {
  console.error('ERROR: could not locate buildWeeklyHTML() template in index.html');
  process.exit(1);
}
let wTemplate = wMatch[1];

// Date sort (soonest first), ported from the editor: anchor the year to the
// "Week Of" date; keep manual order unless every event's date parses.
const MONTHS = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
function parseMonth(s) {
  const k = (s || '').trim().toLowerCase().slice(0, 3);
  return Object.prototype.hasOwnProperty.call(MONTHS, k) ? MONTHS[k] : null;
}
const anchor = (() => {
  const t = values.w_weekof || '';
  const m = t.match(/([A-Za-z]+)\s+(\d{1,2}),?\s*(\d{4})/);
  if (m) {
    const mo = parseMonth(m[1]);
    if (mo !== null) return new Date(+m[3], mo, +m[2]);
  }
  const y = t.match(/(\d{4})/);
  return y ? new Date(+y[1], 6, 1) : new Date();
})();
function seedDate(d) {
  const mo = parseMonth(d.month);
  const day = parseInt(d.day, 10);
  if (mo === null || isNaN(day) || day < 1 || day > 31) return null;
  let best = null;
  for (const y of [anchor.getFullYear() - 1, anchor.getFullYear(), anchor.getFullYear() + 1]) {
    const cand = new Date(y, mo, day);
    if (best === null || Math.abs(cand - anchor) < Math.abs(best - anchor)) best = cand;
  }
  return best;
}
const datedSeeds = SEED_EVENTS.map((d, i) => ({ d, i, dt: seedDate(d) }));
const eventsSorted = datedSeeds.every(x => x.dt)
  ? datedSeeds.sort((a, b) => (a.dt - b.dt) || (a.i - b.i)).map(x => x.d)
  : SEED_EVENTS;

const wVars = {
  preheader: val('w_preheader'),
  weekof:    protectTimes(val('w_weekof')),
  intro:     protectTimes(formatInline((values.w_intro || '').trim())),
  tiles:     protectTimes(renderEventTiles(eventsSorted)),
  announcePanel: protectTimes(renderAnnouncements(ANN_SEED)),
  LOGO, RIBBON, WORDMARK,
};

for (const k in wVars) {
  wTemplate = wTemplate.split('${' + k + '}').join(wVars[k]);
}

fs.writeFileSync('preview-weekly.html', wTemplate);
console.log('Wrote preview-weekly.html (' + wTemplate.length + ' bytes)');

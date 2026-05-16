// build-preview.js
// Reads index.html, extracts the form defaults and the buildHTML template,
// then writes preview.html — the standalone, shareable rendered email.
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
  shareSubtext:     val('share_subtext'),
  // share_body goes into a mailto: URL, so it needs URL-encoding, not HTML-escaping
  shareBody:        encodeURIComponent((values.share_body || '').trim()),
  giveSubtext:      val('give_subtext'),
};

for (const k in vars) {
  template = template.split('${' + k + '}').join(vars[k]);
}

fs.writeFileSync('preview.html', template);
console.log('Wrote preview.html (' + template.length + ' bytes)');

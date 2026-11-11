// templates.js — the email templates and the helpers they use, shared by the editor
// (index.html loads it as a plain <script>) and build-preview.js (require()).
//
// Nothing in here touches the page. Each render*Email(d) takes the form values as a
// plain object keyed by field id (see *_FIELDS), plus `events` / `announcements`
// arrays for the Weekly News, and returns the finished email HTML.
//
// The indentation is left as it was inside index.html on purpose: the template
// literals' whitespace is part of the sent email, so re-indenting changes the output.

    // Field ids each email reads. index.html collects these from the form;
    // build-preview.js reads their default values out of index.html.
    const DEVOTIONAL_FIELDS = ['preheader', 'email_title', 'email_date', 'scripture_text',
      'scripture_reference', 'devotional_title', 'devotional_byline', 'body_content',
      'closing_prayer', 'share_headline', 'share_body',
      'blog_url', 'give_subtext'];
    const WEEKLY_FIELDS = ['w_preheader', 'w_weekof', 'w_intro'];
    const LETTER_FIELDS = ['l_preheader', 'l_headline', 'l_body', 'l_closing', 'l_name', 'l_title'];

    // Auto-convert straight " (inch mark) to curly “ ” based on context.
    // Opening when preceded by start-of-string, whitespace, or opening bracket; otherwise closing.
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

    /* ══════════════════ WEEKLY EVENTS ══════════════════ */
    // Ministry color pairings. The five new ones are pulled from the site's Connect
    // page (gracelifefellowship.org/connect/connect), where each ministry card uses a
    // solid accent + a 15% tint of it — same accent/tile structure as the email tiles.
    // onAccent = text color on the accent (navy on light accents, white on dark).
    // label = what the group pill auto-fills to when the theme is picked.
    const THEMES = {
      'All Church':    { tile: '#f6ecdc', accent: '#eac18b', onAccent: '#081158', label: 'All Church' },
      // Adults = grown-ups only (no kids). Deep plum: the one family not already
      // spoken for by a ministry above, so it reads as its own category at pill size.
      'Adults':        { tile: '#f0e5eb', accent: '#7a3b5d', onAccent: '#ffffff', label: 'Adults' },
      'Life Groups':   { tile: '#f0ecfd', accent: '#6157f8', onAccent: '#ffffff', label: 'Life Groups' },
      'Kids':          { tile: '#fef4e4', accent: '#faa421', onAccent: '#081158', label: 'Kids' },
      'Middle School': { tile: '#faeae5', accent: '#ec8675', onAccent: '#081158', label: 'Middle School' },
      'High School':   { tile: '#e4edf7', accent: '#5b95d2', onAccent: '#ffffff', label: 'High School' },
      'All Youth':     { tile: '#e9efd9', accent: '#6d9400', onAccent: '#ffffff', label: 'Youth' },
      'Men':           { tile: '#dadbe6', accent: '#081158', onAccent: '#ffffff', label: 'Men' },
      'Women':         { tile: '#e6f0ed', accent: '#d2e4e0', onAccent: '#081158', label: 'Women' },
      'Discipleship':  { tile: '#d9f1f6', accent: '#00a1c1', onAccent: '#ffffff', label: 'Discipleship' }
    };
    const THEME_ORDER = ['All Church', 'Adults', 'Life Groups', 'Kids', 'Middle School', 'High School', 'All Youth', 'Men', 'Women', 'Discipleship'];

    // Preloaded with the real July 23, 2026 Weekly News copy so the client can test
    // with actual content. Replace each week (or edit in place).
    const SEED_EVENTS = [
      { theme: 'All Church', dow: 'Sunday', day: '26', month: 'July', group: 'All Church',
        title: 'Elective Hour & Worship Service',
        body: "Join us for [9am Elective Hour](https://www.gracelifefellowship.org/connect/elective-hour) and 10:15am Worship Service as Pastor Tim Chalas continues the series *Real Life. Real Joy., A Study of Philippians*.\n\nKids Ministry offers childcare at 9am and a kids' service at 10:15am (8 weeks – 5th grade).\n\nYouth Ministry offers Bible study at 9am and a youth service at 10:15am (6th – 12th graders)." },
      { theme: 'Kids', dow: 'Friday', day: '31', month: 'July', group: 'Kids',
        title: 'Elementary Take Over',
        body: "All elementary kids, those entering 2nd through those entering 5th grade, and their chaperones are invited to GLK's Elementary Take Over on Friday, July 31 from 6-7:30pm in the GLF Gym and Youth Room. Come play basketball, video games, arts and crafts, and enjoy a pizza dinner. All students must have a chaperone attend with them. The cost to attend is $10 per child. Register at [GLF.events](https://www.gracelifefellowship.org/events)." },
      { theme: 'Men', dow: 'Sunday', day: '02', month: 'August', group: 'Men',
        title: "Men's Night Out",
        body: "Guys, come join us for a relaxed evening of pizza, sandwiches, fellowship, and great conversation at Rally Cap Brewing Company on August 2 from 5 to 7pm. No agenda—just a chance to connect with other men from GLF. Invite a friend, and we'll see you there!" }
    ];

    // Preloaded with the real July 23, 2026 announcements.
    const ANN_SEED = [
      { eyebrow: 'Financial Update', headline: 'End of the Fiscal Year',
        body: "As we approach the close of our fiscal year, we thank God for His faithful provision and for your continued generosity. Through June, Grace Life has received $2,032,768.92, with $1,999,796.78 in expenses, for a difference of $32,972.14. Your faithful giving has made it possible to share the gospel, care for families, support missionaries, and serve our community well throughout the year. If you would like to make a fiscal year-end gift, you may give online at [gracelifefellowship.org/give](https://www.gracelifefellowship.org/give), mail your donation to the church office, or place it in any of the offering boxes. Thank you for partnering with us as we continue proclaiming the hope of Jesus together.",
        quote: "" },
      { eyebrow: 'Kids Ministry', headline: 'Join the Team',
        body: "You are invited to join the Grace Life Kids Ministry Volunteer Team. Help make a lasting impact in the lives of our children by serving in Grace Life Kids! Whether you love caring for little ones, sharing Bible stories, welcoming families, or leading small group discussions, there's a place for you. Volunteers are needed in all age areas during both 9am Elective Hour and 10:15am Worship Service. Volunteer opportunities include nursery care, storytellers, greeters, and small group leaders. If you're interested in serving, [CLICK HERE](https://www.gracelifefellowship.org/events) to see which area you'd like to explore, and someone from our team will follow up with you soon. We'd love to help you find the perfect fit!",
        quote: "" },
      { eyebrow: 'Grace Life Preschool', headline: 'Join the Staff',
        body: "We are seeking a passionate and caring assistant teacher to join our amazing team of educators and caregivers for the 2026-2027 school year. This is a part-time position, Monday through Thursday, in a Christ-centered preschool environment where you can make a lasting impact in the lives of children and families. If you love working with children and being part of a supportive team, we would love to hear from you. For more information, contact the preschool director at Kathryn.Chalas@GraceLifePreschool.org.",
        quote: "" }
    ];

    /* ── Date sorting (soonest first) ── */
    const MONTHS = { jan:0, feb:1, mar:2, apr:3, may:4, jun:5, jul:6, aug:7, sep:8, oct:9, nov:10, dec:11 };
    function parseMonth(s) {
      const k = (s || '').trim().toLowerCase().slice(0, 3);
      return Object.prototype.hasOwnProperty.call(MONTHS, k) ? MONTHS[k] : null;
    }

    // Insert zero-width non-joiners into times ("10:15", "9am") and month-day dates
    // so iOS Mail's data detectors can't turn them into blue underlined links.
    // Operates only on text between tags — URLs and inline styles are untouched.
    // Idempotent: already-protected text contains no matchable sequences.
    function protectTimes(html) {
      return html.split(/(<[^>]+>)/).map(part => {
        if (part.startsWith('<')) return part;
        return part
          .replace(/(\d):(\d)/g, '$1:&zwnj;$2')
          .replace(/(\d)(am|pm)\b/gi, '$1&zwnj;$2')
          .replace(/\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*)\s(\d{1,2})\b/gi, '$1 &zwnj;$2');
      }).join('');
    }

    // Inline formatting for body copy: [words](https://page) → sky-blue link,
    // **bold** → navy strong, *italic* → em, single newlines → <br>.
    // HTML-escape first so user text can't inject markup.
    function formatInline(s, linkStyle = 'color:#5b95d2; font-weight:600; text-decoration:underline;', boldStyle = 'color:#081158;') {
      let out = esc(s);
      out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) => {
        url = url.replace(/"/g, '%22');
        if (!/^(https?:\/\/|mailto:)/i.test(url)) url = 'https://' + url;
        return '<a href="' + url + '" target="_blank" style="' + linkStyle + '">' + text + '</a>';
      });
      out = out.replace(/\*\*([^*]+)\*\*/g, '<strong style="' + boldStyle + '">$1</strong>');
      out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
      out = out.replace(/\n/g, '<br>');
      return out;
    }

    // Event details → paragraphs. First paragraph is the 14px lead; the rest are
    // compact 13px sub-lines, matching the design's primary/secondary text sizes.
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

    /* ── Date-badge abbreviations ──────────────────────────────────────────────
       The badge column is narrow, so full names like WEDNESDAY / SEPTEMBER wrap to
       two lines and look cramped. The email shows the standard three-letter forms
       instead; the editor fields keep the full names so they stay easy to read and
       edit. Anything the client types that isn't a real day/month (e.g. "Sat & Sun")
       is passed through untouched. */
    const DOW_ABBREV = { sunday:'Sun', monday:'Mon', tuesday:'Tue', wednesday:'Wed',
                         thursday:'Thu', friday:'Fri', saturday:'Sat' };
    const MONTH_ABBREV = { january:'Jan', february:'Feb', march:'Mar', april:'Apr',
                           may:'May', june:'Jun', july:'Jul', august:'Aug',
                           september:'Sep', october:'Oct', november:'Nov', december:'Dec' };
    function abbrevDate(value, map) {
      const key = (value || '').trim().toLowerCase().replace(/\.$/, '');
      return map[key] || value;
    }

    // events: [{ theme, dow, day, month, group, title, body }] in send order.
    // The email follows the on-screen card order exactly — what you arrange with
    // the ⠿ grip / ▲▼ buttons is what sends. Use "⇅ Sort by Date" to snap the
    // cards back to soonest-first (that button reorders them visibly, so the
    // editor never silently disagrees with the email).
    function renderEventTiles(events) {
      return events.map((ev, i) => {
        const g = key => (ev[key] || '').trim();
        const T = THEMES[ev.theme] || THEMES['All Church'];
        const dateText = T.onAccent;
        const dow = esc(abbrevDate(g('dow'), DOW_ABBREV));
        const day = esc(g('day'));
        const month = esc(abbrevDate(g('month'), MONTH_ABBREV));
        const group = esc(g('group')), title = esc(g('title'));
        const body = eventBody(ev.body || '');
        const tile = `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-radius:12px;">
                <tr>
                  <td class="date-col" width="104" bgcolor="${T.accent}" align="center" valign="middle" style="width:104px; background-color:${T.accent}; border-radius:12px 0 0 12px; padding:22px 0; text-align:center;">
                    <p class="date-lbl" style="margin:0; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:${dateText};">${dow}</p>
                    <p class="date-num" style="margin:0; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:44px; font-weight:900; line-height:46px; mso-line-height-rule:exactly; color:${dateText};">${day}</p>
                    <p class="date-lbl" style="margin:0; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:11px; font-weight:800; letter-spacing:2px; text-transform:uppercase; color:${dateText};">${month}</p>
                  </td>
                  <td class="tile-pad" bgcolor="${T.tile}" valign="top" style="background-color:${T.tile}; border-radius:0 12px 12px 0; padding:22px 26px; word-break:break-word; overflow-wrap:break-word;">
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

    // One announcement's inner content (no box of its own — the section shares one
    // rounded box). All arguments arrive already escaped/formatted. Every line is
    // optional; empty lines are skipped and the last one drops its bottom margin.
    // Returns '' when the whole announcement is blank.
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

    // All announcements share ONE rounded box, divided by hairline rules.
    // Zero cards (or all blank) → the section is omitted; a small white spacer keeps
    // the card bottom breathing.
    // list: [{ eyebrow, headline, body, quote }] in send order.
    function renderAnnouncements(list) {
      const blocks = list.map(an => {
        const g = key => (an[key] || '').trim();
        return announceBox(
          esc(g('eyebrow')),
          esc(g('headline')),
          formatInline(g('body')),
          formatInline(g('quote'))
        );
      }).filter(Boolean);
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
                  <td bgcolor="#eef3f8" class="tile-pad" style="background-color:#eef3f8; border:1.5px solid #c5d3f0; border-radius:12px; padding:28px 32px; word-break:break-word; overflow-wrap:break-word;">${blocks.join(divider)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
    }

    // d: WEEKLY_FIELDS values + d.events + d.announcements (see renderEventTiles /
    // renderAnnouncements for their shape).
    function renderWeeklyEmail(d) {
      const rawv = id => d[id] || '';
      const val = id => esc(rawv(id).trim());
      const preheader = val('w_preheader');
      // protectTimes: stop iOS from auto-linking the dates/times in the copy
      const weekof    = protectTimes(val('w_weekof'));
      const intro     = protectTimes(formatInline(rawv('w_intro').trim()));
      const tiles     = protectTimes(renderEventTiles(d.events || []));
      const announcePanel = protectTimes(renderAnnouncements(d.announcements || []));

      const LOGO = 'https://cdn.prod.website-files.com/661743fdb5eac44694ae2669/6a025f4f152c26a0f09c8a73_GLF_white_bug.png';
      const RIBBON = 'https://cdn.prod.website-files.com/661743fdb5eac44694ae2669/6a5e8909fb50a451444256a6_glf-email-bookmark-ribbon.png';
      const WORDMARK = 'https://cdn.prod.website-files.com/661743fdb5eac44694ae2669/6a5e8909fb50a451444256ce_glf-email-wordmark-white.png';

      return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <!-- Spaces around the equals signs are deliberate: Elexio's mailer eats any equals
       sign followed by two hex digits (quoted-printable decoding), which corrupts the
       usual compact form of this tag. The spaced form parses identically and has no
       such sequence, so it survives delivery. Do not "clean up" the spaces. -->
  <meta name="viewport" content="width = device-width, initial-scale = 1.0">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
  <!-- Tells Apple Mail / iOS Mail not to auto-scale the message to fit. Without it,
       iOS decides the layout is too wide, shrinks the WHOLE email, and only
       recalculates on rotation — which is why rotating and rotating back "fixes" it. -->
  <meta name="x-apple-disable-message-reformatting">
  <title>Grace Life Fellowship — Weekly News</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">
    @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,800,900&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; line-height: 100%; outline: none; text-decoration: none; }
    /* iOS auto-detects dates/times/addresses and styles them as links — make those render as plain text */
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    /* Let long tokens (emails, URLs, big numbers) break mid-word. A single unbreakable
       word sets a minimum width for its column; if that exceeds the phone width, iOS
       Mail abandons reflow and zoom-shrinks the whole email. This is the #1 cause of
       a long email rendering tiny/desktop-width on iPhone. */
    td, p, h1, h2, h3, a, span, li { word-break: break-word !important; overflow-wrap: break-word !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Satoshi', 'Segoe UI', Arial, Helvetica, sans-serif; background-color: #081158; color: #1a1a2e; }
    .email-container { width: 100% !important; max-width: 600px !important; }
    /* Constrain ONLY Elexio's auto-appended unsubscribe paragraph (matched by the link it contains) */
    p:has(a[href*="email_unsubscribe"]) {
      max-width: 600px !important;
      margin: 8px auto 24px !important;
      padding: 0 24px !important;
      text-align: center !important;
      font-family: 'Inter', Arial, Helvetica, sans-serif !important;
      box-sizing: border-box;
    }
    a[href*="email_unsubscribe"] {
      display: inline-block !important;
      max-width: 100% !important;
      color: #8fa0be !important;
      font-size: 11px !important;
      line-height: 18px !important;
      word-break: break-word !important;
    }
    @media screen and (max-width: 620px) {
      .fluid { max-width: 100% !important; height: auto !important; }
      .pad-mobile { padding-left: 24px !important; padding-right: 24px !important; }
      .tile-pad   { padding-left: 18px !important; padding-right: 18px !important; }
      /* Labels are abbreviated (WED / SEP), so the badge is back to its original
         width and tracking — the longest label is now ~34px in an 84px column. */
      .date-col   { width: 84px !important; }
      .date-num   { font-size: 36px !important; }
      .page-title { font-size: 32px !important; }
      .logo-mark  { width: 64px !important; }
    }
  </style>
</head>
<body width="100%" style="margin:0; padding:0; background-color:#081158;">

  <div style="display:none; max-height:0px; overflow:hidden;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#081158;">
    <tr>
      <td align="center" valign="top" style="padding: 28px 12px; word-break:break-word; overflow-wrap:break-word;">
        <!--[if mso]>
        <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" width="600"><tr><td>
        <![endif]-->
        <!-- word-break is repeated inline here (not just in <style>) because Elexio
             sometimes strips the style block on send. Both properties inherit, so this
             one declaration keeps every long email address / URL below from setting a
             minimum width wider than the phone — the thing that makes iOS Mail give up
             on reflow and zoom the whole email out. -->
        <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100%; max-width:600px; margin:0 auto; word-break:break-word; overflow-wrap:break-word;">

          <!-- HEADER (logo + title on the navy shell) -->
          <tr>
            <td style="padding: 16px 4px 34px 4px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="88" valign="middle" style="width:88px;">
                    <img src="${LOGO}" alt="Grace Life Fellowship" width="88" class="logo-mark" style="width:88px; max-width:100%; height:auto; display:block; border:0; outline:none; text-decoration:none;">
                  </td>
                  <td width="24" style="width:24px; font-size:0; line-height:0;">&nbsp;</td>
                  <td valign="middle">
                    <h1 class="page-title" style="margin:0; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:42px; line-height:1.05; font-weight:700; color:#ffffff; letter-spacing:-0.5px;">Weekly News</h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- INTRO -->
          <tr>
            <td style="background-color:#ffffff; border-radius:12px 12px 0 0; padding: 0 48px 0 48px;" class="pad-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="left" height="47" style="height:47px; font-size:0; line-height:0;">
                    <img src="${RIBBON}" alt="" width="26" height="48" style="width:26px; height:48px; display:block; border:0; outline:none; text-decoration:none;">
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr><td style="height:22px; font-size:0; line-height:0;">&nbsp;</td></tr></table>
              <p style="margin:0 0 12px 0; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:11px; font-weight:700; letter-spacing:4px; text-transform:uppercase; color:#ec8675;">${weekof}</p>
              <p style="margin:0; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:15px; line-height:25px; color:#1a1a2e;">${intro}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="60" align="left" style="margin-top:26px;">
                <tr><td style="background-color:#ec8675; height:3px; border-radius:2px; font-size:0; line-height:0; mso-line-height-rule:exactly;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- EVENT TILES -->
          <tr>
            <td style="background-color:#ffffff; padding: 36px 40px 8px 40px;" class="pad-mobile">${tiles}
            </td>
          </tr>

${announcePanel}

          <!-- GIVING BAND (mid-navy so its edges read against the #081158 shell) -->
          <tr>
            <td bgcolor="#0c1a6e" style="background-color:#0c1a6e; padding: 32px 48px;" class="pad-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 20px 0; font-family:'Inter',Arial,Helvetica,sans-serif; font-size:14px; line-height:22px; color:#a8b5ce;">Consider giving financially to support the ministry of Grace Life Fellowship.</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>
                        <td bgcolor="#5532FA" style="background-color:#5532FA; border-radius:50px;">
                          <a href="https://www.gracelifefellowship.org/give" target="_blank" style="display:inline-block; padding:14px 40px; font-family:'Inter',Arial,Helvetica,sans-serif; font-size:14px; font-weight:600; letter-spacing:2px; color:#ffffff; text-decoration:none; border-radius:50px; mso-padding-alt:14px 40px;">GIVE</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td bgcolor="#050d3d" style="background-color:#050d3d; border-radius:0 0 12px 12px; padding: 32px 48px 36px;" class="pad-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:14px;">
                    <img src="${WORDMARK}" alt="Grace Life Fellowship" width="220" class="fluid" style="width:220px; max-width:100%; height:auto; display:block; margin:0 auto; border:0; outline:none; text-decoration:none;">
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="40" align="center">
                      <tr><td style="background-color:#ec8675; height:2px; border-radius:1px; font-size:0; line-height:0; mso-line-height-rule:exactly;">&nbsp;</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <p style="margin:0; font-family:'Inter',Arial,Helvetica,sans-serif; font-size:12px; line-height:20px; color:#7389ab;">10210 Baringer Foreman Road &nbsp;&middot;&nbsp; Baton Rouge, LA<br>Sundays at 10:&zwnj;15&zwnj;am</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>
                        <td style="padding: 0 6px;">
                          <a href="https://www.youtube.com/@gracelifefellowship" target="_blank" style="text-decoration:none;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="background-color:#FF0000; border-radius:8px; width:40px; height:40px; text-align:center; vertical-align:middle;"><span style="font-family:'Inter',Arial,sans-serif; font-size:16px; font-weight:700; color:#ffffff; line-height:40px; display:block;">&#9654;</span></td></tr></table>
                          </a>
                        </td>
                        <td style="padding: 0 6px;">
                          <a href="https://www.instagram.com/gracelifefellowship" target="_blank" style="text-decoration:none;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="background:#E1306C; border-radius:8px; width:40px; height:40px; text-align:center; vertical-align:middle;"><span style="font-family:'Inter',Arial,sans-serif; font-size:13px; font-weight:700; color:#ffffff; line-height:40px; display:block;">IG</span></td></tr></table>
                          </a>
                        </td>
                        <td style="padding: 0 6px;">
                          <a href="https://www.facebook.com/gracelifefellowship" target="_blank" style="text-decoration:none;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="background-color:#1877F2; border-radius:8px; width:40px; height:40px; text-align:center; vertical-align:middle;"><span style="font-family:'Inter',Arial,sans-serif; font-size:16px; font-weight:700; color:#ffffff; line-height:40px; display:block;">f</span></td></tr></table>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="https://www.gracelifefellowship.org" target="_blank" style="font-family:'Inter',Arial,sans-serif; font-size:12px; font-weight:500; color:#5b95d2; text-decoration:none; padding:0 8px;">Website</a>
                    <span style="color:#4a5a75; font-size:12px;">&middot;</span>
                    <a href="https://www.gracelifefellowship.org/media/main" target="_blank" style="font-family:'Inter',Arial,sans-serif; font-size:12px; font-weight:500; color:#5b95d2; text-decoration:none; padding:0 8px;">Sermons</a>
                    <span style="color:#4a5a75; font-size:12px;">&middot;</span>
                    <a href="https://www.gracelifefellowship.org/events" target="_blank" style="font-family:'Inter',Arial,sans-serif; font-size:12px; font-weight:500; color:#5b95d2; text-decoration:none; padding:0 8px;">Events</a>
                    <span style="color:#4a5a75; font-size:12px;">&middot;</span>
                    <a href="https://www.gracelifefellowship.org/give" target="_blank" style="font-family:'Inter',Arial,sans-serif; font-size:12px; font-weight:500; color:#5b95d2; text-decoration:none; padding:0 8px;">Give</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:24px; background-color:transparent; font-size:0; line-height:0;">&nbsp;</td></tr>

        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>

</body>
</html>`;
    }

    /* ══════════════════ LETTER ══════════════════ */
    // Letter body → paragraphs. Blank line = new paragraph. A line starting "## " is a
    // bold all-caps subhead; any lines right under it become its paragraph (the
    // "SNACKS FOR FRONT YARD BIKES / details…" pattern in GLF's everyday emails).
    // A line of just "---" drops the coral letterhead rule in to separate announcements.
    const LETTER_RULE = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="150">
                <tr><td width="150" style="width:150px; background-color:#ec8675; height:3px; font-size:0; line-height:0; mso-line-height-rule:exactly;">&nbsp;</td></tr>
              </table>`;
    const LETTER_FONT = "font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif;";
    const LETTER_LINK = 'color:#081158; font-weight:700; text-decoration:underline; text-decoration-color:#ec8675;';
    const LETTER_BOLD = 'font-weight:700; color:#081158;';
    function renderLetterBody(raw) {
      const blocks = raw.trim().split(/\n[ \t]*\n/).map(b => b.trim()).filter(Boolean);
      const out = [];
      blocks.forEach(block => {
        let lines = [];
        const flush = () => {
          if (lines.length) out.push({ type: 'p', text: lines.join('\n') });
          lines = [];
        };
        block.split('\n').forEach(line => {
          const h = line.match(/^#{1,3}\s+(.+)$/);
          if (h) { flush(); out.push({ type: 'h', text: h[1].trim() }); }
          else if (/^\s*-{3,}\s*$/.test(line)) { flush(); out.push({ type: 'hr' }); }
          else lines.push(line.trim());
        });
        flush();
      });
      // A divider only makes sense between content: drop leading, trailing and doubled ones.
      const items = out.filter((b, i) => b.type !== 'hr' ||
        (i > 0 && i < out.length - 1 && out[i - 1].type !== 'hr' && out.slice(0, i).some(x => x.type !== 'hr')));
      return items.map((b, i) => {
        const prev = items[i - 1], next = items[i + 1];
        if (b.type === 'hr') {
          return `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr><td style="padding:32px 0 34px 0;">
              ${LETTER_RULE}
                </td></tr>
              </table>`;
        }
        const inner = formatInline(b.text, LETTER_LINK, LETTER_BOLD);
        if (b.type === 'h') {
          const mt = (i === 0 || prev.type === 'hr') ? '0' : '30px';
          return `
              <p style="margin:${mt} 0 6px 0; ${LETTER_FONT} font-size:14px; line-height:20px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; color:#081158;">${inner}</p>`;
        }
        const mb = (!next || next.type === 'hr') ? '0' : '18px';
        return `
              <p style="margin:0 0 ${mb} 0; ${LETTER_FONT} font-size:16px; line-height:27px; color:#1a1a2e;">${inner}</p>`;
      }).join('');
    }

    // Sign-off → closing line in body style, bold navy name, small grey title.
    // Every part is optional; all three blank drops the sign-off entirely.
    function renderLetterSignoff(closing, name, title) {
      if (!closing && !name && !title) return '';
      let html = '';
      let first = true;
      const mt = () => { const m = first ? '32px' : '0'; first = false; return m; };
      if (closing) html += `
              <p style="margin:${mt()} 0 4px 0; ${LETTER_FONT} font-size:16px; line-height:27px; color:#1a1a2e;">${closing}</p>`;
      if (name) html += `
              <p style="margin:${mt()} 0 0 0; ${LETTER_FONT} font-size:16px; line-height:24px; font-weight:700; color:#081158;">${name}</p>`;
      if (title) html += `
              <p style="margin:${mt()} 0 0 0; ${LETTER_FONT} font-size:13px; line-height:20px; color:#7389ab;">${title}</p>`;
      return html;
    }

    // d: LETTER_FIELDS values.
    function renderLetterEmail(d) {
      const val = id => esc((d[id] || '').trim());
      const preheader  = val('l_preheader');
      const headline   = protectTimes(val('l_headline'));
      const letterBody = protectTimes(renderLetterBody(d.l_body || ''));
      const signoff    = protectTimes(renderLetterSignoff(val('l_closing'), val('l_name'), val('l_title')));
      const HLOGO = 'https://cdn.prod.website-files.com/661743fdb5eac44694ae2669/6657b906254a3353045df90d_GLF%20Logo%20Horizontal.png';

      return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <!-- Spaces around the equals signs are deliberate: Elexio's mailer eats any equals
       sign followed by two hex digits (quoted-printable decoding), which corrupts the
       usual compact form of this tag. The spaced form parses identically and has no
       such sequence, so it survives delivery. Do not "clean up" the spaces. -->
  <meta name="viewport" content="width = device-width, initial-scale = 1.0">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
  <meta name="x-apple-disable-message-reformatting">
  <title>Grace Life Fellowship</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">
    @import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,800,900&display=swap');
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; line-height: 100%; outline: none; text-decoration: none; }
    /* iOS auto-detects dates/times/addresses and styles them as links — make those render as plain text */
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    td, p, h1, h2, h3, a, span, li { word-break: break-word !important; overflow-wrap: break-word !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Satoshi', 'Segoe UI', Arial, Helvetica, sans-serif; background-color: #eef3f8; color: #1a1a2e; }
    .email-container { width: 100% !important; max-width: 600px !important; }
    /* Constrain ONLY Elexio's auto-appended unsubscribe paragraph (matched by the link it contains) */
    p:has(a[href*="email_unsubscribe"]) {
      max-width: 600px !important;
      margin: 8px auto 24px !important;
      padding: 0 24px !important;
      text-align: center !important;
      font-family: 'Inter', Arial, Helvetica, sans-serif !important;
      box-sizing: border-box;
    }
    a[href*="email_unsubscribe"] {
      display: inline-block !important;
      max-width: 100% !important;
      color: #7389ab !important;
      font-size: 11px !important;
      line-height: 18px !important;
      word-break: break-word !important;
    }
    @media screen and (max-width: 620px) {
      .pad-mobile { padding-left: 24px !important; padding-right: 24px !important; }
      .letter-headline { font-size: 26px !important; line-height: 32px !important; }
      .letter-logo { width: 190px !important; }
    }
  </style>
</head>
<body width="100%" style="margin:0; padding:0; background-color:#eef3f8;">

  <div style="display:none; max-height:0px; overflow:hidden;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#eef3f8;">
    <tr>
      <td align="center" valign="top" style="padding: 28px 12px; word-break:break-word; overflow-wrap:break-word;">
        <!--[if mso]>
        <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" width="600"><tr><td>
        <![endif]-->
        <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100%; max-width:600px; margin:0 auto; word-break:break-word; overflow-wrap:break-word;">

          <!-- LETTERHEAD: navy top edge -->
          <tr>
            <td bgcolor="#081158" style="background-color:#081158; border-radius:12px 12px 0 0; height:8px; font-size:0; line-height:0; mso-line-height-rule:exactly;">&nbsp;</td>
          </tr>

          <!-- LETTERHEAD: logo -->
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff; padding: 36px 48px 28px 48px;" class="pad-mobile">
              <a href="https://www.gracelifefellowship.org" target="_blank" style="text-decoration:none;">
                <img src="${HLOGO}" alt="Grace Life Fellowship" width="220" class="letter-logo" style="width:220px; max-width:100%; height:auto; display:block; border:0; outline:none; text-decoration:none;">
              </a>
            </td>
          </tr>

          <!-- LETTERHEAD: coral rule -->
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff; padding: 0 48px;" class="pad-mobile">
              ${LETTER_RULE}
            </td>
          </tr>

          <!-- LETTER BODY -->
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff; padding: 40px 48px 44px 48px;" class="pad-mobile">
              <h1 class="letter-headline" style="margin:0 0 24px 0; font-family:'Satoshi','Segoe UI',Arial,Helvetica,sans-serif; font-size:30px; line-height:36px; font-weight:800; color:#081158; letter-spacing:-0.4px;">${headline}</h1>${letterBody}${signoff}
            </td>
          </tr>

          <!-- LETTERHEAD FOOTER -->
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff; padding: 0 48px 30px 48px;" class="pad-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr><td style="background-color:#dfe6f0; height:1px; font-size:0; line-height:0; mso-line-height-rule:exactly;">&nbsp;</td></tr>
              </table>
              <p style="margin:22px 0 6px 0; font-family:'Inter',Arial,Helvetica,sans-serif; font-size:12px; line-height:20px; color:#7389ab; text-align:center;">Grace Life Fellowship &nbsp;&middot;&nbsp; 10210 Baringer Foreman Road &nbsp;&middot;&nbsp; Baton Rouge, LA 70809<br>Sundays at 10:&zwnj;15&zwnj;am</p>
              <p style="margin:0; font-family:'Inter',Arial,Helvetica,sans-serif; font-size:12px; line-height:20px; text-align:center;">
                <a href="https://www.gracelifefellowship.org" target="_blank" style="color:#5b95d2; font-weight:500; text-decoration:none; padding:0 6px;">Website</a><span style="color:#c5d3f0;">&middot;</span><a href="https://www.gracelifefellowship.org/events" target="_blank" style="color:#5b95d2; font-weight:500; text-decoration:none; padding:0 6px;">Events</a><span style="color:#c5d3f0;">&middot;</span><a href="https://www.gracelifefellowship.org/media/main" target="_blank" style="color:#5b95d2; font-weight:500; text-decoration:none; padding:0 6px;">Sermons</a><span style="color:#c5d3f0;">&middot;</span><a href="https://www.gracelifefellowship.org/give" target="_blank" style="color:#5b95d2; font-weight:500; text-decoration:none; padding:0 6px;">Give</a>
              </p>
            </td>
          </tr>

          <!-- LETTERHEAD: navy bottom edge -->
          <tr>
            <td bgcolor="#081158" style="background-color:#081158; border-radius:0 0 12px 12px; height:8px; font-size:0; line-height:0; mso-line-height-rule:exactly;">&nbsp;</td>
          </tr>

          <tr><td style="height:16px; font-size:0; line-height:0;">&nbsp;</td></tr>

        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>

</body>
</html>`;
    }

    // Escape HTML special characters (for user-typed content)
    function esc(str) {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    // Parses the combined body textarea — splits on blank lines,
    // treats **text** blocks as pull quote callouts, everything else as <p>.
    function parseBodyContent(text) {
      const raw = (text || '').trim();
      const blocks = raw.split(/\n[ \t]*\n/).map(b => b.trim()).filter(b => b.length > 0);

      // Find last regular paragraph index so we can drop its bottom margin
      let lastParaIdx = -1;
      blocks.forEach((b, i) => { if (!/^\*\*[\s\S]+\*\*$/.test(b)) lastParaIdx = i; });

      let html = '';
      blocks.forEach((block, idx) => {
        const quoteMatch = block.match(/^\*\*([\s\S]+)\*\*$/);
        if (quoteMatch) {
          const qt = esc(quoteMatch[1].trim());
          html += `
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
          html += `
              <p style="margin:0 0 ${mb} 0; font-family:'Lora',Georgia,'Times New Roman',serif; font-size:17px; line-height:30px; font-weight:400; color:#1a1a2e;">${esc(block)}</p>`;
        }
      });
      return html;
    }

    // d: DEVOTIONAL_FIELDS values.
    function renderDevotionalEmail(d) {
      const raw = id => (d[id] || '').trim();
      const val = id => esc(raw(id));
      const preheader        = val('preheader');
      const emailTitle       = val('email_title');
      const emailDate        = val('email_date');
      const scriptureText    = val('scripture_text');
      const scriptureRef     = val('scripture_reference');
      const devotionalTitle  = val('devotional_title');
      const devotionalByline = val('devotional_byline');
      const bodyContent      = parseBodyContent(d.body_content);
      const closingPrayer    = val('closing_prayer');
      const shareHeadline    = val('share_headline');

      // Build the plain-text mailto body: a short message + a link to the blog post
      // (where the recipient can read the styled devotional with all links and buttons intact).
      const blogUrl = raw('blog_url');
      const sharePlainText = blogUrl
        ? raw('share_body') + '\n\nRead it here: ' + blogUrl
        : raw('share_body');

      // Gmail-web's mailto handler drops the body parameter when it contains characters
      // encodeURIComponent leaves alone (notably ' ! ( ) *). Force RFC 3986 strict encoding.
      const shareBody        = encodeURIComponent(sharePlainText)
                                 .replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
      const giveSubtext      = val('give_subtext');

      return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <!-- Spaces around the equals signs are deliberate: Elexio's mailer eats any equals
       sign followed by two hex digits (quoted-printable decoding), which corrupts the
       usual compact form of this tag. The spaced form parses identically and has no
       such sequence, so it survives delivery. Do not "clean up" the spaces. -->
  <meta name="viewport" content="width = device-width, initial-scale = 1.0">
  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no">
  <title>Grace Life Fellowship — Weekly Devotional</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Inter:wght@300;400;500;600&display=swap');
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; line-height: 100%; outline: none; text-decoration: none; }
    /* iOS auto-detects dates/times/addresses and styles them as links — make those render as plain text */
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; font-family: 'Inter', Arial, Helvetica, sans-serif; background-color: #eef3f8; color: #081158; }
    /* Let long tokens (emails, URLs, big numbers) break mid-word so a single unbreakable
       word can't force the layout wider than the phone and trigger iOS Mail's zoom-out. */
    td, p, h1, h2, h3, a, span, li { word-break: break-word !important; overflow-wrap: break-word !important; }
    /* Hybrid responsive: the email-container is fluid (width:100%) and capped via max-width on modern clients; Outlook uses the ghost <table> in the conditional comment below */
    .email-container { width: 100% !important; max-width: 600px !important; }
    /* Constrain ONLY Elexio's auto-appended unsubscribe paragraph (matched by the link it contains) */
    p:has(a[href*="email_unsubscribe"]) {
      max-width: 600px !important;
      margin: 16px auto !important;
      padding: 0 24px !important;
      text-align: center !important;
      font-family: 'Inter', Arial, Helvetica, sans-serif !important;
      box-sizing: border-box;
    }
    a[href*="email_unsubscribe"] {
      display: inline-block !important;
      max-width: 100% !important;
      color: #7389ab !important;
      font-size: 11px !important;
      line-height: 18px !important;
      word-break: break-word !important;
    }
    @media screen and (max-width: 620px) {
      .fluid { max-width: 100% !important; height: auto !important; }
      .pad-mobile { padding-left: 24px !important; padding-right: 24px !important; }
      .scripture-text { font-size: 21px !important; line-height: 32px !important; }
      .section-heading { font-size: 26px !important; }
    }
  </style>
</head>
<body width="100%" style="margin:0; padding:0; background-color:#eef3f8;">

  <div style="display:none; max-height:0px; overflow:hidden;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>

  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#eef3f8;">
    <tr>
      <td align="center" valign="top" style="padding: 24px 12px;">
        <!--[if mso]>
        <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" width="600"><tr><td>
        <![endif]-->
        <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" width="100%" style="width:100%; max-width:600px; margin:0 auto;">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#081158; border-radius:12px 12px 0 0; padding: 36px 48px 32px;" class="pad-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 6px 0; font-family:'Inter',Arial,sans-serif; font-size:11px; font-weight:600; letter-spacing:4px; text-transform:uppercase; color:#5b95d2;">Grace Life Fellowship</p>
                    <h1 style="margin:0 0 12px 0; font-family:'Lora',Georgia,'Times New Roman',serif; font-size:38px; line-height:1.15; font-weight:500; color:#ffffff; letter-spacing:-0.5px;">${emailTitle}</h1>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="60" align="center" style="margin: 0 auto;">
                      <tr><td style="background-color:#ec8675; height:3px; border-radius:2px; font-size:0; line-height:0; mso-line-height-rule:exactly;">&nbsp;</td></tr>
                    </table>
                    <p style="margin:14px 0 0 0; font-family:'Inter',Arial,sans-serif; font-size:13px; font-weight:400; color:#a8b5ce; letter-spacing:1px;">${emailDate}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SCRIPTURE -->
          <tr>
            <td style="background-color:#0c1a6e; padding: 32px 48px 36px;" class="pad-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td width="4" style="background-color:#ec8675; border-radius:3px; min-width:4px;" valign="top">&nbsp;</td>
                  <td width="20" style="min-width:20px;">&nbsp;</td>
                  <td>
                    <p class="scripture-text" style="margin:0 0 16px 0; font-family:'Lora',Georgia,'Times New Roman',serif; font-size:24px; line-height:36px; font-weight:400; font-style:italic; color:#ffffff;">${scriptureText}</p>
                    <p style="margin:0; font-family:'Inter',Arial,sans-serif; font-size:8px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:#8fa0be;">${scriptureRef}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- DEVOTIONAL BODY -->
          <tr>
            <td style="background-color:#ffffff; padding: 44px 48px 40px;" class="pad-mobile">
              <h2 class="section-heading" style="margin:0 0 8px 0; font-family:'Lora',Georgia,'Times New Roman',serif; font-size:30px; line-height:1.2; font-weight:600; color:#081158;">${devotionalTitle}</h2>
              <p style="margin:0 0 28px 0; font-family:'Inter',Arial,sans-serif; font-size:13px; font-weight:400; color:#8ea5a0; letter-spacing:0.5px;">${devotionalByline}</p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:28px;">
                <tr><td style="background-color:#d2e4e0; height:1px; font-size:1px; line-height:1px; mso-line-height-rule:exactly;">&nbsp;</td></tr>
              </table>
              ${bodyContent}
            </td>
          </tr>

          <!-- CLOSING & PRAYER -->
          <tr>
            <td style="background-color:#ffffff; padding: 36px 48px 40px;" class="pad-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="background-color:#eef3f8; border-radius:8px; padding: 24px 28px;">
                    <p style="margin:0 0 8px 0; font-family:'Inter',Arial,sans-serif; font-size:10px; font-weight:600; letter-spacing:3px; text-transform:uppercase; color:#ec8675;">A Prayer for This Week</p>
                    <p style="margin:0; font-family:'Lora',Georgia,'Times New Roman',serif; font-size:16px; line-height:28px; font-style:italic; color:#1a1a2e;">${closingPrayer}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- SHARE CTA -->
          <tr>
            <td style="background-color:#0c1a6e; padding: 32px 48px;" class="pad-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 22px 0; font-family:'Lora',Georgia,'Times New Roman',serif; font-size:20px; font-weight:500; font-style:italic; color:#ffffff; line-height:30px;">${shareHeadline}</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>
                        <td style="border-radius:50px; border:1.5px solid #ec8675;">
                          <a href="mailto:?subject=Weekly%20Devotional%20from%20Grace%20Life%20Fellowship&body=${shareBody}" style="display:inline-block; padding:12.5px 28px; font-family:'Inter',Arial,sans-serif; font-size:14px; font-weight:600; letter-spacing:2px; color:#ec8675; text-decoration:none; mso-padding-alt:14px 40px;">PLEASE SHARE</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- GIVE CTA -->
          <tr>
            <td style="background-color:#081158; padding: 28px 48px;" class="pad-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 18px 0; font-family:'Inter',Arial,sans-serif; font-size:14px; font-weight:400; color:#a8b5ce; line-height:22px;">${giveSubtext}</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>
                        <td style="border-radius:50px; background-color:#5532FA;">
                          <a href="https://www.gracelifefellowship.org/give" target="_blank" style="display:inline-block; padding:14px 40px; font-family:'Inter',Arial,sans-serif; font-size:14px; font-weight:600; letter-spacing:2px; color:#ffffff; text-decoration:none; mso-padding-alt:14px 40px;">GIVE</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#050d3d; border-radius:0 0 12px 12px; padding: 32px 48px 36px;" class="pad-mobile">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <img src="https://cdn.prod.website-files.com/661743fdb5eac44694ae2669/6a025f4f152c26a0f09c8a73_GLF_white_bug.png" alt="Grace Life Fellowship" width="72" style="width:72px; height:auto; display:block; margin:0 auto; border:0; outline:none; text-decoration:none;">
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="40" align="center">
                      <tr><td style="background-color:#ec8675; height:2px; border-radius:1px; font-size:0; line-height:0; mso-line-height-rule:exactly;">&nbsp;</td></tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <p style="margin:0; font-family:'Inter',Arial,sans-serif; font-size:12px; line-height:20px; color:#7389ab;">10210 Baringer Foreman Road &nbsp;·&nbsp; Baton Rouge, LA<br>Sundays at 10:&zwnj;15&zwnj;am</p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                      <tr>
                        <td style="padding: 0 6px;">
                          <a href="https://www.youtube.com/@gracelifefellowship" target="_blank" style="text-decoration:none;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="background-color:#FF0000; border-radius:8px; width:40px; height:40px; text-align:center; vertical-align:middle;"><span style="font-family:'Inter',Arial,sans-serif; font-size:16px; font-weight:700; color:#ffffff; line-height:40px; display:block;">&#9654;</span></td></tr></table>
                          </a>
                        </td>
                        <td style="padding: 0 6px;">
                          <a href="https://www.instagram.com/gracelifefellowship" target="_blank" style="text-decoration:none;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="background:#E1306C; border-radius:8px; width:40px; height:40px; text-align:center; vertical-align:middle;"><span style="font-family:'Inter',Arial,sans-serif; font-size:13px; font-weight:700; color:#ffffff; line-height:40px; display:block;">IG</span></td></tr></table>
                          </a>
                        </td>
                        <td style="padding: 0 6px;">
                          <a href="https://www.facebook.com/gracelifefellowship" target="_blank" style="text-decoration:none;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="background-color:#1877F2; border-radius:8px; width:40px; height:40px; text-align:center; vertical-align:middle;"><span style="font-family:'Inter',Arial,sans-serif; font-size:16px; font-weight:700; color:#ffffff; line-height:40px; display:block;">f</span></td></tr></table>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="https://www.gracelifefellowship.org" target="_blank" style="font-family:'Inter',Arial,sans-serif; font-size:12px; font-weight:500; color:#5b95d2; text-decoration:none; padding:0 8px;">Website</a>
                    <span style="color:#4a5a75; font-size:12px;">·</span>
                    <a href="https://www.gracelifefellowship.org/media/main" target="_blank" style="font-family:'Inter',Arial,sans-serif; font-size:12px; font-weight:500; color:#5b95d2; text-decoration:none; padding:0 8px;">Sermons</a>
                    <span style="color:#4a5a75; font-size:12px;">·</span>
                    <a href="https://www.gracelifefellowship.org/events" target="_blank" style="font-family:'Inter',Arial,sans-serif; font-size:12px; font-weight:500; color:#5b95d2; text-decoration:none; padding:0 8px;">Events</a>
                    <span style="color:#4a5a75; font-size:12px;">·</span>
                    <a href="https://www.gracelifefellowship.org/give" target="_blank" style="font-family:'Inter',Arial,sans-serif; font-size:12px; font-weight:500; color:#5b95d2; text-decoration:none; padding:0 8px;">Give</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr><td style="height:24px; background-color:transparent;"></td></tr>

        </table>
        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>

</body>
</html>`;
    }

    // Node (build-preview.js) gets the same functions; in the browser this file's
    // top-level declarations are simply globals for index.html's script.
    if (typeof module !== 'undefined' && module.exports) {
      module.exports = { DEVOTIONAL_FIELDS, WEEKLY_FIELDS, LETTER_FIELDS, smartenQuotes,
        THEMES, THEME_ORDER, SEED_EVENTS, ANN_SEED,
        renderDevotionalEmail, renderWeeklyEmail, renderLetterEmail };
    }

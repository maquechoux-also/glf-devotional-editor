# GLF Email Editor

One editor for Grace Life Fellowship's emails — the Weekly Devotional, Weekly News,
and the everyday Letter — plus the printed Bulletin. Fill in the fields, click
**Copy HTML**, paste into Elexio's code view.

## Files

| File | What it is |
|---|---|
| `index.html` | **The editor.** Four tabs: ✦ Weekly Devotional, 📅 Weekly News, ✉ Letter and the Print Bulletin. Add `#weekly`, `#letter` or `#bulletin` to the URL to open a tab directly. |
| `templates.js` | The email templates, shared by the editor and `build-preview.js`. |
| `bulletin-fonts.js` | The bulletin's date-tile fonts, embedded for the print PDF. |
| `preview-devotional.html` | Rendered devotional email (static snapshot, built from the editor's default content). |
| `preview-weekly.html` | Rendered Weekly News email (static snapshot, built from the editor's default content). |
| `preview-letter.html` | Rendered Letter email (static snapshot, built from the editor's default content). |
| `preview.html` | Legacy URL — just redirects to `preview-devotional.html`. |
| `build-preview.js` | Regenerates the preview files: `node build-preview.js`. |

## How to test what the emails look like

**Quick look (default content):** open `preview-devotional.html`,
`preview-weekly.html` or `preview-letter.html` in any browser. Regenerate them after
editing the templates or the defaults with:

```bash
node build-preview.js
```

**Real content (what you actually typed):** open `index.html` in a browser, pick a
tab, fill in the fields, then click **⬇ Download** in the header. The downloaded
file is exactly what Elexio will send — double-click it to view.

To run it served locally (optional — plain double-click works too):

```bash
python3 -m http.server 8777
# → http://localhost:8777/index.html         (devotional tab)
# → http://localhost:8777/index.html#weekly  (events tab)
```

## Notes

- The Copy/Download buttons act on whichever tab is active.
- **Print Bulletin** (`index.html#bulletin`) lays out a 2-up, letter-size, black-and-white
  bulletin from the same Google Sheet as Weekly News. Tick which sheet items to print;
  the banner warns when they don't fit. **Export PDF** prints it.
- **✉ Letter** (`index.html#letter`) is the Grace Life letterhead for everyday updates
  (announcements, family news, prayer needs, meal trains): a headline, the letter
  body, and an optional sign-off. In the body, a line starting with `## ` becomes a
  bold all-caps subhead, and the lines right under it become its paragraph. A line
  of just `---` puts the coral letterhead rule between announcements.
  `**bold**`, `*italic*`, and 🔗 Add Link work as elsewhere. Clear all three
  sign-off fields to send it unsigned.
- Event cards on the events tab: **+ Add Event** / **Remove**, with a color theme
  picker covering the nine ministries (All Church, Life Groups, Kids, Middle School,
  High School, All Youth, Men, Women, Discipleship). The five newer palettes come
  from the site's Connect page. Picking a theme auto-fills the group pill
  (All Youth → "Youth") — it can still be typed over.
- In any body text box: `**bold**` → navy emphasis, `*italic*` → italics, blank
  line = new paragraph. To link words to a webpage, highlight them and click the
  floating **🔗 Add Link** button (or type `[words](https://page)`).
- Announcements at the bottom are repeatable like events: **+ Add Announcement** /
  **Remove**, each with eyebrow, headline, body, and an optional gold-rule quote.
  They share one rounded box with divider lines. Blank announcements are skipped;
  remove them all to drop the section entirely.
- Events are automatically ordered soonest-first in the built email (year inferred
  from the Week Of date, so Dec→Jan weeks sort correctly). If any event's day/month
  can't be read, the email keeps the manual card order instead of guessing. The
  **⇅ Sort by Date** button reorders the cards themselves the same way.
- **📅 Calendar (.ics)** (Weekly News tab only) downloads an iCalendar file of the
  events — attach it to the Elexio email so readers can save the dates to Apple,
  Google, or Outlook calendars. Events are all-day entries (times stay in the
  description text); events with an unreadable date are skipped with a warning.
- Image assets are hosted on the GLF Webflow CDN (`cdn.prod.website-files.com/…`) —
  don't delete the `glf-email-*` assets in Webflow; sent emails reference them
  forever.

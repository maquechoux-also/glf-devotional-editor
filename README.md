# GLF Email Editor

One editor, two weekly emails for Grace Life Fellowship — the Weekly Devotional and
Weekly News. Fill in the fields, click **Copy HTML**, paste into Elexio's code view.

## Files

| File | What it is |
|---|---|
| `index.html` | **The editor.** Two tabs: ✦ Weekly Devotional and 📅 Weekly News. Open `index.html#weekly` to land directly on the Weekly News tab. |
| `preview-devotional.html` | Rendered devotional email (static snapshot, built from the editor's default content). |
| `preview-weekly.html` | Rendered Weekly News email (static snapshot, built from the editor's default content). |
| `preview.html` | Legacy URL — just redirects to `preview-devotional.html`. |
| `build-preview.js` | Regenerates both preview files: `node build-preview.js`. |

## How to test what the emails look like

**Quick look (default content):** open `preview-devotional.html` or
`preview-weekly.html` in any browser. Regenerate them after editing the defaults in
`index.html` with:

```bash
node build-preview.js
```

**Real content (what you actually typed):** open `index.html` in a browser, pick a
tab, fill in the fields, then click **⬇ Download** in the header. The downloaded
file (`GLF-Devotional-….html` or `GLF-Weekly-News-….html`) is exactly what Elexio
will send — double-click it to view.

To run it served locally (optional — plain double-click works too):

```bash
npx serve -l 8765 .
# → http://localhost:8765/index.html        (devotional tab)
# → http://localhost:8765/index.html#weekly (events tab)
```

## Notes

- The Copy/Download buttons act on whichever tab is active.
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

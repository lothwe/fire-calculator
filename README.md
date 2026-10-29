# FIRE & Coast FIRE Calculator

A single-page calculator for FIRE and Coast FIRE numbers: when you reach them, how much to invest monthly, and portfolio milestones. Plain HTML/CSS/JS, no build step, no backend. Nothing a visitor enters leaves their browser.

Spec: `2026-10-28_fire-calculator_spec_v03.md`. The build has moved on since: the spec covers the maths, this code is the source of truth for the UI.

## Files

| Path | What it is |
|---|---|
| `index.html` | The page |
| `css/style.css` | Styling (brand: Shrikhand, IBM Plex Sans, #005E51, #F2F9F5) |
| `js/calc.js` | Calculation engine: pure functions, no DOM. All maths lives here |
| `js/copy.js` | **All page text.** Edit this to change wording |
| `js/app.js` | UI: inputs, results, chart, shareable URL, plan image export |
| `tests/calc.test.mjs` | Spec test cases TC1–TC5 plus edge cases |
| `netlify.toml` | Netlify config: runs the tests before every deploy |

## Run locally

```bash
npm test                      # runs the tests (Node 18+)
python3 -m http.server 8000   # then open http://localhost:8000
```

Opening `index.html` directly from the file system won't work, because browsers block JS modules on `file://`. Use the local server.

## Deploy (GitHub + Netlify)

### First time

**1. Put the code on GitHub** (pick one):

- *No Terminal:* on github.com click **+ → New repository**, name it `fire-calculator`, leave "Add a README" unticked, click **Create repository**. On the next page click **uploading an existing file**, drag in everything **inside** the `fire-calculator` folder (not the folder itself), and click **Commit changes**.
- *With Terminal:*
  ```bash
  cd fire-calculator
  git init && git add . && git commit -m "FIRE calculator"
  git branch -M main
  git remote add origin https://github.com/<your-username>/fire-calculator.git
  git push -u origin main
  ```

**2. Connect Netlify:** on app.netlify.com click **Add new site → Import an existing project → GitHub**, authorise Netlify if asked, pick the `fire-calculator` repo. Netlify reads `netlify.toml`, so leave the build settings as they are and click **Deploy**.

**3. Name it:** **Site configuration → Change site name**, e.g. `retirewithlaura-fire` → `retirewithlaura-fire.netlify.app`.

### Updating later

Every change pushed to GitHub redeploys automatically (about a minute).

- *No Terminal:* in the repo, open the file (e.g. `js/copy.js`), click the pencil icon, edit, **Commit changes**. To replace several files, use **Add file → Upload files** and drag them in with the same folder structure (e.g. drop the `js` folder to replace files in `js/`).
- *With Terminal:* `git add . && git commit -m "Update copy" && git push`

### If a deploy fails

Netlify runs the maths tests first and cancels the deploy if one fails, so the live site stays as it was. Open the failed deploy in Netlify → **Deploy log** to see which test failed. The usual cause is changing `DEFAULTS` in `js/calc.js` without updating `tests/calc.test.mjs`.

## Shareable links

All inputs are stored in the URL, e.g.
`?cur=EUR&spend=2500&per=m&wr=4&age=30&ret=67&pv=25000&c=1000&by=50&g=8&inf=2.7`

The first name is deliberately never included in links.

Invalid values fall back to the defaults. Handy for the workshop: build a scenario, click **Copy link to my scenario**, and paste it in the slides.

## Editing the copy

All text on the page lives in **`js/copy.js`**, in the order it appears on screen. Edit the words between the quotes, save, and refresh `localhost:8000`.

- `{placeholders}` are filled in with numbers, ages, years or amounts. You can move or delete them, but don't rename them. The comment next to each line lists the ones available.
- `**double asterisks**` make text bold.
- Strings use "double quotes" so apostrophes (you're, I'd) are safe. Keep the comma at the end of each line.
- If you break the file (e.g. delete a quote), the page goes blank: undo the last edit. A typo in a key name shows the raw key on the page and a warning in the browser console.
- Two exceptions stay in `index.html`: the currency names (€ EUR…) and the fallback `<title>`/description that search engines see before the page loads.

## Changing defaults

Edit `DEFAULTS` at the top of `js/calc.js`. If you change them, update the expected values in `tests/calc.test.mjs` (TC1 uses the defaults), or the deploy will fail.

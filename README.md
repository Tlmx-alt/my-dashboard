# Personal dashboard

A local dashboard with a Pomodoro timer, tasks, habits, water tracker, deadlines, day counter,
focus calendar and a daily quote. Everything runs on your own computer.

## Customize

Click the sliders button in the top-right corner to:

- **Pick a wallpaper**: choose a preset, upload your own photo, or paste an image link. Photos get a
  "Darken" slider so the text stays readable. An uploaded photo is kept in this browser only (it is
  not written to `data.json`).
- **Switch theme**: Auto (follows your system), Light or Dark.
- **Show or hide widgets**: turn off anything you don't use to keep the page simple.

## Run it

1. Double-click `start.command` (macOS). The first run sets up Python and opens
   http://localhost:8000.
2. Your data is saved to `data.json` next to the files. It is never uploaded.

Without the server (opening `index.html` directly) the dashboard still works and saves to the browser.

## Optional: read dates from plain text

Typing a deadline like "dentist next Friday 3pm" works out of the box. To have Claude read the date
instead, copy `.env.example` to `.env` and add an Anthropic API key. `.env` is git-ignored.

## Files

- `index.html`, `styles.css`, `app.js`: the page
- `server.py`: small local server (Python standard library plus the `anthropic` package)
- `data.json`: your saved data (git-ignored)

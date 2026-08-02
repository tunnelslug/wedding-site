# wedding-site

> AI context file — readable by Claude Code and Gemini CLI alike.

## What this is

**mannyandcelesti.com** — a parked, static memorial page for the Flores family's 2026 milestones: the wedding, the engagement shoot, and both baby showers.

It was originally a full RSVP platform with a database, admin panel, and email/SMS notifications. All of that was retired in August 2026 once the events were over. What remains is a thank-you page and a photo gallery.

**Status:** Parked. Static only. Do not add server-side code.

## Stack

Static HTML. No build step, no framework, no bundler, no database, no serverless functions.
Photos are served from Vercel Blob (public, no credentials needed to read).
Hosted on Vercel.

## Project layout

```
index.html                    # The site. Thank-you page, links to each album at /photos#<slug>
gallery.html                  # Photo gallery, served at /photos
public/gallery-manifest.json  # Album metadata + all 713 Blob photo URLs
public/images/                # One local hero image
scripts/resize-photos.sh      # Resize/compress source photos into gallery-staging/
scripts/upload-photos.mjs     # Upload gallery-staging/ to Blob, regenerate the manifest
vercel.json                   # Rewrites + security headers
```

## Adding photos

1. Drop event folders in `$SRC_ROOT` (defaults to `~/Downloads/Events`).
2. `bash scripts/resize-photos.sh` — writes thumb/full pairs to `gallery-staging/`.
3. `node scripts/upload-photos.mjs` — uploads to Blob, rewrites `public/gallery-manifest.json`.

Needs `BLOB_READ_WRITE_TOKEN` in `.env.local`. That is the only credential this project uses, and it is only needed locally.

## Rules

- **This repo is public.** Never commit secrets, guest names, email addresses, or phone numbers. Anything committed is permanently public even if deleted in a later commit.
- Keep it static. If a future event needs RSVPs, build it as its own project rather than reviving the API layer here.
- `vercel.json` sets a CSP. If you add an external asset, the CSP must be updated or the browser will block it.
- The catch-all rewrite sends every unmatched path to `index.html`, so unknown URLs render the thank-you page rather than a 404.

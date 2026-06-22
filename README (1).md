# SFL Playbook Maker

Official playbook builder for the SFL CFB Dynasty League.

## Files

- `index.html` — the full site (single file, no build step needed)
- `plays_structured.json` — play database scraped from cfb.fan (~14MB)
- `vercel.json` — Vercel deployment config

## Deploying to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. No build settings needed — just deploy
4. Your site will be live at `sfl-playbooks.vercel.app`

## Updating plays for CFB 27

1. Run `scrape-cfb27.bat` from the scraper folder
2. Copy the new `output/plays_structured.json` into this folder, replacing the old one
3. Commit and push to GitHub — Vercel auto-redeploys in ~30 seconds

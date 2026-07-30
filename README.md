# Can I Vibecode It?

The brutally honest directory of paid SaaS products you can — and cannot —
replace with one AI coding prompt.

Each product verdict lives in one JSON file under `data/apps/`. The site renders
on the server with Astro, keeps votes and waitlist signups in SQLite, and uses
only vanilla JavaScript in the browser.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
cp .env.example .env
npm run dev
```

The first server request creates `data/vibecode.db` and seeds the visible vote
totals. `npm run build` generates every social card and favicon locally before
building the standalone Node server.

## Production

Set these environment variables:

- `PUBLIC_SITE_URL`: public origin used by canonical URLs and social metadata
- `DATABASE_PATH`: path to a persistent writable SQLite file
- `IP_HASH_SALT`: long random value used before network addresses are hashed

The deployment target must provide a persistent disk. Run `npm run build`, then
`npm start`.

The same build also emits a Sites-compatible Worker entrypoint. On Sites, the
public pages are prerendered by Astro and votes/waitlist records use the
platform-managed `DB` binding; the standard standalone Node runtime continues
to use `better-sqlite3`.

## App data

Add one `data/apps/{slug}.json` file with:

```json
{
  "slug": "example",
  "name": "Example",
  "domain": "example.com",
  "category": "Developer Tools",
  "priceMonthly": 10,
  "verdict": "yes",
  "whatYouLose": ["One honest tradeoff"],
  "priorArt": [{ "name": "Project", "url": "https://github.com/example/project" }],
  "prompt": "The complete one-shot build prompt.",
  "notes": "Editorial context."
}
```

## Privacy

There are no third-party analytics scripts. Votes store a salted one-way hash
for a 24-hour network rate limit. Waitlist emails are deduplicated in SQLite,
and the public form includes a honeypot.

## License

MIT

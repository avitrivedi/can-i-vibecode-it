import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { apps } from "./apps";

type VoteRow = { slug: string; total: number };

const seedVotes: Record<string, number> = {
  linktree: 1842,
  calendly: 1556,
  typeform: 1279,
  trello: 1048,
  buffer: 884,
  uptimerobot: 762,
  notion: 694,
  linear: 521,
  airtable: 448,
  zapier: 386,
  loom: 191,
  docusign: 84,
  intercom: 63
};

const dbPath = resolve(process.env.DATABASE_PATH || "./data/vibecode.db");
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(`
  CREATE TABLE IF NOT EXISTS app_votes (
    slug TEXT PRIMARY KEY,
    total INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE TABLE IF NOT EXISTS vote_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL,
    ip_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS vote_events_limit_idx
    ON vote_events (slug, ip_hash, created_at);
  CREATE TABLE IF NOT EXISTS waitlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    ip_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

const insertApp = db.prepare(
  "INSERT OR IGNORE INTO app_votes (slug, total) VALUES (?, ?)"
);
const seed = db.transaction(() => {
  for (const app of apps) insertApp.run(app.slug, seedVotes[app.slug] ?? 0);
});
seed();

export function getVoteCounts() {
  const rows = db.prepare("SELECT slug, total FROM app_votes").all() as VoteRow[];
  return new Map(rows.map((row) => [row.slug, row.total]));
}

export function getVoteCount(slug: string) {
  const row = db
    .prepare("SELECT total FROM app_votes WHERE slug = ?")
    .get(slug) as { total: number } | undefined;
  return row?.total ?? 0;
}

const castVote = db.transaction((slug: string, ipHash: string) => {
  const recent = db
    .prepare(
      "SELECT 1 FROM vote_events WHERE slug = ? AND ip_hash = ? AND created_at >= unixepoch() - 86400 LIMIT 1"
    )
    .get(slug, ipHash);

  if (recent) return { accepted: false, total: getVoteCount(slug) };

  db.prepare("INSERT INTO vote_events (slug, ip_hash) VALUES (?, ?)").run(
    slug,
    ipHash
  );
  db.prepare(
    "UPDATE app_votes SET total = total + 1, updated_at = unixepoch() WHERE slug = ?"
  ).run(slug);
  return { accepted: true, total: getVoteCount(slug) };
});

export function recordVote(slug: string, ipHash: string) {
  return castVote(slug, ipHash);
}

export function joinWaitlist(email: string, ipHash: string) {
  const normalized = email.trim().toLowerCase();
  const result = db
    .prepare("INSERT OR IGNORE INTO waitlist (email, ip_hash) VALUES (?, ?)")
    .run(normalized, ipHash);
  return { added: result.changes === 1, email: normalized };
}

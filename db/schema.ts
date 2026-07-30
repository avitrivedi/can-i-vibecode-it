export const schema = {
  appVotes: `
    CREATE TABLE IF NOT EXISTS app_votes (
      slug TEXT PRIMARY KEY,
      total INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    )
  `,
  voteEvents: `
    CREATE TABLE IF NOT EXISTS vote_events (
      slug TEXT NOT NULL,
      ip_hash TEXT NOT NULL,
      vote_day TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE (slug, ip_hash, vote_day)
    )
  `,
  waitlist: `
    CREATE TABLE IF NOT EXISTS waitlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      ip_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `
};

import {
  cp,
  mkdir,
  readFile,
  writeFile
} from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const clientDir = join(root, "dist", "client");
const serverDir = join(root, "dist", "server");
const metadataDir = join(root, "dist", ".openai");
const appDir = join(root, "data", "apps");

const slugs = [
  "airtable",
  "buffer",
  "calendly",
  "docusign",
  "intercom",
  "linear",
  "linktree",
  "loom",
  "notion",
  "trello",
  "typeform",
  "uptimerobot",
  "zapier"
];

const appData = await Promise.all(
  slugs.map(async (slug) =>
    JSON.parse(await readFile(join(appDir, `${slug}.json`), "utf8"))
  )
);

const seedVotes = {
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

async function readFirst(paths) {
  let lastError;
  for (const path of paths) {
    try {
      return await readFile(path, "utf8");
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

const pages = {
  "/": await readFirst([join(clientDir, "index.html")]),
  "/rebuild-prompt": await readFirst([
    join(clientDir, "rebuild-prompt", "index.html"),
    join(clientDir, "rebuild-prompt.html")
  ]),
  "/privacy": await readFirst([
    join(clientDir, "privacy", "index.html"),
    join(clientDir, "privacy.html")
  ]),
  "/404": await readFirst([
    join(clientDir, "404.html"),
    join(clientDir, "404", "index.html")
  ])
};

for (const slug of slugs) {
  pages[`/${slug}`] = await readFirst([
    join(clientDir, slug, "index.html"),
    join(clientDir, `${slug}.html`)
  ]);
}

const textRoutes = {
  "/robots.txt": await readFirst([join(clientDir, "robots.txt")]),
  "/sitemap.xml": await readFirst([join(clientDir, "sitemap.xml")])
};

const worker = `
const pages = ${JSON.stringify(pages)};
const textRoutes = ${JSON.stringify(textRoutes)};
const apps = ${JSON.stringify(
  appData.map((app) => ({
    slug: app.slug,
    priceMonthly: app.priceMonthly,
    seed: seedVotes[app.slug] || 0
  }))
)};
const appSlugs = new Set(apps.map((app) => app.slug));
let initialization;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

async function ensureDb(env) {
  if (!env.DB) throw new Error("Missing DB binding");
  if (!initialization) {
    initialization = (async () => {
      await env.DB.batch([
        env.DB.prepare("CREATE TABLE IF NOT EXISTS app_votes (slug TEXT PRIMARY KEY, total INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL)"),
        env.DB.prepare("CREATE TABLE IF NOT EXISTS vote_events (slug TEXT NOT NULL, ip_hash TEXT NOT NULL, vote_day TEXT NOT NULL, created_at INTEGER NOT NULL, UNIQUE (slug, ip_hash, vote_day))"),
        env.DB.prepare("CREATE INDEX IF NOT EXISTS vote_events_limit_idx ON vote_events (slug, ip_hash, vote_day)"),
        env.DB.prepare("CREATE TABLE IF NOT EXISTS waitlist (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE COLLATE NOCASE, ip_hash TEXT NOT NULL, created_at INTEGER NOT NULL)")
      ]);
      await env.DB.batch(
        apps.map((app) =>
          env.DB.prepare("INSERT OR IGNORE INTO app_votes (slug, total, updated_at) VALUES (?, ?, ?)").bind(app.slug, app.seed, Math.floor(Date.now() / 1000))
        )
      );
    })().catch((error) => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}

async function counts(env) {
  await ensureDb(env);
  const result = await env.DB.prepare("SELECT slug, total FROM app_votes").all();
  return Object.fromEntries(
    (result.results || []).map((row) => [row.slug, Number(row.total)])
  );
}

function odometer(total) {
  const digits = Math.round(total).toLocaleString("en-US").split("");
  const body = digits.map((digit, index) => {
    if (digit === ",") return '<span class="odometer-comma">,</span>';
    return '<span class="odometer-window is-rolling" style="--digit:' + digit + ';--delay:' + (index * 45) + 'ms" data-digit="' + digit + '"><span class="odometer-strip" aria-hidden="true"><span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span></span><span class="sr-only">' + digit + '</span></span>';
  }).join("");
  return '<!-- MRR_ODOMETER_START --><strong class="odometer" data-odometer><span class="currency">$</span>' + body + '<span class="per-month">/MO</span></strong><!-- MRR_ODOMETER_END -->';
}

function patchPage(html, pathname, currentCounts, origin) {
  let output = html.replaceAll("http://localhost:4321", origin);
  for (const app of apps) {
    const value = Number(currentCounts[app.slug] ?? app.seed).toLocaleString("en-US");
    const pattern = new RegExp('(<strong data-vote-display="' + app.slug + '">)[\\\\s\\\\S]*?(</strong>)');
    output = output.replace(pattern, "$1" + value + "$2");
  }
  if (pathname === "/") {
    const total = apps.reduce(
      (sum, app) => sum + app.priceMonthly * Number(currentCounts[app.slug] ?? app.seed),
      0
    );
    output = output.replace(
      /<!--\\s*MRR_ODOMETER_START\\s*-->[\\s\\S]*?<!--\\s*MRR_ODOMETER_END\\s*-->/,
      odometer(total)
    );
    output = output.replace(
      /Collective MRR destroyed: \\$[\\d,]+ per month/g,
      "Collective MRR destroyed: $" + total.toLocaleString("en-US") + " per month"
    );
  } else {
    const slug = pathname.slice(1);
    if (appSlugs.has(slug)) {
      const value = Number(currentCounts[slug] || 0).toLocaleString("en-US");
      output = output.replace(
        /(<b data-page-votes>)[\\s\\S]*?(<\\/b>)/,
        "$1" + value + "$2"
      );
    }
  }
  return output;
}

async function networkHash(request, env) {
  const forwarded = request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown";
  const salt = env.IP_HASH_SALT || "can-i-vibecode-it-sites-v1";
  const data = new TextEncoder().encode(salt + ":" + forwarded);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

async function handleVote(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: "Invalid request." }, 400);
  }
  const slug = String(body.slug || "").trim().toLowerCase();
  if (!appSlugs.has(slug)) return json({ message: "Unknown app." }, 404);
  await ensureDb(env);
  const ipHash = await networkHash(request, env);
  const voteDay = new Date().toISOString().slice(0, 10);
  const now = Math.floor(Date.now() / 1000);
  const insert = await env.DB.prepare(
    "INSERT OR IGNORE INTO vote_events (slug, ip_hash, vote_day, created_at) VALUES (?, ?, ?, ?)"
  ).bind(slug, ipHash, voteDay, now).run();
  if (!insert.meta?.changes) {
    const current = await env.DB.prepare(
      "SELECT total FROM app_votes WHERE slug = ?"
    ).bind(slug).first();
    return json({
      message: "Already logged from this network today.",
      total: Number(current?.total || 0)
    }, 429);
  }
  await env.DB.prepare(
    "UPDATE app_votes SET total = total + 1, updated_at = ? WHERE slug = ?"
  ).bind(now, slug).run();
  const current = await env.DB.prepare(
    "SELECT total FROM app_votes WHERE slug = ?"
  ).bind(slug).first();
  return json({ accepted: true, total: Number(current?.total || 0) });
}

async function handleWaitlist(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: "Invalid request." }, 400);
  }
  if (body.company) return json({ added: true });
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || email.length > 254) {
    return json({ message: "Enter a valid email address." }, 400);
  }
  await ensureDb(env);
  const result = await env.DB.prepare(
    "INSERT OR IGNORE INTO waitlist (email, ip_hash, created_at) VALUES (?, ?, ?)"
  ).bind(email, await networkHash(request, env), Math.floor(Date.now() / 1000)).run();
  return json({ added: Boolean(result.meta?.changes), email });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let pathname = url.pathname.replace(/\\/+$/, "") || "/";
    if (request.method === "POST" && pathname === "/api/vote") {
      return handleVote(request, env);
    }
    if (request.method === "POST" && pathname === "/api/waitlist") {
      return handleWaitlist(request, env);
    }
    if (request.method === "GET" && pathname === "/api/counts") {
      return json(await counts(env));
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return json({ message: "Method not allowed." }, 405);
    }
    if (textRoutes[pathname]) {
      const type = pathname.endsWith(".xml")
        ? "application/xml; charset=utf-8"
        : "text/plain; charset=utf-8";
      return new Response(
        textRoutes[pathname].replaceAll("http://localhost:4321", url.origin),
        { headers: { "content-type": type } }
      );
    }
    if (pages[pathname]) {
      let currentCounts = Object.fromEntries(apps.map((app) => [app.slug, app.seed]));
      try {
        currentCounts = await counts(env);
      } catch {}
      return new Response(patchPage(pages[pathname], pathname, currentCounts, url.origin), {
        status: pathname === "/404" ? 404 : 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response(patchPage(pages["/404"], "/404", {}, url.origin), {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" }
    });
  }
};
`;

await Promise.all([
  mkdir(serverDir, { recursive: true }),
  mkdir(metadataDir, { recursive: true })
]);
await writeFile(join(serverDir, "index.js"), worker);
await cp(
  join(root, ".openai", "hosting.json"),
  join(metadataDir, "hosting.json")
);
await cp(join(root, "drizzle"), join(metadataDir, "drizzle"), {
  recursive: true,
  force: true
});

console.log(`Prepared Sites worker with ${Object.keys(pages).length} HTML routes.`);

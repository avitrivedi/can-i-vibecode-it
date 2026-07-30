export type Verdict = "yes" | "kinda" | "no";

export type PriorArt = {
  name: string;
  url: string;
};

export type AppEntry = {
  slug: string;
  name: string;
  domain: string;
  category: string;
  priceMonthly: number;
  verdict: Verdict;
  whatYouLose: string[];
  priorArt: PriorArt[];
  prompt: string;
  notes: string;
};

const modules = import.meta.glob("../../data/apps/*.json", {
  eager: true,
  import: "default"
}) as Record<string, AppEntry>;

export const apps = Object.values(modules).sort((a, b) =>
  a.name.localeCompare(b.name)
);

export const appBySlug = new Map(apps.map((app) => [app.slug, app]));

export const categories = [...new Set(apps.map((app) => app.category))].sort();

export const categoryEmoji: Record<string, string> = {
  Automation: "⚡",
  Databases: "▦",
  "Developer Tools": "⌁",
  "Docs & Knowledge": "✎",
  Documents: "▤",
  Forms: "◉",
  Marketing: "↗",
  "Project Management": "◆",
  Scheduling: "◷",
  Social: "◎",
  Support: "◌",
  Video: "▶"
};

export const verdictCopy: Record<
  Verdict,
  { short: string; label: string; explanation: string }
> = {
  yes: {
    short: "YES",
    label: "Yes. Cancel it.",
    explanation:
      "The core job is narrow enough to rebuild, own, and maintain without recreating a software company."
  },
  kinda: {
    short: "KINDA",
    label: "Kinda. Scope it hard.",
    explanation:
      "A focused version is prompt-sized. The general-purpose product and its edge cases are not."
  },
  no: {
    short: "NOT REALLY",
    label: "Not really.",
    explanation:
      "You can build a prototype, but the invisible infrastructure, trust, or ecosystem is the product."
  }
};

export function relatedApps(app: AppEntry, limit = 3) {
  return apps
    .filter((candidate) => candidate.slug !== app.slug)
    .sort((a, b) => {
      const categoryScore =
        Number(b.category === app.category) - Number(a.category === app.category);
      if (categoryScore !== 0) return categoryScore;
      const verdictScore =
        Number(b.verdict === app.verdict) - Number(a.verdict === app.verdict);
      if (verdictScore !== 0) return verdictScore;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

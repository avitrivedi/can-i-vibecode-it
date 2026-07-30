import type { APIRoute } from "astro";
import { apps } from "../lib/apps";
import { canonicalFor } from "../lib/site";

export const GET: APIRoute = ({ url }) => {
  const paths = [
    "/",
    "/rebuild-prompt",
    "/privacy",
    ...apps.map((app) => `/${app.slug}`)
  ];
  const urls = paths
    .map(
      (path) =>
        `<url><loc>${escapeXml(canonicalFor(url, path))}</loc><changefreq>${
          path === "/" ? "daily" : "monthly"
        }</changefreq><priority>${path === "/" ? "1.0" : "0.8"}</priority></url>`
    )
    .join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, max-age=3600"
      }
    }
  );
};

function escapeXml(value: string) {
  return value.replace(/[<>&'"]/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      "'": "&apos;",
      '"': "&quot;"
    };
    return entities[character];
  });
}

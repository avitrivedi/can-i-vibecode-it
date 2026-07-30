import type { APIRoute } from "astro";
import { canonicalFor } from "../lib/site";

export const prerender = true;

export const GET: APIRoute = ({ url }) => {
  const sitemap = canonicalFor(url, "/sitemap.xml");
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemap}\n`, {
    headers: { "content-type": "text/plain; charset=utf-8" }
  });
};

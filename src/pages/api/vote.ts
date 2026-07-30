import type { APIRoute } from "astro";
import { appBySlug } from "../../lib/apps";
import { recordVote } from "../../lib/db";
import { hashIp, json } from "../../lib/security";

export const POST: APIRoute = async ({ request }) => {
  let body: { slug?: string };
  try {
    body = await request.json();
  } catch {
    return json({ message: "Invalid request." }, { status: 400 });
  }

  const slug = body.slug?.trim().toLowerCase() || "";
  if (!appBySlug.has(slug)) {
    return json({ message: "Unknown app." }, { status: 404 });
  }

  const result = recordVote(slug, hashIp(request));
  if (!result.accepted) {
    return json(
      {
        message: "Already logged from this network today.",
        total: result.total
      },
      { status: 429 }
    );
  }

  return json({ accepted: true, total: result.total });
};

export const ALL: APIRoute = () =>
  json({ message: "Method not allowed." }, { status: 405 });

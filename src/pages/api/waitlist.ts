import type { APIRoute } from "astro";
import { joinWaitlist } from "../../lib/db";
import { hashIp, json } from "../../lib/security";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  let body: { email?: string; company?: string };
  try {
    body = await request.json();
  } catch {
    return json({ message: "Invalid request." }, { status: 400 });
  }

  if (body.company) {
    return json({ added: true });
  }

  const email = body.email?.trim() || "";
  if (!emailPattern.test(email) || email.length > 254) {
    return json(
      { message: "Enter a valid email address." },
      { status: 400 }
    );
  }

  const result = joinWaitlist(email, hashIp(request));
  return json(result);
};

export const ALL: APIRoute = () =>
  json({ message: "Method not allowed." }, { status: 405 });

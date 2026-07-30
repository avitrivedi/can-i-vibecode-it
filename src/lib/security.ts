import { createHash } from "node:crypto";

export function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    forwarded?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function hashIp(request: Request) {
  const salt = process.env.IP_HASH_SALT || "local-development-salt";
  const fallback = [
    request.headers.get("user-agent") || "",
    request.headers.get("accept-language") || ""
  ].join("|");
  const value = requestIp(request) === "unknown" ? `unknown:${fallback}` : requestIp(request);
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

export function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...init.headers
    }
  });
}

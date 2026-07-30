export const SITE_NAME = "Can I Vibecode It?";
export const SITE_DESCRIPTION =
  "Honest, prompt-sized verdicts on replacing paid SaaS with software you own.";
export const ORG_ID = "#organization";

export function canonicalFor(url: URL, path = url.pathname) {
  const configured = import.meta.env.PUBLIC_SITE_URL;
  const origin = configured ? new URL(configured).origin : url.origin;
  return new URL(path, origin).toString();
}

export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

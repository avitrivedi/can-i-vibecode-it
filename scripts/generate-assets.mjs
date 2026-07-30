import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import * as simpleIcons from "simple-icons";

const root = resolve(import.meta.dirname, "..");
const appDir = join(root, "data", "apps");
const publicDir = join(root, "public");
const ogDir = join(publicDir, "og");
const faviconDir = join(publicDir, "favicons");

await Promise.all([
  mkdir(ogDir, { recursive: true }),
  mkdir(faviconDir, { recursive: true })
]);

const [spaceRegular, spaceBold, monoBold] = await Promise.all([
  readFile(join(root, "node_modules", "@fontsource", "space-grotesk", "files", "space-grotesk-latin-400-normal.woff")),
  readFile(join(root, "node_modules", "@fontsource", "space-grotesk", "files", "space-grotesk-latin-700-normal.woff")),
  readFile(join(root, "node_modules", "@fontsource", "jetbrains-mono", "files", "jetbrains-mono-latin-700-normal.woff"))
]);

const files = (await readdir(appDir)).filter((file) => file.endsWith(".json"));
const apps = await Promise.all(
  files.map(async (file) => JSON.parse(await readFile(join(appDir, file), "utf8")))
);

const iconKeys = {
  notion: "siNotion",
  calendly: "siCalendly",
  typeform: "siTypeform",
  loom: "siLoom",
  zapier: "siZapier",
  linear: "siLinear",
  airtable: "siAirtable",
  linktree: "siLinktree",
  buffer: "siBuffer",
  docusign: "siDocusign",
  intercom: "siIntercom",
  trello: "siTrello"
};

function iconSvg(app, size = 128) {
  const icon = simpleIcons[iconKeys[app.slug]];
  if (!icon) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 128 128"><rect width="128" height="128" rx="20" fill="#131913"/><circle cx="64" cy="64" r="35" fill="none" stroke="#63ff7c" stroke-width="6"/><path d="M46 43h36v12H70v34H58V55H46z" fill="#63ff7c"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="#f2f4ee"/><path fill="#${icon.hex}" d="${icon.path}" transform="translate(3 3) scale(.75)"/></svg>`;
}

function dataUri(svg) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function el(type, props, children) {
  return { type, props: { ...props, children } };
}

const verdictStyle = {
  yes: { text: "YES. CANCEL IT.", color: "#63ff7c" },
  kinda: { text: "KINDA. SCOPE IT HARD.", color: "#d7a84a" },
  no: { text: "NOT REALLY.", color: "#ce665f" }
};

function frame(children) {
  return el("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      width: "1200px",
      height: "630px",
      padding: "52px 60px",
      color: "#f2f4ee",
      backgroundColor: "#070907",
      backgroundImage: "linear-gradient(rgba(99,255,124,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(99,255,124,.055) 1px, transparent 1px)",
      backgroundSize: "44px 44px",
      fontFamily: "Space Grotesk"
    }
  }, children);
}

function brandBar(right) {
  return el("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      fontFamily: "JetBrains Mono",
      fontSize: "18px",
      letterSpacing: "2px"
    }
  }, [
    el("div", { style: { display: "flex", alignItems: "center", gap: "14px" } }, [
      el("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "42px",
          height: "42px",
          border: "2px solid #63ff7c",
          color: "#63ff7c",
          fontWeight: 700
        }
      }, "C?"),
      el("span", { style: { fontWeight: 700 } }, "CAN I VIBECODE IT?")
    ]),
    el("span", { style: { color: "#7f897d" } }, right)
  ]);
}

function homeCard() {
  return frame([
    brandBar("// THE UN-SUBSCRIPTION DATABASE"),
    el("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        flex: 1
      }
    }, [
      el("div", {
        style: {
          display: "flex",
          fontSize: "102px",
          lineHeight: 0.9,
          letterSpacing: "-7px",
          fontWeight: 700
        }
      }, "CAN ONE PROMPT"),
      el("div", {
        style: {
          display: "flex",
          fontSize: "102px",
          lineHeight: 0.9,
          letterSpacing: "-7px",
          fontWeight: 700,
          color: "#63ff7c"
        }
      }, "KILL YOUR SAAS?")
    ]),
    el("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: "24px",
        borderTop: "1px solid #313831",
        color: "#9ca59a",
        fontFamily: "JetBrains Mono",
        fontSize: "18px"
      }
    }, [
      el("span", {}, "YES / KINDA / NOT REALLY"),
      el("span", { style: { color: "#63ff7c" } }, "COPY THE ONE-SHOT BUILD >>")
    ])
  ]);
}

function appCard(app) {
  const verdict = verdictStyle[app.verdict];
  return frame([
    brandBar(`// ${app.category.toUpperCase()}`),
    el("div", {
      style: {
        display: "flex",
        alignItems: "center",
        flex: 1,
        gap: "42px"
      }
    }, [
      el("img", {
        src: dataUri(iconSvg(app, 154)),
        width: 154,
        height: 154,
        style: { borderRadius: "24px" }
      }),
      el("div", { style: { display: "flex", flexDirection: "column", flex: 1 } }, [
        el("span", {
          style: {
            color: "#7f897d",
            fontFamily: "JetBrains Mono",
            fontSize: "19px",
            letterSpacing: "2px"
          }
        }, `CAN I REPLACE ${app.name.toUpperCase()}?`),
        el("span", {
          style: {
            marginTop: "10px",
            color: verdict.color,
            fontSize: "72px",
            fontWeight: 700,
            letterSpacing: "-4px",
            lineHeight: 1
          }
        }, verdict.text)
      ])
    ]),
    el("div", {
      style: {
        display: "flex",
        justifyContent: "space-between",
        paddingTop: "24px",
        borderTop: "1px solid #313831",
        color: "#9ca59a",
        fontFamily: "JetBrains Mono",
        fontSize: "19px"
      }
    }, [
      el("span", {}, `${app.domain} · $${app.priceMonthly}/MO`),
      el("span", { style: { color: "#63ff7c" } }, "GET THE PROMPT >>")
    ])
  ]);
}

async function renderPng(tree, width, height, target) {
  const svg = await satori(tree, {
    width,
    height,
    fonts: [
      { name: "Space Grotesk", data: spaceRegular, weight: 400, style: "normal" },
      { name: "Space Grotesk", data: spaceBold, weight: 700, style: "normal" },
      { name: "JetBrains Mono", data: monoBold, weight: 700, style: "normal" }
    ]
  });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng();
  await writeFile(target, png);
}

await renderPng(homeCard(), 1200, 630, join(ogDir, "home.png"));

for (const app of apps) {
  const icon = new Resvg(iconSvg(app), {
    fitTo: { mode: "width", value: 128 }
  }).render().asPng();
  await writeFile(join(faviconDir, `${app.slug}.png`), icon);
  await renderPng(appCard(app), 1200, 630, join(ogDir, `${app.slug}.png`));
}

const faviconTree = el("div", {
  style: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "64px",
    height: "64px",
    border: "4px solid #63ff7c",
    color: "#63ff7c",
    background: "#070907",
    fontFamily: "JetBrains Mono",
    fontSize: "27px",
    fontWeight: 700
  }
}, "C?");
await renderPng(faviconTree, 64, 64, join(publicDir, "favicon.png"));

console.log(`Generated ${apps.length + 1} OG cards and ${apps.length} app icons.`);

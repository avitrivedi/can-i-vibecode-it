import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

test("every app JSON has the required shape", async () => {
  const dir = join(root, "data", "apps");
  const files = (await readdir(dir)).filter((file) => file.endsWith(".json"));
  assert.ok(files.length >= 10);

  for (const file of files) {
    const app = JSON.parse(await readFile(join(dir, file), "utf8"));
    assert.equal(typeof app.slug, "string");
    assert.equal(typeof app.name, "string");
    assert.equal(typeof app.domain, "string");
    assert.equal(typeof app.category, "string");
    assert.equal(typeof app.priceMonthly, "number");
    assert.ok(["yes", "kinda", "no"].includes(app.verdict));
    assert.ok(Array.isArray(app.whatYouLose));
    assert.ok(Array.isArray(app.priorArt));
    assert.equal(typeof app.prompt, "string");
    assert.equal(typeof app.notes, "string");
    assert.ok(app.prompt.length > 200);
  }
});

test("generated social and app images exist", async () => {
  await access(join(root, "public", "og", "home.png"));
  await access(join(root, "public", "favicon.png"));
  await access(join(root, "public", "favicons", "notion.png"));
  await access(join(root, "public", "og", "notion.png"));
});

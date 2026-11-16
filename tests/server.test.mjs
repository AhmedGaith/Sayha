import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { projectRoot, startServer, stopServer } from "./helpers/server.mjs";

let baseUrl;
let child;

before(async () => {
  ({ baseUrl, child } = await startServer());
});

after(() => stopServer(child));

const postJson = (route, body) =>
  fetch(`${baseUrl}${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });

test("GET /api/health reports the server is ready", async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.provider, "groq");
  assert.equal(typeof body.hasKey, "boolean");
});

test("POST /api/ask-ai rejects an empty message", async () => {
  const res = await postJson("/api/ask-ai", {});
  assert.equal(res.status, 400);

  const body = await res.json();
  assert.equal(typeof body.error, "string");
  assert.ok(body.error.length > 0);
});

test("POST /api/camping-plan requires a location and time period", async () => {
  const res = await postJson("/api/camping-plan", { location: "الجبل" });
  assert.equal(res.status, 400);

  const body = await res.json();
  assert.equal(typeof body.error, "string");
});

test("POST /api/verify-mission rejects an unknown mission", async () => {
  const res = await postJson("/api/verify-mission", {
    missionId: "not-a-real-mission",
    imageBase64: "aGVsbG8=",
  });
  assert.equal(res.status, 400);

  const body = await res.json();
  assert.equal(typeof body.error, "string");
});

test("POST /api/identify-item requires an image", async () => {
  const res = await postJson("/api/identify-item", {});
  assert.equal(res.status, 400);

  const body = await res.json();
  assert.equal(typeof body.error, "string");
});

test("unknown API routes return a JSON 404", async () => {
  const res = await fetch(`${baseUrl}/api/does-not-exist`);
  assert.equal(res.status, 404);
  assert.match(res.headers.get("content-type") ?? "", /application\/json/);

  const body = await res.json();
  assert.equal(typeof body.error, "string");
});

const builtClientExists = existsSync(path.join(projectRoot, "client", "dist", "index.html"));

test("serves the built client", { skip: !builtClientExists }, async () => {
  const page = await fetch(`${baseUrl}/`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get("content-type") ?? "", /text\/html/);
  assert.match(await page.text(), /AI Scout Adventure/);

  const asset = await fetch(`${baseUrl}/backgroud.jpg`);
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get("content-type") ?? "", /image\/jpeg/);
});

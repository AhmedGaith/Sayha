import test from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { once } from "node:events";

async function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function isReachable(url, attempts = 20) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(250) });
      if (res.ok) return true;
    } catch {
      // Nothing is listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return false;
}

test(
  "the Vercel entry can import the app without starting a listener",
  { timeout: 15_000 },
  async () => {
    const importPort = await getFreePort();
    process.env.PORT = String(importPort);

    const { default: app } = await import("../server/index.js");
    const { default: vercelApp } = await import("../api/index.js");

    assert.equal(vercelApp, app, "api/index.js must export the Express app");

    assert.equal(
      await isReachable(`http://127.0.0.1:${importPort}/api/health`),
      false,
      "importing the app for Vercel must not call app.listen()",
    );

    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const { port } = server.address();

    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/health`);
      assert.equal(res.status, 200);

      const body = await res.json();
      assert.equal(body.ok, true);
      assert.equal(body.provider, "groq");
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  },
);

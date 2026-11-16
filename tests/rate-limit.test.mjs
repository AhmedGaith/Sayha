import test from "node:test";
import assert from "node:assert/strict";
import { startServer, stopServer } from "./helpers/server.mjs";

test("AI endpoints return 429 after the configured rate limit", { timeout: 20_000 }, async (t) => {
  const { baseUrl, child } = await startServer({
    RATE_LIMIT_MAX: "3",
    RATE_LIMIT_WINDOW_MS: "60000",
  });
  t.after(() => stopServer(child));

  const postAskAi = (body) =>
    fetch(`${baseUrl}/api/ask-ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

  for (let requestNumber = 1; requestNumber <= 3; requestNumber += 1) {
    const res = await postAskAi({});
    assert.equal(res.status, 400, `request ${requestNumber} should be validated, not limited`);
  }

  const limited = await postAskAi({});
  assert.equal(limited.status, 429);

  const body = await limited.json();
  assert.equal(typeof body.error, "string");
  assert.ok(body.error.length > 0);
});

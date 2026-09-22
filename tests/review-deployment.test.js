import { test } from "node:test";
import assert from "node:assert/strict";
import handler from "../api/index.js";

test("review deployment blocks intake before production configuration or database access", async () => {
  const overrides = {
    ARUNIA_REVIEW_ONLY: "true",
    NODE_ENV: "production",
    APP_ORIGIN: "https://arunia.vercel.app",
    DATABASE_URL: "invalid-protocol://must-not-connect",
    APP_DEMO: "false",
    OPERATIONS_READY: "true",
    PAYMENT_MODE: "disabled",
  };
  const previous = new Map(
    Object.keys(overrides).map((key) => [key, process.env[key]]),
  );
  Object.assign(process.env, overrides);
  try {
    for (const [method, url] of [
      ["POST", "/api/requests"],
      ["GET", "/api/auth/google/callback?code=unused&state=unused"],
    ]) {
      let status, body;
      const res = {
        status(value) {
          status = value;
          return this;
        },
        json(value) {
          body = value;
          return this;
        },
      };
      await handler({ method, url }, res);
      assert.equal(status, 503);
      assert.equal(body.code, "REVIEW_ONLY");
      assert.match(body.error, /회원가입·상담 신청·결제를 받지 않습니다/);
    }
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

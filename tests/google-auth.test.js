import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, randomUUID, sign } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { OAuth2Client } from "google-auth-library";
import { createApp, configuration, passwordHash } from "../server/app.js";
import { createGoogleProvider, googleNext } from "../server/google-auth.js";
import { many, one, run } from "../server/db.js";

const ORIGIN = "http://localhost:4173";
const CLIENT_ID = "test-arunia.apps.googleusercontent.com";
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
});
const cert = publicKey.export({ type: "spki", format: "pem" });
const hash = (value) => createHash("sha256").update(value).digest("hex");
function idToken(claims, invalidSignature = false) {
  const head = Buffer.from(
    JSON.stringify({ alg: "RS256", kid: "test-key", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = sign(
    "RSA-SHA256",
    Buffer.from(head + "." + body),
    privateKey,
  );
  if (invalidSignature) signature[0] ^= 1;
  return head + "." + body + "." + signature.toString("base64url");
}

async function fixture({ configured = true, demo = true, ready = false } = {}) {
  const dir = await mkdtemp(join(tmpdir(), "arunia-google-test-"));
  const config = {
    production: false,
    origin: ORIGIN,
    database: "file:" + join(dir, "auth.db"),
    paymentMode: "disabled",
    demo,
    ready,
    googleClientId: configured ? CLIENT_ID : "",
    googleClientSecret: configured ? "test-server-only-secret" : "",
  };
  const exchanges = [];
  const codes = new Map();
  // Exercise the real library's authorization URL and JWT verification. Only
  // Google's network token exchange and public certificate fetch are mocked.
  const client = new OAuth2Client(
    config.googleClientId,
    config.googleClientSecret,
    ORIGIN + "/api/auth/google/callback",
  );
  client.getToken = async (args) => {
    exchanges.push(args);
    const item = codes.get(args.code);
    if (!item) throw new Error("invalid grant");
    assert.equal(args.redirect_uri, ORIGIN + "/api/auth/google/callback");
    assert.equal(
      createHash("sha256").update(args.codeVerifier).digest("base64url"),
      item.challenge,
    );
    return {
      tokens: {
        id_token: idToken(item.claims, item.invalidSignature),
        access_token: "secret-access-token-that-must-not-be-persisted",
      },
    };
  };
  client.getFederatedSignonCertsAsync = async () => ({
    certs: { "test-key": cert },
  });
  const provider = createGoogleProvider(config, client);
  const { app, db } = await createApp({ config, googleProvider: provider });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const request = async (path, body, cookie, origin = ORIGIN) => {
    const response = await fetch(base + "/api" + path, {
      method: body === undefined ? "GET" : "POST",
      redirect: "manual",
      headers: {
        ...(body === undefined
          ? {}
          : {
              "Content-Type": "application/json",
              ...(origin ? { Origin: origin } : {}),
            }),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const cookies = response.headers.getSetCookie();
    const text = await response.text();
    return {
      status: response.status,
      body: response.headers.get("content-type")?.includes("application/json")
        ? JSON.parse(text)
        : text,
      location: response.headers.get("location"),
      cookies,
      cookie: cookies
        .filter((value) => !value.includes("Expires=Thu, 01 Jan 1970"))
        .map((value) => value.split(";")[0])
        .join("; "),
    };
  };
  const start = async (next = "/account", claims = {}, previousCookie) => {
    const response = await request(
      "/auth/google/start",
      { next, consent: true },
      previousCookie,
    );
    assert.equal(response.status, 200, JSON.stringify(response));
    const url = new URL(response.body.url);
    const code = randomUUID();
    codes.set(code, {
      challenge: url.searchParams.get("code_challenge"),
      claims: {
        iss: "https://accounts.google.com",
        aud: CLIENT_ID,
        sub: "google-member-123",
        email: "member@example.com",
        email_verified: true,
        name: "테스트 회원",
        nonce: url.searchParams.get("nonce"),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        ...claims,
      },
    });
    return {
      response,
      url,
      state: url.searchParams.get("state"),
      cookie: response.cookie,
      code,
      callback:
        "/auth/google/callback?" +
        new URLSearchParams({
          state: url.searchParams.get("state"),
          code,
        }),
    };
  };
  return {
    config,
    db,
    request,
    start,
    exchanges,
    codes,
    close: async () => {
      await new Promise((resolve) => server.close(resolve));
      db.close();
      await rm(dir, { recursive: true, force: true });
    },
  };
}

test("Google OAuth: same-origin consent, PKCE, verified member, durable consent and rotating session", async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request("/bootstrap")).body.auth.googleEnabled, true);
    const wrongOrigin = await f.request(
      "/auth/google/start",
      { consent: true },
      undefined,
      "https://other.example",
    );
    assert.equal(wrongOrigin.status, 403);
    assert.equal(
      (await f.request("/auth/google/start", { consent: false })).status,
      400,
    );
    const flow = await f.start("/request?service=individual");
    assert.equal(flow.url.origin, "https://accounts.google.com");
    assert.equal(flow.url.searchParams.get("client_id"), CLIENT_ID);
    assert.equal(flow.url.searchParams.get("scope"), "openid email profile");
    assert.equal(flow.url.searchParams.get("code_challenge_method"), "S256");
    assert.equal(flow.url.searchParams.get("access_type"), "online");
    assert.ok(flow.response.cookies[0].includes("HttpOnly"));
    assert.ok(flow.response.cookies[0].includes("SameSite=Lax"));
    assert.ok(!flow.response.body.url.includes(f.config.googleClientSecret));
    const callback = await f.request(flow.callback, undefined, flow.cookie);
    assert.equal(callback.status, 303);
    assert.equal(callback.location, "/request?service=individual");
    const bootstrap = await f.request("/bootstrap", undefined, callback.cookie);
    assert.equal(bootstrap.body.user.email, "member@example.com");
    assert.equal(bootstrap.body.user.role, "member");
    assert.equal(bootstrap.body.user.hasPassword, false);
    assert.equal(
      JSON.stringify(bootstrap.body).includes("!google-only"),
      false,
    );
    const consent = await one(f.db, "SELECT * FROM auth_consents");
    assert.equal(consent.user_id, bootstrap.body.user.id);
    assert.ok(consent.version.startsWith("google-signin-"));
    assert.ok(!Number.isNaN(Date.parse(consent.accepted)));
    assert.equal((await many(f.db, "SELECT * FROM oauth_states")).length, 0);

    const returning = await f.start("/account", {}, callback.cookie);
    const second = await f.request(
      returning.callback,
      undefined,
      returning.cookie + "; " + callback.cookie,
    );
    const after = await f.request("/bootstrap", undefined, second.cookie);
    assert.equal(after.body.user.id, bootstrap.body.user.id);
    assert.equal((await many(f.db, "SELECT * FROM users")).length, 1);
    assert.equal((await many(f.db, "SELECT * FROM auth_consents")).length, 1);
    assert.equal(
      (await f.request("/bootstrap", undefined, callback.cookie)).body.user,
      null,
    );
    assert.equal(f.exchanges.length, 2);
  } finally {
    await f.close();
  }
});

test("Google OAuth: state is cookie-bound, expires and cannot be replayed", async () => {
  const f = await fixture();
  try {
    const flow = await f.start();
    const missing = await f.request(flow.callback);
    assert.equal(missing.location, "/login?error=google_expired");
    const other = await f.start();
    const wrong = await f.request(flow.callback, undefined, other.cookie);
    assert.equal(wrong.location, "/login?error=google_expired");
    assert.equal(f.exchanges.length, 0);
    const valid = await f.request(flow.callback, undefined, flow.cookie);
    assert.equal(valid.location, "/account");
    const replay = await f.request(flow.callback, undefined, flow.cookie);
    assert.equal(replay.location, "/login?error=google_expired");
    assert.equal(f.exchanges.length, 1);
    await run(f.db, "UPDATE oauth_states SET expires=? WHERE hash=?", [
      Date.now() - 1,
      hash(other.state),
    ]);
    assert.equal(
      (await f.request(other.callback, undefined, other.cookie)).location,
      "/login?error=google_expired",
    );
    assert.equal(f.exchanges.length, 1);
  } finally {
    await f.close();
  }
});

test("Google OAuth: simultaneous callbacks consume a state at most once", async () => {
  const f = await fixture();
  try {
    const flow = await f.start();
    const results = await Promise.all([
      f.request(flow.callback, undefined, flow.cookie),
      f.request(flow.callback, undefined, flow.cookie),
    ]);
    assert.deepEqual(
      results.map((r) => r.location).sort(),
      ["/account", "/login?error=google_expired"].sort(),
    );
    assert.equal(f.exchanges.length, 1);
    assert.equal((await many(f.db, "SELECT * FROM users")).length, 1);
  } finally {
    await f.close();
  }
});

test("Google OAuth: real Google verifier rejects signature, issuer, audience, expiration; app rejects nonce/unverified email", async () => {
  const f = await fixture();
  try {
    const invalidClaims = [
      { aud: "attacker-client" },
      { iss: "https://attacker.example" },
      { exp: Math.floor(Date.now() / 1000) - 3600 },
      { nonce: "incorrect-nonce" },
      { email_verified: false },
      { sub: "" },
    ];
    for (const claims of invalidClaims) {
      const flow = await f.start("/account", claims);
      const result = await f.request(flow.callback, undefined, flow.cookie);
      assert.equal(result.location, "/login?error=google_failed");
      assert.equal(result.cookie, "");
    }
    const badSignature = await f.start();
    f.codes.get(badSignature.code).invalidSignature = true;
    assert.equal(
      (await f.request(badSignature.callback, undefined, badSignature.cookie))
        .location,
      "/login?error=google_failed",
    );
    assert.equal((await many(f.db, "SELECT * FROM users")).length, 0);
    assert.equal((await many(f.db, "SELECT * FROM sessions")).length, 0);
  } finally {
    await f.close();
  }
});

test("Google OAuth: existing local member/admin emails cannot be linked or taken over", async () => {
  const f = await fixture();
  try {
    for (const role of ["member", "admin"]) {
      const email = role + "@example.com";
      await run(f.db, "INSERT INTO users VALUES(?,?,?,?,?,?)", [
        role,
        email,
        role,
        await passwordHash("known-password-1234"),
        role,
        new Date().toISOString(),
      ]);
      const flow = await f.start("/account", { email, sub: "google-" + role });
      const result = await f.request(flow.callback, undefined, flow.cookie);
      assert.equal(result.location, "/login?error=existing_account");
      assert.equal(result.cookie, "");
      assert.equal(
        (
          await f.request("/auth/login", {
            email,
            password: "known-password-1234",
          })
        ).body.user.hasPassword,
        true,
      );
    }
    assert.equal(
      (await many(f.db, "SELECT * FROM oauth_identities")).length,
      0,
    );
    assert.equal((await many(f.db, "SELECT * FROM users")).length, 2);
  } finally {
    await f.close();
  }
});

test("Google-only accounts cannot authenticate or set a password through legacy endpoints", async () => {
  const f = await fixture();
  try {
    const flow = await f.start();
    const result = await f.request(flow.callback, undefined, flow.cookie);
    const login = await f.request("/auth/login", {
      email: "member@example.com",
      password: "!google-only",
    });
    assert.equal(login.status, 401);
    const update = await f.request(
      "/auth/password",
      { current: "", password: "new-password-12345" },
      result.cookie,
    );
    assert.equal(update.status, 400);
    assert.match(update.body.error, /구글/);
    await run(f.db, "UPDATE users SET password='malformed' WHERE email=?", [
      "member@example.com",
    ]);
    assert.equal(
      (
        await f.request("/auth/login", {
          email: "member@example.com",
          password: "other-password-12345",
        })
      ).status,
      401,
    );
    assert.equal(
      (await f.request("/auth/logout", {}, result.cookie)).status,
      200,
    );
    assert.equal(
      (await f.request("/bootstrap", undefined, result.cookie)).body.user,
      null,
    );
  } finally {
    await f.close();
  }
});

test("Google OAuth: cancellation and disabled/unready configuration fail closed", async () => {
  for (const options of [
    { configured: false },
    { demo: false, ready: false },
  ]) {
    const f = await fixture(options);
    try {
      assert.equal(
        (await f.request("/bootstrap")).body.auth.googleEnabled,
        false,
      );
      assert.equal(
        (await f.request("/auth/google/start", { consent: true })).status,
        503,
      );
      const result = await f.request(
        "/auth/google/callback?code=fake&state=fake",
      );
      assert.equal(result.status, 303);
      assert.ok(result.location.startsWith("/login?error=google_"));
      assert.equal((await many(f.db, "SELECT * FROM users")).length, 0);
    } finally {
      await f.close();
    }
  }
  const f = await fixture();
  try {
    const flow = await f.start();
    const cancelled = await f.request(
      "/auth/google/callback?" +
        new URLSearchParams({
          state: flow.state,
          error: "access_denied",
        }),
      undefined,
      flow.cookie,
    );
    assert.equal(cancelled.location, "/login?error=google_cancelled");
    assert.equal(f.exchanges.length, 0);
    assert.equal(
      (await f.request(flow.callback, undefined, flow.cookie)).location,
      "/login?error=google_expired",
    );
  } finally {
    await f.close();
  }
});

test("Google OAuth: redirect destinations are allowlisted, including encoded bypasses", async () => {
  for (const next of [
    "https://attacker.example",
    "//attacker.example",
    "/\\attacker.example",
    "/%2Fattacker.example",
    "/%5cattacker.example",
    "%2F%2Fattacker.example",
    "/%252F%252Fattacker.example",
    "/request%0d%0aLocation:evil",
    "/request#https://attacker.example",
    "/request/../auth/google/start",
    "/admin",
    "/login",
    "/request%zz",
  ])
    assert.equal(googleNext(next), "/account", next);
  assert.equal(
    googleNext("/request?service=individual"),
    "/request?service=individual",
  );
  const f = await fixture();
  try {
    const flow = await f.start("//attacker.example");
    assert.equal(
      (await f.request(flow.callback, undefined, flow.cookie)).location,
      "/account",
    );
  } finally {
    await f.close();
  }
});

test("Google OAuth: configured origins must be exact HTTPS origins or local HTTP", () => {
  const credentials = {
    GOOGLE_CLIENT_ID: CLIENT_ID,
    GOOGLE_CLIENT_SECRET: "server-only-test-secret",
  };
  for (const origin of [
    "http://example.com",
    "https://example.com/",
    "https://example.com/path",
    "https://user:pass@example.com",
    "https://example.com?next=other",
    "not-a-url",
  ])
    assert.throws(() => configuration({ ...credentials, APP_ORIGIN: origin }));
  assert.equal(
    configuration({ ...credentials, APP_ORIGIN: "https://arunia.example" })
      .origin,
    "https://arunia.example",
  );
  assert.equal(
    configuration({ ...credentials, APP_ORIGIN: ORIGIN }).origin,
    ORIGIN,
  );
  assert.equal(configuration({}).googleClientId, "");
});

import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { one, run } from "./db.js";

const COOKIE = "arunia_google_state";
const COOKIE_PATH = "/api/auth/google";
const TTL = 10 * 60 * 1000;
const CONSENT_VERSION = "google-signin-2026-09-22";
const digest = (value) => createHash("sha256").update(value).digest("hex");
const random = () => randomBytes(32).toString("base64url");
const fail = (code) => Object.assign(new Error(code), { oauthCode: code });

export function googleConfigured(config) {
  return Boolean(config.googleClientId && config.googleClientSecret);
}

export function validateGoogleOrigin(config) {
  if (!googleConfigured(config)) return;
  let url;
  try {
    url = new URL(config.origin);
  } catch {
    throw new Error("Google login requires a valid APP_ORIGIN.");
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    url.origin !== config.origin ||
    url.username ||
    url.password ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && local))
  )
    throw new Error(
      "Google login requires an exact HTTPS APP_ORIGIN without a path or trailing slash (HTTP localhost is allowed).",
    );
}

// Destinations are application routes, never arbitrary URLs. Encoded slashes,
// control characters and backslashes cannot become a redirect destination.
export function googleNext(value) {
  if (typeof value !== "string" || value.length > 1500) return "/account";
  let decoded;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return "/account";
  }
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/.test(value) ||
    /[\\\u0000-\u0020\u007f]/.test(decoded) ||
    decoded.startsWith("//")
  )
    return "/account";
  const url = new URL(value, "https://arunia.invalid");
  if (
    url.origin !== "https://arunia.invalid" ||
    !["/account", "/request"].includes(url.pathname) ||
    url.hash
  )
    return "/account";
  return url.pathname + url.search;
}

// An injected client is solely a programmatic test seam. Production always
// uses Google's library for code exchange, signatures, expiry, issuer and aud.
export function createGoogleProvider(config, client) {
  const redirectUri = config.origin + "/api/auth/google/callback";
  const oauth =
    client ||
    new OAuth2Client(
      config.googleClientId,
      config.googleClientSecret,
      redirectUri,
    );
  return {
    authorizationUrl({ state, nonce, challenge }) {
      return oauth.generateAuthUrl({
        scope: ["openid", "email", "profile"],
        state,
        nonce,
        code_challenge: challenge,
        code_challenge_method: "S256",
        prompt: "select_account",
        access_type: "online",
        redirect_uri: redirectUri,
      });
    },
    async identity({ code, codeVerifier }) {
      const { tokens } = await oauth.getToken({
        code,
        codeVerifier,
        redirect_uri: redirectUri,
      });
      if (!tokens.id_token) throw fail("google_failed");
      const ticket = await oauth.verifyIdToken({
        idToken: tokens.id_token,
        audience: config.googleClientId,
      });
      return ticket.getPayload();
    },
  };
}

function claimsIdentity(claims, nonce) {
  const identity = z
    .object({
      sub: z.string().min(1).max(255),
      email: z.string().email().max(254),
      email_verified: z.literal(true),
      nonce: z.string().min(1).max(255),
      name: z.string().max(255).optional(),
    })
    .parse(claims);
  const received = Buffer.from(identity.nonce);
  const expected = Buffer.from(nonce);
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  )
    throw fail("google_failed");
  return {
    subject: identity.sub,
    email: identity.email.toLowerCase(),
    name: identity.name?.trim().slice(0, 40) || "어른이아 회원",
  };
}

async function findOrCreateUser(db, identity, acceptedAt) {
  const tx = await db.transaction("write");
  try {
    // Google subject, not a mutable email, is the identity key. Existing local
    // accounts require their original login and are never linked by email.
    let user = await one(
      tx,
      "SELECT u.* FROM users u JOIN oauth_identities i ON u.id=i.user_id WHERE i.provider='google' AND i.subject=?",
      [identity.subject],
    );
    if (!user) {
      if (
        await one(tx, "SELECT id FROM users WHERE lower(email)=?", [
          identity.email,
        ])
      )
        throw fail("existing_account");
      user = {
        id: randomUUID(),
        email: identity.email,
        name: identity.name,
        password: "!google-only",
        role: "member",
        created: new Date().toISOString(),
      };
      await run(
        tx,
        "INSERT INTO users(id,email,name,password,role,created) VALUES(?,?,?,?,?,?)",
        [
          user.id,
          user.email,
          user.name,
          user.password,
          user.role,
          user.created,
        ],
      );
      await run(
        tx,
        "INSERT INTO oauth_identities(provider,subject,user_id,created) VALUES('google',?,?,?)",
        [identity.subject, user.id, user.created],
      );
      await run(
        tx,
        "INSERT INTO auth_consents(id,user_id,version,accepted,source) VALUES(?,?,?,?,'google')",
        [randomUUID(), user.id, CONSENT_VERSION, acceptedAt],
      );
    }
    await tx.commit();
    return user;
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally {
    tx.close();
  }
}

export function registerGoogleAuth({
  app,
  db,
  config,
  enabled,
  throttle,
  session,
  provider,
}) {
  validateGoogleOrigin(config);
  const configured = googleConfigured(config);
  const google = configured ? provider || createGoogleProvider(config) : null;
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: config.production || config.origin.startsWith("https://"),
    path: COOKIE_PATH,
  };
  app.post("/api/auth/google/start", async (req, res) => {
    enabled();
    if (!google)
      return res
        .status(503)
        .json({ error: "구글 로그인 연결을 준비하고 있습니다." });
    const input = z
      .object({
        next: z.string().max(1500).optional(),
        consent: z.literal(true),
      })
      .strict()
      .parse(req.body);
    await throttle("google-start:" + req.clientAddress, 30);
    const state = random();
    const binding = random();
    const nonce = random();
    const verifier = randomBytes(64).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    await run(db, "DELETE FROM oauth_states WHERE expires<=?", [Date.now()]);
    await run(
      db,
      "INSERT INTO oauth_states(hash,binding_hash,nonce,verifier,next,expires,consented) VALUES(?,?,?,?,?,?,?)",
      [
        digest(state),
        digest(binding),
        nonce,
        verifier,
        googleNext(input.next),
        Date.now() + TTL,
        new Date().toISOString(),
      ],
    );
    const url = google.authorizationUrl({ state, nonce, challenge });
    res.cookie(COOKIE, binding, { ...cookieOptions, maxAge: TTL });
    res.json({ url });
  });
  app.get("/api/auth/google/callback", async (req, res) => {
    res.set("Referrer-Policy", "no-referrer");
    res.clearCookie(COOKIE, cookieOptions);
    const redirectError = (code) => res.redirect(303, "/login?error=" + code);
    if (!google) return redirectError("google_unavailable");
    try {
      enabled();
      await throttle("google-callback:" + req.clientAddress, 60);
      const state = req.query.state;
      const binding = req.headers.cookie
        ?.split(";")
        .map((part) => part.trim())
        .find((part) => part.startsWith(COOKIE + "="))
        ?.slice(COOKIE.length + 1);
      if (
        typeof state !== "string" ||
        !/^[A-Za-z0-9_-]{43}$/.test(state) ||
        !binding ||
        !/^[A-Za-z0-9_-]{43}$/.test(binding)
      )
        throw fail("google_expired");
      // A single atomic delete makes the state single-use across processes and
      // serverless instances, including simultaneous callback replays.
      const pending = await one(
        db,
        "DELETE FROM oauth_states WHERE hash=? AND binding_hash=? AND expires>? RETURNING *",
        [digest(state), digest(binding), Date.now()],
      );
      if (!pending) throw fail("google_expired");
      if (req.query.error)
        throw fail(
          req.query.error === "access_denied"
            ? "google_cancelled"
            : "google_failed",
        );
      if (
        typeof req.query.code !== "string" ||
        !req.query.code ||
        req.query.code.length > 4096
      )
        throw fail("google_failed");
      const claims = await google.identity({
        code: req.query.code,
        codeVerifier: pending.verifier,
      });
      const identity = claimsIdentity(claims, pending.nonce);
      const user = await findOrCreateUser(db, identity, pending.consented);
      await session(req, res, user);
      return res.redirect(303, googleNext(pending.next));
    } catch (error) {
      // Provider errors can include token request details; never log or expose
      // their messages, response bodies, authorization codes, or tokens.
      const known = ["existing_account", "google_cancelled", "google_expired"];
      return redirectError(
        known.includes(error.oauthCode) ? error.oauthCode : "google_failed",
      );
    }
  });
}

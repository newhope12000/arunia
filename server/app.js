import express from "express";
import {
  randomBytes,
  randomUUID,
  createHash,
  scrypt as scryptCb,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { connect, one, many, run } from "./db.js";
const scrypt = promisify(scryptCb),
  now = () => new Date().toISOString(),
  id = () => randomUUID(),
  hash = (s) => createHash("sha256").update(s).digest("hex");
export async function passwordHash(value) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await scrypt(value, salt, 64)).toString("hex")}`;
}
async function passwordOK(value, stored) {
  const [salt, key] = stored.split(":");
  return timingSafeEqual(
    await scrypt(value, salt, 64),
    Buffer.from(key, "hex"),
  );
}
export function configuration(env = process.env) {
  const production = env.NODE_ENV === "production";
  const config = {
    production,
    vercel: env.VERCEL === "1",
    demo: env.APP_DEMO === "true",
    origin: env.APP_ORIGIN || "http://localhost:4173",
    database: env.DATABASE_URL || "file:.data/arunia.db",
    dbToken: env.DATABASE_AUTH_TOKEN,
    paymentMode: env.PAYMENT_MODE || "disabled",
    clientKey: env.TOSS_CLIENT_KEY || "",
    secretKey: env.TOSS_SECRET_KEY || "",
    ready: env.OPERATIONS_READY === "true",
  };
  if (
    production &&
    (!env.APP_ORIGIN?.startsWith("https://") ||
      !env.DATABASE_URL ||
      env.DATABASE_URL.startsWith("file:"))
  )
    throw new Error(
      "Production requires APP_ORIGIN=https://… and a durable remote DATABASE_URL.",
    );
  if (config.paymentMode === "mock" && !config.demo)
    throw new Error("Mock payments require explicit APP_DEMO=true.");
  if (
    config.paymentMode === "toss_live" &&
    (config.demo ||
      !config.ready ||
      !config.secretKey.startsWith("live_") ||
      !config.clientKey.startsWith("live_"))
  )
    throw new Error(
      "Live payments require ready operations, a live key pair and APP_DEMO=false.",
    );
  if (
    config.paymentMode === "toss_test" &&
    (!config.secretKey.startsWith("test_") ||
      !config.clientKey.startsWith("test_"))
  )
    throw new Error("Toss test mode requires a test key pair.");
  return config;
}
function failure(status, message) {
  return Object.assign(new Error(message), { status });
}
const short = z.string().trim().min(1).max(120);
const bounded = (max) => z.string().trim().min(1).max(max);
const safeUser = (u) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
});
const services = [
  {
    id: "individual",
    name: "개인상담",
    description: "정리되지 않은 마음부터, 내 속도로.",
    image: "arunia-individual.jpg",
    tag: "ONE ON ONE",
  },
  {
    id: "assessment",
    name: "심리검사",
    description: "나를 이해하는 또 하나의 방법.",
    image: "arunia-self-understanding.jpg",
    tag: "SELF DISCOVERY",
  },
  {
    id: "group",
    name: "함께하는 프로그램",
    description: "서로 다른 이야기가 만나는 시간.",
    image: "arunia-small-group.jpg",
    tag: "TOGETHER",
  },
];
export async function createApp(options = {}) {
  const config = options.config || configuration();
  const db = options.db || (await connect(config.database, config.dbToken));
  const content = JSON.parse(
    await readFile(new URL("./content.json", import.meta.url), "utf8"),
  );
  if (config.demo)
    for (const c of content.counselors)
      await run(
        db,
        "INSERT OR IGNORE INTO counselors(id,data,demo) VALUES(?,?,1)",
        [c.id, JSON.stringify(c)],
      );
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.set({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "X-Frame-Options": "DENY",
      "Cache-Control": "no-store",
    });
    next();
  });
  app.use("/api", express.json({ limit: "20kb" }));
  app.use("/api", async (req, res, next) => {
    try {
      req.clientAddress = config.vercel
        ? String(req.headers["x-vercel-forwarded-for"] || req.ip)
            .split(",")[0]
            .trim()
        : req.ip;
      if (config.demo) res.set("X-Robots-Tag", "noindex, nofollow");
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        if (req.headers.origin !== config.origin)
          throw failure(403, "허용되지 않은 요청 출처입니다.");
        if (!req.is("application/json"))
          throw failure(415, "JSON 요청이 필요합니다.");
      }
      const cookie = req.headers.cookie
        ?.split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith("arunia_session="))
        ?.slice(15);
      if (cookie && /^[a-f0-9]{64}$/.test(cookie))
        req.user = await one(
          db,
          "SELECT u.* FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.hash=? AND s.expires>?",
          [hash(cookie), Date.now()],
        );
      next();
    } catch (e) {
      next(e);
    }
  });
  const member = (req, res, next) =>
    req.user ? next() : next(failure(401, "로그인이 필요합니다."));
  const admin = (req, res, next) =>
    req.user?.role === "admin"
      ? next()
      : next(failure(403, "운영자 권한이 필요합니다."));
  const enabled = () => {
    if (!config.demo && !config.ready)
      throw failure(
        503,
        "운영 정보 확인 중입니다. 정식 신청은 준비 후 열립니다.",
      );
  };
  const audit = async (actor, action, object) =>
    run(db, "INSERT INTO audit VALUES(?,?,?,?,?)", [
      id(),
      actor,
      action,
      object,
      now(),
    ]);
  async function throttle(key, max) {
    const result = await run(
      db,
      `INSERT INTO limits VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<? THEN 1 ELSE count+1 END,expires=CASE WHEN expires<? THEN excluded.expires ELSE expires END RETURNING count`,
      [key, Date.now() + 900000, Date.now(), Date.now()],
    );
    if (result.rows[0].count > max)
      throw failure(429, "요청이 많습니다. 15분 후 다시 시도해 주세요.");
  }
  async function session(req, res, u) {
    const previous = req.headers.cookie
      ?.split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("arunia_session="))
      ?.slice(15);
    if (previous)
      await run(db, "DELETE FROM sessions WHERE hash=?", [hash(previous)]);
    const token = randomBytes(32).toString("hex");
    await run(db, "INSERT INTO sessions VALUES(?,?,?)", [
      hash(token),
      u.id,
      Date.now() + 7 * 86400000,
    ]);
    res.cookie("arunia_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: config.production,
      maxAge: 7 * 86400000,
      path: "/",
    });
  }
  const counselors = async () =>
    (
      await many(
        db,
        "SELECT * FROM counselors WHERE active=1 AND (demo=0 OR ?=1)",
        [config.demo ? 1 : 0],
      )
    ).map((c) => ({ ...JSON.parse(c.data), id: c.id, demo: !!c.demo }));
  const requestView = async (r) => ({
    ...r,
    data: JSON.parse(r.data),
    support: await many(
      db,
      "SELECT * FROM support WHERE request_id=? ORDER BY created DESC",
      [r.id],
    ),
    counselor: r.counselor_id
      ? (await counselors()).find((c) => c.id === r.counselor_id)
      : null,
    order: await one(
      db,
      "SELECT id,amount,provider,status,receipt FROM orders WHERE request_id=? ORDER BY created DESC LIMIT 1",
      [r.id],
    ),
  });
  const owned = async (req, table, key) => {
    const row = await one(
      db,
      `SELECT * FROM ${table} WHERE id=? AND user_id=?`,
      [key, req.user.id],
    );
    if (!row) throw failure(404, "내역을 찾을 수 없습니다.");
    return row;
  };
  async function provider(path, body, operationKey) {
    if (options.provider) return options.provider(path, body, operationKey);
    const response = await fetch("https://api.tosspayments.com/v1" + path, {
      method: body ? "POST" : "GET",
      headers: {
        Authorization:
          "Basic " + Buffer.from(config.secretKey + ":").toString("base64"),
        "Content-Type": "application/json",
        ...(operationKey ? { "Idempotency-Key": operationKey } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(50000),
    });
    const value = await response.json();
    if (!response.ok)
      throw failure(
        502,
        "결제사 확인이 필요합니다. 결제를 다시 만들지 말고 상태를 확인해 주세요.",
      );
    return value;
  }
  async function verifyPayment(order, payment) {
    if (
      payment.orderId !== order.id ||
      payment.paymentKey !== order.payment_key ||
      payment.totalAmount !== order.amount ||
      payment.currency !== "KRW"
    )
      throw failure(409, "결제 정보가 일치하지 않아 운영자 확인이 필요합니다.");
    if (!["DONE", "CANCELED", "ABORTED", "EXPIRED"].includes(payment.status))
      throw failure(
        409,
        "결제가 아직 완료되지 않았습니다. 상태 확인을 다시 진행해 주세요.",
      );
    const status =
      payment.status === "DONE"
        ? "paid"
        : payment.status === "CANCELED"
          ? "refunded"
          : "failed";
    const tx = await db.transaction("write");
    try {
      const fresh = await one(tx, "SELECT * FROM orders WHERE id=?", [
        order.id,
      ]);
      // A delayed confirmation must never resurrect a refunded order.
      if (
        !["refunded", "failed"].includes(fresh.status) &&
        !(fresh.status === "paid" && status === "failed")
      ) {
        let receipt = null;
        try {
          const u = new URL(payment.receipt?.url);
          if (u.protocol === "https:") receipt = u.href;
        } catch {}
        await run(
          tx,
          "UPDATE orders SET status=?,receipt=?,updated=? WHERE id=?",
          [status, receipt, now(), order.id],
        );
        if (status === "paid")
          await run(
            tx,
            "UPDATE requests SET status='confirmed',updated=? WHERE id=? AND status='accepted'",
            [now(), order.request_id],
          );
        if (status === "refunded")
          await run(
            tx,
            "UPDATE requests SET status='cancelled',updated=? WHERE id=?",
            [now(), order.request_id],
          );
      }
      await tx.commit();
    } catch (e) {
      await tx.rollback();
      throw e;
    } finally {
      tx.close();
    }
    return one(
      db,
      "SELECT id,status,amount,provider,receipt FROM orders WHERE id=?",
      [order.id],
    );
  }
  app.get("/api/robots", (req, res) =>
    res
      .type("text/plain")
      .send(
        config.demo
          ? "User-agent: *\nDisallow: /\n"
          : "User-agent: *\nDisallow: /account\nDisallow: /admin\nDisallow: /checkout/\nDisallow: /request\nDisallow: /payment/\n",
      ),
  );
  app.get("/api/health", (req, res) => res.json({ ok: true }));
  app.get("/api/bootstrap", async (req, res) =>
    res.json({
      user: req.user ? safeUser(req.user) : null,
      demo: config.demo,
      paymentMode: config.paymentMode,
      ready: config.ready,
      services,
      counselors: await counselors(),
      testimonials: config.demo ? content.testimonials : [],
      faqs: content.faqs,
    }),
  );
  const credentials = z.object({
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(10).max(128),
  });
  app.post("/api/auth/register", async (req, res) => {
    enabled();
    const v = credentials
      .extend({ name: short.max(40), consent: z.literal(true) })
      .parse(req.body);
    await throttle("register:" + req.clientAddress, 15);
    const u = { id: id(), email: v.email, name: v.name, role: "member" };
    try {
      await run(db, "INSERT INTO users VALUES(?,?,?,?,?,?)", [
        u.id,
        u.email,
        u.name,
        await passwordHash(v.password),
        "member",
        now(),
      ]);
    } catch (e) {
      if (String(e.code).includes("CONSTRAINT"))
        throw failure(
          409,
          "사용할 수 없는 이메일입니다. 기존 계정으로 로그인해 주세요.",
        );
      throw e;
    }
    await session(req, res, u);
    res.status(201).json({ user: u });
  });
  app.post("/api/auth/login", async (req, res) => {
    const v = credentials.parse(req.body);
    await throttle("login:" + hash(v.email), 15);
    await throttle("login-ip:" + req.clientAddress, 60);
    const u = await one(db, "SELECT * FROM users WHERE email=?", [v.email]);
    const valid = await passwordOK(
      v.password,
      u?.password || (await passwordHash("unavailable-account-password")),
    );
    if (!u || !valid)
      throw failure(401, "이메일 또는 비밀번호를 확인해 주세요.");
    await session(req, res, u);
    res.json({ user: safeUser(u) });
  });
  app.post("/api/auth/logout", member, async (req, res) => {
    const token = req.headers.cookie
      .split(";")
      .map((v) => v.trim())
      .find((v) => v.startsWith("arunia_session="))
      ?.slice(15);
    await run(db, "DELETE FROM sessions WHERE hash=?", [hash(token || "")]);
    res.clearCookie("arunia_session", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: config.production,
    });
    res.json({ ok: true });
  });
  app.post("/api/auth/password", member, async (req, res) => {
    const v = z
      .object({
        current: z.string().max(128),
        password: z.string().min(10).max(128),
      })
      .parse(req.body);
    await throttle("password:" + req.user.id, 10);
    if (!(await passwordOK(v.current, req.user.password)))
      throw failure(400, "현재 비밀번호가 일치하지 않습니다.");
    await run(db, "UPDATE users SET password=? WHERE id=?", [
      await passwordHash(v.password),
      req.user.id,
    ]);
    await run(db, "DELETE FROM sessions WHERE user_id=?", [req.user.id]);
    await session(req, res, req.user);
    res.json({ ok: true });
  });
  const requestSchema = z
    .object({
      service: z.enum(["individual", "assessment", "group"]),
      topics: z.array(short.max(30)).min(1).max(4),
      region: short.max(60),
      availability: short,
      program: z
        .enum(["recovery", "connection", "career", "family"])
        .optional(),
      preferredCounselor: z.string().max(80).optional(),
      consent: z.literal(true),
      sensitiveConsent: z.literal(true),
    })
    .strict();
  app.post("/api/requests", member, async (req, res) => {
    enabled();
    const v = requestSchema.parse(req.body);
    await throttle("request:" + req.user.id, 12);
    if (!/^(서울|경기)/.test(v.region))
      throw failure(400, "서울 또는 경기 지역을 선택해 주세요.");
    if (
      v.preferredCounselor &&
      !(await counselors()).some((c) => c.id === v.preferredCounselor)
    )
      throw failure(400, "선택한 상담사 정보를 확인해 주세요.");
    const key = id();
    await run(
      db,
      "INSERT INTO requests(id,user_id,data,status,demo,created,updated) VALUES(?,?,?,?,?,?,?)",
      [
        key,
        req.user.id,
        JSON.stringify({
          ...v,
          consentAt: now(),
          policyVersion: "2026-09-17-draft",
        }),
        "pending",
        config.demo ? 1 : 0,
        now(),
        now(),
      ],
    );
    res.status(201).json({ id: key });
  });
  app.get("/api/requests", member, async (req, res) =>
    res.json({
      requests: await Promise.all(
        (
          await many(
            db,
            "SELECT * FROM requests WHERE user_id=? ORDER BY created DESC",
            [req.user.id],
          )
        ).map(requestView),
      ),
    }),
  );
  app.post("/api/requests/:id/accept", member, async (req, res) => {
    const { revision } = z
      .object({ revision: z.string().uuid() })
      .strict()
      .parse(req.body);
    const r = await owned(req, "requests", req.params.id);
    if (r.offer_revision !== revision)
      throw failure(
        409,
        "상담 제안이 변경되었습니다. 새로고침 후 다시 확인해 주세요.",
      );
    if (r.status !== "offered" || r.offer_expires < now())
      throw failure(
        409,
        "현재 수락할 수 없는 제안입니다. 운영자에게 새 제안을 요청해 주세요.",
      );
    const result = await run(
      db,
      "UPDATE requests SET status='accepted',updated=? WHERE id=? AND status='offered' AND offer_expires>? AND offer_revision=?",
      [now(), r.id, now(), revision],
    );
    if (!result.rowsAffected) throw failure(409, "제안 상태가 변경되었습니다.");
    res.json({ ok: true });
  });
  async function retireUnpaid(tx, requestId) {
    const unsafe = await one(
      tx,
      "SELECT id FROM orders WHERE request_id=? AND NOT (status='failed' OR (status='pending' AND payment_key IS NULL))",
      [requestId],
    );
    if (unsafe)
      throw failure(
        409,
        "결제 진행 또는 승인 내역이 있어 상태 확인이 필요합니다.",
      );
    await run(
      tx,
      "UPDATE orders SET status='failed',updated=? WHERE request_id=? AND status='pending' AND payment_key IS NULL",
      [now(), requestId],
    );
  }
  app.post("/api/requests/:id/cancel", member, async (req, res) => {
    const tx = await db.transaction("write");
    try {
      const r = await one(
        tx,
        "SELECT * FROM requests WHERE id=? AND user_id=?",
        [req.params.id, req.user.id],
      );
      if (!r) throw failure(404, "신청 내역을 찾을 수 없습니다.");
      if (!["pending", "offered", "accepted"].includes(r.status))
        throw failure(409, "현재 취소할 수 없는 신청입니다.");
      await retireUnpaid(tx, r.id);
      await run(
        tx,
        "UPDATE requests SET status='cancelled',updated=? WHERE id=?",
        [now(), r.id],
      );
      await tx.commit();
      res.json({ ok: true });
    } catch (e) {
      await tx.rollback();
      throw e;
    } finally {
      tx.close();
    }
  });
  app.post("/api/requests/:id/support", member, async (req, res) => {
    const r = await owned(req, "requests", req.params.id);
    const v = z
      .object({ kind: z.enum(["change", "cancel"]), note: bounded(300) })
      .strict()
      .parse(req.body);
    if (!["accepted", "confirmed", "completed"].includes(r.status))
      throw failure(
        409,
        "진행 중인 상담에만 변경·취소 요청을 남길 수 있습니다.",
      );
    await throttle("support:" + req.user.id, 10);
    try {
      await run(db, "INSERT INTO support VALUES(?,?,?,?,?,?)", [
        id(),
        r.id,
        v.kind,
        v.note,
        "open",
        now(),
      ]);
    } catch (e) {
      if (String(e.code).includes("CONSTRAINT"))
        throw failure(409, "이미 접수된 요청을 확인 중입니다.");
      throw e;
    }
    res.status(201).json({ ok: true });
  });
  app.post("/api/admin/support/:id/resolve", admin, async (req, res) => {
    const result = await run(
      db,
      "UPDATE support SET status='resolved' WHERE id=? AND status='open'",
      [req.params.id],
    );
    if (!result.rowsAffected)
      throw failure(409, "이미 처리되었거나 없는 요청입니다.");
    await audit(req.user.id, "resolve-support", req.params.id);
    res.json({ ok: true });
  });
  app.post("/api/orders", member, async (req, res) => {
    enabled();
    const { requestId } = z
      .object({ requestId: z.string().uuid() })
      .strict()
      .parse(req.body);
    const tx = await db.transaction("write");
    try {
      const r = await one(
        tx,
        "SELECT * FROM requests WHERE id=? AND user_id=?",
        [requestId, req.user.id],
      );
      if (!r) throw failure(404, "신청을 찾을 수 없습니다.");
      if (!!r.demo !== config.demo)
        throw failure(409, "다른 운영 환경의 신청입니다. 새로 신청해 주세요.");
      const c = await one(
        tx,
        "SELECT * FROM counselors WHERE id=? AND active=1",
        [r.counselor_id],
      );
      if (!c || (!config.demo && c.demo))
        throw failure(409, "상담 전문가 정보를 다시 확인해 주세요.");
      const existing = await one(
        tx,
        "SELECT id FROM orders WHERE request_id=? AND status NOT IN ('failed','refunded')",
        [r.id],
      );
      if (existing) {
        await tx.commit();
        return res.json(existing);
      }
      if (r.status !== "accepted" || r.offer_expires < now())
        throw failure(409, "유효한 상담 제안을 먼저 확인하고 수락해 주세요.");
      if (!["mock", "toss_test", "toss_live"].includes(config.paymentMode))
        throw failure(503, "결제 연결 준비 중입니다.");
      const key = "arunia_" + id();
      await run(
        tx,
        "INSERT INTO orders(id,request_id,user_id,amount,provider,status,operation_key,refund_key,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?)",
        [
          key,
          r.id,
          req.user.id,
          r.amount,
          config.paymentMode,
          "pending",
          id(),
          id(),
          now(),
          now(),
        ],
      );
      await tx.commit();
      res.status(201).json({ id: key });
    } catch (e) {
      await tx.rollback();
      throw e;
    } finally {
      tx.close();
    }
  });
  app.get("/api/orders/:id", member, async (req, res) => {
    const o = await owned(req, "orders", req.params.id);
    res.json({
      order: {
        id: o.id,
        amount: o.amount,
        status: o.status,
        provider: o.provider,
        receipt: o.receipt,
      },
      request: await requestView(
        await one(db, "SELECT * FROM requests WHERE id=?", [o.request_id]),
      ),
      clientKey: config.clientKey,
      customerKey: req.user.id,
    });
  });
  app.post("/api/orders/:id/mock", member, async (req, res) => {
    const o = await owned(req, "orders", req.params.id);
    if (!config.demo || o.provider !== "mock" || config.paymentMode !== "mock")
      throw failure(403, "미리보기에서만 가능한 결제입니다.");
    const tx = await db.transaction("write");
    try {
      const r = await one(tx, "SELECT * FROM requests WHERE id=?", [
        o.request_id,
      ]);
      if (r.status !== "accepted" && o.status !== "paid")
        throw failure(409, "결제 가능한 상태가 아닙니다.");
      if (r.offer_expires < now() && o.status !== "paid")
        throw failure(409, "제안이 만료되었습니다.");
      await run(
        tx,
        "UPDATE orders SET status='paid',updated=? WHERE id=? AND status='pending'",
        [now(), o.id],
      );
      await run(
        tx,
        "UPDATE requests SET status='confirmed',updated=? WHERE id=? AND status='accepted'",
        [now(), r.id],
      );
      await tx.commit();
    } catch (e) {
      await tx.rollback();
      throw e;
    } finally {
      tx.close();
    }
    res.json({ ok: true, demo: true });
  });
  app.post("/api/payments/confirm", member, async (req, res) => {
    const v = z
      .object({
        orderId: short,
        paymentKey: bounded(200),
        amount: z.number().int().positive(),
      })
      .strict()
      .parse(req.body);
    const o = await owned(req, "orders", v.orderId);
    if (
      o.provider === "mock" ||
      o.provider !== config.paymentMode ||
      o.amount !== v.amount
    )
      throw failure(400, "주문 금액 또는 결제 방식을 확인해 주세요.");
    if (o.payment_key && o.payment_key !== v.paymentKey)
      throw failure(409, "기존 결제와 다른 요청입니다.");
    if (o.status === "paid") return res.json({ id: o.id, status: o.status });
    if (o.status !== "pending")
      throw failure(409, "처리 중인 결제입니다. 결제 상태 확인을 눌러 주세요.");
    const result = await run(
      db,
      `UPDATE orders SET status='confirming',payment_key=?,updated=? WHERE id=? AND status='pending' AND EXISTS(SELECT 1 FROM requests WHERE id=orders.request_id AND status='accepted' AND offer_expires>? AND demo=? AND EXISTS(SELECT 1 FROM counselors WHERE id=requests.counselor_id AND active=1 AND (demo=0 OR ?=1)))`,
      [
        v.paymentKey,
        now(),
        o.id,
        now(),
        config.demo ? 1 : 0,
        config.demo ? 1 : 0,
      ],
    );
    if (!result.rowsAffected)
      throw failure(409, "결제 진행 상태를 확인해 주세요.");
    o.payment_key = v.paymentKey;
    try {
      res.json(
        await verifyPayment(
          o,
          await provider(
            "/payments/confirm",
            { paymentKey: v.paymentKey, orderId: o.id, amount: o.amount },
            o.operation_key,
          ),
        ),
      );
    } catch (e) {
      await run(
        db,
        "UPDATE orders SET status='reconciliation_required',updated=? WHERE id=? AND status='confirming'",
        [now(), o.id],
      );
      throw e;
    }
  });
  async function reconcile(o) {
    if (o.provider !== config.paymentMode)
      throw failure(409, "현재 결제 환경과 다른 주문입니다.");
    let p = await provider("/payments/" + encodeURIComponent(o.payment_key));
    if (
      p.status === "IN_PROGRESS" &&
      ["confirming", "reconciliation_required"].includes(o.status)
    ) {
      if (
        p.orderId !== o.id ||
        p.paymentKey !== o.payment_key ||
        p.totalAmount !== o.amount ||
        p.currency !== "KRW"
      )
        throw failure(409, "결제 정보 확인이 필요합니다.");
      p = await provider(
        "/payments/confirm",
        { paymentKey: o.payment_key, orderId: o.id, amount: o.amount },
        o.operation_key,
      );
    }
    return verifyPayment(o, p);
  }
  app.post("/api/orders/:id/reconcile", member, async (req, res) => {
    const o = await owned(req, "orders", req.params.id);
    if (o.provider === "mock" || !o.payment_key)
      throw failure(400, "확인할 결제사 내역이 없습니다.");
    await throttle("reconcile:" + o.id, 10);
    res.json(await reconcile(o));
  });
  app.get("/api/admin", admin, async (req, res) =>
    res.json({
      requests: await Promise.all(
        (
          await many(
            db,
            "SELECT r.*,u.name AS member_name,u.email AS member_email FROM requests r JOIN users u ON r.user_id=u.id ORDER BY r.created DESC",
          )
        ).map(requestView),
      ),
      counselors: await counselors(),
      audit: await many(
        db,
        "SELECT * FROM audit ORDER BY created DESC LIMIT 50",
      ),
    }),
  );
  app.post("/api/admin/requests/:id/offer", admin, async (req, res) => {
    const v = z
      .object({
        counselorId: short,
        amount: z.number().int().min(100).max(5000000),
        slot: z.string().datetime(),
        location: bounded(250),
        venueNote: bounded(250),
      })
      .strict()
      .parse(req.body);
    if (v.slot <= now())
      throw failure(400, "앞으로의 상담 일정을 선택해 주세요.");
    const c = (await counselors()).find((c) => c.id === v.counselorId);
    if (!c) throw failure(400, "활성 상담사를 선택해 주세요.");
    const tx = await db.transaction("write");
    try {
      const r = await one(tx, "SELECT * FROM requests WHERE id=?", [
        req.params.id,
      ]);
      if (
        !r ||
        !(
          ["pending", "offered"].includes(r.status) ||
          (r.status === "accepted" && r.offer_expires < now())
        )
      )
        throw failure(409, "이미 수락되었거나 변경할 수 없는 신청입니다.");
      if (!!r.demo !== config.demo)
        throw failure(409, "현재 환경과 다른 신청입니다.");
      await retireUnpaid(tx, r.id);
      await run(
        tx,
        "UPDATE requests SET status='offered',counselor_id=?,amount=?,slot=?,location=?,venue_note=?,offer_expires=?,offer_revision=?,updated=? WHERE id=?",
        [
          c.id,
          v.amount,
          v.slot,
          v.location,
          v.venueNote,
          new Date(
            Math.min(Date.now() + 72 * 3600000, Date.parse(v.slot)),
          ).toISOString(),
          id(),
          now(),
          r.id,
        ],
      );
      await tx.commit();
    } catch (e) {
      await tx.rollback();
      throw e;
    } finally {
      tx.close();
    }
    await audit(req.user.id, "offer", req.params.id);
    res.json({ ok: true });
  });
  app.post("/api/admin/requests/:id/complete", admin, async (req, res) => {
    const r = await run(
      db,
      "UPDATE requests SET status='completed',updated=? WHERE id=? AND status='confirmed'",
      [now(), req.params.id],
    );
    if (!r.rowsAffected)
      throw failure(409, "결제와 예약이 확인된 신청만 완료할 수 있습니다.");
    await audit(req.user.id, "complete", req.params.id);
    res.json({ ok: true });
  });
  app.post("/api/admin/orders/:id/refund", admin, async (req, res) => {
    const { reason } = z
      .object({ reason: bounded(200) })
      .strict()
      .parse(req.body);
    const o = await one(db, "SELECT * FROM orders WHERE id=?", [req.params.id]);
    if (!o) throw failure(404, "결제 내역을 찾을 수 없습니다.");
    if (o.status === "refunded") return res.json({ ok: true });
    if (!["paid", "refund_pending"].includes(o.status))
      throw failure(409, "취소할 수 없는 결제 상태입니다.");
    await run(
      db,
      "UPDATE orders SET status='refund_pending',updated=? WHERE id=? AND status='paid'",
      [now(), o.id],
    );
    if (o.provider === "mock") {
      const tx = await db.transaction("write");
      try {
        await run(
          tx,
          "UPDATE orders SET status='refunded',updated=? WHERE id=?",
          [now(), o.id],
        );
        await run(
          tx,
          "UPDATE requests SET status='cancelled',updated=? WHERE id=?",
          [now(), o.request_id],
        );
        await tx.commit();
      } catch (e) {
        await tx.rollback();
        throw e;
      } finally {
        tx.close();
      }
    } else
      await verifyPayment(
        o,
        await provider(
          "/payments/" + encodeURIComponent(o.payment_key) + "/cancel",
          { cancelReason: reason },
          o.refund_key,
        ),
      );
    await audit(req.user.id, "full-refund", o.id);
    res.json({ ok: true });
  });
  app.post("/api/admin/orders/:id/reconcile", admin, async (req, res) => {
    const o = await one(db, "SELECT * FROM orders WHERE id=?", [req.params.id]);
    if (!o || o.provider === "mock" || !o.payment_key)
      throw failure(400, "확인할 결제가 없습니다.");
    const result = await reconcile(o);
    await audit(req.user.id, "reconcile", o.id);
    res.json(result);
  });
  app.post("/api/admin/counselors", admin, async (req, res) => {
    const v = z
      .object({
        name: short.max(40),
        fields: z.array(short.max(30)).min(1).max(8),
        regions: z.array(short.max(30)).min(1).max(8),
        qualifications: bounded(300),
        description: bounded(500),
        fee: short,
        demo: z.boolean(),
      })
      .strict()
      .parse(req.body);
    if (v.demo && !config.demo)
      throw failure(400, "정식 운영에는 예시 프로필을 등록할 수 없습니다.");
    const key = id();
    await run(db, "INSERT INTO counselors VALUES(?,?,?,1)", [
      key,
      JSON.stringify({ ...v, id: key }),
      v.demo ? 1 : 0,
    ]);
    await audit(req.user.id, "create-counselor", key);
    res.json({ id: key });
  });
  app.post("/api/admin/counselors/:id/archive", admin, async (req, res) => {
    const result = await run(
      db,
      "UPDATE counselors SET active=0 WHERE id=? AND NOT EXISTS(SELECT 1 FROM requests WHERE counselor_id=counselors.id AND status IN ('offered','accepted','confirmed'))",
      [req.params.id],
    );
    if (!result.rowsAffected)
      throw failure(409, "진행 중인 상담을 확인한 후 비활성화해 주세요.");
    await audit(req.user.id, "archive-counselor", req.params.id);
    res.json({ ok: true });
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "요청을 찾을 수 없습니다." }),
  );
  app.use((error, req, res, next) => {
    if (!req.path.startsWith("/api")) return next(error);
    const status = error instanceof z.ZodError ? 400 : error.status || 500;
    res.status(status).json({
      error:
        status === 400 && error instanceof z.ZodError
          ? "입력 항목과 필수 동의를 확인해 주세요."
          : status === 500
            ? "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."
            : error.message,
    });
    if (status === 500) console.error("API error:", error.code || error.name);
  });
  return { app, db, config };
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp, configuration, passwordHash } from "../server/app.js";
import { run, one, many } from "../server/db.js";
const ORIGIN = "http://localhost:4173";
async function fixture(mode = "mock", provider) {
  const dir = await mkdtemp(join(tmpdir(), "arunia-test-"));
  const config = {
    demo: true,
    ready: false,
    origin: ORIGIN,
    database: "file:" + join(dir, "test.db"),
    paymentMode: mode,
    production: false,
    clientKey: "test_gck_example",
    secretKey: "test_gsk_example",
  };
  const { app, db } = await createApp({ config, provider });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const base = "http://127.0.0.1:" + server.address().port;
  const request = async (path, body, cookie, origin = ORIGIN) => {
    const response = await fetch(base + "/api" + path, {
      method: body === undefined ? "GET" : "POST",
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
    return {
      status: response.status,
      body: await response.json(),
      cookie: response.headers.get("set-cookie")?.split(";")[0],
    };
  };
  const register = async (name) => {
    const r = await request("/auth/register", {
      name,
      email: name + "@example.com",
      password: "valid-password-1234",
      consent: true,
      role: "admin",
    });
    assert.equal(r.status, 201, JSON.stringify(r));
    return r;
  };
  const a = await register("alice"),
    b = await register("bob"),
    operator = await register("operator");
  await run(db, "UPDATE users SET role='admin' WHERE id=?", [
    operator.body.user.id,
  ]);
  const apply = async (cookie = a.cookie) => {
    const r = await request(
      "/requests",
      {
        service: "individual",
        topics: ["일·진로 고민"],
        region: "서울 마포구",
        availability: "토요일 오전",
        consent: true,
        sensitiveConsent: true,
      },
      cookie,
    );
    assert.equal(r.status, 201, JSON.stringify(r));
    return r.body.id;
  };
  const offer = async (key, amount = 75000) => {
    const r = await request(
      "/admin/requests/" + key + "/offer",
      {
        counselorId: "counselor-01",
        amount,
        slot: new Date(Date.now() + 86400000).toISOString(),
        location: "서울 마포구 테스트 회의실",
        venueNote: "50분, 장소 비용 포함",
      },
      operator.cookie,
    );
    assert.equal(r.status, 200, JSON.stringify(r));
    return (await one(db, "SELECT * FROM requests WHERE id=?", [key]))
      .offer_revision;
  };
  const ready = async () => {
    const key = await apply(),
      revision = await offer(key);
    assert.equal(
      (await request("/requests/" + key + "/accept", { revision }, a.cookie))
        .status,
      200,
    );
    const order = await request("/orders", { requestId: key }, a.cookie);
    assert.equal(order.status, 201, JSON.stringify(order));
    return { key, orderId: order.body.id };
  };
  const close = async () => {
    await new Promise((r) => server.close(r));
    db.close();
    await rm(dir, { recursive: true, force: true });
  };
  return { config, db, request, a, b, operator, apply, offer, ready, close };
}
test("회원·매칭·테스트 결제·완료·전액취소 전체 흐름", async () => {
  const f = await fixture();
  try {
    assert.equal(f.a.body.user.role, "member");
    const { key, orderId } = await f.ready();
    let r = await f.request("/orders/" + orderId + "/mock", {}, f.a.cookie);
    assert.equal(r.status, 200);
    assert.equal(
      (await one(f.db, "SELECT status FROM requests WHERE id=?", [key])).status,
      "confirmed",
    );
    assert.equal(
      (await f.request("/orders/" + orderId + "/mock", {}, f.a.cookie)).status,
      200,
    );
    assert.equal(
      (
        await f.request(
          "/admin/requests/" + key + "/complete",
          {},
          f.operator.cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await f.request(
          "/admin/orders/" + orderId + "/refund",
          { reason: "테스트 취소" },
          f.operator.cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await f.request(
          "/admin/orders/" + orderId + "/refund",
          { reason: "재시도" },
          f.operator.cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (await one(f.db, "SELECT status FROM orders WHERE id=?", [orderId]))
        .status,
      "refunded",
    );
    const output = await f.request("/requests", undefined, f.a.cookie);
    assert.equal(output.body.requests.length, 1);
    assert.ok(!JSON.stringify(output.body).includes("password"));
  } finally {
    await f.close();
  }
});
test("다른 회원의 내역·수락·결제·운영자 API 접근 차단", async () => {
  const f = await fixture();
  try {
    const { key, orderId } = await f.ready();
    assert.deepEqual(
      (await f.request("/requests", undefined, f.b.cookie)).body.requests,
      [],
    );
    assert.equal(
      (await f.request("/orders/" + orderId, undefined, f.b.cookie)).status,
      404,
    );
    assert.equal(
      (await f.request("/orders/" + orderId + "/mock", {}, f.b.cookie)).status,
      404,
    );
    assert.equal(
      (
        await f.request(
          "/requests/" + key + "/accept",
          { revision: "00000000-0000-4000-8000-000000000000" },
          f.b.cookie,
        )
      ).status,
      404,
    );
    assert.equal(
      (await f.request("/orders", { requestId: key }, f.b.cookie)).status,
      404,
    );
    assert.equal(
      (await f.request("/admin", undefined, f.a.cookie)).status,
      403,
    );
    assert.equal(
      (await f.request("/admin/requests/" + key + "/complete", {}, f.a.cookie))
        .status,
      403,
    );
    assert.equal(
      (
        await f.request(
          "/admin/orders/" + orderId + "/refund",
          { reason: "no" },
          f.b.cookie,
        )
      ).status,
      403,
    );
  } finally {
    await f.close();
  }
});
test("CSRF 출처 검사와 세션 만료·로그아웃·회전", async () => {
  const f = await fixture();
  try {
    assert.equal(
      (await f.request("/auth/logout", {}, f.a.cookie, "https://evil.test"))
        .status,
      403,
    );
    assert.equal(
      (await f.request("/auth/logout", {}, f.a.cookie, null)).status,
      403,
    );
    assert.equal(
      (await f.request("/auth/logout", {}, f.a.cookie, ORIGIN + ".evil.test"))
        .status,
      403,
    );
    const login = await f.request(
      "/auth/login",
      { email: "alice@example.com", password: "valid-password-1234" },
      f.a.cookie,
    );
    assert.equal(login.status, 200);
    assert.notEqual(login.cookie, f.a.cookie);
    assert.equal(
      (await f.request("/requests", undefined, f.a.cookie)).status,
      401,
    );
    assert.equal(
      (await f.request("/auth/logout", {}, login.cookie)).status,
      200,
    );
    assert.equal(
      (await f.request("/requests", undefined, login.cookie)).status,
      401,
    );
    await run(f.db, "UPDATE sessions SET expires=0 WHERE user_id=?", [
      f.b.body.user.id,
    ]);
    assert.equal(
      (await f.request("/requests", undefined, f.b.cookie)).status,
      401,
    );
    assert.equal(
      (
        await f.request(
          "/requests",
          undefined,
          "arunia_session=" + "a".repeat(64),
        )
      ).status,
      401,
    );
  } finally {
    await f.close();
  }
});
test("변경된 제안의 수락 방지와 결제 금액 입력 거부", async () => {
  const f = await fixture();
  try {
    const key = await f.apply(),
      old = await f.offer(key, 75000),
      revision = await f.offer(key, 85000);
    assert.equal(
      (
        await f.request(
          "/requests/" + key + "/accept",
          { revision: old },
          f.a.cookie,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await f.request(
          "/requests/" + key + "/accept",
          { revision },
          f.a.cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (await f.request("/orders", { requestId: key, amount: 1 }, f.a.cookie))
        .status,
      400,
    );
    const o = await f.request("/orders", { requestId: key }, f.a.cookie);
    assert.equal(o.status, 201);
    assert.equal(
      (await one(f.db, "SELECT amount FROM orders WHERE id=?", [o.body.id]))
        .amount,
      85000,
    );
    assert.equal(
      (
        await f.request(
          "/admin/requests/" + key + "/offer",
          {
            counselorId: "counselor-01",
            amount: 100,
            slot: new Date(Date.now() + 86400000).toISOString(),
            location: "다른 장소",
            venueNote: "다른 제안",
          },
          f.operator.cookie,
        )
      ).status,
      409,
    );
  } finally {
    await f.close();
  }
});
test("중복 주문과 동시 승인에 대해 하나의 주문·승인만 생성", async () => {
  let calls = 0;
  const f = await fixture("toss_test", async (path, body) => {
    calls++;
    return {
      ...body,
      totalAmount: body.amount,
      currency: "KRW",
      status: "DONE",
    };
  });
  try {
    const { key, orderId } = await f.ready();
    const orders = await Promise.all(
      Array.from({ length: 10 }, () =>
        f.request("/orders", { requestId: key }, f.a.cookie),
      ),
    );
    assert.ok(
      orders.every((o) => o.status === 200 && o.body.id === orderId),
      JSON.stringify(orders),
    );
    const results = await Promise.all(
      Array.from({ length: 20 }, () =>
        f.request(
          "/payments/confirm",
          { orderId, paymentKey: "key-one", amount: 75000 },
          f.a.cookie,
        ),
      ),
    );
    assert.equal(calls, 1);
    assert.ok(results.some((r) => r.status === 200));
    assert.ok(
      results.every((r) => [200, 409].includes(r.status)),
      JSON.stringify(results),
    );
    assert.equal(
      (await many(f.db, "SELECT * FROM orders WHERE request_id=?", [key]))
        .length,
      1,
    );
    assert.equal(
      (
        await f.request(
          "/payments/confirm",
          { orderId, paymentKey: "different-key", amount: 75000 },
          f.a.cookie,
        )
      ).status,
      409,
    );
  } finally {
    await f.close();
  }
});
test("금액 변조와 결제사 결과 불일치 차단", async () => {
  let calls = 0;
  const f = await fixture("toss_test", async (path, body) => {
    calls++;
    return { ...body, totalAmount: 1, currency: "KRW", status: "DONE" };
  });
  try {
    const { orderId } = await f.ready();
    for (const amount of [1, -1, 1.5, "75000", 1e30])
      assert.equal(
        (
          await f.request(
            "/payments/confirm",
            { orderId, paymentKey: "fake", amount },
            f.a.cookie,
          )
        ).status,
        400,
      );
    assert.equal(calls, 0);
    assert.equal(
      (
        await f.request(
          "/payments/confirm",
          { orderId, paymentKey: "fake", amount: 75000 },
          f.a.cookie,
        )
      ).status,
      409,
    );
    assert.equal(
      (await one(f.db, "SELECT status FROM orders WHERE id=?", [orderId]))
        .status,
      "reconciliation_required",
    );
  } finally {
    await f.close();
  }
});
test("승인 직후 타임아웃 복구와 완료 상태 보존", async () => {
  let payment,
    posts = 0;
  const f = await fixture("toss_test", async (path, body) => {
    if (body) {
      posts++;
      payment = {
        ...body,
        totalAmount: body.amount,
        currency: "KRW",
        status: "DONE",
      };
      throw new Error("simulated timeout after approval");
    }
    return payment;
  });
  try {
    const { key, orderId } = await f.ready();
    assert.equal(
      (
        await f.request(
          "/payments/confirm",
          { orderId, paymentKey: "timeout-key", amount: 75000 },
          f.a.cookie,
        )
      ).status,
      500,
    );
    assert.equal(
      (await f.request("/orders/" + orderId + "/reconcile", {}, f.a.cookie))
        .status,
      200,
    );
    assert.equal(posts, 1);
    assert.equal(
      (await one(f.db, "SELECT status FROM orders WHERE id=?", [orderId]))
        .status,
      "paid",
    );
    await f.request(
      "/admin/requests/" + key + "/complete",
      {},
      f.operator.cookie,
    );
    await f.request("/orders/" + orderId + "/reconcile", {}, f.a.cookie);
    assert.equal(
      (await one(f.db, "SELECT status FROM requests WHERE id=?", [key])).status,
      "completed",
    );
  } finally {
    await f.close();
  }
});
test("미승인 상태는 같은 승인 키로 복구, 확정 실패는 새 주문 허용", async () => {
  let saved,
    calls = 0,
    keys = [];
  const f = await fixture("toss_test", async (path, body, operation) => {
    if (body) {
      saved = {
        ...body,
        totalAmount: body.amount,
        currency: "KRW",
        status: "IN_PROGRESS",
      };
      keys.push(operation);
      if (++calls === 1) throw new Error("connection lost");
      return { ...saved, status: "EXPIRED" };
    }
    return saved;
  });
  try {
    const { key, orderId } = await f.ready();
    await f.request(
      "/payments/confirm",
      { orderId, paymentKey: "expired-key", amount: 75000 },
      f.a.cookie,
    );
    assert.equal(
      (await f.request("/orders/" + orderId + "/reconcile", {}, f.a.cookie))
        .status,
      200,
    );
    assert.equal(keys.length, 2);
    assert.equal(keys[0], keys[1]);
    assert.equal(
      (await one(f.db, "SELECT status FROM orders WHERE id=?", [orderId]))
        .status,
      "failed",
    );
    const next = await f.request("/orders", { requestId: key }, f.a.cookie);
    assert.equal(next.status, 201);
    assert.notEqual(next.body.id, orderId);
  } finally {
    await f.close();
  }
});
test("운영 환경 변경 시 가상 상담 제안을 실결제로 전환 불가", async () => {
  const f = await fixture();
  try {
    const key = await f.apply(),
      revision = await f.offer(key);
    await f.request("/requests/" + key + "/accept", { revision }, f.a.cookie);
    f.config.demo = false;
    f.config.ready = true;
    f.config.paymentMode = "toss_live";
    assert.equal(
      (await f.request("/orders", { requestId: key }, f.a.cookie)).status,
      409,
    );
    assert.equal((await f.request("/bootstrap")).body.testimonials.length, 0);
  } finally {
    await f.close();
  }
});
test("배포 설정은 DB·실결제 키·준비 상태 누락 시 닫힘", () => {
  assert.throws(() =>
    configuration({
      NODE_ENV: "production",
      APP_ORIGIN: "https://arunia.test",
    }),
  );
  assert.throws(() => configuration({ PAYMENT_MODE: "mock" }));
  assert.throws(() =>
    configuration({
      PAYMENT_MODE: "toss_live",
      APP_DEMO: "true",
      OPERATIONS_READY: "true",
      TOSS_CLIENT_KEY: "live_ck_x",
      TOSS_SECRET_KEY: "live_sk_x",
    }),
  );
  assert.throws(() =>
    configuration({ PAYMENT_MODE: "toss_test", TOSS_CLIENT_KEY: "test_ck_x" }),
  );
  assert.equal(
    configuration({ APP_DEMO: "true", PAYMENT_MODE: "mock" }).demo,
    true,
  );
});
test("중단된 미결제 주문은 취소 가능하고 만료 제안은 다시 제안 가능", async () => {
  const f = await fixture("toss_test");
  try {
    const first = await f.ready();
    await run(
      f.db,
      "UPDATE requests SET offer_expires='2020-01-01T00:00:00.000Z' WHERE id=?",
      [first.key],
    );
    assert.equal(
      (await f.request("/requests/" + first.key + "/cancel", {}, f.a.cookie))
        .status,
      200,
    );
    assert.equal(
      (await one(f.db, "SELECT status FROM orders WHERE id=?", [first.orderId]))
        .status,
      "failed",
    );
    assert.equal(
      (
        await f.request(
          "/payments/confirm",
          { orderId: first.orderId, paymentKey: "late-return", amount: 75000 },
          f.a.cookie,
        )
      ).status,
      409,
    );
    const second = await f.ready();
    await run(
      f.db,
      "UPDATE requests SET offer_expires='2020-01-01T00:00:00.000Z' WHERE id=?",
      [second.key],
    );
    const revision = await f.offer(second.key, 85000);
    assert.equal(
      (
        await f.request(
          "/requests/" + second.key + "/accept",
          { revision },
          f.a.cookie,
        )
      ).status,
      200,
    );
    const next = await f.request(
      "/orders",
      { requestId: second.key },
      f.a.cookie,
    );
    assert.equal(next.status, 201);
    assert.notEqual(next.body.id, second.orderId);
    assert.equal(
      (
        await one(f.db, "SELECT status FROM orders WHERE id=?", [
          second.orderId,
        ])
      ).status,
      "failed",
    );
  } finally {
    await f.close();
  }
});
test("운영자 계정 발급은 기존 회원 세션을 폐기한다", async () => {
  const f = await fixture();
  try {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    await promisify(execFile)(process.execPath, ["server/admin.js"], {
      env: {
        ...process.env,
        NODE_ENV: "development",
        DATABASE_URL: f.config.database,
        APP_DEMO: "true",
        PAYMENT_MODE: "mock",
        ADMIN_EMAIL: "alice@example.com",
        ADMIN_PASSWORD: "new-admin-password-5678",
      },
    });
    assert.equal(
      (await f.request("/admin", undefined, f.a.cookie)).status,
      403,
    );
    assert.equal(
      (await f.request("/requests", undefined, f.a.cookie)).status,
      401,
    );
    const login = await f.request("/auth/login", {
      email: "alice@example.com",
      password: "new-admin-password-5678",
    });
    assert.equal(login.status, 200);
    assert.equal(
      (await f.request("/admin", undefined, login.cookie)).status,
      200,
    );
  } finally {
    await f.close();
  }
});
test("관심 프로그램 보존 및 변경·취소 요청의 소유권·운영 처리", async () => {
  const f = await fixture();
  try {
    const program = await f.request(
      "/requests",
      {
        service: "group",
        program: "family",
        topics: ["관계"],
        region: "서울 마포",
        availability: "토요일",
        consent: true,
        sensitiveConsent: true,
      },
      f.a.cookie,
    );
    assert.equal(program.status, 201);
    assert.equal(
      JSON.parse(
        (
          await one(f.db, "SELECT data FROM requests WHERE id=?", [
            program.body.id,
          ])
        ).data,
      ).program,
      "family",
    );
    const { key, orderId } = await f.ready();
    await f.request("/orders/" + orderId + "/mock", {}, f.a.cookie);
    assert.equal(
      (
        await f.request(
          "/requests/" + key + "/support",
          { kind: "cancel", note: "일정 변경으로 취소 요청" },
          f.b.cookie,
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await f.request(
          "/requests/" + key + "/support",
          { kind: "cancel", note: "일정 변경으로 취소 요청" },
          f.a.cookie,
        )
      ).status,
      201,
    );
    assert.equal(
      (
        await f.request(
          "/requests/" + key + "/support",
          { kind: "cancel", note: "중복 요청" },
          f.a.cookie,
        )
      ).status,
      409,
    );
    const support = await one(
      f.db,
      "SELECT * FROM support WHERE request_id=?",
      [key],
    );
    assert.equal(
      (
        await f.request(
          "/admin/support/" + support.id + "/resolve",
          {},
          f.a.cookie,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await f.request(
          "/admin/support/" + support.id + "/resolve",
          {},
          f.operator.cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (await one(f.db, "SELECT status FROM support WHERE id=?", [support.id]))
        .status,
      "resolved",
    );
  } finally {
    await f.close();
  }
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../server/app.js";
import { many, one, run } from "../server/db.js";

const content = JSON.parse(
  await readFile(new URL("../server/content.json", import.meta.url), "utf8"),
);
const examples = content.counselors.filter((profile) => profile.demo === true);
const categories = JSON.parse(
  await readFile(
    new URL("../shared/counseling-categories.json", import.meta.url),
    "utf8",
  ),
);

async function fixture(demo = true) {
  const dir = await mkdtemp(join(tmpdir(), "arunia-content-"));
  const config = {
    demo,
    ready: false,
    origin: "http://localhost:4173",
    database: "file:" + join(dir, "test.db"),
    paymentMode: "disabled",
    production: false,
  };
  let current = await createApp({ config });
  async function request(path, body, cookie) {
    const server = current.app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    try {
      const response = await fetch(
        `http://127.0.0.1:${server.address().port}/api${path}`,
        {
          method: body === undefined ? "GET" : "POST",
          headers: {
            ...(body === undefined
              ? {}
              : { "Content-Type": "application/json", Origin: config.origin }),
            ...(cookie ? { Cookie: cookie } : {}),
          },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        },
      );
      return { status: response.status, body: await response.json() };
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  }
  return {
    get db() {
      return current.db;
    },
    async restart(nextDemo = demo) {
      current.db.close();
      current = await createApp({ config: { ...config, demo: nextDemo } });
    },
    request,
    async bootstrap() {
      const response = await request("/bootstrap");
      assert.equal(response.status, 200);
      return response.body;
    },
    async close() {
      current.db.close();
      await rm(dir, { recursive: true, force: true });
    },
  };
}

test("데모 재시작은 예시만 갱신하고 실프로필·보관 상태·회원·신청·결제를 보존한다", async () => {
  const f = await fixture();
  try {
    const [updated, real, archived] = examples;
    assert.ok(updated && real && archived);
    const realData = JSON.stringify({
      id: real.id,
      name: "확인된 운영 상담사",
      description: "운영자가 등록한 실제 프로필",
      demo: false,
    });
    await run(f.db, "UPDATE counselors SET data=? WHERE id=?", [
      JSON.stringify({ ...updated, description: "이전 배포의 소개" }),
      updated.id,
    ]);
    await run(f.db, "UPDATE counselors SET data=?,demo=0 WHERE id=?", [
      realData,
      real.id,
    ]);
    await run(f.db, "UPDATE counselors SET data=?,active=0 WHERE id=?", [
      JSON.stringify({ ...archived, description: "보관된 이전 소개" }),
      archived.id,
    ]);
    await run(f.db, "INSERT INTO counselors VALUES(?,?,1,1)", [
      "operator-demo",
      JSON.stringify({ name: "별도로 등록한 예시", demo: true }),
    ]);
    await run(
      f.db,
      "INSERT INTO users(id,email,name,password,created) VALUES(?,?,?,?,?)",
      [
        "member",
        "member@example.com",
        "테스트 회원",
        "stored-hash",
        "2026-01-01",
      ],
    );
    await run(
      f.db,
      "INSERT INTO requests(id,user_id,data,status,counselor_id,amount,demo,created,updated) VALUES(?,?,?,?,?,?,?,?,?)",
      [
        "request",
        "member",
        JSON.stringify({ service: "individual", topics: ["대인관계"] }),
        "confirmed",
        updated.id,
        75000,
        1,
        "2026-01-01",
        "2026-01-01",
      ],
    );
    await run(
      f.db,
      "INSERT INTO orders(id,request_id,user_id,amount,provider,status,operation_key,refund_key,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?)",
      [
        "order",
        "request",
        "member",
        75000,
        "mock",
        "paid",
        "operation",
        "refund",
        "2026-01-01",
        "2026-01-01",
      ],
    );
    const before = {};
    for (const table of ["users", "requests", "orders"])
      before[table] = await many(f.db, `SELECT * FROM ${table}`);
    const customBefore = await one(
      f.db,
      "SELECT * FROM counselors WHERE id='operator-demo'",
    );

    await f.restart();

    const updatedRow = await one(f.db, "SELECT * FROM counselors WHERE id=?", [
      updated.id,
    ]);
    assert.deepEqual(JSON.parse(updatedRow.data), updated);
    assert.equal(updatedRow.demo, 1);
    assert.equal(updatedRow.active, 1);
    const realRow = await one(f.db, "SELECT * FROM counselors WHERE id=?", [
      real.id,
    ]);
    assert.equal(realRow.data, realData);
    assert.equal(realRow.demo, 0);
    const archivedRow = await one(f.db, "SELECT * FROM counselors WHERE id=?", [
      archived.id,
    ]);
    assert.deepEqual(JSON.parse(archivedRow.data), archived);
    assert.equal(archivedRow.active, 0);
    assert.deepEqual(
      await one(f.db, "SELECT * FROM counselors WHERE id='operator-demo'"),
      customBefore,
    );
    for (const table of ["users", "requests", "orders"])
      assert.deepEqual(
        await many(f.db, `SELECT * FROM ${table}`),
        before[table],
      );
    const bootstrap = await f.bootstrap();
    assert.equal(
      bootstrap.counselors.find((profile) => profile.id === updated.id)
        .description,
      updated.description,
    );
    assert.equal(
      bootstrap.counselors.some((profile) => profile.id === archived.id),
      false,
    );
  } finally {
    await f.close();
  }
});

test("운영 모드 시작은 예시를 생성·갱신하지 않고 공개 응답에서 제외한다", async () => {
  const f = await fixture(false);
  try {
    assert.deepEqual(await many(f.db, "SELECT * FROM counselors"), []);
    const storedDemo = JSON.stringify({
      ...examples[0],
      description: "운영 모드에서 보존할 예시",
    });
    await run(f.db, "INSERT INTO counselors VALUES(?,?,1,1)", [
      examples[0].id,
      storedDemo,
    ]);
    await run(f.db, "INSERT INTO counselors VALUES(?,?,0,1)", [
      "real-profile",
      JSON.stringify({ name: "확인된 운영 상담사", demo: false }),
    ]);
    await f.restart(false);

    assert.equal(
      (
        await one(f.db, "SELECT data FROM counselors WHERE id=?", [
          examples[0].id,
        ])
      ).data,
      storedDemo,
    );
    assert.equal((await many(f.db, "SELECT * FROM counselors")).length, 2);
    const bootstrap = await f.bootstrap();
    assert.equal(bootstrap.demo, false);
    assert.deepEqual(
      bootstrap.counselors.map((profile) => profile.id),
      ["real-profile"],
    );
    assert.deepEqual(bootstrap.testimonials, []);
  } finally {
    await f.close();
  }
});

test("운영자가 등록한 상담 분야는 저장·공개되며 잘못된 분야와 추가 필드는 거절한다", async () => {
  const f = await fixture(false);
  try {
    const token = "a".repeat(64);
    await run(
      f.db,
      "INSERT INTO users(id,email,name,password,role,created) VALUES(?,?,?,?,?,?)",
      [
        "admin",
        "admin@example.com",
        "운영자",
        "stored-hash",
        "admin",
        "2026-01-01",
      ],
    );
    await run(f.db, "INSERT INTO sessions VALUES(?,?,?)", [
      createHash("sha256").update(token).digest("hex"),
      "admin",
      Date.now() + 60000,
    ]);
    const cookie = `arunia_session=${token}`;
    const profile = {
      name: "운영자 등록 상담사",
      fields: ["자기이해", "대인관계"],
      categoryIds: [categories[0].slug, categories[5].slug],
      regions: ["서울 마포"],
      qualifications: "운영자 확인 자격 정보",
      description: "테스트에서 등록한 실제 프로필 예시",
      fee: "상담 후 안내",
      demo: false,
    };
    const registered = await f.request("/admin/counselors", profile, cookie);
    assert.equal(registered.status, 200);
    const stored = await one(f.db, "SELECT data FROM counselors WHERE id=?", [
      registered.body.id,
    ]);
    assert.deepEqual(JSON.parse(stored.data).categoryIds, profile.categoryIds);
    assert.deepEqual(
      (await f.bootstrap()).counselors.find(
        (counselor) => counselor.id === registered.body.id,
      ).categoryIds,
      profile.categoryIds,
    );
    for (const invalid of [
      { ...profile, categoryIds: ["unknown-category"] },
      { ...profile, categoryIds: Array(9).fill(categories[0].slug) },
      { ...profile, unapprovedField: "unexpected" },
    ]) {
      assert.equal(
        (await f.request("/admin/counselors", invalid, cookie)).status,
        400,
      );
    }
    assert.equal((await many(f.db, "SELECT * FROM counselors")).length, 1);

    const { categoryIds, ...legacyProfile } = profile;
    const legacy = await f.request("/admin/counselors", legacyProfile, cookie);
    assert.equal(legacy.status, 200);
    assert.deepEqual(
      JSON.parse(
        (
          await one(f.db, "SELECT data FROM counselors WHERE id=?", [
            legacy.body.id,
          ])
        ).data,
      ).categoryIds,
      [],
    );
  } finally {
    await f.close();
  }
});

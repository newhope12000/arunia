import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const source = readFileSync(
  fileURLToPath(
    new URL("../legacy/assets/hunmin-application.js", import.meta.url),
  ),
  "utf8",
);
const endpoint =
  "https://applications-collection.vercel.app/api/arunia-hunmin-apply/";
const submissionId = "12345678-1234-4234-8234-000000000001";
const receiptNumber = "58273";

class Element {
  constructor(id = "") {
    this.id = id;
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.hidden = false;
    this.handlers = {};
    this.dataset = {};
    this.attributes = {};
    this.validationMessage = "";
    this.textContent = "";
  }
  addEventListener(type, handler) {
    (this.handlers[type] ||= []).push(handler);
  }
  emit(type, event = {}) {
    for (const handler of this.handlers[type] || [])
      handler({ preventDefault() {}, ...event });
  }
  setCustomValidity(message) {
    this.validationMessage = message;
  }
  setAttribute(name, value) {
    this.attributes[name] = value;
  }
  focus() {
    this.focused = true;
  }
}

const response = (status, data) => ({
  status,
  ok: status >= 200 && status < 300,
  async json() {
    return data;
  },
});
const ready = () => response(200, { ok: true, ready: true });
const accepted = (_url, options) =>
  response(200, {
    ok: true,
    submissionId: JSON.parse(options.body).submissionId,
    duplicate: false,
    receiptNumber,
  });
async function flush() {
  for (let index = 0; index < 15; index++) await Promise.resolve();
}

function create(replies) {
  // Deliberately omit the removed dong element. Adding it to the mock would hide
  // a stale product reference that prevents the real two-field form starting.
  const fields = [
    "name",
    "phone",
    "age",
    "residenceSido",
    "residenceSigungu",
    "lineHun",
    "lineMin",
    "lineJeong",
    "lineEum",
    "consent",
    "bot-field",
  ];
  const ids = Object.fromEntries(
    [
      ...fields,
      "hunminForm",
      "hunminFields",
      "hunminNotice",
      "hunminRetry",
      "hunminPreview",
      "hunminReview",
      "hunminConfirm",
      "hunminEdit",
      "countHun",
      "countMin",
      "countJeong",
      "countEum",
      "previewHun",
      "previewMin",
      "previewJeong",
      "previewEum",
      "previewName",
      "previewPhone",
      "previewAge",
      "previewResidence",
      "reviewTitle",
    ].map((id) => [id, new Element(id)]),
  );
  let now = 0;
  let sequence = 0;
  let reports = 0;
  const requests = [];
  const navigations = [];
  const timeouts = [];
  const lookups = [];
  const window = new Element();
  window.crypto = {
    randomUUID: () =>
      `12345678-1234-4234-8234-${String(++sequence).padStart(12, "0")}`,
  };
  window.location = {
    href: "https://www.arunia.co.kr/hunmin/apply?utm_source=test&utm_medium=email&utm_campaign=hunmin&utm_content=button&utm_term=poem",
    search:
      "?utm_source=test&utm_medium=email&utm_campaign=hunmin&utm_content=button&utm_term=poem",
    hash: "",
    assign: (value) => navigations.push(value),
  };
  window.setTimeout = (_callback, delay) => {
    timeouts.push(delay);
    return timeouts.length;
  };
  window.clearTimeout = () => {};
  ids.hunminForm.checkValidity = () =>
    fields
      .filter((id) => !["consent", "bot-field"].includes(id))
      .every((id) => ids[id].value !== "" && !ids[id].validationMessage) &&
    ids.consent.checked;
  ids.hunminForm.reportValidity = () => {
    reports++;
  };
  class MockFormData {
    constructor() {
      assert.equal(
        ids.hunminFields.disabled,
        false,
        "Capture must precede locking the form controls",
      );
      this.values = Object.fromEntries(fields.map((id) => [id, ids[id].value]));
      this.values.consent = ids.consent.checked ? "on" : null;
    }
    get(name) {
      return this.values[name] ?? null;
    }
  }
  vm.runInNewContext(source, {
    window,
    document: {
      getElementById(id) {
        lookups.push(id);
        return ids[id] || null;
      },
      referrer: "https://referrer.test/",
    },
    navigator: { userAgent: "HunminFrontendTest" },
    performance: { now: () => now },
    URLSearchParams,
    FormData: MockFormData,
    AbortController,
    fetch: async (url, options) => {
      assert.equal(url, endpoint);
      requests.push({ url, options });
      assert.ok(replies.length, "Unexpected mocked request");
      const reply = replies.shift();
      if (reply instanceof Error) throw reply;
      return typeof reply === "function" ? reply(url, options) : reply;
    },
  });
  function fill(age = "20") {
    now = 2500;
    const values = {
      name: "테스트 응모자",
      phone: "010-1234-5678",
      age,
      residenceSido: "경기도",
      residenceSigungu: "고양시 덕양구",
      lineHun: "훈훈한 마음으로 시작해요",
      lineMin: "민들레처럼 나답게 피어나요",
      lineJeong: "정해진 답보다 내 말을 믿어요",
      lineEum: "음, 이제 내 길을 찾아가요",
    };
    for (const [id, value] of Object.entries(values)) {
      ids[id].value = value;
      ids[id].emit("input");
    }
    ids.consent.checked = true;
  }
  return {
    ids,
    requests,
    navigations,
    timeouts,
    lookups,
    window,
    fill,
    reports: () => reports,
    preview: () => ids.hunminForm.emit("submit"),
    confirm: () => ids.hunminConfirm.emit("click"),
    retry: () => ids.hunminRetry.emit("click"),
    state: () => ids.hunminNotice.dataset.state,
  };
}

test("two-field residence starts without a dong DOM element, previews age 20 and submits the v2 contract", async () => {
  const env = create([ready(), accepted]);
  assert.equal(env.ids.hunminFields.disabled, true);
  await flush();
  assert.equal(env.state(), "ready");
  assert.equal(env.ids.hunminFields.disabled, false);
  assert.ok(!env.lookups.includes("residenceDong"));
  assert.equal(
    env.requests[0].options.method,
    undefined,
    "Readiness must remain read-only",
  );
  env.fill();
  env.preview();
  assert.equal(env.state(), "reviewing");
  assert.equal(env.requests.length, 1, "Preview must not send a submission");
  assert.equal(env.ids.previewAge.textContent, "20세");
  assert.equal(env.ids.previewResidence.textContent, "경기도 고양시 덕양구");
  assert.equal(env.ids.previewHun.textContent, "훈훈한 마음으로 시작해요");
  env.confirm();
  await flush();
  const payload = JSON.parse(env.requests[1].options.body);
  assert.equal(env.requests[1].options.method, "POST");
  assert.deepEqual(
    Object.keys(payload).sort(),
    [
      "slug",
      "submissionId",
      "name",
      "phone",
      "age",
      "residenceSido",
      "residenceSigungu",
      "lineHun",
      "lineMin",
      "lineJeong",
      "lineEum",
      "consent",
      "consentVersion",
      "consentedAt",
      "elapsedMs",
      "website",
      "pageUrl",
      "utmSource",
      "utmMedium",
      "utmCampaign",
      "utmContent",
      "utmTerm",
      "referrer",
      "userAgent",
    ].sort(),
  );
  assert.equal(payload.age, 20);
  assert.equal(typeof payload.age, "number");
  assert.equal(payload.residenceSido, "경기도");
  assert.equal(payload.residenceSigungu, "고양시 덕양구");
  assert.ok(!Object.hasOwn(payload, "residenceDong"));
  assert.equal(payload.consent, true);
  assert.equal(payload.consentVersion, "arunia-hunmin-v2");
  assert.ok(Number.isFinite(Date.parse(payload.consentedAt)));
  assert.equal(payload.phone, "01012345678");
  assert.equal(payload.elapsedMs, 2500);
  assert.equal(payload.website, "");
  assert.equal(payload.pageUrl, env.window.location.href);
  for (const [field, value] of Object.entries({
    utmSource: "test",
    utmMedium: "email",
    utmCampaign: "hunmin",
    utmContent: "button",
    utmTerm: "poem",
  }))
    assert.equal(payload[field], value);
  assert.equal(env.state(), "complete");
  assert.deepEqual(env.navigations, [
    `/hunmin/thanks#receipt=${receiptNumber}`,
  ]);
  assert.ok(
    !env.navigations[0].includes(submissionId),
    "Completion must not reveal the retry UUID",
  );
});

test("the integer age limits and required district still block invalid previews without writing", async () => {
  for (const [field, value] of [
    ["age", "19"],
    ["age", "28"],
    ["age", "20.5"],
    ["age", ""],
    ["residenceSigungu", ""],
    ["residenceSigungu", "   "],
  ]) {
    const env = create([ready()]);
    await flush();
    env.fill();
    env.ids[field].value = value;
    env.preview();
    env.confirm();
    await flush();
    assert.equal(
      env.state(),
      "ready",
      `${field} ${JSON.stringify(value)} must remain editable`,
    );
    assert.ok(env.ids[field].validationMessage);
    assert.equal(env.reports(), 1);
    assert.equal(
      env.requests.length,
      1,
      "Invalid entries must not send POST requests",
    );
    assert.deepEqual(env.navigations, []);
  }
  const upper = create([ready()]);
  await flush();
  upper.fill("27");
  upper.preview();
  assert.equal(upper.state(), "reviewing", "Age 27 remains eligible");
  assert.equal(upper.ids.previewAge.textContent, "27세");
});

test("uncertain submission retries preserve the same v2 body and ID and show only a five-digit receipt", async () => {
  const env = create([
    ready(),
    new Error("Mocked timeout"),
    (_url, options) =>
      response(200, {
        ok: true,
        submissionId: JSON.parse(options.body).submissionId,
        duplicate: true,
        receiptNumber,
      }),
  ]);
  await flush();
  env.fill();
  env.preview();
  env.confirm();
  await flush();
  assert.equal(env.state(), "pending");
  assert.equal(env.ids.hunminFields.disabled, true);
  assert.equal(env.ids.hunminEdit.disabled, true);
  await flush();
  assert.equal(
    env.requests.length,
    2,
    "An uncertain POST must wait for explicit retry",
  );
  let prevented = false;
  env.window.emit("beforeunload", {
    preventDefault() {
      prevented = true;
    },
  });
  assert.equal(prevented, true);
  env.ids.residenceSigungu.value = "강제로 바꾼 값";
  env.confirm();
  env.preview();
  env.retry();
  await flush();
  assert.equal(env.requests[1].options.body, env.requests[2].options.body);
  assert.equal(
    JSON.parse(env.requests[2].options.body).submissionId,
    submissionId,
  );
  assert.equal(
    JSON.parse(env.requests[2].options.body).residenceSigungu,
    "고양시 덕양구",
  );
  assert.equal(env.state(), "complete");
  assert.deepEqual(env.navigations, [
    `/hunmin/thanks#receipt=${receiptNumber}`,
  ]);
});

test("invalid receipt acknowledgements and hashes never display an internal ID or non-five-digit value", async () => {
  for (const receipt of [
    58273,
    "00000",
    "01234",
    "1234",
    "100000",
    submissionId,
  ]) {
    const env = create([
      ready(),
      response(200, {
        ok: true,
        submissionId,
        duplicate: false,
        receiptNumber: receipt,
      }),
    ]);
    await flush();
    env.fill();
    env.preview();
    env.confirm();
    await flush();
    assert.equal(env.state(), "pending");
    assert.deepEqual(env.navigations, []);
  }
  for (const [hash, visible] of [
    [`#receipt=${receiptNumber}`, true],
    ["#receipt=10000", true],
    ["#receipt=99999", true],
    [`#id=${submissionId}`, false],
    [`#receipt=${submissionId}`, false],
    ["#receipt=00000", false],
    ["#receipt=01234", false],
    ["#receipt=1234", false],
    ["#receipt=100000", false],
  ]) {
    const ids = Object.fromEntries(
      [
        "hunminReceipt",
        "hunminReceiptBox",
        "hunminReceiptTitle",
        "hunminReceiptMessage",
      ].map((id) => [id, new Element(id)]),
    );
    ids.hunminReceiptBox.hidden = true;
    vm.runInNewContext(source, {
      document: { getElementById: (id) => ids[id] },
      window: { location: { hash } },
      URLSearchParams,
    });
    assert.equal(ids.hunminReceiptBox.hidden, !visible);
    assert.equal(
      ids.hunminReceipt.textContent,
      visible ? new URLSearchParams(hash.slice(1)).get("receipt") : "",
    );
  }
});

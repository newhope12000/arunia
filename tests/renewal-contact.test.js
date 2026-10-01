import { test } from "node:test";
import assert from "node:assert/strict";
import { sendInquiry } from "../renewal/contact.mjs";

const inquiry = Object.freeze({
  email: "visitor@example.com",
  message: "프로그램 참여 방법이 궁금해요.",
});
const response = (data, ok = true) => async () => ({
  ok,
  json: async () => data,
});

test("inquiry accepts only explicit provider success with a successful HTTP response", async () => {
  for (const success of [true, "true"]) {
    assert.deepEqual(await sendInquiry(inquiry, response({ success })), {
      status: "accepted",
    });
    assert.equal(
      (await sendInquiry(inquiry, response({ success }, false))).status,
      "unknown",
      "a successful-looking body cannot override an HTTP error",
    );
  }
  for (const data of [{ success: 1 }, { success: "yes" }, {}, null]) {
    assert.equal((await sendInquiry(inquiry, response(data))).status, "unknown");
  }
});

test("activation and explicit rejection never produce a false completion", async () => {
  for (const success of [false, "false"]) {
    const activation = await sendInquiry(
      inquiry,
      response({ success, message: "Please activate this form first." }),
    );
    assert.equal(activation.status, "rejected");
    assert.match(activation.message, /아직 전송이 완료되지 않았어요/);

    const rejected = await sendInquiry(
      inquiry,
      response({ success, message: "Submission was rejected." }),
    );
    assert.equal(rejected.status, "rejected");
    assert.match(rejected.message, /접수하지 못했어요/);
  }
});

test("HTTP errors, unreadable responses and transport failures preserve uncertain delivery", async () => {
  const failures = [
    response({ error: "Service unavailable" }, false),
    async () => ({
      ok: true,
      json: async () => {
        throw new SyntaxError("Unexpected response body");
      },
    }),
    async () => {
      throw new TypeError("Network failed");
    },
    async () => {
      const error = new Error("Request timed out");
      error.name = "AbortError";
      throw error;
    },
  ];
  for (const fetcher of failures) {
    const result = await sendInquiry(inquiry, fetcher);
    assert.equal(result.status, "unknown");
    assert.match(result.message, /이미 접수됐을 수/);
    assert.deepEqual(inquiry, {
      email: "visitor@example.com",
      message: "프로그램 참여 방법이 궁금해요.",
    });
  }
});

test("inquiry exports only approved fields and constant metadata to the confirmed recipient", async () => {
  let calls = 0;
  const values = {
    ...inquiry,
    name: "Do not send",
    phone: "Do not send",
    consent: true,
    _cc: "unexpected@example.com",
    _subject: "Untrusted override",
  };
  const result = await sendInquiry(values, async (url, options) => {
    calls += 1;
    assert.equal(url, "https://formsubmit.co/ajax/hwajeongup@gmail.com");
    assert.equal(options.method, "POST");
    assert.deepEqual(options.headers, {
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    assert.ok(options.signal instanceof AbortSignal);
    assert.equal(options.signal.aborted, false);
    assert.deepEqual(JSON.parse(options.body), {
      email: inquiry.email,
      message: inquiry.message,
      _subject: "[어른이아] 홈페이지 문의",
      _template: "table",
      _url: "https://arunia.vercel.app/v0_1/contact.html",
    });
    return { ok: true, json: async () => ({ success: "true" }) };
  });
  assert.equal(calls, 1);
  assert.equal(result.status, "accepted");
  assert.equal(values._cc, "unexpected@example.com");
});

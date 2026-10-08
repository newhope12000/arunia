import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../legacy/assets/contact-inquiry.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../legacy/contact.html", import.meta.url), "utf8");
const legacyEndpoint = "https://script.google.com/macros/s/AKfycbxj8PqxeRRc2Fidc9fTPVf_0kDL3rrKjliTnl2IklyDmcgvsnXvJgE74vuL8jgg6tmoFw/exec";
const emailEndpoint = "https://formsubmit.co/ajax/hwajeongup@gmail.com";
const values = Object.freeze({
  name: "방문자",
  email: "visitor@example.com",
  interest: "collab",
  message: "협업 제안을 남깁니다.",
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function fixture(emailFetch, legacyFetch = async () => ({ type: "opaque" })) {
  const calls = [];
  const timeouts = new Set();
  const fields = Object.fromEntries(Object.entries(values).map(([name, value]) => [name, { value, disabled: false }]));
  const consent = { checked: true, disabled: false };
  const button = { disabled: true, textContent: "소식 받아보기" };
  const element = () => ({ textContent: "", style: {}, focused: false, focus() { this.focused = true; } });
  const status = element();
  const legacyStatus = element();
  const success = element();
  success.style.display = "none";
  const selectors = { "#fname": fields.name, "#femail": fields.email, "#finterest": fields.interest, "#fmessage": fields.message, 'button[type="submit"]': button };
  let onSubmit;
  const form = {
    style: {},
    attributes: {},
    valid: true,
    reportValidity() { return this.valid && consent.checked; },
    querySelector(selector) { return selectors[selector]; },
    querySelectorAll() { return [...Object.values(fields), consent]; },
    setAttribute(name, value) { this.attributes[name] = value; },
    removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(name, listener) { assert.equal(name, "submit"); onSubmit = listener; },
  };
  const elements = { contactForm: form, contactStatus: status, formSuccess: success, contactLegacyStatus: legacyStatus };
  vm.runInNewContext(source, {
    document: { getElementById: (id) => elements[id] },
    AbortController,
    setTimeout(callback) { timeouts.add(callback); return callback; },
    clearTimeout(callback) { timeouts.delete(callback); },
    fetch(url, options) {
      calls.push({ url, options });
      assert.ok([legacyEndpoint, emailEndpoint].includes(url));
      return url === legacyEndpoint ? legacyFetch(options) : emailFetch(options);
    },
  });
  const submit = () => onSubmit({ preventDefault() {} });
  return { fields, consent, button, status, legacyStatus, success, form, calls, timeouts, submit };
}

const response = (data, ok = true) => async () => ({ ok, json: async () => data });
const readFields = (f) => Object.fromEntries(Object.entries(f.fields).map(([name, field]) => [name, field.value]));

test("official form keeps its fields and discloses the email transfer before submission", () => {
  for (const name of Object.keys(values)) assert.match(html, new RegExp(`name="${name}"`));
  assert.match(html, /name="emailConsent" required aria-describedby="contactEmailNotice"/);
  assert.match(html, /FormSubmit[\s\S]*hwajeongup@gmail\.com[\s\S]*30일/);
  assert.match(html, /href="privacy\.html#contact-email"/);
  assert.match(html, /href="mailto:hwajeongup@gmail\.com"/);
  const visibleHtml = html.replace(/<noscript>[\s\S]*?<\/noscript>/g, "");
  assert.match(visibleHtml, /href="mailto:hwajeongup@gmail\.com">이메일로 직접 문의<\/a>/);
  assert.match(html, /<button type="submit"[^>]* disabled>/);
  assert.match(html, /<script src="assets\/contact-inquiry\.js"><\/script>/);
  const commonScript = readFileSync(new URL("../legacy/script.js", import.meta.url), "utf8");
  assert.doesNotMatch(commonScript, /contactForm|APPS_SCRIPT_URL/);
});

test("the linked privacy notice reflects the added email channel and optional fields", () => {
  const privacy = readFileSync(new URL("../legacy/privacy.html", import.meta.url), "utf8");
  assert.match(privacy, /id="contact-email"/);
  assert.match(privacy, /관심 프로그램\(선택\), 문의 내용\(선택\)/);
  assert.match(privacy, /FormSubmit[\s\S]*hwajeongup@gmail\.com[\s\S]*30일/);
  assert.match(privacy, /기존 소식 등록 경로의 처리 방식은 유지합니다/);
  assert.doesNotMatch(privacy, /외부에 위탁하고 있지 않습니다/);
});

test("invalid input or missing transfer consent prevents both requests", async () => {
  for (const missingConsent of [false, true]) {
    const f = fixture(response({ success: true }));
    if (missingConsent) f.consent.checked = false;
    else f.form.valid = false;
    await f.submit();
    assert.equal(f.calls.length, 0);
    assert.equal(f.success.style.display, "none");
    assert.equal(f.button.disabled, false);
  }
});

test("one submission preserves the existing payload and adds one bounded email copy", async () => {
  const legacy = deferred();
  const email = deferred();
  const f = fixture(() => email.promise, () => legacy.promise);
  const pending = f.submit();
  assert.equal(f.calls.length, 2, "Both channels start on the same valid submission");
  const legacyCall = f.calls.find(({ url }) => url === legacyEndpoint);
  assert.equal(legacyCall.options.method, "POST");
  assert.equal(legacyCall.options.mode, "no-cors");
  assert.deepEqual(JSON.parse(JSON.stringify(legacyCall.options.headers)), { "Content-Type": "application/json" });
  assert.deepEqual(JSON.parse(legacyCall.options.body), values);
  const emailCall = f.calls.find(({ url }) => url === emailEndpoint);
  assert.equal(emailCall.options.method, "POST");
  assert.equal(emailCall.options.mode, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(emailCall.options.headers)), { "Content-Type": "application/json", Accept: "application/json" });
  assert.deepEqual(JSON.parse(emailCall.options.body), {
    ...values,
    _subject: "[어른이아] 홈페이지 문의",
    _template: "table",
    _url: "https://www.arunia.co.kr/contact.html",
  });
  assert.ok(f.calls.every(({ options }) => options.signal instanceof AbortSignal));
  assert.equal(f.form.attributes["aria-busy"], "true");
  assert.equal(f.button.disabled, true);
  assert.equal(f.success.style.display, "none", "No optimistic completion while requests are pending");
  await f.submit();
  assert.equal(f.calls.length, 2, "A second click cannot duplicate either request");

  legacy.resolve({ type: "opaque" });
  await Promise.resolve();
  assert.equal(f.success.style.display, "none", "An opaque legacy response cannot confirm the email request");
  email.resolve({ ok: true, json: async () => ({ success: "true" }) });
  await pending;
  assert.equal(f.form.style.display, "none");
  assert.equal(f.success.style.display, "block");
  assert.equal(f.success.focused, true);
  assert.match(f.legacyStatus.textContent, /완료 여부는 이 화면에서 확인할 수 없습니다/);
  assert.equal(f.form.attributes["aria-busy"], undefined);
  assert.equal(f.timeouts.size, 0);
  await f.submit();
  assert.equal(f.calls.length, 2, "Completion cannot trigger a repeated legacy registration");
});

test("only explicit email provider success with HTTP success reveals completion", async () => {
  for (const success of [true, "true"]) {
    const f = fixture(response({ success }));
    await f.submit();
    assert.equal(f.success.style.display, "block");
  }
  for (const providerResponse of [{ success: 1 }, { success: "yes" }, {}, null]) {
    const f = fixture(response(providerResponse));
    await f.submit();
    assert.equal(f.success.style.display, "none");
    assert.match(f.status.textContent, /전송 결과를 확인하지 못했습니다/);
  }
  const httpError = fixture(response({ success: true }, false));
  await httpError.submit();
  assert.equal(httpError.success.style.display, "none");
  assert.match(httpError.status.textContent, /이미 전달됐을 수 있습니다/);
});

test("email rejection preserves values, distinguishes failure and prevents duplicate legacy retry", async () => {
  for (const success of [false, "false"]) {
    const f = fixture(response({ success, message: "Please activate your form." }));
    await f.submit();
    assert.equal(f.success.style.display, "none");
    assert.equal(f.form.style.display, undefined);
    assert.deepEqual(readFields(f), values);
    assert.ok(Object.values(f.fields).every((field) => !field.disabled));
    assert.match(f.status.textContent, /거절되어 완료되지 않았습니다/);
    assert.match(f.status.textContent, /기존 소식 등록[\s\S]*완료 여부는[\s\S]*다시 제출하지 말고 hwajeongup@gmail\.com/);
    assert.equal(f.status.focused, true);
    assert.equal(f.button.disabled, true);
    assert.equal(f.timeouts.size, 0);
    await f.submit();
    assert.equal(f.calls.length, 2, "No retry of either path after rejection");
  }
});

test("transport failures and unreadable email responses preserve uncertain delivery without retries", async () => {
  const failures = [
    async () => { throw new TypeError("Network failed"); },
    async () => ({ ok: true, json: async () => { throw new SyntaxError("Unreadable response"); } }),
    async () => ({ ok: false, json: async () => ({ error: "Unavailable" }) }),
  ];
  for (const failedEmail of failures) {
    const f = fixture(failedEmail, async () => { throw new TypeError("Legacy response lost"); });
    await f.submit();
    assert.equal(f.success.style.display, "none");
    assert.match(f.status.textContent, /문의 메일 전송 결과를 확인하지 못했습니다[\s\S]*이미 전달됐을 수 있습니다/);
    assert.match(f.status.textContent, /기존 소식 등록 요청의 전달 여부를 확인하지 못했습니다/);
    assert.deepEqual(readFields(f), values);
    assert.equal(f.timeouts.size, 0);
    await f.submit();
    assert.equal(f.calls.length, 2);
  }
});

test("email acceptance is reported independently from an unconfirmed legacy request", async () => {
  const f = fixture(response({ success: true }), async () => { throw new TypeError("Legacy failed"); });
  await f.submit();
  assert.equal(f.success.style.display, "block");
  assert.match(f.legacyStatus.textContent, /기존 소식 등록 요청의 전달 여부를 확인하지 못했습니다/);
  assert.doesNotMatch(f.legacyStatus.textContent, /저장되었습니다|등록되었습니다/);
});

test("an unresponsive legacy request cannot stall accepted email delivery", async () => {
  const f = fixture(response({ success: true }), () => new Promise(() => {}));
  await f.submit();
  assert.equal(f.success.style.display, "block");
  assert.equal(f.timeouts.size, 1, "The legacy request retains its independent deadline");
  assert.match(f.legacyStatus.textContent, /완료 여부는 이 화면에서 확인할 수 없습니다/);
  for (const timeout of [...f.timeouts]) timeout();
  // Allow the deadline and independent legacy status update to settle.
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
  assert.equal(f.timeouts.size, 0, "A fetch that ignores abort still has a bounded deadline");
  assert.match(f.legacyStatus.textContent, /전달 여부를 확인하지 못했습니다/);
  assert.equal(f.success.style.display, "block", "Legacy uncertainty cannot undo the email acknowledgement");
  assert.equal(f.calls.length, 2);
});

test("an unresponsive email transport still exits at the deadline without assuming failure", async () => {
  const f = fixture(() => new Promise(() => {}), () => new Promise(() => {}));
  const pending = f.submit();
  for (const timeout of [...f.timeouts]) timeout();
  await pending;
  assert.equal(f.success.style.display, "none");
  assert.equal(f.timeouts.size, 0);
  assert.match(f.status.textContent, /전송 결과를 확인하지 못했습니다[\s\S]*이미 전달됐을 수 있습니다/);
  assert.deepEqual(readFields(f), values);
  assert.equal(f.button.disabled, true);
  await f.submit();
  assert.equal(f.calls.length, 2);
});

test("timeouts release the form status while retaining values and delivery uncertainty", async () => {
  const abortingFetch = (options) => new Promise((resolve, reject) => {
    options.signal.addEventListener("abort", () => {
      const error = new Error("Request timed out");
      error.name = "AbortError";
      reject(error);
    }, { once: true });
  });
  const f = fixture(abortingFetch, abortingFetch);
  const pending = f.submit();
  assert.equal(f.timeouts.size, 2);
  for (const timeout of [...f.timeouts]) timeout();
  await pending;
  assert.equal(f.success.style.display, "none");
  assert.match(f.status.textContent, /전송 결과를 확인하지 못했습니다/);
  assert.deepEqual(readFields(f), values);
  assert.equal(f.form.attributes["aria-busy"], undefined);
  assert.equal(f.timeouts.size, 0);
  await f.submit();
  assert.equal(f.calls.length, 2);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../legacy/gamja/apply/app.js', import.meta.url), 'utf8');
const endpoint = 'https://applications-collection.vercel.app/api/gamja-apply/';

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

const response = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
});
const settle = () => new Promise(resolve => setImmediate(resolve));

function setup(fetch) {
  class Element {
    constructor(id) {
      this.id = id;
      this.value = '';
      this.checked = false;
      this.disabled = false;
      this.hidden = false;
      this.listeners = {};
      this.attributes = {};
      this.classes = new Set();
      this.classList = { add: value => this.classes.add(value), remove: value => this.classes.delete(value) };
    }
    addEventListener(type, fn) { this.listeners[type] = fn; }
    setAttribute(name, value) { this.attributes[name] = value; }
    focus() { this.focused = true; }
  }
  const ids = ['applyForm', 'applicationFields', 'formStatus', 'readinessRetry', 'f-name', 'f-phone', 'f-age', 'f-location', 'f-job', 'f-concern', 'f-privacy', 'f-consulting', 'website', 'applyView', 'completionView', 'submit', 'calling'];
  const nodes = Object.fromEntries(ids.map(id => [id, new Element(id)]));
  nodes.completionView.classes.add('hidden');
  Object.entries({ 'f-name': '연동 확인', 'f-phone': '010-0000-0000', 'f-age': '2001', 'f-location': '테스트시', 'f-job': 'jobseeker', 'f-concern': '폼 동작 모의 확인', calling: 'afternoon' }).forEach(([id, value]) => { nodes[id].value = value; });
  nodes['f-privacy'].checked = true;
  let localStorageReads = 0;
  let idCounter = 0;
  const requests = [];
  const timers = new Map();
  let timerId = 0;
  const location = new URL('https://www.arunia.co.kr/gamja/apply?type=6&src=gamja&utm_source=example&utm_campaign=potato');
  const context = {
    URLSearchParams, AbortController, Date, Math,
    crypto: { randomUUID: () => `gamja-test-${++idCounter}` },
    navigator: { userAgent: 'Gamja mock browser' }, location,
    document: {
      referrer: 'https://www.arunia.co.kr/gamja/report?src=gamja',
      getElementById: id => nodes[id],
      querySelector: selector => selector === '.submit' ? nodes.submit : selector === 'input[name="calling"]:checked' ? nodes.calling : null,
    },
    window: { scrollTo: () => {} },
    localStorage: { getItem: () => { localStorageReads++; throw new Error('Old quiz storage must never be read'); } },
    fetch: (url, options) => { requests.push({ url, ...options }); return fetch(url, options, requests.length); },
    setTimeout: fn => { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout: id => timers.delete(id),
  };
  vm.runInNewContext(source, context, { filename: 'gamja/apply/app.js' });
  return { nodes, requests, timers, storageReads: () => localStorageReads, submit: () => nodes.applyForm.listeners.submit({ preventDefault() {} }), reconnect: () => nodes.readinessRetry.listeners.click() };
}

test('gamja form stays disabled until readiness is confirmed and can recover from an unavailable connection', async () => {
  const first = deferred();
  const app = setup((_url, options, count) => count === 1 ? first.promise : Promise.resolve(response({ ok: true, ready: true })));
  assert.equal(app.nodes.applicationFields.disabled, true);
  assert.equal(app.nodes.submit.disabled, true);
  await app.submit();
  assert.equal(app.requests.length, 1);
  assert.equal(app.requests[0].url, endpoint);
  assert.equal(app.requests[0].method, 'GET');
  first.resolve(response({ ok: true, ready: false }));
  await settle();
  assert.equal(app.nodes.applicationFields.disabled, true);
  assert.equal(app.nodes.readinessRetry.hidden, false);
  await app.reconnect();
  assert.equal(app.nodes.applicationFields.disabled, false);
  assert.equal(app.nodes.submit.disabled, false);
  assert.equal(app.nodes.applyForm.attributes['aria-busy'], 'false');
});

test('gamja completion requires a matching saved submission and never reads or sends old quiz results', async () => {
  const app = setup((_url, options) => options.method === 'GET'
    ? Promise.resolve(response({ ok: true, ready: true }))
    : Promise.resolve(response({ ok: true, submissionId: JSON.parse(options.body).submissionId, duplicate: false })));
  await settle();
  await app.submit();
  const submitted = JSON.parse(app.requests[1].body);
  assert.equal(submitted.sheetTab, 'Career_Report_10C');
  assert.equal(submitted.consentVersion, 'jm10c-v1');
  assert.equal(submitted.resultType, '');
  assert.equal(submitted.pageUrl, 'https://www.arunia.co.kr/gamja/apply?type=6&src=gamja&utm_source=example&utm_campaign=potato');
  assert.equal(submitted.utmSource, 'example');
  assert.equal(submitted.utmCampaign, 'potato');
  assert.equal(app.storageReads(), 0);
  for (const field of ['answers', 'scores', 'result', 'surveyResult']) assert.equal(Object.hasOwn(submitted, field), false);
  assert.equal(app.nodes.applyView.classes.has('hidden'), true);
  assert.equal(app.nodes.completionView.classes.has('hidden'), false);
  assert.equal(app.nodes.completionView.focused, true);
  assert.equal(app.nodes.submit.disabled, true);
  await app.submit();
  assert.equal(app.requests.length, 2);
});

test('uncertain responses keep the same frozen application body across retries and prevent overlapping submissions', async () => {
  const post = deferred();
  let posts = 0;
  const app = setup((_url, options) => {
    if (options.method === 'GET') return Promise.resolve(response({ ok: true, ready: true }));
    posts++;
    return posts === 1 ? post.promise : Promise.resolve(response({ ok: true, submissionId: JSON.parse(options.body).submissionId, duplicate: true }));
  });
  await settle();
  const sending = app.submit();
  await app.submit();
  assert.equal(posts, 1);
  assert.equal(app.nodes.applicationFields.disabled, true);
  post.resolve(response({ ok: true, submissionId: 'different-submission', duplicate: false }));
  await sending;
  assert.equal(app.nodes.completionView.classes.has('hidden'), true);
  assert.equal(app.nodes.applicationFields.disabled, true);
  assert.equal(app.nodes.submit.disabled, false);
  assert.equal(app.nodes.submit.textContent, '접수 확인 다시하기');
  app.nodes['f-name'].value = 'Changed while uncertain';
  await app.submit();
  assert.equal(app.requests[2].body, app.requests[1].body);
  assert.equal(app.nodes.completionView.classes.has('hidden'), false);
});

test('HTTP failures, unreadable bodies, pending writes and transport errors cannot show a false completion', async () => {
  const failures = [
    () => response({ ok: true, submissionId: 'gamja-test-1', duplicate: false }, 503),
    () => ({ ok: true, status: 200, json: async () => { throw new Error('invalid JSON'); } }),
    () => response({ ok: true, pending: true, submissionId: 'gamja-test-1', duplicate: false }),
    () => { throw new Error('network unavailable'); },
    () => response({ ok: true, submissionId: 'gamja-test-1' }),
  ];
  for (const failure of failures) {
    const app = setup((_url, options) => options.method === 'GET' ? Promise.resolve(response({ ok: true, ready: true })) : Promise.resolve().then(failure));
    await settle();
    await app.submit();
    assert.equal(app.nodes.completionView.classes.has('hidden'), true);
    assert.equal(app.nodes.applicationFields.disabled, true);
    assert.equal(app.nodes.submit.textContent, '접수 확인 다시하기');
  }
});

test('validation rejection permits editing with a new ID, while conflicting IDs cannot be resubmitted', async () => {
  let posts = 0;
  const app = setup((_url, options) => options.method === 'GET'
    ? Promise.resolve(response({ ok: true, ready: true }))
    : Promise.resolve(++posts === 1 ? response({ ok: false, error: '입력값 확인' }, 400) : response({ ok: false, code: 'SUBMISSION_CONFLICT', error: '접수 내용 충돌' }, 409)));
  await settle();
  await app.submit();
  assert.equal(app.nodes.applicationFields.disabled, false);
  assert.equal(app.nodes.formStatus.textContent, '입력값 확인');
  await app.submit();
  assert.notEqual(JSON.parse(app.requests[1].body).submissionId, JSON.parse(app.requests[2].body).submissionId);
  assert.equal(app.nodes.applicationFields.disabled, true);
  assert.equal(app.nodes.submit.disabled, true);
  await app.submit();
  assert.equal(posts, 2);
});

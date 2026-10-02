import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import {
  PROGRAM_CATALOG,
  PROGRAM_ARCHIVES,
  getPrograms,
  programState,
} from "../renewal/program-data.mjs";
import {
  extractContest,
  renderOfficialPrograms,
} from "../renewal/official-programs.mjs";
import { recruitmentState } from "../renewal/availability.mjs";

const legacyHtml = readFileSync(
  new URL("../legacy/programs.html", import.meta.url),
  "utf8",
);
const now = Date.parse("2026-10-02T19:30:00+09:00");

test("catalog distinguishes open Hunmin from closed CORE-UP and Mandu while retaining their detail routes", () => {
  const states = Object.fromEntries(
    PROGRAM_CATALOG.map((record) => [record.id, programState(record, now)]),
  );
  assert.equal(states["hunmin-contest"], "open");
  assert.equal(states["career-core-up-4"], "closed");
  assert.equal(states["mandu-contest"], "closed");
  const hunmin = PROGRAM_CATALOG.find(
    (record) => record.id === "hunmin-contest",
  );
  const deadline = Date.parse("2026-10-06T18:00:00+09:00");
  assert.equal(programState(hunmin, deadline - 1), "open");
  assert.equal(programState(hunmin, deadline), "closed");
  const html = renderOfficialPrograms(
    extractContest(legacyHtml),
    PROGRAM_CATALOG,
    now,
  );
  for (const record of [...PROGRAM_CATALOG, ...PROGRAM_ARCHIVES])
    assert.ok(
      html.includes(`href="${record.href}"`),
      `Missing program route: ${record.href}`,
    );
  assert.match(html, /id="career"/);
  assert.match(
    html,
    /id="career-core-up-4"[\s\S]*?data-program-status="closed"/,
  );
  assert.match(html, /id="mandu-contest"[\s\S]*?data-program-status="closed"/);
  assert.doesNotMatch(
    html,
    /OPEN NOW|지금 응모하기|arunia-apply\.vercel\.app\/mandu3|핵심 매출원|LTV|Lock-in/,
  );
});

test("past contest remains reachable at the original anchor with its poster, terms and result notice", () => {
  const contest = extractContest(legacyHtml);
  const html = renderOfficialPrograms(contest, PROGRAM_CATALOG, now);
  assert.match(html, /<details class="catalog-contest" id="contest">/);
  assert.ok(
    html.includes(contest),
    "Past contest details must survive catalog migration",
  );
  for (const preserved of [
    "contest-card-a.png",
    "공모주제",
    "응모자격",
    "시상내역",
    "2026.09.01 — 09.22",
    "2026년 10월 7일(수)",
  ])
    assert.ok(html.includes(preserved), `Past contest lost ${preserved}`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(
    new Set(ids).size,
    ids.length,
    "Catalog element IDs must remain unique",
  );
  assert.throws(
    () => extractContest(legacyHtml.replace("접수 마감", "OPEN NOW")),
    /still-open/,
  );
});

test("an additional program only needs a validated record and cannot insert unsafe markup or an external intake link", () => {
  const base = PROGRAM_CATALOG[0];
  const record = {
    ...base,
    id: "career-next",
    name: '다음 <script>프로그램</script> & "제목"',
    href: "/career-core-up",
  };
  const records = [...PROGRAM_CATALOG, record];
  const html = renderOfficialPrograms(extractContest(legacyHtml), records, now);
  assert.match(html, /id="career-next"/);
  assert.ok(
    html.includes(
      "다음 &lt;script&gt;프로그램&lt;/script&gt; &amp; &quot;제목&quot;",
    ),
  );
  assert.doesNotMatch(html, /<script>프로그램<\/script>/);
  assert.equal(PROGRAM_CATALOG.length, 6);
  for (const invalid of [
    { ...base, id: "../next" },
    { ...base, group: "missing" },
    { ...base, href: "https://unverified.example/apply" },
    { ...base, href: "//unverified.example/apply" },
    { ...base, end: "not-a-date" },
    { ...base, start: base.end },
  ])
    assert.throws(() => getPrograms([invalid]));
  assert.throws(() => getPrograms([base, base]), /duplicate/);
});

test("a cached static page refreshes expired badges and opens the existing contest deep link on arrival", () => {
  const badge = {
    dataset: { programEnd: "2026-10-06T18:00:00+09:00", programStatus: "open" },
    textContent: "접수 중",
  };
  const archive = { open: false };
  const handlers = {};
  class BrowserDate extends Date {
    static now() {
      return Date.parse("2026-10-07T12:00:00+09:00");
    }
  }
  const script = readFileSync(
    new URL("../renewal/site.js", import.meta.url),
    "utf8",
  ).replace(/^import .*;\n/gm, "");
  vm.runInNewContext(script, {
    recruitmentState,
    initContact() {},
    sendInquiry() {},
    Date: BrowserDate,
    location: { hash: "#contest" },
    window: {
      addEventListener: (name, fn) => {
        handlers[name] = fn;
      },
    },
    document: {
      querySelector: (selector) =>
        selector === "#cohort-data"
          ? {
              textContent: JSON.stringify({
                start: "2026-09-07T00:00:00+09:00",
                end: "2026-10-01T00:00:00+09:00",
              }),
            }
          : selector === "details#contest"
            ? archive
            : null,
      querySelectorAll: (selector) =>
        selector === "[data-program-end]" ? [badge] : [],
      addEventListener() {},
    },
    matchMedia: () => ({ addEventListener() {} }),
  });
  assert.equal(badge.dataset.programStatus, "closed");
  assert.equal(badge.textContent, "접수 마감");
  assert.equal(archive.open, true);
  assert.equal(typeof handlers.hashchange, "function");
});

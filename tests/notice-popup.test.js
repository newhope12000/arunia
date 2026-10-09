import { test } from "node:test";
import assert from "node:assert/strict";
import { getKoreanDateKey, initNoticePopup, NOTICE_STORAGE_KEY, setupNoticePopup } from "../renewal/notice-popup.js";
import { renderNoticePopup, WINNERS_NOTICE_URL } from "../renewal/notice-popup.mjs";

function fixture() {
  const listeners = new Map();
  const button = () => ({ addEventListener(type, callback) { this[type] = callback; } });
  const closeButton = button();
  const todayButton = button();
  const dialog = {
    open: false,
    shown: 0,
    closed: 0,
    showModal() { this.open = true; this.shown += 1; },
    close() { this.open = false; this.closed += 1; },
    addEventListener(type, callback) { listeners.set(type, callback); },
    querySelector(selector) {
      return selector === "[data-notice-popup-close]" ? closeButton : selector === "[data-notice-popup-today]" ? todayButton : null;
    },
  };
  const saved = new Map();
  const writes = [];
  const storage = {
    getItem(key) { return saved.get(key) ?? null; },
    setItem(key, value) { saved.set(key, value); writes.push([key, value]); },
  };
  return { dialog, listeners, closeButton, todayButton, storage, saved, writes };
}

test("today suppression expires at midnight in Korea rather than UTC or the browser time zone", () => {
  assert.equal(getKoreanDateKey(new Date("2026-10-08T14:59:59.999Z")), "2026-10-08");
  assert.equal(getKoreanDateKey(new Date("2026-10-08T15:00:00.000Z")), "2026-10-09");
  assert.equal(getKoreanDateKey(new Date("2026-12-31T15:00:00.000Z")), "2027-01-01");
});

test("the latest Hunmin result is one native dialog with its own navigation and closing controls", () => {
  const html = renderNoticePopup();
  assert.match(html, /<dialog[^>]*data-notice-popup[^>]*aria-labelledby="notice-popup-title"/);
  assert.doesNotMatch(html, /<dialog[^>]*\bopen(?:\s|=|>)/);
  assert.equal((html.match(/<dialog\b/g) ?? []).length, 1);
  assert.equal((html.match(/<a\b/g) ?? []).length, 1);
  assert.equal(WINNERS_NOTICE_URL, "/notices/hunmin-acrostic-winners");
  assert.match(html, /href="\/notices\/hunmin-acrostic-winners"/);
  assert.match(html, /2026 한글날 기념/);
  assert.match(html, /제1회 훈민정음 4행시 공모전<br>최종 당선자 발표/);
  assert.match(html, /수석 2명 · 차석 10명 · 장려상 30명/);
  assert.doesNotMatch(html, /그만둘만두|보름달/);
  const anchorEnd = html.indexOf("</a>");
  assert.ok(html.indexOf("data-notice-popup-close") > anchorEnd);
  assert.ok(html.indexOf("data-notice-popup-today") > anchorEnd);
  assert.match(html, /data-notice-popup-close autofocus/);
});

test("a saved Mandu dismissal cannot hide the new Hunmin result announcement", () => {
  const f = fixture();
  const oldKey = "arunia:notice-popup:mandu-contest-winners:2026-10-08";
  const now = () => new Date("2026-10-09T06:00:00Z");
  f.saved.set(oldKey, "2026-10-09");
  assert.equal(NOTICE_STORAGE_KEY, "arunia:notice-popup:hunmin-acrostic-winners:2026-10-09");
  assert.equal(setupNoticePopup(f.dialog, { storage: f.storage, now }), true);
  f.todayButton.click();
  assert.deepEqual(f.writes, [[NOTICE_STORAGE_KEY, "2026-10-09"]]);
  assert.equal(f.saved.get(oldKey), "2026-10-09", "The previous notice preference stays unchanged");
  const nextVisit = fixture();
  assert.equal(setupNoticePopup(nextVisit.dialog, { storage: f.storage, now }), false);
});

test("closing once closes only this display without suppressing a later visit", () => {
  const f = fixture();
  const now = () => new Date("2026-10-08T06:00:00Z");
  assert.equal(setupNoticePopup(f.dialog, { storage: f.storage, now }), true);
  f.closeButton.click();
  assert.equal(f.dialog.open, false);
  assert.equal(f.dialog.closed, 1);
  assert.equal(f.writes.length, 0);
  const nextVisit = fixture();
  assert.equal(setupNoticePopup(nextVisit.dialog, { storage: f.storage, now }), true);
});

test("today button suppresses repeated visits only until the next Korean date", () => {
  const f = fixture();
  setupNoticePopup(f.dialog, { storage: f.storage, now: () => new Date("2026-10-08T14:59:00Z") });
  f.todayButton.click();
  assert.equal(f.dialog.open, false);
  assert.deepEqual(f.writes, [[NOTICE_STORAGE_KEY, "2026-10-08"]]);
  const sameDay = fixture();
  assert.equal(setupNoticePopup(sameDay.dialog, { storage: f.storage, now: () => new Date("2026-10-08T14:59:59Z") }), false);
  assert.equal(sameDay.dialog.shown, 0);
  const nextDay = fixture();
  assert.equal(setupNoticePopup(nextDay.dialog, { storage: f.storage, now: () => new Date("2026-10-08T15:00:00Z") }), true);
});

test("today action records the date of the click if the page stayed open across midnight", () => {
  const f = fixture();
  let date = new Date("2026-10-08T14:59:59Z");
  setupNoticePopup(f.dialog, { storage: f.storage, now: () => date });
  date = new Date("2026-10-08T15:00:00Z");
  f.todayButton.click();
  assert.deepEqual(f.writes, [[NOTICE_STORAGE_KEY, "2026-10-09"]]);
});

test("blocked preference storage cannot prevent display or closing", () => {
  const f = fixture();
  const storage = {
    getItem() { throw new Error("Storage blocked"); },
    setItem() { throw new Error("Storage blocked"); },
  };
  assert.equal(setupNoticePopup(f.dialog, { storage }), true);
  assert.doesNotThrow(() => f.todayButton.click());
  assert.equal(f.dialog.open, false);
  assert.equal(f.dialog.closed, 1);
});

test("Escape closes the native dialog without saving a daily suppression", () => {
  const f = fixture();
  setupNoticePopup(f.dialog, { storage: f.storage });
  let prevented = false;
  f.listeners.get("cancel")({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(f.dialog.open, false);
  assert.equal(f.writes.length, 0);
});

test("initialization only targets the marked dialog and does not reopen it twice", () => {
  const f = fixture();
  const root = { querySelector(selector) { assert.equal(selector, "[data-notice-popup]"); return f.dialog; } };
  assert.equal(initNoticePopup(root, { storage: f.storage }), true);
  assert.equal(initNoticePopup(root, { storage: f.storage }), false);
  assert.equal(f.dialog.shown, 1);
  assert.equal(initNoticePopup({ querySelector() { return null; } }), false);
});

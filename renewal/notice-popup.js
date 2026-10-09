export const NOTICE_STORAGE_KEY = "arunia:notice-popup:hunmin-acrostic-winners:2026-10-09";

const koreanDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getKoreanDateKey(now = new Date()) {
  const parts = Object.fromEntries(koreanDateFormat.formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function browserStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

const initializedDialogs = new WeakSet();

export function setupNoticePopup(dialog, { storage = browserStorage(), now = () => new Date() } = {}) {
  if (!dialog || typeof dialog.showModal !== "function" || initializedDialogs.has(dialog)) return false;
  initializedDialogs.add(dialog);

  const close = () => {
    if (dialog.open) dialog.close();
  };

  dialog.querySelector("[data-notice-popup-close]")?.addEventListener("click", close);
  dialog.querySelector("[data-notice-popup-today]")?.addEventListener("click", () => {
    try {
      storage?.setItem(NOTICE_STORAGE_KEY, getKoreanDateKey(now()));
    } catch {
      // Closing remains available when the browser blocks persistent storage.
    }
    close();
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });

  let dismissedToday = false;
  try {
    dismissedToday = storage?.getItem(NOTICE_STORAGE_KEY) === getKoreanDateKey(now());
  } catch {
    // An unavailable preference store must not hide the announcement.
  }
  if (dismissedToday) return false;

  dialog.showModal();
  return true;
}

export function initNoticePopup(root, options) {
  return setupNoticePopup(root.querySelector("[data-notice-popup]"), options);
}

if (typeof document !== "undefined") initNoticePopup(document);

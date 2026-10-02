import { recruitmentState } from "./availability.js";
import { initContact, sendInquiry } from "./contact.mjs";

initContact(document, sendInquiry);

const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector("#site-menu");
function setMenu(open) {
  menuButton?.setAttribute("aria-expanded", String(open));
  menuButton?.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
  menu?.classList.toggle("is-open", open);
}
menuButton?.addEventListener("click", () =>
  setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
);
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    menuButton?.getAttribute("aria-expanded") === "true"
  ) {
    setMenu(false);
    menuButton.focus();
  }
});
menu?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".site-header")) setMenu(false);
});
const desktopMenu = matchMedia("(min-width: 1101px)");
desktopMenu.addEventListener("change", () => setMenu(false));

const data = JSON.parse(document.querySelector("#cohort-data").textContent);
const state = recruitmentState(Date.now(), data.start, data.end);
// Refresh catalog deadlines on each visit even when static pages were built earlier.
document.querySelectorAll("[data-program-end]").forEach((el) => {
  const programState = recruitmentState(
    Date.now(),
    el.dataset.programStart || "1970-01-01T00:00:00Z",
    el.dataset.programEnd,
  );
  el.dataset.programStatus = programState;
  el.textContent = {
    open: "접수 중",
    upcoming: "접수 예정",
    closed: "접수 마감",
  }[programState];
});
function openLinkedArchive() {
  if (location.hash !== "#contest") return;
  const archive = document.querySelector("details#contest");
  if (archive) archive.open = true;
}
openLinkedArchive();
window.addEventListener("hashchange", openLinkedArchive);
document.querySelectorAll("[data-cohort-status]").forEach((el) => {
  el.textContent = {
    open: "모집 중",
    upcoming: "모집 예정",
    closed: "모집 마감",
  }[state];
});
if (state !== "open") {
  document.querySelectorAll("[data-application]").forEach((el) => {
    el.href =
      state === "closed"
        ? "/v0_1/programs.html"
        : "/v0_1/growth_4.html#recruitment";
    el.textContent =
      state === "closed" ? "다른 프로그램 보기 ↗" : "모집 일정 확인하기 ↗";
    el.removeAttribute("target");
  });
  if (state === "closed")
    document
      .querySelectorAll("[data-closed-message]")
      .forEach((el) => (el.hidden = false));
}

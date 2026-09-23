import { recruitmentState } from "./availability.js";

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

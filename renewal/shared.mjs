export const BASE = "/v0_1/";
export const COHORT = Object.freeze({
  number: 4,
  name: "커리어 CORE-UP 성장 프로젝트 4기",
  start: "2026-09-07T00:00:00+09:00",
  end: "2026-10-01T00:00:00+09:00",
  period: "2026. 9. 7. — 9. 30.",
  result: "2026. 10. 12.",
  capacity: 30,
  application: "https://arunia-career-core-up.lkhy48.chatgpt.site/#apply",
});
export const esc = (text) =>
  String(text).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export const url = (path = "") => `${BASE}${path}`;
export const arrow = '<span aria-hidden="true">↗</span>';
export const link = (path, text, cls = "text-link") =>
  `<a class="${cls}" href="${url(path)}">${text}${arrow}</a>`;
export function picture(name, alt, { eager = false, cls = "" } = {}) {
  return `<img class="${cls}" src="${url(`assets/images/${name}-1600.webp`)}" srcset="${url(`assets/images/${name}-640.webp`)} 640w, ${url(`assets/images/${name}-1600.webp`)} 1600w" sizes="(max-width: 760px) 100vw, 58vw" width="1600" height="1067" alt="${esc(alt)} · AI 연출 이미지" ${eager ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="async">`;
}
export const sectionHead = (eyebrow, title, text = "") =>
  `<div class="section-heading"><p class="eyebrow">${eyebrow}</p><h2>${title}</h2>${text ? `<p class="lead">${text}</p>` : ""}</div>`;
export const intro = (eyebrow, title, text) =>
  `<section class="page-intro wrap"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="lead">${text}</p></section>`;
export const applyLink = (text = "4기 지원하기", cls = "button") =>
  `<a class="${cls}" href="${COHORT.application}" target="_blank" rel="noopener noreferrer" data-application>${text}${arrow}</a>`;
export const ctaBand = () =>
  `<section class="cta-band"><div class="wrap cta-inner"><div><p class="eyebrow">CORE-UP 4기 <span data-cohort-status>모집 중</span></p><h2>내게 맞는 일을,<br>경험하며 찾아봐요.</h2><p>${COHORT.period} · 최종 ${COHORT.capacity}명</p></div><div>${link("growth_4.html", "4기 자세히 보기", "button button-light")}<p class="small">만 26세 이하 · 서울 거주 또는 서울 소재 대학·직장 소속</p></div></div></section>`;
export const notice = (title, text) =>
  `<aside class="notice"><h3>${title}</h3><p>${text}</p></aside>`;
export const steps = [
  [
    "01",
    "사전미팅",
    "요즘의 고민부터",
    "참여 목적과 지금의 고민을 나누고, 앞으로의 과정을 함께 살펴봐요.",
  ],
  [
    "02",
    "1:1 성향상담",
    "나를 이해하는 시간",
    "성향 결과를 바탕으로 내가 편하게 하는 일과 강점을 정리해요.",
  ],
  [
    "03",
    "현직자 멘토링 · 3일 실무 경험",
    "직접 해보며 알아봐요",
    "현직자와 일의 실제 모습을 이야기하고, 작은 실무 과제를 경험해요.",
  ],
  [
    "04",
    "프로필 이력서 제작",
    "경험을 내 이야기로",
    "상담과 실무 경험에서 발견한 내용을 나만의 프로필 이력서로 정리해요.",
  ],
];

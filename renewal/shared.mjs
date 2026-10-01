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
  `<section class="cta-band"><div class="wrap cta-inner"><div><p class="eyebrow">나에게 맞는 시작</p><h2>읽어보고, 이야기하고,<br>한 번 해봐요.</h2><p>지금 필요한 경험부터 골라보세요.</p></div><div class="cta-options">${link("programs.html", "프로그램 둘러보기", "button button-light")}${link("pricing.html", "구독 플랜 비교하기", "text-link")}</div></div></section>`;
export const PROGRAMS = [
  {
    id: "content-archive",
    name: "전문가 콘텐츠 아카이브",
    label: "읽고 생각해요",
    text: "다른 사람의 시작과 선택을 읽고, 질문 카드에 내 생각을 남겨요. 필요할 때 다시 꺼내볼 수 있어요.",
    price: "일부 콘텐츠 무료 · 베이직 월 9,900원",
  },
  {
    id: "premium-round",
    name: "프리미엄 라운드테이블",
    label: "만나서 이야기해요",
    text: "비슷한 고민을 하는 8~15명이 모여 일과 일상 이야기를 나눠요. 서로의 경험에서 다음 생각을 찾아봐요.",
    price: "프리미엄 구독에 포함",
  },
  {
    id: "day-one",
    name: "DAY ONE 클래스",
    label: "직접 경험해요",
    text: "한 번쯤 궁금했던 일을 짧은 클래스로 경험해요. 온라인과 오프라인 중 나에게 맞는 방식을 살펴보세요.",
    price: "원데이 클래스 5만원부터 · 프리미엄 회원 할인",
  },
];
export const PLANS = [
  {
    id: "free",
    name: "무료",
    price: "0원",
    text: "일부 아카이브와 영상 3편, 질문 카드 5장으로 가볍게 둘러봐요.",
  },
  {
    id: "basic",
    name: "베이직",
    price: "9,900원",
    text: "전체 아카이브와 질문 카드, 월간 큐레이션으로 꾸준히 생각을 정리해요.",
  },
  {
    id: "premium",
    name: "프리미엄",
    price: "29,000원",
    text: "베이직 혜택에 라운드테이블 참여와 클래스 할인을 더해요.",
  },
];
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

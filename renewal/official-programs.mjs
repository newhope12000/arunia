import { renderPage } from "./layout.mjs";
import { officialPageOptions } from "./official-shared.mjs";
import { arrow, esc } from "./shared.mjs";
import {
  PROGRAM_CATALOG,
  PROGRAM_GROUPS,
  PROGRAM_ARCHIVES,
  getPrograms,
  programState,
} from "./program-data.mjs";

const statusLabels = {
  open: "접수 중",
  upcoming: "접수 예정",
  closed: "접수 마감",
};

export function renderProgramCards(records, now = Date.now()) {
  return `<ul class="catalog-grid">${getPrograms(records)
    .map((record) => {
      const state = programState(record, now);
      const badge = state
        ? `<span class="catalog-status" data-program-status="${state}"${record.start ? ` data-program-start="${esc(record.start)}"` : ""} data-program-end="${esc(record.end)}">${statusLabels[state]}</span>`
        : "";
      return `<li><article class="catalog-card" id="${esc(record.id)}"><div class="catalog-meta"><span>${esc(record.category)}</span>${badge}</div><h3>${esc(record.name)}</h3><p class="catalog-description">${esc(record.text)}</p><div class="catalog-facts">${record.period ? `<p><span>접수 기간</span>${esc(record.period)}</p>` : ""}<p>${esc(record.detail)}</p>${record.benefits ? `<ul class="catalog-benefits">${record.benefits.map((benefit) => `<li>${esc(benefit)}</li>`).join("")}</ul>` : ""}</div><a class="text-link catalog-link" href="${esc(record.href)}">${esc(record.linkLabel)}${arrow}</a></article></li>`;
    })
    .join("")}</ul>`;
}

// Preserve the existing announcement anchor and past contest information.
export function extractContest(legacyHtml) {
  const section = legacyHtml.match(
    /<section id="contest"[\s\S]*?<\/section>/,
  )?.[0];
  if (
    !section ||
    /OPEN NOW|지금 응모하기|arunia-apply\.vercel\.app\/mandu3/.test(section)
  )
    throw new Error("Missing or still-open legacy contest archive");
  return section.replace(/^<section[^>]*>/, "").replace(/<\/section>$/, "");
}

export function renderOfficialPrograms(
  contestHtml,
  records = PROGRAM_CATALOG,
  now = Date.now(),
) {
  const programs = getPrograms(records);
  return renderPage(
    {
      slug: "programs.html",
      title: "프로그램",
      description:
        "커리어 프로그램, 콘텐츠·모임·클래스, 공모전과 지난 프로그램을 한곳에서 확인하세요.",
      body: `<section class="page-intro wrap catalog-intro"><p class="eyebrow">어른이아 프로그램</p><h1>프로그램</h1><p class="lead">관심 있는 프로그램과 접수 일정을 한곳에서 확인하세요.</p><nav class="catalog-categories" aria-label="프로그램 종류">${PROGRAM_GROUPS.map((group) => `<a href="#${group.id}">${group.name}</a>`).join("")}<a href="#past-programs">지난 프로그램</a></nav></section>
    <div class="wrap catalog-sections">${PROGRAM_GROUPS.map(
      (group) =>
        `<section class="catalog-group" id="${group.id}" aria-labelledby="${group.id}-title"><div class="catalog-group-heading"><h2 id="${group.id}-title">${group.name}</h2><span>${programs.filter((record) => record.group === group.id).length}개</span></div>${renderProgramCards(
          programs.filter((record) => record.group === group.id),
          now,
        )}</section>`,
    ).join("")}
    <section class="catalog-group catalog-past" id="past-programs" aria-labelledby="past-programs-title"><h2 id="past-programs-title">지난 프로그램</h2><ul class="catalog-archive-list">${PROGRAM_ARCHIVES.map((record) => `<li><a href="${record.href}"><span>${record.name}</span><span class="catalog-archive-label">프로그램 기록${arrow}</span></a></li>`).join("")}</ul></section>
    <details class="catalog-contest" id="contest"><summary><span>그만둘만두 · 지난 공모전 안내</span><span class="catalog-status" data-program-status="closed">접수 마감</span></summary><div class="catalog-contest-body">${contestHtml}</div></details></div>`,
    },
    officialPageOptions,
  );
}

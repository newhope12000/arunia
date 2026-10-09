import { renderPage } from "./layout.mjs";
import { officialPageOptions } from "./official-shared.mjs";
import { NOTICES, getNotices } from "./notice-data.mjs";
import { arrow, esc } from "./shared.mjs";

export const NOTICE_STYLESHEET = "/assets/renewal/notices.css";

export function withNoticeStyles(html) {
  const stylesheet = `<link rel="stylesheet" href="${NOTICE_STYLESHEET}">`;
  return html.includes(stylesheet)
    ? html
    : html.replace("</head>", `${stylesheet}</head>`);
}

const noticeUrl = (record) => `/notices/${record.slug}`;
const displayDate = (date) => date.replaceAll("-", ". ");
const paragraphs = (texts = []) =>
  texts.map((text) => `<p>${esc(text)}</p>`).join("");

function noticeMeta(record) {
  return `<p class="notices-meta"><span class="notices-category">${esc(record.category)}</span><span>게시일 <time datetime="${esc(record.published)}">${displayDate(record.published)}</time></span></p>`;
}

function noticeList(records, headingTag = "h3") {
  if (!records.length)
    return '<p class="notices-empty">등록된 공지사항이 없습니다.</p>';
  return `<ul class="notices-list">${records.map((record) => `<li><article class="notices-card"><a href="${noticeUrl(record)}" class="notices-card-link">${noticeMeta(record)}<${headingTag}>${esc(record.title)}</${headingTag}><p class="notices-excerpt">${esc(record.excerpt)}</p><span class="notices-more">공지 확인하기${arrow}</span></a></article></li>`).join("")}</ul>`;
}

function noticeSection(section, index) {
  const singleAward = section.awards?.length === 1 ? section.awards[0] : null;
  const awardTitleInSection =
    singleAward &&
    section.title ===
      `${singleAward.label} | ${singleAward.count}${singleAward.unit ?? "팀"}`;
  const awards = section.awards
    ? `<ul class="notices-awards">${section.awards.map((award) => `<li class="notices-award">${awardTitleInSection ? "" : `<h3>${esc(award.label)} <span>(${award.count}${esc(award.unit ?? "팀")})</span></h3>`}<ul class="notices-names" aria-label="${esc(award.label)} 당선자">${award.names.map((name) => `<li>${esc(name)}</li>`).join("")}</ul></li>`).join("")}</ul>`
    : "";
  const items = section.items?.length
    ? `<ul class="notices-guidance">${section.items.map((text) => `<li>${esc(text)}</li>`).join("")}</ul>`
    : "";
  const contact = section.contact
    ? `<div class="notices-contact">${section.contact.title === section.title ? "" : `<h3>${esc(section.contact.title)}</h3>`}<ul><li>${esc(section.contact.label)} : <a href="mailto:${esc(section.contact.email)}">${esc(section.contact.email)}</a></li>${section.contact.url ? `<li>문의하기 : <a href="/contact">${esc(section.contact.url)}</a></li>` : ""}</ul></div>`
    : "";
  return `<section class="notices-content-section" aria-labelledby="notice-section-${index}"><h2 id="notice-section-${index}">${esc(section.title)}</h2>${awards}${paragraphs(section.paragraphs)}${section.subtitle ? `<h3>${esc(section.subtitle)}</h3>` : ""}${items}${contact}</section>`;
}

export function renderNoticesSection(records = NOTICES) {
  return `<section class="section notices-section" id="notices" aria-labelledby="home-notices-title"><div class="wrap"><div class="notices-heading"><div><p class="notices-kicker">어른이아 소식</p><h2 id="home-notices-title">공지사항</h2></div><a class="text-link" href="/notices">전체 공지 보기${arrow}</a></div>${noticeList(getNotices(records).slice(0, 3))}</div></section>`;
}

export function renderNoticesIndex(records = NOTICES) {
  return withNoticeStyles(
    renderPage(
      {
        slug: "notices",
        title: "공지사항",
        description:
          "어른이아의 공모전 결과와 프로그램 운영 공지를 확인하세요.",
        body: `<section class="notices-index wrap" aria-labelledby="notices-index-title"><header class="notices-index-heading"><p class="notices-kicker">어른이아 소식</p><h1 id="notices-index-title">공지사항</h1><p class="lead">프로그램과 공모전에 관한 안내를 전합니다.</p></header>${noticeList(getNotices(records), "h2")}</section>`,
      },
      officialPageOptions,
    ),
  );
}

export function renderNoticeArticle(record, records = NOTICES) {
  const [current] = getNotices([record]);
  const related = getNotices(records)
    .filter((item) => item.slug !== current.slug)
    .slice(0, 3);
  return withNoticeStyles(
    renderPage(
      {
        slug: `notices/${current.slug}`,
        title: current.title,
        description: current.excerpt,
        body: `<article class="notices-detail wrap"><a class="notices-back" href="/notices"><span aria-hidden="true">←</span> 공지 목록</a><header class="notices-detail-heading"><h1>${esc(current.title)}</h1>${noticeMeta(current)}</header><div class="notices-body"><div class="notices-intro">${paragraphs(current.intro)}</div>${(current.sections ?? []).map(noticeSection).join("")}<div class="notices-closing">${paragraphs(current.closing)}</div></div><div class="notices-detail-actions"><a class="text-link" href="/notices">목록으로${arrow}</a><a class="text-link" href="/contact">문의하기${arrow}</a></div></article>${related.length ? `<section class="notices-related wrap" aria-labelledby="notices-related-title"><h2 id="notices-related-title">다른 공지</h2>${noticeList(related)}</section>` : ""}`,
      },
      officialPageOptions,
    ),
  );
}

import { renderPage } from "./layout.mjs";
import { officialPageOptions } from "./official-shared.mjs";
import { NEWS, getNews } from "./news-data.mjs";
import { arrow, esc } from "./shared.mjs";

const newsUrl = (record) => `/news/${record.slug}`;
const displayDate = (date) => date.replaceAll("-", ". ");

function newsMeta(record) {
  return `<p class="news-meta"><span>${esc(record.publisher)}</span><time datetime="${esc(record.published)}">${displayDate(record.published)}</time></p>`;
}

function newsCards(records, headingTag = "h3") {
  if (!records.length)
    return '<p class="news-empty">등록된 뉴스가 없습니다.</p>';
  return `<ul class="news-grid">${records
    .map(
      (record) =>
        `<li><article class="news-card"><a class="news-card-link" href="${newsUrl(record)}">${newsMeta(record)}<${headingTag}>${esc(record.title)}</${headingTag}><p class="news-excerpt">${esc(record.excerpt)}</p><span class="news-card-more">자세히 보기${arrow}</span></a></article></li>`,
    )
    .join("")}</ul>`;
}

export function renderNewsSection(records = NEWS) {
  return `<section class="section news-section" id="news" aria-labelledby="home-news-title"><div class="wrap"><div class="news-heading"><h2 id="home-news-title">뉴스</h2><a class="text-link" href="/news">전체 뉴스 보기${arrow}</a></div>${newsCards(getNews(records).slice(0, 2))}</div></section>`;
}

export function renderNewsIndex(records = NEWS) {
  return renderPage(
    {
      slug: "news",
      title: "뉴스",
      description: "언론에 소개된 어른이아의 프로그램과 소식을 확인하세요.",
      body: `<section class="news-index wrap" aria-labelledby="news-index-title"><header class="news-index-heading"><h1 id="news-index-title">뉴스</h1><p class="lead">언론에 소개된 어른이아의 소식입니다.</p></header>${newsCards(getNews(records), "h2")}</section>`,
    },
    officialPageOptions,
  );
}

export function renderNewsArticle(record, records = NEWS) {
  const [current] = getNews([record]);
  const related = getNews(records)
    .filter((item) => item.slug !== current.slug)
    .slice(0, 2);
  return renderPage(
    {
      slug: `news/${current.slug}`,
      title: current.title,
      description: current.excerpt,
      body: `<article class="news-detail wrap"><a class="news-back" href="/news"><span aria-hidden="true">←</span> 뉴스 목록</a><header class="news-detail-heading">${newsMeta(current)}<h1>${esc(current.title)}</h1></header><div class="news-summary">${current.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}</div><aside class="news-source" aria-label="원문 기사 출처"><p class="news-source-label">원문 기사</p><p class="news-source-title">${esc(current.sourceTitle)}</p><p class="news-source-credit">${esc(current.publisher)} · ${esc(current.author)} · <time datetime="${esc(current.published)}">${displayDate(current.published)}</time></p><a class="button button-outline news-source-link" href="${esc(current.sourceUrl)}" target="_blank" rel="noopener noreferrer">원문 기사 보기${arrow}<span class="visually-hidden"> (새 창)</span></a></aside><div class="news-detail-actions"><a class="text-link" href="/news">목록으로${arrow}</a></div></article>${related.length ? `<section class="news-related wrap" aria-labelledby="news-related-title"><h2 id="news-related-title">다른 뉴스</h2>${newsCards(related)}</section>` : ""}`,
    },
    officialPageOptions,
  );
}

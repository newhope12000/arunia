import { renderPage } from "./layout.mjs";
import { officialPageOptions } from "./official-shared.mjs";
import { NEWS, getNews } from "./news-data.mjs";
import { arrow, esc } from "./shared.mjs";

const newsUrl = (record) => `/news/${record.slug}`;
const displayDate = (date) => date.replaceAll("-", ". ");
const sourceHost = (record) => new URL(record.sourceUrl).hostname;

function newsMeta(record) {
  return `<p class="news-meta"><span class="news-publisher">${esc(record.publisher)}</span><span>${esc(record.author)}</span><time datetime="${esc(record.published)}">${displayDate(record.published)}</time><span class="news-host">${esc(sourceHost(record))}</span></p>`;
}

function sourceLink(record, cls, text = "원문 보기") {
  return `<a class="${cls}" href="${esc(record.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(record.publisher)} 원문 기사 보기 (새 창)">${text}${arrow}</a>`;
}

function newsCards(records, headingTag = "h3") {
  if (!records.length)
    return '<p class="news-empty">등록된 뉴스가 없습니다.</p>';
  return `<ul class="news-grid">${records
    .map(
      (record) =>
        `<li><article class="news-card"><a class="news-card-link" href="${newsUrl(record)}">${newsMeta(record)}<${headingTag}>${esc(record.sourceTitle)}</${headingTag}><p class="news-excerpt">${esc(record.excerpt)}</p><span class="news-card-more">기사 소개${arrow}</span></a><div class="news-card-source">${sourceLink(record, "news-original-link")}</div></article></li>`,
    )
    .join("")}</ul>`;
}

export function renderNewsSection(records = NEWS) {
  return `<section class="section news-section" id="news" aria-labelledby="home-news-title"><div class="wrap"><div class="news-heading"><div><p class="news-kicker">언론 보도</p><h2 id="home-news-title">뉴스</h2></div><a class="text-link" href="/news">전체 뉴스 보기${arrow}</a></div>${newsCards(getNews(records).slice(0, 2))}</div></section>`;
}

export function renderNewsIndex(records = NEWS) {
  return renderPage(
    {
      slug: "news",
      title: "뉴스",
      description: "언론에 소개된 어른이아의 프로그램과 소식을 확인하세요.",
      body: `<section class="news-index wrap" aria-labelledby="news-index-title"><header class="news-index-heading"><p class="news-kicker">언론 보도</p><h1 id="news-index-title">뉴스</h1><p class="lead">언론에 소개된 어른이아의 소식입니다.</p></header>${newsCards(getNews(records), "h2")}</section>`,
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
      title: current.sourceTitle,
      description: current.excerpt,
      body: `<article class="news-detail wrap"><a class="news-back" href="/news"><span aria-hidden="true">←</span> 뉴스 목록</a><header class="news-detail-heading"><p class="news-kicker">언론 보도</p><h1>${esc(current.sourceTitle)}</h1>${newsMeta(current)}</header><section class="news-summary" aria-labelledby="news-summary-title"><h2 id="news-summary-title">기사 소개</h2><p class="news-summary-note">원문 기사 내용을 간추려 소개합니다.</p>${current.paragraphs.map((paragraph) => `<p>${esc(paragraph)}</p>`).join("")}</section><aside class="news-source" aria-label="원문 기사 출처"><div><p class="news-source-label">원문 기사</p><p class="news-source-publisher">${esc(current.publisher)}</p><p class="news-source-host">${esc(sourceHost(current))}</p></div>${sourceLink(current, "button button-outline news-source-link", "원문 기사 보기")}</aside><div class="news-detail-actions"><a class="text-link" href="/news">목록으로${arrow}</a></div></article>${related.length ? `<section class="news-related wrap" aria-labelledby="news-related-title"><h2 id="news-related-title">다른 뉴스</h2>${newsCards(related)}</section>` : ""}`,
    },
    officialPageOptions,
  );
}

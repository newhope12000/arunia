import { COHORT, esc, url, link } from "./shared.mjs";

const menuItems = [
  ["vision.html", "비전"],
  ["values.html", "가치"],
  ["about.html", "소개"],
  ["programs.html", "프로그램"],
  ["pricing.html", "구독"],
  ["contact.html", "문의"],
];
const brand = () =>
  `<a class="brand" href="${url()}" aria-label="어른이아 v0.1 홈"><img src="${url("assets/brand/arunia-wordmark.jpg")}" width="1280" height="244" alt="어른이아"></a>`;

export function renderPage(page) {
  const canonical = `https://arunia.vercel.app${url(page.slug === "index.html" ? "" : page.slug)}`;
  const json = JSON.stringify({ start: COHORT.start, end: COHORT.end }).replace(
    /</g,
    "\\u003c",
  );
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#217346"><meta name="robots" content="noindex,nofollow"><title>${esc(page.title)} — 어른이아 v0.1</title><meta name="description" content="${esc(page.description)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(page.title)} — 어른이아"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://arunia.vercel.app${url("assets/images/hero-1600.webp")}"><link rel="icon" href="${url("assets/brand/favicon.svg")}" type="image/svg+xml"><link rel="stylesheet" href="${url("assets/style.css")}"><script type="module" src="${url("assets/site.js")}"></script><script type="application/json" id="cohort-data">${json}</script></head>
  <body><a class="skip-link" href="#main">본문 바로가기</a><div class="review-ribbon">어른이아 리뉴얼 시안 <span>V0.1</span></div><header class="site-header"><div class="header-inner wrap">${brand()}<button type="button" class="menu-toggle" aria-label="메뉴 열기" aria-expanded="false" aria-controls="site-menu"><span></span><span></span></button><nav class="site-menu" id="site-menu" aria-label="주요 메뉴">${menuItems.map(([path, label]) => `<a href="${url(path)}" ${page.slug === path ? 'aria-current="page"' : ""}>${label}</a>`).join("")}<a class="nav-opportunities" href="${url("programs.html#open-programs")}" ${page.slug === "growth_4.html" ? 'aria-current="page"' : ""}><i aria-hidden="true"></i>모집·이벤트</a></nav><a class="header-cta" href="${url("pricing.html#free")}">시작하기 <span aria-hidden="true">↗</span></a></div></header>
  <main id="main">${page.body}</main>
  <footer class="site-footer"><div class="wrap"><div class="footer-main"><div>${brand()}<p class="footer-tagline">일도, 일상도.<br>함께 연습해보는 곳.</p><p class="small">읽어보고, 이야기하고, 직접 해보며<br>나에게 맞는 선택을 찾아요.</p></div><nav aria-label="하단 메뉴"><div><h2>프로그램</h2>${link("programs.html#content-archive", "콘텐츠 아카이브", "footer-link")}${link("programs.html#premium-round", "프리미엄 라운드", "footer-link")}${link("programs.html#day-one", "DAY ONE 클래스", "footer-link")}${link("programs.html#open-programs", "모집·이벤트", "footer-link")}</div><div><h2>구독</h2>${link("pricing.html#free", "무료 플랜", "footer-link")}${link("pricing.html#basic", "베이직 플랜", "footer-link")}${link("pricing.html#premium", "프리미엄 플랜", "footer-link")}${link("pricing.html#faq", "구독 이용 안내", "footer-link")}</div><div><h2>어른이아</h2>${link("about.html", "소개", "footer-link")}${link("vision.html", "비전", "footer-link")}${link("values.html", "가치", "footer-link")}${link("contact.html", "문의 안내", "footer-link")}</div></nav></div><div class="footer-bottom"><p>© 2026 어른이아</p><div><a href="${url("privacy.html")}">개인정보 안내</a><a href="${url("terms.html")}">이용 안내</a></div></div><p class="preview-disclosure">V0.1 구성 검토용 · 가입·결제는 진행되지 않아요. 사진은 AI로 만든 연출 이미지이며 실제 참여자의 모습이 아니에요. 후기 예시는 실제 이용 경험이 아니에요.</p></div></footer></body></html>`;
}

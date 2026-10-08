import { createHomePage } from "./feature-pages.mjs";
import { renderPage } from "./layout.mjs";
import { arrow, sectionHead } from "./shared.mjs";
import { image, link, officialPageOptions } from "./official-shared.mjs";
import { NEWS } from "./news-data.mjs";
import { renderNewsSection } from "./news-pages.mjs";
import { PROGRAM_CATALOG } from "./program-data.mjs";
import { renderProgramCards } from "./official-programs.mjs";
import { renderNoticesSection, withNoticeStyles } from "./notice-pages.mjs";
import { renderNoticePopup } from "./notice-popup.mjs";

function closingCta() {
  return `<section class="cta-band"><div class="wrap cta-inner"><div><p class="eyebrow">나에게 맞는 시작</p><h2>읽어보고, 이야기하고,<br>한 번 해봐요.</h2><p>지금 필요한 경험부터 골라보세요.</p></div><div class="cta-options">${link("programs.html", "프로그램 둘러보기", "button button-light")}${link("pricing.html", "구독 플랜 비교하기", "text-link")}</div></div></section>`;
}

function opportunities() {
  return `<section class="section section-sky" id="open-programs"><div class="wrap"><div class="heading-line">${sectionHead("프로그램·이벤트", "프로그램과 모집 소식", "접수 상태와 일정을 확인하고 관심 있는 프로그램을 살펴보세요.")}<a class="text-link" href="/programs.html">전체 프로그램 보기${arrow}</a></div>
    ${renderProgramCards([PROGRAM_CATALOG.find((record) => record.id === "hunmin-contest"), PROGRAM_CATALOG.find((record) => record.id === "career-core-up-4")])}
    <aside class="catalog-result-notice" aria-labelledby="mandu-notice-title"><div><p class="catalog-notice-label">접수 마감 · 결과 발표</p><h3 id="mandu-notice-title">그만둘만두 이야기 공모전</h3><p>제1회 공모전 최종 당선자 발표 공지가 올라왔습니다.</p></div><div><a class="text-link" href="/notices/mandu-contest-winners">최종 당선자 확인${arrow}</a><br><a class="text-link" href="/programs.html#contest">지난 공모전 안내${arrow}</a></div></aside>
  </div></section>
  <section class="section wrap"><div class="heading-line">${sectionHead("이전 프로그램", "먼저 시작한<br>경험도 살펴보세요.", "이전 프로그램에서 제안한 참여 과정과 경험을 살펴봐요.")}</div><div class="archive-list">${link("growth_1.html", "01 <span>성장 프로젝트 1기</span><small>이전 프로그램</small>", "archive-link")}${link("growth_2.html", "02 <span>성장 프로젝트 2기</span><small>이전 프로그램</small>", "archive-link")}${link("growth.html", "03 <span>성장 프로젝트 3기</span><small>이전 프로그램</small>", "archive-link")}${link("leadership1.html", "04 <span>리더십 프로젝트 1기</span><small>이전 프로그램</small>", "archive-link")}</div></section>`;
}

export function renderOfficialHome(newsRecords = NEWS) {
  const page = createHomePage({
    linkTo: link,
    image,
    closingCta: () => `${renderNoticesSection()}${renderNewsSection(newsRecords)}${closingCta()}`,
    opportunities: opportunities(),
    includeStories: false,
  });
  return withNoticeStyles(renderPage(page, officialPageOptions))
    .replace("</head>", '<link rel="stylesheet" href="/assets/renewal/notice-popup.css"><script type="module" src="/assets/renewal/notice-popup.js"></script></head>')
    .replace("</body>", `${renderNoticePopup()}</body>`);
}

import { createHomePage } from "./feature-pages.mjs";
import { renderPage } from "./layout.mjs";
import { BASE, arrow, esc, picture, sectionHead } from "./shared.mjs";

const asset = (path) => `/assets/renewal/${path.replace(/^assets\//, "")}`;

// The official homepage keeps the existing public pages and event intakes.
// Review-only subsection anchors do not exist on those legacy pages.
function url(path = "") {
  if (!path || path === "index.html") return "/";
  if (path === "programs.html#open-programs") return "/#open-programs";
  if (path === "growth_4.html") return "/career-core-up";
  const [page] = path.split("#");
  if (page === "programs.html" || page === "pricing.html") return `/${page}`;
  return `/${path}`;
}

function link(path, text, cls = "text-link") {
  return `<a class="${esc(cls)}" href="${esc(url(path))}">${text}${arrow}</a>`;
}

function image(name, alt, options) {
  return picture(name, alt, options).replaceAll(
    `${BASE}assets/`,
    "/assets/renewal/",
  );
}

function closingCta() {
  return `<section class="cta-band"><div class="wrap cta-inner"><div><p class="eyebrow">나에게 맞는 시작</p><h2>읽어보고, 이야기하고,<br>한 번 해봐요.</h2><p>지금 필요한 경험부터 골라보세요.</p></div><div class="cta-options">${link("programs.html", "프로그램 둘러보기", "button button-light")}${link("pricing.html", "구독 플랜 비교하기", "text-link")}</div></div></section>`;
}

function opportunities() {
  return `<section class="section section-sky" id="open-programs"><div class="wrap"><div class="heading-line">${sectionHead("모집·이벤트", "기간을 정해,<br>조금 더 깊이 경험해요.", "기본 프로그램과 함께, 주제별 프로젝트와 참여 기회도 열려요.")}<a class="text-link" href="/hunmin">4행시 공모전 보기${arrow}</a></div>
    <div class="official-opportunities">
      <article class="opportunity"><div><p class="eyebrow">훈민정음 4행시 공모전</p><h3>나의 언어로, 나의 기준을 찾다</h3><p>훈·민·정·음으로 나만의 생각을 담은 4행시를 작성해보세요.</p><p class="small">20~27세 청년 · 2026년 10월 6일(화) 18시까지<br>수석 2명 · 각 100만 원<br>차석 10명 · 각 50만 원 + 1회 컨설팅권<br>장려상 30명 · 1회 컨설팅권</p></div><a class="button" href="/hunmin">4행시 공모전 참여하기${arrow}</a></article>
      <article class="opportunity"><div><p class="eyebrow">2026 하반기 서울 청년 지원 프로젝트</p><h3>커리어 CORE-UP 성장 프로젝트 4기</h3><p>현재의 경험과 고민을 바탕으로 직무 방향을 정리하고, 현직자 멘토링과 이력서 피드백까지 단계적으로 연결합니다.</p><p class="small">최종 30명 선발 · 자세한 지원 조건과 과정은 프로젝트 안내에서 확인해주세요.</p></div><a class="button button-outline" href="/career-core-up">4기 프로젝트 안내 보기${arrow}</a></article>
    </div>
    <aside class="notice" aria-labelledby="mandu-notice-title"><h3 id="mandu-notice-title">그만둘만두 이야기 공모전<br>최종 수상자 발표 일정 변경 안내</h3><p>예상을 훨씬 뛰어넘는 응모 열기에 깊이 감사드립니다. 보다 전문적이고 엄밀한 심사를 위해 장려상 이상 수상자를 대상으로 추가 심사를 진행합니다.</p><p><strong>최종 수상자 발표 · 10월 7일(수)</strong></p><div class="actions"><a class="text-link" href="/programs.html#contest">공모전 보기${arrow}</a></div></aside>
  </div></section>
  <section class="section wrap"><div class="heading-line">${sectionHead("이전 프로그램", "먼저 시작한<br>경험도 살펴보세요.", "이전 프로그램에서 제안한 참여 과정과 경험을 살펴봐요.")}</div><div class="archive-list">${link("growth_1.html", "01 <span>성장 프로젝트 1기</span><small>이전 프로그램</small>", "archive-link")}${link("growth_2.html", "02 <span>성장 프로젝트 2기</span><small>이전 프로그램</small>", "archive-link")}${link("growth.html", "03 <span>성장 프로젝트 3기</span><small>이전 프로그램</small>", "archive-link")}${link("leadership1.html", "04 <span>리더십 프로젝트 1기</span><small>이전 프로그램</small>", "archive-link")}</div></section>`;
}

export function renderOfficialHome() {
  const page = createHomePage({
    linkTo: link,
    image,
    closingCta,
    opportunities: opportunities(),
  });
  return renderPage(page, { official: true, url, asset, link });
}

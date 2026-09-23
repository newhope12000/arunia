import {
  COHORT,
  url,
  picture,
  link,
  sectionHead,
  applyLink,
  ctaBand,
  steps,
} from "./shared.mjs";

const processRows = () =>
  steps
    .map(
      ([no, name, title, text]) =>
        `<li><span class="row-number">${no}</span><div><span class="small">${name}</span><h3>${title}</h3><p>${text}</p></div></li>`,
    )
    .join("");

export const homePage = {
  slug: "index.html",
  title: "내게 맞는 일을 경험하는 곳",
  description:
    "성향상담부터 현직자 멘토링, 3일 실무 경험까지. 어른이아 CORE-UP 4기에서 나의 다음 경험을 찾아봐요.",
  body: `<section class="hero wrap">
    <div class="hero-copy"><p class="eyebrow"><span class="tiny-line"></span>진로를 고민하는 당신에게</p><h1>나에게 맞는 일,<br>직접 해보면<br><em>조금 더 보여요.</em></h1><p class="lead">내 성향을 알아보고, 현직자와 이야기하고,<br class="desktop-only"> 작은 실무 과제도 경험해봐요.<br>어른이아에서 나의 다음 걸음을 찾아보세요.</p><div class="actions">${link("growth_4.html", "CORE-UP 4기 알아보기", "button")}${link("about.html", "어른이아 소개", "text-link")}</div><p class="hero-caption">생각만으로 어려웠던 선택을, 작은 경험부터.</p></div>
    <figure class="hero-photo">${picture("hero", "밝은 캠퍼스 공간에서 함께 자료를 살펴보는 한국 청년들", { eager: true })}<figcaption><span>우리의 다음을 찾는 시간</span><strong>Small steps, real experiences.</strong></figcaption></figure>
  </section>
  <div class="wrap"><a class="recruit-strip" href="${url("growth_4.html")}"><span class="status"><i aria-hidden="true"></i><span data-cohort-status>모집 중</span></span><strong>커리어 CORE-UP 성장 프로젝트 4기</strong><span class="recruit-period">9. 7. — 9. 30. <span class="separator">|</span> 최종 30명</span><span class="strip-arrow" aria-hidden="true">↗</span></a></div>
  <section class="section wrap question-section"><div>${sectionHead("이런 고민을 하고 있나요?", "뭘 하고 싶은지,<br>아직 모르겠어도 좋아요.", "혼자 답을 정하기 전에,<br>다른 방식으로 알아볼 수 있어요.")}${link("vision.html", "우리가 이 일을 하는 이유")}</div><ol class="question-list"><li><span>01</span><h3>내가 좋아하는 일과<br>잘하는 일이 다르면 어떡하지?</h3></li><li><span>02</span><h3>관심 있는 직무인데,<br>실제로는 어떤 일을 할까?</h3></li><li><span>03</span><h3>이력서에 적을 만한 경험,<br>어디서부터 시작할까?</h3></li></ol></section>
  <section class="section section-soft"><div class="wrap"><div class="heading-line">${sectionHead("어른이아의 프로그램", "알아보고, 만나보고,<br>직접 해보는 네 번의 경험.")}${link("programs.html", "프로그램 전체 보기")}</div><div class="experience-layout"><figure class="experience-photo">${picture("workshop", "공유 작업 공간에서 노트북과 종이 자료로 작은 과제를 함께 진행하는 청년들")}<figcaption>혼자 고민하던 질문을, 함께하는 경험으로.</figcaption></figure><ol class="experience-list">${processRows()}</ol></div></div></section>
  <section class="section wrap"><div class="heading-line">${sectionHead("경험 이야기", "작은 경험이 남기는 것들.", "참여 전의 질문이 어떤 경험으로 이어지는지 살펴보세요.")}<span class="sample-label">후기 구성 예시</span></div><div class="story-grid"><article class="story-quote"><span class="story-type">진로를 탐색하는 대학생</span><blockquote>“관심 있는 직무가<br>내 생각과 같은지<br>확인해보고 싶었어요.”</blockquote><p>현직자에게 하루의 업무를 묻고, 내가 해보고 싶은 일을 구체적으로 적어보는 이야기.</p></article><article class="story-quote"><span class="story-type">첫 지원을 준비하는 취업준비생</span><blockquote>“작은 과제를 해보니<br>어떤 점이 어려운지<br>질문할 수 있었어요.”</blockquote><p>직접 부딪힌 경험을 정리하고, 이력서에 담을 나만의 언어를 찾아가는 이야기.</p></article><article class="story-quote"><span class="story-type">나를 돌아보는 사회초년생</span><blockquote>“다음 선택을 하기 전에<br>내가 중요하게 여기는 걸<br>정리해보고 싶었어요.”</blockquote><p>일을 고르는 나의 기준을 살펴보고, 앞으로 해볼 경험을 정하는 이야기.</p></article></div><p class="note">위 이야기는 화면 구성을 위한 가상 예시예요. 실제 참여자의 인터뷰를 확인한 뒤 교체할 예정이에요.</p></section>
  ${ctaBand()}`,
};

export const cohortPage = {
  slug: "growth_4.html",
  title: COHORT.name,
  description:
    "CORE-UP 4기 모집: 2026년 9월 7일~30일, 만 26세 이하 서울 거주 또는 서울 소재 대학·직장 소속 청년, 최종 30명. 결과는 10월 12일 개별 안내해요.",
  body: `<section class="cohort-hero"><div class="wrap cohort-hero-inner"><div><p class="eyebrow"><span class="status"><i aria-hidden="true"></i><span data-cohort-status>모집 중</span></span> 2026 하반기</p><h1>커리어 CORE-UP<br>성장 프로젝트 <em>4기</em></h1><p class="lead">졸업은 다가오는데, 뭐부터 하지?<br>내 성향을 살펴보고, 현직자를 만나고,<br>3일 동안 작은 실무 과제를 경험해봐요.</p><div class="actions">${applyLink()}<a class="text-link" href="#process">진행 과정 살펴보기 <span aria-hidden="true">↓</span></a></div><p class="small application-note">지원 페이지는 새 창에서 열리며 ChatGPT 로그인이 필요할 수 있어요.</p></div><figure>${picture("mentoring", "밝은 공유 공간에서 노트를 보며 직무에 대해 대화하는 청년과 멘토", { eager: true })}<figcaption>나를 이해하는 대화부터, 직접 해보는 경험까지.</figcaption></figure></div></section>
  <section class="wrap recruitment-summary" id="recruitment" aria-label="4기 모집 요약"><dl class="facts"><div><dt>지원 기간</dt><dd>${COHORT.period}</dd></div><div><dt>지원 연령</dt><dd>만 26세 이하</dd></div><div><dt>모집 인원</dt><dd>최종 ${COHORT.capacity}명</dd></div><div><dt>결과 안내</dt><dd>${COHORT.result} 개별 안내</dd></div></dl><p>서울시 거주자 또는 서울 소재 대학·직장 소속 청년이 지원할 수 있어요.</p></section>
  <section class="section wrap split"><div>${sectionHead("함께할 사람", "나의 다음을 고민하는<br>청년을 기다려요.", "대학생, 취업준비생, 졸업예정자, 사회초년생 모두 자신의 질문을 가지고 시작해요.")}</div><ul class="line-list"><li><h3>내게 맞는 직무를 찾고 싶어요</h3><p>관심은 있지만 어떤 일인지, 나와 잘 맞는지 궁금한 분.</p></li><li><h3>현직자에게 직접 물어보고 싶어요</h3><p>검색만으로 알기 어려웠던 일의 실제 모습을 알아보고 싶은 분.</p></li><li><h3>작더라도 내 경험을 만들고 싶어요</h3><p>실무 과제를 해보고, 과정을 내 언어로 정리해보고 싶은 분.</p></li></ul></section>
  <section class="section section-soft" id="process"><div class="wrap"><div class="heading-line">${sectionHead("프로그램 제공 과정", "네 번의 경험을 거치며,<br>내 이야기를 만들어가요.")}<span class="detail-label">성향 이해 → 대화 → 경험 → 정리</span></div><ol class="journey-steps">${steps.map(([no, name, title, text]) => `<li><span class="row-number">${no}</span><h3>${name}</h3><p>${text}</p>${no === "03" ? '<span class="tag">1:1 멘토링 · 3일 실무 경험</span>' : ""}</li>`).join("")}</ol><p class="note">전체 진행 일정·장소·참가비는 확정된 운영 안내에서 확인할 수 있도록 준비 중이에요.</p></div></section>
  <section class="section wrap"><div class="split">${sectionHead("선정 과정", "지원부터 결과 안내까지.", "온라인 지원서로 참여 동기를 들려주세요.")}<ol class="selection-list"><li><span>01</span><div><h3>온라인 서류 지원</h3><p>${COHORT.period}</p></div></li><li><span>02</span><div><h3>서류 검토 · 사전미팅</h3><p>참여 목적과 현재의 고민을 함께 확인해요.</p></div></li><li><span>03</span><div><h3>최종 30명 선발</h3><p>결과는 2026년 10월 12일 개별 안내해요.</p></div></li></ol></div></section>
  <section class="section section-sky"><div class="wrap split">${sectionHead("이전 기수", "먼저 시작한<br>프로그램도 살펴보세요.", "이전 모집 안내를 보며 어떤 경험을 제안해왔는지 알아볼 수 있어요.")}<div class="archive-list">${link("growth_1.html", "01 <span>성장 프로젝트 1기</span><small>이전 모집</small>", "archive-link")}${link("growth_2.html", "02 <span>성장 프로젝트 2기</span><small>이전 모집</small>", "archive-link")}${link("growth.html", "03 <span>성장 프로젝트 3기</span><small>이전 모집</small>", "archive-link")}</div></div></section>
  <section class="section wrap faq-section">${sectionHead("자주 묻는 질문", "지원하기 전에 궁금한 것들.")}<div class="faq-list"><details><summary>직장에 다니고 있어도 지원할 수 있나요?</summary><p>만 26세 이하이고 서울시 거주자 또는 서울 소재 대학·직장 소속이라면 사회초년생도 지원 대상에 포함돼요. 구체적인 참여 가능 일정은 운영 안내를 확인해주세요.</p></details><details><summary>서울에 살지 않아도 지원할 수 있나요?</summary><p>서울 소재 대학 또는 직장에 소속되어 있다면 지원할 수 있어요.</p></details><details><summary>어떤 경험을 하게 되나요?</summary><p>사전미팅, 1:1 성향상담, 현직자 멘토링과 3일 실무 경험, 프로필 이력서 제작을 차례로 진행해요.</p></details><details><summary>참가비와 진행 장소는 어디서 확인하나요?</summary><p>참가비·전체 일정·장소는 확정된 운영 안내로 제공할 예정이에요. 현재 화면의 프로그램 소개만으로 비용이나 장소가 확정된 것은 아니에요.</p></details><details><summary>결과는 언제 알 수 있나요?</summary><p>2026년 10월 12일 개별 안내해요. 지원서에 안내받을 연락처를 정확하게 남겨주세요.</p></details><details><summary>지원 버튼을 누르면 어디로 이동하나요?</summary><p>별도의 CORE-UP 지원 페이지가 새 창에서 열려요. 해당 페이지에서 ChatGPT 로그인을 요구할 수 있어요. 지원 완료 여부는 지원 페이지에서 확인해주세요.</p></details></div></section>
  <section class="apply-section section" id="apply"><div class="wrap"><p class="eyebrow">커리어 CORE-UP 성장 프로젝트 4기</p><h2>고민하던 다음 걸음,<br>여기서 시작해봐요.</h2><p>${COHORT.period} · 최종 ${COHORT.capacity}명</p>${applyLink()}<p class="small">외부 지원 페이지로 이동 · ChatGPT 로그인 필요 가능</p><div class="closed-message" hidden data-closed-message><p>이번 모집은 마감됐어요. 다음 프로그램 소식은 구독 안내에서 확인해주세요.</p>${link("pricing.html", "다음 소식 확인하기", "button button-outline")}</div></div></section>`,
};

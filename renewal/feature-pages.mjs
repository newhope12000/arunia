import {
  COHORT,
  PROGRAMS,
  PLANS,
  url,
  picture,
  link,
  sectionHead,
  applyLink,
  ctaBand,
  steps,
} from "./shared.mjs";

export const homePage = {
  slug: "index.html",
  title: "일과 일상을 함께 연습하는 곳",
  description:
    "콘텐츠 아카이브, 프리미엄 라운드테이블, DAY ONE 클래스와 구독 플랜. 어른이아에서 나에게 필요한 경험을 골라보세요.",
  body: `<section class="hero wrap">
    <div class="hero-copy"><p class="eyebrow"><span class="tiny-line"></span>라이프 디자인 · 커리어 탐색</p><h1>일도, 일상도.<br>내 속도로<br><em>경험해봐요.</em></h1><p class="lead">다른 사람의 시작을 읽고, 비슷한 고민을 나누고,<br class="desktop-only"> 궁금했던 일을 직접 해봐요.<br>나에게 맞는 선택을 찾는 시간을 함께해요.</p><div class="actions">${link("programs.html", "프로그램 둘러보기", "button")}${link("pricing.html", "구독 플랜 보기", "text-link")}</div><p class="hero-caption">가볍게 둘러보고, 필요한 경험부터 골라보세요.</p></div>
    <figure class="hero-photo">${picture("hero", "밝은 캠퍼스 공간에서 함께 자료를 살펴보는 한국 청년들", { eager: true })}<figcaption><span>처음인 일이 많은 우리에게</span><strong>함께 경험하는 일과 일상.</strong></figcaption></figure>
  </section>
  <section class="section wrap question-section"><div>${sectionHead("이런 고민을 하고 있나요?", "혼자 정하기 어려울 땐,<br>다른 경험도 만나봐요.", "일을 고를 때도, 새로운 생활을 시작할 때도.<br>먼저 해본 사람의 이야기가 도움이 될 수 있어요.")}${link("vision.html", "어른이아가 생각하는 시작")}</div><ol class="question-list"><li><span>01</span><h3>내가 원하는 일은 뭘까?<br>다들 어떻게 찾았을까?</h3></li><li><span>02</span><h3>요즘 나와 비슷한 고민을 하는<br>사람들을 만나볼 수 있을까?</h3></li><li><span>03</span><h3>궁금했던 일,<br>부담 없이 한 번 해볼 수 없을까?</h3></li></ol></section>
  <section class="section section-soft" id="programs"><div class="wrap"><div class="heading-line">${sectionHead("어른이아의 프로그램", "읽고, 만나고, 해보는<br>세 가지 방법.")}${link("programs.html", "프로그램 전체 보기")}</div><div class="experience-layout"><figure class="experience-photo">${picture("workshop", "공유 작업 공간에서 자료를 함께 살펴보며 이야기를 나누는 청년들")}<figcaption>지금 내게 필요한 방식으로 함께해요.</figcaption></figure><ol class="experience-list">${PROGRAMS.map((program, index) => `<li><span class="row-number">0${index + 1}</span><div><span class="small">${program.label}</span><h3>${program.name}</h3><p>${program.text}</p><p class="program-cost">${program.price}</p>${link(`programs.html#${program.id}`, "자세히 보기")}</div></li>`).join("")}</ol></div></div></section>
  <section class="section wrap" id="membership"><div class="heading-line">${sectionHead("구독 플랜", "가볍게 둘러보고,<br>필요할 때 구독해요.", "콘텐츠를 혼자 읽는 시간부터 함께하는 모임까지, 이용하고 싶은 범위에 맞춰 골라요.")}${link("pricing.html", "혜택과 가격 비교하기")}</div><div class="membership-preview">${PLANS.map((plan) => `<article class="membership-option"><h3>${plan.name}</h3><p class="plan-price">${plan.price}${plan.id !== "free" ? "<span> / 월</span>" : ""}</p><p class="plan-summary">${plan.text}</p>${link(`pricing.html#${plan.id}`, `${plan.name} 플랜 보기`)}</article>`).join("")}</div></section>
  <section class="section section-sky"><div class="wrap"><div class="heading-line">${sectionHead("모집·이벤트", "기간을 정해,<br>조금 더 깊이 경험해요.", "기본 프로그램과 함께, 주제별 프로젝트와 참여 기회도 열려요.")}${link("programs.html#open-programs", "모집 소식 보기")}</div><article class="opportunity"><div><p class="eyebrow">기수별 모집 · <span data-cohort-status>모집 중</span></p><h3>${COHORT.name}</h3><p>성향상담, 현직자 멘토링과 3일 실무 경험, 프로필 이력서 제작을 함께해요.</p><p class="small">${COHORT.period} · 최종 ${COHORT.capacity}명<br>만 26세 이하 · 서울 거주 또는 서울 소재 대학·직장 소속</p></div>${link("growth_4.html", "4기 모집 자세히 보기", "button button-outline")}</article></div></section>
  <section class="section wrap"><div class="heading-line">${sectionHead("경험 이야기", "각자에게 필요한,<br>서로 다른 시작.", "어른이아에서 어떤 경험을 할 수 있는지 그려봤어요.")}<span class="sample-label">후기 구성 예시</span></div><div class="story-grid"><article class="story-quote"><span class="story-type">콘텐츠 아카이브 · 진로를 고민하는 대학생</span><blockquote>“다른 사람의 첫날을<br>읽으면서, 내 질문을<br>하나씩 적어봤어요.”</blockquote><p>진로를 정하기 전 여러 경험을 읽고, 질문 카드에 내가 중요하게 여기는 기준을 남겨보는 이야기.</p></article><article class="story-quote"><span class="story-type">라운드테이블 · 새로운 생활을 시작한 직장인</span><blockquote>“요즘의 고민을<br>편하게 나눌 사람이<br>있으면 좋겠어요.”</blockquote><p>비슷한 시기를 보내는 사람들을 만나 직장과 일상 이야기를 나누고, 서로의 경험을 들어보는 이야기.</p></article><article class="story-quote"><span class="story-type">DAY ONE 클래스 · 새로운 경험이 궁금한 청년</span><blockquote>“계속 궁금했던 일을<br>한 번 해보고<br>결정하고 싶었어요.”</blockquote><p>오래 고민하던 관심사를 짧은 클래스로 만나보고, 무엇이 즐거웠는지 돌아보는 이야기.</p></article></div><p class="note">위 이야기는 화면 구성을 위한 가상 예시예요. 실제 참여자의 인터뷰를 확인한 뒤 교체할 예정이에요.</p></section>
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
  <section class="apply-section section" id="apply"><div class="wrap"><p class="eyebrow">커리어 CORE-UP 성장 프로젝트 4기</p><h2>고민하던 다음 걸음,<br>여기서 시작해봐요.</h2><p>${COHORT.period} · 최종 ${COHORT.capacity}명</p>${applyLink()}<p class="small">외부 지원 페이지로 이동 · ChatGPT 로그인 필요 가능</p><div class="closed-message" hidden data-closed-message><p>이번 모집은 마감됐어요. 다른 모집 소식과 기본 프로그램도 살펴보세요.</p>${link("programs.html", "다른 프로그램 보기", "button button-outline")}</div></div></section>`,
};

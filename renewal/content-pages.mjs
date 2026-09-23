import {
  COHORT,
  link,
  picture,
  sectionHead,
  intro,
  ctaBand,
  notice,
  steps,
} from "./shared.mjs";

const photo = (name, alt) =>
  `<figure class="image-frame">${picture(name, alt)}<figcaption>AI로 연출한 예시 사진</figcaption></figure>`;
const row = (number, title, text) =>
  `<article class="editorial-row"><span class="row-number" aria-hidden="true">${number}</span><h3>${title}</h3><p>${text}</p></article>`;
const faq = (question, answer) =>
  `<details><summary>${question}</summary><div class="prose"><p>${answer}</p></div></details>`;
const archiveLinks = (except = "") =>
  `<div class="archive-list">${[
    ["growth_1.html", "현직자 멘토링 프로젝트 1기"],
    ["growth_2.html", "청년 커리어 성장 프로젝트 2기"],
    ["growth.html", "청년 커리어 성장 프로젝트 3기"],
  ]
    .filter(([slug]) => slug !== except)
    .map(
      ([slug, title]) =>
        `<div><span class="tag">지난 프로그램</span>${link(slug, title)}</div>`,
    )
    .join("")}</div>`;

export const contentPages = [
  {
    slug: "vision.html",
    title: "비전",
    description:
      "내게 맞는 일을 고르기 전에, 질문하고 직접 경험해볼 수 있도록. 어른이아가 생각하는 청년의 진로 탐색을 소개해요.",
    body: `${intro("비전", "내게 맞는 일을 고르기 전,<br>경험해볼 시간이 필요해요.", "전공을 정했어도 직무는 낯설 수 있어요. 취업을 준비하다가 다른 일이 궁금해질 수도 있고요. 어른이아는 그 질문을 작은 경험으로 이어가려 해요.")}
      <section class="section section-soft"><div class="wrap split"><div class="prose"><p class="eyebrow">우리가 바라보는 진로 탐색</p><h2>검색한 정보에,<br>내 경험을 더해봐요.</h2><p>채용 공고의 직무 설명만으로는 하루의 업무가 잘 그려지지 않아요. 내가 그 일을 좋아할지, 어떤 부분이 어려울지도 직접 해보기 전에는 알기 어렵고요.</p><p>내 성향을 살펴보고, 먼저 일해본 사람에게 묻고, 작은 과제를 해보는 시간. 그 과정에서 다음 선택에 쓸 수 있는 기준을 찾도록 돕고 싶어요.</p></div>${photo("mentoring", "밝은 작업 공간에서 한국 청년이 멘토와 노트를 보며 이야기하는 모습")}</div></section>
      <section class="section wrap">${sectionHead("지금 필요한 경험", "질문을 하나씩,<br>직접 확인할 수 있도록.")}
        ${row("01", "내가 편하게 하는 일부터 살펴봐요", "어떤 상황에서 집중하는지, 무엇을 할 때 힘이 나는지 정리해요. 성향상담은 관심 직무를 살펴볼 출발점으로 활용해요.")}
        ${row("02", "직무 이름 뒤의 하루를 물어봐요", "현직자에게 실제 업무와 협업 방식, 처음 시작할 때 필요한 준비를 물어봐요. 공고를 읽으며 생겼던 궁금증도 가져와요.")}
        ${row("03", "해본 일을 내 언어로 남겨요", "작은 실무 과제를 경험한 뒤, 재미있었던 점과 어려웠던 점을 돌아봐요. 경험에서 발견한 강점은 프로필 이력서로 정리해요.")}
      </section>${ctaBand()}`,
  },
  {
    slug: "values.html",
    title: "가치",
    description:
      "연습할 기회, 알기 쉬운 기준, 스스로 내리는 결정, 서로의 속도에 대한 존중. 어른이아가 프로그램을 만드는 기준을 살펴봐요.",
    body: `${intro("가치", "같이 경험하는 동안,<br>이런 기준을 지키려 해요.", "처음 해보는 일 앞에서 질문하기 편한 곳, 무엇을 하는지 미리 알고 참여할 수 있는 곳을 만들어요.")}
      <section class="section wrap">
        ${row("01", "처음인 일을 연습할 기회", "익숙하지 않은 직무를 바로 잘하기는 어려워요. 작은 과제부터 시작하고, 해본 뒤 돌아보는 시간을 과정에 담아요.")}
        ${row("02", "참여 전에 알 수 있는 기준", "누가 참여할 수 있는지, 어떤 과정을 거치는지, 결과는 언제 받는지 먼저 안내해요. 아직 정해지지 않은 내용은 확정된 정보와 구분해요.")}
        ${row("03", "선택의 기준은 내 경험에서", "성향 결과나 현직자의 조언을 참고하며 자신에게 맞는 방향을 살펴봐요. 사람마다 중요하게 생각하는 일과 일하는 환경이 다를 수 있어요.")}
        ${row("04", "서로의 상황과 속도를 존중해요", "전공과 관심 직무, 경험의 양이 달라도 질문을 나눌 수 있어요. 다른 사람의 경험은 새로운 관점으로 듣고, 내 상황에 맞게 생각해봐요.")}
      </section>
      <section class="section section-sky"><div class="wrap split"><div><p class="eyebrow">대화를 시작하는 방법</p><h2>이런 질문을<br>함께 나누고 싶어요.</h2></div><ul class="line-list"><li>이 일을 직접 해보니 어떤 부분이 좋았나요?</li><li>공고에서 읽은 것과 실제 업무는 어떻게 달랐나요?</li><li>다음에 더 알아보고 싶은 일은 무엇인가요?</li><li>이번 경험을 내 말로 어떻게 설명할 수 있을까요?</li></ul></div></section>
      <section class="section wrap reading"><h2>프로그램에서는 어떻게 만날까요?</h2><p class="lead">CORE-UP 4기에서는 성향상담, 현직자와의 대화, 3일 실무 경험을 거쳐 나만의 프로필 이력서를 정리해요.</p>${link("growth_4.html", "4기 과정 살펴보기", "button")}</section>`,
  },
  {
    slug: "about.html",
    title: "소개",
    description:
      "어른이아는 진로와 사회생활을 처음 마주한 청년이 자신을 이해하고, 현직자를 만나고, 작은 실무 경험을 해볼 수 있게 돕는 성장 플랫폼이에요.",
    body: `${intro("어른이아 소개", "진로를 고민하는 시간에,<br>직접 해보는 경험을 더해요.", "어른이아는 청년이 자신의 성향을 이해하고, 현직자를 만나고, 작은 실무 경험을 해볼 수 있게 돕는 성장 플랫폼이에요.")}
      <section class="section wrap"><div class="wide-image">${photo("hero", "자연광이 드는 작업 공간에서 한국 청년들이 자료를 펼쳐 놓고 대화하는 모습")}</div></section>
      <section class="section section-soft"><div class="wrap split"><div><p class="eyebrow">어른이 되는 과정에서도</p><h2>질문하고 해볼 시간이<br>필요하니까요.</h2></div><div class="prose"><p>졸업을 앞두고 어떤 직무에 지원할지 고민할 때, 첫 직장에서 내가 잘할 수 있는 일을 찾고 싶을 때. 혼자 생각하다가 막히는 지점이 있어요.</p><p>어른이아에서는 나를 살펴보는 대화와 직무 경험을 이어가요. 프로그램을 마친 뒤에도 참고할 수 있도록, 과정에서 발견한 내용을 글과 이력서로 정리해요.</p></div></div></section>
      <section class="section wrap">${sectionHead("이런 고민이 있다면", "지금의 상황에서<br>시작할 수 있어요.")}
        ${row("01", "전공과 직무 사이에서 고민하는 대학생", "배우는 내용이 실제 일과 어떻게 이어지는지 궁금하다면, 관심 직무의 업무부터 살펴봐요.")}
        ${row("02", "지원 방향을 정리하고 싶은 취업준비생", "여러 공고를 저장해두고도 어디부터 준비할지 막막하다면, 성향과 경험을 바탕으로 기준을 세워봐요.")}
        ${row("03", "내 일을 돌아보고 싶은 사회초년생", "업무를 해보며 새롭게 알게 된 강점과 관심을 정리하고, 현직자에게 궁금한 점을 물어봐요.")}
        <p class="note">프로그램마다 참여 조건이 달라요. CORE-UP 4기의 연령·지역·소속 조건은 모집 안내에서 확인해주세요.</p>
      </section>${ctaBand()}`,
  },
  {
    slug: "programs.html",
    title: "프로그램",
    description:
      "커리어 CORE-UP 성장 프로젝트 4기의 모집 정보와 성향상담, 현직자 멘토링, 3일 실무 경험, 프로필 이력서 과정을 확인해요.",
    body: `${intro("프로그램", "궁금한 일을,<br>직접 해보는 쪽으로.", "나를 살펴보는 대화부터 현직자 멘토링과 작은 실무 경험까지. 지금 필요한 경험을 찾아봐요.")}
      <section class="section section-soft" id="core-up"><div class="wrap split"><div class="prose"><p class="eyebrow">CORE-UP 4기 · <span data-cohort-status>모집 중</span></p><h2>커리어 CORE-UP<br>성장 프로젝트 4기</h2><p>관심 직무를 정하기 어렵다면, 내 성향을 살펴보고 현직자와 이야기해봐요. 3일 실무 경험과 프로필 이력서 제작까지 이어져요.</p><dl class="facts"><div><dt>지원 기간</dt><dd>${COHORT.period}</dd></div><div><dt>모집 인원</dt><dd>최종 ${COHORT.capacity}명</dd></div><div><dt>결과 안내</dt><dd>${COHORT.result} 개별 안내</dd></div></dl>${link("growth_4.html", "4기 자세히 보기", "button")}<p class="small">만 26세 이하 · 서울 거주 또는 서울 소재 대학·직장 소속</p></div>${photo("workshop", "한국 청년들이 테이블에서 노트북과 자료를 보며 작은 과제를 함께 살펴보는 모습")}</div></section>
      <section class="section wrap" id="experience">${sectionHead("4기에서 함께할 경험", "질문을 정리하고,<br>해보고, 기록해요.")}${steps.map(([number, title, , text]) => row(number, title, text)).join("")}${link("growth_4.html#process", "전체 진행 과정 확인하기")}</section>
      <section class="section section-sky" id="archive"><div class="wrap">${sectionHead("지난 프로그램", "앞선 기수의 프로그램을 살펴봐요.", "현재 모집과 구분해 이전 프로그램의 구성만 모아뒀어요.")}${archiveLinks()}<div class="archive-list"><div><span class="tag">지난 모집</span>${link("leadership1.html", "청년 역량·리더십 강화 프로젝트")}</div></div></div></section>
      <section class="section wrap reading"><h2>다음 프로그램이 궁금하다면</h2><p class="lead">새 모집과 프로그램 소식을 받아볼 수 있도록 구독 채널을 준비하고 있어요. 지금은 이 페이지에서 모집 정보를 확인해주세요.</p>${link("pricing.html", "소식 구독 안내 보기")}</section>`,
  },
  {
    slug: "pricing.html",
    title: "소식 구독",
    description:
      "어른이아의 새 프로그램과 모집 소식을 안내할 구독 채널을 준비하고 있어요. 현재 모집은 프로그램 페이지에서 확인할 수 있어요.",
    body: `${intro("소식 구독", "다음 경험이 열릴 때,<br>소식을 전할게요.", "새 프로그램과 모집 일정을 받아볼 수 있는 구독 채널을 준비하고 있어요.")}
      <section class="section section-soft"><div class="wrap split"><div><p class="eyebrow">준비 중</p><h2>이런 소식을<br>담으려고 해요.</h2></div><ul class="line-list"><li><strong>새 프로그램 모집</strong><p>지원 기간과 참여 조건을 함께 안내해요.</p></li><li><strong>프로그램 이야기</strong><p>어떤 경험을 해볼 수 있는지 과정을 소개해요.</p></li><li><strong>진로 탐색에 필요한 질문</strong><p>내 경험을 돌아보고 현직자와 이야기할 때 쓸 질문을 나눠요.</p></li></ul></div></section>
      <section class="section wrap reading">${notice("소식 구독 준비 중", "현재 이 페이지에서는 이메일을 입력하거나 구독을 신청할 수 없어요. 채널과 발송 방식이 정해지면 개인정보 안내와 함께 공개할게요.")}<div class="prose"><h2>지금 모집하는 프로그램은 여기서 확인해요.</h2><p>CORE-UP 4기의 지원 기간은 ${COHORT.period}예요. 참여 조건과 전체 과정을 먼저 살펴보세요.</p>${link("growth_4.html", "CORE-UP 4기 확인하기", "button")}</div></section>`,
  },
  {
    slug: "contact.html",
    title: "문의",
    description:
      "어른이아 문의 채널 준비 안내와 CORE-UP 4기의 지원 조건, 일정, 신청 방법에 관한 자주 묻는 질문을 확인해요.",
    body: `${intro("문의", "궁금한 내용을<br>먼저 확인해보세요.", "프로그램을 살펴보다 생길 수 있는 질문을 모았어요. 아직 정해지지 않은 운영 정보는 확정 후 안내할게요.")}
      <section class="section wrap"><div class="split"><div>${notice("문의 채널을 준비하고 있어요", "공개할 이메일과 연락 채널을 정리하고 있어요. 현재 이 페이지에는 메시지를 보내는 기능이 없어요.")}<p class="note">협업·프로그램 제안 문의도 연락 채널이 마련되면 함께 안내할게요.</p></div><div><p class="eyebrow">자주 묻는 질문</p><div class="faq-list">
        ${faq("4기에는 누가 지원할 수 있나요?", "만 26세 이하 청년 중 서울시에 거주하거나 서울 소재 대학·직장에 소속되어 있다면 지원 조건을 확인해보세요. 대학생, 취업준비생, 졸업예정자, 사회초년생을 대상으로 해요.")}
        ${faq("언제까지 지원하고, 결과는 언제 받나요?", `지원 기간은 ${COHORT.period}이고, 결과는 ${COHORT.result}에 개별 안내할 예정이에요.`)}
        ${faq("지원서는 어디서 작성하나요?", `4기 모집 안내의 ‘4기 지원하기’를 누르면 외부 지원 페이지로 이동해요. ${link("growth_4.html", "4기 모집 안내 보기")}`)}
        ${faq("참가비와 진행 장소는 어디서 확인하나요?", "참가비, 실제 진행 일정, 장소, 참여 시간은 아직 확정 안내 전이에요. 지원을 결정하기 전에 모집 페이지에 추가되는 내용을 확인해주세요.")}
        ${faq("사진은 실제 프로그램 현장인가요?", "이번 검토 페이지의 사진은 한국 청년의 활동 장면을 AI로 연출한 예시예요. 실제 참여자나 운영 현장을 촬영한 사진은 아니에요.")}
      </div></div></div></section>${ctaBand()}`,
  },
  {
    slug: "privacy.html",
    title: "개인정보 안내",
    description:
      "v0_1 검토 페이지의 개인정보 입력 기능과 외부 지원 페이지 이동에 관한 안내예요.",
    body: `${intro("개인정보 안내", "이 검토 페이지에서는<br>개인정보를 입력받지 않아요.", "v0_1은 어른이아 홈페이지 개편 방향을 확인하기 위한 페이지예요. 실제 서비스 운영에 필요한 개인정보 처리방침은 별도로 확정해야 해요.")}
      <section class="section wrap reading prose"><h2>이 페이지의 기능</h2><p>v0_1에는 회원가입, 로그인, 결제, 상담 접수, 문의 제출, 소식 구독 입력 기능이 없어요. 이름·이메일·연락처 등을 작성하는 양식을 제공하지 않아요.</p><h2>외부 지원 페이지</h2><p>‘4기 지원하기’는 외부 지원 페이지로 연결돼요. 이동한 페이지에서 개인정보를 입력하기 전에는 해당 페이지의 운영 주체, 수집 항목, 이용 목적과 동의 내용을 확인해주세요.</p><h2>운영 전 확인할 정보</h2><p>문의 연락처, 개인정보 처리 담당자, 수집 항목과 보유 기간 등 실제 운영 정보를 확인한 뒤 정식 개인정보 처리방침에 반영할 예정이에요. 이 검토 안내를 정식 처리방침으로 대신할 수는 없어요.</p><h2>궁금한 점이 있다면</h2><p>문의 채널은 준비 중이에요. 공개되는 연락 방법은 문의 페이지에서 확인할 수 있어요.</p>${link("contact.html", "문의 안내 보기")}</section>`,
  },
  {
    slug: "terms.html",
    title: "이용 안내",
    description:
      "어른이아 v0_1 검토 페이지의 이용 범위, 예시 사진, 프로그램 안내와 외부 지원 연결을 설명해요.",
    body: `${intro("이용 안내", "먼저 살펴보는<br>어른이아 개편 페이지예요.", "현재 페이지는 구성과 문구를 검토하는 단계예요. 정식 서비스의 이용 조건과 운영 정보는 확정 후 별도로 안내해요.")}
      <section class="section wrap reading prose"><h2>볼 수 있는 내용</h2><p>어른이아 소개, 프로그램 구성, CORE-UP 4기 모집 정보, 이전 프로그램의 개요를 확인할 수 있어요. 이 페이지 자체에서 신청을 접수하거나 결제를 진행하지 않아요.</p><h2>사진과 예시 콘텐츠</h2><p>사진은 한국 청년의 활동 장면을 AI로 연출한 예시예요. 실제 참여자 사진이나 활동 실적을 뜻하지 않아요. 실제 후기와 구분해 표시한 문구 예시 역시 실제 참여자의 발언으로 볼 수 없어요.</p><h2>프로그램 참여</h2><p>프로그램의 참여 조건은 해당 모집 안내에서 확인해주세요. ‘4기 지원하기’를 누르면 외부 지원 페이지로 이동해요. 실제 신청 전에는 그곳의 최신 모집 정보와 개인정보 안내를 확인해주세요.</p><h2>아직 준비 중인 기능</h2><p>회원가입, 로그인, 결제, 문의 제출, 소식 구독은 이 검토 페이지에서 제공하지 않아요. 운영 주체와 연락처, 이용 조건이 확정되면 정식 안내를 추가할 예정이에요.</p>${link("programs.html", "프로그램으로 돌아가기")}</section>`,
  },
  {
    slug: "growth.html",
    title: "커리어 성장 프로젝트 3기 · 지난 프로그램",
    description:
      "청년 커리어 성장 프로젝트 3기의 이전 모집 구성을 살펴봐요. 새로운 지원은 CORE-UP 4기 안내에서 확인해주세요.",
    body: `${intro("지난 프로그램 · 3기", "청년 커리어<br>성장 프로젝트 3기", "커리어 진단과 라이프 방향 설정, 현직자와의 대화, 프로필 이력서 제작으로 이어지는 이전 모집 프로그램이에요.")}
      <section class="section wrap reading">${notice("이전 모집 안내예요", "3기 지원은 이 페이지에서 받지 않아요. 새로운 모집 정보와 참여 조건은 CORE-UP 4기에서 확인해주세요.")}</section>
      <section class="section section-soft"><div class="wrap">${sectionHead("프로그램 구성", "나를 돌아보고,<br>커리어의 방향을 정리하는 과정")}${row("01", "커리어 진단", "성향과 현재 상황을 바탕으로 관심 직무와 커리어를 살펴보는 과정이에요.")}${row("02", "라이프 방향 설정", "일을 포함해 앞으로의 생활에서 중요하게 생각하는 기준을 정리하는 과정이에요.")}${row("03", "현직자 미팅과 프로필 이력서", "현직자와 대화하며 내 경험을 돌아보고, 지원에 활용할 프로필 이력서로 정리하는 과정이에요.")}</div></section>
      <section class="section wrap">${sectionHead("더 살펴보기", "다른 기수의 프로그램")}${archiveLinks("growth.html")}</section>${ctaBand()}`,
  },
  {
    slug: "growth_1.html",
    title: "현직자 멘토링 프로젝트 1기 · 지난 프로그램",
    description:
      "현직자 멘토링 프로젝트 1기의 FIT 분석, 커리어 로드맵, 멘토링 중심 구성을 살펴봐요.",
    body: `${intro("지난 프로그램 · 1기", "현직자 멘토링<br>프로젝트 1기", "성향과 관심 직무를 살펴보고, 현직자의 업무 경험을 들으며 커리어 로드맵을 정리하는 구성의 프로그램이에요.")}
      <section class="section wrap reading">${notice("이전 프로그램의 구성 안내예요", "이 페이지에서는 1기 참가 신청을 받지 않아요. 참여를 원한다면 CORE-UP 4기의 최신 모집 조건을 확인해주세요.")}</section>
      <section class="section section-soft"><div class="wrap">${sectionHead("프로그램 구성", "어떤 일이 궁금한지부터<br>함께 살펴봐요.")}${row("01", "성향과 직무 살펴보기", "FIT 분석을 바탕으로 강점과 관심 분야를 정리하고, 직무를 탐색할 기준을 찾아보는 과정이에요.")}${row("02", "현직자에게 물어보기", "관심 있는 일의 실제 모습과 시작할 때 필요한 준비를 현직자와 이야기하는 과정이에요.")}${row("03", "커리어 로드맵 정리하기", "대화에서 발견한 내용을 바탕으로 더 알아볼 분야와 준비할 일을 정리하는 과정이에요.")}</div></section>
      <section class="section wrap">${sectionHead("더 살펴보기", "다른 기수의 프로그램")}${archiveLinks("growth_1.html")}</section>${ctaBand()}`,
  },
  {
    slug: "growth_2.html",
    title: "커리어 성장 프로젝트 2기 · 지난 프로그램",
    description:
      "청년 커리어 성장 프로젝트 2기의 커리어 진단, 라이프 방향 설정, 현직자 미팅과 이력서 제작 구성을 살펴봐요.",
    body: `${intro("지난 프로그램 · 2기", "청년 커리어<br>성장 프로젝트 2기", "커리어 진단에서 시작해 일과 생활의 방향을 살펴보고, 현직자의 의견을 참고해 이력서를 정리하는 프로그램 구성이에요.")}
      <section class="section wrap reading">${notice("이전 프로그램의 구성 안내예요", "이 페이지에서는 2기 참가 신청을 받지 않아요. 참여를 원한다면 CORE-UP 4기의 최신 모집 조건을 확인해주세요.")}</section>
      <section class="section section-soft"><div class="wrap">${sectionHead("프로그램 구성", "진단에서 이력서까지,<br>경험을 이어가는 과정")}${row("01", "커리어 진단", "자신의 성향과 경험을 살펴보며, 일에서 활용할 강점을 정리하는 과정이에요.")}${row("02", "라이프 방향 설정", "앞으로의 생활에서 바라는 모습과 현재 상황을 연결해, 준비할 일을 살펴보는 과정이에요.")}${row("03", "현직자 미팅과 이력서 제작", "현직자의 의견을 듣고 내 경험과 강점을 프로필 이력서에 담는 과정이에요.")}</div></section>
      <section class="section wrap">${sectionHead("더 살펴보기", "다른 기수의 프로그램")}${archiveLinks("growth_2.html")}</section>${ctaBand()}`,
  },
  {
    slug: "leadership1.html",
    title: "청년 역량·리더십 강화 프로젝트 · 지난 모집",
    description:
      "협업과 소통 상황을 돌아보고, 행동을 연습하고, 자신의 역할을 이력서에 정리하는 이전 프로그램의 구성이에요.",
    body: `${intro("지난 모집 · 협업과 소통", "함께 일하는 나를<br>돌아보는 시간", "청년 역량·리더십 강화 프로젝트 ‘리더십이 필요해’는 역할 분담, 의견 전달, 경험 정리를 다루는 프로그램으로 안내됐어요.")}
      <section class="section wrap reading">${notice("모집이 끝난 프로그램이에요", "현재 이 페이지에서는 참가 신청을 받지 않아요. 새로운 모집은 프로그램 페이지에서 확인해주세요.")}</section>
      <section class="section section-soft"><div class="wrap split"><div class="prose"><p class="eyebrow">이런 상황을 다뤄요</p><h2>팀에서 했던 일을,<br>내 경험으로 설명하려면.</h2><p>팀 과제에서 역할을 다시 나누자고 말하기 어렵거나, 면접에서 협업 경험을 어떻게 설명할지 막막할 수 있어요. 첫 직장에서 질문과 보고의 타이밍을 고민하기도 하고요.</p><p>이 프로그램은 그런 상황에서 자신이 어떻게 행동하는지 살펴보고, 의견을 전하는 방법을 연습하는 구성이에요.</p></div>${photo("workshop", "한국 청년들이 작은 팀으로 모여 자료를 확인하며 의견을 나누는 모습")}</div></section>
      <section class="section wrap">${sectionHead("프로그램 구성", "내 행동을 돌아보고,<br>다음 대화를 연습해요.")}${row("01", "리더십·소통 스타일 살펴보기", "함께 일했던 경험을 돌아보고, 판단하고 소통하는 자신의 방식을 정리해요.")}${row("02", "상황에 맞게 말해보기", "의견 제안, 역할 분담, 갈등 조율처럼 실제로 마주치는 상황을 바탕으로 행동을 연습해요.")}${row("03", "내 역할을 경험으로 정리하기", "현직자와 대화하며 활동에서 맡았던 역할을 돌아보고, 프로필 이력서에 담을 내용을 정리해요.")}${link("programs.html", "전체 프로그램 보기", "button")}</section>${ctaBand()}`,
  },
];

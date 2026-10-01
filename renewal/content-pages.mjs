import {
  COHORT,
  link,
  picture,
  sectionHead,
  intro,
  ctaBand,
  notice,
} from "./shared.mjs";
import { CONTACT } from "./contact.mjs";

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
      "진로와 관계, 돈과 일상 앞에서 자신에게 맞는 선택을 연습하도록. 어른이아가 생각하는 라이프 디자인과 커리어 탐색을 소개해요.",
    body: `${intro("비전", "처음인 어른의 일들,<br>연습하며 알아가요.", "어떤 일을 하고 싶은지, 사람들과 어떻게 지낼지, 내 생활을 어떻게 꾸릴지. 어른이아는 청년이 일과 삶의 선택을 충분히 살펴볼 수 있도록 도와요.")}
      <section class="section section-soft"><div class="wrap split"><div class="prose"><p class="eyebrow">라이프 디자인 · 커리어 탐색</p><h2>다른 사람의 경험에서<br>내 질문을 발견해요.</h2><p>전공을 골라도 진로는 계속 고민되고, 첫 직장에 들어간 뒤에도 낯선 일이 생겨요. 돈을 쓰고 모으는 기준, 사람들과 관계를 맺는 방식도 조금씩 배워가고요.</p><p>콘텐츠를 읽고, 비슷한 고민을 가진 사람과 이야기하고, 작은 경험을 해봐요. 지금 당장 답을 정하기보다 나에게 맞는 기준을 찾아가는 시간을 함께 만들어요.</p></div>${photo("mentoring", "밝은 작업 공간에서 한국 청년이 다른 사람과 노트를 보며 이야기하는 모습")}</div></section>
      <section class="section wrap">${sectionHead("함께 살펴볼 네 가지", "일과 생활을,<br>내 기준으로 꾸려가도록.")}
        ${row("01", "진로 · 내가 하고 싶은 일", "다른 사람의 시작과 선택을 살펴보며 관심 있는 일을 찾아요. 필요한 때에는 클래스나 기수별 프로젝트에서 직접 경험해봐요.")}
        ${row("02", "관계 · 함께 지내는 방식", "의견을 전하거나 도움을 구하기 어려운 순간을 나눠요. 서로 다른 경험을 듣고 내 상황에서 시도할 방법을 생각해봐요.")}
        ${row("03", "돈 · 생활을 꾸리는 기준", "돈을 쓰고 모으는 일처럼 일상에서 만나는 선택을 돌아봐요. 나에게 중요한 것과 현재의 생활을 함께 살펴봐요.")}
        ${row("04", "일상 · 나에게 맞는 속도", "처음 해보는 일과 익숙한 습관 사이에서 내 생활을 돌아봐요. 작은 질문과 기록으로 다음에 해볼 일을 정리해요.")}
      </section>${ctaBand()}`,
  },
  {
    slug: "values.html",
    title: "가치",
    description:
      "연습할 기회, 자유와 기준, 스스로 내리는 결정, 서로에 대한 존중. 어른이아가 콘텐츠와 커뮤니티, 프로그램을 만드는 기준이에요.",
    body: `${intro("가치", "서로 다른 선택이<br>편하게 오갈 수 있도록.", "콘텐츠를 만들고, 대화를 나누고, 경험을 준비할 때 어른이아가 지키려는 기준이에요.")}
      <section class="section wrap">
        ${row("01", "처음인 일을 연습할 기회", "아직 진로를 확신하지 못해도, 관심 있는 일이 달라져도 괜찮아요. 콘텐츠와 질문을 여러 번 살펴보고 작은 경험부터 시작할 수 있게 해요.")}
        ${row("02", "자유롭게 참여할 수 있는 기준", "참여 여부와 속도는 스스로 정해요. 함께하는 시간에는 서로를 존중할 수 있도록 이용 범위와 대화의 약속을 먼저 나눠요.")}
        ${row("03", "결정은 내가 내릴 수 있도록", "다른 사람의 경험과 조언은 참고할 수 있어요. 어떤 일을 선택하고 어떤 생활을 만들지는 각자의 상황과 기준에 따라 정해요.")}
        ${row("04", "서로의 속도를 존중해요", "구독 여부, 경험의 양, 결정의 속도로 사람을 평가하지 않아요. 다른 선택을 들었을 때도 먼저 그 사람이 놓인 상황을 살펴봐요.")}
      </section>
      <section class="section section-sky"><div class="wrap split"><div><p class="eyebrow">대화를 시작하는 방법</p><h2>정답보다,<br>서로의 경험을 물어봐요.</h2></div><ul class="line-list"><li>처음 시작할 때 무엇이 가장 궁금했나요?</li><li>그 선택에서 중요하게 생각한 것은 무엇인가요?</li><li>직접 해보니 생각과 달랐던 부분이 있었나요?</li><li>지금의 나는 무엇부터 해보고 싶나요?</li></ul></div></section>
      <section class="section wrap reading"><h2>내게 맞는 방식으로 참여해요.</h2><p class="lead">혼자 콘텐츠를 살펴보거나, 라운드테이블에서 이야기를 나누거나, 클래스에서 직접 경험해볼 수 있어요.</p>${link("programs.html", "프로그램 둘러보기", "button")}</section>`,
  },
  {
    slug: "about.html",
    title: "소개",
    description:
      "어른이아는 청년의 일과 삶을 위한 라이프 디자인·커리어 탐색 플랫폼이에요. 콘텐츠 구독, 라운드테이블, 클래스와 기수별 프로젝트를 소개해요.",
    body: `${intro("어른이아 소개", "일과 삶의 처음을,<br>함께 연습하는 곳.", "어른이아는 청년이 자신에게 맞는 일과 생활을 찾아가는 라이프 디자인·커리어 탐색 플랫폼이에요. 콘텐츠와 대화, 직접 해보는 경험을 이어가요.")}
      <section class="section wrap"><div class="wide-image">${photo("hero", "자연광이 드는 작업 공간에서 한국 청년들이 자료를 펼쳐 놓고 대화하는 모습")}</div></section>
      <section class="section section-soft"><div class="wrap split"><div><p class="eyebrow">어른이 되는 과정에서도</p><h2>여러 번 살펴보고,<br>다시 골라도 괜찮아요.</h2></div><div class="prose"><p>졸업을 앞두고 진로를 고민할 때, 첫 직장에서 관계가 어려울 때, 앞으로의 생활을 어떻게 꾸릴지 생각할 때. 혼자 고민하다 막히는 순간이 있어요.</p><p>어른이아에서는 다른 사람의 경험을 살펴보고, 비슷한 질문을 가진 사람을 만나요. 내 속도에 맞게 읽고 이야기하며 다음 선택에 쓸 기준을 쌓아가요.</p></div></div></section>
      <section class="section wrap">${sectionHead("어른이아를 만나는 방법", "읽고, 나누고,<br>직접 해보는 시간.")}
        ${row("01", "콘텐츠를 꾸준히 살펴봐요", `전문가의 시작과 선택을 담은 영상, 질문 카드, 사고 프레임을 아카이브에서 만나봐요. 무료·베이직·프리미엄 구독으로 이용 범위를 고를 수 있어요. ${link("pricing.html", "구독 플랜 보기")}`)}
        ${row("02", "비슷한 고민을 가진 사람과 만나요", `프리미엄 라운드테이블에서 서로의 경험을 나눠요. 혼자서는 떠올리지 못했던 질문과 관점을 들어봐요. ${link("programs.html#premium-round", "라운드테이블 보기")}`)}
        ${row("03", "관심 있는 경험에 참여해요", `DAY ONE 클래스와 별도로 모집하는 프로젝트에서 직접 경험해봐요. CORE-UP 4기는 진로를 살펴보는 기수별 프로젝트 중 하나예요. ${link("programs.html", "전체 프로그램 보기")}`)}
      </section>${ctaBand()}`,
  },
  {
    slug: "programs.html",
    title: "프로그램",
    description:
      "전문가 콘텐츠 아카이브, 프리미엄 라운드테이블, DAY ONE 클래스와 별도 모집 프로그램을 둘러봐요. CORE-UP 4기 모집 정보도 함께 확인할 수 있어요.",
    body: `${intro("프로그램", "지금 필요한 경험을,<br>내 방식으로 골라봐요.", "콘텐츠를 읽는 시간, 사람들과 이야기하는 자리, 직접 해보는 클래스까지. 어른이아의 기본 프로그램과 별도로 모집하는 프로젝트를 함께 살펴봐요.")}
      <section class="section wrap"><div class="actions">${link("programs.html#content-archive", "콘텐츠 아카이브")}${link("programs.html#premium-round", "라운드테이블")}${link("programs.html#day-one", "DAY ONE 클래스")}${link("programs.html#open-programs", "기수별 모집")}</div></section>
      <section class="section section-soft" id="content-archive"><div class="wrap split"><div class="prose"><p class="eyebrow">01 · 읽고 생각해요</p><h2>전문가 콘텐츠<br>아카이브</h2><p>다른 사람은 어떤 마음으로 시작했을까요? 처음의 기록과 선택의 순간을 따라가며 지금 나에게 필요한 질문을 찾아봐요.</p><p>한 번 보고 끝내기보다 고민이 생길 때 다시 꺼내볼 수 있도록, 영상과 질문 카드를 함께 살펴보는 구성이에요.</p><p><strong>베이직 월 9,900원 · 연 99,000원</strong><br>일부 콘텐츠는 무료 플랜에 포함돼요.</p>${link("pricing.html", "무료·베이직 구독 살펴보기", "button")}</div><ul class="line-list"><li><h3>DAY ONE · DAY 30 · DAY 365</h3><p>시작한 날부터 시간이 지난 뒤의 경험까지, 변화의 과정을 살펴보는 영상이에요.</p></li><li><h3>결정 포인트 · 사고 프레임</h3><p>어떤 선택 앞에서 무엇을 고민했는지 읽고, 내 상황에 대입해 생각해봐요.</p></li><li><h3>질문 카드</h3><p>진로와 관계, 돈과 일상을 돌아보는 질문으로 지금의 생각을 정리해요.</p></li></ul></div></section>
      <section class="section wrap" id="premium-round"><div class="split">${photo("workshop", "한국 청년들이 작은 모임에서 서로의 경험과 생각을 나누는 모습")}<div class="prose"><p class="eyebrow">02 · 만나서 이야기해요</p><h2>프리미엄<br>라운드테이블</h2><p>비슷한 고민을 가진 사람들과 만나 서로의 이야기를 들어요. 질문을 나누고 다른 선택을 살펴보며 내 생각도 조금씩 정리해봐요.</p><ul><li>프리미엄 구독에 포함된 라운드테이블 참여권</li><li>8~15명 규모의 소수 커뮤니티</li><li>일정과 주제는 회차별 안내</li></ul><p><strong>프리미엄 월 29,000원 · 연 290,000원</strong></p>${link("pricing.html#premium", "프리미엄 구독 살펴보기", "button")}</div></div></section>
      <section class="section section-sky" id="day-one"><div class="wrap split"><div class="prose"><p class="eyebrow">03 · 직접 경험해요</p><h2>DAY ONE 클래스</h2><p>궁금했지만 혼자 시작하기 어려웠던 일을 짧게 경험해봐요. 관심 있는 주제와 참여 방식에 맞춰 클래스를 골라요.</p><p>클래스는 구독과 별도로 신청하는 프로그램이에요. 프리미엄 구독에는 DAY ONE 클래스 할인 혜택이 포함돼요.</p>${link("contact.html", "클래스 참여 안내 보기", "button")}</div><ul class="line-list"><li><h3>원데이 클래스</h3><p>기존 안내 기준 5만~15만 원. 주제에 따라 온라인 또는 오프라인으로 경험해요.</p></li><li><h3>메타버스 체험</h3><p>기존 안내 기준 1만~3만 원. 디지털 공간에서 새로운 활동을 만나봐요.</p></li><li><h3>일정과 상세 비용</h3><p>실제 개설 일정, 장소, 정원, 할인 금액은 클래스별 모집 안내에서 확인하도록 준비하고 있어요.</p></li></ul></div></section>
      <section class="section wrap" id="open-programs">${sectionHead("추가로 열리는 기수별 모집", "함께하는 기수별 프로젝트", "아카이브·라운드테이블·클래스와 별도로 모집해요. 프로젝트마다 참여 조건과 진행 과정이 달라요.")}<div class="split"><div class="prose"><p class="eyebrow">CORE-UP 4기 · <span data-cohort-status>모집 중</span></p><h2>커리어 CORE-UP<br>성장 프로젝트 4기</h2><p>성향상담, 현직자 멘토링, 3일 실무 경험을 거쳐 나만의 프로필 이력서를 정리하는 기수별 프로젝트예요.</p><p>지원 조건: 만 26세 이하 · 서울 거주 또는 서울 소재 대학·직장 소속</p>${link("growth_4.html", "4기 모집 자세히 보기", "button")}</div><div class="prose"><dl class="facts"><div><dt>지원 기간</dt><dd>${COHORT.period}</dd></div><div><dt>모집 인원</dt><dd>최종 ${COHORT.capacity}명</dd></div><div><dt>결과 안내</dt><dd>${COHORT.result} 개별 안내</dd></div><div><dt>참여 방식</dt><dd>별도 지원·선발</dd></div></dl></div></div></section>
      <section class="section section-soft" id="archive"><div class="wrap">${sectionHead("지난 프로그램", "앞서 열렸던 모집도 살펴봐요.", "진로 프로젝트, 협업 프로그램, 이야기 공모전 등 기존 프로그램의 개요를 모아뒀어요.")}${archiveLinks()}<div class="archive-list"><div><span class="tag">지난 모집</span>${link("leadership1.html", "청년 역량·리더십 강화 프로젝트")}</div></div><div class="prose"><h3>그만둘만두 · 이야기 공모전</h3><p>‘지금까지 내가 그만둔 이야기, 그리고 그만둔 뒤 알게 된 나’를 주제로 자신의 경험을 나누는 공모전이었어요. 기존 접수 기간은 2026. 9. 1. — 9. 20.이며, 이 페이지에서는 응모를 받지 않아요.</p></div></div></section>${ctaBand()}`,
  },
  {
    slug: "pricing.html",
    title: "구독",
    description:
      "무료, 베이직 월 9,900원, 프리미엄 월 29,000원. 콘텐츠 아카이브와 라운드테이블 등 어른이아의 기존 구독 플랜을 비교해요.",
    body: `${intro("구독", "가볍게 둘러보고,<br>필요한 만큼 이어가요.", "혼자 살펴보는 콘텐츠부터 사람들과 함께하는 라운드테이블까지. 내게 맞는 이용 범위를 골라봐요.")}
      <section class="section wrap"><p class="note">기존 홈페이지의 구독 가격과 혜택을 정리한 검토안이에요. 현재 이 페이지에서 가입이나 결제는 진행되지 않아요.</p>
        <article class="editorial-row" id="free"><span class="row-number">01</span><div><p class="eyebrow">FREE</p><h2>무료</h2><p class="lead">먼저 어떤 콘텐츠가 있는지 살펴봐요.</p></div><div class="prose"><ul><li>일부 아카이브 콘텐츠 열람</li><li>DAY ONE 영상 샘플 3편</li><li>질문 카드 체험 5장</li><li>월간 뉴스레터 구독</li></ul><div class="actions">${link("contact.html", "무료 이용 안내", "button button-outline")}</div></div></article>
        <article class="editorial-row" id="basic"><span class="row-number">02</span><div><p class="eyebrow">BASIC</p><h2>베이직</h2><p class="lead"><strong>월 9,900원</strong><br>연 99,000원</p><p class="note">다시 꺼내보고 싶은 콘텐츠를 꾸준히 살펴봐요.</p></div><div class="prose"><ul><li>전체 아카이브 무제한 열람</li><li>DAY ONE · DAY 30 · DAY 365 영상 전체</li><li>결정 포인트 · 사고 프레임 전체</li><li>질문 카드 전체 100장+</li><li>월간 큐레이션 뉴스레터</li></ul><p class="small">연간 플랜은 월간 12회 결제보다 19,800원 낮아요. 월 구독료 2개월분에 해당해요.</p><div class="actions">${link("contact.html", "베이직 이용 안내", "button")}</div></div></article>
        <article class="editorial-row" id="premium"><span class="row-number">03</span><div><p class="eyebrow">PREMIUM</p><h2>프리미엄</h2><p class="lead"><strong>월 29,000원</strong><br>연 290,000원</p><p class="note">콘텐츠를 읽고, 다른 사람과 경험도 나눠봐요.</p></div><div class="prose"><ul><li>베이직의 모든 혜택</li><li>프리미엄 라운드테이블 참여권</li><li>8~15명 규모의 소수 커뮤니티</li><li>DAY ONE 클래스 할인</li><li>1:1 큐레이션 질문 답변</li></ul><p class="small">연간 플랜은 월간 12회 결제보다 58,000원 낮아요. 월 구독료 2개월분에 해당해요.</p><div class="actions">${link("contact.html", "프리미엄 이용 안내", "button button-outline")}</div></div></article>
      </section>
      <section class="section section-soft"><div class="wrap split"><div><p class="eyebrow">구독과 별도 프로그램</p><h2>클래스와 기수별 모집은<br>따로 살펴봐요.</h2></div><div class="prose"><p>DAY ONE 클래스는 개별 비용으로 참여하는 프로그램이에요. 프리미엄 구독의 클래스 할인 범위는 실제 모집 안내에서 확인하도록 준비하고 있어요.</p><p>CORE-UP 같은 기수별 프로젝트도 별도로 지원하고 선발하는 방식이에요. 구독만으로 참여가 확정되지는 않아요.</p>${link("programs.html", "전체 프로그램 보기")}</div></div></section>
      <section class="section wrap faq-section" id="faq"><div>${sectionHead("구독 FAQ", "이용 전에<br>궁금할 수 있는 것들")}</div><div class="faq-list">
        ${faq("무료와 베이직은 무엇이 다른가요?", "무료는 일부 아카이브, 영상 샘플 3편, 질문 카드 5장으로 구성을 살펴보는 플랜이에요. 베이직은 전체 아카이브와 영상, 질문 카드, 사고 프레임을 이용하는 구성이에요.")}
        ${faq("라운드테이블은 어떤 플랜에 포함되나요?", "프리미엄 플랜에 참여권이 포함돼요. 기본 구성은 8~15명 규모이며, 실제 일정과 주제는 회차별로 확인하도록 준비하고 있어요.")}
        ${faq("연간 플랜은 얼마나 다른가요?", "베이직은 연 99,000원, 프리미엄은 연 290,000원이에요. 각각 월간 플랜을 12회 결제하는 금액보다 2개월분이 낮은 기존 요금 구성이에요.")}
        ${faq("지금 바로 구독할 수 있나요?", `현재는 구독 구성과 가격을 살펴보는 검토 단계예요. 결제나 자동 갱신은 진행되지 않아요. 실제 신청 방법은 ${link("contact.html", "문의 안내")}에 추가할 예정이에요.`)}
        ${faq("해지와 환불은 어떻게 하나요?", "기존 홈페이지에서는 언제든 해지할 수 있고 결제 기간 안에는 이용할 수 있다고 안내했어요. 실제 판매 전에는 자동 갱신, 해지 방법, 환불 기준을 확정해 이용약관과 결제 화면에 안내할 예정이에요.")}
      </div></section>`,
  },
  {
    slug: "contact.html",
    title: "문의",
    description:
      "콘텐츠 구독, 라운드테이블, DAY ONE 클래스, 별도 모집과 협업에 관한 어른이아 문의 안내예요.",
    body: `${intro("문의", "궁금한 점을 남겨주세요.", "구독과 프로그램 참여, 협업 제안까지. 답변받을 이메일과 문의 내용을 적어주세요.")}
      <section class="section wrap contact-section"><div class="contact-layout"><div>
        <form class="contact-form" method="post" data-contact-form>
          <p class="contact-status" role="status" tabindex="-1" data-contact-status></p>
          <fieldset disabled><legend class="visually-hidden">어른이아 문의 작성</legend>
            <div class="contact-field"><label for="contact-email">이메일 <span>필수</span></label><input id="contact-email" name="email" type="email" autocomplete="email" inputmode="email" required maxlength="254" placeholder="hello@example.com" aria-describedby="email-help"><p id="email-help" class="small">이 주소로 답변을 보내드려요.</p></div>
            <div class="contact-field"><label for="contact-message">문의 내용 <span>필수</span></label><textarea id="contact-message" name="message" required maxlength="5000" rows="7" placeholder="궁금한 내용을 편하게 적어주세요." aria-describedby="message-help"></textarea><p id="message-help" class="small">최대 5,000자 · 비밀번호나 민감한 개인정보는 적지 마세요.</p></div>
            <label class="contact-consent"><input name="consent" type="checkbox" required><span>이메일·문의 내용을 답변에 이용하고, FormSubmit을 통해 어른이아에 전달하는 데 동의해요. <a href="/v0_1/privacy.html">개인정보 안내 보기</a></span></label>
            <button class="button" type="submit" disabled>문의하기</button>
          </fieldset>
          <noscript><p class="contact-status">문의 폼을 사용하려면 자바스크립트를 켜주세요. 아래 이메일로도 문의할 수 있어요.</p></noscript>
        </form>
        <div class="contact-success" data-contact-success hidden><span class="success-mark" aria-hidden="true">✓</span><h2 tabindex="-1">문의하신 내용이<br>전달되었습니다.</h2><p>빠른 시일 내에 답변 드리겠습니다.</p><p class="small">작성하신 이메일로 답변을 보내드려요.</p><div class="actions">${link("", "홈으로 돌아가기", "button")}<button class="button button-outline" type="button" data-contact-again>새 문의 작성</button></div></div>
      </div><aside class="contact-aside"><p class="eyebrow">어른이아에 물어보세요</p><h2>함께 시작할 일도,<br>이용 중 궁금한 점도.</h2><p>구독 이용, 클래스 일정, 프로그램 참여 방법과 협업 제안을 남겨주세요.</p><div class="contact-email-note"><p class="small">이메일로 직접 문의할 수도 있어요.</p><p>${CONTACT.recipient}</p></div><div class="contact-shortcuts">${link("pricing.html", "구독 플랜 살펴보기")}${link("programs.html", "프로그램 둘러보기")}</div></aside></div></section>
      <section class="section section-soft"><div class="wrap faq-section"><div><p class="eyebrow">자주 묻는 질문</p><h2>먼저 살펴볼까요?</h2></div><div class="faq-list">
        ${faq("처음이라면 무엇부터 보면 좋을까요?", `무료 플랜의 콘텐츠 구성부터 살펴보세요. 더 많은 콘텐츠가 필요하다면 베이직, 다른 사람과 이야기하는 자리도 원한다면 프리미엄을 비교할 수 있어요. ${link("pricing.html", "무료·베이직·프리미엄 비교")}`)}
        ${faq("클래스에 참여하려면 구독해야 하나요?", "DAY ONE 클래스는 구독과 별도로 참여하는 프로그램이에요. 프리미엄 플랜에는 클래스 할인 혜택이 포함돼요. 일정과 개별 비용은 실제 클래스 모집 안내에서 확인하도록 준비하고 있어요.")}
        ${faq("프로그램마다 참여 조건이 다른가요?", "네. 예를 들어 만 26세 이하·서울 거주 또는 서울 소재 대학·직장 소속 조건은 CORE-UP 4기에 해당해요. 구독과 클래스, 다른 프로젝트는 각각의 이용·참여 안내를 확인해주세요.")}
        ${faq("CORE-UP 4기에는 어떻게 지원하나요?", `4기는 구독과 별도로 지원하는 프로젝트예요. 지원 기간은 ${COHORT.period}이고, 결과는 ${COHORT.result}에 개별 안내할 예정이에요. ${link("growth_4.html", "지원 조건과 과정 확인")}`)}
        ${faq("사진은 실제 프로그램 현장인가요?", "이번 검토 페이지의 사진은 한국 청년의 활동 장면을 AI로 연출한 예시예요. 실제 참여자나 운영 현장을 촬영한 사진은 아니에요.")}
      </div></div></section>`,
  },
  {
    slug: "privacy.html",
    title: "개인정보 안내",
    description:
      "v0_1 검토 페이지의 개인정보 입력 기능과 외부 지원 페이지 이동에 관한 안내예요.",
    body: `${intro("개인정보 안내", "문의한 내용에<br>답변하기 위해 사용해요.", "문의 양식으로 전달하는 정보와 이메일 전달 방식을 안내해요. 제출 전에 확인해주세요.")}
      <section class="section wrap reading prose"><h2>입력하는 정보와 목적</h2><p>답변받을 이메일 주소와 문의 내용을 받아 문의 확인과 답변에 사용해요. 두 항목과 동의 확인은 필수이며, 동의하지 않으면 문의 양식으로 제출할 수 없어요. 비밀번호나 민감한 개인정보는 문의 내용에 적지 마세요.</p><h2>전달 방식</h2><p>동의 후 문의하기를 누르면 이메일 주소와 문의 내용이 이메일 전달 서비스 FormSubmit(formsubmit.co)에 전송되고, 운영자 수신 주소 ${CONTACT.recipient}로 전달돼요. 작성한 이메일은 답변 주소로 사용해요.</p><h2>보관과 삭제 문의</h2><p>FormSubmit은 제출 내용을 30일간 보관한다고 안내하고 있어요. 전달된 문의는 운영자 이메일에도 보관돼요. 이 사이트는 문의 내용을 브라우저 저장소나 별도 사이트 데이터베이스에 저장하지 않아요. 열람·정정·삭제를 요청하려면 ${CONTACT.recipient}로 연락해주세요.</p><p><a class="text-link" href="https://formsubmit.co/privacy.pdf" target="_blank" rel="noopener noreferrer">FormSubmit 개인정보 안내 보기 ↗</a></p><h2>그 밖의 기능</h2><p>v0_1에서는 회원가입, 로그인, 결제, 상담 접수, 구독 신청을 받지 않아요. 정식 운영 주체, 개인정보 담당자와 운영자 이메일의 보유 기간 등 상세 운영 정보는 확정 후 추가할 예정이에요.</p><h2>외부 지원 페이지</h2><p>‘4기 지원하기’는 외부 지원 페이지로 연결돼요. 이동한 페이지에서 개인정보를 입력하기 전에는 해당 페이지의 운영 주체, 수집 항목, 이용 목적과 동의 내용을 확인해주세요.</p>${link("contact.html", "문의 작성하기")}</section>`,
  },
  {
    slug: "terms.html",
    title: "이용 안내",
    description:
      "어른이아 v0_1 검토 페이지의 이용 범위, 예시 사진, 프로그램 안내와 외부 지원 연결을 설명해요.",
    body: `${intro("이용 안내", "먼저 살펴보는<br>어른이아 개편 페이지예요.", "현재 페이지는 구성과 문구를 검토하는 단계예요. 정식 서비스의 이용 조건과 운영 정보는 확정 후 별도로 안내해요.")}
      <section class="section wrap reading prose"><h2>볼 수 있는 내용</h2><p>어른이아 소개, 기본 프로그램, 무료·베이직·프리미엄 구독 구성, 별도 모집과 이전 프로그램의 개요를 확인할 수 있어요. 이 페이지 자체에서 프로그램 신청을 접수하거나 결제를 진행하지 않아요.</p><h2>사진과 예시 콘텐츠</h2><p>사진은 한국 청년의 활동 장면을 AI로 연출한 예시예요. 실제 참여자 사진이나 활동 실적을 뜻하지 않아요. 실제 후기와 구분해 표시한 문구 예시 역시 실제 참여자의 발언으로 볼 수 없어요.</p><h2>프로그램 참여</h2><p>프로그램의 참여 조건은 해당 모집 안내에서 확인해주세요. ‘4기 지원하기’를 누르면 외부 지원 페이지로 이동해요. 실제 신청 전에는 그곳의 최신 모집 정보와 개인정보 안내를 확인해주세요.</p><h2>문의하기</h2><p>문의 양식에서 이메일과 문의 내용을 보내면 운영자가 이메일로 답변해요. 전송은 FormSubmit을 통해 처리해요. 문의 제출만으로 구독·결제·프로그램 신청이 완료되지는 않아요. 수신 주소는 ${CONTACT.recipient}예요.</p><h2>아직 준비 중인 기능</h2><p>회원가입, 로그인, 결제, 구독 신청은 이 검토 페이지에서 제공하지 않아요. 운영 주체와 이용 조건이 확정되면 정식 안내를 추가할 예정이에요.</p>${link("programs.html", "프로그램으로 돌아가기")}</section>`,
  },
  {
    slug: "growth.html",
    title: "커리어 성장 프로젝트 3기 · 지난 프로그램",
    description:
      "청년 커리어 성장 프로젝트 3기의 이전 모집 구성을 살펴봐요. 새로운 모집은 전체 프로그램 안내에서 확인해주세요.",
    body: `${intro("지난 프로그램 · 3기", "청년 커리어<br>성장 프로젝트 3기", "커리어 진단과 라이프 방향 설정, 현직자와의 대화, 프로필 이력서 제작으로 이어지는 이전 모집 프로그램이에요.")}
      <section class="section wrap reading">${notice("이전 모집 안내예요", "3기 지원은 이 페이지에서 받지 않아요. 새로운 모집 정보와 참여 조건은 전체 프로그램에서 확인해주세요.")}</section>
      <section class="section section-soft"><div class="wrap">${sectionHead("프로그램 구성", "나를 돌아보고,<br>커리어의 방향을 정리하는 과정")}${row("01", "커리어 진단", "성향과 현재 상황을 바탕으로 관심 직무와 커리어를 살펴보는 과정이에요.")}${row("02", "라이프 방향 설정", "일을 포함해 앞으로의 생활에서 중요하게 생각하는 기준을 정리하는 과정이에요.")}${row("03", "현직자 미팅과 프로필 이력서", "현직자와 대화하며 내 경험을 돌아보고, 지원에 활용할 프로필 이력서로 정리하는 과정이에요.")}</div></section>
      <section class="section wrap">${sectionHead("더 살펴보기", "다른 기수의 프로그램")}${archiveLinks("growth.html")}</section>${ctaBand()}`,
  },
  {
    slug: "growth_1.html",
    title: "현직자 멘토링 프로젝트 1기 · 지난 프로그램",
    description:
      "현직자 멘토링 프로젝트 1기의 FIT 분석, 커리어 로드맵, 멘토링 중심 구성을 살펴봐요.",
    body: `${intro("지난 프로그램 · 1기", "현직자 멘토링<br>프로젝트 1기", "성향과 관심 직무를 살펴보고, 현직자의 업무 경험을 들으며 커리어 로드맵을 정리하는 구성의 프로그램이에요.")}
      <section class="section wrap reading">${notice("이전 프로그램의 구성 안내예요", "이 페이지에서는 1기 참가 신청을 받지 않아요. 참여를 원한다면 프로그램 페이지에서 새 모집과 기본 프로그램을 확인해주세요.")}</section>
      <section class="section section-soft"><div class="wrap">${sectionHead("프로그램 구성", "어떤 일이 궁금한지부터<br>함께 살펴봐요.")}${row("01", "성향과 직무 살펴보기", "FIT 분석을 바탕으로 강점과 관심 분야를 정리하고, 직무를 탐색할 기준을 찾아보는 과정이에요.")}${row("02", "현직자에게 물어보기", "관심 있는 일의 실제 모습과 시작할 때 필요한 준비를 현직자와 이야기하는 과정이에요.")}${row("03", "커리어 로드맵 정리하기", "대화에서 발견한 내용을 바탕으로 더 알아볼 분야와 준비할 일을 정리하는 과정이에요.")}</div></section>
      <section class="section wrap">${sectionHead("더 살펴보기", "다른 기수의 프로그램")}${archiveLinks("growth_1.html")}</section>${ctaBand()}`,
  },
  {
    slug: "growth_2.html",
    title: "커리어 성장 프로젝트 2기 · 지난 프로그램",
    description:
      "청년 커리어 성장 프로젝트 2기의 커리어 진단, 라이프 방향 설정, 현직자 미팅과 이력서 제작 구성을 살펴봐요.",
    body: `${intro("지난 프로그램 · 2기", "청년 커리어<br>성장 프로젝트 2기", "커리어 진단에서 시작해 일과 생활의 방향을 살펴보고, 현직자의 의견을 참고해 이력서를 정리하는 프로그램 구성이에요.")}
      <section class="section wrap reading">${notice("이전 프로그램의 구성 안내예요", "이 페이지에서는 2기 참가 신청을 받지 않아요. 참여를 원한다면 프로그램 페이지에서 새 모집과 기본 프로그램을 확인해주세요.")}</section>
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

# 공식 도메인 행사 연동 · 2026-10-02

## 운영 기준

공식 홈페이지의 운영 저장소는 `newhope12000/arunia`, 기존 Vercel 프로젝트는 `newhope12000s-projects/arunia`, 대표 도메인은 `https://www.arunia.co.kr`다. 기존 main의 Vercel 성공 상태와 현재 GitHub CLI 계정의 push 권한을 확인했다. 별도 `hwajeongup-hj/arunia`에 먼저 만들어 둔 행사 페이지를 이 저장소의 공식 경로로 옮긴다. 기존 홈페이지, 그만둘만두 일정 공지, `/preview/`, `/v0_1/` 시안은 유지한다.

| 화면 | 공식 경로 | 원본 |
|---|---|---|
| 훈민정음 소개 | `/hunmin` | `legacy/hunmin/index.html` |
| 훈민정음 응모 | `/hunmin/apply` | `legacy/hunmin/apply.html` |
| 훈민정음 접수 확인 | `/hunmin/thanks` | `legacy/hunmin/thanks.html` |
| CORE-UP 안내·신청 | `/career-core-up` | `legacy/career-core-up/index.html` |
| CORE-UP 접수 확인 | `/career-core-up/thanks` | `legacy/career-core-up/thanks.html` |

`scripts/build-review.mjs`가 `legacy/`를 재귀 복사하여 `review-dist/`에 생성한다. 행사 전용 URL 규칙만 추가하며 기존 `.html` 페이지, 미리보기 SPA와 API rewrite를 유지한다. 행사 canonical·OG URL은 공식 도메인을 사용한다.

## 입력·저장·알림

```text
www.arunia.co.kr/hunmin/apply
  → applications-collection.vercel.app/api/arunia-hunmin-apply/
  → 기존 운영 Apps Script 웹 앱
  → 기존 Google Sheets의 어른이아 훈민정음 탭
  → 저장 확인 후 기존 Telegram 봇 알림

www.arunia.co.kr/career-core-up
  → applications-collection.vercel.app/api/arunia-apply/
  → 같은 운영 웹 앱의 별도 CORE-UP 분기
  → 기존 어른이아 CORE-UP 탭
  → 저장 확인 후 기존 Telegram 봇 알림
```

훈민정음은 기존 이름·연락처·숫자 나이 20~27·시도/시군구/동읍면·네 줄·동의·미리보기·최종 제출 구조를 보존한다. 특정 거주지 예시는 없다. 무작위 5자리 접수번호와 동일 제출 ID 재확인, 저장 확인 전에 성공으로 표시하지 않는 처리를 유지한다. 훈민정음 시트의 I열은 전체 거주지, J/K/L열은 지역 세 항목이며 AC열은 접수번호다. Telegram에는 이름·연락처·나이·전체 거주지·네 줄·접수번호가 이미 포함된다. 공개 화면의 나이 표기는 ‘나이’이며 기존 저장 스키마의 H열 ‘만 나이’ 이름과 숫자 age 필드는 데이터 호환성을 위해 유지한다.

도메인 이동에 필요한 서버 변경은 두 수집 API의 정확한 출처 허용 목록이다. `https://www.arunia.co.kr`, `https://arunia.co.kr`, 기존 `https://arunia-silk.vercel.app`과 수집 서버 자신의 출처를 허용하고 유사 도메인·임의 미리보기 도메인은 허용하지 않는다. 중앙 handler와 기존 수집 서버 원본을 함께 맞춘다. API·봇·시트 탭·Apps Script 배포 주소와 비밀값은 재사용한다.

CORE-UP의 기존 9월 30일 마감은 연장하지 않았다. 이번 작업은 도메인·경로와 기존 연동의 통합이며 자동 마감·수상자 선정·결과 자동 게시를 새로 구현하지 않는다. 기존 문의·리더십·그만둘만두의 다른 수신 흐름과 상담 시안 API는 별도 기능으로 유지한다.

## 싱크 기록

참여자가 홈페이지와 응모 사이트의 브랜드·주소가 달라 혼동하는 문제를 줄이기 위해 한 공식 도메인 안에서 안내→응모→접수 확인으로 연결한다. 설명을 읽고 싶은 이용자와 빠르게 응모하려는 이용자를 함께 지원하는 설계 가설이다. MBTI별 행동을 검증된 사실로 단정하지 않는다.

데이터 확인 후 정한 구현 범위는 공식 저장소 최신 main 기준의 행사 파일 추가, 기존 화면에서 공식 행사 진입 링크 추가, CORE-UP의 서로 다른 접수 링크 정리, 수집 API 출처 허용 수정이다. 상담 리뉴얼 시안과 기존 다른 운영 흐름을 전면 교체하지 않는다. 배포 전 빌드 및 경로·자산·폼·출처 검증, 배포 후 공식 페이지와 읽기 전용 접수 준비 상태를 확인한다.

## 검증 기록

- 공식 저장소 `npm run build:review` 성공, `npm test` 39개 통과. 행사 전용 7개 테스트는 경로·자산·공식 공유 주소·기존 폼 제약·JS 동일성·UTM 보존·실제 중첩 폴더 복사를 검증한다.
- 중앙 저장소 커밋 `f773229`에 공식 도메인 두 개의 정확한 허용 및 `test:arunia-api` 회귀 테스트 25개를 반영했다. 별도 시트·Telegram 로컬 테스트 27개도 통과했다.
- 배포된 두 중앙 API에서 `Origin: https://www.arunia.co.kr`의 GET은 HTTP 200, `verify.ready`, `{ok:true,ready:true}`이고 OPTIONS는 HTTP 204다. 응답의 허용 출처는 요청한 공식 도메인과 정확히 일치한다. 새 신청 행이나 Telegram 메시지를 생성하지 않는 읽기 전용 확인이다.
- 데스크톱과 390px 모바일에서 홈페이지 카드·모바일 메뉴→공모전 이동을 확인했다. 모바일 문서 너비와 화면 너비가 같아 가로 넘침이 없다. 기존 그만둘만두 공지는 원문을 유지한다.
- 공식 main 커밋 `9686a30`의 기존 Vercel 자동 배포가 성공했다: `https://vercel.com/newhope12000s-projects/arunia/JAMGUFgyiACqyGnhcYLzd7w2McGz`. 중앙 서버 커밋 `f773229`의 Vercel 배포도 성공했다: `https://vercel.com/hj-1st/applications-collection/J9HrS2avMXT3Zef4wuwjTq9mvHvq`.
- 공개 `https://www.arunia.co.kr/`의 새 행사 카드와 메뉴→`/hunmin`→`/hunmin/apply`를 실제 브라우저로 확인했다. 응모 화면의 준비 확인이 완료되어 입력칸과 내용 확인 버튼이 활성화됐다. `/career-core-up`도 같은 도메인에서 준비 확인 및 버튼 활성화를 확인했다.
- 접수 확인 두 경로와 기존 `/preview/`, `/v0_1/`는 HTTP 200이며 행사 `.html` 및 후행 슬래시 주소는 확장자 없는 공식 경로로 정상 이동한다. 운영 화면 확인 중 실제 응모 POST나 추가 Telegram 발송은 하지 않았다.

## 훈민정음 시상·나이 표기·포스터 수정 · 2026-10-02

사용자 요청과 새로 제공한 포스터를 기준으로 훈민정음의 금상·은상·동상을 수석·차석·장려상으로 변경한다. 수석 2명 각 100만 원, 차석 10명 각 50만 원 + 1회 컨설팅, 장려상 30명 1회 컨설팅권이다. 장려상 5만 원 상금과 그 설명을 제거하며 홈페이지와 프로그램 안내 카드도 같은 내용으로 맞춘다.

참여 대상과 응모 화면의 라벨·개인정보 안내·미리보기·검증 안내에서 나이의 ‘만’을 제거한다. 숫자 나이 입력 범위 20~27과 필드 이름은 유지한다. 기존 시트 탭·내부 헤더·봇은 변경하지 않으며 별도 CORE-UP·그만둘만두 행사 및 클래스 요금에는 적용하지 않는다.

새 JPEG 포스터를 원본 그대로 `legacy/assets/hunmin-contest-poster-20261002-v2.jpg`에 복사하고 크게 보기와 공유 이미지를 교체한다. 새 이미지에 없는 운영 규칙을 임의로 추가하지 않고 기존 확정 응모 마감·결과 안내 일정은 유지한다. 이 변경은 참여자가 접수 전에 확인하는 보상·자격 정보를 동일하게 표시해 혼동을 줄이기 위한 문구 수정이다.

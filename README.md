# 어른이아 — 마음을 만나는 플랫폼

기존 어른이아 정적 사이트를 루트(`/`)에서 제공하고, 서울·경기 2030을 위한 상담 전문가 매칭 서비스 개편안은 `/preview/`에서 별도로 검토합니다. 개편안에는 React 화면과 로컬에서 실행할 수 있는 회원·신청·운영자 배정·결제 API가 포함되어 있습니다.

공개된 개편안은 **읽기 전용 미리보기**입니다. 상담사 6명, 후기 10개는 명확히 표시한 가상 콘텐츠이며 콘셉트 사진 5장과 가상 인물 사진 6장은 AI로 새로 제작한 콘셉트 이미지입니다. 실제 상담사 사진, 실제 후기 또는 협업 실적이 아닙니다. 공개 미리보기에서는 Google 로그인·상담 접수·결제를 활성화하지 않습니다.

## 시작하기

Node.js 22.12+ 권장.

```sh
npm ci
cp .env.example .env
npm run dev
```

`http://localhost:4173`에서 개편안의 전체 로컬 앱을 확인합니다. 이 개발 명령은 공개 사이트의 기존 홈페이지와 `/preview/`를 합치는 배포 빌드와 별개이며, 기존 동작을 유지합니다. `.env`와 `.data/`는 Git에 포함되지 않습니다. 기본 DB는 로컬 SQLite입니다. 개발 중 `server/` 변경 시 서버를 다시 시작하세요.

```sh
npm run build
npm test
```

운영자 생성: 실행 환경에 `ADMIN_EMAIL`과 14자 이상 `ADMIN_PASSWORD`를 임시 설정한 뒤 `npm run admin`을 실행합니다. 비밀번호는 셸 히스토리나 Git에 남기지 않으세요. 생성·재설정 때 기존 세션을 모두 폐기합니다. 웹 가입으로 운영자 권한을 얻을 수 없습니다.

## 구현 범위

- 홈, 고민 주제 8개와 상세 안내, 상담사 검색·주제/지역 필터·상세, 서비스·비용 안내, 4개 프로그램 방향, 소개·FAQ
- 10개 페르소나 가상 후기, 각 카드에 가상 표시. `APP_DEMO=false`이면 가상 후기·상담사 제외
- Google 로그인·첫 가입·인증 이메일 확인, 로그아웃, 서버 세션, 회원별 신청·결제 내역
- 기존 이메일 회원/운영자 로그인과 비밀번호 변경 유지 (`/login/email`)
- 매칭 신청 → 운영자가 상담사·시간·장소·포함 내역·총액 제안 → 이용자 수락 → 결제 → 예약 확정
- 운영자 신청 관리, 상담사 등록·비활성화, 상담 완료, 변경·취소 요청 접수/처리, 결제 전액 취소, 운영 로그
- 테스트용 모의 결제 및 토스페이먼츠 V2 위젯/REST 승인·조회·전액 취소 어댑터
- 서버 저장 금액 검증, 소유권·역할 확인, 제안 버전 검증, 동시 주문 방지, 승인 중복·타임아웃 복구
- 모바일 메뉴·그리드, 키보드 포커스·본문 바로가기, 대체 텍스트, 페이지 제목, 미리보기 검색 차단

현재 매칭은 **운영자가 확인하고 배정하는 방식**입니다. 자동 추천/AI 매칭, 상담사 전용 로그인, 메일 인증·비밀번호 재설정 메일·예약 알림 발송은 포함하지 않습니다. Google 로그인은 Google의 인증된 이메일만 받아 사용합니다. 기존 이메일·비밀번호 가입 API의 이메일 소유권은 아직 검증하지 않으므로 해당 방식에는 이메일 인증/계정 복구 채널이 추가로 필요합니다. 검토용 연락처에는 실제 안내 메일을 보내지 않습니다.

## Google 로그인

전체 로컬 앱의 `/login`과 `/signup`은 Google로 시작하는 화면입니다. 새 이용자는 동의 체크 후 Google의 인증된 계정으로 가입하며, 기존 Google 회원은 같은 회원 계정으로 로그인합니다. 기존 이메일 회원과 운영자는 `/login/email`을 사용합니다. 이메일이 같아도 기존 계정을 Google 계정과 자동으로 합치지 않습니다. 공개 `/preview/login`에서는 버튼을 비활성화하며, Vercel의 Google 로그인 서버는 연결하지 않았습니다.

`.env` 또는 서버 환경 변수에 `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`을 등록하고 Google의 웹 OAuth 클라이언트에 `APP_ORIGIN` + `/api/auth/google/callback`을 정확히 등록합니다. 값이 없거나 운영 준비가 완료되지 않은 경우 버튼은 비활성화됩니다. 비밀키는 서버에서만 사용하며 정적 검토 빌드에 포함하지 않습니다. Google 전용 회원에게는 사이트 비밀번호 변경을 제공하지 않습니다.

서버는 authorization code·PKCE·브라우저와 연결한 일회용 state·nonce를 확인하고, 공식 라이브러리로 ID 토큰의 서명·대상 클라이언트·발급자·만료를 검증합니다. 계정은 변경될 수 있는 이메일 대신 Google 식별자로 연결하며, 로그인할 때 기존 세션을 교체합니다. 로그인 외 Google API 권한이나 토큰 보관은 요청하지 않습니다.

자세한 설정: [Google 로그인 연결 안내](docs/google-login-setup.md). 기존 프로젝트 재사용 시 Branding·Audience는 프로젝트 단위로 공유되므로 기존 서비스의 설정을 먼저 확인합니다. 실제 Google 계정 로그인은 OAuth 설정을 연결한 뒤 별도 검증해야 합니다.

## 결제 환경

| 설정                                                                | 동작                                                                    |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `APP_DEMO=true`, `PAYMENT_MODE=mock`                                | 실제 청구 없는 모의 결제. 외부 PG 호출 없음                             |
| `APP_DEMO=true`, `PAYMENT_MODE=toss_test`                           | 계약/개발자 계정의 **위젯용** 테스트 키 쌍 필요. 실제 SDK 결제창 테스트 |
| `APP_DEMO=false`, `OPERATIONS_READY=true`, `PAYMENT_MODE=toss_live` | 실제 운영 DB·상담사·정책·사업자 정보와 live 위젯 키 쌍 확인 후에만 사용 |

토스 키 미발급 상태에서는 `mock`으로 검토합니다. `TOSS_CLIENT_KEY`는 공개 위젯 키이고 `TOSS_SECRET_KEY`는 서버 전용입니다. 토스 테스트 결제와 실제 결제는 **아직 실행하지 않았습니다**.

미승인 응답은 결제 완료로 처리하지 않습니다. 타임아웃은 주문을 재생성하지 않고 회원/운영 화면의 **결제 상태 확인**으로 원 주문을 조회합니다. `IN_PROGRESS`면 기존 멱등키로 승인 재시도, `EXPIRED/ABORTED`로 확정되면 기존 실패 기록을 남기고 새 주문을 허용합니다. `DONE`만 예약 확정으로 처리합니다.

현 버전의 운영 대상 결제수단은 즉시 승인되는 카드·간편결제입니다. **가상계좌·후불 등 비동기 결제수단은 토스 위젯 상점 설정에서 노출하지 않아야 합니다.** 웹훅 수신·자동 정산 스케줄러는 포함하지 않습니다. 승인/취소 미확정 내역은 운영자가 상태 확인 및 전액 취소 재시도로 복구합니다. 부분 환불은 지원하지 않습니다.

공식 연결 문서: [위젯 연동](https://docs.tosspayments.com/guides/v2/payment-widget/integration), [결제 API](https://docs.tosspayments.com/reference), [멱등 요청](https://docs.tosspayments.com/reference/using-api/authorization).

## 구조와 교체 위치

```text
src/main.tsx              공개 화면, 회원·신청·결제·운영 UI
src/style.css             색상, 레이아웃, 반응형 스타일
shared/counseling-categories.json  고민 주제 8개·상세 설명·서비스 연결
src/counseling-content.ts  공유 상담 카테고리의 화면용 타입
src/SiteFooter.tsx         푸터 메뉴·등록 예정 사업자 정보
server/app.js             Express API, 인증·매칭·주문 상태 관리
server/db.js              DB 연결·초기 스키마
server/google-auth.js     Google OAuth·계정 생성·가입 동의 기록
server/content.json       가상 후기 10개·상담사 예시 6개
server/admin.js           운영자 계정 발급 CLI
public/images/            콘셉트 사진 5장·가상 인물 사진 6장 (JPEG 최적화본)
docs/image-prompts.json   이미지 제작 프롬프트
api/index.js              Vercel Node API 진입점 (현재 공개 배포에서는 차단)
legacy/                  루트에 제공하는 기존 HTML/CSS/JS와 이미지
scripts/build-review.mjs  기존 사이트 루트 + /preview/ 개편안의 정적 배포 빌드
tests/platform.test.js    격리된 DB와 가짜 결제사로 API 통합 검증
```

사진은 동일 파일명으로 교체할 수 있습니다. 데모 상담사 예시는 데모 서버 시작 시 콘텐츠 파일과 동기화합니다. 실제 프로필과 비활성화 상태, 회원·신청·결제 기록은 유지됩니다. 프로필 사진과 이력은 가상 예시이며, 실제 운영 전 확인된 정보로 교체하세요. 공개 배포의 기존 HTML 페이지와 정적 자산은 원래 URL을 유지합니다.

## Vercel / 실제 운영 연결

현재 Vercel 설정은 **루트의 기존 사이트와 `/preview/`의 새 읽기 전용 화면을 함께 제공하는 배포**입니다. `npm run build:review`와 `review-dist`를 사용하며, 로그인·접수·결제 API는 `ARUNIA_REVIEW_ONLY=true`로 차단합니다. DB나 Google 인증키 없이도 두 사이트의 공개 화면을 볼 수 있습니다. 로컬 `npm run dev`와 전체 앱의 `npm run build`는 그대로 사용할 수 있습니다.

이후 로그인·매칭 서버를 공개하려면 원격 libSQL/Turso DB와 서버 환경 변수, 실제 계정 검증이 필요합니다. 기존 루트를 보존하면서 `/preview/`에 서버 기능을 연결하려면 앱과 인증 후 복귀 경로까지 별도로 준비해야 합니다. 현재 설정에서 빌드 명령만 전체 앱용으로 바꾸면 기존 루트를 다시 교체하므로, 단순 설정 변경으로 운영을 활성화하지 않습니다. 배포 범위와 후속 준비 항목은 [Vercel 연결 체크리스트](docs/vercel-google-login-checklist.md)에 정리했습니다.

정식 공개 전에 확정할 항목:

1. 상담사 75명의 실제 명단·자격·소개·게시 동의 및 활동 상태
2. 사업자·고객 지원 정보, 회기 시간·요금·장소 비용·취소/환불 기준
3. 개인정보 수집·전달·보관·파기·위탁 및 계정 삭제/열람 처리 절차
4. Google OAuth 클라이언트 연결·실계정 로그인 검증, 기존 이메일 회원 인증·복구 및 필요한 알림 채널
5. 토스 심사와 위젯 키, 허용 결제수단, sandbox 승인·취소·복구 시험
6. 운영 DB 백업과 미확정 결제 확인 절차, 운영자 접근 관리

제휴 로고는 넣지 않았습니다. 실제 협업과 사용 허락이 확인된 뒤 추가합니다. 공간 대관을 공식 제휴로 표현하지 않습니다.

## 일시적인 외부 공유

### 기존 홈페이지와 별도 개편안 검토

`npm run build:review`는 기존 `legacy/` 정적 사이트를 `review-dist/` 루트에, 새 개편안을 `review-dist/preview/`에 만듭니다. 기존 홈페이지는 `https://arunia.vercel.app/`, 개편안은 `https://arunia.vercel.app/preview/`에서 확인하는 구성입니다. `/growth.html`, `/programs.html` 등 기존 페이지는 원래 주소를 유지하며 `/archive/`로 옮기지 않습니다.

새 개편안의 메뉴와 이미지 경로는 `/preview/` 기준입니다. 이 화면은 가상 공개 콘텐츠만 포함하며 서버 API를 호출하지 않습니다. 로그인·가입 페이지에서는 비활성화된 Google 버튼과 연결 준비 안내를 보여주며, 상담 신청·계정·관리자·결제 경로는 접수하지 않는다는 안내 화면으로 연결됩니다. 기존 `npm run build`는 로컬 전체 앱을 생성하는 별도 명령입니다.

정적 호스팅에는 `review-dist/`를 업로드합니다. `/preview/counselors/...`, `/preview/counseling/...` 등 개편안의 화면 경로에만 `/preview/index.html`로 연결하는 SPA 규칙을 적용합니다. 루트 전체를 새 앱으로 연결하지 않습니다. `X-Robots-Tag: noindex, nofollow`와 robots의 새 검색 차단 범위도 `/preview/`에 한정하며, 기존 홈페이지 전체를 검색 차단하지 않습니다. 존재하지 않는 자산·소스·환경 설정 파일은 공개하지 않고 `/api`는 읽기 전용 배포 설정으로 차단합니다.

카테고리 참고 자료는 `docs/counseling-categories-research.md`, 가상 인물 이미지 제작 기록은 `docs/counselor-image-prompts.json`에서 확인합니다. 푸터의 사업자 정보는 실제처럼 만든 번호나 주소 없이 `등록 예정`으로 표시했습니다.

### 전체 기능의 임시 검토

`server/share-preview.js`는 이미 빌드된 `dist`와 별도 `.data/shared-preview/preview.db`만 사용하는 임시 공유 진입점입니다. 실제 PG 키를 읽지 않고 항상 모의 결제로 동작하며, 기존 로컬 계정/운영 데이터와 분리됩니다. Vite 소스 서버를 공개하지 않습니다.

Cloudflare Quick Tunnel이 `http://127.0.0.1:4180`을 가리키도록 실행한 뒤, 발급된 정확한 HTTPS 주소를 인자로 `node server/share-preview.js <HTTPS_ORIGIN>`을 실행합니다. 별도 계약 없이 체험하는 용도이며 노트북·공유 서버·터널이 켜져 있는 동안만 접속할 수 있습니다. 종료 시 해당 공유 서버와 터널 프로세스를 종료합니다. 접속 주소와 공유 서버 PID는 Git에서 제외된 `.data/shared-preview/share.json`에 기록됩니다.

# 어른이아 Vercel 배포 · Google 로그인 연결 체크리스트

기준일: 2026-09-22. 저장소의 배포 구성은 **기존 사이트를 루트에 유지하고, 개편안을 `/preview/`에서 읽기 전용으로 제공**하는 방식입니다. 아래 확인 항목은 실제 배포 결과를 검증하기 위한 것이며, 코드 설정만으로 검증 완료를 뜻하지 않습니다.

## 이번 배포 범위

| 항목 | 구성 |
| --- | --- |
| 기존 홈페이지 | `https://arunia.vercel.app/` — 기존 정적 사이트 |
| 새 개편안 | `https://arunia.vercel.app/preview/` — 읽기 전용 디자인 검토 |
| 빌드 명령 / 결과 디렉터리 | `npm run build:review` / `review-dist` |
| 기존 페이지·자산 | `legacy/`의 공개 정적 파일을 결과물 루트에 배치하고 원래 URL 유지 |
| 개편안 결과물 | `review-dist/preview/`에 배치, 이미지·메뉴 경로도 `/preview/` 기준 |
| SPA 라우팅 | `/preview/`의 앱 화면 경로만 `/preview/index.html`로 연결 |
| 검색 차단 | `/preview/`에만 `X-Robots-Tag: noindex, nofollow`와 robots 차단 적용 |
| 서버 API | `ARUNIA_REVIEW_ONLY=true`로 차단 |
| Google 로그인·접수·결제 | 공개 개편안에서 비활성화 |
| 로컬 전체 앱 | 기존 `npm run dev`, `npm run build` 동작 유지 |

`/growth.html`, `/programs.html` 등 기존 페이지와 이미지·스타일·스크립트는 원래 경로를 유지합니다. 이전 `/archive/:path*` 링크는 같은 파일의 루트 주소 `/:path*`로 연결합니다. 기존 사이트의 외부 신청 링크와 안내 콘텐츠를 보존하는 것과 새 상담 앱의 접수를 활성화하는 것은 별개입니다.

공개 개편안은 서버 API를 호출하지 않습니다. `/api` 요청은 DB나 앱을 초기화하기 전에 `503`과 `code: "REVIEW_ONLY"`를 반환합니다. 이 응답은 이번 배포에서 의도된 동작이며, 기존 Vercel 환경 변수에 서버 인증키가 있더라도 로그인·접수·결제를 시작하지 않습니다.

## 1. 공개 배포 확인

- [ ] `arunia.vercel.app`의 실제 Vercel 프로젝트와 연결 저장소·배포 브랜치·프로젝트 루트를 확인합니다.
- [ ] 빌드 명령이 `npm run build:review`, 결과 디렉터리가 `review-dist`인지 확인합니다.
- [ ] 서버의 `ARUNIA_REVIEW_ONLY`가 `true`인지 확인합니다. 이번 배포에는 원격 DB나 Google 비밀키 등록이 필요하지 않습니다.
- [ ] `/`에서 기존 홈페이지가 표시되고 기존 메뉴·이미지·프로그램 상세 주소가 유지되는지 확인합니다.
- [ ] `/preview/`에서 새 화면이 표시되고, 메뉴 이동 후에도 `/preview/` 안에 머무는지 확인합니다.
- [ ] `/preview/counselors/...`, `/preview/counseling/...` 상세 페이지에 직접 접속하거나 새로고침해도 화면이 열리는지 확인합니다.
- [ ] 루트 전체에 SPA rewrite를 적용하지 않았는지 확인합니다. 존재하지 않는 루트 페이지가 새 개편안으로 바뀌어서는 안 됩니다.
- [ ] `/preview/`에만 검색 차단 헤더를 적용하고, 루트 전체를 새로 검색 차단하지 않았는지 확인합니다.
- [ ] `/preview/login`의 Google 버튼과 상담 신청·결제 진입이 실제 계정 생성이나 접수로 이어지지 않는지 확인합니다.
- [ ] `/api/health`·`/api/auth/google/start` 등 API 요청이 읽기 전용 응답으로 차단되는지 확인합니다. 이번 배포에서는 정상 API 응답이나 `googleEnabled=true`를 기대하지 않습니다.
- [ ] 환경 파일·소스·비밀 설정과 존재하지 않는 정적 자산이 공개되지 않는지 확인합니다.

## 2. Google 설정의 현재 상태

| 항목 | 확인한 상태 |
| --- | --- |
| 전용 Google 프로젝트 | `arunia-login-20260922`, 앱 이름 `어른이아`, 웹 클라이언트 `어른이아 웹 로그인` 생성 완료 |
| 기존 프로젝트 | 기존 `we-it-499305` 설정 유지 |
| 등록된 콜백 | 새 클라이언트의 다운로드 설정에서 아래 로컬·Vercel 주소 2개 확인 |
| 로컬 설정 | 로컬 `.env`를 새 전용 클라이언트로 전환 완료 |
| 실제 로그인 검증 | 기존 클라이언트는 로그인·세션 유지·로그아웃 확인. 새 전용 클라이언트의 최종 사용자 확인은 대기 중 |
| Vercel 서버 인증 | 연결하지 않음. 현재 공개 `/preview/`는 정적 검토 화면 |

등록된 콜백은 다음과 같습니다.

- `http://localhost:4173/api/auth/google/callback`
- `https://arunia.vercel.app/api/auth/google/callback`

Google에 Vercel 콜백을 등록했다는 사실만으로 Vercel의 로그인 서버가 활성화되지는 않습니다. 현재 `/preview/`는 화면 경로이며, 등록된 서버 콜백에 `/preview`를 임의로 붙이지 않습니다. 프로젝트·브랜드·권한 설정의 상세 내용은 [Google 로그인 연결 안내](google-login-setup.md)를 참고합니다.

## 3. 후속 작업: 서버 로그인 공개를 준비할 때

아래 항목은 이번 배포에서 실행하지 않는 후속 작업입니다. **현재 빌드 명령만 `npm run build`로 바꾸면 전체 앱이 루트에 생성되어 기존 홈페이지를 교체합니다.** 기존 루트와 `/preview/`를 유지하는 요구가 있는 동안에는 그 방식으로 전환하지 않습니다.

- [ ] 실제 로그인 기능을 어느 경로에서 제공할지 확정하고, 기존 홈페이지를 보존하는 빌드·정적 자산·API 라우팅을 준비합니다.
- [ ] `/preview/`에서 기능을 제공한다면 로그인 시작·성공·오류 후 복귀, 계정·신청 화면 경로까지 해당 접두사에 맞춰 검증합니다. 현재 전체 서버의 `/login`·`/account` 동작을 그대로 공개 루트에 연결하지 않습니다.
- [ ] Node.js 런타임 **22.12 이상**과 Google 인증 라이브러리 등 서버 의존성을 준비합니다.
- [ ] 원격 libSQL/Turso DB와 테이블 생성·읽기·쓰기 권한이 있는 접근 토큰을 준비합니다. 실제 운영 DB와 검토용 DB를 분리합니다.
- [ ] 원격 DB에 사용자·세션·OAuth state·가입 동의 기록이 저장됨을 확인합니다. 검토용 Google 로그인도 이름·이메일을 저장합니다.
- [ ] 아래 환경 변수를 실제 서버 배포 환경에 등록합니다. 로컬 `.env`는 Vercel에 자동으로 전달되지 않습니다.
- [ ] 서버 공개 범위가 준비된 뒤 `ARUNIA_REVIEW_ONLY` 차단 해제와 빌드·라우팅 변경을 함께 검토합니다. 키 등록만으로 차단을 해제하지 않습니다.

| 환경 변수 | 향후 서버 검토에 필요한 값 |
| --- | --- |
| `APP_ORIGIN` | `https://arunia.vercel.app` — 마지막 `/`나 `/preview` 경로 없이 |
| `DATABASE_URL` | 검토용 원격 libSQL/Turso DB 주소 |
| `DATABASE_AUTH_TOKEN` | 해당 DB 접근 토큰 |
| `GOOGLE_CLIENT_ID` | 어른이아 전용 웹 OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | 같은 클라이언트의 비밀키 |
| `APP_DEMO` | `true` |
| `PAYMENT_MODE` | `disabled` |
| `OPERATIONS_READY` | `false` — 실제 운영 정보 확정 전까지 유지 |
| `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` | 미설정 또는 공란 |

서버 비밀에는 `VITE_` 접두사를 붙이지 않고 실제 값을 Git·문서·공개 파일에 기록하지 않습니다. 별도 `SESSION_SECRET`은 현재 구현에서 사용하지 않습니다.

전체 서버는 `NODE_ENV=production`에서 HTTPS `APP_ORIGIN`이나 원격 DB가 없으면 시작하지 않습니다. 파일 SQLite는 운영 DB로 사용할 수 없습니다. 서버가 실제로 연결된 뒤에만 `/api/health`와 `/api/bootstrap`의 `auth.googleEnabled`를 확인합니다. 실제 로그인·새로고침 후 세션 유지·로그아웃·인증 취소·기존 이메일 계정 충돌을 배포 주소에서 검증해야 하며, 로컬 성공이나 자동 테스트로 대신하지 않습니다.

환경 변수를 변경한 뒤에는 해당 배포 환경에 새로 배포해야 합니다. [Vercel 환경 변수 공식 문서](https://vercel.com/docs/environment-variables)

공식 고객 지원 연락처·개인정보처리방침·이용약관 및 Google 브랜드 공개·검증은 별도 준비 항목입니다. 서버 로그인 공개와 실제 상담 접수·결제 시작도 각각 검토합니다.

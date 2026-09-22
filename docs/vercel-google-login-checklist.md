# 어른이아 Vercel · Google 로그인 연결 체크리스트

기준일: 2026-09-22. 먼저 공개 디자인 검토 화면을 배포하고, 이후 서버·Google 로그인 연결을 완료하기 위한 항목입니다. 아래 배포 설정은 저장소에 준비한 상태이며 실제 배포 완료를 뜻하지 않습니다.

## 현재 확인한 상태

| 항목 | 상태 |
| --- | --- |
| Vercel 관리 접근 | 현재 브라우저는 ELIM Hobby 계정이며 ELIM 팀만 표시됩니다. 확인된 프로젝트는 `playnote`뿐이므로 `arunia` 관리 권한은 아직 확보하지 못했습니다. 계정 식별 정보: `elim2`, `elimeo1215-8334`. |
| 새 Google 프로젝트 | `arunia-login-20260922`에 앱 이름 `어른이아`와 새 웹 OAuth 클라이언트 생성 완료. 관련 정책 동의도 완료했습니다. |
| 로컬 Google 로그인 | 로컬 `.env`를 새 프로젝트의 클라이언트 키로 전환했습니다. 기존 `we-it` 클라이언트로는 로그인 검증에 성공했으며, 새 클라이언트로의 사용자 로그인 재검증은 아직 남아 있습니다. |
| 등록된 콜백 URI | 새 클라이언트의 다운로드한 설정 JSON에서 `http://localhost:4173/api/auth/google/callback`과 `https://arunia.vercel.app/api/auth/google/callback` 두 주소를 확인했습니다. |
| Vercel 로그인 연결 | Vercel 환경 변수 등록과 배포는 아직 완료하지 않았습니다. 관리 접근 확보, 원격 DB 준비 및 실제 로그인 검증이 남아 있습니다. |

## 이번 배포: DB 없는 공개 검토 화면

`vercel.json`의 기본값을 `npm run build:review` / `review-dist`로 설정했습니다. 이 빌드는 루트(`/`)에서 가상 공개 콘텐츠로 화면을 표시하며, Google 로그인·회원가입·상담 신청·결제는 비활성화합니다. DB나 Google 키가 없어도 공개 화면을 검토할 수 있습니다.

서버에는 `ARUNIA_REVIEW_ONLY=true`를 명시했습니다. 모든 API 요청은 DB나 앱을 초기화하기 전에 `503`과 `code: "REVIEW_ONLY"`를 반환하므로, 기존 Vercel 환경 변수에 서버 키가 있어도 접수를 시작하지 않습니다. 이 응답은 공개 검토 배포의 의도된 동작이며, 화면은 API를 호출하지 않습니다.

정적 `robots.txt`는 `Disallow: /`를 반환하고, Vercel의 모든 경로에 `X-Robots-Tag: noindex, nofollow`를 설정합니다. 기존 `legacy/`의 HTML·CSS·JS·이미지·폰트는 `review-dist/archive/`에 함께 복사하며 숨김 파일·설정 파일·이전 robots 및 sitemap은 포함하지 않습니다. `/growth.html`, `/growth_1.html`, `/growth_2.html`, `/growth_4.html`, `/leadership1.html`, `/programs.html`은 각각 같은 이름의 `/archive/` 페이지로 임시 리디렉션합니다. 기존 프로그램·공모전 안내와 외부 신청 링크의 접근 경로를 보존하는 목적이며, 새 상담 앱의 접수 기능과는 별개입니다. 로컬 `npm run dev`와 전체 앱 `npm run build` 명령은 그대로 유지합니다.

## 1. 연결할 Vercel 프로젝트 확보

- [ ] `arunia.vercel.app`을 소유한 Vercel 계정·팀에서 해당 프로젝트를 열 수 있는지 확인합니다.
- [ ] 프로젝트 설정과 환경 변수를 관리하고 배포할 수 있는 권한을 확보합니다.
- [ ] 연결된 GitHub 저장소·배포 브랜치·프로젝트 루트가 실제 어른이아 앱을 가리키는지 확인합니다. 현재 확인된 다른 프로젝트 `playnote`에 어른이아 설정을 넣지 않습니다.

## 2. 이후 로그인 연결: 서버 빌드와 원격 DB 준비

- [ ] Node.js 런타임을 **22.12 이상**으로 설정합니다. 프로젝트의 `engines`는 `>=22.12.0`이고, 현재 설치된 `google-auth-library@11.1.0`도 Node `>=22`를 요구합니다.
- [ ] 아래 전환 항목에 따라 빌드 명령 `npm run build`, 결과 디렉터리 `dist`, API 진입점 `api/index.js`인 전체 앱으로 전환합니다. 현재 API rewrite와 함수 제한 시간 60초는 유지되어 있습니다.
- [ ] 신규 `server/google-auth.js`, `shared/counseling-categories.json` 및 의존성 변경을 포함한 서버 소스가 배포 대상에 들어가는지 확인합니다.
- [ ] 검토용 **원격 libSQL/Turso DB**와 접근 토큰을 준비합니다. 토큰은 테이블 생성과 데이터 읽기·쓰기가 가능해야 합니다.
- [ ] 실제 운영 DB와 검토용 DB를 분리합니다. 사용자, 세션, OAuth state와 가입 동의 기록은 이 DB에 저장됩니다. 실제 Google 로그인은 검토 모드에서도 이름·이메일을 저장합니다.

`npm run build:review`로 만든 현재 루트 정적 검토 페이지는 서버 API를 호출하지 않고 Google 로그인도 비활성화합니다. 키를 추가하는 것만으로는 로그인 기능이 생기지 않습니다.

현재 서버는 `NODE_ENV=production`에서 HTTPS `APP_ORIGIN` 또는 원격 `DATABASE_URL`이 없거나 DB 주소가 `file:`이면 시작을 거부합니다. API 진입점은 이때 503을 반환하므로 로컬 SQLite 파일이나 임시 파일 DB로 대신할 수 없습니다. 서버 시작 시 필요한 테이블을 자동 생성합니다.

원격 DB와 서버 환경 변수 준비 후, 전체 앱 배포로 전환할 때 필요한 설정 변경은 다음과 같습니다. 설정 실패 시 정적 검토 화면으로 자동 전환하는 동작은 없습니다.

1. `vercel.json`의 `buildCommand`를 `npm run build`, `outputDirectory`를 `dist`로 바꿉니다.
2. `vercel.json`의 `env.ARUNIA_REVIEW_ONLY`를 `"false"`로 바꿉니다. Vercel 프로젝트 환경에도 같은 변수가 등록되어 있다면 해당 배포 환경의 값을 함께 `false`로 맞춥니다.
3. `vercel.json`의 `rewrites` 첫 항목에 `{ "source": "/robots.txt", "destination": "/api/robots" }`를 복원합니다. 전체 앱은 검토 여부에 따라 서버에서 robots 응답을 제공합니다.
4. 로그인 기능 검토 중에는 전체 경로의 `X-Robots-Tag: noindex, nofollow` 헤더를 유지합니다. 실제 운영 정보가 확정되고 정식 검색 노출을 시작할 때만 해당 전역 헤더를 제거합니다. `APP_DEMO=true`인 동안 앱의 검색 차단은 계속 유지됩니다.
5. 아래 환경 변수를 적용하고 새로 배포해 검증합니다. 원격 DB·Origin·Google 설정을 빠뜨리면 API는 오류를 반환하며 로그인은 열리지 않습니다.

현재 `/archive/` 복사는 `build:review`에 포함됩니다. 전체 앱으로 전환할 때도 기존 URL을 유지하려면 동일한 정적 아카이브를 `dist/archive/`에 복사하는 빌드 단계를 함께 마련하고 임시 리디렉션을 유지해야 합니다. 출력물 없이 리디렉션만 남기지 않습니다.

## 3. Google 클라이언트와 Vercel 환경 변수 등록

- [x] 새 프로젝트에서 앱 이름 `어른이아`와 **웹 애플리케이션 OAuth 클라이언트**를 생성하고 관련 정책 동의를 완료했습니다.
- [x] 새 클라이언트에 `https://arunia.vercel.app/api/auth/google/callback`과 `http://localhost:4173/api/auth/google/callback`이 등록된 것을 다운로드한 설정 JSON으로 확인했습니다.
- [x] 로컬 `.env`를 새 프로젝트의 클라이언트 키로 전환했습니다.
- [ ] 새 클라이언트로 로컬 Google 로그인을 다시 검증합니다. 기존 클라이언트의 성공 결과와 구분합니다.
- [ ] 아래 값을 실제 배포할 Vercel 환경에 등록합니다. 로컬 `.env`는 자동으로 Vercel에 전달되지 않습니다.

| 환경 변수 | 검토 단계 값 또는 준비할 값 |
| --- | --- |
| `APP_ORIGIN` | `https://arunia.vercel.app` — 마지막 `/`나 추가 경로 없이 |
| `DATABASE_URL` | 검토용 원격 libSQL/Turso DB 주소 |
| `DATABASE_AUTH_TOKEN` | 해당 DB의 접근 토큰 |
| `GOOGLE_CLIENT_ID` | 연결할 어른이아 웹 OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | 같은 클라이언트의 비밀키 |
| `APP_DEMO` | `true` |
| `PAYMENT_MODE` | `disabled` 또는 모의 결제까지 검토할 때 `mock` |
| `OPERATIONS_READY` | `false` — 사업 정보·정책·실제 운영 정보가 확정될 때까지 유지 |
| `TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY` | 검토 단계에서는 미설정 또는 공란 |

`DATABASE_AUTH_TOKEN`과 `GOOGLE_CLIENT_SECRET`은 서버 비밀 설정에만 보관하며 `VITE_` 접두사를 붙이지 않습니다. 실제 값은 Git·문서·공개 파일에 기록하지 않습니다. 별도 `SESSION_SECRET`은 현재 구현에서 사용하지 않습니다.

Vercel의 Production/Preview 배포 환경과 앱의 검토 모드는 서로 다릅니다. 배포된 Node 서버는 production 조건을 충족해야 하지만, 서비스 검토는 `APP_DEMO=true`로 유지할 수 있습니다. 현재 Google 버튼은 키가 있고 `APP_DEMO=true` 또는 `OPERATIONS_READY=true`이면 활성화됩니다. 검토 로그인만을 위해 `OPERATIONS_READY`를 켤 필요는 없습니다.

## 4. 새 배포에서 확인

- [ ] 환경 변수 적용 대상을 선택한 뒤 새로 배포합니다. 환경 변수 변경은 이전 배포에 소급 적용되지 않습니다. [Vercel 환경 변수 공식 문서](https://vercel.com/docs/environment-variables)
- [ ] 공유할 실제 주소와 `APP_ORIGIN`, Google의 등록 콜백 URI가 일치하는지 확인합니다. 위 설정으로는 `arunia.vercel.app`에서 로그인해야 하며, 다른 자동 Preview 주소의 POST 요청은 Origin 검사에서 거부될 수 있습니다.
- [ ] `/api/health`가 정상 응답하고 `/api/bootstrap`의 `auth.googleEnabled`가 `true`인지 확인합니다.
- [ ] `/login`에서 Google 계정 선택 → 어른이아 콜백 → 계정 화면 이동을 확인합니다.
- [ ] 새로고침 후 로그인 유지, 로그아웃 후 재로그인, Google 화면에서 취소했을 때 안내를 확인합니다.
- [ ] Google 전용 계정의 이메일과 같은 기존 로컬 회원이 있으면 자동 연결하지 않는 현재 동작을 확인합니다. 이 경우 기존 로그인 방식을 사용해야 합니다.

세션 쿠키와 OAuth state 쿠키는 현재 구현에서 `HttpOnly`, `SameSite=Lax`, HTTPS `Secure`를 사용합니다. 세션과 일회성 OAuth state가 원격 DB에 저장되어 여러 Vercel 함수 인스턴스에서도 이어져야 합니다. 로컬 로그인 성공과 자동 테스트 통과는 이 배포 검증을 대신하지 않습니다.

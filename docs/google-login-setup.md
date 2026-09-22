# 어른이아 Google 로그인 연결

확인일: 2026-09-22. 서버가 Google 인증을 처리하는 웹 로그인 기준입니다. 디자인 검토용 정적 사이트에는 로그인 화면만 제공하며, 실제 로그인에는 서버·DB·OAuth 설정이 모두 필요합니다.

## 현재 연결 상태

2026-09-22, 사용자 승인에 따라 **어른이아 전용 Google Cloud 프로젝트 `arunia-login-20260922`를 생성하고 OAuth 키 발급과 로컬 서버 전환을 완료했습니다.** 앱 표시 이름은 `어른이아`, 웹 클라이언트 관리 이름은 `어른이아 웹 로그인`이며, Google 콘솔의 지원·개발자 연락 이메일은 `hwajeongup@gmail.com`으로 설정했습니다. 기존 `we-it-499305` 프로젝트의 설정은 유지했습니다.

새 클라이언트의 다운로드 설정에서 아래 두 콜백 등록을 확인했습니다.

- `http://localhost:4173/api/auth/google/callback`
- `https://arunia.vercel.app/api/auth/google/callback`

기존 프로젝트의 클라이언트로는 실제 로그인·새로고침 후 세션 유지·로그아웃을 확인했습니다. **새 전용 클라이언트로의 최종 사용자 로그인 확인은 대기 중**이며, 이전 검증 결과를 새 클라이언트의 성공으로 간주하지 않습니다. Vercel에는 아직 배포하지 않았고, 정적 공유 링크도 로그인 서버와 연결하지 않았습니다.

현재 Google 콘솔의 연락 이메일 설정과 별도로, 운영 공개 전에는 공식 고객 지원 연락처와 개인정보처리방침·이용약관을 확정해야 합니다. Google의 브랜드 공개·검증도 별도 단계이며, 키 발급이나 로컬 전환만으로 완료되지 않습니다.

## 기존 Google Cloud 프로젝트를 함께 써도 되나요?

기존 프로젝트를 사용할 수 있습니다. 다만 **어른이아 전용 웹 OAuth 클라이언트**를 추가하는 구성을 권장합니다. 기존 서비스의 클라이언트 ID·비밀키·리디렉션 주소를 바꾸거나 삭제할 필요는 없습니다.

클라이언트를 나눠도 Google 동의 화면의 **브랜드와 이용 대상 설정은 프로젝트 단위**입니다. 어른이아용 클라이언트를 만들었다고 어른이아 이름·로고가 따로 표시되지는 않습니다. 같은 프로젝트의 사용자 동의도 서로 관련될 수 있습니다. [Google의 프로젝트·클라이언트 설명](https://developers.google.com/identity/protocols/oauth2/cross-client-identity)

| 기존 서비스와의 관계                                   | 권장 구성                                        |
| ------------------------------------------------------ | ------------------------------------------------ |
| 동일한 운영 브랜드·로그인 체계·개인정보처리방침을 공유 | 기존 프로젝트에 어른이아 전용 웹 클라이언트 추가 |
| 다른 브랜드이며 로그인 체계·개인정보처리방침도 별도    | 어른이아용 Google Cloud 프로젝트 분리            |

이는 Google의 여러 앱·클라이언트 구성 지침에 따른 권장안입니다. 기존 프로젝트를 함께 쓸 때는 현재 앱 이름·로고·공개 상태를 임의로 바꾸지 않습니다. [Google 공식 프로젝트 구성 안내](https://developers.googleblog.com/get-smart-about-preparing-your-app-for-oauth-verification/)

## 1. 웹 OAuth 클라이언트 만들기

1. [Google Cloud Console](https://console.cloud.google.com/)에서 사용할 프로젝트를 선택합니다.
2. **Google Auth Platform → Clients → Create client**로 이동합니다.
3. Application type을 **Web application**으로 선택합니다.
4. 관리용 이름을 `어른이아 웹 로그인`으로 입력합니다. 이 이름은 동의 화면의 앱 이름과 다릅니다.
5. **Authorized redirect URIs**에 실제 실행 환경에 해당하는 주소를 추가합니다.

| 실행 환경        | 서버의 `APP_ORIGIN`         | 등록할 리디렉션 URI                                  |
| ---------------- | --------------------------- | ---------------------------------------------------- |
| 로컬 개발        | `http://localhost:4173`     | `http://localhost:4173/api/auth/google/callback`     |
| 향후 Vercel 운영 | `https://arunia.vercel.app` | `https://arunia.vercel.app/api/auth/google/callback` |
| 별도 도메인 운영 | 실제 HTTPS 원본 주소        | 해당 주소 + `/api/auth/google/callback`              |

등록 주소와 서버가 사용하는 주소는 프로토콜·호스트·포트·경로·마지막 `/`까지 일치해야 합니다. `localhost`와 `127.0.0.1`도 서로 다릅니다. 운영 주소는 HTTPS를 사용하고, 로컬 개발에는 HTTP localhost 예외를 사용할 수 있습니다. 위 Vercel 주소는 앞으로 해당 서버를 배포할 경우의 예시이며 현재 연결이 완료되었다는 뜻은 아닙니다. [Google 웹 서버 OAuth 가이드](https://developers.google.com/identity/protocols/oauth2/web-server)

현재 구현은 서버 리디렉션 방식이므로 **Authorized JavaScript origins**는 이 로그인 기능만을 위해 추가할 필요가 없습니다. 기존 다른 서비스의 설정은 유지합니다. [OAuth 클라이언트 관리](https://support.google.com/cloud/answer/15549257)

6. 생성한 Client ID와 Client Secret을 서버의 비밀 설정에 보관합니다. 새 비밀키는 생성 시에만 전체 값을 확인할 수 있으므로 그때 안전하게 보관합니다. 기존 서비스의 비밀키가 보이지 않는다는 이유로 기존 키를 폐기하지 마세요. [Google 비밀키 관리 안내](https://support.google.com/cloud/answer/15549257)

## 2. 어른이아 서버에 등록하기

로컬에서는 Git에서 제외되는 `.env`에 등록합니다. 실제 값은 채팅이나 코드에 붙여넣지 않습니다.

```dotenv
APP_ORIGIN=http://localhost:4173
GOOGLE_CLIENT_ID=발급받은_웹_클라이언트_ID
GOOGLE_CLIENT_SECRET=발급받은_클라이언트_비밀키
```

환경 변수를 저장한 뒤 서버를 다시 시작합니다. Vercel에서는 해당 프로젝트의 환경 변수에 동일한 이름으로 등록하고, 배포 환경에 맞게 `APP_ORIGIN`을 바꾼 뒤 재배포합니다. OAuth 값은 서버용으로만 사용하며 `VITE_` 접두사를 붙이지 않습니다. `.env`·다운로드한 인증 JSON·비밀키를 `public/` 또는 GitHub에 올리지 않습니다. [Google 자격증명 보관 안내](https://developers.google.com/identity/protocols/oauth2/web-server)

`npm run build:review`로 만든 정적 검토 사이트와 현재 임시 Cloudflare 검토 링크에는 API·DB가 없습니다. 거기에 키를 넣어도 로그인은 활성화되지 않습니다. 실제 계정으로 확인할 때는 전체 서버에서 `/login`을 열어야 합니다.

## 3. 이용 대상과 공개 설정 확인하기

서울·경기 일반 이용자를 받을 서비스는 **External** 대상이 필요합니다. **Internal**은 프로젝트가 속한 Google Cloud 조직의 구성원으로 사용을 제한하므로 개인 Gmail 계정 등의 접근이 거부될 수 있습니다. 기존 프로젝트가 Internal이라면 다른 서비스의 정책을 먼저 확인하고, 필요하면 별도 프로젝트를 사용합니다. [Google Audience 안내](https://support.google.com/cloud/answer/15549945)

이 로그인은 `openid email profile` 범위만 요청합니다. Gmail·Drive·연락처·캘린더 권한은 필요하지 않습니다. [OpenID Connect 범위 설명](https://developers.google.com/identity/openid-connect/openid-connect)

일반적인 Testing 상태에는 테스트 사용자 최대 100명과 7일 승인 만료 규칙이 있지만, 위 기본 로그인 정보만 요청하면 공식 예외가 적용됩니다. 이 경우 테스트 사용자 등록·경고·7일 만료가 요구되지 않습니다. 다른 OAuth 범위를 추가하면 예외가 사라질 수 있고, 조직의 계정 정책은 별도로 적용됩니다. 따라서 로그인만 확인하려고 기존 프로젝트를 임의로 Testing이나 In production으로 변경하지 않습니다. [Testing 예외 및 제한](https://support.google.com/cloud/answer/15549945)

## 4. 동의 화면과 개인정보 안내

Google Auth Platform의 **Branding**에서 표시 이름·지원 이메일·홈페이지·개인정보처리방침·이용약관·승인된 도메인을 확인합니다. 운영 시에는 등록 예정 문구가 아닌 실제 연락처와 확정된 정책을 연결해야 합니다. 개인정보처리방침에는 Google에서 받은 정보를 어떤 목적으로 이용·보관·삭제하는지 실제 구현에 맞춰 기재합니다. [Google Branding 요구사항](https://support.google.com/cloud/answer/15549049)

기본 로그인 범위만 사용한다는 사실과 앱명·로고의 브랜드 검증은 별개입니다. 동의 화면에서 앱 이름·로고를 표시하려면 Google의 브랜드 검증이 필요할 수 있습니다. 기존 프로젝트의 Branding을 수정·게시하면 기존 서비스의 표시에도 영향을 줄 수 있으므로 현재 설정을 보존하고 적용 범위를 확인합니다. [브랜드 표시와 검증](https://support.google.com/cloud/answer/15549049)

## 연결 후 확인

1. 전체 서버의 `/login`에서 **Google로 계속하기**를 누릅니다.
2. Google 계정 선택 화면에서 예상한 서비스 이름 또는 도메인이 표시되는지 확인합니다.
3. 인증 후 어른이아로 돌아오고 새로고침해도 로그인 상태가 유지되는지 확인합니다.
4. 로그아웃 후 재로그인, Google에서 취소했을 때의 안내도 확인합니다.
5. `redirect_uri_mismatch` 오류가 나오면 위 URI 표와 실제 `APP_ORIGIN`부터 비교합니다.

자동 테스트는 실제 Google 계정으로의 로그인 완료를 대신하지 않습니다. 비밀 설정과 등록 URI가 없는 상태에서는 연결 대기 상태로 두며, Google 로그인 성공으로 표시하지 않습니다.

## Google 버튼 자산

`public/images/google-g.png`는 [Google 공식 브랜딩 페이지](https://developers.google.com/identity/branding-guidelines)의 [G 아이콘 원본](https://developers.google.com/static/identity/images/g-logo.png)을 2026-09-22에 내려받은 파일입니다. AI로 만들거나 형태·색상을 변경하지 않았습니다. 로그인 버튼 식별용으로만 사용하며 Google과의 제휴 표시가 아닙니다.

흰색 버튼, `#747775` 테두리, `#1F1F1F` 글자와 공식 G 아이콘을 사용합니다. 버튼 문구는 한국어로 번역할 수 있습니다. 원본은 200×204px이므로 고정 크기 박스 안에 `object-fit: contain`을 적용해 비율을 보존합니다. 폰트·여백·아이콘 배치는 [Google 로그인 버튼 지침](https://developers.google.com/identity/branding-guidelines)을 따릅니다.

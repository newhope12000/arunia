# 감자 직무 궁합 랜딩페이지 · 2026-10-22

사용자가 제공한 `WEEKMATE_source (2).zip`을 기존 공식 도메인에 추가한다. 원본의 손글씨 폰트·감자 캐릭터·7문항·4가지 성향·배점·결과 설명을 보존한다.

| 단계 | 공식 경로 | 소스 |
|---|---|---|
| 7문항 테스트·결과 | `/gamja` | `legacy/gamja/index.html`, `quiz-data.js`, `app.js` |
| 직무분석지 소개 | `/gamja/report` | `legacy/gamja/report/index.html` |
| 신청·완료 | `/gamja/apply` | `legacy/gamja/apply/index.html`, `app.js` |

소개와 신청 항목·동의·완료 문구는 기존 WEEKMATE 직접 신청 페이지를 재사용한다. 기존 홈페이지·프로그램 목록·메뉴는 변경하지 않는다. 페이지와 자산은 기존 정적 빌드가 복사하며, 확장자 없는 공식 경로와 canonical을 제공한다. `src=gamja`와 기존 UTM·광고 클릭 매개변수를 단계 간 전달한다.

테스트 화면만 첨부 원본의 손글씨 폰트를 사용하고, 소개·신청 화면에는 공식 공통 Pretendard 스타일을 적용한다. 폰트 검증도 이 단일 예외를 구분한다.

## 신청 저장·알림 계약

```text
/gamja/apply
  → https://applications-collection.vercel.app/api/gamja-apply/
  → 기존 인증된 Google Apps Script Career_Report_10C 분기
  → DB (43.6월~)의 직무 C 통합 탭
  → 신규 저장 완료 후 기존 Telegram 알림
```

사용자가 지정한 스프레드시트 ID는 `1G-IBxVkvSFvtmOoUjliQBqbL5yYFgVSU6DEK1QeUNeE`, 대상 탭 ID는 `1671274717`이다. 현재 탭의 헤더를 직접 확인했고 기존 논리 ID `Career_Report_10C`와 동의 버전 `jm10c-v1`을 재사용한다. 기존 서버 고정 시안값은 `10월 직무C`이며 감자 유입은 `/gamja/apply` Page URL·`src=gamja`·UTM으로 구분한다. 별도 탭·봇·수신 대상을 생성하거나 변경하지 않는다.

- 이름·연락처·출생연도·거주지·현재 상태·고민·안내 가능 시간·선택 컨설팅·동의 및 유입 정보를 기존 계약대로 제출한다. 봇 토큰과 웹훅 비밀값은 프런트엔드에 포함하지 않는다.
- 퀴즈 답변·점수는 전송하거나 저장하지 않는다. 감자 폼은 이전 6유형의 브라우저 저장값을 읽지 않으며, 서버는 `resultType: ""`만 허용해 다른 유형이 신청 기록에 섞이지 않게 한다.
- 준비 확인 GET이 `{ok:true,ready:true}`를 반환한 뒤 입력을 활성화한다. 제출 성공은 응답의 동일 제출 ID·`ok:true`·boolean `duplicate`를 모두 확인한 뒤 표시한다.
- 응답 불확실·시간 초과·네트워크 실패는 완료로 표시하지 않고 같은 제출 ID와 본문으로 재확인한다. 같은 ID 재요청은 기존 저장·알림 중복 방지를 재사용한다.
- 중앙 API는 공식 `https://www.arunia.co.kr`, `https://arunia.co.kr`와 동일 출처만 허용한다. 기존 jm10c API의 출처·신청 계약은 유지한다.

중앙 저장소는 `hwajeongup-hj/applications-collection`이며, 공용 `lib/career10c-handler.js`를 기존 API와 감자 API가 사용한다. 운영 Apps Script는 Git 사본보다 최신이므로 이번 작업에서는 운영 스크립트나 그 사본을 수정하지 않는다.

## 검증

폼의 준비 확인·성공 응답 검증·이전 유형 배제·중복 클릭·같은 본문 재확인·검증 오류 수정·409 충돌·불확실한 접수 상태를 모의 검증한다. 중앙 API의 공식 출처·OPTIONS·임의 결과 거절·인증된 기존 저장 경로·중복·충돌·안전한 Google 리다이렉트·비밀값 비노출도 검증한다. 최종 빌드와 공개 경로·운영 준비 상태 및 실제 연결 확인 결과는 배포 뒤 기록한다.

공식 사이트의 전체 자동 테스트 90개와 `npm run build:review`, 중앙 서버의 전체 `npm test`·`npm run build:vercel`, 양쪽 `git diff --check`가 통과했다. 원본 퀴즈의 16,384개 답변 조합에서 총점 21·축별 범위 0~14·동점 처리를 확인했고, 선택 잠금·이전 답변·재시작·UTM 전달을 모의 확인했다. 3개 화면의 정적 빌드·canonical·자산과 인라인 JavaScript 문법도 확인했다.

## 운영 연결 확인 · 2026-10-22 22:39 KST

- 중앙 API `f03f025`와 공식 사이트 `e68c776`의 Vercel 자동 배포가 성공했다. 공개 `/gamja`, `/gamja/report`, `/gamja/apply`가 모두 HTTP 200이며 검증한 정적 빌드와 정확히 일치했다.
- 감자 API GET은 공식 Origin에서 HTTP 200·`verify.ready`, `{ok:true,ready:true}`다. 공식 www·루트 출처의 OPTIONS는 204, 유사 도메인은 400으로 거절했다.
- 실제 개인정보가 없는 `[연동테스트] 감자 실제신청아님` 가상 신청 1건을 새 프런트엔드 처리 코드로 운영 API에 제출했다. HTTP 200·`duplicate:false`·동일 제출 ID 확인 뒤 완료 상태로 바뀌었다.
- 지정 스프레드시트의 `직무 C 통합` 탭에서 해당 제출 ID가 정확히 1건 검색됐다. 감자 Page URL·UTM·동의 저장과 결과 유형·설문 결과의 빈 값을 확인했다. 같은 본문 재전송은 `duplicate:true`였으며 신규 행을 만들지 않았다.
- 확인을 마친 테스트 행의 값만 비웠고, 기존 신청 행·헤더·서식·시트 구조는 변경하지 않았다.
- Telegram은 기존 저장 후 알림 분기를 재사용한다. 대화방 수신 화면과 현재 봇의 전송 응답을 읽을 수 없어 실제 메시지 수신은 직접 검증하지 못했다. 사이트 역시 브라우저 조작 도구에 연결할 수 없어 수동 시각 검수 대신 원본 보존·DOM 모의·공개 HTML·자산 검증을 수행했다.

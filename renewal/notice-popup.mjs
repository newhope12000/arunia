export const WINNERS_NOTICE_URL = "/notices/mandu-contest-winners";

export function renderNoticePopup() {
  return `<dialog class="notice-popup" data-notice-popup aria-labelledby="notice-popup-title" aria-describedby="notice-popup-description">
    <a class="notice-popup-card" href="${WINNERS_NOTICE_URL}">
      <p class="notice-popup-eyebrow">공모전 결과 안내</p>
      <h2 id="notice-popup-title">제1회 ‘그만둘만두’ 공모전<br>최종 당선자 발표</h2>
      <p id="notice-popup-description">참여해 주신 모든 분께 감사드립니다.<br>최종 당선자와 안내 사항을 공지에서 확인해 주세요.</p>
      <span class="notice-popup-link">결과 공지 확인하기 <span aria-hidden="true">→</span></span>
    </a>
    <div class="notice-popup-actions">
      <button type="button" data-notice-popup-today>오늘 하루 보지 않기</button>
      <button type="button" data-notice-popup-close autofocus>닫기</button>
    </div>
  </dialog>`;
}

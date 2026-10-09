export const WINNERS_NOTICE_URL = "/notices/hunmin-acrostic-winners";

export function renderNoticePopup() {
  return `<dialog class="notice-popup" data-notice-popup aria-labelledby="notice-popup-title" aria-describedby="notice-popup-description">
    <a class="notice-popup-card" href="${WINNERS_NOTICE_URL}">
      <p class="notice-popup-eyebrow">2026 한글날 기념</p>
      <h2 id="notice-popup-title">제1회 훈민정음 4행시 공모전<br>최종 당선자 발표</h2>
      <p id="notice-popup-description">수석 2명 · 차석 10명 · 장려상 30명<br>최종 당선자와 안내 사항을 공지에서 확인해 주세요.</p>
      <span class="notice-popup-link">결과 공지 확인하기 <span aria-hidden="true">→</span></span>
    </a>
    <div class="notice-popup-actions">
      <button type="button" data-notice-popup-today>오늘 하루 보지 않기</button>
      <button type="button" data-notice-popup-close autofocus>닫기</button>
    </div>
  </dialog>`;
}

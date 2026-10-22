(() => {
  'use strict';

  const form = document.getElementById('applyForm');
  const fields = document.getElementById('applicationFields');
  const status = document.getElementById('formStatus');
  const button = document.querySelector('.submit');
  const readinessRetry = document.getElementById('readinessRetry');
  const endpoint = 'https://applications-collection.vercel.app/api/gamja-apply/';
  const openedAt = Date.now();
  let ready = false;
  let checking = false;
  let submitting = false;
  let completed = false;
  let terminalConflict = false;
  // An uncertain submission stays in page memory with the same ID and body.
  // Quiz answers and results are intentionally never read or submitted here.
  let pendingPayload = null;

  function updateControls() {
    fields.disabled = !ready || checking || submitting || !!pendingPayload || completed || terminalConflict;
    button.disabled = !ready || checking || submitting || completed || terminalConflict;
    button.textContent = submitting ? '신청을 확인하고 있어요…'
      : terminalConflict ? '이미 접수된 신청입니다'
      : pendingPayload ? '접수 확인 다시하기'
      : '선착순 직무분석지 신청하기';
    readinessRetry.hidden = ready || checking;
    readinessRetry.disabled = checking;
    form.setAttribute('aria-busy', String(checking || submitting));
  }

  async function checkReadiness() {
    if (checking || submitting || pendingPayload || completed) return;
    checking = true;
    ready = false;
    status.textContent = '신청 연결 상태를 확인하고 있어요…';
    updateControls();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(endpoint, { method: 'GET', cache: 'no-store', signal: controller.signal });
      const result = await response.json();
      if (!response.ok || !result || result.ok !== true || result.ready !== true) throw new Error('unavailable');
      ready = true;
      status.textContent = '';
    } catch {
      status.textContent = '신청 연결을 확인하지 못했어요. 아래 버튼으로 다시 확인해주세요.';
    } finally {
      clearTimeout(timeout);
      checking = false;
      updateControls();
    }
  }

  const value = id => document.getElementById(id).value.trim();
  function applicationPayload() {
    const age = value('f-age');
    const job = value('f-job');
    const callTime = document.querySelector('input[name="calling"]:checked')?.value;
    if (!value('f-name')) throw new Error('이름을 입력해주세요 :)');
    if (!/^\d{9,12}$/.test(value('f-phone').replace(/\D/g, ''))) throw new Error('연락처를 확인해주세요 :)');
    if (!/^\d{4}$/.test(age)) throw new Error('출생연도 4자리를 입력해주세요 :)');
    if (!value('f-location')) throw new Error('거주지를 입력해주세요 :)');
    if (!['university_1_2', 'university_3_4', 'jobseeker', 'employee', 'freelancer'].includes(job)) throw new Error('현재 상태를 선택해주세요 :)');
    if (!value('f-concern')) throw new Error('지금 나의 고민을 입력해주세요 :)');
    if (!['morning', 'afternoon', 'evening'].includes(callTime)) throw new Error('안내 가능 시간을 선택해주세요 :)');
    if (!document.getElementById('f-privacy').checked) throw new Error('개인정보 수집·이용에 동의해주세요 :)');
    const params = new URLSearchParams(location.search);
    return {
      sheetTab: 'Career_Report_10C',
      submissionId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2, 11),
      name: value('f-name'), phone: value('f-phone'), age, address: value('f-location'), job, concern: value('f-concern'),
      callTime, consultingOptIn: document.getElementById('f-consulting').checked,
      resultType: '',
      consentAccepted: '동의', consentVersion: 'jm10c-v1', consentedAt: new Date().toISOString(),
      elapsedMs: Date.now() - openedAt, website: value('website'), pageUrl: location.href,
      utmSource: params.get('utm_source') || '', utmMedium: params.get('utm_medium') || '',
      utmCampaign: params.get('utm_campaign') || '', utmContent: params.get('utm_content') || '', utmTerm: params.get('utm_term') || '',
      userAgent: navigator.userAgent, referrer: document.referrer || '',
    };
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!ready || checking || submitting || terminalConflict || completed) return;
    try {
      if (!pendingPayload) pendingPayload = applicationPayload();
    } catch (error) {
      status.textContent = error.message;
      return;
    }
    submitting = true;
    status.textContent = '';
    updateControls();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingPayload), signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || !result || result.ok !== true || result.pending || result.submissionId !== pendingPayload.submissionId || typeof result.duplicate !== 'boolean') {
        const error = new Error(result?.error || '신청 저장을 확인하지 못했어요. 같은 내용으로 다시 확인해주세요.');
        error.canEdit = (response.status === 400 || response.status === 413) && result?.pending !== true;
        error.conflict = response.status === 409 && result?.code === 'SUBMISSION_CONFLICT';
        throw error;
      }
      completed = true;
      pendingPayload = null;
      document.getElementById('applyView').classList.add('hidden');
      const completion = document.getElementById('completionView');
      completion.classList.remove('hidden');
      completion.focus();
      status.textContent = '신청이 완료되었습니다.';
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch (error) {
      if (error.canEdit) pendingPayload = null;
      terminalConflict = !!error.conflict;
      status.textContent = (error.canEdit || terminalConflict) ? error.message
        : '신청 저장을 확인하지 못했어요. 아래 버튼으로 같은 신청의 접수 여부를 다시 확인해주세요.';
    } finally {
      clearTimeout(timeout);
      submitting = false;
      updateControls();
    }
  });

  readinessRetry.addEventListener('click', checkReadiness);
  checkReadiness();
})();

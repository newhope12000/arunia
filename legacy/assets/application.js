(() => {
  'use strict';

  const form = document.getElementById('applicationForm');
  const fields = document.getElementById('applicationFields');
  const notice = document.getElementById('applicationNotice');
  const retry = document.getElementById('applicationRetry');
  const submit = document.getElementById('applicationSubmit');
  const year = document.getElementById('birthYear');
  const month = document.getElementById('birthMonth');
  const day = document.getElementById('birthDay');
  const birth = document.getElementById('birth');
  const concerns = Array.from(document.querySelectorAll('input[name="concern"]'));
  if (!form || !fields || !notice || !retry || !submit || !year || !month || !day || !birth || concerns.length === 0) return;

  const endpoint = 'https://applications-collection.vercel.app/api/arunia-apply/';
  const openedAt = performance.now();
  let state = 'checking';
  // An uncertain request is retried with the exact same ID and serialized body.
  // This object lives only in this page's memory and is never persisted locally.
  let pending = null;

  function setState(next, message, focus = false) {
    state = next;
    fields.disabled = next !== 'ready';
    form.setAttribute('aria-busy', String(next === 'checking' || next === 'sending'));
    notice.dataset.state = next;
    notice.textContent = message;
    retry.hidden = next !== 'unavailable' && next !== 'pending';
    retry.textContent = next === 'pending' ? '접수 확인 다시 하기' : '신청 접수 다시 확인하기';
    submit.textContent = next === 'sending' ? '접수 확인 중…' : '지원서 제출하기 ↗';
    if (focus) notice.focus({ preventScroll: true });
  }

  function addOption(select, value, label) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    select.appendChild(option);
  }

  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= 1980; y -= 1) addOption(year, String(y), String(y));
  for (let m = 1; m <= 12; m += 1) {
    const value = String(m).padStart(2, '0');
    addOption(month, value, value);
  }

  function syncBirth() {
    birth.value = year.value && month.value && day.value ? `${year.value}-${month.value}-${day.value}` : '';
    const today = new Date();
    const todayValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    day.setCustomValidity(birth.value && birth.value > todayValue ? '생년월일을 다시 확인해 주세요.' : '');
  }

  function fillDays() {
    const previous = day.value;
    day.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'DD';
    placeholder.disabled = true;
    placeholder.selected = true;
    day.appendChild(placeholder);
    const y = Number(year.value);
    const m = Number(month.value);
    const count = y && m ? new Date(y, m, 0).getDate() : 31;
    for (let d = 1; d <= count; d += 1) {
      const value = String(d).padStart(2, '0');
      addOption(day, value, value);
    }
    if (previous && Number(previous) <= count) day.value = previous;
    syncBirth();
  }

  function validateConcerns() {
    const checked = concerns.some(input => input.checked);
    concerns[0].setCustomValidity(checked ? '' : '고민사항을 한 가지 이상 선택해 주세요.');
    return checked;
  }

  year.addEventListener('change', fillDays);
  month.addEventListener('change', fillDays);
  day.addEventListener('change', syncBirth);
  concerns.forEach(input => input.addEventListener('change', validateConcerns));
  fillDays();
  validateConcerns();

  function createSubmissionId() {
    if (typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function captureSubmission(elapsedMs) {
    const data = new FormData(form);
    const value = name => String(data.get(name) || '').trim();
    const parameters = new URLSearchParams(window.location.search);
    const payload = {
      slug: 'career-core-up',
      submissionId: createSubmissionId(),
      name: value('name'),
      phone: value('phone'),
      birth: value('birth'),
      residence: value('residence'),
      status: value('status'),
      school: value('school'),
      job: value('job'),
      concern: data.getAll('concern').map(item => String(item)),
      expectation: value('expectation'),
      reason: value('reason'),
      career: value('career'),
      consent: data.get('consent') !== null,
      consentVersion: 'arunia-core-up-v1',
      consentedAt: new Date().toISOString(),
      elapsedMs,
      website: value('bot-field'),
      pageUrl: window.location.href,
      utmSource: parameters.get('utm_source') || '',
      utmMedium: parameters.get('utm_medium') || '',
      utmCampaign: parameters.get('utm_campaign') || '',
      utmContent: parameters.get('utm_content') || '',
      utmTerm: parameters.get('utm_term') || '',
      referrer: document.referrer,
      userAgent: navigator.userAgent
    };
    return { submissionId: payload.submissionId, body: JSON.stringify(payload) };
  }

  async function request(options = {}) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, {
        cache: 'no-store',
        credentials: 'same-origin',
        redirect: 'error',
        ...options,
        signal: controller.signal,
        headers: { Accept: 'application/json', ...options.headers }
      });
      let data = null;
      try {
        data = await response.json();
      } catch {
        // A missing/malformed response cannot confirm a successful submission.
      }
      return { response, data };
    } finally {
      window.clearTimeout(timeout);
    }
  }

  async function checkAvailability() {
    setState('checking', '신청 접수 준비 상태를 확인하고 있습니다.');
    try {
      const { response, data } = await request();
      if (response.ok && data?.ok === true && data.ready === true) {
        setState('ready', '신청서를 작성하실 수 있습니다. 내용을 확인한 뒤 제출해 주세요.');
        return;
      }
    } catch {
      // Keep the disabled form visible so applicants can inspect the questions.
    }
    setState('unavailable', '신청 접수 준비 중입니다. 잠시 후 아래 버튼으로 다시 확인해 주세요.');
  }

  function markPending() {
    setState('pending', '접수 결과를 아직 확인하지 못했습니다. 창을 닫거나 새로고침하지 말고 아래 버튼으로 다시 확인해 주세요. 입력한 내용은 그대로 유지됩니다.', true);
  }

  async function sendPending() {
    if (!pending || state === 'sending' || state === 'complete' || state === 'conflict') return;
    setState('sending', '지원서 접수를 확인하고 있습니다. 잠시만 기다려 주세요.');
    let result;
    try {
      result = await request({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: pending.body
      });
    } catch {
      markPending();
      return;
    }

    const { response, data } = result;
    if (response.ok && data?.ok === true && data.submissionId === pending.submissionId && typeof data.duplicate === 'boolean') {
      pending = null;
      setState('complete', '지원서가 접수되었습니다. 완료 화면으로 이동합니다.');
      window.location.assign('/career-core-up/thanks');
      return;
    }

    if ([400, 413, 415, 422].includes(response.status)) {
      pending = null;
      const message = response.status === 413
        ? '작성한 내용이 너무 깁니다. 내용을 조금 줄인 뒤 다시 제출해 주세요.'
        : '입력한 내용을 확인해 주세요. 필수 항목과 연락처, 생년월일을 다시 확인한 뒤 제출해 주세요.';
      setState('ready', message, true);
      return;
    }

    if (response.status === 409) {
      pending = null;
      setState('conflict', '접수 정보가 일치하지 않아 확인을 계속할 수 없습니다. 다시 제출하지 말고 운영자에게 접수 여부를 확인해 주세요.', true);
      return;
    }

    // Timeouts, service errors and mismatched acknowledgements may follow a
    // successful write. Preserve the exact request until it is acknowledged.
    markPending();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (state !== 'ready' || pending) return;
    syncBirth();
    validateConcerns();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const elapsedMs = Math.floor(performance.now() - openedAt);
    if (elapsedMs < 1500) {
      setState('ready', '작성한 내용을 다시 확인한 뒤 잠시 후 제출해 주세요.', true);
      return;
    }
    try {
      pending = captureSubmission(elapsedMs);
    } catch {
      setState('ready', '지원서 제출을 준비하지 못했습니다. 브라우저 상태를 확인한 뒤 다시 시도해 주세요.', true);
      return;
    }
    void sendPending();
  });

  retry.addEventListener('click', () => {
    if (state === 'pending' && pending) void sendPending();
    else if (state === 'unavailable') void checkAvailability();
  });

  window.addEventListener('beforeunload', event => {
    if (pending && (state === 'sending' || state === 'pending')) {
      event.preventDefault();
      event.returnValue = '';
    }
  });

  void checkAvailability();
})();

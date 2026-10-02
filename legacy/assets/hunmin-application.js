(() => {
  'use strict';

  const receipt = document.getElementById('hunminReceipt');
  if (receipt) {
    const receiptNumber = new URLSearchParams(window.location.hash.slice(1)).get('receipt') || '';
    if (/^[1-9]\d{4}$/.test(receiptNumber)) {
      receipt.textContent = receiptNumber;
      document.getElementById('hunminReceiptBox').hidden = false;
      document.getElementById('hunminReceiptTitle').textContent = '4행시가 접수되었습니다.';
      document.getElementById('hunminReceiptMessage').textContent = '응모해주셔서 감사합니다. 접수번호를 보관해주세요. 같은 내용을 다시 제출하지 않아도 됩니다.';
    }
    return;
  }

  const form = document.getElementById('hunminForm');
  const fields = document.getElementById('hunminFields');
  const notice = document.getElementById('hunminNotice');
  const retry = document.getElementById('hunminRetry');
  const preview = document.getElementById('hunminPreview');
  const review = document.getElementById('hunminReview');
  const confirm = document.getElementById('hunminConfirm');
  const edit = document.getElementById('hunminEdit');
  if (!form || !fields || !notice || !retry || !preview || !review || !confirm || !edit) return;

  const endpoint = 'https://applications-collection.vercel.app/api/arunia-hunmin-apply/';
  const openedAt = performance.now();
  const lineSpecs = [['lineHun', '훈', 'countHun', 'previewHun'], ['lineMin', '민', 'countMin', 'previewMin'], ['lineJeong', '정', 'countJeong', 'previewJeong'], ['lineEum', '음', 'countEum', 'previewEum']];
  const inputIds = ['name', 'phone', 'age', 'residenceSido', 'residenceSigungu', 'residenceDong'];
  const inputs = Object.fromEntries([...inputIds, ...lineSpecs.map(item => item[0])].map(id => [id, document.getElementById(id)]));
  if (Object.values(inputs).some(input => !input)) return;
  let state = 'checking';
  // Prepared and uncertain submissions stay only in this page's memory.
  let prepared = null;
  let pending = null;

  function setState(next, message, focus = false) {
    state = next;
    fields.disabled = next !== 'ready';
    confirm.disabled = next !== 'reviewing';
    edit.disabled = next !== 'reviewing';
    review.hidden = !['reviewing', 'sending', 'pending', 'conflict', 'complete'].includes(next);
    form.setAttribute('aria-busy', String(next === 'checking' || next === 'sending'));
    notice.dataset.state = next;
    notice.textContent = message;
    retry.hidden = next !== 'unavailable' && next !== 'pending';
    retry.textContent = next === 'pending' ? '접수 확인 다시 하기' : '응모 접수 다시 확인하기';
    confirm.textContent = next === 'sending' ? '접수 확인 중…' : '4행시 응모하기 ↗';
    if (focus) notice.focus({ preventScroll: true });
  }

  function validateLine(id, prefix, counterId) {
    const input = inputs[id];
    const value = input.value.trim();
    let message = '';
    if (!value.startsWith(prefix) || !value.slice(prefix.length).trim()) message = `‘${prefix}’으로 시작하는 문장을 첫 글자까지 포함해서 적어주세요.`;
    else if (/[\r\n]/.test(value)) message = '한 입력칸에는 한 줄만 적어주세요.';
    else if (value.length > 200) message = '각 줄은 200자 이내로 적어주세요.';
    input.setCustomValidity(message);
    document.getElementById(counterId).textContent = `${input.value.length} / 200자`;
  }

  function validateParticipant() {
    for (const id of ['name', 'residenceSido', 'residenceSigungu', 'residenceDong']) {
      const value = inputs[id].value.trim();
      inputs[id].setCustomValidity(value && value.length <= 80 ? '' : '80자 이내로 입력해주세요. 공백만 입력할 수 없습니다.');
    }
    const phone = inputs.phone.value.trim().replace(/[\s()-]/g, '');
    inputs.phone.setCustomValidity(/^01[016789]\d{7,8}$/.test(phone) ? '' : '휴대전화 번호를 확인해주세요. 예: 010-1234-5678');
    const ageText = inputs.age.value.trim();
    const age = Number(ageText);
    inputs.age.setCustomValidity(/^\d+$/.test(ageText) && Number.isInteger(age) && age >= 20 && age <= 27 ? '' : '현재 나이를 20부터 27 사이의 정수로 입력해주세요.');
  }

  lineSpecs.forEach(([id, prefix, counterId]) => inputs[id].addEventListener('input', () => validateLine(id, prefix, counterId)));
  inputIds.forEach(id => inputs[id].addEventListener('input', validateParticipant));
  inputIds.forEach(id => inputs[id].addEventListener('change', validateParticipant));

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
    // Tracking values may come from long campaign links; they must not block
    // an otherwise valid entry. Entrant-written fields are validated above.
    const metadata = (item, limit) => String(item || '').trim().slice(0, limit);
    const payload = {
      slug: 'hunmin',
      submissionId: createSubmissionId(),
      name: value('name'),
      phone: value('phone').replace(/\D/g, ''),
      age: Number(value('age')),
      residenceSido: value('residenceSido'),
      residenceSigungu: value('residenceSigungu'),
      residenceDong: value('residenceDong'),
      lineHun: value('lineHun'),
      lineMin: value('lineMin'),
      lineJeong: value('lineJeong'),
      lineEum: value('lineEum'),
      consent: data.get('consent') !== null,
      consentVersion: 'arunia-hunmin-v1',
      consentedAt: new Date().toISOString(),
      elapsedMs,
      website: value('bot-field'),
      pageUrl: metadata(window.location.href, 500),
      utmSource: metadata(parameters.get('utm_source'), 120),
      utmMedium: metadata(parameters.get('utm_medium'), 120),
      utmCampaign: metadata(parameters.get('utm_campaign'), 160),
      utmContent: metadata(parameters.get('utm_content'), 160),
      utmTerm: metadata(parameters.get('utm_term'), 160),
      referrer: metadata(document.referrer, 500),
      userAgent: metadata(navigator.userAgent, 500)
    };
    return { submissionId: payload.submissionId, body: JSON.stringify(payload) };
  }

  function displayPreview(item) {
    const payload = JSON.parse(item.body);
    lineSpecs.forEach(([id, , , previewId]) => { document.getElementById(previewId).textContent = payload[id]; });
    document.getElementById('previewName').textContent = payload.name;
    document.getElementById('previewPhone').textContent = payload.phone;
    document.getElementById('previewAge').textContent = `${payload.age}세`;
    document.getElementById('previewResidence').textContent = [payload.residenceSido, payload.residenceSigungu, payload.residenceDong].join(' ');
  }

  async function request(options = {}) {
    const controller = new AbortController();
    // Allow the API's 25-second upstream timeout to return a definite result.
    const timeout = window.setTimeout(() => controller.abort(), 35000);
    try {
      const response = await fetch(endpoint, {
        cache: 'no-store', credentials: 'same-origin', redirect: 'error', ...options,
        signal: controller.signal,
        headers: { Accept: 'application/json', ...options.headers }
      });
      let data = null;
      try { data = await response.json(); } catch { /* An unreadable response cannot confirm a write. */ }
      return { response, data };
    } finally { window.clearTimeout(timeout); }
  }

  async function checkAvailability() {
    setState('checking', '응모 접수 준비 상태를 확인하고 있습니다.');
    // A read-only readiness check may recover from one transient failure.
    // Submission writes are retried only through the entrant's explicit action.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const { response, data } = await request();
        if (response.ok && data?.ok === true && data.ready === true) {
          setState('ready', '4행시를 작성하고 응모자 정보를 입력해주세요. 내용을 확인한 뒤 최종 제출할 수 있습니다.');
          return;
        }
      } catch { /* Keep the form locked until a verified ready response arrives. */ }
    }
    setState('unavailable', '응모 접수 준비 중입니다. 잠시 후 아래 버튼으로 다시 확인해주세요.');
  }

  function markPending() {
    setState('pending', '접수 결과를 아직 확인하지 못했습니다. 창을 닫거나 새로고침하지 말고 아래 버튼으로 다시 확인해주세요. 작성한 내용은 그대로 유지됩니다.', true);
  }

  async function sendPending() {
    if (!pending || state === 'sending' || state === 'complete' || state === 'conflict') return;
    setState('sending', '응모 접수를 확인하고 있습니다. 잠시만 기다려주세요.');
    let result;
    try {
      result = await request({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: pending.body });
    } catch { markPending(); return; }
    const { response, data } = result;
    if (response.ok && data?.ok === true && data.submissionId === pending.submissionId && typeof data.duplicate === 'boolean' && typeof data.receiptNumber === 'string' && /^[1-9]\d{4}$/.test(data.receiptNumber)) {
      const receiptNumber = data.receiptNumber;
      pending = null;
      setState('complete', '4행시가 접수되었습니다. 접수번호 확인 화면으로 이동합니다.');
      window.location.assign(`/hunmin/thanks#receipt=${encodeURIComponent(receiptNumber)}`);
      return;
    }
    if ([400, 413, 415, 422].includes(response.status)) {
      pending = null;
      setState('ready', response.status === 413 ? '작성한 내용이 너무 깁니다. 내용을 줄인 뒤 다시 확인해주세요.' : '입력한 내용을 확인해주세요. 네 줄의 첫 글자, 연락처, 나이와 필수 항목을 확인한 뒤 다시 제출해주세요.', true);
      return;
    }
    if (response.status === 409) {
      pending = null;
      setState('conflict', '접수 정보가 일치하지 않아 확인을 계속할 수 없습니다. 다시 제출하지 말고 운영자에게 접수 여부를 확인해주세요.', true);
      return;
    }
    markPending();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (state !== 'ready' || pending || prepared) return;
    lineSpecs.forEach(([id, prefix, counterId]) => validateLine(id, prefix, counterId));
    validateParticipant();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const elapsedMs = Math.floor(performance.now() - openedAt);
    if (elapsedMs < 1500) { setState('ready', '작성한 내용을 다시 확인한 뒤 잠시 후 제출해주세요.', true); return; }
    try { prepared = captureSubmission(elapsedMs); displayPreview(prepared); }
    catch { prepared = null; setState('ready', '응모 제출을 준비하지 못했습니다. 브라우저 상태를 확인한 뒤 다시 시도해주세요.', true); return; }
    setState('reviewing', '아래 미리보기에서 작성 내용을 확인한 뒤 최종 응모해주세요.');
    document.getElementById('reviewTitle').focus();
  });

  edit.addEventListener('click', () => {
    if (state !== 'reviewing') return;
    prepared = null;
    setState('ready', '내용을 수정한 뒤 다시 확인해주세요.');
    inputs.lineHun.focus();
  });
  confirm.addEventListener('click', () => {
    if (state !== 'reviewing' || !prepared || pending) return;
    pending = prepared;
    prepared = null;
    void sendPending();
  });
  retry.addEventListener('click', () => {
    if (state === 'pending' && pending) void sendPending();
    else if (state === 'unavailable') void checkAvailability();
  });
  window.addEventListener('beforeunload', event => {
    if (pending && (state === 'sending' || state === 'pending')) { event.preventDefault(); event.returnValue = ''; }
  });
  void checkAvailability();
})();

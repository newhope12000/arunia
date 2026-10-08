(() => {
  const form = document.getElementById("contactForm");
  if (!form) return;

  // Keep the original processing endpoint and its four-field payload intact.
  const legacyEndpoint = "https://script.google.com/macros/s/AKfycbxj8PqxeRRc2Fidc9fTPVf_0kDL3rrKjliTnl2IklyDmcgvsnXvJgE74vuL8jgg6tmoFw/exec";
  const emailEndpoint = "https://formsubmit.co/ajax/hwajeongup@gmail.com";
  const button = form.querySelector('button[type="submit"]');
  const status = document.getElementById("contactStatus");
  const success = document.getElementById("formSuccess");
  const legacyStatus = document.getElementById("contactLegacyStatus");
  const inputs = [...form.querySelectorAll("input, select, textarea")];
  let attempted = false;
  button.disabled = false;

  async function requestWithinDeadline(send, fallback) {
    const controller = new AbortController();
    let timeout;
    const deadline = new Promise((resolve) => {
      timeout = setTimeout(() => {
        controller.abort();
        resolve(fallback);
      }, 20000);
    });
    try {
      return await Promise.race([send(controller.signal), deadline]);
    } catch {
      return fallback;
    } finally {
      clearTimeout(timeout);
    }
  }

  function sendLegacy(values) {
    return requestWithinDeadline(async (signal) => {
      await fetch(legacyEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify(values),
      });
      // An opaque response cannot confirm that the existing system saved data.
      return "unknown";
    }, "unconfirmed");
  }

  function sendEmail(values) {
    return requestWithinDeadline(async (signal) => {
      const response = await fetch(emailEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        signal,
        body: JSON.stringify({
          ...values,
          _subject: "[어른이아] 홈페이지 문의",
          _template: "table",
          _url: "https://www.arunia.co.kr/contact.html",
        }),
      });
      const data = await response.json();
      if (response.ok && (data?.success === true || data?.success === "true"))
        return "accepted";
      if (data?.success === false || data?.success === "false")
        return "rejected";
      // Network failure or timeout does not establish that delivery failed.
      return "unknown";
    }, "unknown");
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (attempted || !form.reportValidity()) return;
    const values = {
      name: form.querySelector("#fname").value,
      email: form.querySelector("#femail").value,
      interest: form.querySelector("#finterest").value,
      message: form.querySelector("#fmessage").value,
    };
    attempted = true;
    inputs.forEach((input) => { input.disabled = true; });
    button.disabled = true;
    button.textContent = "전송 중…";
    form.setAttribute("aria-busy", "true");
    status.textContent = "문의를 접수하고 이메일로 전달하고 있습니다. 잠시 기다려주세요.";

    const legacyMessage = (result) => result === "unknown"
      ? "기존 접수 경로의 처리 완료 여부는 이 화면에서 확인할 수 없습니다."
      : "기존 접수 경로의 전달 여부를 확인하지 못했습니다. 이미 처리됐을 수 있습니다.";
    let legacyResult = "unknown";
    sendLegacy(values).then((result) => {
      legacyResult = result;
      if (success.style.display === "block")
        legacyStatus.textContent = legacyMessage(result);
    });
    // Email acknowledgement does not need to wait for an unreadable legacy
    // response. The existing request continues independently with a deadline.
    const emailResult = await sendEmail(values);
    form.removeAttribute("aria-busy");
    button.textContent = "전송 요청 완료";
    // Do not retry the legacy request after uncertain delivery. Keep the values
    // visible on email failure so the visitor can use the direct email fallback.
    if (emailResult === "accepted") {
      form.style.display = "none";
      legacyStatus.textContent = legacyMessage(legacyResult);
      success.style.display = "block";
      success.focus();
      return;
    }
    inputs.forEach((input) => { input.disabled = false; });
    button.textContent = "직접 이메일로 문의해주세요";
    const emailMessage = emailResult === "rejected"
      ? "문의 메일 전송 요청이 거절되어 완료되지 않았습니다."
      : "문의 메일 전송 결과를 확인하지 못했습니다. 이미 전달됐을 수 있습니다.";
    status.textContent = `${emailMessage} ${legacyMessage(legacyResult)} 작성한 내용은 그대로 남아 있습니다. 중복 접수를 막기 위해 다시 제출하지 말고 hwajeongup@gmail.com으로 직접 문의해주세요.`;
    status.focus();
  });
})();

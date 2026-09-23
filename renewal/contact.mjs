export const CONTACT = Object.freeze({
  recipient: "hwajeongup@gmail.com",
  endpoint: "https://formsubmit.co/ajax/hwajeongup@gmail.com",
  page: "https://arunia.vercel.app/v0_1/contact.html",
});

export async function sendInquiry(values, fetcher = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetcher(CONTACT.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        email: values.email,
        message: values.message,
        _subject: "[어른이아] 홈페이지 문의",
        _template: "table",
        _url: CONTACT.page,
      }),
    });
    const data = await response.json();
    if (response.ok && (data?.success === true || data?.success === "true")) {
      return { status: "accepted" };
    }
    if (data?.success === false || data?.success === "false") {
      return {
        status: "rejected",
        message: /activat/i.test(String(data.message))
          ? "문의 접수 설정을 확인하고 있어요. 아직 전송이 완료되지 않았어요. 잠시 후 다시 시도하거나 아래 이메일로 문의해주세요."
          : "문의를 접수하지 못했어요. 입력 내용을 확인한 뒤 다시 시도하거나 아래 이메일로 문의해주세요.",
      };
    }
  } catch {
    // A timeout or unreadable response does not prove the message was unsent.
  } finally {
    clearTimeout(timeout);
  }
  return {
    status: "unknown",
    message:
      "전송 결과를 확인하지 못했어요. 작성한 내용은 그대로 남아 있어요. 이미 접수됐을 수 있으니 잠시 기다린 뒤 확인하거나 아래 이메일로 문의해주세요.",
  };
}

export function initContact(root = document, submitInquiry = null) {
  const form = root.querySelector("[data-contact-form]");
  if (!form) return;
  const email = form.elements.email;
  const message = form.elements.message;
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector("[data-contact-status]");
  const success = root.querySelector("[data-contact-success]");
  const fields = form.querySelector("fieldset");
  let pending = false;

  fields.disabled = false;
  button.disabled = !submitInquiry;
  if (submitInquiry) status.textContent = "";
  message.addEventListener("input", () => message.setCustomValidity(""));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (pending || !submitInquiry) return;
    email.value = email.value.trim();
    message.setCustomValidity(
      message.value.trim() ? "" : "문의 내용을 입력해주세요.",
    );
    if (!form.reportValidity()) return;
    pending = true;
    fields.disabled = true;
    button.disabled = true;
    button.textContent = "전송 중…";
    form.setAttribute("aria-busy", "true");
    status.textContent = "문의를 전송하고 있어요. 잠시만 기다려주세요.";
    status.classList.remove("is-error");
    let result;
    try {
      result = await submitInquiry({
        email: email.value,
        message: message.value.trim(),
      });
    } catch {
      result = {
        status: "unknown",
        message:
          "전송 결과를 확인하지 못했어요. 작성한 내용은 그대로 남아 있어요. 이미 접수됐을 수 있으니 잠시 기다린 뒤 확인하거나 아래 이메일로 문의해주세요.",
      };
    } finally {
      pending = false;
      fields.disabled = false;
      button.disabled = false;
      button.textContent = "문의하기";
      form.removeAttribute("aria-busy");
    }
    if (result?.status === "accepted") {
      form.reset();
      form.hidden = true;
      success.hidden = false;
      success.querySelector("h2").focus();
    } else {
      status.textContent =
        result?.message ||
        "접수 결과를 확인하지 못했어요. 잠시 후 다시 확인해주세요.";
      status.classList.add("is-error");
      status.focus();
    }
  });
  root.querySelector("[data-contact-again]").addEventListener("click", () => {
    success.hidden = true;
    form.hidden = false;
    status.textContent = "";
    status.classList.remove("is-error");
    email.focus();
  });
}

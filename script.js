// Nav scroll effect
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// Mobile menu
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
  const isOpen = navMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(isOpen));
  const [a, b, c] = hamburger.querySelectorAll('span');
  if (isOpen) {
    a.style.cssText = 'transform: rotate(45deg) translate(5px, 5px)';
    b.style.cssText = 'opacity: 0; transform: translateX(-6px)';
    c.style.cssText = 'transform: rotate(-45deg) translate(5px, -5px)';
  } else {
    [a, b, c].forEach(s => (s.style.cssText = ''));
  }
});

navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.querySelectorAll('span').forEach(s => (s.style.cssText = ''));
  });
});

// Scroll-triggered fade-in
const observer = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.1 }
);

const targets = [
  '.value-card',
  '.program-card',
  '.pricing-card',
  '.testi-card',
  '.problem__card',
  '.vision__left',
  '.vision__img-frame',
  '.hero__content',
  '.page-hero',
];
document.querySelectorAll(targets.join(',')).forEach(el => {
  el.classList.add('fade-up');
  observer.observe(el);
});

// Stagger grid children
['.values__grid', '.programs__grid', '.pricing__grid', '.testimonials__grid', '.problem__cards'].forEach(sel => {
  const grid = document.querySelector(sel);
  if (!grid) return;
  grid.querySelectorAll(':scope > *').forEach((child, i) => {
    child.style.transitionDelay = `${i * 80}ms`;
  });
});

// Contact form → Google Sheets
// Google Apps Script 배포 후 아래 URL을 교체하세요
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';

const form = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();

    const data = {
      name:     form.querySelector('#fname').value,
      email:    form.querySelector('#femail').value,
      interest: form.querySelector('#finterest').value,
      message:  form.querySelector('#fmessage').value,
    };

    // 데이터 전송 (no-cors: 응답 못 읽어도 시트엔 저장됨)
    if (APPS_SCRIPT_URL !== 'YOUR_APPS_SCRIPT_URL_HERE') {
      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => {});
    }

    // 성공 UI 표시
    form.style.transition = 'opacity 0.3s, transform 0.3s';
    form.style.opacity = '0';
    form.style.transform = 'scale(0.97)';
    setTimeout(() => {
      form.style.display = 'none';
      formSuccess.style.display = 'block';
      formSuccess.style.opacity = '0';
      formSuccess.style.transition = 'opacity 0.4s';
      requestAnimationFrame(() => { formSuccess.style.opacity = '1'; });
    }, 320);
  });
}

// Textarea focus style (contact page)
const textarea = document.getElementById('fmessage');
if (textarea) {
  textarea.addEventListener('focus', () => {
    textarea.style.borderColor = 'var(--accent)';
    textarea.style.boxShadow = '0 0 0 3px rgba(232,93,58,0.12)';
    textarea.style.outline = 'none';
  });
  textarea.addEventListener('blur', () => {
    textarea.style.borderColor = '';
    textarea.style.boxShadow = '';
  });
}

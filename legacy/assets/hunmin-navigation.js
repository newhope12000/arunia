(() => {
  'use strict';

  const { pathname, search, hash } = window.location;
  const landing = ['/hunmin', '/hunmin/', '/hunmin/index.html'].includes(pathname);
  // Existing campaign links may still point directly to the former inline form.
  if (landing && ['#hunminForm', '#applicationTitle'].includes(hash)) {
    window.location.replace(`/hunmin/apply${search}#hunminForm`);
    return;
  }

  if (!search) return;
  for (const link of document.querySelectorAll('a[href="/hunmin"], a[href="/hunmin/apply"]')) {
    link.setAttribute('href', `${link.getAttribute('href')}${search}`);
  }
})();

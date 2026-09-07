(() => {
  'use strict';
  const config = JSON.parse(document.getElementById('site-config').textContent);
  const allowed = new Set(config.languages);
  document.querySelectorAll('[data-language]').forEach(select => {
    select.addEventListener('change', () => {
      const option = select.selectedOptions[0];
      const locale = option.lang;
      try { if (allowed.has(locale)) localStorage.setItem('rg-language', locale); } catch (_) {}
      window.location.assign(select.value);
    });
  });
  if (config.rootEntry) {
    try {
      const remembered = localStorage.getItem('rg-language');
      if (allowed.has(remembered) && remembered !== 'en') window.location.replace(config.languageUrls[remembered]);
    } catch (_) {}
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('pending'); observer.unobserve(entry.target); }
    }), { threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach(node => { node.classList.add('pending'); observer.observe(node); });
  }
  const cards = [...document.querySelectorAll('[data-category]')];
  document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      cards.forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter; });
      const empty = document.querySelector('.project-empty');
      if (empty) empty.hidden = cards.some(card => !card.hidden);
    });
  });
  const dialog = document.getElementById('lightbox');
  let opener = null;
  document.querySelectorAll('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    const source = button.querySelector('img');
    const img = document.getElementById('lightbox-image');
    img.src = source.src; img.alt = source.alt;
    document.getElementById('lightbox-caption').textContent = source.alt + ' · ' + config.sample;
    dialog.showModal();
  }));
  document.getElementById('lightbox-close')?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', event => { if (event.target === dialog && (event.clientX < dialog.getBoundingClientRect().left || event.clientX > dialog.getBoundingClientRect().right || event.clientY < dialog.getBoundingClientRect().top || event.clientY > dialog.getBoundingClientRect().bottom)) dialog.close(); });
  dialog?.addEventListener('close', () => opener?.focus());
  const form = document.getElementById('estimate-form');
  if (form) {
    const params = new URLSearchParams(location.search);
    const service = params.get('service');
    if (service !== null && /^\d{1,2}$/.test(service) && +service < config.serviceNames.length) form.elements.service.value = service;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const status = document.getElementById('form-status');
      if (!form.checkValidity()) {
        status.textContent = config.formError;
        form.reportValidity();
        return;
      }
      const data = new FormData(form);
      const fields = ['name','email','phone','province','city','service','budget','method','message'];
      const lines = fields.map((key, i) => {
        let value = String(data.get(key) || '').trim();
        if (key === 'service') value = config.serviceNames[Number(value)];
        return config.fields[i] + ': ' + value;
      });
      const message = config.messageGreeting + '\n\n' + lines.join('\n');
      const channel = event.submitter?.value || 'whatsapp';
      const href = channel === 'email'
        ? 'mailto:' + config.email + '?subject=' + encodeURIComponent(config.estimate + ' — Rebuild General') + '&body=' + encodeURIComponent(message)
        : 'https://wa.me/' + config.whatsapp + '?text=' + encodeURIComponent(message);
      // No form data is sent to a website backend. The visitor must review and send in their chosen app.
      status.textContent = config.formReady;
      window.location.assign(href);
    });
  }
})();

/* AVELUNE V6 — Beauty Finder, mobile enhancements and motion preferences */
(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rub = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
  let goal = null;
  let budget = 0;

  function bestOffer(product) {
    return (product.offers || []).filter(o => o.inStock && Number.isFinite(o.price) && o.price > 0)
      .slice().sort((a, b) => a.price - b.price)[0] || null;
  }

  function showStep(step) {
    const steps = ['goal', 'budget', 'results'];
    steps.forEach(id => {
      const el = byId('finder-step-' + id);
      if (el) el.hidden = id !== step;
    });
    const counter = byId('finder-counter');
    if (counter) counter.textContent = step === 'goal' ? 'ШАГ 01 / 02' : step === 'budget' ? 'ШАГ 02 / 02' : 'ТВОЙ РЕЗУЛЬТАТ';
  }

  function results() {
    const source = Array.isArray(window.AVELUNE_PRODUCTS) ? window.AVELUNE_PRODUCTS : [];
    const matching = source.filter(p => p.category === goal).map(p => ({product:p,offer:bestOffer(p)}))
      .filter(x => x.offer && (!budget || x.offer.price <= budget))
      .sort((a,b) => a.offer.price-b.offer.price).slice(0,3);
    const summary = byId('finder-result-summary');
    if (summary) summary.textContent = goal + (budget ? ' · бюджет до ' + rub(budget) : ' · любой бюджет')
      + ' · ' + matching.length + ' ' + (matching.length === 1 ? 'находка' : 'находки');
    const area = byId('finder-results');
    if (!area) return;
    if (!matching.length) {
      area.innerHTML = '<div class="finder-empty"><span>✧</span><strong>В этом бюджете пока нет подходящих товаров.</strong><p>Попробуй другой бюджет или открой весь каталог.</p></div>';
      return;
    }
    area.innerHTML = matching.map(({product:p,offer:o}) => {
      const fallback = document.querySelector('.product-image-open[data-open="'+CSS.escape(p.id)+'"] img');
      const src = fallback ? fallback.src : '';
      return '<article class="finder-product">' +
        '<div class="finder-product-art">' + (src ? '<img src="'+src+'" alt="">' : '<span>✿</span>') + '</div>' +
        '<div class="finder-product-info"><small>'+escapeHtml(p.brand)+'</small><h4>'+escapeHtml(p.name)+'</h4>' +
        '<p>'+escapeHtml(p.note)+' · '+escapeHtml(p.size)+'</p><strong>'+rub(o.price)+'</strong></div>' +
        '<button type="button" class="finder-product-open" data-open="'+escapeHtml(p.id)+'" aria-label="Сравнить предложения '+escapeHtml(p.name)+'">↗</button>' +
        '</article>';
    }).join('');
  }

  function initFinder() {
    if (!byId('finder')) return;
    byId('finder').addEventListener('click', event => {
      const goalButton = event.target.closest('[data-finder-goal]');
      if (goalButton) {goal = goalButton.dataset.finderGoal; showStep('budget'); return;}
      const budgetButton = event.target.closest('[data-finder-budget]');
      if (budgetButton) {budget = Number(budgetButton.dataset.finderBudget) || 0; results(); showStep('results'); return;}
    });
    byId('finder-step-back')?.addEventListener('click', () => showStep('goal'));
    byId('finder-again')?.addEventListener('click', () => {goal = null; budget = 0; showStep('goal');});
    byId('finder-show-catalog')?.addEventListener('click', () => {
      if (goal && window.AVELUNE_TEST?.chooseCategory) window.AVELUNE_TEST.chooseCategory(goal);
      else document.querySelector('#open-full-catalog')?.click();
    });
    showStep('goal');
  }

  function initMotion() {
    const button = byId('motion-toggle');
    if (!button) return;
    let userSetting = null;
    try {userSetting = localStorage.getItem('avelune:motion-off');} catch (_) {}
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const apply = off => {
      document.body.classList.toggle('motion-off', off);
      button.setAttribute('aria-pressed', String(off));
      button.setAttribute('aria-label', off ? 'Включить анимации' : 'Отключить анимации');
      button.setAttribute('title', off ? 'Включить эффекты' : 'Отключить эффекты');
      const icon = byId('motion-icon');
      if (icon) icon.textContent = off ? '◌' : '✧';
    };
    apply(userSetting === null ? !!prefersReduced : userSetting === 'true');
    button.addEventListener('click', () => {
      const off = !document.body.classList.contains('motion-off');
      apply(off);
      try {localStorage.setItem('avelune:motion-off', String(off));} catch (_) {}
    });
  }

  function initMobileNav() {
    const dealsButton = document.querySelector('[data-bottom="deals"]');
    if (dealsButton) dealsButton.addEventListener('click', () => {
      const goHome = document.querySelector('.footer-logo');
      if (document.body.classList.contains('catalog-mode')) goHome?.click();
      requestAnimationFrame(() => setTimeout(() => byId('deals')?.scrollIntoView({behavior:document.body.classList.contains('motion-off')?'auto':'smooth',block:'start'}), 90));
    });
  }

  function initSparkles() {
    const hero = document.querySelector('.hero-backdrop');
    if (!hero) return;
    for (let i=0;i<8;i++) {
      const node=document.createElement('span');
      node.className='v6-sparkle';
      node.textContent=i%2?'✧':'✦';
      node.style.left=(12+i*11)+'%';
      node.style.top=(10+((i*37)%74))+'%';
      node.style.animationDelay=(-i*.85)+'s';
      node.style.fontSize=(10+i%3*6)+'px';
      hero.appendChild(node);
    }
  }

  function init() {
    initFinder(); initMotion(); initMobileNav(); initSparkles();
    document.body.classList.add('v6-ready');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

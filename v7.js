/* AVELUNE V7 — My Beauty Shelf and lightweight atmospheric effects */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const ESC = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const price = value => Number.isFinite(value) ? new Intl.NumberFormat('ru-RU').format(value) + ' ₽' : 'Нет в наличии';
  let previousFocus = null;
  let shelfOpen = false;
  let onOpenRoot = null;
  const products = () => Array.isArray(window.AVELUNE_PRODUCTS) ? window.AVELUNE_PRODUCTS : [];
  function favorites() {
    try {
      const data = JSON.parse(localStorage.getItem('avelune-v3:favs') || '[]');
      return new Set(Array.isArray(data) ? data.filter(x => typeof x === 'string') : []);
    } catch { return new Set(); }
  }
  function bestPrice(p) {
    const nums = (p.offers || []).filter(o => o.inStock && Number.isFinite(o.price)).map(o => o.price);
    return nums.length ? Math.min(...nums) : Infinity;
  }
  function productImage(p) {
    const el = document.querySelector('.product-image-open[data-open="'+p.id+'"] img');
    return el?.src || '';
  }
  function renderShelf() {
    const root = $('v7-shelf-root'); if (!root || !shelfOpen) return;
    const saved = favorites(), items = products().filter(p => saved.has(p.id));
    const stats = items.filter(p=>Number.isFinite(bestPrice(p)));
    const sum = stats.reduce((total,p) => total + bestPrice(p), 0);
    root.innerHTML = '<button class="v7-shelf-backdrop" data-v7-close type="button" aria-label="Закрыть избранное"></button>'+
      '<aside class="v7-shelf-panel" role="dialog" aria-modal="true" aria-labelledby="v7-shelf-title">'+
      '<div class="v7-shelf-top"><div><span class="v7-shelf-kicker">✦ AVELUNE BEAUTY CLUB</span><h2 id="v7-shelf-title">Моя <em>полка.</em></h2></div><button type="button" class="v7-shelf-close" data-v7-close aria-label="Закрыть">×</button></div>'+
      '<p class="v7-shelf-explain">Любимые средства в одном месте. Список хранится на этом устройстве. Цены в демо-каталоге вымышленные.</p>'+
      '<div class="v7-shelf-stats"><div><small>СОХРАНЕНО</small><strong>'+items.length+'</strong></div><div><small>ДЕМО-СУММА ОТ</small><strong>'+price(sum)+'</strong></div></div>'+
      (items.length
        ? '<div class="v7-shelf-grid">'+items.map(p => '<article class="v7-shelf-item"><div class="v7-shelf-image">'+(productImage(p)?'<img src="'+productImage(p)+'" alt="">':'✧')+'</div><div><small>'+ESC(p.brand)+'</small><h3>'+ESC(p.name)+'</h3><strong>'+price(bestPrice(p))+'</strong><button class="v7-shelf-open" type="button" data-v7-open="'+ESC(p.id)+'">Сравнить цены ↗</button></div><button type="button" class="v7-shelf-heart" data-v7-remove="'+ESC(p.id)+'" aria-label="Убрать '+ESC(p.name)+' из избранного">♥</button></article>').join('')+'</div>'
        : '<div class="v7-shelf-empty"><span class="v7-empty-heart">♡</span><h3>Здесь пока пусто.</h3><p>Нажимай ♡ на карточках товаров, чтобы сохранять понравившуюся косметику.</p></div>')+
      '<div class="v7-shelf-bottom"><button type="button" class="v7-shelf-action" data-v7-catalog>Вернуться к каталогу ↗</button>'+
      (items.length ? '<button type="button" class="v7-shelf-secondary" data-v7-copy>Скопировать мой список</button>' : '')+
      '</div></aside>';
    root.querySelector('[data-v7-close]')?.focus({preventScroll:true});
  }
  function closeShelf({restore=true}={}) {
    if (!shelfOpen) return;
    shelfOpen=false;
    $('v7-shelf-root').innerHTML='';
    document.body.classList.remove('v7-shelf-open');
    if (restore && previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
  }
  function openShelf() {
    if (shelfOpen) return;
    previousFocus=document.activeElement;
    shelfOpen=true;
    document.body.classList.add('v7-shelf-open');
    renderShelf();
  }
  function copyShelf() {
    const chosen=products().filter(p=>favorites().has(p.id));
    const summary=['Моя полка AVELUNE (демо-цены):',...chosen.map(p=>'• '+p.brand+' — '+p.name+' — '+price(bestPrice(p))), 'https://hiqyho-sys.github.io/AVELUNE/'].join('\n');
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(summary).then(()=>{
        const btn=$('v7-shelf-root')?.querySelector('[data-v7-copy]');
        if(btn)btn.textContent='✓ Список скопирован';
      }).catch(()=>fallbackCopy(summary));
    } else fallbackCopy(summary);
  }
  function fallbackCopy(summary) {
    // Privacy-friendly fallback for browsers without clipboard support.
    const field=document.createElement('textarea');
    field.value=summary;
    field.style.cssText='position:fixed;opacity:0;left:-9999px';
    document.body.appendChild(field);field.select();
    try {document.execCommand('copy');const btn=$('v7-shelf-root')?.querySelector('[data-v7-copy]');if(btn)btn.textContent='✓ Список скопирован';}
    catch {window.prompt('Скопируй список:',summary);}
    field.remove();
  }
  function installShelf() {
    const root=$('v7-shelf-root'); if(!root) return;
    window.addEventListener('avelune:open-shelf', openShelf);
    window.addEventListener('avelune:favorites-changed', () => { if(shelfOpen) renderShelf(); });
    root.addEventListener('click',event=>{
      if (event.target.closest('[data-v7-close]')) {closeShelf(); return;}
      const remove=event.target.closest('[data-v7-remove]');
      if (remove) {window.AVELUNE_TEST?.toggleFavorite?.(remove.dataset.v7Remove);renderShelf();return;}
      const open=event.target.closest('[data-v7-open]');
      if (open) {const id=open.dataset.v7Open;closeShelf({restore:false});window.AVELUNE_TEST?.openModal?.(id);return;}
      if (event.target.closest('[data-v7-catalog]')) {closeShelf({restore:false});document.getElementById('open-full-catalog')?.click();return;}
      if (event.target.closest('[data-v7-copy]'))copyShelf();
    });
    document.addEventListener('keydown',event=>{
      if(!shelfOpen)return;
      if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();closeShelf();return;}
      if(event.key==='Tab'){
        const focusable=[...root.querySelectorAll('button:not([disabled])')].filter(b=>b.getClientRects().length);
        if(!focusable.length)return;
        const first=focusable[0],last=focusable[focusable.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      }
    },true);
    // Keep host callback stable when switching sections.
    onOpenRoot = openShelf;
  }
  function addDust() {
    const hero=document.querySelector('.hero-backdrop');
    if(!hero)return;
    for(let i=0;i<12;i++){
      const point=document.createElement('i');
      point.className='v7-hero-dust';
      point.style.setProperty('--x',(6+((i*29)%87))+'%');
      point.style.setProperty('--y',(7+((i*41)%78))+'%');
      point.style.setProperty('--s',(i%4+2)+'px');
      point.style.setProperty('--dur',(6+i%4*2)+'s');
      point.style.setProperty('--delay',(-i*.6)+'s');
      hero.appendChild(point);
    }
  }
  function init(){installShelf();addDust();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();

(() => {
  'use strict';

  const section = document.querySelector('#journey');
  const photos = Array.isArray(window.JapanSceneryPhotos) ? window.JapanSceneryPhotos : [];
  if (!section || !photos.length) return;

  const cards = Array.from(section.querySelectorAll('.japan-photo-card[data-japan-id]'));
  const filters = Array.from(section.querySelectorAll('[data-japan-filter]'));
  const count = section.querySelector('#japan-gallery-count');
  const byId = new Map(photos.map(photo => [String(photo.id), photo]));
  if (!cards.length) return;

  let visibleCards = [];
  let currentIndex = 0;
  let opener = null;
  let imageRequest = 0;

  const dialog = document.createElement('dialog');
  dialog.className = 'japan-photo-dialog';
  dialog.setAttribute('aria-labelledby', 'japan-photo-dialog-title');
  dialog.innerHTML = `
    <div class="japan-photo-dialog-header">
      <p class="japan-photo-dialog-kicker">JAPAN / PHOTO GALLERY<span class="japan-photo-dialog-position" aria-live="polite"></span></p>
      <button class="japan-photo-close" type="button" aria-label="关闭照片" autofocus>×</button>
    </div>
    <div class="japan-photo-stage">
      <img class="japan-photo-full" alt="" decoding="async">
      <p class="japan-photo-status" role="status" aria-live="polite" hidden></p>
      <button class="japan-photo-nav japan-photo-prev" type="button" aria-label="上一张照片">←</button>
      <button class="japan-photo-nav japan-photo-next" type="button" aria-label="下一张照片">→</button>
    </div>
    <div class="japan-photo-dialog-footer">
      <div><p class="japan-photo-dialog-place"></p><h2 class="japan-photo-dialog-title" id="japan-photo-dialog-title"></h2><p class="japan-photo-dialog-season"></p></div>
      <p class="japan-photo-credit"><span class="japan-photo-author"></span> · <a class="japan-photo-license" target="_blank" rel="noopener noreferrer"></a><a class="japan-photo-source" target="_blank" rel="noopener noreferrer">来源 ↗</a></p>
    </div>`;
  document.body.appendChild(dialog);

  const image = dialog.querySelector('.japan-photo-full');
  const stage = dialog.querySelector('.japan-photo-stage');
  const status = dialog.querySelector('.japan-photo-status');
  const closeButton = dialog.querySelector('.japan-photo-close');
  const previousButton = dialog.querySelector('.japan-photo-prev');
  const nextButton = dialog.querySelector('.japan-photo-next');
  const position = dialog.querySelector('.japan-photo-dialog-position');
  const title = dialog.querySelector('.japan-photo-dialog-title');
  const place = dialog.querySelector('.japan-photo-dialog-place');
  const season = dialog.querySelector('.japan-photo-dialog-season');
  const author = dialog.querySelector('.japan-photo-author');
  const license = dialog.querySelector('.japan-photo-license');
  const source = dialog.querySelector('.japan-photo-source');

  function setExternalLink(link, url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('Unsupported URL');
      link.href = parsed.href;
      link.hidden = false;
    } catch {
      link.removeAttribute('href');
      link.hidden = true;
    }
  }

  function setFilter(region) {
    cards.forEach(card => {
      card.hidden = region !== 'all' && card.dataset.region !== region;
      card.classList.remove('is-leading', 'is-secondary');
    });
    visibleCards = cards.filter(card => !card.hidden && byId.has(card.dataset.japanId));
    visibleCards[0]?.classList.add('is-leading');
    visibleCards[1]?.classList.add('is-secondary');
    visibleCards.forEach((card, index) => {
      const image = card.querySelector('img');
      if (!image) return;
      if (index === 0) {
        image.sizes = '(max-width:700px) calc(100vw - 56px), (max-width:980px) 54vw, 670px';
      } else if (index === 1) {
        image.sizes = '(max-width:390px) calc(100vw - 56px), (max-width:700px) 44vw, 480px';
      } else {
        image.sizes = '(max-width:390px) calc(100vw - 56px), (max-width:700px) 44vw, (max-width:980px) 30vw, 360px';
      }
    });
    filters.forEach(button => {
      const selected = button.dataset.japanFilter === region;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('active', selected);
    });
    if (count) count.textContent = `${String(visibleCards.length).padStart(2, '0')} 张照片`;
  }

  function showPhoto(index) {
    if (!visibleCards.length) return;
    currentIndex = (index + visibleCards.length) % visibleCards.length;
    const photo = byId.get(visibleCards[currentIndex].dataset.japanId);
    const request = ++imageRequest;
    title.textContent = photo.title || '';
    place.textContent = photo.place || '';
    season.textContent = photo.season || '';
    season.hidden = !photo.season;
    author.textContent = photo.author || '';
    license.textContent = photo.license || '';
    setExternalLink(license, photo.license_url);
    setExternalLink(source, photo.source_page);
    position.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(visibleCards.length).padStart(2, '0')}`;
    previousButton.disabled = visibleCards.length < 2;
    nextButton.disabled = visibleCards.length < 2;
    image.alt = [photo.place, photo.title].filter(Boolean).join(' · ');
    image.width = Number(photo.width) || 2400;
    image.height = Number(photo.height) || 1600;
    stage.classList.add('is-loading');
    status.textContent = '高清图片加载中…';
    status.hidden = false;

    let usedFallback = false;
    image.onload = () => {
      if (request !== imageRequest) return;
      stage.classList.remove('is-loading');
      status.hidden = true;
      status.textContent = '';
    };
    image.onerror = () => {
      if (request !== imageRequest) return;
      if (!usedFallback && photo.src && photo.src !== photo.full) {
        usedFallback = true;
        image.src = photo.src;
        return;
      }
      status.textContent = '图片暂时无法载入，可查看来源原图。';
      status.hidden = false;
    };
    image.src = photo.full || photo.src;
  }

  function openPhoto(card) {
    const index = visibleCards.indexOf(card);
    if (index < 0 || typeof dialog.showModal !== 'function') return;
    opener = card;
    showPhoto(index);
    if (!dialog.open) dialog.showModal();
    document.documentElement.classList.add('japan-gallery-open');
    closeButton.focus({ preventScroll: true });
  }

  cards.forEach(card => {
    card.type = 'button';
    card.setAttribute('aria-haspopup', 'dialog');
    card.addEventListener('click', () => openPhoto(card));
  });

  filters.forEach(button => {
    button.type = 'button';
    button.addEventListener('click', () => setFilter(button.dataset.japanFilter));
  });

  previousButton.addEventListener('click', () => showPhoto(currentIndex - 1));
  nextButton.addEventListener('click', () => showPhoto(currentIndex + 1));
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      event.stopPropagation();
      showPhoto(currentIndex + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('japan-gallery-open');
    imageRequest += 1;
    image.onload = null;
    image.onerror = null;
    const target = opener;
    opener = null;
    if (target?.isConnected && !target.hidden) target.focus({ preventScroll: true });
  });

  const initiallySelected = filters.find(button => button.getAttribute('aria-pressed') === 'true');
  setFilter(initiallySelected?.dataset.japanFilter || 'all');
})();

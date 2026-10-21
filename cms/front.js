(() => {
  'use strict';

  // GitHub Pages serves the magazine; the existing CMS remains the source of published content.
  const CMS_ORIGIN = 'https://yellowsubmaine-journal.satinymorel.chatgpt.site';

  const categories = {
    life: {label: '生活', english: 'LIFE', note: '日常里的微光，值得一页一页收藏。'},
    journey: {label: '旅程', english: 'JOURNEY', note: '走过的地方，和还想抵达的远方。'},
    reading: {label: '阅读', english: 'READING', note: '读过的故事，留下自己的那一句。'},
    research: {label: '科研', english: 'RESEARCH', note: '让每一个问题，都留下探索的痕迹。'},
    learning: {label: '学习', english: 'LEARNING', note: '把一点点理解，连成自己的知识地图。'}
  };
  const $ = selector => document.querySelector(selector);
  const grid = $('.post-grid');
  const originalCards = [...grid.children].map(card => card.cloneNode(true));
  const originalNote = $('.editorial-note').textContent;
  const artTemplates = new Map(originalCards.map(card => [card.dataset.category, card.querySelector('.post-art').cloneNode(true)]));
  const feedControls = $('.cms-feed-controls');
  const feedStatus = $('.cms-feed-status');
  const moreButton = $('.cms-more-button');
  const story = $('#story-dialog');
  const state = {initialized: null, category: 'all', items: [], total: 0, counts: {}, hasMore: false, version: 0, loading: false, categoryItems: new Map()};
  const photos = {category: 'all', items: [], total: 0, hasMore: false, version: 0, loading: false};
  let activeArticle = null;
  let articleVersion = 0;
  let activePhotoIndex = -1;
  let lastPhotoTrigger = null;
  let toastTimer;

  function element(tag, className, content) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }

  function dateText(value) {
    const date = new Date(value);
    if (!value || !Number.isFinite(date.getTime())) return '日期待补';
    return new Intl.DateTimeFormat('zh-CN', {timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit'}).format(date).replaceAll('/', '.');
  }

  function mediaURL(value) {
    if (typeof value !== 'string') return null;
    try {
      const url = new URL(value, CMS_ORIGIN);
      if (url.protocol !== 'https:' || url.origin !== CMS_ORIGIN || url.username || url.password || url.search || url.hash) return null;
      return /^\/media\/[a-zA-Z0-9_-]{1,80}$/.test(url.pathname) ? CMS_ORIGIN + url.pathname : null;
    } catch { return null; }
  }

  function publicImage(image, src) {
    image.referrerPolicy = 'no-referrer';
    image.src = src;
  }

  async function request(path) {
    const url = new URL(path, CMS_ORIGIN);
    if (url.origin !== CMS_ORIGIN || url.username || url.password || url.hash || !/^\/api\/(posts(?:\/[a-zA-Z0-9_-]{1,80})?|photos)$/.test(url.pathname)) {
      throw new Error('内容地址不受信任。');
    }
    let response;
    try {
      response = await fetch(url.href, {mode: 'cors', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', headers: {Accept: 'application/json'}, cache: 'no-store'});
    } catch { throw new Error('暂时连接不上文章库，请稍后重试。'); }
    let data;
    try { data = await response.json(); } catch { throw new Error('服务暂时没有回应，请稍后重试。'); }
    if (!response.ok || !data.ok) throw new Error(data.error?.message || '暂时无法读取内容，请稍后重试。');
    return data;
  }

  function notify(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
  }

  function emptyState(title, text, retry) {
    const box = element('div', 'cms-empty');
    box.append(element('span', 'cms-empty-mark', '↳'), element('h3', '', title), element('p', '', text));
    if (retry) {
      const button = element('button', 'text-button cms-retry', '重新连接 ↗');
      button.type = 'button';
      button.addEventListener('click', retry);
      box.append(button);
    }
    return box;
  }

  function createCard(item, featured = false) {
    const category = categories[item.category] || categories.life;
    const card = element('article', `post-card cms-post-card${featured ? ' post-featured' : ''}`);
    card.dataset.category = item.category;
    const button = element('button', 'post-open');
    button.type = 'button';
    button.dataset.postId = item.id;
    button.setAttribute('aria-label', `阅读：${item.title}`);
    const art = (artTemplates.get(item.category) || artTemplates.get('life')).cloneNode(true);
    const cover = mediaURL(item.cover_url);
    if (cover) {
      art.className = 'post-art cms-cover-art';
      const image = element('img');
      publicImage(image, cover);
      image.alt = `${item.title}的封面`;
      image.loading = 'lazy';
      image.decoding = 'async';
      art.replaceChildren(image, element('span', 'art-tag', `${category.label} / ${category.english}`));
    } else {
      art.classList.add('cms-editorial-art');
      art.querySelectorAll('img').forEach(image => { image.alt = ''; });
    }
    const copy = element('div', 'post-copy');
    const meta = element('div', 'post-meta', `${category.label}手记`);
    meta.append(element('span', 'meta-right', dateText(item.published_at || item.created_at)));
    const bottom = element('div', 'post-bottom');
    bottom.append(element('span', '', category.english), element('span', '', 'READ STORY ↗'));
    copy.append(meta, element('h3', '', item.title), element('p', '', item.excerpt || category.note), bottom);
    button.append(art, copy);
    card.append(button);
    return card;
  }

  function selectFilter(category) {
    state.category = categories[category] ? category : 'all';
    $('.journal-layout').classList.toggle('is-filtered', state.category !== 'all');
    document.querySelectorAll('[data-filter]').forEach(button => {
      const selected = button.dataset.filter === state.category;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function updateCounts() {
    document.querySelectorAll('[data-filter]').forEach(button => {
      const category = button.dataset.filter;
      let count = button.querySelector('span');
      if (!count) { count = element('span'); button.append(count); }
      const total = state.initialized ? (category === 'all' ? Object.values(state.counts).reduce((sum, n) => sum + Number(n || 0), 0) : state.counts[category] || 0) : category === 'all' ? 5 : 1;
      count.textContent = String(total).padStart(2, '0');
    });
  }

  function showDemos() {
    grid.replaceChildren(...originalCards.map(card => card.cloneNode(true)));
    grid.querySelectorAll('.post-card').forEach(card => { card.hidden = state.category !== 'all' && card.dataset.category !== state.category; });
    $('.editorial-note').textContent = originalNote;
    feedControls.hidden = true;
    $('.random-page').disabled = false;
    updateCounts();
  }

  function renderFeed() {
    grid.replaceChildren();
    if (!state.items.length) {
      const categoryName = categories[state.category]?.label;
      grid.append(emptyState(categoryName ? `这一页${categoryName}，还等着落笔。` : '新的一页，正等着落笔。', '暂时没有公开的手记。故事会在下一次更新时，慢慢浮出水面。'));
    } else state.items.forEach((item, index) => grid.append(createCard(item, index === 0 && state.category === 'all')));
    feedControls.hidden = false;
    feedStatus.textContent = state.items.length ? `已展开 ${state.items.length} / ${state.total} 篇手记` : '故事待续 / TO BE CONTINUED';
    moreButton.hidden = !state.hasMore;
    moreButton.disabled = false;
    moreButton.textContent = '再翻几页 ↓';
    $('.editorial-note').textContent = '这一册随日常更新。公开的文字与照片，会一直留在这里。';
    $('.random-page').disabled = state.items.length === 0;
    updateCounts();
  }

  async function loadFeed(category = state.category, append = false) {
    selectFilter(category);
    const version = ++state.version;
    state.loading = true;
    grid.setAttribute('aria-busy', 'true');
    if (append) { moreButton.disabled = true; moreButton.textContent = '正在翻页…'; }
    else {
      grid.replaceChildren(emptyState('正在翻开手记…', '让这一页的故事，慢慢靠岸。'));
      feedControls.hidden = true;
    }
    try {
      const query = new URLSearchParams({limit: '12', offset: String(append ? state.items.length : 0)});
      if (state.category !== 'all') query.set('category', state.category);
      const data = await request(`/api/posts?${query}`);
      if (version !== state.version) return;
      const previousInitialized = state.initialized;
      state.initialized = Boolean(data.initialized);
      state.counts = data.counts || {};
      state.total = Number(data.total || 0);
      state.hasMore = Boolean(data.has_more);
      state.items = append ? [...state.items, ...(data.items || [])] : (data.items || []);
      if (state.initialized) {
        renderFeed();
        if (previousInitialized !== true) loadCategorySections();
        $('.reading-intro [data-article="reading"]').firstChild.textContent = '翻开阅读手记 ';
      } else {
        showDemos();
        document.querySelectorAll('.cms-category-notes').forEach(panel => { panel.hidden = true; });
      }
    } catch (error) {
      if (version !== state.version) return;
      if (!append) grid.replaceChildren(emptyState('手记暂时没有靠岸。', error.message, () => loadFeed()));
      else { feedStatus.textContent = error.message; moreButton.disabled = false; moreButton.textContent = '重试翻页 ↻'; }
    } finally {
      if (version === state.version) { state.loading = false; grid.setAttribute('aria-busy', 'false'); }
    }
  }

  const categoryPanels = new Map();
  ['journey', 'reading', 'research', 'learning'].forEach(category => {
    const panel = element('div', `cms-category-notes cms-category-${category}`);
    panel.hidden = true;
    panel.setAttribute('aria-label', `最新${categories[category].label}手记`);
    $(`#${category}`).append(panel);
    categoryPanels.set(category, panel);
  });

  function renderCategory(category, items, error) {
    const panel = categoryPanels.get(category);
    panel.replaceChildren();
    panel.hidden = false;
    const heading = element('div', 'cms-category-heading');
    heading.append(element('p', 'eyebrow', `${categories[category].english} / 最新手记`));
    const browse = element('button', 'text-button', '查看全部 ↗');
    browse.type = 'button';
    browse.dataset.browseCategory = category;
    heading.append(browse);
    panel.append(heading);
    if (error) {
      const message = element('p', 'cms-category-empty', '这些手记暂时没有连接上。');
      const retry = element('button', 'text-button', '再试一次 ↻');
      retry.type = 'button';
      retry.addEventListener('click', () => loadCategory(category));
      panel.append(message, retry);
    } else if (!items.length) panel.append(element('p', 'cms-category-empty', `这一册${categories[category].label}，还没有公开的手记。`));
    else {
      const list = element('div', 'cms-note-list');
      items.forEach((item, index) => {
        const button = element('button', 'cms-note-row');
        button.type = 'button';
        button.dataset.postId = item.id;
        const copy = element('span', 'cms-note-copy');
        copy.append(element('strong', '', item.title), element('small', '', item.excerpt || dateText(item.published_at || item.created_at)));
        button.append(element('span', 'cms-note-number', String(index + 1).padStart(2, '0')), copy, element('span', 'cms-note-arrow', '↗'));
        list.append(button);
      });
      panel.append(list);
    }
  }

  async function loadCategory(category) {
    try {
      const data = await request(`/api/posts?category=${category}&limit=3&offset=0`);
      if (!state.initialized) return;
      state.categoryItems.set(category, data.items || []);
      renderCategory(category, data.items || []);
    } catch { if (state.initialized) renderCategory(category, [], true); }
  }

  function loadCategorySections() { return Promise.all(Object.keys(categories).filter(key => key !== 'life').map(loadCategory)); }

  function articleURL(id) {
    const url = new URL(location.href);
    url.searchParams.set('article', id);
    url.hash = '';
    return url;
  }

  function removeArticleURL() {
    const url = new URL(location.href);
    if (!url.searchParams.has('article')) return;
    url.searchParams.delete('article');
    history.replaceState(null, '', url);
  }

  function sanitizeBody(html) {
    if (!window.DOMPurify) throw new Error('阅读组件尚未加载，请刷新后再试。');
    const purifier = window.DOMPurify;
    // Reject unexpected image origins while sanitizing, before any nodes reach the visible document.
    purifier.addHook('uponSanitizeAttribute', (node, attribute) => {
      if (attribute.attrName !== 'src') return;
      const src = node.nodeName === 'IMG' && mediaURL(attribute.attrValue);
      if (src) attribute.attrValue = src;
      else attribute.keepAttr = false;
    });
    let fragment;
    try { fragment = purifier.sanitize(html || '', {
      RETURN_DOM_FRAGMENT: true,
      ALLOWED_TAGS: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'blockquote', 'pre', 'code', 'ul', 'ol', 'li', 'a', 'img', 'hr', 'sub', 'sup', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'data-list'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['svg', 'math', 'style', 'script', 'iframe', 'object', 'form', 'input', 'button'],
      FORBID_ATTR: ['style', 'id', 'name']
    }); } finally { purifier.removeHook('uponSanitizeAttribute'); }
    fragment.querySelectorAll('[class]').forEach(node => {
      const safe = [...node.classList].filter(value => /^(ql-align-(center|right|justify)|ql-indent-[1-8]|ql-code-block|ql-code-block-container)$/.test(value));
      if (safe.length) node.className = safe.join(' '); else node.removeAttribute('class');
    });
    fragment.querySelectorAll('a').forEach(link => {
      try {
        const url = new URL(link.getAttribute('href') || '', CMS_ORIGIN);
        if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) { link.removeAttribute('href'); return; }
        const linkedArticle = url.origin === CMS_ORIGIN && url.pathname === '/' && url.searchParams.get('article');
        link.href = linkedArticle && /^[a-zA-Z0-9_-]{1,80}$/.test(linkedArticle) ? articleURL(linkedArticle).href : url.href;
        if (url.origin !== location.origin) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      } catch { link.removeAttribute('href'); }
    });
    fragment.querySelectorAll('img').forEach(image => {
      const url = mediaURL(image.getAttribute('src'));
      if (!url) { image.remove(); return; }
      publicImage(image, url);
      image.loading = 'lazy';
      image.decoding = 'async';
      image.alt ||= '文章配图';
    });
    return fragment;
  }

  function clearShareTools() { story.querySelector('.cms-share-tools')?.remove(); }

  async function showPost(id, trigger, push = true) {
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(id)) {
      notify('这张手记链接不完整。');
      removeArticleURL();
      return;
    }
    const version = ++articleVersion;
    activeArticle = id;
    window.YellowSubmaineReader?.setTrigger(trigger);
    clearShareTools();
    $('#story-kicker').textContent = 'FIELD NOTE / YELLOWSUBMARINER';
    $('#story-label').textContent = '正在翻开这一页…';
    $('#story-title').textContent = '故事，正在靠岸。';
    $('#story-image').hidden = true;
    $('#story-image').style.backgroundImage = '';
    $('#story-image').replaceChildren();
    $('#story-content').replaceChildren(element('p', '', '正在读取手记，请稍等。'));
    $('#story-content').setAttribute('aria-busy', 'true');
    if (!story.open) story.showModal();
    story.scrollTop = 0;
    document.body.classList.add('modal-open');
    if (push && new URL(location.href).searchParams.get('article') !== id) history.pushState({article: id}, '', articleURL(id));
    try {
      const data = await request(`/api/posts/${encodeURIComponent(id)}`);
      if (version !== articleVersion || !story.open) return;
      const item = data.item;
      const category = categories[item.category] || categories.life;
      const safeBody = sanitizeBody(item.body_html);
      $('#story-label').textContent = `${category.label} / ${dateText(item.published_at || item.created_at)}`;
      $('#story-title').textContent = item.title;
      $('#story-content').replaceChildren(safeBody);
      const cover = mediaURL(item.cover_url);
      if (cover) {
        $('#story-image').hidden = false;
        const image = element('img', 'cms-reader-cover');
        image.alt = `${item.title}的封面`;
        publicImage(image, cover);
        $('#story-image').replaceChildren(image);
        $('#story-image').setAttribute('aria-label', `${item.title}的封面`);
      }
      const share = element('div', 'cms-share-tools');
      const copy = element('button', 'cms-copy-link', '分享这一页 ↗');
      copy.type = 'button';
      const field = element('input', 'cms-share-url');
      field.type = 'url';
      field.readOnly = true;
      field.value = articleURL(id).href;
      field.setAttribute('aria-label', '这篇手记的分享链接');
      field.hidden = true;
      copy.addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(field.value); notify('链接已复制，把这一页分享出去吧。'); }
        catch { field.hidden = false; field.focus(); field.select(); notify('请复制选中的手记链接。'); }
      });
      share.append(element('span', '', `${category.english} / 一页公开手记`), copy, field);
      $('.story-end').before(share);
    } catch (error) {
      if (version !== articleVersion || !story.open) return;
      $('#story-label').textContent = '这一页暂时无法打开';
      $('#story-title').textContent = '故事暂时没有靠岸。';
      $('#story-content').replaceChildren(emptyState('稍后再来看看。', error.message, () => showPost(id, trigger, false)));
    } finally { if (version === articleVersion) $('#story-content').setAttribute('aria-busy', 'false'); }
  }

  // Use capture here so the original starter-note handlers never open after initialization.
  document.addEventListener('click', event => {
    const filter = event.target.closest('[data-filter]');
    if (filter) {
      event.preventDefault();
      event.stopImmediatePropagation();
      selectFilter(filter.dataset.filter);
      if (state.initialized === false) showDemos(); else loadFeed(state.category);
      return;
    }
    const browse = event.target.closest('[data-browse-category]');
    if (browse) {
      event.preventDefault();
      loadFeed(browse.dataset.browseCategory);
      $('#journal').scrollIntoView({behavior: 'smooth', block: 'start'});
      return;
    }
    const post = event.target.closest('[data-post-id]');
    if (post) { event.preventDefault(); showPost(post.dataset.postId, post); return; }
    const demo = event.target.closest('[data-article]');
    if (demo && categories[demo.dataset.article]) {
      if (state.initialized !== false) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (state.initialized === null) { notify('手记正在加载，请稍等片刻。'); return; }
        const category = demo.dataset.article;
        const item = state.categoryItems.get(category)?.[0] || state.items.find(item => item.category === category);
        if (item) showPost(item.id, demo);
        else { loadFeed(category); $('#journal').scrollIntoView({behavior: 'smooth'}); }
      }
      return;
    }
    if (event.target.closest('.random-page') && state.initialized !== false) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (state.items.length) showPost(state.items[Math.floor(Math.random() * state.items.length)].id, event.target.closest('button'));
      else notify(state.loading ? '手记正在加载，请稍等片刻。' : '下一页故事，留给下一次更新。');
    }
  }, true);

  moreButton.addEventListener('click', () => { if (!state.loading) loadFeed(state.category, true); });
  story.addEventListener('close', () => {
    articleVersion++;
    if (activeArticle) removeArticleURL();
    activeArticle = null;
    clearShareTools();
  });
  document.addEventListener('ys:demo-open', () => { activeArticle = null; articleVersion++; clearShareTools(); removeArticleURL(); });
  window.addEventListener('popstate', () => {
    const id = new URL(location.href).searchParams.get('article');
    if (id) showPost(id, null, false);
    else if (activeArticle && story.open) story.close();
  });

  // The photo roll stays independent from article covers and private attachments.
  const gallery = element('section', 'cms-gallery section-space');
  gallery.id = 'photos';
  gallery.setAttribute('aria-labelledby', 'photos-heading');
  const galleryHeading = element('div', 'section-heading');
  const galleryHeadingCopy = element('div');
  galleryHeadingCopy.append(element('p', 'eyebrow', '06 / MOMENTS IN THE LIGHT'));
  const galleryTitle = element('h2', '', '把瞬间，留在这一格');
  galleryTitle.id = 'photos-heading';
  galleryTitle.append(element('span', 'heading-dot', '.'));
  galleryHeadingCopy.append(galleryTitle);
  galleryHeading.append(galleryHeadingCopy, element('span', 'section-side-note', '不只文字，也有光落下来的样子。'));
  const photoFilters = element('div', 'cms-photo-filters');
  photoFilters.setAttribute('role', 'group');
  photoFilters.setAttribute('aria-label', '按栏目筛选照片');
  [['all', '全部瞬间'], ...Object.entries(categories).map(([key, value]) => [key, value.label])].forEach(([key, label]) => {
    const button = element('button', key === 'all' ? 'active' : '', label);
    button.type = 'button';
    button.dataset.photoFilter = key;
    button.setAttribute('aria-pressed', String(key === 'all'));
    button.addEventListener('click', () => loadPhotos(key));
    photoFilters.append(button);
  });
  const photoGrid = element('div', 'cms-photo-grid');
  photoGrid.setAttribute('aria-live', 'polite');
  const photoFooter = element('div', 'cms-gallery-footer');
  const photoStatus = element('p', 'cms-feed-status');
  photoStatus.setAttribute('role', 'status');
  const photoMore = element('button', 'cms-more-button', '再显影几张 ↓');
  photoMore.type = 'button';
  photoMore.hidden = true;
  photoMore.addEventListener('click', () => { if (!photos.loading) loadPhotos(photos.category, true); });
  photoFooter.append(photoStatus, photoMore);
  gallery.append(galleryHeading, photoFilters, photoGrid, photoFooter);
  $('.mind-grid').after(gallery);

  function renderPhotos() {
    photoGrid.replaceChildren();
    if (!photos.items.length) photoGrid.append(emptyState('相册还在等第一张照片。', '走过的路、停留的下午，会慢慢在这里显影。'));
    photos.items.forEach((item, index) => {
      const src = mediaURL(item.url);
      if (!src) return;
      const figure = element('figure', 'cms-photo-card');
      const button = element('button', 'cms-photo-open');
      button.type = 'button';
      button.setAttribute('aria-label', `放大照片：${item.alt || item.caption || categories[item.category]?.label || '日常瞬间'}`);
      const image = element('img');
      publicImage(image, src);
      image.alt = item.alt || item.caption || '日常瞬间';
      image.loading = 'lazy';
      image.decoding = 'async';
      button.append(image, element('span', 'cms-photo-zoom', '↗'));
      button.addEventListener('click', () => openPhoto(index, button));
      const caption = element('figcaption');
      const label = element('div', 'cms-photo-label');
      label.append(element('span', '', categories[item.category]?.label || '生活'), element('small', '', String(index + 1).padStart(2, '0')));
      caption.append(label, element('p', '', item.caption || item.alt || '一个值得留下的瞬间'));
      figure.append(button, caption);
      photoGrid.append(figure);
    });
    photoStatus.textContent = photos.items.length ? `${photos.items.length} / ${photos.total} 张公开照片 · 点击照片，放大这一刻` : 'PHOTO LOG / 待显影';
    photoMore.hidden = !photos.hasMore;
    photoMore.disabled = false;
    photoMore.textContent = '再显影几张 ↓';
  }

  async function loadPhotos(category = photos.category, append = false) {
    photos.category = categories[category] ? category : 'all';
    const version = ++photos.version;
    photos.loading = true;
    photoGrid.setAttribute('aria-busy', 'true');
    photoFilters.querySelectorAll('button').forEach(button => {
      const active = button.dataset.photoFilter === photos.category;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (append) { photoMore.disabled = true; photoMore.textContent = '正在显影…'; }
    else { photoGrid.replaceChildren(emptyState('照片，正在显影。', '稍等片刻，把这一格日常翻开。')); photoMore.hidden = true; photoStatus.textContent = ''; }
    try {
      const query = new URLSearchParams({limit: '12', offset: String(append ? photos.items.length : 0)});
      if (photos.category !== 'all') query.set('category', photos.category);
      const data = await request(`/api/photos?${query}`);
      if (version !== photos.version) return;
      photos.items = append ? [...photos.items, ...(data.items || [])] : (data.items || []);
      photos.total = Number(data.total || 0);
      photos.hasMore = Boolean(data.has_more);
      renderPhotos();
    } catch (error) {
      if (version !== photos.version) return;
      if (!append) photoGrid.replaceChildren(emptyState('照片暂时没有连接上。', error.message, () => loadPhotos()));
      else { photoStatus.textContent = error.message; photoMore.disabled = false; photoMore.textContent = '重试显影 ↻'; }
    } finally { if (version === photos.version) { photos.loading = false; photoGrid.setAttribute('aria-busy', 'false'); } }
  }

  const lightbox = element('dialog', 'cms-lightbox');
  lightbox.id = 'photo-dialog';
  lightbox.setAttribute('aria-label', '照片放大查看');
  const lightboxTop = element('div', 'cms-lightbox-top');
  const lightboxCount = element('span', '', 'PHOTO LOG');
  const lightboxClose = element('button', 'icon-button', '×');
  lightboxClose.type = 'button';
  lightboxClose.setAttribute('aria-label', '关闭照片');
  lightboxClose.addEventListener('click', () => lightbox.close());
  lightboxTop.append(lightboxCount, lightboxClose);
  const lightboxImage = element('img', 'cms-lightbox-image');
  const lightboxBottom = element('div', 'cms-lightbox-bottom');
  const lightboxCaption = element('p');
  const lightboxNavigation = element('div', 'cms-lightbox-navigation');
  const previousPhoto = element('button', 'icon-button', '←');
  previousPhoto.type = 'button';
  previousPhoto.setAttribute('aria-label', '上一张照片');
  const nextPhoto = element('button', 'icon-button', '→');
  nextPhoto.type = 'button';
  nextPhoto.setAttribute('aria-label', '下一张照片');
  lightboxNavigation.append(previousPhoto, nextPhoto);
  lightboxBottom.append(lightboxCaption, lightboxNavigation);
  lightbox.append(lightboxTop, lightboxImage, lightboxBottom);
  document.body.append(lightbox);

  function openPhoto(index, trigger) {
    const item = photos.items[index];
    const src = item && mediaURL(item.url);
    if (!src) return;
    activePhotoIndex = index;
    if (trigger) lastPhotoTrigger = trigger;
    publicImage(lightboxImage, src);
    lightboxImage.alt = item.alt || item.caption || '日常瞬间';
    lightboxCaption.textContent = item.caption || item.alt || '一个值得留下的瞬间';
    lightboxCount.textContent = `${categories[item.category]?.english || 'PHOTO LOG'} / ${String(index + 1).padStart(2, '0')} OF ${String(photos.items.length).padStart(2, '0')}`;
    previousPhoto.hidden = nextPhoto.hidden = photos.items.length < 2;
    if (!lightbox.open) lightbox.showModal();
    document.body.classList.add('modal-open');
  }
  previousPhoto.addEventListener('click', () => openPhoto((activePhotoIndex - 1 + photos.items.length) % photos.items.length));
  nextPhoto.addEventListener('click', () => openPhoto((activePhotoIndex + 1) % photos.items.length));
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); previousPhoto.click(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); nextPhoto.click(); }
  });
  lightbox.addEventListener('click', event => {
    if (event.target !== lightbox) return;
    const rect = lightbox.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    if (!story.open) document.body.classList.remove('modal-open');
    lightboxImage.removeAttribute('src');
    if (lastPhotoTrigger && document.contains(lastPhotoTrigger)) lastPhotoTrigger.focus({preventScroll: true});
  });

  loadFeed();
  loadPhotos();
  const initialArticle = new URL(location.href).searchParams.get('article');
  if (initialArticle) showPost(initialArticle, null, false);
  window.addEventListener('pageshow', event => {
    if (event.persisted) { loadFeed(); loadPhotos(); if (state.initialized) loadCategorySections(); }
  });
})();

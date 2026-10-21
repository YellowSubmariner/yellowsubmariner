'use strict';
const root = document.documentElement;
const themeButton = document.querySelector('.theme-button');
function setTheme(theme) {
  if (theme === 'dark') root.dataset.theme = 'dark'; else delete root.dataset.theme;
  themeButton.setAttribute('aria-label', theme === 'dark' ? '切换到日航模式' : '切换到夜航模式');
  themeButton.setAttribute('aria-pressed', String(theme === 'dark'));
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#182c27' : '#f7f5ed';
}
try { setTheme(localStorage.getItem('ys-theme') || 'light'); } catch { setTheme('light'); }
themeButton.addEventListener('click', () => {
  const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  setTheme(theme);
  try { localStorage.setItem('ys-theme', theme); } catch { /* Private browsing may disable storage. */ }
});

const menuButton = document.querySelector('.menu-button');
const mainNav = document.querySelector('.main-nav');
function closeMenu() {
  mainNav.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', '展开导航');
}
menuButton.addEventListener('click', () => {
  const open = !mainNav.classList.contains('open');
  mainNav.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? '收起导航' : '展开导航');
});
mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

document.querySelectorAll('[data-filter]').forEach(button => {
  button.addEventListener('click', () => {
    const category = button.dataset.filter;
    document.querySelector('.journal-layout').classList.toggle('is-filtered', category !== 'all');
    document.querySelectorAll('[data-filter]').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.post-card').forEach(card => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
    });
  });
});

const articles = {
  "life": {
    "label": "生活 / 开篇示例",
    "title": "生活记录",
    "image": "assets/hero.png",
    "content": "<p>记录校园生活、日常照片和随想。</p>"
  },
  "journey": {
    "label": "旅程 / 开篇示例",
    "title": "旅行笔记",
    "image": "assets/ocean.jpg",
    "content": "<p>记录路线、旅行照片与巡礼计划。</p><p>江之岛、千叶和丰桥是目前想去的目的地。</p>"
  },
  "reading": {
    "label": "阅读 / 开篇示例",
    "title": "阅读笔记",
    "content": "<p>书摘、书评与阅读笔记。</p><ul><li>小说与轻小说</li><li>随笔与人文</li><li>技术与科学</li></ul>"
  },
  "research": {
    "label": "科研 / 开篇示例",
    "title": "科研笔记",
    "content": "<p>论文阅读、项目与实验记录。</p><ul><li>论文摘要与阅读笔记</li><li>项目过程与阶段总结</li><li>方法、结果与复现记录</li></ul>"
  },
  "learning": {
    "label": "学习 / 开篇示例",
    "title": "学习笔记",
    "content": "<p>课程笔记、代码与复习整理。</p><ul><li>数学与专业课程笔记</li><li>Python、数据处理与代码练习</li><li>习题、错题与考前整理</li></ul>"
  },
  "enoshima": {
    "label": "巡礼计划 / 尚未出发",
    "title": "江之岛",
    "image": "assets/ocean.jpg",
    "content": "<p>《青春猪头少年》相关巡礼灵感：海岸、电车与城市漫步。</p><p>尚未出发，路线待整理。</p><p><a href=\"https://ao-buta.com/\" target=\"_blank\" rel=\"noopener noreferrer\">作品官网 ↗</a></p>"
  },
  "chiba": {
    "label": "巡礼计划 / 尚未出发",
    "title": "千叶",
    "content": "<p>《我的青春恋爱物语果然有问题》相关巡礼灵感。</p><p>尚未出发，路线待整理。</p><p><a href=\"https://www.tbs.co.jp/anime/oregairu/\" target=\"_blank\" rel=\"noopener noreferrer\">作品官网 ↗</a></p>"
  },
  "toyohashi": {
    "label": "巡礼计划 / 尚未出发",
    "title": "丰桥",
    "image": "assets/makeine.jpg",
    "content": "<p>《败犬女主太多了！》相关巡礼灵感：街道、小店与城市风景。</p><p>尚未出发，路线待整理。</p><p><a href=\"https://makeine-anime.com/\" target=\"_blank\" rel=\"noopener noreferrer\">作品官网 ↗</a></p>"
  },
  "aobuta": {
    "label": "ACG / FILM 01",
    "title": "青春猪头少年",
    "image": "assets/aobuta.png",
    "content": "<p>角色、剧情感想与巡礼灵感。</p><p><a href=\"https://ao-buta.com/\" target=\"_blank\" rel=\"noopener noreferrer\">作品官网 ↗</a></p><p>作品视觉版权归相关权利方所有。</p>"
  },
  "oregairu": {
    "label": "ACG / FILM 02",
    "title": "我的青春恋爱物语果然有问题",
    "image": "assets/oregairu.png",
    "content": "<p>角色关系、剧情与喜欢的片段。</p><p><a href=\"https://www.tbs.co.jp/anime/oregairu/\" target=\"_blank\" rel=\"noopener noreferrer\">作品官网 ↗</a></p><p>作品视觉版权归相关权利方所有。</p>"
  },
  "makeine": {
    "label": "ACG / FILM 03",
    "title": "败犬女主太多了！",
    "image": "assets/makeine.jpg",
    "content": "<p>动画感想、角色与丰桥巡礼灵感。</p><p><a href=\"https://makeine-anime.com/\" target=\"_blank\" rel=\"noopener noreferrer\">作品官网 ↗</a></p><p>作品视觉版权归相关权利方所有。</p>"
  }
};

const storyDialog = document.querySelector('#story-dialog');
const storyImage = document.querySelector('#story-image');
let lastStoryTrigger;
function openArticle(id, trigger) {
  const article = articles[id];
  if (!article) return;
  document.dispatchEvent(new CustomEvent('ys:demo-open', {detail: {id}}));
  lastStoryTrigger = trigger || document.activeElement;
  document.querySelector('#story-label').textContent = article.label;
  document.querySelector('#story-title').textContent = article.title;
  document.querySelector('#story-kicker').textContent = id === 'aobuta' || id === 'oregairu' || id === 'makeine' ? 'ACG / YELLOWSUBMARINER' : 'ARTICLE / YELLOWSUBMARINER';
  document.querySelector('#story-content').innerHTML = article.content;
  storyImage.replaceChildren();
  storyImage.hidden = !article.image;
  storyImage.style.backgroundImage = article.image ? `url("${article.image}")` : '';
  storyImage.setAttribute('role', 'img');
  storyImage.setAttribute('aria-label', article.image ? article.title + ' 配图' : '');
  storyDialog.showModal();
  storyDialog.scrollTop = 0;
  document.body.classList.add('modal-open');
}
document.addEventListener('click', event => {
  const button = event.target.closest('[data-article]');
  if (button) openArticle(button.dataset.article, button);
});
document.querySelector('.random-page').addEventListener('click', event => {
  const ids = ['life', 'journey', 'reading', 'research', 'learning'];
  openArticle(ids[Math.floor(Math.random() * ids.length)], event.currentTarget);
});
document.querySelector('.dialog-close').addEventListener('click', () => storyDialog.close());
storyDialog.addEventListener('click', event => {
  if (event.target !== storyDialog) return;
  const rect = storyDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) storyDialog.close();
});
storyDialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  if (lastStoryTrigger && document.contains(lastStoryTrigger)) lastStoryTrigger.focus({preventScroll: true});
});

// The live journal shares this accessible reader with the original ACG notes.
window.YellowSubmaineReader = {
  setTrigger(trigger) { lastStoryTrigger = trigger || document.activeElement; }
};

const quotes = ['小说与轻小说<br>故事、角色与读后感。', '随笔与人文<br>观点、书摘与阅读记录。', '技术与科学<br>概念、方法与实践笔记。'];
let currentQuote = 0;
document.querySelector('#next-page').addEventListener('click', () => {
  currentQuote = (currentQuote + 1) % quotes.length;
  document.querySelector('#reading-quote').innerHTML = quotes[currentQuote];
  document.querySelector('#reading-number').textContent = `0${currentQuote + 1} / 03`;
});

const studyContent = {
  "foundation": [
    [
      "数学",
      "高等数学 · 线性代数 · 概率统计"
    ],
    [
      "编程",
      "Python · 数据结构与算法"
    ],
    [
      "专业基础",
      "数据库 · 数据分析与建模"
    ]
  ],
  "practice": [
    [
      "Python",
      "脚本与数据处理"
    ],
    [
      "数据分析",
      "清洗、可视化与建模练习"
    ],
    [
      "代码项目",
      "课程作业与小项目"
    ]
  ],
  "review": [
    [
      "课程整理",
      "章节提纲与笔记"
    ],
    [
      "习题与错题",
      "解题步骤与错误整理"
    ],
    [
      "阶段复习",
      "考前清单与课程回顾"
    ]
  ]
};
const studyTabs = [...document.querySelectorAll('[data-study]')];
function selectStudyTab(button, focus = false) {
  studyTabs.forEach(tab => {
    const selected = tab === button;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  const panel = document.querySelector('#study-panel');
  panel.setAttribute('aria-labelledby', button.id);
  panel.innerHTML = studyContent[button.dataset.study].map((row, index) => `<div class="study-row"><span>0${index + 1}</span><div><h3>${row[0]}</h3><p>${row[1]}</p></div><b aria-hidden="true">·</b></div>`).join('');
  if (focus) button.focus();
}
studyTabs.forEach((button, index) => {
  button.addEventListener('click', () => selectStudyTab(button));
  button.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % studyTabs.length;
    if (event.key === 'ArrowLeft') next = (index + studyTabs.length - 1) % studyTabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = studyTabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectStudyTab(studyTabs[next], true); }
  });
});

if ('IntersectionObserver' in window) {
  const navLinks = [...document.querySelectorAll('[data-nav]')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        const active = link.dataset.nav === entry.target.id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    });
  }, {rootMargin: '-12% 0px -58% 0px', threshold: 0});
  ['journal', 'journey', 'reading', 'research', 'learning'].forEach(id => observer.observe(document.getElementById(id)));
}

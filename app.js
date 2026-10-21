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
  life: {
    label: '生活 / 首航日 · 2026.10.21', title: '给平凡的一天，留一个特别的角落', image: 'assets/hero.png',
    content: '<p>这是 YellowSubmariner 小站的第一页。</p><p>这里会有生活、旅程、阅读、科研和学习。它们看起来是五个栏目，其实也可以是同一天的五种打开方式：认真生活，保持好奇，给喜欢的东西留一点位置。</p><h3>先把这一页翻开</h3><p>不用等到一次盛大的旅行、一个漂亮的结果，或一段足够完整的故事，才开始记录。一个想追问的问题、一句不想忘掉的话，都可以成为开头。</p><p>这艘小艇暂时没有目的港。希望以后回头看，能从这些零零碎碎的文字里，认出一路走来的自己。</p><p>真实的日常，会在后续慢慢填进来。</p>'
  },
  journey: {
    label: '旅程 / 灵感路线 · 尚未出发', title: '下一站，去故事发生的地方', image: 'assets/ocean.jpg',
    content: '<p>有些地名先出现在故事里，然后才出现在地图上。海边的电车、放课后的街角、阳光照进来的小店，会让人想知道：如果站在那里，风会是什么样的？</p><h3>把「有一天」先记下来</h3><ul><li>江之岛：让海风与电车，成为一页慢慢走的旅行笔记。</li><li>千叶：留一点时间给海边、街道，以及没有安排的下午。</li><li>丰桥：从喜欢的青春故事出发，重新认识一座日常的城市。</li></ul><p>这是目的地灵感清单，并非已经完成的旅行。具体的路线、季节和预算，留给真正决定出发的那一天。</p><p>不急着给每一处风景盖章。先找到自己想去的理由，就已经是旅程的开始。</p>'
  },
  reading: {
    label: '阅读 / 书架计划', title: '在别人的故事里，看见更大的世界',
    content: '<p>书架可以有很多种秩序。按作者、按颜色、按读过与未读，也可以按此刻想靠近怎样的世界。</p><h3>给书架留三层</h3><p>一层留给小说与故事，让生活里没有经历过的部分，也能在文字里找到回声。</p><p>一层留给随笔与人文，听不同的人如何描述同一个世界，不急着把每一种感受都归纳成结论。</p><p>还有一层留给技术与科学。读到一个公式或方法时，试着问：它想解决的，究竟是一个什么问题？</p><h3>写下自己的那一句</h3><p>以后的阅读记录可以很短：一本书、一个片段、一个想到的问题，以及为什么愿意在这里停留。书单与阅读记录，会在这里慢慢长出来。</p>'
  },
  research: {
    label: '科研 / 探索草稿', title: '数据的另一端，是怎样的世界？',
    content: '<p>对一个刚开始积累的研究笔记本来说，最好的第一页，也许不是结论，而是一个愿意反复追问的问题。</p><h3>先问清楚，再开始</h3><p>这个现象为什么值得理解？手里的数据能说明什么，又遗漏了什么？一个看起来漂亮的结果，是否真的回答了最初的问题？</p><h3>让尝试留下痕迹</h3><p>以后这里可以记录论文阅读、实验设计、方法复现，以及走不通的路线。每篇笔记尽量保留问题、假设、过程、结果与局限，让下一次尝试可以从上一次的理解出发。</p><p>研究笔记从这里起步。先把问题收好，让理解在后续的阅读与实验里慢慢生长。</p>'
  },
  learning: {
    label: '学习 / 方法草稿', title: '知识不是孤岛，笔记也不应该是',
    content: '<p>有时候，看懂一页内容和真正会用它，中间还有一段距离。把这段距离记下来，可能比把笔记抄得整整齐齐更有用。</p><h3>用三个问题写一页笔记</h3><ul><li>它是什么：用自己的话解释，不依赖原文的句子。</li><li>它和什么有关：找一个例子，把它连到已经理解的知识上。</li><li>我哪里还不确定：把疑问留下，作为下一次学习的入口。</li></ul><p>数学基础、编程工具、数据处理和模型方法，可以在这里慢慢连接起来。比起给每一项技能打上「掌握」的标签，更想保留理解是怎样一点点发生的。</p><p>这个栏目会从基础开始，一点点积累课程笔记与实践记录。</p>'
  },
  enoshima: {
    label: '目的地灵感 01 / 尚未出发', title: '江之岛：去海风吹来的方向', image: 'assets/ocean.jpg',
    content: '<p>从《青春猪头少年》延伸出来的第一张目的地便签，留给湘南与江之岛一带的海边氛围。</p><h3>给未来的自己留张便签</h3><ul><li>给沿海电车和步行留出足够的时间。</li><li>想看看现实里的海，与动画里想象的海，有什么不同。</li><li>不只寻找熟悉的画面，也认真看一看路上原本就存在的生活。</li></ul><p>这是灵感记录，尚未形成实际行程。出发前再确认开放时间、交通与天气，把计划交还给真实的那一天。</p><p><a href="https://ao-buta.com/" target="_blank" rel="noopener noreferrer">从《青春猪头少年》官方网站开始 ↗</a></p>'
  },
  chiba: {
    label: '目的地灵感 02 / 尚未出发', title: '千叶：把一个下午留给放课后',
    content: '<p>《我的青春恋爱物语果然有问题》让「放课后」变成了一种很具体的气氛：对话、沉默，以及那些不容易说清楚的心意。</p><h3>路线还没有写完</h3><p>如果有一天去千叶，希望留一段不用追赶时间的下午。沿着街道慢慢走，看看学校之外的城市，也给海边和日落留一个位置。</p><p>这张便签记录的是旅行灵感，并非到访经历或已经验证的圣地巡礼攻略。</p><p><a href="https://www.tbs.co.jp/anime/oregairu/" target="_blank" rel="noopener noreferrer">去春物的官方网站看看 ↗</a></p>'
  },
  toyohashi: {
    label: '目的地灵感 03 / 尚未出发', title: '丰桥：在街角遇见故事的余温', image: 'assets/makeine.jpg',
    content: '<p>《败犬女主太多了！》给丰桥加上了一层很明亮的青春滤镜。日常的街道、小店和城市风景，也可以成为一个故事让人想念的部分。</p><h3>先收下这份好奇心</h3><p>想把这座城市放进未来的清单里：不用急着完成一张打卡表，先让自己在日常的风景里停留一会儿。</p><p>当前只是目的地灵感。真正出发前，再核实地点、营业信息和交通路线，尊重居民的日常与拍摄边界。</p><p><a href="https://makeine-anime.com/" target="_blank" rel="noopener noreferrer">从《败犬女主太多了！》官方网站开始 ↗</a></p>'
  },
  aobuta: {
    label: '私人放映室 / FILM 01', title: '青春猪头少年', image: 'assets/aobuta.png',
    content: '<p>有些情绪说不清楚，却依然真实存在。有些人看起来很远，其实只是等待一句认真听见的话。</p><p>这个位置留给《青春猪头少年》：海风、日常，以及那些借着不可思议的故事，慢慢变得能够被理解的心事。</p><h3>留给以后的一页</h3><p>这里可以慢慢收进喜欢的片段、角色感想和巡礼灵感。现在先留下一张入场券，让故事的余温有个地方停靠。</p><p><a href="https://ao-buta.com/" target="_blank" rel="noopener noreferrer">作品官方网站 ↗</a></p><p>本卡片视觉来自作品官方网站，版权归原作者及相关权利方所有。站内文字为原创栏目开篇。</p>'
  },
  oregairu: {
    label: '私人放映室 / FILM 02', title: '我的青春恋爱物语果然有问题', image: 'assets/oregairu.png',
    content: '<p>青春里的很多问题，没有一眼就能看出来的标准答案。越是想要保护一段关系，有时就越容易说出和真心相反的话。</p><p>这个座位留给春物。留给那些绕来绕去的对话，也留给终于愿意面对自己心意的时刻。</p><h3>关于「真正想要的东西」</h3><p>未来可以在这里慢慢写下角色、关系与对白的感想。现在先让放课后的教室，在这艘小艇上保留一盏灯。</p><p><a href="https://www.tbs.co.jp/anime/oregairu/" target="_blank" rel="noopener noreferrer">作品官方网站 ↗</a></p><p>本卡片视觉来自 TBS 作品官方网站，版权归原作者及相关权利方所有。站内文字为原创栏目开篇。</p>'
  },
  makeine: {
    label: '私人放映室 / FILM 03', title: '败犬女主太多了！', image: 'assets/makeine.jpg',
    content: '<p>没有成为故事里被选中的那个人，生活也不会就此结束。青春还会继续，日常也总有新的热闹与小小的心动。</p><p>这个位置留给《败犬女主太多了！》。喜欢的故事可以很明亮，也可以让一点点失落，拥有轻松而温柔的表达。</p><h3>下一段日常，还在路上</h3><p>这一页先放下开篇的心情。以后可以添上喜欢的片段、画面和读后感，让这张入场券慢慢有自己的折痕。</p><p><a href="https://makeine-anime.com/" target="_blank" rel="noopener noreferrer">作品官方网站 ↗</a></p><p>本卡片视觉来自作品官方网站，版权归原作者及相关权利方所有。站内文字为原创栏目开篇。</p>'
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
  document.querySelector('#story-kicker').textContent = id === 'aobuta' || id === 'oregairu' || id === 'makeine' ? 'PRIVATE CINEMA / YELLOWSUBMARINER' : 'FIELD NOTE / YELLOWSUBMARINER';
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

const quotes = ['暂时没有答案的日子，<br>也可以先积攒一些好问题。', '把世界看得再大一点，<br>把脚下的这一步走好。', '允许进度慢一点，<br>也允许喜欢很久。'];
let currentQuote = 0;
document.querySelector('#next-page').addEventListener('click', () => {
  currentQuote = (currentQuote + 1) % quotes.length;
  document.querySelector('#reading-quote').innerHTML = quotes[currentQuote];
  document.querySelector('#reading-number').textContent = `0${currentQuote + 1} / 03`;
});

const studyContent = {
  foundation: [['数学，是理解的地基', '线性代数 · 概率与统计 · 数学分析'], ['数据，是问题的入口', '数据结构 · 数据管理 · 数据处理'], ['把知识连接成自己的地图', '用例子建立直觉，用复盘发现盲点']],
  practice: [['先让一个小想法跑起来', 'Python · 小脚本 · 数据探索'], ['把混乱的数据整理清楚', '清洗 · 检查 · 可视化'], ['留下可以再次运行的过程', '版本记录 · 实验说明 · 复现']],
  review: [['用自己的话，再讲一遍', '概念解释 · 例子 · 反例'], ['把卡住的地方单独记下来', '问题清单 · 错误记录 · 下一步'], ['回头看见理解的变化', '课程回顾 · 笔记连接 · 阶段复盘']]
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

/* -------------------------------------------------------------
 * 全局动态配置
 * ------------------------------------------------------------- */
const LOGO_URL = "头像.png";
const DATA_JSON_URL_PUBLIC = "https://newtutu.dymripper.com/data.json";

/* -------------------------------------------------------------
 * DOM 元素节点获取
 * ------------------------------------------------------------- */
const homeView = document.getElementById('home-view');
const categoryView = document.getElementById('category-view');
const searchView = document.getElementById('search-view');

const catGrid = document.getElementById('catGrid');
const posterGrid = document.getElementById('posterGrid');
const searchResultGrid = document.getElementById('searchResultGrid');

const catTitle = document.getElementById('catTitle');
const catCount = document.getElementById('catCount');
const searchCount = document.getElementById('searchCount');

const crumb = document.getElementById('crumb');
const crumbCurrent = document.getElementById('crumbCurrent');
const backBtn = document.getElementById('backBtn');
const searchInput = document.getElementById('searchInput');

const lightbox = document.getElementById('lightbox');
const lightboxScrollBox = document.getElementById('lightboxScrollBox');
const lightboxCode = document.getElementById('lightboxCode');
const lightboxCatName = document.getElementById('lightboxCatName');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

const customBtn = document.getElementById('customBtn');
const copyCodeOnlyBtn = document.getElementById('copyCodeOnlyBtn');
const themeToggle = document.getElementById('themeToggle');
const hiddenQrWrap = document.getElementById('hiddenQrWrap');

// 用于临时存放当前正在弹窗中浏览的分类及海报数据项
let currentActiveCat = null;
let currentActiveItem = null;

// 当前浏览的这一组图片列表（分类详情页的所有模板，或者搜索结果），用来左右切换
let currentItemList = [];
let currentItemIndex = -1;

// 动态更新底部版权年份
document.getElementById('year').textContent = new Date().getFullYear();

/* -------------------------------------------------------------
 * 高性能 IntersectionObserver 图片视口懒加载逻辑
 * ------------------------------------------------------------- */
const lazyImageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const thumbDiv = entry.target;
      const trueImgUrl = thumbDiv.getAttribute('data-bg');

      if (trueImgUrl) {
        const img = new Image();
        img.src = trueImgUrl;
        img.onload = () => {
          thumbDiv.style.backgroundImage = `url('${trueImgUrl}')`;
          thumbDiv.classList.add('lazy-loaded');
        };
        img.onerror = () => {
          thumbDiv.style.backgroundColor = "var(--line)";
        };
      }
      observer.unobserve(thumbDiv);
    }
  });
}, {
  rootMargin: "0px 0px 500px 0px"
});

/* -------------------------------------------------------------
 * 日夜颜色主题一键切换逻辑
 * ------------------------------------------------------------- */
themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if(isDark) {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.textContent = "MODE: LIGHT";
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.textContent = "MODE: DARK";
  }
});

if(LOGO_URL){
  const logoImg = document.createElement('img');
  logoImg.src = LOGO_URL;
  logoImg.alt = "Logo";
  logoImg.className = 'brand-logo';
  document.getElementById('brand').prepend(logoImg);
}

/* -------------------------------------------------------------
 * 视图渲染与事件交互处理控制流 (Main Functions)
 * ------------------------------------------------------------- */

// A. 渲染首页分类叠纸卡片
function renderHome(){
  catGrid.innerHTML = '';
  DATA.forEach(cat=>{
    const card = document.createElement('button');
    card.className = 'cat-card';
    card.setAttribute('aria-label', '查看' + cat.name);

    const leafBg = cat.image ? `data-bg="${cat.image}"` : '';
    const maskStyle = cat.image
      ? `background:rgba(28,24,19,.65); width:100%; height:100%; position:absolute; inset:0; padding:18px; display:flex; flex-direction:column; justify-content:space-between;`
      : `display:flex; flex-direction:column; justify-content:space-between; padding:18px; height:100%;`;

    card.innerHTML = `
      <div class="stack">
        <div class="leaf"></div>
        <div class="leaf"></div>
        <div class="leaf target-leaf" ${leafBg} style="padding:0; overflow:hidden;">
          <div style="${maskStyle}">
            <div class="top-row"><span style="color:#FFF;">CATALOG</span><span style="color:#FFF;">${String(cat.items.length).padStart(2,'0')}</span></div>
            <div>
              <div class="cat-name" style="color:#FFF;">${cat.name}</div>
              <div class="cat-count" style="color:rgba(241,236,225,.8)"><span>共 ${cat.items.length} 款</span><span>查看 →</span></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const leafElement = card.querySelector('.target-leaf');
    if (cat.image) {
      lazyImageObserver.observe(leafElement);
    }

    card.addEventListener('click', ()=> {
      searchInput.value = '';
      openCategory(cat.key);
    });
    catGrid.appendChild(card);
  });
}

// B. 打开特定分类明细视图
function openCategory(key){
  const cat = DATA.find(c=>c.key===key);
  if(!cat) return;
  catTitle.textContent = cat.name;
  catCount.textContent = `共 ${cat.items.length} 款模板`;
  crumbCurrent.textContent = cat.name;
  crumb.classList.add('show');

  // 这个分类下所有模板组成一个列表，供弹窗左右切换使用
  const fullList = cat.items.map(it => ({ cat, item: it }));

  posterGrid.innerHTML = '';
  cat.items.forEach((item, idx)=>{
    const card = document.createElement('button');
    card.className = 'poster-card';
    card.setAttribute('aria-label', `放大查看 ${item.code}`);

    const itemRatioStyle = item.ratio ? `aspect-ratio:${item.ratio};` : `aspect-ratio:3/4;`;
    const firstImg = (Array.isArray(item.image) && item.image.length > 0) ? item.image[0] : null;

    card.innerHTML = `
      <div class="poster-thumb" data-bg="${firstImg || ''}" style="${firstImg ? '' : 'background:'+item.color}; ${itemRatioStyle}">
        ${firstImg ? '' : `<div class="center-mark">${cat.name}<br>${item.code}</div>`}
        <span class="tag">${item.code}</span>
      </div>
      <div class="poster-meta"><span>${item.code}</span><span>${cat.name}</span></div>
    `;

    const thumbElement = card.querySelector('.poster-thumb');
    if (firstImg) {
      lazyImageObserver.observe(thumbElement);
    }

    card.addEventListener('click', ()=>openLightbox(fullList, idx));
    posterGrid.appendChild(card);
  });

  homeView.classList.add('hide');
  searchView.classList.remove('show');
  categoryView.classList.add('show');
  window.scrollTo({top:0, behavior:'smooth'});
}

// C. 模糊搜索功能监听事件（支持分类名或产品编号混合过滤）
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim().toLowerCase();

  if (query === '') {
    searchView.classList.remove('show');
    if (crumb.classList.contains('show')) {
      categoryView.classList.add('show');
      homeView.classList.add('hide');
    } else {
      homeView.classList.remove('hide');
      categoryView.classList.remove('show');
    }
    return;
  }

  homeView.classList.add('hide');
  categoryView.classList.remove('show');
  searchView.classList.add('show');

  searchResultGrid.innerHTML = '';
  let matchCount = 0;
  const searchResultsList = []; // 这一批搜索结果组成一个列表，供弹窗左右切换使用

  DATA.forEach(cat => {
    cat.items.forEach(item => {
      const matchCode = item.code.toLowerCase().includes(query);
      const matchCatName = cat.name.toLowerCase().includes(query);

      if (matchCode || matchCatName) {
        matchCount++;
        searchResultsList.push({ cat, item });
        const thisIndex = searchResultsList.length - 1;

        const card = document.createElement('button');
        card.className = 'poster-card';

        const itemRatioStyle = item.ratio ? `aspect-ratio:${item.ratio};` : `aspect-ratio:3/4;`;
        const firstImg = (Array.isArray(item.image) && item.image.length > 0) ? item.image[0] : null;

        card.innerHTML = `
          <div class="poster-thumb" data-bg="${firstImg || ''}" style="${firstImg ? '' : 'background:'+item.color}; ${itemRatioStyle}">
            ${firstImg ? '' : `<div class="center-mark">${cat.name}<br>${item.code}</div>`}
            <span class="tag">${item.code}</span>
          </div>
          <div class="poster-meta"><span>${item.code}</span><span>${cat.name}</span></div>
        `;

        const thumbElement = card.querySelector('.poster-thumb');
        if (firstImg) { lazyImageObserver.observe(thumbElement); }

        card.addEventListener('click', () => openLightbox(searchResultsList, thisIndex));
        searchResultGrid.appendChild(card);
      }
    });
  });

  searchCount.textContent = `找到 ${matchCount} 款相关模板`;
});

// D. 关闭子分类视图返回大厅
function closeCategory(){
  searchInput.value = '';
  searchView.classList.remove('show');
  homeView.classList.remove('hide');
  categoryView.classList.remove('show');
  crumb.classList.remove('show');
  window.scrollTo({top:0, behavior:'smooth'});
}

// E. 唤起全屏大图预览弹窗（接收当前浏览的整组列表 + 当前是第几张，用来支持左右切换）
function openLightbox(list, index){
  currentItemList = list;
  currentItemIndex = index;
  const { cat, item } = list[index];
  currentActiveCat = cat;
  currentActiveItem = item;

  // 只有一张图时隐藏左右箭头，避免多余的按钮
  const onlyOne = list.length <= 1;
  lightboxPrev.style.display = onlyOne ? 'none' : 'flex';
  lightboxNext.style.display = onlyOne ? 'none' : 'flex';

  lightboxScrollBox.innerHTML = '';

  if(hiddenQrWrap) {
    customBtn.style.background = "var(--accent)";
    customBtn.style.color = "#F1ECE1";
    customBtn.style.border = "none";
    customBtn.style.fontSize = "14px";
    customBtn.style.transform = "none";
    customBtn.style.boxShadow = "0 4px 12px rgba(200,71,43,.3)";
    customBtn.innerHTML = "✂️ 复制定制信息并联系";
    hiddenQrWrap.style.opacity = "0";
    hiddenQrWrap.style.maxHeight = "0";
    hiddenQrWrap.style.marginTop = "0";
    lightboxCatName.style.marginTop = "0px";
  }

  const images = Array.isArray(item.image) ? item.image : [item.image];

  if (images.length > 0 && images[0]) {
    images.forEach(imgUrl => {
      const wrapper = document.createElement('div');
      wrapper.className = 'secure-img-wrapper';

      const img = document.createElement('img');
      img.alt = item.code;
      img.setAttribute('data-src', imgUrl);

      wrapper.appendChild(img);
      lightboxScrollBox.appendChild(wrapper);
    });
  } else {
    const fallback = document.createElement('div');
    fallback.className = 'lightbox-img-fallback';
    fallback.style.background = item.color;
    fallback.innerHTML = `<div class="center-mark">${cat.name} ${item.code}</div>`;
    lightboxScrollBox.appendChild(fallback);
  }

  lightboxCode.textContent = "编号：" + item.code;
  lightboxCatName.textContent = "分类：" + cat.name;

  lightbox.classList.add('show');
  document.body.style.overflow = 'hidden';
  lightboxScrollBox.scrollTop = 0;

  setTimeout(() => {
    const pendingImages = lightboxScrollBox.querySelectorAll('img[data-src]');
    pendingImages.forEach(img => {
      const realSrc = img.getAttribute('data-src');
      img.src = realSrc;

      img.onload = function() {
        img.classList.add('loaded');
        img.parentElement.classList.add('loading-done');
      };
    });
  }, 150);
}

// F. 释放弹窗还原页面
function closeLightbox(){
  lightbox.classList.remove('show');
  document.body.style.overflow = '';
}

// G. 左右切换：在当前列表里往前/往后挪一位，翻到头/尾自动循环
function showPrevImage(){
  if (currentItemList.length <= 1) return;
  const newIndex = (currentItemIndex - 1 + currentItemList.length) % currentItemList.length;
  openLightbox(currentItemList, newIndex);
}
function showNextImage(){
  if (currentItemList.length <= 1) return;
  const newIndex = (currentItemIndex + 1) % currentItemList.length;
  openLightbox(currentItemList, newIndex);
}

/* -------------------------------------------------------------
 * 系统级剪贴板读写与按钮原地转换无弹窗长按方案实现 (Interaction)
 * ------------------------------------------------------------- */
customBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if(!currentActiveCat || !currentActiveItem) return;

  const textToCopy = `【荼荼工作室】定制模板需求：\n-------------------------\n分类：${currentActiveCat.name}\n编号：${currentActiveItem.code}`;

  navigator.clipboard.writeText(textToCopy).then(() => {
    triggerButtonTransform();
  }).catch(err => {
    triggerButtonTransform();
  });
});

function triggerButtonTransform() {
  customBtn.style.background = "var(--paper-deep)";
  customBtn.style.color = "var(--ink-soft)";
  customBtn.style.border = "1.5px solid var(--ink)";
  customBtn.style.boxShadow = "none";
  customBtn.style.fontSize = "11px";
  customBtn.innerHTML = "🎉 复制成功！请长按下方二维码加微信";
  customBtn.style.transform = "translateY(-6px)";

  if(hiddenQrWrap) {
    hiddenQrWrap.style.opacity = "1";
    hiddenQrWrap.style.marginTop = "14px";
    hiddenQrWrap.style.maxHeight = "none";
    const naturalHeight = hiddenQrWrap.scrollHeight;
    hiddenQrWrap.style.maxHeight = "0px";
    void hiddenQrWrap.offsetHeight;
    hiddenQrWrap.style.maxHeight = naturalHeight + "px";
  }
}

copyCodeOnlyBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if(!currentActiveItem) return;
  navigator.clipboard.writeText(currentActiveItem.code).then(() => {
    const originalText = copyCodeOnlyBtn.textContent;
    copyCodeOnlyBtn.textContent = "✓ 已复制";
    setTimeout(() => { copyCodeOnlyBtn.textContent = originalText; }, 1500);
  });
});

/* -------------------------------------------------------------
 * 页面事件全局兜底总线
 * ------------------------------------------------------------- */
backBtn.addEventListener('click', closeCategory);
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e)=>{ if(e.target===lightbox) closeLightbox(); });

lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); showPrevImage(); });
lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); showNextImage(); });

document.addEventListener('keydown', (e)=>{
  if (!lightbox.classList.contains('show')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') showPrevImage();
  if (e.key === 'ArrowRight') showNextImage();
});

/* -------------------------------------------------------------
 * 辅助函数：根据鼠标坐标找出当前鼠标下方是哪张图片。
 * ------------------------------------------------------------- */
function findImageWrapperAtPoint(x, y) {
  const wrappers = lightboxScrollBox.querySelectorAll('.secure-img-wrapper');
  for (const wrapper of wrappers) {
    const rect = wrapper.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return wrapper;
    }
  }
  return null;
}

/* -------------------------------------------------------------
 * 桌面端专属：鼠标滚轮直接缩放，以鼠标所在位置为中心放大/缩小当前图片。
 * ------------------------------------------------------------- */
lightboxScrollBox.addEventListener('wheel', (e) => {
  const wrapper = findImageWrapperAtPoint(e.clientX, e.clientY);
  if (!wrapper) return;

  const img = wrapper.querySelector('img');
  if (!img) return;

  e.preventDefault();

  const rect = wrapper.getBoundingClientRect();
  const originX = ((e.clientX - rect.left) / rect.width) * 100;
  const originY = ((e.clientY - rect.top) / rect.height) * 100;
  img.style.transformOrigin = `${originX}% ${originY}%`;

  const currentScale = parseFloat(img.dataset.zoomScale || "1");
  const delta = e.deltaY > 0 ? -0.15 : 0.15;
  const newScale = Math.min(4, Math.max(1, currentScale + delta));
  img.dataset.zoomScale = newScale;

  if (newScale <= 1) {
    img.dataset.zoomX = "0";
    img.dataset.zoomY = "0";
  }

  const tx = parseFloat(img.dataset.zoomX || "0");
  const ty = parseFloat(img.dataset.zoomY || "0");

  img.style.transition = "transform 0.05s linear";
  img.style.transform = `scale(${newScale}) translate(${tx}px, ${ty}px)`;
}, { passive: false });

lightboxScrollBox.addEventListener('dblclick', (e) => {
  const wrapper = findImageWrapperAtPoint(e.clientX, e.clientY);
  if (!wrapper) return;
  const img = wrapper.querySelector('img');
  if (!img) return;
  img.dataset.zoomScale = "1";
  img.dataset.zoomX = "0";
  img.dataset.zoomY = "0";
  img.style.transition = "transform 0.15s ease";
  img.style.transform = "scale(1) translate(0px, 0px)";
  img.style.transformOrigin = "center center";
});

/* -------------------------------------------------------------
 * 放大后按住鼠标拖动，查看画面其他部位（只有放大倍数 > 1 时才允许拖动）
 * ------------------------------------------------------------- */
let dragState = null;

lightboxScrollBox.addEventListener('mousedown', (e) => {
  const wrapper = findImageWrapperAtPoint(e.clientX, e.clientY);
  if (!wrapper) return;
  const img = wrapper.querySelector('img');
  if (!img) return;

  const scale = parseFloat(img.dataset.zoomScale || "1");
  if (scale <= 1) return;

  e.preventDefault();
  dragState = {
    img,
    scale,
    startX: e.clientX,
    startY: e.clientY,
    origX: parseFloat(img.dataset.zoomX || "0"),
    origY: parseFloat(img.dataset.zoomY || "0"),
  };
  img.style.transition = "none";
  lightboxScrollBox.style.cursor = "grabbing";
});

document.addEventListener('mousemove', (e) => {
  if (!dragState) return;
  const { img, scale, startX, startY, origX, origY } = dragState;

  const newX = origX + (e.clientX - startX) / scale;
  const newY = origY + (e.clientY - startY) / scale;
  img.dataset.zoomX = newX;
  img.dataset.zoomY = newY;
  img.style.transform = `scale(${scale}) translate(${newX}px, ${newY}px)`;
});

document.addEventListener('mouseup', () => {
  if (dragState) {
    lightboxScrollBox.style.cursor = "";
  }
  dragState = null;
});

/* -------------------------------------------------------------
 * 首次启动加载：从 data.json 拉取数据，成功后渲染首页
 * ------------------------------------------------------------- */
let DATA = [];

async function loadDataAndRender() {
  try {
    const res = await fetch(DATA_JSON_URL_PUBLIC + "?t=" + Date.now());
    if (!res.ok) {
      throw new Error("data.json加载失败");
    }
    DATA = await res.json();
    renderHome();
  } catch (err) {
    console.error(err);
  }
}

loadDataAndRender();
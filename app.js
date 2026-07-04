/* -------------------------------------------------------------
 * 全局动态配置
 * ------------------------------------------------------------- */
const LOGO_URL = "头像.png";

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

const customBtn = document.getElementById('customBtn');
const copyCodeOnlyBtn = document.getElementById('copyCodeOnlyBtn');
const themeToggle = document.getElementById('themeToggle');
const hiddenQrWrap = document.getElementById('hiddenQrWrap');

// 用于临时存放当前正在弹窗中浏览的分类及海报数据项
let currentActiveCat = null;
let currentActiveItem = null;

// 动态更新底部版权年份
document.getElementById('year').textContent = new Date().getFullYear();

/* -------------------------------------------------------------
 * 高性能 IntersectionObserver 图片视口懒加载逻辑
 * ------------------------------------------------------------- */
const lazyImageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    // 当卡片或者海报容器进入视口（或即将滑入前方500px内）时触发加载
    if (entry.isIntersecting) {
      const thumbDiv = entry.target;
      const trueImgUrl = thumbDiv.getAttribute('data-bg');

      if (trueImgUrl) {
        const img = new Image();
        img.src = trueImgUrl;
        img.onload = () => {
          // 图片完全下载完成，挂载为背景图，触发 CSS 渐显动画
          thumbDiv.style.backgroundImage = `url('${trueImgUrl}')`;
          thumbDiv.classList.add('lazy-loaded');
        };
        img.onerror = () => {
          // 加载失败时使用灰色兜底
          thumbDiv.style.backgroundColor = "var(--line)";
        };
      }
      observer.unobserve(thumbDiv); // 加载后立即解除监听，释放内存
    }
  });
}, {
  rootMargin: "0px 0px 500px 0px" // 预加载边界：在用户向下滑动提前 500 像素时自动开始加载
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

// 如果定义了 LOGO_URL，自动在标题处动态无缝插入工作室 Logo
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

    // 动态构造包含 3 层 Leaf 的重叠 HTML 结构
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
      lazyImageObserver.observe(leafElement); // 对最上层纸片绑定懒加载监听
    }

    // 点击分类卡片，清空输入框并进入分类子页
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
  crumb.classList.add('show'); // 展现顶部返回面包屑

  posterGrid.innerHTML = '';
  cat.items.forEach(item=>{
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
      lazyImageObserver.observe(thumbElement); // 绑定海报网格图片懒加载
    }

    card.addEventListener('click', ()=>openLightbox(cat, item));
    posterGrid.appendChild(card);
  });

  // 视图排他显示切换
  homeView.classList.add('hide');
  searchView.classList.remove('show');
  categoryView.classList.add('show');
  window.scrollTo({top:0, behavior:'smooth'}); // 自动平滑置顶
}

// C. 模糊搜索功能监听事件（支持分类名或产品编号混合过滤）
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.trim().toLowerCase();

  // 如果用户清空了输入框，根据面包屑状态返回此前视图
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

  // 激活搜索结果视图层
  homeView.classList.add('hide');
  categoryView.classList.remove('show');
  searchView.classList.add('show');

  searchResultGrid.innerHTML = '';
  let matchCount = 0;

  // 双重循环检索匹配项
  DATA.forEach(cat => {
    cat.items.forEach(item => {
      const matchCode = item.code.toLowerCase().includes(query);
      const matchCatName = cat.name.toLowerCase().includes(query);

      if (matchCode || matchCatName) {
        matchCount++;
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

        card.addEventListener('click', () => openLightbox(cat, item));
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

// E. 唤起全屏大图预览弹窗
function openLightbox(cat, item){
  currentActiveCat = cat;
  currentActiveItem = item;
  lightboxScrollBox.innerHTML = ''; // 卸载旧大图，清空 DOM

  // 初始化重置交互状态：确保每次点开新大图，按钮都处于初始"可点击"状态，隐藏二维码
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
      wrapper.className = 'secure-img-wrapper'; // 启用防盗外框

      const img = document.createElement('img');
      img.alt = item.code;
      img.setAttribute('data-src', imgUrl); // 写入临时占位路径

      wrapper.appendChild(img);
      lightboxScrollBox.appendChild(wrapper);
    });
  } else {
    // 极端无图时启用色块兜底
    const fallback = document.createElement('div');
    fallback.className = 'lightbox-img-fallback';
    fallback.style.background = item.color;
    fallback.innerHTML = `<div class="center-mark">${cat.name} ${item.code}</div>`;
    lightboxScrollBox.appendChild(fallback);
  }

  lightboxCode.textContent = "编号：" + item.code;
  lightboxCatName.textContent = "分类：" + cat.name;

  lightbox.classList.add('show');
  document.body.style.overflow = 'hidden'; // 背景锁定：大图打开后禁止底层主网页滑动
  lightboxScrollBox.scrollTop = 0;

  // 延迟 150ms 触发大图数据流下载，确保骨架屏平稳过渡
  setTimeout(() => {
    const pendingImages = lightboxScrollBox.querySelectorAll('img[data-src]');
    pendingImages.forEach(img => {
      const realSrc = img.getAttribute('data-src');
      img.src = realSrc; // 正式注入路径流开始下载

      img.onload = function() {
        img.classList.add('loaded');
        img.parentElement.classList.add('loading-done'); // 图片好了，隐藏闪烁骨架流
      };
    });
  }, 150);
}

// F. 释放弹窗还原页面
function closeLightbox(){
  lightbox.classList.remove('show');
  document.body.style.overflow = ''; // 恢复主页滚动条
}

/* -------------------------------------------------------------
 * 系统级剪贴板读写与按钮原地转换无弹窗长按方案实现 (Interaction)
 * ------------------------------------------------------------- */
customBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  if(!currentActiveCat || !currentActiveItem) return;

  // 自动构建带品牌标识符规范的剪贴板定制文本
  const textToCopy = `【荼荼工作室】定制模板需求：\n-------------------------\n分类：${currentActiveCat.name}\n编号：${currentActiveItem.code}`;

  // 写入手机/电脑剪贴板
  navigator.clipboard.writeText(textToCopy).then(() => {
    triggerButtonTransform();
  }).catch(err => {
    // 容错处理：若部分旧内核浏览器不支持原生剪贴板API，依旧强制展出二维码防死锁
    triggerButtonTransform();
  });
});

// "点击变身"核心动效：按钮原地变形成提示框，并在正下方优雅展示二维码供长按
function triggerButtonTransform() {
  customBtn.style.background = "var(--paper-deep)";
  customBtn.style.color = "var(--ink-soft)";
  customBtn.style.border = "1.5px solid var(--ink)";
  customBtn.style.boxShadow = "none";
  customBtn.style.fontSize = "11px";
  customBtn.innerHTML = "🎉 复制成功！请长按下方二维码加微信";
  customBtn.style.transform = "translateY(-6px)"; // 按钮轻微向上浮动让出空间

  if(hiddenQrWrap) {
    hiddenQrWrap.style.opacity = "1";
    hiddenQrWrap.style.marginTop = "14px";
    // 自动测量二维码实际需要的高度（而不是写死数值），这样以后换更大/更小的图都能自适应，不会被裁切或留白
    hiddenQrWrap.style.maxHeight = "none";
    const naturalHeight = hiddenQrWrap.scrollHeight;
    hiddenQrWrap.style.maxHeight = "0px";
    // 强制浏览器重新计算一次布局，确保下面的过渡动画能从 0 正确过渡到目标高度
    void hiddenQrWrap.offsetHeight;
    hiddenQrWrap.style.maxHeight = naturalHeight + "px";
  }
}

// 辅助复制：点击编号行的小图标仅复制海报纯文本编号
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
// 点击弹窗两侧黑框半透明区域直接自动收起弹窗
lightbox.addEventListener('click', (e)=>{ if(e.target===lightbox) closeLightbox(); });
// 支持电脑端按下物理键盘"ESC"按键直接极速关闭大图弹窗
document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeLightbox(); });

/* -------------------------------------------------------------
 * 辅助函数：根据鼠标坐标找出当前鼠标下方是哪张图片。
 * 不能用 document.elementFromPoint / elementsFromPoint，因为图片外层
 * .secure-img-wrapper 设置了 pointer-events:none（防盗用），浏览器的
 * 坐标命中测试会直接跳过这类元素，导致永远找不到。所以改成手动比对
 * 每张图片的实际矩形范围与鼠标坐标。
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
 * 注意：由于滚轮被用来缩放，如果某款模板配了多张长图需要上下翻看，
 * 鼠标滚轮将不再触发上下滚动，可以直接拖动滚动条来翻看其余图片。
 * ------------------------------------------------------------- */
lightboxScrollBox.addEventListener('wheel', (e) => {
  const wrapper = findImageWrapperAtPoint(e.clientX, e.clientY);
  if (!wrapper) return; // 鼠标不在图片上方就走原本的滚动

  const img = wrapper.querySelector('img');
  if (!img) return;

  e.preventDefault(); // 阻止触发容器/整页的滚动或浏览器自身缩放

  // 缩放中心跟随鼠标位置，实现"放大镜"式效果
  const rect = wrapper.getBoundingClientRect();
  const originX = ((e.clientX - rect.left) / rect.width) * 100;
  const originY = ((e.clientY - rect.top) / rect.height) * 100;
  img.style.transformOrigin = `${originX}% ${originY}%`;

  const currentScale = parseFloat(img.dataset.zoomScale || "1");
  const delta = e.deltaY > 0 ? -0.15 : 0.15;
  const newScale = Math.min(4, Math.max(1, currentScale + delta));
  img.dataset.zoomScale = newScale;

  // 缩小到 1 倍时，把之前拖动过的偏移也一并清零，避免恢复原图后画面还偏着
  if (newScale <= 1) {
    img.dataset.zoomX = "0";
    img.dataset.zoomY = "0";
  }

  const tx = parseFloat(img.dataset.zoomX || "0");
  const ty = parseFloat(img.dataset.zoomY || "0");

  img.style.transition = "transform 0.05s linear";
  img.style.transform = `scale(${newScale}) translate(${tx}px, ${ty}px)`;
}, { passive: false });

// 双击图片快速恢复到原始大小（同时清除拖动偏移）
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
  if (scale <= 1) return; // 没放大就不需要拖动，让页面正常滚动/其他交互

  e.preventDefault();
  dragState = {
    img,
    scale,
    startX: e.clientX,
    startY: e.clientY,
    origX: parseFloat(img.dataset.zoomX || "0"),
    origY: parseFloat(img.dataset.zoomY || "0"),
  };
  img.style.transition = "none"; // 拖动过程中关掉过渡动画，让画面跟手更顺滑
  lightboxScrollBox.style.cursor = "grabbing";
});

document.addEventListener('mousemove', (e) => {
  if (!dragState) return;
  const { img, scale, startX, startY, origX, origY } = dragState;

  // 鼠标移动的距离要除以缩放倍数，这样视觉上的移动距离才等于鼠标实际移动的距离
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

// -------------------------------------------------------------
// 首次启动加载：初始化渲染首页
// -------------------------------------------------------------
renderHome();

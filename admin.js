// ------- 荼荼上传后台 · 主入口 -------
import { API_BASE, DATA_JSON_URL, session, state } from './core.js';
import { initUpload, refreshUploadPanel } from './modules/upload.js';
import { initDelete, refreshDeletePanel } from './modules/delete.js';
import { initCategoryManage, refreshCategoryManage } from './modules/category.js';

// ---- 登录门禁 ----
const gate = document.getElementById('gate');
const app = document.getElementById('app');

document.getElementById('pwBtn').addEventListener('click', async () => {
  const pwBtn = document.getElementById('pwBtn');
  const pwErr = document.getElementById('pwErr');
  pwBtn.disabled = true;
  pwErr.textContent = '';
  try {
    const res = await fetch(API_BASE + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: document.getElementById('pwInput').value }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || '密码不对');
    session.token = data.token;
    gate.style.display = 'none';
    app.style.display = 'block';
    loadCategories();
  } catch (err) {
    pwErr.textContent = err.message;
  } finally {
    pwBtn.disabled = false;
  }
});

// ---- 标签页切换：新增 / 删除 / 分类管理 ----
const tabUpload = document.getElementById('tabUpload');
const tabDelete = document.getElementById('tabDelete');
const tabCatManage = document.getElementById('tabCatManage');
const uploadPanel = document.getElementById('uploadPanel');
const deletePanel = document.getElementById('deletePanel');
const categoryManagePanel = document.getElementById('categoryManagePanel');
const pageTitle = document.getElementById('pageTitle');
const pageSub = document.getElementById('pageSub');

function activateTab(tabBtn, panel, title, sub) {
  [tabUpload, tabDelete, tabCatManage].forEach((b) => b.classList.remove('active'));
  [uploadPanel, deletePanel, categoryManagePanel].forEach((p) => (p.style.display = 'none'));
  tabBtn.classList.add('active');
  panel.style.display = 'block';
  pageTitle.textContent = title;
  pageSub.textContent = sub;
}

tabUpload.addEventListener('click', () => {
  activateTab(tabUpload, uploadPanel, '新增模板', '选分类、填编号、传图，几秒后主站就会更新');
});
tabDelete.addEventListener('click', () => {
  activateTab(tabDelete, deletePanel, '删除模板', '选分类、找到要删的模板，点删除会同时清掉图片和记录');
});
tabCatManage.addEventListener('click', () => {
  activateTab(tabCatManage, categoryManagePanel, '分类管理', '调整分类顺序、修改分类名称');
});

// ---- 拉取分类数据，刷新三个面板 ----
async function loadCategories() {
  try {
    const res = await fetch(DATA_JSON_URL + '?t=' + Date.now());
    state.categories = await res.json();
  } catch (e) {
    state.categories = [];
  }
  refreshUploadPanel();
  refreshDeletePanel();
  refreshCategoryManage();
}

// 各面板模块完成增删改之后，通过这个自定义事件通知主入口重新拉取最新数据
document.addEventListener('tutu:refresh', loadCategories);

// ---- 初始化各面板的事件绑定 ----
initUpload();
initDelete();
initCategoryManage();
tabUpload.click(); // 默认打开"新增"这个标签页

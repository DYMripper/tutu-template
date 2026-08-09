// ------- "分类管理"面板 -------
import { API_BASE, session, state, compressImage, uploadToWorker, hashBlob } from '../core.js';

export function initCategoryManage() {
  // 目前不需要额外的一次性事件绑定，交互都是渲染列表时逐行绑定的
}

export function refreshCategoryManage() {
  const container = document.getElementById('catManageList');
  container.innerHTML = '';
  state.categories.forEach((c, idx) => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; align-items:center; gap:8px; border:1px solid var(--line); border-radius:6px; padding:8px 10px;';
    row.innerHTML = `
      <button class="link catUpBtn" ${idx === 0 ? 'disabled style="opacity:.3;"' : ''}>↑</button>
      <button class="link catDownBtn" ${idx === state.categories.length - 1 ? 'disabled style="opacity:.3;"' : ''}>↓</button>
      <input type="text" class="catNameInput" value="${c.name}" style="flex:1;">
      <button class="link catSaveNameBtn">保存名称</button>
      <button class="link catCoverBtn">更换封面</button>
      <input type="file" class="catCoverInput" accept="image/*" style="display:none;">
    `;
    row.querySelector('.catUpBtn').addEventListener('click', () => moveCategory(idx, -1));
    row.querySelector('.catDownBtn').addEventListener('click', () => moveCategory(idx, 1));
    row.querySelector('.catSaveNameBtn').addEventListener('click', () =>
      saveCatName(c.key, row.querySelector('.catNameInput').value.trim())
    );
    row.querySelector('.catCoverBtn').addEventListener('click', () => row.querySelector('.catCoverInput').click());
    row.querySelector('.catCoverInput').addEventListener('change', (e) => handleCoverChange(c.key, e.target.files[0], row));
    container.appendChild(row);
  });
}

async function moveCategory(idx, delta) {
  const newIdx = idx + delta;
  if (newIdx < 0 || newIdx >= state.categories.length) return;
  const order = state.categories.map((c) => c.key);
  [order[idx], order[newIdx]] = [order[newIdx], order[idx]];
  try {
    const res = await fetch(API_BASE + '/reordercats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': session.token },
      body: JSON.stringify({ order }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || '排序失败');
    document.dispatchEvent(new CustomEvent('tutu:refresh'));
  } catch (err) {
    alert('排序失败：' + err.message);
  }
}

async function saveCatName(categoryKey, newName) {
  if (!newName) {
    alert('名称不能为空');
    return;
  }
  try {
    const res = await fetch(API_BASE + '/renamecat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': session.token },
      body: JSON.stringify({ categoryKey, newName }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || '改名失败');
    document.dispatchEvent(new CustomEvent('tutu:refresh'));
  } catch (err) {
    alert('改名失败：' + err.message);
  }
}

async function handleCoverChange(categoryKey, file, rowEl) {
  if (!file) return;
  const btn = rowEl.querySelector('.catCoverBtn');
  const originalText = btn.textContent;
  btn.textContent = '上传中…';
  btn.disabled = true;
  try {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const toUpload = await compressImage(file, 1200, 0.85); // 封面图不用太大，1200px内足够
    const hash = await hashBlob(toUpload);
    const key = `Templates/${categoryKey}/_cover-${hash}.${ext}`; // 内容指纹当文件名，内容没变就还是这个URL，变了URL自动换新
    const url = await uploadToWorker(key, toUpload);
    const res = await fetch(API_BASE + '/setcatimage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': session.token },
      body: JSON.stringify({ categoryKey, image: url }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || '更换封面失败');
    document.dispatchEvent(new CustomEvent('tutu:refresh'));
  } catch (err) {
    alert('更换封面失败：' + err.message);
  } finally {
    btn.textContent = originalText;
    btn.disabled = false;
  }
}
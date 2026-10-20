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
      <button class="link catDelBtn" style="color:#c0392b;">删除分类</button>
    `;
    row.querySelector('.catUpBtn').addEventListener('click', () => moveCategory(idx, -1));
    row.querySelector('.catDownBtn').addEventListener('click', () => moveCategory(idx, 1));
    row.querySelector('.catSaveNameBtn').addEventListener('click', () =>
      saveCatName(c.key, row.querySelector('.catNameInput').value.trim())
    );
    row.querySelector('.catCoverBtn').addEventListener('click', () => row.querySelector('.catCoverInput').click());
    row.querySelector('.catCoverInput').addEventListener('change', (e) => handleCoverChange(c.key, e.target.files[0], row));
    row.querySelector('.catDelBtn').addEventListener('click', () => deleteCategory(c, row));
    container.appendChild(row);
  });
}

async function deleteCategory(cat, rowEl) {
  const count = (cat.items || []).length;
  const typed = prompt(
    `⚠️ 即将删除分类「${cat.name}」\n\n` +
    `该分类下的 ${count} 个模板，以及它们的所有图片/视频、分类封面都会被永久删除，无法恢复！\n\n` +
    `如果确定要删除，请在下面输入分类名称：${cat.name}`
  );
  if (typed === null) return;
  if (typed.trim() !== cat.name) {
    alert('输入的名称不一致，已取消删除。');
    return;
  }
  const btn = rowEl.querySelector('.catDelBtn');
  btn.textContent = '删除中…';
  btn.disabled = true;
  try {
    const res = await fetch(API_BASE + '/deletecat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': session.token },
      body: JSON.stringify({ categoryKey: cat.key, confirmName: typed.trim() }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || '删除失败');
    alert(`已删除分类「${cat.name}」：${data.removedItems} 个模板、${data.removedFiles} 个文件。`);
    document.dispatchEvent(new CustomEvent('tutu:refresh'));
  } catch (err) {
    alert('删除分类失败：' + err.message);
    btn.textContent = '删除分类';
    btn.disabled = false;
  }
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
// ------- "删除模板"面板（含内联编辑） -------
import { API_BASE, session, state, compressImage, uploadToWorker, hashBlob, combineColorHex, splitColorHex } from '../core.js';

const deleteCatSelect = document.getElementById('deleteCatSelect');
const deleteList = document.getElementById('deleteList');
const deleteSearchInput = document.getElementById('deleteSearchInput');

export function refreshDeletePanel() {
  const keepSelection = deleteCatSelect.value;
  deleteCatSelect.innerHTML = state.categories.map((c) => `<option value="${c.key}">${c.name}</option>`).join('');
  if (keepSelection && state.categories.some((c) => c.key === keepSelection)) {
    deleteCatSelect.value = keepSelection;
  }
  renderDeleteList();
}

export function initDelete() {
  deleteCatSelect.addEventListener('change', renderDeleteList);
  deleteSearchInput.addEventListener('input', renderDeleteList);

  // 动态插入"全选 + 批量删除"控制条，放在搜索框和列表之间
  const bulkBar = document.createElement('div');
  bulkBar.style.cssText = 'display:flex; align-items:center; gap:14px; margin-top:10px; font-size:13px;';
  bulkBar.innerHTML = `
    <label style="display:flex; align-items:center; gap:6px; margin:0; color:var(--ink);">
      <input type="checkbox" id="selectAllCheck" style="width:auto;">
      全选当前列表
    </label>
    <button class="link" id="bulkDeleteBtn" style="color:var(--accent);">批量删除选中项（<span id="selectedCount">0</span>）</button>
  `;
  deleteSearchInput.after(bulkBar);

  document.getElementById('selectAllCheck').addEventListener('change', (e) => {
    deleteList.querySelectorAll('.itemCheck').forEach((cb) => (cb.checked = e.target.checked));
    updateSelectedCount();
  });
  document.getElementById('bulkDeleteBtn').addEventListener('click', handleBulkDelete);
}

function updateSelectedCount() {
  const countEl = document.getElementById('selectedCount');
  if (countEl) countEl.textContent = deleteList.querySelectorAll('.itemCheck:checked').length;
}

function renderDeleteList() {
  const selectAllCheck = document.getElementById('selectAllCheck');
  if (selectAllCheck) selectAllCheck.checked = false;
  const cat = state.categories.find((c) => c.key === deleteCatSelect.value);
  deleteList.innerHTML = '';
  if (!cat || cat.items.length === 0) {
    deleteList.innerHTML = '<div style="font-size:13px;color:var(--ink-soft);">这个分类下还没有模板</div>';
    updateSelectedCount();
    return;
  }
  const query = deleteSearchInput.value.trim().toLowerCase();
  const filtered = query ? cat.items.filter((it) => it.code.toLowerCase().includes(query)) : cat.items;
  if (filtered.length === 0) {
    deleteList.innerHTML = '<div style="font-size:13px;color:var(--ink-soft);">没有匹配的编号</div>';
    updateSelectedCount();
    return;
  }
  filtered.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'deleteRow';
    row.style.cssText = 'display:flex; align-items:center; gap:12px; border:1px solid var(--line); border-radius:6px; padding:8px 10px;';
    const firstImg = Array.isArray(item.image) ? item.image[0] : item.image;
    const thumbHtml = firstImg
      ? `<img src="${firstImg}" loading="lazy" style="width:44px;height:44px;object-fit:cover;border-radius:4px;flex-shrink:0;">`
      : `<div style="width:44px;height:44px;border-radius:4px;background:${item.color || '#ccc'};flex-shrink:0;"></div>`;
    row.innerHTML = `<input type="checkbox" class="itemCheck" style="width:auto;">${thumbHtml}<div style="flex:1;font-family:'Space Mono',monospace;font-size:13px;">${item.code}</div><button class="link editBtn" style="color:var(--ink);">编辑</button><button class="link delBtn" style="color:var(--accent);">删除</button>`;
    row._itemData = { categoryKey: cat.key, item };
    row.querySelector('.itemCheck').addEventListener('change', updateSelectedCount);
    row.querySelector('.delBtn').addEventListener('click', () => handleDeleteItem(cat.key, item, row));
    row.querySelector('.editBtn').addEventListener('click', () => toggleEditForm(cat.key, item, row));
    deleteList.appendChild(row);
  });
  updateSelectedCount();
}

// 展开/收起某一行的内联编辑表单
function toggleEditForm(categoryKey, item, rowEl) {
  const existing = rowEl.nextElementSibling;
  if (existing && existing.classList.contains('editForm')) {
    existing.remove();
    return;
  }
  // 一次只展开一个编辑表单，避免页面上同时出现多个搞混
  deleteList.querySelectorAll('.editForm').forEach((el) => el.remove());

  const { hex6: editHex6, alphaPercent: editAlphaPercent } = splitColorHex(item.color);

  const form = document.createElement('div');
  form.className = 'editForm';
  form.style.cssText = 'border:1px dashed var(--line); border-radius:6px; padding:12px; margin-top:-4px; margin-bottom:4px; display:flex; flex-direction:column; gap:8px;';
  form.innerHTML = `
    <label style="margin:0;">编号</label>
    <input type="text" class="editCode" value="${item.code}">
    <div class="row">
      <div>
        <label style="margin:0;">比例</label>
        <select class="editRatio">
          <option value="3/4" ${item.ratio === '3/4' || !item.ratio ? 'selected' : ''}>3 : 4</option>
          <option value="1/1" ${item.ratio === '1/1' ? 'selected' : ''}>1 : 1</option>
          <option value="9/16" ${item.ratio === '9/16' ? 'selected' : ''}>9 : 16</option>
          <option value="16/9" ${item.ratio === '16/9' ? 'selected' : ''}>16 : 9</option>
        </select>
      </div>
      <div>
        <label style="margin:0;">颜色</label>
        <input type="color" class="editColor" value="${editHex6}">
        <div style="display:flex; align-items:center; gap:8px; margin-top:6px;">
          <input type="range" class="editColorAlpha" min="0" max="100" value="${editAlphaPercent}" style="flex:1;">
          <span class="editColorAlphaLabel" style="font-size:12px; color:var(--ink-soft); width:36px;">${editAlphaPercent}%</span>
        </div>
      </div>
    </div>
    <label style="margin:0;">替换图片（只能选一张，不选就保持原图不变）</label>
    <input type="file" class="editFiles" accept="image/*">
    <div style="display:flex; gap:10px; margin-top:4px;">
      <button class="primary editSaveBtn" style="margin:0;">保存</button>
      <button class="link editCancelBtn">取消</button>
    </div>
    <div class="editStatus" style="font-family:'Space Mono',monospace; font-size:12px;"></div>
  `;
  rowEl.after(form);

  form.querySelector('.editColorAlpha').addEventListener('input', (e) => {
    form.querySelector('.editColorAlphaLabel').textContent = e.target.value + '%';
  });
  form.querySelector('.editCancelBtn').addEventListener('click', () => form.remove());
  form.querySelector('.editSaveBtn').addEventListener('click', () => saveEditForm(categoryKey, item, form, rowEl));
}

async function saveEditForm(categoryKey, item, form, rowEl) {
  const saveBtn = form.querySelector('.editSaveBtn');
  const statusEl = form.querySelector('.editStatus');
  const newCode = form.querySelector('.editCode').value.trim();
  const newRatio = form.querySelector('.editRatio').value;
  const newColor = combineColorHex(form.querySelector('.editColor').value, form.querySelector('.editColorAlpha').value);
  const newFiles = form.querySelector('.editFiles').files;

  saveBtn.disabled = true;
  statusEl.textContent = '';
  try {
    let newImages = [];
    if (newFiles.length > 0) {
      statusEl.textContent = '正在上传新图片…';
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const toUpload = await compressImage(file, 2000, 0.85);
        const hash = await hashBlob(toUpload);
        const key = `Templates/${categoryKey}/${newCode || item.code}-${hash}.${ext}`;
        newImages.push(await uploadToWorker(key, toUpload));
      }
    }

    statusEl.textContent = '正在保存修改…';
    const res = await fetch(API_BASE + '/edititem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': session.token },
      body: JSON.stringify({
        categoryKey,
        originalImages: item.image,
        code: newCode,
        color: newColor,
        ratio: newRatio,
        newImages: newImages.length > 0 ? newImages : undefined,
      }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || '保存失败');
    form.remove();
    document.dispatchEvent(new CustomEvent('tutu:refresh'));
  } catch (err) {
    statusEl.textContent = '❌ ' + err.message;
  } finally {
    saveBtn.disabled = false;
  }
}

async function handleDeleteItem(categoryKey, item, rowEl) {
  const sure = confirm(`确定要删除「${item.code}」这一条吗？图片也会从R2一起删掉，不可恢复。`);
  if (!sure) return;
  rowEl.style.opacity = '0.5';
  try {
    const res = await fetch(API_BASE + '/deleteitem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': session.token },
      body: JSON.stringify({ categoryKey, images: item.image }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || '删除失败');
    document.dispatchEvent(new CustomEvent('tutu:refresh'));
  } catch (err) {
    alert('删除失败：' + err.message);
    rowEl.style.opacity = '1';
  }
}

async function handleBulkDelete() {
  const rows = Array.from(deleteList.querySelectorAll('.deleteRow')).filter((row) => row.querySelector('.itemCheck').checked);
  if (rows.length === 0) {
    alert('还没选中任何要删除的模板');
    return;
  }
  const sure = confirm(`确定要删除选中的 ${rows.length} 款模板吗？图片也会一起从R2删掉，不可恢复。`);
  if (!sure) return;

  const bulkBtn = document.getElementById('bulkDeleteBtn');
  bulkBtn.disabled = true;
  rows.forEach((row) => (row.style.opacity = '0.5'));
  try {
    const deletions = rows.map((row) => ({ categoryKey: row._itemData.categoryKey, images: row._itemData.item.image }));
    const res = await fetch(API_BASE + '/deletebatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': session.token },
      body: JSON.stringify({ deletions }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || '批量删除失败');
    document.dispatchEvent(new CustomEvent('tutu:refresh'));
  } catch (err) {
    alert('批量删除失败：' + err.message);
    rows.forEach((row) => (row.style.opacity = '1'));
  } finally {
    bulkBtn.disabled = false;
  }
}
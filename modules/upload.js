// ------- "新增模板"面板 -------
import { API_BASE, session, state, setStatus, compressImage, uploadToWorker, combineColorHex, splitColorHex, levenshtein } from '../core.js';

const catSelect = document.getElementById('catSelect');
const newCatToggle = document.getElementById('newCatToggle');
const newCatBox = document.getElementById('newCatBox');

// 根据当前选中的分类，从已有编号里猜出编号前缀，自动填进"编号前缀"框（仍可手动改）
// 同时把颜色也带出来（取这个分类现有模板用的颜色），不用每次手动调色
export function refreshUploadPanel() {
  catSelect.innerHTML = state.categories.map((c) => `<option value="${c.key}" data-name="${c.name}">${c.name}</option>`).join('');
  document.getElementById('existingCatNames').textContent = state.categories.map((c) => c.name).join('、');
  fillPrefixFromSelectedCategory();
}

function fillPrefixFromSelectedCategory() {
  const usingNewCat = newCatBox.style.display === 'block';
  if (usingNewCat) return;
  const cat = state.categories.find((c) => c.key === catSelect.value);
  const firstItem = cat?.items?.[0];
  const m = firstItem?.code && String(firstItem.code).match(/^(.*)-\d+$/);
  document.getElementById('prefixInput').value = m ? m[1] : '';
  if (firstItem?.color) {
    const { hex6, alphaPercent } = splitColorHex(firstItem.color);
    document.getElementById('colorInput').value = hex6;
    document.getElementById('colorAlphaInput').value = alphaPercent;
    document.getElementById('colorAlphaLabel').textContent = alphaPercent + '%';
  }
}

export function initUpload() {
  catSelect.addEventListener('change', fillPrefixFromSelectedCategory);

  newCatToggle.addEventListener('click', () => {
    const showing = newCatBox.style.display === 'block';
    newCatBox.style.display = showing ? 'none' : 'block';
    catSelect.disabled = !showing;
    fillPrefixFromSelectedCategory();
  });

  document.getElementById('colorAlphaInput').addEventListener('input', (e) => {
    document.getElementById('colorAlphaLabel').textContent = e.target.value + '%';
  });

  // 选好文件后，先在页面上预览一遍，确认没选错再上传
  document.getElementById('fileInput').addEventListener('change', (e) => {
    const preview = document.getElementById('filePreview');
    preview.innerHTML = '';
    Array.from(e.target.files).forEach((file) => {
      const url = URL.createObjectURL(file);
      const wrap = document.createElement('div');
      wrap.style.cssText = 'text-align:center;';
      wrap.innerHTML = `
        <img src="${url}" style="width:64px;height:64px;object-fit:cover;border-radius:4px;border:1px solid var(--line);display:block;">
        <div style="font-size:10px;color:var(--ink-soft);max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;">${file.name}</div>
      `;
      preview.appendChild(wrap);
    });
  });

  document.getElementById('submitBtn').addEventListener('click', handleSubmit);
}

async function handleSubmit() {
  const usingNewCat = newCatBox.style.display === 'block';
  const categoryName = usingNewCat ? document.getElementById('newCatName').value.trim() : catSelect.selectedOptions[0]?.dataset.name;
  const categoryKey = usingNewCat ? categoryName : catSelect.value;
  const ratio = document.getElementById('ratioSelect').value;
  const color = combineColorHex(document.getElementById('colorInput').value, document.getElementById('colorAlphaInput').value);
  const files = document.getElementById('fileInput').files;

  if (!categoryKey || files.length === 0) {
    setStatus('分类、图片都是必填的', 'err');
    return;
  }
  if (usingNewCat) {
    const similar = state.categories.find((c) => c.name !== categoryName && levenshtein(c.name, categoryName) <= 1);
    if (similar) {
      const proceed = confirm(`已有一个很像的分类叫「${similar.name}」，你填的是「${categoryName}」，确定不是打错字、真的要新建一个不一样的分类吗？`);
      if (!proceed) {
        setStatus('已取消，请检查分类名称是不是打错字了', 'err');
        return;
      }
    }
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  const progressBar = document.getElementById('progressBar');
  const progressFill = document.getElementById('progressFill');
  progressBar.style.display = 'block';

  const uploadedKeysThisAttempt = []; // 记录这次已经传成功的文件，万一中途失败要拿去清理
  let addBatchSucceeded = false;

  try {
    // 编号从文件名解析（去掉扩展名后取小数点前的整数部分），每张图各自是独立模板，允许多张图共用同一编号
    const CODE_WIDTH = 3; // 编号补零位数，如果你的编号习惯不是3位数（比如4位），改这个数字
    const manualPrefix = document.getElementById('prefixInput').value.trim();
    if (!manualPrefix) throw new Error('需要填"编号前缀"');

    // 先校验所有文件名，任何一个不合规就整批不上传
    const invalidNames = [];
    const parsedFiles = [];
    for (const file of files) {
      const baseName = file.name.replace(/\.[^.]+$/, ''); // 去掉最后的扩展名
      if (!/^\d+(\.\d+)?$/.test(baseName)) {
        invalidNames.push(file.name);
      } else {
        parsedFiles.push({ file, intPart: baseName.split('.')[0] });
      }
    }
    if (invalidNames.length > 0) {
      throw new Error(
        '以下文件名不符合规则（必须是纯数字，最多一个小数点，比如 1.jpg 或 2.1.jpg，不能有汉字/字母）：' +
          invalidNames.join('、')
      );
    }

    const items = [];
    setStatus('正在上传图片 0/' + parsedFiles.length);
    for (let i = 0; i < parsedFiles.length; i++) {
      const { file, intPart } = parsedFiles[i];
      const code = `${manualPrefix}-${intPart.padStart(CODE_WIDTH, '0')}`;
      // 用原始文件名(含小数点部分)拼进key，避免"2.1.jpg"和"2.2.jpg"存到同一个路径互相覆盖
      const key = `Templates/${categoryKey}/${manualPrefix}-${file.name}`;
      const toUpload = await compressImage(file, 2000, 0.85);
      const imageUrl = await uploadToWorker(key, toUpload);
      uploadedKeysThisAttempt.push(key);
      progressFill.style.width = (((i + 1) / parsedFiles.length) * 100) + '%';
      items.push({ code, images: [imageUrl], color, ratio });
      setStatus(`正在上传图片 ${i + 1}/${parsedFiles.length}（编号 ${code}）`);
    }
    setStatus('图片传完了，正在批量更新模板列表…');
    const addRes = await fetch(API_BASE + '/addbatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': session.token },
      body: JSON.stringify({ categoryKey, categoryName, items }),
    });
    const addData = await addRes.json();
    if (!addData.ok) throw new Error(addData.message || '批量更新失败');
    addBatchSucceeded = true;
    setStatus(`✅ 上传成功！新增了 ${addData.added} 款，「${categoryName || categoryKey}」分类现在有 ${addData.total} 款模板了`, 'ok');

    document.getElementById('fileInput').value = '';
    progressFill.style.width = '0%';
    document.dispatchEvent(new CustomEvent('tutu:refresh')); // 通知admin.js重新拉取最新数据
  } catch (err) {
    if (!addBatchSucceeded && uploadedKeysThisAttempt.length > 0) {
      // data.json还没更新就失败了，说明这一批已经传上去的图都成了孤儿文件，逐个清理掉
      setStatus('出错了，正在清理已经传上去的文件…');
      for (const key of uploadedKeysThisAttempt) {
        try {
          await fetch(API_BASE + '/deletefile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Admin-Token': session.token },
            body: JSON.stringify({ key }),
          });
        } catch (cleanupErr) {
          console.error('清理孤儿文件失败：', key, cleanupErr);
        }
      }
    }
    setStatus('❌ 出错了：' + err.message, 'err');
  } finally {
    submitBtn.disabled = false;
  }
}

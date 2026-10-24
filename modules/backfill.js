// ------- 给旧模板补生成缩略图（一次性工具，可重复点，已经有缩略图的会自动跳过） -------
import { API_BASE, session, state, uploadToWorker, hashBlob, makeThumbnail } from '../core.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function initBackfill() {
  const anchor = document.getElementById('catManageList');
  if (!anchor || document.getElementById('backfillBox')) return;

  const box = document.createElement('div');
  box.id = 'backfillBox';
  box.style.cssText = 'margin-top:20px; border:1px dashed var(--line); border-radius:6px; padding:12px;';
  box.innerHTML = `
    <div style="font-size:13px; margin-bottom:8px;">
      <b>补生成缩略图</b>：给还没有小缩略图的旧模板生成并上传一张小图，前台列表页会因此加载得快很多。
      已经有缩略图的会自动跳过，中途失败/关闭页面后可以再点一次继续。
    </div>
    <button class="primary" id="backfillBtn" style="margin:0;">开始补生成</button>
    <div id="backfillStatus" style="font-family:'Space Mono',monospace; font-size:12px; margin-top:8px;"></div>
  `;
  anchor.after(box);
  document.getElementById('backfillBtn').addEventListener('click', runBackfill);
}

// 遇到"操作太频繁"（Worker限流）就等一会儿再重试，最多重试几次
async function uploadWithRetry(key, blob) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await uploadToWorker(key, blob);
    } catch (err) {
      if (String(err.message).includes('频繁')) {
        await sleep(15000);
        continue;
      }
      throw err;
    }
  }
  throw new Error('被限流太多次，请稍后再点一次继续');
}

async function flush(pending) {
  if (pending.length === 0) return 0;
  const res = await fetch(API_BASE + '/setthumbs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Token': session.token },
    body: JSON.stringify({ thumbs: pending }),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || '写入缩略图失败');
  const n = pending.length;
  pending.length = 0;
  return n;
}

async function runBackfill() {
  const btn = document.getElementById('backfillBtn');
  const statusEl = document.getElementById('backfillStatus');

  const todo = [];
  state.categories.forEach((cat) => {
    (cat.items || []).forEach((item) => {
      const src = Array.isArray(item.image) ? item.image[0] : item.image;
      if (src && !item.thumb) todo.push({ cat, item, src });
    });
  });

  if (todo.length === 0) {
    statusEl.textContent = '✅ 所有模板都已经有缩略图了，不需要补。';
    return;
  }
  if (!confirm(`共有 ${todo.length} 个模板需要补缩略图，大约需要几分钟，期间不要关闭页面。开始吗？`)) return;

  btn.disabled = true;
  let done = 0;
  let skipped = 0;
  let saved = 0;
  const pending = [];

  try {
    for (const { cat, item, src } of todo) {
      statusEl.textContent = `处理中 ${done + skipped + 1}/${todo.length}：${item.code}（已保存 ${saved}）`;
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error('读取原图失败 HTTP ' + res.status);
        const blob = await res.blob();
        const thumbBlob = await makeThumbnail(blob);
        if (!thumbBlob) throw new Error('生成缩略图失败');
        const hash = await hashBlob(thumbBlob);
        const key = `Templates/${cat.key}/${item.code}-${hash}_t.jpg`;
        const thumbUrl = await uploadWithRetry(key, thumbBlob);
        pending.push({ categoryKey: cat.key, images: item.image, thumb: thumbUrl });
        done++;
      } catch (err) {
        console.error('[补缩略图] 跳过', item.code, err);
        skipped++;
      }
      // 每攒够20个就写一次 data.json（只产生少量备份），中途中断也不会白做
      if (pending.length >= 20) saved += await flush(pending);
    }
    saved += await flush(pending);
    statusEl.textContent = `✅ 完成：成功 ${saved} 个，跳过/失败 ${skipped} 个${skipped ? '（可以再点一次重试失败的）' : ''}`;
    document.dispatchEvent(new CustomEvent('tutu:refresh'));
  } catch (err) {
    // 出错时先把已经处理好的存下来
    try { saved += await flush(pending); } catch (_) {}
    statusEl.textContent = `❌ 中断：${err.message}（已保存 ${saved} 个，可以再点一次继续）`;
    document.dispatchEvent(new CustomEvent('tutu:refresh'));
  } finally {
    btn.disabled = false;
  }
}

// ------- 荼荼上传后台 · 共用配置与工具函数 -------
// 这两项换成你自己的 Worker 地址 / data.json 地址
export const API_BASE = "https://newtutu.dymripper.com";
export const DATA_JSON_URL = "https://newtutu.dymripper.com/data.json";

// 用可变对象包住会变化的状态，而不是直接导出let变量——
// ES模块里其他文件import进去的变量是只读的，没法在别的模块里直接重新赋值，
// 包一层对象、改它的属性，各个模块看到的就都是最新值
export const session = { token: null }; // 登录成功后Worker发的通行证，只存在内存里，刷新页面就要重新登录
export const state = { categories: [] }; // 从data.json拉下来的全部分类数据，各面板共用同一份

// 算文件内容的哈希值（取SHA-256前8位），拼进文件名里当"内容指纹"——
// 图片内容不变，哈希就不变，内容一变哈希跟着变，URL自然跟着变，浏览器/CDN缓存自动失效，不用手动清缓存
export async function hashBlob(blob) {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 8);
}

export function setStatus(text, kind) {
  const el = document.getElementById('status');
  el.textContent = text;
  el.className = kind || '';
}

// 图片压缩：上传前把长边限制在2000px以内，JPEG按0.85质量重新编码（PNG保留原格式，只缩尺寸）
// 压缩/读取失败时退回用原图，不阻断上传
// 把水印真正画进图片像素里（不是CSS叠加层），这样不管对方用什么手段拿到文件，
// 水印都是文件内容本身的一部分，没法靠F12开发者工具绕过
const WATERMARK_TEXT = 'TUTU STUDIO   荼荼工作室   防盗预览';
function drawWatermark(ctx, width, height) {
  ctx.save();
  ctx.globalAlpha = 0.14; // 半透明，不影响正常观感
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  const fontSize = Math.max(14, Math.round(width * 0.022));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 间距按文字实际渲染宽度算，而不是图片宽度的固定比例——不然字一长，相邻两份水印就挤在一起看不清
  const textWidth = ctx.measureText(WATERMARK_TEXT).width;
  const stepX = textWidth + fontSize * 6;
  const stepY = fontSize * 7;

  const diag = Math.ceil(Math.sqrt(width * width + height * height));
  ctx.translate(width / 2, height / 2);
  ctx.rotate((-25 * Math.PI) / 180);
  ctx.translate(-diag / 2, -diag / 2);

  for (let y = 0; y <= diag; y += stepY) {
    for (let x = 0; x <= diag; x += stepX) {
      ctx.fillText(WATERMARK_TEXT, x, y);
    }
  }
  ctx.restore();
}

export function compressImage(file, maxDim, quality) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width, height } = img;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      drawWatermark(ctx, width, height);
      const isPng = file.type === 'image/png';
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          resolve(blob || file);
        },
        isPng ? 'image/png' : 'image/jpeg',
        isPng ? undefined : quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

// 把文件直接传给 Worker（Worker自己写进R2，浏览器不用碰任何密钥），返回上传后的公开访问地址
export async function uploadToWorker(key, blob) {
  const res = await fetch(API_BASE + '/upload?key=' + encodeURIComponent(key), {
    method: 'POST',
    headers: { 'X-Admin-Token': session.token, 'Content-Type': blob.type || 'application/octet-stream' },
    body: blob,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.message || '上传失败');
  const encodedPath = key.split('/').map(encodeURIComponent).join('/');
  return `${API_BASE}/${encodedPath}`;
}

// 颜色小工具：<input type=color>只支持6位hex，不支持透明度，所以额外配一个透明度滑块，
// 存进data.json时把两者拼成8位hex（跟现有分类的格式一致），读取已有颜色时反过来拆开
export function splitColorHex(color) {
  if (!color) return { hex6: '#cfc6b3', alphaPercent: 100 };
  const hex6 = color.slice(0, 7).toLowerCase(); // color输入框只认小写hex，大写会被浏览器静默拒绝、保留上一次的值
  if (color.length === 9) {
    const alphaPercent = Math.round((parseInt(color.slice(7, 9), 16) / 255) * 100);
    return { hex6, alphaPercent };
  }
  return { hex6, alphaPercent: 100 };
}
export function combineColorHex(hex6, alphaPercent) {
  const alphaHex = Math.round((Number(alphaPercent) / 100) * 255)
    .toString(16)
    .padStart(2, '0');
  return hex6 + alphaHex;
}

// 简单的编辑距离算法：用来判断新建分类的名字是不是跟已有的很像（可能是打错字）
export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}
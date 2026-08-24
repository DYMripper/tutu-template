// ------- 荼荼上传后台 · 共用配置与工具函数 -------
import { FFmpeg } from 'https://esm.sh/@ffmpeg/ffmpeg@0.12.10';
import { toBlobURL, fetchFile } from 'https://esm.sh/@ffmpeg/util@0.12.1';

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

// 采样canvas上已经画好的图片像素，算个大概的整体亮度（0全黑～255全白）
// 每隔一定间隔取一个点，不用扫全部像素，避免大图片卡顿
function analyzeImageTone(ctx, width, height) {
  const data = ctx.getImageData(0, 0, width, height).data;
  const sampleStride = 4 * 20; // 每隔20个像素采样一次
  let total = 0;
  let totalSquared = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += sampleStride) {
    const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    total += luminance;
    totalSquared += luminance * luminance;
    count++;
  }
  const brightness = count > 0 ? total / count : 128;
  const variance = count > 0 ? totalSquared / count - brightness * brightness : 0;
  const stdDev = Math.sqrt(Math.max(0, variance)); // 图片内容越花哨/越杂乱，这个数值越大
  return { brightness, stdDev };
}

export function drawWatermark(ctx, width, height) {
  const { brightness, stdDev } = analyzeImageTone(ctx, width, height);
  const isLightImage = brightness > 140; // 阈值，图偏亮就用深色水印，图偏暗就用浅色水印
  const watermarkColor = isLightImage ? '#000000' : '#ffffff';
  const shadowColor = isLightImage ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
  // 背景越单一干净（stdDev小），透明度低一点就够看清；背景越花哨杂乱（stdDev大），适当调高才压得住
  const alpha = Math.min(0.14, Math.max(0.04, 0.04 + stdDev / 320));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = watermarkColor;
  ctx.shadowColor = shadowColor;
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

// 截取视频的第一帧当缩略图，顺手盖上水印（复用上面同一套水印逻辑）
// 视频本身的水印是另一个函数（watermarkVideo）处理的，跟这个截帧函数是两回事
export function captureVideoFrame(file) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadeddata = () => {
      // 跳到稍微靠前一点点的位置（不是绝对第0帧），避免有些视频开头是纯黑/空白
      video.currentTime = Math.min(0.1, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      drawWatermark(ctx, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          resolve(blob);
        },
        'image/jpeg',
        0.85
      );
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('视频读取失败，确认一下是不是标准的mp4格式'));
    };
  });
}

// ------- 视频加水印（用 ffmpeg.wasm 逐帧重新编码，比图片水印重得多，处理会比较慢） -------
// 注意：这部分依赖浏览器加载 ffmpeg.wasm 这个库（约20-30MB）+ 一个字体文件，
// 第一次用之前没有实际浏览器环境测过，如果加载/编码报错，把报错信息发回来，照着错误信息调整
let ffmpegInstance = null;
async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;
  const ffmpeg = new FFmpeg();
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    // ffmpeg.wasm自己内部还要建一个Worker，这个Worker脚本要从@ffmpeg/ffmpeg这个包本身取（不是@ffmpeg/core），
    // 且要转成本地blob地址（浏览器不允许直接用跨域地址建Worker）
    classWorkerURL: await toBlobURL('https://unpkg.com/@ffmpeg/ffmpeg@0.12.10/dist/esm/worker.js', 'text/javascript'),
  });
  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

// 给视频本身加水印：文字用英文（"TUTU STUDIO"），不用中文——
// 因为ffmpeg.wasm不认系统字体，要显式打包一个字体文件进去，中文字体体积比英文字体大得多，
// 先用英文控制体积和处理时间，以后需要中文水印可以再换成中文字体（体积会明显变大）
export async function watermarkVideo(file, onProgress) {
  const ffmpeg = await getFFmpeg();

  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(Math.min(99, Math.max(0, Math.round(progress * 100))));
    });
  }

  await ffmpeg.writeFile('input.mp4', await fetchFile(file));

  // drawtext滤镜需要显式指定字体文件，这里用一个开源的西文字体
  const fontData = await fetchFile('https://cdn.jsdelivr.net/gh/googlefonts/roboto@main/src/hinted/Roboto-Bold.ttf');
  await ffmpeg.writeFile('font.ttf', fontData);

  // 2x2网格平铺水印文字，半透明白色（跟图片水印的"多处平铺"思路一致，只是没做旋转/自适应颜色，先保证能用）
  const drawText = (x, y) =>
    `drawtext=text='TUTU STUDIO':fontfile=font.ttf:fontcolor=white@0.28:fontsize=h/18:x=${x}:y=${y}`;
  const filter = [
    drawText('w*0.08', 'h*0.15'),
    drawText('w*0.55', 'h*0.15'),
    drawText('w*0.08', 'h*0.55'),
    drawText('w*0.55', 'h*0.55'),
  ].join(',');

  await ffmpeg.exec(['-i', 'input.mp4', '-vf', filter, '-preset', 'ultrafast', '-c:a', 'copy', 'output.mp4']);

  const data = await ffmpeg.readFile('output.mp4');
  return new Blob([data.buffer], { type: 'video/mp4' });
}
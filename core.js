// ------- 荼荼上传后台 · 共用配置与工具函数 -------

// ==============================
// FFmpeg
// ==============================
import { FFmpeg } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/esm/index.js';
import { toBlobURL, fetchFile } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/esm/index.js';

// ==============================
// API 配置
// ==============================
export const API_BASE = "https://newtutu.dymripper.com";
export const DATA_JSON_URL = "https://newtutu.dymripper.com/data.json";

// ==============================
// 全局状态
// ==============================
export const session = {
  token: null
};

export const state = {
  categories: []
};

// ==============================
// 文件 SHA-256
// ==============================
export async function hashBlob(blob) {
  const buffer = await blob.arrayBuffer();

  const digest = await crypto.subtle.digest(
    'SHA-256',
    buffer
  );

  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 8);
}

// ==============================
// 状态显示
// ==============================
export function setStatus(text, kind) {
  const el = document.getElementById('status');

  if (!el) {
    console.warn('[setStatus]', text);
    return;
  }

  el.textContent = text;
  el.className = kind || '';
}

// ==============================
// 图片水印
// ==============================
const WATERMARK_TEXT = 'TUTU STUDIO   荼荼工作室   防盗预览';

function analyzeImageTone(ctx, width, height) {
  const data = ctx.getImageData(
    0,
    0,
    width,
    height
  ).data;

  const sampleStride = 4 * 20;

  let total = 0;
  let totalSquared = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += sampleStride) {
    const luminance =
      0.299 * data[i] +
      0.587 * data[i + 1] +
      0.114 * data[i + 2];

    total += luminance;
    totalSquared += luminance * luminance;
    count++;
  }

  const brightness =
    count > 0
      ? total / count
      : 128;

  const variance =
    count > 0
      ? totalSquared / count - brightness * brightness
      : 0;

  const stdDev = Math.sqrt(
    Math.max(0, variance)
  );

  return {
    brightness,
    stdDev
  };
}

export function drawWatermark(ctx, width, height) {
  const {
    brightness,
    stdDev
  } = analyzeImageTone(
    ctx,
    width,
    height
  );

  const isLightImage =
    brightness > 140;

  const watermarkColor =
    isLightImage
      ? '#000000'
      : '#ffffff';

  const shadowColor =
    isLightImage
      ? 'rgba(255,255,255,0.35)'
      : 'rgba(0,0,0,0.35)';

  const alpha = Math.min(
    0.14,
    Math.max(
      0.04,
      0.04 + stdDev / 320
    )
  );

  ctx.save();

  ctx.globalAlpha = alpha;
  ctx.fillStyle = watermarkColor;

  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  const fontSize = Math.max(
    14,
    Math.round(width * 0.022)
  );

  ctx.font =
    `bold ${fontSize}px sans-serif`;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const textWidth =
    ctx.measureText(WATERMARK_TEXT).width;

  const stepX =
    textWidth + fontSize * 6;

  const stepY =
    fontSize * 7;

  const diag = Math.ceil(
    Math.sqrt(
      width * width +
      height * height
    )
  );

  ctx.translate(
    width / 2,
    height / 2
  );

  ctx.rotate(
    (-25 * Math.PI) / 180
  );

  ctx.translate(
    -diag / 2,
    -diag / 2
  );

  for (
    let y = 0;
    y <= diag;
    y += stepY
  ) {
    for (
      let x = 0;
      x <= diag;
      x += stepX
    ) {
      ctx.fillText(
        WATERMARK_TEXT,
        x,
        y
      );
    }
  }

  ctx.restore();
}

// ==============================
// 图片压缩
// ==============================
export function compressImage(
  file,
  maxDim,
  quality
) {
  return new Promise((resolve) => {
    const img = new Image();

    const url =
      URL.createObjectURL(file);

    img.onload = () => {
      let {
        width,
        height
      } = img;

      const scale = Math.min(
        1,
        maxDim /
          Math.max(width, height)
      );

      width = Math.round(
        width * scale
      );

      height = Math.round(
        height * scale
      );

      const canvas =
        document.createElement(
          'canvas'
        );

      canvas.width = width;
      canvas.height = height;

      const ctx =
        canvas.getContext('2d');

      ctx.drawImage(
        img,
        0,
        0,
        width,
        height
      );

      drawWatermark(
        ctx,
        width,
        height
      );

      const isPng =
        file.type === 'image/png';

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);

          resolve(
            blob || file
          );
        },
        isPng
          ? 'image/png'
          : 'image/jpeg',
        isPng
          ? undefined
          : quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

// ==============================
// 上传到 Worker
// ==============================
export async function uploadToWorker(
  key,
  blob
) {
  const res = await fetch(
    API_BASE +
      '/upload?key=' +
      encodeURIComponent(key),
    {
      method: 'POST',

      headers: {
        'X-Admin-Token':
          session.token,

        'Content-Type':
          blob.type ||
          'application/octet-stream'
      },

      body: blob
    }
  );

  const data =
    await res.json();

  if (!data.ok) {
    throw new Error(
      data.message ||
      '上传失败'
    );
  }

  const encodedPath =
    key
      .split('/')
      .map(
        encodeURIComponent
      )
      .join('/');

  return (
    `${API_BASE}/${encodedPath}`
  );
}

// ==============================
// 颜色工具
// ==============================
export function splitColorHex(color) {
  if (!color) {
    return {
      hex6: '#cfc6b3',
      alphaPercent: 100
    };
  }

  const hex6 =
    color
      .slice(0, 7)
      .toLowerCase();

  if (color.length === 9) {
    const alphaPercent =
      Math.round(
        (
          parseInt(
            color.slice(7, 9),
            16
          ) / 255
        ) * 100
      );

    return {
      hex6,
      alphaPercent
    };
  }

  return {
    hex6,
    alphaPercent: 100
  };
}

export function combineColorHex(
  hex6,
  alphaPercent
) {
  const alphaHex =
    Math.round(
      (Number(alphaPercent) / 100) *
        255
    )
      .toString(16)
      .padStart(2, '0');

  return hex6 + alphaHex;
}

// ==============================
// Levenshtein
// ==============================
export function levenshtein(
  a,
  b
) {
  const m = a.length;
  const n = b.length;

  const dp =
    Array.from(
      {
        length: m + 1
      },
      () =>
        new Array(
          n + 1
        ).fill(0)
    );

  for (
    let i = 0;
    i <= m;
    i++
  ) {
    dp[i][0] = i;
  }

  for (
    let j = 0;
    j <= n;
    j++
  ) {
    dp[0][j] = j;
  }

  for (
    let i = 1;
    i <= m;
    i++
  ) {
    for (
      let j = 1;
      j <= n;
      j++
    ) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 +
            Math.min(
              dp[i - 1][j - 1],
              dp[i - 1][j],
              dp[i][j - 1]
            );
    }
  }

  return dp[m][n];
}

// ============================================================
// 视频水印测试
// ============================================================

let ffmpegInstance = null;

// ------------------------------------------------------------
// 创建 FFmpeg Classic Worker
// ------------------------------------------------------------
// 你的 /ffmpeg/worker.js 已经确认：
// https://dev.tutu.dymripper.com/ffmpeg/worker.js
//
// 可以正常：
// LOAD -> true
// EXEC -version -> 0
//
// 所以这里不再让 @ffmpeg/ffmpeg 自己创建远程 Worker。
// 我们直接使用你网站自己的 /ffmpeg/worker.js。
// ------------------------------------------------------------

function createClassicFFmpegWorker() {
  console.log(
    '[水印测试] 创建本地 Classic FFmpeg Worker…'
  );

  return new Worker(
    '/ffmpeg/worker.js'
  );
}

// ------------------------------------------------------------
// 发送 FFmpeg 消息
// ------------------------------------------------------------
function createWorkerFFmpeg() {
  const worker =
    createClassicFFmpegWorker();

  let messageId = 0;

  const pending =
    new Map();

  worker.onmessage = (event) => {
    const message =
      event.data;

    // FFmpeg 日志
    if (
      message?.type === 'LOG'
    ) {
      const logData =
        message.data;

      console.log(
        '[ffmpeg]',
        logData
      );

      return;
    }

    // FFmpeg 进度
    if (
      message?.type === 'PROGRESS'
    ) {
      const progress =
        message.data;

      if (
        typeof progress ===
        'object'
      ) {
        console.log(
          '[ffmpeg progress]',
          progress
        );
      }

      return;
    }

    if (
      message?.id == null
    ) {
      return;
    }

    const resolver =
      pending.get(
        message.id
      );

    if (!resolver) {
      return;
    }

    pending.delete(
      message.id
    );

    if (
      message.type ===
      'ERROR'
    ) {
      resolver.reject(
        new Error(
          String(
            message.data ||
            'FFmpeg Worker error'
          )
        )
      );
      return;
    }

    resolver.resolve(
      message.data
    );
  };

  worker.onerror = (error) => {
    console.error(
      '[水印测试] FFmpeg Worker ERROR:',
      error
    );

    for (
      const item of pending.values()
    ) {
      item.reject(
        new Error(
          'FFmpeg Worker 发生错误'
        )
      );
    }

    pending.clear();
  };

  function send(
    type,
    data
  ) {
    return new Promise(
      (resolve, reject) => {
        const id =
          ++messageId;

        pending.set(
          id,
          {
            resolve,
            reject
          }
        );

        worker.postMessage({
          id,
          type,
          data
        });
      }
    );
  }

  return {
    worker,
    send
  };
}

// ------------------------------------------------------------
// 获取 FFmpeg
// ------------------------------------------------------------
async function getFFmpeg() {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  console.log(
    '[水印测试] 1/6 开始加载ffmpeg核心文件…'
  );

  const ffmpeg =
    createWorkerFFmpeg();

  console.log(
    '[水印测试] 1a/6 正在下载 ffmpeg-core.js…'
  );

  const baseURL =
    'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';

  const coreURL =
    await toBlobURL(
      `${baseURL}/ffmpeg-core.js`,
      'text/javascript'
    );

  console.log(
    '[水印测试] 1b/6 正在下载 ffmpeg-core.wasm…'
  );

  const wasmURL =
    await toBlobURL(
      `${baseURL}/ffmpeg-core.wasm`,
      'application/wasm'
    );

  console.log(
    '[水印测试] 1c/6 正在准备本地 worker.js…'
  );

  // 注意：
  // 这里不是传 /ffmpeg/worker.js。
  // 我们已经直接创建 Worker，
  // 所以 workerURL 留空。
  //
  // 这样完全绕过：
  // new Worker(new URL(classWorkerURL, import.meta.url))
  //
  // 也不会再出现：
  // Failed to construct Worker
  //
  // 更不会出现 CDN worker 跨域问题。

  console.log(
    '[水印测试] 1d/6 三个文件都准备完了，开始初始化ffmpeg…'
  );

  const result =
    await ffmpeg.send(
      'LOAD',
      {
        coreURL,
        wasmURL,
        workerURL: ''
      }
    );

  if (result !== true) {
    throw new Error(
      'FFmpeg 核心加载失败'
    );
  }

  console.log(
    '[水印测试] 2/6 ffmpeg核心加载完成'
  );

  ffmpegInstance =
    ffmpeg;

  return ffmpeg;
}

// ============================================================
// 视频水印测试
// ============================================================
export async function watermarkVideoTest(
  file,
  onProgress
) {
  const ffmpeg =
    await getFFmpeg();

  console.log(
    '[水印测试] 3/6 正在写入原始视频…'
  );

  // fetchFile(file) 可以处理 File / Blob
  const videoData =
    await fetchFile(file);

  await ffmpeg.send(
    'WRITE_FILE',
    {
      path: 'input.mp4',
      data: videoData
    }
  );

  console.log(
    '[水印测试] 4/6 写入完成，正在加载字体文件…'
  );

  // ==========================================================
  // 关键修复：
  //
  // 你的真正字体文件在：
  //
  // H:\tutu-template\font.ttf
  //
  // 网站根目录部署以后：
  //
  // https://dev.tutu.dymripper.com/font.ttf
  //
  // 你已经实际验证：
  //
  // status: 200
  // content-type: font/ttf
  // size: 157744
  // first bytes:
  // 00 01 00 00 ...
  //
  // 这才是真正的 TTF。
  //
  // 之前使用：
  // https://tutu.dymripper.com/font.ttf
  //
  // 返回的是 index.html：
  // <!DOCTYPE html>
  //
  // 所以 FFmpeg 才报：
  // Could not load font "font.ttf":
  // unknown file format
  // ==========================================================

  const FONT_URL =
    '/font.ttf';

  console.log(
    '[水印测试] 正在下载字体:',
    FONT_URL
  );

  const fontResponse =
    await fetch(
      FONT_URL,
      {
        cache: 'no-store'
      }
    );

  if (!fontResponse.ok) {
    throw new Error(
      `字体下载失败：HTTP ${fontResponse.status}`
    );
  }

  const fontType =
    fontResponse.headers.get(
      'content-type'
    ) || '';

  const fontData =
    new Uint8Array(
      await fontResponse.arrayBuffer()
    );

  console.log(
    '[水印测试] 字体 Content-Type:',
    fontType
  );

  console.log(
    '[水印测试] 字体大小:',
    fontData.byteLength,
    'bytes'
  );

  // TTF 通常以 00 01 00 00 开头
  const header =
    [...fontData.slice(0, 4)]
      .map(
        (x) =>
          x
            .toString(16)
            .padStart(2, '0')
      )
      .join(' ');

  console.log(
    '[水印测试] 字体文件头:',
    header
  );

  // 如果又拿到了 HTML，直接给出明确错误
  if (
    fontData.length >= 5 &&
    fontData[0] === 0x3c &&
    fontData[1] === 0x21 &&
    fontData[2] === 0x44 &&
    fontData[3] === 0x4f &&
    fontData[4] === 0x43
  ) {
    throw new Error(
      'font.ttf 实际返回的是 HTML，不是真正的 TTF。请检查部署后的 /font.ttf 路径。'
    );
  }

  if (
    fontData.length < 12
  ) {
    throw new Error(
      'font.ttf 文件太小，字体文件可能损坏。'
    );
  }

  await ffmpeg.send(
    'WRITE_FILE',
    {
      path: 'font.ttf',
      data: fontData
    }
  );

  console.log(
    '[水印测试] 5/6 字体加载完成，开始执行编码命令…'
  );

  // ==========================================================
  // drawtext
  // ==========================================================

  const drawText =
    (x, y) =>
      `drawtext=text='TUTU STUDIO':fontfile=font.ttf:fontcolor=white@0.28:fontsize=h/18:x=${x}:y=${y}`;

  const filter = [
    drawText(
      'w*0.08',
      'h*0.15'
    ),

    drawText(
      'w*0.55',
      'h*0.15'
    ),

    drawText(
      'w*0.08',
      'h*0.55'
    ),

    drawText(
      'w*0.55',
      'h*0.55'
    )
  ].join(',');

  console.log(
    '[水印测试] FFmpeg filter:',
    filter
  );

  // ==========================================================
  // 执行 FFmpeg
  // ==========================================================
  const result =
    await ffmpeg.send(
      'EXEC',
      {
        args: [
          '-i',
          'input.mp4',

          '-vf',
          filter,

          '-preset',
          'ultrafast',

          '-c:a',
          'copy',

          '-y',

          'output.mp4'
        ]
      }
    );

  if (result !== 0) {
    throw new Error(
      `FFmpeg 执行失败，返回码：${result}`
    );
  }

  console.log(
    '[水印测试] 6/6 编码完成，正在读取结果…'
  );

  const data =
    await ffmpeg.send(
      'READ_FILE',
      {
        path: 'output.mp4',
        encoding: 'binary'
      }
    );

  // FFmpeg Worker 返回 Uint8Array
  const outputData =
    data instanceof Uint8Array
      ? data
      : new Uint8Array(data);

  if (onProgress) {
    onProgress(100);
  }

  return new Blob(
    [
      outputData
    ],
    {
      type: 'video/mp4'
    }
  );
}

// ============================================================
// 视频截图
// ============================================================
export function captureVideoFrame(
  file
) {
  return new Promise(
    (resolve, reject) => {
      const video =
        document.createElement(
          'video'
        );

      video.preload =
        'metadata';

      video.muted = true;
      video.playsInline = true;

      const url =
        URL.createObjectURL(file);

      video.src = url;

      video.onloadeddata = () => {
        video.currentTime =
          Math.min(
            0.1,
            (video.duration || 1) /
              2
          );
      };

      video.onseeked = () => {
        const canvas =
          document.createElement(
            'canvas'
          );

        canvas.width =
          video.videoWidth;

        canvas.height =
          video.videoHeight;

        const ctx =
          canvas.getContext(
            '2d'
          );

        ctx.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height
        );

        drawWatermark(
          ctx,
          canvas.width,
          canvas.height
        );

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(
              url
            );

            if (!blob) {
              reject(
                new Error(
                  '视频截图失败'
                )
              );

              return;
            }

            resolve(blob);
          },
          'image/jpeg',
          0.85
        );
      };

      video.onerror = () => {
        URL.revokeObjectURL(
          url
        );

        reject(
          new Error(
            '视频读取失败，确认一下是不是标准的mp4格式'
          )
        );
      };
    }
  );
}

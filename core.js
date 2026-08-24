// ------- 荼荼上传后台 · 共用配置与工具函数 -------
// 视频水印测试功能用，跟正式上传流程无关

import { toBlobURL, fetchFile } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/dist/esm/index.js';

// 这两项换成你自己的 Worker 地址 / data.json 地址
export const API_BASE = "https://newtutu.dymripper.com";
export const DATA_JSON_URL = "https://newtutu.dymripper.com/data.json";

// 用可变对象包住会变化的状态
export const session = { token: null };
export const state = { categories: [] };

// ------- 文件哈希 -------

export async function hashBlob(blob) {
  const buffer = await blob.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);

  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 8);
}

// ------- 状态 -------

export function setStatus(text, kind) {
  const el = document.getElementById('status');

  if (!el) return;

  el.textContent = text;
  el.className = kind || '';
}

// ------- 图片水印 -------

const WATERMARK_TEXT = 'TUTU STUDIO   荼荼工作室   防盗预览';

function analyzeImageTone(ctx, width, height) {
  const data = ctx.getImageData(0, 0, width, height).data;
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

  const brightness = count > 0 ? total / count : 128;

  const variance =
    count > 0
      ? totalSquared / count - brightness * brightness
      : 0;

  const stdDev = Math.sqrt(Math.max(0, variance));

  return {
    brightness,
    stdDev,
  };
}

export function drawWatermark(ctx, width, height) {
  const { brightness, stdDev } =
    analyzeImageTone(ctx, width, height);

  const isLightImage = brightness > 140;

  const watermarkColor =
    isLightImage ? '#000000' : '#ffffff';

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

  const fontSize =
    Math.max(14, Math.round(width * 0.022));

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

  const diag =
    Math.ceil(
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

export function compressImage(
  file,
  maxDim,
  quality
) {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;

      const scale = Math.min(
        1,
        maxDim /
          Math.max(width, height)
      );

      width = Math.round(width * scale);
      height = Math.round(height * scale);

      const canvas =
        document.createElement('canvas');

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
          resolve(blob || file);
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

// ------- 上传 -------

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
        'X-Admin-Token': session.token,
        'Content-Type':
          blob.type ||
          'application/octet-stream',
      },
      body: blob,
    }
  );

  const data = await res.json();

  if (!data.ok) {
    throw new Error(
      data.message || '上传失败'
    );
  }

  const encodedPath =
    key
      .split('/')
      .map(encodeURIComponent)
      .join('/');

  return `${API_BASE}/${encodedPath}`;
}

// ------- 颜色工具 -------

export function splitColorHex(color) {
  if (!color) {
    return {
      hex6: '#cfc6b3',
      alphaPercent: 100,
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
      alphaPercent,
    };
  }

  return {
    hex6,
    alphaPercent: 100,
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

// ------- 编辑距离 -------

export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;

  const dp = Array.from(
    { length: m + 1 },
    () =>
      new Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }

  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
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
// ------- 视频 FFmpeg Worker 客户端 -------
// ============================================================
//
// 不再使用 @ffmpeg/ffmpeg 的 FFmpeg.load()。
// 原因：@ffmpeg/ffmpeg@0.12.10 会强制：
//
// new Worker(..., { type: "module" })
//
// 但我们的 /ffmpeg/worker.js 是 Classic Worker，
// 内部使用 importScripts()。
//
// 所以这里直接与 /ffmpeg/worker.js 通信。
// 已经实际验证：
//
// LOAD  -> true
// EXEC -version -> 0
//
// ============================================================

let ffmpegWorker = null;
let ffmpegWorkerLoaded = false;
let ffmpegMessageId = 1;
const ffmpegPending = new Map();

function createFFmpegWorker() {
  if (ffmpegWorker) {
    return ffmpegWorker;
  }

  console.log(
    '[水印测试] 创建本地 Classic FFmpeg Worker…'
  );

  ffmpegWorker =
    new Worker('/ffmpeg/worker.js');

  ffmpegWorker.onmessage = (event) => {
    const message = event.data;

    if (!message) {
      return;
    }

    // LOG
    if (message.type === 'LOG') {
      console.log(
        '[ffmpeg]',
        message.data
      );
      return;
    }

    // PROGRESS
    if (message.type === 'PROGRESS') {
      const progress =
        message.data?.progress;

      if (typeof progress === 'number') {
        ffmpegProgressCallbacks.forEach(
          (callback) => {
            try {
              callback(
                message.data
              );
            } catch (error) {
              console.error(
                '[FFmpeg progress callback]',
                error
              );
            }
          }
        );
      }

      return;
    }

    // 普通请求响应
    if (
      message.id !== undefined &&
      ffmpegPending.has(message.id)
    ) {
      const pending =
        ffmpegPending.get(
          message.id
        );

      ffmpegPending.delete(
        message.id
      );

      if (
        message.type === 'ERROR'
      ) {
        pending.reject(
          new Error(
            message.data ||
              'FFmpeg Worker error'
          )
        );
      } else {
        pending.resolve(
          message.data
        );
      }
    }
  };

  ffmpegWorker.onerror = (event) => {
    console.error(
      '[FFmpeg Worker ERROR]',
      event
    );

    const error =
      new Error(
        'FFmpeg Worker 发生错误'
      );

    for (
      const pending of ffmpegPending.values()
    ) {
      pending.reject(error);
    }

    ffmpegPending.clear();
  };

  return ffmpegWorker;
}

function sendFFmpegMessage(
  type,
  data
) {
  return new Promise(
    (resolve, reject) => {
      const worker =
        createFFmpegWorker();

      const id =
        ffmpegMessageId++;

      ffmpegPending.set(
        id,
        {
          resolve,
          reject,
        }
      );

      try {
        worker.postMessage({
          id,
          type,
          data,
        });
      } catch (error) {
        ffmpegPending.delete(id);
        reject(error);
      }
    }
  );
}

const ffmpegProgressCallbacks =
  new Set();

function onFFmpegProgress(callback) {
  ffmpegProgressCallbacks.add(
    callback
  );

  return () => {
    ffmpegProgressCallbacks.delete(
      callback
    );
  };
}

async function loadFFmpeg() {
  if (ffmpegWorkerLoaded) {
    return;
  }

  console.log(
    '[水印测试] 1/6 开始加载ffmpeg核心文件…'
  );

  const baseURL =
    'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';

  console.log(
    '[水印测试] 1a/6 正在下载 ffmpeg-core.js…'
  );

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

  createFFmpegWorker();

  console.log(
    '[水印测试] 1d/6 三个文件都准备完了，开始初始化ffmpeg…'
  );

  await sendFFmpegMessage(
    'LOAD',
    {
      coreURL,
      wasmURL,
      workerURL: '',
    }
  );

  ffmpegWorkerLoaded = true;

  console.log(
    '[水印测试] 2/6 ffmpeg核心加载完成'
  );
}

// ------- FFmpeg 文件操作 -------

async function ffmpegWriteFile(
  path,
  data
) {
  return sendFFmpegMessage(
    'WRITE_FILE',
    {
      path,
      data,
    }
  );
}

async function ffmpegReadFile(
  path,
  encoding = 'binary'
) {
  return sendFFmpegMessage(
    'READ_FILE',
    {
      path,
      encoding,
    }
  );
}

async function ffmpegDeleteFile(
  path
) {
  return sendFFmpegMessage(
    'DELETE_FILE',
    {
      path,
    }
  );
}

async function ffmpegExec(
  args,
  timeout = -1
) {
  return sendFFmpegMessage(
    'EXEC',
    {
      args,
      timeout,
    }
  );
}

// ------- 视频水印测试 -------

export async function watermarkVideoTest(
  file,
  onProgress
) {
  await loadFFmpeg();

  let removeProgress = null;

  if (onProgress) {
    removeProgress =
      onFFmpegProgress(
        ({ progress }) => {
          onProgress(
            Math.min(
              99,
              Math.max(
                0,
                Math.round(
                  progress * 100
                )
              )
            )
          );
        }
      );
  }

  try {
    console.log(
      '[水印测试] 3/6 正在写入原始视频…'
    );

    const inputData =
      await fetchFile(file);

    await ffmpegWriteFile(
      'input.mp4',
      inputData
    );

    console.log(
      '[水印测试] 4/6 写入完成，正在加载字体文件…'
    );

    const fontData =
      await fetchFile(
        'https://tutu.dymripper.com/font.ttf'
      );

    await ffmpegWriteFile(
      'font.ttf',
      fontData
    );

    console.log(
      '[水印测试] 5/6 字体加载完成，开始执行编码命令…'
    );

    const drawText = (
      x,
      y
    ) =>
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
      ),
    ].join(',');

    const result =
      await ffmpegExec([
        '-i',
        'input.mp4',
        '-vf',
        filter,
        '-preset',
        'ultrafast',
        '-c:a',
        'copy',
        'output.mp4',
      ]);

    if (result !== 0) {
      throw new Error(
        `FFmpeg 执行失败，返回码：${result}`
      );
    }

    console.log(
      '[水印测试] 6/6 编码完成，正在读取结果…'
    );

    const outputData =
      await ffmpegReadFile(
        'output.mp4',
        'binary'
      );

    const outputBytes =
      outputData instanceof Uint8Array
        ? outputData
        : new Uint8Array(
            outputData
          );

    return new Blob(
      [
        outputBytes.buffer
      ],
      {
        type: 'video/mp4',
      }
    );
  } finally {
    if (removeProgress) {
      removeProgress();
    }

    // 清理 Worker 文件系统。
    // 如果某个文件不存在，不影响最终结果。
    try {
      await ffmpegDeleteFile(
        'input.mp4'
      );
    } catch (_) {}

    try {
      await ffmpegDeleteFile(
        'font.ttf'
      );
    } catch (_) {}

    try {
      await ffmpegDeleteFile(
        'output.mp4'
      );
    } catch (_) {}
  }
}

// ------- 视频截帧 -------

export function captureVideoFrame(
  file
) {
  return new Promise(
    (resolve, reject) => {
      const video =
        document.createElement(
          'video'
        );

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      const url =
        URL.createObjectURL(file);

      video.src = url;

      video.onloadeddata = () => {
        video.currentTime =
          Math.min(
            0.1,
            (video.duration || 1) / 2
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
                  '视频截帧失败'
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
        URL.revokeObjectURL(url);

        reject(
          new Error(
            '视频读取失败，确认一下是不是标准的mp4格式'
          )
        );
      };
    }
  );
}
```

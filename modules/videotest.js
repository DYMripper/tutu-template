// ------- 视频水印隔离测试（不接入正式上传流程，纯粹用来验证 ffmpeg.wasm 能不能跑通） -------
import { watermarkVideoTest } from '../core.js';

export function initVideoTest() {
  const btn = document.getElementById('videoTestBtn');
  const fileInput = document.getElementById('videoTestFile');
  const statusEl = document.getElementById('videoTestStatus');
  const resultEl = document.getElementById('videoTestResult');
  if (!btn) return; // 这个测试区块可能没加进当前页面，没有就跳过

  btn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
      statusEl.textContent = '先选一个mp4文件';
      return;
    }
    btn.disabled = true;
    resultEl.innerHTML = '';
    statusEl.textContent = '正在处理…这一步比较慢，Console里能看到详细进度日志';
    try {
      const blob = await watermarkVideoTest(file, (pct) => {
        statusEl.textContent = `正在处理… ${pct}%（Console里有更详细的分步日志）`;
      });
      statusEl.textContent = '✅ 处理完成，下面直接预览结果（这个结果不会自动上传到任何地方）';
      const url = URL.createObjectURL(blob);
      resultEl.innerHTML = `
        <video src="${url}" controls style="max-width:100%;border-radius:6px;margin-top:10px;"></video>
        <div style="margin-top:8px;"><a href="${url}" download="watermark-test.mp4">下载测试结果</a></div>
      `;
    } catch (err) {
      statusEl.textContent = '❌ 出错了：' + err.message;
      console.error(err);
    } finally {
      btn.disabled = false;
    }
  });
}
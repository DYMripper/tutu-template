// ------- "新增模板"面板 -------
import {
  API_BASE,
  session,
  state,
  setStatus,
  compressImage,
  uploadToWorker,
  hashBlob,
  combineColorHex,
  splitColorHex,
  levenshtein,
  captureVideoFrame,
  watermarkVideoTest
} from '../core.js';

const catSelect =
  document.getElementById('catSelect');

const newCatToggle =
  document.getElementById('newCatToggle');

const newCatBox =
  document.getElementById('newCatBox');

const videoModeCheck =
  document.getElementById('videoModeCheck');

const fileInput =
  document.getElementById('fileInput');

const fileFieldsetLegend =
  document.getElementById('fileFieldsetLegend');


// ============================================================
// 刷新上传面板
// ============================================================

export function refreshUploadPanel() {
  const keepSelection =
    catSelect.value;

  catSelect.innerHTML =
    state.categories
      .map(
        (c) =>
          `<option value="${c.key}" data-name="${c.name}">${c.name}</option>`
      )
      .join('');

  if (
    keepSelection &&
    state.categories.some(
      (c) => c.key === keepSelection
    )
  ) {
    catSelect.value =
      keepSelection;
  }

  document.getElementById(
    'existingCatNames'
  ).textContent =
    state.categories
      .map((c) => c.name)
      .join('、');

  fillPrefixFromSelectedCategory();
}


// ============================================================
// 根据分类自动填写前缀和颜色
// ============================================================

function fillPrefixFromSelectedCategory() {
  const usingNewCat =
    newCatBox.style.display === 'block';

  if (usingNewCat) return;

  const cat =
    state.categories.find(
      (c) => c.key === catSelect.value
    );

  const firstItem =
    cat?.items?.[0];

  const m =
    firstItem?.code &&
    String(firstItem.code).match(
      /^(.*)-\d+$/
    );

  document.getElementById(
    'prefixInput'
  ).value =
    m ? m[1] : '';

  if (firstItem?.color) {
    const {
      hex6,
      alphaPercent
    } =
      splitColorHex(
        firstItem.color
      );

    document.getElementById(
      'colorInput'
    ).value =
      hex6;

    document.getElementById(
      'colorAlphaInput'
    ).value =
      alphaPercent;

    document.getElementById(
      'colorAlphaLabel'
    ).textContent =
      alphaPercent + '%';
  }
}


// ============================================================
// 初始化上传面板
// ============================================================

export function initUpload() {

  catSelect.addEventListener(
    'change',
    fillPrefixFromSelectedCategory
  );


  // 新分类按钮
  newCatToggle.addEventListener(
    'click',
    () => {

      const showing =
        newCatBox.style.display ===
        'block';

      newCatBox.style.display =
        showing
          ? 'none'
          : 'block';

      catSelect.disabled =
        !showing;

      fillPrefixFromSelectedCategory();
    }
  );


  // 透明度
  document
    .getElementById(
      'colorAlphaInput'
    )
    .addEventListener(
      'input',
      (e) => {

        document.getElementById(
          'colorAlphaLabel'
        ).textContent =
          e.target.value + '%';

      }
    );


  // ==========================================================
  // 视频 / 图片模式切换
  // ==========================================================

  videoModeCheck.addEventListener(
    'change',
    () => {

      const isVideo =
        videoModeCheck.checked;

      fileInput.accept =
        isVideo
          ? 'video/mp4'
          : 'image/*';

      fileFieldsetLegend.textContent =
        isVideo
          ? '视频（可多选，每个视频各自变成一个新模板，编号从文件名里的数字自动提取）'
          : '图片（可多选，每张图各自变成一个新模板，编号从文件名里的数字自动提取）';

      fileInput.value = '';

      document.getElementById(
        'filePreview'
      ).innerHTML = '';
    }
  );


  // ==========================================================
  // 文件预览
  // ==========================================================

  fileInput.addEventListener(
    'change',
    (e) => {

      const preview =
        document.getElementById(
          'filePreview'
        );

      preview.innerHTML = '';

      const isVideo =
        videoModeCheck.checked;

      Array.from(
        e.target.files
      ).forEach((file) => {

        const url =
          URL.createObjectURL(file);

        const wrap =
          document.createElement(
            'div'
          );

        wrap.style.cssText =
          'text-align:center;';

        const mediaTag =
          isVideo

            ? `<video src="${url}" muted style="width:64px;height:64px;object-fit:cover;border-radius:4px;border:1px solid var(--line);display:block;"></video>`

            : `<img src="${url}" style="width:64px;height:64px;object-fit:cover;border-radius:4px;border:1px solid var(--line);display:block;">`;

        wrap.innerHTML = `
          ${mediaTag}

          <div style="
            font-size:10px;
            color:var(--ink-soft);
            max-width:64px;
            overflow:hidden;
            text-overflow:ellipsis;
            white-space:nowrap;
            margin-top:2px;
          ">
            ${file.name}
          </div>
        `;

        preview.appendChild(
          wrap
        );
      });
    }
  );


  // ==========================================================
  // 上传按钮
  // ==========================================================

  document
    .getElementById('submitBtn')
    .addEventListener(
      'click',
      handleSubmit
    );
}


// ============================================================
// 上传处理
// ============================================================

async function handleSubmit() {

  const usingNewCat =
    newCatBox.style.display ===
    'block';


  const categoryName =
    usingNewCat

      ? document
          .getElementById(
            'newCatName'
          )
          .value
          .trim()

      : catSelect
          .selectedOptions[0]
          ?.dataset.name;


  const categoryKey =
    usingNewCat
      ? categoryName
      : catSelect.value;


  const ratio =
    document.getElementById(
      'ratioSelect'
    ).value;


  const color =
    combineColorHex(
      document.getElementById(
        'colorInput'
      ).value,

      document.getElementById(
        'colorAlphaInput'
      ).value
    );


  const files =
    document.getElementById(
      'fileInput'
    ).files;


  // ==========================================================
  // 基础检查
  // ==========================================================

  if (
    !categoryKey ||
    files.length === 0
  ) {

    setStatus(
      '分类、图片都是必填的',
      'err'
    );

    return;
  }


  // ==========================================================
  // 新分类检查
  // ==========================================================

  if (usingNewCat) {

    const similar =
      state.categories.find(
        (c) =>
          c.name !== categoryName &&
          levenshtein(
            c.name,
            categoryName
          ) <= 1
      );


    if (similar) {

      const proceed =
        confirm(
          `已有一个很像的分类叫「${similar.name}」，你填的是「${categoryName}」，确定不是打错字、真的要新建一个不一样的分类吗？`
        );


      if (!proceed) {

        setStatus(
          '已取消，请检查分类名称是不是打错字了',
          'err'
        );

        return;
      }
    }
  }


  // ==========================================================
  // UI
  // ==========================================================

  const submitBtn =
    document.getElementById(
      'submitBtn'
    );

  submitBtn.disabled =
    true;


  const progressBar =
    document.getElementById(
      'progressBar'
    );


  const progressFill =
    document.getElementById(
      'progressFill'
    );


  progressBar.style.display =
    'block';


  // ==========================================================
  // 上传过程中成功的文件
  // ==========================================================

  const uploadedKeysThisAttempt =
    [];


  let addBatchSucceeded =
    false;


  try {

    // ========================================================
    // 编号
    // ========================================================

    const CODE_WIDTH =
      3;


    const manualPrefix =
      document
        .getElementById(
          'prefixInput'
        )
        .value
        .trim();


    if (!manualPrefix) {

      throw new Error(
        '需要填"编号前缀"'
      );
    }


    // ========================================================
    // 检查文件名
    // ========================================================

    const invalidNames =
      [];


    const parsedFiles =
      [];


    for (
      const file of files
    ) {

      const baseName =
        file.name.replace(
          /\.[^.]+$/,
          ''
        );


      if (
        !/^\d+(\.\d+)?$/.test(
          baseName
        )
      ) {

        invalidNames.push(
          file.name
        );

      } else {

        parsedFiles.push({
          file,

          intPart:
            baseName.split(
              '.'
            )[0]
        });
      }
    }


    if (
      invalidNames.length > 0
    ) {

      throw new Error(
        '以下文件名不符合规则（必须是纯数字，最多一个小数点，比如 1.jpg 或 2.1.jpg，不能有汉字/字母）：' +
          invalidNames.join('、')
      );
    }


    // ========================================================
    // 模式
    // ========================================================

    const isVideo =
      videoModeCheck.checked;


    const items =
      [];


    console.log(
      '================================================'
    );

    console.log(
      `[上传] 开始处理，共 ${parsedFiles.length} 个${isVideo ? '视频' : '图片'}`
    );

    console.log(
      `[上传] 分类: ${categoryKey}`
    );

    console.log(
      `[上传] 编号前缀: ${manualPrefix}`
    );

    console.log(
      '================================================'
    );


    setStatus(
      `正在上传${isVideo ? '视频' : '图片'} 0/${parsedFiles.length}`
    );


    // ========================================================
    // 逐个处理
    // ========================================================

    for (
      let i = 0;
      i < parsedFiles.length;
      i++
    ) {

      const {
        file,
        intPart
      } =
        parsedFiles[i];


      const code =
        `${manualPrefix}-${intPart.padStart(
          CODE_WIDTH,
          '0'
        )}`;


      const current =
        i + 1;


      console.log(
        ''
      );

      console.log(
        '------------------------------------------------'
      );

      console.log(
        `[${current}/${parsedFiles.length}] 开始处理: ${file.name}`
      );

      console.log(
        `[${current}/${parsedFiles.length}] 模板编号: ${code}`
      );

      console.log(
        '------------------------------------------------'
      );


      // ======================================================
      // 视频
      // ======================================================

      if (isVideo) {

        // ----------------------------------------------------
        // 1. 生成缩略图
        // ----------------------------------------------------

        console.log(
          `[${current}/${parsedFiles.length}] 正在生成视频缩略图...`
        );


        setStatus(
          `正在处理视频 ${current}/${parsedFiles.length}：生成缩略图…`
        );


        const posterBlob =
          await captureVideoFrame(
            file
          );


        console.log(
          `[${current}/${parsedFiles.length}] 视频缩略图生成完成，大小: ${posterBlob.size} bytes`
        );


        const posterHash =
          await hashBlob(
            posterBlob
          );


        const posterKey =
          `Templates/${categoryKey}/${manualPrefix}-${intPart}-${posterHash}.jpg`;


        console.log(
          `[${current}/${parsedFiles.length}] 开始上传缩略图: ${posterKey}`
        );


        const posterUrl =
          await uploadToWorker(
            posterKey,
            posterBlob
          );


        uploadedKeysThisAttempt.push(
          posterKey
        );


        console.log(
          `[${current}/${parsedFiles.length}] 缩略图上传完成: ${posterUrl}`
        );


        // ----------------------------------------------------
        // 2. FFmpeg 视频水印
        // ----------------------------------------------------

        console.log(
          `[${current}/${parsedFiles.length}] ================================`
        );

        console.log(
          `[${current}/${parsedFiles.length}] 开始 FFmpeg 视频水印处理`
        );

        console.log(
          `[${current}/${parsedFiles.length}] 文件: ${file.name}`
        );

        console.log(
          `[${current}/${parsedFiles.length}] 原始大小: ${file.size} bytes`
        );

        console.log(
          `[${current}/${parsedFiles.length}] ================================`
        );


        setStatus(
          `正在处理视频 ${current}/${parsedFiles.length}：FFmpeg 添加水印…`
        );


        const watermarkStart =
          performance.now();


        const watermarkedVideo =
          await watermarkVideoTest(
            file,
            (progress) => {

              console.log(
                `[${current}/${parsedFiles.length}] FFmpeg 进度:`,
                progress
              );

            }
          );


        const watermarkTime =
          (
            (performance.now() -
              watermarkStart) /
            1000
          ).toFixed(1);


        console.log(
          `[${current}/${parsedFiles.length}] FFmpeg 水印处理完成`
        );

        console.log(
          `[${current}/${parsedFiles.length}] 处理耗时: ${watermarkTime}s`
        );

        console.log(
          `[${current}/${parsedFiles.length}] 原视频大小: ${file.size} bytes`
        );

        console.log(
          `[${current}/${parsedFiles.length}] 水印视频大小: ${watermarkedVideo.size} bytes`
        );


        // ----------------------------------------------------
        // 3. 计算水印视频 hash
        // ----------------------------------------------------

        console.log(
          `[${current}/${parsedFiles.length}] 正在计算视频 Hash...`
        );


        const videoHash =
          await hashBlob(
            watermarkedVideo
          );


        const videoKey =
          `Templates/${categoryKey}/${manualPrefix}-${intPart}-${videoHash}.mp4`;


        console.log(
          `[${current}/${parsedFiles.length}] 视频 Hash: ${videoHash}`
        );


        // ----------------------------------------------------
        // 4. 上传水印视频
        // ----------------------------------------------------

        console.log(
          `[${current}/${parsedFiles.length}] 开始上传加水印视频...`
        );

        console.log(
          `[${current}/${parsedFiles.length}] 上传 Key: ${videoKey}`
        );


        setStatus(
          `正在上传视频 ${current}/${parsedFiles.length}：${code}…`
        );


        const uploadStart =
          performance.now();


        const videoUrl =
          await uploadToWorker(
            videoKey,
            watermarkedVideo
          );


        const uploadTime =
          (
            (performance.now() -
              uploadStart) /
            1000
          ).toFixed(1);


        uploadedKeysThisAttempt.push(
          videoKey
        );


        console.log(
          `[${current}/${parsedFiles.length}] 视频上传完成`
        );

        console.log(
          `[${current}/${parsedFiles.length}] 上传耗时: ${uploadTime}s`
        );

        console.log(
          `[${current}/${parsedFiles.length}] 视频 URL: ${videoUrl}`
        );


        // ----------------------------------------------------
        // 5. 保存模板
        // ----------------------------------------------------

        items.push({
          code,

          images: [
            posterUrl
          ],

          video:
            videoUrl,

          color,

          ratio
        });


        console.log(
          `[${current}/${parsedFiles.length}] 视频处理全部完成: ${file.name}`
        );
      }


      // ======================================================
      // 图片
      // ======================================================

      else {

        console.log(
          `[${current}/${parsedFiles.length}] 开始压缩图片并添加水印: ${file.name}`
        );


        setStatus(
          `正在处理图片 ${current}/${parsedFiles.length}：压缩并添加水印…`
        );


        const toUpload =
          await compressImage(
            file,
            2000,
            0.85
          );


        console.log(
          `[${current}/${parsedFiles.length}] 图片处理完成`
        );

        console.log(
          `[${current}/${parsedFiles.length}] 原始大小: ${file.size} bytes`
        );

        console.log(
          `[${current}/${parsedFiles.length}] 上传大小: ${toUpload.size} bytes`
        );


        const ext =
          (
            file.name
              .split('.')
              .pop() ||
            'jpg'
          ).toLowerCase();


        const hash =
          await hashBlob(
            toUpload
          );


        const key =
          `Templates/${categoryKey}/${manualPrefix}-${intPart}-${hash}.${ext}`;


        console.log(
          `[${current}/${parsedFiles.length}] 开始上传图片: ${key}`
        );


        const imageUrl =
          await uploadToWorker(
            key,
            toUpload
          );


        uploadedKeysThisAttempt.push(
          key
        );


        console.log(
          `[${current}/${parsedFiles.length}] 图片上传完成: ${imageUrl}`
        );


        items.push({
          code,

          images: [
            imageUrl
          ],

          color,

          ratio
        });


        console.log(
          `[${current}/${parsedFiles.length}] 图片处理全部完成: ${file.name}`
        );
      }


      // ======================================================
      // 当前文件完成
      // ======================================================

      const totalProgress =
        (
          ((i + 1) /
            parsedFiles.length) *
          100
        );


      progressFill.style.width =
        totalProgress +
        '%';


      setStatus(
        `正在上传${isVideo ? '视频' : '图片'} ${current}/${parsedFiles.length}（编号 ${code}）`
      );


      console.log(
        `[上传总进度] ${current}/${parsedFiles.length} (${totalProgress.toFixed(0)}%)`
      );
    }


    // ========================================================
    // 所有文件上传完成
    // ========================================================

    console.log(
      ''
    );

    console.log(
      '================================================'
    );

    console.log(
      '[上传] 所有文件已经上传完成'
    );

    console.log(
      '[上传] 开始调用 /addbatch 更新模板列表'
    );

    console.log(
      '================================================'
    );


    setStatus(
      '传完了，正在批量更新模板列表…'
    );


    const addRes =
      await fetch(
        API_BASE +
          '/addbatch',
        {
          method:
            'POST',

          headers: {
            'Content-Type':
              'application/json',

            'X-Admin-Token':
              session.token
          },

          body:
            JSON.stringify({
              categoryKey,
              categoryName,
              items
            })
        }
      );


    console.log(
      '[addbatch] HTTP Status:',
      addRes.status
    );


    const addData =
      await addRes.json();


    console.log(
      '[addbatch] Response:',
      addData
    );


    if (!addData.ok) {

      throw new Error(
        addData.message ||
          '批量更新失败'
      );
    }


    addBatchSucceeded =
      true;


    // ========================================================
    // 成功
    // ========================================================

    console.log(
      '================================================'
    );

    console.log(
      `[上传] ✅ 全部成功！新增 ${addData.added} 款`
    );

    console.log(
      `[上传] 分类: ${categoryName || categoryKey}`
    );

    console.log(
      `[上传] 当前总模板数: ${addData.total}`
    );

    console.log(
      '================================================'
    );


    setStatus(
      `✅ 上传成功！新增了 ${addData.added} 款，「${categoryName || categoryKey}」分类现在有 ${addData.total} 款模板了`,
      'ok'
    );


    document.getElementById(
      'fileInput'
    ).value = '';


    progressFill.style.width =
      '0%';


    document.dispatchEvent(
      new CustomEvent(
        'tutu:refresh'
      )
    );

  }


  // ==========================================================
  // 错误处理
  // ==========================================================

  catch (err) {

    console.error(
      ''
    );

    console.error(
      '================================================'
    );

    console.error(
      '[上传] ❌ 上传失败'
    );

    console.error(
      '[上传] 错误:',
      err
    );

    console.error(
      '[上传] 错误信息:',
      err?.message
    );

    console.error(
      '================================================'
    );


    // --------------------------------------------------------
    // 清理已经上传但尚未写入 data.json 的文件
    // --------------------------------------------------------

    if (
      !addBatchSucceeded &&
      uploadedKeysThisAttempt.length >
        0
    ) {

      console.warn(
        '[清理] data.json 尚未更新，开始清理已经上传的文件...'
      );


      setStatus(
        '出错了，正在清理已经传上去的文件…'
      );


      for (
        const key of
          uploadedKeysThisAttempt
      ) {

        try {

          console.log(
            '[清理] 删除:',
            key
          );


          const cleanupRes =
            await fetch(
              API_BASE +
                '/deletefile',
              {
                method:
                  'POST',

                headers: {
                  'Content-Type':
                    'application/json',

                  'X-Admin-Token':
                    session.token
                },

                body:
                  JSON.stringify({
                    key
                  })
              }
            );


          console.log(
            '[清理] 删除结果:',
            key,
            cleanupRes.status
          );

        }

        catch (
          cleanupErr
        ) {

          console.error(
            '[清理] 清理孤儿文件失败:',
            key,
            cleanupErr
          );
        }
      }


      console.log(
        '[清理] 清理流程结束'
      );
    }


    setStatus(
      '❌ 出错了：' +
        err.message,
      'err'
    );
  }


  // ==========================================================
  // 恢复按钮
  // ==========================================================

  finally {

    submitBtn.disabled =
      false;
  }
}
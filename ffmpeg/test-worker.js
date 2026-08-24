self.onmessage = async (e) => {
    try {
        const { coreURL, wasmURL } = e.data;

        importScripts(coreURL);

        if (typeof self.createFFmpegCore !== 'function') {
            throw new Error('createFFmpegCore 不存在');
        }

        const ffmpeg = await self.createFFmpegCore({
            mainScriptUrlOrBlob:
                coreURL +
                '#' +
                btoa(JSON.stringify({
                    wasmURL,
                    workerURL: ''
                }))
        });

        self.postMessage({
            ok: true,
            message: 'FFmpeg WASM 初始化成功',
            type: typeof ffmpeg
        });

    } catch (err) {
        self.postMessage({
            ok: false,
            error: String(err),
            name: err?.name,
            message: err?.message,
            stack: err?.stack
        });
    }
};
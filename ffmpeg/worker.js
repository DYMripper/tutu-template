/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// FFmpeg Classic Worker
// 不使用 ES Module import。
// 必须通过 Classic Worker 启动：
// new Worker('/ffmpeg/worker.js')

const CORE_URL =
    "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js";

const FFMessageType = {
    LOAD: "LOAD",
    EXEC: "EXEC",
    WRITE_FILE: "WRITE_FILE",
    READ_FILE: "READ_FILE",
    DELETE_FILE: "DELETE_FILE",
    RENAME: "RENAME",
    CREATE_DIR: "CREATE_DIR",
    LIST_DIR: "LIST_DIR",
    DELETE_DIR: "DELETE_DIR",
    ERROR: "ERROR",
    DOWNLOAD: "DOWNLOAD",
    PROGRESS: "PROGRESS",
    LOG: "LOG",
    MOUNT: "MOUNT",
    UNMOUNT: "UNMOUNT",
};

const ERROR_UNKNOWN_MESSAGE_TYPE =
    new Error("unknown message type");

const ERROR_NOT_LOADED =
    new Error("ffmpeg is not loaded, call `await ffmpeg.load()` first");

let ffmpeg = null;

const load = async ({
    coreURL: _coreURL,
    wasmURL: _wasmURL,
    workerURL: _workerURL,
}) => {
    const first = !ffmpeg;

    if (!_coreURL) {
        _coreURL = CORE_URL;
    }

    // Classic Worker 可以使用 importScripts()
    importScripts(_coreURL);

    const coreURL = _coreURL;

    const wasmURL = _wasmURL
        ? _wasmURL
        : _coreURL.replace(/\.js$/g, ".wasm");

    const workerURL = _workerURL
        ? _workerURL
        : _coreURL.replace(/\.js$/g, ".worker.js");

    if (typeof self.createFFmpegCore !== "function") {
        throw new Error(
            "createFFmpegCore 不存在，ffmpeg-core.js 加载失败"
        );
    }

    ffmpeg = await self.createFFmpegCore({
        mainScriptUrlOrBlob:
            `${coreURL}#${btoa(
                JSON.stringify({
                    wasmURL,
                    workerURL,
                })
            )}`,
    });

    ffmpeg.setLogger((data) => {
        self.postMessage({
            type: FFMessageType.LOG,
            data,
        });
    });

    ffmpeg.setProgress((data) => {
        self.postMessage({
            type: FFMessageType.PROGRESS,
            data,
        });
    });

    return first;
};

const exec = ({ args, timeout = -1 }) => {
    if (!ffmpeg) {
        throw ERROR_NOT_LOADED;
    }

    ffmpeg.setTimeout(timeout);

    ffmpeg.exec(...args);

    const ret = ffmpeg.ret;

    ffmpeg.reset();

    return ret;
};

const writeFile = ({ path, data }) => {
    if (!ffmpeg) {
        throw ERROR_NOT_LOADED;
    }

    ffmpeg.FS.writeFile(path, data);

    return true;
};

const readFile = ({ path, encoding }) => {
    if (!ffmpeg) {
        throw ERROR_NOT_LOADED;
    }

    return ffmpeg.FS.readFile(path, { encoding });
};

const deleteFile = ({ path }) => {
    if (!ffmpeg) {
        throw ERROR_NOT_LOADED;
    }

    ffmpeg.FS.unlink(path);

    return true;
};

const rename = ({ oldPath, newPath }) => {
    if (!ffmpeg) {
        throw ERROR_NOT_LOADED;
    }

    ffmpeg.FS.rename(oldPath, newPath);

    return true;
};

const createDir = ({ path }) => {
    if (!ffmpeg) {
        throw ERROR_NOT_LOADED;
    }

    ffmpeg.FS.mkdir(path);

    return true;
};

const listDir = ({ path }) => {
    if (!ffmpeg) {
        throw ERROR_NOT_LOADED;
    }

    const names = ffmpeg.FS.readdir(path);
    const nodes = [];

    for (const name of names) {
        const stat = ffmpeg.FS.stat(`${path}/${name}`);

        nodes.push({
            name,
            isDir: ffmpeg.FS.isDir(stat.mode),
        });
    }

    return nodes;
};

const deleteDir = ({ path }) => {
    if (!ffmpeg) {
        throw ERROR_NOT_LOADED;
    }

    ffmpeg.FS.rmdir(path);

    return true;
};

const mount = ({ fsType, options, mountPoint }) => {
    if (!ffmpeg) {
        throw ERROR_NOT_LOADED;
    }

    const fs = ffmpeg.FS.filesystems[fsType];

    if (!fs) {
        return false;
    }

    ffmpeg.FS.mount(
        fs,
        options,
        mountPoint
    );

    return true;
};

const unmount = ({ mountPoint }) => {
    if (!ffmpeg) {
        throw ERROR_NOT_LOADED;
    }

    ffmpeg.FS.unmount(mountPoint);

    return true;
};

// Worker 消息入口
self.onmessage = async ({ data: message }) => {
    const { id, type, data } = message;

    let result;

    try {
        switch (type) {
            case FFMessageType.LOAD:
                result = await load(data);
                break;

            case FFMessageType.EXEC:
                result = exec(data);
                break;

            case FFMessageType.WRITE_FILE:
                result = writeFile(data);
                break;

            case FFMessageType.READ_FILE:
                result = readFile(data);
                break;

            case FFMessageType.DELETE_FILE:
                result = deleteFile(data);
                break;

            case FFMessageType.RENAME:
                result = rename(data);
                break;

            case FFMessageType.CREATE_DIR:
                result = createDir(data);
                break;

            case FFMessageType.LIST_DIR:
                result = listDir(data);
                break;

            case FFMessageType.DELETE_DIR:
                result = deleteDir(data);
                break;

            case FFMessageType.MOUNT:
                result = mount(data);
                break;

            case FFMessageType.UNMOUNT:
                result = unmount(data);
                break;

            default:
                throw ERROR_UNKNOWN_MESSAGE_TYPE;
        }
    } catch (error) {
        self.postMessage({
            id,
            type: FFMessageType.ERROR,
            data: error instanceof Error
                ? `${error.name}: ${error.message}`
                : String(error),
        });

        return;
    }

    // readFile() 返回 Uint8Array 时，
    // 把底层 ArrayBuffer 作为 transferable 传回主线程。
    const trans = [];

    if (result instanceof Uint8Array) {
        trans.push(result.buffer);
    }

    self.postMessage(
        {
            id,
            type,
            data: result,
        },
        trans
    );
};
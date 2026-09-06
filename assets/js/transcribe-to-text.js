(() => {
  "use strict";

  const MODEL = {
    label: "本地语音模型",
    url: "/tools/transcribe-to-text/models/ggml-tiny-q5_1.bin",
    cacheKey: "whisper-tiny-multilingual-q5_1-v1",
    expectedBytes: 32152673,
    expectedSha256: "818710568da3ca15689e31a743197b520007872ff9576237bda97bd1b469c3d7"
  };
  const DB_NAME = "chloevolution-transcribe";
  const DB_VERSION = 1;
  const MAX_BYTES = 200 * 1024 * 1024;
  const MAX_SECONDS = 10 * 60;
  const TARGET_SAMPLE_RATE = 16000;
  const MAX_CHUNK_SECONDS = 20;
  const MIN_CHUNK_SECONDS = 10;
  const SILENCE_WINDOW_SECONDS = 0.2;

  const root = document.querySelector("[data-transcribe-root]");
  if (!root) return;
  const WORKER_URL = root.dataset.workerUrl;
  const exportTools = window.TranscribeExport;

  const elements = {
    mobileNotice: root.querySelector("[data-mobile-notice]"),
    dropZone: root.querySelector("[data-drop-zone]"),
    dropTitle: root.querySelector("[data-drop-title]"),
    dropHelp: root.querySelector("[data-drop-help]"),
    fileInput: root.querySelector("[data-file-input]"),
    fileCard: root.querySelector("[data-file-card]"),
    fileName: root.querySelector("[data-file-name]"),
    fileMeta: root.querySelector("[data-file-meta]"),
    removeFile: root.querySelector("[data-remove-file]"),
    start: root.querySelector("[data-start]"),
    cancel: root.querySelector("[data-cancel]"),
    statusPanel: root.querySelector(".status-panel"),
    status: root.querySelector("[data-status]"),
    statusHelp: root.querySelector("[data-status-help]"),
    progressLabel: root.querySelector("[data-progress-label]"),
    progressTrack: root.querySelector("[data-progress-track]"),
    progressBar: root.querySelector("[data-progress-bar]"),
    resultPanel: root.querySelector("[data-result-panel]"),
    result: root.querySelector("[data-result]"),
    actionFeedback: root.querySelector("[data-action-feedback]"),
    copy: root.querySelector("[data-copy]"),
    downloadTxt: root.querySelector("[data-download-txt]"),
    downloadSrt: root.querySelector("[data-download-srt]"),
    modelStatus: root.querySelector("[data-model-status]"),
    deleteModel: root.querySelector("[data-delete-model]"),
    debugLog: root.querySelector("[data-debug-log]")
  };

  let selectedFile = null;
  let selectedDuration = 0;
  let processing = false;
  let cancelled = false;
  let worker = null;
  let pendingWorkerAction = null;
  let downloadController = null;
  let segments = [];
  let selectionVersion = 0;
  let modelIsCached = false;
  let environmentBlocked = false;

  function setStatus(message, progress = 0, help = "", isError = false) {
    const value = Math.max(0, Math.min(100, Number(progress) || 0));
    elements.status.textContent = message;
    elements.statusHelp.textContent = help;
    elements.progressLabel.textContent = value > 0 ? `${Math.round(value)}%` : "";
    elements.progressBar.style.width = `${value}%`;
    elements.progressTrack.setAttribute("aria-valuenow", String(Math.round(value)));
    elements.statusPanel.classList.toggle("is-error", isError);
  }

  function appendLog(line) {
    elements.debugLog.textContent += `${line}\n`;
    elements.debugLog.scrollTop = elements.debugLog.scrollHeight;
  }

  function updateControls() {
    elements.start.disabled = processing || !selectedFile || environmentBlocked;
    elements.cancel.hidden = !processing;
    elements.fileInput.disabled = processing || environmentBlocked;
    elements.removeFile.disabled = processing;
    elements.deleteModel.disabled = processing || !modelIsCached;
  }

  function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function formatDuration(seconds) {
    const total = Math.max(0, Math.round(seconds));
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return `${minutes}:${String(rest).padStart(2, "0")}`;
  }

  function isSupportedFile(file) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    return extension === "mp3" || extension === "wav";
  }

  function resetResult() {
    segments = [];
    elements.result.replaceChildren();
    elements.resultPanel.hidden = true;
    elements.actionFeedback.textContent = "";
  }

  function clearFile() {
    selectionVersion += 1;
    selectedFile = null;
    selectedDuration = 0;
    elements.fileInput.value = "";
    elements.fileCard.hidden = true;
    elements.dropTitle.textContent = "选择音频文件";
    elements.dropHelp.textContent = "或者把文件拖到这里";
    resetResult();
    setStatus("请选择一段音频", 0, "第一次使用需要下载约 31 MB 的语音模型，之后会从这个浏览器直接读取。");
    updateControls();
  }

  function readAudioDuration(file) {
    return new Promise((resolve, reject) => {
      const audio = document.createElement("audio");
      const url = URL.createObjectURL(file);
      const cleanup = () => {
        URL.revokeObjectURL(url);
        audio.removeAttribute("src");
        audio.load();
      };
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(new Error("读取音频时长超时"));
      }, 15000);
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        window.clearTimeout(timeout);
        const duration = audio.duration;
        cleanup();
        Number.isFinite(duration) ? resolve(duration) : reject(new Error("无法读取音频时长"));
      };
      audio.onerror = () => {
        window.clearTimeout(timeout);
        cleanup();
        reject(new Error("浏览器无法读取这个音频"));
      };
      audio.src = url;
    });
  }

  async function selectFile(file) {
    const version = ++selectionVersion;
    resetResult();
    selectedFile = null;
    selectedDuration = 0;

    if (!file) return clearFile();
    if (!isSupportedFile(file)) {
      elements.fileCard.hidden = true;
      setStatus("暂不支持这个文件格式", 0, "请选择 MP3 或 WAV 文件。", true);
      updateControls();
      return;
    }
    if (file.size > MAX_BYTES) {
      elements.fileCard.hidden = true;
      setStatus("文件超过 200 MB", 0, "请压缩音频或选择更小的文件。", true);
      updateControls();
      return;
    }

    setStatus("正在读取音频信息……", 1, "音频仍然只在你的浏览器中读取。");
    try {
      const duration = await readAudioDuration(file);
      if (version !== selectionVersion) return;
      if (duration > MAX_SECONDS + 0.05) {
        setStatus("音频超过 10 分钟", 0, `当前文件时长约 ${formatDuration(duration)}，请先截取需要的部分。`, true);
        elements.fileCard.hidden = true;
        updateControls();
        return;
      }
      selectedFile = file;
      selectedDuration = duration;
      elements.fileName.textContent = file.name;
      elements.fileMeta.textContent = `${formatDuration(duration)} · ${formatBytes(file.size)} · ${file.name.split(".").pop().toUpperCase()}`;
      elements.fileCard.hidden = false;
      elements.dropTitle.textContent = "更换音频文件";
      elements.dropHelp.textContent = "点击选择，或者拖入另一个文件";
      setStatus("音频已准备好", 0, modelIsCached ? "本地模型已缓存，可以直接开始。" : "首次转写会先下载约 31 MB 的语音模型。");
    } catch (error) {
      if (version !== selectionVersion) return;
      elements.fileCard.hidden = true;
      setStatus("无法读取这个音频", 0, "请确认文件是有效的 MP3 或 WAV，然后重试。", true);
      appendLog(`音频信息错误：${error.message}`);
    }
    updateControls();
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("models")) request.result.createObjectStore("models");
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function readModelCache() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction("models", "readonly").objectStore("models").get(MODEL.cacheKey);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    }).finally(() => db.close());
  }

  async function writeModelCache(buffer) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("models", "readwrite");
      transaction.objectStore("models").put(buffer, MODEL.cacheKey);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    }).finally(() => db.close());
  }

  async function deleteModelCache() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("models", "readwrite");
      transaction.objectStore("models").delete(MODEL.cacheKey);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    }).finally(() => db.close());
  }

  async function isValidModel(buffer) {
    if (!buffer || buffer.byteLength !== MODEL.expectedBytes) return false;
    const digest = await crypto.subtle.digest("SHA-256", buffer);
    const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return hex === MODEL.expectedSha256;
  }

  async function refreshModelStatus() {
    try {
      const cached = await readModelCache();
      if (cached && await isValidModel(cached)) {
        modelIsCached = true;
        elements.modelStatus.textContent = `已缓存 · ${formatBytes(cached.byteLength)}`;
      } else {
        if (cached) await deleteModelCache();
        modelIsCached = false;
        elements.modelStatus.textContent = "尚未下载 · 首次使用约 31 MB";
      }
    } catch (error) {
      modelIsCached = false;
      elements.modelStatus.textContent = "无法读取浏览器缓存";
      appendLog(`缓存检查错误：${error.message}`);
    }
    updateControls();
  }

  async function fetchModel() {
    setStatus("正在检查本地模型……", 8, "只缓存公开语音模型，不保存你的音频和文字。");
    let cached = await readModelCache();
    if (cached && !(await isValidModel(cached))) {
      appendLog(`发现无效模型缓存：${cached.byteLength} bytes，已删除`);
      await deleteModelCache();
      cached = null;
    }
    if (cached) {
      appendLog(`从 IndexedDB 读取模型：${formatBytes(cached.byteLength)}`);
      modelIsCached = true;
      return cached;
    }

    downloadController = new AbortController();
    const response = await fetch(MODEL.url, { cache: "no-store", signal: downloadController.signal });
    if (!response.ok || !response.body) throw new Error(`模型下载失败（HTTP ${response.status}）`);
    const total = Number(response.headers.get("content-length")) || MODEL.expectedBytes;
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      const downloadProgress = Math.round((received / total) * 27);
      setStatus(`首次使用：正在下载语音模型`, 10 + downloadProgress, `已下载 ${formatBytes(received)} / ${formatBytes(total)}`);
    }
    if (received !== MODEL.expectedBytes) throw new Error("下载的模型文件不完整，请重试");
    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    if (!(await isValidModel(bytes.buffer))) throw new Error("模型完整性校验失败，请重试");
    await writeModelCache(bytes.buffer);
    modelIsCached = true;
    elements.modelStatus.textContent = `已缓存 · ${formatBytes(received)}`;
    appendLog(`模型已下载并缓存：${formatBytes(received)}`);
    return bytes.buffer;
  }

  async function decodeToMono16k(file) {
    setStatus("正在准备音频……", 3, "读取、转换和切片都在当前浏览器中完成。");
    const sourceBytes = await file.arrayBuffer();
    const context = new AudioContext();
    let decoded;
    try { decoded = await context.decodeAudioData(sourceBytes.slice(0)); }
    finally { await context.close(); }
    if (decoded.duration > MAX_SECONDS + 0.05) throw new Error("音频超过 10 分钟限制");
    if (cancelled) throw new DOMException("用户已取消", "AbortError");
    const frameCount = Math.ceil(decoded.duration * TARGET_SAMPLE_RATE);
    const offline = new OfflineAudioContext(1, frameCount, TARGET_SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    appendLog(`音频已转换：${rendered.duration.toFixed(2)} 秒，${TARGET_SAMPLE_RATE} Hz，单声道`);
    return rendered.getChannelData(0).slice();
  }

  function makeChunks(audio) {
    const maxLength = MAX_CHUNK_SECONDS * TARGET_SAMPLE_RATE;
    const minLength = MIN_CHUNK_SECONDS * TARGET_SAMPLE_RATE;
    const windowLength = SILENCE_WINDOW_SECONDS * TARGET_SAMPLE_RATE;
    const scanStep = Math.round(0.1 * TARGET_SAMPLE_RATE);
    const chunks = [];
    let start = 0;
    while (start < audio.length) {
      if (audio.length - start <= maxLength) {
        chunks.push({ audio: audio.slice(start), offset: start / TARGET_SAMPLE_RATE });
        break;
      }
      const searchStart = start + minLength;
      const searchEnd = Math.min(start + maxLength, audio.length) - windowLength;
      let bestCut = start + maxLength;
      let bestEnergy = Number.POSITIVE_INFINITY;
      for (let candidate = searchStart; candidate <= searchEnd; candidate += scanStep) {
        let energy = 0;
        for (let index = candidate; index < candidate + windowLength; index += 1) energy += audio[index] * audio[index];
        if (energy < bestEnergy) {
          bestEnergy = energy;
          bestCut = candidate + Math.round(windowLength / 2);
        }
      }
      chunks.push({ audio: audio.slice(start, bestCut), offset: start / TARGET_SAMPLE_RATE });
      start = bestCut;
    }
    return chunks;
  }

  function createWhisperWorker() {
    const nextWorker = new Worker(WORKER_URL);
    nextWorker.addEventListener("message", (event) => {
      const message = event.data;
      if (message.type === "log") appendLog(message.line);
      if (message.type === "ready" || message.type === "result") {
        pendingWorkerAction?.resolve(message);
        pendingWorkerAction = null;
      }
      if (message.type === "error") {
        pendingWorkerAction?.reject(new Error(message.message));
        pendingWorkerAction = null;
      }
    });
    nextWorker.addEventListener("error", (event) => {
      pendingWorkerAction?.reject(new Error(event.message || "后台转写程序意外退出"));
      pendingWorkerAction = null;
    });
    return nextWorker;
  }

  function askWorker(message, transfer = []) {
    return new Promise((resolve, reject) => {
      pendingWorkerAction = { resolve, reject };
      worker.postMessage(message, transfer);
    });
  }

  function mergeChunkSegments(chunkSegments, offset) {
    for (const local of chunkSegments) {
      const next = {
        start: Math.max(0, local.start + offset),
        end: Math.min(selectedDuration, local.end + offset),
        text: local.text.trim()
      };
      const previous = segments.at(-1);
      if (previous && next.end <= previous.end + 0.05) continue;
      if (next.text) segments.push(next);
    }
    renderSegments();
  }

  function renderSegments() {
    elements.resultPanel.hidden = segments.length === 0;
    elements.result.replaceChildren(...segments.map((segment) => {
      const row = document.createElement("div");
      row.className = "segment";
      const time = document.createElement("time");
      time.dateTime = exportTools.formatTimestamp(segment.start);
      time.textContent = exportTools.formatTimestamp(segment.start);
      const text = document.createElement("p");
      text.textContent = segment.text;
      row.append(time, text);
      return row;
    }));
  }

  function friendlyError(error) {
    if (error.name === "QuotaExceededError") return ["浏览器没有足够空间保存模型", "请释放一些浏览器存储空间后重试。"];
    if (/模型下载|fetch|network/i.test(error.message)) return ["语音模型下载失败", "请检查网络连接，然后再次点击“开始转写”。"];
    if (/decode|音频|EncodingError/i.test(error.message)) return ["无法处理这个音频", "请确认文件是有效的 MP3 或 WAV，然后重试。"];
    return ["这次转写没有完成", "你可以再次尝试；如果仍然失败，请换一个更短的音频。"];
  }

  async function startTranscription() {
    if (!selectedFile || processing) return;
    processing = true;
    cancelled = false;
    resetResult();
    elements.debugLog.textContent = "";
    updateControls();
    try {
      const audio = await decodeToMono16k(selectedFile);
      const chunks = makeChunks(audio);
      appendLog(`按静音位置切分为 ${chunks.length} 段；每段最多 ${MAX_CHUNK_SECONDS} 秒`);
      const model = await fetchModel();
      if (cancelled) throw new DOMException("用户已取消", "AbortError");
      setStatus("正在启动本地转写……", 39, "模型和音频正在交给浏览器后台处理。");
      worker = createWhisperWorker();
      await askWorker({ type: "initialize", model: MODEL.label, buffer: model }, [model]);
      for (let index = 0; index < chunks.length; index += 1) {
        if (cancelled) throw new DOMException("用户已取消", "AbortError");
        const chunk = chunks[index];
        const progress = 40 + Math.round((index / chunks.length) * 58);
        setStatus(`正在转写第 ${index + 1} / ${chunks.length} 段`, progress, "可以离开这个标签页，但请不要关闭它。处理速度取决于电脑性能。");
        const response = await askWorker({ type: "transcribe", audio: chunk.audio, index }, [chunk.audio.buffer]);
        mergeChunkSegments(response.segments, chunk.offset);
      }
      setStatus("转写完成", 100, `已生成 ${segments.length} 个带时间戳的文字片段。`);
      elements.resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      if (error.name === "AbortError" || cancelled) {
        setStatus("已取消本次转写", 0, "音频和未完成的处理已释放，可以重新开始。", false);
        appendLog("用户取消了本次转写");
      } else {
        const [title, help] = friendlyError(error);
        setStatus(title, 0, help, true);
        appendLog(`错误：${error.stack || error.message}`);
      }
    } finally {
      downloadController = null;
      worker?.terminate();
      worker = null;
      pendingWorkerAction = null;
      processing = false;
      await refreshModelStatus();
      updateControls();
    }
  }

  function cancelTranscription() {
    if (!processing) return;
    cancelled = true;
    downloadController?.abort();
    worker?.terminate();
    worker = null;
    pendingWorkerAction?.reject(new DOMException("用户已取消", "AbortError"));
    pendingWorkerAction = null;
  }

  function download(content, extension, type) {
    const blob = new Blob(["\ufeff", content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${exportTools.outputBaseName(selectedFile?.name)}.${extension}`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    elements.actionFeedback.textContent = `已生成 ${extension.toUpperCase()} 文件。`;
  }

  async function copyTranscript() {
    const text = exportTools.plainText(segments);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    elements.actionFeedback.textContent = "文字已复制。";
  }

  for (const eventName of ["dragenter", "dragover"]) {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      if (!processing) elements.dropZone.classList.add("is-dragging");
    });
  }
  for (const eventName of ["dragleave", "drop"]) {
    elements.dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      elements.dropZone.classList.remove("is-dragging");
    });
  }
  elements.dropZone.addEventListener("drop", (event) => {
    if (!processing) selectFile(event.dataTransfer?.files?.[0] || null);
  });
  elements.fileInput.addEventListener("change", () => selectFile(elements.fileInput.files?.[0] || null));
  elements.removeFile.addEventListener("click", clearFile);
  elements.start.addEventListener("click", startTranscription);
  elements.cancel.addEventListener("click", cancelTranscription);
  elements.copy.addEventListener("click", copyTranscript);
  elements.downloadTxt.addEventListener("click", () => download(exportTools.plainText(segments), "txt", "text/plain;charset=utf-8"));
  elements.downloadSrt.addEventListener("click", () => download(exportTools.srtText(segments), "srt", "application/x-subrip;charset=utf-8"));
  elements.deleteModel.addEventListener("click", async () => {
    elements.deleteModel.disabled = true;
    try {
      await deleteModelCache();
      modelIsCached = false;
      elements.modelStatus.textContent = "已删除 · 下次使用会重新下载";
      setStatus("本地模型已删除", 0, "你的音频和转写文字本来就没有保存在模型缓存中。");
    } catch (error) {
      elements.modelStatus.textContent = "删除失败，请重试";
      appendLog(`删除缓存错误：${error.message}`);
    }
    updateControls();
  });

  function isLikelyMobile() {
    return Boolean(navigator.userAgentData?.mobile) || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  const missingCapability = !crossOriginIsolated || !("SharedArrayBuffer" in window) || !("Worker" in window) || !("indexedDB" in window) || !("AudioContext" in window) || !window.crypto?.subtle;
  if (isLikelyMobile()) {
    environmentBlocked = true;
    elements.mobileNotice.hidden = false;
    elements.fileInput.disabled = true;
    setStatus("当前版本暂不支持手机和平板", 0, "请在最新版桌面 Chrome 或 Edge 中打开。", true);
  } else if (missingCapability) {
    environmentBlocked = true;
    elements.fileInput.disabled = true;
    setStatus("当前浏览器环境暂不支持本地转写", 0, "请使用最新版桌面 Chrome 或 Edge；网站还需要启用必要的安全响应头。", true);
    appendLog(`能力检查失败；crossOriginIsolated=${crossOriginIsolated}, SharedArrayBuffer=${"SharedArrayBuffer" in window}`);
  } else {
    setStatus("请选择一段音频", 0, "第一次使用需要下载约 31 MB 的语音模型，之后会从这个浏览器直接读取。");
    appendLog(`浏览器能力检查通过；crossOriginIsolated=${crossOriginIsolated}`);
  }
  refreshModelStatus();
  updateControls();
})();

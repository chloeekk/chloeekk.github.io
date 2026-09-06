(() => {
  "use strict";

  const MODELS = {
    "tiny-q5_1": { label: "Tiny 多语言量化版", url: "/models/ggml-tiny-q5_1.bin", cacheKey: "whisper-tiny-multilingual-q5_1-v2" },
    "base-q5_1": { label: "Base 多语言量化版", url: "/models/ggml-base-q5_1.bin", cacheKey: "whisper-base-multilingual-q5_1-v2" }
  };
  const DB_NAME = "chloevolution-transcribe-validation";
  const DB_VERSION = 1;
  const MAX_BYTES = 200 * 1024 * 1024;
  const MAX_SECONDS = 10 * 60;
  const TARGET_SAMPLE_RATE = 16000;
  const MAX_CHUNK_SECONDS = 20;
  const MIN_CHUNK_SECONDS = 10;
  const SILENCE_WINDOW_SECONDS = 0.2;

  const fileInput = document.querySelector("#audio-file");
  const fileSummary = document.querySelector("#file-summary");
  const startButton = document.querySelector("#start-button");
  const cancelButton = document.querySelector("#cancel-button");
  const modelSelect = document.querySelector("#model-select");
  const statusText = document.querySelector("#status");
  const progressBar = document.querySelector("#progress-bar");
  const resultPanel = document.querySelector("#result-panel");
  const result = document.querySelector("#result");
  const debugLog = document.querySelector("#debug-log");

  let selectedFile = null;
  let processing = false;
  let cancelled = false;
  let worker = null;
  let pendingWorkerAction = null;
  let segments = [];

  const selectedModel = () => MODELS[modelSelect.value] || MODELS["tiny-q5_1"];

  function setStatus(message, progress) {
    statusText.textContent = message;
    if (Number.isFinite(progress)) progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }

  function appendLog(line) {
    debugLog.textContent += `${line}\n`;
    debugLog.scrollTop = debugLog.scrollHeight;
  }

  function updateControls() {
    startButton.disabled = processing || !selectedFile;
    cancelButton.hidden = !processing;
    fileInput.disabled = processing;
    modelSelect.disabled = processing;
  }

  function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function formatTimestamp(seconds) {
    const milliseconds = Math.max(0, Math.round(seconds * 1000));
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const secs = Math.floor((milliseconds % 60000) / 1000);
    const millis = milliseconds % 1000;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
  }

  function renderSegments() {
    resultPanel.hidden = segments.length === 0;
    result.replaceChildren(...segments.map((segment) => {
      const row = document.createElement("div");
      row.className = "segment";
      const time = document.createElement("time");
      time.textContent = formatTimestamp(segment.start);
      const text = document.createElement("p");
      text.textContent = segment.text;
      row.append(time, text);
      return row;
    }));
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

  async function readCachedModel(cacheKey) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction("models", "readonly").objectStore("models").get(cacheKey);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    }).finally(() => db.close());
  }

  async function cacheModel(cacheKey, buffer) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("models", "readwrite");
      transaction.objectStore("models").put(buffer, cacheKey);
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    }).finally(() => db.close());
  }

  async function fetchModel(modelSpec) {
    setStatus("正在检查本地模型缓存……", 8);
    const cached = await readCachedModel(modelSpec.cacheKey);
    if (cached) {
      appendLog(`从 IndexedDB 读取 ${modelSpec.label}：${formatBytes(cached.byteLength)}`);
      return cached;
    }
    const response = await fetch(modelSpec.url, { cache: "no-store" });
    if (!response.ok || !response.body) throw new Error(`模型下载失败（HTTP ${response.status}）`);
    const total = Number(response.headers.get("content-length")) || 0;
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    while (true) {
      if (cancelled) throw new DOMException("用户已取消", "AbortError");
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      const percent = total ? Math.round((received / total) * 25) : 12;
      setStatus(`首次使用：正在下载模型 ${total ? Math.round((received / total) * 100) : ""}%`, 10 + percent);
    }
    const model = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      model.set(chunk, offset);
      offset += chunk.byteLength;
    }
    await cacheModel(modelSpec.cacheKey, model.buffer);
    appendLog(`${modelSpec.label}已下载并缓存：${formatBytes(received)}`);
    return model.buffer;
  }

  async function decodeToMono16k(file) {
    setStatus("正在读取并检查音频……", 2);
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
    const nextWorker = new Worker("/worker.js");
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
      pendingWorkerAction?.reject(new Error(event.message || "转写 Worker 意外退出"));
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

  function trimTextOverlap(previous, current) {
    const max = Math.min(40, previous.length, current.length);
    for (let length = max; length >= 3; length -= 1) {
      if (previous.slice(-length) === current.slice(0, length)) return current.slice(length).trimStart();
    }
    return current;
  }

  function mergeChunkSegments(chunkSegments, offset) {
    for (const local of chunkSegments) {
      const next = { start: local.start + offset, end: local.end + offset, text: local.text.trim() };
      const previous = segments.at(-1);
      if (previous && next.end <= previous.end + 0.05) continue;
      if (previous) next.text = trimTextOverlap(previous.text, next.text);
      if (!next.text) continue;
      segments.push(next);
    }
    renderSegments();
  }

  async function start() {
    processing = true;
    cancelled = false;
    segments = [];
    resultPanel.hidden = true;
    debugLog.textContent = "";
    updateControls();
    try {
      const audio = await decodeToMono16k(selectedFile);
      const chunks = makeChunks(audio);
      appendLog(`已按静音位置切分为 ${chunks.length} 段；每段最多 ${MAX_CHUNK_SECONDS} 秒，无重叠`);
      const modelSpec = selectedModel();
      const model = await fetchModel(modelSpec);
      if (cancelled) throw new DOMException("用户已取消", "AbortError");
      setStatus("正在启动后台转写程序……", 38);
      worker = createWhisperWorker();
      await askWorker({ type: "initialize", model: modelSpec.label, buffer: model }, [model]);
      for (let index = 0; index < chunks.length; index += 1) {
        if (cancelled) throw new DOMException("用户已取消", "AbortError");
        const chunk = chunks[index];
        const progress = 40 + Math.round((index / chunks.length) * 58);
        setStatus(`正在本地转写第 ${index + 1} / ${chunks.length} 段……`, progress);
        const response = await askWorker({ type: "transcribe", audio: chunk.audio, index }, [chunk.audio.buffer]);
        mergeChunkSegments(response.segments, chunk.offset);
      }
      setStatus(`转写完成，共 ${segments.length} 个片段`, 100);
    } catch (error) {
      if (error.name === "AbortError" || cancelled) {
        setStatus("已取消本次转写，可以重新选择或再次开始", 0);
        appendLog("用户取消了本次转写");
      } else {
        setStatus(`无法完成：${error.message}`, 0);
        appendLog(`错误：${error.stack || error.message}`);
      }
    } finally {
      worker?.terminate();
      worker = null;
      pendingWorkerAction = null;
      processing = false;
      updateControls();
    }
  }

  function cancel() {
    cancelled = true;
    worker?.terminate();
    worker = null;
    pendingWorkerAction?.reject(new DOMException("用户已取消", "AbortError"));
    pendingWorkerAction = null;
  }

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0] || null;
    selectedFile = null;
    if (!file) {
      fileSummary.hidden = true;
      updateControls();
      return;
    }
    if (file.size > MAX_BYTES) {
      fileSummary.hidden = false;
      fileSummary.textContent = "文件超过 200 MB，请选择更小的文件。";
      updateControls();
      return;
    }
    selectedFile = file;
    fileSummary.hidden = false;
    fileSummary.textContent = `${file.name} · ${formatBytes(file.size)}`;
    setStatus("文件已选择，可以开始本地转写", 0);
    updateControls();
  });

  startButton.addEventListener("click", start);
  cancelButton.addEventListener("click", cancel);
  const capabilities = [crossOriginIsolated, "Worker" in window, "indexedDB" in window, "AudioContext" in window];
  if (capabilities.every(Boolean)) {
    setStatus("浏览器能力检查通过，请选择音频", 0);
    appendLog(`浏览器能力检查通过；crossOriginIsolated=${crossOriginIsolated}`);
  } else {
    setStatus("当前浏览器缺少本地转写需要的能力，请使用最新版桌面 Chrome 或 Edge", 0);
    fileInput.disabled = true;
  }
  updateControls();
})();

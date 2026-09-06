"use strict";

let instance = 0;
let currentRun = null;

function parseTimestamp(value) {
  const [hours, minutes, seconds] = value.split(":");
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

function emitLog(...parts) {
  const line = parts.join(" ");
  self.postMessage({ type: "log", line });
  if (!currentRun) return;
  const match = line.match(/^\[(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})\]\s+(.*)$/);
  if (match) {
    currentRun.segments.push({ start: parseTimestamp(match[1]), end: parseTimestamp(match[2]), text: match[3].trim() });
  }
  if (line.includes("whisper_print_timings:") && line.includes("total time")) {
    self.postMessage({ type: "result", index: currentRun.index, segments: currentRun.segments });
    currentRun = null;
  }
}

const runtimeReady = new Promise((resolve) => {
  self.Module = {
    print: emitLog,
    printErr: emitLog,
    setStatus: emitLog,
    monitorRunDependencies() {},
    onRuntimeInitialized: resolve
  };
  importScripts("/vendor/main.js");
});

self.addEventListener("message", async (event) => {
  const message = event.data;
  try {
    if (message.type === "initialize") {
      await runtimeReady;
      try { Module.FS_unlink("whisper.bin"); } catch (_) {}
      Module.FS_createDataFile("/", "whisper.bin", new Uint8Array(message.buffer), true, true);
      instance = Module.init("whisper.bin");
      if (!instance) throw new Error("Whisper 模型初始化失败");
      emitLog(`${message.model}已在 Web Worker 中初始化`);
      self.postMessage({ type: "ready" });
      return;
    }
    if (message.type === "transcribe") {
      if (!instance) throw new Error("Whisper 尚未初始化");
      currentRun = { index: message.index, segments: [] };
      const code = Module.full_default(instance, new Float32Array(message.audio), "auto", 1, false);
      if (code !== 0) throw new Error(`Whisper 启动失败（${code}）`);
    }
  } catch (error) {
    currentRun = null;
    self.postMessage({ type: "error", message: error.message || String(error) });
  }
});

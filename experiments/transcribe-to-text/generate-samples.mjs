import { mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const outputDir = join(new URL(".", import.meta.url).pathname, "samples");
mkdirSync(outputDir, { recursive: true });

const passages = {
  zh: "今天我们测试浏览器本地语音转文字功能。音频只在这台电脑中处理，不会上传到服务器。完成以后，用户可以检查时间戳，复制文字，或者下载字幕文件。",
  en: "Today we are testing local speech to text in the browser. The audio stays on this computer and is not uploaded to a server. After transcription, the user can review timestamps, copy the text, or download a subtitle file.",
  mixed: "今天我们测试 browser local transcription。这个 MVP 使用 Whisper model 在设备上处理 audio，不需要注册账号，也不会上传 transcript。"
};

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} failed: ${result.stderr || result.stdout}`);
  return result.stdout;
}

function duration(file) {
  const info = run("afinfo", [file]);
  const match = info.match(/estimated duration:\s*([\d.]+) sec/);
  if (!match) throw new Error(`Cannot read duration for ${file}`);
  return Number(match[1]);
}

function synthesize(name, voice, passage, targetSeconds) {
  const aiff = join(outputDir, `${name}.aiff`);
  const wav = join(outputDir, `${name}.wav`);
  let repeats = Math.max(1, Math.round(targetSeconds / 9));

  for (let attempt = 0; attempt < 3; attempt += 1) {
    run("say", ["-v", voice, "-r", "195", "-o", aiff, Array(repeats).fill(passage).join(" ")]);
    const measured = duration(aiff);
    const ratio = targetSeconds / measured;
    if (Math.abs(1 - ratio) < 0.025) break;
    repeats = Math.max(1, Math.round(repeats * ratio));
  }

  run("afconvert", ["-f", "WAVE", "-d", "LEI16@16000", aiff, wav]);
  console.log(`${name}: ${duration(wav).toFixed(2)} sec`);
}

synthesize("compare-zh", "Tingting", passages.zh, 22);
synthesize("compare-en", "Samantha", passages.en, 22);
synthesize("compare-mixed", "Tingting", passages.mixed, 22);
synthesize("stability-1m", "Tingting", passages.zh, 58);
synthesize("stability-5m", "Tingting", passages.zh, 295);
synthesize("stability-10m", "Tingting", passages.zh, 595);

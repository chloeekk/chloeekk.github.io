import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = process.argv[2] ? normalize(process.argv[2]) : fileURLToPath(new URL(".", import.meta.url));
const options = new Map(process.argv.slice(3).map((argument) => {
  const [key, value = "true"] = argument.replace(/^--/, "").split("=", 2);
  return [key, value];
}));
const headerMode = options.get("headers") || "all";
const modelMode = options.get("model") || "normal";
const runtimeMode = options.get("runtime") || "normal";
const port = Number(options.get("port") || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".bin": "application/octet-stream",
  ".wav": "audio/wav"
};

const server = createServer((request, response) => {
  const requested = request.url === "/" ? "/index.html" : new URL(request.url, "http://localhost").pathname;
  const relative = normalize(requested).replace(/^([/\\])+/, "");
  let file = join(root, relative);

  const isToolPage = requested === "/zh-cn/tools/transcribe-to-text/" || requested === "/zh-cn/tools/transcribe-to-text/index.html";
  const isWorkerEntry = /^\/js\/transcribe-worker(?:\.|-).*\.js$/.test(requested);
  if (headerMode === "all" || (headerMode === "page-only" && isToolPage) || (headerMode === "page-worker" && (isToolPage || isWorkerEntry))) {
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    response.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  }
  response.setHeader("Cache-Control", "no-store");
  console.log(`${request.method} ${requested}`);

  if (modelMode === "fail" && requested.endsWith("/models/ggml-tiny-q5_1.bin")) {
    response.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Synthetic model failure");
    return;
  }
  if (runtimeMode === "fail" && requested.endsWith("/vendor/main.js")) {
    response.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Synthetic runtime failure");
    return;
  }

  if (!file.startsWith(root)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  try {
    let info = statSync(file);
    if (info.isDirectory()) {
      file = join(file, "index.html");
      info = statSync(file);
    }
    if (!info.isFile()) throw new Error("Not a file");
    response.setHeader("Content-Type", mime[extname(file)] || "application/octet-stream");
    response.setHeader("Content-Length", info.size);
    response.writeHead(200);
    createReadStream(file).pipe(response);
  } catch (_) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Transcribe validation: http://127.0.0.1:${port}/ headers=${headerMode} model=${modelMode} runtime=${runtimeMode}`);
});

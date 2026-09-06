# 浏览器本地音频转文字：最小技术验证

这个目录只验证一件事：在不上传音频的情况下，浏览器能否加载多语言 Whisper 模型并完成中文音频转写。

它仍不是可发布的 MVP，但已经包含 Web Worker、静音位置切片、进度和取消后的安全重试。当前仍不包含 TXT/SRT 导出、模型删除、拖放和完整浏览器兼容处理。Worker 默认使用单线程，因为首次多线程试跑导致自动化浏览器标签页退出。

## 当前验证基线

- whisper.cpp source commit: `52a939a2a762224e255d366c1182b2af4dd1a032`
- browser runtime: `https://ggml.ai/whisper.cpp/main.js`
- runtime SHA-256: `72adc9923d836ab05cf0244d9edb5da1e56f3a2b772485be8320c0666987d410`
- model: `ggerganov/whisper.cpp` 中的 `ggml-tiny-q5_1.bin`
- model size: 32,152,673 bytes（约 30.7 MiB）
- model SHA-256: `818710568da3ca15689e31a743197b520007872ff9576237bda97bd1b469c3d7`
- tested browser path: Chromium with `crossOriginIsolated=true`

对比候选还包括 `ggml-base-q5_1.bin`（约 57 MiB，SHA-256 `422f1ae452ade6f30a004d7e5c6a43195e4433bc370bf23fac9cc591f01a8898`）。首轮相同合成样本中，Base 没有表现出足以抵消体积和速度成本的稳定优势，因此后续稳定性测试暂用 Tiny；这不是最终模型决定。

实验目录自己的模型和生成 runtime 不提交 Git。单独运行实验页前把它们放在：

```text
vendor/main.js
models/ggml-tiny-q5_1.bin
models/ggml-base-q5_1.bin
```

然后运行：

```bash
node server.mjs
```

打开 `http://127.0.0.1:4173/`。不要直接双击 HTML；whisper.cpp 当前的 pthread 浏览器构建需要服务器返回 COOP/COEP 响应头。

测试服务器还支持以下故障与响应头范围模拟：

```bash
node server.mjs <site-root> --headers=page-only
node server.mjs <site-root> --headers=page-worker
node server.mjs <site-root> --headers=page-worker --model=fail
node server.mjs <site-root> --headers=page-worker --runtime=fail
```

`page-only` 用于证明只给 HTML 加 COOP/COEP 不够；`page-worker` 会同时覆盖工具页和指纹化 Worker 入口，是当前最小可用范围。故障参数只用于本地回归。

运行 `node generate-samples.mjs` 可以在被 Git 忽略的 `samples/` 中生成同一套本机合成测试音频。

## 2026-09-06 首轮结果

- 15.66 秒、16 kHz、单声道的合成普通话 WAV 成功完成转写；
- 自动识别语言为中文，日志置信度约 0.994；
- 单线程推理约 7.7 秒；
- 时间戳输出正常；
- 模型能从 IndexedDB 缓存复用；
- tiny 量化模型输出可理解，但存在繁简混用及同音错字；
- 多线程首次测试导致自动化浏览器标签页退出，需在正式实现前继续定位内存与 pthread 配置。

## 2026-09-06 第二轮结果

- Tiny 与 Base 均完成中文、英文和中英混合样本；Tiny 英文表现较好，两者的合成普通话仍有错字，中英混合专有词都不稳定；
- 推理已移入 Dedicated Web Worker，页面不会在单段推理时失去响应；
- 固定重叠切片会产生难以可靠去重的重复文字，因此原型改为在 10–20 秒区间搜索低能量位置并无重叠切分；
- 5 分钟处理中取消成功，取消后可以重新开始并完成短音频；
- 61.89 秒音频切成 4 段，纯推理约 31.4 秒；
- 297.64 秒音频切成 22 段，纯推理约 170.0 秒，整条流程约 185 秒；
- 595.44 秒音频切成 44 段，纯推理约 340.5 秒，整条流程约 350.7 秒；
- 三个稳定性样本均完整完成，未出现 Worker 崩溃或页面退出。

合成音频、Base 对比模型和测试 transcript 都不应提交到公开仓库。正式候选使用的固定 Tiny 模型另见下文。

## 2026-09-06 第三轮结果

- 只给工具 HTML 返回 COOP/COEP 时，页面本身通过能力检查，但 Worker 在加载前退出；
- 同时给 `/zh-cn/tools/transcribe-to-text/` 和指纹化 `transcribe-worker` 脚本返回 COOP/COEP 后，页面保持 `crossOriginIsolated=true`，24.66 秒中文样本成功完成；
- 中文首页不带上述响应头，证明规则无需覆盖整个网站；
- 服务器请求日志只有页面、CSS、JavaScript、公开模型和 runtime 的 `GET`，没有音频、文件名、transcript 或 `POST`；
- 1 KiB 损坏模型缓存会在页面初始化时被自动删除；
- 模型 HTTP 503 后显示可重试提示，恢复服务后无需刷新即可重新下载并完成；
- runtime HTTP 503 后 Worker 错误能回到可重试状态，开始按钮恢复；
- 62.09 秒连续英文序列被切成 4 段，生成 20 个单调时间戳片段，覆盖到音频末尾，没有相邻整段重复。

## 正式中文版草稿

验证通过的逻辑已整理为 Hugo draft 页面：

```text
content/tools/transcribe-to-text/index.zh-cn.md
layouts/transcribe/single.html
assets/css/transcribe-to-text.css
assets/js/transcribe-to-text.js
assets/js/transcribe-worker.js
assets/js/transcribe-export.js
```

正式草稿使用独立模板，不加载博客主题、广告或分析脚本。专用 CSS/JS 使用 Hugo Pipes 按需生成，因此普通生产构建不会输出草稿页面或这些草稿资源。固定 runtime 与 Tiny 模型已经进入 `dev` 发布候选；页面仍保持 `draft: true`，直到 Cloudflare COOP/COEP 规则和实体 Chrome/Edge 测试完成。

发布候选已固定 runtime 和模型内容；不要在缺少它们或哈希不符时取消 draft：

```text
static/tools/transcribe-to-text/vendor/main.js
static/tools/transcribe-to-text/models/ggml-tiny-q5_1.bin.part-00 ... part-29
```

模型在源码分支中拆成 30 个传输分片，只为适应开发网络上传；隐藏预览工作流会按文件名顺序重新合并为 `ggml-tiny-q5_1.bin`，校验 SHA-256 后删除构建目录中的分片。浏览器仍从 GitHub Pages 同源下载一个约 30.7 MiB 文件，不知道源码分片的存在。这不需要迁移到 Cloudflare Pages。后续替换模型必须同时更新页面中的精确字节数、SHA-256、工作流校验值和本说明。

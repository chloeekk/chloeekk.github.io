# 10,000 Hour Tracker Worker

这是计时器的独立后台验证工程，不会改变现有 Hugo 网站。

## 本地启动

使用 Node.js 24 或更新版本。

1. 运行 `npm install --legacy-peer-deps`；
2. 把 `.dev.vars.example` 复制为 `.dev.vars`，换成本地测试密钥；
3. 运行 `npm run db:migrate:local`；
4. 运行 `npm run db:seed:local`；
5. 运行 `npm run dev`。

`.dev.vars` 不应提交到 Git。

## 自动化验证

运行 `npm test`。测试使用 Cloudflare 官方 Vitest plugin 和隔离的本地 D1，不会读取或修改生产数据。

## 第一阶段接口

- `GET /v1/health`：确认 Worker 正常；
- `POST /v1/owner/devices/activate`：用 Owner Key 激活当前浏览器；
- `GET /v1/owner/state`：刷新页面后恢复活动计时；
- `POST /v1/owner/timer/start`：开始；
- `POST /v1/owner/timer/:id/pause`：暂停；
- `POST /v1/owner/timer/:id/resume`：继续；
- `POST /v1/owner/timer/:id/finish`：完成；
- `POST /v1/owner/timer/:id/cancel`：取消；
- `PATCH /v1/owner/timer/:id`：活动计时期间保存任务描述；
- `POST /v1/owner/entries`：手动补录；
- `GET /v1/owner/entries`：读取和筛选历史记录；
- `PATCH /v1/owner/entries/:id`：编辑完成或取消的记录；
- `POST /v1/owner/entries/:id/restore`：恢复 Cancelled 记录；
- `DELETE /v1/owner/entries/:id`：永久删除记录；
- `POST /v1/owner/topics`：新建投入方向；
- `PATCH /v1/owner/topics/:id`：编辑投入方向；
- `POST /v1/owner/topics/:id/archive`：归档投入方向；
- `POST /v1/owner/topics/:id/reactivate`：重新启用投入方向；
- `GET /v1/public/dashboard`：读取公开累计数据。
- `POST /v1/public/interest`：匿名记录“我也想试试”并近似去重。

后台核心流程已经具备自动化验证。下一阶段接入 Hugo 中文版页面。

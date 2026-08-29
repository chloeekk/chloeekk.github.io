import { env, exports } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";

const ORIGIN = "https://tracker.test";
const TOPIC_ID = "00000000-0000-4000-8000-000000000001";

interface ApiResponse {
  data?: Record<string, any>;
  error?: { code: string; message: string };
}

async function api(
  path: string,
  options: {
    method?: string;
    body?: Record<string, unknown>;
    cookie?: string;
  } = {},
) {
  const method = options.method ?? "GET";
  const headers = new Headers();
  if (method !== "GET") headers.set("Origin", ORIGIN);
  if (options.body) headers.set("Content-Type", "application/json");
  if (options.cookie) headers.set("Cookie", options.cookie);

  const response = await exports.default.fetch(`https://tracker.test${path}`, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await response.json<ApiResponse>();
  return { response, json };
}

function cookieFrom(response: Response): string {
  const setCookie = response.headers.get("Set-Cookie");
  if (!setCookie) throw new Error("Activation did not return a device cookie.");
  return setCookie.split(";", 1)[0];
}

describe.sequential("10,000 Hour Tracker core flow", () => {
  let cookie = "";

  beforeAll(async () => {
    const now = Date.now();
    await env.DB.prepare(
      `INSERT INTO topics
        (id, slug, name_zh, name_en, color, sort_order, status, created_at_ms, updated_at_ms)
       VALUES (?, 'product-building', '产品构建', 'Product building', '#6d5dfc', 10, 'active', ?, ?)`,
    ).bind(TOPIC_ID, now, now).run();
  });

  it("activates an Owner device and restores a running timer", async () => {
    const activation = await api("/v1/owner/devices/activate", {
      method: "POST",
      body: { owner_key: "test-owner-key", label: "Automated test" },
    });
    expect(activation.response.status).toBe(201);
    cookie = cookieFrom(activation.response);

    const entryId = "10000000-0000-4000-8000-000000000001";
    const start = await api("/v1/owner/timer/start", {
      method: "POST",
      cookie,
      body: {
        id: entryId,
        topic_id: TOPIC_ID,
        visibility: "public",
        timezone: "Asia/Shanghai",
        task_zh: "自动化核心流程",
        task_en: "Automated core flow",
      },
    });
    expect(start.response.status).toBe(201);
    expect(start.json.data?.status).toBe("running");

    const repeatedStart = await api("/v1/owner/timer/start", {
      method: "POST",
      cookie,
      body: {
        id: entryId,
        topic_id: TOPIC_ID,
        visibility: "public",
        timezone: "Asia/Shanghai",
      },
    });
    expect(repeatedStart.response.status).toBe(201);
    expect(repeatedStart.json.data?.id).toBe(entryId);

    const restored = await api("/v1/owner/state", { cookie });
    expect(restored.json.data?.active_timer).toMatchObject({ id: entryId, status: "running" });

    const secondStart = await api("/v1/owner/timer/start", {
      method: "POST",
      cookie,
      body: {
        id: "10000000-0000-4000-8000-000000000002",
        topic_id: TOPIC_ID,
        timezone: "Asia/Shanghai",
      },
    });
    expect(secondStart.response.status).toBe(409);
    expect(secondStart.json.error?.code).toBe("active_timer_exists");

    await env.DB.prepare("UPDATE time_entries SET started_at_ms = ? WHERE id = ?")
      .bind(Date.now() - 60_000, entryId)
      .run();

    const taskSaved = await api(`/v1/owner/timer/${entryId}`, {
      method: "PATCH", cookie, body: {
        expected_version: 1,
        task_zh: "自动保存的任务",
        task_en: "Autosaved task",
      },
    });
    expect(taskSaved.json.data).toMatchObject({
      task_zh: "自动保存的任务",
      task_en: "Autosaved task",
      version: 2,
    });

    const pause = await api(`/v1/owner/timer/${entryId}/pause`, {
      method: "POST", cookie, body: { expected_version: 2 },
    });
    expect(pause.json.data).toMatchObject({
      status: "paused",
      task_zh: "自动保存的任务",
      task_en: "Autosaved task",
      version: 3,
    });

    const repeatedPause = await api(`/v1/owner/timer/${entryId}/pause`, {
      method: "POST", cookie, body: { expected_version: 2 },
    });
    expect(repeatedPause.json.data).toMatchObject({ status: "paused", version: 3 });

    const resume = await api(`/v1/owner/timer/${entryId}/resume`, {
      method: "POST", cookie, body: { expected_version: 3 },
    });
    expect(resume.json.data).toMatchObject({ status: "running", version: 4 });

    const stalePause = await api(`/v1/owner/timer/${entryId}/pause`, {
      method: "POST", cookie, body: { expected_version: 3 },
    });
    expect(stalePause.response.status).toBe(409);
    expect(stalePause.json.error?.code).toBe("version_conflict");

    const finish = await api(`/v1/owner/timer/${entryId}/finish`, {
      method: "POST", cookie, body: { expected_version: 4, visibility: "public" },
    });
    expect(finish.json.data?.status).toBe("completed");
    expect(finish.json.data?.duration_seconds).toBeGreaterThan(0);

    const repeatedFinish = await api(`/v1/owner/timer/${entryId}/finish`, {
      method: "POST", cookie, body: { expected_version: 4 },
    });
    expect(repeatedFinish.json.data?.status).toBe("completed");
  });

  it("never exposes Private or Cancelled entries", async () => {
    const privateId = "10000000-0000-4000-8000-000000000003";
    await api("/v1/owner/timer/start", {
      method: "POST",
      cookie,
      body: {
        id: privateId,
        topic_id: TOPIC_ID,
        timezone: "Asia/Shanghai",
        visibility: "private",
      },
    });
    await env.DB.prepare("UPDATE time_entries SET started_at_ms = ? WHERE id = ?")
      .bind(Date.now() - 60_000, privateId)
      .run();
    await api(`/v1/owner/timer/${privateId}/finish`, {
      method: "POST", cookie, body: { expected_version: 1, visibility: "private" },
    });

    const cancelledId = "10000000-0000-4000-8000-000000000004";
    await api("/v1/owner/timer/start", {
      method: "POST",
      cookie,
      body: { id: cancelledId, topic_id: TOPIC_ID, timezone: "Asia/Shanghai" },
    });
    const cancelled = await api(`/v1/owner/timer/${cancelledId}/cancel`, {
      method: "POST", cookie, body: { expected_version: 1 },
    });
    expect(cancelled.json.data?.status).toBe("cancelled");

    const dashboard = await api("/v1/public/dashboard");
    expect(dashboard.json.data?.totals).toMatchObject({ record_count: 1 });
    expect(dashboard.json.data?.totals.first_entry_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dashboard.json.data?.recent_records).toHaveLength(1);
    expect(dashboard.json.data?.recent_records[0].id)
      .toBe("10000000-0000-4000-8000-000000000001");

    const filtered = await api("/v1/public/dashboard?topic=product-building");
    expect(filtered.response.status).toBe(200);
    expect(filtered.json.data?.recent_records).toHaveLength(1);

    const unknown = await api("/v1/public/dashboard?topic=missing-topic");
    expect(unknown.response.status).toBe(404);
    expect(unknown.json.error?.code).toBe("not_found");
  });

  it("requires confirmation for durations over 12 hours", async () => {
    const entryId = "10000000-0000-4000-8000-000000000005";
    await api("/v1/owner/timer/start", {
      method: "POST",
      cookie,
      body: { id: entryId, topic_id: TOPIC_ID, timezone: "Asia/Shanghai" },
    });
    await env.DB.prepare("UPDATE time_entries SET started_at_ms = ? WHERE id = ?")
      .bind(Date.now() - 13 * 60 * 60 * 1000, entryId)
      .run();

    const warning = await api(`/v1/owner/timer/${entryId}/finish`, {
      method: "POST", cookie, body: { expected_version: 1 },
    });
    expect(warning.response.status).toBe(422);
    expect(warning.json.error?.code).toBe("long_duration_confirmation_required");

    const confirmed = await api(`/v1/owner/timer/${entryId}/finish`, {
      method: "POST",
      cookie,
      body: { expected_version: 1, confirm_long_duration: true, visibility: "private" },
    });
    expect(confirmed.json.data?.status).toBe("completed");
  });

  it("creates an idempotent manual entry", async () => {
    const entryId = "10000000-0000-4000-8000-000000000006";
    const incomplete = await api("/v1/owner/entries", {
      method: "POST",
      cookie,
      body: {
        id: "10000000-0000-4000-8000-000000000009",
        topic_id: TOPIC_ID,
        entry_date: "2026-08-29",
        timezone: "Asia/Shanghai",
        duration_seconds: 60,
        task_zh: "只有中文",
        visibility: "public",
      },
    });
    expect(incomplete.response.status).toBe(422);
    expect(incomplete.json.error?.code).toBe("bilingual_task_required");

    const body = {
      id: entryId,
      topic_id: TOPIC_ID,
      entry_date: "2026-08-29",
      timezone: "Asia/Shanghai",
      duration_seconds: 3_600,
      task_zh: "手动补录测试",
      task_en: "Manual entry test",
      visibility: "public",
      related_post_url: "https://chloevolution.com/zh-cn/posts/test/",
    };

    const created = await api("/v1/owner/entries", { method: "POST", cookie, body });
    expect(created.response.status).toBe(201);
    expect(created.json.data).toMatchObject({
      id: entryId,
      source: "manual",
      status: "completed",
      duration_seconds: 3_600,
    });

    const repeated = await api("/v1/owner/entries", { method: "POST", cookie, body });
    expect(repeated.response.status).toBe(201);
    expect(repeated.json.data?.id).toBe(entryId);

    const count = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM time_entries WHERE id = ?",
    ).bind(entryId).first<{ count: number }>();
    expect(count?.count).toBe(1);

    const dashboard = await api("/v1/public/dashboard");
    expect(dashboard.json.data?.related_posts).toEqual([
      expect.objectContaining({
        url: "https://chloevolution.com/zh-cn/posts/test/",
        title_zh: "手动补录测试",
        title_en: "Manual entry test",
      }),
    ]);
  });

  it("orders recent records by date and then completion time", async () => {
    await env.DB.prepare(
      `UPDATE time_entries SET completed_at_ms = CASE id
        WHEN '10000000-0000-4000-8000-000000000001' THEN 1000
        WHEN '10000000-0000-4000-8000-000000000006' THEN 2000
        ELSE completed_at_ms END
       WHERE id IN ('10000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000006')`,
    ).run();
    const dashboard = await api("/v1/public/dashboard");
    expect(dashboard.json.data?.recent_records.slice(0, 2).map((entry: any) => entry.id)).toEqual([
      "10000000-0000-4000-8000-000000000006",
      "10000000-0000-4000-8000-000000000001",
    ]);

    const firstPage = await api("/v1/public/records?limit=1");
    expect(firstPage.response.status).toBe(200);
    expect(firstPage.json.data?.records.map((entry: any) => entry.id)).toEqual([
      "10000000-0000-4000-8000-000000000006",
    ]);
    expect(firstPage.json.data?.next_cursor).toEqual(expect.any(String));

    const secondPage = await api(
      `/v1/public/records?limit=1&cursor=${encodeURIComponent(firstPage.json.data?.next_cursor)}`,
    );
    expect(secondPage.json.data?.records.map((entry: any) => entry.id)).toEqual([
      "10000000-0000-4000-8000-000000000001",
    ]);
    expect(secondPage.json.data?.next_cursor).toBeNull();

    const invalidCursor = await api("/v1/public/records?cursor=not-a-cursor");
    expect(invalidCursor.response.status).toBe(400);
    expect(invalidCursor.json.error?.code).toBe("invalid_cursor");
  });

  it("deduplicates anonymous interest signals", async () => {
    const first = await api("/v1/public/interest", {
      method: "POST",
      body: { client_id: "anonymous-browser-id-0001" },
    });
    expect(first.json.data).toMatchObject({ recorded: true, count: 1 });

    const repeated = await api("/v1/public/interest", {
      method: "POST",
      body: { client_id: "anonymous-browser-id-0001" },
    });
    expect(repeated.json.data).toMatchObject({ recorded: false, count: 1 });

    const dashboard = await api("/v1/public/dashboard");
    expect(dashboard.json.data?.interest_count).toBe(1);
  });

  it("lists, edits, restores and deletes Owner entries", async () => {
    const listed = await api("/v1/owner/entries?status=completed&limit=20", { cookie });
    expect(listed.response.status).toBe(200);
    expect(listed.json.data?.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "10000000-0000-4000-8000-000000000006" }),
      ]),
    );

    const correctedTimer = await api("/v1/owner/entries/10000000-0000-4000-8000-000000000001", {
      method: "PATCH",
      cookie,
      body: {
        expected_version: 5,
        duration_seconds: 3_600,
        task_zh: "修正计时时长",
        task_en: "Corrected timer duration",
      },
    });
    expect(correctedTimer.response.status).toBe(200);
    expect(correctedTimer.json.data).toMatchObject({
      source: "timer",
      calculated_duration_seconds: expect.any(Number),
      duration_seconds: 3_600,
      task_zh: "修正计时时长",
      task_en: "Corrected timer duration",
      version: 6,
    });

    const edited = await api("/v1/owner/entries/10000000-0000-4000-8000-000000000006", {
      method: "PATCH",
      cookie,
      body: {
        expected_version: 1,
        duration_seconds: 7_200,
        task_zh: "修改后的手动记录",
        task_en: "Edited manual entry",
        visibility: "private",
      },
    });
    expect(edited.json.data).toMatchObject({
      version: 2,
      duration_seconds: 7_200,
      task_zh: "修改后的手动记录",
      task_en: "Edited manual entry",
      visibility: "private",
    });

    const cancelledId = "10000000-0000-4000-8000-000000000004";
    await env.DB.prepare("UPDATE time_entries SET started_at_ms = ? WHERE id = ?")
      .bind(Date.now() - 120_000, cancelledId)
      .run();
    const restored = await api(`/v1/owner/entries/${cancelledId}/restore`, {
      method: "POST",
      cookie,
      body: {
        expected_version: 2,
        duration_seconds: 60,
        visibility: "private",
        task: "Restored entry",
      },
    });
    expect(restored.json.data).toMatchObject({ status: "completed", version: 3 });

    const deleted = await api(`/v1/owner/entries/${cancelledId}`, {
      method: "DELETE",
      cookie,
    });
    expect(deleted.json.data).toMatchObject({ deleted: true, id: cancelledId });

    const missing = await api(`/v1/owner/entries/${cancelledId}`, {
      method: "DELETE",
      cookie,
    });
    expect(missing.response.status).toBe(404);
  });

  it("creates, edits, archives and reactivates a topic", async () => {
    const topicId = "20000000-0000-4000-8000-000000000001";
    const created = await api("/v1/owner/topics", {
      method: "POST",
      cookie,
      body: {
        id: topicId,
        slug: "ai-learning",
        name_zh: "AI 学习",
        name_en: "AI learning",
        color: "#12AB34",
        sort_order: 20,
      },
    });
    expect(created.response.status).toBe(201);
    expect(created.json.data).toMatchObject({ slug: "ai-learning", color: "#12ab34" });

    const edited = await api(`/v1/owner/topics/${topicId}`, {
      method: "PATCH",
      cookie,
      body: { name_zh: "人工智能学习", sort_order: 30 },
    });
    expect(edited.json.data).toMatchObject({ name_zh: "人工智能学习", sort_order: 30 });

    const activeId = "10000000-0000-4000-8000-000000000008";
    await api("/v1/owner/timer/start", {
      method: "POST",
      cookie,
      body: { id: activeId, topic_id: topicId, timezone: "Asia/Shanghai" },
    });
    const archiveBlocked = await api(`/v1/owner/topics/${topicId}/archive`, {
      method: "POST",
      cookie,
    });
    expect(archiveBlocked.response.status).toBe(409);
    expect(archiveBlocked.json.error?.code).toBe("active_timer_exists");
    await api(`/v1/owner/timer/${activeId}/cancel`, {
      method: "POST",
      cookie,
      body: { expected_version: 1 },
    });

    const archived = await api(`/v1/owner/topics/${topicId}/archive`, {
      method: "POST",
      cookie,
    });
    expect(archived.json.data?.status).toBe("archived");

    const listed = await api("/v1/owner/topics", { cookie });
    expect(listed.response.status).toBe(200);
    expect(listed.json.data?.topics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: topicId, status: "archived" }),
      ]),
    );

    const blocked = await api("/v1/owner/timer/start", {
      method: "POST",
      cookie,
      body: {
        id: "10000000-0000-4000-8000-000000000007",
        topic_id: topicId,
        timezone: "Asia/Shanghai",
      },
    });
    expect(blocked.response.status).toBe(409);
    expect(blocked.json.error?.code).toBe("topic_archived");

    const reactivated = await api(`/v1/owner/topics/${topicId}/reactivate`, {
      method: "POST",
      cookie,
    });
    expect(reactivated.json.data?.status).toBe("active");
  });

  it("revokes an Owner device immediately", async () => {
    const devices = await api("/v1/owner/devices", { cookie });
    expect(devices.response.status).toBe(200);
    expect(devices.json.data?.devices).toEqual(
      expect.arrayContaining([expect.objectContaining({ is_current: true })]),
    );

    const revoked = await api("/v1/owner/devices/current", { method: "DELETE", cookie });
    expect(revoked.response.status).toBe(200);

    const rejected = await api("/v1/owner/state", { cookie });
    expect(rejected.response.status).toBe(403);
    expect(rejected.json.error?.code).toBe("owner_device_revoked");
  });
});

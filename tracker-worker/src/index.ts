interface Env {
  DB: D1Database;
  ALLOWED_ORIGIN: string;
  OWNER_ACTIVATION_KEY: string;
  INTEREST_HASH_PEPPER: string;
}

type EntryStatus = "running" | "paused" | "completed" | "cancelled";
type Visibility = "public" | "private";

interface TimeEntry {
  id: string;
  topic_id: string;
  source: "timer" | "manual";
  status: EntryStatus;
  visibility: Visibility;
  task: string | null;
  task_zh: string | null;
  task_en: string | null;
  note: string | null;
  entry_date: string;
  timezone: string;
  started_at_ms: number | null;
  ended_at_ms: number | null;
  calculated_duration_seconds: number | null;
  duration_seconds: number | null;
  related_post_url: string | null;
  version: number;
  completed_at_ms: number | null;
  cancelled_at_ms: number | null;
  created_at_ms: number;
  updated_at_ms: number;
}

interface OwnerDevice {
  id: string;
  expires_at_ms: number;
  revoked_at_ms: number | null;
  last_used_at_ms: number;
}

class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const COOKIE_NAME = "__Host-tracker_owner";
const DEVICE_LIFETIME_MS = 180 * 24 * 60 * 60 * 1000;
const LONG_DURATION_SECONDS = 12 * 60 * 60;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const requestId = crypto.randomUUID();

    try {
      if (request.method === "OPTIONS") {
        return corsPreflight(request, env);
      }

      const url = new URL(request.url);
      const path = url.pathname.replace(/\/$/, "") || "/";

      if (request.method === "GET" && path === "/v1/health") {
        return ok({ status: "ok" }, requestId, request, env);
      }

      if (request.method === "GET" && path === "/v1/public/dashboard") {
        return ok(
          await publicDashboard(env.DB, url.searchParams.get("topic")),
          requestId,
          request,
          env,
        );
      }

      if (request.method === "GET" && path === "/v1/public/records") {
        return ok(
          await publicRecords(env.DB, url.searchParams),
          requestId,
          request,
          env,
        );
      }

      if (request.method === "POST" && path === "/v1/public/interest") {
        requireWriteOrigin(request, env);
        return ok(await recordInterest(request, env), requestId, request, env);
      }

      if (request.method === "POST" && path === "/v1/owner/devices/activate") {
        requireWriteOrigin(request, env);
        const result = await activateDevice(request, env);
        return ok(result.data, requestId, request, env, 201, { "Set-Cookie": result.cookie });
      }

      if (!path.startsWith("/v1/owner/")) {
        throw new ApiError(404, "not_found", "Route not found.");
      }

      const device = await requireOwner(request, env);
      if (request.method !== "GET" && request.method !== "HEAD") {
        requireWriteOrigin(request, env);
      }

      if (request.method === "GET" && path === "/v1/owner/state") {
        return ok(await ownerState(env.DB, device), requestId, request, env);
      }

      if (request.method === "GET" && path === "/v1/owner/devices") {
        return ok(await listDevices(env.DB, device.id), requestId, request, env);
      }

      if (request.method === "DELETE" && path === "/v1/owner/devices/current") {
        await revokeDevice(env.DB, device.id);
        return ok(
          { revoked: true },
          requestId,
          request,
          env,
          200,
          { "Set-Cookie": `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0` },
        );
      }

      const deviceRoute = path.match(/^\/v1\/owner\/devices\/([^/]+)$/);
      if (request.method === "DELETE" && deviceRoute) {
        requiredUuid(deviceRoute[1], "device_id");
        await revokeDevice(env.DB, deviceRoute[1]);
        return ok({ revoked: true, device_id: deviceRoute[1] }, requestId, request, env);
      }

      if (request.method === "POST" && path === "/v1/owner/timer/start") {
        return ok(await startTimer(request, env.DB), requestId, request, env, 201);
      }

      if (request.method === "POST" && path === "/v1/owner/entries") {
        return ok(await createManualEntry(request, env.DB), requestId, request, env, 201);
      }

      if (request.method === "GET" && path === "/v1/owner/entries") {
        return ok(await listEntries(url, env.DB), requestId, request, env);
      }

      if (request.method === "GET" && path === "/v1/owner/topics") {
        return ok(await listOwnerTopics(env.DB), requestId, request, env);
      }

      const restoreRoute = path.match(/^\/v1\/owner\/entries\/([^/]+)\/restore$/);
      if (request.method === "POST" && restoreRoute) {
        return ok(await restoreEntry(request, env.DB, restoreRoute[1]), requestId, request, env);
      }

      const entryRoute = path.match(/^\/v1\/owner\/entries\/([^/]+)$/);
      if (request.method === "PATCH" && entryRoute) {
        return ok(await editEntry(request, env.DB, entryRoute[1]), requestId, request, env);
      }
      if (request.method === "DELETE" && entryRoute) {
        return ok(await deleteEntry(env.DB, entryRoute[1]), requestId, request, env);
      }

      if (request.method === "POST" && path === "/v1/owner/topics") {
        return ok(await createTopic(request, env.DB), requestId, request, env, 201);
      }

      const topicActionRoute = path.match(/^\/v1\/owner\/topics\/([^/]+)\/(archive|reactivate)$/);
      if (request.method === "POST" && topicActionRoute) {
        return ok(
          await setTopicStatus(env.DB, topicActionRoute[1], topicActionRoute[2]),
          requestId,
          request,
          env,
        );
      }

      const topicRoute = path.match(/^\/v1\/owner\/topics\/([^/]+)$/);
      if (request.method === "PATCH" && topicRoute) {
        return ok(await editTopic(request, env.DB, topicRoute[1]), requestId, request, env);
      }

      const activeTimerEditRoute = path.match(/^\/v1\/owner\/timer\/([^/]+)$/);
      if (request.method === "PATCH" && activeTimerEditRoute) {
        return ok(
          await editActiveTimer(request, env.DB, activeTimerEditRoute[1]),
          requestId,
          request,
          env,
        );
      }

      const timerRoute = path.match(/^\/v1\/owner\/timer\/([^/]+)\/(pause|resume|finish|cancel)$/);
      if (request.method === "POST" && timerRoute) {
        const [, id, action] = timerRoute;
        const data = await transitionTimer(request, env.DB, id, action);
        return ok(data, requestId, request, env);
      }

      throw new ApiError(404, "not_found", "Route not found.");
    } catch (error) {
      if (error instanceof ApiError) {
        return fail(error.status, error.code, error.message, requestId, request, env);
      }

      console.error(JSON.stringify({ request_id: requestId, code: "internal_error" }));
      return fail(500, "internal_error", "Unexpected server error.", requestId, request, env);
    }
  },
};

async function activateDevice(request: Request, env: Env) {
  const body = await readJson(request);
  const ownerKey = optionalString(body.owner_key);
  const label = optionalString(body.label)?.slice(0, 80) ?? null;

  if (!ownerKey || !(await secretsMatch(ownerKey, env.OWNER_ACTIVATION_KEY))) {
    throw new ApiError(401, "owner_auth_required", "Invalid Owner Key.");
  }

  const now = Date.now();
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const deviceId = crypto.randomUUID();
  const expiresAt = now + DEVICE_LIFETIME_MS;

  await env.DB.prepare(
    `INSERT INTO owner_devices
      (id, token_hash, label, created_at_ms, expires_at_ms, last_used_at_ms, revoked_at_ms)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
  )
    .bind(deviceId, tokenHash, label, now, expiresAt, now)
    .run();

  return {
    data: { device_id: deviceId, expires_at_ms: expiresAt },
    cookie: `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=15552000`,
  };
}

async function recordInterest(request: Request, env: Env) {
  const body = await readJson(request);
  const clientId = requiredString(body.client_id, "client_id");
  if (clientId.length < 16 || clientId.length > 200) {
    throw new ApiError(400, "invalid_request", "client_id must contain 16 to 200 characters.");
  }

  const clientHash = await hmacSha256Hex(clientId, env.INTEREST_HASH_PEPPER);
  const result = await env.DB.prepare(
    `INSERT OR IGNORE INTO interest_signals (id, client_hash, created_at_ms)
     VALUES (?, ?, ?)`,
  ).bind(crypto.randomUUID(), clientHash, Date.now()).run();
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM interest_signals")
    .first<{ count: number }>();

  return { recorded: result.meta.changes === 1, count: count?.count ?? 0 };
}

async function requireOwner(request: Request, env: Env): Promise<OwnerDevice> {
  const token = parseCookies(request.headers.get("Cookie"))[COOKIE_NAME];
  if (!token) {
    throw new ApiError(401, "owner_auth_required", "Owner device activation is required.");
  }

  const tokenHash = await sha256Hex(token);
  const device = await env.DB.prepare(
    `SELECT id, expires_at_ms, revoked_at_ms, last_used_at_ms
       FROM owner_devices WHERE token_hash = ?`,
  )
    .bind(tokenHash)
    .first<OwnerDevice>();

  if (!device) {
    throw new ApiError(401, "owner_auth_required", "Owner device activation is required.");
  }
  if (device.revoked_at_ms !== null || device.expires_at_ms <= Date.now()) {
    throw new ApiError(403, "owner_device_revoked", "Owner device is revoked or expired.");
  }

  const now = Date.now();
  if (now - device.last_used_at_ms >= 24 * 60 * 60 * 1000) {
    await env.DB.prepare("UPDATE owner_devices SET last_used_at_ms = ? WHERE id = ?")
      .bind(now, device.id)
      .run();
  }
  return device;
}

async function ownerState(db: D1Database, device: OwnerDevice) {
  const [active, topics] = await Promise.all([
    db.prepare(
      `SELECT e.*,
          COALESCE((SELECT SUM(COALESCE(p.resumed_at_ms, ?) - p.paused_at_ms)
                    FROM time_entry_pauses p WHERE p.time_entry_id = e.id), 0) AS paused_ms
         FROM time_entries e
        WHERE e.status IN ('running', 'paused')
        LIMIT 1`,
    )
      .bind(Date.now())
      .first<Record<string, unknown>>(),
    db.prepare(
      `SELECT id, slug, name_zh, name_en, color, sort_order
         FROM topics WHERE status = 'active' ORDER BY sort_order, created_at_ms`,
    ).all(),
  ]);

  return {
    authorized: true,
    device_id: device.id,
    active_timer: active,
    topics: topics.results,
  };
}

async function listDevices(db: D1Database, currentDeviceId: string) {
  const devices = await db.prepare(
    `SELECT id, label, created_at_ms, expires_at_ms, last_used_at_ms, revoked_at_ms
       FROM owner_devices ORDER BY created_at_ms DESC`,
  ).all<Record<string, unknown>>();

  return {
    devices: devices.results.map((device) => ({
      ...device,
      is_current: device.id === currentDeviceId,
    })),
  };
}

async function revokeDevice(db: D1Database, deviceId: string) {
  const result = await db.prepare(
    `UPDATE owner_devices SET revoked_at_ms = COALESCE(revoked_at_ms, ?)
      WHERE id = ?`,
  ).bind(Date.now(), deviceId).run();
  if (result.meta.changes !== 1) {
    throw new ApiError(404, "not_found", "Owner device not found.");
  }
}

async function startTimer(request: Request, db: D1Database) {
  const body = await readJson(request);
  const id = requiredUuid(body.id, "id");
  const topicId = requiredUuid(body.topic_id, "topic_id");
  const timezone = requiredString(body.timezone, "timezone");
  const visibility = parseVisibility(body.visibility);
  const { taskZh, taskEn } = parseTaskFields(body);
  const now = Date.now();

  const existing = await db.prepare("SELECT * FROM time_entries WHERE id = ?").bind(id).first<TimeEntry>();
  if (existing) return existing;

  const active = await db.prepare(
    "SELECT id FROM time_entries WHERE status IN ('running', 'paused') LIMIT 1",
  ).first<{ id: string }>();
  if (active) {
    throw new ApiError(409, "active_timer_exists", "Another timer is already active.");
  }

  const topic = await db.prepare("SELECT status FROM topics WHERE id = ?")
    .bind(topicId)
    .first<{ status: "active" | "archived" }>();
  if (!topic) throw new ApiError(404, "not_found", "Topic not found.");
  if (topic.status !== "active") {
    throw new ApiError(409, "topic_archived", "Archived topics cannot start a timer.");
  }

  const entryDate = localDate(now, timezone);
  try {
    await db.prepare(
      `INSERT INTO time_entries
        (id, topic_id, source, status, visibility, task, task_zh, task_en, note, entry_date, timezone,
         started_at_ms, ended_at_ms, calculated_duration_seconds, duration_seconds,
         related_post_url, version, completed_at_ms, cancelled_at_ms, created_at_ms, updated_at_ms)
       VALUES (?, ?, 'timer', 'running', ?, ?, ?, ?, NULL, ?, ?, ?, NULL, NULL, NULL,
         NULL, 1, NULL, NULL, ?, ?)`,
    )
      .bind(id, topicId, visibility, taskZh, taskZh, taskEn, entryDate, timezone, now, now, now)
      .run();
  } catch (error) {
    const current = await db.prepare("SELECT * FROM time_entries WHERE id = ?").bind(id).first<TimeEntry>();
    if (current) return current;
    throw new ApiError(409, "active_timer_exists", "Another timer is already active.");
  }

  return getEntry(db, id);
}

async function createManualEntry(request: Request, db: D1Database) {
  const body = await readJson(request);
  const id = requiredUuid(body.id, "id");
  const topicId = requiredUuid(body.topic_id, "topic_id");
  const entryDate = parseEntryDate(body.entry_date);
  const timezone = requiredString(body.timezone, "timezone");
  localDate(Date.now(), timezone);
  const duration = requiredPositiveInteger(body.duration_seconds, "duration_seconds");

  if (duration > LONG_DURATION_SECONDS && body.confirm_long_duration !== true) {
    throw new ApiError(
      422,
      "long_duration_confirmation_required",
      "Durations over 12 hours require confirmation.",
    );
  }

  const existing = await db.prepare("SELECT * FROM time_entries WHERE id = ?").bind(id).first<TimeEntry>();
  if (existing) return existing;

  const topic = await db.prepare("SELECT status FROM topics WHERE id = ?")
    .bind(topicId)
    .first<{ status: "active" | "archived" }>();
  if (!topic) throw new ApiError(404, "not_found", "Topic not found.");
  if (topic.status !== "active") {
    throw new ApiError(409, "topic_archived", "Archived topics cannot receive a manual entry.");
  }

  const visibility = parseVisibility(body.visibility);
  const { taskZh, taskEn } = parseTaskFields(body);
  validateBilingualPublicTask(visibility, taskZh, taskEn);
  const note = optionalString(body.note)?.slice(0, 5000) ?? null;
  const relatedPostUrl = parseRelatedPost(body.related_post_url);
  const now = Date.now();

  await db.prepare(
    `INSERT INTO time_entries
      (id, topic_id, source, status, visibility, task, task_zh, task_en, note, entry_date, timezone,
       started_at_ms, ended_at_ms, calculated_duration_seconds, duration_seconds,
       related_post_url, version, completed_at_ms, cancelled_at_ms, created_at_ms, updated_at_ms)
     VALUES (?, ?, 'manual', 'completed', ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?,
       1, ?, NULL, ?, ?)`,
  ).bind(
    id, topicId, visibility, taskZh, taskZh, taskEn, note, entryDate, timezone, duration, relatedPostUrl,
    now, now, now,
  ).run();

  return getEntry(db, id);
}

async function listEntries(url: URL, db: D1Database) {
  const status = url.searchParams.get("status");
  if (status && !["running", "paused", "completed", "cancelled"].includes(status)) {
    throw new ApiError(400, "invalid_request", "Unknown entry status filter.");
  }
  const requestedLimit = Number(url.searchParams.get("limit") ?? "20");
  if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > 50) {
    throw new ApiError(400, "invalid_request", "limit must be between 1 and 50.");
  }

  const query = status
    ? `SELECT e.*, t.slug AS topic_slug, t.name_zh AS topic_name_zh, t.name_en AS topic_name_en
         FROM time_entries e JOIN topics t ON t.id = e.topic_id
        WHERE e.status = ? ORDER BY e.updated_at_ms DESC, e.id DESC LIMIT ?`
    : `SELECT e.*, t.slug AS topic_slug, t.name_zh AS topic_name_zh, t.name_en AS topic_name_en
         FROM time_entries e JOIN topics t ON t.id = e.topic_id
        ORDER BY e.updated_at_ms DESC, e.id DESC LIMIT ?`;
  const statement = status
    ? db.prepare(query).bind(status, requestedLimit)
    : db.prepare(query).bind(requestedLimit);
  const entries = await statement.all();
  return { entries: entries.results };
}

async function listOwnerTopics(db: D1Database) {
  const topics = await db.prepare(
    `SELECT id, slug, name_zh, name_en, color, sort_order, status, created_at_ms, updated_at_ms
       FROM topics
      ORDER BY status = 'archived', sort_order, created_at_ms, id`,
  ).all();
  return { topics: topics.results };
}

async function editEntry(request: Request, db: D1Database, id: string) {
  requiredUuid(id, "id");
  const body = await readJson(request);
  const expectedVersion = requiredPositiveInteger(body.expected_version, "expected_version");
  const entry = await getEntry(db, id);
  if (entry.status !== "completed" && entry.status !== "cancelled") {
    throw new ApiError(409, "invalid_state", "Only completed or cancelled entries can be edited.");
  }
  assertVersion(entry, expectedVersion);

  const topicId = body.topic_id === undefined
    ? entry.topic_id
    : requiredUuid(body.topic_id, "topic_id");
  const topic = await db.prepare("SELECT id FROM topics WHERE id = ?").bind(topicId).first();
  if (!topic) throw new ApiError(404, "not_found", "Topic not found.");

  const entryDate = body.entry_date === undefined ? entry.entry_date : parseEntryDate(body.entry_date);
  const timezone = body.timezone === undefined
    ? entry.timezone
    : requiredString(body.timezone, "timezone");
  localDate(Date.now(), timezone);
  const visibility = body.visibility === undefined ? entry.visibility : parseVisibility(body.visibility);
  const { taskZh, taskEn } = parseTaskFields(body, entry);
  validateBilingualPublicTask(visibility, taskZh, taskEn);
  const note = body.note === undefined ? entry.note : optionalString(body.note)?.slice(0, 5000) ?? null;
  const relatedPostUrl = body.related_post_url === undefined
    ? entry.related_post_url
    : parseRelatedPost(body.related_post_url);
  const duration = body.duration_seconds === undefined
    ? entry.duration_seconds
    : requiredPositiveInteger(body.duration_seconds, "duration_seconds");
  const startedAt = body.started_at_ms === undefined
    ? entry.started_at_ms
    : optionalTimestamp(body.started_at_ms, "started_at_ms");
  const endedAt = body.ended_at_ms === undefined
    ? entry.ended_at_ms
    : optionalTimestamp(body.ended_at_ms, "ended_at_ms");

  validateEditedTime(entry.source, entry.status, startedAt, endedAt, duration);
  if (duration !== null && duration > LONG_DURATION_SECONDS && body.confirm_long_duration !== true) {
    throw new ApiError(422, "long_duration_confirmation_required", "Durations over 12 hours require confirmation.");
  }

  const result = await db.prepare(
    `UPDATE time_entries
        SET topic_id = ?, visibility = ?, task = ?, task_zh = ?, task_en = ?, note = ?, entry_date = ?, timezone = ?,
            started_at_ms = ?, ended_at_ms = ?, duration_seconds = ?, related_post_url = ?,
            version = version + 1, updated_at_ms = ?
      WHERE id = ? AND version = ? AND status IN ('completed', 'cancelled')`,
  ).bind(
    topicId, visibility, taskZh, taskZh, taskEn, note, entryDate, timezone, startedAt, endedAt, duration,
    relatedPostUrl, Date.now(), id, expectedVersion,
  ).run();
  if (result.meta.changes !== 1) {
    throw new ApiError(409, "version_conflict", "The entry changed on another device.");
  }
  return getEntry(db, id);
}

async function deleteEntry(db: D1Database, id: string) {
  requiredUuid(id, "id");
  const result = await db.prepare("DELETE FROM time_entries WHERE id = ?").bind(id).run();
  if (result.meta.changes !== 1) throw new ApiError(404, "not_found", "Entry not found.");
  return { deleted: true, id };
}

async function restoreEntry(request: Request, db: D1Database, id: string) {
  requiredUuid(id, "id");
  const body = await readJson(request);
  const expectedVersion = requiredPositiveInteger(body.expected_version, "expected_version");
  const entry = await getEntry(db, id);
  if (entry.status === "completed") return entry;
  if (entry.status !== "cancelled") {
    throw new ApiError(409, "invalid_state", "Only a cancelled entry can be restored.");
  }
  assertVersion(entry, expectedVersion);

  const duration = requiredPositiveInteger(body.duration_seconds, "duration_seconds");
  if (duration > LONG_DURATION_SECONDS && body.confirm_long_duration !== true) {
    throw new ApiError(422, "long_duration_confirmation_required", "Durations over 12 hours require confirmation.");
  }
  const endedAt = body.ended_at_ms === undefined
    ? Date.now()
    : requiredTimestamp(body.ended_at_ms, "ended_at_ms");
  validateEditedTime(entry.source, "completed", entry.started_at_ms, endedAt, duration);
  const visibility = body.visibility === undefined ? entry.visibility : parseVisibility(body.visibility);
  const { taskZh, taskEn } = parseTaskFields(body, entry);
  validateBilingualPublicTask(visibility, taskZh, taskEn);
  const note = body.note === undefined ? entry.note : optionalString(body.note)?.slice(0, 5000) ?? null;
  const relatedPostUrl = body.related_post_url === undefined
    ? entry.related_post_url
    : parseRelatedPost(body.related_post_url);
  const now = Date.now();

  const result = await db.prepare(
    `UPDATE time_entries
        SET status = 'completed', visibility = ?, task = ?, task_zh = ?, task_en = ?, note = ?, ended_at_ms = ?,
            calculated_duration_seconds = ?, duration_seconds = ?, related_post_url = ?,
            version = version + 1, completed_at_ms = ?, cancelled_at_ms = NULL, updated_at_ms = ?
      WHERE id = ? AND status = 'cancelled' AND version = ?`,
  ).bind(
    visibility, taskZh, taskZh, taskEn, note, endedAt, duration, duration, relatedPostUrl,
    now, now, id, expectedVersion,
  ).run();
  if (result.meta.changes !== 1) {
    throw new ApiError(409, "version_conflict", "The entry changed on another device.");
  }
  return getEntry(db, id);
}

async function createTopic(request: Request, db: D1Database) {
  const body = await readJson(request);
  const id = body.id === undefined ? crypto.randomUUID() : requiredUuid(body.id, "id");
  const slug = parseTopicSlug(body.slug);
  const nameZh = requiredString(body.name_zh, "name_zh").slice(0, 80);
  const nameEn = requiredString(body.name_en, "name_en").slice(0, 80);
  const color = parseColor(body.color);
  const sortOrder = body.sort_order === undefined ? 0 : requiredInteger(body.sort_order, "sort_order");
  const now = Date.now();

  try {
    await db.prepare(
      `INSERT INTO topics
        (id, slug, name_zh, name_en, color, sort_order, status, created_at_ms, updated_at_ms)
       VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    ).bind(id, slug, nameZh, nameEn, color, sortOrder, now, now).run();
  } catch {
    throw new ApiError(409, "invalid_request", "Topic id or slug already exists.");
  }
  return getTopic(db, id);
}

async function editTopic(request: Request, db: D1Database, id: string) {
  requiredUuid(id, "id");
  const body = await readJson(request);
  const topic = await getTopic(db, id);
  const slug = body.slug === undefined ? topic.slug as string : parseTopicSlug(body.slug);
  const nameZh = body.name_zh === undefined
    ? topic.name_zh as string
    : requiredString(body.name_zh, "name_zh").slice(0, 80);
  const nameEn = body.name_en === undefined
    ? topic.name_en as string
    : requiredString(body.name_en, "name_en").slice(0, 80);
  const color = body.color === undefined ? topic.color as string | null : parseColor(body.color);
  const sortOrder = body.sort_order === undefined
    ? topic.sort_order as number
    : requiredInteger(body.sort_order, "sort_order");

  try {
    await db.prepare(
      `UPDATE topics SET slug = ?, name_zh = ?, name_en = ?, color = ?,
        sort_order = ?, updated_at_ms = ? WHERE id = ?`,
    ).bind(slug, nameZh, nameEn, color, sortOrder, Date.now(), id).run();
  } catch {
    throw new ApiError(409, "invalid_request", "Topic slug already exists.");
  }
  return getTopic(db, id);
}

async function setTopicStatus(db: D1Database, id: string, action: string) {
  requiredUuid(id, "id");
  const status = action === "archive" ? "archived" : "active";
  if (status === "archived") {
    const activeEntry = await db.prepare(
      "SELECT id FROM time_entries WHERE topic_id = ? AND status IN ('running', 'paused') LIMIT 1",
    ).bind(id).first();
    if (activeEntry) {
      throw new ApiError(409, "active_timer_exists", "A topic with an active timer cannot be archived.");
    }
  }
  const result = await db.prepare(
    "UPDATE topics SET status = ?, updated_at_ms = ? WHERE id = ?",
  ).bind(status, Date.now(), id).run();
  if (result.meta.changes !== 1) throw new ApiError(404, "not_found", "Topic not found.");
  return getTopic(db, id);
}

async function getTopic(db: D1Database, id: string): Promise<Record<string, unknown>> {
  const topic = await db.prepare("SELECT * FROM topics WHERE id = ?")
    .bind(id)
    .first<Record<string, unknown>>();
  if (!topic) throw new ApiError(404, "not_found", "Topic not found.");
  return topic;
}

async function transitionTimer(
  request: Request,
  db: D1Database,
  id: string,
  action: string,
) {
  requiredUuid(id, "id");
  const body = await readJson(request);
  const expectedVersion = requiredPositiveInteger(body.expected_version, "expected_version");
  const entry = await getEntry(db, id);

  if (action === "pause") return pauseTimer(db, entry, expectedVersion);
  if (action === "resume") return resumeTimer(db, entry, expectedVersion);
  if (action === "finish") return finishTimer(db, entry, expectedVersion, body);
  if (action === "cancel") return cancelTimer(db, entry, expectedVersion);
  throw new ApiError(404, "not_found", "Action not found.");
}

async function editActiveTimer(request: Request, db: D1Database, id: string) {
  requiredUuid(id, "id");
  const body = await readJson(request);
  const expectedVersion = requiredPositiveInteger(body.expected_version, "expected_version");
  const entry = await getEntry(db, id);
  if (entry.status !== "running" && entry.status !== "paused") {
    throw new ApiError(409, "invalid_state", "Only an active timer can be updated.");
  }
  assertVersion(entry, expectedVersion);
  const { taskZh, taskEn } = parseTaskFields(body, entry);
  const result = await db.prepare(
    `UPDATE time_entries SET task = ?, task_zh = ?, task_en = ?, version = version + 1, updated_at_ms = ?
      WHERE id = ? AND status IN ('running', 'paused') AND version = ?`,
  ).bind(taskZh, taskZh, taskEn, Date.now(), id, expectedVersion).run();
  if (result.meta.changes !== 1) {
    throw new ApiError(409, "version_conflict", "The entry changed on another device.");
  }
  return getEntry(db, id);
}

async function pauseTimer(db: D1Database, entry: TimeEntry, expectedVersion: number) {
  if (entry.status === "paused") return entry;
  assertTransition(entry, "running", expectedVersion);
  const now = Date.now();
  const nextVersion = expectedVersion + 1;

  const results = await db.batch([
    db.prepare(
      `UPDATE time_entries SET status = 'paused', version = version + 1, updated_at_ms = ?
        WHERE id = ? AND status = 'running' AND version = ?`,
    ).bind(now, entry.id, expectedVersion),
    db.prepare(
      `INSERT INTO time_entry_pauses (id, time_entry_id, paused_at_ms, resumed_at_ms, created_at_ms)
       SELECT ?, ?, ?, NULL, ?
        WHERE EXISTS (SELECT 1 FROM time_entries
          WHERE id = ? AND status = 'paused' AND version = ?)`,
    ).bind(crypto.randomUUID(), entry.id, now, now, entry.id, nextVersion),
  ]);

  if (results[0].meta.changes !== 1 || results[1].meta.changes !== 1) {
    throw new ApiError(409, "version_conflict", "The entry changed on another device.");
  }
  return getEntry(db, entry.id);
}

async function resumeTimer(db: D1Database, entry: TimeEntry, expectedVersion: number) {
  if (entry.status === "running") return entry;
  assertTransition(entry, "paused", expectedVersion);
  const now = Date.now();
  const nextVersion = expectedVersion + 1;

  const results = await db.batch([
    db.prepare(
      `UPDATE time_entries SET status = 'running', version = version + 1, updated_at_ms = ?
        WHERE id = ? AND status = 'paused' AND version = ?`,
    ).bind(now, entry.id, expectedVersion),
    db.prepare(
      `UPDATE time_entry_pauses SET resumed_at_ms = ?
        WHERE time_entry_id = ? AND resumed_at_ms IS NULL
          AND EXISTS (SELECT 1 FROM time_entries
            WHERE id = ? AND status = 'running' AND version = ?)`,
    ).bind(now, entry.id, entry.id, nextVersion),
  ]);

  if (results[0].meta.changes !== 1 || results[1].meta.changes !== 1) {
    throw new ApiError(409, "version_conflict", "The entry changed on another device.");
  }
  return getEntry(db, entry.id);
}

async function finishTimer(
  db: D1Database,
  entry: TimeEntry,
  expectedVersion: number,
  body: Record<string, unknown>,
) {
  if (entry.status === "completed") return entry;
  if (entry.status !== "running" && entry.status !== "paused") {
    throw new ApiError(409, "invalid_state", "Only an active timer can be finished.");
  }
  assertVersion(entry, expectedVersion);

  const now = Date.now();
  const paused = await db.prepare(
    `SELECT COALESCE(SUM(COALESCE(resumed_at_ms, ?) - paused_at_ms), 0) AS paused_ms
       FROM time_entry_pauses WHERE time_entry_id = ?`,
  ).bind(now, entry.id).first<{ paused_ms: number }>();
  const wallSeconds = Math.floor((now - (entry.started_at_ms ?? now)) / 1000);
  const calculated = Math.max(0, Math.floor((now - (entry.started_at_ms ?? now) - (paused?.paused_ms ?? 0)) / 1000));
  const requestedDuration = body.duration_seconds === undefined
    ? calculated
    : requiredPositiveInteger(body.duration_seconds, "duration_seconds");

  if (requestedDuration <= 0 || requestedDuration > wallSeconds) {
    throw new ApiError(422, "invalid_time_range", "Duration must fit inside the timer range.");
  }
  if (requestedDuration > LONG_DURATION_SECONDS && body.confirm_long_duration !== true) {
    throw new ApiError(
      422,
      "long_duration_confirmation_required",
      "Durations over 12 hours require confirmation.",
    );
  }

  const visibility = body.visibility === undefined
    ? entry.visibility
    : parseVisibility(body.visibility);
  const { taskZh, taskEn } = parseTaskFields(body, entry);
  validateBilingualPublicTask(visibility, taskZh, taskEn);
  const note = body.note === undefined ? entry.note : optionalString(body.note)?.slice(0, 5000) ?? null;
  const relatedPostUrl = body.related_post_url === undefined
    ? entry.related_post_url
    : parseRelatedPost(body.related_post_url);
  const nextVersion = expectedVersion + 1;

  const statements: D1PreparedStatement[] = [
    db.prepare(
      `UPDATE time_entries
          SET status = 'completed', visibility = ?, task = ?, task_zh = ?, task_en = ?, note = ?, ended_at_ms = ?,
              calculated_duration_seconds = ?, duration_seconds = ?, related_post_url = ?,
              version = version + 1, completed_at_ms = ?, updated_at_ms = ?
        WHERE id = ? AND status IN ('running', 'paused') AND version = ?`,
    ).bind(
      visibility, taskZh, taskZh, taskEn, note, now, calculated, requestedDuration, relatedPostUrl,
      now, now, entry.id, expectedVersion,
    ),
  ];

  if (entry.status === "paused") {
    statements.push(db.prepare(
      `UPDATE time_entry_pauses SET resumed_at_ms = ?
        WHERE time_entry_id = ? AND resumed_at_ms IS NULL
          AND EXISTS (SELECT 1 FROM time_entries
            WHERE id = ? AND status = 'completed' AND version = ?)`,
    ).bind(now, entry.id, entry.id, nextVersion));
  }

  const results = await db.batch(statements);
  if (results[0].meta.changes !== 1 || (entry.status === "paused" && results[1].meta.changes !== 1)) {
    throw new ApiError(409, "version_conflict", "The entry changed on another device.");
  }
  return getEntry(db, entry.id);
}

async function cancelTimer(db: D1Database, entry: TimeEntry, expectedVersion: number) {
  if (entry.status === "cancelled") return entry;
  if (entry.status !== "running" && entry.status !== "paused") {
    throw new ApiError(409, "invalid_state", "Only an active timer can be cancelled.");
  }
  assertVersion(entry, expectedVersion);
  const now = Date.now();
  const nextVersion = expectedVersion + 1;

  const statements: D1PreparedStatement[] = [
    db.prepare(
      `UPDATE time_entries
          SET status = 'cancelled', cancelled_at_ms = ?, version = version + 1, updated_at_ms = ?
        WHERE id = ? AND status IN ('running', 'paused') AND version = ?`,
    ).bind(now, now, entry.id, expectedVersion),
  ];
  if (entry.status === "paused") {
    statements.push(db.prepare(
      `UPDATE time_entry_pauses SET resumed_at_ms = ?
        WHERE time_entry_id = ? AND resumed_at_ms IS NULL
          AND EXISTS (SELECT 1 FROM time_entries
            WHERE id = ? AND status = 'cancelled' AND version = ?)`,
    ).bind(now, entry.id, entry.id, nextVersion));
  }

  const results = await db.batch(statements);
  if (results[0].meta.changes !== 1 || (entry.status === "paused" && results[1].meta.changes !== 1)) {
    throw new ApiError(409, "version_conflict", "The entry changed on another device.");
  }
  return getEntry(db, entry.id);
}

async function publicDashboard(db: D1Database, topicSlug: string | null) {
  let topicId: string | null = null;
  if (topicSlug) {
    const topic = await db.prepare("SELECT id FROM topics WHERE slug = ?")
      .bind(topicSlug)
      .first<{ id: string }>();
    if (!topic) throw new ApiError(404, "not_found", "Topic not found.");
    topicId = topic.id;
  }

  const [totals, topics, trend, recordPage, relatedRows] = await Promise.all([
    db.prepare(
      `SELECT COALESCE(SUM(duration_seconds), 0) AS total_seconds, COUNT(*) AS record_count,
              MIN(entry_date) AS first_entry_date
         FROM time_entries WHERE status = 'completed' AND visibility = 'public'`,
    ).first(),
    db.prepare(
      `SELECT t.id, t.slug, t.name_zh, t.name_en, t.color,
              COALESCE(SUM(e.duration_seconds), 0) AS total_seconds,
              COUNT(e.id) AS record_count
         FROM topics t
         LEFT JOIN time_entries e ON e.topic_id = t.id
           AND e.status = 'completed' AND e.visibility = 'public'
        GROUP BY t.id ORDER BY t.sort_order, t.created_at_ms`,
    ).all(),
    topicId
      ? db.prepare(
        `SELECT substr(entry_date, 1, 7) AS month, SUM(duration_seconds) AS total_seconds
           FROM time_entries
          WHERE status = 'completed' AND visibility = 'public' AND topic_id = ?
            AND entry_date >= date('now', '-11 months', 'start of month')
          GROUP BY substr(entry_date, 1, 7) ORDER BY month`,
      ).bind(topicId).all()
      : db.prepare(
        `SELECT substr(entry_date, 1, 7) AS month, SUM(duration_seconds) AS total_seconds
           FROM time_entries
          WHERE status = 'completed' AND visibility = 'public'
            AND entry_date >= date('now', '-11 months', 'start of month')
          GROUP BY substr(entry_date, 1, 7) ORDER BY month`,
      ).all(),
    publicRecordPage(db, topicId, null, 10),
    topicId
      ? db.prepare(
        `SELECT e.related_post_url AS url, e.task_zh AS title_zh, e.task_en AS title_en,
                e.entry_date
           FROM time_entries e
          WHERE e.status = 'completed' AND e.visibility = 'public'
            AND e.topic_id = ? AND e.related_post_url IS NOT NULL
          ORDER BY e.entry_date DESC, e.completed_at_ms DESC, e.id DESC LIMIT 20`,
      ).bind(topicId).all<{ url: string; title_zh: string | null; title_en: string | null; entry_date: string }>()
      : db.prepare(
        `SELECT e.related_post_url AS url, e.task_zh AS title_zh, e.task_en AS title_en,
                e.entry_date
           FROM time_entries e
          WHERE e.status = 'completed' AND e.visibility = 'public'
            AND e.related_post_url IS NOT NULL
          ORDER BY e.entry_date DESC, e.completed_at_ms DESC, e.id DESC LIMIT 20`,
      ).all<{ url: string; title_zh: string | null; title_en: string | null; entry_date: string }>(),
  ]);

  const interest = await db.prepare("SELECT COUNT(*) AS count FROM interest_signals")
    .first<{ count: number }>();

  const relatedPosts: Array<{
    url: string;
    title_zh: string | null;
    title_en: string | null;
    entry_date: string;
  }> = [];
  const seenRelatedUrls = new Set<string>();
  for (const row of relatedRows.results) {
    if (seenRelatedUrls.has(row.url)) continue;
    seenRelatedUrls.add(row.url);
    relatedPosts.push(row);
    if (relatedPosts.length === 3) break;
  }

  return {
    totals,
    topics: topics.results,
    monthly_trend: trend.results,
    recent_records: recordPage.records,
    recent_records_next_cursor: recordPage.next_cursor,
    related_posts: relatedPosts,
    interest_count: interest?.count ?? 0,
  };
}

interface PublicRecordCursor {
  entry_date: string;
  completed_at_ms: number;
  id: string;
}

interface PublicRecord extends PublicRecordCursor {
  task: string | null;
  task_zh: string | null;
  task_en: string | null;
  duration_seconds: number;
  related_post_url: string | null;
  topic_slug: string;
  topic_name_zh: string;
  topic_name_en: string;
  topic_color: string | null;
}

async function publicRecords(db: D1Database, searchParams: URLSearchParams) {
  const topicSlug = searchParams.get("topic");
  let topicId: string | null = null;
  if (topicSlug) {
    const topic = await db.prepare("SELECT id FROM topics WHERE slug = ?")
      .bind(topicSlug)
      .first<{ id: string }>();
    if (!topic) throw new ApiError(404, "not_found", "Topic not found.");
    topicId = topic.id;
  }

  const rawLimit = searchParams.get("limit");
  const limit = rawLimit === null ? 10 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new ApiError(400, "invalid_request", "limit must be an integer from 1 to 50.");
  }

  const cursor = searchParams.get("cursor");
  return publicRecordPage(db, topicId, cursor ? decodePublicRecordCursor(cursor) : null, limit);
}

async function publicRecordPage(
  db: D1Database,
  topicId: string | null,
  cursor: PublicRecordCursor | null,
  limit: number,
) {
  const filters = ["e.status = 'completed'", "e.visibility = 'public'"];
  const bindings: Array<string | number> = [];
  if (topicId) {
    filters.push("e.topic_id = ?");
    bindings.push(topicId);
  }
  if (cursor) {
    filters.push(`(e.entry_date < ?
      OR (e.entry_date = ? AND e.completed_at_ms < ?)
      OR (e.entry_date = ? AND e.completed_at_ms = ? AND e.id < ?))`);
    bindings.push(
      cursor.entry_date,
      cursor.entry_date, cursor.completed_at_ms,
      cursor.entry_date, cursor.completed_at_ms, cursor.id,
    );
  }
  bindings.push(limit + 1);

  const result = await db.prepare(
    `SELECT e.id, e.entry_date, e.completed_at_ms, e.task, e.task_zh, e.task_en,
            e.duration_seconds,
            e.related_post_url, t.slug AS topic_slug, t.name_zh AS topic_name_zh,
            t.name_en AS topic_name_en, t.color AS topic_color
       FROM time_entries e JOIN topics t ON t.id = e.topic_id
      WHERE ${filters.join(" AND ")}
      ORDER BY e.entry_date DESC, e.completed_at_ms DESC, e.id DESC LIMIT ?`,
  ).bind(...bindings).all<PublicRecord>();

  const hasMore = result.results.length > limit;
  const records = result.results.slice(0, limit);
  const last = records.at(-1);
  return {
    records,
    next_cursor: hasMore && last ? encodePublicRecordCursor(last) : null,
  };
}

function encodePublicRecordCursor(cursor: PublicRecordCursor): string {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify({
    entry_date: cursor.entry_date,
    completed_at_ms: cursor.completed_at_ms,
    id: cursor.id,
  })));
}

function decodePublicRecordCursor(value: string): PublicRecordCursor {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
    const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    const cursor = parsed as Record<string, unknown>;
    const entryDate = parseEntryDate(cursor.entry_date);
    const completedAt = requiredTimestamp(cursor.completed_at_ms, "cursor.completed_at_ms");
    const id = requiredUuid(cursor.id, "cursor.id");
    return { entry_date: entryDate, completed_at_ms: completedAt, id };
  } catch (error) {
    if (error instanceof ApiError) {
      throw new ApiError(400, "invalid_cursor", "cursor is invalid.");
    }
    throw new ApiError(400, "invalid_cursor", "cursor is invalid.");
  }
}

async function getEntry(db: D1Database, id: string): Promise<TimeEntry> {
  const entry = await db.prepare("SELECT * FROM time_entries WHERE id = ?")
    .bind(id)
    .first<TimeEntry>();
  if (!entry) throw new ApiError(404, "not_found", "Entry not found.");
  return entry;
}

function assertTransition(entry: TimeEntry, expectedStatus: EntryStatus, expectedVersion: number) {
  if (entry.status !== expectedStatus) {
    throw new ApiError(409, "invalid_state", `Entry must be ${expectedStatus}.`);
  }
  assertVersion(entry, expectedVersion);
}

function assertVersion(entry: TimeEntry, expectedVersion: number) {
  if (entry.version !== expectedVersion) {
    throw new ApiError(409, "version_conflict", "The entry changed on another device.");
  }
}

function localDate(timestamp: number, timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(timestamp));
    const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${value.year}-${value.month}-${value.day}`;
  } catch {
    throw new ApiError(400, "invalid_request", "timezone must be a valid IANA timezone.");
  }
}

function parseEntryDate(value: unknown): string {
  const text = requiredString(value, "entry_date");
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new ApiError(400, "invalid_request", "entry_date must use YYYY-MM-DD.");
  }
  const date = new Date(`${text}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== text) {
    throw new ApiError(400, "invalid_request", "entry_date must be a real calendar date.");
  }
  return text;
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await request.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "invalid_request", "A JSON object is required.");
  }
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ApiError(400, "invalid_request", `${field} is required.`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new ApiError(400, "invalid_request", "Expected a string value.");
  }
  return value.trim() || undefined;
}

function parseTaskFields(body: Record<string, unknown>, entry?: TimeEntry) {
  const legacyValue = body.task === undefined
    ? undefined
    : optionalString(body.task)?.slice(0, 300) ?? null;
  const taskZh = body.task_zh === undefined
    ? legacyValue === undefined ? entry?.task_zh ?? entry?.task ?? null : legacyValue
    : optionalString(body.task_zh)?.slice(0, 300) ?? null;
  const taskEn = body.task_en === undefined
    ? entry?.task_en ?? null
    : optionalString(body.task_en)?.slice(0, 300) ?? null;
  return { taskZh, taskEn };
}

function validateBilingualPublicTask(
  visibility: Visibility,
  taskZh: string | null,
  taskEn: string | null,
) {
  if (visibility === "public" && Boolean(taskZh) !== Boolean(taskEn)) {
    throw new ApiError(
      422,
      "bilingual_task_required",
      "Public entries must include both task_zh and task_en, or leave both empty.",
    );
  }
}

function requiredUuid(value: unknown, field: string): string {
  const text = requiredString(value, field);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)) {
    throw new ApiError(400, "invalid_request", `${field} must be a UUID.`);
  }
  return text;
}

function requiredPositiveInteger(value: unknown, field: string): number {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new ApiError(400, "invalid_request", `${field} must be a positive integer.`);
  }
  return value as number;
}

function requiredInteger(value: unknown, field: string): number {
  if (!Number.isInteger(value)) {
    throw new ApiError(400, "invalid_request", `${field} must be an integer.`);
  }
  return value as number;
}

function requiredTimestamp(value: unknown, field: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new ApiError(400, "invalid_request", `${field} must be a Unix millisecond timestamp.`);
  }
  return value as number;
}

function optionalTimestamp(value: unknown, field: string): number | null {
  if (value === null) return null;
  return requiredTimestamp(value, field);
}

function validateEditedTime(
  source: "timer" | "manual",
  status: EntryStatus,
  startedAt: number | null,
  endedAt: number | null,
  duration: number | null,
) {
  if (status === "completed" && duration === null) {
    throw new ApiError(422, "invalid_time_range", "Completed entries require a duration.");
  }
  if (source === "timer" && startedAt === null) {
    throw new ApiError(422, "invalid_time_range", "Timer entries require a start time.");
  }
  if (startedAt !== null && endedAt !== null) {
    if (endedAt < startedAt) {
      throw new ApiError(422, "invalid_time_range", "End time cannot be before start time.");
    }
  }
}

function parseTopicSlug(value: unknown): string {
  const slug = requiredString(value, "slug");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) {
    throw new ApiError(400, "invalid_request", "slug must use lowercase letters, numbers and hyphens.");
  }
  return slug;
}

function parseColor(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^#[0-9a-f]{6}$/i.test(value)) {
    throw new ApiError(400, "invalid_request", "color must use #RRGGBB.");
  }
  return value.toLowerCase();
}

function parseVisibility(value: unknown): Visibility {
  if (value === undefined) return "public";
  if (value !== "public" && value !== "private") {
    throw new ApiError(400, "invalid_request", "visibility must be public or private.");
  }
  return value;
}

function parseRelatedPost(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") {
    throw new ApiError(400, "invalid_request", "related_post_url must be a URL.");
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "chloevolution.com") throw new Error();
    return url.toString();
  } catch {
    throw new ApiError(400, "invalid_request", "related_post_url must be on chloevolution.com.");
  }
}

function requireWriteOrigin(request: Request, env: Env) {
  if (request.headers.get("Origin") !== env.ALLOWED_ORIGIN) {
    throw new ApiError(403, "invalid_origin", "Request origin is not allowed.");
  }
}

function parseCookies(header: string | null): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(header.split(";").map((part) => {
    const index = part.indexOf("=");
    return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }).filter(([key]) => key));
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToBase64Url(bytes);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function hmacSha256Hex(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function secretsMatch(left: string, right: string): Promise<boolean> {
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(left)),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(right)),
  ]);
  const aa = new Uint8Array(a);
  const bb = new Uint8Array(b);
  let difference = 0;
  for (let index = 0; index < aa.length; index += 1) difference |= aa[index] ^ bb[index];
  return difference === 0;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get("Origin");
  if (origin !== env.ALLOWED_ORIGIN) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

function corsPreflight(request: Request, env: Env): Response {
  if (request.headers.get("Origin") !== env.ALLOWED_ORIGIN) {
    return new Response(null, { status: 403 });
  }
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(request, env),
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}

function ok(
  data: unknown,
  requestId: string,
  request: Request,
  env: Env,
  status = 200,
  extraHeaders: HeadersInit = {},
): Response {
  return json({ data, request_id: requestId }, status, {
    ...corsHeaders(request, env),
    ...extraHeaders,
  });
}

function fail(
  status: number,
  code: string,
  message: string,
  requestId: string,
  request: Request,
  env: Env,
): Response {
  return json({ error: { code, message }, request_id: requestId }, status, corsHeaders(request, env));
}

function json(body: unknown, status: number, headers: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

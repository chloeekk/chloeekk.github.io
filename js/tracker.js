(() => {
  const root = document.querySelector("[data-tracker-root]");
  if (!root) return;

  const apiBase = root.dataset.apiBase;
  const isEnglish = root.dataset.lang === "en";
  const tx = (zh, en) => isEnglish ? en : zh;
  const topicName = (topic) => isEnglish ? topic?.name_en : topic?.name_zh;
  const localizedTask = (entry) => isEnglish
    ? entry?.task_en
    : entry?.task_zh || entry?.task;
  const taskLanguageGap = (entry) => {
    if (entry.visibility !== "public") return null;
    const hasZh = Boolean(entry.task_zh || entry.task);
    const hasEn = Boolean(entry.task_en);
    if (hasZh === hasEn) return null;
    return hasZh ? "en" : "zh";
  };
  const topicGrid = root.querySelector("[data-topic-grid]");
  const overviewButton = root.querySelector("[data-overview-filter]");
  const trendChart = root.querySelector("[data-trend-chart]");
  const trendAxis = root.querySelector("[data-trend-axis]");
  const recordList = root.querySelector("[data-record-list]");
  const loadMoreButton = root.querySelector("[data-load-more]");
  const startDate = root.querySelector("[data-start-date]");
  const relatedPosts = root.querySelector("[data-related-posts]");
  const interestButton = root.querySelector("[data-interest-button]");
  const interestCount = root.querySelector("[data-interest-count]");
  const activation = root.querySelector("[data-owner-activation]");
  const activationForm = root.querySelector("[data-activation-form]");
  const ownerToolbar = root.querySelector("[data-owner-toolbar]");
  const ownerPreviewToolbar = root.querySelector("[data-owner-preview-toolbar]");
  const activeTimerElement = root.querySelector("[data-active-timer]");
  const timerToggleButton = root.querySelector("[data-timer-toggle]");
  const timerTaskZhInput = root.querySelector("[data-timer-task-zh]");
  const timerTaskEnInput = root.querySelector("[data-timer-task-en]");
  const finishDialog = root.querySelector("[data-finish-dialog]");
  const finishForm = root.querySelector("[data-finish-form]");
  const startDialog = root.querySelector("[data-start-dialog]");
  const startForm = root.querySelector("[data-start-form]");
  const entryDialog = root.querySelector("[data-entry-dialog]");
  const entryForm = root.querySelector("[data-entry-form]");
  const manageDialog = root.querySelector("[data-manage-dialog]");
  const topicForm = root.querySelector("[data-topic-form]");
  let topics = [];
  let ownerTopics = [];
  let activeTopic = null;
  let ownerMode = false;
  let activeTimer = null;
  let timerInterval = null;
  let entryDialogMode = "create";
  let editingEntry = null;
  let taskSaveTimer = null;
  let taskSaveQueue = Promise.resolve();
  let nextRecordsCursor = null;

  const duration = (seconds) => {
    const totalSeconds = Math.round(Number(seconds || 0));
    if (totalSeconds > 0 && totalSeconds < 60) return tx(`${totalSeconds} 秒`, `${totalSeconds} sec`);
    const totalMinutes = Math.round(totalSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (!hours) return tx(`${minutes} 分钟`, `${minutes} min`);
    return minutes
      ? tx(`${hours} 小时 ${minutes} 分`, `${hours} hr ${minutes} min`)
      : tx(`${hours} 小时`, `${hours} hr`);
  };

  const dateLabel = (value) => {
    const date = new Date(`${value}T00:00:00`);
    return new Intl.DateTimeFormat(isEnglish ? "en" : "zh-CN", { month: "short", day: "numeric" }).format(date);
  };

  const fullDateLabel = (value) => {
    const date = new Date(`${value}T00:00:00`);
    return new Intl.DateTimeFormat(isEnglish ? "en" : "zh-CN", {
      year: "numeric", month: "short", day: "numeric",
    }).format(date);
  };

  const monthLabel = (value) => {
    if (!value) return tx("还没有记录", "No entries yet");
    const [year, month] = value.split("-").map(Number);
    if (!isEnglish) return `从 ${year} 年 ${month} 月开始`;
    const label = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" })
      .format(new Date(Date.UTC(year, month - 1, 1)));
    return `Since ${label}`;
  };

  const renderTopics = (items) => {
    topics = items;
    topicGrid.replaceChildren(...items.map((topic) => {
      const card = document.createElement("div");
      card.className = "direction-card";
      card.dataset.topic = topic.slug;
      if (activeTopic === topic.slug) card.classList.add("is-active");
      const filter = document.createElement("button");
      filter.type = "button";
      filter.className = "direction-card__filter";
      filter.setAttribute("aria-pressed", String(activeTopic === topic.slug));

      const dot = document.createElement("span");
      dot.className = "direction-card__dot";
      dot.style.backgroundColor = topic.color || "#6657d9";
      const name = document.createElement("span");
      name.className = "direction-card__name";
      name.textContent = topicName(topic);
      const total = document.createElement("strong");
      total.textContent = duration(topic.total_seconds);
      const meta = document.createElement("span");
      meta.className = "direction-card__meta";
      meta.textContent = tx(`${topic.record_count} 条记录`, `${topic.record_count} entries`);
      filter.append(dot, name, total, meta);
      card.append(filter);
      return card;
    }));
  };

  const renderTrend = (items) => {
    if (!items.length) {
      trendChart.innerHTML = `<p class="tracker-empty">${tx("还没有记录", "No entries yet")}</p>`;
      trendAxis.replaceChildren();
      return;
    }
    const max = Math.max(...items.map((item) => Number(item.total_seconds)), 1);
    trendChart.replaceChildren(...items.map((item) => {
      const bar = document.createElement("span");
      bar.style.setProperty("--bar", `${Math.max(6, Number(item.total_seconds) / max * 100)}%`);
      bar.title = `${item.month} · ${duration(item.total_seconds)}`;
      return bar;
    }));
    trendAxis.replaceChildren(...items.map((item) => {
      const label = document.createElement("span");
      label.textContent = isEnglish
        ? new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(`${item.month}-01T00:00:00Z`))
        : `${Number(item.month.slice(5))} 月`;
      return label;
    }));
  };

  const recordElements = (items) => items.map((record) => {
    const item = document.createElement("li");
    const date = document.createElement("span");
    date.className = "record-list__date";
    date.textContent = dateLabel(record.entry_date);
    const detail = document.createElement("div");
    const task = document.createElement("strong");
    task.textContent = localizedTask(record) || tx("未填写任务", "No task added");
    const topic = document.createElement("span");
    topic.textContent = isEnglish ? record.topic_name_en : record.topic_name_zh;
    detail.append(task, topic);
    const time = document.createElement("time");
    time.textContent = duration(record.duration_seconds);
    item.append(date, detail, time);
    return item;
  });

  const renderRecords = (items, append = false) => {
    if (!append && !items.length) {
      recordList.innerHTML = `<li class="tracker-empty">${tx("这个方向还没有记录", "No entries in this direction yet")}</li>`;
      return;
    }
    const elements = recordElements(items);
    if (append) recordList.append(...elements);
    else recordList.replaceChildren(...elements);
  };

  const renderRelatedPosts = (items) => {
    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "tracker-empty";
      empty.textContent = tx("还没有关联文章", "No related posts yet");
      relatedPosts.replaceChildren(empty);
      return;
    }
    relatedPosts.replaceChildren(...items.map((item) => {
      const link = document.createElement("a");
      link.href = item.url;
      link.className = "related-post";
      const title = document.createElement("span");
      title.textContent = (isEnglish ? item.title_en : item.title_zh) || tx("查看相关文章", "View related post");
      const action = document.createElement("small");
      action.textContent = tx("阅读文章 →", "Read post →");
      link.append(title, action);
      return link;
    }));
  };

  const loadDashboard = async (topicSlug = null) => {
    const query = topicSlug ? `?topic=${encodeURIComponent(topicSlug)}` : "";
    const response = await fetch(`${apiBase}/public/dashboard${query}`, { credentials: "include" });
    if (!response.ok) throw new Error("dashboard_failed");
    const { data } = await response.json();
    const totalSeconds = Math.max(0, Math.round(Number(data.totals.total_seconds || 0)));
    root.querySelector("[data-total-hours]").textContent = Math.floor(totalSeconds / 3600);
    root.querySelector("[data-total-minutes]").textContent = String(Math.floor(totalSeconds % 3600 / 60)).padStart(2, "0");
    root.querySelector("[data-total-seconds]").textContent = String(totalSeconds % 60).padStart(2, "0");
    root.querySelector("[data-record-count]").textContent = data.totals.record_count;
    startDate.textContent = monthLabel(data.totals.first_entry_date);
    interestCount.textContent = data.interest_count;
    renderTopics(data.topics);
    renderTrend(data.monthly_trend);
    renderRecords(data.recent_records);
    renderRelatedPosts(data.related_posts || []);
    nextRecordsCursor = data.recent_records_next_cursor;
    loadMoreButton.hidden = !nextRecordsCursor;
  };

  loadMoreButton.addEventListener("click", async () => {
    if (!nextRecordsCursor) return;
    const params = new URLSearchParams({ limit: "10", cursor: nextRecordsCursor });
    if (activeTopic) params.set("topic", activeTopic);
    loadMoreButton.disabled = true;
    loadMoreButton.textContent = tx("正在加载…", "Loading…");
    try {
      const response = await fetch(`${apiBase}/public/records?${params}`, { credentials: "include" });
      if (!response.ok) throw new Error("records_failed");
      const { data } = await response.json();
      renderRecords(data.records, true);
      nextRecordsCursor = data.next_cursor;
      loadMoreButton.hidden = !nextRecordsCursor;
    } catch (_) {
      loadMoreButton.textContent = tx("加载失败，再试一次", "Failed to load. Try again");
      return;
    } finally {
      loadMoreButton.disabled = false;
    }
    loadMoreButton.textContent = tx("加载更多", "Load more");
  });

  topicGrid.addEventListener("click", async (event) => {
    const card = event.target.closest("[data-topic]");
    if (!card) return;
    activeTopic = card.dataset.topic;
    overviewButton.classList.remove("is-active");
    overviewButton.setAttribute("aria-pressed", "false");
    try { await loadDashboard(activeTopic); } catch (_) { /* Keep the last usable view. */ }
  });

  overviewButton.addEventListener("click", async () => {
    activeTopic = null;
    overviewButton.classList.add("is-active");
    overviewButton.setAttribute("aria-pressed", "true");
    try { await loadDashboard(); } catch (_) { /* Keep the last usable view. */ }
  });

  interestButton.addEventListener("click", async () => {
    let clientId = localStorage.getItem("tracker_interest_client_id");
    if (!clientId) {
      clientId = crypto.randomUUID();
      localStorage.setItem("tracker_interest_client_id", clientId);
    }
    interestButton.disabled = true;
    try {
      const response = await fetch(`${apiBase}/public/interest`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId }),
      });
      if (!response.ok) throw new Error("interest_failed");
      const { data } = await response.json();
      interestCount.textContent = data.count;
      interestButton.textContent = tx("已经收到，谢谢你！", "Recorded. Thank you!");
      localStorage.setItem("tracker_interest_submitted", "true");
    } catch (_) {
      interestButton.disabled = false;
      interestButton.textContent = tx("再试一次", "Try again");
    }
  });

  if (localStorage.getItem("tracker_interest_submitted") === "true") {
    interestButton.disabled = true;
    interestButton.textContent = tx("已经收到，谢谢你！", "Recorded. Thank you!");
  }

  loadDashboard().catch(() => {
    root.dataset.connection = "offline";
  });

  const ownerRequest = async (path, options = {}) => {
    const response = await fetch(`${apiBase}${path}`, {
      credentials: "include",
      ...options,
      headers: options.body
        ? { "Content-Type": "application/json", ...(options.headers || {}) }
        : options.headers,
    });
    const payload = await response.json();
    if (!response.ok) {
      const error = new Error(payload.error?.message || "request_failed");
      error.code = payload.error?.code;
      error.status = response.status;
      throw error;
    }
    return payload.data;
  };

  const clock = (seconds) => {
    const value = Math.max(0, Math.floor(seconds));
    const hours = String(Math.floor(value / 3600)).padStart(2, "0");
    const minutes = String(Math.floor(value % 3600 / 60)).padStart(2, "0");
    const rest = String(value % 60).padStart(2, "0");
    return `${hours}:${minutes}:${rest}`;
  };

  const effectiveSeconds = () => {
    if (!activeTimer) return 0;
    const reference = activeTimer.status === "paused"
      ? Number(activeTimer.updated_at_ms)
      : Date.now();
    return (reference - Number(activeTimer.started_at_ms) - Number(activeTimer.paused_ms || 0)) / 1000;
  };

  const renderActiveTimer = () => {
    clearInterval(timerInterval);
    const openStart = root.querySelector("[data-open-start]");
    openStart.disabled = Boolean(activeTimer);
    openStart.textContent = activeTimer ? tx("计时进行中", "Timer running") : tx("开始计时", "Start");
    if (!activeTimer) {
      activeTimerElement.hidden = true;
      renderTopics(topics);
      return;
    }
    activeTimerElement.hidden = false;
    root.querySelector("[data-timer-status]").textContent = activeTimer.status === "paused" ? tx("已暂停", "Paused") : tx("正在计时", "Running");
    const topic = topics.find((item) => item.id === activeTimer.topic_id);
    root.querySelector("[data-timer-topic]").textContent = topicName(topic) || tx("当前方向", "Current direction");
    timerTaskZhInput.value = activeTimer.task_zh || activeTimer.task || "";
    timerTaskEnInput.value = activeTimer.task_en || "";
    timerToggleButton.disabled = false;
    timerToggleButton.textContent = activeTimer.status === "paused" ? tx("继续", "Resume") : tx("暂停", "Pause");
    const updateClock = () => { root.querySelector("[data-timer-elapsed]").textContent = clock(effectiveSeconds()); };
    updateClock();
    if (activeTimer.status === "running") timerInterval = setInterval(updateClock, 1000);
    renderTopics(topics);
  };

  const enableOwner = (state) => {
    ownerMode = true;
    activation.hidden = true;
    ownerPreviewToolbar.hidden = true;
    ownerToolbar.hidden = false;
    activeTimer = state.active_timer;
    if (state.topics?.length) {
      topics = state.topics.map((topic) => {
        const publicTopic = topics.find((item) => item.id === topic.id);
        return { total_seconds: 0, record_count: 0, ...publicTopic, ...topic };
      });
      if (!ownerTopics.length) ownerTopics = state.topics.map((topic) => ({ ...topic, status: "active" }));
    }
    renderActiveTimer();
    document.querySelector(".tracker-cta").hidden = true;
  };

  const enableVisitorPreview = () => {
    ownerMode = false;
    activation.hidden = true;
    ownerToolbar.hidden = true;
    ownerPreviewToolbar.hidden = false;
    activeTimerElement.hidden = true;
    clearInterval(timerInterval);
    document.querySelector(".tracker-cta").hidden = false;
    renderTopics(topics);
  };

  const persistActiveTask = () => {
    clearTimeout(taskSaveTimer);
    taskSaveQueue = taskSaveQueue.catch(() => {}).then(async () => {
      if (!activeTimer) return;
      const taskZh = timerTaskZhInput.value.trim() || null;
      const taskEn = timerTaskEnInput.value.trim() || null;
      if ((activeTimer.task_zh || activeTimer.task || null) === taskZh
        && (activeTimer.task_en || null) === taskEn) return;
      const timerId = activeTimer.id;
      try {
        const updated = await ownerRequest(`/owner/timer/${timerId}`, {
          method: "PATCH",
          body: JSON.stringify({ expected_version: activeTimer.version, task_zh: taskZh, task_en: taskEn }),
        });
        if (activeTimer?.id === timerId) activeTimer = { ...activeTimer, ...updated };
      } catch (error) {
        if (error.code === "version_conflict") await loadOwnerState();
        throw error;
      }
    });
    return taskSaveQueue;
  };

  const queueActiveTaskSave = () => {
    clearTimeout(taskSaveTimer);
    taskSaveTimer = setTimeout(() => {
      persistActiveTask().catch(() => { /* The next state action will retry or resync. */ });
    }, 700);
  };
  timerTaskZhInput.addEventListener("input", queueActiveTaskSave);
  timerTaskEnInput.addEventListener("input", queueActiveTaskSave);

  const loadOwnerState = async () => {
    const ownerRequested = new URLSearchParams(location.search).get("owner") === "1";
    try {
      const state = await ownerRequest("/owner/state");
      if (ownerRequested) enableOwner(state);
      else enableVisitorPreview();
      return true;
    } catch (error) {
      ownerToolbar.hidden = true;
      ownerPreviewToolbar.hidden = true;
      if (ownerRequested) activation.hidden = false;
      return false;
    }
  };

  root.querySelector("[data-view-visitor]").addEventListener("click", () => {
    location.href = location.pathname;
  });
  root.querySelector("[data-enter-owner]").addEventListener("click", () => {
    location.href = `${location.pathname}?owner=1`;
  });

  const startTimer = async (topicId) => {
    if (!ownerMode || activeTimer) return;
    try {
      await ownerRequest("/owner/timer/start", {
        method: "POST",
        body: JSON.stringify({
          id: crypto.randomUUID(),
          topic_id: topicId,
          visibility: "public",
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const state = await ownerRequest("/owner/state");
      enableOwner(state);
    } catch (error) {
      alert(error.code === "active_timer_exists"
        ? tx("已经有一条计时在进行。", "A timer is already running.")
        : tx("暂时无法开始计时，请重试。", "Unable to start the timer. Please try again."));
    }
  };

  const openStartDialog = () => {
    if (!ownerMode || activeTimer) return;
    const select = root.querySelector("[data-start-topic]");
    const activeTopics = ownerTopics.filter((topic) => topic.status === "active");
    if (!activeTopics.length) {
      const empty = document.createElement("option");
      empty.textContent = tx("请先在管理中创建或重新启用投入方向", "Create or reactivate a direction in Manage first");
      empty.disabled = true;
      empty.selected = true;
      select.replaceChildren(empty);
    } else {
      select.replaceChildren(...activeTopics.map((topic) => {
        const option = document.createElement("option");
        option.value = topic.id;
        option.textContent = topicName(topic);
        return option;
      }));
    }
    root.querySelector("[data-start-submit]").disabled = !activeTopics.length;
    root.querySelector("[data-start-message]").textContent = "";
    startDialog.showModal();
  };

  root.querySelector("[data-open-start]").addEventListener("click", openStartDialog);
  root.querySelector("[data-close-start]").addEventListener("click", () => startDialog.close());
  startForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = root.querySelector("[data-start-submit]");
    const message = root.querySelector("[data-start-message]");
    const topicId = new FormData(startForm).get("topic_id");
    if (!topicId) return;
    submit.disabled = true;
    message.textContent = tx("正在开始…", "Starting…");
    await startTimer(topicId);
    if (activeTimer) startDialog.close();
    else {
      message.textContent = tx("暂时无法开始计时，请重试。", "Unable to start the timer. Please try again.");
      submit.disabled = false;
    }
  });

  activationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = activationForm.querySelector("button[type=submit]");
    const message = root.querySelector("[data-activation-message]");
    submit.disabled = true;
    message.textContent = tx("正在激活…", "Activating…");
    try {
      await ownerRequest("/owner/devices/activate", {
        method: "POST",
        body: JSON.stringify({
          owner_key: new FormData(activationForm).get("owner_key"),
          label: navigator.platform || "Owner device",
        }),
      });
      message.textContent = tx("激活成功", "Activated");
      await loadOwnerState();
    } catch (_) {
      message.textContent = tx("Owner Key 不正确，请重新输入。", "The Owner Key is incorrect. Please try again.");
    } finally {
      submit.disabled = false;
    }
  });

  timerToggleButton.addEventListener("click", async () => {
    if (!activeTimer || timerToggleButton.disabled) return;
    const timerId = activeTimer.id;
    const action = activeTimer.status === "paused" ? "resume" : "pause";
    const transitionStartedAt = Date.now();
    const previousTimer = { ...activeTimer };

    if (action === "pause") {
      activeTimer = { ...activeTimer, status: "paused", updated_at_ms: transitionStartedAt };
    } else {
      activeTimer = {
        ...activeTimer,
        status: "running",
        paused_ms: Number(activeTimer.paused_ms || 0)
          + Math.max(0, transitionStartedAt - Number(activeTimer.updated_at_ms)),
        updated_at_ms: transitionStartedAt,
      };
    }
    renderActiveTimer();
    timerToggleButton.disabled = true;
    timerToggleButton.textContent = tx("正在确认…", "Confirming…");
    try {
      await persistActiveTask();
      if (!activeTimer || activeTimer.id !== timerId) return;
      const updated = await ownerRequest(`/owner/timer/${timerId}/${action}`, {
        method: "POST",
        body: JSON.stringify({ expected_version: activeTimer.version }),
      });
      if (activeTimer?.id === timerId) {
        activeTimer = { ...activeTimer, ...updated };
      }
    } catch (_) {
      activeTimer = previousTimer;
      await loadOwnerState();
      alert(tx("计时状态没有保存成功，已恢复为服务器中的状态。", "The timer change was not saved. The server state has been restored."));
    }
    finally {
      timerToggleButton.disabled = false;
      if (activeTimer) renderActiveTimer();
    }
  });

  root.querySelector("[data-timer-cancel]").addEventListener("click", async () => {
    if (!activeTimer || !confirm(tx("取消这次计时？记录会保留在已取消列表中。", "Cancel this timer? It will remain in the Cancelled list."))) return;
    try {
      await persistActiveTask();
      await ownerRequest(`/owner/timer/${activeTimer.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ expected_version: activeTimer.version }),
      });
      enableOwner(await ownerRequest("/owner/state"));
    } catch (_) { await loadOwnerState(); }
  });

  root.querySelector("[data-timer-finish]").addEventListener("click", async () => {
    if (!activeTimer) return;
    try { await persistActiveTask(); } catch (_) { await loadOwnerState(); }
    if (!activeTimer) return;
    const topic = topics.find((item) => item.id === activeTimer.topic_id);
    const select = root.querySelector("[data-finish-topic]");
    select.replaceChildren();
    const option = document.createElement("option");
    option.value = activeTimer.topic_id;
    option.textContent = topicName(topic) || tx("当前方向", "Current direction");
    select.append(option);
    finishForm.elements.task_zh.value = timerTaskZhInput.value;
    finishForm.elements.task_en.value = timerTaskEnInput.value;
    finishForm.elements.note.value = activeTimer.note || "";
    finishDialog.showModal();
  });

  root.querySelector("[data-close-dialog]").addEventListener("click", () => finishDialog.close());

  finishForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!activeTimer) return;
    if (!validateBilingualTaskForm(finishForm)) return;
    const form = new FormData(finishForm);
    const payload = {
      expected_version: activeTimer.version,
      task_zh: form.get("task_zh") || null,
      task_en: form.get("task_en") || null,
      note: form.get("note") || null,
      visibility: form.get("visibility"),
    };
    const save = finishForm.querySelector("button[type=submit]");
    const message = root.querySelector("[data-finish-message]");
    save.disabled = true;
    try {
      await ownerRequest(`/owner/timer/${activeTimer.id}/finish`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      finishDialog.close();
      enableOwner(await ownerRequest("/owner/state"));
      await loadDashboard(activeTopic);
    } catch (error) {
      if (error.code === "long_duration_confirmation_required" && confirm(tx("这次记录超过 12 小时，仍然保存吗？", "This entry is longer than 12 hours. Save it anyway?"))) {
        payload.confirm_long_duration = true;
        await ownerRequest(`/owner/timer/${activeTimer.id}/finish`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
        finishDialog.close();
        enableOwner(await ownerRequest("/owner/state"));
        await loadDashboard(activeTopic);
      } else {
        message.textContent = error.code === "bilingual_task_required"
          ? tx("公开记录请同时填写中文和英文任务，或两项都留空。", "For a public entry, complete both task fields or leave both empty.")
          : tx("保存失败，请检查后重试。", "Could not save. Check the entry and try again.");
      }
    } finally {
      save.disabled = false;
    }
  });

  const localToday = () => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  };

  const entrySeconds = () => {
    const hours = Number(entryForm.elements.hours.value || 0);
    const minutes = Number(entryForm.elements.minutes.value || 0);
    const seconds = Number(entryForm.elements.seconds.value || 0);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || !Number.isInteger(seconds)
      || hours < 0 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) return 0;
    return hours * 3600 + minutes * 60 + seconds;
  };

  const validateBilingualTaskForm = (form) => {
    const taskZh = form.elements.task_zh;
    const taskEn = form.elements.task_en;
    taskZh.setCustomValidity("");
    taskEn.setCustomValidity("");
    if (form.elements.visibility.value !== "public") return true;
    const hasZh = Boolean(taskZh.value.trim());
    const hasEn = Boolean(taskEn.value.trim());
    if (hasZh === hasEn) return true;
    const missing = hasZh ? taskEn : taskZh;
    missing.setCustomValidity(tx(
      "公开记录请同时填写中文和英文任务，或两项都留空。",
      "For a public entry, complete both task fields or leave both empty.",
    ));
    missing.reportValidity();
    return false;
  };

  [finishForm, entryForm].forEach((form) => {
    [form.elements.task_zh, form.elements.task_en].forEach((input) => {
      input.addEventListener("input", () => input.setCustomValidity(""));
    });
    form.querySelectorAll('input[name="visibility"]').forEach((input) => {
      input.addEventListener("change", () => {
        form.elements.task_zh.setCustomValidity("");
        form.elements.task_en.setCustomValidity("");
      });
    });
  });

  const fillEntryTopics = (selectedId = null, includeArchived = false) => {
    const select = root.querySelector("[data-entry-topic]");
    if (!ownerTopics.length) {
      const empty = document.createElement("option");
      empty.textContent = tx("请先在管理中创建或重新启用投入方向", "Create or reactivate a direction in Manage first");
      empty.disabled = true;
      empty.selected = true;
      select.replaceChildren(empty);
      return;
    }
    select.replaceChildren(...ownerTopics.map((topic) => {
      const option = document.createElement("option");
      option.value = topic.id;
      option.textContent = topic.status === "archived"
        ? tx(`${topic.name_zh}（已归档）`, `${topic.name_en} (Archived)`)
        : topicName(topic);
      option.disabled = topic.status === "archived" && (!includeArchived || topic.id !== selectedId);
      option.selected = topic.id === selectedId;
      return option;
    }));
  };

  const openEntryDialog = (mode, entry = null) => {
    if (!ownerMode) return;
    entryDialogMode = mode;
    editingEntry = entry;
    entryForm.reset();
    entryForm.elements.entry_date.value = entry?.entry_date || localToday();
    const seconds = Number(entry?.duration_seconds || entry?.calculated_duration_seconds || 1800);
    entryForm.elements.hours.value = Math.floor(seconds / 3600);
    entryForm.elements.minutes.value = Math.floor(seconds % 3600 / 60);
    entryForm.elements.seconds.value = seconds % 60;
    entryForm.elements.task_zh.value = entry?.task_zh || entry?.task || "";
    entryForm.elements.task_en.value = entry?.task_en || "";
    entryForm.elements.note.value = entry?.note || "";
    entryForm.elements.related_post_url.value = entry?.related_post_url || "";
    entryForm.elements.visibility.value = entry?.visibility || "public";
    fillEntryTopics(entry?.topic_id || ownerTopics.find((topic) => topic.status === "active")?.id, Boolean(entry));

    const isCreate = mode === "create";
    root.querySelector("[data-entry-eyebrow]").textContent = isCreate ? tx("补录时间", "MANUAL ENTRY") : mode === "restore" ? tx("恢复记录", "RESTORE ENTRY") : tx("编辑记录", "EDIT ENTRY");
    root.querySelector("[data-entry-title]").textContent = isCreate ? tx("新增一条记录", "Add an entry") : mode === "restore" ? tx("确认恢复内容", "Review restored entry") : tx("修改这条记录", "Edit this entry");
    root.querySelector("[data-entry-submit]").textContent = isCreate ? tx("保存记录", "Save entry") : mode === "restore" ? tx("恢复为已完成", "Restore as completed") : tx("保存修改", "Save changes");
    root.querySelector("[data-entry-delete]").hidden = isCreate;
    root.querySelector("[data-entry-submit]").disabled = !ownerTopics.some((topic) => topic.status === "active") && isCreate;
    root.querySelector("[data-entry-message]").textContent = "";
    entryDialog.showModal();
  };

  const refreshOwnerViews = async () => {
    enableOwner(await ownerRequest("/owner/state"));
    await loadDashboard(activeTopic);
    if (manageDialog.open) await loadManageEntries();
  };

  const saveEntry = async (confirmLongDuration = false) => {
    const form = new FormData(entryForm);
    const seconds = entrySeconds();
    const minimumSeconds = entryDialogMode === "create" ? 60 : 1;
    if (seconds < minimumSeconds) {
      throw new Error(entryDialogMode === "create"
        ? tx("补录时长至少为 1 分钟。", "A manual entry must be at least 1 minute.")
        : tx("时长至少为 1 秒。", "Duration must be at least 1 second."));
    }
    const common = {
      topic_id: form.get("topic_id"),
      entry_date: form.get("entry_date"),
      duration_seconds: seconds,
      task_zh: form.get("task_zh") || null,
      task_en: form.get("task_en") || null,
      note: form.get("note") || null,
      visibility: form.get("visibility"),
      related_post_url: form.get("related_post_url") || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      confirm_long_duration: confirmLongDuration,
    };
    if (entryDialogMode === "create") {
      return ownerRequest("/owner/entries", {
        method: "POST",
        body: JSON.stringify({ id: crypto.randomUUID(), ...common }),
      });
    }
    if (entryDialogMode === "restore") {
      const restored = await ownerRequest(`/owner/entries/${editingEntry.id}/restore`, {
        method: "POST",
        body: JSON.stringify({
          expected_version: editingEntry.version,
          duration_seconds: common.duration_seconds,
          task_zh: common.task_zh,
          task_en: common.task_en,
          note: common.note,
          visibility: common.visibility,
          related_post_url: common.related_post_url,
          confirm_long_duration: confirmLongDuration,
        }),
      });
      return ownerRequest(`/owner/entries/${editingEntry.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          expected_version: restored.version,
          topic_id: common.topic_id,
          entry_date: common.entry_date,
          timezone: common.timezone,
          duration_seconds: common.duration_seconds,
          confirm_long_duration: confirmLongDuration,
        }),
      });
    }
    return ownerRequest(`/owner/entries/${editingEntry.id}`, {
      method: "PATCH",
      body: JSON.stringify({ expected_version: editingEntry.version, ...common }),
    });
  };

  root.querySelector("[data-open-manual]").addEventListener("click", () => openEntryDialog("create"));
  root.querySelector("[data-manage-manual]").addEventListener("click", () => openEntryDialog("create"));
  root.querySelector("[data-close-entry]").addEventListener("click", () => entryDialog.close());

  entryForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateBilingualTaskForm(entryForm)) return;
    const save = root.querySelector("[data-entry-submit]");
    const message = root.querySelector("[data-entry-message]");
    save.disabled = true;
    message.textContent = tx("正在保存…", "Saving…");
    try {
      await saveEntry();
      entryDialog.close();
      await refreshOwnerViews();
    } catch (error) {
      if (error.code === "long_duration_confirmation_required" && confirm(tx("这条记录超过 12 小时，仍然保存吗？", "This entry is longer than 12 hours. Save it anyway?"))) {
        try {
          await saveEntry(true);
          entryDialog.close();
          await refreshOwnerViews();
        } catch (_) { message.textContent = tx("保存失败，请重新打开记录后再试。", "Could not save. Reopen the entry and try again."); }
      } else {
        if (error.message === tx("补录时长至少为 1 分钟。", "A manual entry must be at least 1 minute.") || error.message === tx("时长至少为 1 秒。", "Duration must be at least 1 second.")) {
          message.textContent = error.message;
        } else if (error.code === "bilingual_task_required") {
          message.textContent = tx("公开记录请同时填写中文和英文任务，或两项都留空。", "For a public entry, complete both task fields or leave both empty.");
        } else if (error.code === "invalid_time_range") {
          message.textContent = tx("这条记录的开始和结束时间不正确。", "The start and end time are invalid.");
        } else if (error.code === "version_conflict") {
          message.textContent = tx("这条记录已在别处更新，请关闭后重新打开。", "This entry changed elsewhere. Close it and reopen it.");
        } else {
          message.textContent = tx("保存失败，请检查填写内容。", "Could not save. Check the fields and try again.");
        }
      }
    } finally { save.disabled = false; }
  });

  root.querySelector("[data-entry-delete]").addEventListener("click", async () => {
    if (!editingEntry || !confirm(tx("永久删除这条记录？删除后无法恢复。", "Delete this entry permanently? This cannot be undone."))) return;
    try {
      await ownerRequest(`/owner/entries/${editingEntry.id}`, { method: "DELETE" });
      entryDialog.close();
      await refreshOwnerViews();
    } catch (_) { root.querySelector("[data-entry-message]").textContent = tx("删除失败，请重试。", "Could not delete. Please try again."); }
  });

  const manageEntryRow = (entry) => {
    const row = document.createElement("article");
    row.className = "manage-row";
    const detail = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = localizedTask(entry) || tx("未填写任务", "No task added");
    const meta = document.createElement("span");
    meta.textContent = `${isEnglish ? entry.topic_name_en : entry.topic_name_zh} · ${fullDateLabel(entry.entry_date)} · ${entry.visibility === "private" ? tx("仅自己", "Private") : tx("所有人", "Public")}`;
    const languageGap = taskLanguageGap(entry);
    if (languageGap) {
      meta.classList.add("is-warning");
      meta.textContent += languageGap === "en"
        ? tx(" · 缺少英文任务", " · Missing English task")
        : tx(" · 缺少中文任务", " · Missing Chinese task");
    }
    detail.append(title, meta);
    const amount = document.createElement("time");
    amount.textContent = duration(entry.duration_seconds || entry.calculated_duration_seconds);
    const actions = document.createElement("div");
    actions.className = "manage-row__actions";
    if (entry.status === "cancelled") {
      const restore = document.createElement("button");
      restore.type = "button";
      restore.textContent = tx("恢复", "Restore");
      restore.addEventListener("click", () => openEntryDialog("restore", entry));
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "is-danger";
      remove.textContent = tx("永久删除", "Delete permanently");
      remove.addEventListener("click", async () => {
        if (!confirm(tx("永久删除这条已取消记录？删除后无法恢复。", "Delete this cancelled entry permanently? This cannot be undone."))) return;
        await ownerRequest(`/owner/entries/${entry.id}`, { method: "DELETE" });
        await loadManageEntries();
      });
      actions.append(restore, remove);
    } else {
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = tx("编辑", "Edit");
      edit.addEventListener("click", () => openEntryDialog("edit", entry));
      actions.append(edit);
    }
    row.append(detail, amount, actions);
    return row;
  };

  async function loadManageEntries() {
    const list = root.querySelector("[data-manage-entry-list]");
    const message = root.querySelector("[data-manage-entry-message]");
    const status = root.querySelector("[data-entry-status]").value;
    list.replaceChildren();
    message.textContent = tx("正在读取…", "Loading…");
    try {
      const data = await ownerRequest(`/owner/entries?status=${status}&limit=50`);
      list.replaceChildren(...data.entries.map(manageEntryRow));
      const incompleteCount = data.entries.filter(taskLanguageGap).length;
      message.textContent = incompleteCount
        ? tx(`${incompleteCount} 条公开记录待补充另一种语言的任务`, `${incompleteCount} public entries need the other task language`)
        : data.entries.length
          ? (data.entries.length === 50 ? tx("当前显示最近 50 条记录", "Showing the latest 50 entries") : "")
          : tx("这里还没有记录。", "No entries here yet.");
    } catch (_) { message.textContent = tx("读取失败，请重试。", "Could not load. Please try again."); }
  }

  const resetTopicForm = () => {
    topicForm.reset();
    topicForm.elements.topic_id.value = "";
    topicForm.elements.color.value = "#6657d9";
    root.querySelector("[data-topic-form-title]").textContent = tx("新建投入方向", "New direction");
    root.querySelector("[data-topic-submit]").textContent = tx("新建方向", "New direction");
    root.querySelector("[data-cancel-topic-edit]").hidden = true;
    root.querySelector("[data-topic-message]").textContent = "";
  };

  const editTopicInForm = (topic) => {
    topicForm.elements.topic_id.value = topic.id;
    topicForm.elements.name_zh.value = topic.name_zh;
    topicForm.elements.name_en.value = topic.name_en;
    topicForm.elements.color.value = topic.color || "#6657d9";
    root.querySelector("[data-topic-form-title]").textContent = tx("编辑投入方向", "Edit direction");
    root.querySelector("[data-topic-submit]").textContent = tx("保存修改", "Save changes");
    root.querySelector("[data-cancel-topic-edit]").hidden = false;
    topicForm.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const manageTopicRow = (topic) => {
    const row = document.createElement("article");
    row.className = "manage-row topic-row";
    const swatch = document.createElement("i");
    swatch.style.backgroundColor = topic.color || "#6657d9";
    const detail = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = topicName(topic);
    const meta = document.createElement("span");
    meta.textContent = isEnglish
      ? `${topic.name_zh} · ${topic.status === "active" ? "Active" : "Archived"}`
      : `${topic.name_en} · ${topic.status === "active" ? "使用中" : "已归档"}`;
    detail.append(title, meta);
    const actions = document.createElement("div");
    actions.className = "manage-row__actions";
    if (topic.status === "active") {
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = tx("编辑", "Edit");
      edit.addEventListener("click", () => editTopicInForm(topic));
      const archive = document.createElement("button");
      archive.type = "button";
      archive.textContent = tx("归档", "Archive");
      archive.addEventListener("click", async () => {
        if (!confirm(tx(`归档“${topic.name_zh}”？历史记录会保留。`, `Archive “${topic.name_en}”? Existing entries will be kept.`))) return;
        try { await ownerRequest(`/owner/topics/${topic.id}/archive`, { method: "POST", body: "{}" }); await refreshTopics(); }
        catch (error) { alert(error.code === "active_timer_exists" ? tx("这个方向正在计时，结束或取消计时后才能归档。", "A timer is using this direction. Finish or cancel it before archiving.") : tx("归档失败，请重试。", "Could not archive. Please try again.")); }
      });
      actions.append(edit, archive);
    } else {
      const reactivate = document.createElement("button");
      reactivate.type = "button";
      reactivate.textContent = tx("重新启用", "Reactivate");
      reactivate.addEventListener("click", async () => { await ownerRequest(`/owner/topics/${topic.id}/reactivate`, { method: "POST", body: "{}" }); await refreshTopics(); });
      actions.append(reactivate);
    }
    row.append(swatch, detail, actions);
    return row;
  };

  async function refreshTopics() {
    const data = await ownerRequest("/owner/topics");
    ownerTopics = data.topics;
    root.querySelector("[data-manage-topic-list]").replaceChildren(...ownerTopics.map(manageTopicRow));
    enableOwner(await ownerRequest("/owner/state"));
    await loadDashboard(activeTopic);
  }

  root.querySelector("[data-open-manage]").addEventListener("click", async () => {
    manageDialog.showModal();
    resetTopicForm();
    try { await Promise.all([loadManageEntries(), refreshTopics()]); }
    catch (_) { root.querySelector("[data-manage-entry-message]").textContent = tx("部分内容读取失败，请重新打开管理。", "Some content could not be loaded. Reopen Manage and try again."); }
  });
  root.querySelector("[data-close-manage]").addEventListener("click", () => manageDialog.close());
  root.querySelector("[data-entry-status]").addEventListener("change", loadManageEntries);
  root.querySelector("[data-cancel-topic-edit]").addEventListener("click", resetTopicForm);

  root.querySelectorAll("[data-manage-tab]").forEach((tab) => tab.addEventListener("click", () => {
    root.querySelectorAll("[data-manage-tab]").forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
    });
    root.querySelectorAll("[data-manage-view]").forEach((view) => { view.hidden = view.dataset.manageView !== tab.dataset.manageTab; });
  }));

  const uniqueTopicSlug = (englishName, id) => {
    const base = String(englishName).normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || `direction-${id.slice(0, 8)}`;
    let slug = base;
    let suffix = 2;
    while (ownerTopics.some((topic) => topic.slug === slug)) {
      slug = `${base.slice(0, 74)}-${suffix}`;
      suffix += 1;
    }
    return slug;
  };

  topicForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(topicForm);
    const id = form.get("topic_id");
    const payload = {
      name_zh: form.get("name_zh"), name_en: form.get("name_en"), color: form.get("color"),
    };
    const message = root.querySelector("[data-topic-message]");
    const submit = root.querySelector("[data-topic-submit]");
    submit.disabled = true;
    message.textContent = tx("正在保存…", "Saving…");
    try {
      const topicId = id || crypto.randomUUID();
      const createPayload = id ? payload : {
        id: topicId,
        ...payload,
        slug: uniqueTopicSlug(payload.name_en, topicId),
        sort_order: Math.max(0, ...ownerTopics.map((topic) => Number(topic.sort_order) || 0)) + 10,
      };
      await ownerRequest(id ? `/owner/topics/${id}` : "/owner/topics", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(createPayload),
      });
      resetTopicForm();
      await refreshTopics();
    } catch (_) { message.textContent = tx("保存失败。请检查中英文名称后重试。", "Could not save. Check both names and try again."); }
    finally { submit.disabled = false; }
  });

  loadOwnerState();
})();

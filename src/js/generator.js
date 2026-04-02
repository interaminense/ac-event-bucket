// ── Constants ──────────────────────────────────────────────────────────────────

const STORAGE_KEY  = "ac_events_generator_saved";
const HISTORY_KEY  = "ac_events_generator_history";
const MAX_HISTORY  = 50;

const APP_COLORS = {
  Page:        { color: "#60a5fa" },
  Blog:        { color: "#fb923c" },
  Form:        { color: "#c084fc" },
  Document:    { color: "#facc15" },
  WebContent:  { color: "#22d3ee" },
  ObjectEntry: { color: "#fb7185" },
  Custom:      { color: "#2dd4bf" },
  CustomEvent: { color: "#a3e635" },
};

const EVENT_TEMPLATES = {
  Page: [
    { eventId: "pageLoaded",       properties: { url: "https://example.com/page", title: "My Page" } },
    { eventId: "pageViewed",       properties: { url: "https://example.com/page", title: "My Page" } },
    { eventId: "pageDepthReached", properties: { url: "https://example.com/page", title: "My Page", depth: "50" } },
    { eventId: "pageRead",         properties: { url: "https://example.com/page", title: "My Page" } },
    { eventId: "pageUnloaded",     properties: { url: "https://example.com/page", title: "My Page" } },
    { eventId: "tabFocused",       properties: { url: "https://example.com/page", title: "My Page" } },
    { eventId: "tabBlurred",       properties: { url: "https://example.com/page", title: "My Page" } },
  ],
  Blog: [
    { eventId: "blogViewed",         properties: { entryId: "12345", title: "My Blog Post" } },
    { eventId: "blogClicked",        properties: { entryId: "12345", title: "My Blog Post", tagName: "a" } },
    { eventId: "blogDepthReached",   properties: { entryId: "12345", title: "My Blog Post", depth: "50" } },
    { eventId: "blogImpressionMade", properties: { entryId: "12345", title: "My Blog Post" } },
  ],
  Form: [
    { eventId: "formViewed",    properties: { formId: "form-001", formName: "Contact Form" } },
    { eventId: "formSubmitted", properties: { formId: "form-001", formName: "Contact Form" } },
    { eventId: "fieldFocused",  properties: { formId: "form-001", formName: "Contact Form", fieldName: "email" } },
    { eventId: "fieldBlurred",  properties: { formId: "form-001", formName: "Contact Form", fieldName: "email" } },
  ],
  Document: [
    { eventId: "documentDownloaded",     properties: { fileEntryId: "67890", title: "My Document.pdf" } },
    { eventId: "documentImpressionMade", properties: { fileEntryId: "67890", title: "My Document.pdf" } },
    { eventId: "documentPreviewed",      properties: { fileEntryId: "67890", title: "My Document.pdf" } },
  ],
  WebContent: [
    { eventId: "webContentViewed",         properties: { articleId: "11111", title: "My Web Content" } },
    { eventId: "webContentClicked",        properties: { articleId: "11111", title: "My Web Content" } },
    { eventId: "webContentImpressionMade", properties: { articleId: "11111", title: "My Web Content" } },
  ],
  ObjectEntry: [
    { eventId: "objectEntryViewed",         properties: { objectDefinitionName: "MyObject", externalReferenceCode: "ERC-001" } },
    { eventId: "objectEntryDownloaded",     properties: { objectDefinitionName: "MyObject", externalReferenceCode: "ERC-001" } },
    { eventId: "objectEntryImpressionMade", properties: { objectDefinitionName: "MyObject", externalReferenceCode: "ERC-001" } },
  ],
  Custom: [
    { eventId: "assetViewed",       properties: { assetId: "custom-001", assetType: "custom", assetTitle: "My Asset" } },
    { eventId: "assetClicked",      properties: { assetId: "custom-001", assetType: "custom", assetTitle: "My Asset" } },
    { eventId: "assetDownloaded",   properties: { assetId: "custom-001", assetType: "custom", assetTitle: "My Asset" } },
    { eventId: "assetSubmitted",    properties: { assetId: "custom-001", assetType: "custom", assetTitle: "My Asset" } },
    { eventId: "assetDepthReached", properties: { assetId: "custom-001", assetType: "custom", assetTitle: "My Asset", depth: "50" } },
  ],
  CustomEvent: [
    { eventId: "assetViewed",       properties: { assetId: "custom-001", assetType: "custom", assetTitle: "My Asset" } },
    { eventId: "assetClicked",      properties: { assetId: "custom-001", assetType: "custom", assetTitle: "My Asset" } },
    { eventId: "assetDownloaded",   properties: { assetId: "custom-001", assetType: "custom", assetTitle: "My Asset" } },
    { eventId: "assetSubmitted",    properties: { assetId: "custom-001", assetType: "custom", assetTitle: "My Asset" } },
    { eventId: "assetDepthReached", properties: { assetId: "custom-001", assetType: "custom", assetTitle: "My Asset", depth: "50" } },
  ],
};

// ── DOM refs ───────────────────────────────────────────────────────────────────

const sdkStatusEl       = document.getElementById("sdk-status");
const sdkWarningEl      = document.getElementById("sdk-warning");
const eventIdEl         = document.getElementById("event-id");
const applicationIdEl   = document.getElementById("application-id");
const appColorDotEl     = document.getElementById("app-color-dot");
const propertiesListEl  = document.getElementById("properties-list");
const propsEmptyEl      = document.getElementById("props-empty");
const addPropertyBtn    = document.getElementById("add-property");
const sendBtn           = document.getElementById("send-btn");
const saveBtn           = document.getElementById("save-btn");
const clearBtn          = document.getElementById("clear-btn");
const feedbackEl        = document.getElementById("feedback");
const templatesListEl   = document.getElementById("templates-list");
const savedEventsListEl = document.getElementById("saved-events-list");
const savedEmptyEl      = document.getElementById("saved-empty");
const savedCountEl      = document.getElementById("saved-count");
const historyListEl     = document.getElementById("history-list");
const historyEmptyEl    = document.getElementById("history-empty");
const historyCountEl    = document.getElementById("history-count");

// ── State ──────────────────────────────────────────────────────────────────────

let activeTemplateRow = null;
let feedbackTimeout   = null;

// ── SDK detection ──────────────────────────────────────────────────────────────

function detectSdk() {
  chrome.devtools.inspectedWindow.eval(
    "window.Analytics && window.Analytics.version || null",
    (result) => {
      if (result) {
        sdkStatusEl.textContent = `SDK v${result}`;
      } else {
        sdkWarningEl.style.display = "flex";
        sdkStatusEl.style.display = "none";
      }
    }
  );
}

// ── Properties editor ──────────────────────────────────────────────────────────

function syncPropsEmpty() {
  const hasRows = propertiesListEl.querySelectorAll(".prop-row").length > 0;
  propsEmptyEl.style.display = hasRows ? "none" : "";
}

function createPropertyRow(key = "", value = "") {
  const row = document.createElement("div");
  row.className = "prop-row";

  const keyInput = document.createElement("input");
  keyInput.type = "text";
  keyInput.placeholder = "key";
  keyInput.value = key;

  const sep = document.createElement("span");
  sep.textContent = ":";

  const valueInput = document.createElement("input");
  valueInput.type = "text";
  valueInput.placeholder = "value";
  valueInput.value = value;

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-remove";
  removeBtn.textContent = "×";
  removeBtn.addEventListener("click", () => { row.remove(); syncPropsEmpty(); });

  row.appendChild(keyInput);
  row.appendChild(sep);
  row.appendChild(valueInput);
  row.appendChild(removeBtn);
  return row;
}

function getProperties() {
  const props = {};
  propertiesListEl.querySelectorAll(".prop-row").forEach((row) => {
    const [keyInput, valueInput] = row.querySelectorAll("input");
    const key = keyInput.value.trim();
    if (key) props[key] = valueInput.value;
  });
  return props;
}

function setProperties(props) {
  propertiesListEl.querySelectorAll(".prop-row").forEach((r) => r.remove());
  Object.entries(props).forEach(([k, v]) => propertiesListEl.appendChild(createPropertyRow(k, String(v))));
  syncPropsEmpty();
}

// ── App color dot ──────────────────────────────────────────────────────────────

function updateAppDot(appId) {
  const color = APP_COLORS[appId];
  if (color) {
    appColorDotEl.style.background = color.color;
    appColorDotEl.style.display = "block";
  } else {
    appColorDotEl.style.display = "none";
  }
}

// ── Feedback ───────────────────────────────────────────────────────────────────

function showFeedback(success, message) {
  clearTimeout(feedbackTimeout);
  feedbackEl.style.display = "block";
  feedbackEl.dataset.type = success ? "success" : "error";
  feedbackEl.textContent = message;
  feedbackTimeout = setTimeout(() => { feedbackEl.style.display = "none"; }, 3500);
}

// ── Templates sidebar ──────────────────────────────────────────────────────────

function buildTemplatesList() {
  templatesListEl.innerHTML = "";

  Object.entries(EVENT_TEMPLATES).forEach(([appId, events]) => {
    const color = APP_COLORS[appId]?.color || "#888";

    const header = document.createElement("button");
    header.className = "template-group-header";
    header.style.borderLeftColor = color;
    header.innerHTML = `
      <span class="dot" style="background:${color}"></span>
      <span class="label">${appId}</span>
      <span class="chevron">▾</span>
    `;

    const rowsContainer = document.createElement("div");
    rowsContainer.className = "template-rows";

    header.addEventListener("click", () => {
      const isOpen = rowsContainer.style.display !== "none";
      rowsContainer.style.display = isOpen ? "none" : "";
      header.querySelector(".chevron").textContent = isOpen ? "▸" : "▾";
    });

    events.forEach((tpl) => {
      const row = document.createElement("button");
      row.className = "template-row";
      row.textContent = tpl.eventId;
      row.dataset.appId = appId;
      row.dataset.eventId = tpl.eventId;

      row.addEventListener("click", () => {
        if (activeTemplateRow) {
          activeTemplateRow.removeAttribute("data-active");
          activeTemplateRow.style.borderLeftColor = "";
          activeTemplateRow.style.color = "";
        }
        row.dataset.active = "true";
        row.style.borderLeftColor = color;
        row.style.color = color;
        activeTemplateRow = row;

        eventIdEl.value = tpl.eventId;
        applicationIdEl.value = appId;
        updateAppDot(appId);
        setProperties(tpl.properties);
        feedbackEl.style.display = "none";
      });

      rowsContainer.appendChild(row);
    });

    templatesListEl.appendChild(header);
    templatesListEl.appendChild(rowsContainer);
  });
}

// ── Send ───────────────────────────────────────────────────────────────────────

function sendEvent(eventId, applicationId, properties) {
  const call = `(function() {
    try {
      if (!window.Analytics || typeof window.Analytics.send !== 'function') {
        return { ok: false, error: 'window.Analytics.send is not available' };
      }
      window.Analytics.send(
        ${JSON.stringify(eventId)},
        ${JSON.stringify(applicationId || "default")},
        ${JSON.stringify(properties)}
      );
      return { ok: true };
    } catch(e) { return { ok: false, error: e.message }; }
  })()`;

  chrome.devtools.inspectedWindow.eval(call, (result, exception) => {
    if (exception) { showFeedback(false, `Error: ${exception.value || JSON.stringify(exception)}`); return; }
    if (result?.ok) {
      showFeedback(true, `"${eventId}" sent.`);
      addToHistory(eventId, applicationId, properties);
    } else {
      showFeedback(false, `Failed: ${result?.error || "unknown"}`);
    }
  });
}

// ── Saved Events ───────────────────────────────────────────────────────────────

function getSavedEvents() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function persistSavedEvents(events) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function renderSavedEvents() {
  const events = getSavedEvents();
  savedEventsListEl.innerHTML = "";

  if (!events.length) {
    savedEmptyEl.style.display = "";
    savedCountEl.textContent = "";
    return;
  }

  savedEmptyEl.style.display = "none";
  savedCountEl.textContent = events.length;

  events.forEach((saved) => {
    const color = APP_COLORS[saved.applicationId]?.color || "#888";
    const propCount = Object.keys(saved.properties).length;

    const row = document.createElement("div");
    row.className = "saved-row";

    row.innerHTML = `
      <span class="dot" style="background:${color}"></span>
      <span class="saved-event-id">${saved.eventId}</span>
      <span class="saved-app-id">${saved.applicationId}</span>
      ${propCount ? `<span class="saved-prop-count">${propCount}p</span>` : ""}
      <div class="saved-actions">
        <button class="btn-load">load</button>
        <button class="btn-send">send</button>
        <button class="btn-delete">×</button>
      </div>
    `;

    row.querySelector(".btn-load").addEventListener("click", () => {
      eventIdEl.value = saved.eventId;
      applicationIdEl.value = saved.applicationId;
      updateAppDot(saved.applicationId);
      setProperties(saved.properties);
    });
    row.querySelector(".btn-send").addEventListener("click", () => sendEvent(saved.eventId, saved.applicationId, saved.properties));
    row.querySelector(".btn-delete").addEventListener("click", () => {
      persistSavedEvents(getSavedEvents().filter((e) => e.id !== saved.id));
      renderSavedEvents();
    });

    savedEventsListEl.appendChild(row);
  });
}

function saveEvent(eventId, applicationId, properties) {
  const events = getSavedEvents();
  if (events.find((e) => e.eventId === eventId && e.applicationId === applicationId)) {
    showFeedback(false, `"${eventId}" (${applicationId}) already saved.`);
    return;
  }
  events.unshift({ id: Date.now(), eventId, applicationId, properties });
  persistSavedEvents(events);
  renderSavedEvents();
  showFeedback(true, `"${eventId}" saved.`);
}

// ── Listeners ──────────────────────────────────────────────────────────────────

addPropertyBtn.addEventListener("click", () => {
  propertiesListEl.appendChild(createPropertyRow());
  syncPropsEmpty();
});

sendBtn.addEventListener("click", () => {
  const eventId = eventIdEl.value.trim();
  if (!eventId) { showFeedback(false, "Event ID is required."); return; }
  sendEvent(eventId, applicationIdEl.value.trim(), getProperties());
});

saveBtn.addEventListener("click", () => {
  const eventId = eventIdEl.value.trim();
  if (!eventId) { showFeedback(false, "Event ID is required."); return; }
  saveEvent(eventId, applicationIdEl.value.trim(), getProperties());
});

clearBtn.addEventListener("click", () => {
  eventIdEl.value = "";
  applicationIdEl.value = "";
  appColorDotEl.style.display = "none";
  propertiesListEl.querySelectorAll(".prop-row").forEach((r) => r.remove());
  syncPropsEmpty();
  feedbackEl.style.display = "none";
  if (activeTemplateRow) {
    activeTemplateRow.removeAttribute("data-active");
    activeTemplateRow.style.borderLeftColor = "";
    activeTemplateRow.style.color = "";
    activeTemplateRow = null;
  }
});

applicationIdEl.addEventListener("input", () => updateAppDot(applicationIdEl.value.trim()));

// ── Sent History ──────────────────────────────────────────────────────────────

function getSentHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
}

function persistSentHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function addToHistory(eventId, applicationId, properties) {
  const items = getSentHistory();
  items.unshift({ id: Date.now(), eventId, applicationId, properties, sentAt: Date.now() });
  persistSentHistory(items.slice(0, MAX_HISTORY));
  renderHistory();
}

function renderHistory() {
  const items = getSentHistory();
  historyListEl.innerHTML = "";

  if (!items.length) {
    historyEmptyEl.style.display = "";
    historyCountEl.textContent = "";
    return;
  }

  historyEmptyEl.style.display = "none";
  historyCountEl.textContent = items.length;

  items.forEach((item) => {
    const color = APP_COLORS[item.applicationId]?.color || "#888";
    const row = document.createElement("div");
    row.className = "history-row";
    row.innerHTML = `
      <span class="dot" style="background:${color}"></span>
      <div class="history-content">
        <div class="history-event-id">${item.eventId}</div>
        <div class="history-meta">
          <span class="history-app">${item.applicationId || "—"}</span>
          <span class="history-time">${formatTime(item.sentAt)}</span>
        </div>
      </div>
      <button class="btn-resend">↑ send</button>
    `;
    row.querySelector(".btn-resend").addEventListener("click", () => {
      sendEvent(item.eventId, item.applicationId, item.properties);
    });
    historyListEl.appendChild(row);
  });
}

// ── Init ───────────────────────────────────────────────────────────────────────

detectSdk();
buildTemplatesList();
renderSavedEvents();
renderHistory();
syncPropsEmpty();

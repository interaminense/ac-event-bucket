const LOCAL_STORAGE_STATUS = "ac_events_extension_status";

const statusElement     = document.getElementById("status");
const toggleBtn         = document.getElementById("toggleBtn");
const clearBtn          = document.getElementById("clearBtn");
const eventsList        = document.getElementById("events-list");
const subHeader         = document.getElementById("sub-header");
const channelIdEl       = document.getElementById("channel-id");
const dataSourceIdEl    = document.getElementById("data-source-id");
const individualEl      = document.getElementById("individual");
const analyticsVersionEl = document.getElementById("analytics-version");
const searchEl          = document.getElementById("search");

const EVENT_ID_COLORS = ["ev-0", "ev-1", "ev-2", "ev-3", "ev-4", "ev-5", "ev-6", "ev-7", "ev-8", "ev-9"];

const eventIdColorMap = new Map();

function getEventIdColor(eventId) {
  if (!eventIdColorMap.has(eventId)) {
    eventIdColorMap.set(eventId, EVENT_ID_COLORS[eventIdColorMap.size % EVENT_ID_COLORS.length]);
  }
  return eventIdColorMap.get(eventId);
}

function applySearch() {
  const term = searchEl.value.toLowerCase();
  eventsList.querySelectorAll(".event-row").forEach((row) => {
    const match = !term ||
      row.dataset.applicationId.toLowerCase().includes(term) ||
      row.dataset.eventId.toLowerCase().includes(term);
    row.classList.toggle("hidden", !match);
  });
}

searchEl.addEventListener("input", applySearch);

function convertDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  });
}

function getIndividualsMessage(emailAddressHashed) {
  return emailAddressHashed ? "Known" : "Anonymous";
}

function createBadge(text, cls) {
  const span = document.createElement("span");
  span.className = `badge ${cls}`;
  span.textContent = text;
  return span;
}

function syntaxHighlight(json) {
  return JSON.stringify(json, null, 2).replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          return `<span class="sh-key">${match}</span>`;
        }
        return `<span class="sh-str">${match}</span>`;
      }
      if (/true|false/.test(match)) {
        return `<span class="sh-bool">${match}</span>`;
      }
      if (/null/.test(match)) {
        return `<span class="sh-null">${match}</span>`;
      }
      return `<span class="sh-num">${match}</span>`;
    }
  );
}

function createEventRow(badges, payload, dateBadge = null, meta = {}) {
  const row = document.createElement("div");
  row.className = "event-row";
  row.dataset.applicationId = meta.applicationId || "";
  row.dataset.eventId = meta.eventId || "";

  const badgesDiv = document.createElement("div");
  badgesDiv.className = "event-badges-row";

  const leftBadges = document.createElement("div");
  leftBadges.className = "event-badges-left";
  badges.forEach((b) => leftBadges.appendChild(createBadge(b.text, b.cls)));
  badgesDiv.appendChild(leftBadges);

  if (dateBadge) {
    badgesDiv.appendChild(createBadge(dateBadge.text, dateBadge.cls));
  }

  const detail = document.createElement("div");
  detail.className = "event-detail hidden";

  const jsonView = document.createElement("pre");
  jsonView.className = "event-json";
  jsonView.innerHTML = syntaxHighlight(payload);

  detail.appendChild(jsonView);

  badgesDiv.addEventListener("click", () => {
    detail.classList.toggle("hidden");
  });

  row.appendChild(badgesDiv);
  row.appendChild(detail);

  return row;
}

function renderIdentityEvent(message) {
  updateSubHeader(message.data.payload);
  const badges = [
    { text: "Identity",   cls: "badge-identity" },
    { text: getIndividualsMessage(message.data.payload.emailAddressHashed), cls: "badge-individual" },
  ];
  prependRow(createEventRow(badges, { payload: message.data.payload }));
}

function renderEvents(message) {
  updateSubHeader(message.data.payload);
  const context = { ...message.data.payload };
  delete context.events;

  message.data.payload.events.forEach((event) => {
    const badges = [
      { text: event.applicationId, cls: "badge-app" },
      { text: event.eventId,       cls: getEventIdColor(event.eventId) },
      { text: getIndividualsMessage(message.data.payload.emailAddressHashed), cls: "badge-individual" },
    ];
    const dateBadge = { text: convertDate(event.eventDate), cls: "badge-date" };
    const meta = { applicationId: event.applicationId, eventId: event.eventId };
    prependRow(createEventRow(badges, { event, ...context }, dateBadge, meta));
  });
}

function createEmptyState() {
  const wrapper = document.createElement("div");
  wrapper.className = "empty-state";

  const msg = document.createElement("p");
  msg.className = "empty-msg";
  msg.textContent = "No events captured yet. Browse a site monitored by Liferay Analytics Cloud.";

  const btn = document.createElement("button");
  btn.className = "empty-reload-btn";
  btn.textContent = "Reload page";
  btn.addEventListener("click", () => chrome.devtools.inspectedWindow.reload({}));

  wrapper.appendChild(msg);
  wrapper.appendChild(btn);
  return wrapper;
}

function prependRow(row) {
  const emptyState = eventsList.querySelector(".empty-state");
  if (emptyState) emptyState.remove();
  eventsList.prepend(row);
  applySearch();
}

function updateSubHeader(payload) {
  if (subHeader.classList.contains("hidden")) {
    subHeader.classList.remove("hidden");
  }
  if (payload.channelId)    channelIdEl.textContent    = payload.channelId;
  if (payload.dataSourceId) dataSourceIdEl.textContent = payload.dataSourceId;

  const isKnown = !!payload.emailAddressHashed;
  individualEl.textContent = isKnown ? "Known" : "Anonymous";
  individualEl.className   = isKnown ? "individual-known" : "individual-anon";
}

function updateElements(status) {
  statusElement.textContent = status === "enabled" ? "on" : "off";
  statusElement.className   = status === "enabled" ? "status-on" : "status-off";
  toggleBtn.textContent     = status === "enabled" ? "Off" : "On";
}

function updateStatus() {
  chrome.storage.sync.get([LOCAL_STORAGE_STATUS], function (result) {
    const prevStatus = result[LOCAL_STORAGE_STATUS] || "enabled";
    const newStatus  = prevStatus === "enabled" ? "disabled" : "enabled";
    chrome.storage.sync.set({ [LOCAL_STORAGE_STATUS]: newStatus });
    updateElements(newStatus);
    chrome.action.setIcon({
      path: newStatus === "enabled" ? "../assets/green.png" : "../assets/red.png",
    });
  });
}

toggleBtn.addEventListener("click", updateStatus);

clearBtn.addEventListener("click", () => {
  eventsList.innerHTML = "";
  eventsList.appendChild(createEmptyState());
  subHeader.classList.add("hidden");
  searchEl.value = "";
  eventIdColorMap.clear();
});

eventsList.appendChild(createEmptyState());

chrome.storage.sync.get([LOCAL_STORAGE_STATUS], function (result) {
  updateElements(result[LOCAL_STORAGE_STATUS] || "enabled");
});

const analyticsVersionInterval = setInterval(() => {
  chrome.devtools.inspectedWindow.eval(
    "window.Analytics && window.Analytics.version || null",
    function (result, error) {
      if (error || !result) return;
      analyticsVersionEl.textContent = `Analytics SDK v${result}`;
      analyticsVersionEl.classList.add("sdk-detected");
      clearInterval(analyticsVersionInterval);
    }
  );
}, 1000);

chrome.runtime.onMessage.addListener(function (message) {
  if (message.type !== "request_report") return;

  chrome.storage.sync.get([LOCAL_STORAGE_STATUS], function (result) {
    if ((result[LOCAL_STORAGE_STATUS] || "enabled") !== "enabled") return;

    if (message.data.details.url.includes("identity")) {
      renderIdentityEvent(message);
    } else {
      renderEvents(message);
    }
  });
});

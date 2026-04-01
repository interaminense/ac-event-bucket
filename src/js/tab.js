const LOCAL_STORAGE_STATUS = "ac_events_extension_status";

const statusElement = document.getElementById("status");
const toggleBtn = document.getElementById("toggleBtn");
const clearBtn = document.getElementById("clearBtn");
const eventsList = document.getElementById("events-list");
const subHeader = document.getElementById("sub-header");
const channelIdEl = document.getElementById("channel-id");
const dataSourceIdEl = document.getElementById("data-source-id");
const analyticsVersionEl = document.getElementById("analytics-version");

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

function createBadge(text, colorClasses) {
  const span = document.createElement("span");
  span.className = `text-xs font-bold px-2 py-0.5 rounded ${colorClasses}`;
  span.textContent = text;
  return span;
}

function syntaxHighlight(json) {
  return JSON.stringify(json, null, 2).replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          return `<span class="text-blue-400">${match}</span>`;
        }
        return `<span class="text-emerald-400">${match}</span>`;
      }
      if (/true|false/.test(match)) {
        return `<span class="text-yellow-400">${match}</span>`;
      }
      if (/null/.test(match)) {
        return `<span class="text-red-400">${match}</span>`;
      }
      return `<span class="text-orange-400">${match}</span>`;
    }
  );
}


function createEventRow(badges, payload, dateBadge = null) {
  const row = document.createElement("div");
  row.className = "bg-gray-900 border border-gray-800 rounded-lg p-3 hover:border-gray-600 transition-colors";

  const badgesDiv = document.createElement("div");
  badgesDiv.className = "flex items-center justify-between gap-2";

  const leftBadges = document.createElement("div");
  leftBadges.className = "flex items-center gap-2 flex-wrap cursor-pointer";
  badges.forEach((b) => leftBadges.appendChild(createBadge(b.text, b.cls)));
  badgesDiv.appendChild(leftBadges);

  if (dateBadge) {
    badgesDiv.appendChild(createBadge(dateBadge.text, dateBadge.cls));
  }

  const detail = document.createElement("div");
  detail.className = "hidden mt-3 pt-3 border-t border-gray-800";

  const jsonView = document.createElement("pre");
  jsonView.className = "text-xs text-gray-300 whitespace-pre-wrap break-all bg-gray-950 rounded p-3";
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
    { text: "Identity", cls: "bg-emerald-900 text-emerald-300" },
    { text: getIndividualsMessage(message.data.payload.emailAddressHashed), cls: "bg-gray-800 text-gray-300" },
  ];
  prependRow(createEventRow(badges, { payload: message.data.payload }));
}

function renderEvents(message) {
  updateSubHeader(message.data.payload);
  const context = { ...message.data.payload };
  delete context.events;

  message.data.payload.events.forEach((event) => {
    const badges = [
      { text: event.applicationId, cls: "bg-gray-700 text-white" },
      { text: event.eventId, cls: "bg-blue-900 text-blue-300" },
      { text: getIndividualsMessage(message.data.payload.emailAddressHashed), cls: "bg-gray-800 text-gray-300" },
    ];
    const dateBadge = { text: convertDate(event.eventDate), cls: "bg-gray-800 text-gray-400" };
    prependRow(createEventRow(badges, { event, ...context }, dateBadge));
  });
}

function prependRow(row) {
  const emptyState = eventsList.querySelector(".empty-state");
  if (emptyState) emptyState.remove();
  eventsList.prepend(row);
}

function updateSubHeader(payload) {
  if (subHeader.classList.contains("hidden")) {
    subHeader.classList.remove("hidden");
  }
  if (payload.channelId) channelIdEl.textContent = payload.channelId;
  if (payload.dataSourceId) dataSourceIdEl.textContent = payload.dataSourceId;
}

function updateElements(status) {
  statusElement.textContent = status === "enabled" ? "on" : "off";
  if (status === "enabled") {
    statusElement.className = "text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-emerald-900 text-emerald-400";
  } else {
    statusElement.className = "text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-red-900 text-red-400";
  }
  toggleBtn.textContent = status === "enabled" ? "Off" : "On";
}

function updateStatus() {
  chrome.storage.sync.get([LOCAL_STORAGE_STATUS], function (result) {
    const prevStatus = result[LOCAL_STORAGE_STATUS] || "enabled";
    const newStatus = prevStatus === "enabled" ? "disabled" : "enabled";
    chrome.storage.sync.set({ [LOCAL_STORAGE_STATUS]: newStatus });
    updateElements(newStatus);
    chrome.action.setIcon({
      path: newStatus === "enabled" ? "../assets/green.png" : "../assets/red.png",
    });
  });
}

toggleBtn.addEventListener("click", updateStatus);

clearBtn.addEventListener("click", () => {
  eventsList.innerHTML = '<p class="empty-state text-gray-500 text-center mt-16 text-sm">No events captured yet. Browse a site monitored by Liferay Analytics Cloud.</p>';
  subHeader.classList.add("hidden");
});

chrome.storage.sync.get([LOCAL_STORAGE_STATUS], function (result) {
  updateElements(result[LOCAL_STORAGE_STATUS] || "enabled");
});

const analyticsVersionInterval = setInterval(() => {
  chrome.devtools.inspectedWindow.eval(
    "window.Analytics && window.Analytics.version || null",
    function (result, error) {
      if (error || !result) return;
      analyticsVersionEl.textContent = `Analytics SDK v${result}`;
      analyticsVersionEl.classList.replace("text-gray-500", "text-gray-400");
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

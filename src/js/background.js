chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.method !== "POST" || !details.requestBody?.raw?.[0]?.bytes) {
      return;
    }

    let payload;

    try {
      payload = JSON.parse(
        decodeURIComponent(
          String.fromCharCode.apply(
            null,
            new Uint8Array(details.requestBody.raw[0].bytes)
          )
        )
      );
    } catch {
      return;
    }

    if (!payload.channelId) {
      return;
    }

    const message = { type: "request_report", data: { details, payload } };

    if (details.tabId >= 0) {
      const key = `ac_events_${details.tabId}`;
      chrome.storage.local.get(key, (result) => {
        const events = result[key] || [];
        events.push(message);
        if (events.length > 50) events.shift();
        chrome.storage.local.set({ [key]: events });
      });
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length) {
        chrome.tabs.sendMessage(tabs[0].id, message).catch(() => {
          // Ignore: receiving end does not exist (content script not yet loaded or extension reloaded)
        });
      }
    });

    // Also broadcast to the extension tab if open
    chrome.runtime.sendMessage(message).catch(() => {});
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "loading") {
    chrome.storage.local.remove(`ac_events_${tabId}`);
    chrome.runtime.sendMessage({ type: "clear_events", tabId }).catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(`ac_events_${tabId}`);
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "enable_generator") {
    chrome.storage.sync.set({ ac_events_generator_enabled: true });
  }
});

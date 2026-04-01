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

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length) {
        chrome.tabs.sendMessage(tabs[0].id, message);
      }
    });

    // Also broadcast to the extension tab if open
    chrome.runtime.sendMessage(message).catch(() => {});
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

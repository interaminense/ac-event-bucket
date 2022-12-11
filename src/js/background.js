chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.method !== "POST" || !details.requestBody?.raw?.[0]?.bytes) {
      return;
    }

    const payload = JSON.parse(
      decodeURIComponent(
        String.fromCharCode.apply(
          null,
          new Uint8Array(details.requestBody.raw[0].bytes)
        )
      )
    );

    if (!payload.channelId) {
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs.length) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "request_report",
          data: {
            details,
            payload,
          },
        });
      }
    });
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

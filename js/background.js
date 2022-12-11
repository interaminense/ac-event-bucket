const LOCAL_STORAGE_VALUE = "ac_events_extension_value";

function getStatus() {
  const initialStatus = localStorage.getItem(LOCAL_STORAGE_VALUE);

  if (initialStatus) {
    return initialStatus;
  }

  localStorage.setItem(LOCAL_STORAGE_VALUE, "enabled");

  return "enabled";
}

chrome.webRequest.onBeforeRequest.addListener(
  function (details) {
    if (details.method !== "POST") {
      return;
    }

    const payload = JSON.parse(
      decodeURIComponent(
        String.fromCharCode.apply(
          null,
          new Uint8Array(details.requestBody.raw?.[0].bytes)
        )
      )
    );

    if (!payload.channelId) {
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: "request_report",
        data: {
          status: getStatus(),
          details,
          payload,
        },
      });
    });
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

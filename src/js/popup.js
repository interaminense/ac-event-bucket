const LOCAL_STORAGE_STATUS = "ac_events_extension_status";

const statusElement = document.getElementById("status");
const toggleBtn = document.getElementById("toggleBtn");

function updateStatus() {
  chrome.storage.sync.get([LOCAL_STORAGE_STATUS], function (result) {
    const prevStatus = result[LOCAL_STORAGE_STATUS] || "enabled";
    const newStatus = prevStatus === "enabled" ? "disabled" : "enabled";

    chrome.storage.sync.set({ [LOCAL_STORAGE_STATUS]: newStatus });

    updateElements(newStatus);
  });
}

function getBtnText(status) {
  return status === "enabled" ? "disable" : "enable";
}

function updateElements(status) {
  statusElement.innerHTML = status;
  statusElement.className = status;
  toggleBtn.innerHTML = getBtnText(status);

  chrome.action.setIcon({
    path: status === "enabled" ? "../assets/green.png" : "../assets/red.png",
  });
}

(() => {
  toggleBtn.addEventListener("click", updateStatus);

  chrome.storage.sync.get([LOCAL_STORAGE_STATUS], function (result) {
    const status = result[LOCAL_STORAGE_STATUS] || "enabled";

    updateElements(status);
  });
})();

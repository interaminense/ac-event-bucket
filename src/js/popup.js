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

function updateElements(status) {
  statusElement.textContent = status;
  if (status === "enabled") {
    statusElement.className = "text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-emerald-900 text-emerald-400";
  } else {
    statusElement.className = "text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-red-900 text-red-400";
  }
  toggleBtn.textContent = status === "enabled" ? "Disable" : "Enable";
  chrome.action.setIcon({
    path: status === "enabled" ? "../assets/green.png" : "../assets/red.png",
  });
}

(() => {
  toggleBtn.addEventListener("click", updateStatus);

  chrome.storage.sync.get([LOCAL_STORAGE_STATUS], function (result) {
    updateElements(result[LOCAL_STORAGE_STATUS] || "enabled");
  });
})();

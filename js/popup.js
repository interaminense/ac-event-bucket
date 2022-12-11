const LOCAL_STORAGE_VALUE = "ac_events_extension_value";

const statusElement = document.getElementById("status");
const toggleBtn = document.getElementById("toggleBtn");

function getStatus() {
  const statusFromStorage = localStorage.getItem(LOCAL_STORAGE_VALUE);

  if (statusFromStorage) {
    return statusFromStorage;
  }

  localStorage.setItem(LOCAL_STORAGE_VALUE, "enabled");

  return "enabled";
}

function updateStatus() {
  const status = getStatus() === "enabled" ? "disabled" : "enabled";

  localStorage.setItem(LOCAL_STORAGE_VALUE, status);

  updateElements(status);
}

function changeIcon(status) {
  chrome.browserAction.setIcon({
    path: status === "enabled" ? "../assets/green.png" : "../assets/red.png",
  });
}

function getBtnText(status) {
  return status === "enabled" ? "disable" : "enable";
}

function updateElements(status) {
  statusElement.innerHTML = status;
  statusElement.className = status;
  toggleBtn.innerHTML = getBtnText(status);

  chrome.browserAction.setIcon({
    path: status === "enabled" ? "../assets/green.png" : "../assets/red.png",
  });
}

(() => {
  const status = getStatus();

  toggleBtn.addEventListener("click", updateStatus);

  updateElements(status);
})();

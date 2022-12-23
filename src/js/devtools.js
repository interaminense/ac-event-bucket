const LOCAL_STORAGE_THEME_NAME = "ac_events_extension_theme_name";

chrome.storage.sync.set({
  [LOCAL_STORAGE_THEME_NAME]: chrome.devtools.panels.themeName,
});

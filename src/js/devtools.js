const LOCAL_STORAGE_THEME_NAME = "ac_events_extension_theme_name";

chrome.storage.sync.set({
  [LOCAL_STORAGE_THEME_NAME]: chrome.devtools.panels.themeName,
});

chrome.devtools.panels.create(
  "AC Event Bucket",
  "../assets/green.png",
  "../html/tab.html"
);

chrome.storage.sync.get("ac_events_generator_enabled", ({ ac_events_generator_enabled }) => {
  if (ac_events_generator_enabled) {
    chrome.devtools.panels.create(
      "AC Events Generator",
      "../assets/green.png",
      "../html/generator.html"
    );
  }
});

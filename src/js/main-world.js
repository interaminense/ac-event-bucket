window.acEventBucket = {
  enableEventsGenerator() {
    window.postMessage({ type: "ac_enable_generator" }, "*");
    console.log(
      "%c[AC Event Bucket] Events Generator enabled. Reopen DevTools to see the new panel.",
      "color: #8bc34a; font-weight: bold; padding: 2px 0"
    );
  },
};

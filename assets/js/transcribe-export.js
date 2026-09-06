(function (globalScope) {
  "use strict";

  function formatTimestamp(seconds, separator = ".") {
    const milliseconds = Math.max(0, Math.round(seconds * 1000));
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const secs = Math.floor((milliseconds % 60000) / 1000);
    const millis = milliseconds % 1000;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}${separator}${String(millis).padStart(3, "0")}`;
  }

  function plainText(segments) {
    return segments.map((segment) => segment.text).join("\n");
  }

  function srtText(segments) {
    return segments.map((segment, index) => [
      index + 1,
      `${formatTimestamp(segment.start, ",")} --> ${formatTimestamp(segment.end, ",")}`,
      segment.text,
      ""
    ].join("\n")).join("\n");
  }

  function outputBaseName(fileName = "transcript") {
    return fileName.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]+/g, "-") || "transcript";
  }

  const api = { formatTimestamp, plainText, srtText, outputBaseName };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else globalScope.TranscribeExport = Object.freeze(api);
})(typeof window !== "undefined" ? window : globalThis);

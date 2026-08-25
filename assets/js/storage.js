/* MenteFu / MindFu — acceso seguro a localStorage con prefijo de marca.
   Todo el progreso del usuario vive SOLO en su navegador. */
(function () {
  "use strict";
  var brand = document.body.getAttribute("data-brand") || "mentefu";
  var PREFIX = brand + ".";
  function get(key, fallback) {
    try {
      var raw = window.localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function set(key, value) {
    try { window.localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function remove(key) {
    try { window.localStorage.removeItem(PREFIX + key); } catch (e) { /* nada */ }
  }
  window.MFStore = { get: get, set: set, remove: remove, brand: brand };
})();

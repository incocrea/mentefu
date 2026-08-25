/* MenteFu / MindFu — herramientas interactivas (respuestas solo en el navegador).
   Expone MFTools.init(root) para contenido inyectado tras el gate (reader.js).
   - .tool-steps[data-tool]   pasos tipo acordeón con textarea (Pausa Fu)
   - form.quiz[data-quiz]     cuestionario de reflexión con resumen final
   Requiere storage.js (MFStore). */
(function () {
  "use strict";
  if (!window.MFStore) return;
  var ES = (document.documentElement.lang || "").indexOf("es") === 0;

  function init(root) {
  root = root || document;

  /* ---------- Pasos ---------- */
  root.querySelectorAll(".tool-steps[data-tool]").forEach(function (list) {
    var key = "tool." + list.getAttribute("data-tool");
    var saved = MFStore.get(key, { answers: {}, done: [] });
    if (!saved || typeof saved !== "object") saved = { answers: {}, done: [] };
    var steps = [].slice.call(list.querySelectorAll(".tool-step"));
    var wrap = list.parentElement;

    function setOpen(step, open) {
      step.classList.toggle("is-open", open);
      var h = step.querySelector(".tool-step__head");
      if (h) h.setAttribute("aria-expanded", open ? "true" : "false");
    }

    steps.forEach(function (step, i) {
      var head = step.querySelector(".tool-step__head");
      var area = step.querySelector("textarea");
      var next = step.querySelector("[data-step-next]");
      if (area) {
        area.value = saved.answers[i] || "";
        area.addEventListener("input", function () {
          saved.answers[i] = area.value;
          MFStore.set(key, saved);
        });
      }
      if (saved.done.indexOf(i) !== -1) step.classList.add("is-done");
      if (head) {
        head.addEventListener("click", function () { setOpen(step, !step.classList.contains("is-open")); });
      }
      if (next) {
        next.addEventListener("click", function () {
          if (saved.done.indexOf(i) === -1) saved.done.push(i);
          MFStore.set(key, saved);
          step.classList.add("is-done");
          setOpen(step, false);
          var n = steps[i + 1];
          if (n) {
            setOpen(n, true);
            var nh = n.querySelector(".tool-step__head");
            if (nh) nh.focus();
          } else {
            var end = wrap.querySelector("[data-tool-end]");
            if (end) { end.hidden = false; end.scrollIntoView({ behavior: "smooth", block: "center" }); }
          }
        });
      }
    });
    /* abrir el primer paso pendiente */
    var first = steps.filter(function (s) { return !s.classList.contains("is-done"); })[0] || steps[0];
    if (first) setOpen(first, true);

    var reset = wrap.querySelector("[data-tool-reset]");
    if (reset) {
      reset.addEventListener("click", function () {
        MFStore.remove(key);
        saved = { answers: {}, done: [] };
        steps.forEach(function (s) {
          s.classList.remove("is-done");
          setOpen(s, false);
          var a = s.querySelector("textarea"); if (a) a.value = "";
        });
        if (steps[0]) setOpen(steps[0], true);
        var end = wrap.querySelector("[data-tool-end]");
        if (end) end.hidden = true;
      });
    }
  });

  /* ---------- Cuestionario ---------- */
  root.querySelectorAll("form.quiz[data-quiz]").forEach(function (form) {
    var key = "quiz." + form.getAttribute("data-quiz");
    var saved = MFStore.get(key, {});
    if (!saved || typeof saved !== "object") saved = {};
    var fields = [].slice.call(form.querySelectorAll("textarea, input[type=text]"));
    fields.forEach(function (f) {
      if (saved[f.name]) f.value = saved[f.name];
      f.addEventListener("input", function () { saved[f.name] = f.value; MFStore.set(key, saved); });
    });
    var summary = form.querySelector(".quiz__summary");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!summary) return;
      var dl = document.createElement("dl");
      fields.forEach(function (f) {
        var label = form.querySelector('label[for="' + f.id + '"]');
        var dt = document.createElement("dt");
        dt.textContent = label ? label.textContent : f.name;
        var dd = document.createElement("dd");
        dd.textContent = f.value.trim() || (ES ? "— (sin respuesta)" : "— (no answer)");
        dl.appendChild(dt); dl.appendChild(dd);
      });
      summary.innerHTML = "";
      var h = document.createElement("h3");
      h.textContent = form.getAttribute("data-summary-title") || (ES ? "Tu resumen" : "Your summary");
      summary.appendChild(h);
      summary.appendChild(dl);
      summary.hidden = false;
      summary.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    var reset = form.querySelector("[data-quiz-reset]");
    if (reset) {
      reset.addEventListener("click", function () {
        MFStore.remove(key);
        saved = {};
        fields.forEach(function (f) { f.value = ""; });
        if (summary) { summary.hidden = true; summary.innerHTML = ""; }
        if (fields[0]) fields[0].focus();
      });
    }
  });
  }

  window.MFTools = { init: init };
  init(document);
})();

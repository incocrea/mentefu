/* MenteFu / MyselfU — cuenta, gate de contenido y sincronización (docs/04 §2 y §4).
   - Sin Supabase configurado (modo local): el contenido viene embebido en la
     página y no hay cuentas.
   - Con Supabase: exige sesión (magic link) para cargar misiones/pergaminos
     desde la tabla `content`, fusiona el progreso local con el remoto y lo sube.
   Expone window.MFAuth. Requiere sb.js y progress.js. */
(function () {
  "use strict";
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var T = ES ? { sending: "Enviando…", invalid: "Revisa el email: no parece válido.", err: "No se pudo enviar el enlace. Inténtalo de nuevo.", loading: "Abriendo la sala…", local: "Modo local: sin cuenta conectada, el progreso se guarda solo en este navegador.", synced: "Progreso sincronizado con tu cuenta.", loadErr: "No se pudo cargar el contenido. Recarga la página." }
             : { sending: "Sending…", invalid: "Check the email: it does not look valid.", err: "Could not send the link. Please try again.", loading: "Opening the room…", local: "Local mode: no account connected, progress is stored only in this browser.", synced: "Progress synced with your account.", loadErr: "Could not load the content. Reload the page." };

  var userPromise = null;
  function user() {
    if (!userPromise) userPromise = (window.SB && SB.enabled()) ? SB.getUser().catch(function () { return null; }) : Promise.resolve(null);
    return userPromise;
  }

  /* ---------- sincronización del progreso ---------- */
  var pulled = false;
  function pull() {
    if (pulled || !window.SB || !SB.enabled() || !window.MF) return Promise.resolve();
    return user().then(function (u) {
      if (!u) return;
      pulled = true;
      return SB.select("user_progress", "select=data&user_id=eq." + u.id).then(function (rows) {
        var remote = rows && rows[0] && rows[0].data;
        if (remote) MF.merge(remote);
        MF.paint();
        return push();
      }).catch(function () { /* sin red: seguimos en local */ });
    });
  }
  function push() {
    if (!window.SB || !SB.enabled() || !window.MF) return Promise.resolve();
    return user().then(function (u) {
      if (!u) return;
      return SB.upsert("user_progress", { user_id: u.id, data: MF.state(), updated_at: new Date().toISOString() }, "user_id").catch(function () { /* reintenta en el próximo cambio */ });
    });
  }
  if (window.MF) MF.sync = push;

  /* ---------- contenido gated ---------- */
  function loadContent(id, host) {
    var embedded = host && host.querySelector("script[data-content]");
    if (embedded) { try { return Promise.resolve(JSON.parse(embedded.textContent)); } catch (e) { return Promise.reject(e); } }
    if (!window.SB || !SB.enabled()) return Promise.reject(new Error("no content"));
    return SB.select("content", "select=data&id=eq." + encodeURIComponent(id)).then(function (rows) {
      if (!rows || !rows[0]) throw new Error("not found");
      return rows[0].data;
    });
  }

  function bindForm(form) {
    var input = form.querySelector("input[type=email]");
    var out = form.querySelector(".form__feedback");
    var btn = form.querySelector("button[type=submit]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (input.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { out.textContent = T.invalid; input.focus(); return; }
      out.textContent = T.sending; btn.disabled = true;
      SB.signInWithEmail(email).then(function () {
        out.textContent = out.getAttribute("data-sent-text") || "OK";
        if (window.MF) MF.track("signin_link_sent", { item: "auth" });
      }).catch(function () { out.textContent = T.err; }).then(function () { btn.disabled = false; });
    });
  }

  /* Los scripts diferidos se ejecutan en orden: entregar el contenido solo cuando
     mission.js / reader.js ya han registrado sus oyentes (tras DOMContentLoaded). */
  function whenReady(fn) {
    if (document.readyState === "complete" || document.readyState === "interactive" && window.__mfDomReady) fn();
    else document.addEventListener("DOMContentLoaded", fn, { once: true });
  }
  document.addEventListener("DOMContentLoaded", function () { window.__mfDomReady = true; }, { once: true });

  function openGate(host) {
    var id = host.getAttribute("data-content-id");
    var box = host.querySelector("[data-gate-box]");
    var body = host.querySelector("[data-gated-body]");
    function deliver() {
      body.innerHTML = '<p class="gated__loading">' + T.loading + "</p>";
      loadContent(id, host).then(function (data) {
        body.innerHTML = "";
        if (box) box.hidden = true;
        host.dispatchEvent(new CustomEvent("mf:content", { detail: data, bubbles: true }));
        if (window.MF) MF.track("open", { item: data.id, art: data.art, kind: data.kind });
      }).catch(function () { body.innerHTML = '<p class="gated__loading">' + T.loadErr + "</p>"; });
    }
    if (!window.SB || !SB.enabled()) {
      var note = document.createElement("p");
      note.className = "local-note"; note.textContent = T.local;
      host.insertBefore(note, body);
      whenReady(deliver);
      return;
    }
    user().then(function (u) {
      if (u) { pull(); whenReady(deliver); }
      else { if (box) { box.hidden = false; var f = box.querySelector("[data-auth-form]"); if (f) bindForm(f); } }
    });
  }

  document.querySelectorAll("[data-gate]").forEach(openGate);
  document.querySelectorAll("[data-auth-form]:not([data-gate-box] [data-auth-form])").forEach(bindForm);
  if (window.SB && SB.enabled()) pull();

  window.MFAuth = { user: user, pull: pull, push: push, loadContent: loadContent, bindForm: bindForm,
    signOut: function () { return SB.signOut().then(function () { userPromise = null; pulled = false; }); } };
})();

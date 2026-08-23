/* MenteFu / MyselfU — cuenta clásica (email + contraseña), gate de contenido y
   sincronización (docs/04). Registro con nombre, email, teléfono (opcional) y
   contraseña; el email confirma la cuenta. Sin Supabase configurado (modo local)
   el contenido viene embebido y no hay cuentas. Expone window.MFAuth. */
(function () {
  "use strict";
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var T = ES ? {
    loading: "Abriendo la sala…", local: "Modo local: sin cuenta conectada, el progreso se guarda solo en este navegador.",
    loadErr: "No se pudo cargar el contenido. Recarga la página.",
    tabLogin: "Entrar", tabSignup: "Crear cuenta",
    name: "Tu nombre", email: "Email", phone: "Teléfono (opcional)", pass: "Contraseña", passNew: "Contraseña (mínimo 8 caracteres)",
    login: "Entrar al dojo", signup: "Crear mi cuenta gratis", forgot: "¿Olvidaste tu contraseña?",
    working: "Un momento…", badEmail: "Revisa el email: no parece válido.", badPass: "La contraseña necesita al menos 8 caracteres.", badName: "Dinos tu nombre (aparecerá en tus certificados).",
    signupOk: "✅ Cuenta creada. Revisa tu correo y pulsa el enlace de confirmación; después vuelve aquí y entra con tu email y contraseña.",
    loginErr: "Email o contraseña incorrectos, o cuenta sin confirmar. Revisa tu correo o usa «¿Olvidaste tu contraseña?».",
    exists: "Ese email ya tiene cuenta: usa la pestaña «Entrar» o recupera la contraseña.",
    recoverOk: "Te hemos enviado un correo para restablecer la contraseña.", genericErr: "No se pudo completar. Inténtalo de nuevo en un momento.",
  } : {
    loading: "Opening the room…", local: "Local mode: no account connected, progress is stored only in this browser.",
    loadErr: "Could not load the content. Reload the page.",
    tabLogin: "Sign in", tabSignup: "Create account",
    name: "Your name", email: "Email", phone: "Phone (optional)", pass: "Password", passNew: "Password (at least 8 characters)",
    login: "Enter the dojo", signup: "Create my free account", forgot: "Forgot your password?",
    working: "One moment…", badEmail: "Check the email: it does not look valid.", badPass: "The password needs at least 8 characters.", badName: "Tell us your name (it appears on your certificates).",
    signupOk: "✅ Account created. Check your inbox and click the confirmation link; then come back and sign in with your email and password.",
    loginErr: "Wrong email or password, or unconfirmed account. Check your inbox or use “Forgot your password?”.",
    exists: "That email already has an account: use the “Sign in” tab or reset the password.",
    recoverOk: "We sent you an email to reset your password.", genericErr: "Could not complete. Please try again in a moment.",
  };

  var userPromise = null;
  function user() {
    if (!userPromise) userPromise = (window.SB && SB.enabled()) ? SB.getUser().catch(function () { return null; }) : Promise.resolve(null);
    return userPromise;
  }

  /* ---------- sincronización del progreso y perfil ---------- */
  var pulled = false;
  function pull() {
    if (pulled || !window.SB || !SB.enabled() || !window.MF) return Promise.resolve();
    return user().then(function (u) {
      if (!u) return;
      pulled = true;
      return SB.select("user_progress", "select=data&user_id=eq." + u.id).then(function (rows) {
        var remote = rows && rows[0] && rows[0].data;
        if (remote) MF.merge(remote);
        return syncProfile(u);
      }).then(function () { MF.paint(); return push(); }).catch(function () { /* sin red: seguimos en local */ });
    });
  }
  function syncProfile(u) {
    var meta = u.user_metadata || {};
    return SB.select("profiles", "select=display_name,phone&id=eq." + u.id).then(function (rows) {
      var row = rows && rows[0];
      var name = (row && row.display_name) || meta.name || "";
      if (name && window.MF && !MF.state().name) { MF.state().name = name; }
      if (!row) return SB.upsert("profiles", { id: u.id, display_name: meta.name || "", phone: meta.phone || "" }, "id");
    }).catch(function () { /* la tabla puede no tener aún la columna phone */ });
  }
  function push() {
    if (!window.SB || !SB.enabled() || !window.MF) return Promise.resolve();
    return user().then(function (u) {
      if (!u) return;
      return SB.upsert("user_progress", { user_id: u.id, data: MF.state(), updated_at: new Date().toISOString() }, "user_id").catch(function () { /* reintenta */ });
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

  /* ---------- formulario de cuenta (login / registro) ---------- */
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }

  function renderAuthUI(host, onSignedIn) {
    if (!host || host.__built) return;
    host.__built = true;
    host.innerHTML = "";
    var ui = el('<div class="auth">' +
      '<div class="auth__tabs" role="tablist">' +
      '<button class="auth__tab is-active" type="button" data-tab="login" role="tab" aria-selected="true">' + T.tabLogin + "</button>" +
      '<button class="auth__tab" type="button" data-tab="signup" role="tab" aria-selected="false">' + T.tabSignup + "</button></div>" +
      '<form class="auth__form" data-mode="login" novalidate>' +
      '<label class="visually-hidden" for="au-le">' + T.email + '</label><input id="au-le" class="input" type="email" name="email" placeholder="' + T.email.toLowerCase() + '" autocomplete="email" required>' +
      '<label class="visually-hidden" for="au-lp">' + T.pass + '</label><input id="au-lp" class="input" type="password" name="password" placeholder="' + T.pass.toLowerCase() + '" autocomplete="current-password" required>' +
      '<button class="btn btn--primary btn--block" type="submit">' + T.login + "</button>" +
      '<p class="form__note"><a href="#" data-forgot>' + T.forgot + "</a></p>" +
      '<p class="form__feedback" role="status" aria-live="polite"></p></form>' +
      '<form class="auth__form" data-mode="signup" hidden novalidate>' +
      '<label class="visually-hidden" for="au-sn">' + T.name + '</label><input id="au-sn" class="input" type="text" name="name" placeholder="' + T.name.toLowerCase() + '" autocomplete="name" maxlength="60" required>' +
      '<label class="visually-hidden" for="au-se">' + T.email + '</label><input id="au-se" class="input" type="email" name="email" placeholder="' + T.email.toLowerCase() + '" autocomplete="email" required>' +
      '<label class="visually-hidden" for="au-st">' + T.phone + '</label><input id="au-st" class="input" type="tel" name="phone" placeholder="' + T.phone.toLowerCase() + '" autocomplete="tel" maxlength="24">' +
      '<label class="visually-hidden" for="au-sp">' + T.passNew + '</label><input id="au-sp" class="input" type="password" name="password" placeholder="' + T.passNew.toLowerCase() + '" autocomplete="new-password" minlength="8" required>' +
      '<button class="btn btn--primary btn--block" type="submit">' + T.signup + "</button>" +
      '<p class="form__feedback" role="status" aria-live="polite"></p></form></div>');
    host.appendChild(ui);

    var tabs = ui.querySelectorAll(".auth__tab");
    var forms = ui.querySelectorAll(".auth__form");
    tabs.forEach(function (tb) {
      tb.addEventListener("click", function () {
        tabs.forEach(function (x) { x.classList.toggle("is-active", x === tb); x.setAttribute("aria-selected", x === tb ? "true" : "false"); });
        forms.forEach(function (f) { f.hidden = f.getAttribute("data-mode") !== tb.getAttribute("data-tab"); });
      });
    });

    var login = ui.querySelector('[data-mode="login"]');
    var signup = ui.querySelector('[data-mode="signup"]');

    function busy(form, on) { form.querySelector("button[type=submit]").disabled = on; }
    function say(form, msg) { form.querySelector(".form__feedback").textContent = msg; }
    function okEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    login.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = login.email.value.trim(), pass = login.password.value;
      if (!okEmail(email)) return say(login, T.badEmail);
      if (!pass) return say(login, T.badPass);
      busy(login, true); say(login, T.working);
      SB.signInWithPassword(email, pass).then(function () {
        userPromise = null; pulled = false;
        if (window.MF) MF.track("signin", { item: "auth" });
        say(login, "✅");
        if (onSignedIn) onSignedIn(); else window.location.reload();
      }).catch(function () { say(login, T.loginErr); }).then(function () { busy(login, false); });
    });
    login.querySelector("[data-forgot]").addEventListener("click", function (e) {
      e.preventDefault();
      var email = login.email.value.trim();
      if (!okEmail(email)) return say(login, T.badEmail);
      SB.resetPassword(email).then(function () { say(login, T.recoverOk); }).catch(function () { say(login, T.genericErr); });
    });

    signup.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = signup.name.value.trim(), email = signup.email.value.trim(), phone = signup.phone.value.trim(), pass = signup.password.value;
      if (!name) return say(signup, T.badName);
      if (!okEmail(email)) return say(signup, T.badEmail);
      if (pass.length < 8) return say(signup, T.badPass);
      busy(signup, true); say(signup, T.working);
      SB.signUp(email, pass, { name: name, phone: phone }).then(function (d) {
        if (window.MF) { MF.state().name = MF.state().name || name; MF.save(); MF.track("signup", { item: "auth" }); }
        /* si la confirmación de email está desactivada, GoTrue ya devuelve sesión */
        if (d && d.access_token) { userPromise = null; pulled = false; window.location.reload(); return; }
        say(signup, T.signupOk);
      }).catch(function (err) {
        var m = (err && err.message) || "";
        say(signup, /already|registered|exists/i.test(m) ? T.exists : (m || T.genericErr));
      }).then(function () { busy(signup, false); });
    });
  }

  /* Los scripts diferidos se ejecutan en orden: entregar el contenido cuando
     mission.js / reader.js ya registraron sus oyentes (tras DOMContentLoaded). */
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
      else if (box) { box.hidden = false; renderAuthUI(box.querySelector("[data-auth-ui]"), function () { box.hidden = true; userPromise = null; user().then(function () { pull(); deliver(); }); }); }
    });
  }

  document.querySelectorAll("[data-gate]").forEach(openGate);
  document.querySelectorAll("[data-auth-ui]:not([data-gate-box] [data-auth-ui])").forEach(function (h) { renderAuthUI(h); });
  if (window.SB && SB.enabled()) pull();

  window.MFAuth = { user: user, pull: pull, push: push, loadContent: loadContent, renderAuthUI: renderAuthUI, T: T,
    signOut: function () { return SB.signOut().then(function () { userPromise = null; pulled = false; }); } };
})();

/* MenteFu / MindFu — cuenta clásica (email + contraseña), gate de contenido y
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
    authTitle: "Tu cuenta de MenteFu",
    authText: "Entra o crea tu cuenta gratis: tu progreso, tus cinturones y tus logros te siguen a cualquier dispositivo.",
    name: "Tu nombre", email: "Email", country: "País", phone: "Teléfono (opcional)", pass: "Contraseña", passNew: "Contraseña (mínimo 8 caracteres)",
    terms: 'Acepto los <a href="{terms}" data-terms>términos y condiciones</a> y el tratamiento de mis datos para el uso de la plataforma.',
    badTerms: "Para crear la cuenta necesitas aceptar los términos y condiciones.", badCountry: "Dinos tu país.",
    termsTitle: "Términos y condiciones", termsClose: "Cerrar", termsLoading: "Abriendo…",
    termsErr: "No se pudieron cargar aquí. Ábrelos en una pestaña nueva.", termsAccept: "Entendido",
    lockedKicker: "Cinturón pendiente", lockedTitle: "Este nivel todavía está cerrado",
    lockedText: "El entrenamiento se recorre en orden: cada nivel se abre al conseguir el cinturón del anterior. Tu entrenamiento continúa donde lo dejaste.",
    lockedCta: "Volver a la sala de entrenamiento",
    login: "Entrar a entrenar", signup: "Crear mi cuenta gratis", forgot: "¿Olvidaste tu contraseña?",
    working: "Un momento…", badEmail: "Revisa el email: no parece válido.", badPass: "La contraseña necesita al menos 8 caracteres.", badName: "Dinos tu nombre (aparecerá en tus certificados).",
    signupOk: "✅ Cuenta creada. Si tu escuela pide confirmación por correo te habrá llegado un enlace: púlsalo y vuelve a entrar con tu email y contraseña. Si el enlace dice que ya no vale, no pasa nada —algunos filtros de correo lo abren antes que tú y eso ya confirma la cuenta—: entra igualmente con tu contraseña.",
    linkUsed: "Ese enlace de confirmación ya se había usado (algunos filtros de correo los abren antes que tú). Si acabas de crear la cuenta, ya está confirmada: entra aquí con tu email y contraseña.",
    linkErr: "El enlace del correo no ha funcionado. Entra con tu email y contraseña, o usa «¿Olvidaste tu contraseña?».",
    loginErr: "Email o contraseña incorrectos, o cuenta sin confirmar. Revisa tu correo o usa «¿Olvidaste tu contraseña?».",
    exists: "Ese email ya tiene cuenta: usa la pestaña «Entrar» o recupera la contraseña.",
    recoverOk: "Te hemos enviado un correo para restablecer la contraseña.", genericErr: "No se pudo completar. Inténtalo de nuevo en un momento.",
  } : {
    loading: "Opening the room…", local: "Local mode: no account connected, progress is stored only in this browser.",
    loadErr: "Could not load the content. Reload the page.",
    tabLogin: "Sign in", tabSignup: "Create account",
    authTitle: "Your MindFu account",
    authText: "Sign in or create your free account: your progress, belts and achievements follow you to any device.",
    name: "Your name", email: "Email", country: "Country", phone: "Phone (optional)", pass: "Password", passNew: "Password (at least 8 characters)",
    terms: 'I accept the <a href="{terms}" data-terms>terms and conditions</a> and the processing of my data for the use of the platform.',
    badTerms: "You need to accept the terms and conditions to create the account.", badCountry: "Tell us your country.",
    termsTitle: "Terms and conditions", termsClose: "Close", termsLoading: "Opening…",
    termsErr: "They could not be loaded here. Open them in a new tab.", termsAccept: "Got it",
    lockedKicker: "Belt pending", lockedTitle: "This level is still closed",
    lockedText: "The training is walked in order: each level opens when you earn the previous level's belt. Your training continues where you left it.",
    lockedCta: "Back to the training hall",
    login: "Start training", signup: "Create my free account", forgot: "Forgot your password?",
    working: "One moment…", badEmail: "Check the email: it does not look valid.", badPass: "The password needs at least 8 characters.", badName: "Tell us your name (it appears on your certificates).",
    signupOk: "✅ Account created. If your school requires email confirmation you will have received a link: click it and come back to sign in with your email and password. If the link says it is no longer valid, do not worry —some mail filters open it before you do, and that already confirms the account—: sign in with your password anyway.",
    linkUsed: "That confirmation link had already been used (some mail filters open them before you do). If you just created the account, it is already confirmed: sign in here with your email and password.",
    linkErr: "The link from the email did not work. Sign in with your email and password, or use “Forgot your password?”.",
    loginErr: "Wrong email or password, or unconfirmed account. Check your inbox or use “Forgot your password?”.",
    exists: "That email already has an account: use the “Sign in” tab or reset the password.",
    recoverOk: "We sent you an email to reset your password.", genericErr: "Could not complete. Please try again in a moment.",
  };

  var userPromise = null;
  function user() {
    if (!userPromise) {
      userPromise = (window.SB && SB.enabled()) ? SB.getUser().catch(function () { return null; }) : Promise.resolve(null);
      /* El estado que progress.js dedujo del navegador es una apuesta; ésta es
         la respuesta del servidor. Si la sesión caducó o se revocó, aquí se
         corrige y la cabecera y el perfil se repintan solos. */
      userPromise.then(function (u) {
        if (window.MF && MF.setSession) MF.setSession(!SB || !SB.enabled() ? "local" : (u ? "in" : "out"));
      });
    }
    return userPromise;
  }
  function olvidarUsuario() { userPromise = null; pulled = false; }

  /* ---------- sincronización del progreso y perfil ---------- */
  var pulled = false;
  /* Reinicio forzado por el admin: si profiles.reset_at es más nuevo que lo
     último que vio ESTE navegador, se vacía el estado local y se ignora el
     remoto de esta carga — el alumno queda a cero, como recién llegado. */
  function aplicarReinicio(row) {
    if (!window.MF || !row || !row.reset_at) return false;
    var visto = (MF.state().flags || {}).resetSeen || "";
    if (row.reset_at <= visto) return false;
    MF.forget();
    MF.state().flags.resetSeen = row.reset_at;
    MF.save();          /* persiste el cero y lo empuja: pisa cualquier resto */
    return true;
  }
  function pull() {
    if (pulled || !window.SB || !SB.enabled() || !window.MF) return Promise.resolve();
    return user().then(function (u) {
      if (!u) return;
      pulled = true;
      return SB.select("profiles", "select=display_name,phone,country,reset_at&id=eq." + u.id).catch(function () {
        /* la columna reset_at puede no existir aún (admin.sql sin aplicar) */
        return SB.select("profiles", "select=display_name,phone,country&id=eq." + u.id).catch(function () { return "fallo"; });
      }).then(function (prows) {
        /* «fallo» ≠ «sin fila»: si la consulta no llegó, ni tocamos el perfil
           ni evaluamos reinicios — reintentaremos en la próxima carga */
        var consultado = prows !== "fallo";
        var perfil = (consultado && prows && prows[0]) || null;
        aplicarReinicio(perfil);
        return SB.select("user_progress", "select=data&user_id=eq." + u.id).then(function (rows) {
          var remote = rows && rows[0] && rows[0].data;
          /* el remoto solo cuenta si ya «vio» el último reinicio del admin:
             un blob re-subido por una pestaña vieja se ignora (y el push de
             abajo lo pisa con el estado en cero) */
          var valido = remote && (!perfil || !perfil.reset_at
            || (((remote.flags || {}).resetSeen || "") >= perfil.reset_at));
          if (valido) MF.merge(remote);
          return syncProfile(u, perfil, consultado);
        }).then(function () { MF.paint(); return push(); });
      }).catch(function () { /* sin red: seguimos en local */ });
    });
  }
  function syncProfile(u, row, consultado) {
    var meta = u.user_metadata || {};
    var name = (row && row.display_name) || meta.name || "";
    if (name && window.MF && !MF.state().name) { MF.state().name = name; }
    /* crear el perfil SOLO si la consulta funcionó y de verdad no hay fila:
       upsertear a ciegas tras un fallo de red pisaría ediciones del admin */
    if (consultado && !row) return SB.upsert("profiles", { id: u.id, display_name: meta.name || "", phone: meta.phone || "", country: meta.country || "" }, "id").catch(function () { /* nada */ });
    return Promise.resolve();
  }
  function push() {
    if (!window.SB || !SB.enabled() || !window.MF) return Promise.resolve();
    return user().then(function (u) {
      if (!u) return;
      return SB.upsert("user_progress", { user_id: u.id, data: MF.state(), updated_at: new Date().toISOString() }, "user_id").catch(function () { /* reintenta */ });
    });
  }
  if (window.MF) MF.sync = push;

  /* ---------- contenido gated ----------
     Tercera fuente: la PÁGINA DUEÑA del contenido.

     El pergamino flotante (pergamino.js) pide contenido que NO está en la
     página donde estás —se abre desde una misión, desde la sala de pergaminos
     o desde la biblioteca—, así que llega aquí sin `host` y hasta ahora solo le
     quedaba Supabase. En modo local Supabase está apagado, la promesa se rompía
     con «no content» y el enlace acababa navegando: el pergamino sacaba al
     alumno de donde estaba. Pero el contenido SÍ existe: en modo local build.py
     lo embebe en la página de cada pieza cerrada, así que se va a buscar allí.

     Se trae con fetch, se parsea con DOMParser y solo se saca el JSON: el HTML
     traído nunca entra en el DOM vivo. Y solo de esta misma web: un href de
     otro origen se rechaza. Si algo falla, la promesa se rompe como siempre y
     el que llama navega al enlace, que es la red de seguridad de toda la vida. */
  function desdeLaPagina(id, href) {
    if (!href || !window.fetch || !window.DOMParser) return Promise.reject(new Error("no content"));
    var url;
    try { url = new URL(href, window.location.href); } catch (e) { return Promise.reject(new Error("no content")); }
    if (url.origin !== window.location.origin) return Promise.reject(new Error("otro origen"));
    return fetch(url.href, { credentials: "same-origin" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(function (txt) {
        var doc = new DOMParser().parseFromString(txt, "text/html");
        /* la caja del contenido PEDIDO, no la primera que haya: si el enlace
           apuntara a otra página, mejor romper que servir otro texto. Se busca
           recorriendo en vez de con un selector porque el id lleva dos puntos
           («es:learn-what-is-guilt») y habría que escaparlo. */
        var caja = null;
        doc.querySelectorAll("[data-content-id]").forEach(function (c) {
          if (!caja && c.getAttribute("data-content-id") === id) caja = c;
        });
        var s = caja && caja.querySelector("script[data-content]");
        if (!s) throw new Error("not found");
        return JSON.parse(s.textContent);
      });
  }

  function loadContent(id, host, href) {
    var embedded = host && host.querySelector("script[data-content]");
    if (embedded) { try { return Promise.resolve(JSON.parse(embedded.textContent)); } catch (e) { return Promise.reject(e); } }
    /* Con el gate puesto manda Supabase, exactamente como siempre: la página
       dueña no lleva nada embebido y buscar allí sería un viaje en balde. */
    if (window.SB && SB.enabled()) {
      return SB.select("content", "select=data&id=eq." + encodeURIComponent(id)).then(function (rows) {
        if (!rows || !rows[0]) throw new Error("not found");
        return rows[0].data;
      });
    }
    return desdeLaPagina(id, href);
  }

  /* ---------- Términos y condiciones: modal ----------
     Los términos solo se leen desde el registro, que es donde se aceptan; no
     cuelgan del pie ni de ninguna otra página. El texto vive en su propia
     página (fuente única y respaldo sin JavaScript: el enlace navega si esto
     falla) y aquí se trae y se muestra sin sacar al alumno del formulario. */
  var TERMS_URL = (cfg.prefix || "") + (ES ? "terminos/" : "terms/");
  var termsHTML = null;

  function abrirTerminos() {
    var previo = document.activeElement;
    var caja = el('<div class="modal" role="dialog" aria-modal="true" aria-label="' + T.termsTitle + '">' +
      '<div class="modal__panel">' +
        '<header class="modal__head"><h2 class="modal__title">' + T.termsTitle + '</h2>' +
        '<button class="modal__close" type="button" aria-label="' + T.termsClose + '">&times;</button></header>' +
        '<div class="modal__body">' + (window.MFCargador ? MFCargador(T.termsLoading) : '<p class="muted">' + T.termsLoading + "</p>") + "</div>" +
        '<footer class="modal__foot"><button class="btn btn--primary btn--sm" type="button" data-ok>' + T.termsAccept + '</button></footer>' +
      '</div></div>');
    document.body.appendChild(caja);
    document.documentElement.style.overflow = "hidden";

    function cerrar() {
      caja.remove();
      document.documentElement.style.overflow = "";
      document.removeEventListener("keydown", tecla);
      if (previo && previo.focus) previo.focus();
    }
    function tecla(e) { if (e.key === "Escape") cerrar(); }
    document.addEventListener("keydown", tecla);
    caja.addEventListener("click", function (e) { if (e.target === caja) cerrar(); });
    caja.querySelector(".modal__close").addEventListener("click", cerrar);
    caja.querySelector("[data-ok]").addEventListener("click", cerrar);
    caja.querySelector(".modal__close").focus();

    var cuerpo = caja.querySelector(".modal__body");
    function pintar(html) { cuerpo.innerHTML = html; cuerpo.scrollTop = 0; }
    if (termsHTML) return pintar(termsHTML);
    fetch(TERMS_URL, { credentials: "same-origin" })
      .then(function (r) { return r.text(); })
      .then(function (txt) {
        var doc = new DOMParser().parseFromString(txt, "text/html");
        var prosa = doc.querySelector(".prose");
        if (!prosa) throw new Error("sin cuerpo");
        /* los enlaces internos del documento saldrían del modal: se neutralizan */
        prosa.querySelectorAll("a[href]").forEach(function (a) { a.setAttribute("target", "_blank"); a.setAttribute("rel", "noopener"); });
        termsHTML = prosa.innerHTML;
        pintar(termsHTML);
      })
      .catch(function () {
        pintar('<p>' + T.termsErr + ' <a href="' + TERMS_URL + '" target="_blank" rel="noopener">' + T.termsTitle + '</a></p>');
      });
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-terms]");
    if (!a || !window.fetch || !window.DOMParser) return;   /* sin soporte, que navegue */
    e.preventDefault();
    abrirTerminos();
  });

  /* ---------- países del registro ----------
     Un desplegable con TODOS los países (ISO 3166-1), con los nombres en el
     idioma del sitio vía Intl.DisplayNames: así no mantenemos dos listas de
     ~250 nombres y el orden alfabético sale bien en cada idioma. Se guarda el
     CÓDIGO ISO, no el nombre: si guardáramos el nombre, un mismo país quedaría
     como «España» o «Spain» según el idioma en que se registró el alumno.
     Primero van Colombia, Estados Unidos y México (decisión del titular). */
  var COUNTRY_CODES = ("AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
    "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
    "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP " +
    "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ " +
    "NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW " +
    "SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ " +
    "UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW").split(" ");
  var COUNTRY_FIRST = ["CO", "US", "MX"];

  function countryField() {
    var attrs = 'id="au-sc" class="input" name="country" required';
    if (!(window.Intl && Intl.DisplayNames)) {
      /* navegador viejo: texto libre, como antes */
      return '<input ' + attrs + ' type="text" placeholder="' + T.country.toLowerCase() + '" autocomplete="country-name" maxlength="56">';
    }
    var nombres = new Intl.DisplayNames([cfg.lang || "es"], { type: "region" });
    var lista = COUNTRY_CODES.filter(function (c) { return COUNTRY_FIRST.indexOf(c) === -1; })
      .map(function (c) { var n; try { n = nombres.of(c); } catch (e) { n = c; } return { c: c, n: n || c }; })
      .sort(function (a, b) { return a.n.localeCompare(b.n, cfg.lang || "es"); });
    var out = '<select ' + attrs + ' autocomplete="country">' +
      '<option value="" disabled selected>' + T.country + '</option>' +
      COUNTRY_FIRST.map(function (c) { return '<option value="' + c + '">' + (nombres.of(c) || c) + "</option>"; }).join("") +
      '<option value="" disabled>──────────</option>' +
      lista.map(function (x) { return '<option value="' + x.c + '">' + x.n + "</option>"; }).join("") +
      "</select>";
    return out;
  }

  /* ---------- formulario de cuenta (login / registro) ---------- */
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }

  /* Al entrar, la página se relee desde arriba: el alumno venía de un
     formulario a media pantalla y aterrizaba en mitad de la nada
     (titular 2026-08-26). */
  function irArriba() {
    try { if (window.history && "scrollRestoration" in history) history.scrollRestoration = "manual"; } catch (e) { /* nada */ }
    try { window.scrollTo(0, 0); } catch (e) { /* nada */ }
  }

  /* ---------- el acceso es un modal, no una página ----------
     Entrar o registrarse ya no es un sitio al que se va: es una caja que se
     abre donde estabas, cuando hace falta (titular 2026-08-26). */
  var modalAbierto = null;
  function cerrarModal() {
    if (!modalAbierto) return;
    var m = modalAbierto;
    modalAbierto = null;
    m.caja.remove();
    document.documentElement.style.overflow = "";
    document.removeEventListener("keydown", m.tecla);
    if (m.volverA && m.volverA.focus) { try { m.volverA.focus(); } catch (e) { /* nada */ } }
  }

  /* opts: { modo: "login" | "signup", alEntrar: fn } */
  function abrirModal(opts) {
    opts = opts || {};
    if (!(window.SB && SB.enabled())) return false;   /* modo local: no hay cuentas */
    cerrarModal();
    var previo = document.activeElement;
    var caja = el('<div class="modal modal--auth" role="dialog" aria-modal="true" aria-label="' + T.tabLogin + '">' +
      '<div class="modal__panel modal__panel--auth">' +
      '<header class="modal__head"><h2 class="modal__title">' + T.authTitle + "</h2>" +
      '<button class="modal__close" type="button" aria-label="' + T.termsClose + '">&times;</button></header>' +
      '<div class="modal__body"><p class="gate__text">' + T.authText + "</p>" +
      '<div data-auth-ui></div></div></div></div>');
    function tecla(e) { if (e.key === "Escape") cerrarModal(); }
    caja.addEventListener("click", function (e) { if (e.target === caja) cerrarModal(); });
    caja.querySelector(".modal__close").addEventListener("click", cerrarModal);
    document.addEventListener("keydown", tecla);
    document.body.appendChild(caja);
    document.documentElement.style.overflow = "hidden";
    modalAbierto = { caja: caja, tecla: tecla, volverA: previo };

    renderAuthUI(caja.querySelector("[data-auth-ui]"), function () {
      cerrarModal();
      if (opts.alEntrar) opts.alEntrar();
      else { irArriba(); window.location.reload(); }
    });
    if (opts.modo === "signup") {
      var tab = caja.querySelector('[data-tab="signup"]');
      if (tab) tab.click();
    }
    var primero = caja.querySelector(".auth__form:not([hidden]) .input");
    if (primero) primero.focus(); else caja.querySelector(".modal__close").focus();
    return true;
  }

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
      '<label class="visually-hidden" for="au-sc">' + T.country + '</label>' + countryField() +
      '<label class="visually-hidden" for="au-st">' + T.phone + '</label><input id="au-st" class="input" type="tel" name="phone" placeholder="' + T.phone.toLowerCase() + '" autocomplete="tel" maxlength="24">' +
      '<label class="visually-hidden" for="au-sp">' + T.passNew + '</label><input id="au-sp" class="input" type="password" name="password" placeholder="' + T.passNew.toLowerCase() + '" autocomplete="new-password" minlength="8" required>' +
      '<label class="auth__terms"><input type="checkbox" name="terms" required> <span>' + T.terms.replace("{terms}", TERMS_URL) + "</span></label>" +
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

    /* Si venimos de un enlace de correo que ya no valía, GoTrue nos devuelve el
       motivo en el hash y hasta ahora se perdía en silencio: el alumno se
       quedaba mirando un formulario sin saber qué había fallado. */
    function contarEnlace(err) {
      if (!err) return;
      login.querySelector(".form__feedback").textContent =
        /expired|invalid|used/i.test(err.code + " " + err.message) ? T.linkUsed : T.linkErr;
    }
    contarEnlace(window.SB && SB.takeAuthError && SB.takeAuthError());
    document.addEventListener("mf:autherror", function (e) { contarEnlace(e.detail); });

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
        olvidarUsuario();
        try { sessionStorage.removeItem("mf.admin"); } catch (err) { /* nada */ }
        if (window.MF && MF.setSession) MF.setSession("in");
        if (window.MF) MF.track("signin", { item: "auth" });
        say(login, "✅");
        irArriba();
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
      var country = signup.country.value.trim();
      if (!name) return say(signup, T.badName);
      if (!okEmail(email)) return say(signup, T.badEmail);
      if (!country) return say(signup, T.badCountry);
      if (pass.length < 8) return say(signup, T.badPass);
      if (!signup.terms.checked) return say(signup, T.badTerms);
      busy(signup, true); say(signup, T.working);
      /* terms_accepted_at: constancia de la aceptación (Ley 1581/2012) */
      SB.signUp(email, pass, { name: name, phone: phone, country: country, terms_accepted_at: new Date().toISOString() }).then(function (d) {
        if (window.MF) { MF.state().name = MF.state().name || name; MF.save(); MF.track("signup", { item: "auth" }); }
        /* si la confirmación de email está desactivada, GoTrue ya devuelve sesión */
        if (d && d.access_token) { olvidarUsuario(); try { sessionStorage.removeItem("mf.admin"); } catch (err) { /* nada */ } if (MF.setSession) MF.setSession("in"); irArriba(); window.location.reload(); return; }
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

    /* Progresión en orden (decisión del titular 2026-08-25): el contenido del
       nivel N solo se abre con el cinturón N-1 en ese arte. Aplica igual con
       cuentas o en modo local: es regla del juego, no del transporte. Los
       niveles ya superados siguen abiertos (están hechos para repetirse). */
    function nivelBloqueado() {
      if (!window.MF) return false;
      var nivel = parseInt(host.getAttribute("data-level") || "", 10);
      var arte = host.getAttribute("data-art");
      if (!nivel || !arte) return false;
      return nivel > MF.beltOf(arte) + 1;
    }
    function candado() {
      if (box) box.hidden = true;
      var dojo = window.location.pathname.split("/dojo/")[0] + "/dojo/";
      body.innerHTML = '<div class="gate"><div class="gate__art" aria-hidden="true">🔒</div>' +
        '<p class="kicker">' + T.lockedKicker + '</p><h2 class="gate__title">' + T.lockedTitle + '</h2>' +
        '<p class="gate__text">' + T.lockedText + '</p>' +
        '<p><a class="btn btn--primary" href="' + dojo + '">' + T.lockedCta + "</a></p></div>";
    }

    function deliver() {
      if (nivelBloqueado()) return candado();
      /* el cargador ilustrado de la casa; el texto queda en el aria-label */
      body.innerHTML = window.MFCargador ? MFCargador(T.loading) : '<p class="gated__loading">' + T.loading + "</p>";
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
      else if (box) {
        /* La puerta explica dónde estás; el formulario vive en el modal y se
           abre desde sus botones (2026-08-26). Al entrar, la sala se sirve sin
           recargar y la vista vuelve arriba. */
        box.hidden = false;
        box.querySelectorAll("[data-auth-abrir]").forEach(function (b) {
          if (b.__auth) return;
          b.__auth = true;
          b.addEventListener("click", function (e) {
            e.preventDefault();
            abrirModal({ modo: b.getAttribute("data-auth-abrir"), alEntrar: function () {
              box.hidden = true; olvidarUsuario(); irArriba();
              user().then(function () { pull(); deliver(); });
            } });
          });
        });
      }
    });
  }

  if (window.MF && MF.setSession && !(window.SB && SB.enabled())) MF.setSession("local");
  else if (window.SB && SB.enabled()) user();   /* resuelve el estado en toda página que cargue auth.js */

  document.querySelectorAll("[data-gate]").forEach(openGate);
  if (window.SB && SB.enabled()) pull();

  /* Cualquier botón «entrar / crear cuenta» abre el modal, esté donde esté
     (puerta de sala, perfil, portada del arte). Y sin sesión, el chip de la
     cabecera y los enlaces al perfil también: no hay página de acceso. */
  document.addEventListener("click", function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    var t = e.target.closest && e.target.closest("[data-auth-abrir]");
    if (t) {
      e.preventDefault();
      if (abrirModal({ modo: t.getAttribute("data-auth-abrir") })) return;
    }
    if (!(window.SB && SB.enabled()) || (window.MF && MF.session && MF.session() === "in")) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var destino = a.getAttribute("href") || "";
    var perfil = ES ? "perfil/" : "profile/";
    if (destino.slice(-perfil.length - 0) !== perfil && destino.indexOf("/" + perfil) === -1) return;
    e.preventDefault();
    if (!abrirModal({})) window.location.href = destino;   /* sin cuentas, que navegue */
  });

  window.MFAuth = { user: user, pull: pull, push: push, loadContent: loadContent, renderAuthUI: renderAuthUI, abrirModal: abrirModal, irArriba: irArriba, T: T,
    countryCodes: COUNTRY_CODES, countryFirst: COUNTRY_FIRST,
    signOut: function () {
      /* Primero se asegura el progreso en la cuenta (por si el último push
         falló), luego se cierra y se olvida el expediente local: en un equipo
         compartido el siguiente visitante no debe ver los cinturones del
         anterior. */
      return push().catch(function () { /* sin red: el progreso ya viajó antes */ })
        .then(function () { return SB.signOut(); })
        .then(function () {
          olvidarUsuario();
          try { sessionStorage.removeItem("mf.admin"); } catch (err) { /* nada */ }
          if (window.MF && MF.forget) MF.forget();
          if (window.MF && MF.setSession) MF.setSession("out");
        });
    } };
})();

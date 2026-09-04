/* MenteFu / MindFu — cliente mínimo de Supabase sin dependencias (docs/04 §4).
   Cubre lo que el sitio usa: magic link (GoTrue), sesión con refresco,
   lectura/escritura de tablas (PostgREST) con RLS. Si MF_CONFIG no trae
   supabaseUrl, todo devuelve null y el sitio funciona en modo local. */
(function () {
  "use strict";
  var cfg = window.MF_CONFIG || {};
  var URL_ = (cfg.supabaseUrl || "").replace(/\/$/, "");
  var KEY = cfg.supabaseAnonKey || "";
  var SKEY = "sb.session";
  var session = null;

  function enabled() { return !!(URL_ && KEY); }

  function loadSession() {
    if (session) return session;
    session = window.MFStore ? MFStore.get(SKEY, null) : null;
    return session;
  }
  function saveSession(s) {
    session = s;
    if (window.MFStore) { if (s) MFStore.set(SKEY, s); else MFStore.remove(SKEY); }
  }

  function headers(auth) {
    var h = { "apikey": KEY, "Content-Type": "application/json" };
    var s = auth !== false ? loadSession() : null;
    h["Authorization"] = "Bearer " + (s && s.access_token ? s.access_token : KEY);
    return h;
  }

  function request(path, opts) {
    opts = opts || {};
    var h = headers(opts.auth);
    if (opts.headers) for (var k in opts.headers) h[k] = opts.headers[k];
    return fetch(URL_ + path, { method: opts.method || "GET", headers: h, body: opts.body ? JSON.stringify(opts.body) : undefined })
      .then(function (res) {
        if (res.status === 204) return null;
        return res.text().then(function (txt) {
          var data = null;
          try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }
          if (!res.ok) { var err = new Error((data && (data.msg || data.message || data.error_description || data.error)) || ("HTTP " + res.status)); err.status = res.status; err.data = data; throw err; }
          return data;
        });
      })
      .catch(function (err) {
        /* TOKEN CADUCADO A MITAD DE SESIÓN (defecto visto 2026-09-02): el
           refresco solo ocurría al cargar la página (getSession), así que a la
           hora de vida del access_token cualquier petición —abrir un pergamino,
           sincronizar progreso— moría con 401 y el pergamino usaba su red de
           seguridad: navegar a la página vieja, sacando al alumno de la misión.
           Ante un 401 con sesión refrescable: refrescar UNA vez y repetir la
           misma petición. `_reintento` corta el bucle, y las llamadas con
           `auth: false` (login, refresh) quedan fuera: su 401 es la respuesta,
           no un token viejo. */
        var s = loadSession();
        if (err && err.status === 401 && opts.auth !== false && !opts._reintento && s && s.refresh_token) {
          opts._reintento = true;
          return refresh().then(function (ns) { if (!ns) throw err; return request(path, opts); });
        }
        throw err;
      });
  }

  /* ---------- Auth ---------- */
  var authError = null;

  function limpiarHash() {
    try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (e) { /* nada */ }
  }

  function parseHash() {
    /* Al volver de un enlace de correo, GoTrue redirige con
       #access_token=…&refresh_token=…&expires_in=…  si todo fue bien, o con
       #error=…&error_code=…&error_description=…  si el enlace ya no vale. */
    var h = window.location.hash;
    if (!h || h.length < 2) return null;
    var p = new URLSearchParams(h.substring(1));
    if (p.get("error") || p.get("error_code")) {
      authError = { code: p.get("error_code") || p.get("error") || "", message: (p.get("error_description") || "").replace(/\+/g, " ") };
      limpiarHash();
      try { document.dispatchEvent(new CustomEvent("mf:autherror", { detail: authError })); } catch (e) { /* nada */ }
      return null;
    }
    if (!p.get("access_token")) return null;
    var s = { access_token: p.get("access_token"), refresh_token: p.get("refresh_token"), expires_at: Math.floor(Date.now() / 1000) + parseInt(p.get("expires_in") || "3600", 10) };
    saveSession(s);
    limpiarHash();
    return s;
  }

  /* El hash se lee UNA vez al cargar el script, antes de que nadie pregunte:
     así el resultado no depende de quién llegue primero (getSession, hasSession
     o el formulario), que era justo lo que hacía que el aviso se perdiera. */
  parseHash();
  /* …y otra vez si el navegador aplica el fragmento después de cargar los
     scripts (pasa en algunos paneles embebidos). */
  window.addEventListener("hashchange", parseHash);

  /* Devuelve el error del enlace una sola vez (y lo consume). Vuelve a mirar el
     hash por si el navegador lo aplicó después de cargar el script. */
  function takeAuthError() { parseHash(); var e = authError; authError = null; return e; }

  function refresh() {
    var s = loadSession();
    if (!s || !s.refresh_token) return Promise.resolve(null);
    return request("/auth/v1/token?grant_type=refresh_token", { method: "POST", auth: false, body: { refresh_token: s.refresh_token } })
      .then(function (d) {
        var ns = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (d.expires_in || 3600), user: d.user };
        saveSession(ns);
        return ns;
      })
      .catch(function () { saveSession(null); return null; });
  }

  function getSession() {
    if (!enabled()) return Promise.resolve(null);
    parseHash();
    var s = loadSession();
    if (!s) return Promise.resolve(null);
    if (s.expires_at && s.expires_at - 60 < Date.now() / 1000) return refresh();
    return Promise.resolve(s);
  }

  /* ¿Hay sesión guardada? Respuesta SÍNCRONA y sin red, para que la cabecera
     pueda decir «con cuenta» o «sin cuenta» en el primer pintado y no parpadee.
     Vale con el refresh_token: aunque el access_token haya caducado, getSession()
     lo renovará; si el refresco falla, la sesión se borra y el estado se corrige. */
  function hasSession() {
    if (!enabled()) return false;
    if (!loadSession()) parseHash();
    var s = loadSession();
    return !!(s && (s.access_token || s.refresh_token));
  }

  function getUser() {
    return getSession().then(function (s) {
      if (!s) return null;
      if (s.user) return s.user;
      return request("/auth/v1/user").then(function (u) { s.user = u; saveSession(s); return u; }).catch(function () { return null; });
    });
  }

  function signUp(email, password, data) {
    var redirect = window.location.href.split("#")[0];
    return request("/auth/v1/signup?redirect_to=" + encodeURIComponent(redirect), { method: "POST", auth: false, body: { email: email, password: password, data: data || {} } });
  }

  function signInWithPassword(email, password) {
    return request("/auth/v1/token?grant_type=password", { method: "POST", auth: false, body: { email: email, password: password } })
      .then(function (d) {
        var s = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (d.expires_in || 3600), user: d.user };
        saveSession(s);
        return s;
      });
  }

  function resetPassword(email) {
    var redirect = window.location.href.split("#")[0];
    return request("/auth/v1/recover?redirect_to=" + encodeURIComponent(redirect), { method: "POST", auth: false, body: { email: email } });
  }

  function updateUser(attrs) {
    return request("/auth/v1/user", { method: "PUT", body: attrs }).then(function (u) {
      if (session) { session.user = u; saveSession(session); }
      return u;
    });
  }

  function signOut() {
    var s = loadSession();
    saveSession(null);
    if (!s) return Promise.resolve();
    return request("/auth/v1/logout", { method: "POST" }).catch(function () { /* nada */ });
  }

  /* ---------- Datos (PostgREST) ---------- */
  function select(table, query) {
    return request("/rest/v1/" + table + (query ? "?" + query : ""));
  }
  function upsert(table, row, onConflict) {
    return request("/rest/v1/" + table + (onConflict ? "?on_conflict=" + onConflict : ""), { method: "POST", body: row, headers: { "Prefer": "resolution=merge-duplicates,return=minimal" } });
  }
  function insert(table, rows) {
    return request("/rest/v1/" + table, { method: "POST", body: rows, headers: { "Prefer": "return=minimal" } });
  }
  function rpc(fn, args) {
    return request("/rest/v1/rpc/" + fn, { method: "POST", body: args || {} });
  }

  /* Una Edge Function del proyecto (docs/12 §3). Va por el mismo canal que las
     RPC —mismo JWT, mismos encabezados— pero contra /functions/v1. El
     asistente de IA vive ahí porque la clave de Anthropic es un secreto del
     proyecto y jamás puede viajar al navegador. Tiempo generoso: una
     generación de nivel puede tardar más de un minuto. */
  function fn(nombre, body, ms) {
    var control = typeof AbortController !== "undefined" ? new AbortController() : null;
    var corte = control ? setTimeout(function () { control.abort(); }, ms || 150000) : null;
    var h = headers(true);
    return fetch(URL_ + "/functions/v1/" + nombre, {
      method: "POST", headers: h, body: JSON.stringify(body || {}),
      signal: control ? control.signal : undefined,
    }).then(function (res) {
      if (corte) clearTimeout(corte);
      return res.text().then(function (texto) {
        var datos = null;
        try { datos = texto ? JSON.parse(texto) : null; } catch (e) { datos = null; }
        if (!res.ok) {
          var msg = (datos && (datos.error || datos.message)) || ("fn-" + res.status);
          throw new Error(msg);
        }
        return datos;
      });
    }, function (err) {
      if (corte) clearTimeout(corte);
      throw new Error(err && err.name === "AbortError" ? "tiempo-agotado" : String(err && err.message || err));
    });
  }

  window.SB = { enabled: enabled, getSession: getSession, hasSession: hasSession, takeAuthError: takeAuthError, getUser: getUser, signUp: signUp, signInWithPassword: signInWithPassword, resetPassword: resetPassword, updateUser: updateUser, signOut: signOut, select: select, upsert: upsert, insert: insert, rpc: rpc, fn: fn };
})();

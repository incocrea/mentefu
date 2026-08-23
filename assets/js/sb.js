/* MenteFu / MyselfU — cliente mínimo de Supabase sin dependencias (docs/04 §4).
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
      });
  }

  /* ---------- Auth ---------- */
  function parseHash() {
    /* Tras el magic link, GoTrue redirige con #access_token=…&refresh_token=…&expires_in=… */
    var h = window.location.hash;
    if (!h || h.indexOf("access_token=") === -1) return null;
    var p = new URLSearchParams(h.substring(1));
    var s = { access_token: p.get("access_token"), refresh_token: p.get("refresh_token"), expires_at: Math.floor(Date.now() / 1000) + parseInt(p.get("expires_in") || "3600", 10) };
    saveSession(s);
    try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (e) { /* nada */ }
    return s;
  }

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

  window.SB = { enabled: enabled, getSession: getSession, getUser: getUser, signUp: signUp, signInWithPassword: signInWithPassword, resetPassword: resetPassword, updateUser: updateUser, signOut: signOut, select: select, upsert: upsert, insert: insert };
})();

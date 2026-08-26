/* MenteFu / MindFu — motor de progreso y gamificación (docs/04).
   Estado offline-first en localStorage (MFStore "progress"); con sesión de
   Supabase se fusiona y sincroniza (auth.js). Expone window.MF.
   Requiere storage.js y sb.js (MF_CONFIG lo inyecta el generador). */
(function () {
  "use strict";
  if (!window.MFStore) return;
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var XP = cfg.xp || { mission: 20, quiz_first_try: 5, practice: 10, scroll: 10, exam: 50, tool: 15, exam_pass: 0.75 };
  var RANKS = cfg.ranks || [[0, "Novato"]];
  var BELTS = cfg.belts || [];
  var ACH_XP = 10;

  var T = ES ? {
    noBelt: "Sin cinturón todavía", belt: "Cinturón", xpGained: "+{n} XP", missionDone: "Misión completada",
    achievement: "Logro desbloqueado", beltAwarded: "¡Nuevo cinturón!", streak: "{n} días de racha", streak1: "1 día de racha",
    levelsDone: "Cinturones: {k}/8", nextLevel: "Siguiente: nivel {n}", allDone: "Cinturón negro conseguido. Sigue entrenando.",
    examLocked: "Completa todas las misiones del nivel para desbloquear el examen.",
    levelLocked: "El entrenamiento se recorre en orden: consigue el cinturón anterior para abrir este nivel.",
    continueBelt: "Continuar al cinturón {b}", keepTraining: "Sigue entrenando", resumeBtn: "Continuar",
    rankUp: "¡Subes de rango!", toRank: "{n} XP para {rank}", maxRank: "Rango máximo",
    noAccount: "Sin cuenta", signIn: "Entra o crea tu cuenta para empezar a sumar XP", checking: "Comprobando tu sesión…",
  } : {
    noBelt: "No belt yet", belt: "Belt", xpGained: "+{n} XP", missionDone: "Mission completed",
    achievement: "Achievement unlocked", beltAwarded: "New belt!", streak: "{n}-day streak", streak1: "1-day streak",
    levelsDone: "Belts: {k}/8", nextLevel: "Next: level {n}", allDone: "Black belt earned. Keep training.",
    examLocked: "Complete every mission in the level to unlock the exam.",
    levelLocked: "The training is walked in order: earn the previous belt to open this level.",
    continueBelt: "Continue to the {b} belt", keepTraining: "Keep training", resumeBtn: "Continue",
    rankUp: "Rank up!", toRank: "{n} XP to {rank}", maxRank: "Top rank",
    noAccount: "No account", signIn: "Sign in or create your account to start earning XP", checking: "Checking your session…",
  };

  /* ---------- Logros ---------- */
  var ACHIEVEMENTS = [
    { key: "first-mission", icon: "🎯", es: ["Primera misión", "Completaste tu primera misión."], en: ["First mission", "You completed your first mission."], test: function (s) { return countItems(s, "missions") >= 1; } },
    { key: "missions-10", icon: "⚡", es: ["Diez misiones", "Diez misiones completadas."], en: ["Ten missions", "Ten missions completed."], test: function (s) { return countItems(s, "missions") >= 10; } },
    { key: "first-scroll", icon: "📜", es: ["Primer pergamino", "Leíste un pergamino hasta el final."], en: ["First scroll", "You read a scroll to the end."], test: function (s) { return countItems(s, "scrolls") >= 1; } },
    { key: "first-tool", icon: "🧰", es: ["Primera herramienta", "Usaste una herramienta de entrenamiento."], en: ["First tool", "You used a training tool."], test: function (s) { return countItems(s, "tools") >= 1; } },
    { key: "belt-white", icon: "🥋", es: ["Cinturón blanco", "Tu primer cinturón: la guardia está en pie."], en: ["White belt", "Your first belt: the guard is up."], test: function (s) { return hasBelt(s, 1); } },
    { key: "belt-yellow", icon: "🟡", es: ["Cinturón amarillo", "Segundo nivel superado: ya oyes lo que antes pasaba de largo."], en: ["Yellow belt", "Second level cleared: you now hear what used to slip by."], test: function (s) { return hasBelt(s, 2); } },
    { key: "belt-green", icon: "🟢", es: ["Cinturón verde", "Mitad del camino: los patrones ya no te pillan por sorpresa."], en: ["Green belt", "Halfway up: the patterns no longer catch you off guard."], test: function (s) { return hasBelt(s, 4); } },
    { key: "belt-black", icon: "🏴", es: ["Cinturón negro", "El método entero de un arte es tuyo. Sigue entrenando."], en: ["Black belt", "A whole art’s method is yours. Keep training."], test: function (s) { return hasBelt(s, 8); } },
    { key: "perfect-exam", icon: "💯", es: ["Examen perfecto", "Un examen sin un solo fallo."], en: ["Perfect exam", "An exam without a single miss."], test: function (s) { return anyExam(s, function (e) { return e.score >= 1; }); } },
    { key: "streak-3", icon: "🔥", es: ["Tres días seguidos", "Entrenaste tres días seguidos."], en: ["Three days straight", "You trained three days in a row."], test: function (s) { return s.streak.days >= 3; } },
    { key: "streak-7", icon: "🌋", es: ["Una semana de racha", "Siete días seguidos entrenando."], en: ["One-week streak", "Seven days in a row training."], test: function (s) { return s.streak.days >= 7; } },
    { key: "early-bird", icon: "🌅", es: ["Madrugador", "Completaste una misión antes de las 8."], en: ["Early bird", "You completed a mission before 8 am."], test: function (s) { return !!s.flags.early; } },
    { key: "night-owl", icon: "🦉", es: ["Noctámbulo", "Completaste una misión después de las 23."], en: ["Night owl", "You completed a mission after 11 pm."], test: function (s) { return !!s.flags.late; } },
  ];

  /* ---------- Estado ---------- */
  function fresh() { return { v: 1, arts: {}, achievements: {}, streak: { days: 0, last: "" }, reflections: {}, flags: {}, last: {}, tree: { p: [] }, name: "", avatar: "", updated: "" }; }
  var state = MFStore.get("progress", null);
  if (!state || state.v !== 1) state = fresh();
  ["arts", "achievements", "reflections", "flags", "last"].forEach(function (k) { if (!state[k]) state[k] = {}; });
  if (!state.streak) state.streak = { days: 0, last: "" };
  if (!state.tree || !state.tree.p) state.tree = { p: [] };

  function art(key) {
    key = key || "_";
    if (!state.arts[key]) state.arts[key] = { missions: {}, exams: {}, belts: {}, scrolls: {}, tools: {} };
    var a = state.arts[key];
    ["missions", "exams", "belts", "scrolls", "tools"].forEach(function (k) { if (!a[k]) a[k] = {}; });
    return a;
  }
  function countItems(s, kind) {
    var n = 0;
    for (var k in s.arts) { n += Object.keys(s.arts[k][kind] || {}).length; }
    return n;
  }
  function hasBelt(s, n) { for (var k in s.arts) if (s.arts[k].belts && s.arts[k].belts[n]) return true; return false; }
  function anyExam(s, fn) { for (var k in s.arts) for (var l in (s.arts[k].exams || {})) if (fn(s.arts[k].exams[l])) return true; return false; }

  function totalXP(s) {
    s = s || state;
    var xp = 0;
    for (var k in s.arts) {
      var a = s.arts[k];
      ["missions", "exams", "scrolls", "tools"].forEach(function (kind) { for (var id in (a[kind] || {})) xp += (a[kind][id].xp || 0); });
    }
    xp += Object.keys(s.achievements || {}).length * ACH_XP;
    return xp;
  }
  function artXP(key) {
    var a = art(key), xp = 0;
    ["missions", "exams", "scrolls", "tools"].forEach(function (kind) { for (var id in a[kind]) xp += (a[kind][id].xp || 0); });
    return xp;
  }
  function rank(xp) {
    xp = xp == null ? totalXP() : xp;
    var cur = RANKS[0], next = null;
    for (var i = 0; i < RANKS.length; i++) { if (xp >= RANKS[i][0]) cur = RANKS[i]; else { next = RANKS[i]; break; } }
    var pct = next ? Math.round(((xp - cur[0]) / (next[0] - cur[0])) * 100) : 100;
    return { name: cur[1], min: cur[0], next: next ? next[1] : null, nextAt: next ? next[0] : null, pct: pct };
  }
  function beltOf(key) {
    var a = art(key), best = 0;
    for (var n in a.belts) best = Math.max(best, parseInt(n, 10));
    return best;
  }
  function beltInfo(n) { return BELTS[n - 1] || null; }
  function topBelt() {
    var best = 0;
    for (var k in state.arts) best = Math.max(best, beltOf(k));
    return best;
  }
  function today() { return new Date().toISOString().slice(0, 10); }
  function now() { return new Date().toISOString(); }

  var listeners = [];
  var syncTimer = null;
  function save() {
    state.updated = now();
    MFStore.set("progress", state);
    listeners.forEach(function (fn) { try { fn(state); } catch (e) { /* nada */ } });
    clearTimeout(syncTimer);
    syncTimer = setTimeout(function () { if (window.MF.sync) window.MF.sync(); }, 1500);
  }

  /* ---------- Racha y logros ---------- */
  function bumpStreak() {
    var t = today();
    if (state.streak.last === t) return;
    var y = new Date(); y.setDate(y.getDate() - 1);
    state.streak.days = state.streak.last === y.toISOString().slice(0, 10) ? state.streak.days + 1 : 1;
    state.streak.last = t;
  }
  function checkAchievements() {
    var unlocked = [];
    ACHIEVEMENTS.forEach(function (a) {
      if (!state.achievements[a.key] && a.test(state)) { state.achievements[a.key] = now(); unlocked.push(a); }
    });
    return unlocked;
  }
  function markHour() {
    var h = new Date().getHours();
    if (h < 8) state.flags.early = true;
    if (h >= 23) state.flags.late = true;
  }

  /* ---------- Acciones ---------- */
  function afterAward(xpGained, title, unlockedExtra) {
    var before = rank(totalXP() - xpGained).name;
    var unlocked = checkAchievements().concat(unlockedExtra || []);
    save();
    if (xpGained) toast("xp", T.xpGained.replace("{n}", xpGained), title, "⚡");
    unlocked.forEach(function (a) { if (a.key) toast("achievement", T.achievement, (ES ? a.es : a.en)[0], a.icon); });
    var after = rank().name;
    if (after !== before) toast("achievement", T.rankUp, after, "🏅");
    paint();
    return unlocked;
  }

  function completeMission(artKey, id, earned, level) {
    var a = art(artKey);
    var first = !a.missions[id];
    var rec = a.missions[id] || { at: now(), xp: 0 };
    rec.xp = Math.max(rec.xp || 0, earned);
    rec.at = rec.at || now();
    rec.level = level;
    a.missions[id] = rec;
    bumpStreak(); markHour();
    track("mission_complete", { art: artKey, item: id, xp: earned, first: first });
    var gained = first ? earned : 0;
    return afterAward(gained, T.missionDone);
  }

  function completeExam(artKey, level, score, xpBase) {
    var a = art(artKey);
    var passed = score >= (XP.exam_pass || 0.75);
    var prev = a.exams[level];
    var gained = 0;
    a.exams[level] = { at: now(), score: Math.max(score, prev ? prev.score : 0), xp: passed ? (xpBase || XP.exam) : (prev ? prev.xp : 0), passed: passed || (prev && prev.passed) };
    var newBelt = false;
    if (passed && !a.belts[level]) { a.belts[level] = now(); newBelt = true; gained = xpBase || XP.exam; }
    bumpStreak(); markHour();
    track("exam", { art: artKey, item: "level-" + level, score: score, passed: passed });
    var extra = [];
    var unlocked = afterAward(gained, ES ? "Examen aprobado" : "Exam passed");
    if (newBelt) {
      var b = beltInfo(level);
      toast("belt", T.beltAwarded, (ES ? "Cinturón " : "") + (b ? b.name : level) + (ES ? "" : " belt"), "🥋");
      confetti();
    }
    return { passed: passed, newBelt: newBelt, unlocked: unlocked, belt: beltInfo(level) };
  }

  function scrollRead(artKey, id, xp, label) {
    var a = art(artKey);
    if (a.scrolls[id]) return [];
    a.scrolls[id] = { at: now(), xp: xp || XP.scroll };
    bumpStreak();
    track("scroll_read", { art: artKey, item: id, xp: xp || XP.scroll });
    /* label: «Pergamino escuchado» cuando se completa en audio (mission.js) */
    return afterAward(xp || XP.scroll, label || (ES ? "Pergamino leído" : "Scroll read"));
  }

  function toolUsed(artKey, id, xp, label) {
    var a = art(artKey);
    if (a.tools[id]) return [];
    a.tools[id] = { at: now(), xp: xp || XP.tool };
    bumpStreak();
    track("tool_used", { art: artKey, item: id, xp: xp || XP.tool });
    return afterAward(xp || XP.tool, label || (ES ? "Herramienta usada" : "Tool used"));
  }

  function reflect(key, text) { state.reflections[key] = text; save(); }
  function remember(artKey, url) { state.last[artKey || "_"] = url; MFStore.set("progress", state); }

  /* ---------- Eventos (medición de exploración) ---------- */
  function track(event, data) {
    var row = { event: event, art: (data && data.art) || cfg.page && cfg.page.art || null, item: (data && data.item) || (cfg.page && cfg.page.id) || null, lang: cfg.lang, data: data || {}, at: now() };
    var q = MFStore.get("events.queue", []);
    q.push(row);
    if (q.length > 200) q = q.slice(-200);
    MFStore.set("events.queue", q);
    flushEvents();
  }
  var flushing = false;
  function flushEvents() {
    if (flushing || !window.SB || !SB.enabled()) return;
    SB.getSession().then(function (s) {
      if (!s) return;
      var q = MFStore.get("events.queue", []);
      if (!q.length) return;
      flushing = true;
      var rows = q.map(function (r) { return { event: r.event, art: r.art, item: r.item, lang: r.lang, data: r.data, created_at: r.at }; });
      return SB.insert("events", rows).then(function () { MFStore.set("events.queue", []); }).catch(function () { /* reintenta luego */ }).then(function () { flushing = false; });
    });
  }

  /* ---------- Visor del mapa del viaje ----------
     El panel corta en horizontal cuando falta ancho: al pintar se encuadra el
     nivel actual lo más centrado posible (solo la primera vez, para no pelear
     con el alumno) y el mapa se puede arrastrar con el ratón; en táctil ya
     desliza solo. La barra de scroll va oculta por CSS. */
  function encuadrarYArrastrar(svg, nivelActual) {
    var visor = svg.closest("[data-pmap-visor]");
    if (!visor) return;
    /* Se encuadra cada vez que CAMBIA el nivel actual —el primer pintado ocurre
       antes de que llegue el progreso de la cuenta— pero nunca después de que
       el alumno haya movido el mapa con la mano. */
    if (!visor.__tocado && visor.__nivelEncuadrado !== nivelActual) {
      visor.__nivelEncuadrado = nivelActual;
      var nodo = svg.querySelector('.pmap__node[data-belt="' + nivelActual + '"]');
      if (nodo && visor.scrollWidth > visor.clientWidth + 4) {
        var centrar = function () {
          var rn = nodo.getBoundingClientRect(), rv = visor.getBoundingClientRect();
          visor.scrollLeft += (rn.left + rn.width / 2) - (rv.left + rv.width / 2);
        };
        centrar();
        requestAnimationFrame(centrar);      /* por si la lámina aún no midió */
      }
    }
    if (visor.__arrastre) return;
    visor.__arrastre = true;
    var drag = null;
    visor.addEventListener("pointerdown", function (e) {
      visor.__tocado = true;                 /* a partir de aquí manda el alumno */
      if (e.pointerType !== "mouse" || e.button !== 0) return;   /* táctil desliza nativo */
      drag = { x: e.clientX, s: visor.scrollLeft, movido: false };
    });
    visor.addEventListener("wheel", function () { visor.__tocado = true; }, { passive: true });
    visor.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 4) { drag.movido = true; visor.classList.add("is-arrastrando"); }
      visor.scrollLeft = drag.s - dx;
    });
    function soltar() { if (drag && !drag.movido) drag = null; else setTimeout(function () { drag = null; }, 0); visor.classList.remove("is-arrastrando"); }
    visor.addEventListener("pointerup", soltar);
    visor.addEventListener("pointerleave", soltar);
    /* si hubo arrastre, el clic que lo termina no debe abrir el nivel */
    visor.addEventListener("click", function (e) { if (drag && drag.movido) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  /* ---------- Fusión local ↔ remoto ---------- */
  function merge(remote) {
    if (!remote || remote.v !== 1) return state;
    var m = fresh();
    [state, remote].forEach(function (s) {
      for (var k in (s.arts || {})) {
        var a = art.call(null, k); /* asegura estructura en state */
        var src = s.arts[k];
        var dst = m.arts[k] || (m.arts[k] = { missions: {}, exams: {}, belts: {}, scrolls: {}, tools: {} });
        ["missions", "exams", "scrolls", "tools"].forEach(function (kind) {
          for (var id in (src[kind] || {})) {
            var r = src[kind][id], cur = dst[kind][id];
            if (!cur || (r.xp || 0) > (cur.xp || 0) || (r.score || 0) > (cur.score || 0)) dst[kind][id] = Object.assign({}, cur || {}, r, { xp: Math.max((cur && cur.xp) || 0, r.xp || 0) });
          }
        });
        for (var n in (src.belts || {})) if (!dst.belts[n]) dst.belts[n] = src.belts[n];
        void a;
      }
      for (var ak in (s.achievements || {})) if (!m.achievements[ak]) m.achievements[ak] = s.achievements[ak];
      for (var rk in (s.reflections || {})) if (!m.reflections[rk] || (s.reflections[rk] || "").length > m.reflections[rk].length) m.reflections[rk] = s.reflections[rk];
      for (var fk in (s.flags || {})) m.flags[fk] = m.flags[fk] || s.flags[fk];
      for (var lk in (s.last || {})) m.last[lk] = s.last[lk] || m.last[lk];
      if ((s.streak || {}).last > (m.streak.last || "") || ((s.streak || {}).last === m.streak.last && (s.streak || {}).days > m.streak.days)) m.streak = Object.assign({}, s.streak);
      if (s.name && !m.name) m.name = s.name;
      /* Árbol Cerebro: la decoración es intención del alumno, no suma — gana la
         del estado actualizado más recientemente; si está vacía, la otra. */
      var tp = (s.tree && s.tree.p) || [];
      if (tp.length && (!m.tree.p.length || (s.updated || "") >= (m.tree.updated || ""))) {
        m.tree = { p: tp.slice(), mem: Object.assign({}, (s.tree && s.tree.mem) || {}), updated: s.updated || "" };
      }
      if (s.avatar && !m.avatar) m.avatar = s.avatar;
    });
    state = m;
    MFStore.set("progress", state);
    return state;
  }

  /* ---------- UI ---------- */
  function toast(type, title, text, icon) {
    var host = document.querySelector("[data-toasts]");
    if (!host) return;
    var el = document.createElement("div");
    el.className = "toast toast--" + type;
    el.innerHTML = '<span class="toast__icon" aria-hidden="true">' + (icon || "✨") + '</span><span><span class="toast__title"></span><span class="toast__text"></span></span>';
    el.querySelector(".toast__title").textContent = title;
    el.querySelector(".toast__text").textContent = text || "";
    host.appendChild(el);
    setTimeout(function () { el.classList.add("is-out"); setTimeout(function () { el.remove(); }, 320); }, 3600);
    var chip = document.querySelector("[data-hud-chip]");
    if (chip) { chip.classList.remove("is-bump"); void chip.offsetWidth; chip.classList.add("is-bump"); }
  }

  function confetti() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var box = document.createElement("div");
    box.className = "confetti";
    var colors = ["#e63b2e", "#f2c230", "#2e9e5b", "#2f6fd8", "#7b3fbf", "#f7f3ec"];
    for (var i = 0; i < 90; i++) {
      var p = document.createElement("i");
      p.style.left = Math.random() * 100 + "vw";
      p.style.background = colors[i % colors.length];
      p.style.animationDuration = 1.8 + Math.random() * 1.6 + "s";
      p.style.animationDelay = Math.random() * 0.6 + "s";
      p.style.transform = "rotate(" + Math.random() * 360 + "deg)";
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 4200);
  }

  /* Ilustraciones de gamificación: si el archivo existe se usa; si no, el emoji.
     `art` lo inyecta el generador en MF_CONFIG (assets/img/game/*.webp). */
  var ART = cfg.gameArt || {};
  function artImg(kind, key, cls, alt) {
    var f = ART[kind + "-" + key];
    return f ? '<img class="' + cls + '" src="' + (cfg.assets || "") + f + '" alt="' + (alt || "") + '" loading="lazy" decoding="async">' : "";
  }

  function beltPill(n, withWord) {
    var b = beltInfo(n);
    if (!b) return '<span class="belt-pill"><span class="belt-pill__swatch" style="--belt:#3a3c4a"></span>' + T.noBelt + '</span>';
    var label = ES ? (withWord ? "Cinturón " : "") + b.name.toLowerCase() : b.name + (withWord ? " belt" : "");
    var img = artImg("belt", b.key, "belt-pill__art");
    return '<span class="belt-pill">' + (img || '<span class="belt-pill__swatch" style="--belt:' + b.color + '"></span>') + label + '</span>';
  }

  /* ---------- Estado de sesión ----------
     Tres estados y ni uno más:
       "local" — el sitio no tiene cuentas configuradas (sin Supabase).
       "in"    — hay sesión guardada en este navegador.
       "out"   — no hay ninguna.
     Arranca de forma síncrona con SB.hasSession() para que la cabecera no
     mienta ni parpadee en el primer pintado; auth.js lo confirma después
     contra el servidor (setSession) y corrige si la sesión ya no vale. */
  var sessionState = (window.SB && SB.enabled()) ? (SB.hasSession() ? "in" : "out") : "local";
  function markSession() { document.documentElement.setAttribute("data-session", sessionState); }
  markSession();
  function setSession(v) {
    if (v === sessionState) return;
    sessionState = v; markSession(); paint();
    listeners.forEach(function (fn) { try { fn(state); } catch (e) { /* nada */ } });
  }

  /* El generador emite los enlaces a la zona de alumnos SIN href en las páginas
     públicas (build.py, href_attr): así el escaparate no enumera el dojo. Aquí
     se los devolvemos a quien tiene sesión. Es comodidad, no seguridad: quien
     mire el código fuente ve el destino igual. Lo que de verdad cierra es que
     el contenido no está en el HTML, sino en Supabase bajo RLS. */
  function promoverEnlaces() {
    if (sessionState === "out") return;
    document.querySelectorAll("a[data-href]").forEach(function (a) {
      a.setAttribute("href", a.getAttribute("data-href"));
      a.removeAttribute("data-href");
    });
  }

  /* Sin sesión, tocar un enlace dormido lleva a la puerta de entrada
     en vez de no hacer nada. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-href]");
    if (!a) return;
    e.preventDefault();
    if (sessionState === "out" && cfg.profileUrl) window.location.href = cfg.profileUrl;
  });

  /* El dojo se recorre en orden: los enlaces de niveles bloqueados avisan en
     vez de navegar. El candado de verdad lo pone auth.js al abrir la página. */
  document.addEventListener("click", function (e) {
    if (!e.target.closest) return;
    var nodo = e.target.closest(".belt.is-locked, .pmap__node.is-locked");
    if (!nodo) return;
    var a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    toast("xp", T.levelLocked, "", "🔒");
  });

  function paint() {
    promoverEnlaces();
    var xp = totalXP(), r = rank(xp);
    var pageArt = cfg.page && cfg.page.art;
    var hb = beltInfo(pageArt ? beltOf(pageArt) : topBelt());
    var av = sessionState !== "out" && state.avatar && ART["avatar-" + state.avatar];
    document.querySelectorAll("[data-hud-avatar]").forEach(function (el) {
      el.innerHTML = av ? '<img src="' + (cfg.assets || "") + av + '" alt="">' : "";
      el.hidden = !av;
    });
    var dentro = sessionState !== "out";
    document.querySelectorAll("[data-hud-chip]").forEach(function (chip) {
      chip.classList.add("is-ready");
      /* Sin cuenta no hay rango que enseñar: el chip pasa a ser una invitación
         a entrar. Era imposible saber de un vistazo si había sesión abierta. */
      chip.classList.toggle("hud--out", !dentro);
      var ring = chip.querySelector("[data-hud-ring]"); if (ring) ring.style.setProperty("--pct", dentro ? r.pct : 0);
      var belt = chip.querySelector("[data-hud-belt]"); if (belt) belt.style.setProperty("--belt", dentro && hb ? hb.color : "#3a3c4a");
      var rk = chip.querySelector("[data-hud-rank]"); if (rk) rk.textContent = dentro ? r.name : T.noAccount;
      var x = chip.querySelector("[data-hud-xp]"); if (x) x.textContent = xp;
      var meta = chip.querySelector(".hud__xp"); if (meta) meta.hidden = !dentro;
      chip.title = dentro ? (r.next ? T.toRank.replace("{n}", r.nextAt - xp).replace("{rank}", r.next) : T.maxRank) : T.signIn;
      if (!dentro) chip.setAttribute("aria-label", T.noAccount + ": " + T.signIn);
      else if (chip.dataset.label) chip.setAttribute("aria-label", chip.dataset.label);
    });
    document.querySelectorAll("[data-hud]").forEach(function (h) {
      h.hidden = xp === 0 || !dentro;
      var rk = h.querySelector("[data-hud-rank]"); if (rk) rk.textContent = r.name;
      var x = h.querySelector("[data-hud-xp]"); if (x) x.textContent = xp;
      var st = h.querySelector("[data-hud-streak]");
      if (st) st.textContent = state.streak.days > 0 ? "🔥 " + (state.streak.days === 1 ? T.streak1 : T.streak.replace("{n}", state.streak.days)) : "";
    });
    /* A partir de aquí todo es expediente del alumno. Sin cuenta no hay nada que
       enseñar: el dojo llegaba a marcar cinturones conseguidos —los del último
       que usara el navegador— a alguien que no se había registrado. Se limpia
       lo que hubiera quedado pintado y se sale. */
    if (!dentro) {
      document.querySelectorAll(".belt, .pmap__node, .mission-card, .card[data-item]").forEach(function (el) {
        el.classList.remove("is-done", "is-current", "is-locked", "is-next");
      });
      document.querySelectorAll(".pmap__punto").forEach(function (c) { c.classList.remove("is-done"); });
      document.querySelectorAll("[data-dojo-progress]").forEach(function (box) {
        var fill = box.querySelector(".dojo-progress__fill"); if (fill) fill.style.width = "0%";
        var text = box.querySelector(".dojo-progress__text"); if (text) text.textContent = "";
      });
      document.querySelectorAll("[data-art-xp]").forEach(function (el) { el.textContent = "0"; });
      return;
    }

    /* cinturones (lista y mapa): sin cuenta no hay expediente que enseñar */
    if (!dentro) {
      document.querySelectorAll("[data-belts] .belt, [data-pmap] .pmap__node").forEach(function (el) {
        el.classList.remove("is-done", "is-current", "is-locked");
      });
      document.querySelectorAll(".pmap__punto").forEach(function (c) { c.classList.remove("is-done"); });
      document.querySelectorAll("[data-dojo-progress]").forEach(function (el) { el.hidden = true; });
      return;
    }
    document.querySelectorAll("[data-dojo-progress]").forEach(function (b) { b.hidden = false; });
    document.querySelectorAll("[data-belts]").forEach(function (list) {
      var a = art(list.getAttribute("data-belts"));
      var cur = 0;
      for (var i = 1; i <= 8; i++) if (!a.belts[i]) { cur = i; break; }
      list.querySelectorAll(".belt").forEach(function (li) {
        var n = parseInt(li.getAttribute("data-belt"), 10);
        li.classList.toggle("is-done", !!a.belts[n]);
        li.classList.toggle("is-current", n === cur);
        li.classList.toggle("is-locked", n > cur);
      });
    });
    document.querySelectorAll("[data-pmap]").forEach(function (svg) {
      var a = art(svg.getAttribute("data-pmap"));
      var done = 0;
      for (var i = 1; i <= 8; i++) if (a.belts[i]) done = i; else break;
      var cur = done + 1;
      svg.querySelectorAll(".pmap__node").forEach(function (g) {
        var n = parseInt(g.getAttribute("data-belt"), 10);
        g.classList.toggle("is-done", n <= done);
        g.classList.toggle("is-current", n === cur);
        g.classList.toggle("is-locked", n > cur);
      });
      /* el rastro llega hasta el nivel actual: los puntos anteriores se pintan */
      var avance = done > 0 ? Math.min(1, ((done - 1) / 7) + 1 / 14) : 0;
      svg.querySelectorAll(".pmap__punto").forEach(function (c) {
        c.classList.toggle("is-done", parseFloat(c.getAttribute("data-t")) <= avance);
      });
      encuadrarYArrastrar(svg, Math.min(cur, 8));
    });
    /* misiones del nivel */
    document.querySelectorAll("[data-missions]").forEach(function (list) {
      var cards = [].slice.call(list.querySelectorAll(".mission-card"));
      var a = null, allDone = true, nextSet = false;
      cards.forEach(function (c) {
        a = a || art(c.getAttribute("data-art"));
        var id = c.getAttribute("data-mission");
        var exam = c.hasAttribute("data-exam");
        var done = exam ? !!(a.exams[c.getAttribute("data-level")] && a.exams[c.getAttribute("data-level")].passed) : !!a.missions[id];
        c.classList.toggle("is-done", done);
        if (!exam && !done) allDone = false;
        if (exam) {
          c.classList.toggle("is-locked", !allDone && !done);
          if (!c.__bound) { c.__bound = true; c.addEventListener("click", function (e) { if (c.classList.contains("is-locked")) { e.preventDefault(); toast("xp", T.examLocked, "", "🔒"); } }); }
        }
        if (!done && !nextSet && !(exam && !allDone)) { c.classList.add("is-next"); nextSet = true; } else { c.classList.remove("is-next"); }
      });
    });
    /* tarjetas de pergaminos/herramientas; las filas de la biblioteca
       ({SCROLL_LIST}) llevan además su sello «Completado». Solo las de la
       biblioteca: las de las salas de curso las gestiona audioteca.js con su
       resumen y sus filtros, y pintarlas desde aquí las desincronizaba. */
    document.querySelectorAll(".card[data-item], [data-biblioteca] .audioteca__item[data-item]").forEach(function (c) {
      var id = c.getAttribute("data-item"), done = false;
      for (var k in state.arts) { if (state.arts[k].scrolls[id] || state.arts[k].tools[id]) done = true; }
      c.classList.toggle("is-done", done);
      var sello = c.querySelector(".audioteca__sello");
      if (sello) sello.hidden = !done;
    });
    /* estadísticas del arte */
    document.querySelectorAll("[data-art-belt]").forEach(function (el) {
      var key = el.getAttribute("data-art-belt"), n = beltOf(key);
      if (el.classList.contains("art-hero__belt")) { var b = beltInfo(n); el.style.setProperty("--belt", b ? b.color : "#3a3c4a"); el.title = b ? b.name : T.noBelt; }
      else el.innerHTML = beltPill(n, true);
    });
    document.querySelectorAll("[data-art-xp]").forEach(function (el) { el.textContent = artXP(el.getAttribute("data-art-xp")); });
    document.querySelectorAll("[data-art-missions-count]").forEach(function (el) {
      var key = el.getAttribute("data-art-missions-count");
      var total = (cfg.artStats && cfg.artStats[key] && cfg.artStats[key].missions) || null;
      var done = Object.keys(art(key).missions).length;
      el.textContent = total ? done + "/" + total : String(done);
    });
    document.querySelectorAll("[data-dojo-progress]").forEach(function (box) {
      var a = art(box.getAttribute("data-art"));
      var k = Object.keys(a.belts).length;
      var fill = box.querySelector(".dojo-progress__fill"); if (fill) fill.style.width = Math.round((k / 8) * 100) + "%";
      var text = box.querySelector(".dojo-progress__text");
      if (text) text.textContent = T.levelsDone.replace("{k}", k) + (k >= 8 ? " · " + T.allDone : " · " + T.nextLevel.replace("{n}", k + 1));
    });
    /* Portada del arte: el botón principal lleva SIEMPRE al siguiente cinturón
       desbloqueable (nunca a un nivel cerrado), y «Continuar» —solo si ya hay
       misiones hechas— salta al primer paso pendiente de la secuencia. */
    var flujo = cfg.artFlow;
    document.querySelectorAll("[data-belt-cta]").forEach(function (a) {
      if (!dentro || !flujo) return;
      var key = a.getAttribute("data-belt-cta");
      var tengo = beltOf(key), sig = tengo + 1;
      if (sig > 8) {
        a.setAttribute("href", flujo.levels[8] || a.getAttribute("href"));
        a.textContent = T.keepTraining;
      } else if (tengo > 0 && flujo.levels[sig]) {
        a.setAttribute("href", flujo.levels[sig]);
        var b = beltInfo(sig);
        a.textContent = T.continueBelt.replace("{b}", ES ? b.name.toLowerCase() : b.name.toLowerCase());
      }
      /* sin cinturones se queda el texto y el destino de serie: nivel 1 */
    });
    document.querySelectorAll("[data-resume-cta]").forEach(function (a) {
      a.hidden = true;
      if (!dentro || !flujo) return;
      var key = a.getAttribute("data-resume-cta");
      var st = art(key);
      if (!Object.keys(st.missions).length) return;   /* sin misiones hechas, no aparece */
      var tope = beltOf(key) + 1;
      for (var i = 0; i < flujo.seq.length; i++) {
        var s = flujo.seq[i];
        if (s.level > tope) break;
        var hecho = s.exam ? !!(st.exams[s.level] && st.exams[s.level].passed) : !!st.missions[s.id];
        if (!hecho) { a.setAttribute("href", s.url); a.hidden = false; return; }
      }
    });
  }

  window.MF = {
    state: function () { return state; }, save: save, art: art, totalXP: totalXP, artXP: artXP, rank: rank, beltOf: beltOf, beltInfo: beltInfo, topBelt: topBelt,
    completeMission: completeMission, completeExam: completeExam, scrollRead: scrollRead, toolUsed: toolUsed, reflect: reflect, remember: remember,
    track: track, flushEvents: flushEvents, merge: merge, toast: toast, confetti: confetti, beltPill: beltPill, paint: paint,
    artImg: artImg,
    avatars: function () {
      return Object.keys(ART).filter(function (k) { return k.indexOf("avatar-") === 0; })
        .map(function (k) { return { key: k.slice(7), src: (cfg.assets || "") + ART[k] }; });
    },
    session: function () { return sessionState; }, setSession: setSession,
    achievements: ACHIEVEMENTS, onChange: function (fn) { listeners.push(fn); }, T: T, XP: XP, sync: null,
    reset: function () { state = fresh(); MFStore.set("progress", state); paint(); },
    /* Al cerrar sesión el navegador seguía exhibiendo los cinturones del alumno
       anterior. Esto lo borra de verdad, no solo de la pantalla. */
    forget: function () { state = fresh(); MFStore.remove("progress"); paint(); },
  };
  if (cfg.page && cfg.page.art && (cfg.page.layout === "mission" || cfg.page.layout === "level")) remember(cfg.page.art, window.location.pathname);

  /* ---------- Volver a la tarjeta de origen ----------
     Si saliste de una misión por un enlace (a un pergamino, por ejemplo),
     mission.js dejó guardado el punto exacto. Mientras ese punto exista y no
     estés en la propia misión, esta pastilla flotante te devuelve a la tarjeta
     en la que ibas, navegues lo que navegues por el camino. */
  (function () {
    /* La pastilla de regreso SOLO existe sobre el contenido complementario
       (pergamino, historia, herramienta). En las páginas del flujo (dojo,
       niveles, misiones) no pinta nada: ahí se navega con los enlaces del
       propio flujo. Un ancla rancia en sessionStorage tampoco debe asomar. */
    var capa = cfg.page && cfg.page.layout;
    if (capa !== "article" && capa !== "story" && capa !== "tool") return;
    var o = null;
    try { o = JSON.parse(sessionStorage.getItem("mf.origen") || "null"); } catch (e) { /* nada */ }
    if (o && o.url === window.location.pathname && (o.tipo === "nivel" || o.tipo === "biblioteca")) {
      /* de vuelta en el nivel: viaje completado, el ancla se suelta */
      try { sessionStorage.removeItem("mf.origen"); sessionStorage.removeItem("mf.origen.volver"); } catch (e) { /* nada */ }
      return;
    }
    if (!o || !o.url || o.url === window.location.pathname) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "back-origin";
    var etiqueta = o.tipo === "nivel" ? (ES ? "Volver al nivel" : "Back to the level")
                 : o.tipo === "biblioteca" ? (ES ? "Volver a la biblioteca" : "Back to the library")
                 : (ES ? "Volver a la misión" : "Back to the mission");
    btn.innerHTML = '<span aria-hidden="true">↩</span> ' + etiqueta;
    btn.title = o.title || "";
    btn.addEventListener("click", function () {
      try { sessionStorage.setItem("mf.origen.volver", "1"); } catch (e) { /* nada */ }
      window.location.href = o.url;
    });
    document.body.appendChild(btn);
  })();
  paint();
  flushEvents();
})();

/* MenteFu / MyselfU — motor de progreso y gamificación (docs/04).
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
    achievement: "Logro desbloqueado", beltAwarded: "¡Nuevo cinturón!", streak: "{n} días de racha",
    levelsDone: "Cinturones: {k}/8", nextLevel: "Siguiente: nivel {n}", allDone: "Cinturón negro conseguido. Sigue entrenando.",
    examLocked: "Completa todas las misiones del nivel para desbloquear el examen.",
    rankUp: "¡Subes de rango!", toRank: "{n} XP para {rank}", maxRank: "Rango máximo",
  } : {
    noBelt: "No belt yet", belt: "Belt", xpGained: "+{n} XP", missionDone: "Mission completed",
    achievement: "Achievement unlocked", beltAwarded: "New belt!", streak: "{n}-day streak",
    levelsDone: "Belts: {k}/8", nextLevel: "Next: level {n}", allDone: "Black belt earned. Keep training.",
    examLocked: "Complete every mission in the level to unlock the exam.",
    rankUp: "Rank up!", toRank: "{n} XP to {rank}", maxRank: "Top rank",
  };

  /* ---------- Logros ---------- */
  var ACHIEVEMENTS = [
    { key: "first-mission", icon: "🎯", es: ["Primera misión", "Completaste tu primera misión."], en: ["First mission", "You completed your first mission."], test: function (s) { return countItems(s, "missions") >= 1; } },
    { key: "missions-10", icon: "⚡", es: ["Diez misiones", "Diez misiones completadas."], en: ["Ten missions", "Ten missions completed."], test: function (s) { return countItems(s, "missions") >= 10; } },
    { key: "first-scroll", icon: "📜", es: ["Primer pergamino", "Leíste un pergamino hasta el final."], en: ["First scroll", "You read a scroll to the end."], test: function (s) { return countItems(s, "scrolls") >= 1; } },
    { key: "first-tool", icon: "🧰", es: ["Primera herramienta", "Usaste una herramienta de entrenamiento."], en: ["First tool", "You used a training tool."], test: function (s) { return countItems(s, "tools") >= 1; } },
    { key: "belt-white", icon: "🥋", es: ["Cinturón blanco", "Ya reconoces la culpa cuando aparece."], en: ["White belt", "You now recognize guilt when it shows up."], test: function (s) { return hasBelt(s, 1); } },
    { key: "belt-yellow", icon: "🟡", es: ["Cinturón amarillo", "Identificaste a tu culpador interior."], en: ["Yellow belt", "You identified your inner accuser."], test: function (s) { return hasBelt(s, 2); } },
    { key: "belt-green", icon: "🟢", es: ["Cinturón verde", "Reconoces la manipulación a tiempo."], en: ["Green belt", "You recognize manipulation in time."], test: function (s) { return hasBelt(s, 4); } },
    { key: "belt-black", icon: "🏴", es: ["Cinturón negro", "Eliges sin ser gobernado por la culpa."], en: ["Black belt", "You choose without being ruled by guilt."], test: function (s) { return hasBelt(s, 8); } },
    { key: "perfect-exam", icon: "💯", es: ["Examen perfecto", "Un examen sin un solo fallo."], en: ["Perfect exam", "An exam without a single miss."], test: function (s) { return anyExam(s, function (e) { return e.score >= 1; }); } },
    { key: "streak-3", icon: "🔥", es: ["Tres días seguidos", "Entrenaste tres días seguidos."], en: ["Three days straight", "You trained three days in a row."], test: function (s) { return s.streak.days >= 3; } },
    { key: "streak-7", icon: "🌋", es: ["Una semana de racha", "Siete días seguidos entrenando."], en: ["One-week streak", "Seven days in a row training."], test: function (s) { return s.streak.days >= 7; } },
    { key: "early-bird", icon: "🌅", es: ["Madrugador", "Completaste una misión antes de las 8."], en: ["Early bird", "You completed a mission before 8 am."], test: function (s) { return !!s.flags.early; } },
    { key: "night-owl", icon: "🦉", es: ["Noctámbulo", "Completaste una misión después de las 23."], en: ["Night owl", "You completed a mission after 11 pm."], test: function (s) { return !!s.flags.late; } },
  ];

  /* ---------- Estado ---------- */
  function fresh() { return { v: 1, arts: {}, achievements: {}, streak: { days: 0, last: "" }, reflections: {}, flags: {}, last: {}, name: "", updated: "" }; }
  var state = MFStore.get("progress", null);
  if (!state || state.v !== 1) state = fresh();
  ["arts", "achievements", "reflections", "flags", "last"].forEach(function (k) { if (!state[k]) state[k] = {}; });
  if (!state.streak) state.streak = { days: 0, last: "" };

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

  function scrollRead(artKey, id, xp) {
    var a = art(artKey);
    if (a.scrolls[id]) return [];
    a.scrolls[id] = { at: now(), xp: xp || XP.scroll };
    bumpStreak();
    track("scroll_read", { art: artKey, item: id, xp: xp || XP.scroll });
    return afterAward(xp || XP.scroll, ES ? "Pergamino leído" : "Scroll read");
  }

  function toolUsed(artKey, id, xp) {
    var a = art(artKey);
    if (a.tools[id]) return [];
    a.tools[id] = { at: now(), xp: xp || XP.tool };
    bumpStreak();
    track("tool_used", { art: artKey, item: id, xp: xp || XP.tool });
    return afterAward(xp || XP.tool, ES ? "Herramienta usada" : "Tool used");
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

  function beltPill(n, withWord) {
    var b = beltInfo(n);
    if (!b) return '<span class="belt-pill"><span class="belt-pill__swatch" style="--belt:#3a3c4a"></span>' + T.noBelt + '</span>';
    var label = ES ? (withWord ? "Cinturón " : "") + b.name.toLowerCase() : b.name + (withWord ? " belt" : "");
    return '<span class="belt-pill"><span class="belt-pill__swatch" style="--belt:' + b.color + '"></span>' + label + '</span>';
  }

  function paint() {
    var xp = totalXP(), r = rank(xp);
    var pageArt = cfg.page && cfg.page.art;
    var hb = beltInfo(pageArt ? beltOf(pageArt) : topBelt());
    document.querySelectorAll("[data-hud-chip]").forEach(function (chip) {
      chip.classList.add("is-ready");
      var ring = chip.querySelector("[data-hud-ring]"); if (ring) ring.style.setProperty("--pct", r.pct);
      var belt = chip.querySelector("[data-hud-belt]"); if (belt) belt.style.setProperty("--belt", hb ? hb.color : "#3a3c4a");
      var rk = chip.querySelector("[data-hud-rank]"); if (rk) rk.textContent = r.name;
      var x = chip.querySelector("[data-hud-xp]"); if (x) x.textContent = xp;
      chip.title = r.next ? T.toRank.replace("{n}", r.nextAt - xp).replace("{rank}", r.next) : T.maxRank;
    });
    document.querySelectorAll("[data-hud]").forEach(function (h) {
      h.hidden = xp === 0;
      var rk = h.querySelector("[data-hud-rank]"); if (rk) rk.textContent = r.name;
      var x = h.querySelector("[data-hud-xp]"); if (x) x.textContent = xp;
      var st = h.querySelector("[data-hud-streak]"); if (st) st.textContent = state.streak.days > 0 ? "🔥 " + T.streak.replace("{n}", state.streak.days) : "";
    });
    /* cinturones (lista y mapa) */
    document.querySelectorAll("[data-belts]").forEach(function (list) {
      var a = art(list.getAttribute("data-belts"));
      var cur = 0;
      for (var i = 1; i <= 8; i++) if (!a.belts[i]) { cur = i; break; }
      list.querySelectorAll(".belt").forEach(function (li) {
        var n = parseInt(li.getAttribute("data-belt"), 10);
        li.classList.toggle("is-done", !!a.belts[n]);
        li.classList.toggle("is-current", n === cur);
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
      svg.style.setProperty("--done", done > 0 ? Math.min(100, ((done - 1) / 7) * 100 + (cur <= 8 ? 100 / 14 : 0)) : 0);
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
    /* tarjetas de pergaminos/herramientas */
    document.querySelectorAll(".card[data-item]").forEach(function (c) {
      var id = c.getAttribute("data-item"), done = false;
      for (var k in state.arts) { if (state.arts[k].scrolls[id] || state.arts[k].tools[id]) done = true; }
      c.classList.toggle("is-done", done);
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
    document.querySelectorAll("[data-continue]").forEach(function (a) {
      var url = state.last[a.getAttribute("data-continue")];
      if (url) a.setAttribute("href", url);
    });
  }

  window.MF = {
    state: function () { return state; }, save: save, art: art, totalXP: totalXP, artXP: artXP, rank: rank, beltOf: beltOf, beltInfo: beltInfo, topBelt: topBelt,
    completeMission: completeMission, completeExam: completeExam, scrollRead: scrollRead, toolUsed: toolUsed, reflect: reflect, remember: remember,
    track: track, flushEvents: flushEvents, merge: merge, toast: toast, confetti: confetti, beltPill: beltPill, paint: paint,
    achievements: ACHIEVEMENTS, onChange: function (fn) { listeners.push(fn); }, T: T, XP: XP, sync: null,
    reset: function () { state = fresh(); MFStore.set("progress", state); paint(); },
  };
  if (cfg.page && cfg.page.art && (cfg.page.layout === "mission" || cfg.page.layout === "level")) remember(cfg.page.art, window.location.pathname);
  paint();
  flushEvents();
})();

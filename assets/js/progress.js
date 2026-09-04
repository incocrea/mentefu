/* MenteFu / MindFu — motor de progreso y gamificación (docs/04).
   Estado offline-first en localStorage (MFStore "progress"); con sesión de
   Supabase se fusiona y sincroniza (auth.js). Expone window.MF.
   Requiere storage.js y sb.js (MF_CONFIG lo inyecta el generador). */
(function () {
  "use strict";
  if (!window.MFStore) return;
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var XP = cfg.xp || { mission: 20, quiz_first_try: 5, scroll: 10, exam: 50, tool: 15, exam_pass: 0.75 };
  var RANKS = cfg.ranks || [[0, "Novato"]];
  var BELTS = cfg.belts || [];
  var ACH_XP = 10;

  var T = ES ? {
    noBelt: "Sin cinturón todavía", belt: "Cinturón", xpGained: "+{n} XP", missionDone: "Misión completada", replayDone: "Reto repasado",
    achievement: "Logro desbloqueado", beltAwarded: "¡Nuevo cinturón!", streak: "{n} días de racha", streak1: "1 día de racha",
    levelsDone: "Cinturones: {k}/8", nextLevel: "Siguiente: nivel {n}", allDone: "Cinturón negro conseguido. Sigue entrenando.",
    examLocked: "Completa todas las misiones del nivel para desbloquear el examen.",
    missionLocked: "El entrenamiento se recorre en orden: completa la misión anterior para abrir esta.",
    levelLocked: "El entrenamiento se recorre en orden: consigue el cinturón anterior para abrir este nivel.",
    continueBelt: "Continuar al cinturón {b}", keepTraining: "Sigue entrenando", resumeBtn: "Continuar",
    rankUp: "¡Subes de rango!", toRank: "{n} XP para {rank}", maxRank: "Rango máximo",
    noAccount: "Sin cuenta", signIn: "Entra o crea tu cuenta para empezar a sumar XP", checking: "Comprobando tu sesión…",
  } : {
    noBelt: "No belt yet", belt: "Belt", xpGained: "+{n} XP", missionDone: "Mission completed", replayDone: "Challenge replayed",
    achievement: "Achievement unlocked", beltAwarded: "New belt!", streak: "{n}-day streak", streak1: "1-day streak",
    levelsDone: "Belts: {k}/8", nextLevel: "Next: level {n}", allDone: "Black belt earned. Keep training.",
    examLocked: "Complete every mission in the level to unlock the exam.",
    missionLocked: "The training is walked in order: complete the previous mission to open this one.",
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

  /* `replays` es la bolsa del repaso: las preguntas de la sala de retos que ya
     han cobrado su propina (ver «Repaso en la sala de retos»). Se crea aquí,
     junto al resto, para que un progreso viejo —guardado antes de que la sala
     pagara— la estrene vacía en vez de reventar al leerla. */
  function art(key) {
    key = key || "_";
    if (!state.arts[key]) state.arts[key] = { missions: {}, exams: {}, belts: {}, scrolls: {}, tools: {}, replays: {} };
    var a = state.arts[key];
    ["missions", "exams", "belts", "scrolls", "tools", "replays"].forEach(function (k) { if (!a[k]) a[k] = {}; });
    return a;
  }
  function countItems(s, kind) {
    var n = 0;
    for (var k in s.arts) { n += Object.keys(s.arts[k][kind] || {}).length; }
    return n;
  }
  function hasBelt(s, n) { for (var k in s.arts) if (s.arts[k].belts && s.arts[k].belts[n]) return true; return false; }
  function anyExam(s, fn) { for (var k in s.arts) for (var l in (s.arts[k].exams || {})) if (fn(s.arts[k].exams[l])) return true; return false; }

  /* El XP no se acumula en un contador: se SUMA de los registros cada vez. Por
     eso basta con que el repaso (`replays`) deje su recibo en la bolsa para que
     el HUD, el perfil y el rango lo vean sin que nadie les avise a mano —y por
     eso fusionar dos dispositivos nunca puede cobrar dos veces lo mismo. */
  var XP_BOLSAS = ["missions", "exams", "scrolls", "tools", "replays"];

  function totalXP(s) {
    s = s || state;
    var xp = 0;
    for (var k in s.arts) {
      var a = s.arts[k];
      XP_BOLSAS.forEach(function (kind) { for (var id in (a[kind] || {})) xp += (a[kind][id].xp || 0); });
    }
    xp += Object.keys(s.achievements || {}).length * ACH_XP;
    return xp;
  }
  function artXP(key) {
    var a = art(key), xp = 0;
    XP_BOLSAS.forEach(function (kind) { for (var id in (a[kind] || {})) xp += (a[kind][id].xp || 0); });
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
  /* Un solo sitio por el que se avisa a quien escucha. Lo que no pase por aqui
     repinta el HUD pero deja desincronizado todo lo que vive FUERA de el: el
     Arbol Cerebro de la cabecera del perfil es el caso real que lo destapo. */
  function avisar() {
    listeners.forEach(function (fn) { try { fn(state); } catch (e) { /* nada */ } });
  }
  function save() {
    state.updated = now();
    MFStore.set("progress", state);
    avisar();
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

  function completeExam(artKey, level, score, xpBase, beltKey) {
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
    /* Tu Escuela (00-PLAN §3.7): un curso puede repartir sus cinturones — el
       examen manda entonces la CLAVE del cinturón que otorga y el premio se
       anuncia con ese color y nombre, no con el de la escalera por nivel. */
    var b = null;
    if (beltKey) {
      (cfg.belts || []).forEach(function (x) { if (x.key === beltKey) b = x; });
    }
    if (!b) b = beltInfo(level);
    if (newBelt) {
      toast("belt", T.beltAwarded, (ES ? "Cinturón " : "") + (b ? b.name : level) + (ES ? "" : " belt"), "🥋");
      confetti();
    }
    return { passed: passed, newBelt: newBelt, unlocked: unlocked, belt: b };
  }

  /* examenFu (docs/12 §2.6): un examen suelto SÍ da nivel de plataforma —el XP
     lo pone el sistema, no el maestro— pero NO reparte cinturón: los cinturones
     son del camino de un curso. Se guarda aparte de `exams`, que está indexado
     por nivel y es del dojo. Solo la primera vez que se aprueba. */
  function examenFuAprobado(clave, xpBase) {
    /* `state` es la variable del módulo (progress.js:56), no una función. */
    if (!state.examenes) state.examenes = {};
    if (state.examenes[clave] && state.examenes[clave].passed) { save(); return []; }
    state.examenes[clave] = { at: now(), passed: true };
    bumpStreak(); markHour();
    track("examenfu", { art: clave, item: clave, passed: true });
    return afterAward(xpBase || XP.exam || 50, ES ? "Examen aprobado" : "Exam passed");
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

  /* ---------- Repaso en la sala de retos ----------
     La sala deja volver a jugar los retos de las misiones ya superadas y por
     eso paga una propina: el 10 % del XP que dio ESA misión, UNA sola vez por
     pregunta en la vida de la cuenta.

     El tope no es tacañería. Sin él, cualquiera deja pulsado el mismo reto y
     fabrica XP infinito; entonces el rango, los cinturones y el expediente
     entero dejan de significar nada. Con él, el techo de la sala es el número
     de preguntas del curso: acotado y comprobable, que es lo que permite
     soltarlo sin miedo.

     Lo pagado vive en su propia bolsa del arte (`replays`), no en `missions`:
     así el repaso no se cuela en las cuentas de misiones hechas, ni en los
     cinturones, ni en los logros, ni en la racha —esos se ganan entrenando— y
     a la vez viaja con la cuenta y se fusiona como todo lo demás. */

  /* La proporción vive junto al resto de la economía y la puede mover el
     generador (build.py, `XP`) sin tocar este archivo. */
  var REPLAY_SHARE = typeof XP.replay_share === "number" ? XP.replay_share : 0.10;

  /* La clave de una pregunta es su misión más el índice de su tarjeta
     («culpafu-1-1#2»). Se construye AQUÍ para que quien cobra y quien pregunta
     usen exactamente la misma: dos formatos distintos serían dos cobros. */
  function replayKey(missionId, cardIndex) { return String(missionId) + "#" + cardIndex; }

  /* Cuánto vale repasar una pregunta de esa misión: el 10 % del XP REALMENTE
     registrado al superarla (20 o 25 según se acertara a la primera), nunca una
     constante escrita a mano —si mañana cambia el XP de misión, esto le sigue
     solo—. Suelo de 1 para que ganar jamás pague cero. Misión sin completar
     devuelve 0: en la sala solo se repasa lo que ya se ganó entrenando. */
  function replayXP(artKey, missionId) {
    var rec = art(artKey).missions[missionId];
    if (!rec) return 0;
    return Math.max(1, Math.round((rec.xp || 0) * REPLAY_SHARE));
  }

  function replayPaid(artKey, key) { return !!art(artKey).replays[key]; }

  /* Paga el repaso de UNA pregunta y devuelve lo que ha pagado. Un 0 significa
     «esta ya estaba cobrada» (o que no había nada que pagar), y es lo que la
     sala usa para decirlo en pantalla sin disimular: mentir sobre el XP, en
     cualquiera de las dos direcciones, es lo peor que puede hacer esa pantalla.
     Llamarla dos veces con la misma clave suma una sola vez. */
  function replayWon(artKey, key, xp, label) {
    if (!key) return 0;
    var a = art(artKey);
    if (a.replays[key]) return 0;
    var base = Number(xp) || 0;
    /* Si no llega un XP válido no se cobra NI se marca la clave: quemar la
       pregunta para siempre por un cálculo en blanco sería el peor final. */
    if (base <= 0) return 0;
    var gained = Math.max(1, Math.round(base));
    a.replays[key] = { at: now(), xp: gained };
    track("replay_xp", { art: artKey, item: key, xp: gained });
    /* afterAward guarda, sincroniza y repinta: el HUD y el perfil se enteran
       solos, igual que con cualquier otro XP del sistema. Lo que NO se llama es
       bumpStreak ni markHour: la racha y las horas premian entrenar. */
    afterAward(gained, label || T.replayDone);
    return gained;
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
          /* donde el mapa abre es el reposo del cielo: ahí las dos capas
             coinciden con la lámina original (ver el paralaje, más abajo) */
          visor.__cieloRef = visor.scrollLeft;
          if (visor.__pintarCielo) visor.__pintarCielo();
        };
        centrar();
        requestAnimationFrame(centrar);      /* por si la lámina aún no midió */
      }
    }
    instalarParalaje(svg, visor);
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

  /* ---------- Paralaje del cielo (titular 2026-09-03) ----------
     El fondo del mapa son DOS capas (build.py): el cielo, 256 unidades más
     ancho por cada lado, y delante la montaña con el cielo transparente. Al
     mover el mapa el cielo viaja a un 45 % de la velocidad del suelo —lo
     lejano se mueve menos— y en reposo (donde el mapa abre) las capas
     coinciden píxel a píxel con la lámina original. Donde el mapa no hace
     scroll porque cabe entero (pantalla ancha), el arrastre mueve SOLO el
     cielo, hasta ese margen de 256, y al soltar vuelve a su sitio con una
     transición (la clase is-volviendo, en game.css). Se usa la propiedad CSS
     `transform` y no el atributo: en unidades de usuario del SVG y con
     transición posible. Con prefers-reduced-motion el cielo no se mueve. */
  function instalarParalaje(svg, visor) {
    if (visor.__paralaje) return;
    var cielo = svg.querySelector(".pmap__cielo");
    var quieto = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (!cielo || quieto) return;
    visor.__paralaje = true;
    var K = 0.45, MARGEN = 256;
    if (visor.__cieloRef == null) visor.__cieloRef = visor.scrollLeft;
    function escala() { var r = svg.getBoundingClientRect(); return r.width ? 1536 / r.width : 1; }
    function pintar(dx) { cielo.style.transform = "translateX(" + dx.toFixed(1) + "px)"; }
    function porScroll() {
      cielo.classList.remove("is-volviendo");
      pintar((visor.scrollLeft - (visor.__cieloRef || 0)) * (1 - K) * escala());
    }
    visor.__pintarCielo = porScroll;
    visor.addEventListener("scroll", porScroll, { passive: true });
    /* sin scroll posible: el arrastre mueve solo el cielo y vuelve al soltar */
    var suelto = null;
    visor.addEventListener("pointerdown", function (e) {
      if (visor.scrollWidth > visor.clientWidth + 4) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      suelto = { x: e.clientX };
      cielo.classList.remove("is-volviendo");
    });
    visor.addEventListener("pointermove", function (e) {
      if (!suelto) return;
      var dx = (e.clientX - suelto.x) * 0.6 * escala();
      pintar(Math.max(-MARGEN, Math.min(MARGEN, dx)));
    });
    function soltar() {
      if (!suelto) return;
      suelto = null;
      cielo.classList.add("is-volviendo");
      pintar(0);
    }
    visor.addEventListener("pointerup", soltar);
    visor.addEventListener("pointerleave", soltar);
    visor.addEventListener("pointercancel", soltar);
    porScroll();
  }

  /* Ayuda del mapa: el botón «i» clavado en la esquina abre en un modal el
     bloque [data-pmap-ayuda] de la página (cómo se entrena este arte). Sin ese
     bloque el botón no aparece. El título sale del aria-label del botón: una
     sola fuente para el idioma. */
  function ayudaDelMapa() {
    var btn = document.querySelector("[data-pmap-info]");
    var texto = document.querySelector("[data-pmap-ayuda]");
    if (!btn || !texto) return;
    btn.hidden = false;
    var titulo = btn.getAttribute("aria-label") || "";
    btn.addEventListener("click", function () {
      var previo = document.activeElement;
      var caja = document.createElement("div");
      caja.className = "modal";
      caja.setAttribute("role", "dialog");
      caja.setAttribute("aria-modal", "true");
      caja.setAttribute("aria-label", titulo);
      caja.innerHTML = '<div class="modal__panel">' +
        '<header class="modal__head"><h2 class="modal__title"></h2>' +
        '<button class="modal__close" type="button">&times;</button></header>' +
        '<div class="modal__body"></div></div>';
      caja.querySelector(".modal__title").textContent = titulo;
      caja.querySelector(".modal__close").setAttribute("aria-label", ES ? "Cerrar" : "Close");
      caja.querySelector(".modal__body").innerHTML = texto.innerHTML;
      function cerrar() {
        caja.remove();
        document.documentElement.style.overflow = "";
        document.removeEventListener("keydown", tecla);
        if (previo && previo.focus) { try { previo.focus(); } catch (e) { /* nada */ } }
      }
      function tecla(e) { if (e.key === "Escape") cerrar(); }
      caja.addEventListener("click", function (e) { if (e.target === caja) cerrar(); });
      caja.querySelector(".modal__close").addEventListener("click", cerrar);
      document.addEventListener("keydown", tecla);
      document.body.appendChild(caja);
      document.documentElement.style.overflow = "hidden";
      caja.querySelector(".modal__close").focus();
      var mapa = document.querySelector("[data-pmap]");
      track("map_help", { art: mapa ? mapa.getAttribute("data-pmap") : null });
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
        var dst = m.arts[k] || (m.arts[k] = { missions: {}, exams: {}, belts: {}, scrolls: {}, tools: {}, replays: {} });
        /* Este bucle fusiona por UNIÓN de claves (la de cualquiera de los dos
           lados entra) quedándose con el mejor recibo. Para `replays` esa unión
           es justo lo que impide el único fallo grave posible aquí: si una
           pregunta se cobró en el móvil, al sincronizar tiene que seguir cobrada
           en el portátil, o el mismo repaso pagaría dos veces. */
        XP_BOLSAS.forEach(function (kind) {
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
     `art` lo inyecta el generador en MF_CONFIG (assets/img/{cinturones,logros,artes,ui}/*.webp e icono-* de juegos/). */
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
    avisar();
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

  /* Sin sesión, tocar un enlace dormido abre el modal de cuenta ahí mismo; si
     no hay cuentas (modo local) o el modal no está, queda la página de perfil
     como puerta de entrada. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-href]");
    if (!a) return;
    e.preventDefault();
    if (sessionState !== "out") return;
    if (window.MFAuth && MFAuth.abrirModal && MFAuth.abrirModal({})) return;
    if (cfg.profileUrl) window.location.href = cfg.profileUrl;
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
    /* Misiones del nivel. El entrenamiento se recorre en orden, así que una misión
       está bloqueada mientras la ANTERIOR de su lista siga sin hacerse, y el examen
       mientras quede cualquier misión pendiente (su regla de siempre).
       Dos excepciones que NO se tocan: la primera de la lista nunca se bloquea (no
       tiene anterior) y una misión YA HECHA tampoco, aunque la de delante esté
       pendiente —hay progreso viejo conseguido en desorden y quitarle a alguien un
       paso que ya ganó sería peor que el desorden—.
       AVISO HONESTO: esto es un candado de INTERFAZ, no de acceso. La página de la
       misión sigue siendo alcanzable escribiendo su URL, exactamente igual que la
       del examen. Sirve para guiar el camino, no para impedir el paso. */
    document.querySelectorAll("[data-missions]").forEach(function (list) {
      var cards = [].slice.call(list.querySelectorAll(".mission-card"));
      var a = null, allDone = true, nextSet = false, previaHecha = true;
      cards.forEach(function (c) {
        a = a || art(c.getAttribute("data-art"));
        var id = c.getAttribute("data-mission");
        var exam = c.hasAttribute("data-exam");
        var done = exam ? !!(a.exams[c.getAttribute("data-level")] && a.exams[c.getAttribute("data-level")].passed) : !!a.missions[id];
        c.classList.toggle("is-done", done);
        /* el examen mira TODAS las misiones; una misión solo mira la de delante */
        var locked = done ? false : (exam ? !allDone : !previaHecha);
        c.classList.toggle("is-locked", locked);
        /* el examen no cuenta como «anterior» de nadie ni se cuenta a sí mismo */
        if (!exam) { previaHecha = done; if (!done) allDone = false; }
        if (!c.__bound) {
          c.__bound = true;
          c.addEventListener("click", function (e) {
            /* la clase se relee en cada clic: el candado cambia con cada repintado */
            if (!c.classList.contains("is-locked")) return;
            e.preventDefault();
            toast("xp", c.hasAttribute("data-exam") ? T.examLocked : T.missionLocked, "", "🔒");
          });
        }
        /* «is-next» señala la siguiente JUGABLE: nunca una bloqueada */
        if (!done && !locked && !nextSet) { c.classList.add("is-next"); nextSet = true; } else { c.classList.remove("is-next"); }
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
      if (el.classList.contains("art-hero__belt")) {
        /* La LÁMINA del cinturón, no un rectángulo de color (titular
           2026-09-03): misma ilustración y mismo camino (`cfg.gameArt`) que el
           mapa del dojo y el panel del maestro, para que el cinturón se vea
           igual en todo el sitio. Sin cinturón todavía se pinta la primera
           (blanca) apagada; si aún no existiera la lámina, se cae al
           rectángulo de color de siempre y no queda un hueco. */
        var b = beltInfo(n), muestra = b || BELTS[0] || null;
        var lam = muestra ? (cfg.gameArt || {})["belt-" + muestra.key] : null;
        el.title = b ? b.name : T.noBelt;
        el.classList.toggle("art-hero__belt--vacio", !b);
        if (lam) {
          el.innerHTML = '<img src="' + (cfg.assets || "") + lam + '" alt="" width="512" height="434" decoding="async">';
        } else {
          el.style.setProperty("--belt", b ? b.color : "#3a3c4a");
        }
      }
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
    replayKey: replayKey, replayXP: replayXP, replayPaid: replayPaid, replayWon: replayWon,
    track: track, flushEvents: flushEvents, merge: merge, toast: toast, confetti: confetti, beltPill: beltPill, paint: paint,
    examenFuAprobado: examenFuAprobado,
    artImg: artImg,
    avatars: function () {
      return Object.keys(ART).filter(function (k) { return k.indexOf("avatar-") === 0; })
        .map(function (k) { return { key: k.slice(7), src: (cfg.assets || "") + ART[k] }; });
    },
    session: function () { return sessionState; }, setSession: setSession,
    achievements: ACHIEVEMENTS, onChange: function (fn) { listeners.push(fn); }, T: T, XP: XP, sync: null,
    reset: function () { state = fresh(); MFStore.set("progress", state); paint(); avisar(); },
    /* Al cerrar sesión el navegador seguía exhibiendo los cinturones del alumno
       anterior. Esto lo borra de verdad, no solo de la pantalla. */
    forget: function () { state = fresh(); MFStore.remove("progress"); paint(); avisar(); },
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
  ayudaDelMapa();
  paint();
  flushEvents();
})();

/* MenteFu / MindFu — reproductor de misiones (tarjetas gamificadas, docs/04 §2).
   Espera el evento mf:content (auth.js) con {cards, xp, kind, art, level, next…}
   y renderiza una tarjeta cada vez con barra de progreso, quiz con feedback,
   reflexiones guardadas, microretos y pantalla final con XP y cinturón. */
(function () {
  "use strict";
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var XP = (window.MF && MF.XP) || {};
  var T = ES ? {
    next: "Siguiente", prev: "Anterior", finish: "Terminar", card: "Tarjeta {i} de {n}", quiz: "Pregunta", choice: "Explora", reflect: "Reflexiona", practice: "Microreto", scroll: "Pergamino", text: "",
    correct: "¡Correcto!", wrong: "No exactamente", bonus: "+{n} XP por acertar a la primera", retry: "Prueba otra vez",
    done: "Hecho", later: "Lo haré luego", doneMsg: "+{n} XP por el microreto", open: "Abrir pergamino", scrollMeta: "Lectura de apoyo · +{n} XP al terminarlo",
    missionDone: "Misión completada", examDone: "Examen terminado", earned: "XP ganados", alreadyDone: "Ya habías completado esta misión: repasar no suma XP, pero siempre suma.",
    passed: "Aprobado: {p} %", failed: "No alcanzaste el 75 % ({p} %). Repasa las misiones y vuelve a intentarlo: no hay penalización.", beltNew: "Nuevo cinturón", retake: "Repetir examen",
    nextMission: "Siguiente: {t}", nextLevelBtn: "Empezar el {t}", backLevel: "Volver al nivel", toProfile: "Ver mi perfil", unlocked: "Logros desbloqueados",
    placeholder: "Escribe aquí…", saved: "Se guarda automáticamente.",
  } : {
    next: "Next", prev: "Previous", finish: "Finish", card: "Card {i} of {n}", quiz: "Question", choice: "Explore", reflect: "Reflect", practice: "Micro-challenge", scroll: "Scroll", text: "",
    correct: "Correct!", wrong: "Not quite", bonus: "+{n} XP for a first-try hit", retry: "Try again",
    done: "Done", later: "I’ll do it later", doneMsg: "+{n} XP for the micro-challenge", open: "Open scroll", scrollMeta: "Supporting read · +{n} XP when finished",
    missionDone: "Mission completed", examDone: "Exam finished", earned: "XP earned", alreadyDone: "You had already completed this mission: reviewing does not add XP, but it always adds.",
    passed: "Passed: {p} %", failed: "You did not reach 75 % ({p} %). Review the missions and try again: there is no penalty.", beltNew: "New belt", retake: "Retake exam",
    nextMission: "Next: {t}", nextLevelBtn: "Start {t}", backLevel: "Back to level", toProfile: "See my profile", unlocked: "Achievements unlocked",
    placeholder: "Write here…", saved: "Saved automatically.",
  };
  var LETTERS = "ABCDEF";

  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }

  function start(host, data) {
    var body = host.querySelector("[data-gated-body]");
    var cards = data.cards || [];
    var n = cards.length;
    var i = 0;
    var earned = data.xp || XP.mission || 20;
    var bonus = 0;
    var quizTotal = 0, quizCorrect = 0;
    var isExam = data.kind === "exam";
    var a = window.MF ? MF.art(data.art) : null;
    var already = a && !isExam && !!a.missions[data.id];
    cards.forEach(function (c) { if (c.type === "quiz") quizTotal++; });

    var wrap = el('<div class="mission"><div class="mission__top"><div class="mission__bar"><div class="mission__fill"></div></div><span class="mission__count"></span></div><div class="mission__stage"></div><div class="mission__actions"><button class="btn btn--ghost" type="button" data-prev hidden>' + T.prev + '</button><button class="btn btn--primary" type="button" data-next>' + T.next + '</button></div></div>');
    body.appendChild(wrap);
    var fill = wrap.querySelector(".mission__fill"), count = wrap.querySelector(".mission__count"), stage = wrap.querySelector(".mission__stage"), nextBtn = wrap.querySelector("[data-next]"), prevBtn = wrap.querySelector("[data-prev]");
    /* hasta dónde ha llegado ya: al volver atrás, las tarjetas superadas no
       vuelven a exigir su respuesta */
    var reached = 0;

    function setNext(enabled) { nextBtn.disabled = !enabled && i >= reached; }
    function progress() {
      fill.style.width = Math.round(((i) / n) * 100) + "%";
      count.textContent = T.card.replace("{i}", Math.min(i + 1, n)).replace("{n}", n);
      nextBtn.textContent = i >= n - 1 ? T.finish : T.next;
      prevBtn.hidden = i <= 0;
    }

    function renderCard(c) {
      stage.innerHTML = "";
      var card = el('<article class="mcard mcard--' + c.type + '"></article>');
      if (T[c.type]) card.appendChild(el('<span class="mcard__type">' + T[c.type] + "</span>"));
      var content = document.createElement("div"); content.innerHTML = c.html || ""; card.appendChild(content);
      setNext(true);

      if (c.type === "quiz" || c.type === "choice") {
        setNext(false);
        var list = el('<ul class="options" role="list"></ul>');
        var attempts = 0, answered = false;
        (c.options || []).forEach(function (o, k) {
          var b = el('<li><button class="option" type="button"><span class="option__key">' + LETTERS[k] + '</span><span class="option__text"></span></button></li>');
          b.querySelector(".option__text").innerHTML = o.html;
          b.querySelector("button").addEventListener("click", function () {
            if (answered) return;
            var btn = this;
            attempts++;
            var old = card.querySelector(".feedback"); if (old) old.remove();
            if (c.type === "choice") {
              list.querySelectorAll(".option").forEach(function (x) { x.classList.remove("is-picked"); });
              btn.classList.add("is-picked");
              if (o.feedback) card.appendChild(el('<div class="feedback">' + o.feedback + "</div>"));
              setNext(true);
              if (window.MF) MF.track("choice", { item: data.id, data: { card: i, option: k } });
              return;
            }
            if (window.MF) MF.track("quiz_answer", { item: data.id, data: { card: i, option: k, correct: !!o.correct, attempt: attempts } });
            if (o.correct) {
              answered = true;
              btn.classList.add("is-correct");
              list.querySelectorAll(".option").forEach(function (x) { x.disabled = true; });
              var msg = "<p><strong>" + T.correct + "</strong></p>" + (o.feedback ? "<p>" + o.feedback + "</p>" : "") + (c.feedback || "");
              if (attempts === 1 && !isExam && !already) { bonus += XP.quiz_first_try || 5; msg += "<p><em>" + T.bonus.replace("{n}", XP.quiz_first_try || 5) + "</em></p>"; }
              if (attempts === 1) quizCorrect++;
              card.appendChild(el('<div class="feedback feedback--ok">' + msg + "</div>"));
              setNext(true);
            } else {
              btn.classList.add("is-wrong"); btn.disabled = true;
              var m = "<p><strong>" + T.wrong + "</strong></p>" + (o.feedback ? "<p>" + o.feedback + "</p>" : "");
              if (isExam) {
                answered = true;
                list.querySelectorAll(".option").forEach(function (x, idx) { x.disabled = true; if (c.options[idx].correct) x.classList.add("is-correct"); });
                m += c.feedback || "";
                setNext(true);
              } else { m += "<p><em>" + T.retry + "</em></p>"; }
              card.appendChild(el('<div class="feedback feedback--ko">' + m + "</div>"));
            }
          });
          list.appendChild(b);
        });
        card.appendChild(list);
      } else if (c.type === "reflect") {
        var key = data.id + ":" + i;
        var ta = el('<textarea rows="4"></textarea>');
        ta.placeholder = c.placeholder || T.placeholder;
        if (window.MF) ta.value = MF.state().reflections[key] || "";
        var t; ta.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { if (window.MF) MF.reflect(key, ta.value); }, 400); });
        card.appendChild(ta);
        card.appendChild(el('<p class="local-note">' + T.saved + "</p>"));
      } else if (c.type === "practice") {
        setNext(false);
        var row = el('<div class="mcard__actions"><button class="btn btn--primary" type="button">✓ ' + T.done + '</button><button class="btn btn--ghost" type="button">' + T.later + "</button></div>");
        var bs = row.querySelectorAll("button");
        bs[0].addEventListener("click", function () { if (!already) bonus += XP.practice || 10; bs[0].disabled = true; bs[1].disabled = true; card.appendChild(el('<div class="feedback feedback--ok"><p>' + T.doneMsg.replace("{n}", XP.practice || 10) + "</p></div>")); if (window.MF) MF.track("practice_done", { item: data.id, data: { card: i } }); setNext(true); });
        bs[1].addEventListener("click", function () { bs[0].disabled = true; bs[1].disabled = true; setNext(true); });
        card.appendChild(row);
      } else if (c.type === "scroll") {
        var link = el('<a class="scroll-link" href="' + (c.href || "#") + '"><span class="scroll-link__icon" aria-hidden="true">📜</span><span><span class="scroll-link__title"></span><span class="scroll-link__meta">' + T.scrollMeta.replace("{n}", XP.scroll || 10) + "</span></span></a>");
        link.querySelector(".scroll-link__title").textContent = c.title || T.open;
        card.appendChild(link);
      }
      stage.appendChild(card);
      progress();
      if (window.MF) MF.track("card_view", { item: data.id, data: { card: i, type: c.type } });
      wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function finish() {
      stage.innerHTML = "";
      fill.style.width = "100%"; count.textContent = T.card.replace("{i}", n).replace("{n}", n);
      wrap.querySelector(".mission__actions").hidden = true;
      var total = earned + bonus;
      var html = '<article class="mcard mcard--done">';
      if (isExam) {
        var score = quizTotal ? quizCorrect / quizTotal : 1;
        var res = window.MF ? MF.completeExam(data.art, data.level, score, data.xp) : { passed: score >= 0.75, newBelt: false, unlocked: [] };
        var pct = Math.round(score * 100);
        html += '<div class="mcard__trophy" aria-hidden="true">' + (res.passed ? "🏆" : "🥋") + "</div><h3>" + T.examDone + "</h3>";
        html += '<p class="mcard__score">' + (res.passed ? T.passed : T.failed).replace("{p}", pct) + "</p>";
        if (res.passed && res.belt) html += '<div class="mcard__belt-award"><span class="belt-pill__swatch" style="--belt:' + res.belt.color + '"></span>' + T.beltNew + ": " + (ES ? "cinturón " + res.belt.name.toLowerCase() : res.belt.name + " belt") + "</div>";
        if (res.newBelt) html += '<div class="mcard__xp">+' + (data.xp || XP.exam || 50) + " XP</div>";
        var puerta = res.passed && data.nextLevel
          ? '<a class="btn btn--primary" href="' + data.nextLevel.href + '">' + T.nextLevelBtn.replace("{t}", data.nextLevel.title) + "</a>" : "";
        html += '<div class="mcard__actions">' + (res.passed ? puerta : '<button class="btn btn--primary" type="button" data-retake>' + T.retake + "</button>")
              + '<a class="btn btn--ghost" href="' + (data.levelHref || "./") + '">' + T.backLevel + '</a><a class="btn btn--ghost" href="' + (cfg.profileUrl || "#") + '">' + T.toProfile + "</a></div>";
      } else {
        var unlocked = window.MF ? MF.completeMission(data.art, data.id, total, data.level) : [];
        html += '<div class="mcard__trophy" aria-hidden="true">⚡</div><h3>' + T.missionDone + "</h3>";
        html += already ? "<p>" + T.alreadyDone + "</p>" : '<div class="mcard__xp">+' + total + ' XP</div><p class="muted">' + T.earned + "</p>";
        if (unlocked && unlocked.length) html += "<p><strong>" + T.unlocked + ":</strong> " + unlocked.map(function (u) { return u.icon + " " + (ES ? u.es : u.en)[0]; }).join(" · ") + "</p>";
        html += '<div class="mcard__actions">' + (data.next ? '<a class="btn btn--primary" href="' + data.next.href + '">' + T.nextMission.replace("{t}", data.next.title) + "</a>" : "")
              + '<a class="btn btn--ghost" href="' + (data.levelHref || "./") + '">' + T.backLevel + "</a></div>";
        if (!already && window.MF) MF.confetti();
      }
      html += "</article>";
      stage.appendChild(el(html));
      var rt = stage.querySelector("[data-retake]");
      if (rt) rt.addEventListener("click", function () { i = 0; reached = 0; quizCorrect = 0; wrap.querySelector(".mission__actions").hidden = false; renderCard(cards[0]); });
      wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function slide(dir) {
      var card = stage.firstChild;
      if (card && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        stage.classList.remove("is-slide-left", "is-slide-right");
        void stage.offsetWidth;   /* reinicia la animación */
        stage.classList.add(dir < 0 ? "is-slide-right" : "is-slide-left");
      }
    }
    function goNext() {
      if (nextBtn.disabled) return;
      i++;
      reached = Math.max(reached, i);
      if (i >= n) finish(); else { renderCard(cards[i]); slide(1); }
    }
    function goPrev() {
      if (i <= 0 || !stage.querySelector(".mcard")) return;
      /* en la pantalla final ya no se retrocede: la misión está entregada */
      if (i >= n) return;
      i--;
      renderCard(cards[i]);
      if (i < reached) setNext(true);
      slide(-1);
    }
    nextBtn.addEventListener("click", goNext);
    prevBtn.addEventListener("click", goPrev);
    document.addEventListener("keydown", function (e) {
      if (/TEXTAREA|INPUT/.test((document.activeElement || {}).tagName || "")) return;
      if (e.key === "ArrowRight") { if (!nextBtn.disabled) goNext(); }
      else if (e.key === "ArrowLeft") goPrev();
    });

    /* Swipe: izquierda avanza (si la tarjeta lo permite), derecha retrocede.
       Solo gestos claramente horizontales, para no pelearse con el scroll. */
    var sw = null;
    stage.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      sw = { x: e.clientX, y: e.clientY };
    });
    stage.addEventListener("pointerup", function (e) {
      if (!sw) return;
      var dx = e.clientX - sw.x, dy = e.clientY - sw.y;
      sw = null;
      if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) { if (!nextBtn.disabled) goNext(); } else goPrev();
    });
    stage.addEventListener("pointercancel", function () { sw = null; });
    /* Si un enlace de la tarjeta te lleva a un pergamino, se guarda el punto
       exacto (misión + tarjeta): el pergamino mostrará «Volver a la misión»
       (progress.js) y al volver se reabre justo aquí. */
    stage.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.getAttribute("href").charAt(0) === "#") return;
      if (a.getAttribute("href").indexOf("/dojo/") !== -1) return;   /* el flujo no deja ancla */
      try {
        sessionStorage.setItem("mf.origen", JSON.stringify({
          url: window.location.pathname, card: i, title: data.title || document.title, tipo: "mision"
        }));
      } catch (err) { /* nada */ }
    });

    /* ¿Volvemos de un pergamino? Reabrir en la tarjeta de origen. */
    var reanudar = -1;
    try {
      var o = JSON.parse(sessionStorage.getItem("mf.origen") || "null");
      if (o && o.url !== window.location.pathname) {
        /* abriste otra misión: el punto de retorno anterior ya no aplica */
        sessionStorage.removeItem("mf.origen");
        sessionStorage.removeItem("mf.origen.volver");
        o = null;
      }
      if (o && o.url === window.location.pathname && sessionStorage.getItem("mf.origen.volver")) {
        reanudar = Math.min(o.card | 0, n - 1);
        sessionStorage.removeItem("mf.origen");
        sessionStorage.removeItem("mf.origen.volver");
      }
    } catch (err) { /* nada */ }

    if (window.MF) MF.track("mission_start", { item: data.id, art: data.art });
    if (reanudar > 0) { i = reanudar; reached = reanudar; renderCard(cards[i]); setNext(true); }
    else if (n) renderCard(cards[0]); else finish();
  }

  document.querySelectorAll("[data-gate][data-kind='mission'], [data-gate][data-kind='exam']").forEach(function (host) {
    host.addEventListener("mf:content", function (e) { start(host, e.detail); });
  });
})();

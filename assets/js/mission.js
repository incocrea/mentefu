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
    next: "Siguiente", prev: "Anterior", finish: "Terminar", card: "Tarjeta {i} de {n}", quiz: "Pregunta", choice: "Explora", reflect: "Reflexiona", scroll: "Pergamino", text: "",
    correct: "¡Correcto!", wrong: "No exactamente", bonus: "+{n} XP por acertar a la primera", retry: "Prueba otra vez",
    open: "Abrir pergamino", scrollMeta: "Lectura de apoyo · +{n} XP al terminarlo",
    listen: "Escucharlo en audio", listenMeta: "Minipodcast · +{n} XP al escucharlo completo", stop: "Detener", listened: "Pergamino escuchado", itemDone: "Completado", speed: "Velocidad de reproducción",
    conAudio: "leer o escuchar",
    missionDone: "Misión completada", examDone: "Examen terminado", earned: "XP ganados", alreadyDone: "Ya habías completado esta misión: repasar no suma XP, pero siempre suma.",
    passed: "Aprobado: {p} %", failed: "No alcanzaste el 75 % ({p} %). Repasa las misiones y vuelve a intentarlo: no hay penalización.", beltNew: "Nuevo cinturón", retake: "Repetir examen",
    pasoRetos: "Retos superados: {g} de {n}", falloRetos: "Superaste {g} de {n}. Con 2 de 3 el cinturón es tuyo: repite el examen, sin penalización.",
    nextMission: "Siguiente: {t}", nextLevelBtn: "Empezar el {t}", backLevel: "Volver al nivel", toProfile: "Ver mi perfil", unlocked: "Logros desbloqueados",
    placeholder: "Escribe aquí…", saved: "Se guarda automáticamente.",
    retoTrain: "Entrenar", retoDone: "Superado ✓", retoExamSeal: "¡EXAMEN!",
    apuesta: "Elige", puertas: "Puertas", cursoBadge: "✦ Correcto", puertasLema: "No hay puerta correcta: hay caminos.",
    revela: "Revela",
    revelaAria: { makiwara: "Golpea el makiwara: cada golpe revela una frase", campana: "Toca la campana: cada campanada revela una frase", tejas: "Rompe una teja: cada teja revela una frase", faroles: "Enciende un farol: cada farol revela una frase" },
    revelaPistas: { makiwara: "¡Golpea!", campana: "¡Toca!", tejas: "¡Rompe!", faroles: "¡Enciende!" },
    revelaReset: "Reiniciar la secuencia",
    escena: "Escena", escenaSigue: "Toca para seguir la escena", escenaPista: "Toca la escena para continuar",
  } : {
    next: "Next", prev: "Previous", finish: "Finish", card: "Card {i} of {n}", quiz: "Question", choice: "Explore", reflect: "Reflect", scroll: "Scroll", text: "",
    correct: "Correct!", wrong: "Not quite", bonus: "+{n} XP for a first-try hit", retry: "Try again",
    open: "Open scroll", scrollMeta: "Supporting read · +{n} XP when finished",
    listen: "Listen to it", listenMeta: "Mini-podcast · +{n} XP when you listen to the end", stop: "Stop", listened: "Scroll listened", itemDone: "Completed", speed: "Playback speed",
    conAudio: "read or listen",
    missionDone: "Mission completed", examDone: "Exam finished", earned: "XP earned", alreadyDone: "You had already completed this mission: reviewing does not add XP, but it always adds.",
    passed: "Passed: {p} %", failed: "You did not reach 75 % ({p} %). Review the missions and try again: there is no penalty.", beltNew: "New belt", retake: "Retake exam",
    pasoRetos: "Challenges cleared: {g} of {n}", falloRetos: "You cleared {g} of {n}. Clear 2 of 3 and the belt is yours: retake the exam, no penalty.",
    nextMission: "Next: {t}", nextLevelBtn: "Start {t}", backLevel: "Back to level", toProfile: "See my profile", unlocked: "Achievements unlocked",
    placeholder: "Write here…", saved: "Saved automatically.",
    retoTrain: "Train", retoDone: "Cleared ✓", retoExamSeal: "PASSED!",
    apuesta: "Choose", puertas: "Doors", cursoBadge: "✦ Correct", puertasLema: "There is no right door: there are paths.",
    revela: "Reveal",
    revelaAria: { makiwara: "Strike the makiwara: each strike reveals a line", campana: "Ring the bell: each toll reveals a line", tejas: "Break a tile: each tile reveals a line", faroles: "Light a lantern: each lantern reveals a line" },
    revelaPistas: { makiwara: "Strike!", campana: "Ring it!", tejas: "Break it!", faroles: "Light it!" },
    revelaReset: "Restart the sequence",
    escena: "Scene", escenaSigue: "Tap to continue the scene", escenaPista: "Tap the scene to continue",
  };
  var LETTERS = "ABCDEF";
  /* Láminas de la sala de retos (patrón arbol.js:12): el prefijo del build es
     obligatorio porque las misiones cuelgan cuatro carpetas por debajo de la
     raíz y la edición inglesa vive bajo /en/. */
  var RETOS_IMG = (cfg.assets || "") + "assets/img/game/retos/";

  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }

  function contarQuiz(lista) { var k, t = 0; for (k = 0; k < lista.length; k++) if (lista[k] && lista[k].type === "quiz") t++; return t; }


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

    /* El mazo completo se guarda aparte: el examen con miniretos se queda con
       3 preguntas, y el botón de reintento tiene que poder volver a elegir
       sobre TODAS, no sobre los restos de la pasada anterior (§0.9.1). */
    var cardsOriginales = cards.slice();
    /* Memoria del sorteo de miniretos durante toda la misión (§0.1.1):
       ultimo   = último juego sorteado, para no repetirlo si hay alternativa;
       intento  = pasada del examen (0 en misión), semilla del azar;
       sorteos  = juego ya sorteado por tarjeta (reabrir el modal no re-sortea);
       resueltas= tarjetas ya resueltas (rejugar por gusto nunca re-otorga XP). */
    var sorteoCtx = { ultimo: null, intento: 0, sorteos: {}, resueltas: {} };
    /* Memoria de las cards nuevas (apuesta/puertas) durante la misión, con el
       mismo alcance que el sorteo: al volver atrás, la apuesta recuerda qué se
       apostó (tabla rota incluida) y las puertas cuál se eligió (compromiso:
       una sola). No persiste fuera de la pasada ni toca XP: igual que en
       choice, lo que perdura es la misión completada. */
    var apuestas = {};        /* iTarjeta -> índice de la opción apostada */
    var puertasEstado = {};   /* iTarjeta -> { elegida: k } */
    var revelas = {};         /* iTarjeta -> frases ya reveladas a golpes */
    /* El sorteo de ESCENA del revela (2026-09-02): cuatro variantes con la
       misma logica; se sortea al primer montaje de cada tarjeta, dura toda la
       pasada (reabrir no re-sortea, la memoria de frases sigue valiendo) y
       cambia entre pasadas y alumnos, que es la frescura pedida. `ultimo`
       evita dos iguales seguidas dentro de la mision. */
    var revelaVar = {};       /* iTarjeta -> variante sorteada */
    var revelaBolsa = [];     /* la tanda barajada pendiente de salir */
    var revelaUltimo = null;
    /* EXAMEN 2 DE 3 (titular 2026-09-02): con miniretos, el examen se aprueba
       superando al menos dos retos, no por porcentaje. El clasico sin motor
       conserva su 75 %. */
    var examGanados = 0;
    function examenConRetos() {
      for (var k in sorteoCtx.sorteos) { if (sorteoCtx.sorteos[k]) return true; }
      return false;
    }
    function examenAprobado(score) {
      return examenConRetos() ? examGanados >= 2 : score >= (XP.exam_pass || 0.75);
    }
    /* EXAMEN ENCADENADO (titular 2026-09-02): los tres retos son un solo
       combate. Al cerrarse un reto resuelto la bandera se levanta, goNext
       avanza solo y renderCard la consume para abrir el siguiente reto sin
       que nadie toque nada; tras el último, goNext cae en el cierre
       ceremonial y el veredicto llega de una vez. */
    var encadenar = false;
    var escenasVistas = {};   /* iTarjeta -> viñeta alcanzada de la escena */
    if (isExam) prepararExamen();

    var wrap = el('<div class="mission"><div class="mission__top"><div class="mission__bar"><div class="mission__fill"></div></div><span class="mission__count"></span></div><div class="mission__stage"></div><div class="mission__actions"><button class="btn btn--ghost" type="button" data-prev hidden>' + T.prev + '</button><button class="btn btn--primary" type="button" data-next>' + T.next + '</button></div></div>');
    body.appendChild(wrap);
    var fill = wrap.querySelector(".mission__fill"), count = wrap.querySelector(".mission__count"), stage = wrap.querySelector(".mission__stage"), nextBtn = wrap.querySelector("[data-next]"), prevBtn = wrap.querySelector("[data-prev]");
    /* hasta dónde ha llegado ya: al volver atrás, las tarjetas superadas no
       vuelven a exigir su respuesta */
    var reached = 0;
    /* el audio se detiene al cambiar de tarjeta o terminar la misión
       (audio.js gestiona que solo suene uno y que calle al salir) */
    function pararAudio() { if (window.MFAudio) MFAudio.parar(); }

    function setNext(enabled) { nextBtn.disabled = !enabled && i >= reached; }
    function progress() {
      fill.style.width = Math.round(((i) / n) * 100) + "%";
      count.textContent = T.card.replace("{i}", Math.min(i + 1, n)).replace("{n}", n);
      nextBtn.textContent = i >= n - 1 ? T.finish : T.next;
      prevBtn.hidden = i <= 0;
    }

    function renderCard(c) {
      pararAudio();
      /* la bandera del encadenado se consume AQUI: solo vale para la tarjeta
         a la que se llega, y solo si esa tarjeta monta un reto */
      var abrirRetoSolo = encadenar;
      encadenar = false;
      stage.innerHTML = "";
      var card = el('<article class="mcard mcard--' + c.type + '"></article>');
      if (T[c.type]) card.appendChild(el('<span class="mcard__type">' + T[c.type] + "</span>"));
      var content = document.createElement("div"); content.innerHTML = c.html || ""; card.appendChild(content);
      /* la apertura del examen medita (titular 2026-09-02): la mascota zen de
         masters-home preside la tarjeta de explicacion, y luego el texto */
      if (isExam && i === 0 && c.type === "text") {
        card.insertBefore(el('<img class="examen-zen" alt="" decoding="async" src="' + (cfg.assets || "") + 'assets/img/heroes/masters-home.webp">'), content);
      }
      setNext(true);

      if (c.type === "quiz" || c.type === "choice") {
        setNext(false);
        /* ¿A esta tarjeta le toca minireto? El sorteo puede decir que no —sin
           motor cargado, sin juego compatible o ante cualquier excepción— y
           entonces se juega el quiz clásico de siempre, intacto. Nunca se hace
           `return` desde aquí: esta rama NO es lo último de renderCard (debajo
           quedan appendChild, progress, card_view y scrollIntoView). */
        var juego = null;
        try {
          juego = (window.MFRetos && MFRetos.sortear && MFRetos.abrir) ? MFRetos.sortear(c, data, sorteoCtx, i) : null;
        } catch (errReto) {
          juego = null;
          if (window.MF) MF.track("reto_error", { item: data.id, data: { card: i } });
        }
        if (juego) { renderReto(card, c, i, juego, abrirRetoSolo); }
        else {
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
        }   /* ← fin del quiz clásico: se conserva sin tocar una línea */
      } else if (c.type === "apuesta") {
        /* Rama PROPIA, a posta fuera de la de quiz/choice: la apuesta jamás
           consulta a MFRetos.sortear y no puede caer en un minijuego. */
        setNext(false);
        renderApuesta(card, c, i);
      } else if (c.type === "puertas") {
        /* mismo aislamiento que la apuesta: sin sorteo, sin banco */
        setNext(false);
        renderPuertas(card, c, i);
      } else if (c.type === "revela") {
        /* docs/08: el texto se gana a golpes; el paso se libera al revelar todo */
        setNext(false);
        renderRevela(card, c, i);
      } else if (c.type === "escena") {
        /* docs/08: viñetas ilustradas; el paso se libera en la última */
        setNext(false);
        renderEscena(card, c, i);
      } else if (c.type === "reflect") {
        var key = data.id + ":" + i;
        var ta = el('<textarea rows="4"></textarea>');
        ta.placeholder = c.placeholder || T.placeholder;
        if (window.MF) ta.value = MF.state().reflections[key] || "";
        var t; ta.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { if (window.MF) MF.reflect(key, ta.value); }, 400); });
        card.appendChild(ta);
        card.appendChild(el('<p class="local-note">' + T.saved + "</p>"));
      /* (El microreto se retiró el 2026-09-02: no habia forma de validar
         que se cumpliera, asi que no era un indicador de progreso.) */
      } else if (c.type === "scroll") {
        var artKey = c.itemArt || data.art;
        var xpItem = c.itemXp || XP.scroll || 10;
        /* sin item no hay XP ni sello: la tarjeta puede enlazar una página
           pública (p. ej. el manifiesto) que solo se lee */
        /* Una sola tarjeta por pergamino: leerlo y escucharlo dejaron de ser dos
           ofertas separadas. El reproductor viaja DENTRO del pergamino abierto
           (titular 2026-08-26); aquí solo se avisa de que lo trae. */
        var metaLink = c.item ? T.scrollMeta.replace("{n}", xpItem) : T.scrollMeta.split(" · ")[0];
        if (c.audio) metaLink += " · " + T.conAudio;
        var link = el('<a class="scroll-link" href="' + (c.href || "#") + '"><span class="scroll-link__icon" aria-hidden="true">📜</span><span><span class="scroll-link__title"></span><span class="scroll-link__meta">' + metaLink + '</span></span><span class="scroll-link__seal" hidden>✓ ' + T.itemDone + "</span></a>");
        link.querySelector(".scroll-link__title").textContent = c.title || T.open;
        /* El pergamino se despliega flotando sobre la misión: así no se pierde
           la tarjeta ni se corta el audio. Las herramientas siguen abriéndose en
           su página (necesitan su propio JS). Si el contenido no se puede
           traer, el enlace navega como siempre. */
        /* Un pergamino real (tiene `item` y no es herramienta) SIEMPRE se abre
           en su modal, jamás navegando (auditoría 2026-09-02). El listener se
           añade aunque `window.MFPergamino` aún no exista en este frame —se
           comprueba en el CLICK, no aquí—: pergamino.js va en el layout de
           toda misión, pero de este modo un orden de carga adverso tampoco
           podría dejar el enlace navegable. Solo las tarjetas SIN item (una
           página pública como el manifiesto) siguen siendo enlaces normales. */
        if (c.item && c.itemKind !== "tool") {
          link.addEventListener("click", function (e) {
            /* con Ctrl/Cmd/Mayús el enlace sigue siendo un enlace: abrir en otra
               pestaña debe funcionar */
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
            e.preventDefault();
            /* y no se guarda ancla de vuelta: ya no se sale de la misión */
            e.stopPropagation();
            if (!window.MFPergamino) return;   /* imposible en misión; nunca navegar */
            MFPergamino.abrir({
              id: c.item, art: artKey, xp: xpItem, kind: c.itemKind, titulo: c.title,
              href: link.getAttribute("href"),
              audio: c.audio || null,
              hecho: itemHecho, alCompletar: sellar, origen: link,
            });
          });
        }
        card.appendChild(link);
        var itemHecho = function () {
          if (!window.MF || !c.item) return false;
          var aa = MF.art(artKey);
          return !!(aa.scrolls[c.item] || aa.tools[c.item]);
        };
        var sellar = function () {
          if (!itemHecho()) return;
          link.classList.add("is-done");
          link.querySelector(".scroll-link__seal").hidden = false;
        };
        sellar();
      }
      stage.appendChild(card);
      progress();
      if (window.MF) MF.track("card_view", { item: data.id, data: { card: i, type: c.type } });
      wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    /* ---------- Miniretos (docs/07-miniretos, fase 0) ----------
       La tarjeta-invitación: a la izquierda el icono y, a su lado, el nombre del
       juego con la línea de qué hay que hacer debajo; el botón, después. El
       enunciado y las opciones NO se pintan aquí (viven dentro del modal, que es
       donde se juega), así que la tarjeta se vacía antes de montar la
       invitación. */
    function renderReto(card, c, iTarjeta, juego, abrirSolo) {
      card.classList.add("mcard--reto");
      card.innerHTML = "";
      var inv = el('<div class="reto-invitacion">'
        + '<div class="reto-invitacion__cara">'
        +   '<span class="reto-invitacion__icono" aria-hidden="true"></span>'
        +   '<span class="reto-invitacion__textos">'
        +     '<span class="reto-invitacion__banner"></span>'
        +   '</span>'
        + '</div>'
        + '<button class="reto-boton" type="button"></button>'
        + '</div>');
      var boton = inv.querySelector(".reto-boton");
      /* textContent y no innerHTML: icono y banner los declara cada juego */
      /* Misma lámina que en la sala de retos, y por el mismo camino: si algún
         día cambia el icono de un juego, cambia en los dos sitios a la vez. */
      if (MFRetos.pintarIcono) MFRetos.pintarIcono(inv.querySelector(".reto-invitacion__icono"), juego);
      else inv.querySelector(".reto-invitacion__icono").textContent = juego.icono || "🥋";
      inv.querySelector(".reto-invitacion__banner").textContent = juego.banner || "";
      /* La línea de «qué hay que hacer» la declara el JUEGO (`comoSeJuega`) y es
         la única fuente: la sala de retos lee esa misma y no su propia copia, así
         que retocar la frase se hace en un solo sitio. El nodo se crea solo si
         hay frase: un juego que aún no la declare no deja un hueco vacío bajo el
         nombre —la tarjeta se ve igual de bien sin ella—. */
      var como = (typeof juego.comoSeJuega === "string") ? juego.comoSeJuega.trim() : "";
      var lineaComo;
      if (como) {
        lineaComo = el('<span class="reto-invitacion__como"></span>');
        lineaComo.textContent = como;
        inv.querySelector(".reto-invitacion__textos").appendChild(lineaComo);
      }
      boton.textContent = T.retoTrain;
      card.appendChild(inv);

      function pintarHecho() { boton.textContent = T.retoDone; boton.classList.add("reto-boton--hecho"); }

      /* Volver atrás a una tarjeta ya resuelta: el paso queda libre desde el
         primer render y el reto se puede rejugar por gusto, pero el bonus ya
         está cobrado y no vuelve a caer. Se sella «superado» lo que se GANÓ,
         con repesca o sin ella —igual que el quiz clásico, donde acertar al
         segundo intento sigue siendo acertar—; lo único que la repesca cuesta
         es el +5. En examen no hay repesca, así que una ronda fallada resuelve
         la tarjeta pero no se anuncia como superada. */
      var yaHecha = sorteoCtx.resueltas[iTarjeta];
      if (yaHecha) { if (yaHecha.ganado) pintarHecho(); setNext(true); }

      /* la continuidad del examen: llegando encadenados, este reto se abre
         solo tras un respiro corto (que se vea llegar la tarjeta) */
      if (abrirSolo && !yaHecha) {
        setTimeout(function () { if (card.isConnected && !boton.disabled) boton.click(); }, 300);
      }

      /* Espejo del feedback del quiz clásico: mismo panel, mismas clases. El
         color lo manda el ESTADO (ganado/fallado), no el bonus: pintar de rojo
         un reto ganado tras una repesca diría al alumno que ha fallado cuando
         acaba de acertar (§0.1.4). */
      function pintarFeedback(ganado, conBonus) {
        var old = card.querySelector(".feedback"); if (old) old.remove();
        var ops = c.options || [], correcta = null, k;
        for (k = 0; k < ops.length; k++) { if (ops[k].correct) { correcta = ops[k]; break; } }
        var msg = "<p><strong>" + (ganado ? T.correct : T.wrong) + "</strong></p>"
                + (correcta && correcta.feedback ? "<p>" + correcta.feedback + "</p>" : "")
                + (c.feedback || "");
        if (conBonus) msg += "<p><em>" + T.bonus.replace("{n}", XP.quiz_first_try || 5) + "</em></p>";
        card.appendChild(el('<div class="feedback feedback--' + (ganado ? "ok" : "ko") + '">' + msg + "</div>"));
      }

      /* El resultado del modal se traduce a las MISMAS variables que usa el
         quiz clásico (§0.8.1): el +5 se cobra por el camino de siempre y el XP
         se entrega una sola vez al terminar la misión. «ganado» y «fallado»
         resuelven la tarjeta; solo «abandonado» la deja como estaba. */
      function alCerrar(res) {
        if (!res || res.estado === "abandonado") return;
        var limpio = !!res.limpio;
        /* «fallado» solo llega en examen, que no tiene repesca; en misión toda
           resolución es «ganado», con o sin bonus. */
        var ganado = res.estado !== "fallado";
        var conBonus = false;
        if (!sorteoCtx.resueltas[iTarjeta]) {
          if (limpio && !isExam && !already) { bonus += XP.quiz_first_try || 5; conBonus = true; }
          /* el marcador del examen solo cuenta preguntas: si algún día un reto
             viviera en una tarjeta que no es quiz, quizTotal no la contaría y
             el score se iría de madre */
          if (limpio && c.type === "quiz") quizCorrect++;
          if (ganado && isExam) examGanados++;   /* la cuenta del 2 de 3 */
          sorteoCtx.resueltas[iTarjeta] = { limpio: limpio, ganado: ganado };
        }
        pintarFeedback(ganado, conBonus);
        if (ganado) pintarHecho();
        setNext(true);
        /* EXAMEN ENCADENADO: reto resuelto (ganado O fallado — completado) →
           se avanza solo. Sobre la última tarjeta, goNext dispara el cierre
           ceremonial y la pantalla final: el resultado, de una vez. */
        if (isExam) {
          encadenar = true;
          setTimeout(function () { if (card.isConnected) goNext(); }, 480);
        }
      }

      function seRompio() {
        /* si el modal no arranca, la tarjeta no puede quedar bloqueada para
           siempre: se libera el paso sin otorgar nada */
        if (window.MF) MF.track("reto_error", { item: data.id, data: { card: iTarjeta } });
        setNext(true);
      }

      boton.addEventListener("click", function () {
        var p = null;
        try {
          p = MFRetos.abrir(juego, c, {
            content: data,
            examen: isExam,
            ronda: (isExam && sorteoCtx.rondas) ? (sorteoCtx.rondas[iTarjeta] || null) : null,
            intento: sorteoCtx.intento,
            iTarjeta: iTarjeta,
            volverA: boton,
            origen: boton
          });
        } catch (err) { p = null; }
        if (!p || typeof p.then !== "function") { seRompio(); return; }
        p.then(alCerrar, seRompio);
      });
    }

    /* ---------- Apuesta: LAS TABLAS DE APOSTAR (rediseño 2026-09-01) ----------
       El titular descartó la lista tipo formulario: ahora las opciones son
       TABLAS DE MADERA (láminas del tameshiwari) y la coreografía cuenta la
       apuesta. Tocas la tabla por la que apuestas; la mascota lanza su golpe; y
       LA QUE SE ROMPE ES SIEMPRE LA DEL CURSO —«la tabla que dice la verdad»—.
       Si apostaste por ella, se parte bajo tu golpe; si apostaste por otra, la
       tuya AGUANTA con un tambaleo (sin rojo, sin ✗: apostar distinto no es
       fallar) y la del curso se agrieta sola un instante después. La enseñanza
       llega en los paneles neutros: primero el feedback de tu apuesta y, si el
       curso marcó otra, el suyo con la insignia ✦. Un toque decide; la card
       queda hecha ahí mismo; sin XP en juego y sin sorteo de minijuego.
       Sonido en cada acción vía MFSonido (respeta su interruptor); con
       movimiento reducido no hay poses ni mitades volando: estados finales y
       paneles, y el sonido —que no es movimiento— suena igual. */
    function renderApuesta(card, c, iTarjeta) {
      var ops = c.options || [];
      /* sin opciones no hay nada que apostar: el paso se libera para no
         encerrar al alumno por un error de autor (build.py ya avisó) */
      if (!ops.length) { setNext(true); return; }
      var kCurso = -1, k;
      for (k = 0; k < ops.length; k++) { if (ops[k].correct) { kCurso = k; break; } }

      var quieto = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
      var TABLA = RETOS_IMG + "tameshiwari-tabla.webp";
      var MITAD = RETOS_IMG + "tameshiwari-tabla-mitad.webp";
      var GOLPE = RETOS_IMG + "mascota-golpe.webp";
      var REPOSO = (cfg.assets || "") + "assets/img/mascota/propuesta-1.webp";
      /* la mitad se precarga al montar: la rotura no puede parpadear */
      var pre = new Image(); pre.src = MITAD;

      /* La mascota vive en una CAJA de medidas fijas y la lámina cambia DENTRO
         (el canon de la kata): reposo y golpe tienen proporciones distintas y
         sin la caja el swap ensanchaba la columna y toda la fila bailaba. */
      var escena = el('<div class="apuesta-escena"><span class="apuesta-mascota" aria-hidden="true"><img class="apuesta-mascota__fig" alt="" decoding="async"></span><div class="apuesta-tablas"></div></div>');
      var mascota = escena.querySelector(".apuesta-mascota__fig");
      mascota.src = REPOSO;
      var filaT = escena.querySelector(".apuesta-tablas");
      var botones = [];
      ops.forEach(function (o, j) {
        /* el rótulo ENCIMA de la madera, como una placa: es el nombre accesible
           del botón (la lámina va muda) */
        var b = el('<button class="apuesta-tabla" type="button"><span class="apuesta-tabla__rotulo"></span><span class="apuesta-tabla__madera"><img class="apuesta-tabla__fig" alt="" aria-hidden="true" decoding="async"></span></button>');
        b.querySelector(".apuesta-tabla__rotulo").innerHTML = o.html;
        b.querySelector("img").src = TABLA;
        botones.push(b);
        filaT.appendChild(b);
      });
      card.appendChild(escena);

      /* los timers de la coreografía mueren con la card: cambiar de tarjeta
         vacía el stage, y un callback tardío sobre nodos sueltos no pinta nada */
      function despues(ms, fn) { setTimeout(function () { if (card.isConnected) fn(); }, ms); }
      function nota(f, g) {
        if (window.MFSonido && MFSonido.nota) MFSonido.nota(f, { tipo: "triangle", attack: 8, decay: 160, gain: g || 0.16 });
      }

      function panel(html) {
        var f = el('<div class="feedback" role="status"></div>');
        f.innerHTML = html;
        card.appendChild(f);
      }

      /* La rotura: la madera entera se sustituye por sus DOS MITADES (la misma
         lámina, espejada a la derecha) que caen abiertas. El sello ✦ corona la
         tabla rota solo cuando es la del curso y el alumno apostó por otra:
         cuando acertó, la insignia iría sobre su propia apuesta y no añade nada. */
      function romper(j, conSello, sinAnimar) {
        var b = botones[j];
        var mad = b.querySelector(".apuesta-tabla__madera");
        b.classList.add("is-rota");
        if (sinAnimar) b.classList.add("sin-animar");
        mad.innerHTML = '<img class="apuesta-mitad apuesta-mitad--izq" alt="" aria-hidden="true" src="' + MITAD + '">' +
                        '<img class="apuesta-mitad apuesta-mitad--der" alt="" aria-hidden="true" src="' + MITAD + '">';
        if (conSello) {
          var sello = el('<span class="apuesta-curso"></span>');
          sello.textContent = T.cursoBadge;
          b.appendChild(sello);
        }
        if (!sinAnimar) {
          /* fx de contacto (docs/09): la madera cruje de verdad; beep de respaldo */
          if (!(window.MFSonido && MFSonido.fx && MFSonido.fx("fx-tabla-rompe"))) nota(659.25, 0.2);
          if (window.MFSonido && MFSonido.vibrar) MFSonido.vibrar(12);
          if (window.MFJuice && MFJuice.particulas && !quieto) {
            var re = escena.getBoundingClientRect();
            var rb = mad.getBoundingClientRect();
            MFJuice.particulas(escena, {
              x: rb.left - re.left + rb.width / 2, y: rb.top - re.top + rb.height / 2,
              n: 8, angulo: -90, dispersion: 70, colores: ["#7a4a2a", "#e0b46b", "#f7f3ec"], forma: "chispa"
            });
          }
        }
      }

      function tambalear(j) {
        var fig = botones[j].querySelector(".apuesta-tabla__fig");
        if (!fig) return;
        fig.classList.remove("is-tambalea");
        void fig.offsetWidth;
        fig.classList.add("is-tambalea");
        if (!(window.MFSonido && MFSonido.fx && MFSonido.fx("fx-tabla-aguanta"))) nota(233.08, 0.14);
      }

      /* Estado final de la card. `todo` es la reapertura: sin coreografía, sin
         sonidos y sin volver a contar eventos — solo el resultado. */
      function revelar(kEleg, todo) {
        escena.classList.add("is-decidida");
        botones.forEach(function (btn) { btn.disabled = true; });
        botones[kEleg].classList.add("is-apostada");
        var fbEleg = ops[kEleg].feedback || "";
        if (kCurso < 0 || kCurso === kEleg) {
          /* apostó por la del curso (o no hay curso): una sola enseñanza */
          if (kCurso === kEleg) romper(kCurso, false, todo || quieto);
          if (fbEleg) panel((kCurso === kEleg ? "<p><strong>" + T.cursoBadge + "</strong></p>" : "") + fbEleg);
          setNext(true);
          return;
        }
        /* apostó por otra: la suya aguanta, la del curso se agrieta después */
        if (todo || quieto) {
          romper(kCurso, true, true);
          if (fbEleg) panel(fbEleg);
          panel("<p><strong>" + T.cursoBadge + "</strong></p>" + (ops[kCurso].feedback || ""));
          setNext(true);
          return;
        }
        tambalear(kEleg);
        if (fbEleg) panel(fbEleg);
        despues(420, function () {
          romper(kCurso, true, false);
          panel("<p><strong>" + T.cursoBadge + "</strong></p>" + (ops[kCurso].feedback || ""));
        });
        setNext(true);
      }

      if (apuestas[iTarjeta] !== undefined) { revelar(apuestas[iTarjeta], true); return; }

      botones.forEach(function (btn, j) {
        btn.addEventListener("click", function () {
          if (apuestas[iTarjeta] !== undefined) return;   /* un solo toque decide */
          apuestas[iTarjeta] = j;
          if (window.MF) MF.track("apuesta", { item: data.id, data: { card: iTarjeta, option: j, curso: kCurso < 0 ? null : j === kCurso } });
          /* el gesto suena como gesto (docs/09): aqui la mascota lanza SU golpe */
          if (!(window.MFSonido && MFSonido.fx && MFSonido.fx("fx-golpe"))) nota(392, 0.12);
          if (window.MFJuice && MFJuice.respuesta) MFJuice.respuesta(btn.querySelector(".apuesta-tabla__madera"));
          /* la mascota lanza SU golpe y lo SOSTIENE 1 segundo antes de volver
             al centro (titular: a 700 aún sabía a poco). Solo cambia la lámina
             dentro de su caja fija: nada alrededor se mueve. */
          if (!quieto) {
            mascota.src = GOLPE;
            despues(1000, function () { mascota.src = REPOSO; });
          }
          revelar(j, false);
        });
      });
    }

    /* ---------- Puertas: COMPROMISO CON ECO (rediseño 2026-09-01) ----------
       El titular señaló el fallo de la primera versión: si las tres puertas se
       abren y los feedbacks se acumulan, elegir no significa nada. Ahora se
       elige UNA y la elección es definitiva en esta pasada: tu puerta se abre
       con su luz y vives TU consecuencia completa; las demás quedan ENTORNADAS
       —atenuadas, ya sin toque— con su ECO: la primera frase de su feedback,
       para saber qué te perdiste sin vivirlo. La síntesis cierra tras la única
       elección y la card queda hecha. Rejugar la misión otro día permite tomar
       otra puerta: eso es el repaso. El lema fijo sigue diciendo la verdad:
       no hay puerta correcta — hay caminos, y tomas uno. */
    function renderPuertas(card, c, iTarjeta) {
      var ops = c.options || [];
      if (!ops.length) { setNext(true); return; }   /* mismo salvavidas que la apuesta */
      var st = puertasEstado[iTarjeta];
      if (!st || st.elegida === undefined) { st = { elegida: undefined }; puertasEstado[iTarjeta] = st; }

      var quieto = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
      var lema = el('<p class="puertas-lema"></p>');
      lema.textContent = T.puertasLema;
      card.appendChild(lema);

      var CERRADA = RETOS_IMG + "puerta-cerrada.webp";
      var ABIERTA = RETOS_IMG + "puerta-abierta.webp";
      var EMPUJA = RETOS_IMG + "mascota-empuja.webp";
      var pre = new Image(); pre.src = ABIERTA;

      var fila = el('<div class="puertas"></div>');
      var botones = [];
      ops.forEach(function (o, j) {
        var b = el('<button class="puerta" type="button" aria-pressed="false"><img class="puerta__lamina" alt="" aria-hidden="true" decoding="async"><span class="puerta__rotulo"></span></button>');
        b.querySelector("img").src = CERRADA;
        b.querySelector(".puerta__rotulo").innerHTML = o.html;
        botones.push(b);
        fila.appendChild(b);
      });
      card.appendChild(fila);

      function nota(f, g) {
        if (window.MFSonido && MFSonido.nota) MFSonido.nota(f, { tipo: "triangle", attack: 8, decay: 200, gain: g || 0.16 });
      }
      /* El eco: la PRIMERA frase del feedback, en texto plano. Derivado, no
         editado: cero coste editorial y siempre fiel a lo que ya está escrito. */
      function primeraFrase(html) {
        var tmp = document.createElement("div");
        tmp.innerHTML = html || "";
        var txt = (tmp.textContent || "").replace(/\s+/g, " ").trim();
        var m = txt.match(/^[^.!?…]{2,}[.!?…]?/);
        return m ? m[0].trim() : txt.slice(0, 90);
      }

      function elegir(j, primeraVez) {
        st.elegida = j;
        botones.forEach(function (b2, x) {
          var img2 = b2.querySelector("img");
          if (x === j) {
            img2.src = ABIERTA;
            b2.classList.add("is-abierta", "is-actual");
            b2.setAttribute("aria-pressed", "true");
            b2.disabled = true;             /* la elección es definitiva en esta pasada */
          } else {
            b2.classList.add("is-entornada");
            b2.disabled = true;
            b2.setAttribute("aria-disabled", "true");
            var eco = el('<span class="puerta__eco"></span>');
            eco.textContent = primeraFrase(ops[x].feedback);
            b2.appendChild(eco);
          }
        });
        if (primeraVez) {
          /* la puerta se abre con su crujido (docs/09); beep de respaldo */
          if (!(window.MFSonido && MFSonido.fx && MFSonido.fx("fx-puerta-abre"))) nota(523.25, 0.18);
          if (window.MFSonido && MFSonido.vibrar) MFSonido.vibrar(10);
          /* la mascota empuja la puerta elegida: viaja hasta su centro y se
             desvanece al entrar. Puro adorno posicional —no mide nada del
             juego— y con movimiento reducido no existe. */
          if (!quieto) {
            var masc = el('<img class="puertas-mascota" alt="" aria-hidden="true">');
            masc.src = EMPUJA;
            fila.appendChild(masc);
            var destino = botones[j].offsetLeft + botones[j].offsetWidth / 2 - 24;
            requestAnimationFrame(function () {
              masc.style.left = Math.max(0, Math.round(destino)) + "px";
              setTimeout(function () { masc.style.opacity = "0"; }, 460);
              setTimeout(function () { if (masc.parentNode) masc.parentNode.removeChild(masc); }, 800);
            });
          }
          if (window.MF) MF.track("puerta", { item: data.id, data: { card: iTarjeta, option: j } });
        }
        var panel = el('<div class="feedback" role="status"></div>');
        panel.innerHTML = ops[j].feedback || "";
        card.appendChild(panel);
        if (c.sintesis) {
          var sin = el('<div class="feedback feedback--sintesis"></div>');
          sin.innerHTML = c.sintesis;
          card.appendChild(sin);
        }
        setNext(true);
      }

      if (st.elegida !== undefined) { elegir(st.elegida, false); return; }

      botones.forEach(function (b, j) {
        b.addEventListener("click", function () {
          if (st.elegida !== undefined) return;   /* el compromiso es un solo toque */
          elegir(j, true);
        });
      });
    }

    /* ---------- Revela: EL TEXTO SE GANA A GOLPES (docs/08, F1) ----------
       Cuatro escenas sorteadas por tarjeta con el mismo contrato (3 acciones,
       3 frases) y, desde el rediseño 2026-09-02, con FISICA: el makiwara se
       inclina con cada golpe y CAE con el ultimo; la campana (ya sin mazo:
       golpea la mascota) se mece dos veces y cae del cordel en la tercera;
       las tejas se parten una a una; y los faroles se encienden SEÑALANDO
       con el dedo (mascota-empuja), con una chispa que viaja de la punta del
       dedo al farol. Los golpes de mascota se sortean entre cuatro laminas
       (golpe, patada, canto, gancho) sin repetir el anterior; la pose de
       victoria remata todas. Reapertura sin coreografia: el estado final se
       aplica ANTES de montar la escena en el DOM y ninguna transicion se
       dispara. */
    function renderRevela(card, c, iTarjeta) {
      var frases = c.frases || [];
      if (!frases.length) { setNext(true); return; }   /* salvavidas de autor */
      var quieto = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
      var ESC_IMG = (cfg.assets || "") + "assets/img/game/escenas/";
      var GOLPE = RETOS_IMG + "mascota-golpe.webp";
      var PATADA = RETOS_IMG + "mascota-patada.webp";
      var CANTO = ESC_IMG + "pose-canto.webp";
      var GANCHO = ESC_IMG + "pose-gancho.webp";
      var VOLADORA = ESC_IMG + "pose-patada-voladora.webp";
      var EMPUJA = RETOS_IMG + "mascota-empuja.webp";
      var REPOSO = (cfg.assets || "") + "assets/img/mascota/propuesta-1.webp";
      var VICTORIA = ESC_IMG + "pose-victoria.webp";

      /* el sorteo de ESCENA por BOLSA (titular 2026-09-02): las cuatro
         variantes salen en orden aleatorio y NINGUNA repite hasta que la
         tanda entera se agota; al rebarajar, la primera de la bolsa nueva
         tampoco puede ser la ultima de la vieja (sin eso, el borde entre
         tandas podia encadenar dos iguales). */
      var VARIANTES = ["makiwara", "campana", "tejas", "faroles"];
      if (!(iTarjeta in revelaVar)) {
        if (!revelaBolsa.length) {
          revelaBolsa = VARIANTES.slice();
          for (var bz = revelaBolsa.length - 1; bz > 0; bz--) {
            var bj = Math.floor(Math.random() * (bz + 1));
            var tmp = revelaBolsa[bz]; revelaBolsa[bz] = revelaBolsa[bj]; revelaBolsa[bj] = tmp;
          }
          if (revelaBolsa[0] === revelaUltimo) revelaBolsa.push(revelaBolsa.shift());
        }
        revelaVar[iTarjeta] = revelaBolsa.shift();
        revelaUltimo = revelaVar[iTarjeta];
      }
      var vr = revelaVar[iTarjeta];

      /* el sorteo de GOLPE: cuatro laminas, nunca dos iguales seguidas */
      var GOLPES = [GOLPE, PATADA, CANTO, GANCHO, VOLADORA];
      var ultimoGolpe = null;
      function golpeAleatorio() {
        var b2 = GOLPES.filter(function (g) { return g !== ultimoGolpe; });
        ultimoGolpe = b2[Math.floor(Math.random() * b2.length)];
        return ultimoGolpe;
      }
      /* FX de contacto (docs/09, ruta B): cada gesto tiene su sonido y cada
         elemento el suyo; la capa del elemento entra ~70 ms tras la del gesto
         (el swing precede al impacto). Si MFSonido.fx no existe aun, cada
         llamada devuelve false y el caller cae al beep clasico de respaldo.
         La patada voladora reusa el fx de la patada: es una patada, con vuelo. */
      var FXG = {};
      FXG[GOLPE] = "fx-golpe"; FXG[PATADA] = "fx-patada"; FXG[CANTO] = "fx-canto"; FXG[GANCHO] = "fx-gancho"; FXG[VOLADORA] = "fx-patada";
      function sfx(id, retardo, o) { return !!(window.MFSonido && MFSonido.fx && MFSonido.fx(id, retardo, o)); }

      GOLPES.concat([VICTORIA, EMPUJA]).forEach(function (r) { var im = new Image(); im.src = r; });

      /* La escena: mascota en caja fija + el elemento como BOTON. El orden del
         markup decide el lado. `--sinflip` quita el espejo: lo llevan las
         variantes con mascota a la DERECHA (mira al elemento de fabrica) y
         tambien los FAROLES, porque mascota-empuja ya mira a la derecha (la
         excepcion del domino) y el espejo la volveria contra el vacio. */
      var mascotaHTML = function (sinflip) {
        return '<span class="revela-mascota' + (sinflip ? " revela-mascota--sinflip" : "") + '" aria-hidden="true"><img class="revela-mascota__fig" alt="" decoding="async"></span>';
      };
      var botonHTML = {
        makiwara: '<button class="revela-maki" type="button"><img class="revela-maki__fig" alt="" aria-hidden="true" decoding="async" src="' + RETOS_IMG + 'kata-makiwara.webp"><span class="revela-pista" aria-hidden="true"></span></button>',
        campana: '<button class="revela-obj revela-obj--campana" type="button"><span class="campana-cuerda" aria-hidden="true"></span><img class="campana-fig" alt="" aria-hidden="true" decoding="async" src="' + RETOS_IMG + 'campana-campana.webp"><span class="revela-pista" aria-hidden="true"></span></button>',
        tejas: '<button class="revela-obj revela-obj--tejas" type="button"><span class="tejas-pila" aria-hidden="true"></span><span class="revela-pista" aria-hidden="true"></span></button>',
        faroles: '<button class="revela-obj revela-obj--faroles" type="button"><span class="revela-pista" aria-hidden="true"></span></button>',
      };
      var izquierda = (vr === "makiwara" || vr === "faroles");
      var escena = el('<div class="revela-escena revela-escena--' + vr + '">'
        + (izquierda ? mascotaHTML(vr === "faroles") + botonHTML[vr] : botonHTML[vr] + mascotaHTML(true))
        + '<span class="revela-puntos" aria-hidden="true"></span>'
        /* reiniciar SOLO esta card (titular 2026-09-02): rehacer la secuencia
           de revelado desde cero, mismo escenario, texto y golpes ocultos */
        + '<button class="revela-reset" type="button"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 3v4h4"></path></svg></button>'
        + '</div>');
      var reset = escena.querySelector(".revela-reset");
      reset.setAttribute("aria-label", T.revelaReset);
      reset.setAttribute("title", T.revelaReset);
      reset.addEventListener("click", function () {
        /* la memoria de frases vuelve a cero y se re-pinta la MISMA card: el
           dispatch de renderCard vuelve a bloquear el paso (setNext(false))
           y renderRevela monta el escenario limpio con la variante ya
           sorteada (revelaVar[iTarjeta] se conserva) */
        revelas[iTarjeta] = 0;
        renderCard(c);
      });
      var mascota = escena.querySelector(".revela-mascota__fig");
      mascota.src = REPOSO;
      var boton = escena.querySelector("button");
      boton.setAttribute("aria-label", (T.revelaAria && T.revelaAria[vr]) || "");
      escena.querySelector(".revela-pista").textContent = (T.revelaPistas && T.revelaPistas[vr]) || "";
      var puntos = escena.querySelector(".revela-puntos");

      if (vr === "tejas") {
        var pila = escena.querySelector(".tejas-pila"), t;
        for (t = 0; t < frases.length; t++) {
          pila.appendChild(el('<span class="teja"><img alt="" decoding="async" src="' + RETOS_IMG + 'kata-teja.webp"></span>'));
        }
      }
      if (vr === "faroles") {
        var f;
        for (f = 0; f < frases.length; f++) {
          boton.insertBefore(el('<span class="farol"><img class="farol__base" alt="" decoding="async" src="' + RETOS_IMG + 'linterna-apagada.webp"><img class="farol__luz" alt="" decoding="async" src="' + RETOS_IMG + 'linterna-encendida.webp"></span>'), boton.querySelector(".revela-pista"));
        }
      }

      function despues(ms, fn) { setTimeout(function () { if (card.isConnected) fn(); }, ms); }
      function nota(f, g, extra) {
        if (!window.MFSonido || !MFSonido.nota) return;
        var o = { tipo: "triangle", attack: 8, decay: 160, gain: g || 0.16 };
        if (extra) { var k; for (k in extra) o[k] = extra[k]; }
        MFSonido.nota(f, o);
      }
      var NOTAS = [392, 523.25, 659.25];
      /* el do-re-mi de los elementos (titular 2026-09-02): cada acción suena
         un peldaño por encima de la anterior — avance que se oye, no sonido
         plano. Razones justas de do-re-mi: 1, 9/8, 5/4. */
      var ESCALA_FX = [1, 1.125, 1.25];

      function pintaPuntos(v) {
        var s2 = "", k;
        for (k = 0; k < frases.length; k++) s2 += '<span class="punto' + (k < v ? " is-on" : "") + '">●</span>';
        puntos.innerHTML = s2;
      }
      var lista = el('<div class="revela-frases" role="status" aria-live="polite"></div>');
      function muestra(k, sinAnimar) {
        var fr = el('<p class="revela-frase"></p>');
        fr.innerHTML = frases[k];
        if (sinAnimar) fr.classList.add("is-viva");
        lista.appendChild(fr);
        if (!sinAnimar) { void fr.offsetWidth; fr.classList.add("is-viva"); }
      }
      function chispas(objetivo, colores, n) {
        if (!window.MFJuice || !MFJuice.particulas || quieto) return;
        var re = escena.getBoundingClientRect();
        var ro = objetivo.getBoundingClientRect();
        MFJuice.particulas(escena, {
          x: ro.left - re.left + ro.width / 2, y: ro.top - re.top + ro.height * 0.4,
          n: n || 7, angulo: -90, dispersion: 65, colores: colores, forma: "chispa"
        });
      }
      /* `poseTurno` evita la carrera de los toques rapidos: cada pose programa
         su vuelta a reposo, y sin el turno el reset de un golpe viejo cortaba
         en seco la pose del golpe siguiente (visto al verificar). */
      var poseTurno = 0;
      function poseAccion(ruta, ms) {
        if (quieto) return;
        var turno = ++poseTurno;
        mascota.src = ruta;
        despues(ms || 700, function () { if (turno === poseTurno) mascota.src = REPOSO; });
      }
      /* el makiwara se va inclinando: nivel de inclinacion = frases reveladas */
      function inclinaMakiwara(nivel) {
        var fig = escena.querySelector(".revela-maki__fig");
        fig.classList.remove("is-inclina-1", "is-inclina-2");
        if (nivel >= frases.length) fig.classList.add("is-caido");
        else if (nivel >= 2) fig.classList.add("is-inclina-2");
        else if (nivel >= 1) fig.classList.add("is-inclina-1");
      }

      /* LA ACCION de cada variante. `v` = frases ya reveladas antes del toque;
         `ultima` = si este toque es el tercero. */
      var ACCION = {
        makiwara: function (v, ultima) {
          var ruta = golpeAleatorio();
          poseAccion(ruta);
          if (!sfx(FXG[ruta])) nota(NOTAS[Math.min(v, 2)], 0.14);
          sfx("fx-makiwara-toc", 70, { k: ESCALA_FX[Math.min(v, 2)] });
          escena.classList.add("is-tocado");   /* apaga el pulso de invitacion */
          if (window.MFJuice && MFJuice.respuesta && !quieto && !ultima) MFJuice.respuesta(boton);
          chispas(boton, ["#7a4a2a", "#e0b46b", "#f7f3ec"]);
          inclinaMakiwara(v + 1);
          if (ultima) {
            /* el poste cae del todo: golpe seco al tocar el suelo */
            despues(480, function () {
              if (!sfx("fx-makiwara-cae")) nota(98, 0.2, { tipo: "square", attack: 1, decay: 160 });
              if (window.MFSonido && MFSonido.vibrar) MFSonido.vibrar(20);
              chispas(boton, ["#e0b46b", "#c9b691"], 9);
            });
          }
        },
        campana: function (v, ultima) {
          var ruta = golpeAleatorio();
          poseAccion(ruta);
          sfx(FXG[ruta]);
          /* do-re-mi de bronce (titular 2026-09-02): cada golpe sube la escala */
          var DOREMI = [523.25, 587.33, 659.25];
          if (!ultima) {
            if (!sfx("fx-campana-talan", 70, { f0: DOREMI[Math.min(v, 2)] })) {
              nota([523.25, 587.33][Math.min(v, 1)], 0.2, { tipo: "sine", attack: 2, decay: 700 });
              nota([1046.5, 1174.66][Math.min(v, 1)], 0.06, { tipo: "sine", attack: 2, decay: 500 });
            }
            boton.classList.remove("is-tane");
            void boton.offsetWidth;
            boton.classList.add("is-tane");
          } else {
            /* la campanada del ultimo golpe —el mi de la escala— y el cordel cede */
            if (!sfx("fx-campana-talan", 70, { f0: DOREMI[2] })) nota(659.25, 0.2, { tipo: "sine", attack: 2, decay: 500 });
            boton.classList.add("is-caida");
            despues(430, function () {
              if (!sfx("fx-campana-cae")) {
                nota(155.56, 0.22, { tipo: "square", attack: 1, decay: 180 });
                nota(98, 0.14, { tipo: "square", attack: 1, decay: 160 });
              }
              if (window.MFSonido && MFSonido.vibrar) MFSonido.vibrar([18, 40, 12]);
              chispas(boton, ["#a8873c", "#e0b46b", "#f7f3ec"], 8);
            });
          }
        },
        tejas: function (v) {
          var ruta = golpeAleatorio();
          poseAccion(ruta);
          sfx(FXG[ruta]);
          if (!sfx("fx-teja-crack", 70, { k: ESCALA_FX[Math.min(v, 2)] })) {
            nota(155.56, 0.18, { tipo: "square", attack: 1, decay: 130 });
            nota(103.83, 0.12, { tipo: "square", attack: 1, decay: 110 });
          }
          var vivas = escena.querySelectorAll(".teja:not(.is-rota)");
          var teja = vivas[vivas.length - 1];
          if (teja) {
            chispas(teja, ["#b3541e", "#e0b46b", "#7a4a2a"]);
            teja.classList.add("is-rota");
            var src = teja.querySelector("img") ? teja.querySelector("img").src : "";
            teja.innerHTML = '<span class="teja-mitad teja-mitad--izq"><img alt="" src="' + src + '"></span>'
                           + '<span class="teja-mitad teja-mitad--der"><img alt="" src="' + src + '"></span>';
            despues(520, function () { if (teja.parentNode) teja.parentNode.removeChild(teja); });
          }
        },
        faroles: function (v) {
          /* señalar, no golpear (titular): mascota-empuja y la chispa nace en
             la punta del dedo y VIAJA hasta su farol; la luz y la nota llegan
             con ella */
          poseAccion(EMPUJA);
          sfx("fx-senala");
          var farol = escena.querySelectorAll(".farol")[v];
          function enciende() {
            if (farol) farol.classList.add("is-on");
            if (!sfx("fx-farol-enciende", 0, { k: ESCALA_FX[Math.min(v, 2)] })) nota([523.25, 659.25, 783.99][Math.min(v, 2)], 0.16, { attack: 4, decay: 500 });
            if (farol) chispas(farol, ["#ffd27a", "#ffb347"], 5);
          }
          if (quieto) { enciende(); return; }
          var caja = escena.querySelector(".revela-mascota");
          var re = escena.getBoundingClientRect();
          var rm = caja.getBoundingClientRect();
          var chispa = el('<span class="revela-chispa" aria-hidden="true"></span>');
          escena.appendChild(chispa);
          sfx("fx-chispa-viaje");
          var x0 = rm.right - re.left - 6, y0 = rm.top - re.top + rm.height * 0.40;
          var x1 = x0, y1 = y0;
          if (farol) {
            var rf = farol.getBoundingClientRect();
            x1 = rf.left - re.left + rf.width / 2 - 5;
            y1 = rf.top - re.top + rf.height * 0.55;
          }
          chispa.style.left = x0 + "px";
          chispa.style.top = y0 + "px";
          if (!chispa.animate) { chispa.remove(); enciende(); return; }
          var anim = chispa.animate(
            [{ left: x0 + "px", top: y0 + "px" }, { left: x1 + "px", top: y1 + "px" }],
            { duration: 280, easing: "ease-in" });
          anim.onfinish = function () {
            if (chispa.parentNode) chispa.parentNode.removeChild(chispa);
            if (card.isConnected) enciende();
          };
        },
      };

      function agotar() {
        boton.disabled = true;
        escena.classList.add("is-agotada");
        setNext(true);
      }

      /* REAPERTURA: el estado (frases, atrezo gastado, poste caido, campana en
         el suelo) se aplica ANTES de montar en el DOM — asi no corre ninguna
         transicion ni sonido. */
      var vistos = revelas[iTarjeta] || 0, k0;
      for (k0 = 0; k0 < vistos; k0++) muestra(k0, true);
      pintaPuntos(vistos);
      if (vistos > 0) {
        escena.classList.add("is-tocado");
        if (vr === "makiwara") inclinaMakiwara(vistos);
        if (vr === "campana" && vistos >= frases.length) boton.classList.add("is-caida");
        if (vr === "tejas") {
          var sobran = escena.querySelectorAll(".teja");
          for (k0 = 0; k0 < vistos && sobran.length; k0++) {
            var ult = escena.querySelectorAll(".teja");
            if (ult.length) ult[ult.length - 1].parentNode.removeChild(ult[ult.length - 1]);
          }
        }
        if (vr === "faroles") {
          for (k0 = 0; k0 < vistos; k0++) { var fx = escena.querySelectorAll(".farol")[k0]; if (fx) fx.classList.add("is-on"); }
        }
      }
      card.appendChild(escena);
      card.appendChild(lista);
      if (vistos >= frases.length) { agotar(); return; }

      boton.addEventListener("click", function () {
        var v = revelas[iTarjeta] || 0;
        if (v >= frases.length) return;
        revelas[iTarjeta] = v + 1;
        var ultima = (v + 1 >= frases.length);
        if (window.MFSonido && MFSonido.vibrar) MFSonido.vibrar(vr === "tejas" ? 14 : 8);
        ACCION[vr](v, ultima);
        muestra(v, quieto);
        pintaPuntos(v + 1);
        if (ultima) {
          if (window.MF) MF.track("revela", { item: data.id, data: { card: iTarjeta, variante: vr } });
          /* EL REMATE: tras el gesto (y la caida, si la hay), la victoria —
             por poseAccion, que respeta el turno y programa su propio reposo.
             1400 ms de salto: a 900 sabia a poco (titular 2026-09-02). El
             ¡tada! suena CON el salto; sin fabrica de fx, el beep de siempre
             en el toque. */
          if (!(window.MFSonido && MFSonido.fx)) nota(783.99, 0.18);
          if (!quieto) {
            despues(760, function () { poseAccion(VICTORIA, 1400); sfx("fx-victoria"); });
          } else {
            sfx("fx-victoria");
          }
          agotar();
        }
      });
    }

    /* ---------- Escena: VIÑETAS CON LA MASCOTA DE PROTAGONISTA (docs/08, F2) ----------
       Micro-historia de 1-3 viñetas. Cada una nombra un FONDO, un ANCLA (dónde
       apoya los pies la mascota, calibrado en escenas.json — la MISMA fuente
       que validó el build, inyectada en MF_CONFIG.escenas) y una POSE de la
       biblioteca. El lienzo entero es un botón: cada toque avanza — el fondo
       funde si cambia, la mascota VIAJA (transición CSS de left/bottom) o
       cambia de lámina, y el texto se renueva con el halo de la casa. Sin
       audio hablado (los pergaminos son la vía sonora) y sin XP: en la última
       viñeta el paso se libera. Memoria de pasada, como las demás cards. */
    /* LA VARIANTE VERTICAL DE LAS ESCENAS (titular 2026-09-03): en el teléfono
       el viewport da altura, así que la escena crece un 30 % (lienzo 15:13) y
       usa las láminas extendidas hacia arriba. Cambia el fondo, la altura del
       suelo y el % de la mascota —los tres los declara `escenas.json`—, para
       que la mascota siga midiendo los MISMOS píxeles que en escritorio. El
       umbral es el mismo 47rem del CSS: una sola verdad sobre «móvil». Vive
       AQUÍ, en el módulo, porque la precarga de láminas la consulta antes de
       que renderEscena llegue a su cuerpo. */
    var mqVertical = window.matchMedia
      ? window.matchMedia("(max-width: 47rem)") : { matches: false };

    function renderEscena(card, c, iTarjeta) {
      var vinetas = c.vinetas || [];
      var esc = cfg.escenas || {};
      var fondos = esc.fondos || {};
      var poses = esc.poses || {};
      /* Salvavidas de autor: sin viñetas, o con un fondo/ancla/pose que no
         está en la config (build.py ya avisó), la historia degrada a texto
         plano legible — nunca a un hueco que encierre al alumno. */
      var rota = !vinetas.length, kv, v0, f0;
      for (kv = 0; kv < vinetas.length; kv++) {
        v0 = vinetas[kv];
        f0 = fondos[v0.fondo];
        if (!f0 || !(f0.anclas || {})[v0.ancla] || !poses[v0.pose]) { rota = true; break; }
      }
      if (rota) {
        vinetas.forEach(function (v) { if (v.html) card.appendChild(el("<p>" + v.html + "</p>")); });
        setNext(true);
        return;
      }

      function rutaImg(rel) { return (cfg.assets || "") + "assets/img/" + rel; }
      /* todas las láminas de la historia se precargan al montar: un fondo que
         llega tarde a mitad de crossfade es un fogonazo, no una transición */
      vinetas.forEach(function (v) {
        var mv = fondos[v.fondo] && fondos[v.fondo].movil;
        var p1 = new Image();
        p1.src = rutaImg(mqVertical.matches && mv ? mv.ruta : fondos[v.fondo].ruta);
        var p2 = new Image(); p2.src = rutaImg(poses[v.pose]);
      });

      var lienzo = el('<button class="escena-lienzo" type="button"><img class="escena-fondo escena-fondo--a" alt="" decoding="async"><img class="escena-fondo escena-fondo--b" alt="" decoding="async"><img class="escena-mascota" alt="" decoding="async"><span class="escena-texto" aria-live="polite"></span><span class="escena-puntos" aria-hidden="true"></span><span class="escena-pista" aria-hidden="true"></span></button>');
      lienzo.setAttribute("aria-label", T.escenaSigue);
      var fondoA = lienzo.querySelector(".escena-fondo--a");
      var fondoB = lienzo.querySelector(".escena-fondo--b");
      var mascota = lienzo.querySelector(".escena-mascota");
      var texto = lienzo.querySelector(".escena-texto");
      var puntos = lienzo.querySelector(".escena-puntos");
      /* la pista visible de «esto se toca» (defecto visto por el titular: se
         quedó ante el Siguiente apagado); se va sola en la última viñeta */
      lienzo.querySelector(".escena-pista").textContent = T.escenaPista;
      card.appendChild(lienzo);
      /* Una lámina que aún no existe (el lote de fondos se genera aparte) no
         puede ensuciar la escena con el icono roto del navegador: se esconde
         al fallar y reaparece sola cuando un src posterior sí carga. */
      function ocultaSiFalla(img) {
        img.addEventListener("error", function () { img.style.visibility = "hidden"; });
        img.addEventListener("load", function () { img.style.visibility = ""; });
      }
      ocultaSiFalla(fondoA);
      ocultaSiFalla(fondoB);
      ocultaSiFalla(mascota);

      function nota(f, g) {
        if (window.MFSonido && MFSonido.nota) MFSonido.nota(f, { tipo: "triangle", attack: 8, decay: 160, gain: g || 0.12 });
      }
      function pintaPuntos(k) {
        /* mismo trato que en revela: puntos fijos de dos tonos */
        var s = "", x;
        for (x = 0; x < vinetas.length; x++) s += '<span class="punto' + (x <= k ? " is-on" : "") + '">●</span>';
        puntos.innerHTML = s;
      }
      /* ALTURA BASE de la mascota: 44 % del lienzo con e=1 — un solo número
         para todas las escenas (subió un 30 % desde el 34 % original por
         decisión del titular, 2026-09-02: a 34 la mascota se perdía en el
         fondo). La escala fina la sigue pudiendo matizar cada ancla. */
      var ALTO_BASE = 44;
      function usaVertical(v) {
        return !!(mqVertical.matches && fondos[v.fondo] && fondos[v.fondo].movil);
      }
      function variante(v) {
        return usaVertical(v) ? fondos[v.fondo].movil : null;
      }
      function coloca(v) {
        var ancla = fondos[v.fondo].anclas[v.ancla];
        var mov = variante(v);
        mascota.src = rutaImg(poses[v.pose]);
        mascota.style.left = ancla.x + "%";
        mascota.style.bottom = (100 - (mov && mov.y != null ? mov.y : ancla.y)) + "%";
        mascota.style.height = ((mov && mov.alto != null ? mov.alto : ALTO_BASE) * (ancla.e || 1)) + "%";
        /* las poses miran a la IZQUIERDA (canon de la kata); flip las vuelve.
           `scale` queda FUERA de la transición CSS: un espejo interpolado se
           vería como la mascota aplastándose por el centro.
           La VIÑETA manda sobre el ancla si trae su propia dirección (Tu
           Escuela, 2026-09-02): el ancla propone y el autor dispone. */
        var mira = typeof v.flip === "boolean" ? v.flip : !!ancla.flip;
        mascota.style.scale = mira ? "-1 1" : "1 1";
      }
      /* El crossfade de fondos usa DOS capas: el nuevo entra por la dormida y
         la transición de opacidad la hace CSS. Se compara el NOMBRE del fondo,
         no el src (el navegador lo absolutiza y nunca casaría con la ruta). */
      var fondoEnA = true, fondoActual = null;
      function pintaFondo(v) {
        if (v.fondo === fondoActual) return;
        var movF = variante(v);
        var ruta = rutaImg(movF ? movF.ruta : fondos[v.fondo].ruta);
        if (fondoActual === null) {
          fondoA.src = ruta; fondoA.style.opacity = "1"; fondoB.style.opacity = "0";
        } else {
          var detras = fondoEnA ? fondoB : fondoA;
          var delante = fondoEnA ? fondoA : fondoB;
          detras.src = ruta;
          detras.style.opacity = "1";
          delante.style.opacity = "0";
          fondoEnA = !fondoEnA;
        }
        fondoActual = v.fondo;
      }
      function muestra(k) {
        var v = vinetas[k];
        pintaFondo(v);
        coloca(v);
        texto.innerHTML = v.html || "";
        pintaPuntos(k);
        if (k >= vinetas.length - 1) {
          lienzo.classList.add("is-final");
          setNext(true);
        }
      }

      var k = escenasVistas[iTarjeta] || 0;
      if (k > vinetas.length - 1) k = vinetas.length - 1;
      escenasVistas[iTarjeta] = k;
      muestra(k);

      lienzo.addEventListener("click", function () {
        var ahora = escenasVistas[iTarjeta] || 0;
        if (ahora >= vinetas.length - 1) return;   /* la última viñeta se queda */
        escenasVistas[iTarjeta] = ahora + 1;
        /* cada cambio de viñeta pasa página (titular 2026-09-02) */
        if (!(window.MFSonido && MFSonido.fx && MFSonido.fx("fx-pagina"))) nota(ahora + 2 >= vinetas.length ? 523.25 : 392, 0.12);
        if (window.MFSonido && MFSonido.vibrar) MFSonido.vibrar(6);
        muestra(ahora + 1);
        if (ahora + 2 >= vinetas.length && window.MF) MF.track("escena", { item: data.id, data: { card: iTarjeta } });
      });
    }

    /* ---------- Examen con miniretos (§0.9) ----------
       La selección (3 preguntas, 3 juegos distintos, preferencias de ronda y
       determinismo por intento) vive entera en retos.js: aquí solo se pide el
       mazo y se REASIGNAN n y quizTotal, que son variables del closure fijadas
       una sola vez. Sin reasignarlas, un 3/3 perfecto se dividiría por el
       número de preguntas del mazo completo y suspendería.
       Si no hay motor, ni juegos suficientes, ni una sola asignación válida,
       vuelve el mazo entero y el examen corre exactamente como siempre. */
    function prepararExamen() {
      if (!isExam) return;
      /* siempre se parte del mazo original: el reintento no puede correr sobre
         los restos de la pasada anterior */
      cards = cardsOriginales.slice();
      /* rondas de la pasada anterior fuera: si el modo no se activa, nadie más
         las limpia y un montaje recibiría una ronda fantasma */
      sorteoCtx.rondas = {};
      if (window.MFRetos && MFRetos.seleccionarExamen) {
        try {
          var mazo = MFRetos.seleccionarExamen(cards, data, sorteoCtx);
          if (mazo && mazo.length) cards = mazo;
        } catch (err) { cards = cardsOriginales.slice(); }
      }
      n = cards.length;
      quizTotal = contarQuiz(cards);
    }

    /* ---------- Cierre ceremonial del examen (§0.9.5) ----------
       Un examen aprobado A MINIRETOS se despide con el sello de la casa, el
       gong y una vibración corta, ANTES de la pantalla final. Cuatro cautelas:
       · solo si el examen se ha jugado con miniretos (`sorteos` no vacío): un
         examen clásico se despide como siempre, sin estrenar ceremonias;
       · solo al aprobar, y con el MISMO umbral que usará finish() y el motor
         (progress.js), para que la ceremonia jamás contradiga al veredicto;
       · este es el cierre «SIN campana» de §0.9.5, es decir el de RESERVA: si la
         última ronda la jugó la campana y la ganó, la ceremonia YA sonó dentro
         del modal (su campanada con el momento Peggle) y aquí no se repite;
       · el confeti a pantalla completa NO se lanza aquí: lo sigue lanzando
         completeExam y solo si hay cinturón nuevo. */
    var ceremonia = false;

    /* ¿Cerró ya la campana? Se busca la ronda MÁS ALTA del intento (que es la
       tercera salvo en un examen de menos de tres preguntas) y se comprueba que
       su juego fue la campana y que esa ronda se ganó: una campanada fallada no
       es una ceremonia, y entonces el sello de la casa sigue haciendo falta.
       Cuando F0 escribió este cierre la campana no existía; hoy sí, y el gong
       genérico sería un segundo tañido para el mismo final. */
    function cerroLaCampana() {
      var pos, alta = -1, ultima = null;
      for (pos in sorteoCtx.rondas) {
        if (sorteoCtx.rondas[pos] > alta) { alta = sorteoCtx.rondas[pos]; ultima = pos; }
      }
      if (ultima === null) return false;
      var juego = sorteoCtx.sorteos[ultima];
      var res = sorteoCtx.resueltas[ultima];
      return !!(juego && juego.id === "campana" && res && res.ganado);
    }

    function cierreCeremonial(luego) {
      if (ceremonia) return;            /* doble clic en «Terminar»: una sola vez */
      var conRetos = examenConRetos();
      var score = quizTotal ? quizCorrect / quizTotal : 1;
      /* la ceremonia usa EL MISMO veredicto que finish(): con retos, 2 de 3 */
      if (!isExam || !conRetos || !examenAprobado(score)) { luego(); return; }
      if (cerroLaCampana()) { ceremonia = true; luego(); return; }
      ceremonia = true;
      nextBtn.disabled = true;          /* nada de adelantar la pantalla final a golpes */
      if (window.MFSonido) { MFSonido.gong(); MFSonido.vibrar([20, 40, 20]); }
      var esc = (window.MFJuice && MFJuice.preparar) ? MFJuice.preparar(stage) : null;
      if (!esc || !MFJuice.sello) { luego(); return; }
      /* El sello se queda un momento sobre la última tarjeta para que se lea; con
         movimiento reducido no hay espera ninguna y manda el texto de la pantalla
         final («Aprobado: 100 %»), que es lo que de verdad cuenta el resultado. */
      var pausa = MFJuice.reducido() ? 0 : 700;
      var entregado = false;
      function seguir() {
        if (entregado) return;
        entregado = true;
        if (esc.parentNode) esc.parentNode.removeChild(esc);
        luego();
      }
      /* Guarda de vida: pase lo que pase con el efecto, la pantalla final llega.
         Un adorno que se rompiera dejaría al alumno encerrado en la última
         tarjeta con el botón desactivado, sin examen entregado y sin síntoma. */
      setTimeout(seguir, 300 + pausa + 400);
      try {
        var p = MFJuice.sello(esc, T.retoExamSeal);
        if (p && typeof p.then === "function") p.then(function () { setTimeout(seguir, pausa); });
        else setTimeout(seguir, pausa);
      } catch (err) { seguir(); }
    }

    function finish() {
      pararAudio();
      stage.innerHTML = "";
      fill.style.width = "100%"; count.textContent = T.card.replace("{i}", n).replace("{n}", n);
      wrap.querySelector(".mission__actions").hidden = true;
      var total = earned + bonus;
      var html = '<article class="mcard mcard--done">';
      if (isExam) {
        var score = quizTotal ? quizCorrect / quizTotal : 1;
        /* EXAMEN 2 DE 3 (titular 2026-09-02): con retos manda la cuenta de
           superados, no el porcentaje. A progress.js —que solo entiende de
           score— se le entrega uno sintetico que respeta el veredicto: 1 al
           aprobar, la fraccion real al no llegar. El clasico sin motor sigue
           con su 75 % intacto. */
        var conRetos = examenConRetos();
        var aprobado = examenAprobado(score);
        var scoreEntrega = conRetos ? (aprobado ? 1 : (quizTotal ? examGanados / quizTotal : 0)) : score;
        var res = window.MF ? MF.completeExam(data.art, data.level, scoreEntrega, data.xp, data.belt) : { passed: aprobado, newBelt: false, unlocked: [] };
        var pct = Math.round(score * 100);
        html += '<div class="mcard__trophy" aria-hidden="true">' + (res.passed ? "🏆" : "🥋") + "</div><h3>" + T.examDone + "</h3>";
        var linea = conRetos
          ? (res.passed ? T.pasoRetos : T.falloRetos).replace("{g}", examGanados).replace("{n}", quizTotal)
          : (res.passed ? T.passed : T.failed).replace("{p}", pct);
        html += '<p class="mcard__score">' + linea + "</p>";
        if (res.passed && res.belt) html += '<div class="mcard__belt-award"><span class="belt-pill__swatch" style="--belt:' + res.belt.color + '"></span>' + T.beltNew + ": " + (ES ? "cinturón " + res.belt.name.toLowerCase() : res.belt.name + " belt") + "</div>";
        if (res.newBelt) html += '<div class="mcard__xp">+' + (data.xp || XP.exam || 50) + " XP</div>";
        /* el ¡yayyy! del coro corona también el examen aprobado (titular
           2026-09-02): junto al confeti del cinturón nuevo, como al completar
           una misión por primera vez — reaprobar sin cinturón nuevo no vitorea */
        if (res.newBelt && window.MFSonido && MFSonido.fx) MFSonido.fx("fx-yay");
        /* el teaser del siguiente nivel (antes vivía en la tarjeta de cierre,
           retirada 2026-09-02): solo al aprobar, junto a la puerta que abre */
        if (res.passed && data.siguiente) html += '<p class="mcard__siguiente">' + data.siguiente + "</p>";
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
        /* el ¡yayyy! del coro de niños en el evento especial (titular
           2026-09-02): solo en la PRIMERA vez — repasar no vitorea */
        if (!already && window.MFSonido && MFSonido.fx) MFSonido.fx("fx-yay");
      }
      html += "</article>";
      stage.appendChild(el(html));
      var rt = stage.querySelector("[data-retake]");
      if (rt) rt.addEventListener("click", function () {
        /* Nueva pasada: nueva semilla (otras preguntas y otros juegos), memoria
           del sorteo en blanco y mazo reconstruido desde el original. Sin
           prepararExamen() el segundo intento correría sobre los restos del
           primero y n/quizTotal se quedarían obsoletos: el score dividiría por
           el número equivocado. */
        sorteoCtx.intento++;
        sorteoCtx.resueltas = {};
        sorteoCtx.sorteos = {};
        examGanados = 0;   /* la cuenta del 2 de 3 arranca de cero */
        ceremonia = false;   /* la nueva pasada puede volver a merecer su cierre */
        prepararExamen();   /* re-selecciona sobre cardsOriginales y reasigna n y quizTotal */
        i = 0; reached = 0; quizCorrect = 0; bonus = 0;
        wrap.querySelector(".mission__actions").hidden = false;
        renderCard(cards[0]);
      });
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
    /* la página que pasa (titular 2026-09-02): cambiar de tarjeta suena a
       libro. Sin fábrica de fx no suena nada — nunca hubo beep aquí. */
    function fxPagina() { if (window.MFSonido && MFSonido.fx) MFSonido.fx("fx-pagina"); }
    function goNext() {
      if (nextBtn.disabled) return;
      i++;
      reached = Math.max(reached, i);
      if (i >= n) { cierreCeremonial(finish); } else { fxPagina(); renderCard(cards[i]); slide(1); }
    }
    function goPrev() {
      if (i <= 0 || !stage.querySelector(".mcard")) return;
      /* en la pantalla final ya no se retrocede: la misión está entregada */
      if (i >= n) return;
      i--;
      fxPagina();
      renderCard(cards[i]);
      if (i < reached) setNext(true);
      slide(-1);
    }
    nextBtn.addEventListener("click", goNext);
    prevBtn.addEventListener("click", goPrev);
    /* Con nombre y con guarda de vida: cada montaje (una demo de Tu Escuela,
       por ejemplo) registra el suyo, y el de un host ya desmontado se da de
       baja solo en su primera tecla — sin ella, dos demos seguidas moverían
       las tarjetas a pasos dobles. */
    function alTeclado(e) {
      if (!wrap.isConnected) { document.removeEventListener("keydown", alTeclado); return; }
      if (/TEXTAREA|INPUT/.test((document.activeElement || {}).tagName || "")) return;
      if (e.key === "ArrowRight") { if (!nextBtn.disabled) goNext(); }
      else if (e.key === "ArrowLeft") goPrev();
    }
    document.addEventListener("keydown", alTeclado);

    /* Swipe: izquierda avanza (si la tarjeta lo permite), derecha retrocede.
       Solo gestos claramente horizontales, para no pelearse con el scroll. */
    var sw = null;
    stage.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      /* Sobre el reproductor NO hay swipe: al tocar sus controles se cambiaba
         de tarjeta sin querer y el audio volvía a empezar (2026-08-26). Lo
         mismo con cualquier zona de arrastre de un minireto ([data-mfdrag]):
         arrastrar una pieza jamás puede cambiar de tarjeta. */
      if (e.target.closest && e.target.closest(".scroll-audio, [data-mfdrag]")) { sw = null; return; }
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

  /* DELEGADO en document (antes se enganchaba host a host en carga): el evento
     mf:content viaja con bubbles, así que también arrancan los hosts creados
     DESPUÉS — como la baraja demo de Tu Escuela, que monta un host nuevo por
     partida. Para las páginas de misión de siempre no cambia nada. */
  document.addEventListener("mf:content", function (e) {
    var host = e.target;
    if (!host || !host.matches) return;
    if (!host.matches("[data-gate][data-kind='mission'], [data-gate][data-kind='exam']")) return;
    start(host, e.detail);
  });
})();

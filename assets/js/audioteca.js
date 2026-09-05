/* MenteFu / MindFu — sala de pergaminos del curso (lista tipo podcast).

   Recibe mf:content (auth.js) con {items} —los pergaminos del arte EN EL ORDEN
   del entrenamiento— y pinta la lista. Solo muestra el curso de esta sala.

   Cada fila es LA MISMA tarjeta de pergamino que se ve dentro de una misión
   (`.scroll-link`, mission.js): un pergamino debe reconocerse igual venga de
   donde venga (titular 2026-08-28). Al pulsarla se despliega el pergamino
   flotante —con su minipodcast dentro— sin sacar al alumno de la lista. Lo
   propio de la sala se queda: el agrupado por niveles con su cinturón, el
   contador, los filtros y el orden del entrenamiento. */
(function () {
  "use strict";
  var el = MFDom.el, esc = MFDom.esc;   /* dom.js: una sola copia para todos */
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var T = ES ? {
    nivel: "Nivel {n}", minutos: "{n} min", xp: "+{n} XP", hecho: "Completado",
    vacio: "Todavía no hay pergaminos en esta sala.",
    resumen: "{hechos} de {total} completados · {audios} con audio",
    filtroTodos: "Todos", filtroPendientes: "Pendientes", filtroAudio: "Con audio",
    conAudio: "leer o escuchar", sinAudio: "solo lectura",
  } : {
    nivel: "Level {n}", minutos: "{n} min", xp: "+{n} XP", hecho: "Completed",
    vacio: "No scrolls in this room yet.",
    resumen: "{hechos} of {total} completed · {audios} with audio",
    filtroTodos: "All", filtroPendientes: "Pending", filtroAudio: "With audio",
    conAudio: "read or listen", sinAudio: "reading only",
  };


  function start(host, data) {
    var body = host.querySelector("[data-gated-body]");
    var items = data.items || [];
    var art = data.art;
    var filtro = "todos";

    function hecho(it) {
      if (!window.MF) return false;
      var a = MF.art(art);
      return !!(a.scrolls[it.id] || a.tools[it.id]);
    }

    var wrap = el('<div class="audioteca">' +
      '<div class="audioteca__top"><p class="audioteca__resumen"></p>' +
      '<div class="audioteca__filtros" role="group">' +
        '<button class="audioteca__filtro is-on" type="button" data-f="todos">' + T.filtroTodos + '</button>' +
        '<button class="audioteca__filtro" type="button" data-f="pendientes">' + T.filtroPendientes + '</button>' +
        '<button class="audioteca__filtro" type="button" data-f="audio">' + T.filtroAudio + '</button>' +
      '</div></div>' +
      '<ol class="audioteca__lista"></ol></div>');
    body.appendChild(wrap);
    var lista = wrap.querySelector(".audioteca__lista");
    var resumen = wrap.querySelector(".audioteca__resumen");

    function pintarResumen() {
      var hechos = items.filter(hecho).length;
      var audios = items.filter(function (x) { return !!x.audio; }).length;
      resumen.textContent = T.resumen.replace("{hechos}", hechos).replace("{total}", items.length).replace("{audios}", audios);
    }

    function visible(it) {
      if (filtro === "pendientes") return !hecho(it);
      if (filtro === "audio") return !!it.audio;
      return true;
    }

    function pintar() {
      lista.innerHTML = "";
      var nivelPintado = null;
      items.forEach(function (it) {
        if (!visible(it)) return;
        if (it.level && it.level !== nivelPintado) {
          nivelPintado = it.level;
          /* el título del nivel ya empieza por «Nivel N —»: el chip lo dice,
             así que aquí se queda solo el tema */
          var tema = String(it.levelTitle || "").replace(/^(nivel|level)\s*\d+\s*[—–-]\s*/i, "");
          /* el cinturón ilustrado del nivel, el mismo que en el resto del sitio;
             si faltara la lámina, queda la pastilla de color de siempre */
          var cinturon = (window.MF && it.belt) ? MF.artImg("belt", it.belt, "audioteca__cinturon") : "";
          var sep = el('<li class="audioteca__nivel">' +
            (cinturon || '<span class="belt-chip"' + (it.belt ? ' style="--belt:var(--belt-' + esc(it.belt) + ')"' : "") +
              '><span class="belt-chip__swatch" aria-hidden="true"></span></span>') +
            '<span class="audioteca__nivel-n">' + T.nivel.replace("{n}", it.level) + "</span>" +
            '<span class="audioteca__nivel-titulo">' + esc(tema) + "</span></li>");
          lista.appendChild(sep);
        }
        /* La línea de meta dice de qué misión viene, lo que cuesta, lo que paga
           y CÓMO se puede hacer. Ese último dato pasa a ser imprescindible
           desde que el reproductor vive dentro del pergamino: si no lo dijera
           aquí, el audio quedaría escondido tras un clic sin anunciarse. */
        var meta = esc(it.mission) + " · " + T.minutos.replace("{n}", it.minutes) +
          " · " + T.xp.replace("{n}", it.xp) + " · " + (it.audio ? T.conAudio : T.sinAudio);
        /* misma estructura que mission.js: icono, (título + meta) y sello */
        var fila = el('<li class="audioteca__fila" data-item="' + esc(it.id) + '"></li>');
        var link = el('<a class="scroll-link" href="' + esc(it.href) + '">' +
          '<span class="scroll-link__icon" aria-hidden="true">📜</span>' +
          '<span><span class="scroll-link__title"></span>' +
          '<span class="scroll-link__meta">' + meta + "</span></span>" +
          '<span class="scroll-link__seal" hidden>✓ ' + T.hecho + "</span></a>");
        link.querySelector(".scroll-link__title").textContent = it.title;
        fila.appendChild(link);
        var sellar = function () {
          if (!hecho(it)) return;
          link.classList.add("is-done");
          link.querySelector(".scroll-link__seal").hidden = false;
        };
        sellar();
        /* leer sin salir de la sala: el pergamino se despliega flotando encima
           y al cerrarlo la lista sigue donde estaba, con su filtro y su sitio */
        /* el pergamino SIEMPRE en su modal flotante, jamás navegando por un
           fallo (auditoría 2026-09-02): se intercepta aunque MFPergamino aún
           no exista en este frame —se comprueba en el click— */
        if (it.kind !== "tool") {
          link.addEventListener("click", function (e) {
            /* con Ctrl/Cmd/Mayús el enlace sigue siendo un enlace: abrir en otra
               pestaña debe funcionar */
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
            e.preventDefault();
            e.stopPropagation();
            if (!window.MFPergamino) return;
            MFPergamino.abrir({
              id: it.id, art: art, xp: it.xp, kind: it.kind, titulo: it.title,
              href: it.href,
              /* el minipodcast viaja DENTRO del pergamino, igual que en la
                 tarjeta de misión: escucharlo y leerlo dejan de ser dos sitios */
              audio: it.audio || null,
              hecho: function () { return hecho(it); },
              alCompletar: function () { sellar(); pintarResumen(); },
              origen: link,
            });
          });
        }
        lista.appendChild(fila);
      });
      if (!lista.children.length) lista.appendChild(el('<li class="muted">' + T.vacio + "</li>"));
      pintarResumen();
    }

    wrap.querySelectorAll("[data-f]").forEach(function (b) {
      b.addEventListener("click", function () {
        filtro = b.getAttribute("data-f");
        wrap.querySelectorAll("[data-f]").forEach(function (x) { x.classList.toggle("is-on", x === b); });
        /* ya no hace falta callar nada al filtrar: el reproductor dejó de vivir
           en la fila y ahora se va con el pergamino cuando se cierra */
        pintar();
        if (window.MF) MF.track("audioteca_filter", { art: art, data: { filtro: filtro } });
      });
    });

    pintar();
    if (window.MF) MF.track("audioteca_open", { art: art, data: { items: items.length } });
  }

  document.querySelectorAll("[data-gate][data-kind='audioteca']").forEach(function (host) {
    host.addEventListener("mf:content", function (e) { start(host, e.detail); });
  });
})();

/* MenteFu / MindFu — sala de pergaminos del curso (lista tipo podcast).

   Recibe mf:content (auth.js) con {items} —los pergaminos del arte EN EL ORDEN
   del entrenamiento— y pinta la lista: cada pieza se puede escuchar aquí mismo
   (mismo reproductor y mismo XP que en la misión, audio.js) o abrir para leerla.
   Solo muestra el curso de esta sala. */
(function () {
  "use strict";
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var T = ES ? {
    read: "Leer", nivel: "Nivel {n}", minutos: "{n} min", xp: "+{n} XP", hecho: "Completado",
    vacio: "Todavía no hay pergaminos en esta sala.",
    resumen: "{hechos} de {total} completados · {audios} con audio",
    filtroTodos: "Todos", filtroPendientes: "Pendientes", filtroAudio: "Con audio",
    sinAudio: "Solo lectura",
  } : {
    read: "Read", nivel: "Level {n}", minutos: "{n} min", xp: "+{n} XP", hecho: "Completed",
    vacio: "No scrolls in this room yet.",
    resumen: "{hechos} of {total} completed · {audios} with audio",
    filtroTodos: "All", filtroPendientes: "Pending", filtroAudio: "With audio",
    sinAudio: "Reading only",
  };

  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

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
      items.forEach(function (it, n) {
        if (!visible(it)) return;
        if (it.level && it.level !== nivelPintado) {
          nivelPintado = it.level;
          /* el título del nivel ya empieza por «Nivel N —»: el chip lo dice,
             así que aquí se queda solo el tema */
          var tema = String(it.levelTitle || "").replace(/^(nivel|level)\s*\d+\s*[—–-]\s*/i, "");
          var sep = el('<li class="audioteca__nivel"><span class="belt-chip"' + (it.belt ? ' style="--belt:var(--belt-' + esc(it.belt) + ')"' : "") + '>' +
            '<span class="belt-chip__swatch" aria-hidden="true"></span>' + T.nivel.replace("{n}", it.level) + "</span>" +
            '<span class="audioteca__nivel-titulo">' + esc(tema) + "</span></li>");
          lista.appendChild(sep);
        }
        var fila = el('<li class="audioteca__item' + (hecho(it) ? " is-done" : "") + '" data-item="' + esc(it.id) + '">' +
          '<div class="audioteca__ficha">' +
            '<span class="audioteca__n">' + (n + 1) + "</span>" +
            '<div class="audioteca__texto">' +
              '<h3 class="audioteca__titulo">' + esc(it.title) + "</h3>" +
              '<p class="audioteca__sumario">' + esc(it.summary || "") + "</p>" +
              '<p class="audioteca__meta">' + esc(it.mission) + " · " + T.minutos.replace("{n}", it.minutes) +
                " · " + (it.audio ? T.xp.replace("{n}", it.xp) : T.sinAudio) + "</p>" +
            "</div>" +
            '<div class="audioteca__acciones">' +
              '<a class="btn btn--ghost btn--sm" href="' + esc(it.href) + '">' + T.read + "</a>" +
              '<span class="audioteca__sello" hidden>✓ ' + T.hecho + "</span>" +
            "</div>" +
          "</div></li>");
        if (hecho(it)) fila.querySelector(".audioteca__sello").hidden = false;
        if (it.audio && window.MFAudio) {
          fila.appendChild(MFAudio.montar({
            src: it.audio, item: it.id, art: art, xp: it.xp, kind: it.kind,
            hecho: function () { return hecho(it); },
            alTerminar: function () {
              fila.classList.add("is-done");
              fila.querySelector(".audioteca__sello").hidden = false;
              pintarResumen();
            },
          }));
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
        if (window.MFAudio) MFAudio.parar();
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

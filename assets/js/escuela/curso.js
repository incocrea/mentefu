/* Tu Escuela — el player dinámico de cursos (/curso/, F6).
 *
 * Cualquier curso publicado se juega AQUÍ sin página estática: el mapa sale
 * de la fila `escuela-curso` y cada misión monta el mission.js REAL con su
 * fila content (XP y cinturones de verdad — incluido el cinturón repartido
 * que viaje en data.belt). Un curso privado pide su código de acceso una vez
 * (escuela_desbloquear) y queda desbloqueado para esa cuenta.
 *
 * En modo local (dev) todo sale de escuela-fuente.json vía el ensamblador.
 * Rutas: #/<clave> mapa · #/<clave>/m/<id> misión · sufijo /demo = sin XP.
 */
(function () {
  "use strict";
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang !== "en";

  /* El idioma del CONTENIDO es del curso, no de la página (docs/11): el
     alumno elige entre los idiomas disponibles del curso y su elección se
     recuerda por curso. Arranca en el idioma de la página si el curso lo
     tiene; si no, en el idioma base del curso. */
  var idiomaCurso = null;
  function clavePref(clave) { return "mf.curso.idioma." + clave; }
  function idiomaDe(clave, ind) {
    var lista = (ind && ind.idiomas && ind.idiomas.length) ? ind.idiomas : [cfg.lang];
    var guardado = null;
    try { guardado = localStorage.getItem(clavePref(clave)); } catch (e) { /* nada */ }
    if (guardado && lista.indexOf(guardado) >= 0) return guardado;
    if (lista.indexOf(cfg.lang) >= 0) return cfg.lang;
    return (ind && ind.idioma_base && lista.indexOf(ind.idioma_base) >= 0) ? ind.idioma_base : lista[0];
  }

  var T = ES ? {
    cargando: "Abriendo el curso…",
    sinCurso: "Este enlace no trae curso. Busca el tuyo en el directorio.",
    directorio: "Ir al directorio",
    candado: "Este curso es privado.",
    candadoNota: "Pídele el código de acceso a su maestro. Solo lo necesitas una vez.",
    entrar: "Entrar",
    codigoMal: "Ese código no abre esta puerta. Revísalo con el maestro.",
    error: "No se pudo abrir el curso.",
    reintentar: "Reintentar",
    volver: "‹ Mapa del curso",
    misiones: "misiones", tarjetas: "tarjetas", examen: "Examen",
    pergaminos: "Pergaminos", demo: "DEMO — sin XP",
    hecho: "completada", cerrar: "Cerrar",
    palabras: "palabras", minutos: "min",
  } : {
    cargando: "Opening the course…",
    sinCurso: "This link carries no course. Find yours in the directory.",
    directorio: "Go to the directory",
    candado: "This course is private.",
    candadoNota: "Ask its master for the access code. You only need it once.",
    entrar: "Enter",
    codigoMal: "That code does not open this door. Check it with the master.",
    error: "The course could not be opened.",
    reintentar: "Retry",
    volver: "‹ Course map",
    misiones: "missions", tarjetas: "cards", examen: "Exam",
    pergaminos: "Scrolls", demo: "DEMO — no XP",
    hecho: "completed", cerrar: "Close",
    palabras: "words", minutos: "min",
  };

  var BELT_COLOR = {};
  (cfg.belts || []).forEach(function (b) { BELT_COLOR[b.key] = b.color; });

  var raiz = null;
  var indice = null;          /* la fila escuela-curso del curso abierto */
  var claveAbierta = null;
  var fuenteLocal = null;     /* solo dev */
  var esLocal = !(cfg.gate && window.SB && SB.enabled());
  var urlAMision = {};        /* url → id, para interceptar los enlaces */

  function esc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function el(html) {
    var d = document.createElement("div");
    d.innerHTML = html;
    return d.firstElementChild;
  }

  function ruta() {
    var p = (location.hash || "#/").replace(/^#\/?/, "").split("/").filter(Boolean);
    var demo = p[p.length - 1] === "demo";
    if (demo) p.pop();
    if (!p.length) return { v: "vacio" };
    if (p[1] === "m" && p[2]) return { v: "mision", clave: p[0], id: p[2], demo: demo };
    return { v: "mapa", clave: p[0], demo: demo };
  }

  /* ------------------------------------------------------------- datos ---- */

  function cargarLocal() {
    if (fuenteLocal) return Promise.resolve(fuenteLocal);
    return fetch(cfg.prefix + "escuela-fuente.json").then(function (r) {
      if (!r.ok) throw new Error("fuente " + r.status);
      return r.json();
    }).then(function (f) {
      /* dev: los cursos fundados y los borradores del panel viven en
         localStorage — el player local también los juega */
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i) || "";
          if (k.indexOf("mf.escuela.borrador.cursoNuevo:") === 0) {
            f.cursos[k.slice("mf.escuela.borrador.cursoNuevo:".length)] = JSON.parse(localStorage.getItem(k));
          }
        }
        for (var clave in f.cursos) {
          f.cursos[clave].misiones.forEach(function (m, ix) {
            var crudo = localStorage.getItem("mf.escuela.borrador.mision:" + m.id);
            if (crudo) f.cursos[clave].misiones[ix] = JSON.parse(crudo);
          });
        }
      } catch (e) { /* nada */ }
      fuenteLocal = f;
      return f;
    });
  }

  function cargarIndice(clave) {
    if (esLocal) {
      return cargarLocal().then(function (f) {
        var curso = f.cursos[clave];
        if (!curso) throw new Error("no-existe");
        /* los disponibles se miran en la fuente misma: base + añadidos CON capa */
        var base = MFEscuela.compilar.baseDe(curso);
        var lista = MFEscuela.compilar.idiomasDe(curso).filter(function (lg) {
          return lg === base || curso.misiones.some(function (m) { return !!m[lg]; });
        });
        idiomaCurso = idiomaDe(clave, { idiomas: lista, idioma_base: base });
        var ind = MFEscuela.compilar.armarIndiceCurso(f, clave, idiomaCurso);
        if (!ind) throw new Error("no-existe");
        return ind;
      });
    }
    /* Con gate: el índice del idioma preferido; si no está (pref vieja), cae
       al de la página y de ahí a lo que declare el propio índice. */
    var pref = idiomaDe(clave, null);
    idiomaCurso = pref;
    return MFAuth.loadContent(pref + ":curso-" + clave).then(function (data) {
      if (!data) throw new Error("candado");
      idiomaCurso = idiomaDe(clave, data);
      if (idiomaCurso === pref) return data;
      return MFAuth.loadContent(idiomaCurso + ":curso-" + clave).then(function (d2) { return d2 || data; });
    }, function () { throw new Error("candado"); });
  }

  function cargarMision(id) {
    var lg = idiomaCurso || cfg.lang;
    if (esLocal) {
      return cargarLocal().then(function (f) {
        return MFEscuela.compilar.armarMisionDemo(f, claveAbierta, lg, id, cfg.prefix, cfg.assets);
      });
    }
    return MFAuth.loadContent(lg + ":" + id);
  }

  /* --------------------------------------------------------- pantallas ---- */

  function pintar(html) { raiz.innerHTML = html; window.scrollTo(0, 0); }

  function vVacio() {
    pintar('<div class="escuela-pronto"><h2>' + esc(T.sinCurso) + "</h2>" +
      '<a class="btn btn--primary" href="' + esc(cfg.prefix + (ES ? "cursos/" : "courses/")) + '">' + esc(T.directorio) + "</a></div>");
  }

  function vCandado(clave, mal) {
    pintar('<div class="escuela-pronto"><span class="escuela-sello">印 🔒</span>' +
      "<h2>" + esc(T.candado) + "</h2><p>" + esc(T.candadoNota) + "</p>" +
      (mal ? '<p class="escuela-avisos">⚠ ' + esc(T.codigoMal) + "</p>" : "") +
      '<div class="curso-candado"><input class="curso-candado__campo" type="text" maxlength="40" autocomplete="off">' +
      '<button type="button" class="btn btn--primary" data-desbloquear>' + esc(T.entrar) + "</button></div></div>");
    raiz.querySelector("[data-desbloquear]").addEventListener("click", function () {
      var codigo = raiz.querySelector(".curso-candado__campo").value.trim();
      if (!codigo) return;
      SB.rpc("escuela_desbloquear", { p_clave: clave, p_codigo: codigo }).then(function () {
        abrir(clave);
      }, function () { vCandado(clave, true); });
    });
  }

  function hechoDe(m, nivel) {
    if (!window.MF) return false;
    var a = MF.art(claveAbierta);
    if (m.kind === "exam") return !!(a.exams[nivel] && a.exams[nivel].passed);
    return !!a.missions[m.id];
  }

  function vMapa() {
    var r = ruta();
    var niveles = indice.niveles.map(function (nv) {
      var color = BELT_COLOR[nv.belt] || "#888";
      var filas = nv.misiones.map(function (m) {
        var hecho = hechoDe(m, nv.n);
        return '<a class="escuela-fila" href="#/' + esc(claveAbierta) + "/m/" + esc(m.id) + (r.demo ? "/demo" : "") + '">' +
          '<span class="escuela-fila__icono">' + (m.kind === "exam" ? "🏮" : "🎴") + "</span>" +
          '<span class="escuela-fila__tit">' + esc(m.title) + "</span>" +
          (hecho ? '<span class="escuela-ok" title="' + esc(T.hecho) + '">✓</span>' : "") +
          '<span class="escuela-fila__datos">' + m.cards + " " + T.tarjetas + "</span></a>";
      }).join("");
      return '<section class="curso-nivel"><header class="escuela-hero escuela-hero--nivel">' +
        '<span class="escuela-cinta escuela-cinta--grande" style="--belt:' + esc(color) + '"></span>' +
        "<h3>" + esc(nv.title) + "</h3></header>" +
        '<div class="escuela-lista">' + filas + "</div></section>";
    }).join("");
    var pergs = "";
    if (indice.pergaminos.length) {
      pergs = '<section class="curso-nivel"><h3 class="escuela-h2">📜 ' + esc(T.pergaminos) + "</h3>" +
        '<div class="escuela-lista">' + indice.pergaminos.map(function (p) {
          return '<button type="button" class="escuela-fila" data-abre-perg="' + esc(p.id) + '">' +
            '<span class="escuela-fila__icono">' + (p.layout === "tool" ? "🛠️" : "📜") + "</span>" +
            '<span class="escuela-fila__tit">' + esc(p.title) + "</span>" +
            '<span class="escuela-fila__datos">' + p.words + " " + T.palabras + " · " +
            Math.max(1, Math.round((p.words || 200) / 200)) + " " + T.minutos + "</span></button>";
        }).join("") + "</div></section>";
    }
    /* El selector de idioma del curso: solo si hay más de uno disponible. */
    var selIdiomas = "";
    if ((indice.idiomas || []).length > 1) {
      selIdiomas = '<span class="curso-idiomas">' + indice.idiomas.map(function (lg) {
        return '<button type="button" class="escuela-idioma' + (lg === idiomaCurso ? " is-on" : "") +
          '" data-idioma-curso="' + esc(lg) + '" title="' +
          esc((MFEscuela.compilar.IDIOMAS || {})[lg] || lg) + '">' + lg.toUpperCase() + "</button>";
      }).join("") + "</span>";
    }
    pintar('<header class="escuela-hero"><h2>' + esc(indice.title) + "</h2>" +
      '<span class="escuela-chip">' + esc((indice.categoria || "").toUpperCase()) + "</span>" +
      selIdiomas +
      (r.demo ? '<span class="escuela-sello">' + esc(T.demo) + "</span>" : "") +
      (indice.description ? '<p class="escuela-hero__lead">' + esc(indice.description) + "</p>" : "") +
      "</header>" + niveles + pergs);
  }

  var MFreal = null;
  function ponerDemo() {
    if (MFreal) return;
    MFreal = window.MF;
    window.MF = {
      track: function () {}, reflect: function () {}, confetti: function () {},
      scrollRead: function () {}, toolUsed: function () {},
      art: function () { return { missions: {}, scrolls: {}, tools: {}, belts: {}, exams: {} }; },
      state: function () { return { reflections: {} }; },
      completeMission: function () { return []; },
      completeExam: function (art, level, score) {
        var p = score >= ((cfg.xp && cfg.xp.exam_pass) || 0.75);
        return { passed: p, newBelt: p, belt: null, unlocked: [] };
      },
      replayKey: function () { return "demo"; }, replayXP: function () { return 0; },
      replayWon: function () { return false; }, replayPaid: function () { return false; },
    };
  }
  function quitarDemo() {
    if (MFreal) { window.MF = MFreal; MFreal = null; }
  }

  function vMision(id, demo) {
    pintar('<div class="curso-mision">' +
      '<a class="escuela-chip escuela-chip--ed" href="#/' + esc(claveAbierta) + (demo ? "/demo" : "") + '">' + esc(T.volver) + "</a>" +
      (demo ? ' <span class="escuela-sello">' + esc(T.demo) + "</span>" : "") +
      '<div class="curso-mision__host">' + (window.MFCargador ? MFCargador(T.cargando) : "…") + "</div></div>");
    cargarMision(id).then(function (data) {
      if (!data) { pintar('<div class="escuela-pronto"><h2>' + esc(T.error) + "</h2></div>"); return; }
      var host = el('<div data-gate data-kind="' + esc(data.kind) + '"><div data-gated-body></div></div>');
      var caja = raiz.querySelector(".curso-mision__host");
      caja.innerHTML = "";
      caja.appendChild(host);
      if (demo) ponerDemo(); else quitarDemo();
      host.dispatchEvent(new CustomEvent("mf:content", { detail: data, bubbles: true }));
    }, function () {
      pintar('<div class="escuela-pronto"><h2>' + esc(T.error) + "</h2>" +
        '<button type="button" class="btn btn--primary" data-reintenta>' + esc(T.reintentar) + "</button></div>");
      raiz.querySelector("[data-reintenta]").addEventListener("click", rutear);
    });
  }

  function abrirPergamino(id) {
    var p = null;
    indice.pergaminos.forEach(function (x) { if (x.id === id) p = x; });
    if (!p) return;
    if (!esLocal && window.MFPergamino) {
      MFPergamino.abrir({
        id: p.id, art: claveAbierta, xp: p.xp, kind: p.layout === "tool" ? "tool" : "scroll",
        titulo: p.title, href: cfg.prefix + p.url,
        audio: p.audio ? cfg.assets + "assets/audio/" + cfg.lang + "/" + p.id + ".mp3" : null,
      });
      return;
    }
    /* dev local: el cuerpo sale de la fuente, pero se lee en el MISMO lector
       del curso (MFPergamino) — nunca en una ventana aparte. */
    cargarLocal().then(function (f) {
      var curso = f.cursos[claveAbierta];
      var ent = null;
      curso.pergaminos.forEach(function (x) { if (x.id === id) ent = x; });
      var capa = ent && (ent[cfg.lang] || ent.es);
      if (!capa || !window.MFPergamino) return;
      MFPergamino.abrir({
        id: ent.id, art: claveAbierta, xp: p.xp,
        kind: ent.layout === "tool" ? "tool" : "scroll", titulo: capa.title,
        contenido: { id: ent.id, kind: ent.layout, title: capa.title,
                     html: MFEscuela.compilar.resolver(capa.cuerpo.html, cfg.prefix, cfg.prefix),
                     xp: p.xp },
        audio: p.audio ? cfg.assets + "assets/audio/" + cfg.lang + "/" + ent.id + ".mp3" : null,
      });
    });
  }

  /* Los enlaces del contenido que apuntan a misiones o niveles DEL CURSO se
     enrutan dentro del player (las páginas estáticas de un curso de maestro
     no existen); el resto navega como siempre. */
  function interceptar(e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || !raiz.contains(a)) return;
    var href = a.getAttribute("href") || "";
    if (/^(https?:|#|mailto:)/.test(href)) return;
    for (var url in urlAMision) {
      if (url && href.indexOf(url) >= 0) {
        e.preventDefault();
        location.hash = "#/" + claveAbierta + "/m/" + urlAMision[url] + (ruta().demo ? "/demo" : "");
        return;
      }
    }
    for (var i = 0; i < indice.niveles.length; i++) {
      var nu = indice.niveles[i].url;
      if (nu && href.indexOf(nu) >= 0) {
        e.preventDefault();
        location.hash = "#/" + claveAbierta + (ruta().demo ? "/demo" : "");
        return;
      }
    }
  }

  /* ------------------------------------------------------------- montaje -- */

  function rutear() {
    var r = ruta();
    if (r.v === "vacio") { vVacio(); return; }
    if (r.clave !== claveAbierta || !indice) { abrir(r.clave); return; }
    if (r.v === "mision") vMision(r.id, r.demo);
    else { quitarDemo(); vMapa(); }
  }

  function abrir(clave) {
    claveAbierta = clave;
    indice = null;
    pintar(window.MFCargador ? MFCargador(T.cargando) : esc(T.cargando));
    cargarIndice(clave).then(function (ind) {
      indice = ind;
      urlAMision = {};
      ind.niveles.forEach(function (nv) {
        nv.misiones.forEach(function (m) { if (m.url) urlAMision[m.url] = m.id; });
      });
      rutear();
    }, function (err) {
      if (!esLocal && String(err && err.message).indexOf("candado") >= 0) vCandado(clave, false);
      else vVacio();
    });
  }

  document.addEventListener("mf:content", function (e) {
    var host = e.target;
    if (!host || !host.matches || !host.matches("[data-gate][data-kind='curso']")) return;
    var cuerpo = host.querySelector("[data-gated-body]") || host;
    cuerpo.innerHTML = '<div class="escuela" data-curso-player></div>';
    raiz = cuerpo.querySelector("[data-curso-player]");
    raiz.addEventListener("click", function (e2) {
      var b = e2.target.closest && e2.target.closest("[data-abre-perg]");
      if (b) { abrirPergamino(b.getAttribute("data-abre-perg")); return; }
      /* Cambiar el idioma del curso: se recuerda POR CURSO y se recarga el
         índice en el idioma nuevo (docs/11 F4). El progreso no se toca — va
         por ids, que son los mismos en todos los idiomas. */
      var lgB = e2.target.closest && e2.target.closest("[data-idioma-curso]");
      if (lgB) {
        try { localStorage.setItem(clavePref(claveAbierta), lgB.getAttribute("data-idioma-curso")); } catch (err) { /* nada */ }
        indice = null;
        abrir(claveAbierta);
        return;
      }
      interceptar(e2);
    });
    window.addEventListener("hashchange", rutear);
    rutear();
  });
})();

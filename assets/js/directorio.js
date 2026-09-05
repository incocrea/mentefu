/* MenteFu / MindFu — el directorio de cursos, vivo.

   Sustituye a la rejilla estática de artes (CulpaFu + once «próximamente»),
   retirada el 2026-09-04: aquí solo aparece lo que existe en la base de cursos
   reales, con su icono, su nombre y una frase. Se monta donde el build deja
   `[data-directorio]` (la página de artes con filtros, la home sin ellos).

   Con Supabase pide `escuela_directorio` (públicos para todos; privados, con
   candado, solo con sesión). En modo local lee escuela-fuente.json. */
(function () {
  "use strict";
  var esc = MFDom.esc;   /* dom.js: una sola copia para todos */
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang !== "en";
  var T = ES ? {
    buscar: "Nombre o maestro", todas: "Todas las categorías", todos: "Públicos y privados",
    publicos: "Solo públicos", privados: "Solo privados", privado: "privado: se entra con contraseña",
    vacio: "Todavía no hay cursos publicados.", nada: "Ningún curso coincide.", por: "por",
    cargando: "Cargando los cursos…",
  } : {
    buscar: "Name or master", todas: "All categories", todos: "Public and private",
    publicos: "Public only", privados: "Private only", privado: "private: enter with a password",
    vacio: "No courses published yet.", nada: "No course matches.", por: "by",
    cargando: "Loading the courses…",
  };
  var CATEGORIAS = {
    bienestar: ["Bienestar", "Wellbeing"], emociones: ["Emociones", "Emotions"], relaciones: ["Relaciones", "Relationships"],
    comunicacion: ["Comunicación", "Communication"], habitos: ["Hábitos", "Habits"], aprendizaje: ["Aprendizaje", "Learning"],
    trabajo: ["Trabajo", "Work"], creatividad: ["Creatividad", "Creativity"], salud: ["Salud", "Health"], finanzas: ["Finanzas", "Money"],
    general: ["General", "General"],
  };
  function nombreCat(c) { var e = CATEGORIAS[c]; return e ? (ES ? e[0] : e[1]) : (c || ""); }
  var esLocal = !(cfg.gate && window.SB && SB.enabled());
  var ESTATICAS = {};
  (cfg.arts || []).forEach(function (a) { ESTATICAS[a.key] = a; });

  function enlaceDe(c) {
    /* CulpaFu tiene su casa estática (mapa, salas); los cursos de la escuela
       viven en el player. */
    if (ESTATICAS[c.clave]) return ESTATICAS[c.clave].url;
    return (cfg.prefix || "") + (ES ? "curso/" : "course/") + "#/" + c.clave;
  }
  function iconoDe(c) {
    var f = (cfg.gameArt || {})["art-" + c.clave];
    if (f) return '<img src="' + (cfg.assets || "") + f + '" alt="" loading="lazy" decoding="async">';
    return esc(c.icono || (ESTATICAS[c.clave] && ESTATICAS[c.clave].icon) || "🥋");
  }
  /* La frase se corta en una palabra entera y con puntos suspensivos, no a
     mitad de sílaba. */
  function recortar(txt, tope) {
    if (txt.length <= tope) return txt;
    var corte = txt.lastIndexOf(" ", tope);
    return txt.slice(0, corte > tope * 0.6 ? corte : tope).replace(/[,;:\s]+$/, "") + "…";
  }
  function tarjeta(c) {
    var titulo = ES ? (c.titulo_es || c.titulo_en) : (c.titulo_en || c.titulo_es);
    var lead = ES ? (c.lead_es || c.lead_en || "") : (c.lead_en || c.lead_es || "");
    var priv = c.visibilidad === "privado";
    return '<a class="directorio__item" href="' + esc(enlaceDe(c)) + '">' +
      '<span class="directorio__icono" aria-hidden="true">' + iconoDe(c) + "</span>" +
      '<span class="directorio__texto"><b>' + esc(titulo || c.clave) +
      (priv ? ' <span class="directorio__candado" title="' + esc(T.privado) + '">🔒</span>' : "") + "</b>" +
      (lead ? "<small>" + esc(recortar(lead, 140)) + "</small>" : "") +
      '<span class="directorio__meta">' + esc(nombreCat(c.categoria)) +
      (c.maestro ? " · " + esc(T.por) + " " + esc(c.maestro) : "") + "</span></span></a>";
  }

  function cargar() {
    if (esLocal) {
      /* la fuente vive en la raíz del sitio: cfg.assets es la ruta a la raíz
         desde cualquier página (en /en/ cfg.prefix apunta a /en/). */
      return fetch((cfg.assets || "") + "escuela-fuente.json").then(function (r) { return r.json(); }).then(function (f) {
        return Object.keys(f.cursos || {}).filter(function (k) {
          var c = f.cursos[k];
          return (c.tipo || "curso") === "curso" && (c.status || "published") === "published";
        }).map(function (k) {
          var c = f.cursos[k], es = c.es || {}, en = c.en || {};
          return { clave: k, categoria: c.categoria || "bienestar", visibilidad: c.visibilidad || "privado",
                   titulo_es: es.title, titulo_en: en.title, lead_es: es.description, lead_en: en.description,
                   icono: es.icon || en.icon || "", maestro: "", codigo: c.codigo_curso || "" };
        });
      });
    }
    return SB.rpc("escuela_directorio").then(function (lista) { return Array.isArray(lista) ? lista : []; });
  }

  function montar(host) {
    var conFiltros = host.hasAttribute("data-filtros");
    cargar().then(function (lista) {
      if (!lista.length) { host.innerHTML = '<p class="directorio__vacio">' + esc(T.vacio) + "</p>"; return; }
      var cats = [];
      lista.forEach(function (c) { if (c.categoria && cats.indexOf(c.categoria) < 0) cats.push(c.categoria); });
      var filtros = conFiltros
        ? '<div class="directorio__filtros">' +
          '<input type="search" class="directorio__buscar" placeholder="' + esc(T.buscar) + '" aria-label="' + esc(T.buscar) + '" data-f-texto>' +
          '<select class="directorio__sel" aria-label="' + esc(T.todas) + '" data-f-cat><option value="">' + esc(T.todas) + "</option>" +
            cats.map(function (c) { return '<option value="' + esc(c) + '">' + esc(nombreCat(c)) + "</option>"; }).join("") + "</select>" +
          '<select class="directorio__sel" aria-label="' + esc(T.todos) + '" data-f-vis><option value="">' + esc(T.todos) + "</option>" +
            '<option value="publico">' + esc(T.publicos) + '</option><option value="privado">' + esc(T.privados) + "</option></select></div>"
        : "";
      host.innerHTML = filtros + '<div class="directorio__lista" data-lista></div>';
      var caja = host.querySelector("[data-lista]");
      function pintar() {
        var q = conFiltros ? (host.querySelector("[data-f-texto]").value || "").trim().toLowerCase() : "";
        var cat = conFiltros ? host.querySelector("[data-f-cat]").value : "";
        var vis = conFiltros ? host.querySelector("[data-f-vis]").value : "";
        var vivos = lista.filter(function (c) {
          if (cat && c.categoria !== cat) return false;
          if (vis && c.visibilidad !== vis) return false;
          if (q) {
            var pajar = ((c.titulo_es || "") + " " + (c.titulo_en || "") + " " + (c.maestro || "")).toLowerCase();
            if (pajar.indexOf(q) < 0) return false;
          }
          return true;
        });
        caja.innerHTML = vivos.length ? vivos.map(tarjeta).join("") : '<p class="directorio__vacio">' + esc(T.nada) + "</p>";
      }
      if (conFiltros) {
        host.querySelector("[data-f-texto]").addEventListener("input", pintar);
        host.querySelector("[data-f-cat]").addEventListener("change", pintar);
        host.querySelector("[data-f-vis]").addEventListener("change", pintar);
      }
      pintar();
    }, function () {
      host.innerHTML = '<p class="directorio__vacio">' + esc(T.vacio) + "</p>";
    });
  }

  document.querySelectorAll("[data-directorio]").forEach(montar);
})();

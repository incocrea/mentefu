/* Tu Escuela — «Mis artes»: los cursos que el alumno ha empezado, en el perfil.
 *
 * Sustituye a «Mis accesos» y a la sección «Tus artes» que iba en medio del
 * perfil (titular 2026-09-04): un modal con el mismo aire simple que el
 * directorio —icono, nombre y una frase—, solo con los cursos en los que hay
 * avance o que ya se empezaron a explorar. Los cinturones y el avance se ven
 * al entrar al curso, no aquí. Desde cada fila se puede reiniciar el avance
 * (se pierde) o salir del curso (desaparece de la lista).
 *
 * Los datos del curso (nombre, icono, frase) salen del directorio vivo
 * (escuela_directorio) y, para las artes de la casa, de MF_CONFIG.arts; en
 * modo local, de escuela-fuente.json.
 */
(function () {
  "use strict";
  var esc = MFDom.esc;   /* dom.js: una sola copia para todos */
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var esLocal = !(cfg.gate && window.SB && SB.enabled());
  var BOLSAS = ["missions", "exams", "belts", "scrolls", "tools", "replays"];

  var T = ES ? {
    titulo: "Mis artes", cerrar: "Cerrar",
    nota: "Los cursos que has empezado. El avance y los cinturones se ven al entrar en cada uno.",
    vacio: "Todavía no has empezado ningún curso.",
    abrir: "Abrir", reiniciar: "Reiniciar avance", salir: "Salir del curso",
    seguroReiniciar: "¿Seguro? Se pierde", seguroSalir: "¿Seguro? Desaparece",
    reiniciado: "Avance reiniciado", salido: "Has salido del curso",
    sinCuenta: "Entra con tu cuenta para ver tus artes.",
  } : {
    titulo: "My arts", cerrar: "Close",
    nota: "The courses you have started. Progress and belts show up inside each one.",
    vacio: "You have not started any course yet.",
    abrir: "Open", reiniciar: "Reset progress", salir: "Leave the course",
    seguroReiniciar: "Sure? It is lost", seguroSalir: "Sure? It disappears",
    reiniciado: "Progress reset", salido: "You left the course",
    sinCuenta: "Sign in to see your arts.",
  };

  function enlaceDe(clave) {
    var estatica = (cfg.arts || []).filter(function (a) { return a.key === clave; })[0];
    if (estatica) return estatica.url;
    var ruta = ES ? "curso/" : "course/";
    try { return new URL((cfg.prefix || "") + ruta, location.href).pathname + "#/" + clave; }
    catch (e) { return (cfg.prefix || "") + ruta + "#/" + clave; }
  }
  function iconoDe(clave, info) {
    var f = (cfg.gameArt || {})["art-" + clave];
    if (f) return '<img src="' + (cfg.assets || "") + f + '" alt="" loading="lazy" decoding="async">';
    return esc((info && info.icono) || "🥋");
  }

  /* «Empezado»: hay recibos en alguna bolsa (merge ya descartó los anteriores
     a la lápida), o el alumno reinició el avance y quiso quedarse (la bandera
     `empezado:`, fechada, posterior a la lápida), o dejó una última posición
     en el curso antes de cualquier lápida. */
  function empezado(clave, bolsa) {
    var s = MF.state(), f = s.flags || {};
    var lapida = f["borrado:" + clave] || "";
    if ((f["empezado:" + clave] || "") > lapida) return true;
    if (!lapida && s.last && s.last[clave]) return true;
    for (var i = 0; i < BOLSAS.length; i++) if (Object.keys(bolsa[BOLSAS[i]] || {}).length) return true;
    return false;
  }
  function empezados() {
    var arts = MF.state().arts || {};
    return Object.keys(arts).filter(function (k) { return k !== "_" && empezado(k, arts[k]); });
  }

  /* Nombre, icono y frase de cada curso: las artes de la casa vienen en
     MF_CONFIG; los cursos de la escuela, del directorio (o de la fuente local). */
  function infoDe(claves) {
    var base = {};
    (cfg.arts || []).forEach(function (a) { base[a.key] = { titulo: a.name, icono: a.icon, lead: "" }; });
    var faltan = claves.filter(function (k) { return !base[k]; });
    if (!faltan.length) return Promise.resolve(base);
    var pedir = esLocal
      ? fetch((cfg.assets || "") + "escuela-fuente.json").then(function (r) { return r.json(); }).then(function (f) {
          return Object.keys(f.cursos || {}).map(function (k) {
            var c = f.cursos[k], capa = c[cfg.lang] || c.es || {};
            return { clave: k, titulo: capa.title, lead: capa.description || "", icono: capa.icon || "" };
          });
        })
      : SB.rpc("escuela_directorio").then(function (lista) {
          return (Array.isArray(lista) ? lista : []).map(function (c) {
            return { clave: c.clave, titulo: ES ? (c.titulo_es || c.titulo_en) : (c.titulo_en || c.titulo_es),
                     lead: ES ? (c.lead_es || c.lead_en || "") : (c.lead_en || c.lead_es || ""), icono: c.icono || "" };
          });
        });
    return pedir.then(function (lista) {
      lista.forEach(function (c) { if (!base[c.clave]) base[c.clave] = c; });
      return base;
    }, function () { return base; });
  }

  /* La frase se corta en una palabra entera y con puntos suspensivos, no a
     mitad de sílaba. */
  function recortar(txt, tope) {
    if (txt.length <= tope) return txt;
    var corte = txt.lastIndexOf(" ", tope);
    return txt.slice(0, corte > tope * 0.6 ? corte : tope).replace(/[,;:\s]+$/, "") + "…";
  }
  /* Texto, title y aria-label cambian juntos: el lector de pantalla tiene que
     oír «¿Seguro?» antes del segundo clic. */
  function rotular(b, texto, etiqueta) {
    b.textContent = texto;
    b.title = etiqueta;
    b.setAttribute("aria-label", etiqueta);
  }
  function fila(clave, info) {
    var titulo = (info && info.titulo) || clave;
    var lead = (info && info.lead) || "";
    return '<div class="misartes__fila" data-arte="' + esc(clave) + '">' +
      '<a class="misartes__cuerpo" href="' + esc(enlaceDe(clave)) + '" title="' + esc(T.abrir) + '">' +
      '<span class="misartes__icono" aria-hidden="true">' + iconoDe(clave, info) + "</span>" +
      "<span><b>" + esc(titulo) + "</b>" + (lead ? "<small>" + esc(recortar(lead, 110)) + "</small>" : "") + "</span></a>" +
      '<button type="button" class="mentores__accion" data-reiniciar title="' + esc(T.reiniciar) + '" aria-label="' + esc(T.reiniciar) + '">↺</button>' +
      '<button type="button" class="mentores__accion mentores__accion--rojo" data-salir title="' + esc(T.salir) + '" aria-label="' + esc(T.salir) + '">✕</button>' +
      "</div>";
  }

  /* Reiniciar y salir dejan una LÁPIDA fechada (`flags["borrado:<clave>"]`):
     merge() (progress.js) descarta cualquier recibo, cinturón o repaso de ese
     curso anterior a la fecha, venga del servidor o de otra pestaña; sin ella,
     la fusión por unión resucitaba el curso entero al sincronizar. Reiniciar
     además deja la bandera `empezado:` (fechada, posterior a la lápida) para
     que el curso siga en la lista. Las reflexiones de las misiones del curso
     también se olvidan: sus claves son `<clave>-N-K:<i>`. */
  function ahora() { return new Date().toISOString(); }
  function olvidarReflexiones(clave) {
    var r = MF.state().reflections || {};
    Object.keys(r).forEach(function (k) { if (k.indexOf(clave + "-") === 0) delete r[k]; });
  }
  function reiniciar(clave) {
    var s = MF.state();
    var a = MF.art(clave);
    BOLSAS.forEach(function (k) { a[k] = {}; });
    olvidarReflexiones(clave);
    s.flags = s.flags || {};
    s.flags["borrado:" + clave] = ahora();
    s.flags["empezado:" + clave] = ahora();
    MF.save(); MF.paint();
    document.dispatchEvent(new CustomEvent("mf:expediente"));
  }
  function salir(clave) {
    var s = MF.state();
    delete s.arts[clave];
    olvidarReflexiones(clave);
    s.flags = s.flags || {};
    delete s.flags["empezado:" + clave];
    s.flags["borrado:" + clave] = ahora();
    if (s.last) delete s.last[clave];
    MF.save(); MF.paint();
    document.dispatchEvent(new CustomEvent("mf:expediente"));
  }

  function abrirModal() {
    if (!esLocal && !SB.hasSession()) {
      if (window.MF && MF.toast) MF.toast("info", T.titulo, T.sinCuenta, "🥋");
      return;
    }
    var previo = document.activeElement;
    var caja = document.createElement("div");
    caja.className = "modal modal--mentores";
    caja.setAttribute("role", "dialog");
    caja.setAttribute("aria-modal", "true");
    caja.setAttribute("aria-label", T.titulo);
    caja.innerHTML =
      '<div class="modal__panel">' +
      '<header class="modal__head"><h2 class="modal__title">🥋 ' + esc(T.titulo) + "</h2>" +
      '<button class="modal__close" type="button" aria-label="' + esc(T.cerrar) + '">&times;</button></header>' +
      '<div class="modal__body">' +
      '<p class="mentores__nota">' + esc(T.nota) + "</p>" +
      '<div data-lista></div>' +
      "</div></div>";
    document.body.appendChild(caja);

    function cerrar() {
      document.removeEventListener("keydown", alEsc, true);
      caja.remove();
      if (previo && previo.focus) previo.focus();
    }
    function alEsc(e) { if (e.key === "Escape") { e.stopPropagation(); cerrar(); } }
    document.addEventListener("keydown", alEsc, true);
    caja.addEventListener("click", function (e) { if (e.target === caja) cerrar(); });
    caja.querySelector(".modal__close").addEventListener("click", cerrar);
    /* el foco entra al diálogo (la lista se pinta después, así que al cierre) */
    caja.querySelector(".modal__close").focus();

    var host = caja.querySelector("[data-lista]");
    function pintar() {
      var claves = empezados();
      if (!claves.length) { host.innerHTML = '<p class="mentores__vacio">' + esc(T.vacio) + "</p>"; return; }
      host.innerHTML = window.MFCargador ? MFCargador("…") : "…";
      infoDe(claves).then(function (info) {
        host.innerHTML = '<div class="mentores__lista">' + claves.map(function (k) { return fila(k, info[k]); }).join("") + "</div>";
      });
    }
    /* Las dos acciones piden un segundo clic: el botón cambia a «¿Seguro?»
       cuatro segundos y vuelve solo. Sin modal encima de modal. */
    host.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-reiniciar], [data-salir]");
      if (!b) return;
      var esSalir = b.hasAttribute("data-salir");
      var clave = b.closest("[data-arte]").getAttribute("data-arte");
      if (!b.dataset.seguro) {
        b.dataset.seguro = "1";
        var seguro = esSalir ? T.seguroSalir : T.seguroReiniciar;
        rotular(b, seguro, seguro);
        b.classList.add("misartes__seguro");
        setTimeout(function () {
          if (!b.isConnected) return;
          delete b.dataset.seguro;
          rotular(b, esSalir ? "✕" : "↺", esSalir ? T.salir : T.reiniciar);
          b.classList.remove("misartes__seguro");
        }, 4000);
        return;
      }
      if (esSalir) { salir(clave); if (window.MF && MF.toast) MF.toast("info", T.titulo, T.salido, "🥋"); }
      else { reiniciar(clave); if (window.MF && MF.toast) MF.toast("info", T.titulo, T.reiniciado, "↺"); }
      pintar();
    });
    pintar();
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-misartes]");
    if (b) { e.preventDefault(); abrirModal(); }
  });
})();

/* Tu Escuela — «Mis exámenes» (F1/F2, docs/12 §2.5).
 *
 * La cara de examenFu en el PERFIL. Dos listas en un mismo modal:
 *
 *   · Los que puedo rendir — porque un maestro me invitó por email o porque
 *     ya los rendí alguna vez (al terminar por enlace, la RPC me auto-invita).
 *     Cada uno con su marcador: cuántos intentos llevo y mi mejor resultado.
 *   · Los que he creado, si soy maestro, con cuánta gente los ha rendido.
 *
 * Calca el modal de «Maestros Fu» (mentores.js) a propósito: el alumno ya sabe
 * cómo se comporta esa ventana y no tiene que aprender otra.
 *
 * Con Supabase habla con `escuela_mis_examenes`; en modo local se apoya en la
 * fuente que el build deja junto al sitio, para poder probarlo sin cuenta.
 */
(function () {
  "use strict";
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var esLocal = !(cfg.gate && window.SB && SB.enabled());

  var T = ES ? {
    titulo: "Mis exámenes", cerrar: "Cerrar",
    nota: "Los exámenes que te han compartido y los que has creado.",
    puedoRendir: "Para rendir", heCreado: "Creados por mí",
    vacio: "Todavía no tienes exámenes.",
    abrir: "Abrir", editar: "Editar",
    preguntas: "{n} preguntas", mejor: "mejor: {g} de {n}", sinRendir: "sin rendir",
    aprobado: "aprobado ✓", intentos: "{n} intentos hechos",
    rendidoPor: "{n} lo han rendido", sinCuenta: "Entra con tu cuenta para ver tus exámenes.",
    demoLocal: "Modo local: se leen los exámenes de este navegador.",
  } : {
    titulo: "My exams", cerrar: "Close",
    nota: "Exams shared with you and exams you created.",
    puedoRendir: "To take", heCreado: "Created by me",
    vacio: "You have no exams yet.",
    abrir: "Open", editar: "Edit",
    preguntas: "{n} questions", mejor: "best: {g} of {n}", sinRendir: "not taken",
    aprobado: "passed ✓", intentos: "{n} attempts made",
    rendidoPor: "{n} have taken it", sinCuenta: "Sign in to see your exams.",
    demoLocal: "Local mode: exams from this browser.",
  };

  function esc(t) {
    return String(t == null ? "" : t)
      .split("&").join("&amp;").split("<").join("&lt;")
      .split(">").join("&gt;").split('"').join("&quot;");
  }

  /* La dirección del player para un examen, absoluta dentro de este sitio. */
  function enlaceDe(clave) {
    var ruta = ES ? "curso/" : "course/";
    try { return new URL((cfg.prefix || "") + ruta, location.href).pathname + "#/" + clave; }
    catch (e) { return (cfg.prefix || "") + ruta + "#/" + clave; }
  }

  function listar() {
    if (!esLocal) return SB.rpc("escuela_mis_examenes");
    /* En local no hay cuentas: se enseñan los exámenes de la fuente y de los
       borradores de este navegador, que es con lo que se prueba. */
    return fetch(cfg.prefix + "escuela-fuente.json").then(function (r) { return r.json(); })
      .then(function (f) {
        var creados = [];
        var cursos = f.cursos || {};
        try {
          for (var i = 0; i < localStorage.length; i++) {
            var k = localStorage.key(i);
            if (k && k.indexOf("mf.escuela.borrador.cursoNuevo:") === 0) {
              cursos[k.slice("mf.escuela.borrador.cursoNuevo:".length)] = JSON.parse(localStorage.getItem(k));
            }
          }
        } catch (e) { /* nada */ }
        Object.keys(cursos).forEach(function (clave) {
          var c = cursos[clave];
          if ((c.tipo || "curso") !== "examen") return;
          var base = c.idioma_base || "es";
          creados.push({ clave: clave, titulo: (c[base] && c[base].title) || clave,
            n: (c.examen && c.examen.n) || 0, rendidos: 0 });
        });
        return { creados: creados, mios: [] };
      }, function () { return { creados: [], mios: [] }; });
  }

  function filaRendir(x) {
    var marcador = x.aprobado ? T.aprobado
      : (x.hechos ? T.mejor.replace("{g}", x.mejor == null ? 0 : x.mejor).replace("{n}", x.n) : T.sinRendir);
    return '<a class="mentores__fila" href="' + esc(enlaceDe(x.clave)) + '">' +
      '<span class="mentores__correo">' + esc(x.titulo) + "</span>" +
      '<span class="examenes__meta">' + esc(T.preguntas.replace("{n}", x.n) + " · " + marcador) + "</span></a>";
  }

  function filaCreado(x) {
    var panel = (cfg.prefix || "") + (ES ? "escuela/" : "school/") + "#/" + x.clave;
    return '<div class="mentores__fila">' +
      '<span class="mentores__correo">' + esc(x.titulo) + "</span>" +
      '<span class="examenes__meta">' + esc(T.preguntas.replace("{n}", x.n) + " · " +
        T.rendidoPor.replace("{n}", x.rendidos || 0)) + "</span>" +
      '<a class="mentores__accion" href="' + esc(panel) + '" title="' + esc(T.editar) + '">✎</a>' +
      '<a class="mentores__accion" href="' + esc(enlaceDe(x.clave)) + '" title="' + esc(T.abrir) + '">▸</a>' +
      "</div>";
  }

  function abrirModal() {
    if (!esLocal && !SB.hasSession()) {
      if (window.MF && MF.toast) MF.toast("info", T.titulo, T.sinCuenta, "🏮");
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
      '<header class="modal__head"><h2 class="modal__title">🏮 ' + esc(T.titulo) + "</h2>" +
      '<button class="modal__close" type="button" aria-label="' + esc(T.cerrar) + '">&times;</button></header>' +
      '<div class="modal__body">' +
      '<p class="mentores__nota">' + esc(T.nota) + "</p>" +
      (esLocal ? '<p class="mentores__demo">' + esc(T.demoLocal) + "</p>" : "") +
      '<div data-listas></div>' +
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

    var host = caja.querySelector("[data-listas]");
    host.innerHTML = window.MFCargador ? MFCargador("…") : "…";
    listar().then(function (r) {
      r = r || {};
      var mios = r.mios || [], creados = r.creados || [];
      if (!mios.length && !creados.length) {
        host.innerHTML = '<p class="mentores__vacio">' + esc(T.vacio) + "</p>";
        return;
      }
      var html = "";
      if (mios.length) {
        html += '<h3 class="examenes__grupo">' + esc(T.puedoRendir) + "</h3>" +
          '<div class="mentores__lista">' + mios.map(filaRendir).join("") + "</div>";
      }
      if (creados.length) {
        html += '<h3 class="examenes__grupo">' + esc(T.heCreado) + "</h3>" +
          '<div class="mentores__lista">' + creados.map(filaCreado).join("") + "</div>";
      }
      host.innerHTML = html;
    }, function () {
      host.innerHTML = '<p class="mentores__vacio">' + esc(T.vacio) + "</p>";
    });
  }

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-examenes]");
    if (b) { e.preventDefault(); abrirModal(); }
  });
  /* El enlace directo desde el final de un examenFu: perfil/#examenes */
  if ((location.hash || "").indexOf("examenes") >= 0) {
    document.addEventListener("mf:paint", function once() {
      document.removeEventListener("mf:paint", once);
      setTimeout(abrirModal, 300);
    });
  }
})();

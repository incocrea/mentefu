/* Tu Escuela — el modal «Maestros Fu» del perfil (F6, 00-PLAN §3.6).
 *
 * El acceso es POR EXISTENCIA de la llave: si el alumno agrega el email de un
 * maestro a su lista, ese maestro lo ve al instante en su lista de
 * estudiantes; si lo quita, deja de verlo. Sin correos de confirmación ni
 * ceremonia. El disparador vive en el resumen del perfil (profile.js pinta
 * el botón [data-maestros]); aquí solo el modal: lista con editar ✎ y
 * remover ✕, y el alta.
 *
 * Con Supabase habla con las RPC; en modo local funciona como DEMO
 * persistida en este navegador, para poder probarlo todo antes del estreno.
 */
(function () {
  "use strict";
  var esc = MFDom.esc;   /* dom.js: una sola copia para todos */
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang !== "en";
  var esLocal = !(cfg.gate && window.SB && SB.enabled());
  var LS = "mf.mentores.demo";

  var T = ES ? {
    titulo: "Maestros Fu",
    nota: "Un maestro autorizado te ve al instante en su lista de estudiantes: avance y resultados de todos tus cursos. Quitarlo corta el acceso igual de rápido. Sin correos de confirmación.",
    placeholder: "email del maestro",
    anadir: "Autorizar",
    editar: "editar", quitar: "remover", guardar: "Guardar", cancelar: "Cancelar",
    vacio: "No has autorizado a ningún maestro todavía.",
    error: "No se pudo guardar. Reintenta.",
    demoLocal: "modo local: esta lista es de prueba; en el sitio real vive en tu cuenta",
    sinCuenta: "Inicia sesión para autorizar maestros.",
  } : {
    titulo: "Fu masters",
    nota: "An authorized master sees you instantly on their student list: progress and results across all your courses. Removing them cuts access just as fast. No confirmation emails.",
    placeholder: "master's email",
    anadir: "Authorize",
    editar: "edit", quitar: "remove", guardar: "Save", cancelar: "Cancel",
    vacio: "You have not authorized any master yet.",
    error: "Could not save. Retry.",
    demoLocal: "local mode: this list is a rehearsal; on the real site it lives in your account",
    sinCuenta: "Sign in to authorize masters.",
  };

  function emailValido(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); }

  /* ---- datos: RPCs con Supabase, localStorage en la demo local ---- */
  function listar() {
    if (esLocal) {
      try { return Promise.resolve(JSON.parse(localStorage.getItem(LS) || "[]")); }
      catch (e) { return Promise.resolve([]); }
    }
    return SB.rpc("escuela_mis_mentores");
  }
  function guardarLocal(emails) {
    try { localStorage.setItem(LS, JSON.stringify(emails)); } catch (e) { /* nada */ }
    return Promise.resolve();
  }
  function agregar(email) {
    if (esLocal) {
      return listar().then(function (l) {
        if (l.indexOf(email) < 0) l.push(email);
        return guardarLocal(l);
      });
    }
    return SB.rpc("escuela_mentor_agregar", { p_email: email });
  }
  function quitar(email) {
    if (esLocal) {
      return listar().then(function (l) {
        return guardarLocal(l.filter(function (m) { return m !== email; }));
      });
    }
    return SB.rpc("escuela_mentor_quitar", { p_email: email });
  }

  /* ------------------------------------------------------------ el modal -- */
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
      '<button class="modal__close" type="button" aria-label="' + esc(T.cancelar) + '">&times;</button></header>' +
      '<div class="modal__body">' +
      '<p class="mentores__nota">' + esc(T.nota) + "</p>" +
      (esLocal ? '<p class="mentores__demo">' + esc(T.demoLocal) + "</p>" : "") +
      '<div class="mentores__lista" data-lista></div>' +
      '<div class="mentores__form"><input type="email" maxlength="120" placeholder="' + esc(T.placeholder) + '" aria-label="' + esc(T.placeholder) + '">' +
      '<button type="button" class="btn btn--primary" data-anadir>' + esc(T.anadir) + "</button></div>" +
      '<p class="mentores__error" data-error hidden>⚠ ' + esc(T.error) + "</p>" +
      "</div></div>";
    document.body.appendChild(caja);
    var lista = caja.querySelector("[data-lista]");
    var campo = caja.querySelector(".mentores__form input");
    var errorEl = caja.querySelector("[data-error]");

    function cerrar() {
      document.removeEventListener("keydown", alEsc, true);
      caja.remove();
      if (previo && previo.focus) previo.focus();
    }
    function alEsc(e) { if (e.key === "Escape") { e.stopPropagation(); cerrar(); } }
    document.addEventListener("keydown", alEsc, true);
    caja.addEventListener("click", function (e) { if (e.target === caja) cerrar(); });
    caja.querySelector(".modal__close").addEventListener("click", cerrar);

    function pintar(emails) {
      lista.innerHTML = (emails && emails.length)
        ? emails.map(function (m) {
            return '<div class="mentores__fila" data-email="' + esc(m) + '">' +
              '<span class="mentores__correo">' + esc(m) + "</span>" +
              '<button type="button" class="mentores__accion" data-editar title="' + esc(T.editar) + '">✎</button>' +
              '<button type="button" class="mentores__accion mentores__accion--rojo" data-remover title="' + esc(T.quitar) + '">✕</button>' +
              "</div>";
          }).join("")
        : '<p class="mentores__vacio">' + esc(T.vacio) + "</p>";
    }
    function refrescar() {
      listar().then(pintar, function () { errorEl.hidden = false; });
    }

    lista.addEventListener("click", function (e) {
      var fila = e.target.closest && e.target.closest(".mentores__fila");
      if (!fila) return;
      var email = fila.getAttribute("data-email");
      if (e.target.closest("[data-remover]")) {
        errorEl.hidden = true;
        quitar(email).then(refrescar, function () { errorEl.hidden = false; });
        return;
      }
      if (e.target.closest("[data-editar]")) {
        fila.innerHTML =
          '<input type="email" maxlength="120" value="' + esc(email) + '">' +
          '<button type="button" class="mentores__accion" data-guardar title="' + esc(T.guardar) + '">✓</button>' +
          '<button type="button" class="mentores__accion" data-cancelar title="' + esc(T.cancelar) + '">↩</button>';
        fila.querySelector("input").focus();
        return;
      }
      if (e.target.closest("[data-cancelar]")) { refrescar(); return; }
      if (e.target.closest("[data-guardar]")) {
        var nuevo = fila.querySelector("input").value.trim().toLowerCase();
        if (!emailValido(nuevo)) { fila.querySelector("input").focus(); return; }
        errorEl.hidden = true;
        /* editar = la llave vieja sale y entra la nueva: mismo contrato */
        quitar(email).then(function () { return nuevo === email ? null : agregar(nuevo); })
          .then(refrescar, function () { errorEl.hidden = false; refrescar(); });
      }
    });
    caja.querySelector("[data-anadir]").addEventListener("click", alta);
    campo.addEventListener("keydown", function (e) { if (e.key === "Enter") alta(); });
    function alta() {
      var email = campo.value.trim().toLowerCase();
      if (!emailValido(email)) { campo.focus(); return; }
      errorEl.hidden = true;
      agregar(email).then(function () { campo.value = ""; refrescar(); },
        function () { errorEl.hidden = false; });
    }

    refrescar();
    campo.focus();
  }

  /* Disparador delegado: profile.js pinta el botón en el resumen y puede
     repintarlo cuantas veces quiera sin que el enganche se pierda. */
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("[data-maestros]");
    if (b) abrirModal();
  });
})();

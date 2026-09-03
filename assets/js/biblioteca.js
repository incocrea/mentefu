/* MenteFu / MindFu — la biblioteca en formato sala de pergaminos.

   El listado lo genera build.py ({SCROLL_LIST}) con las mismas piezas visuales
   de la sala del curso, sin audio. Aquí solo se engancha el «Leer»: el
   pergamino se despliega flotando (pergamino.js) y, si el canal cerrado no
   está —modo local, invitado, fallo de red—, el enlace navega a la página del
   pergamino como toda la vida. El estado leído/no leído lo pinta progress.js
   (paint) sobre las mismas filas.

   Con el gate activo la lista viaja cerrada dentro del cuerpo de la página
   (kind "page"): llega tras mf:content, así que se engancha también ahí. */
(function () {
  "use strict";

  function hecho(id) {
    if (!window.MF) return false;
    var arts = (MF.state() || {}).arts || {};
    for (var k in arts) {
      if ((arts[k].scrolls || {})[id] || (arts[k].tools || {})[id]) return true;
    }
    return false;
  }

  function enganchar(raiz) {
    raiz.querySelectorAll("[data-biblioteca] .audioteca__item").forEach(function (fila) {
      if (fila.__biblioteca) return;
      fila.__biblioteca = true;
      var id = fila.getAttribute("data-scroll-id");
      var xp = parseInt(fila.getAttribute("data-xp"), 10) || 10;
      var kind = fila.getAttribute("data-kind") || "scroll";
      var btn = fila.querySelector(".audioteca__abrir");
      if (!btn || !id || kind === "tool") return;   /* las herramientas navegan a su sala */
      btn.addEventListener("click", function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
        /* sin el canal cerrado no hay modal posible: solo AHÍ el enlace navega
           a su página (el pergamino existe y hay que poder leerlo igual). Con
           canal, SIEMPRE modal —jamás navegar por un fallo— (auditoría
           2026-09-02). */
        if (!window.MFPergamino || !window.MFAuth || !MFAuth.loadContent) return;
        e.preventDefault();
        e.stopPropagation();
        MFPergamino.abrir({
          id: id, art: null, xp: xp, kind: kind,
          href: btn.getAttribute("href"),
          titulo: (fila.querySelector(".audioteca__titulo") || {}).textContent || "",
          hecho: function () { return hecho(id); },
          alCompletar: function () { if (window.MF) MF.paint(); },
          origen: btn,
        });
      });
    });
  }

  enganchar(document);                                    /* modo local: ya está en el DOM */
  document.querySelectorAll("[data-gate]").forEach(function (host) {
    host.addEventListener("mf:content", function () { enganchar(host); });
  });
})();

/* MenteFu / MindFu — MFDom: los dos ayudantes de DOM que TODOS los módulos
   copiaban. Doce archivos llevaban su propio `el()` y su propio `esc()`, con
   pequeñas diferencias entre sí (unos escapaban null como «null», otros como
   vacío; unos usaban firstChild, otros firstElementChild). Desde 2026-09-04
   viven aquí, una sola vez, y cada módulo los toma con
   `var el = MFDom.el, esc = MFDom.esc;`. Se carga el primero de todos. */
(function () {
  "use strict";

  /* Un nodo a partir de un trozo de HTML. El trim evita que un salto de línea
     inicial se convierta en un nodo de texto y el «primer hijo» sea vacío. */
  function el(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html == null ? "" : html).trim();
    return d.firstElementChild;
  }

  /* Texto seguro dentro de HTML. null y undefined salen vacíos, no «null». */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  window.MFDom = { el: el, esc: esc };
})();

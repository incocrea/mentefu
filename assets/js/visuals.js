/* MenteFu / MindFu — reveal al hacer scroll.
   Regla de oro (heredada de golf): el contenido NUNCA puede quedarse
   invisible. Sin IntersectionObserver, con movimiento reducido o si algo
   tarda demasiado, se muestra todo.

   Expone MFVisuals.scan(raíz): el cuerpo de la zona de alumnos llega por red
   DESPUÉS de cargar la página, así que sus [data-reveal] no existían cuando
   este script miró. Sin volver a escanearlos se quedarían en opacity:0 para
   siempre, que es exactamente lo que la regla de oro prohíbe. */
(function () {
  "use strict";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var io = null;

  function revealAll(items) { items.forEach(function (el) { el.classList.add("is-in"); }); }

  function observer() {
    if (io) return io;
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
    return io;
  }

  function scan(root) {
    var items = [].slice.call((root || document).querySelectorAll("[data-reveal]:not(.is-in)"));
    if (!items.length) return;
    if (reduced || !("IntersectionObserver" in window) || !window.innerHeight) {
      revealAll(items);
      return;
    }
    var ob = observer();
    items.forEach(function (el) { ob.observe(el); });
    window.setTimeout(function () {
      /* red de seguridad: si nada llegó a entrar en pantalla, se enseña todo */
      var pendientes = items.filter(function (el) { return !el.classList.contains("is-in"); });
      if (pendientes.length === items.length) revealAll(pendientes);
    }, 2500);
  }

  window.MFVisuals = { scan: scan };
  scan(document);
})();

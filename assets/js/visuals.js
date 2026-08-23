/* MenteFu / MyselfU — reveal al hacer scroll.
   Regla de oro (heredada de golf): el contenido NUNCA puede quedarse
   invisible. Sin IntersectionObserver, con movimiento reducido o si algo
   tarda demasiado, se muestra todo. */
(function () {
  "use strict";
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var items = [].slice.call(document.querySelectorAll("[data-reveal]"));
  if (!items.length) return;

  function revealAll() { items.forEach(function (el) { el.classList.add("is-in"); }); }

  if (reduced || !("IntersectionObserver" in window) || !window.innerHeight) {
    revealAll();
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
  items.forEach(function (el) { io.observe(el); });
  window.setTimeout(function () {
    if (!document.querySelector("[data-reveal].is-in")) revealAll();
  }, 2500);
})();

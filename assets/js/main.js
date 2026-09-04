/* MenteFu / MindFu — interacciones básicas (menú, acordeones, año) */
(function () {
  "use strict";

  /* Menú móvil */
  var burger = document.querySelector(".burger");
  var nav = document.getElementById("main-nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
        burger.focus();
      }
    });
  }

  /* Acordeón genérico: <button class="acc__q" aria-expanded> + panel siguiente */
  document.querySelectorAll(".acc__q").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".acc__item");
      var open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* Año en el pie */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- El cargador ilustrado de la casa (titular 2026-09-02) ----------
     Un único indicador de espera para toda la plataforma: la mascota
     respirando dentro de su aro de tinta y tres puntos que laten. Sustituye
     a los textos «Abriendo la sala…» y compañía; el texto viaja ahora en el
     aria-label, así que los lectores de pantalla siguen oyéndolo. Devuelve
     una CADENA porque quienes lo usan (auth.js, pergamino.js) pintan con
     innerHTML; main.js carga antes que ellos en el orden defer del layout. */
  /* Modalidad de foco (titular 2026-09-02): Tab enciende el anillo de foco,
     cualquier puntero lo apaga. La regla visual vive en styles.css
     (`.con-teclado :focus-visible`): tocar jamás dibuja recuadros. */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Tab") document.documentElement.classList.add("con-teclado");
  }, true);
  document.addEventListener("pointerdown", function () {
    document.documentElement.classList.remove("con-teclado");
  }, true);

  /* Ninguna lámina se agarra como imagen (titular 2026-09-02). La parte CSS
     (user-select/-webkit-user-drag sobre img y svg) vive en styles.css;
     este listener es la mitad que Firefox necesita, y al ser delegado cubre
     también las láminas que los juegos crean después. */
  document.addEventListener("dragstart", function (e) {
    var t = e.target;
    if (t && (t.tagName === "IMG" || t.tagName === "svg")) e.preventDefault();
  }, true);

  window.MFCargador = function (etiqueta) {
    var cfg = window.MF_CONFIG || {};
    var ruta = (cfg.assets || "") + "assets/img/mascota/reposo.webp";
    var aria = String(etiqueta || "").replace(/"/g, "&quot;");
    return '<div class="cargador" role="status" aria-label="' + aria + '">' +
      '<span class="cargador__aro" aria-hidden="true"></span>' +
      '<img class="cargador__mascota" src="' + ruta + '" alt="" decoding="async">' +
      '<span class="cargador__puntos" aria-hidden="true"><i></i><i></i><i></i></span>' +
      "</div>";
  };
})();

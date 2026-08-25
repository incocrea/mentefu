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
})();

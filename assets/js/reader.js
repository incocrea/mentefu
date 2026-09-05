/* MenteFu / MindFu — lector de pergaminos y herramientas gated (docs/04 §2).
   Recibe mf:content con {html, kind, xp, art, id}. Los pergaminos (article,
   story) se paginan por apartado (H2) con barra de progreso y dan XP al
   terminar. */
(function () {
  "use strict";
  var el = MFDom.el;   /* dom.js: una sola copia para todos */
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var T = ES ? { page: "Parte {i} de {n}", prev: "Anterior", next: "Siguiente", done: "Marcar como leído (+{n} XP)", read: "Pergamino leído: +{n} XP", already: "Ya leíste este pergamino.", seal: "Leído" }
             : { page: "Part {i} of {n}", prev: "Previous", next: "Next", done: "Mark as read (+{n} XP)", read: "Scroll read: +{n} XP", already: "You already read this scroll.", seal: "Read" };


  function paginate(html) {
    var tmp = document.createElement("div"); tmp.innerHTML = html;
    var pages = [], cur = document.createElement("div");
    [].slice.call(tmp.childNodes).forEach(function (node) {
      if (node.nodeType === 1 && node.tagName === "H2" && cur.childNodes.length) { pages.push(cur); cur = document.createElement("div"); }
      cur.appendChild(node);
    });
    if (cur.childNodes.length) pages.push(cur);
    return pages;
  }

  function scroll(host, data) {
    var body = host.querySelector("[data-gated-body]");
    var pages = paginate(data.html || "");
    var n = pages.length, i = 0;
    var a = window.MF ? MF.art(data.art) : null;
    var already = a && !!a.scrolls[data.id];
    /* El pergamino desplegado: rollo, hoja y rollo. Los rollos son decorativos
       (CSS puro, sin peticiones) y nunca llevan texto encima. */
    var wrap = el('<div class="reader scrollframe">' +
      '<div class="scrollframe__sheet">' +
        '<div class="reader__top"><div class="mission__bar"><div class="mission__fill"></div></div>' +
        '<span class="mission__count"></span></div>' +
        '<div class="prose reader__page"></div>' +
        '<div class="reader__nav">' +
          '<button class="btn btn--ghost" type="button" data-prev>' + T.prev + '</button>' +
          '<button class="btn btn--primary" type="button" data-next>' + T.next + '</button>' +
        '</div>' +
        '<div class="scrollframe__seal" aria-hidden="true">' + T.seal + '</div>' +
      '</div>' +
    '</div>');
    body.appendChild(wrap);
    if (already) wrap.classList.add("is-read");   /* ya leído: el sello ya está estampado */
    var fill = wrap.querySelector(".mission__fill"), count = wrap.querySelector(".mission__count"), page = wrap.querySelector(".reader__page");
    var prev = wrap.querySelector("[data-prev]"), next = wrap.querySelector("[data-next]");
    function show() {
      page.innerHTML = ""; page.appendChild(pages[i].cloneNode(true));
      fill.style.width = Math.round(((i + 1) / n) * 100) + "%";
      count.textContent = T.page.replace("{i}", i + 1).replace("{n}", n);
      prev.disabled = i === 0;
      next.textContent = i >= n - 1 ? (already ? T.already : T.done.replace("{n}", data.xp)) : T.next;
      next.disabled = i >= n - 1 && already;
      if (window.MF) MF.track("card_view", { item: data.id, art: data.art, data: { part: i, type: "scroll" } });
      wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    /* la página que pasa (titular 2026-09-02), como en el pergamino flotante */
    function fxPagina() { if (window.MFSonido && MFSonido.fx) MFSonido.fx("fx-pagina"); }
    prev.addEventListener("click", function () { if (i > 0) { i--; fxPagina(); show(); } });
    next.addEventListener("click", function () {
      if (i < n - 1) { i++; fxPagina(); show(); return; }
      if (window.MF && !already) {
        MF.scrollRead(data.art, data.id, data.xp);
        already = true; next.disabled = true; next.textContent = T.read.replace("{n}", data.xp);
        wrap.classList.add("is-read");            /* estampa el sello de lacre */
        /* pergamino completado: XP dado y de vuelta a la tarjeta de origen sin
           que el alumno tenga que orientarse (el sello y el toast respiran antes) */
        try {
          var vuelta = JSON.parse(sessionStorage.getItem("mf.origen") || "null");
          if (vuelta && vuelta.url && vuelta.url !== window.location.pathname) {
            sessionStorage.setItem("mf.origen.volver", "1");
            setTimeout(function () { window.location.href = vuelta.url; }, 1400);
          }
        } catch (err) { /* nada */ }
      }
    });
    show();
  }

  /* Cuerpo de una página de la zona de alumnos (sala, nivel): no es un
     pergamino paginado ni una herramienta, es HTML tal cual. Llega por red, así
     que hay que devolverle la vida a lo que el generador dejó preparado:
     los reveals, el estado del mapa, los cinturones y las tarjetas. */
  function pagina(host, data) {
    var body = host.querySelector("[data-gated-body]");
    var box = el('<div class="prose"></div>');
    box.innerHTML = data.html || "";
    body.appendChild(box);
    /* salir del nivel por un enlace (pergamino, herramienta) guarda el punto
       de partida: la pastilla «Volver al nivel» acompañará hasta el regreso */
    box.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.getAttribute("href").charAt(0) === "#") return;
      /* solo las salidas hacia contenido complementario dejan ancla; los
         enlaces del flujo (dojo, niveles, misiones) navegan sin más */
      if (a.getAttribute("href").indexOf("/dojo/") !== -1) return;
      try {
        sessionStorage.setItem("mf.origen", JSON.stringify({
          url: window.location.pathname, title: data.title || document.title,
          tipo: (cfg.page && cfg.page.layout === "level") ? "nivel" : "biblioteca"
        }));
      } catch (err) { /* nada */ }
    });
    if (window.MFVisuals) MFVisuals.scan(box);
    if (window.MF) MF.paint();
  }

  /* Lista blanca explícita. Antes el reparto era «tool o, si no, pergamino», así
     que cualquier kind nuevo caía en scroll() y se paginaba por sus H2 con un
     botón «Marcar como leído (+undefined XP)». */
  var PINTORES = { scroll: scroll, article: scroll, story: scroll, page: pagina };

  document.querySelectorAll("[data-gate]").forEach(function (host) {
    var pintor = PINTORES[host.getAttribute("data-kind")];
    if (!pintor) return;
    host.addEventListener("mf:content", function (e) { pintor(host, e.detail); });
  });
})();

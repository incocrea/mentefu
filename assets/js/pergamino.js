/* MenteFu / MindFu — el pergamino flotante.

   Los pergaminos ya no sacan al alumno de donde está: se despliegan en un modal
   con el marco de pergamino, paginado por apartados, con sus botones y con
   arrastre lateral igual que las tarjetas de misión (decisión 2026-08-26). Así
   se puede leer mientras suena el minipodcast —las dos formas a la vez— y al
   cerrar sigues justo donde estabas.

   El contenido se pide por el canal cerrado (MFAuth.loadContent); si no se
   puede traer, el enlace navega a la página del pergamino como toda la vida. */
(function () {
  "use strict";
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var T = ES ? {
    page: "Parte {i} de {n}", prev: "Anterior", next: "Siguiente",
    done: "Marcar como leído (+{n} XP)", read: "Pergamino leído: +{n} XP",
    already: "Ya leíste este pergamino.", close: "Cerrar", cargando: "Abriendo el pergamino…",
  } : {
    page: "Part {i} of {n}", prev: "Previous", next: "Next",
    done: "Mark as read (+{n} XP)", read: "Scroll read: +{n} XP",
    already: "You already read this scroll.", close: "Close", cargando: "Opening the scroll…",
  };

  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }

  /* una parte por apartado (H2), igual que la página del pergamino */
  function paginar(html) {
    var tmp = document.createElement("div"); tmp.innerHTML = html;
    var partes = [], cur = document.createElement("div");
    [].slice.call(tmp.childNodes).forEach(function (node) {
      if (node.nodeType === 1 && node.tagName === "H2" && cur.childNodes.length) { partes.push(cur); cur = document.createElement("div"); }
      cur.appendChild(node);
    });
    if (cur.childNodes.length) partes.push(cur);
    return partes;
  }

  var cache = {};
  function traer(id) {
    if (cache[id]) return Promise.resolve(cache[id]);
    if (!window.MFAuth || !MFAuth.loadContent) return Promise.reject(new Error("sin gate"));
    return MFAuth.loadContent(cfg.lang + ":" + id, null).then(function (d) { cache[id] = d; return d; });
  }

  var abierto = null;
  function cerrar() {
    if (!abierto) return;
    abierto.caja.remove();
    document.removeEventListener("keydown", abierto.tecla);
    document.body.classList.remove("has-pergamino");
    if (abierto.volverA && abierto.volverA.focus) { try { abierto.volverA.focus(); } catch (e) { /* nada */ } }
    abierto = null;
  }

  /* opts: { id, art, xp, kind, titulo, hecho: fn, alCompletar: fn, origen: elemento } */
  function abrir(opts) {
    var caja = el('<div class="pergamino-modal" role="dialog" aria-modal="true" aria-label="' + (opts.titulo || "") + '">' +
      '<div class="pergamino-modal__hoja marco-pergamino">' +
        '<button class="pergamino-modal__cerrar" type="button" aria-label="' + T.close + '">&times;</button>' +
        '<div class="pergamino-modal__cuerpo"><p class="muted">' + T.cargando + "</p></div>" +
      "</div></div>");
    function tecla(e) { if (e.key === "Escape") cerrar(); }
    caja.addEventListener("click", function (e) { if (e.target === caja) cerrar(); });
    caja.querySelector(".pergamino-modal__cerrar").addEventListener("click", cerrar);
    document.addEventListener("keydown", tecla);
    document.body.appendChild(caja);
    document.body.classList.add("has-pergamino");
    abierto = { caja: caja, tecla: tecla, volverA: opts.origen || null };
    caja.querySelector(".pergamino-modal__cerrar").focus();

    var cuerpo = caja.querySelector(".pergamino-modal__cuerpo");
    return traer(opts.id).then(function (data) {
      var partes = paginar(data.html || "");
      var n = partes.length, i = 0;
      var xp = opts.xp || data.xp || 10;
      var yaHecho = typeof opts.hecho === "function" ? opts.hecho : function () { return false; };
      var leido = yaHecho();

      cuerpo.innerHTML = "";
      var vista = el('<div class="pergamino-modal__vista">' +
        '<div class="reader__top"><div class="mission__bar"><div class="mission__fill"></div></div>' +
        '<span class="mission__count"></span></div>' +
        '<h2 class="pergamino-modal__titulo"></h2>' +
        '<div class="prose reader__page"></div>' +
        '<div class="reader__nav">' +
          '<button class="btn btn--ghost" type="button" data-prev>' + T.prev + "</button>" +
          '<button class="btn btn--primary" type="button" data-next>' + T.next + "</button>" +
        "</div></div>");
      cuerpo.appendChild(vista);
      vista.querySelector(".pergamino-modal__titulo").textContent = data.title || opts.titulo || "";
      var fill = vista.querySelector(".mission__fill"), cuenta = vista.querySelector(".mission__count");
      var pagina = vista.querySelector(".reader__page");
      var prev = vista.querySelector("[data-prev]"), next = vista.querySelector("[data-next]");

      function pintar() {
        pagina.innerHTML = "";
        pagina.appendChild(partes[i].cloneNode(true));
        fill.style.width = Math.round(((i + 1) / n) * 100) + "%";
        cuenta.textContent = T.page.replace("{i}", i + 1).replace("{n}", n);
        prev.disabled = i === 0;
        next.textContent = i >= n - 1 ? (leido ? T.already : T.done.replace("{n}", xp)) : T.next;
        next.disabled = i >= n - 1 && leido;
        cuerpo.scrollTop = 0;
        if (window.MF) MF.track("card_view", { item: opts.id, art: opts.art, data: { part: i, type: "scroll_modal" } });
      }
      function ir(d) {
        if (d > 0 && i >= n - 1) { terminar(); return; }
        var nuevo = Math.min(n - 1, Math.max(0, i + d));
        if (nuevo === i) return;
        i = nuevo;
        pintar();
      }
      function terminar() {
        if (leido || !window.MF) return;
        MF.scrollRead(opts.art, opts.id, xp);
        leido = true;
        next.disabled = true; next.textContent = T.read.replace("{n}", xp);
        vista.classList.add("is-read");
        if (opts.alCompletar) opts.alCompletar();
      }
      prev.addEventListener("click", function () { ir(-1); });
      next.addEventListener("click", function () { ir(1); });

      /* arrastre lateral, igual que en las tarjetas de misión */
      var sw = null;
      vista.addEventListener("pointerdown", function (e) {
        if (e.pointerType === "mouse") return;
        if (e.target.closest && e.target.closest("button, a, input, textarea")) { sw = null; return; }
        sw = { x: e.clientX, y: e.clientY };
      });
      vista.addEventListener("pointerup", function (e) {
        if (!sw) return;
        var dx = e.clientX - sw.x, dy = e.clientY - sw.y;
        sw = null;
        if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        ir(dx < 0 ? 1 : -1);
      });
      vista.addEventListener("pointercancel", function () { sw = null; });
      caja.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") ir(1);
        else if (e.key === "ArrowLeft") ir(-1);
      });

      pintar();
      if (window.MF) MF.track("scroll_open", { item: opts.id, art: opts.art, data: { modo: "modal" } });
      return true;
    }).catch(function () {
      cerrar();
      return false;      /* quien llame decide: normalmente, navegar a la página */
    });
  }

  window.MFPergamino = { abrir: abrir, cerrar: cerrar };
})();

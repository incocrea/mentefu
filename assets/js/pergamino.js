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
    error: "No se pudo cargar el pergamino. Revisa tu conexión.", reintentar: "Reintentar",
  } : {
    page: "Part {i} of {n}", prev: "Previous", next: "Next",
    done: "Mark as read (+{n} XP)", read: "Scroll read: +{n} XP",
    already: "You already read this scroll.", close: "Close", cargando: "Opening the scroll…",
    error: "The scroll could not load. Check your connection.", reintentar: "Retry",
  };

  /* Las láminas de interfaz (el sello de cerrar) cuelgan del mismo prefijo que
     inyecta el generador en MF_CONFIG: en /en/ y en la raíz la ruta relativa no
     es la misma, así que no puede escribirse a mano. */
  var SELLOS = (cfg.assets || "") + "assets/img/ui/";

  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  /* El título entra en un atributo (aria-label) y hay títulos con comillas
     —«The "should"»—: sin escapar, la comilla cierra el atributo antes de
     tiempo y el resto del título se cuela como atributo suelto del diálogo. */
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

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

  /* Una pieza no se pide dos veces: la primera lectura la deja aquí y el resto
     de la sesión se abre instantánea (y sin volver a tocar la red). */
  var cache = {};
  function traer(id, href, propio) {
    /* Tu Escuela: un BORRADOR se lee sin pasar por la red ni por la caché —
       el maestro está viendo lo que acaba de escribir, no lo publicado. */
    if (propio) return Promise.resolve(propio);
    if (cache[id]) return Promise.resolve(cache[id]);
    if (!window.MFAuth || !MFAuth.loadContent) return Promise.reject(new Error("sin gate"));
    /* El href es la página DUEÑA del pergamino. Con el gate puesto no se usa
       (manda Supabase); en modo local es de donde sale el contenido embebido,
       porque aquí no hay «host» del que leerlo. */
    return MFAuth.loadContent(cfg.lang + ":" + id, null, href).then(function (d) { cache[id] = d; return d; });
  }

  var abierto = null;
  function cerrar(desdeHistorial) {
    if (!abierto) return;
    var conHistorial = abierto.historial;
    /* el minipodcast vive DENTRO del pergamino: si se cierra la nota, se calla.
       Solo el suyo: `audioPropio` distingue el reproductor que montó ESTE modal
       de cualquier otro que pudiera estar sonando en la página. */
    if (abierto.audioPropio && window.MFAudio) MFAudio.parar();
    abierto.caja.remove();
    document.removeEventListener("keydown", abierto.tecla);
    document.body.classList.remove("has-pergamino");
    if (abierto.volverA && abierto.volverA.focus) { try { abierto.volverA.focus(); } catch (e) { /* nada */ } }
    abierto = null;
    /* el «atrás» del móvil cierra el pergamino, no la página */
    if (conHistorial && !desdeHistorial) { try { history.back(); } catch (e) { /* nada */ } }
  }
  window.addEventListener("popstate", function () { if (abierto) cerrar(true); });

  /* opts: { id, href, art, xp, kind, titulo, audio, hecho: fn, alCompletar: fn,
             origen: elemento, contenido: {html, title, xp} — el BORRADOR de Tu
             Escuela, que se lee tal cual sin tocar la red } */
  function abrir(opts) {
    /* Nunca dos pergaminos abiertos a la vez. Si había uno, su entrada de
       historial se HEREDA en vez de deshacerse: el history.back() del cierre es
       asíncrono y su popstate llegaría cuando el pergamino NUEVO ya está
       montado, cerrándolo de golpe. Una entrada por sesión de modal es
       justo lo que hace falta para que el «atrás» cierre el de arriba. Mismo
       trato que el motor de retos (retos.js:648). */
    var heredaHistorial = !!(abierto && abierto.historial);
    cerrar(heredaHistorial);
    var caja = el('<div class="pergamino-modal" role="dialog" aria-modal="true" aria-label="' + esc(opts.titulo || "") + '">' +
      '<div class="pergamino-modal__hoja marco-pergamino">' +
        /* El aspa es una LÁMINA y ya no un `&times;` (2026-08-28): el sello
           bermellón con la X crema viene dibujado entero, así que el botón no
           pone fondo ni borde (game.css) y la imagen lo llena. `alt=""` porque
           el nombre accesible lo pone el aria-label del botón; con alt escrito
           el lector de pantalla anunciaría «Cerrar» dos veces. El `title` va
           además del aria-label para que el ratón también lo lea. */
        '<button class="pergamino-modal__cerrar" type="button" title="' + esc(T.close) + '" aria-label="' + esc(T.close) + '">' +
          '<img class="sello-icono" src="' + SELLOS + 'cerrar.webp" alt="" width="256" height="255" decoding="async">' +
        "</button>" +
        '<div class="pergamino-modal__cuerpo">' + (window.MFCargador ? MFCargador(T.cargando) : '<p class="muted">' + T.cargando + "</p>") + "</div>" +
      "</div></div>");
    function tecla(e) { if (e.key === "Escape") cerrar(); }
    caja.addEventListener("click", function (e) { if (e.target === caja) cerrar(); });
    /* La X se envuelve a propósito: pasar `cerrar` directo como escucha le
       entrega el EVENTO como `desdeHistorial`, que es truthy, y entonces el
       cierre se saltaba el history.back(). Resultado medido antes de esto:
       tras cerrar con la X quedaba viva la entrada del modal y el primer
       «atrás» se la comía sin salir de la página. */
    caja.querySelector(".pergamino-modal__cerrar").addEventListener("click", function () { cerrar(); });
    document.addEventListener("keydown", tecla);
    document.body.appendChild(caja);
    document.body.classList.add("has-pergamino");
    var conHistorial = heredaHistorial;
    if (!conHistorial) {
      try { history.pushState({ mf: "pergamino" }, ""); conHistorial = true; } catch (e) { /* nada */ }
    }
    abierto = { caja: caja, tecla: tecla, volverA: opts.origen || null, historial: conHistorial };
    caja.querySelector(".pergamino-modal__cerrar").focus();

    var cuerpo = caja.querySelector(".pergamino-modal__cuerpo");
    function sigueSiendoElMio() { return abierto && abierto.caja === caja; }

    /* EL PERGAMINO NUNCA NAVEGA FUERA (auditoría 2026-09-02, tercer reporte
       del titular). Antes: si la carga fallaba dos veces, `abrir` resolvía
       `false` y CADA llamador (misión, biblioteca, audioteca) hacía
       `window.location.href = href` — el «link aparte navegado». Ese camino
       era de DISEÑO, no un bug intermitente, y por eso los parches de token y
       de reintento solo bajaban la frecuencia. Ahora el modal se monta
       PRIMERO y SIEMPRE se queda; el contenido se carga dentro con reintentos
       y, si todo falla, aparece un panel de error con «Reintentar». `abrir`
       resuelve `true` en cuanto el modal existe: ningún llamador vuelve a
       navegar. */
    function montarVista(data) {
      if (!sigueSiendoElMio()) return;   /* lo cerraron mientras cargaba */
      var partes = paginar(data.html || "");
      var n = partes.length, i = 0;
      var xp = opts.xp || data.xp || 10;
      var yaHecho = typeof opts.hecho === "function" ? opts.hecho : function () { return false; };
      /* se relee en cada pintado: el minipodcast puede terminar mientras lees y
         el botón no debe seguir ofreciendo un XP ya concedido */
      var leido = yaHecho();

      cuerpo.innerHTML = "";
      /* La cabecera lleva el hilo de la lectura Y el minipodcast: se queda
         pegada arriba, así el control no se pierde al bajar por el texto
         (titular 2026-08-26). */
      var vista = el('<div class="pergamino-modal__vista">' +
        '<div class="reader__top"><div class="mission__bar"><div class="mission__fill"></div></div>' +
        /* El número de parte va ANTES que el reproductor (2026-08-28): la fila
           dejó de ser dos columnas y pasó a ser dos pisos —arriba la barra de
           lectura con su «Parte i de n», que es su etiqueta; abajo el
           minipodcast a todo el ancho—. El orden se cambia aquí y no con
           `order` en el CSS para que el foco del teclado siga leyéndose en el
           mismo orden en que se ve. */
        '<div class="pergamino-modal__fila"><span class="mission__count"></span>' +
        '<span class="pergamino-modal__audio"></span></div></div>' +
        '<h2 class="pergamino-modal__titulo"></h2>' +
        '<div class="prose reader__page"></div>' +
        '<div class="reader__nav">' +
          '<button class="btn btn--ghost" type="button" data-prev>' + T.prev + "</button>" +
          '<button class="btn btn--primary" type="button" data-next>' + T.next + "</button>" +
        "</div></div>");
      cuerpo.appendChild(vista);
      vista.querySelector(".pergamino-modal__titulo").textContent = data.title || opts.titulo || "";
      /* El minipodcast comparte la fila de cabecera con el número de parte: se
         lee, y quien prefiera escuchar le da al play sin salir de aquí. Es el
         mismo reproductor compartido de audio.js, con su cambio de velocidad. */
      if (opts.audio && window.MFAudio) {
        var reproductor = MFAudio.montar({
          src: opts.audio, item: opts.id, art: opts.art, xp: xp, kind: opts.kind,
          hecho: function () { return leido || yaHecho(); },
          alTerminar: function () {
            leido = true;
            pintar();                       /* el botón deja de ofrecer un XP ya cobrado */
            if (opts.alCompletar) opts.alCompletar();
          },
        });
        reproductor.classList.add("scroll-audio--nota");
        vista.querySelector(".pergamino-modal__audio").appendChild(reproductor);
        vista.querySelector(".pergamino-modal__fila").classList.add("tiene-audio");
        if (abierto && abierto.caja === caja) abierto.audioPropio = true;
      }
      var fill = vista.querySelector(".mission__fill"), cuenta = vista.querySelector(".mission__count");
      var pagina = vista.querySelector(".reader__page");
      var prev = vista.querySelector("[data-prev]"), next = vista.querySelector("[data-next]");

      function pintar() {
        if (!leido && yaHecho()) leido = true;
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
        /* la página que pasa (titular 2026-09-02): mismo roce de papel que en
           las tarjetas de misión; respeta el interruptor por dentro */
        if (window.MFSonido && MFSonido.fx) MFSonido.fx("fx-pagina");
        pintar();
      }
      function terminar() {
        if (!window.MF) return;
        if (leido || yaHecho()) {          /* ya estaba: ni XP ni anuncio falso */
          leido = true;
          next.disabled = true; next.textContent = T.already;
          return;
        }
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
        /* el reproductor no pasa página: arrastrar sobre él no es hojear */
        if (e.target.closest && e.target.closest("button, a, input, textarea, .scroll-audio")) { sw = null; return; }
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
      /* las flechas se quedan DENTRO del pergamino: si salían, la misión de
         debajo avanzaba sola, cortaba el minipodcast y podía darse por
         entregada sin que el alumno la viera (2026-08-26) */
      caja.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        e.stopPropagation();
        ir(e.key === "ArrowRight" ? 1 : -1);
      });

      pintar();
      if (window.MF) MF.track("scroll_open", { item: opts.id, art: opts.art, data: { modo: "modal" } });
    }

    /* El panel de error vive DENTRO del modal: nunca saca al alumno de donde
       está. Su botón vuelve a intentar la carga completa. */
    function panelError() {
      if (!sigueSiendoElMio()) return;
      cuerpo.innerHTML = "";
      var box = el('<div class="pergamino-modal__error"><p class="muted"></p></div>');
      box.querySelector("p").textContent = T.error;
      var b = el('<button class="btn btn--primary" type="button"></button>');
      b.textContent = T.reintentar;
      b.addEventListener("click", cargar);
      box.appendChild(b);
      cuerpo.appendChild(box);
      if (window.MF) MF.track("scroll_error", { item: opts.id, art: opts.art });
    }

    /* Carga con hasta tres intentos (backoff corto) y, si aún falla, el panel
       manual. Jamás una navegación fuera: pase lo que pase con la red, el
       alumno se queda en su modal. */
    function cargar() {
      if (!sigueSiendoElMio()) return;
      cuerpo.innerHTML = window.MFCargador ? MFCargador(T.cargando) : '<p class="muted">' + esc(T.cargando) + "</p>";
      var intentos = 0;
      (function probar() {
        traer(opts.id, opts.href, opts.contenido).then(montarVista, function () {
          if (!sigueSiendoElMio()) return;
          intentos++;
          if (intentos < 3) { setTimeout(probar, 500 * intentos); return; }
          panelError();
        });
      })();
    }
    cargar();
    /* el modal ya existe: quien llamó no navega nunca (resuelve true siempre) */
    return Promise.resolve(true);
  }

  window.MFPergamino = { abrir: abrir, cerrar: cerrar };
})();

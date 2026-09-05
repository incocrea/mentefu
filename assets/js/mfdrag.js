/* MenteFu / MindFu — MFDrag: el arrastre compartido de los miniretos.

   Una sola pieza de arrastre para todos los juegos (kintsugi, pasa, herramienta,
   andamio, dominó…), extraída del patrón ya probado del Árbol Cerebro
   (arbol.js:284-320): delegación por pointerdown + closest, setPointerCapture
   con guarda `&&`, límites calculados con getBoundingClientRect, pointercancel
   que suelta el gesto y flag `movido` para matar el clic fantasma.

   Tres reglas de la casa que gobiernan este archivo:
     · El arrastre NUNCA es el único camino (WCAG 2.2 SC 2.5.7): tocar la pieza
       y tocar el destino hace lo mismo, siempre visible, sin menú que activar,
       y con teclado (Enter/Espacio) por el mismo carril.
     · Los gestos del juego no pueden llegar al swipe de misión ni a sus flechas
       (mission.js:245-268): se paran aquí, aunque el modal ya viva en <body>.
     · Presupuesto de rendimiento: en el pointermove solo se escribe transform;
       ni una lectura de layout ni un nodo nuevo dentro del bucle del dedo.
     · La pieza se CENTRA EN EL DEDO al empezar el arrastre (titular
       2026-09-04): lo que se agarra salta a quedar centro-centro bajo el
       puntero en cuanto el gesto deja de ser un tap. Vale para todos los
       juegos, y lo que se centra es el rectángulo de lo que se VE
       (`envolvente`), que no siempre es el del nodo. */
(function () {
  "use strict";

  /* Valores por defecto del contrato (spec F0 §0.5.1). */
  var UMBRAL = 6;        /* px antes de considerar que hay arrastre y no tap */
  var IMAN = 28;         /* px de atracción centro-pieza → centro-destino */
  var MS_ENCAJA = 120;   /* viaje al centro del destino tras un acierto */
  var MS_VUELVE = 200;   /* vuelta al origen */
  var MS_VIAJE = 250;    /* viaje pieza → destino del camino por toques */
  var CURVA_VUELTA = "cubic-bezier(0.2, 0.8, 0.3, 1)";
  var CURVA_RECTA = "ease-out";
  var MS_SORDO = 400;    /* ventana en que se ignora el clic fantasma del arrastre */

  function reducido() {
    /* Misma guarda que MF.confetti (progress.js:373): con movimiento reducido
       el estado final se aplica de golpe, sin esperar animaciones que el
       apagado global de styles.css:103-106 ya ha matado con !important. */
    try { return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); }
    catch (e) { return false; }
  }

  var ahora = (window.performance && window.performance.now)
    ? function () { return window.performance.now(); }
    : function () { return Date.now(); };

  function esNativoFocusable(elemento) {
    var t = (elemento.tagName || "").toUpperCase();
    return t === "BUTTON" || t === "A" || t === "INPUT" || t === "SELECT" || t === "TEXTAREA";
  }

  /* EL CAMBIO DE MONEDA DE LA CASA: píxeles de PANTALLA → píxeles CSS.

     styles.css:79-80 aplica `zoom` al documento entero (0,8 entre 601 y 1400 px
     —tablet y portátil— y 0,9 por encima de 1400). Con `zoom` puesto, un
     `getBoundingClientRect()` y un `e.clientX` llegan YA encogidos, mientras que
     un `translate(Npx)` se escribe en píxeles CSS y el navegador lo vuelve a
     encoger al pintarlo. Restar dos rects y escribir el resultado como transform
     es, por tanto, pedir el 80 % del viaje: la pieza se despega del dedo y el
     hueco crece con la distancia. Medido por los probadores a 768 px: el dedo
     recorría 243 px y el fragmento 191 (0,786), y el tope de `limites` frenaba
     el arrastre un 20 % antes de tiempo, dejando piezas que no alcanzaban su
     destino en la ventana de escritorio.

     La cuenta vive AQUÍ y se exporta (`MFDrag.zoomDe`) porque el problema no es
     del arrastre: es de cualquier juego que mida con rects y escriba transforms
     (la mano de Tameshiwari y el avance de la Kata hacen justo eso). Una sola
     cuenta, un solo sitio donde corregirla si la casa cambia de zoom. */
  function zoomDe(elemento) {
    var z, r, w;
    if (!elemento) return 1;
    /* `currentCSSZoom` (Chrome 128+) ya viene ACUMULADO: si mañana un contenedor
       llevara su propio zoom, la cuenta sigue saliendo sin tocar nada. */
    z = elemento.currentCSSZoom;
    if (typeof z !== "number" || !isFinite(z) || z <= 0) {
      /* Respaldo medible en cualquier navegador: el rect viene en píxeles de
         pantalla y `offsetWidth` en píxeles CSS, así que su cociente ES el zoom
         (verificado en el navegador: 80 / 100 con el zoom de casa puesto). */
      try { r = elemento.getBoundingClientRect(); w = elemento.offsetWidth; }
      catch (e) { return 1; }
      z = (w > 0 && r.width > 0) ? (r.width / w) : 1;
    }
    /* Una medida absurda (elemento oculto, `display:none`, un 0 colado) no puede
       multiplicar por infinito el viaje de una pieza: se cae de pie en 1. */
    return (z > 0.05 && z < 20) ? z : 1;
  }

  /* EL RECTÁNGULO DE LO QUE SE VE, no el del nodo. Casi siempre son el mismo,
     y entonces basta con el rect de la pieza más el de sus hijos por si alguno
     sobresale. Pero hay piezas cuyo nodo es un marco vacío: la ficha del dominó
     en vuelo mide 173×101 y no pinta nada —ni fondo, ni borde, ni sombra:
     medido—, mientras su dibujo es una lámina de 42×69 pegada al fondo de esa
     caja, 17 px por debajo de su centro. Centrar la caja dejaba la ficha baja
     respecto al dedo, que es justo lo que se veía raro.
     Por eso el juego puede declarar `cuerpo`: el selector de su dibujo. No hay
     heurística que adivine qué pinta y qué no —los pseudo-elementos y las
     sombras no salen en ningún rect—, así que lo dice quien lo sabe.
     Se llama UNA vez por gesto, en el pointerdown, donde ya se lee layout. */
  function envolvente(p, cuerpo) {
    var nodos = null, base = p, i, q, l, t, d, b, r;
    if (cuerpo) {
      try { nodos = p.querySelectorAll(cuerpo); } catch (e) { nodos = null; }
      /* Si el selector no casa —una pieza de otra forma, un estado sin lámina—
         se mide la pieza entera: nunca dejar el gesto sin rectángulo. */
      if (nodos && nodos.length) base = nodos[0];
    }
    r = base.getBoundingClientRect();
    l = r.left; t = r.top; d = r.right; b = r.bottom;
    /* Sin `cuerpo` se barren los descendientes (el caso del hijo que sobresale);
       con `cuerpo`, los demás nodos que casen. */
    var lista = (nodos && nodos.length) ? nodos : p.querySelectorAll("*");
    for (i = 0; i < lista.length; i++) {
      q = lista[i].getBoundingClientRect();
      /* Los de área nula no cuentan: son los rótulos que MFDrag deja de 1×1 px
         para no dejar sin nombre accesible a la pieza mientras vuela, y los
         nodos ocultos. Sumarlos correría el centro hacia una esquina. */
      if (q.width <= 1 || q.height <= 1) continue;
      if (q.left < l) l = q.left;
      if (q.top < t) t = q.top;
      if (q.right > d) d = q.right;
      if (q.bottom > b) b = q.bottom;
    }
    return { left: l, top: t, right: d, bottom: b, width: d - l, height: b - t };
  }

  function tope(v, min, max) {
    /* Si la pieza es más grande que la zona el intervalo se invierte: en ese
       caso no hay tope posible y se deja pasar el valor tal cual. */
    if (min > max) return v;
    return Math.max(min, Math.min(max, v));
  }

  /* cfg: { zona, piezas, destinos, cuerpo, centrar, umbral, iman, limites, toques,
            alAgarrar, alMover, alSoltar, alTocar, alEncajado }   → devuelve `control`

     alEncajado(pieza, destino) es OPCIONAL y se avisa cuando el viaje de encaje
     TERMINA (120 ms por arrastre, 250 ms por toques). Es el único instante en
     que la pieza ya está en su hueco, así que es el sitio donde el juego cambia
     la lámina por la del estado «encajada» (spec F0 §0.5.1 y §0.12): antes del
     final la pieza todavía está en el aire y el intercambio se vería a mitad
     del recorrido. */
  function crear(cfg) {
    cfg = cfg || {};
    var zona = cfg.zona;
    /* Sin zona no hay nada que armar, pero el llamante debe poder guardar el
       control y llamar a destruir() sin comprobar nada. */
    if (!zona || !zona.addEventListener) {
      return { destruir: function () {}, elegir: function () {}, elegida: function () { return null; } };
    }

    var selPiezas = cfg.piezas || "";
    var selDestinos = cfg.destinos || "";
    /* `cuerpo`: el selector del DIBUJO dentro de la pieza, cuando el nodo que se
       arrastra es un marco que no pinta nada (ver `envolvente`). Opcional. */
    var selCuerpo = cfg.cuerpo || "";
    /* El centrado en el dedo viene ENCENDIDO: es la regla de la casa. Solo se
       apaga donde el gesto no es «colocar» sino «tirar» y la pieza casi llena
       su zona, que es el andamio (ver su ficha). */
    var centrar = cfg.centrar !== false;
    var umbral = typeof cfg.umbral === "number" ? cfg.umbral : UMBRAL;
    var iman = typeof cfg.iman === "number" ? cfg.iman : IMAN;
    var limites = cfg.limites !== false;   /* default true */
    var toques = cfg.toques !== false;     /* default true: la alternativa SIEMPRE viva */

    var d = null;             /* gesto en curso: { pieza, id, movido, … } */
    var elegidaEl = null;     /* pieza elegida del camino por toques */
    var animando = false;     /* anti-mash: durante una animación los taps se ignoran */
    var clicSordo = false;    /* hay un clic fantasma pendiente de tragarse */
    var relojes = [];         /* setTimeout vivos, para poder morir limpio */
    var vivo = true;

    /* ---- preparación de la zona ------------------------------------- */
    zona.setAttribute("data-mfdrag", "");
    zona.classList.add("mfdrag-zona");
    var touchAction0 = zona.style.touchAction;
    /* El touch-action va TAMBIÉN en línea aunque .mfdrag-zona lo traiga en
       game.css: si esa regla llegara tarde o faltara, el navegador se queda el
       gesto para hacer scroll y la pieza se despega del dedo a mitad de
       arrastre — el mismo síntoma que documenta arbol.js:307-308. */
    zona.style.touchAction = "none";

    /* ---- posición: nuestras traslaciones se componen sobre la del juego ---- */
    function base(p) {
      /* La transformación propia de la pieza (la que le pone el layout del
         juego) se guarda UNA sola vez; así el juego puede seguir usando
         transform para colocar sus piezas sin que el arrastre la pise. */
      if (typeof p.__mfdragBase !== "string") p.__mfdragBase = p.style.transform || "";
      return p.__mfdragBase;
    }
    function desfase(p) {
      if (!p.__mfdragOff) p.__mfdragOff = { x: 0, y: 0 };
      return p.__mfdragOff;
    }
    /* MFDrag HABLA SIEMPRE EN PÍXELES CSS: los desfases que guarda, los topes,
       los orígenes, el `dx/dy/vx` que entrega a los juegos y el punto del dedo
       de `alMover`. La traducción ocurre en la FRONTERA —donde entran rects y
       `clientX`, que vienen en píxeles de pantalla— y no al pintar, porque los
       juegos hacen dos cosas con lo que se les entrega: compararlo con medidas
       suyas (el ancho de la carta de «Pasa») y usarlo para arrancar sus propias
       animaciones desde donde el dedo dejó la pieza. Con dos monedas mezcladas,
       una de las dos salía mal siempre.
       El zoom se MIDE donde ya se está leyendo layout de todos modos (el
       pointerdown y el viaje al centro del destino) y se guarda en la pieza: el
       pointermove no puede permitirse ni una lectura más (presupuesto F0
       §0.10.2), y en los navegadores sin `currentCSSZoom` la cuenta cuesta un
       rect. Si el viewport cruza un corte de zoom con el modal abierto, el valor
       viejo dura hasta el siguiente gesto, que es cuando vuelve a medirse. */
    function medirZoom(p) { p.__mfdragZoom = zoomDe(p); return p.__mfdragZoom; }
    function zoomPieza(p) {
      return (typeof p.__mfdragZoom === "number") ? p.__mfdragZoom : medirZoom(p);
    }
    function pintar(p, x, y) {
      var b = base(p);
      p.style.transform = (b ? b + " " : "") + "translate(" + x + "px, " + y + "px)";
    }
    function fijar(p, x, y) {
      var o = desfase(p);
      o.x = x; o.y = y;
      pintar(p, x, y);
    }
    function soltarPieza(p) {
      p.style.transition = "";
      p.style.willChange = "";                 /* will-change solo durante el gesto (0.10.2) */
      p.classList.remove("mfdrag-vuelo");
    }

    function apuntarReloj(id) { relojes.push(id); }
    function olvidarReloj(id) {
      var i;
      for (i = 0; i < relojes.length; i++) { if (relojes[i] === id) { relojes.splice(i, 1); return; } }
    }

    /* Anima la pieza hasta (x,y) con transform y avisa al terminar. Con
       movimiento reducido salta al estado final y llama ya: ninguna promesa
       del juego puede quedarse esperando una animación inexistente. */
    function animar(p, x, y, ms, curva, alAcabar) {
      if (!vivo) return;
      if (reducido() || !ms) {
        fijar(p, x, y);
        soltarPieza(p);
        if (alAcabar) alAcabar();
        return;
      }
      animando = true;
      p.style.transition = "transform " + ms + "ms " + curva;
      fijar(p, x, y);
      var id = window.setTimeout(function () {
        olvidarReloj(id);
        animando = false;
        soltarPieza(p);
        if (alAcabar) alAcabar();
      }, ms + 20);
      apuntarReloj(id);
    }

    /* Lleva la pieza al centro del destino. UNA lectura de layout y luego solo
       escrituras (0.10.2: sin layout thrash). */
    function alCentroDe(p, destino, ms, alAcabar) {
      var rp = p.getBoundingClientRect();
      var rd = destino.getBoundingClientRect();
      var o = desfase(p);
      var k = medirZoom(p);               /* aquí ya se lee layout: sale gratis */
      /* Los rects vienen en píxeles de pantalla y el desfase se guarda en CSS:
         sin dividir, la pieza se quedaba a un 20 % de su hueco en tablet y
         portátil (los probadores midieron un fragmento que no llegaba nunca a
         soldar en la ventana de escritorio). */
      animar(p,
        o.x + ((rd.left + rd.width / 2) - (rp.left + rp.width / 2)) / k,
        o.y + ((rd.top + rd.height / 2) - (rp.top + rp.height / 2)) / k,
        ms, CURVA_RECTA, alAcabar);
    }

    /* ---- piezas y destinos: accesibles desde el primer render ---------- */
    function prepararPieza(p) {
      if (p.__mfdragPieza) return;
      p.__mfdragPieza = true;
      p.setAttribute("data-mfdrag-pieza", "");
      /* Teclado de primera clase (0.5.3): la pieza es un botón para quien no
         puede arrastrar. Si ya es un control nativo no se le toca nada. */
      if (!esNativoFocusable(p)) {
        if (!p.hasAttribute("tabindex")) { p.setAttribute("tabindex", "0"); p.__mfdragTab = true; }
        if (!p.hasAttribute("role")) { p.setAttribute("role", "button"); p.__mfdragRole = true; }
      }
      p.setAttribute("aria-pressed", "false");
    }

    function preparar() {
      if (!selPiezas) return;
      var lista = zona.querySelectorAll(selPiezas), i;
      for (i = 0; i < lista.length; i++) prepararPieza(lista[i]);
    }

    function listaDestinos() {
      if (!selDestinos) return [];
      return [].slice.call(zona.querySelectorAll(selDestinos));
    }

    /* Con una pieza elegida los destinos entran en el orden del tabulador: es
       el único modo de completar la jugada con teclado puro. */
    function marcarDestinos(activo) {
      var lista = listaDestinos(), i, dst;
      for (i = 0; i < lista.length; i++) {
        dst = lista[i];
        if (activo) {
          if (!esNativoFocusable(dst) && !dst.hasAttribute("tabindex")) {
            dst.setAttribute("tabindex", "0");
            dst.__mfdragTab = true;
          }
          dst.setAttribute("data-mfdrag-activo", "");
        } else {
          if (dst.__mfdragTab) { dst.removeAttribute("tabindex"); dst.__mfdragTab = false; }
          dst.removeAttribute("data-mfdrag-activo");
        }
      }
    }

    /* ---- elección (camino por toques y teclado) ----------------------- */
    function elegir(p) {
      if (elegidaEl && elegidaEl !== p) {
        elegidaEl.classList.remove("mfdrag-elegida");
        elegidaEl.setAttribute("aria-pressed", "false");
      }
      elegidaEl = p || null;
      if (elegidaEl) {
        prepararPieza(elegidaEl);
        elegidaEl.classList.add("mfdrag-elegida");
        elegidaEl.setAttribute("aria-pressed", "true");
      }
      marcarDestinos(!!elegidaEl);
    }
    function alternar(p) { elegir(elegidaEl === p ? null : p); }

    /* ---- resolución del destino al soltar ----------------------------- */
    function resolverDestino(px, py, cx, cy, k) {
      var lista = listaDestinos();
      var porSolape = null, areaMin = Infinity;
      var porIman = null, distMin = Infinity;
      var i, r, area, ex, ey, dist;
      k = (k > 0) ? k : 1;   /* los rects vienen en px de pantalla; el imán se declara en px CSS */
      for (i = 0; i < lista.length; i++) {
        r = lista[i].getBoundingClientRect();
        /* (1) SOLAPE: el dedo se levanta DENTRO del destino. Manda sobre el
           imán porque en un destino grande (una bandeja de 324×172 px) exigir
           el centro geométrico haría el juego imposible. Si varios se solapan,
           gana el de MENOR área: el pequeño anidado nunca queda sepultado. */
        if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) {
          area = r.width * r.height;
          if (area < areaMin) { areaMin = area; porSolape = lista[i]; }
        }
        /* (2) IMÁN: respaldo centro-a-centro para las piezas que se sueltan
           «cerca». `iman: 0` lo apaga; el solape sigue vivo siempre. */
        if (iman > 0) {
          ex = (r.left + r.width / 2) - cx;
          ey = (r.top + r.height / 2) - cy;
          /* La distancia se pasa a píxeles CSS antes de compararla: el juego
             declara `iman: 60` pensando en los 60 px con los que dibuja su
             escena, y sin la división el imán perdía un 20 % de generosidad
             justo en tablet, donde la casa aplica su zoom. */
          dist = Math.sqrt(ex * ex + ey * ey) / k;
          if (dist <= iman && dist < distMin) { distMin = dist; porIman = lista[i]; }
        }
      }
      return porSolape || porIman;
    }

    function veredictoDe(fn, pieza, destino, info) {
      var r = "libre";
      try { if (typeof fn === "function") r = fn(pieza, destino, info); }
      catch (e) { r = "vuelve"; }   /* si el juego se rompe, la pieza no se queda colgada del dedo */
      if (r !== "encaja" && r !== "libre" && r !== "vuelve") r = "vuelve";
      if (r === "encaja" && !destino) r = "vuelve";   /* no hay centro al que ir */
      return r;
    }

    /* El aviso de encaje va en try/catch como el resto de callbacks del juego
       (veredictoDe, alAgarrar, alMover): un juego que reviente cambiando su
       lámina no puede dejar la pieza a medio viaje ni tumbar el arrastre de las
       que faltan. Y se declara aquí, una sola vez, porque lo llaman los DOS
       caminos: el que se aviva con el dedo y el que se aviva con el teclado. */
    function avisarEncajado(pieza, destino) {
      if (typeof cfg.alEncajado !== "function") return;   /* opcional: quien no lo declare sigue igual */
      try { cfg.alEncajado(pieza, destino); } catch (e) { /* nada */ }
    }

    function aplicarVeredicto(pieza, destino, veredicto, origen) {
      if (veredicto === "encaja") {
        alCentroDe(pieza, destino, MS_ENCAJA, function () { avisarEncajado(pieza, destino); });
      }
      else if (veredicto === "libre") soltarPieza(pieza);       /* modo lienzo: se queda donde está */
      else animar(pieza, origen.x, origen.y, MS_VUELVE, CURVA_VUELTA, null);
    }

    /* Camino por toques: el viaje se ve ANTES de aplicar el veredicto, para que
       el ojo entienda que la pieza fue al destino aunque luego rebote. */
    function viajar(pieza, destino) {
      var origen = { x: desfase(pieza).x, y: desfase(pieza).y };
      var veredicto = veredictoDe(cfg.alTocar, pieza, destino, { movido: false, vx: 0, dx: 0, dy: 0 });
      elegir(null);
      pieza.classList.add("mfdrag-vuelo");
      pieza.style.willChange = "transform";
      alCentroDe(pieza, destino, MS_VIAJE, function () {
        if (veredicto === "vuelve") {
          animar(pieza, origen.x, origen.y, MS_VUELVE, CURVA_VUELTA, null);
          return;
        }
        /* Los toques avisan igual que el arrastre: si el enganche viviera solo en
           aplicarVeredicto, el juego cambiaría de sprite con el dedo y no con el
           teclado — y la alternativa accesible dejaría de contar lo mismo. */
        avisarEncajado(pieza, destino);
      });
    }

    /* ---- gesto de puntero --------------------------------------------- */
    function alPulsar(e) {
      if (!vivo || animando || d) return;          /* un solo dedo manda; nada durante la celebración */
      if (!selPiezas || !e.target || !e.target.closest) return;
      var pieza = e.target.closest(selPiezas);
      if (!pieza || !zona.contains(pieza)) return;
      e.preventDefault();
      /* Defensa en profundidad: el swipe de misión (mission.js:253-268) no debe
         ver ni el principio del gesto, aunque un juego se incruste algún día
         fuera del modal. */
      e.stopPropagation();
      prepararPieza(pieza);
      /* Guarda `&&` calcada de arbol.js:292: hay navegadores sin captura. */
      pieza.setPointerCapture && pieza.setPointerCapture(e.pointerId);
      /* EL SPRITE CAMBIA PRIMERO, SE MIDE DESPUÉS. `.mfdrag-vuelo` y `alAgarrar`
         pueden dejar otra pieza de la que había en reposo —el dominó levanta la
         ficha y le da el tamaño que tendrá puesta—, así que medir antes daba los
         topes y el centro del sprite viejo. El rect fuerza el reflow, de modo
         que lo que se lee ya es la pieza nueva (el cambio de tamaño no lleva
         transición: se comprobó en la hoja). */
      pieza.style.willChange = "transform";
      pieza.classList.add("mfdrag-vuelo");
      if (typeof cfg.alAgarrar === "function") { try { cfg.alAgarrar(pieza); } catch (err) { /* nada */ } }
      var rz = zona.getBoundingClientRect();
      var rp = envolvente(pieza, selCuerpo);
      /* La pasada de layout del gesto ya está hecha, así que medir el zoom aquí
         sale gratis: es el cambio de moneda de TODO lo que viene después. */
      var k = medirZoom(pieza);
      var o = desfase(pieza);
      var t = ahora();
      d = {
        pieza: pieza, id: e.pointerId, movido: false, k: k,
        x0: e.clientX, y0: e.clientY,
        /* LA PIEZA SE CENTRA EN EL DEDO (titular 2026-09-04). Lo que se agarra
           salta a quedar centro-centro bajo el puntero en cuanto el gesto pasa
           de tap a arrastre. Antes el arrastre era puramente relativo —la pieza
           conservaba el punto por donde se la cogió—, que es lo correcto cuando
           la pieza no cambia; pero el dominó cambia de sprite al levantarla y el
           punto de agarre dejaba de señalar nada, así que la ficha viajaba
           descolocada respecto al dedo. Se calcula aquí, con la pieza aún en
           reposo, y se aplica en el primer movimiento de verdad: en un tap la
           pieza no se mueve ni un píxel. */
        cx: centrar ? (e.clientX - (rp.left + rp.width / 2)) / k : 0,
        cy: centrar ? (e.clientY - (rp.top + rp.height / 2)) / k : 0,
        origen: { x: o.x, y: o.y },
        rz: rz,
        /* Topes precalculados: cuánto puede desplazarse la pieza sin salirse de
           la zona (mismo cálculo de medio ancho/alto de arbol.js:299-305, aquí
           en píxeles). Se resuelven AQUÍ para no leer layout en el pointermove.
           Van divididos por el zoom porque los rects miden pantalla y el tope se
           compara contra un desplazamiento en píxeles CSS. */
        minx: (rz.left - rp.left) / k, maxx: (rz.right - rp.right) / k,
        miny: (rz.top - rp.top) / k, maxy: (rz.bottom - rp.bottom) / k,
        ax: o.x, ay: o.y,
        dx: 0, dy: 0,
        /* dos muestras bastan para la velocidad media del final del gesto */
        tA: t, xA: e.clientX / k, tB: t, xB: e.clientX / k
      };
    }

    function alArrastrar(e) {
      if (!d || e.pointerId !== d.id) return;
      /* El viaje del dedo, pasado a píxeles CSS en la puerta de entrada: de aquí
         salen el transform que se pinta, el `dx/dy` que juzga el juego y el
         punto que recibe `alMover`. Es una división, no una lectura de layout:
         el presupuesto del pointermove sigue intacto. */
      var dx = (e.clientX - d.x0) / d.k, dy = (e.clientY - d.y0) / d.k;
      /* Por debajo del umbral esto todavía es un tap: ni se mueve ni se marca. */
      if (!d.movido && Math.abs(dx) < umbral && Math.abs(dy) < umbral) return;
      d.movido = true;
      /* `dx/dy` es el viaje del DEDO y así se le entrega al juego; el traslado
         que se pinta lleva además el salto de centrado, y el tope se aplica
         sobre la suma, que es lo que de verdad se desplaza la pieza. */
      d.dx = dx; d.dy = dy;
      var tx = d.cx + dx, ty = d.cy + dy;
      d.ax = d.origen.x + (limites ? tope(tx, d.minx, d.maxx) : tx);
      d.ay = d.origen.y + (limites ? tope(ty, d.miny, d.maxy) : ty);
      pintar(d.pieza, d.ax, d.ay);        /* solo transform: nada de left/top */
      /* La pareja de muestras solo rota cuando el reloj ha avanzado de verdad:
         con eventos coalescidos dos muestras pueden caer en el mismo
         milisegundo y la velocidad saldría 0 justo en el gesto más rápido. */
      var t = ahora();
      if (t > d.tB) { d.tA = d.tB; d.xA = d.xB; d.tB = t; }
      d.xB = e.clientX / d.k;
      if (typeof cfg.alMover === "function") {
        /* x,y = el punto del dedo DENTRO de la zona, en píxeles CSS: el juego lo
           compara con medidas suyas (el ancho de su carta, el largo de su
           repisa). El rect de la zona está cacheado del pointerdown, así que
           aquí no se lee layout. */
        try { cfg.alMover(d.pieza, (e.clientX - d.rz.left) / d.k, (e.clientY - d.rz.top) / d.k); }
        catch (err) { /* nada */ }
      }
    }

    function velocidad(g) {
      var dt = g.tB - g.tA;
      if (dt <= 0) return 0;
      return (g.xB - g.xA) / dt;   /* px/ms CON signo: el sentido importa (F3, «Pasa») */
    }

    function alLevantar(e) {
      if (!d || e.pointerId !== d.id) return;
      var g = d; d = null;
      var pieza = g.pieza;
      if (!g.movido) {
        /* TAP limpio: es el camino por toques, no un arrastre fallido. */
        soltarPieza(pieza);
        if (toques) alternar(pieza);
        return;
      }
      /* La posición pintada pasa a ser la posición real de la pieza. */
      var o = desfase(pieza);
      o.x = g.ax; o.y = g.ay;
      armarClicSordo();
      /* El imán mide desde el centro de lo que se VE, la misma vara con la que
         se centró la pieza en el dedo: con dos definiciones distintas de «dónde
         está la pieza», la que atrae y la que se ve, el imán tiraría desde un
         punto que el alumno no tiene delante. */
      var rp = envolvente(pieza, selCuerpo);
      var destino = resolverDestino(e.clientX, e.clientY,
        rp.left + rp.width / 2, rp.top + rp.height / 2, zoomPieza(pieza));
      var info = { movido: true, vx: velocidad(g), dx: g.dx, dy: g.dy };
      var veredicto = veredictoDe(cfg.alSoltar, pieza, destino, info);
      if (elegidaEl === pieza) elegir(null);
      aplicarVeredicto(pieza, destino, veredicto, g.origen);
    }

    function alCancelarGesto(e) {
      if (!d || (e && e.pointerId !== d.id)) return;
      var g = d; d = null;
      /* Si el navegador se queda el gesto (scroll, notificación, llamada), la
         pieza vuelve sola: sin esto «el adorno seguía pegado al dedo»
         (arbol.js:307-313). No se juzga nada: el juego no llegó a soltar. */
      animar(g.pieza, g.origen.x, g.origen.y, MS_VUELVE, CURVA_VUELTA, null);
    }

    /* ---- clic fantasma y taps en destinos ----------------------------- */
    function armarClicSordo() {
      clicSordo = true;
      /* Si tras el arrastre no llega ningún clic, el flag se desarma solo: un
         flag olvidado se comería el siguiente tap legítimo. */
      var id = window.setTimeout(function () { olvidarReloj(id); clicSordo = false; }, MS_SORDO);
      apuntarReloj(id);
    }

    function alClicCaptura(e) {
      if (!clicSordo) return;
      clicSordo = false;
      /* El clic que el navegador emite al final de un arrastre no puede elegir
         la pieza ni activar un destino. */
      e.stopPropagation();
      e.preventDefault();
    }

    function alClic(e) {
      if (!vivo || !toques || animando || !selDestinos) return;
      if (!e.target || !e.target.closest) return;
      /* El tap sobre una pieza ya lo resolvió su pointerup: si la pieza vive
         dentro de un destino, este clic no debe además lanzar el viaje. */
      if (selPiezas && e.target.closest(selPiezas)) return;
      var destino = e.target.closest(selDestinos);
      if (!destino || !zona.contains(destino) || !elegidaEl) return;
      viajar(elegidaEl, destino);
    }

    /* ---- teclado ------------------------------------------------------- */
    function alTeclado(e) {
      if (!vivo || !e.target || !e.target.closest) return;
      var flecha = e.key === "ArrowLeft" || e.key === "ArrowRight" ||
                   e.key === "ArrowUp" || e.key === "ArrowDown";
      var activar = e.key === "Enter" || e.key === " " || e.key === "Spacebar";
      if (!flecha && !activar) return;
      /* Doble cinturón (0.5.3): ninguna tecla de juego llega al listener global
         de mission.js:245-249, que cambiaría de tarjeta a mitad de partida —
         ArrowLeft ni siquiera está protegido por el estado del botón. */
      e.stopPropagation();
      if (!activar || !toques || animando) return;
      var pieza = selPiezas ? e.target.closest(selPiezas) : null;
      if (pieza && zona.contains(pieza)) {
        e.preventDefault();                      /* el Espacio no debe hacer scroll */
        alternar(pieza);
        return;
      }
      var destino = selDestinos ? e.target.closest(selDestinos) : null;
      if (destino && zona.contains(destino) && elegidaEl) {
        e.preventDefault();
        viajar(elegidaEl, destino);
      }
    }

    /* ---- alta de escuchas ---------------------------------------------- */
    zona.addEventListener("pointerdown", alPulsar);
    zona.addEventListener("pointermove", alArrastrar);
    zona.addEventListener("pointerup", alLevantar);
    zona.addEventListener("pointercancel", alCancelarGesto);
    zona.addEventListener("click", alClicCaptura, true);   /* captura: antes que nadie */
    zona.addEventListener("click", alClic);
    zona.addEventListener("keydown", alTeclado);
    /* Red de seguridad: si la captura de puntero no existe y el dedo se levanta
       fuera de la zona, el pointerup de la ventana cierra el gesto. Cuando el
       de la zona ha corrido primero, `d` ya es null y estos no hacen nada. */
    window.addEventListener("pointerup", alLevantar);
    window.addEventListener("pointercancel", alCancelarGesto);

    preparar();
    /* Los juegos montan y repintan piezas después de crear el arrastre; sin
       esto, esas piezas nacerían sin tabindex y el camino de teclado moriría a
       mitad de partida. Solo se vigila la lista de hijos: los cambios de clase
       de las animaciones no despiertan nada. */
    var observador = null;
    if (window.MutationObserver) {
      observador = new window.MutationObserver(function () { preparar(); });
      observador.observe(zona, { childList: true, subtree: true });
    }

    function destruir() {
      if (!vivo) return;                 /* idempotente: cerrar dos veces no rompe */
      vivo = false;
      zona.removeEventListener("pointerdown", alPulsar);
      zona.removeEventListener("pointermove", alArrastrar);
      zona.removeEventListener("pointerup", alLevantar);
      zona.removeEventListener("pointercancel", alCancelarGesto);
      zona.removeEventListener("click", alClicCaptura, true);
      zona.removeEventListener("click", alClic);
      zona.removeEventListener("keydown", alTeclado);
      window.removeEventListener("pointerup", alLevantar);
      window.removeEventListener("pointercancel", alCancelarGesto);
      if (observador) observador.disconnect();
      var i;
      for (i = 0; i < relojes.length; i++) window.clearTimeout(relojes[i]);
      relojes = [];
      elegir(null);                      /* también devuelve los destinos a su estado */
      var lista = zona.querySelectorAll("[data-mfdrag-pieza]"), p;
      for (i = 0; i < lista.length; i++) {
        p = lista[i];
        p.classList.remove("mfdrag-vuelo");
        p.classList.remove("mfdrag-elegida");
        p.style.transition = "";
        p.style.willChange = "";
        p.removeAttribute("aria-pressed");
        p.removeAttribute("data-mfdrag-pieza");
        if (p.__mfdragTab) p.removeAttribute("tabindex");
        if (p.__mfdragRole) p.removeAttribute("role");
        p.__mfdragPieza = false; p.__mfdragTab = false; p.__mfdragRole = false;
      }
      zona.removeAttribute("data-mfdrag");
      zona.classList.remove("mfdrag-zona");
      zona.style.touchAction = touchAction0 || "";
      d = null;
      animando = false;
      clicSordo = false;
    }

    return {
      destruir: destruir,
      elegir: function (p) { if (vivo) elegir(p || null); },
      elegida: function () { return elegidaEl; },
      /* Vuelve a plantar una pieza YA encajada en el centro de su destino, sin
         viaje ni veredicto. Existe por lo que midieron los probadores al girar
         la pantalla con la partida en marcha: el desfase de una pieza encajada
         está en píxeles, así que un cambio de ancho mueve el destino y deja la
         pieza descolocada (la llave, fuera de la cerradura). El juego sabe
         cuándo tiene una faena en curso; MFDrag no, y por eso no lo hace solo:
         recolocar a ciegas una pieza cuyo destino ya se ocultó la mandaría a la
         esquina de la pantalla. */
      recentrar: function (p, destino) {
        if (!vivo || !p || !destino) return;
        alCentroDe(p, destino, 0, null);
      }
    };
  }

  window.MFDrag = { crear: crear, zoomDe: zoomDe };
})();

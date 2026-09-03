/* MenteFu / MindFu — kit de celebración de los miniretos (MFJuice + MFSonido).

   Los minijuegos no deben inventar cada uno su propio sabor: si cada ficha
   dibujara sus partículas y midiera sus tiempos, los ocho juegos acabarían
   pareciendo ocho productos distintos. Aquí vive la receta única del acierto
   (respuesta → anticipación → impacto → cosecha → sello → cobro) y el ruido
   sintetizado, para que una fase futura solo tenga que llamar, nunca definir.

   Tres reglas gobiernan este archivo:
     · TODA función devuelve una promesa y esa promesa SIEMPRE resuelve. Los
       juegos encadenan su lógica detrás del efecto; una promesa colgada dejaría
       la partida congelada sin síntoma visible.
     · Con `prefers-reduced-motion` no se crea ni un nodo y se resuelve al
       instante: el apagado global de styles.css ya mata los keyframes, así que
       esperar 600 ms serviría solo para retrasar el resultado. El texto que
       sustituye al efecto lo pone el juego, que es quien sabe qué decir.
     · El CSS (clases y keyframes `juice-*`) vive en game.css. Aquí solo se
       ponen y quitan clases y se escriben custom properties: así el diseño se
       retoca sin tocar la lógica.

   El sonido va aparte (MFSonido) porque es opcional, encendido por defecto
   (titular 2026-08-28) y gobernado por un único interruptor que también manda
   sobre la vibración. */
(function () {
  "use strict";

  /* ---------------------------------------------------------------- utilería */

  function ya() { return Promise.resolve(); }

  /* Un temporizador que resuelve; nunca rechaza. `fin` se ejecuta ANTES de
     resolver para que el estado del DOM ya esté limpio cuando el juego siga. */
  function espera(ms, fin) {
    return new Promise(function (resolver) {
      setTimeout(function () {
        if (fin) { try { fin(); } catch (e) { /* un efecto roto no bloquea la partida */ } }
        resolver();
      }, ms);
    });
  }

  function entre(min, max, v, def) {
    v = (typeof v === "number" && isFinite(v)) ? v : def;
    return Math.max(min, Math.min(max, v));
  }

  function azar(a, b) { return a + Math.random() * (b - a); }

  /* Rango tolerante: acepta [min, max] y también un número suelto. */
  function rango(v, defMin, defMax) {
    if (typeof v === "number" && isFinite(v)) return [v, v];
    if (v && typeof v.length === "number" && v.length >= 2) return [Number(v[0]), Number(v[1])];
    return [defMin, defMax];
  }

  /* Reinicia una animación CSS aunque la clase ya estuviera puesta: sin el
     reflow intermedio el navegador no vuelve a lanzar el keyframe y el segundo
     acierto seguido se quedaría sin squash. */
  function reanimar(el, clase) {
    el.classList.remove(clase);
    void el.offsetWidth;
    el.classList.add(clase);
  }

  function reducido() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  /* ------------------------------------------------------ 1. capa de efectos */

  /* La crea la infraestructura (MFRetos.abrir) una sola vez y se la entrega a
     cada juego en `montaje.escenario`. Vive DENTRO de la caja del modal: el
     confeti a pantalla completa queda reservado al cinturón. */
  function preparar(caja) {
    if (!caja) return null;
    var previo = caja.querySelector(".juice-escenario");
    if (previo) return previo;                 /* idempotente: nunca dos capas */
    var capa = document.createElement("div");
    capa.className = "juice-escenario";
    capa.setAttribute("aria-hidden", "true");  /* decoración pura: el lector de pantalla lee .reto-vivo */
    caja.appendChild(capa);
    return capa;
  }

  /* --------------------------------------------------------- 2. la respuesta */

  /* Síncrona y sin promesa a propósito: el hundimiento tiene que verse en el
     mismo frame del pointerdown; cualquier await lo empujaría por encima de los
     100 ms que separan «responde» de «va lento». */
  var presionados = [];
  var escuchaSuelta = false;

  function soltarTodos() {
    for (var i = 0; i < presionados.length; i++) {
      if (presionados[i]) presionados[i].classList.remove("juice-presionado");
    }
    presionados.length = 0;
  }

  function respuesta(el) {
    if (!el || !el.classList) return;
    el.classList.add("juice-presionado");
    presionados.push(el);
    /* Un único juego de listeners para toda la vida de la página en lugar de
       uno por pulsación: soltar el dedo fuera del elemento, cancelar el gesto o
       perder el foco de la ventana dejaría la pieza hundida para siempre. */
    if (!escuchaSuelta) {
      escuchaSuelta = true;
      document.addEventListener("pointerup", soltarTodos, true);
      document.addEventListener("pointercancel", soltarTodos, true);
      document.addEventListener("mouseup", soltarTodos, true);
      document.addEventListener("touchend", soltarTodos, true);
      window.addEventListener("blur", soltarTodos);
    }
  }

  /* ---------------------------------------- 3. anticipación, hitstop, deformes */

  /* La señal previa al premio (Schultz): el temblor avisa de que algo va a
     pasar sin exigir habilidad. Con movimiento reducido no hay temblor Y
     tampoco espera: el juego pasa directo al impacto. */
  function anticipar(el, ms) {
    if (!el || !el.classList || reducido()) return ya();
    var d = entre(300, 600, ms, 400);
    el.classList.add("juice-anticipa");
    return espera(d, function () { el.classList.remove("juice-anticipa"); });
  }

  /* Congelar 70 ms todo lo que se mueve dentro de la caja es lo que convierte
     un cambio de estado en un GOLPE. Sin animaciones que congelar (movimiento
     reducido) no tiene sentido y solo añadiría latencia. */
  function hitstop(caja, ms) {
    if (!caja || !caja.classList || reducido()) return ya();
    var d = entre(60, 80, ms, 70);
    caja.classList.add("juice-hitstop");
    return espera(d, function () { caja.classList.remove("juice-hitstop"); });
  }

  function squash(el) {
    if (!el || !el.classList || reducido()) return ya();
    reanimar(el, "juice-squash");
    return espera(220, function () { el.classList.remove("juice-squash"); });
  }

  function estirar(el) {
    if (!el || !el.classList || reducido()) return ya();
    reanimar(el, "juice-stretch");
    return espera(180, function () { el.classList.remove("juice-stretch"); });
  }

  /* ---------------------------------------------------------- 4. partículas */

  /* Las cuatro geometrías quedan cerradas aquí y en game.css. Si cada juego
     pudiera declarar la suya, las cuatro acabarían siendo el mismo cuadrado y
     la cosecha perdería su carácter por juego. */
  var FORMAS = { chispa: 1, astilla: 1, petalo: 1, estrella: 1 };
  var COLORES = ["#e63b2e", "#f2c230", "#f7f3ec"];

  function particulas(escenario, opts) {
    if (!escenario || reducido()) return ya();   /* guarda ANTES de crear nada: patrón de MF.confetti */
    opts = opts || {};

    var forma = FORMAS[opts.forma] ? opts.forma : "chispa";
    var n = Math.round(entre(6, 12, opts.n, 8)); /* techo duro de 12 nodos por efecto (presupuesto 0.10.2) */
    var x = (typeof opts.x === "number" && isFinite(opts.x)) ? opts.x : 0;
    var y = (typeof opts.y === "number" && isFinite(opts.y)) ? opts.y : 0;
    var angulo = (typeof opts.angulo === "number" && isFinite(opts.angulo)) ? opts.angulo : -90;
    var dispersion = (typeof opts.dispersion === "number" && isFinite(opts.dispersion)) ? opts.dispersion : 50;
    var dist = rango(opts.dist, 40, 90);
    var dur = rango(opts.dur, 450, 650);
    var colores = (opts.colores && opts.colores.length) ? opts.colores : COLORES;
    /* Solo astilla y pétalo tienen eje visible; girar una chispa redonda o una
       estrella simétrica de partida no se nota y gasta cálculo. */
    var conGiro = (forma === "astilla" || forma === "petalo");

    var nodos = [];
    var maxDur = 0;
    for (var i = 0; i < n; i++) {
      var grados = angulo + azar(-dispersion, dispersion);
      var rad = grados * Math.PI / 180;
      var d = azar(dist[0], dist[1]);
      var ms = Math.round(azar(dur[0], dur[1]));
      if (ms > maxDur) maxDur = ms;

      var p = document.createElement("i");
      p.className = "juice-particula juice-particula--" + forma;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.background = colores[i % colores.length];
      /* La dirección viaja por custom properties porque el keyframe es único:
         un solo @keyframes sirve para las cuatro formas y los N ángulos. */
      p.style.setProperty("--dx", Math.round(Math.cos(rad) * d) + "px");
      p.style.setProperty("--dy", Math.round(Math.sin(rad) * d) + "px");
      p.style.setProperty("--dur", ms + "ms");
      if (conGiro) p.style.setProperty("--rot0", Math.round(Math.random() * 360) + "deg");
      nodos.push(p);
      escenario.appendChild(p);
    }

    return espera(maxDur + 100, function () {
      for (var j = 0; j < nodos.length; j++) {
        if (nodos[j].parentNode) nodos[j].parentNode.removeChild(nodos[j]);
      }
    });
  }

  /* ------------------------------------------------------------ 5. destello */

  /* Limitador de frecuencia: aunque un juego se vuelva loco encadenando
     aciertos, nunca salen más de ~3 destellos por segundo (WCAG 2.3.1). */
  var ultimaLuz = -1e9;
  var DUR_DESTELLO = 320;

  function ahora() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  function destello(escenario, x, y, opts) {
    if (!escenario || reducido()) return ya();
    var t = ahora();
    if (t - ultimaLuz < 350) return ya();
    ultimaLuz = t;

    opts = opts || {};
    var radio = (typeof opts.radio === "number" && isFinite(opts.radio)) ? opts.radio : 60;

    /* Una sola lectura de layout, antes de cualquier escritura de estilos. */
    var ancho = escenario.offsetWidth;
    var alto = escenario.offsetHeight;
    var lado = Math.min(ancho || 0, alto || 0);
    /* El diámetro se acota al 45 % del lado menor: el área del círculo queda
       en ~16 % del modal, por debajo del 25 % que exige la regla de destellos. */
    var diametro = lado > 0 ? Math.min(radio * 2, lado * 0.45) : radio * 2;

    var luz = document.createElement("b");
    luz.className = "juice-destello";
    luz.style.left = ((typeof x === "number" && isFinite(x)) ? x : (ancho / 2 || 0)) + "px";
    luz.style.top = ((typeof y === "number" && isFinite(y)) ? y : (alto / 2 || 0)) + "px";
    luz.style.width = diametro + "px";
    luz.style.height = diametro + "px";
    if (opts.color) luz.style.setProperty("--luz", opts.color);
    escenario.appendChild(luz);

    return espera(DUR_DESTELLO, function () {
      if (luz.parentNode) luz.parentNode.removeChild(luz);
    });
  }

  /* -------------------------------------------------------------- 6. sello */

  /* El sello NO se retira al resolver: es el estado final de la celebración y
     se va con la caja del modal al cerrar. Por eso se borra el anterior antes
     de estampar: dos sellos superpuestos serían ilegibles. */
  function sello(escenario, texto, opts) {
    if (!escenario) return ya();
    opts = opts || {};

    var viejo = escenario.querySelector(".juice-sello");
    if (viejo && viejo.parentNode) viejo.parentNode.removeChild(viejo);

    var s = document.createElement("div");
    s.className = "juice-sello";
    s.textContent = String(texto == null ? "" : texto);
    if (opts.color) s.style.color = opts.color;
    escenario.appendChild(s);

    if (reducido()) return ya();   /* aparece de golpe (estado final) y resuelve */
    return espera(260);
  }

  /* --------------------------------------------------------- 7. vuelo del XP */

  /* Los dos nodos cuelgan de document.body, NUNCA del escenario: hay fichas que
     lanzan el vuelo y cierran el modal en el mismo instante, y colgando de la
     caja el «+5 XP» moriría a medio camino sin llegar nunca al chip del HUD.

     Nota deliberada: el número del chip no cambia con el vuelo. El XP se cobra
     una sola vez al terminar la misión; esto es la promesa visual y el toast de
     afterAward es la confirmación. */
  function volarXP(desdeEl, n) {
    if (!desdeEl || !desdeEl.getBoundingClientRect || reducido()) return ya();
    var chip = document.querySelector("[data-hud-chip]");
    if (!chip) return ya();
    var exterior = document.createElement("div");
    if (!exterior.animate) return ya();          /* sin Web Animations API no hay arco: se calla */

    /* Las dos lecturas de layout, juntas y antes de escribir nada. */
    var origen = desdeEl.getBoundingClientRect();
    var destino = chip.getBoundingClientRect();
    var ox = origen.left + origen.width / 2;
    var oy = origen.top + origen.height / 2;
    var dx = (destino.left + destino.width / 2) - ox;
    var dy = (destino.top + destino.height / 2) - oy;

    var interior = document.createElement("span");
    interior.textContent = "+" + (n || 0) + " XP";
    exterior.className = "juice-xp";
    exterior.style.left = Math.round(ox) + "px";
    exterior.style.top = Math.round(oy) + "px";
    exterior.appendChild(interior);
    document.body.appendChild(exterior);

    return new Promise(function (resolver) {
      var cerrado = false;
      function aterrizar() {
        if (cerrado) return;                     /* onfinish y la guarda no deben rematar dos veces */
        cerrado = true;
        if (exterior.parentNode) exterior.parentNode.removeChild(exterior);
        /* Bump del chip calcado del toast de progress.js: quitar, forzar
           reflow y volver a poner es lo único que reinicia el keyframe. */
        try {
          chip.classList.remove("is-bump");
          void chip.offsetWidth;
          chip.classList.add("is-bump");
        } catch (e) { /* el HUD puede haberse ido */ }
        resolver();
      }

      try {
        /* El arco sale de componer dos ejes: la X avanza lineal y la Y usa un
           bezier con tramo negativo, que sube primero y cae al final. */
        var anim = exterior.animate(
          [{ transform: "translateX(0)" }, { transform: "translateX(" + Math.round(dx) + "px)" }],
          { duration: 600, easing: "linear", fill: "forwards" }
        );
        interior.animate(
          [{ transform: "translateY(0)" }, { transform: "translateY(" + Math.round(dy) + "px)" }],
          { duration: 600, easing: "cubic-bezier(0.3,-0.8,0.7,1)", fill: "forwards" }
        );
        anim.onfinish = aterrizar;
      } catch (e) {
        aterrizar();
        return;
      }
      setTimeout(aterrizar, 700);                /* guarda: si onfinish no llega, el nodo no se queda */
    });
  }

  /* -------------------------------------------------------------- 8. fallo */

  /* El fallo es cómico y nunca castiga: rebote, dos estrellitas y una nota
     grave. Sin screenshake y sin vibración jamás — lo que enseña es el
     feedback escrito que abre el juego, no el zarandeo. */
  function juiceFallo(el, escenario) {
    sonidoFallo();                               /* el sonido no es movimiento: suena también con reduced-motion */
    if (reducido()) return ya();
    if (el && el.classList) {
      reanimar(el, "juice-fallo");
      setTimeout(function () { el.classList.remove("juice-fallo"); }, 400);
    }

    if (escenario && el && el.getBoundingClientRect) {
      /* Lecturas juntas antes de escribir: el rect del elemento y el de la capa
         para pasar de coordenadas de viewport a coordenadas del escenario. */
      var r = el.getBoundingClientRect();
      var re = escenario.getBoundingClientRect();
      var cx = r.left + r.width / 2 - re.left;
      var cy = r.top - re.top;
      var estrellas = [];
      for (var i = 0; i < 2; i++) {
        var s = document.createElement("i");
        s.className = "juice-estrellita";
        s.textContent = "✶";
        s.style.left = Math.round(cx + (i === 0 ? -10 : 10)) + "px";
        s.style.top = Math.round(cy) + "px";
        s.style.animationDelay = (i * 90) + "ms";   /* desfase: dos órbitas idénticas se leen como una */
        estrellas.push(s);
        escenario.appendChild(s);
      }
      setTimeout(function () {
        for (var j = 0; j < estrellas.length; j++) {
          if (estrellas[j].parentNode) estrellas[j].parentNode.removeChild(estrellas[j]);
        }
      }, 760);
    }

    return espera(600);
  }

  window.MFJuice = {
    reducido: reducido,
    preparar: preparar,
    respuesta: respuesta,
    anticipar: anticipar,
    hitstop: hitstop,
    squash: squash,
    estirar: estirar,
    particulas: particulas,
    destello: destello,
    sello: sello,
    volarXP: volarXP,
    fallo: juiceFallo
  };

  /* ======================================================== MFSONIDO ======== */

  /* Cero ficheros: todo se sintetiza con WebAudio. ENCENDIDO POR DEFECTO desde
     2026-08-28 (titular): el sonido es parte del juego, no un extra que haya que
     ir a buscar. Sigue siendo opcional siempre y el interruptor está a la vista
     en la barra del reto.
     Y el APAGADO SE RECUERDA ENTRE VISITAS. Antes la preferencia vivía en
     sessionStorage, y eso con «apagado por defecto» era inofensivo: lo peor que
     pasaba era volver a un silencio que ya era el de fábrica. Con el defecto al
     revés sería lo contrario —quien silencia el dojo se lo encontraría sonando
     otra vez a la siguiente visita—, así que la preferencia pasa a localStorage.
     Sigue sin entrar jamás en el progreso sincronizado del alumno: es una
     preferencia del aparato, no algo suyo que deba viajar entre dispositivos. */

  var CLAVE = "mf.retoSonido";
  var ctx = null;
  var maestro = null;
  /* Espejo en memoria de la preferencia. En modo privado (o con el almacén
     bloqueado) el `setItem` revienta y sin este espejo el interruptor no haría
     nada visible: se apagaría y a la siguiente lectura volvería a estar
     encendido. `null` = nadie ha elegido todavía en esta página. */
  var preferencia = null;

  /* Lee el almacén y devuelve "0", "1" o null. Solo esos dos valores cuentan:
     cualquier otra cosa es basura de otra versión y se ignora, que es lo mismo
     que no haber elegido. */
  function leerAlmacen() {
    try {
      var v = localStorage.getItem(CLAVE);
      if (v === "0" || v === "1") return v;
    } catch (e) { /* sin almacén: manda el espejo, y si no, el defecto */ }
    return null;
  }

  /* Mudanza desde sessionStorage, donde la preferencia vivía hasta 2026-08-28.
     Existe por una sola razón: quien tuviera el sonido APAGADO en esta misma
     visita no debe encontrárselo encendido de golpe al recargar. Se asciende su
     decisión a permanente y se borra la clave vieja, así la mudanza ocurre una
     vez y no vuelve a pisar lo que el alumno elija después. */
  function migrar() {
    var v = null;
    try {
      v = sessionStorage.getItem(CLAVE);
      if (v === "0" || v === "1") sessionStorage.removeItem(CLAVE);
    } catch (e) { return; }
    if (v !== "0" && v !== "1") return;
    if (leerAlmacen() !== null) return;      /* ya eligió con el almacén nuevo: manda ese */
    preferencia = (v === "1");
    try { localStorage.setItem(CLAVE, v); } catch (e) { /* se queda en el espejo */ }
  }
  migrar();

  /* SIN PREFERENCIA GUARDADA, ENCENDIDO. Es la única línea que decide el defecto
     y por eso está sola: cambiarlo es cambiar este `true`. */
  function activo() {
    if (preferencia !== null) return preferencia;
    var v = leerAlmacen();
    return v === null ? true : (v === "1");
  }

  function guardar(v) {
    preferencia = !!v;
    try { localStorage.setItem(CLAVE, v ? "1" : "0"); } catch (e) { /* modo privado: se queda en el espejo */ }
  }

  function crearCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      maestro = ctx.createGain();
      maestro.gain.value = 0.5;                 /* techo común: ningún blip puede saturar */
      maestro.connect(ctx.destination);
    } catch (e) { ctx = null; maestro = null; }
    return ctx;
  }

  /* Puerta única de todas las recetas. Además de comprobar el interruptor, crea
     el contexto perezosamente: la preferencia sobrevive a la navegación (y ahora
     también al cierre del navegador), así que al abrir un reto en OTRA página el
     sonido puede estar encendido sin que exista contexto todavía. */
  function listo() {
    if (!activo()) return null;
    if (!ctx) crearCtx();
    if (ctx && ctx.state === "suspended" && ctx.resume) {
      try { ctx.resume(); } catch (e) { /* seguirá suspendido: sonará al siguiente toque */ }
    }
    return ctx;
  }

  /* EL PRIMER GESTO DESPIERTA EL AUDIO. Hasta ahora el único momento en que se
     creaba el contexto dentro de un gesto era el toque en el interruptor, y eso
     bastaba porque encender era obligatorio. Con el sonido ENCENDIDO de fábrica
     ese toque ya no ocurre nunca, y muchas recetas no se disparan desde el
     gesto sino desde el final de una animación (`espera(...)`, promesas del
     juice): la política de autoplay dejaría el contexto en `suspended` y el
     primer acierto sonaría a nada.
     Así que el primer pointerdown o keydown de la página —el que sea, no hace
     falta que sea el del juego— crea y despierta el contexto. Se engancha en
     captura para que ningún `stopPropagation` de un juego lo esquive, y se
     desengancha en cuanto cumple: es un despertador, no un vigilante. */
  function despertarAudio() {
    document.removeEventListener("pointerdown", despertarAudio, true);
    document.removeEventListener("keydown", despertarAudio, true);
    if (!activo()) return;                     /* apagado: ni se crea el contexto */
    crearCtx();
    if (ctx && ctx.state === "suspended" && ctx.resume) {
      try { ctx.resume(); } catch (e) { /* nada: sonará al siguiente toque vía listo() */ }
    }
  }
  document.addEventListener("pointerdown", despertarAudio, true);
  document.addEventListener("keydown", despertarAudio, true);

  /* Pinta TODOS los botones de sonido del documento desde el estado real: el
     modal se monta y desmonta, y el botón debe reflejar la preferencia guardada,
     no el markup con el que se construyó.
     EL ICONO YA NO SE ESCRIBE (2026-08-28): era un emoji (🔊/🔇) y ahora es una
     lámina ilustrada dentro del botón, así que tocar `textContent` BORRARÍA la
     <img>. El estado lo lleva una clase y el gris lo pone game.css con
     `filter: grayscale(1)`, igual que la estrella de las filas de misión.
     Los dos atributos se escriben juntos y siempre: `aria-pressed` es el que
     cuenta el estado al lector de pantalla, porque un color no se puede oír. */
  function pintar() {
    var on = activo();
    var botones = document.querySelectorAll(".reto-sonido");
    for (var i = 0; i < botones.length; i++) {
      botones[i].setAttribute("aria-pressed", on ? "true" : "false");
      if (on) botones[i].classList.remove("is-mudo");
      else botones[i].classList.add("is-mudo");
    }
  }

  function alternar() {
    var nuevo = !activo();
    guardar(nuevo);
    /* Al ENCENDER se crea o despierta el contexto aquí mismo, dentro del gesto
       del usuario: fuera del gesto la política de autoplay lo deja suspendido y
       el primer acierto sonaría a nada. */
    if (nuevo) {
      crearCtx();
      if (ctx && ctx.state === "suspended" && ctx.resume) {
        try { ctx.resume(); } catch (e) { /* nada */ }
      }
    }
    pintar();
    return nuevo;
  }

  /* Envolvente estándar de la casa: rampa lineal hasta el pico en `attack` y
     caída exponencial hasta el silencio en `decay`. La exponencial es la que
     suena natural; una lineal deja un corte seco al final. */
  function tono(c, freq, tipo, attack, decay, gain, retardoMs, destino) {
    try {
      var t0 = c.currentTime + (retardoMs || 0) / 1000;
      var fin = t0 + (attack + decay) / 1000;
      var osc = c.createOscillator();
      var g = c.createGain();
      osc.type = tipo;
      osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(gain, t0 + attack / 1000);
      g.gain.exponentialRampToValueAtTime(0.0001, fin);
      osc.connect(g);
      g.connect(destino || maestro);
      osc.start(t0);
      osc.stop(fin + 0.05);
      return osc;
    } catch (e) { return null; }
  }

  function nota(freq, o) {
    var c = listo();
    if (!c) return;
    o = o || {};
    tono(c, freq,
      o.tipo || "triangle",
      (typeof o.attack === "number") ? o.attack : 8,
      (typeof o.decay === "number") ? o.decay : 180,
      (typeof o.gain === "number") ? o.gain : 0.25,
      o.retardo || 0);
  }

  /* ==========================================================================
     FX DE CONTACTO (docs/09, lote 1 — ruta B: síntesis propia, 2026-09-02).
     Del beep a la escena sonora: un sonido por GESTO de la mascota y otro por
     ELEMENTO golpeado, compuestos aquí con tres ladrillos —tono() de arriba,
     glissandi y ráfagas de ruido filtrado— bajo el mismo techo maestro y la
     misma puerta listo() del interruptor. Carácter buscado: foley de cine con
     guiño cartoon. Si la calidad no convence al oído del titular, la salida
     pactada es un proveedor de API económico; estas recetas quedarían como
     respaldo sin red.
     ========================================================================== */

  /* tono con deslizamiento de frecuencia: el «toc» que cae, el creak que sube */
  function tonoGlis(c, f0, f1, tipo, attack, decay, gain, retardoMs, destino) {
    try {
      var t0 = c.currentTime + (retardoMs || 0) / 1000;
      var fin = t0 + (attack + decay) / 1000;
      var osc = c.createOscillator();
      var g = c.createGain();
      osc.type = tipo;
      osc.frequency.setValueAtTime(f0, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), fin);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(gain, t0 + attack / 1000);
      g.gain.exponentialRampToValueAtTime(0.0001, fin);
      osc.connect(g);
      g.connect(destino || maestro);
      osc.start(t0);
      osc.stop(fin + 0.05);
    } catch (e) { /* nada */ }
  }

  /* un segundo de ruido blanco, creado una vez: la materia prima de whooshes,
     cracks y aire */
  var bufferRuido = null;
  function ruidoBuffer(c) {
    if (bufferRuido) return bufferRuido;
    var n = c.sampleRate;
    var b = c.createBuffer(1, n, c.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    bufferRuido = b;
    return b;
  }

  /* ráfaga de ruido filtrado: filtro (lowpass/bandpass/highpass) con barrido
     opcional de frecuencia f0→f1, envolvente attack/decay. El whoosh es un
     bandpass que baja; el crack, un bandpass ancho y corto; el aire, un
     lowpass suave. */
  function rafaga(c, o) {
    try {
      var t0 = c.currentTime + (o.retardo || 0) / 1000;
      var fin = t0 + ((o.attack || 4) + o.decay) / 1000;
      var src = c.createBufferSource();
      src.buffer = ruidoBuffer(c);
      src.loop = true;
      var filtro = c.createBiquadFilter();
      filtro.type = o.filtro || "bandpass";
      filtro.frequency.setValueAtTime(o.f0, t0);
      if (o.f1) filtro.frequency.exponentialRampToValueAtTime(o.f1, fin);
      filtro.Q.value = (typeof o.q === "number") ? o.q : 1;
      var g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(o.gain, t0 + (o.attack || 4) / 1000);
      g.gain.exponentialRampToValueAtTime(0.0001, fin);
      src.connect(filtro);
      filtro.connect(g);
      g.connect(o.destino || maestro);
      src.start(t0);
      src.stop(fin + 0.05);
    } catch (e) { /* nada */ }
  }

  /* Las recetas, una por id del censo de docs/09. Cada una recibe el contexto
     y un retardo base en ms (la capa del elemento entra unos 70 ms tras la del
     gesto: el swing precede al impacto, como en el cine). */
  var RECETAS = {
    /* ---- gestos de la mascota ---- */
    "fx-golpe": function (c, r) {
      rafaga(c, { f0: 900, f1: 260, q: 1, decay: 110, gain: 0.2, retardo: r });
      rafaga(c, { filtro: "highpass", f0: 2500, decay: 22, gain: 0.14, retardo: r + 55 });
    },
    "fx-patada": function (c, r) {
      rafaga(c, { f0: 520, f1: 130, q: 0.8, decay: 170, gain: 0.24, retardo: r });
    },
    "fx-canto": function (c, r) {
      rafaga(c, { f0: 2100, f1: 4200, q: 6, decay: 130, gain: 0.15, retardo: r });
    },
    "fx-gancho": function (c, r) {
      rafaga(c, { f0: 300, f1: 1500, q: 1.2, decay: 200, gain: 0.18, retardo: r });
    },
    "fx-senala": function (c, r) {
      tono(c, 1568, "sine", 4, 90, 0.07, r);
      tono(c, 2093, "sine", 4, 80, 0.05, r + 30);
    },
    "fx-victoria": function (c, r) {
      tono(c, 523.25, "triangle", 6, 160, 0.2, r);
      tono(c, 659.25, "triangle", 6, 160, 0.2, r + 90);
      tono(c, 783.99, "triangle", 6, 260, 0.22, r + 180);
      rafaga(c, { filtro: "highpass", f0: 5000, decay: 320, gain: 0.05, retardo: r + 180 });
    },
    /* ---- elementos ---- */
    "fx-makiwara-toc": function (c, r, o) {
      /* `o.k` = factor de escala (do-re-mi de toques, titular 2026-09-02):
         cada golpe suena un peldaño más arriba y se OYE el avance */
      var k = (o && o.k) || 1;
      tonoGlis(c, 210 * k, 90 * k, "sine", 2, 70, 0.3, r);
      rafaga(c, { filtro: "lowpass", f0: 900 * k, decay: 35, gain: 0.18, retardo: r });
      tono(c, 420 * k, "triangle", 2, 26, 0.07, r);
    },
    "fx-makiwara-cae": function (c, r) {
      tonoGlis(c, 160, 62, "sine", 2, 95, 0.34, r);
      rafaga(c, { filtro: "lowpass", f0: 500, decay: 240, gain: 0.11, retardo: r });
      tonoGlis(c, 120, 70, "sine", 2, 70, 0.16, r + 150);   /* el rebotito */
    },
    "fx-campana-talan": function (c, r, o) {
      /* bronce medio: parciales inarmónicos y un ataque de metal. La
         fundamental es variable (o.f0): el revela tañe do-re-mi subiendo la
         escala con cada golpe (titular 2026-09-02). */
      var f0 = (o && o.f0) || 523.25;
      var razones = [1, 2.02, 2.99, 4.16];
      var g2 = [0.26, 0.15, 0.09, 0.055];
      for (var i = 0; i < razones.length; i++) tono(c, f0 * razones[i], "sine", 2, 1050, g2[i], r);
      rafaga(c, { filtro: "highpass", f0: 3000, decay: 22, gain: 0.09, retardo: r });
    },
    "fx-campana-cae": function (c, r) {
      rafaga(c, { filtro: "highpass", f0: 1800, decay: 28, gain: 0.2, retardo: r });      /* snap del cordel */
      var clonc = [392, 800.6, 1172];
      for (var i = 0; i < clonc.length; i++) tono(c, clonc[i], "sine", 2, 210, 0.22 / (i + 1), r + 70);
      for (var j = 0; j < clonc.length; j++) tono(c, clonc[j] * 0.97, "sine", 2, 150, 0.12 / (j + 1), r + 260);
      tono(c, 380, "sine", 2, 110, 0.05, r + 420);                                        /* rodando */
      tonoGlis(c, 300, 170, "sine", 2, 240, 0.09, r + 70);
    },
    "fx-teja-crack": function (c, r, o) {
      var k = (o && o.k) || 1;   /* el do-re-mi de las roturas */
      rafaga(c, { f0: 2400 * k, q: 2, decay: 34, gain: 0.26, retardo: r });
      rafaga(c, { f0: 1700 * k, q: 2, decay: 46, gain: 0.2, retardo: r + 55 });
      tono(c, 3200 * k, "square", 1, 16, 0.05, r + 110);
      tono(c, 2600 * k, "square", 1, 16, 0.045, r + 150);
      tono(c, 2950 * k, "square", 1, 16, 0.04, r + 190);
    },
    "fx-farol-enciende": function (c, r, o) {
      var k = (o && o.k) || 1;   /* el do-re-mi de los encendidos */
      rafaga(c, { f0: 1100 * k, q: 1.4, attack: 60, decay: 130, gain: 0.13, retardo: r });    /* fwoosh del fósforo */
      tono(c, 1046.5 * k, "sine", 10, 380, 0.12, r + 110);
      tono(c, 1568 * k, "sine", 10, 330, 0.07, r + 135);
    },
    "fx-chispa-viaje": function (c, r) {
      tonoGlis(c, 1200, 2600, "sine", 6, 270, 0.075, r);
      rafaga(c, { filtro: "highpass", f0: 4500, decay: 270, gain: 0.04, retardo: r });
    },
    "fx-tabla-rompe": function (c, r) {
      tonoGlis(c, 130, 58, "sine", 2, 100, 0.3, r);
      rafaga(c, { f0: 950, q: 1, decay: 48, gain: 0.28, retardo: r });
      rafaga(c, { f0: 1500, q: 1.2, decay: 40, gain: 0.22, retardo: r + 45 });
      tono(c, 2300, "square", 1, 16, 0.05, r + 105);
      tono(c, 2750, "square", 1, 16, 0.04, r + 150);
    },
    "fx-tabla-aguanta": function (c, r) {
      tonoGlis(c, 145, 95, "sine", 2, 120, 0.24, r);
      /* el wobble cómico: la madera viva vibra en zigzag y se apaga */
      tonoGlis(c, 235, 172, "triangle", 4, 80, 0.13, r + 55);
      tonoGlis(c, 172, 214, "triangle", 4, 80, 0.1, r + 135);
      tonoGlis(c, 214, 182, "triangle", 4, 90, 0.07, r + 215);
    },
    "fx-yay": function (c, r) {
      /* ¡YAYYYY! de un grupo de ~10 niños (titular 2026-09-02, ~1,5 s): la
         aproximación sintética — cada voz es una sierra aguda con contorno
         «y-aaa» (sube rápido, cae un pelín al final), vibrato propio y un
         formante de «aaa» infantil; los arranques se escalonan y un aliento
         brillante pone la emoción de la sala. Si el oído pide carne de
         verdad, este es el candidato número uno para la ruta A (grabado). */
      var t0 = c.currentTime + (r || 0) / 1000;
      for (var v = 0; v < 10; v++) {
        try {
          var inicio = t0 + Math.random() * 0.14;
          var f0 = 340 + Math.random() * 220;
          var dur = 2.55 + Math.random() * 0.4;   /* ~3 s (titular 2026-09-02) */
          var osc = c.createOscillator();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(f0 * 0.72, inicio);
          osc.frequency.exponentialRampToValueAtTime(f0, inicio + 0.09);
          osc.frequency.setValueAtTime(f0, inicio + dur * 0.7);
          osc.frequency.exponentialRampToValueAtTime(f0 * 0.9, inicio + dur);
          var lfo = c.createOscillator();
          lfo.frequency.value = 5 + Math.random() * 2.5;
          var prof = c.createGain();
          prof.gain.value = f0 * 0.035;
          lfo.connect(prof);
          prof.connect(osc.frequency);
          var formante = c.createBiquadFilter();
          formante.type = "bandpass";
          formante.frequency.value = 950 + Math.random() * 350;
          formante.Q.value = 1.6;
          var g = c.createGain();
          g.gain.setValueAtTime(0.0001, inicio);
          g.gain.linearRampToValueAtTime(0.032, inicio + 0.1);
          g.gain.setValueAtTime(0.032, inicio + dur * 0.65);
          g.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
          osc.connect(formante);
          formante.connect(g);
          g.connect(maestro);
          osc.start(inicio);
          osc.stop(inicio + dur + 0.05);
          lfo.start(inicio);
          lfo.stop(inicio + dur + 0.05);
        } catch (e) { /* una voz menos no arruina el coro */ }
      }
      rafaga(c, { filtro: "highpass", f0: 3200, attack: 90, decay: 2700, gain: 0.028, retardo: (r || 0) + 30 });
    },
    "fx-pagina": function (c, r) {
      /* una página que pasa, como leyendo un libro (titular 2026-09-02):
         flick fino de arranque + roce de papel que barre hacia lo grave.
         Suena a menudo (viñetas, tarjetas, partes del pergamino): discreto. */
      rafaga(c, { filtro: "highpass", f0: 4200, decay: 16, gain: 0.05, retardo: r });
      rafaga(c, { f0: 1800, f1: 850, q: 0.8, attack: 12, decay: 150, gain: 0.085, retardo: r + 10 });
      rafaga(c, { filtro: "lowpass", f0: 650, attack: 30, decay: 140, gain: 0.035, retardo: r + 60 });
    },
    "fx-mazo-swing": function (c, r) {
      /* el mazo de la máquina cayendo: whoosh pendular que baja */
      rafaga(c, { f0: 720, f1: 210, q: 0.9, attack: 18, decay: 165, gain: 0.17, retardo: r });
    },
    "fx-torre-base": function (c, r) {
      /* el cabezazo del mazo en la base de madera de la torre */
      tonoGlis(c, 130, 58, "sine", 2, 110, 0.32, r);
      rafaga(c, { filtro: "lowpass", f0: 420, decay: 70, gain: 0.2, retardo: r });
      tono(c, 330, "triangle", 2, 30, 0.08, r );
    },
    "fx-llave-cae": function (c, r) {
      /* la llave descartada cayendo al suelo: clink brillante, rebotito y
         un traqueteo fino al asentarse */
      tono(c, 2600, "sine", 1, 55, 0.09, r);
      tono(c, 520, "triangle", 1, 40, 0.06, r);
      tono(c, 3150, "sine", 1, 40, 0.055, r + 75);
      rafaga(c, { filtro: "highpass", f0: 2800, decay: 34, gain: 0.055, retardo: r + 120 });
    },
    "fx-candado-abre": function (c, r) {
      /* la cerradura ABRIÉNDOSE: dos tics de mecanismo y el click sólido con
         su golpecito de resolución — satisfactorio, nada de terror */
      rafaga(c, { filtro: "highpass", f0: 3300, decay: 14, gain: 0.06, retardo: r });
      rafaga(c, { filtro: "highpass", f0: 3000, decay: 14, gain: 0.055, retardo: r + 70 });
      tono(c, 1250, "square", 1, 22, 0.085, r + 130);
      tonoGlis(c, 430, 255, "triangle", 2, 70, 0.16, r + 135);
    },
    "fx-llave-cerradura": function (c, r) {
      /* la llave trabajando en la bocallave (~420 ms por vuelta de bucle):
         tics metálicos con dos pings finos y un traqueteo grave de fondo */
      var tics = [0, 95, 215, 330];
      for (var i = 0; i < tics.length; i++) {
        rafaga(c, { filtro: "highpass", f0: 3400, decay: 14, gain: 0.06, retardo: r + tics[i] });
      }
      tono(c, 2350, "sine", 1, 40, 0.035, r + 45);
      tono(c, 2600, "sine", 1, 40, 0.03, r + 255);
      rafaga(c, { f0: 700, q: 1.5, decay: 60, gain: 0.045, retardo: r + 110 });
    },
    "fx-cepillo-madera": function (c, r) {
      /* una pasada de cepillo sobre madera (~420 ms): shhh con cuerpo grave
         y un leve barrido descendente, para que el bucle suene a frotar */
      rafaga(c, { f0: 1500, f1: 1050, q: 0.9, attack: 70, decay: 290, gain: 0.085, retardo: r });
      rafaga(c, { filtro: "lowpass", f0: 620, attack: 70, decay: 280, gain: 0.04, retardo: r });
    },
    "fx-puerta-abre": function (c, r) {
      rafaga(c, { filtro: "highpass", f0: 2000, decay: 18, gain: 0.1, retardo: r });      /* el pestillo */
      try {
        var filtro = c.createBiquadFilter();
        filtro.type = "lowpass";
        filtro.frequency.value = 850;
        filtro.connect(maestro);
        tonoGlis(c, 155, 245, "sawtooth", 30, 300, 0.07, r + 30, filtro);                 /* el creak */
      } catch (e) { /* nada */ }
      rafaga(c, { filtro: "lowpass", f0: 520, attack: 40, decay: 220, gain: 0.05, retardo: r + 60 });
    },
  };

  /* La puerta pública: true si la receta existe y el contexto está listo —
     quien llama usa ese false para caer a los beeps de siempre. */
  function fx(id, retardoMs, opciones) {
    var receta = RECETAS[id];
    if (!receta) return false;
    var c = listo();
    if (!c) return true;   /* interruptor apagado: no suena, pero tampoco debe sonar el beep */
    try { receta(c, retardoMs || 0, opciones || null); } catch (e) { /* nada */ }
    return true;
  }

  /* Acierto de la casa: tríada mayor C5-E5-G5 ascendente. Sube, y eso ya dice
     «bien» sin una sola palabra. */
  function arpegio() {
    var c = listo();
    if (!c) return;
    var frecuencias = [523.25, 659.25, 783.99];
    for (var i = 0; i < frecuencias.length; i++) {
      tono(c, frecuencias[i], "triangle", 8, 220, 0.22, i * 90);
    }
  }

  /* Nota grave que se desliza hacia abajo: el «uuh» cómico de dibujos, no el
     buzzer de concurso. El fallo no humilla. */
  function sonidoFallo() {
    var c = listo();
    if (!c) return;
    try {
      var t0 = c.currentTime;
      var fin = t0 + 0.32;
      var osc = c.createOscillator();
      var g = c.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(220, t0);
      osc.frequency.exponentialRampToValueAtTime(174.61, t0 + 0.25);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.2, t0 + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, fin);
      osc.connect(g);
      g.connect(maestro);
      osc.start(t0);
      osc.stop(fin + 0.05);
    } catch (e) { /* nada */ }
  }

  /* Campana de templo: el segundo parcial es inarmónico (≈2,04×) a propósito;
     con un armónico exacto sonaría a flauta, no a metal.
     La repetición doble vive AQUÍ y no en cada juego, para no repartir
     setTimeouts por las fichas ni perder la guarda del interruptor. */
  function campana(doble) {
    var c = listo();
    if (!c) return;
    tono(c, 880, "sine", 4, 1200, 0.25, 0);
    tono(c, 1795, "sine", 4, 1200, 0.12, 0);
    if (doble === true) {
      tono(c, 880, "sine", 4, 1200, 0.25, 350);
      tono(c, 1795, "sine", 4, 1200, 0.12, 350);
    }
  }

  /* Cierre ceremonial del examen: cuatro parciales graves filtrados en paso
     bajo. El filtro es lo que quita el brillo digital y deja el bronce. */
  function gong() {
    var c = listo();
    if (!c) return;
    var filtro;
    try {
      filtro = c.createBiquadFilter();
      filtro.type = "lowpass";
      filtro.frequency.value = 800;
      filtro.connect(maestro);
    } catch (e) { filtro = null; }
    var frecuencias = [98, 147, 208, 311];
    var ganancias = [0.3, 0.18, 0.12, 0.08];
    for (var i = 0; i < frecuencias.length; i++) {
      tono(c, frecuencias[i], "sine", 15, 1800, ganancias[i], 0, filtro || maestro);
    }
  }

  /* Un solo interruptor gobierna sonido y vibración, y eso tiene consecuencia
     desde que el defecto es ENCENDIDO (2026-08-28): en móvil los ocho juegos
     vibran desde el primer toque sin que nadie haya pedido nada. Apagar el
     interruptor apaga las dos cosas a la vez, que es lo que espera quien lo
     apaga. Si algún día hicieran falta dos interruptores, se parten AQUÍ.
     El fallo nunca vibra — eso lo garantiza quien llama, aquí no hay excepción
     que inventar. */
  function vibrar(patron) {
    if (!activo()) return;
    if (!navigator.vibrate) return;
    try { navigator.vibrate(patron); } catch (e) { /* nada */ }
  }

  window.MFSonido = {
    activo: activo,
    alternar: alternar,
    pintar: pintar,
    nota: nota,
    arpegio: arpegio,
    fallo: sonidoFallo,
    campana: campana,
    gong: gong,
    vibrar: vibrar,
    fx: fx
  };
})();

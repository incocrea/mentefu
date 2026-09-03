/* MenteFu / MindFu — TAMESHIWARI, «rompe la tabla» (docs/07-miniretos/F1).

   El primer minireto del sistema y su banco de pruebas: estrena entera la
   receta canónica del acierto (respuesta → anticipación → hit-stop → cosecha →
   sello → cobro, F0 §0.3.2). El alumno ve una tabla de madera por opción del
   quiz, con su etiqueta corta encima, y la mano-guante de la mascota flotando;
   toca la que cree correcta y la mano la golpea. La correcta se parte; la
   errónea aguanta con un «tonk» cómico, abre el feedback de ESA opción y da
   repesca ilimitada.

   Este archivo SOLO pinta y juzga. El XP, los cierres, el historial del
   navegador, el panel de feedback y toda la telemetría los pone la
   infraestructura (retos.js) a través del `montaje`: aquí no hay ni un
   MF.track, ni una suma de XP, ni un listener de Escape.

   Cuatro decisiones de este archivo que conviene no deshacer sin leer el
   porqué:

   · LAS PIEZAS SON ILUSTRACIÓN DESDE EL PRIMER FOTOGRAMA. La mano y la madera
     nacen con el <img> de su lámina definitiva (§7.1 y §7.2, ya generadas y en
     disco). Lo manda la regla del titular, cerrada en F0 §0.12: ningún objeto
     móvil o interactuable de un juego se dibuja con SVG. Las dos siluetas
     planas que hay más abajo son RESERVA, y solo se pintan desde el `onerror`
     de esa imagen: se conservan porque un archivo que no llega debe degradar
     el DIBUJO y jamás la partida —sin ellas la escena se queda sin mano y
     «golpear» deja de leerse—, pero pintarlas por defecto, como se hacía
     antes, es justo lo que la regla prohíbe.

   · LA MANO SON DOS NODOS. El exterior (.tw-mano) lleva el viaje en las
     variables `--tw-mx/--tw-my` (game.css las traduce a `translate`); el
     interior (.tw-mano__fig) recibe las clases del kit (`juice-anticipa`,
     `juice-squash`, `juice-fallo`), que se montan sobre `transform` y sobre
     `animation`. Con un solo nodo, el temblor de la anticipación se comería el
     viaje y el flotar: una animación gana SIEMPRE al estilo en línea.

   · EL JUEGO NO ESCRIBE PÍXELES. Alturas, recortes de los trozos, caída, giro y
     tiempos de la rotura viven en game.css y se piden por clase de estado
     (`tw-tabla--rota`, `tw-tabla--seca`, `tw-trozo--izq2`…) o por `data-n`. Lo
     único que se escribe en línea son cuatro estilos estructurales de los que
     depende la mecánica —la madera es un <span> con la lámina dentro, y un span
     en línea ignoraría el `width/height: 100%` de la hoja— porque el estilo en
     línea gana, y todo lo que gana debe ser un invariante, nunca un gusto.

   · LOS TIEMPOS SE COMPRIMEN A 0 con `prefers-reduced-motion`: las promesas
     del kit ya resuelven al instante, así que la máquina de estados corre
     igual pero sin teatro, y el resultado se cuenta además con TEXTO
     (§11.6) — nunca solo con animación. */
(function () {
  "use strict";

  /* Sin infraestructura no hay reto: mission.js cae solo a su quiz clásico. */
  if (!window.MFRetos || !MFRetos.registrar) return;

  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var A = cfg.assets || "";
  var XP = cfg.xp || {};

  var T = ES ? {
    banner: "ROMPE",
    /* La línea de «qué hay que hacer», declarada por el JUEGO y no por quien la
       pinta: la enseñan dos interfaces —la ficha de la sala de retos y la
       tarjeta-invitación de la misión— y con una tabla en cada una, el día que
       se retoque la frase se retocará en una sola. Aquí hay una sola verdad. */
    comoSeJuega: "Rompe de un golpe la tabla que dice la verdad.",
    enPie: "aún en pie",
    resultado: "Rota. ¡Correcto!",
    kiai: "¡KIAI!",
    maestria: "¡MAESTRÍA!",
    ganado: "¡Tabla rota! Correcto: {c}.",
    /* El premio de la racha ya no es romper en tres trozos (la lámina del tercio
       central no está aprobada): es el sello de maestría. El anuncio del lector
       de pantalla tiene que contar lo que de verdad pasa. */
    triple: " ¡Maestría! Dos seguidas a la primera.",
    falloMision: "Esa aún aguanta. Lee el porqué y prueba otra tabla.",
    falloExamen: "Esa aún aguanta. La correcta era: {c}."
  } : {
    banner: "BREAK",
    comoSeJuega: "Break the board that tells the truth.",
    enPie: "still standing",
    resultado: "Broken. Correct!",
    kiai: "KIAI!",
    maestria: "MASTERY!",
    ganado: "Board broken! Correct: {c}.",
    triple: " Mastery! Two in a row, first try.",
    falloMision: "That one still stands. Read why and try another board.",
    falloExamen: "That one still stands. The correct one was: {c}."
  };

  /* Rutas de las láminas definitivas (ficha §7). Siempre el .webp: al publicar,
     el .png se descarta cuando existe su .webp. */
  var RUTA_MANO = A + "assets/img/game/retos/tameshiwari-mano.webp";
  var RUTA_TABLA = A + "assets/img/game/retos/tameshiwari-tabla.webp";
  /* Media tabla partida: el sprite del estado «rota». Una sola lámina sirve para
     los dos trozos porque el derecho es esta misma espejada por CSS. */
  var RUTA_MITAD = A + "assets/img/game/retos/tameshiwari-tabla-mitad.webp";

  /* =================================================== RESERVA SIN LÁMINA === */

  /* Lo que se pinta cuando el .webp NO llega (404, red caída, caché purgada a
     mitad de partida). Nunca por defecto: el camino normal es la lámina, y
     estos dos dibujos solo entran desde el `onerror` de su <img>. */

  /* Silueta plana de tabla de tameshiwari con troquel blanco de pegatina.
     `preserveAspectRatio="none"` a propósito: la tabla es un listón y su caja
     cambia de alto según cuántas opciones haya (76/64/56 px); estirar un
     rectángulo con dos vetas no se nota, y así nunca queda aire a los lados. */
  var SVG_TABLA =
    '<svg viewBox="0 0 320 68" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">' +
      '<rect x="2" y="3" width="316" height="62" rx="13" fill="#ffffff"/>' +
      '<rect x="8" y="9" width="304" height="50" rx="9" fill="#d9a866" stroke="#12131a" stroke-width="3"/>' +
      '<path d="M 30 22 q 24 -5 48 0" fill="none" stroke="#b98544" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M 30 46 q 20 5 40 0" fill="none" stroke="#b98544" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M 242 22 q 24 -5 48 0" fill="none" stroke="#b98544" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M 250 46 q 20 5 40 0" fill="none" stroke="#b98544" stroke-width="4" stroke-linecap="round"/>' +
    "</svg>";

  /* Brazo y mano en canto (shuto) a punto de caer. Silueta plana con los
     colores de marca: manga bermellón, puño crema, contorno tinta. Cuesta cero
     y es lo que salva la escena si la lámina de la mascota no carga: el giro de
     18° es lo que lee como «va a golpear» sin una sola palabra. */
  var SVG_MANO =
    '<svg viewBox="0 0 112 112" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">' +
      /* El giro de 18° es lo que lee como «va a golpear» sin una palabra; el
         translate compensa el pico que ese giro sacaba fuera del lienzo por
         arriba (medido: la esquina de la manga salía a y = −2). */
      '<g transform="rotate(18 56 56) translate(0 4)">' +
        '<rect x="37" y="3" width="38" height="46" rx="15" fill="#ffffff"/>' +
        '<rect x="40" y="6" width="32" height="42" rx="13" fill="#e63b2e" stroke="#12131a" stroke-width="3"/>' +
        '<rect x="33" y="41" width="46" height="17" rx="7" fill="#f7f3ec" stroke="#12131a" stroke-width="3"/>' +
        '<path d="M 44 56 h 24 a 7 7 0 0 1 7 7 v 21 a 15 15 0 0 1 -15 15 h -9 a 15 15 0 0 1 -15 -15 v -21 a 7 7 0 0 1 7 -7 z" ' +
          'fill="#f7d9b8" stroke="#12131a" stroke-width="3"/>' +
        '<path d="M 75 63 q 9 3 8 12 q -1 8 -8 8" fill="#f7d9b8" stroke="#12131a" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M 51 76 v 16 M 58 76 v 16 M 65 76 v 14" fill="none" stroke="#12131a" stroke-width="2" stroke-linecap="round" opacity="0.55"/>' +
      "</g>" +
    "</svg>";

  /* ==================================================== LÁMINA + RESERVA === */

  /* La vuelta atrás, como FÁBRICA y no como closure escrito en el sitio: el
     mismo manejador se cuelga de imágenes creadas dentro de bucles con `var`
     (los trozos de `partir`), y una función definida ahí dentro capturaría la
     variable del bucle, no su valor: todos los trozos acabarían restaurando la
     reserva del último. */
  function reservaDe(nodo, svg) {
    return function () { nodo.innerHTML = svg || ""; };
  }

  /* La vuelta atrás de un TROZO es distinta: no se sustituye su dibujo, se
     enciende la ruta sin imágenes del botón entero. Los recortes de la reserva
     cuelgan de `.tw-tabla--css` y son ellos los que dan forma de trozo al
     degradado; sin la clase, un fallo de la lámina de mitad dejaría dos
     rectángulos cayendo. Va como fábrica, y no como función escrita dentro del
     bucle, porque `var` no crea ámbito por vuelta: los dos trozos capturarían
     la misma variable. */
  function reservaTrozo(boton) {
    return function () { boton.classList.add("tw-tabla--css"); };
  }

  /* Cuelga de `nodo` la lámina definitiva. El <img> nace ya con su `src` —regla
     del titular, F0 §0.12: la pieza es ilustración desde el primer fotograma— y
     lleva encima su propia red: si el archivo no llega, el `onerror` pinta la
     silueta de reserva y la partida sigue exactamente igual.
     Los manejadores van ANTES del `src` porque una imagen ya en caché puede
     resolver dentro de la propia asignación: apuntarlos después sería apuntarlos
     tarde, y ese es justo el caso de la segunda partida de la página.
     Los cuatro estilos en línea son estructurales: game.css dimensiona el <span>
     contenedor, y sin ellos la imagen se pintaría a su tamaño natural (512 px de
     mano sobre una caja de 92). */
  function ilustrar(nodo, ruta, svg) {
    var img = document.createElement("img");
    img.onerror = reservaDe(nodo, svg);
    /* Un 404 servido como página HTML puede «cargar» con 0×0 y sin disparar
       `onerror`: sin píxeles no hay lámina, y darla por buena dejaría el hueco
       donde va la pieza. */
    img.onload = function () {
      if (!img.naturalWidth || !img.naturalHeight) reservaDe(nodo, svg)();
    };
    img.alt = "";
    img.draggable = false;
    img.style.display = "block";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    /* El `src` va el ÚLTIMO de todo, ya con la imagen colgada del nodo: si
       fallara, la reserva se pinta sobre un nodo que ya es el suyo y no queda
       ningún appendChild posterior que vuelva a meter la imagen rota encima. */
    nodo.appendChild(img);
    img.src = ruta;
    return img;
  }

  /* ============================================================ UTILERÍA === */

  function ahora() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  function textoPlano(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html == null ? "" : html);
    return (d.textContent || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
  }

  function reducido() {
    return !!(window.MFJuice && MFJuice.reducido && MFJuice.reducido());
  }

  /* Reinicia un keyframe aunque la clase ya estuviera puesta (sin el reflow el
     navegador no lo relanza: el segundo fallo seguido se quedaría quieto). */
  function reanimar(el, clase) {
    el.classList.remove(clase);
    void el.offsetWidth;
    el.classList.add(clase);
  }

  /* ==================================== GEOMETRÍA DE LA ROTURA (ficha §7.5) == */

  /* El recorte de cada trozo, su caída y su giro viven ENTEROS en game.css
     (`.tw-trozo--izq2` …): aquí solo se nombran. Es el reparto de trabajo que
     fija el contrato de la hoja — el JS pone clases de estado, el CSS pone
     píxeles—, y evita que la línea dentada acabe escrita en dos sitios que
     luego se separan. */
  var TROZOS2 = ["tw-trozo--izq2", "tw-trozo--der2"];
  var TROZOS3 = ["tw-trozo--izq3", "tw-trozo--centro3", "tw-trozo--der3"];

  /* Lo que tarda la rotura en despejarse: caída + fundido (game.css). Solo se
     usa para retirar los nodos cuando ya no se ven. */
  var CAIDA = 550, CAIDA_SECA = 350, FUNDIDO = 150;

  /* ================================ MEMORIA POR TARJETA (F1 §9.3 y §12-2) === */

  /* Cerrar el modal a mitad y reabrir NO devuelve la oportunidad del «limpio» ni
     resucita las tablas ya falladas. La infraestructura persiste el CONTEO
     (estado.fallos, retos.js) pero no sabe QUÉ tablas cayeron: eso vive aquí.
     La clave incluye el intento de examen, así que el botón de reintento
     estrena estado sin borrar nada. WeakMap para que las tarjetas de un intento
     viejo se recojan solas; con navegadores sin WeakMap se cae a un objeto
     plano, que a escala de una página es igual de bueno. */
  var MEM = (typeof WeakMap === "function") ? new WeakMap() : null;
  var MEM_PLANO = {};

  function memoria(m) {
    var caja, clave;
    if (MEM) {
      caja = MEM.get(m.tarjeta);
      if (!caja) { caja = {}; MEM.set(m.tarjeta, caja); }
    } else {
      clave = String(m.content && m.content.id) + "#" + m.iTarjeta;
      caja = MEM_PLANO[clave] || (MEM_PLANO[clave] = {});
    }
    var k = "i" + (m.intento | 0);
    if (!caja[k]) caja[k] = { intentos: 0, falladas: {} };
    return caja[k];
  }

  /* Aciertos LIMPIOS consecutivos en esta carga de página: a partir del segundo,
     la tabla se parte en tres y el sello cambia (§5.1). Variar el premio, no el
     gesto. En examen se congela: ni suma ni resetea, para no alterar el sabor
     de la misión siguiente. */
  var racha = 0;

  /* ============================================================== EL JUEGO == */

  function jugar(m) {
    var ops = (m.tarjeta && m.tarjeta.options) || [];
    var n = ops.length;
    /* No debería llegar (lo filtran `necesita` y `acepta`), pero si llegara,
       resolver es mejor que dejar al alumno encerrado con la tarjeta bloqueada. */
    if (!n) { m.resolver({ limpio: false, intentos: 1, ms: 0 }); return; }

    var mem = memoria(m);

    /* ---- Las tablas se BARAJAN por intento (pedido del titular 2026-09-01) ----
       Sin esto, las tablas salían en el orden del .md, y los autores tienden a
       escribir la correcta en la misma posición: quien juega dos veces aprende
       «toca la segunda» en vez de leer. El orden vive en la MEMORIA del intento,
       no se sortea al montar: cerrar y reabrir el modal a mitad de partida tiene
       que enseñar las tablas donde estaban (mem.falladas apunta por índice, y
       un reorden silencioso marcaría como caída una tabla sana). Cada intento
       nuevo estrena caja de memoria (`i<intento>`), así que cada reintento
       rebaraja solo. */
    if (!mem.orden || mem.orden.length !== n) {
      mem.orden = [];
      for (var oi = 0; oi < n; oi++) mem.orden.push(oi);
      for (var oj = n - 1; oj > 0; oj--) {
        var oz = Math.floor(Math.random() * (oj + 1));
        var otmp = mem.orden[oj]; mem.orden[oj] = mem.orden[oz]; mem.orden[oz] = otmp;
      }
    }
    var opsBarajadas = [];
    for (var ob = 0; ob < n; ob++) opsBarajadas.push(ops[mem.orden[ob]]);
    ops = opsBarajadas;

    var quieto = reducido();
    var t0 = ahora();
    var timers = [];
    var ocupado = true;            /* PRESENTANDO: los taps se ignoran, no se encolan */
    var manoX = 0, manoY = 0;      /* el viaje de la mano se ACUMULA: cada tap mide el delta desde donde está */

    /* Guarda anti-carrera: el alumno puede haber cerrado el modal a mitad de
       cualquier animación. Toda devolución de llamada pregunta antes de tocar
       el DOM. */
    function vivo() {
      if (m.vivo && !m.vivo()) return false;
      return raiz.isConnected !== false;
    }

    /* Camino ÚNICO de los anuncios de lector de pantalla: la región .reto-vivo
       la escribe la infraestructura y ningún juego crea la suya. La guarda es
       por si alguna vez se juega contra un retos.js más antiguo. */
    function anunciar(s) { if (m.anunciar) m.anunciar(s); }

    /* Cuánto paga DE VERDAD una victoria limpia de ESTA partida: 5 XP jugando la
       misión, el 10 % de esa misión si quien abrió el reto fue la sala de retos,
       y CERO si allí esa pregunta ya se cobró o si esto es un examen. El juego no
       puede deducirlo —lo hacía con `!m.examen` y por eso cantaba «+5 XP» donde
       se pagaban 3—: se lo pregunta al montaje. La guarda es la misma que la de
       `anunciar`, por si alguna vez se juega contra un retos.js más antiguo,
       donde la misión pagaba su bonus de siempre y el examen no pagaba nada. */
    function premio(limpio) {
      if (!limpio) return 0;
      return m.premia ? m.premia() : (m.examen ? 0 : (XP.quiz_first_try || 5));
    }

    function luego(ms, fn) {
      var id = setTimeout(function () { if (vivo()) fn(); }, ms);
      timers.push(id);
      return id;
    }

    /* Los timeouts pendientes mueren con el modal: sin esto, cerrar a mitad de
       la cascada dispararía un resolver() sobre una caja que ya no existe. */
    if (m.alCerrar) {
      m.alCerrar(function () {
        for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
        timers.length = 0;
        ocupado = true;
      });
    }

    /* La prueba de existencia de las láminas vive en la infraestructura, no
       aquí: el veredicto es POR RUTA y de módulo (retos.js), así que se comparte
       entre tablas, partidas y aperturas del modal en vez de repetirse en cada
       juego. No se espera su promesa —la escena se monta ya, y cada <img> lleva
       su propia reserva—, pero llamarla al montar es obligatorio: es la única
       tabla que `montaje.sprite()` consulta, y sin ella el día que existan las
       láminas de rotura el primer intercambio pediría red justo en el frame del
       golpe, el único que el alumno mira. La guarda es por si se juega contra un
       retos.js anterior a este contrato. */
    if (m.precargar) m.precargar([RUTA_MANO, RUTA_TABLA]);

    /* ---------------------------------------------------------- la pantalla */

    var raiz = document.createElement("div");
    /* `data-n` es el contrato con game.css: de ahí salen SOLOS el alto de cada
       tabla y el de la escena, así que aquí no se calcula ni un píxel. Se
       escribe en la raíz y en la escena porque la hoja admite las dos.
       `data-estado` es para QA y para leer la máquina de estados de un vistazo. */
    raiz.className = "tw";
    raiz.setAttribute("data-n", String(n));
    raiz.setAttribute("data-estado", "presentando");

    /* DIV y no P: `tarjeta.html` viene de Markdown y casi siempre trae ya su
       propio <p>; anidarlo dentro de otro <p> es HTML inválido y el navegador
       lo rompería en dos párrafos con márgenes de más. */
    var enunciado = document.createElement("div");
    enunciado.className = "tw-enunciado";
    enunciado.innerHTML = (m.tarjeta && m.tarjeta.html) || "";
    raiz.appendChild(enunciado);

    var escena = document.createElement("div");
    escena.className = "tw-escena";
    escena.setAttribute("data-n", String(n));
    raiz.appendChild(escena);

    /* La mano son DOS nodos, y no uno, por una razón que se paga cara si se
       deshace: el exterior viaja con `--tw-mx/--tw-my` (game.css lo traduce a
       `translate`, propiedad independiente) y el interior recibe las clases del
       kit —`juice-anticipa`, `juice-squash`, `juice-fallo`—, que se montan
       sobre `transform` y sobre `animation`. Separados, el temblor y el viaje
       se componen; juntos, la animación del temblor se comería el viaje y el
       flotar. */
    var mano = document.createElement("span");
    mano.className = "tw-mano";
    mano.setAttribute("aria-hidden", "true");
    mano.style.pointerEvents = "none";     /* la mano vuela sobre las tablas: jamás debe comerse un tap */

    var manoFig = document.createElement("span");
    manoFig.className = "tw-mano__fig";
    manoFig.style.display = "block";
    manoFig.style.width = "100%";
    manoFig.style.height = "100%";
    ilustrar(manoFig, RUTA_MANO, SVG_MANO);
    mano.appendChild(manoFig);
    escena.appendChild(mano);

    /* En reposo la mano respira. Se retira al empezar el viaje: mientras flota,
       los fotogramas mandan sobre `translate` y el viaje perdería su
       transición de 150 ms. */
    if (!quieto) mano.classList.add("tw-flota");

    var tablas = [];

    for (var k = 0; k < n; k++) tablas.push(crearTabla(ops[k], k));

    function crearTabla(o, k) {
      var corta = (o && typeof o.corta === "string") ? o.corta.replace(/^\s+|\s+$/g, "") : "";
      if (!corta) corta = textoPlano(o && o.html).slice(0, 24);   /* red por si el censo va a medias */

      var b = document.createElement("button");
      b.type = "button";
      b.className = "tw-tabla";
      b.setAttribute("data-k", String(k));
      /* La placa ya dice el texto, pero el aria-label explícito cubre el caso de
         que la placa se recorte y el de la lámina sin cargar. */
      b.setAttribute("aria-label", corta);

      /* La madera es un <span> con la lámina dentro, y no un <img> suelto:
         game.css la dimensiona con `width/height: 100%`, que un span en línea
         ignoraría, así que aquí se escriben los cuatro estilos ESTRUCTURALES que
         la hacen llenar la tabla. El envoltorio es además lo que permite
         cambiarle el contenido —lámina o reserva— sin tocar el árbol. */
      var madera = document.createElement("span");
      madera.className = "tw-madera";
      madera.style.position = "absolute";
      madera.style.left = "0";
      madera.style.top = "0";
      madera.style.width = "100%";
      madera.style.height = "100%";
      madera.style.display = "block";
      madera.style.pointerEvents = "none";
      ilustrar(madera, RUTA_TABLA, SVG_TABLA);
      b.appendChild(madera);

      var placa = document.createElement("span");
      placa.className = "tw-placa" + (corta.length > 18 ? " tw-placa--larga" : "");
      placa.textContent = corta;
      b.appendChild(placa);

      var cartel = document.createElement("span");
      cartel.className = "tw-cartel";
      cartel.textContent = T.enPie;
      cartel.hidden = true;
      b.appendChild(cartel);

      /* La respuesta táctil va en el POINTERDOWN, no en el click: es lo que
         separa «responde» de «va lento» (<100 ms). El kit retira la clase solo
         al soltar, cancelar o perder el foco de la ventana. */
      b.addEventListener("pointerdown", function () {
        if (ocupado || b.disabled) return;
        if (window.MFJuice && MFJuice.respuesta) MFJuice.respuesta(b);
      });
      /* El juicio va en el CLICK: así Enter y Espacio sobre el <button> juegan
         igual que el dedo, sin capturar una sola tecla. */
      b.addEventListener("click", function () { juzgar(k, b); });

      /* Reapertura tras abandono: las tablas que ya cayeron siguen caídas. */
      if (mem.falladas[k]) marcarFallada(b);

      escena.appendChild(b);
      return { boton: b, madera: madera, placa: placa, cartel: cartel, corta: corta, correcta: !!(o && o.correct) };
    }

    m.cuerpo.appendChild(raiz);

    /* PRESENTANDO → LISTO. La caja del modal tarda 220 ms en subir (animación de
       la casa); el juego no añade teatro propio, solo espera a que pare. */
    luego(quieto ? 0 : 220, function () { ocupado = false; estado("listo"); });

    function estado(s) { raiz.setAttribute("data-estado", s); }

    /* Deshabilitar el elemento que TIENE el foco lo manda a <body>, y ahí la
       trampa de foco de retos.js ya no puede hacer nada: escucha los Tab en la
       caja del modal, y desde <body> las teclas ni le llegan. Sin este rescate,
       el alumno que juega con teclado se va de paseo por la misión de debajo
       justo después de fallar. Solo se rescata cuando el foco era de verdad del
       elemento apagado: robarlo tras un tap con el dedo sería peor. */
    function rescatarFoco() {
      var libres = escena.querySelectorAll(".tw-tabla:not([disabled])");
      var destino = libres.length ? libres[0]
        : (m.caja && m.caja.querySelector(".reto-modal__cerrar"));
      if (destino && destino.focus) { try { destino.focus(); } catch (e) { /* nada */ } }
    }

    function apagar(b) {
      var teniaFoco = (document.activeElement === b);
      b.disabled = true;
      if (teniaFoco) rescatarFoco();
    }

    function marcarFallada(b) {
      apagar(b);
      b.classList.add("tw-fallada");
      var c = b.querySelector(".tw-cartel");
      if (c) c.hidden = false;
    }

    /* Único punto donde se escribe la posición de la mano (contrato de
       game.css). Un navegador sin `translate` independiente deja la mano
       quieta arriba: se pierde el viaje, nunca la partida. */
    function moverMano(x, y) {
      mano.style.setProperty("--tw-mx", Math.round(x) + "px");
      mano.style.setProperty("--tw-my", Math.round(y) + "px");
    }

    /* ------------------------------------------------------- el juicio (§3) */

    function juzgar(k, b) {
      /* Anti-mash: durante cualquier animación los taps se IGNORAN; encolarlos
         dispararía dos roturas seguidas sobre la misma tabla. */
      if (ocupado || b.disabled) return;
      ocupado = true;
      estado("juzgando");
      mano.classList.remove("tw-flota");

      var t = tablas[k];
      var primero = mem.intentos === 0;
      mem.intentos++;
      var limpio = t.correcta && mem.intentos === 1;

      /* UNA sola pasada de lectura de layout por tap (presupuesto F0 §0.10.2);
         los rects nunca se cachean entre taps, así que girar la pantalla a
         mitad de partida no descoloca nada. */
      var rB = b.getBoundingClientRect();
      var rM = mano.getBoundingClientRect();
      var rE = m.escenario ? m.escenario.getBoundingClientRect() : null;
      /* Origen de la cosecha: centro-superior de la tabla golpeada, en
         coordenadas del escenario de efectos. */
      var pi = rE
        ? { x: rB.left + rB.width / 2 - rE.left, y: rB.top - rE.top }
        : { x: 0, y: 0 };
      /* Cambio de moneda antes de escribir nada: los rects de arriba están en
         píxeles de PANTALLA (la casa aplica `zoom` al documento, styles.css:79)
         y `--tw-mx/--tw-my` se escriben en píxeles CSS, que el navegador vuelve
         a encoger al pintarlos. Sin dividir, la mano recorría el 80 % del camino
         y golpeaba fuera de la tabla: los probadores la midieron a 64 px del
         centro del tablón en tablet (0 px en móvil, donde no hay zoom). La
         cuenta es la misma que usa el arrastre y vive en un solo sitio; si
         MFDrag no estuviera cargado, el 1 deja el comportamiento de siempre. */
      var kz = (window.MFDrag && MFDrag.zoomDe) ? MFDrag.zoomDe(mano) : 1;
      /* El viaje se mide como DELTA desde donde la mano está AHORA y se acumula:
         fijar una posición absoluta a partir de un rect ya desplazado mandaría
         la mano al doble de distancia en la segunda repesca. */
      manoX += ((rB.left + rB.width / 2) - (rM.left + rM.width / 2)) / kz;
      /* La mano aterriza SOBRE su propia tabla, con el canto a media altura del
         tablón. No es un capricho de encuadre: el brazo mide casi lo mismo que
         una tabla, así que dejarlo flotando sobre el borde superior lo plantaba
         entero encima de la tabla ANTERIOR y se veía golpear una y romperse
         otra. Apoyado en la suya, invade a lo sumo el hueco entre tablas y la
         causa se lee sola. El 0.55 va con `rB.height`, no con un número fijo:
         las tablas cambian de alto según cuántas opciones haya (--tw-h). */
      manoY += ((rB.top + rB.height * 0.55) - rM.bottom) / kz;

      var anticipa = quieto ? 0 : (primero ? 400 : 300);
      var golpe = quieto ? 0 : 90;

      if (!quieto) {
        /* VIAJE: 150 ms (transición de .tw-mano), solapado con la anticipación.
           Va por `--tw-mx/--tw-my` y no por `transform` porque el kit ya usa
           `transform` para el temblor y el squash: la propiedad `translate`
           compone en vez de pelearse. */
        moverMano(manoX, manoY);
        if (window.MFJuice && MFJuice.anticipar) MFJuice.anticipar(manoFig, anticipa);
      }

      luego(anticipa, function () {
        /* IMPACTO: la mano baja los últimos píxeles, rápido y seco. */
        if (!quieto) {
          mano.classList.add("tw-mano--golpe");   /* la misma transición, pero de 90 ms y acelerando */
          moverMano(manoX, manoY + 18);
        }
        luego(golpe, function () {
          /* Congelar 70 ms todo lo que se mueve dentro de la caja es lo que
             convierte el cambio de estado en un GOLPE. El puño suena AQUÍ, en
             el instante del impacto (docs/09): la tabla responderá con su
             crack o su tonk 70 ms después, cuando el hitstop suelte. */
          if (window.MFSonido && MFSonido.fx) MFSonido.fx("fx-golpe");
          if (window.MFJuice && MFJuice.hitstop) MFJuice.hitstop(m.caja, 70);
          luego(quieto ? 0 : 70, function () {
            if (t.correcta) rotura(k, t, b, pi, limpio);
            else tonk(k, t, b);
          });
        });
      });
    }

    /* ------------------------------------------------- ROTURA · acierto §5.1 */

    function rotura(k, t, b, pi, limpio) {
      estado("rotura");
      /* En examen la racha ni suma ni resetea (§10): el examen no debe alterar
         el sabor de la misión siguiente. La VARIANTE, en cambio, se conserva:
         la ficha pide que la cascada del examen sea idéntica. */
      var triple = racha >= 1;
      if (!m.examen && limpio) racha++;

      /* Siempre en DOS trozos, también en la racha. El tercio central es el único
         que no sale espejando la mitad —necesita dentado en los dos extremos— y
         su lámina no está aprobada: partir en tres con la lámina de mitad
         dejaría media tabla flotando en el centro. La racha se sigue premiando,
         pero por donde no cuesta arte: el sello dice ¡MAESTRÍA! en vez de ¡KIAI!
         y el anuncio lo cuenta. Para reactivar los tres trozos basta generar
         `reto-tameshiwari-tabla-centro` y devolver aquí el `triple ? 3 : 2`. */
      partir(t, 2, false);

      if (!quieto) {
        if (window.MFJuice && MFJuice.particulas) {
          MFJuice.particulas(m.escenario, {
            x: pi.x, y: pi.y, n: 8, angulo: -90, dispersion: 50,
            dist: [40, 90], dur: [450, 650],
            colores: ["#d9a866", "#b98544", "#f7f3ec"], forma: "astilla"
          });
        }
        if (window.MFJuice && MFJuice.destello) MFJuice.destello(m.escenario, pi.x, pi.y, { radio: 60 });
        if (window.MFJuice && MFJuice.squash) MFJuice.squash(manoFig);
      }
      /* El sonido no es movimiento: suena también con movimiento reducido, y
         solo si el alumno encendió el interruptor del modal. La madera cruje
         como en las cards de elegir (titular 2026-09-02) y el arpegio de
         acierto entra justo detrás, cuando el crack ya contó el impacto. */
      if (window.MFSonido) {
        if (MFSonido.fx) MFSonido.fx("fx-tabla-rompe");
        if (MFSonido.arpegio) MFSonido.arpegio();
        if (MFSonido.vibrar) MFSonido.vibrar(15);
      }

      anunciar(T.ganado.replace("{c}", t.corta) + (triple ? T.triple : ""));

      /* Con movimiento reducido el resultado tiene que poder LEERSE: la tabla
         partida estática no basta como única señal (§11.6). */
      if (quieto) {
        var p = document.createElement("p");
        p.className = "tw-resultado";
        p.textContent = T.resultado;
        raiz.appendChild(p);
      }

      luego(quieto ? 0 : 250, function () {
        if (window.MFJuice && MFJuice.sello) MFJuice.sello(m.escenario, triple ? T.maestria : T.kiai);
      });

      /* El cobro solo vuela si el bonus es de verdad: en examen no existe
         —`mission.js` lo cobra con `!isExam` (§0.8.1) y el examen entrega por
         `completeExam`— y en la sala de retos puede valer menos, o nada. Todo eso
         lo responde `premio()`, y un 0 significa que aquí no vuela nada:
         prometer un XP que jamás llega es lo único que no se perdona. El chip
         vuela con el número exacto que se va a pagar, ni uno más. */
      var paga = premio(limpio);
      if (paga && !quieto) {
        luego(500, function () {
          if (window.MFJuice && MFJuice.volarXP) MFJuice.volarXP(b, paga);
        });
      }

      luego(quieto ? 200 : 1100, function () {
        estado("cerrando");
        m.resolver({ limpio: limpio, intentos: mem.intentos, ms: Math.round(ahora() - t0) });
      });
    }

    /* --------------------------------------------------- TONK · fallo §5.2 -- */

    function tonk(k, t, b) {
      estado("tonk");
      mem.falladas[k] = true;
      if (!m.examen) racha = 0;

      /* El kit lo hace TODO: rebote, dos estrellitas, nota grave. Sin
         screenshake y sin vibración jamás — el fallo nunca castiga. La madera
         que AGUANTA suena a madera viva (el wobble de las cards de elegir),
         encima del uuh del kit, que sigue siendo la voz del fallo. */
      if (window.MFSonido && MFSonido.fx) MFSonido.fx("fx-tabla-aguanta");
      if (window.MFJuice && MFJuice.fallo) MFJuice.fallo(manoFig, m.escenario);
      if (!quieto) {
        reanimar(b, "juice-fallo");
        luego(400, function () { b.classList.remove("juice-fallo"); });
      }

      luego(quieto ? 0 : 600, function () {
        /* Lo que ENSEÑA es el feedback escrito de ESA opción; el panel y el
           evento reto_fail los pone la infraestructura. */
        m.fallar(k);
        marcarFallada(b);
        /* Después del panel: `fallar` ya anuncia el feedback y esta línea deja
           como estado final del lector la instrucción de qué hacer ahora. */
        anunciar(m.examen ? T.falloExamen.replace("{c}", correctaCorta()) : T.falloMision);

        if (m.examen) { revelado(); return; }

        /* Repesca ilimitada y sin cronómetro (regla del titular). La mano
           vuelve a su altura de guardia y respira otra vez: sin esto se
           quedaría clavada dentro de la tabla que acaba de no romper. */
        if (!quieto) {
          b.classList.remove("juice-fallo");
          mano.classList.remove("tw-mano--golpe");
          moverMano(manoX, manoY);
          mano.classList.add("tw-flota");
        }
        estado("lectura");
        ocupado = false;
      });
    }

    function correctaCorta() {
      for (var i = 0; i < tablas.length; i++) { if (tablas[i].correcta) return tablas[i].corta; }
      return "";
    }

    /* --------------------------------------- REVELADO · examen sin repesca -- */

    function revelado() {
      estado("revelado");
      for (var i = 0; i < tablas.length; i++) {
        if (!tablas[i].correcta) continue;
        /* Anti-celebración deliberada: rotura SECA, sin astillas, sin destello,
           sin sello y sin sonido. El examen informa, no premia. */
        partir(tablas[i], 2, true);
        tablas[i].placa.classList.add("tw-placa--ok");
        /* Por `apagar` y no por `disabled = true` a secas: el rescate de la
           tabla fallada pudo dejar el foco justo en esta. */
        apagar(tablas[i].boton);
        break;
      }
      luego(quieto ? 200 : 700, function () {
        estado("cerrando");
        m.resolver({ limpio: false, intentos: mem.intentos, ms: Math.round(ahora() - t0) });
      });
    }

    /* ------------------------------------------------ LA TABLA PARTIDA §7.5 - */

    /* Los trozos son clones del MISMO dibujo, cada uno con su recorte, así que
       funcionan igual con la lámina y con la silueta de reserva. El recorte, la
       caída y el giro los pone game.css con sus clases `tw-trozo--*`; aquí solo
       se elige cuántos hay y se cuelgan del botón. La placa NO se clona: se
       queda flotando sobre los restos, que es lo que mantiene legible la
       respuesta (y lo que sostiene el ✓ del revelado de examen). */
    function partir(t, piezas, seca) {
      var clases = piezas === 3 ? TROZOS3 : TROZOS2;

      /* `tw-tabla--rota` esconde la tabla entera y deja ver los trozos; con
         `tw-tabla--seca` la caída dura 350 ms y no hay fiesta ninguna. */
      t.boton.classList.add("tw-tabla--rota");
      if (seca) t.boton.classList.add("tw-tabla--seca");

      var trozos = [];
      for (var i = 0; i < clases.length; i++) {
        var tr = document.createElement("span");
        tr.className = "tw-trozo " + clases[i];
        tr.setAttribute("aria-hidden", "true");
        /* El trozo NO es un clon de la tabla sana recortado: es su propia
           lámina, la de la mitad partida, con su dentado y su troquel. Es la
           regla del titular (F0 §0.12): entera → rota cambia la silueta del
           objeto, así que se INTERCAMBIA el sprite. La mitad derecha es esta
           misma lámina espejada por CSS (`.tw-trozo--der2 .tw-trozo__fig`), que
           es lo que permite que una sola lámina cubra los dos trozos.
           `onerror` marca el BOTÓN, no la figura: sin lámina de trozo hay que
           encender la ruta de reserva entera —los clip-path cuelgan de
           `.tw-tabla--css`— o los trozos saldrían rectangulares. */
        var fig = document.createElement("img");
        fig.className = "tw-trozo__fig";
        fig.alt = "";
        fig.draggable = false;
        fig.onerror = reservaTrozo(t.boton);
        fig.src = RUTA_MITAD;
        tr.appendChild(fig);
        t.boton.appendChild(tr);
        trozos.push(tr);
      }

      /* Con movimiento reducido los trozos se quedan donde caen (la hoja los
         coloca ya en su posición final): son la prueba visible de que la tabla
         está rota y no puede retirarlos nadie. Con movimiento, se van cuando ya
         se han desvanecido. */
      if (quieto) return;
      luego((seca ? CAIDA_SECA : CAIDA) + FUNDIDO + 80, function () {
        for (var j = 0; j < trozos.length; j++) {
          if (trozos[j].parentNode) trozos[j].parentNode.removeChild(trozos[j]);
        }
      });
    }
  }

  /* ============================================================= REGISTRO === */

  MFRetos.registrar({
    id: "tameshiwari",
    nombre: "Tameshiwari",
    icono: "🥋",
    banner: T.banner,
    comoSeJuega: T.comoSeJuega,
    /* El comodín universal del sistema: le vale cualquier quiz con etiquetas
       cortas y exactamente una respuesta correcta. Sin `corta` en el contenido,
       el sorteo lo salta y la tarjeta cae al quiz clásico sin romper nada. */
    necesita: ["corta", "correct1", "sinorden"],
    acepta: function (tarjeta) {
      var n = ((tarjeta && tarjeta.options) || []).length;
      return n >= 2 && n <= 4;   /* de 2 tablas (verdadero/falso) a 4 */
    },
    jugar: jugar
  });
})();

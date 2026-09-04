/* MenteFu / MindFu — LA CAMPANA DEL TEMPLO (docs/07-miniretos/F6).

   Una torre de feria del templo. El alumno toca el talismán que cree verdadero,
   el mazo de la máquina golpea y el disco sube por el raíl: solo el talismán
   correcto llega a la campana y la hace sonar. La verdad PESA. Es una decisión
   1-de-N puramente semántica: la carga se completa SOLA, nadie pierde por
   soltar mal y no hay un solo milisegundo de habilidad motriz.

   Este archivo SOLO pinta y juzga. El XP, el cierre, el historial del
   navegador, el panel de feedback y toda la telemetría los pone la
   infraestructura (retos.js) a través del `montaje`: aquí no hay ni un
   MF.track, ni una suma de XP, ni un listener de Escape.

   SIETE DECISIONES QUE NO CONVIENE DESHACER SIN LEER EL PORQUÉ
   ────────────────────────────────────────────────────────────

   · LA GEOMETRÍA SALE DE LA LÁMINA MEDIDA, NUNCA DE LA PEDIDA. `campana-torre`
     se pidió «one unit wide to three units tall» (0.333) y volvió 420×608
     (0.6908), y además trae un rectángulo fantasma de alfa 3 en su borde que
     engordó el recorte de `postprocess`: el DIBUJO sólido son 212×510 px
     metidos en x∈[104,316), y∈[51,561) del archivo. O sea: la mitad del ancho
     del archivo es aire. Por eso aquí NO se declara la proporción del dibujo
     sino la del ARCHIVO (`--torre-ratio`), y encima las fracciones MEDIDAS de
     dónde cae cada cosa dentro de él (`--torre-fx0`, `--torre-fy0`,
     `--torre-fw`, `--torre-fh`, `--torre-fyugo`, `--torre-fsuelo`). Con la caja
     puesta a la proporción del archivo, `contain` no recorta ni deja franjas y
     cada fracción es una regla de tres exacta. Es la lección de F1 llevada un
     paso más allá: lo que cae ENCIMA de una lámina se calcula desde su tamaño
     VISIBLE, y aquí el visible ni siquiera coincide con el borde del archivo.
     Si algún día se regenera la torre, se vuelven a medir esos seis números y
     no se toca ni una línea de JS.

   · NO HAY PALANCA. La quinta lámina (`campana-palanca`) no se encargó: el
     titular no la aprobó. La ficha ya dejaba escrita esa salida (A.7: «si se
     recorta, se borran la lámina Y su animación: el mazo golpea directo a la
     base»), así que eso es exactamente lo que se hace. Lo que NO se hace —y es
     la razón de esta nota— es dibujarla con formas CSS: una barra con
     `border-radius` y fondo `#12131a` sería justo el objeto móvil dibujado con
     CSS que la regla del titular (F0 §0.12) prohíbe. Sin pieza propia, sin
     imitación: el mazo golpea la base y ya.

   · EL MAZO GIRA AL REVÉS DE LO QUE DECÍA LA FICHA. La lámina llegó con la
     cabeza arriba-izquierda y el mango abajo-derecha, y el pivote es el extremo
     del mango: girar en POSITIVO (horario) sube la cabeza y girar en negativo
     la baja. La ficha pedía reposo 35° / alzado −20°, que con esta lámina es
     exactamente lo contrario de lo que se ve. Aquí: reposo −30° (cabeza apoyada
     en la base, junto al disco), alzado +10° con 10 px de subida, golpe de
     vuelta a −30°, gag −46°. Los ángulos son constantes con nombre precisamente
     para que nadie los «corrija» a ojo.

   · EL DISCO SON DOS NODOS. El `<span class="campana-disco">` lleva el VIAJE
     (`translateY`, `scale`, `rotate` de la caída, en estilo en línea) y el
     `<img>` de dentro lleva los EFECTOS del objeto (el tiemble de la carga y el
     `juice-squash` del plop). Con un solo nodo, una animación de `transform`
     gana siempre al estilo en línea y el disco saltaría a su reposo a mitad del
     viaje. Es el reparto ya medido y funcionando en `.tw-mano`/`.tw-mano__fig`
     y en `.reto-lienzo`/`.reto-pieza` (game.css).

   · EL DISCO PASA POR DETRÁS DE LA CAMPANA (z-index 2 contra 3). El impacto se
     calcula al LABIO de la campana (`--campana-labio`, medido: el borde bajo
     del ala está al 87.8 % del alto del archivo), no a su centro: el asa ocupa
     la franja alta y con el centro el disco se pararía por debajo y el destello
     quedaría descolgado. Al parar el centro del disco en el labio, su mitad
     superior desaparece tras el ala: se lee como golpe desde abajo, que es lo
     que hace un puck de feria.

   · NINGÚN HITSTOP CAE SOBRE UNA TRANSICIÓN EN CURSO. `.juice-hitstop` aplica
     `transition: none !important` a la caja y a todo su interior
     (game.css:1350): una transición congelada no se congela, SALTA a su valor
     final. Los dos hitstops del juego están fuera de peligro — el del golpe
     ocurre antes de que el disco arranque, y el de la campanada en el fin del
     viaje, detectado por `transitionend` filtrado a `transform` (nunca por un
     setTimeout a ojo).

   · CON `prefers-reduced-motion` NO HAY VIAJE NI FUNDIDO. `styles.css:103-106`
     mata TODA transición y animación con `!important`, así que esperar un
     `transitionend` colgaría la partida para siempre: el disco recibe su
     transform final de golpe, sin transición y sin esperar ningún evento, y el
     resultado se cuenta además con TEXTO bajo la escena y en `.reto-vivo`.
     Nunca solo con animación.

   DÓNDE ESTÁ EL TRAJE: en la sección RETOS de `assets/css/game.css`, como en
   F1..F5, y en NINGÚN otro sitio. Este archivo llegó a llevar su propia copia
   del CSS en una constante `HOJA` que inyectaba un <style> en el <head>, y
   durante un rato convivieron las dos: un <style> inyectado entra en la cascada
   DESPUÉS del <link>, así que ganaba en lo que ambas declaraban y perdía en lo
   que solo declaraba la hoja — un `transform` de compensación que sobraba se
   colaba sobre la torre y la bajaba 31 px, con la base recortada y la campana
   colgando en el aire. Es la lección de F2 (kintsugi.js:88): dos copias del
   mismo CSS no empatan, siempre gana la que nadie mira. Este archivo NO escribe
   CSS: solo pone y quita clases, y los únicos estilos en línea son los cuatro
   `transform` que SON la mecánica (el viaje del disco y los giros del mazo) y el
   `left`/`top` de las ondas, que dependen de una medida. */
(function () {
  "use strict";

  /* Sin infraestructura no hay reto: mission.js cae solo a su quiz clásico. */
  if (!window.MFRetos || !MFRetos.registrar) return;

  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var A = cfg.assets || "";
  var XP = cfg.xp || {};

  /* Momento Peggle (F7): la tercera ronda del examen estira la campanada. Va
     detrás de bandera y se publica en false; F7 la pondrá a true. La rama pide
     además `montaje.ronda === 3`, y `ronda` solo existe en examen (retos.js:625),
     así que con la bandera apagada es código muerto y verificable. */
  var PEGGLE = false;

  /* Las láminas se referencian SIEMPRE con el prefijo del build: las misiones
     cuelgan de cuatro niveles de carpeta y un `src` relativo escrito desde JS se
     resolvería contra la URL de la página (patrón arbol.js:12). Y siempre el
     .webp: al publicar, el .png se descarta cuando existe su .webp
     (build.py `sin_png_redundantes`). */
  var RUTA = A + "assets/img/juegos/";
  var RUTA_TORRE = RUTA + "campana-torre.webp";
  var RUTA_CAMPANA = RUTA + "campana-campana.webp";
  var RUTA_DISCO = RUTA + "campana-disco.webp";
  var RUTA_MAZO = RUTA + "campana-mazo.webp";
  /* Tablilla de los talismanes: la lámina de F1 REUTILIZADA (ficha §7,
     «reutilizados, coste 0»). Su prompt ya pide «a plain smooth empty centre
     with no markings so a label can sit on top», que es justo lo que necesita
     una etiqueta en HTML encima. */
  var RUTA_TABLA = RUTA + "tameshiwari-tabla.webp";
  /* La mascota en reposo (`mascota/reposo.webp`, antes `propuesta-1`): el .webp
     pesa 89 KB en vez de los 408 del PNG y el HTML de la casa siempre prefiere
     WebP. Meter 408 KB en el modal de un minijuego para pintar 65 px sería
     pagar el peso dos veces, porque el PNG además viajaría al sitio publicado. */
  var RUTA_MASCOTA = A + "assets/img/mascota/reposo.webp";

  var T = ES ? {
    nombre: "La campana del templo",
    banner: "SUENA",
    /* La línea de «qué hay que hacer», declarada por el JUEGO y no por quien la
       pinta: la enseñan dos interfaces —la ficha de la sala de retos y la
       tarjeta-invitación de la misión— y con una tabla en cada una, el día que
       se retoque la frase se retocará en una sola. Aquí hay una sola verdad. */
    comoSeJuega: "Haz sonar la campana con el golpe justo.",
    sello: "¡TALÁN!",
    resultado: "¡Campanada!",
    resultadoXp: "¡Campanada! +5 XP",
    resultadoKo: "El disco se quedó a media torre",
    abre: "Toca el talismán verdadero: solo la verdad pesa lo suficiente para hacer sonar la campana.",
    cargando: "Cargando el golpe…",
    gana: "Correcto: {c}. ¡La campana suena!",
    falla: "El disco se quedó a media torre. Lee por qué y prueba otro talismán.",
    fallaExamen: "El disco no llegó. La correcta era {c}."
  } : {
    nombre: "The Temple Bell",
    banner: "RING",
    comoSeJuega: "Ring the bell with the right strike.",
    sello: "DING!",
    resultado: "Ding!",
    resultadoXp: "Ding! +5 XP",
    resultadoKo: "The puck stopped halfway",
    abre: "Tap the true talisman: only the truth weighs enough to ring the bell.",
    cargando: "Charging the strike…",
    gana: "Correct: {c}. The bell rings!",
    falla: "The puck stopped halfway. Read why and try another talisman.",
    fallaExamen: "The puck fell short. The right one was {c}."
  };

  /* ============================================================ TIEMPOS ===== */

  var CARGA_PRIMERA = 600;   /* primer intento de la tarjeta */
  var CARGA_REPESCA = 300;   /* repesca: se acorta, el teatro NO (mejora del jurado) */
  var MS_GOLPE = 180;        /* el mazo cae */
  var MS_HITSTOP = 70;
  var MS_VIAJE = 700;        /* subida del acierto */
  var MS_VIAJE_KO = 450;     /* subida corta del fallo */
  var MS_PLOP = 220;
  var MS_DUDA = 200;         /* pausa cómica: el disco DUDA antes de caer */
  var MS_CAIDA = 500;
  var MS_GAG = 250;          /* el golpecito extra del mazo en el vacío */
  var MS_LECTURA = 1200;     /* examen: lectura mínima antes de resolver */
  var MS_ENTRADA = 220;      /* lo que tarda la caja del modal en subir */
  var CURVA = "cubic-bezier(0.22, 0.9, 0.35, 1)";

  /* Ángulos del mazo. Ver la cabecera: con ESTA lámina, positivo LEVANTA.
     Los tres se midieron EN PANTALLA, no a ojo: con el pivote en el extremo del
     mango (88 %, 89 % de la lámina), −30° deja la cabeza apoyada en la base
     JUSTO a la derecha del disco sin taparlo, +10° con 10 px de subida la
     levanta sin que se meta bajo la columna de talismanes (que va por encima en
     z-index y lo recortaría a media carga), y −46° es el golpecito del gag, más
     abajo y más a la izquierda. Cambiar uno sin rehacer la cuenta descoloca los
     tres. */
  var MAZO_REPOSO = -30;
  var MAZO_ALZADO = 10;
  var MAZO_SUBIDA = 10;   /* px que además sube el mazo al cargar */
  var MAZO_GAG = -46;

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

  /* Relanza un keyframe aunque la clase ya estuviera puesta: sin el reflow el
     navegador no lo repite y la segunda campanada de la página se quedaría
     quieta. */
  function reanimar(nodo, clase) {
    nodo.classList.remove(clase);
    void nodo.offsetWidth;
    nodo.classList.add(clase);
  }

  /* ==================================================== LÁMINA Y RESERVA === */

  /* La vuelta atrás va como FÁBRICA y no como closure escrito en el sitio:
     estos manejadores se cuelgan de imágenes creadas dentro de bucles con `var`,
     y una función definida ahí dentro capturaría la VARIABLE del bucle, no su
     valor (lección de F1, tameshiwari.js:139-152). */
  function reservaDe(img) {
    /* Sin lámina, la ranura se queda VACÍA. Es la regla del titular llevada a su
       consecuencia: no hay dibujo de repuesto en SVG ni en formas CSS. La
       partida sigue siendo jugable y accesible —los talismanes son botones con
       su etiqueta y su aria-label— y las láminas viajan en el mismo build que
       este archivo, así que esto es una degradación documentada, no un camino
       de diseño. */
    return function () { img.style.visibility = "hidden"; };
  }

  /* Cuelga la lámina definitiva. El <img> nace ya con su `src` (F0 §0.12: la
     pieza es ilustración desde el PRIMER fotograma) y lleva encima su propia
     red. Los manejadores van ANTES del `src` porque una imagen ya en caché
     puede resolver dentro de la propia asignación: apuntarlos después sería
     apuntarlos tarde, y ese es justo el caso de la segunda partida de la
     página (tameshiwari.js:157-184). */
  function ilustrar(nodo, ruta, clases) {
    var img = document.createElement("img");
    img.className = clases;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.draggable = false;
    img.onerror = reservaDe(img);
    /* Un 404 servido como página HTML puede «cargar» con 0x0 sin disparar
       `onerror`: sin píxeles no hay lámina. */
    img.onload = function () {
      if (!img.naturalWidth || !img.naturalHeight) img.style.visibility = "hidden";
    };
    nodo.appendChild(img);
    img.src = ruta;
    return img;
  }

  /* ================================ MEMORIA POR TARJETA (§12, reanudación) ==

     Cerrar el modal a mitad y reabrir NO devuelve la oportunidad del «limpio» ni
     resucita los talismanes ya descartados. La infraestructura persiste el
     CONTEO (estado.fallos, retos.js:423-429) pero no sabe CUÁLES cayeron: eso
     vive aquí. La clave incluye el intento de examen, así que el botón de
     reintento estrena estado sin borrar nada. WeakMap para que las tarjetas de
     un intento viejo se recojan solas; sin WeakMap, un objeto plano, que a
     escala de una página es igual de bueno. */
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

  /* ============================================================== EL JUEGO == */

  function jugar(m) {
    var ops = (m.tarjeta && m.tarjeta.options) || [];
    var n = ops.length;
    /* No debería llegar (lo filtran `necesita` y `acepta`), pero si llegara,
       resolver es mejor que dejar al alumno encerrado con la tarjeta bloqueada. */
    if (n < 2) { m.resolver({ limpio: false, intentos: 1, ms: 0 }); return; }

    var mem = memoria(m);
    var quieto = reducido();
    var t0 = ahora();
    var timers = [];
    var estado = "presentando";
    var punteroActivo = null;
    var ultimoTap = -1e9;      /* separa el click del teclado del click del ratón */
    var cargado = false, soltado = false;
    var kActivo = -1;   /* opcion en juego; -1 fuera de una pulsacion */
    /* Medidas de la lectura única (A.4). Se rellenan en `medir()`. */
    var D = 0, Dko = 0, xC = 0, yC = 0, xS = 0, yS = 0;

    /* Guarda anti-carrera: el alumno puede haber cerrado el modal a mitad de
       cualquier animación. Toda devolución de llamada pregunta antes de tocar
       el DOM. */
    function vivo() {
      if (m.vivo && !m.vivo()) return false;
      return raiz.isConnected !== false;
    }

    function anunciar(s) { if (m.anunciar) m.anunciar(s); }

    /* Cuánto paga DE VERDAD una victoria limpia de ESTA partida: 5 XP jugando la
       misión, el 10 % de esa misión si quien abrió el reto fue la sala de retos,
       y CERO si allí esa pregunta ya se cobró o si esto es un examen. El juego no
       puede deducirlo —lo hacía con `!m.examen` y por eso cantaba «+5 XP» donde
       se pagaban 3—: se lo pregunta al montaje. Y `conXP` mete ese número en la
       cadena de T, que sigue escrita con su «+5» y no se reescribe. Las guardas
       son las de `anunciar`: por si alguna vez se juega contra un retos.js más
       antiguo, donde la misión pagaba su bonus y el examen no pagaba nada. */
    function premio(limpio) {
      if (!limpio) return 0;
      return m.premia ? m.premia() : (m.examen ? 0 : (XP.quiz_first_try || 5));
    }
    function conXP(t, n) { return m.conXP ? m.conXP(t, n) : t; }

    function luego(ms, fn) {
      var id = setTimeout(function () { if (vivo()) fn(); }, ms);
      timers.push(id);
      return id;
    }

    function marcar(s) { estado = s; raiz.setAttribute("data-estado", s); }

    /* ------------------------------------------------------------ pantalla -- */

    var raiz = document.createElement("div");
    raiz.className = "campana";
    raiz.setAttribute("data-estado", "presentando");

    /* DIV y no P: `tarjeta.html` viene de Markdown y casi siempre trae ya su
       propio <p>; anidarlo dentro de otro <p> es HTML inválido y el navegador
       lo partiría en dos párrafos con márgenes de más. */
    var enunciado = document.createElement("div");
    enunciado.className = "campana-enunciado";
    enunciado.innerHTML = (m.tarjeta && m.tarjeta.html) || "";
    raiz.appendChild(enunciado);

    var escena = document.createElement("div");
    escena.className = "campana-escena";
    /* `data-n` es el contrato con la hoja: de ahí sale SOLO el alto de cada
       talismán, así que aquí no se calcula ni un píxel. */
    escena.setAttribute("data-n", String(n));
    /* NADA de `role="img"` aquí, por muy tentador que sea describir la escena de
       una vez: los talismanes son hijos suyos y un `role="img"` convierte todo
       el subárbol en presentacional — el lector de pantalla dejaría de ver los
       tres botones y la partida sería injugable sin vista. La escena se cuenta
       por `.reto-vivo` al abrir (T.abre) y cada talismán lleva su aria-label. */
    raiz.appendChild(escena);

    ilustrar(escena, RUTA_TORRE, "campana-torre reto-pieza");
    var campanaImg = ilustrar(escena, RUTA_CAMPANA, "campana-campana reto-pieza");

    /* Los DOS nodos del disco. Ver la cabecera: separados, el tiemble y el
       viaje se componen; juntos, la animación se come el viaje. */
    var disco = document.createElement("span");
    disco.className = "campana-disco";
    disco.setAttribute("aria-hidden", "true");
    var discoImg = ilustrar(disco, RUTA_DISCO, "campana-disco__fig");
    var estela = document.createElement("i");
    estela.className = "campana-estela";
    estela.setAttribute("aria-hidden", "true");
    disco.appendChild(estela);
    escena.appendChild(disco);

    var mazo = ilustrar(escena, RUTA_MAZO, "campana-mazo reto-pieza");
    var mascota = ilustrar(escena, RUTA_MASCOTA, "campana-mascota");

    var columna = document.createElement("div");
    columna.className = "campana-opciones";
    escena.appendChild(columna);

    var talismanes = [];
    for (var k = 0; k < n; k++) talismanes.push(crearTalisman(ops[k], k));

    function crearTalisman(o, i) {
      var corta = (o && typeof o.corta === "string") ? o.corta.replace(/^\s+|\s+$/g, "") : "";
      /* Red por si el censo va a medias: el sorteo no debería asignar la campana
         a una tarjeta sin `corta` (`necesita`), pero un botón mudo sería peor
         que un botón con las primeras palabras del enunciado de la opción. */
      if (!corta) corta = textoPlano(o && o.html).slice(0, 24);

      var b = document.createElement("button");
      b.type = "button";
      b.className = "campana-talisman reto-lienzo";
      b.setAttribute("data-k", String(i));
      /* La placa ya dice el texto, pero el aria-label explícito cubre el caso de
         que la etiqueta se recorte y el de la lámina sin cargar. */
      b.setAttribute("aria-label", corta);

      ilustrar(b, RUTA_TABLA, "campana-talisman__madera reto-pieza");

      var placa = document.createElement("span");
      placa.className = "reto-placa" + (corta.length > 18 ? " reto-placa--larga" : "");
      placa.textContent = corta;
      b.appendChild(placa);

      b.addEventListener("pointerdown", alPulsar);
      /* El teclado entra por el `click` nativo del <button>: Enter y Espacio
         juegan igual que el dedo sin capturar una sola tecla. Tras un
         pointerdown el estado ya no es «listo», así que el click de compatibilidad
         del ratón se ignora solo y nunca dispara dos partidas. */
      b.addEventListener("click", alClic);

      columna.appendChild(b);
      return { boton: b, placa: placa, corta: corta, correcta: !!(o && o.correct) };
    }

    var resultado = document.createElement("p");
    resultado.className = "reto-resultado";
    resultado.hidden = true;
    raiz.appendChild(resultado);

    m.cuerpo.appendChild(raiz);

    /* La prueba de existencia de las láminas vive en la infraestructura: el
       veredicto es POR RUTA y de módulo (retos.js), así que se comparte entre
       partidas y aperturas del modal. No se espera su promesa —la escena se
       monta ya, y cada <img> lleva su propia red— pero llamarla al montar es
       obligatorio por contrato. */
    if (m.precargar) {
      m.precargar([RUTA_TORRE, RUTA_CAMPANA, RUTA_DISCO, RUTA_MAZO, RUTA_TABLA, RUTA_MASCOTA]);
    }

    /* Reapertura tras abandono: los talismanes ya descartados siguen fuera. */
    for (var r = 0; r < talismanes.length; r++) {
      if (mem.falladas[r]) descartar(talismanes[r].boton);
    }

    /* --------------------------------------------- lectura única de layout -- */

    /* Una sola pasada al montar y otra en cada resize con rebote: cero lecturas
       por frame (presupuesto F0 §0.10.2).

       EL RECORRIDO SE MIDE CON `offsetTop`/`offsetHeight`, NO CON RECTS, Y ES UN
       FALLO PAGADO EN EL NAVEGADOR, no una preferencia de estilo. `styles.css`
       aplica `zoom: 0.8` al <html> en escritorio: con `zoom`, un
       `getBoundingClientRect()` vuelve en píxeles YA encogidos, mientras que un
       `translateY(Npx)` se escribe en píxeles CSS que el zoom vuelve a encoger
       después. Medido en la escena ancha: rect 336 px contra offsetHeight 420.
       Mezclando las dos unidades el disco viajaba un 20 % menos y se paraba
       DEBAJO de la campana, con el sello y las chispas encima de nada. Los tres
       `offset*` son además relativos a `.campana-escena` —es el offsetParent de
       la torre, la campana y el disco— así que no hay ni una resta de orígenes.

       El impacto es el LABIO de la campana, no su centro: el asa ocupa la franja
       alta de la lámina. */
    function medir() {
      if (!vivo()) return;
      var K = parseFloat(getComputedStyle(escena).getPropertyValue("--campana-labio")) || 0.878;
      var labio = campanaImg.offsetTop + campanaImg.offsetHeight * K;

      D = Math.round((disco.offsetTop + disco.offsetHeight / 2) - labio);
      /* Respaldo: si la medida sale absurda (lámina sin cargar, escena aún sin
         maquetar), el recorrido teórico de esta geometría es 0.36 veces el alto
         de la escena. Se deriva en vez de clavarse porque el alto cambia con el
         breakpoint y una tabla de constantes se separaría de la hoja. */
      if (!(D > 40)) D = Math.round((escena.offsetHeight || 340) * 0.36);
      Dko = Math.round(D * 0.45);

      /* Coordenadas del impacto DENTRO de la escena: las ondas y el origen del
         zoom del Peggle cuelgan de ella y se colocan en píxeles CSS. */
      xS = Math.round(campanaImg.offsetLeft + campanaImg.offsetWidth / 2);
      yS = Math.round(labio);

      /* Y las de la capa de efectos del kit, que es `position:absolute; inset:0`
         sobre la CAJA del modal: su origen solo se puede restar con rects
         (precedente exacto, juice.js:351-355). Se divide por el zoom MEDIDO
         —rect contra offsetWidth de la propia capa— porque juice.js escribe
         `left`/`top` en píxeles CSS: sin la división, en escritorio el destello y
         las chispas salían un 20 % arriba y a la izquierda del golpe. */
      if (m.escenario && m.escenario.getBoundingClientRect) {
        var rE = m.escenario.getBoundingClientRect();
        var rC = campanaImg.getBoundingClientRect();
        var z = m.escenario.offsetWidth ? (rE.width / m.escenario.offsetWidth) : 1;
        if (!(z > 0.05)) z = 1;
        xC = Math.round((rC.left + rC.width / 2 - rE.left) / z);
        yC = Math.round((rC.top + rC.height * K - rE.top) / z);
      } else { xC = xS; yC = yS; }
    }

    if (window.requestAnimationFrame) requestAnimationFrame(medir);
    else luego(0, medir);

    var reboteId = 0;
    function alRedimensionar() {
      clearTimeout(reboteId);
      reboteId = setTimeout(function () { if (vivo()) medir(); }, 150);
      timers.push(reboteId);
    }
    window.addEventListener("resize", alRedimensionar);
    window.addEventListener("orientationchange", alRedimensionar);

    /* Capa extra de blindaje del teclado: la caja del modal ya se come las
       teclas (retos.js:667), pero el foco puede escaparse a <body> tocando un
       elemento no enfocable y entonces el keydown ya no burbujea hasta ella.
       mission.js:401 llama a goPrev()/goNext() con las flechas sin ninguna
       guarda, y una flecha fugada repintaría la misión bajo el reto abierto. */
    raiz.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar" ||
          e.key === "ArrowLeft" || e.key === "ArrowRight" ||
          e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.stopPropagation();
      }
    });

    /* Soltar se escucha en el DOCUMENTO y no en el botón: con el dedo fuera del
       talismán, o si `setPointerCapture` no está disponible, el pointerup no
       llegaría nunca al botón y la carga se quedaría colgada para siempre. */
    document.addEventListener("pointerup", alSoltar);
    document.addEventListener("pointercancel", alSoltar);

    /* Los timeouts y los listeners mueren con el modal: sin esto, cerrar a mitad
       de la cascada dispararía un resolver() sobre una caja que ya no existe, o
       dejaría escuchando al documento para siempre. */
    if (m.alCerrar) {
      m.alCerrar(function () {
        for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
        timers.length = 0;
        clearTimeout(reboteId);
        window.removeEventListener("resize", alRedimensionar);
        window.removeEventListener("orientationchange", alRedimensionar);
        document.removeEventListener("pointerup", alSoltar);
        document.removeEventListener("pointercancel", alSoltar);
        estado = "cerrado";
      });
    }

    /* PRESENTANDO → LISTO. La caja del modal tarda 220 ms en subir (animación de
       la casa); el juego no añade teatro propio, solo espera a que pare. */
    luego(quieto ? 0 : MS_ENTRADA, function () {
      marcar("listo");
      anunciar(T.abre);
    });

    /* -------------------------------------------------- movimiento de piezas -- */

    /* Único camino por el que se escribe un `transform`. Con movimiento reducido
       el valor se aplica DE GOLPE y se sigue por temporizador de 0 ms: esperar
       un `transitionend` que styles.css ha matado con !important colgaría la
       partida para siempre (F0 §0.10.1 punto 6). */
    function mover(nodo, ms, curva, valor, fn) {
      if (quieto || !ms) {
        nodo.style.transition = "none";
        nodo.style.transform = valor;
        if (fn) luego(0, fn);
        return;
      }
      var hecho = false;
      var inicio = ahora();
      function rematar() {
        if (hecho) return;
        hecho = true;
        nodo.removeEventListener("transitionend", oir);
        if (fn && vivo()) fn();
      }
      /* El fin por `transitionend` filtrado a `transform`, nunca por un
         setTimeout a ojo: el hitstop de la campanada no puede caer sobre una
         transición en curso, y solo el evento real garantiza que ya terminó. El
         temporizador es la GUARDA por si el evento no llega (pestaña en
         segundo plano, transición interrumpida).

         El filtro de tiempo NO es prudencia: es un fallo MEDIDO en el navegador.
         Cuando un movimiento arranca justo al terminar el anterior sobre el
         MISMO nodo —y eso pasa siempre, porque el temporizador de la carga
         vence en el mismo milisegundo en que acaba la subida del mazo—, el
         `transitionend` de la transición VIEJA se despacha DESPUÉS de que este
         oyente ya esté colgado, y lo remataba a los 20 ms: el golpe se comía sus
         180 ms y el disco salía disparado con el mazo todavía en el aire. Solo
         se acepta un evento que llegue pasada la mitad de la duración pedida. */
      function oir(e) {
        if (e.target !== nodo || e.propertyName !== "transform") return;
        if (ahora() - inicio < ms * 0.5) return;
        rematar();
      }
      nodo.addEventListener("transitionend", oir);
      nodo.style.transition = "transform " + ms + "ms " + curva;
      /* Un reflow entre la transición y el valor: sin él, poner las dos en el
         mismo tic tras un `transition: none` puede saltarse la animación. */
      void nodo.offsetWidth;
      nodo.style.transform = valor;
      luego(ms + 140, rematar);
    }

    /* Los dos transform del mazo se escriben SIEMPRE con la misma estructura
       —`translateY(...) rotate(...)`—, aunque la subida sea 0: interpolar entre
       listas de transform de distinta longitud obliga al navegador a caer a
       matrices y el giro se convierte en un deslizamiento raro. */
    function girarMazo(grados, subida, ms, curva, fn) {
      mover(mazo, ms, curva || "ease-out",
        "translateY(" + (-subida) + "px) rotate(" + grados + "deg)", fn);
    }

    /* ------------------------------------------------------- la interacción -- */

    function cargaMs() {
      if (quieto) return 0;
      return mem.intentos === 0 ? CARGA_PRIMERA : CARGA_REPESCA;
    }

    function alPulsar(e) {
      var b = e.currentTarget;
      /* Anti-mash: fuera de «listo» las pulsaciones se IGNORAN, no se encolan.
         Un segundo dedo durante la carga cae aquí y se descarta solo, porque el
         estado ya es «carga». */
      if (estado !== "listo" || b.disabled) return;
      e.preventDefault();
      /* La captura mantiene el pointerup atado al botón aunque el dedo se
         mueva. Con guarda `&&` porque no todos los navegadores la traen
         (patrón arbol.js:292). */
      if (b.setPointerCapture) {
        try { b.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
      }
      punteroActivo = (e.pointerId === undefined) ? null : e.pointerId;
      ultimoTap = ahora();
      /* preventDefault se come el foco que da el ratón: se devuelve a mano para
         que quien juega con puntero y luego con teclado no pierda el sitio. */
      try { b.focus(); } catch (err2) { /* nada */ }
      empezarCarga(parseInt(b.getAttribute("data-k"), 10), b, false);
    }

    function alClic(e) {
      var b = e.currentTarget;
      /* Este camino es el del TECLADO: Enter y Espacio sobre un <button> nativo
         disparan un `click` y nada más. El `click` de compatibilidad del ratón
         normalmente muere en la primera guarda (tras un pointerdown el estado ya
         es «carga»), pero no en todos los navegadores `preventDefault()` sobre
         pointerdown lo suprime, y con movimiento reducido la partida entera
         puede haber vuelto a «listo» antes de que llegue: entonces el mismo dedo
         jugaría DOS veces. La ventana de 900 ms cierra esa puerta sin tocar el
         teclado, que nunca pasa por `alPulsar`. */
      if (estado !== "listo" || b.disabled) return;
      if (ahora() - ultimoTap < 900) return;
      empezarCarga(parseInt(b.getAttribute("data-k"), 10), b, true);
    }

    /* La carga se completa SOLA. Si el alumno suelta antes de tiempo se espera a
       que termine y se golpea igual; si mantiene más, el mazo se queda arriba y
       el disco temblando hasta que suelte: sin cronómetro y sin castigo. Un tap
       simple es exactamente este mismo flujo con `soltar < CARGA_MS`, así que
       la alternativa de un toque no es un camino aparte — es EL control. */
    function empezarCarga(k, b, yaSoltado) {
      marcar("carga");
      kActivo = k;
      cargado = false;
      soltado = !!yaSoltado;

      var ms = cargaMs();
      /* La respuesta táctil va en el mismo frame del pointerdown: es lo que
         separa «responde» de «va lento» (<100 ms). */
      if (window.MFJuice && MFJuice.respuesta) MFJuice.respuesta(b);
      if (window.MFJuice && MFJuice.anticipar && ms) MFJuice.anticipar(b, ms);
      if (!quieto) disco.classList.add("campana-disco--tiembla");
      /* El mazo se alza durante toda la carga: es la señal previa al premio
         (anticipación), no una barra de progreso que haya que acertar. */
      girarMazo(MAZO_ALZADO, MAZO_SUBIDA, ms, "ease-out");
      if (ms >= CARGA_PRIMERA) anunciar(T.cargando);

      luego(ms, function () {
        cargado = true;
        if (soltado) golpear();
      });
    }

    function alSoltar(e) {
      if (estado !== "carga") return;
      /* Un segundo puntero no puede disparar el golpe del primero. */
      if (punteroActivo !== null && e.pointerId !== undefined && e.pointerId !== punteroActivo) return;
      soltado = true;
      if (cargado) golpear();
    }

    function golpear() {
      if (estado !== "carga") return;
      marcar("golpe");
      punteroActivo = null;
      var t = talismanes[kActivo];
      mem.intentos++;
      var limpio = t.correcta && mem.intentos === 1;

      /* el SWING del mazo suena al arrancar la caída (titular 2026-09-02) */
      if (window.MFSonido && MFSonido.fx) MFSonido.fx("fx-mazo-swing");
      girarMazo(MAZO_REPOSO, 0, quieto ? 0 : MS_GOLPE, "ease-in", function () {
        /* Congelar 70 ms todo lo que se mueve dentro de la caja es lo que
           convierte un cambio de estado en un GOLPE. Cae ANTES de que el disco
           arranque: `.juice-hitstop` mata las transiciones con !important y una
           en curso saltaría a su valor final en vez de congelarse. */
        if (window.MFJuice && MFJuice.hitstop) MFJuice.hitstop(m.caja, MS_HITSTOP);
        /* el cabezazo en la base de la torre: madera con peso (fx del censo);
           el triangle de siempre queda de respaldo sin fábrica */
        if (!(window.MFSonido && MFSonido.fx && MFSonido.fx("fx-torre-base"))
            && window.MFSonido && MFSonido.nota) {
          MFSonido.nota(146.83, { tipo: "triangle", attack: 5, decay: 120, gain: 0.2 });
        }
        disco.classList.remove("campana-disco--tiembla");
        luego(quieto ? 0 : MS_HITSTOP, function () {
          if (t.correcta) subir(t, limpio);
          else subirCorto(t);
        });
      });
    }

    /* ------------------------------------------------- ACIERTO · la campanada */

    function subir(t, limpio) {
      marcar("viaje_ok");
      if (!quieto) reanimar(disco, "campana-disco--sube");
      /* El viaje se hace SOLO con `transform`: ni `top` animado ni una custom
         property transicionada (que sin @property no interpola y daría un salto
         discreto en vez de un viaje de 700 ms). Presupuesto F0 §0.10.2. */
      mover(disco, MS_VIAJE, CURVA, "translateY(-" + D + "px) scale(1.15)", function () {
        campanada(t, limpio);
      });
    }

    function campanada(t, limpio) {
      marcar("campanada");
      disco.classList.remove("campana-disco--sube");

      var peggle = !!(PEGGLE && m.examen && m.ronda === 3);
      if (peggle && !quieto) {
        /* El zoom va sobre la ESCENA. `montaje.escenario` es la capa de efectos
           (`inset:0; pointer-events:none`), así que escalarla ampliaría las
           partículas y el sello y dejaría la torre y la campana quietas. */
        escena.style.transformOrigin = Math.round(xS) + "px " + Math.round(yS) + "px";
        escena.classList.add("campana-peggle");
      }

      /* t0 = fin del viaje: la transición ya terminó, así que el hitstop no
         tiene nada que hacer saltar. */
      if (window.MFJuice && MFJuice.hitstop) MFJuice.hitstop(m.caja, MS_HITSTOP);

      luego(quieto ? 0 : MS_HITSTOP, function () {
        if (!quieto) {
          reanimar(campanaImg, "campana-talan");
          onda(0);
          onda(150);
          if (window.MFJuice && MFJuice.destello) {
            MFJuice.destello(m.escenario, xC, yC, { radio: 55, color: "rgba(255, 215, 120, 0.9)" });
          }
        } else {
          anillo();
        }
        /* El sonido no es movimiento: suena también con movimiento reducido, y
           solo si el alumno encendió el interruptor del modal. La segunda
           campanada del momento Peggle la pone el propio kit (juice.js:545). */
        if (window.MFSonido) {
          /* la campanada de bronce del censo, aguda como campana de feria
             (sol5); en el momento Peggle repica doble, como hacía la del kit,
             que sigue de respaldo si la fábrica no está */
          if (MFSonido.fx && MFSonido.fx("fx-campana-talan", 0, { f0: 783.99 })) {
            if (peggle) MFSonido.fx("fx-campana-talan", 350, { f0: 783.99 });
          } else if (MFSonido.campana) MFSonido.campana(peggle);
          if (MFSonido.vibrar) MFSonido.vibrar([20, 40, 20]);
        }
        if (peggle) fanfarria();
      });

      luego(quieto ? 0 : MS_HITSTOP + 70, function () {
        if (window.MFJuice && MFJuice.particulas) {
          MFJuice.particulas(m.escenario, {
            x: xC, y: yC, n: 12, angulo: -90, dispersion: 70,
            dist: [40, 90], dur: [450, 650],
            colores: ["#f2c230", "#f7f3ec", "#e63b2e"], forma: "chispa"
          });
        }
      });

      luego(quieto ? 0 : MS_HITSTOP + 180, function () {
        if (window.MFJuice && MFJuice.sello) MFJuice.sello(m.escenario, T.sello);
      });

      anunciar(T.gana.replace("{c}", t.corta));

      /* Se pregunta UNA vez y el mismo número manda sobre el texto y sobre el
         vuelo al HUD: dos preguntas podrían dar dos cifras y ya habría una
         pantalla mintiendo. */
      var paga = premio(limpio);

      /* Con movimiento reducido el resultado tiene que poder LEERSE: la campana
         quieta no basta como única señal (§11.6). */
      if (quieto) contar(paga ? conXP(T.resultadoXp, paga) : T.resultado);

      /* El cobro solo vuela si el bonus es de verdad: en examen no existe
         —`mission.js` lo cobra con `!isExam` (§0.8.1) y el examen entrega por
         `completeExam`— y desde la sala de retos puede valer menos, o nada. Con
         `paga` en 0 no vuela nada: prometer un XP que jamás llega era justo el
         error que esto viene a arreglar. El chip vuela con el número exacto que
         se va a pagar. */
      if (paga && !quieto) {
        luego(MS_HITSTOP + 380, function () {
          if (window.MFJuice && MFJuice.volarXP) MFJuice.volarXP(t.boton, paga);
        });
      }

      var cierre = quieto ? 350 : (peggle ? 1400 : MS_HITSTOP + 630);
      luego(cierre, function () {
        marcar("resuelto");
        /* El zoom se deshace antes de resolver aunque la caja esté a punto de
           irse: si algún día `resolver()` dejara de cerrar el modal, una escena
           al 115 % con `overflow: hidden` se comería medio talismán. */
        escena.classList.remove("campana-peggle");
        m.resolver({ limpio: limpio, intentos: mem.intentos, ms: Math.round(ahora() - t0) });
      });
    }

    /* Las ondas se colocan con `left`/`top` UNA vez y luego solo se animan con
       `transform` y `opacity`: cero layout por frame. */
    function onda(retardo) {
      var i = document.createElement("i");
      i.className = "campana-onda";
      i.setAttribute("aria-hidden", "true");
      i.style.left = Math.round(xS) + "px";
      i.style.top = Math.round(yS) + "px";
      if (retardo) i.style.animationDelay = retardo + "ms";
      escena.appendChild(i);
      luego(1200 + retardo, function () {
        if (i.parentNode) i.parentNode.removeChild(i);
      });
    }

    function anillo() {
      var i = document.createElement("i");
      i.className = "campana-anillo";
      i.setAttribute("aria-hidden", "true");
      i.style.left = Math.round(xS) + "px";
      i.style.top = Math.round(yS) + "px";
      escena.appendChild(i);
    }

    /* Fanfarria del momento Peggle (F7): seis notas ascendentes. Vive detrás de
       la misma bandera que el zoom para que F7 no tenga que buscarla. */
    function fanfarria() {
      if (!window.MFSonido || !MFSonido.nota) return;
      var f = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
      for (var i = 0; i < f.length; i++) {
        MFSonido.nota(f[i], { tipo: "triangle", attack: 8, decay: 220, gain: 0.18, retardo: i * 90 });
      }
    }

    /* --------------------------------------------------- FALLO · el disco cae */

    function subirCorto(t) {
      marcar("viaje_ko");
      mover(disco, MS_VIAJE_KO, "ease-out", "translateY(-" + Dko + "px)", function () { plop(t); });
    }

    function plop(t) {
      marcar("plop");
      /* `squash` va sobre el <img> INTERIOR: anima `transform` y sobre el span
         borraría el viaje a media torre. */
      if (window.MFJuice && MFJuice.squash) MFJuice.squash(discoImg);
      if (window.MFSonido && MFSonido.nota) {
        MFSonido.nota(196, { tipo: "sine", attack: 5, decay: 120, gain: 0.15 });
      }
      /* Pausa cómica: el disco DUDA antes de rendirse. Es timing de comedia, no
         relleno: sin ella la caída se lee como un error del navegador. */
      luego(quieto ? 0 : MS_PLOP + MS_DUDA, function () { caer(t); });
    }

    function caer(t) {
      marcar("caida");
      /* El kit hace TODO el fallo de una vez: el silbido descendente, el rebote
         del talismán y las dos estrellitas. Se llama AQUÍ, al arrancar la
         caída, y no al aterrizar, para no tocar dos veces `MFSonido.fallo()`:
         `MFJuice.fallo` ya lo suena por dentro (juice.js:344) y dispararlo
         también a mano dejaría dos silbidos separados medio segundo. Así el
         sonido acompaña al descenso, que es donde lo quiere la ficha. Sin
         screenshake y sin vibración jamás: el fallo nunca castiga. */
      if (window.MFJuice && MFJuice.fallo) MFJuice.fallo(t.boton, m.escenario);
      else if (window.MFSonido && MFSonido.fallo) MFSonido.fallo();

      /* El giro cómico va en el MISMO `transform` que la bajada: en otra
         propiedad se perdería la composición. */
      mover(disco, MS_CAIDA, "ease-in", "translateY(0px) rotate(25deg)", function () {
        /* Se limpia sin transición: el disco queda listo para la repesca. El
           reflow entre las dos líneas es obligatorio — sin él, el navegador
           puede recalcular una sola vez y ver la transición de 500 ms todavía
           puesta, con lo que el disco «desgiraría» sus 25° a cámara lenta justo
           cuando el alumno está leyendo el feedback. */
        disco.style.transition = "none";
        void disco.offsetWidth;
        disco.style.transform = "translateY(0px) rotate(0deg)";
        /* Gag del artilugio: un golpecito extra en el vacío, «como si el mazo
           tuviera la culpa». Con la palanca recortada, lo hace el mazo solo. */
        if (!quieto) {
          girarMazo(MAZO_GAG, 0, MS_GAG, "ease-out", function () {
            girarMazo(MAZO_REPOSO, 0, MS_GAG, "ease-out");
          });
        }
        feedback(t);
      });
    }

    function feedback(t) {
      marcar("fallo_feedback");
      mem.falladas[kActivo] = true;
      /* Lo que ENSEÑA es el feedback escrito de ESA opción; el panel y el evento
         `reto_fail` los pone la infraestructura. */
      m.fallar(kActivo);
      descartar(t.boton);
      /* Después del panel: `fallar` ya anuncia el feedback, y esta línea deja
         como estado final del lector la instrucción de qué hacer ahora. */
      anunciar(m.examen ? T.fallaExamen.replace("{c}", correctaCorta()) : T.falla);

      if (m.examen) { revelar(); return; }

      if (quieto) contar(T.resultadoKo);
      /* Repesca ilimitada y sin cronómetro (regla del titular). La siguiente
         carga dura 300 ms: se acorta el trámite, nunca el teatro del acierto. */
      kActivo = -1;
      marcar("listo");
    }

    /* --------------------------------------- REVELADO · examen sin repesca -- */

    function revelar() {
      marcar("revelado");
      for (var i = 0; i < talismanes.length; i++) {
        if (!talismanes[i].correcta) continue;
        /* Contorno verde + ✓ en HTML, nunca un fondo: la madera de la lámina es
           opaca y un background-color solo asomaría por los lados del tablón.
           Y nunca solo por color: el ✓ viaja con él. */
        talismanes[i].boton.classList.add("is-correct");
        talismanes[i].placa.classList.add("reto-placa--ok");
        apagar(talismanes[i].boton);
        break;
      }
      if (quieto) contar(T.resultadoKo);
      luego(quieto ? 400 : MS_LECTURA, function () {
        marcar("resuelto");
        m.resolver({ limpio: false, intentos: mem.intentos, ms: Math.round(ahora() - t0) });
      });
    }

    function correctaCorta() {
      for (var i = 0; i < talismanes.length; i++) {
        if (talismanes[i].correcta) return talismanes[i].corta;
      }
      return "";
    }

    /* ------------------------------------------------------------ utilería -- */

    /* Deshabilitar el elemento que TIENE el foco lo manda a <body>, y ahí la
       trampa de foco de retos.js ya no puede hacer nada: escucha los Tab en la
       caja del modal, y desde <body> las teclas ni le llegan. Sin este rescate,
       quien juega con teclado se va de paseo por la misión de debajo justo
       después de fallar. Solo se rescata cuando el foco era de verdad del
       elemento apagado: robarlo tras un tap con el dedo sería peor. */
    function apagar(b) {
      var teniaFoco = (document.activeElement === b);
      b.disabled = true;
      if (!teniaFoco) return;
      var libres = columna.querySelectorAll(".campana-talisman:not([disabled])");
      var destino = libres.length ? libres[0] : (m.caja && m.caja.querySelector(".reto-modal__cerrar"));
      if (destino && destino.focus) { try { destino.focus(); } catch (e) { /* nada */ } }
    }

    function descartar(b) {
      apagar(b);
      if (b.querySelector(".campana-talisman__marca")) return;
      var marca = document.createElement("span");
      marca.className = "campana-talisman__marca";
      marca.setAttribute("aria-hidden", "true");
      marca.textContent = "✗";
      b.appendChild(marca);
    }

    function contar(texto) {
      resultado.textContent = texto;
      resultado.hidden = false;
    }
  }

  /* ============================================================= REGISTRO === */

  MFRetos.registrar({
    id: "campana",
    nombre: T.nombre,
    /* El emoji es ÚNICO por juego: es la mitad del reconocimiento de la
       tarjeta-invitación, cuyo texto entero es «icono + 1 palabra + 1 verbo». */
    icono: "🔔",
    banner: T.banner,
    comoSeJuega: T.comoSeJuega,
    /* Comodín universal: le vale cualquier quiz con etiquetas cortas y
       exactamente una correcta. Sin `corta` en el contenido, el sorteo lo salta
       y la tarjeta cae al quiz clásico sin romper nada. */
    necesita: ["corta", "correct1", "sinorden"],
    acepta: function (tarjeta) {
      var n = ((tarjeta && tarjeta.options) || []).length;
      /* La ficha lo declaraba sin vetos, pero la columna de talismanes vive
         DENTRO de la escena y tiene un alto real: con seis opciones (6x44 + 5
         de hueco) se sale de los 340 px y los botones se recortarían. Dos es el
         mínimo de una decisión; cinco, lo último que cabe. Fuera de ese rango
         prefiere no salir y la tarjeta cae al quiz clásico entera. */
      return n >= 2 && n <= 5;
    },
    jugar: jugar
  });
})();

/* MenteFu / MindFu — LA PUERTA DEL CANDADO (rediseño 2026-09-01 sobre F5).
   REDISEÑO DEL TITULAR: la MECÁNICA es la de siempre (descarta 2, queda la
   válida) pero el vestuario cambió entero — ya no hay andamio con puntales,
   hay una PUERTA con candado y TRES LLAVES rotuladas. El alumno DESCARTA las
   dos llaves falsas; cuando solo queda la buena, esa viaja sola al candado,
   lo abre, la puerta se abre y cae el sello. El id del juego, sus rutas y sus
   clases CSS siguen diciendo `andamio`: los ids no se renombran (regla del
   proyecto), y las clases se conservan para que el censo de etiquetas y el
   traje comunes no necesiten enterarse del cambio de ropa.
   Historia original de F5 (vigente para la LÓGICA, no para el dibujo):
   la creencia aparecía construida sobre TRES puntales rotulados
   —las tres opciones de la tarjeta— y el alumno RETIRA los que no la sostienen.
   Se gana cuando solo queda en pie el puntal verdadero, iluminado y con su
   frase entera debajo. Cada retirada abre el feedback de ESA opción, así que
   los veredictos se leen siempre: esa es la virtud pedagógica de la ficha, no
   un adorno.

   DOS RETIRADAS, Y UN TOQUE ES UNA RETIRADA (las tres reglas del titular del
   2026-08-27, que mandan sobre la ficha). Este juego montaba CINCO puntales
   —las 3 opciones más 2 señuelos prestados del nivel— y pedía CUATRO retiradas
   de dos toques cada una: ocho acciones donde el tope son tres. Un minireto
   existe para CAMBIAR LA DINÁMICA de leer tarjetas; un juego de ocho toques
   deja de ser un respiro y pasa a ser trabajo. Hoy:

     · TRES puntales y DOS retiradas (regla 1: ningún minireto pide más de tres
       acciones). Los señuelos del pool desaparecieron con el tablero de cinco:
       con tres puntales no caben, y las tres opciones propias ya son el
       tablero. Por eso `necesita` ya no pide `pool` y en este archivo no queda
       ni una línea de selección de señuelos.
     · TOCAR UN PUNTAL LO RETIRA, en el acto (regla 2: la acción es directa y
       deja lista la siguiente). No hay botón «Retirar» que remate el gesto ni
       estado intermedio «seleccionado»; al terminar la retirada el juego queda
       solo, sin botón de por medio, en disposición para la siguiente. El
       arrastre hacia abajo sobrevive como ATAJO —es el gesto bonito—, pero el
       camino principal es un toque = una retirada.
     · El precio, aceptado por el titular: con dos falsos el azar del primer
       juicio es 1/3, el mismo del quiz clásico. Se pierde el 1/5 que daba el
       tablero de cinco, y se paga a cambio del ritmo.

   Es un juego ESPECIALISTA, no comodín: solo entra en tarjetas marcadas
   `@familia: justificacion` («¿por qué esto es así?», «¿qué hace falta para que
   exista X?»). Es la regla 3 —la metáfora no puede mentir—: retirar puntales
   solo tiene sentido si la pregunta va de qué SOSTIENE una creencia. En una
   tarjeta de taxonomía las opciones no sostienen nada, y por eso `necesita`
   exige la familia y `acepta` rechaza lo que no encaja.

   Este archivo SOLO pinta y juzga. El XP, los cierres, el historial del
   navegador, el panel de feedback y toda la telemetría los pone la
   infraestructura (retos.js) a través del `montaje`: aquí no hay ni un
   MF.track, ni una suma de XP, ni un listener de Escape.

   NUEVE decisiones de este archivo que conviene no deshacer sin leer el porqué:

   · EL PUNTAL SON DOS NODOS. El envoltorio `.reto-andamio-puntal` es el <button>
     que agarra MFDrag, que le escribe `transform` EN LÍNEA en cada pointermove
     (mfdrag.js:108-116); el <img> interior recibe los efectos del kit
     (`juice-anticipa`, `juice-fallo`, `juice-squash`), que se montan sobre
     `transform` y sobre `animation` — y una animación gana SIEMPRE al estilo en
     línea. Con un solo nodo, el temblor de la anticipación teletransportaría el
     puntal a su hueco a mitad del arrastre. Es la misma separación que ya
     obligan `.tw-mano` / `.tw-mano__fig` (F1), `__vuelo` / `__ceramica` (F2) y
     la carta de F3.

   · LA CAÍDA DE LA RETIRADA VIVE EN UNA CLASE, JAMÁS EN `style.transition`.
     MFDrag borra el estilo en línea justo DESPUÉS de que `alSoltar` retorne
     (`soltarPieza`, mfdrag.js:117-121), así que una transición escrita a mano se
     perdería y el puntal desaparecería de golpe por el camino del arrastre. Y
     la clase mueve con la propiedad independiente `translate`, que compone con
     el `transform` de MFDrag en vez de pelearse con él. Un solo camino de código
     para el toque y para el arrastre: por eso la caída se ve igual en los dos.

   · SIN LÍMITES DE ARRASTRE, y no por gusto. Con `limites: true` MFDrag recorta
     el desplazamiento al rectángulo de la zona, y con un puntal de 190 px dentro
     de una zona de 200 el recorrido visible sería de ~10 px contra un umbral de
     tirón de 60: el puntal se despegaría del dedo y el atajo quedaría muerto. Lo
     que impide que la pieza se pasee por el modal es el `overflow: hidden` de la
     zona, que además es lo que recorta la caída.

   · EL PORTANTE DEVUELVE «vuelve», NUNCA «libre». La API pública de MFDrag es
     solo {destruir, elegir, elegida} (mfdrag.js:516-520): no hay forma de
     reposicionar una pieza a mano, así que el veredicto «vuelve» es el ÚNICO
     camino para el «el puntal vuelve solo a su hueco en 200 ms» de la ficha.

   · EL TOQUE LO LLEVA EL JUEGO Y MFDrag VA CON `toques: false`. El modo por
     toques de MFDrag ALTERNA una selección en el pointerup (`alternar`,
     mfdrag.js:371-375): es el patrón «toca la pieza, toca el destino» de WCAG
     2.5.7, y aquí sobra —el destino no existe: el toque en el puntal YA es la
     retirada—. Encendido, cada toque dejaría el puntal «elegido» y la regla 2
     se rompería sola. Apagado, el tap muere en `soltarPieza` y quien juzga es
     un `click` propio en el <button> del puntal: el mismo listener sirve para
     el dedo, para el ratón y para el Enter del teclado (un <button> activa con
     Enter y con Espacio de nacimiento), y sirve además cuando MFDrag ni
     siquiera está cargado — un solo camino, sin rama de reserva que se separe
     del bueno. Que el `click` llega aunque MFDrag haga `preventDefault()` en el
     pointerdown (mfdrag.js:305) lo demuestra el propio repo: si no llegara, el
     clic fantasma que `alClicCaptura` se traga tras cada arrastre no existiría.
     Y ese mismo `alClicCaptura` es lo que impide que el arrastre juzgue dos
     veces: se traga en captura el clic que sigue al gesto.

   · LA GEOMETRÍA SE MIDE, NUNCA SE SUPONE. Los slots se reparten desde el ancho
     REAL de la zona y el ancho REAL del puntal, y las proporciones de las
     láminas (`--an-puntal-ratio`, `--an-viga-ratio`) son las medidas sobre los
     archivos entregados: puntal 175×512 = 0.342 y tabla 1000×401 = 2.494. Es la
     lección que F1 pagó con una tabla pedida a 5:1 que volvió a 2.494. Todo se
     lee con `clientWidth`/`offsetWidth` y no con `getBoundingClientRect`: la
     caja del modal entra con `modal-rise`, que es una animación de TRANSFORM, y
     un rect leído mientras corre viene ESCALADO (medido en F2,
     kintsugi.js:660-665).

   · LA VIGA ES LA TABLA DE F1 REUTILIZADA. No hay lámina propia de viga y no se
     va a encargar: la plataforma se pinta con `border-image` de 9 zonas sobre
     `tameshiwari-tabla.webp`, que ya está en disco y cuyo prompt pedía
     literalmente un centro liso y vacío «so a label can sit on top». Coste 0 USD
     y misma madera para lo que se ROMPE (F1) y lo que SOSTIENE (F5), que es lo
     que el titular pidió: estilo uniforme entre los ocho juegos.

   · EL ENCENDIDO DEL PORTANTE SE CRUZA, NO SE CAMBIA EN SECO. Las dos láminas
     del par de estado casan en proporción, paleta y grosor de línea, pero la
     encendida trae UNA banda de cuerda donde la apagada trae DOS. No se regenera
     por eso (son 0.042 USD de API por un detalle que nadie mira quieto): las dos
     se CRUZAN con un fundido corto de 200 ms, y sobre un fundido la diferencia
     de bandas no se puede comparar. Si en QA alguien cuenta las bandas y cree
     que hay un error de montaje, es esto y es deliberado. El intercambio real lo
     sigue haciendo `montaje.sprite()` al final del fundido, así que la regla del
     titular (apagada → encendida = otra LÁMINA, no un filtro) se cumple entera.

   · CON `prefers-reduced-motion` LA MÁQUINA ES LA MISMA con los tiempos
     comprimidos a 0 —un segundo camino se habría separado del bueno en la
     primera corrección— y el resultado se cuenta además con TEXTO bajo la escena
     y en `.reto-vivo` (§11.6): nunca solo con animación. Lo único que NO se
     comprime son las lecturas mínimas del feedback: eso no mide animación, mide
     LECTURA, y existe igual para quien pide menos movimiento.

   NI UNA ETIQUETA SVG NI UNA FORMA CSS COMO OBJETO (regla del titular, F0
   §0.12): los tres puntales nacen con su lámina desde el primer fotograma. La
   reserva por lámina ausente es CSS y vive en game.css
   (`.reto-andamio--sin-lamina`); aquí solo se enciende el interruptor desde el
   `onerror`. */
(function () {
  "use strict";

  /* Sin infraestructura no hay reto: mission.js cae solo a su quiz clásico. */
  if (!window.MFRetos || !MFRetos.registrar) return;

  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var A = cfg.assets || "";
  var XP = cfg.xp || {};
  var BONUS = XP.quiz_first_try || 5;

  /* La `pista` sustituye al botón «Retirar» que se fue: era él quien decía con
     palabras qué hacía el juego, y el test de 3 segundos no puede depender de
     que el alumno adivine que el puntal se toca. Va bajo la escena, es TEXTO y
     no ocupa una diana. */
  var T = ES ? {
    nombre: "La puerta del candado",
    banner: "DESCARTA",
    /* La línea de «qué hay que hacer», declarada por el JUEGO y no por quien la
       pinta: la enseñan dos interfaces —la ficha de la sala de retos y la
       tarjeta-invitación de la misión— y con una tabla en cada una, el día que
       se retoque la frase se retocará en una sola. Aquí hay una sola verdad.
       No es la `pista` de abajo: aquella se lee DENTRO de la partida, con el
       tablero delante; esta se lee ANTES de entrar, sin haber visto nada. */
    comoSeJuega: "Descarta las dos llaves falsas para abrir la puerta.",
    pista: "Toca la llave falsa: se descarta.",
    sello: "\u00a1ABIERTA!",
    transfer: "La llave que quedó era la única que abría esa puerta.",
    abre: "{n} llaves para un candado. Toca las falsas: se descartan al tocarlas.",
    fuera: "Fuera. Esa llave era falsa. {f}",
    cede: "El candado se resiste: esa era la llave buena, no se descarta. {f}",
    gana: "Abre. La llave buena: {c}. ",
    resultado: "La puerta se abre.",
    resultadoXp: "La puerta se abre. +" + BONUS + " XP"
  } : {
    nombre: "The Padlocked Door",
    banner: "DISCARD",
    comoSeJuega: "Discard the two false keys to open the door.",
    pista: "Tap a false key: it gets discarded.",
    sello: "OPEN!",
    transfer: "The key that remained was the only one that opened that door.",
    abre: "{n} keys for one padlock. Tap the false ones: a tap discards them.",
    fuera: "Out. That key was false. {f}",
    cede: "The padlock resists: that was the right key, it stays. {f}",
    gana: "It opens. The right key: {c}. ",
    resultado: "The door opens.",
    resultadoXp: "The door opens. +" + BONUS + " XP"
  };

  /* ===================================================== EL ARTE DE LA FASE ===

     Las DOS láminas de §7, SIEMPRE en `.webp`: al publicar, el `.png` se descarta
     cuando existe su `.webp`. El prefijo `MF_CONFIG.assets` no es decorativo: las
     misiones cuelgan de cuatro niveles de carpeta y un `src` relativo escrito
     desde JS se resuelve contra la PÁGINA, así que sin él son 404 en todas ellas
     (retos.js:478-482, arbol.js:12).

     La viga NO tiene lámina propia ni se va a encargar: se resuelve reutilizando
     `tameshiwari-tabla.webp` (F1, ya pagada) con `border-image` de 9 zonas desde
     game.css, donde la ruta se resuelve contra la HOJA y sale bien sea cual sea
     la profundidad de la página. Por eso no aparece en este archivo. */
  var RETOS = A + "assets/img/game/retos/";
  /* Desde el rediseño, la "pieza" es la LLAVE; el nombre de la variable se
     conserva para no reescribir medio archivo. Las láminas del escenario
     (puerta y candado, con sus estados) son nuevas y propias de este juego. */
  var RUTA_PUNTAL = RETOS + "puerta-llave.webp";
  var RUTA_SOSTIENE = RETOS + "puerta-llave.webp";
  var RUTA_PUERTA = RETOS + "puerta-cerrada.webp";
  var RUTA_PUERTA_AB = RETOS + "puerta-abierta.webp";
  var RUTA_CANDADO = RETOS + "puerta-candado.webp";
  var RUTA_CANDADO_AB = RETOS + "puerta-candado-abierto.webp";

  /* Proporciones REALES (ancho/alto) de las láminas entregadas, medidas sobre
     los archivos en disco y no las que pedía el prompt:
       puntal 175×512 = 0.342 · puntal-sostiene 177×512 = 0.346 · tabla F1
       1000×401 = 2.494.
     Se publican al CSS para que TODA la geometría se derive de ellas y jamás al
     revés (patrón `--tw-ratio` de F1 y `--reto-ratio` de F3). El número escrito
     aquí es la medida de HOY: se recorrige con `naturalWidth/naturalHeight`
     cuando la lámina carga.

     La pareja de estado se comparó una contra otra antes de darla por buena:
     mismo alto (512), 2 px de diferencia de ancho (1,1 %), misma paleta y mismo
     grosor de línea. Con `object-fit: contain` y `object-position: 50% 100%` esa
     diferencia deja al portante encendido 1,4 px más bajo dentro de la MISMA
     ranura, con el pie clavado en el tatami: invisible, y menos aún bajo el
     fundido del encendido. Por eso el ratio se recorrige SOLO con la lámina
     apagada (`corregirRatio` se llama una vez): tomarlo de la encendida
     cambiaría la caja justo en el frame de la victoria. */
  /* llave 384x218 medida en disco; se recorrige con naturalWidth al cargar */
  var PUNTAL_RATIO = 1.7615;
  var VIGA_RATIO = 2.494;   /* ya sin uso visual; se conserva por la variable publicada */

  /* ============================================== TIEMPOS (ficha §3 y §5) ==== */

  var MS_ENTRADA = 220;        /* lo que tarda la caja del modal en subir (F0) */
  var MS_ANTICIPA = 300;       /* temblor entre la decisión y el veredicto */
  var MS_SALE = 250;           /* caída del puntal retirado (la duración vive en la clase) */
  var MS_BANDEJA = 150;        /* la miniatura aparece cuando el puntal ya salió */
  var MS_LEE = 1200;           /* lectura mínima del feedback de una opción */
  var MS_LEE_EXAMEN = 800;     /* en examen se consolida, no se re-teatraliza (§10.4) */
  var MS_LEE_FALLO = 1500;     /* lectura del feedback del portante */
  var MS_FUNDIDO = 200;        /* (histórico) cruce de láminas; hoy solo referencia */
  var MS_VIAJE = 450;          /* la llave buena vuela sola hasta el candado */
  var MS_ABRE = 220;           /* del candado abierto a la puerta abierta */
  var MS_EXAMEN_FIN = 1400;    /* lectura del veredicto de examen antes de cerrar la ronda */
  var MS_FIN = 1600;           /* cascada de victoria + 600 ms de lectura del sello */
  var MS_RESIZE = 150;         /* antirrebote del resize: llega en ráfaga */

  var GRADOS_FALLO = 3;        /* lo que cede la plataforma por cada tirón del portante */
  var TOPE_LADEO = 9;          /* y su tope: coste acumulativo, nunca castigo */
  var DY_TIRON = 60;           /* px hacia abajo que valen como «tirón» */
  var DX_TIRON = 40;           /* desvío lateral máximo para que el tirón cuente */
  var MIN_OPCIONES = 3;        /* las `@vf` de 2 opciones las visten otros juegos */
  /* Regla 1 del titular escrita como número: un tablero de N puntales pide N−1
     retiradas, así que más de cuatro opciones ya se pasaría del tope. Hoy el
     corpus censado es de tres opciones y esto es blindaje, no un caso vivo. */
  var TOPE_ACCIONES = 3;

  /* La escalera del acierto: C5 en la primera retirada y el arpegio entero en
     la que gana. Con tres puntales solo suenan esas dos; la segunda nota queda
     para la tarjeta de cuatro opciones que `acepta` todavía admite. Lección
     Baer heredada del kata: todo orden parcial suena bien. */
  var NOTAS = [523.25, 659.25];

  /* ============================================================== UTILERÍA === */

  function ahora() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  function textoPlano(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html == null ? "" : html);
    return (d.textContent || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
  }

  function limpiar(s) { return String(s == null ? "" : s).replace(/^\s+|\s+$/g, ""); }

  function reducido() {
    return !!(window.MFJuice && MFJuice.reducido && MFJuice.reducido());
  }

  /* Copia local del hash de F0 §0.7.3 (retos.js:159-163, que no lo exporta).
     Cinco líneas sin dependencias; lo que NO puede pasar es que las dos
     difieran, así que se copia literal en vez de reescribirse. */
  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function barajar(arr, rng) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.max(0, Math.min(i, Math.floor(rng() * (i + 1))));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* ==================================================== LÁMINA Y RESERVA ==== */

  /* La vuelta atrás, como FÁBRICA y no como closure escrito en el sitio: estos
     manejadores se cuelgan de imágenes creadas dentro de bucles con `var`, y una
     función definida ahí dentro capturaría la VARIABLE del bucle, no su valor
     (lección de F1, tameshiwari.js:139-152). */
  function reservaDe(raiz) {
    return function () { raiz.classList.add("reto-andamio--sin-lamina"); };
  }

  /* Cuelga de `nodo` la lámina definitiva. El <img> nace ya con su `src` —regla
     del titular, F0 §0.12: la pieza es ilustración desde el primer fotograma— y
     lleva encima su propia red: si el archivo no llega, `fallo()` enciende la
     ruta de reserva, que es CSS y vive en game.css.
     Los manejadores van ANTES del `src` porque una imagen ya en caché puede
     resolver dentro de la propia asignación: apuntarlos después sería apuntarlos
     tarde, y ese es justo el caso de la segunda partida de la página
     (tameshiwari.js:157-184). */
  function ilustrar(nodo, ruta, clases, fallo, alMedir) {
    var img = document.createElement("img");
    img.className = clases;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.draggable = false;
    img.onerror = fallo;
    /* Un 404 servido como página HTML puede «cargar» con 0×0 y sin disparar
       `onerror`: sin píxeles no hay lámina, y darla por buena dejaría un hueco
       donde va la pieza. */
    img.onload = function () {
      if (!img.naturalWidth || !img.naturalHeight) { fallo(); return; }
      if (alMedir) alMedir(img.naturalWidth / img.naturalHeight);
    };
    nodo.appendChild(img);
    img.src = ruta;
    return img;
  }

  /* ============================ ÍNDICE REAL DE LA TARJETA (F3 pagó esta) =====

     La semilla del examen tiene que nombrar la tarjeta de una manera que no
     dependa del barajado: en examen `seleccionarExamen()` reordena las tarjetas
     (retos.js:384-391), así que `montaje.iTarjeta` es la posición en el mazo YA
     barajado. Se busca la tarjeta en `content.cards`, que sigue siendo el array
     original (mission.js guarda `cardsOriginales` y solo reasigna su copia
     local), y ese índice es el nombre estable. */
  function indiceOriginal(m) {
    var cards = (m.content && m.content.cards) || null;
    if (cards && cards.indexOf) {
      var i = cards.indexOf(m.tarjeta);
      if (i >= 0) return i;
    }
    return (typeof m.iTarjeta === "number" && m.iTarjeta >= 0) ? m.iTarjeta : -1;
  }

  /* ================================ MEMORIA POR TARJETA (§12, reanudación) ===

     Cerrar el modal a mitad y reabrir REANUDA la misma partida: las mismas
     posiciones, los mismos puntales tumbados en la bandeja y los mismos
     tirones del portante ya gastados (el «limpio» perdido no se recupera). La
     infraestructura persiste el CONTEO (estado.fallos, retos.js:423-429) pero no
     sabe QUÉ tablero era: eso vive aquí.

     La ficha proponía un objeto plano `PARTIDAS[content.id + "#" + iTarjeta]`;
     va en el WeakMap de la casa (F1, F2, F3, F4) porque la clave tiene que
     incluir `m.intento`: el botón de reintento del examen estrena estado sin
     borrar el anterior, y una clave sin el intento haría que el segundo intento
     resucitara el tablero del primero. Con navegadores sin WeakMap se cae a un
     objeto plano, que a escala de una página es igual de bueno. */
  var MEM = (typeof WeakMap === "function") ? new WeakMap() : null;
  var MEM_PLANO = {};

  function memoria(m) {
    var caja, clv;
    if (MEM) {
      caja = MEM.get(m.tarjeta);
      if (!caja) { caja = {}; MEM.set(m.tarjeta, caja); }
    } else {
      clv = String(m.content && m.content.id) + "#" + m.iTarjeta;
      caja = MEM_PLANO[clv] || (MEM_PLANO[clv] = {});
    }
    var k = "i" + (m.intento | 0);
    /* `retirados` es el mapa (búsqueda en O(1) al montar cada puntal) y `salidos`
       el mismo dato EN ORDEN: el hueco de la bandeja es el índice de retirada, y
       un objeto plano no conserva ese orden al reabrir. */
    if (!caja[k]) caja[k] = { tablero: null, retirados: {}, salidos: [], fallos: 0, primera: true, jugada: false };
    return caja[k];
  }

  /* Ladeo acumulado por MISIÓN (§12): grados que la plataforma arrastra de una
     tarjeta a la siguiente dentro de la misma carga de página. Es estado 100 %
     cosmético —no viaja a MFStore ni a Supabase y no sobrevive a recargar— y esa
     es justo la idea: el coste de tirar del portante se ve, pero no castiga.
     En examen no se escribe nunca: cada ronda parte con la plataforma recta
     (§10.3). */
  var LADEO = {};

  /* ================================================================ EL JUEGO = */

  function jugar(m) {
    var ops = (m.tarjeta && m.tarjeta.options) || [];
    var iPortante = -1, i;
    for (i = 0; i < ops.length; i++) { if (ops[i] && ops[i].correct) { iPortante = i; break; } }
    /* No debería llegar (lo filtran `necesita` y `acepta`), pero si llegara,
       resolver es mejor que dejar al alumno encerrado con la tarjeta bloqueada.
       Nunca se dibuja media escena. */
    if (ops.length < MIN_OPCIONES || iPortante < 0) {
      m.resolver({ limpio: false, intentos: 1, ms: 0 });
      return;
    }

    var mem = memoria(m);
    var quieto = reducido();
    var t0 = ahora();
    var timers = [];
    var rafs = [];
    var control = null;
    var ocupado = true;            /* PRESENTANDO: los taps se ignoran, no se encolan */
    var idResize = 0;
    var iOrig = indiceOriginal(m);

    /* La semilla del examen mezcla `montaje.intento` igual que la mano de F3
       (pasa.js:429-432): sin ese XOR, reintentar el examen —que hace
       `sorteoCtx.intento++`— devolvería el mismo tablero, con el portante en la
       misma posición, o sea memorización pura. Dentro de un intento el número no
       cambia, así que recargar a mitad sigue reproduciendo el tablero (§10.2).
       En misión el azar es del sistema: cada partida rebaraja. */
    var rng = m.examen
      ? mulberry32((hash(String(m.content && m.content.id) + "#andamio#" + iOrig) ^ (m.intento | 0)) >>> 0)
      : Math.random;

    /* Guarda anti-carrera: el alumno puede haber cerrado el modal a mitad de
       cualquier animación. Toda devolución de llamada pregunta antes de tocar el
       DOM (retos.js:714-716). */
    function vivo() {
      if (m.vivo && !m.vivo()) return false;
      return raiz.isConnected !== false;
    }

    function anunciar(s) { if (m.anunciar) m.anunciar(s); }

    /* Cuánto paga DE VERDAD una victoria limpia de ESTA partida: los `BONUS` XP
       jugando la misión, el 10 % de esa misión si quien abrió el reto fue la sala
       de retos, y CERO si allí esa pregunta ya se cobró o si esto es un examen.
       El juego no puede deducirlo —lo hacía con `!m.examen` y por eso cantaba
       «+5 XP» donde se pagaban 3—: se lo pregunta al montaje. Y `conXP` mete ese
       número en la cadena de T, que sigue escrita con su «+5» y no se reescribe.
       Las guardas son las de `anunciar`: por si alguna vez se juega contra un
       retos.js más antiguo, donde la misión pagaba su bonus y el examen no
       pagaba nada. */
    function premio(limpio) {
      if (!limpio) return 0;
      return m.premia ? m.premia() : (m.examen ? 0 : BONUS);
    }
    function conXP(t, n) { return m.conXP ? m.conXP(t, n) : t; }

    function luego(ms, fn) {
      var id = setTimeout(function () { if (vivo()) fn(); }, ms);
      timers.push(id);
      return id;
    }

    /* Un solo marco de animación, para que el estado se pinte DESPUÉS de que el
       navegador haya visto el estado anterior (sin eso, una transición añadida en
       el mismo tic arranca ya en su destino).
       Con RED DE TIEMPO, y no por gusto: en una pestaña OCULTA el navegador no
       entrega ni un `requestAnimationFrame` —medido en el banco de pruebas, con
       el modal abierto y la pestaña en segundo plano—, y lo que va aquí dentro no
       es solo teatro: lleva el ESTADO FINAL (el puntal retirado desaparecido, el
       veredicto visible). Sin la red, volver a la pestaña encontraría un puntal
       ya juzgado todavía en pie. El testigo `hecho` garantiza que solo corra uno
       de los dos caminos. */
    function marco(fn) {
      var hecho = false;
      function unaVez() {
        if (hecho || !vivo()) return;
        hecho = true;
        fn();
      }
      if (window.requestAnimationFrame) rafs.push(window.requestAnimationFrame(unaVez));
      luego(80, unaVez);
    }

    /* Los timeouts, los rAF, el arrastre y el resize mueren con el modal: sin
       esto, cerrar a mitad de la cascada dispararía un resolver() sobre una caja
       que ya no existe, o dejaría a MFDrag escuchando en <body> para siempre. Y
       `ocupado` se queda en true, que es lo que impide que un veredicto tardío
       conceda un «limpio» que el alumno no se ganó (§12 caso 5). */
    if (m.alCerrar) {
      m.alCerrar(function () {
        var k;
        for (k = 0; k < timers.length; k++) clearTimeout(timers[k]);
        timers.length = 0;
        if (window.cancelAnimationFrame) {
          for (k = 0; k < rafs.length; k++) window.cancelAnimationFrame(rafs[k]);
        }
        rafs.length = 0;
        if (idResize) { clearTimeout(idResize); idResize = 0; }
        window.removeEventListener("resize", alRedimensionar);
        if (control) { control.destruir(); control = null; }
        ocupado = true;
      });
    }

    /* --------------------------------------------------------- el tablero --- */

    /* Se construye una sola vez por partida y se guarda: reabrir el modal no
       puede mover el portante de sitio. */
    if (!mem.tablero) {
      mem.tablero = construirTablero();
      mem.primera = !mem.jugada;
    }
    var piezas = mem.tablero;

    /* Un puntal por opción y NADA MÁS: el tablero ES la pregunta. Los dos
       señuelos que se prestaban del pool se fueron con la regla de las tres
       acciones (cabecera), y con ellos toda su maquinaria de selección. */
    function construirTablero() {
      var lista = [], k;
      for (k = 0; k < ops.length; k++) {
        lista.push({
          idx: k, clave: "o" + k,
          corta: cortaDe(ops[k]),
          html: (ops[k] && ops[k].html) || "",
          portante: k === iPortante
        });
      }
      /* El portante cae en una posición cualquiera de las tres: si saliera
         siempre en el mismo sitio, el juego se resolvería con la memoria y no
         con el razonamiento. */
      return barajar(lista, rng);
    }

    function cortaDe(o) {
      var c = limpiar(o && o.corta);
      /* Red por si el censo va a medias: `necesita: ["corta"]` ya lo filtra, pero
         una etiqueta vacía dejaría un puntal mudo. */
      return c || textoPlano(o && o.html).slice(0, 24);
    }

    /* ---------------------------------------------------------- la pantalla - */

    var raiz = document.createElement("div");
    raiz.className = "reto-andamio";
    raiz.setAttribute("data-estado", "cargando");
    /* Las proporciones REALES viajan al CSS desde aquí, en línea: si un día una
       lámina volviera con otra proporción, se corrige UN número y toda la
       geometría (alto del puntal, bandas del 9-slice de la viga) le sigue. */
    raiz.style.setProperty("--an-puntal-ratio", String(PUNTAL_RATIO));
    raiz.style.setProperty("--an-viga-ratio", String(VIGA_RATIO));

    var sinLamina = reservaDe(raiz);

    /* 1 · PLATAFORMA: la placa con la creencia sobre la viga. Rotan JUNTAS con
       `--an-ladeo`, y ninguna posición de puntal se recalcula porque los
       puntales viven en otra caja. */
    var plataforma = document.createElement("div");
    plataforma.className = "reto-andamio-plataforma";

    /* DIV y no P: `tarjeta.html` viene de Markdown y casi siempre trae ya su
       propio <p>; anidarlo dentro de otro <p> es HTML inválido y el navegador lo
       rompería en dos párrafos con márgenes de más. El enunciado vive DENTRO del
       modal (F0 §0.1.2). */
    var creencia = document.createElement("div");
    creencia.className = "reto-andamio-creencia";
    creencia.innerHTML = (m.tarjeta && m.tarjeta.html) || "";
    plataforma.appendChild(creencia);

    /* LA PUERTA Y SU CANDADO (rediseño 2026-09-01). El candado ancla contra la
       PUERTA, no contra la plataforma: el enunciado mide lo que mida y el
       candado tiene que caer siempre sobre el herraje. `viga` pasa a ser el
       <img> de la puerta y conserva su nombre: `cosecha()` lee su rect para el
       origen de las partículas y así no hay que tocarla. */
    var puertaZona = document.createElement("span");
    puertaZona.className = "reto-andamio-puertazona";
    puertaZona.setAttribute("aria-hidden", "true");
    var viga = document.createElement("img");
    viga.className = "reto-andamio-puerta";
    viga.alt = "";
    viga.draggable = false;
    viga.src = RUTA_PUERTA;
    puertaZona.appendChild(viga);
    var candadoFig = document.createElement("img");
    candadoFig.className = "reto-andamio-candado";
    candadoFig.alt = "";
    candadoFig.draggable = false;
    candadoFig.src = RUTA_CANDADO;
    puertaZona.appendChild(candadoFig);
    plataforma.appendChild(puertaZona);
    raiz.appendChild(plataforma);

    /* 2 · ZONA: la caja de MFDrag y el tatami. El recorte de la caída lo pone su
       `overflow: hidden` (game.css), no los topes de MFDrag. */
    var zona = document.createElement("div");
    zona.className = "reto-andamio-zona";
    raiz.appendChild(zona);

    var k2;
    for (k2 = 0; k2 < piezas.length; k2++) montarPuntal(piezas[k2], k2);

    function montarPuntal(d, slot) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "reto-andamio-puntal";
      b.setAttribute("data-slot", String(slot));
      /* La placa ya dice el texto, pero el aria-label explícito cubre el caso de
         que se recorte a dos líneas y el de la lámina sin cargar. */
      b.setAttribute("aria-label", d.corta);
      /* Las rutas de los dos estados viajan en el dataset: es lo que lee
         `montaje.sprite()` para intercambiar la lámina (retos.js:514-521). Van
         en LOS TRES puntales, no solo en el portante: un atributo que solo
         llevara la respuesta correcta la delataría a quien abra el inspector. */
      b.setAttribute("data-lamina-pie", RUTA_PUNTAL);
      b.setAttribute("data-lamina-sostiene", RUTA_SOSTIENE);
      b.setAttribute("data-estado", "pie");

      /* `.reto-pieza` es obligatoria: es lo que busca `montaje.sprite()` para
         intercambiar la lámina y lo que impide que el dibujo se coma el
         pointerdown. `__fig` es donde el traje de la fase pone el tamaño y el
         `object-position: 50% 100%` que mantiene el pie apoyado en el tatami
         venga la lámina con la proporción que venga. */
      d.fig = ilustrar(b, RUTA_PUNTAL, "reto-pieza reto-andamio-puntal__fig", sinLamina, corregirRatio);

      var placa = document.createElement("span");
      /* El mismo umbral de «larga» que F1 y F2, para que tres juegos no midan lo
         mismo de tres maneras. */
      placa.className = "reto-andamio-puntal__placa" + (d.corta.length > 18 ? " reto-andamio-puntal__placa--larga" : "");
      placa.textContent = d.corta;
      b.appendChild(placa);

      /* La respuesta táctil va en el POINTERDOWN, no en el click: es lo que
         separa «responde» de «va lento» (<100 ms). Va en el <img> y no en el
         envoltorio porque `.juice-presionado` es una clase con `transform` y el
         envoltorio acumula el estilo en línea de MFDrag, que le ganaría en
         cuanto el puntal se hubiera arrastrado una vez. */
      b.addEventListener("pointerdown", function () {
        if (ocupado || b.disabled) return;
        if (window.MFJuice && MFJuice.respuesta) MFJuice.respuesta(d.fig);
      });

      /* AQUÍ ESTÁ LA REGLA 2: el toque en el puntal ES la retirada. No hay un
         botón que la remate ni un estado «elegido» por medio.
         Es un `click` y no un `pointerup` por tres razones que se cumplen a la
         vez: un <button> lo emite también con Enter y con Espacio, así que el
         teclado entra por el mismo carril sin una segunda máquina; MFDrag se
         traga en captura el clic fantasma que sigue a un arrastre
         (`alClicCaptura`, mfdrag.js:408-415), así que arrastrar no puede juzgar
         dos veces; y sigue vivo aunque MFDrag no esté cargado, que es lo que
         hace innecesario un camino de reserva aparte. */
      b.addEventListener("click", function () {
        if (ocupado || b.disabled) return;
        tirar(b);
      });

      d.nodo = b;
      d.placa = placa;
      zona.appendChild(b);

      /* Reapertura tras abandono: los puntales que ya se retiraron siguen fuera,
         y su miniatura vuelve a la bandeja. La clase se pone ANTES de que el
         nodo entre en el documento, así que no hay transición que ver: es un
         estado heredado, no una retirada nueva. El estado se relee SIEMPRE de
         `mem.retirados` y no del descriptor: los descriptores sobreviven al
         cierre del modal (son los mismos objetos de `mem.tablero`) y arrastrarían
         el `fuera` de una partida ya borrada. */
      d.fuera = !!mem.retirados[d.clave];
      if (d.fuera) {
        b.classList.add("reto-andamio-puntal--saliendo");
        b.setAttribute("data-fuera", "");
        b.setAttribute("aria-disabled", "true");
        b.disabled = true;
      }
    }

    /* Solo se recorrige con la lámina APAGADA (la única que se pinta al montar):
       tomar la proporción de la encendida cambiaría la caja del puntal justo en
       el frame de la victoria. */
    var ratioFijado = false;
    function corregirRatio(r) {
      if (ratioFijado || !(r > 0)) return;
      ratioFijado = true;
      raiz.style.setProperty("--an-puntal-ratio", r.toFixed(4));
      colocar();
    }

    /* 3 · BANDEJA: los puntales ya retirados, tumbados y atenuados. No es un
       objeto, es el hueco donde se apilan las miniaturas (que sí son láminas). */
    var bandeja = document.createElement("div");
    bandeja.className = "reto-andamio-bandeja";
    bandeja.setAttribute("aria-hidden", "true");
    raiz.appendChild(bandeja);

    /* Reanudación: los puntales que ya cayeron vuelven a la bandeja en el MISMO
       orden en que se retiraron. */
    for (var k3 = 0; k3 < mem.salidos.length; k3++) {
      var yaFuera = porClave(mem.salidos[k3]);
      if (yaFuera) tumbarEnBandeja(yaFuera);
    }

    /* 4 · PISTA: la frase que dice, con palabras, que el puntal se toca y se
       retira. Ocupa el sitio que dejó el botón «Retirar» —el que antes ponía el
       verbo en pantalla— y no es una diana: es TEXTO, no se toca, y desaparece
       cuando la partida se cierra para dejarle el hueco al veredicto. */
    var pista = document.createElement("p");
    pista.className = "reto-andamio-pista";
    pista.textContent = T.pista;
    raiz.appendChild(pista);

    /* 5 · VEREDICTO: la frase entera de la opción correcta y la de transferencia.
       Nace vacío y va DEBAJO de la escena, no bajo la placa-creencia como
       dibujaba §2: llenarlo ahí arriba empujaría la zona hacia abajo justo en el
       instante en que el alumno está mirando el puntal que acaba de encenderse.
       Aquí no se mueve nada de lo que ya está en pantalla. */
    var veredicto = document.createElement("div");
    veredicto.className = "reto-andamio-veredicto";
    veredicto.hidden = true;
    raiz.appendChild(veredicto);

    m.cuerpo.appendChild(raiz);

    /* La prueba de existencia de las láminas vive en la infraestructura: el
       veredicto es POR RUTA y de módulo (retos.js:444-507), así que la misma
       lámina se pide UNA vez por página y el resultado se comparte entre los
       tres puntales, las partidas y las aperturas del modal. No se espera su
       promesa —la escena ya está montada y cada <img> lleva su reserva—, pero
       llamarla al montar es OBLIGATORIO: es la única tabla que
       `montaje.sprite()` consulta, y sin ella el encendido del portante pediría
       red justo en el frame de la victoria, el único que el alumno mira. */
    if (m.precargar) m.precargar([RUTA_PUNTAL, RUTA_PUERTA, RUTA_PUERTA_AB, RUTA_CANDADO, RUTA_CANDADO_AB]);

    /* ------------------------------------------- geometría (§2, medida) ----- */

    /* Los slots se reparten desde el ancho REAL de la zona y el ancho REAL del
       puntal: así los mismos tres caben a 340 px y a 480 sin que el juego
       escriba una sola medida de diseño, y una tarjeta con un puntal de más se
       aprieta en vez de salirse.
       `clientWidth`/`offsetWidth` y NO `getBoundingClientRect`: la caja del modal
       entra con `modal-rise`, que es una animación de TRANSFORM, y todo rect
       leído mientras corre viene escalado (medido en F2, kintsugi.js:660-665).
       Una sola pasada de lectura y después solo escrituras. */
    function colocar() {
      var ancho = zona.clientWidth;
      if (!ancho || !piezas.length) return;
      var w = piezas[0].nodo.offsetWidth || 0;
      if (!w) return;
      var n = piezas.length;
      /* Cuando caben, `paso` vale exactamente ancho de slot + hueco; cuando no,
         reparte lo que hay y el último acaba pegado al borde derecho. Una sola
         fórmula, sin ramas que se separen con el tiempo. */
      var paso = n > 1 ? Math.max(0, (ancho - w) / (n - 1)) : 0;
      for (var q = 0; q < n; q++) piezas[q].nodo.style.left = Math.round(q * paso) + "px";
    }

    colocar();

    /* Rotar el móvil con el modal abierto no puede dejar los puntales donde
       estaban (§12 caso 6). Antirrebote porque el resize llega en ráfaga. */
    function alRedimensionar() {
      if (idResize) clearTimeout(idResize);
      idResize = setTimeout(function () {
        idResize = 0;
        if (vivo()) colocar();
      }, MS_RESIZE);
    }
    window.addEventListener("resize", alRedimensionar);

    /* ------------------------------------------------- ladeo heredado (§12) - */

    var ladeo = m.examen ? 0 : Math.min(TOPE_LADEO, LADEO[String(m.content && m.content.id)] || 0);
    pintarLadeo();

    function pintarLadeo() {
      plataforma.style.setProperty("--an-ladeo", ladeo + "deg");
    }

    /* --------------------------------------------------- estado y anti-mash - */

    function estado(s) { raiz.setAttribute("data-estado", s); }

    function piezaDe(nodo) {
      for (var q = 0; q < piezas.length; q++) { if (piezas[q].nodo === nodo) return piezas[q]; }
      return null;
    }

    function porClave(c) {
      for (var q = 0; q < piezas.length; q++) { if (piezas[q].clave === c) return piezas[q]; }
      return null;
    }

    function elPortante() {
      for (var q = 0; q < piezas.length; q++) { if (piezas[q].portante) return piezas[q]; }
      return null;
    }

    function quedanFalsos() {
      var n = 0;
      for (var q = 0; q < piezas.length; q++) { if (!piezas[q].portante && !piezas[q].fuera) n++; }
      return n;
    }

    /* Deshabilitar el elemento que TIENE el foco lo manda a <body>, y ahí la
       trampa de foco de retos.js ya no puede hacer nada: escucha los Tab en la
       caja del modal, y desde <body> las teclas ni le llegan. Sin este rescate,
       quien juega con teclado se va de paseo por la misión de debajo justo
       después de retirar (mismo rescate de tameshiwari.js:437-448). */
    /* El `:not([disabled])` no es adorno: en el veredicto de examen los falsos
       que quedaron en pie se deshabilitan SIN marcarlos `data-fuera` (no se han
       retirado, se han apagado), y enfocar un <button disabled> no hace nada —
       el foco se quedaría en <body>, que es justo lo que este rescate existe
       para evitar. */
    function rescatarFoco() {
      var libres = zona.querySelectorAll(".reto-andamio-puntal:not([data-fuera]):not([disabled])");
      var destino = libres.length ? libres[0] : (m.caja && m.caja.querySelector(".reto-modal__cerrar"));
      if (destino && destino.focus) { try { destino.focus(); } catch (e) { /* nada */ } }
    }

    /* --------------------------------------------- ARRASTRE · el atajo (§4) - */

    control = window.MFDrag ? MFDrag.crear({
      zona: zona,
      /* El `:not()` se reevalúa en cada pointerdown porque MFDrag delega con
         `closest()` (mfdrag.js:302-304): marcar `data-fuera` basta para que el
         puntal retirado deje de agarrarse, sin tocar la configuración. */
      piezas: ".reto-andamio-puntal:not([data-fuera])",
      destinos: "",                /* arrastre libre: el juicio es el tirón, no un hueco */
      umbral: 6,
      iman: 0,
      /* OBLIGATORIO, no una preferencia: con `limites: true` el puntal (190 px)
         dentro de la zona (200 px) tendría ~10 px de recorrido visible contra un
         umbral de tirón de 60, y se despegaría del dedo. El recorte lo pone el
         `overflow: hidden` de la zona. */
      limites: false,
      /* APAGADO A PROPÓSITO (regla 2 del titular). El modo por toques de MFDrag
         ALTERNA una selección en el pointerup (`alternar`, mfdrag.js:371-375):
         es la mitad del patrón «toca la pieza, toca el destino», y aquí no hay
         destino que tocar —el toque en el puntal YA es la retirada—. Encendido,
         cada toque dejaría la pieza «elegida» y habría que rematarla con algo.
         La alternativa al arrastre que exige WCAG 2.5.7 la pone el `click` del
         propio <button> (ver `montarPuntal`), que además cubre el teclado. */
      toques: false,

      alSoltar: function (p, destino, info) {
        if (ocupado || !info || !info.movido) return "vuelve";
        /* Tirón hacia abajo: recorrido suficiente y sin irse de lado. El juicio
           se dispara AQUÍ, antes de retornar, porque el veredicto depende de él. */
        if (info.dy >= DY_TIRON && Math.abs(info.dx) < DX_TIRON) {
          var d = piezaDe(p);
          if (!d || d.fuera) return "vuelve";
          tirar(p);
          /* El portante vuelve SOLO a su hueco (200 ms, `MS_VUELVE` de MFDrag):
             es el único camino, porque la API pública no deja reposicionar una
             pieza a mano. El falso se queda donde el dedo lo soltó y de ahí lo
             recoge la clase `--saliendo`. */
          return d.portante ? "vuelve" : "libre";
        }
        /* Arrastre que no llega a tirón (corto o demasiado diagonal): la pieza
           vuelve a su hueco y no pasa nada más. Ya no hay elección que
           restaurar —el toque juzga en el acto—, así que el gesto en falso es
           exactamente eso: un gesto que no ha pasado. */
        return "vuelve";
      }
    }) : null;

    /* MFDrag marca sus piezas con `aria-pressed="false"` al prepararlas
       (mfdrag.js:175) porque en su modo por toques SON botones de dos estados.
       Aquí no lo son: el toque retira, no conmuta. Se les quita el atributo para
       que el lector no anuncie «botón de alternancia, no pulsado» sobre algo que
       no se puede despulsar. `prepararPieza` no vuelve a ponerlo (sale por
       `__mfdragPieza`), ni siquiera cuando su MutationObserver repasa la zona. */
    if (control) {
      for (i = 0; i < piezas.length; i++) piezas[i].nodo.removeAttribute("aria-pressed");
    }

    /* Doble cinturón (§4): ninguna flecha del juego puede llegar al listener
       global de mission.js, que llama a goPrev()/goNext() sin ninguna guarda y
       repintaría la misión bajo el reto abierto. Tab y Escape SÍ siguen su
       camino: los necesita la trampa de foco de retos.js. Enter y Espacio
       tampoco se tocan: son la activación nativa del <button>, o sea la
       retirada por teclado. */
    zona.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.stopPropagation();
      }
    });

    /* ------------------------------------------------- el juicio (§3) ------- */

    /* Camino ÚNICO de los dos gestos: el toque y el tirón entran por aquí, así
       que la anticipación, los tiempos y el veredicto son idénticos toque a
       toque. Es lo que hace que arrastrar sea un ATAJO y no otro juego. */
    function tirar(nodo) {
      if (ocupado) return;
      var d = piezaDe(nodo);
      if (!d || d.fuera) return;
      ocupado = true;
      estado("retirando");
      /* SIEMPRE sobre el <img> interior, jamás sobre el envoltorio: MFDrag ocupa
         su `transform` en línea y una animación gana siempre al estilo en línea
         (con un solo nodo, el temblor teletransportaría el puntal a su hueco a
         mitad del arrastre). */
      if (window.MFJuice && MFJuice.anticipar) MFJuice.anticipar(d.fig, MS_ANTICIPA);
      luego(quieto ? 0 : MS_ANTICIPA, function () {
        if (d.portante) ceder(d);
        else salir(d);
      });
    }

    /* ------------------------------------------- SALIR · retirada correcta -- */

    function salir(d) {
      estado("saliendo");
      d.fuera = true;
      if (!mem.retirados[d.clave]) { mem.retirados[d.clave] = true; mem.salidos.push(d.clave); }
      var teniaFoco = (document.activeElement === d.nodo);
      d.nodo.setAttribute("data-fuera", "");
      d.nodo.setAttribute("aria-disabled", "true");
      d.nodo.disabled = true;
      if (teniaFoco) rescatarFoco();
      /* La clase se añade en el marco SIGUIENTE al `alSoltar`, ya con
         `soltarPieza` pasado: MFDrag borra el `style.transition` en línea justo
         después de que el veredicto retorne, y la caída tiene que vivir en la
         clase para verse igual por los dos caminos. La propiedad independiente
         `translate` compone con el `transform` de MFDrag en vez de pelearse, y la
         caída es SIEMPRE relativa: nunca se suman `info.dx`/`info.dy`, que MFDrag
         ya aplicó al pintar la pieza. */
      marco(function () { d.nodo.classList.add("reto-andamio-puntal--saliendo"); });

      var retirados = piezas.length - 1 - quedanFalsos();   /* incluida esta */
      var ultima = quedanFalsos() === 0;

      /* El sonido no es movimiento: suena también con movimiento reducido, y solo
         si el alumno encendió el interruptor del modal. La escalera se completa
         en la retirada que gana: ahí ya no hay nota suelta, hay arpegio. */
      if (window.MFSonido) {
        if (ultima) { if (MFSonido.arpegio) MFSonido.arpegio(); }
        else if (MFSonido.fx && MFSonido.fx("fx-llave-cerradura")) {
          /* el descarte cuenta su historia (titular 2026-09-02): la llave
             intenta la cerradura y, al no entrar, cae al suelo con su clink;
             la nota de escalera queda de respaldo sin fábrica */
          MFSonido.fx("fx-llave-cae", 340);
        } else if (MFSonido.nota) {
          MFSonido.nota(NOTAS[Math.min(NOTAS.length - 1, retirados - 1)],
            { tipo: "triangle", attack: 8, decay: 220, gain: 0.22 });
        }
        if (MFSonido.vibrar && !ultima) MFSonido.vibrar(15);
      }

      luego(quieto ? 0 : MS_BANDEJA, function () { tumbarEnBandeja(d); });

      luego(quieto ? 0 : MS_SALE, function () {
        estado("feedback-ok");
        /* Lo que ENSEÑA es el feedback escrito de ESA opción; el panel lo pinta
           la infraestructura (que además lo trae a la vista con su propio
           scroll, retos.js:744) y no emite evento, porque retirar bien no es ni
           un fallo ni una victoria. Todo puntal es una opción de la tarjeta:
           desde que los señuelos se fueron no hay una segunda rama de feedback
           que mantener. */
        m.feedback(d.idx);
        /* Se anuncia DESPUÉS de la infraestructura para que en la región viva
           quede el texto completo —veredicto + porqué— y no solo el feedback
           pelado (patrón de F3, pasa.js:1149-1152). */
        anunciar(T.fuera.replace("{f}", textoPlano(feedbackDe(d))));

        /* La lectura mínima NO lleva el `quieto ? 0 :` del resto de esperas: las
           demás miden ANIMACIONES, que con movimiento reducido no existen, pero
           esto mide LECTURA, que existe igual (§11.9). Es lo único que retrasa
           la siguiente retirada, y no pide ni un toque: al terminar, el juego ya
           está listo (regla 2). */
        luego(m.examen ? MS_LEE_EXAMEN : MS_LEE, function () {
          if (quedanFalsos() === 0) { victoria(); return; }
          estado("reposo");
          ocupado = false;
        });
      });
    }

    /* La miniatura es la MISMA lámina tumbada 90° y atenuada: es el mismo objeto
       descartado, no otro objeto, y rotarlo es lo que manda la economía de
       láminas. La caja nace VERTICAL y se gira después porque `object-fit` se
       resuelve ANTES que `transform`: al revés, la lámina se dibujaría como una
       astilla de unos 5 px y se vería un palillo, no un puntal tumbado. */
    function tumbarEnBandeja(d) {
      var hueco = document.createElement("span");
      hueco.className = "reto-andamio-bandeja__hueco";
      ilustrar(hueco, RUTA_PUNTAL, "reto-andamio-bandeja__fig", sinLamina, null);
      /* El ✓ es tipografía, no lámina, y va en el HTML para que el estado no
         dependa solo del gris del filtro (checklist §11.5). */
      var ok = document.createElement("i");
      ok.className = "reto-andamio-bandeja__ok";
      ok.textContent = "✓";
      hueco.appendChild(ok);
      bandeja.appendChild(hueco);
    }

    function feedbackDe(d) {
      var o = ops[d.idx] || null;
      return (o && o.feedback) || (m.tarjeta && m.tarjeta.feedback) || "";
    }

    /* --------------------------------------- CEDER · el portante (§5 fallo) - */

    /* La plataforma cede 3° con crujido mientras el puntal rebota, y vuelve sola
       a su hueco. No se cae nada, nadie pierde nada y el ladeo se queda: coste
       acumulativo sin castigo. Jamás screenshake y JAMÁS vibración. */
    function ceder(d) {
      estado("cediendo");
      mem.fallos++;
      if (window.MFJuice && MFJuice.hitstop) MFJuice.hitstop(m.caja, 70);

      /* El candado se sacude: reutiliza el temblor del cofre de F4 (clase
         global). El ladeo heredado se conserva en la memoria por continuidad,
         pero ya no pinta nada: la puerta no se ladea. */
      if (!quieto) {
        candadoFig.classList.remove("reto-herr-traqueteo");
        void candadoFig.offsetWidth;
        candadoFig.classList.add("reto-herr-traqueteo");
        luego(600, function () { candadoFig.classList.remove("reto-herr-traqueteo"); });
      }
      luego(quieto ? 0 : 70, function () {
        if (!m.examen) {
          ladeo = Math.min(TOPE_LADEO, ladeo + GRADOS_FALLO);
          LADEO[String(m.content && m.content.id)] = ladeo;
          pintarLadeo();
        }
        /* El kit lo hace TODO: rebote con squash, dos estrellitas y la nota
           grave. NUNCA se llama además a `MFSonido.fallo()` o sonaría dos veces
           (`MFJuice.fallo` ya la dispara, juice.js:343-344). Sin el kit cargado,
           el sonido sí lo pone el juego: es la única forma de que el fallo se
           oiga igual. */
        if (window.MFJuice && MFJuice.fallo) MFJuice.fallo(d.fig, m.escenario);
        else if (window.MFSonido && MFSonido.fallo) MFSonido.fallo();

        /* Lo que ENSEÑA es el feedback escrito del portante; el panel y el evento
           `reto_fail` los pone la infraestructura, que además mide la repesca. */
        m.fallar(d.idx);
        anunciar(T.cede.replace("{f}", textoPlano(feedbackDe(d))));

        if (m.examen) { veredictoExamen(d); return; }

        /* Repesca ilimitada y sin cronómetro (regla del titular). Al cumplirse
           la lectura el juego vuelve solo a reposo: el alumno no tiene que
           pulsar nada para volver a intentarlo (regla 2). */
        luego(MS_LEE_FALLO, function () {
          estado("reposo");
          ocupado = false;
        });
      });
    }

    /* -------------------------------------- ENCENDIDO DEL PORTANTE (§5.2) --- */

    /* EL VIAJE (rediseño 2026-09-01): ya no hay intercambio apagada→encendida.
       La llave buena VUELA sola hasta el candado, el candado abre y, un tiempo
       después, la puerta. Viaja el <img> (d.fig) y no el botón: la placa con la
       etiqueta se queda abajo, como respuesta elegida, y el botón conserva el
       transform de MFDrag sin pelearse con nada (se anima `translate`, que es
       propiedad independiente). El delta se mide en rects de PANTALLA y se
       divide por el zoom (MFDrag.zoomDe): la lección del 20 % de desvío. */
    function encender(d, fin) {
      d.nodo.classList.add("reto-andamio-puntal--sostiene");
      var k = (window.MFDrag && MFDrag.zoomDe) ? MFDrag.zoomDe(zona) : 1;
      if (!(k > 0)) k = 1;
      var rk = d.fig.getBoundingClientRect();
      var rc = candadoFig.getBoundingClientRect();
      var dx = ((rc.left + rc.width / 2) - (rk.left + rk.width / 2)) / k;
      var dy = ((rc.top + rc.height / 2) - (rk.top + rk.height / 2)) / k;

      function abrirTodo() {
        candadoFig.src = RUTA_CANDADO_AB;
        luego(quieto ? 0 : MS_ABRE, function () {
          viga.src = RUTA_PUERTA_AB;
          /* la puerta abre con su chirrido corto de bisagra (titular
             2026-09-02): agradable, nada de película de terror */
          if (window.MFSonido && MFSonido.fx) MFSonido.fx("fx-puerta-abre");
          /* Con la puerta abierta el herraje ya no existe: el candado y la
             llave se retiran con un fundido corto para no quedar flotando. */
          candadoFig.style.transition = quieto ? "" : "opacity 200ms ease-out";
          candadoFig.style.opacity = "0";
          d.fig.style.transition = quieto ? "" : "opacity 200ms ease-out";
          d.fig.style.opacity = "0";
        });
      }

      if (quieto || !d.fig.animate) {
        d.fig.style.translate = Math.round(dx) + "px " + Math.round(dy) + "px";
        if (window.MFSonido && MFSonido.fx) MFSonido.fx("fx-candado-abre");
        abrirTodo();
        if (fin) fin();
        return;
      }
      try {
        d.fig.animate(
          [{ translate: "0px 0px" }, { translate: Math.round(dx) + "px " + Math.round(dy) + "px" }],
          { duration: MS_VIAJE, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)", fill: "forwards" });
      } catch (e) {
        d.fig.style.translate = Math.round(dx) + "px " + Math.round(dy) + "px";
      }
      luego(MS_VIAJE, function () {
        if (!vivo()) return;
        /* la llave buena LLEGA: la cerradura se abre (tics + click solido) y
           MS_ABRE despues la puerta responde con su bisagra */
        if (window.MFSonido && MFSonido.fx) MFSonido.fx("fx-candado-abre");
        abrirTodo();
        if (fin) fin();
      });
    }

    /* ------------------------------------------------ VICTORIA (§5, cascada) */

    function victoria() {
      ocupado = true;
      estado("victoria");
      pista.hidden = true;                 /* ya no hay nada que retirar */
      var d = elPortante();
      if (!d) { m.resolver({ limpio: false, intentos: mem.fallos + 1, ms: Math.round(ahora() - t0) }); return; }

      /* «limpio» es el equivalente exacto de `attempts === 1` en mission.js: los
         dos falsos retirados sin tirar NUNCA del portante, en la PRIMERA partida
         de esta tarjeta. La infraestructura lo vuelve a comprobar contra su
         propio contador (retos.js:793): cerrar y reabrir no puede regalar el
         bonus, y rejugar por gusto tampoco. */
      var limpio = mem.fallos === 0 && mem.primera;
      /* Se pregunta UNA vez y el mismo número manda sobre las TRES bocas que
         cantan el premio —el lector de pantalla, el veredicto en texto y el
         vuelo al HUD—: tres preguntas podrían dar tres cifras y ya habría una
         pantalla mintiendo. Un 0 = esta partida no paga, y entonces ninguna de
         las tres dice nada de XP. Por eso `pintarVeredicto` recibe ya el importe
         y no el `limpio`: ese texto es una de las tres bocas. */
      var paga = premio(limpio);

      if (window.MFJuice && MFJuice.hitstop) MFJuice.hitstop(m.caja, 70);
      if (window.MFSonido && MFSonido.vibrar) MFSonido.vibrar([10, 30, 20]);

      luego(quieto ? 0 : 70, function () { encender(d, null); });

      luego(quieto ? 0 : 70 + MS_VIAJE, function () {
        /* El squash va DESPUÉS del intercambio (§e-6) y sobre el <img>, nunca
           sobre el envoltorio. */
        if (window.MFJuice && MFJuice.squash) MFJuice.squash(d.fig);
        pintarVeredicto(d, paga);
      });

      luego(quieto ? 0 : 70 + MS_VIAJE + 80, function () { cosecha(d); });

      luego(quieto ? 0 : 70 + MS_VIAJE + 260, function () {
        if (window.MFJuice && MFJuice.sello) MFJuice.sello(m.escenario, T.sello);
      });

      /* El texto del lector de pantalla sigue el mismo criterio que el vuelo de
         abajo, y con el mismo número: lo que se oye y lo que se ve volar no
         pueden decir cifras distintas. */
      anunciar(T.gana.replace("{c}", d.corta) + T.transfer + (paga ? " +" + paga + " XP" : ""));

      /* El cobro solo vuela si el bonus es de verdad: en examen no existe
         —`mission.js` lo cobra con `!isExam` (§0.8.1) y el examen entrega por
         `completeExam`— y desde la sala de retos puede valer menos, o nada. Con
         `paga` en 0 no vuela nada: prometer un XP que jamás llega era justo el
         error que esto viene a arreglar. El chip vuela con el número exacto que
         se va a pagar. */
      if (paga && !quieto) {
        luego(760, function () {
          if (window.MFJuice && MFJuice.volarXP) MFJuice.volarXP(d.nodo, paga);
        });
      }

      luego(quieto ? 300 : MS_FIN, function () {
        estado("resuelto");
        /* A partir de aquí, rejugar esta tarjeta reparte una partida NUEVA que ya
           no puede ser limpia: manda la primera (§12). */
        mem.tablero = null;
        mem.retirados = {};
        mem.salidos = [];
        mem.jugada = true;
        mem.primera = false;
        m.resolver({ limpio: limpio, intentos: mem.fallos + 1, ms: Math.round(ahora() - t0) });
      });
    }

    /* La frase ENTERA de la opción correcta y la de transferencia: es lo que
       convierte la etiqueta corta en el aprendizaje que se lleva a casa. Con
       movimiento reducido se añade además el resultado en texto plano, porque el
       puntal encendido quieto no basta como única señal (§11.6). */
    function pintarVeredicto(d, paga) {
      var frase = document.createElement("div");
      frase.className = "reto-andamio-veredicto__frase";
      frase.innerHTML = d.html || d.corta;
      veredicto.appendChild(frase);

      var tr = document.createElement("p");
      tr.className = "reto-andamio-veredicto__transfer";
      tr.textContent = T.transfer;
      veredicto.appendChild(tr);

      if (quieto) {
        var r = document.createElement("p");
        r.className = "reto-resultado";
        /* Con movimiento reducido este texto ES el resultado, así que no puede
           prometer un XP que no se cobra: en examen no se paga nada y desde la
           sala de retos puede pagarse menos que el bonus de la misión. Por eso
           llega `paga` ya calculado y no el `limpio`. */
        r.textContent = paga ? conXP(T.resultadoXp, paga) : T.resultado;
        veredicto.appendChild(r);
      }

      veredicto.hidden = false;
      /* El fundido se enciende en el marco siguiente: puesto en el mismo tic, la
         transición arrancaría ya en su destino y no se vería. */
      marco(function () { veredicto.classList.add("is-visible"); });
    }

    /* Partículas desde el canto de la viga (el sitio que la creencia deja de
       necesitar) y un destello sobre el puntal que queda en pie. Las dos lecturas
       de layout van juntas y antes de escribir nada. */
    function cosecha(d) {
      if (!m.escenario || quieto) return;
      var rE = m.escenario.getBoundingClientRect();
      var rV = viga.getBoundingClientRect();
      var rP = d.nodo.getBoundingClientRect();
      if (window.MFJuice && MFJuice.particulas) {
        MFJuice.particulas(m.escenario, {
          x: rV.left + rV.width / 2 - rE.left, y: rV.top - rE.top,
          n: 10, angulo: -90, dispersion: 60, dist: [40, 90], dur: [450, 650],
          colores: ["#f2c230", "#e63b2e", "#f7f3ec"], forma: "petalo"
        });
      }
      if (window.MFJuice && MFJuice.destello) {
        MFJuice.destello(m.escenario,
          rP.left + rP.width / 2 - rE.left, rP.top + rP.height / 2 - rE.top,
          { radio: 60, color: "rgba(255, 215, 120, .9)" });
      }
    }

    /* ------------------------------------- VEREDICTO DE EXAMEN (§10, sin repesca) */

    /* El PRIMER tirón del portante decide la ronda. Los falsos que quedaban en
       pie se atenúan y el portante se enciende con su ✓: el estado correcto a la
       vista, que es el espejo del examen clásico (mission.js:108-113). El examen
       informa, no premia y no hace chistes de más. */
    function veredictoExamen(d) {
      estado("veredicto-fallo");
      pista.hidden = true;                 /* la ronda ya no admite más retiradas */
      /* El foco puede estar en uno de los falsos. Si se deshabilita debajo, el
         foco cae en <body> —fuera del modal, donde la trampa de Tab de retos.js
         ya no escucha— y ahí se queda mientras se lee el veredicto: tiempo de
         sobra para tabular por la misión de debajo. */
      var teniaFoco = zona.contains(document.activeElement);
      var q;
      for (q = 0; q < piezas.length; q++) {
        if (piezas[q].portante || piezas[q].fuera) continue;
        piezas[q].nodo.classList.add("reto-andamio-puntal--apagado");
        piezas[q].nodo.setAttribute("aria-disabled", "true");
        piezas[q].nodo.disabled = true;
      }
      /* El portante NO se deshabilita, así que el rescate cae en él: además de
         devolver el foco al modal, lo deja sobre la pieza que acaba de
         encenderse, que es lo que el alumno tiene que leer. Tocarlo no hace
         nada: `ocupado` se queda en true hasta que la ronda se cierra. */
      if (teniaFoco) rescatarFoco();
      encender(d, null);

      /* La ronda se cierra SOLA cuando el veredicto se ha podido leer. Antes
         había aquí un botón «Seguir» que había que pulsar: era un toque de más
         por una decisión que ya estaba tomada (regla 2), y el precedente de la
         casa es F4, que cierra con una espera de lectura (herramienta.js:1166).
         La espera no se comprime con movimiento reducido: mide LECTURA. */
      luego(MS_EXAMEN_FIN, function () {
        estado("resuelto");
        mem.tablero = null;
        mem.retirados = {};
        mem.salidos = [];
        mem.jugada = true;
        mem.primera = false;
        /* `intentos` es 1: en examen no hay repesca y el único tirón del
           portante ES el intento. (La ficha escribía `fallosPortante + 1`, que
           aquí daría 2 para una sola acción; los precedentes de F2 y F4
           informan 1 y es lo honesto para la telemetría. Nada de esto toca al
           XP: `limpio: false`.) */
        m.resolver({ limpio: false, intentos: Math.max(1, mem.fallos), ms: Math.round(ahora() - t0) });
      });
    }

    /* ------------------------------------------------------------ arranque -- */

    /* CARGANDO → REPOSO. La caja del modal tarda 220 ms en subir (animación de la
       casa); el juego no añade teatro propio, solo espera a que pare. */
    luego(quieto ? 0 : MS_ENTRADA, function () {
      colocar();
      /* Cerrar el modal justo en la lectura de la ÚLTIMA retirada dejaría al
         reabrir un tablero sin falsos que retirar y sin nada que pudiera
         terminarlo: la partida estaba ganada y el alumno se quedaría mirando un
         puntal solo. Se cierra la victoria, que además ya no puede ser limpia si
         hubo tirones (§12). */
      if (quedanFalsos() === 0) { victoria(); return; }
      ocupado = false;
      estado("reposo");
      anunciar(T.abre.replace("{n}", String(piezas.length)));
    });
  }

  /* ============================================================== REGISTRO === */

  MFRetos.registrar({
    id: "andamio",
    nombre: T.nombre,
    /* El emoji es ÚNICO por juego: es la mitad del reconocimiento de la
       tarjeta-invitación, cuyo texto total es «icono + 1 palabra + 1 verbo de
       botón». ⛩️ ya es de `pasa`, que literalmente guarda la puerta del dojo. */
    icono: "🏗️",
    banner: T.banner,
    comoSeJuega: T.comoSeJuega,
    /* ESPECIALISTA, no comodín (regla 3 del titular: la metáfora no puede
       mentir). Solo entra donde la pregunta pide el porqué o el fundamento de
       una afirmación: ahí las opciones son de verdad lo que la sostiene. En una
       tarjeta de taxonomía no sostienen nada y retirar puntales sería un gesto
       sin significado, así que la familia se exige aquí y no se negocia en
       `acepta`. `pool` ya no se pide: sin señuelos, el juego no mira el pool. */
    /* `familia:justificacion` dejó de exigirse el 2026-09-02 (mismo motivo que
       en herramienta.js: todos los juegos sobre toda pregunta completa). */
    necesita: ["corta", "correct1", "sinorden"],
    acepta: function (tarjeta) {
      var ops = (tarjeta && tarjeta.options) || [];
      /* (a) Las `@vf` de dos opciones se rechazan: las visten otros juegos. */
      if (ops.length < MIN_OPCIONES) return false;
      /* (b) Regla 1 del titular, comprobada aquí y no solo prometida en la
         cabecera: un tablero de N puntales pide N−1 retiradas, y más de tres
         acciones convierten el respiro en tarea. Hoy el censo es de tres
         opciones, así que esto solo se activaría si mañana entrara una tarjeta
         más larga — y entonces el sorteo elige otro juego. */
      if (ops.length - 1 > TOPE_ACCIONES) return false;
      /* (c) Sin nada que leer al retirar, el juego perdería su virtud entera
         —los veredictos— así que prefiere no salir. Vale el feedback por opción
         o el general de la tarjeta como red. */
      var general = !!limpiar(tarjeta && tarjeta.feedback);
      if (!general) {
        for (var i = 0; i < ops.length; i++) {
          if (!limpiar(ops[i] && ops[i].feedback)) return false;
        }
      }
      return true;
    },
    jugar: jugar
  });
})();

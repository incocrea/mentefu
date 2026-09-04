/* MenteFu / MindFu — LA HERRAMIENTA DEL SENSEI (docs/07-miniretos/F4-herramienta-del-sensei.md).

   Hay una labor pendiente en el rincón del dojo —una mancha de tinta en el
   shoji, un cofre con candado— y una repisa con utensilios IDÉNTICOS, rotulados
   solo con la etiqueta corta de cada opción del quiz. El alumno arrastra (o
   toca-toca, o teclea) el que responde bien y lo aplica al objetivo: el correcto
   TRANSFORMA el objetivo tras dos micropasadas activas (frotar / girar) y el
   equivocado se gasta, abre el feedback de ESA opción y deja repesca sin
   límite. En examen no hay repesca: el primer juicio decide y se revela cuál
   era la buena. La metáfora es que cada situación pide SU herramienta, no la
   que uno tiene más a mano.

   Es un juego ESPECIALISTA, no comodín: solo entra en tarjetas marcadas
   `@familia: accion` («¿cuál es el movimiento entrenado?», «¿cuál es la
   reparación proporcional?», «¿cuál de estas respuestas es un bloqueo?»). Es la
   regla 3 del titular —la metáfora no puede mentir—, y aquí no es una cautela
   teórica: la auditoría del corpus contra los tipos de pregunta
   (docs/07-miniretos/11-metafora-y-tipo-de-pregunta.md §5 y §7.1) midió que con
   el filtro genérico de antes este juego entraba en las 75 tarjetas del dojo y
   su metáfora solo era honesta en 13. En una definición («¿qué es la culpa?»)
   no hay ninguna labor pendiente, así que aplicar el utensilio «Una señal» a la
   mancha y verla desaparecer enseña que una definición ARREGLA algo; en una
   taxonomía (8-mis1#4, donde las opciones se llaman Bloquear/Desviar/Desarmar)
   enseña que NOMBRAR ES ACTUAR, que es justo el error contra el que trabaja el
   nivel 8. Por eso la familia se exige en `necesita` y no se negocia en
   `acepta`. El coste está medido y es cero: tameshiwari y kintsugi son comodines
   honestos y cubren las 75, así que ninguna tarjeta se queda sin minireto.

   Este archivo SOLO pinta y juzga. El XP, los cierres, el historial del
   navegador, el panel de feedback y toda la telemetría los pone la
   infraestructura (retos.js) a través del `montaje`: aquí no hay ni un
   MF.track, ni una suma de XP, ni un listener de Escape.

   NUEVE decisiones de este archivo que conviene no deshacer sin leer el porqué:

   · LOS SPRITES DE UTENSILIO NO LLEVAN INFORMACIÓN. En cada escena los 2-3
     utensilios son EL MISMO archivo replicado, y lo único que los distingue es
     su placa de texto y un punto de color repartido al azar. Es regla de motor
     del jurado pedagógico (ficha §1): si el dibujo delatara la respuesta, el
     juego dejaría de medir comprensión. Por eso la clave `icono=` del censo se
     IGNORA aquí, y el punto de color se baraja en cada montaje, también en
     examen — no necesita determinismo porque no transporta ni un bit.

   · EL FALLO CÓMICO VA EN DOS TIEMPOS, Y NO A LA VEZ. El slot es la pieza que
     arrastra MFDrag, que le escribe `transform` EN LÍNEA (mfdrag.js:108-116), y
     el garnish del kit (`juice-fallo`) declara `0% { transform: translateX(0) }`
     —una animación gana SIEMPRE al estilo en línea—: lanzados juntos, el
     utensilio se teletransportaría a la repisa en un frame, justo cuando acaba
     de aterrizar sobre el objetivo. Aquí primero se deforma el SPRITE (plif /
     doblez, que son nodos distintos y no se pisan) mientras el slot vuelve a su
     balda; cuando ya está en casa y sin `transform`, entra el tambaleo del kit
     con sus estrellitas y su nota grave. Es la misma lección que F2 pagó
     (kintsugi.js:69-76), resuelta sin añadir un nodo envoltorio: el traje de la
     fase atenúa el utensilio gastado con selectores de HIJO
     (`.reto-herr-util--gastado > .reto-herr-placa`), así que sprite, punto de
     color y placa tienen que colgar directamente del slot.

   · EL OBJETIVO TAMBIÉN SON DOS NODOS: el wrapper lleva el sitio y el latido
     (que se monta sobre `translate(-50%,-50%)`) y la figura lleva el
     intercambio de lámina, el traqueteo y la caída. Juntos, el keyframe del
     latido se comería el transform del viaje.

   · AQUÍ NO SE USA `.reto-lienzo` AUNQUE SEA EL TRAJE COMÚN. Esa clase trae
     `touch-action: manipulation`, y las dos piezas que de verdad se manipulan
     —el utensilio que se arrastra y el objetivo que se frota— viven dentro de
     una zona que MFDrag pone en `touch-action: none` justo para que el
     navegador no se quede el gesto. Un hijo con `manipulation` volvería a
     abrirle la puerta al scroll a mitad de frotado. El <img> sí lleva
     `.reto-pieza`: es lo que `montaje.sprite()` busca para intercambiar la
     lámina (retos.js:540) y lo que impide que el dibujo se coma el pointerdown.

   · EL ENUNCIADO SE QUEDA FUERA DE LA ZONA DE ARRASTRE. La zona de MFDrag
     envuelve escena y repisa, y nada más: la zona va en `touch-action: none`, y
     con el enunciado y el panel de feedback dentro no habría por dónde deslizar
     el cuerpo del modal en un móvil bajo para leer POR QUÉ se ha fallado, que
     es la parte que enseña.

   · EL REBOTE DE LA TAPA SE APLICA A LA FIGURA, NO A LA CAJA DEL COFRE. La caja
     también aloja al candado, así que un `scale()` ahí crecería con el candado
     dentro justo mientras cae. En la figura solo crece la madera, con el pivote
     en la línea de apoyo (`--herr-cofre-base`), y el cofre se abre sin
     despegarse del suelo. (La caja además se centra con la propiedad
     independiente `translate`, precisamente para que un `transform` de
     animación no se coma su −50 %: si algún día vuelve a centrarse con
     `transform`, esta decisión pasa de preferencia a obligación.)

   · EL FOCO SE RESCATA DOS VECES. MFDrag retira el `tabindex` de los destinos
     en cuanto la pieza sale de viaje (mfdrag.js:284), y quitarle el tabindex al
     elemento que TIENE el foco lo manda a <body>, donde la trampa de foco del
     modal ya no alcanza: quien juega con teclado se quedaría sin poder frotar
     ni girar. Por eso al entrar en TRABAJO el objetivo recupera tabindex y
     foco, y al gastarse un utensilio el foco salta al primero libre. El anillo
     no se ve tras un gesto con el dedo: la casa usa `:focus-visible`.

   · LAS MICROPASADAS SON DEL JUEGO, NO DE MFDRAG. Frotar y girar ocurren
     DESPUÉS del veredicto y jamás tocan `limpio`. Van con listeners propios de
     puntero sobre el objetivo (con captura de puntero, para que el dedo pueda
     salirse) y con Enter/Espacio para el teclado; el rect se cachea en el
     pointerdown y en el pointermove solo se escribe `transform` (presupuesto
     F0 §0.10.2).

   · CON `prefers-reduced-motion` LA CASCADA ES LA MISMA, con los tiempos
     comprimidos a 0. No hay un camino aparte: los efectos del kit ya resuelven
     al instante sin crear nada, y las clases de estado (`reto-herr-estalla`,
     `reto-herr-cae`, `reto-herr-haz--on`, el pergamino) llevan su ESTADO FINAL
     escrito en la hoja para ese caso. Un segundo camino se habría separado del
     bueno en la primera corrección. El resultado se cuenta además con TEXTO
     bajo la escena y en `.reto-vivo` (§11.6): nunca solo con animación.

   NI UNA ETIQUETA SVG NI UNA FORMA CSS COMO OBJETO (regla del titular, F0
   §0.12): mancha, candado, cofre, paño y llave nacen con su lámina desde el
   primer fotograma. La reserva —caja de papel punteada— solo se pinta desde el
   `onerror` de cada <img>, y con ella la partida se juega, se gana y cobra
   igual. */
(function () {
  "use strict";

  /* Sin infraestructura no hay reto: mission.js cae solo a su quiz clásico. */
  if (!window.MFRetos || !MFRetos.registrar) return;

  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var A = cfg.assets || "";
  var XP = cfg.xp || {};
  var BONUS = XP.quiz_first_try || 5;

  var T = ES ? {
    nombre: "La herramienta del sensei",
    banner: "USA",
    /* La línea de «qué hay que hacer», declarada por el JUEGO y no por quien la
       pinta: la enseñan dos interfaces —la ficha de la sala de retos y la
       tarjeta-invitación de la misión— y con una tabla en cada una, el día que
       se retoque la frase se retocará en una sola. Aquí hay una sola verdad. */
    comoSeJuega: "Arrastra y mueve la herramienta correcta sobre el problema para resolverlo.",
    verboMancha: "LIMPIA",
    verboCofre: "ABRE",
    dianaMancha: "Mancha de tinta",
    dianaCofre: "Candado del cofre",
    selloMancha: "¡LIMPIO!",
    selloCofre: "¡ABIERTO!",
    aguanta: "sigue ahí",
    abre: "Reto: la herramienta del sensei. Elige un utensilio y aplícalo al objetivo.",
    elegido: "{c} elegido. Toca el objetivo para aplicarlo.",
    pistaMancha: "Frota la mancha dos veces.",
    pistaCofre: "Gira la llave dos veces.",
    correcto: "Correcto: {c}. ",
    ganaMancha: "Limpio.",
    ganaCofre: "Abierto.",
    falla: "Esa aún aguanta. Lee el consejo y prueba con otra.",
    fallaExamen: "La correcta era: {c}."
  } : {
    nombre: "The Sensei's Tool",
    banner: "USE",
    comoSeJuega: "Drag the right tool over the problem to solve it.",
    verboMancha: "CLEAN",
    verboCofre: "OPEN",
    dianaMancha: "Ink stain",
    dianaCofre: "Chest padlock",
    selloMancha: "CLEAN!",
    selloCofre: "OPEN!",
    aguanta: "still there",
    abre: "Challenge: the sensei's tool. Pick a tool and apply it to the target.",
    elegido: "{c} selected. Tap the target to apply it.",
    pistaMancha: "Rub the stain twice.",
    pistaCofre: "Turn the key twice.",
    correcto: "Correct: {c}. ",
    ganaMancha: "Clean.",
    ganaCofre: "Open.",
    falla: "That one held. Read the tip and try another.",
    fallaExamen: "The correct one was: {c}."
  };

  /* ===================================================== EL ARTE DE LA FASE ===

     Las nueve láminas de §7.1, SIEMPRE en `.webp`: al publicar, el `.png` se
     descarta cuando existe su `.webp`. El prefijo `MF_CONFIG.assets` no es
     decorativo: las misiones cuelgan de cuatro niveles de carpeta y un `src`
     relativo escrito desde JS se resuelve contra la PÁGINA, así que sin él son
     404 en todas ellas (retos.js:478-482, arbol.js:12). El fondo del rincón es
     la única excepción y no está aquí: lo pone `background-image` en
     `.reto-herr-escena`, donde la ruta se resuelve contra la HOJA y sale bien
     sea cual sea la profundidad de la página. */
  var JUEGOS = A + "assets/img/juegos/";
  var L = {
    pano: JUEGOS + "herr-pano.webp",
    llave: JUEGOS + "herr-llave.webp",
    mancha: JUEGOS + "herr-mancha.webp",
    frotada: JUEGOS + "herr-mancha-frotada.webp",
    candado: JUEGOS + "herr-candado.webp",
    abierto: JUEGOS + "herr-candado-abierto.webp",
    cofre: JUEGOS + "herr-cofre.webp",
    cofreAb: JUEGOS + "herr-cofre-abierto.webp",
    /* Reutilizado, coste 0: nació como icono de la portada (home-pergaminos) y
       desde la reorganización de 2026-09-03 vive con las piezas del juego. */
    pergamino: JUEGOS + "herr-pergamino.webp"
  };

  /* Proporciones REALES de las láminas entregadas, medidas sobre los PNG en
     disco (no las que pedía el prompt: la tabla de F1 se pidió 5:1 y volvió
     2.494). Se publican al CSS para que la geometría se derive de ellas y
     jamás al revés, y se recorrigen con `naturalWidth/naturalHeight` cuando la
     imagen carga: el número escrito aquí es la medida de hoy, no un contrato.
       cofre cerrado 512×447 = 1.145 · cofre abierto 506×512 = 0.988
       mancha 512×489 = 1.047 · frotada 512×299 = 1.712
       candado 392×512 = 0.766 · candado abierto 438×512 = 0.855
       paño 512×434 = 1.180 · llave 512×278 = 1.842 */
  var RATIO_COFRE = 1.145;

  /* Giro BASE de la llave, en grados, sobre el que se compone el giro del
     juego. Vale 0 y NO sobra: la ficha (§A.2, §A.6) pidió la llave HORIZONTAL
     —ojo a la izquierda, dientes a la derecha— porque el giro pivota en los
     dientes y así el ojo barre hacia arriba, y la lámina llegó exactamente así
     (512×278, ratio 1.842, ojo a la izquierda, verificado en disco). Si algún
     día se regenera vertical, el arreglo es poner ±90 AQUÍ y no tocar nada más:
     el pivote (`--herr-llave-pivote`) y los grados por giro siguen valiendo.
     Aviso para ese día: mientras corre `juice-anticipa` (350 ms del armado) el
     keyframe del kit escribe `transform` sobre este mismo <img> y se comería
     una base distinta de 0; entonces habría que mudar la base a un nodo
     envoltorio, como ya hacen la mano de F1 y la cerámica de F2. */
  var LLAVE_BASE = 0;

  /* ============================================== LAS ESCENAS (motor cerrado) =

     REGLA CONGELADA POR LA FICHA (§13.4, criterio de gate): toda escena futura
     entra con «UNA lámina nueva + reusar la librería de 3 fallos», y solo con
     aprobación explícita del titular y el presupuesto de `python tools/arte.py
     --cost` delante. Ni una animación de fallo por utensilio, ni un motor
     paralelo: lo que cambia entre escenas es la lámina del objetivo, la del
     utensilio, el verbo del chip y cuál de las tres animaciones de fallo se
     usa. Taiko, vela y regadera están en banco y NO se construyen aquí.

     El lanzamiento son estas dos, y las dos comparten máquina de estados. */
  var ESCENAS = {
    mancha: {
      verbo: T.verboMancha,
      diana: T.dianaMancha,
      sello: T.selloMancha,
      gana: T.ganaMancha,
      pista: T.pistaMancha,
      utensilio: L.pano,
      /* Los dos estados de la figura del objetivo. El NOMBRE viaja con la
         lámina porque es lo que se escribe en `data-lamina-<estado>` y en
         `data-estado`: en QA se lee «intacta → frotada» y no «base → medio». */
      est0: "intacta", lam0: L.mancha,
      est1: "frotada", lam1: L.frotada,
      fallo: "plif",           /* el paño se despanzurra contra el shoji */
      armado: 350,
      nota: 523.25,            /* C5 en cada micropasada */
      vibra: 15
    },
    cofre: {
      verbo: T.verboCofre,
      diana: T.dianaCofre,
      sello: T.selloCofre,
      gana: T.ganaCofre,
      pista: T.pistaCofre,
      utensilio: L.llave,
      est0: "cerrado", lam0: L.candado,
      est1: "abierto", lam1: L.abierto,
      fallo: "doblez",         /* la llave se dobla como un fideo */
      armado: 400,
      nota: 659.25,            /* E5 en cada giro */
      vibra: [10, 30, 20]
    }
  };

  /* La librería COMÚN de fallos cómicos: tres animaciones parametrizables y
     ninguna más (regla de la ficha §5). `rebote` no lo usa el lanzamiento —está
     reservado a utensilios contundentes de escenas futuras— pero se declara
     aquí para que la escena nueva no invente la suya, que es justo lo que la
     regla prohíbe. Los keyframes viven en game.css. */
  var FALLOS = { plif: "reto-herr-plif", doblez: "reto-herr-doblez", rebote: "reto-herr-rebote" };

  /* Colores del punto decorativo. Se barajan en cada montaje y JAMÁS se
     correlacionan con la corrección: son distintivo, no información. */
  var LAZOS = ["var(--belt-yellow)", "var(--belt-green)", "var(--belt-blue)"];

  /* ================================================= TIEMPOS (ficha §3 y §5) = */

  var MS_ENTRADA = 220;        /* lo que tarda la caja del modal en subir (F0) */
  var MS_PASADA = 200;         /* micropago de una pasada de frotado */
  var MS_GIRO = 150;           /* micropago de un giro de llave */
  var MS_PISTA = 4000;         /* sin acción en TRABAJO, el objetivo vuelve a latir */
  var MS_RESIZE = 150;         /* antirrebote del resize: llega en ráfaga (igual que kintsugi) */
  var MS_VUELTA = 300;         /* el utensilio vuelve a la repisa tras fallar */
  var MS_TAMBALEO = 400;       /* lo que dura el garnish del kit (juice-fallo) */
  var MS_AGUANTA = 900;        /* cartelito «sigue ahí» sobre el objetivo */
  var MS_EXAMEN_LEE = 1400;    /* pausa de lectura del revelado, sin repesca */
  var UMBRAL_FROTE = 40;       /* px de recorrido horizontal que valen una pasada */
  var MS_SOBRE = 450;          /* trabajo EN VIVO: una etapa por cada 450 ms sobre el objetivo */
  var DESVIO_PANO = 16;        /* cuánto sigue el paño al dedo mientras frota */
  var PLACA_LARGA = 14;        /* caracteres de `corta` a partir de los que baja el cuerpo */

  /* ============================================================== UTILERÍA === */

  function ahora() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  function tope(v, min, max) { return Math.max(min, Math.min(max, v)); }

  function textoPlano(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html == null ? "" : html);
    return (d.textContent || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
  }

  function reducido() {
    return !!(window.MFJuice && MFJuice.reducido && MFJuice.reducido());
  }

  /* Reinicia un keyframe aunque la clase ya estuviera puesta: sin el reflow el
     navegador no lo relanza y el segundo fallo seguido se quedaría quieto. */
  function reanimar(el, clase) {
    el.classList.remove(clase);
    void el.offsetWidth;
    el.classList.add(clase);
  }

  /* Copia local del hash de F0 §0.7.3 (retos.js:159-163, que no lo exporta).
     Cinco líneas sin dependencias; lo que NO puede pasar es que las dos
     difieran, así que se copia literal en vez de reescribirse. */
  function hashHerr(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  /* ==================================================== LÁMINA Y RESERVA ==== */

  /* La vuelta atrás, como FÁBRICA y no como closure escrito en el sitio: estos
     manejadores se cuelgan de imágenes creadas dentro de bucles con `var`, y
     una función definida ahí dentro capturaría la VARIABLE del bucle, no su
     valor — todos los utensilios acabarían restaurando la reserva del último
     (lección de F1, tameshiwari.js:139-152).

     El <img> se SUSTITUYE por un <span> con sus mismas clases más
     `.reto-herr-hueco`: así el hueco de papel conserva la caja del dibujo que
     falta y no se lleva por delante a la placa ni al punto de color, que son
     hermanos suyos. La diana, los listeners y la partida siguen intactos.
     `llena` distingue los dos casos: el sprite de la repisa recibe su tamaño de
     `.reto-herr-sprite`, que es una CLASE y viste igual a un <span>; el
     objetivo y el cofre lo reciben de `.reto-herr-objetivo img` y
     `.reto-herr-cofre img`, selectores de TIPO que un <span> no cumple, así que
     ahí el tamaño va en línea (y es estructural: sin él, el hueco colapsa). */
  function reserva(img, clases, llena) {
    return function () {
      if (!img.parentNode) return;                 /* idempotente: onerror puede repetirse */
      var hueco = document.createElement("span");
      hueco.className = "reto-herr-hueco " + clases;
      hueco.setAttribute("aria-hidden", "true");
      if (llena) {
        hueco.style.display = "block";
        hueco.style.width = "100%";
        hueco.style.height = "100%";
      }
      img.parentNode.replaceChild(hueco, img);
    };
  }

  /* Cuelga de `nodo` la lámina definitiva. El <img> nace ya con su `src` —la
     ilustración es el estado normal, no la mejora (F0 §0.12)— y lleva encima su
     propia red. Los manejadores van ANTES del `src` porque una imagen ya en
     caché puede resolver dentro de la propia asignación: apuntarlos después
     sería apuntarlos tarde, y ese es justo el caso de la segunda partida de la
     página (tameshiwari.js:157-184). */
  function ilustrar(nodo, ruta, clases, llena, alMedir) {
    var img = document.createElement("img");
    /* `.reto-pieza` no es decorativa: es lo que `montaje.sprite()` busca para
       intercambiar la lámina (retos.js:540). El traje de la fase la viste
       después por clase propia o por selector de descendencia. */
    img.className = "reto-pieza " + clases;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.draggable = false;
    var caer = reserva(img, clases, llena);
    img.onerror = caer;
    /* Un 404 servido como página HTML puede «cargar» con 0×0 y sin disparar
       `onerror`: sin píxeles no hay lámina, y darla por buena dejaría un hueco
       justo donde va la pieza. */
    img.onload = function () {
      if (!img.naturalWidth || !img.naturalHeight) { caer(); return; }
      if (alMedir) alMedir(img.naturalWidth / img.naturalHeight);
    };
    nodo.appendChild(img);
    img.src = ruta;
    return img;
  }

  /* ================================ MEMORIA POR TARJETA (§3 y §12, caso 4) ===

     Cerrar el modal a mitad y reabrir NO devuelve la oportunidad del «limpio»
     ni resucita los utensilios ya gastados. La infraestructura persiste el
     CONTEO (estado.fallos, retos.js:423-429) pero no sabe CUÁLES cayeron: eso
     vive aquí. La clave incluye el intento de examen, así que el botón de
     reintento estrena estado sin borrar nada. WeakMap para que las tarjetas de
     un intento viejo se recojan solas; sin WeakMap, un objeto plano, que a
     escala de una página es igual de bueno (tameshiwari.js:232-247). */
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

  /* ============================================== ELECCIÓN DE ESCENA (§9) ====

     Determinista de arriba abajo: reabrir tras un abandono repite escena, y en
     examen la ronda es siempre el cofre (cierre ceremonial: el cofre guarda el
     pergamino). El índice de tarjeta viene HECHO en el contrato —`m.iTarjeta`,
     F0 §0.7.1—, así que aquí no se busca nada con indexOf. Un `@escena` con
     valor futuro (taiko, vela, regadera) NO veta la tarjeta: se ignora la
     preferencia y entra la rotación. */
  function escenaDe(m) {
    if (m.examen) return "cofre";
    var pref = m.tarjeta && m.tarjeta.reto && m.tarjeta.reto.escena;
    if (typeof pref === "string") {
      pref = pref.replace(/^\s+|\s+$/g, "").toLowerCase();
      if (ESCENAS[pref]) return pref;
    }
    return (hashHerr(String(m.content && m.content.id) + "#" + (m.iTarjeta | 0)) % 2) ? "cofre" : "mancha";
  }

  /* ================================================================ EL JUEGO = */

  function jugar(m) {
    var ops = (m.tarjeta && m.tarjeta.options) || [];
    var n = ops.length;
    /* No debería llegar (lo filtran `necesita` y `acepta`), pero si llegara,
       resolver es mejor que dejar al alumno encerrado con la tarjeta
       bloqueada. */
    if (!n) { m.resolver({ limpio: false, intentos: 1, ms: 0 }); return; }

    var idEscena = escenaDe(m);
    var E = ESCENAS[idEscena];
    var esCofre = idEscena === "cofre";

    var mem = memoria(m);
    var quieto = reducido();
    var t0 = ahora();
    var timers = [];
    var control = null;
    var ocupado = true;            /* PRESENTA: los taps se ignoran, no se encolan */
    var pasos = 0;                 /* micropasadas dadas en TRABAJO (hacen falta 2) */
    var idPista = 0;
    var idResize = 0;              /* antirrebote del recolocado tras girar la pantalla */
    var pistaDicha = false;
    /* La faena en curso: qué utensilio acertó y si el acierto fue limpio. Vive
       aquí y no se pasa de función en función porque lo consultan los tres
       listeners de puntero, que no reciben argumentos del juego. */
    var faena = null;

    /* Gesto de frotado en curso (TRABAJO, escena mancha). El rect se cachea en
       el pointerdown y NO se relee en el pointermove: presupuesto F0 §0.10.2. */
    var frote = null;

    /* Guarda anti-carrera: el alumno puede haber cerrado el modal a mitad de
       cualquier animación. Toda devolución de llamada pregunta antes de tocar
       el DOM (retos.js:714-716). */
    function vivo() {
      if (m.vivo && !m.vivo()) return false;
      return raiz.isConnected !== false;
    }

    /* Camino ÚNICO de los anuncios: la región .reto-vivo la escribe la
       infraestructura y ningún juego crea la suya. */
    function anunciar(s) { if (m.anunciar) m.anunciar(s); }

    /* Cuánto paga DE VERDAD una victoria limpia de ESTA partida: los `BONUS` XP
       jugando la misión, el 10 % de esa misión si quien abrió el reto fue la sala
       de retos, y CERO si allí esa pregunta ya se cobró o si esto es un examen.
       El juego no puede deducirlo —lo hacía con `!m.examen` y por eso cantaba
       «+5 XP» donde se pagaban 3—: se lo pregunta al montaje. La guarda es la de
       `anunciar`, por si alguna vez se juega contra un retos.js más antiguo,
       donde la misión pagaba su bonus y el examen no pagaba nada. */
    function premio(limpio) {
      if (!limpio) return 0;
      return m.premia ? m.premia() : (m.examen ? 0 : BONUS);
    }

    function luego(ms, fn) {
      var id = setTimeout(function () { if (vivo()) fn(); }, ms);
      timers.push(id);
      return id;
    }

    /* Los timeouts, el arrastre y los listeners propios mueren con el modal:
       sin esto, cerrar a mitad de la cascada dispararía un resolver() sobre una
       caja que ya no existe, o dejaría a MFDrag escuchando en <body> para
       siempre. Y `ocupado` se queda en true, que es lo que impide que un
       veredicto tardío conceda un «limpio» que el alumno no se ganó. */
    if (m.alCerrar) {
      m.alCerrar(function () {
        for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
        timers.length = 0;
        if (idResize) { clearTimeout(idResize); idResize = 0; }
        /* El listener del resize vive en `window`, o sea que sobrevive al modal:
           sin quitarlo, cada partida dejaría uno más escuchando para siempre. */
        window.removeEventListener("resize", alRedimensionar);
        if (control) { control.destruir(); control = null; }
        ocupado = true;
      });
    }

    /* ------------------------------------------------------------ la pantalla */

    var raiz = document.createElement("div");
    raiz.className = "reto-herr";
    raiz.setAttribute("data-escena", idEscena);
    raiz.setAttribute("data-estado", "presenta");

    /* DIV y no P: `tarjeta.html` viene de Markdown y casi siempre trae ya su
       propio <p>; anidarlo dentro de otro <p> es HTML inválido y el navegador
       lo rompería en dos párrafos con márgenes de más. */
    var enunciado = document.createElement("div");
    enunciado.className = "reto-herr-enunciado";
    enunciado.innerHTML = (m.tarjeta && m.tarjeta.html) || "";
    raiz.appendChild(enunciado);

    /* La zona de MFDrag envuelve ESCENA + REPISA y deja fuera el enunciado y el
       panel de feedback. No es cosmética: MFDrag pone la zona en
       `touch-action: none` (mfdrag.js:94) y, si la zona fuese toda la raíz, en
       un móvil bajo no habría forma de deslizar el cuerpo del modal para leer
       el feedback que se abre debajo. */
    var zona = document.createElement("div");
    zona.className = "reto-herr-zona";
    raiz.appendChild(zona);

    var escena = document.createElement("div");
    escena.className = "reto-herr-escena";
    escena.setAttribute("data-escena", idEscena);
    zona.appendChild(escena);

    /* El verbo concreto de la escena vive AQUÍ y no en el banner de la barra:
       la escena se decide al abrir y el banner se fija en el registro. El juego
       JAMÁS escribe en `.reto-banner` (es DOM de la infraestructura, y
       reescribirlo dejaría la invitación diciendo una palabra y el modal
       otra). */
    var chip = document.createElement("span");
    chip.className = "reto-herr-verbo";
    chip.textContent = E.verbo;
    escena.appendChild(chip);

    /* --- el cofre, solo en su escena: lámina recortada sobre el suelo ------- */
    var cofre = null, cofreFig = null, haz = null;
    if (esCofre) {
      /* Sombra de contacto: una lámina recortada sobre un suelo dibujado flota
         sin ella. Va como nodo hermano ANTES de la figura (un ::after con
         z-index negativo se colaría bajo el fondo de la escena). */
      var sombra = document.createElement("span");
      sombra.className = "reto-herr-sombra";
      sombra.setAttribute("aria-hidden", "true");

      cofre = document.createElement("span");
      cofre.className = "reto-herr-cofre";
      cofre.setAttribute("data-estado", "cerrado");
      /* Las rutas de cada estado viajan en el dataset: es lo que lee
         `montaje.sprite()` para intercambiar la lámina (retos.js:514-521). */
      cofre.setAttribute("data-lamina-cerrado", L.cofre);
      cofre.setAttribute("data-lamina-abierto", L.cofreAb);
      /* La proporción REAL, para que el CSS derive de ella lo que necesite; se
         recorrige con la lámina ya cargada. */
      cofre.style.setProperty("--herr-cofre-ratio", String(RATIO_COFRE));
      /* La sombra cuelga de la CAJA DEL COFRE y no de la escena: sus dos medidas
         (`top: var(--herr-cofre-base)` y `width: 62%`) están calibradas en
         porcentaje del COFRE, y colgada de la escena se resolvían contra los
         200 px del rincón — salía 38 px más ancha que el arcón y con su centro
         12 px por debajo de la línea de apoyo, o sea una sombra despegada del
         objeto al que pertenece. Medido en pantalla antes de moverla, y es
         además el árbol que declara el contrato de game.css. */
      cofre.appendChild(sombra);
      cofreFig = ilustrar(cofre, L.cofre, "reto-herr-cofre__fig", true, function (r) {
        if (r > 0) cofre.style.setProperty("--herr-cofre-ratio", r.toFixed(3));
      });
      escena.appendChild(cofre);
    }

    /* --- el objetivo: wrapper (sitio y latido) + figura (sprite) ------------ */
    var objetivo = document.createElement("div");
    objetivo.className = "reto-herr-objetivo reto-herr-objetivo--" + (esCofre ? "candado" : "mancha");
    objetivo.setAttribute("role", "button");
    objetivo.setAttribute("aria-label", E.diana);
    objetivo.setAttribute("data-estado", E.est0);
    objetivo.setAttribute("data-lamina-" + E.est0, E.lam0);
    objetivo.setAttribute("data-lamina-" + E.est1, E.lam1);
    var objetivoFig = ilustrar(objetivo, E.lam0, "reto-herr-objetivo__fig", true);
    /* El candado cuelga de la caja DEL COFRE, no de la escena: devuelva la API
       la proporción que devuelva, sigue colgando de la hasp (§A.4). */
    (esCofre ? cofre : escena).appendChild(objetivo);

    if (esCofre) {
      /* El haz es LUZ, no un objeto: no se arrastra, no se toca y no cambia de
         estado, así que la regla del titular no lo alcanza y sigue siendo CSS. */
      haz = document.createElement("span");
      haz.className = "reto-herr-haz";
      haz.setAttribute("aria-hidden", "true");
      escena.appendChild(haz);
    }

    /* En reposo el objetivo late; con movimiento reducido, la hoja pone un
       contorno punteado estático en su lugar (§11.6). La clase se pone en los
       DOS casos a propósito: el apagado global de styles.css:103-106 ya mata la
       animación con !important, y la regla de movimiento reducido cuelga
       precisamente de esta clase — sin ella el objetivo se quedaba sin ninguna
       señal de «soy yo», que es justo lo que el checklist prohíbe. */
    objetivo.classList.add("reto-herr-objetivo--late");

    /* --- la repisa --------------------------------------------------------- */
    var repisa = document.createElement("div");
    repisa.className = "reto-herr-repisa";
    repisa.setAttribute("data-n", String(n));
    zona.appendChild(repisa);

    /* Reparto del punto de color: barajado en cada montaje y sin relación
       ninguna con la corrección. Con dos utensilios se usan los dos primeros. */
    var colores = LAZOS.slice(0);
    for (var b = colores.length - 1; b > 0; b--) {
      var j = Math.floor(Math.random() * (b + 1));
      var tmp = colores[b]; colores[b] = colores[j]; colores[j] = tmp;
    }

    var utiles = [];
    var k;
    for (k = 0; k < n; k++) utiles.push(crearUtil(ops[k], k));

    function crearUtil(o, i) {
      var corta = (o && typeof o.corta === "string") ? o.corta.replace(/^\s+|\s+$/g, "") : "";
      if (!corta) corta = textoPlano(o && o.html).slice(0, 24);   /* red por si el censo va a medias */

      /* <button> nativo: es enfocable de nacimiento, entiende `disabled` y
         MFDrag lo respeta sin añadirle tabindex ni role (mfdrag.js:165-176). */
      var slot = document.createElement("button");
      slot.type = "button";
      slot.className = "reto-herr-util";
      slot.setAttribute("data-k", String(i));
      /* La placa ya dice el texto, pero el aria-label explícito cubre el caso
         de que se recorte a dos líneas y el de la lámina sin cargar. */
      slot.setAttribute("aria-label", corta);

      /* Sprite, punto de color y placa cuelgan DIRECTAMENTE del slot: el traje
         de la fase los coloca con `.reto-herr-util` en columna y los atenúa con
         selectores de hijo (`.reto-herr-util--gastado > .reto-herr-placa`).
         Un envoltorio intermedio, por cómodo que fuera para las animaciones,
         rompería las dos cosas de golpe. */
      var sprite = ilustrar(slot, E.utensilio,
        "reto-herr-sprite" + (esCofre ? " reto-herr-sprite--llave" : ""), false);
      /* El giro de la llave se escribe SIEMPRE compuesto sobre la base, aunque
         hoy la base sea 0: así el día que la lámina cambie de orientación no
         hay dos sitios que corregir. */
      if (esCofre) sprite.style.transform = "rotate(" + LLAVE_BASE + "deg)";

      var lazo = document.createElement("span");
      lazo.className = "reto-herr-lazo";
      lazo.setAttribute("aria-hidden", "true");
      lazo.style.background = colores[i % colores.length];
      slot.appendChild(lazo);

      var placa = document.createElement("span");
      placa.className = "reto-herr-placa" + (corta.length > PLACA_LARGA ? " reto-herr-placa--larga" : "");
      placa.textContent = corta;
      slot.appendChild(placa);

      var u = {
        slot: slot, sprite: sprite, placa: placa,
        corta: corta, correcta: !!(o && o.correct), i: i
      };

      repisa.appendChild(slot);
      /* Reapertura tras abandono: los utensilios que ya se gastaron siguen
         gastados. */
      if (mem.falladas[i]) gastar(u, true);
      return u;
    }

    /* Con movimiento reducido el resultado tiene que poder LEERSE: la escena
       final quieta no basta como única señal (§11.6). */
    function resultado(txt) {
      var p = document.createElement("p");
      p.className = "reto-resultado";
      p.textContent = txt;
      raiz.appendChild(p);
    }

    m.cuerpo.appendChild(raiz);

    /* La prueba de existencia de las láminas vive en la infraestructura: el
       veredicto es POR RUTA y de módulo (retos.js:444-507), así que se comparte
       entre piezas, partidas y aperturas del modal. No se espera su promesa —la
       escena ya está montada y cada <img> lleva su reserva—, pero llamarla al
       montar es OBLIGATORIO: es la única tabla que `montaje.sprite()` consulta,
       y sin ella el primer intercambio pediría red justo en el frame del
       impacto, el único que el alumno mira. */
    if (m.precargar) {
      m.precargar(esCofre
        ? [L.llave, L.candado, L.abierto, L.cofre, L.cofreAb, L.pergamino]
        : [L.pano, L.mancha, L.frotada]);
    }

    function estado(s) { raiz.setAttribute("data-estado", s); }

    /* PRESENTA → ESPERA. La caja del modal tarda 220 ms en subir (animación de
       la casa); el juego no añade teatro propio, solo espera a que pare. */
    luego(quieto ? 0 : MS_ENTRADA, function () {
      ocupado = false;
      estado("espera");
      anunciar(T.abre);
    });

    /* ------------------------------------------------ estado y anti-mash (§4) */

    function utilDe(el) {
      for (var i = 0; i < utiles.length; i++) { if (utiles[i].slot === el) return utiles[i]; }
      return null;
    }

    function correcta() {
      for (var i = 0; i < utiles.length; i++) { if (utiles[i].correcta) return utiles[i]; }
      return null;
    }

    /* Deshabilitar el elemento que TIENE el foco lo manda a <body>, y ahí la
       trampa de foco de retos.js ya no puede hacer nada: escucha los Tab en la
       caja del modal, y desde <body> las teclas ni le llegan. Sin este rescate,
       quien juega con teclado se va de paseo por la misión de debajo justo
       después de fallar (tameshiwari.js:437-448). */
    function rescatarFoco() {
      var libres = repisa.querySelectorAll(".reto-herr-util:not([data-gastado])");
      var destino = libres.length ? libres[0] : (m.caja && m.caja.querySelector(".reto-modal__cerrar"));
      if (destino && destino.focus) { try { destino.focus(); } catch (e) { /* nada */ } }
    }

    /* Gastado = INERTE de verdad. `disabled` y no solo una clase: un <button>
       es enfocable de nacimiento, así que el teclado seguiría llegando a un
       utensilio que ya no juega. El atributo `data-gastado` es además lo que lo
       saca del selector de MFDrag, que delega con `closest()` en cada
       pointerdown (mfdrag.js:303) y reevalúa el `:not()` solo. */
    function gastar(u, callado) {
      var teniaFoco = (document.activeElement === u.slot);
      u.slot.setAttribute("data-gastado", "");
      /* La clase trae la atenuación de los hijos Y la insignia ✗ del `::after`
         (game.css): el estado nunca depende solo del color, y el aspa la pinta
         la hoja para que no haya dos ✗ si algún día el JS pintara el suyo. */
      u.slot.classList.add("reto-herr-util--gastado");
      u.slot.setAttribute("aria-disabled", "true");
      u.slot.disabled = true;
      if (teniaFoco && !callado) rescatarFoco();
    }

    /* ------------------------------------------------------- el juicio (§3) - */

    /* MFDrag lleva la pieza al centro del destino siempre que el veredicto sea
       "encaja" (mfdrag.js:271-277 y :287-296), tanto con el dedo como con el
       tocar-tocar y el teclado. Por eso las dos rutas devuelven lo mismo y el
       juicio entero vive en `alEncajado`: es el único instante en que el
       utensilio ya está SOBRE el objetivo, y es lo que hace que arrastrar y
       tocar sean equivalentes —mismos tiempos, mismos veredictos, mismos
       anuncios—, como exige el gate. */
    function aceptarToque(pieza, destino) {
      /* El estado manda además del flag: en TRABAJO `ocupado` está en false —el
         objetivo tiene que responder a las micropasadas— y el teclado sigue
         llegando a la repisa aunque el puntero esté apagado. Sin esta guarda,
         un Enter sobre un utensilio a mitad de frotado abriría un juicio nuevo
         sobre una partida ya decidida. */
      if (ocupado || !destino || raiz.getAttribute("data-estado") !== "espera") return "vuelve";
      var u = utilDe(pieza);
      if (!u || u.slot.hasAttribute("data-gastado")) return "vuelve";
      ocupado = true;
      estado("viaje");
      return "encaja";
    }

    function alEncajado(pieza) {
      var u = utilDe(pieza);
      if (!u || !vivo()) return;
      /* La partida ya rematada EN VIVO: soltar solo asienta la herramienta
         ganadora sobre el objetivo, sin abrir un segundo juicio. */
      if (overHecho) {
        u.slot.classList.add("reto-herr-util--encajada");
        u.slot.style.zIndex = "6";
        return;
      }
      /* MFDrag lleva el CENTRO del slot al centro del objetivo, y los dientes
         de la llave no están en ese centro. Esta clase enciende el ajuste fino
         (`--herr-llave-dx/dy`, calibrado sobre la lámina real) para que el giro
         pivote DENTRO de la bocallave. Se quita al volver a la repisa: en la
         balda, la llave tiene que estar donde estaba. */
      u.slot.classList.add("reto-herr-util--encajada");
      /* Y por encima del objetivo. MFDrag alza la pieza con `.mfdrag-vuelo`
         (z-index 4) pero se la quita al terminar el viaje (mfdrag.js:117-121),
         y el objetivo lleva z-index 2: sin este empujón, el paño que el alumno
         acaba de dejar sobre la mancha —y que va a frotar durante los dos
         pasos siguientes— queda pintado DEBAJO de ella. Es estructural, no
         estética: la pieza con la que se trabaja tiene que verse. */
      u.slot.style.zIndex = "6";
      juicio(u);
    }

    /* ============== EL TRABAJO EN VIVO (arrastre sin soltar) ==============
       Rediseño del titular (2026-09-01): en MISIÓN ya no se suelta la
       herramienta sobre el problema para después tocarlo dos veces. Se agarra
       y, SIN SOLTAR, mientras la correcta pasea sobre el área válida la faena
       avanza sola por las etapas de siempre —la llave gira en dos tiempos, la
       mancha se emborrona y se limpia—. La incorrecta NO reacciona: ni
       feedback ni intento gastado. CONSECUENCIA ASUMIDA y a la vista: en
       misión este juego ya no tiene fallo, así que el bonus de primera queda
       casi regalado (limpio = primera rematada).
       EL EXAMEN NO CAMBIA: allí soltar sigue siendo el juicio y la incorrecta
       sigue suspendiendo — un examen donde la incorrecta «no hace nada» se
       resolvería paseando utensilios hasta que uno reaccione.
       El camino por toques y teclado conserva el flujo clásico entero
       (aceptarToque → juicio → trabajo con dos toques): es la alternativa sin
       arrastre, y este bloque solo existe dentro del gesto.
       Si se suelta fuera antes de rematar, el avance ganado SE CONSERVA
       (faenaViva.etapa) y se retoma en la siguiente pasada; solo la llave
       vuelve a su ángulo de reposo para que la balda no enseñe una llave
       torcida. */
    var faenaViva = { u: null, etapa: 0, dentro: false };
    var overHecho = false;       /* la faena en vivo ya remató: partida decidida */
    var cajaObjetivo = null;     /* rect del objetivo en px CSS de la zona (se cachea por gesto) */

    /* LA VOZ DE LA FAENA (titular 2026-09-02): mientras la herramienta
       correcta trabaja sobre el objetivo, la llave traquetea en la cerradura
       o el cepillo frota la madera — un bucle de ~430 ms que respira con la
       animación. Nace al entrar en el objetivo, muere solo al salir, rematar
       o cerrar el modal (luego() ya muere con él), y cada vuelta pasa por el
       interruptor vía MFSonido.fx. Sin fábrica de fx, la faena trabaja muda
       como siempre (las etapas conservan su nota). */
    var FX_FAENA = esCofre ? "fx-llave-cerradura" : "fx-cepillo-madera";
    var faenaSonando = false;
    function sonidoFaena() {
      if (faenaSonando) return;
      faenaSonando = true;
      (function vuelta() {
        if (!vivo() || !faenaViva.dentro || overHecho ||
            raiz.getAttribute("data-estado") !== "espera") { faenaSonando = false; return; }
        if (window.MFSonido && MFSonido.fx) MFSonido.fx(FX_FAENA);
        luego(430, vuelta);
      })();
    }

    function rectObjetivoEnZona() {
      /* Misma moneda que las x,y de alMover (px CSS de la zona): el rect viene
         en px de pantalla y se divide por el zoom, que es la lección pagada con
         el 20 % de desvío (MFDrag.zoomDe existe justo para esto). */
      var k = (window.MFDrag && MFDrag.zoomDe) ? MFDrag.zoomDe(zona) : 1;
      if (!(k > 0)) k = 1;
      var rz = zona.getBoundingClientRect();
      var ro = objetivo.getBoundingClientRect();
      return { l: (ro.left - rz.left) / k, t: (ro.top - rz.top) / k,
               r: (ro.right - rz.left) / k, b: (ro.bottom - rz.top) / k };
    }

    function enMovimiento(pieza, x, y) {
      if (m.examen || overHecho || ocupado) return;
      if (raiz.getAttribute("data-estado") !== "espera") return;
      var u = utilDe(pieza);
      if (!u || !u.correcta) return;               /* la incorrecta no reacciona */
      if (!cajaObjetivo) cajaObjetivo = rectObjetivoEnZona();
      var dentro = x >= cajaObjetivo.l && x <= cajaObjetivo.r &&
                   y >= cajaObjetivo.t && y <= cajaObjetivo.b;
      if (dentro === faenaViva.dentro && faenaViva.u === u) return;
      faenaViva.u = u;
      faenaViva.dentro = dentro;
      if (dentro) {
        if (esCofre && faenaViva.etapa > 0) girarLlaveU(u, faenaViva.etapa);
        if (esCofre && !quieto) reanimar(objetivoFig, "reto-herr-traqueteo");
        sonidoFaena();
        programarPasoVivo();
      } else if (esCofre) {
        objetivoFig.classList.remove("reto-herr-traqueteo");
      }
    }

    function programarPasoVivo() {
      luego(MS_SOBRE, function () {
        if (!vivo() || overHecho || !faenaViva.dentro) return;
        if (raiz.getAttribute("data-estado") !== "espera") return;
        var u = faenaViva.u;
        faenaViva.etapa++;
        if (window.MFSonido && MFSonido.nota) {
          MFSonido.nota(E.nota, { tipo: "triangle", attack: 8, decay: 120, gain: 0.15 });
        }
        if (faenaViva.etapa === 1) {
          /* Primera etapa: el mismo micropago del flujo clásico (paso 1). */
          if (esCofre) girarLlaveU(u, 1);
          else {
            if (m.sprite) m.sprite(objetivo, E.est1);
            if (!quieto) {
              objetivoFig.style.transition = "transform " + MS_PASADA + "ms ease-out";
              objetivoFig.style.transform = "scale(0.86)";
            }
          }
          programarPasoVivo();
          return;
        }
        /* Segunda etapa: el remate. La llave completa su medio giro ANTES del
           hit-stop de transformar, igual que en el flujo clásico. */
        overHecho = true;
        ocupado = true;
        if (esCofre) objetivoFig.classList.remove("reto-herr-traqueteo");
        mem.intentos++;
        var limpio = u.correcta && mem.intentos === 1;
        u.slot.style.zIndex = "6";
        repisa.style.pointerEvents = "none";
        faena = { u: u, limpio: limpio };
        if (esCofre) {
          girarLlaveU(u, 2);
          luego(quieto ? 0 : MS_GIRO, function () { if (vivo()) transformar(u, limpio); });
        } else {
          transformar(u, limpio);
        }
      });
    }

    function aceptarSuelto(pieza, destino) {
      cajaObjetivo = null;         /* el siguiente gesto vuelve a medir (rotar, crecer) */
      if (overHecho) {
        var ug = utilDe(pieza);
        return (ug && faenaViva.u === ug) ? "encaja" : "vuelve";
      }
      if (!m.examen) {
        /* Misión: nada se suelta encima — el trabajo ocurre EN VIVO. */
        var u0 = utilDe(pieza);
        if (u0 && esCofre && faenaViva.u === u0) girarLlaveU(u0, 0);
        if (esCofre) objetivoFig.classList.remove("reto-herr-traqueteo");
        faenaViva.dentro = false;
        return "vuelve";
      }
      return aceptarToque(pieza, destino);
    }

    /* ARMADO: la anticipación va SIEMPRE entre la decisión y el veredicto,
       nunca antes de decidir — si avisara antes, el aviso sería la respuesta. */
    function juicio(u) {
      estado("juicio");
      objetivo.classList.remove("reto-herr-objetivo--late");
      mem.intentos++;
      var limpio = u.correcta && mem.intentos === 1;

      if (window.MFJuice && MFJuice.anticipar) MFJuice.anticipar(u.sprite, E.armado);
      if (esCofre && !quieto) reanimar(objetivoFig, "reto-herr-traqueteo");

      luego(quieto ? 0 : E.armado, function () {
        if (esCofre) objetivoFig.classList.remove("reto-herr-traqueteo");
        if (u.correcta) trabajo(u, limpio);
        else if (m.examen) examenFallo(u);
        else fallo(u);
      });
    }

    /* ------------------------------------------------------ TRABAJO (§3, §4) -

       El veredicto ya está dado: lo que viene son las dos micropasadas que
       convierten «he elegido bien» en «lo he hecho». No tocan `limpio` ni el
       resultado; si el alumno cerrara el modal aquí, la partida cuenta como
       abandono, igual que en cualquier otro estado. */
    function trabajo(u, limpio) {
      estado("trabajo");
      pasos = 0;
      /* Solo el objetivo es tocable: la repisa se apaga por estilo en línea
         porque de eso depende la MECÁNICA (un tap perdido en un utensilio
         durante el frotado abriría un juicio nuevo), y lo que gana a todo tiene
         que ser un invariante, no un gusto. */
      repisa.style.pointerEvents = "none";
      /* Y fuera del tabulador: apagar el puntero no apaga el teclado, y un Tab
         hasta la repisa dejaría al alumno eligiendo utensilios que ya no
         pintan nada. No hace falta deshacerlo: de TRABAJO solo se sale
         ganando. `tabindex` y no `disabled` porque no están gastados —no se
         han probado— y no deben leerse como tales. */
      for (var q = 0; q < utiles.length; q++) utiles[q].slot.setAttribute("tabindex", "-1");
      if (control) control.elegir(null);

      objetivo.setAttribute("tabindex", "0");
      objetivo.setAttribute("aria-label", E.diana + ". " + E.pista);
      /* Rescate de foco: MFDrag retira el tabindex de los destinos al empezar
         el viaje (mfdrag.js:284) y eso manda el foco a <body>. Sin esta línea,
         quien juega con teclado no puede ni frotar ni girar. Tras un gesto con
         el dedo no se ve nada: la casa pinta el anillo con :focus-visible. */
      try { objetivo.focus(); } catch (e) { /* nada */ }

      faena = { u: u, limpio: limpio };
      anunciar(T.correcto.replace("{c}", u.corta) + E.pista);
      ocupado = false;
      armarPista();
    }

    /* Sin acción durante 4 s, el objetivo vuelve a latir y —solo la primera
       vez, para no ametrallar al lector de pantalla— se repite la instrucción. */
    function armarPista() {
      if (idPista) clearTimeout(idPista);
      idPista = luego(MS_PISTA, function () {
        if (raiz.getAttribute("data-estado") !== "trabajo") return;
        objetivo.classList.add("reto-herr-objetivo--late");
        if (!pistaDicha) { pistaDicha = true; anunciar(E.pista); }
        armarPista();
      });
    }

    function pararPista() {
      if (idPista) { clearTimeout(idPista); idPista = 0; }
      objetivo.classList.remove("reto-herr-objetivo--late");
    }

    /* Una micropasada: frotar (mancha) o girar (cofre). La primera da su
       micropago —intercambio de lámina o giro de 45°— y la segunda dispara la
       transformación. */
    function paso() {
      if (ocupado || !faena || raiz.getAttribute("data-estado") !== "trabajo") return;
      pasos++;
      pararPista();

      if (window.MFSonido && MFSonido.nota) {
        MFSonido.nota(E.nota, { tipo: "triangle", attack: 8, decay: 120, gain: 0.15 });
      }

      if (pasos === 1) {
        if (esCofre) girarLlave(1);
        else {
          /* El estado intermedio es un SPRITE, no una opacidad: la mancha no
             encoge, se emborrona, y las estrías del frotado son otro dibujo. Si
             la lámina no se precargó bien, `sprite()` devuelve false y el paso
             intermedio simplemente no se ve: la partida sigue igual. */
          if (m.sprite) m.sprite(objetivo, E.est1);
          if (!quieto) {
            objetivoFig.style.transition = "transform " + MS_PASADA + "ms ease-out";
            objetivoFig.style.transform = "scale(0.86)";
          }
          if (window.MFJuice && MFJuice.particulas) {
            var p1 = puntoDe(objetivo);
            MFJuice.particulas(m.escenario, {
              x: p1.x, y: p1.y, n: 6, angulo: -90, dispersion: 60, dist: [30, 60],
              dur: [350, 500], colores: ["#12131a", "#7b3fbf"], forma: "chispa"
            });
          }
        }
        armarPista();
        return;
      }

      if (pasos >= 2) {
        ocupado = true;
        if (!esCofre) { transformar(faena.u, faena.limpio); return; }
        /* La llave completa su medio giro ANTES del hit-stop, y no a la vez:
           `.juice-hitstop *` congela las transiciones con !important, así que
           lanzar las dos juntas haría que el segundo giro saltara a −90° de un
           frame y el gesto se perdiera justo en el instante clave. */
        girarLlave(2);
        luego(quieto ? 0 : MS_GIRO, function () { transformar(faena.u, faena.limpio); });
      }
    }

    /* θ = +45° × n. El SIGNO no es un detalle de gusto: lo fija el criterio de
       aceptación de la ficha (§A.6, «la llave gira sobre sus dientes y el ojo
       barre hacia ARRIBA»; hacia abajo lee «se cayó», que es justo el fallo que
       §13.11 manda vigilar). Con el pivote en los dientes —extremo DERECHO de
       esta lámina horizontal— el ojo queda a la IZQUIERDA del pivote, y en
       coordenadas de pantalla (y hacia abajo) un `rotate` POSITIVO lo sube:
       (−r, 0) con θ=+90° va a (0, −r). El −45° que escribe §A.4 lo hunde. Medido
       además en el navegador con la lámina real a ±90°.
       El giro va en la FIGURA porque el `transform` del slot es de MFDrag
       (viaje y encaje) y escribir ahí se lo pisaría. */
    function girarLlaveU(u, nGiros) {
      if (!u || !u.sprite) return;
      u.sprite.style.transition = quieto ? "" : ("transform " + MS_GIRO + "ms ease-out");
      u.sprite.style.transform = "rotate(" + (LLAVE_BASE + 45 * nGiros) + "deg)";
    }
    function girarLlave(nGiros) { girarLlaveU(faena && faena.u, nGiros); }

    /* Origen de los efectos: centro del objetivo en coordenadas del escenario.
       UNA lectura de layout justo antes de cada efecto, nunca dentro de un
       bucle de puntero. */
    function puntoDe(el) {
      var re = m.escenario ? m.escenario.getBoundingClientRect() : null;
      if (!re) return { x: 0, y: 0 };
      var r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - re.left, y: r.top + r.height / 2 - re.top };
    }

    /* -------------------------------------------- TRANSFORMA · acierto (§5) - */

    function transformar(u, limpio) {
      estado("transforma");
      pararPista();
      /* El tabindex NO se retira: quitárselo al elemento que tiene el foco lo
         mandaría a <body> justo cuando empieza la celebración, y desde ahí la
         trampa de foco del modal ya no alcanza. */
      var p = puntoDe(objetivo);
      var racha = limpio;   /* variante local: a la primera, cosecha y sello suben */

      /* La cascada es la MISMA con y sin movimiento reducido: lo que cambia es
         que los tiempos se comprimen a 0 y que los efectos del kit resuelven
         solos sin crear nada. Las clases de estado (`reto-herr-estalla`,
         `reto-herr-cae`, `reto-herr-haz--on`, el pergamino) llevan su ESTADO
         FINAL escrito en la hoja para ese caso, así que el alumno ve la escena
         resuelta aunque no se mueva ni un píxel. Un camino aparte volvería a
         separarse del bueno en la primera corrección. */
      if (window.MFJuice && MFJuice.hitstop) MFJuice.hitstop(m.caja, esCofre ? 80 : 70);
      if (esCofre) cascadaCofre(u, limpio, racha, p);
      else cascadaMancha(u, limpio, racha, p);

      /* El cobro solo vuela si el bonus es de verdad: en examen no existe
         —`mission.js` lo cobra con `!isExam` (§0.8.1) y el examen entrega por
         `completeExam`— y desde la sala de retos puede valer menos, o nada. Con
         `paga` en 0 no vuela nada: prometer un XP que jamás llega era justo el
         error que esto viene a arreglar. Se pregunta UNA vez y el mismo número
         manda sobre el vuelo y sobre el texto de abajo. */
      var paga = premio(limpio);
      if (paga) {
        luego(quieto ? 0 : (esCofre ? 800 : 650), function () {
          if (window.MFJuice && MFJuice.volarXP) MFJuice.volarXP(objetivo, paga);
        });
      }

      /* El mismo criterio —y la misma cifra— mandan en el texto: lo que anuncia
         el lector de pantalla no puede prometer un XP que la pantalla no promete,
         ni un número distinto del que vuela. */
      var txt = E.gana + (paga ? " +" + paga + " XP" : "");
      anunciar(txt);
      /* Con movimiento reducido el resultado tiene que poder LEERSE: la escena
         final quieta no basta como única señal (§11.6). */
      if (quieto) resultado(txt);

      luego(quieto ? 200 : (esCofre ? 1200 : 1150), function () {
        estado("resuelto");
        m.resolver({ limpio: limpio, intentos: mem.intentos, ms: Math.round(ahora() - t0) });
      });
    }

    function cascadaMancha(u, limpio, racha, p) {
      luego(quieto ? 0 : 70, function () {
        /* La mancha no encoge: ESTALLA y se va. La clase trae la animación y,
           con movimiento reducido, su estado final (opacidad 0). */
        objetivoFig.classList.add("reto-herr-estalla");
        if (window.MFJuice && MFJuice.particulas) {
          MFJuice.particulas(m.escenario, {
            x: p.x, y: p.y, n: racha ? 12 : 8, angulo: -90, dispersion: 70,
            dist: [40, 90], dur: [450, 650],
            colores: ["#12131a", "#7b3fbf", "#f7f3ec"], forma: "chispa"
          });
        }
        if (window.MFJuice && MFJuice.destello) {
          MFJuice.destello(m.escenario, p.x, p.y, { radio: 60, color: "rgba(255,215,120,.9)" });
        }
      });

      luego(quieto ? 0 : 90, function () {
        /* El shoji «respira limpio». El filtro va en la ESCENA —un fondo plano,
           fuera de la regla de las láminas— y no sobre ningún objeto. Con
           movimiento reducido se salta entero: sin transición que lo suavice,
           un cambio de brillo de golpe es un destello, justo lo que esa
           preferencia pide evitar. */
        if (!quieto) {
          escena.style.transition = "filter 250ms ease-out";
          escena.style.filter = "brightness(1.12)";
          luego(250, function () { escena.style.filter = ""; });
        }
        if (window.MFJuice && MFJuice.squash) MFJuice.squash(u.sprite);
      });

      luego(quieto ? 0 : 340, function () {
        if (window.MFJuice && MFJuice.sello) {
          MFJuice.sello(m.escenario, E.sello, racha ? { color: "var(--belt-yellow)" } : null);
        }
        if (window.MFSonido) {
          if (MFSonido.arpegio) MFSonido.arpegio();
          if (MFSonido.vibrar) MFSonido.vibrar(E.vibra);
        }
      });
    }

    function cascadaCofre(u, limpio, racha, p) {
      luego(quieto ? 0 : 80, function () {
        /* El candado se abre: intercambio de lámina, sin transición, y 120 ms
           quieto para que se lea antes de caer. */
        if (m.sprite) m.sprite(objetivo, E.est1);
      });

      luego(quieto ? 0 : 200, function () {
        /* Y cae: la lámina ENTERA, un solo nodo en movimiento (gama baja). */
        objetivoFig.classList.add("reto-herr-cae");
        /* El haz se enciende por CLASE y no por opacidad en línea: así su
           estado final también existe con movimiento reducido. */
        if (haz) haz.classList.add("reto-herr-haz--on");
        abrirCofre();
      });

      luego(quieto ? 0 : 300, function () {
        subirPergamino();
        if (window.MFJuice && MFJuice.particulas) {
          MFJuice.particulas(m.escenario, {
            x: p.x, y: p.y - 20, n: racha ? 12 : 10, angulo: -90, dispersion: 45,
            dist: [50, 90], dur: [500, 650],
            colores: ["#f2c230", "#f7f3ec"], forma: "estrella"
          });
        }
        if (window.MFJuice && MFJuice.destello) {
          MFJuice.destello(m.escenario, p.x, p.y - 20, { radio: 60 });
        }
      });

      luego(quieto ? 0 : 380, function () {
        if (window.MFSonido) {
          if (MFSonido.arpegio) MFSonido.arpegio();
          if (MFSonido.vibrar) MFSonido.vibrar(E.vibra);
        }
      });
      /* La campana llega 350 ms después del arpegio: es el remate ceremonial,
         no un acorde más. El sonido NO es movimiento, así que suena igual con
         movimiento reducido (y solo si el alumno encendió el interruptor). */
      luego(quieto ? 150 : 730, function () { if (window.MFSonido && MFSonido.campana) MFSonido.campana(); });

      luego(quieto ? 0 : 520, function () {
        if (window.MFJuice && MFJuice.sello) {
          MFJuice.sello(m.escenario, E.sello, racha ? { color: "var(--belt-yellow)" } : null);
        }
      });
    }

    /* El cofre no se «estira»: se ABRE, y eso es un intercambio de lámina. La
       clase del rebote va en la FIGURA y no en la caja (ver cabecera): en la
       caja, el `scale()` del keyframe borraría su `translateX(-50%)` y el cofre
       daría un salto lateral en mitad de la apertura. */
    function abrirCofre() {
      /* Sin la lámina del cofre en su sitio no hay nada que abrir: si su
         `onerror` la sustituyó por el hueco de papel, el `.reto-pieza` que
         encontraría `montaje.sprite()` dentro de esta caja sería el del CANDADO
         —vive aquí dentro— y le cambiaría el dibujo por el del arcón. */
      if (!cofre || !cofreFig || !cofreFig.parentNode) return;
      if (m.sprite) m.sprite(cofre, "abierto");   /* data-lamina-abierto del cofre */
      if (!quieto) reanimar(cofreFig, "reto-herr-cofre--abre");
    }

    /* Un solo nodo, y no dos: la hoja centra el pergamino con `margin-left` y
       deja `transform` libre para el keyframe que lo hace subir, así que no hay
       nada que separar. Es lámina reutilizada (herr-pergamino.webp, el antiguo home-pergaminos): coste 0.
       Si el archivo faltara, desaparece en silencio y la celebración sigue con
       el haz, las partículas y el sello. */
    function subirPergamino() {
      var img = document.createElement("img");
      img.className = "reto-herr-pergamino";
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      img.draggable = false;
      img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); };
      escena.appendChild(img);
      img.src = L.pergamino;
    }

    /* ---------------------------------------------------- FALLO cómico (§5) - */

    /* El utensilio equivocado no puede con la labor: se despanzurra o se dobla,
       vuelve a la repisa gastado y abre el feedback de ESA opción. El objetivo
       JAMÁS reacciona mal —no se enfada, no se agrieta—: el fallo es de la
       herramienta, nunca del alumno. */
    function fallo(u) {
      estado("fallo");
      mem.falladas[u.i] = true;
      comedia(u);
      cartelito();

      luego(quieto ? 0 : (MS_VUELTA + MS_TAMBALEO), function () {
        u.sprite.classList.remove(FALLOS[E.fallo]);
        gastar(u);
        /* Lo que ENSEÑA es el feedback escrito de ESA opción; el panel, el
           evento reto_fail y la cuenta de la repesca los pone la
           infraestructura. */
        m.fallar(u.i);
        /* Después del panel: `fallar` ya anuncia el feedback y esta línea deja
           como estado final del lector la instrucción de qué hacer ahora. */
        anunciar(T.falla);
        /* Repesca ilimitada y sin cronómetro (regla del titular). */
        estado("espera");
        objetivo.classList.add("reto-herr-objetivo--late");
        ocupado = false;
      });
    }

    /* La comedia del fallo, en DOS tiempos y no en uno, por una razón que se
       paga cara si se junta: el garnish del kit (`juice-fallo`) declara
       `0% { transform: translateX(0) }` y una animación gana SIEMPRE al estilo
       en línea, así que lanzado mientras el utensilio todavía está sobre el
       objetivo —con el `transform` que le escribió MFDrag— lo teletransportaría
       a la repisa de un frame y se comería la vuelta. Primero la deformación
       propia sobre el SPRITE y el regreso del slot; cuando el slot ya está en
       casa y sin transform, el tambaleo, las estrellitas y la nota grave del
       kit. Sin screenshake y sin vibración jamás: el fallo nunca castiga.

       Escribir `transform` en el slot deja desfasado el desfase interno de
       MFDrag (`__mfdragOff`), y es a propósito: la pieza queda GASTADA y no se
       arrastra nunca más, así que nadie parte de ese número. Con una pieza que
       siguiera jugando esto sería un error, no un atajo. */
    function comedia(u) {
      if (!quieto) reanimar(u.sprite, FALLOS[E.fallo]);
      u.slot.classList.remove("reto-herr-util--encajada");
      if (quieto) {
        u.slot.style.transform = "";
        if (window.MFJuice && MFJuice.fallo) MFJuice.fallo(u.slot, m.escenario);
        return;
      }
      u.slot.style.transition = "transform " + MS_VUELTA + "ms cubic-bezier(0.2, 0.8, 0.3, 1)";
      u.slot.style.transform = "";
      luego(MS_VUELTA, function () {
        u.slot.style.transition = "";
        u.slot.style.zIndex = "";        /* ya está en la balda: nada que superponer */
        if (window.MFJuice && MFJuice.fallo) MFJuice.fallo(u.slot, m.escenario);
      });
    }

    /* «Sigue ahí»: el fallo se cuenta con palabras y con una forma inclinada,
       jamás solo apagando la pieza. */
    function cartelito() {
      var viejo = objetivo.querySelector(".reto-herr-aguanta");
      if (viejo && viejo.parentNode) viejo.parentNode.removeChild(viejo);
      var c = document.createElement("span");
      /* Solo la clase de la fase: `.reto-cartel` (F0) coloca su cartelito a la
         derecha y con otro giro, y las dos juntas se pelearían por el mismo
         `top` sin que se vea quién gana. */
      c.className = "reto-herr-aguanta";
      c.textContent = T.aguanta;
      objetivo.appendChild(c);
      luego(MS_AGUANTA, function () { if (c.parentNode) c.parentNode.removeChild(c); });
    }

    /* ------------------------------------- EXAMEN · sin repesca (§10) ------- */

    /* El primer juicio decide. La herramienta equivocada hace su fallo cómico,
       se revela cuál era la buena —con ✓ en el texto, no solo con color— y se
       da tiempo de lectura antes de cerrar la ronda. El examen informa, no
       premia y no hace chistes de más. */
    function examenFallo(u) {
      estado("examen");
      mem.falladas[u.i] = true;
      comedia(u);

      luego(quieto ? 0 : (MS_VUELTA + MS_TAMBALEO), function () {
        u.sprite.classList.remove(FALLOS[E.fallo]);
        gastar(u);
        var c = correcta();
        if (c) {
          c.placa.classList.add("is-correct");
          c.placa.classList.add("reto-herr-placa--ok");
          c.placa.textContent = "✓ " + c.corta;
        }
        m.fallar(u.i);
        anunciar(T.fallaExamen.replace("{c}", c ? c.corta : ""));
        if (quieto) resultado(T.fallaExamen.replace("{c}", c ? c.corta : ""));

        luego(quieto ? 200 : MS_EXAMEN_LEE, function () {
          estado("resuelto");
          m.resolver({ limpio: false, intentos: 1, ms: Math.round(ahora() - t0) });
        });
      });
    }

    /* ------------------------------------------------- ARRASTRE Y TOQUES ---- */

    control = window.MFDrag ? MFDrag.crear({
      zona: zona,
      /* El `:not()` se reevalúa en cada pointerdown porque MFDrag delega con
         closest(): marcar `data-gastado` basta para que el utensilio deje de
         agarrarse, sin tocar la configuración. */
      piezas: ".reto-herr-util:not([data-gastado])",
      destinos: ".reto-herr-objetivo",
      umbral: 6,
      /* Imán generoso: el objetivo es grande y la ficha prefiere que el gesto
         perdone. El solape sigue mandando sobre el imán (mfdrag.js:225-250). */
      iman: 60,
      limites: true,
      toques: true,                        /* obligatorio: WCAG 2.2 SC 2.5.7 */
      alAgarrar: function (p) {
        if (ocupado) return;
        /* El hundimiento va en el pointerdown, que es lo que separa «responde»
           de «va lento» (<100 ms). `.juice-presionado` es una clase con
           `transform` y el slot todavía no tiene el estilo en línea de MFDrag
           —se escribe en el primer pointermove—, así que aquí sí gana. */
        if (window.MFJuice && MFJuice.respuesta) MFJuice.respuesta(p);
      },
      /* Desde 2026-09-01 las dos rutas YA NO son equivalentes a propósito: el
         gesto trabaja EN VIVO (alMover) y soltar no juzga en misión; el camino
         por toques y teclado conserva el flujo clásico entero, y el examen usa
         el clásico por las dos rutas. */
      alMover: enMovimiento,
      alSoltar: aceptarSuelto,
      alTocar: aceptarToque,
      alEncajado: alEncajado
    }) : null;

    /* Girar la pantalla con el utensilio YA encajado lo dejaba fuera de la
       cerradura: el desfase que MFDrag le escribió está en píxeles, así que en
       cuanto el ancho cambia el objetivo se mueve y la pieza no (los probadores
       midieron 18 px de desajuste rotando 375 → 768 en pleno estado «trabajo»).
       Se vuelve a plantar en el centro de su destino, sin viaje ni veredicto:
       la partida sigue exactamente donde estaba. Solo mientras hay faena en
       curso —de la repisa se ocupa el layout, que no lleva desfase—, y con el
       mismo antirrebote de 150 ms que usan kintsugi y andamio, porque el resize
       llega en ráfaga. */
    function recolocarFaena() {
      if (!control || !control.recentrar || !faena || !faena.u) return;
      var e = raiz.getAttribute("data-estado");
      /* Solo los estados en los que el utensilio está SOBRE el objetivo. En
         «fallo» está volviendo a la repisa y su desfase ya se ha borrado: ahí
         recolocar lo plantaría de vuelta sobre la cerradura. */
      if (e !== "viaje" && e !== "juicio" && e !== "trabajo" && e !== "transforma") return;
      control.recentrar(faena.u.slot, objetivo);
    }
    function alRedimensionar() {
      if (idResize) clearTimeout(idResize);
      idResize = setTimeout(function () {
        idResize = 0;
        if (vivo()) recolocarFaena();
      }, MS_RESIZE);
    }
    window.addEventListener("resize", alRedimensionar);

    /* Sin MFDrag cargado el juego no puede arrastrar, pero tampoco puede
       quedarse mudo: cada utensilio juzga con un clic seco. Es fea y no tiene
       viaje, pero la partida se juega, se gana y cobra igual — que es la regla
       de la casa con las piezas opcionales del sistema. */
    if (!control) {
      for (k = 0; k < utiles.length; k++) {
        utiles[k].slot.addEventListener("click", clicSuelto(utiles[k]));
      }
    }

    function clicSuelto(u) {
      return function () {
        if (ocupado || u.slot.hasAttribute("data-gastado")) return;
        if (raiz.getAttribute("data-estado") !== "espera") return;
        ocupado = true;
        juicio(u);
      };
    }

    /* Anuncio de la alternativa por toques: MFDrag marca la pieza elegida con
       `.mfdrag-elegida` (alzado + contorno) y aquí se cuenta con palabras qué
       toca hacer ahora. */
    repisa.addEventListener("click", function (e) {
      if (!control || ocupado || !e.target || !e.target.closest) return;
      var slot = e.target.closest(".reto-herr-util");
      if (!slot) return;
      var u = utilDe(slot);
      if (u && control.elegida() === slot) anunciar(T.elegido.replace("{c}", u.corta));
    });

    /* --------------------------- MICROPASADAS: frotar y girar (§4, TRABAJO) - */

    /* Fuera de MFDrag a propósito: ocurren DESPUÉS del veredicto, sobre el
       objetivo y no sobre una pieza, y no deben pasar por su máquina de
       arrastre. La captura de puntero es lo que permite que el dedo se salga
       del objetivo a mitad de frotado sin que el gesto se corte. */
    function enPuntero(e) {
      if (ocupado || raiz.getAttribute("data-estado") !== "trabajo") return;
      /* El gesto se apunta ANTES de pedir la captura: si el navegador la
         rechaza (`setPointerCapture` lanza con un puntero que ya no está
         activo), lo que se pierde es que el dedo pueda salirse del objetivo, no
         la pasada entera. Una sola lectura por gesto; el pointermove no vuelve
         a tocar layout. */
      frote = { id: e.pointerId, ultimo: e.clientX, sumado: 0, desvio: 0, dio: false };
      try { if (objetivo.setPointerCapture) objetivo.setPointerCapture(e.pointerId); }
      catch (err) { /* sin captura, el frotado sigue mientras el dedo no se salga */ }
    }

    function enMover(e) {
      if (!frote || e.pointerId !== frote.id) return;
      if (esCofre) return;                       /* el giro es un tap, no un barrido */
      var dx = e.clientX - frote.ultimo;
      frote.ultimo = e.clientX;
      frote.sumado += Math.abs(dx);
      frote.desvio = tope(frote.desvio + dx, -DESVIO_PANO, DESVIO_PANO);
      /* El paño encajado sigue al dedo. Solo se escribe transform: ni una
         lectura de layout ni un nodo nuevo dentro del bucle del dedo. */
      var u = faena && faena.u;
      if (u && u.sprite && !quieto) u.sprite.style.transform = "translateX(" + Math.round(frote.desvio) + "px)";
      if (!frote.dio && frote.sumado >= UMBRAL_FROTE) { frote.dio = true; paso(); }
    }

    function enSoltar(e) {
      if (!frote || (e && e.pointerId !== frote.id)) return;
      var g = frote;
      frote = null;
      devolverPano();
      /* El tap SIEMPRE cuenta como pasada: es la alternativa sin gesto, y sin
         ella un dedo que no arrastra 40 px se quedaría sin poder terminar. */
      if (!g.dio && g.sumado < UMBRAL_FROTE) paso();
    }

    function enCancelar() {
      if (!frote) return;
      frote = null;
      devolverPano();                            /* el sistema se quedó el gesto: no se cuenta nada */
    }

    function devolverPano() {
      var u = faena && faena.u;
      if (esCofre || !u || !u.sprite || quieto) return;
      u.sprite.style.transition = "transform 150ms ease-out";
      u.sprite.style.transform = "translateX(0)";
    }

    function enTecla(e) {
      if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
      if (ocupado || raiz.getAttribute("data-estado") !== "trabajo") return;
      /* El Espacio no debe hacer scroll, y ninguna tecla del juego puede llegar
         al listener global de mission.js, que cambia de tarjeta con ← sin
         ninguna guarda. */
      e.preventDefault();
      e.stopPropagation();
      paso();
    }

    objetivo.addEventListener("pointerdown", enPuntero);
    objetivo.addEventListener("pointermove", enMover);
    objetivo.addEventListener("pointerup", enSoltar);
    objetivo.addEventListener("pointercancel", enCancelar);
    objetivo.addEventListener("keydown", enTecla);
  }

  /* ============================================================== REGISTRO === */

  MFRetos.registrar({
    id: "herramienta",
    nombre: T.nombre,
    icono: "🧰",
    banner: T.banner,
    comoSeJuega: T.comoSeJuega,
    /* ESPECIALISTA, no comodín (regla 3 del titular: la metáfora no puede
       mentir). `familia:accion` es la clave que exige lo que este juego afirma:
       que hay una LABOR que hacer y que la respuesta es el MEDIO para hacerla.
       Sin ella el filtro era «cualquier tarjeta del dojo» —`corta` y `correct1`
       los cumplen las 75, medido en
       docs/07-miniretos/11-metafora-y-tipo-de-pregunta.md §6— y el juego salía
       en definiciones, taxonomías y diagnósticos, donde no hay nada que reparar
       y el gesto enseña una relación que no existe (§5: 13 honestas de 75).
       Donde no entra, el sorteo elige otro juego o cae al quiz clásico, que es
       exactamente lo que debe pasar. Sin `corta` en el contenido el sorteo
       también lo salta. La clave `icono=` del censo se ignora a propósito (§1):
       en este juego los sprites no pueden llevar información. */
    /* `familia:accion` dejó de exigirse el 2026-09-02: el titular fijó las
       preguntas en 3 respuestas cortas y quiere TODOS los juegos disponibles
       sobre cualquier pregunta bien diligenciada. La familia sigue viajando
       como documentación editorial, pero ya no apaga el medallón. */
    necesita: ["corta", "correct1", "sinorden"],
    acepta: function (tarjeta) {
      var n = ((tarjeta && tarjeta.options) || []).length;
      return n >= 2 && n <= 3;   /* verdadero/falso (2) y 1-de-3; el resto no cabe en la repisa */
    },
    jugar: jugar
  });
})();

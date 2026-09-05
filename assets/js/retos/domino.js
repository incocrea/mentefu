/* MenteFu / MindFu — DOMINÓ DEL DOJO (docs/07-miniretos/F9-domino-del-dojo.md).

   El alumno coloca las fichas-tabla en fila —1, 2, 3— y AUTORIZA el empujón: la
   mascota toca la primera y la cadena corre hasta la campanita. Si la secuencia
   está bien, suena la campana; si está mal, la cadena se detiene EXACTAMENTE en
   la primera ficha equivocada, que es la mejor explicación posible de lo que
   falló. Es el único juego de dos fases del sistema: la celebración no acompaña
   a la mecánica, ES la mecánica.

   Este archivo SOLO pinta y juzga. El XP, los cierres, el historial del
   navegador, el panel de feedback y toda la telemetría los pone la
   infraestructura (retos.js) a través del `montaje`: aquí no hay ni un
   MF.track, ni una suma de XP, ni un listener de Escape.

   NUEVE decisiones de este archivo que conviene no deshacer sin leer el porqué:

   · ESTA FASE SE CONSTRUYE COMO PROTOTIPO GRIS, Y ESO ES UNA REGLA, NO UN
     ATAJO. La ficha (regla dura 1 y §7) prohíbe encargar una sola lámina antes
     de medir la cadena, y la regla del titular del 2026-08-27 prohíbe además
     tapar el hueco de una lámina que no existe con un SVG que imite el objeto:
     un dibujo «provisional» de la ficha, la campana o la mascota es exactamente
     lo que la regla veta. Así que mientras `ARTE.<pieza>` valga `null`, esa
     pieza se pinta con un BLOQUE PLANO NEUTRO (`.domino-bloque`) con su rótulo
     HTML encima, que se VE como un placeholder. El día que el titular apruebe
     el arte, se cambia el `null` por la ruta y no hay una línea más que tocar:
     el resto del archivo ya trata a las seis piezas como láminas.

   · LA CAMPANITA NO SE ENCARGA: ES LA DE F6. `campana-campana.webp` ya está en
     disco y es literalmente una campana de templo en el estilo de la casa, así
     que la ficha se ahorra su séptima lámina y los ocho juegos comparten prop
     —que es lo que el titular pidió—. Y con ella entra su lección: el pivote
     del tañido NO sale de la fórmula de la ficha (que suponía un travesaño
     dibujado, ≈8 %), sino de MEDIR la lámina entregada: el aro de cuelgue de
     esta campana está en el 11 % de su alto (bbox alfa 13..66 px sobre 360).
     Pedir una proporción o una composición en el prompt no garantiza recibirla
     —la tabla de F1 se pidió 5:1 y volvió 2,494—, así que aquí las medidas
     salen de `naturalWidth/naturalHeight` y de la lámina en la mano, jamás del
     texto del prompt.

   · LA FICHA SON TRES NODOS, Y NO UNO. El exterior (`.domino-ficha`) es la
     pieza de MFDrag y el ÚNICO que recibe `transform` en línea (mfdrag.js:108-116);
     el intermedio (`.domino-ficha__caja`) recibe los efectos del kit
     (`juice-squash`, que es una animación sobre `transform`, game.css) y el
     vuelo propio por la propiedad independiente `translate`; el interior
     (`.domino-ficha__lamina`) recibe el giro de caída, tambaleo y levantarse por
     `rotate`. Con dos nodos, el «toc» con microsquash al posar —regla dura 3 de
     la ficha— se dispararía justo cuando la ficha lleva encima el offset del
     arrastre, y como una animación gana SIEMPRE al estilo en línea, la ficha se
     teletransportaría a la bandeja durante 220 ms y volvería de golpe: el gesto
     principal del juego, roto. Es la misma separación ya medida en
     `.tw-mano`/`.tw-mano__fig` (F1) y en `.kata-mascota`/`__fig` (F8).

   · EL ENCAJE LO HACE MFDrag Y EL JUEGO NO LO REIMPLEMENTA. Devolver "encaja"
     basta: `aplicarVeredicto` lleva la pieza al centro del destino (120 ms por
     arrastre, 250 ms por toques) y avisa con `alEncajado` (mfdrag.js:266-296).
     Una traslación propia sobre el mismo nodo se COMPONE con la suya y la ficha
     viaja el doble. El `setTimeout(140)` que la ficha manda encolar es de una
     versión de MFDrag anterior a `alEncajado`: hoy ese aviso existe, llega en el
     instante exacto en que la pieza ya está en su hueco y cubre igual los tres
     caminos (dedo, toque y teclado), así que se usa él.

   · RITUAL DE REPARENTADO ANTES DE TODO `appendChild`. MFDrag guarda estado
     privado por pieza (`__mfdragBase`, `__mfdragOff`, mfdrag.js:93-107) y el
     `control` solo expone `{destruir, elegir, elegida}`: ni `destruir()` los
     borra. Sin limpiarlos, la ficha aparece desplazada en su nuevo padre y el
     siguiente arrastre arranca desde el offset viejo — con tres huecos y
     recolocación libre, eso pasa en la primera partida.

   · LA FASE 1 NO TIENE NI UNA AYUDA VISUAL. Ningún hueco cambia de aspecto
     nunca, ni al pasar por encima ni al recibir ficha: la marca del suelo es un
     nodo INMUTABLE, sin clases de estado. El imán de MFDrag es tolerancia
     geométrica de soltado, idéntica para toda combinación ficha-hueco, y jamás
     distingue correcto de incorrecto. El valor pedagógico del juego es el
     COMMIT: armar el modelo mental entero antes de recibir juicio (regla dura 2
     de la ficha, condición del jurado pedagógico).

   · CERO BOTONES PROPIOS: F0 §0.13.2 MANDA SOBRE LA FICHA, Y LA FICHA YA LO
     RECOGIÓ. Se caen los tres que su cuerpo pedía. «Recolocar» (misión) y
     «Continuar» (examen) rematan algo ya hecho, y la regla obliga a resolverlo
     con TIEMPO: tras la comedia del fallo la cadena se repone SOLA —las caídas
     se levantan, la culpable vuela a la bandeja y la fila queda editable— y el
     veredicto de examen cierra solo, con el tiempo de lectura proporcional al
     texto de F3 (1400-4200 ms, `pasa.js:1152-1170`), barra predecible y toque
     opcional para adelantar. Y «¡Empuja!» se cae por la misma regla más la del
     tope de tres acciones: lo cierra el bloque ACTUALIZACIÓN 2026-08-28 de la
     ficha y el porqué largo está junto a `cerrarFila`, más abajo. El alumno solo
     coloca; la tercera colocación arranca la cadena.

   · LA CRONOLOGÍA DE LA CADENA NO SE ESCRIBE A MANO. El instante en que una
     ficha toca a la siguiente se DESPEJA de la geometría real (`tiempoDeContacto`,
     que invierte la curva de easing de la caída) y se lee de los rects, así que
     una fila de dos huecos, una pantalla ancha o un cambio de medidas en la hoja
     recalculan solos. Y el hit-stop se SUMA a la cronología: `MFJuice.hitstop`
     se clava en 60 ms (juice.js:133 hace `entre(60, 80, ms, 70)`) y su clase
     pausa las animaciones de dentro de la escena, pero el reloj de `setTimeout`
     no se pausa.

   · CON `prefers-reduced-motion` NO HAY TEATRO PERO SÍ INFORMACIÓN. La cadena se
     resuelve como una secuencia de estados finales de 200 ms por ficha (el
     apagado global de styles.css:103-106 mata los keyframes, así que la clase de
     caída tiene que traer también el estado final estático: contrato con la
     hoja, más abajo), no hay redoble —`anticipar` resuelve al instante— y el
     resultado se cuenta además con TEXTO bajo la escena y en `.reto-vivo`.
     Nunca solo con animación.

   DÓNDE ESTÁ EL TRAJE: en la sección `RETO: DOMINÓ DEL DOJO` de
   `assets/css/game.css`, como en F1..F8, y en NINGÚN otro sitio. Este archivo no
   escribe ni un ancho ni un alto: lo único que pone en línea es lo que la hoja
   declara como del JS —`--dom-ratio*`, `--dom-pivote-*`, `--dom-empuje`, `--i`
   del escalonado y el `translate` del vuelo propio—. Un `<style>` inyectado
   desde aquí entraría en la cascada DESPUÉS del `<link>` y ganaría en lo que
   ambos declaran y perdería en lo que solo declara la hoja: de esa mezcla no
   sale ninguna de las dos geometrías (lección pagada en F2, F6 y F8).

   CONTRATO CON LA HOJA (sección `RETO: EL DOMINÓ DEL DOJO`, game.css:4408+).
   Lo escribe ella y aquí solo se cumple; los nombres son SUYOS:
     · Estructura: `.domino` > `.domino-enunciado` + `.domino-zona`
       (> `.domino-escena` > `.domino-mascota` > `.domino-mascota__fig`,
        `.domino-fila` > `.domino-slot` > `.domino-num` + `.domino-hueco`
        (> `.domino-marca` + la ficha puesta) + `.domino-placa`,
        `.domino-campanita` > `.domino-campanita__fig`)
       + `.domino-bandeja` > `.domino-ficha` > `.domino-ficha__caja`
       (> `.domino-ficha__lamina` + `.domino-ficha__texto`)). Sin botones.
     · Variables que ESCRIBE este archivo, todas con valor por defecto válido en
       la hoja ANTES de medir: `--dom-ratio` (tumbada), `--dom-ratio-pie` (en
       pie), `--dom-campana-ratio`, `--dom-marca-ratio`, `--dom-texto-inset`,
       `--dom-pivote-ficha`, `--dom-empuje` y `--i` (índice 0-based, del que
       salen el apilado de la cadena y el escalón del levantarse).
       `--dom-pivote-campana` NO se escribe: la hoja lo fija en el 8 % que F6 ya
       midió y verificó en pantalla, y la uniformidad entre los ocho juegos vale
       más que los 2 px de diferencia con el aro de esta lámina.
     · Clases de estado que pone este archivo: `domino-cae`, `domino-tambalea`,
       `domino-levanta` (sobre el nodo `__lamina`), `domino-tañe` (sobre la
       figura de la campanita), `.domino-ficha--bandeja` / `--puesta`,
       `.domino-mascota--lista/--empuja/--salta`, `.domino-placa--ok`,
       `.domino-ficha__texto--larga`, `.domino-bandeja--una` y `data-estado` en
       la raíz (QA: la máquina de estados de un vistazo).
     · Prototipo gris: la hoja admite la bandera `.domino--sin-lamina` en la raíz
       Y la clase suelta `.domino-bloque` en el nodo de cada lámina. Aquí se usa
       la SEGUNDA, porque la campanita sí tiene lámina (la de F6) y la bandera
       pintaría un bloque gris detrás de un dibujo que existe.
     · Las tres clases de movimiento traen su estado final estático DECLARADO
       (no en un `to {}` con `forwards`): con `prefers-reduced-motion` el apagado
       global de styles.css:103-105 mata la animación con `!important` y sin ese
       estado la ficha se quedaría de pie. Y la caída es ANIMACIÓN, nunca
       transición: `.juice-hitstop` declara `transition: none !important`, que en
       una transición no pausa — hace saltar la propiedad a su valor final.
     · Duraciones que la hoja y este archivo comparten, y que no pueden
       separarse: caída 240 ms, tambaleo 500, levantarse 200 (+60 de escalón),
       tañido 700, gota 150, vuelo propio 250. Están abajo como constantes. */
(function () {
  "use strict";

  /* Sin infraestructura no hay reto: mission.js cae solo a su quiz clásico. */
  if (!window.MFRetos || !MFRetos.registrar) return;

  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var A = cfg.assets || "";
  var XP = cfg.xp || {};

  var T = ES ? {
    nombre: "Dominó del dojo",
    banner: "PREPARA",
    /* La línea de «qué hay que hacer», declarada por el JUEGO y no por quien la
       pinta: la enseñan dos interfaces —la ficha de la sala de retos y la
       tarjeta-invitación de la misión— y con una tabla en cada una, el día que
       se retoque la frase se retocará en una sola. Aquí hay una sola verdad. */
    comoSeJuega: "Arrastra las fichas a su casilla en el orden correcto y empuja la primera.",
    sello: "¡REACCIÓN!",
    abre: "Coloca las fichas en fila, en orden, y empuja la primera.",
    puesta: "{c} colocada en el hueco {n}.",
    quitada: "{c} devuelta a la bandeja.",
    completa: "Fila completa. La cadena arranca.",
    elegida: "{c} elegida. Toca un hueco para colocarla.",
    gana: "¡Reacción en cadena! La campana sonó.",
    falla: "La cadena se detuvo en {c}. Lee por qué y recoloca.",
    fallaExamen: "La cadena se detuvo en {c}. El orden correcto era {o}.",
    repuesta: "Cadena repuesta. Recoloca y vuelve a empujar.",
    resultado: "Cadena completa.",
    resultadoXp: "Cadena completa. +5 XP",
    resultadoKo: "La cadena se detuvo en {c}."
  } : {
    nombre: "Dojo Domino",
    banner: "ARRANGE",
    comoSeJuega: "Drag each tile into its slot in the right order, then push the first one.",
    sello: "CHAIN!",
    abre: "Line the tiles up in order, then push the first one.",
    puesta: "{c} placed in slot {n}.",
    quitada: "{c} back in the tray.",
    completa: "Row complete. The chain starts.",
    elegida: "{c} selected. Tap a slot to place it.",
    gana: "Chain reaction! The bell rang.",
    falla: "The chain stopped at {c}. Read why and rearrange.",
    fallaExamen: "The chain stopped at {c}. The correct order was {o}.",
    repuesta: "Chain reset. Rearrange and push again.",
    resultado: "Chain complete.",
    resultadoXp: "Chain complete. +5 XP",
    resultadoKo: "The chain stopped at {c}."
  };

  /* ====================================================== EL ARTE DE LA FASE ==

     El ÚNICO sitio donde vive el arte del dominó. Las rutas llevan el prefijo
     del build (`MF_CONFIG.assets`) porque las misiones cuelgan de cuatro niveles
     de carpeta y un `src` relativo escrito desde JS se resuelve contra la
     PÁGINA: sin él, 404 en todas ellas (retos.js:478-482, arbol.js:12). Y
     siempre `.webp`: al publicar, el `.png` se descarta cuando existe su `.webp`
     (build.py:783-799), así que apuntar al PNG es apuntar a un 404 en producción.

     `null` = lámina NO aprobada todavía. No es un olvido ni una deuda escondida:
     es la regla dura 1 de la ficha (prototipo gris y ciclo medido ANTES de todo
     gasto) más la regla del titular de 2026-08-27 (mientras una lámina no
     exista, su hueco se pinta con un bloque plano neutro, JAMÁS con un SVG que
     imite el objeto). Las cinco pendientes están en el apéndice A de la ficha,
     con su prompt literal y su presupuesto: 0.210 USD de suelo y 0.630 de techo
     si las cinco agotan los 3 intentos de `arte.py:722`.

     El día que el titular apruebe: cambiar el `null` por su ruta. Nada más — el
     resto del archivo ya monta `<img>`, ya precarga, ya intercambia sprites por
     `montaje.sprite()` y ya calibra proporciones y pivotes desde
     `naturalWidth/naturalHeight`. */
  var JUEGOS = A + "assets/img/juegos/";
  var MASCOTA = A + "assets/img/mascota/";

  var ARTE = {
    /* APROBADA Y EN DISCO: la campana de F6, reutilizada tal cual. No se encarga
       una `campanita.webp` propia porque esta ya es una campana de templo en el
       estilo de la casa y el titular pidió estilo uniforme entre los ocho
       juegos. Ojo: cuelga de un ARO, no de un travesaño, así que su pivote es el
       medido abajo y no el de la fórmula de la ficha. */
    campanita: JUEGOS + "campana-campana.webp",
    /* APROBADAS Y GENERADAS (titular 2026-09-01, un intento cada una): las
       cinco — el titular vio el bloque gris de la gota en pantalla y preguntó;
       con ella el catálogo del dominó queda COMPLETO y el prototipo gris ya no
       tiene nada que pintar. */
    ficha: JUEGOS + "domino-ficha.webp",
    tumbada: JUEGOS + "domino-tumbada.webp",
    marca: JUEGOS + "domino-marca.webp",
    /* Las poses del personaje viven en `mascota/`, no en `juegos/` (que guarda
       solo piezas de minijuego). Esta ruta se quedó atrás en la reorganización
       de assets de 2026-09-03 y el dominó se quedó sin mascota. */
    mascota: MASCOTA + "empuja.webp",
    gota: JUEGOS + "gota-sudor.webp"
  };

  /* Rótulo de la ficha tumbada cuando la LÁMINA existe: el texto va SOLO sobre
     la cara crema. El inset se MIDIÓ sobre la lámina entregada, píxel a píxel
     (perfil de la fila central con PIL), y no sobre la estimación de la ficha:
     la cara crema real ocupa x 38,9–84,0 % e y 26,1–71,9 % del archivo — el
     marco con su sello llega mucho más adentro de lo que la ficha suponía, y
     con el inset viejo («12% 6% 12% 26%») el rótulo pisaba el sello (lo vio el
     titular en pantalla). Con un pelo de aire por dentro: */
  var INSET_TEXTO_LAMINA = "27% 18% 27% 41%";

  /* ============================================================== TIEMPOS ====

     Todos en ms y compartidos con la hoja (contrato de la cabecera). El hit-stop
     NO es un adorno del que se pueda prescindir en la cuenta: `MFJuice.hitstop`
     recorta su duración a un mínimo de 60 (juice.js:133 + :41-43) y su clase
     pausa TODAS las animaciones de dentro de la escena (game.css), mientras el
     reloj de `setTimeout` sigue corriendo. Por eso se suma a la cronología. */
  /* VÁLVULA DE ESCAPE DE LA FICHA, YA ABIERTA, y esto es una medición, no un
     gusto. El gate §13.6 mide el ciclo DESDE EL ÚLTIMO GESTO DE COLOCACIÓN
     —desde que el botón no existe, no hay otro punto de partida— hasta el fin
     del sello, con techo de 2,0 s. Medido en banco con la geometría real de la
     hoja (separaciones 18/18/10 px → campanada en 503 ms):
       con redoble 400 → 1.923 ms a dedo · 2.053 ms por toques  ← se pasa
       con redoble 300 → 1.823 ms a dedo · 1.953 ms por toques  ← entra
     Los 130 ms de diferencia entre los dos caminos son el viaje del encaje, que
     MFDrag hace en 120 ms a dedo y en 250 por toques (mfdrag.js:23,25). La
     palanca correcta ya se usó antes que esta: la inclinación de la mascota
     ocurre DURANTE ese viaje en vez de detrás de él (ver `veredicto`), que son
     200 ms que la ficha daba por perdidos. Con eso todavía se pasaba por el
     camino accesible, así que se abre la válvula que la ficha deja escrita: 300
     es el suelo real de `MFJuice.anticipar` (juice.js:122 hace
     `entre(300, 600, ms, 400)`), así que por debajo no se puede bajar y NUNCA se
     recorta la caída ni el hit-stop, que son el peso físico. En gama baja el
     ciclo solo puede ser más largo, jamás más corto: la medición definitiva del
     prototipo gris manda sobre esta, pero solo puede confirmarla. */
  var MS_REDOBLE = 300;
  var MS_CAIDA = 240;        /* giro de 78° de una ficha */
  var GRADOS = 78;
  var MS_HITSTOP = 60;
  var MS_TAMBALEO = 500;
  /* La entrada de la gota (150 ms) la cronometra la hoja y nadie la espera aquí:
     entra durante el tambaleo y se va del DOM al recolocar. */
  var MS_SILENCIO = 300;     /* silencio cómico: timing de comedia, no relleno */
  var MS_LEVANTA = 200, MS_ESCALON = 60;
  var MS_VUELO = 250;        /* vuelo propio de vuelta a la bandeja */
  var MS_SELLO = 900;        /* tras la campanada */
  var MS_COBRO = 1100;
  var MS_CIERRE = 1150;
  var MS_QUIETO = 200;       /* paso de la cadena con movimiento reducido */
  var MS_SALTA = 400;

  /* Tope de fichas en la bandeja (ficha §9.1): con más de cinco la rejilla de
     dos columnas se sale de los 340 px útiles del modal. Hoy el corpus entero
     trae 4 opciones, así que el recorte no llega a activarse nunca. */
  var TOPE_FICHAS = 5;

  /* Diana mínima de la casa. Si la columna de la bandeja no da para un tile de
     44 px de alto con la proporción REAL de la lámina, la bandeja pasa a UNA
     columna antes que deformar el dibujo (ficha §12 y apéndice A (e)). NO se
     regenera la lámina por esto: regenerar cuesta 0.042 USD. */
  var DIANA = 44;

  /* LA ÚLTIMA COLOCACIÓN ES EL EMPUJÓN, Y NO HAY BOTÓN. No es una preferencia:
     el bloque ACTUALIZACIÓN 2026-08-28 de la ficha —que manda sobre el resto de
     ella— cierra las dos reglas del titular que F9 incumplía de nacimiento:
       · REGLA 1 (F0 §0.13.1, tope de tres acciones). Colocar, colocar, colocar y
         pulsar «¡Empuja!» son CUATRO actos deliberados para llegar a
         `montaje.resolver()`. Con el disparo al llenarse el último hueco las
         acciones son las colocaciones: 3 con fila de 3, 2 con fila de 2, en el
         límite exacto del tope, como `herramienta`.
       · REGLA 2 (F0 §0.13.2). Cuando la fila está llena el juego YA lo sabe
         todo: qué ficha hay en cada hueco y que no falta ninguna. El botón no
         aportaba información nueva, solo decía «sí, eso» — la definición literal
         de la confirmación que la regla prohíbe, el mismo papel del «Retirar»
         que F5 tuvo que borrar tras haberlo construido.
     Se descartó la otra salida de F0 (fila de 2 huecos siempre) porque las
     tarjetas del censo traen los TRES pasos y esconder uno es hurtarle al alumno
     un eslabón de su propia pregunta.
     Lo que se pierde, dicho sin adornos: la tercera colocación es irrevocable,
     así que muere la ventana de repaso con la fila ya armada. El COMMIT —el
     valor pedagógico declarado— sobrevive intacto: ningún juicio llega hasta que
     los N huecos están llenos, y mientras quede un hueco se recoloca cuanto se
     quiera.
     No hay carrera posible: nunca existe un estado «fila llena y quieta», porque
     el instante en que se llena el último hueco entra en `redoble`. Mover una
     ficha puesta deja su hueco vacío e intercambiar no cambia el número de
     ocupados, así que ninguna recolocación puede volver a disparar: el único
     camino es una ficha que entra desde la bandeja al último hueco libre. */

  /* ============================================================== UTILERÍA === */

  function ahora() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  function esNumero(v) { return typeof v === "number" && isFinite(v); }

  function limpiar(s) { return String(s == null ? "" : s).replace(/^\s+|\s+$/g, ""); }

  function textoPlano(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html == null ? "" : html);
    return (d.textContent || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
  }

  function palabras(s) {
    var t = limpiar(s);
    return t ? t.split(/\s+/).length : 0;
  }

  function reducido() {
    return !!(window.MFJuice && MFJuice.reducido && MFJuice.reducido());
  }

  /* hash y mulberry32: copias literales de F0 §0.7.3 (retos.js:159-172). Se
     copian y no se importan porque retos.js no las exporta y son cinco líneas
     sin dependencias; lo que NO puede pasar es que las dos difieran. */
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

  /* ================================== CALIBRACIÓN DE LÁMINAS (apéndice A, d) ==

     `postprocess` (arte.py:552-563) recorta al bbox y llama a `con_margen`
     (arte.py:507-512), que añade `m = max(8, 4 % del lado mayor)` por los cuatro
     lados: como `S + 2·0,04·S = 1,08·S`, en la lámina entregada `m = ladoMayor / 27`.
     De ahí sale DÓNDE está el dibujo dentro del `<img>`, que es lo que hace falta
     para todos los pivotes. Con la ficha en pie sale ≈93,9 %/96,3 %, y NO el
     `100% 100%` que decía la ficha aprobada: con el pivote en la esquina de la
     CAJA, la ficha giraría alrededor de un punto en el aire, dentro del margen
     transparente. */
  function margenFrac(img) {
    var W = img.naturalWidth || 1, H = img.naturalHeight || 1;
    var m = Math.max(W, H) / 27;
    return { x: m / W, y: m / H };
  }

  function pivoteCaida(img) {
    var f = margenFrac(img);
    return (100 - f.x * 100).toFixed(1) + "% " + (100 - f.y * 100).toFixed(1) + "%";
  }

  /* El instante de contacto no se decreta: se despeja. La ficha gira `gradosFin`
     sobre su esquina inferior dibujada y su borde superior avanza `H·sen θ`, así
     que el ángulo de contacto es `θc = asin(sep / H)`. Ese ángulo es la fracción
     RECORRIDA del giro, es decir la SALIDA (y) de la curva de easing: hay que
     INVERTIR la curva para hallar el parámetro `u` y solo entonces evaluar x(u),
     que es la fracción de TIEMPO.

     cubic-bezier(0.55, 0, 1, 0.45):
       x(u) = 1.65·u·(1-u)² + 3·u²·(1-u) + u³
       y(u) = 1.35·u²·(1-u) + u³
     Bisección de 24 pasos, sin dependencias (`bezierX` no existe en assets/js:
     se escribe aquí, igual que F0 escribe literales `mulberry32`/`hash`). */
  function tiempoDeContacto(sep, H, gradosFin, ms) {
    if (!(sep > 0) || !(H > 0)) return 0;
    var y = Math.asin(Math.min(1, sep / H)) / (gradosFin * Math.PI / 180);
    if (y >= 1) return ms;
    var lo = 0, hi = 1, u = 0, i;
    for (i = 0; i < 24; i++) {
      u = (lo + hi) / 2;
      if (1.35 * u * u * (1 - u) + u * u * u < y) lo = u; else hi = u;
    }
    return ms * (1.65 * u * (1 - u) * (1 - u) + 3 * u * u * (1 - u) + u * u * u);
  }

  /* La cronología entera de la cadena, calculada de los rects REALES. Con la
     geometría de la ficha (paso 76 px, ficha 44 → sep 32, H 72) da arranques en
     0/240/480 y campanada en ≈600; con dos huecos trunca sola (arranque único en
     0, campanada ≈360). Ningún número de la cadena queda escrito a mano. */
  function tablaDeTiempos(cajas, campanaEl) {
    var t = [], reloj = 0, i, a, b;
    for (i = 0; i < cajas.length; i++) {
      t.push({ tipo: "cae", i: i, ms: reloj });
      a = cajas[i].getBoundingClientRect();
      b = (i + 1 < cajas.length) ? cajas[i + 1].getBoundingClientRect()
                                 : campanaEl.getBoundingClientRect();
      reloj += tiempoDeContacto(b.left - a.right, a.height, GRADOS, MS_CAIDA);
      t.push({ tipo: (i + 1 < cajas.length) ? "contacto" : "campana", i: i, ms: reloj });
      if (i + 1 < cajas.length) reloj += MS_HITSTOP;
    }
    return t;
  }

  /* Con movimiento reducido no hay curva que invertir: la cadena se cuenta como
     una secuencia de estados finales, uno cada 200 ms. */
  function tablaQuieta(n) {
    var t = [], k;
    for (k = 0; k < n; k++) {
      t.push({ tipo: "cae", i: k, ms: k * MS_QUIETO });
      t.push({ tipo: (k + 1 < n) ? "contacto" : "campana", i: k, ms: (k + 1) * MS_QUIETO });
    }
    return t;
  }

  /* `rect(mascota).right` NO es el dedo: es el borde del `<img>`, con el margen
     transparente incluido. El prompt fija que la yema es el punto más a la
     derecha de todo el dibujo y `postprocess` recorta al bbox, así que el borde
     derecho del bbox ES la yema. Acotado para que el empujón nunca cruce la
     ficha ni se quede corto. */
  function empujeDelDedo(mascotaImg, primeraCaja) {
    if (!mascotaImg || !primeraCaja || !mascotaImg.naturalWidth) return null;
    var r = mascotaImg.getBoundingClientRect();
    var yema = r.right - r.width * margenFrac(mascotaImg).x;
    var d = primeraCaja.getBoundingClientRect().left - yema;
    return Math.max(8, Math.min(28, Math.round(d)));
  }

  /* ==================================================== LÁMINA Y PLACEHOLDER ==

     Una pieza del juego es SIEMPRE una lámina desde el primer fotograma (F0
     §0.12) — cuando la lámina existe. Cuando su ruta vale `null` (prototipo
     gris) se pinta un BLOQUE PLANO NEUTRO, que es lo que la regla del titular
     manda y lo que hace que un placeholder se vea como un placeholder. Los dos
     caminos devuelven un nodo con la misma clase de figura, así que el resto del
     archivo no vuelve a preguntar cuál de los dos le tocó. */
  function esImagen(n) { return !!(n && n.tagName === "IMG"); }

  function lamina(clase, ruta, rellena) {
    var n;
    if (ruta) {
      n = document.createElement("img");
      n.className = clase + " reto-pieza";
      n.alt = "";
      n.draggable = false;
      n.setAttribute("aria-hidden", "true");
      /* Los manejadores van ANTES del src porque una imagen ya en caché puede
         resolver dentro de la propia asignación: apuntarlos después sería
         apuntarlos tarde, y ese es justo el caso de la segunda partida de la
         página (lección de F1, tameshiwari.js:157-184). La reserva NO dibuja
         nada: degrada al mismo bloque plano del prototipo gris, que es lo único
         que la regla del titular autoriza cuando no hay lámina. */
      n.onerror = function () {
        n.onerror = null;
        n.className = clase + " domino-bloque";
        n.removeAttribute("src");
        if (rellena) { n.style.width = "100%"; n.style.height = "100%"; }
      };
      n.onload = function () {
        if (n.naturalWidth && n.naturalHeight) return;
        if (n.onerror) n.onerror();
      };
      n.src = ruta;
      return n;
    }
    n = document.createElement("span");
    n.className = clase + " domino-bloque";
    n.setAttribute("aria-hidden", "true");
    if (rellena) { n.style.width = "100%"; n.style.height = "100%"; }
    return n;
  }

  /* ============================ MEMORIA POR TARJETA (ficha §3 y §12) =========

     Cerrar el modal a mitad y reabrir NO devuelve la oportunidad del «limpio»:
     la infraestructura persiste el CONTEO (`estado.fallos`, retos.js:423-429),
     pero no sabe cuántos empujones lleva esta tarjeta ni cómo quedó la
     barajadura de la bandeja — eso vive aquí. La fila SÍ se pierde al cerrar (la
     ficha lo pide así: al reabrir se monta en `plan` con la bandeja llena).
     WeakMap para que las tarjetas de un intento viejo se recojan solas; sin
     WeakMap se cae a un objeto plano, que a escala de una página es igual de
     bueno. Patrón de F1 y F8. */
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
    if (!caja[k]) caja[k] = { intentos: 0, orden: null, resuelto: false };
    return caja[k];
  }

  /* ================================================ COMPOSICIÓN DE LA PARTIDA =

     Fichas = TODAS las opciones de la tarjeta (con y sin `orden`), tope 5. La
     secuencia esperada son las de `orden`, ordenadas por su valor. Las que no
     traen `orden` son señuelos de la propia tarjeta: el dominó NO usa
     `content.pool`. */
  function componer(tarjeta) {
    var ops = (tarjeta && tarjeta.options) || [];
    var piezas = [], i, o;
    for (i = 0; i < ops.length && piezas.length < TOPE_FICHAS; i++) {
      o = ops[i];
      if (!o) continue;
      piezas.push({
        i: i,
        corta: limpiar(o.corta) || textoPlano(o.html).slice(0, 24),
        orden: esNumero(o.orden) ? o.orden : null
      });
    }
    return piezas;
  }

  function secuencia(piezas) {
    var e = [], i;
    for (i = 0; i < piezas.length; i++) { if (piezas[i].orden != null) e.push(piezas[i]); }
    e.sort(function (a, b) { return a.orden - b.orden; });
    return e;
  }

  /* ============================================================== EL JUEGO === */

  function jugar(m) {
    var piezas = componer(m.tarjeta);
    var esperada = secuencia(piezas);
    var N = esperada.length;
    /* No debería llegar (lo filtran `necesita` y `acepta`), pero si llegara,
       resolver es mejor que dejar al alumno encerrado con la tarjeta bloqueada. */
    if (N < 2) { m.resolver({ limpio: false, intentos: 1, ms: 0 }); return; }

    var mem = memoria(m);
    var quieto = reducido();
    var t0 = ahora();
    var timers = [];
    var control = null;
    var ocupado = true;          /* MONTANDO: los toques se ignoran, no se encolan */
    var est = "montando";
    var tGesto = 0;              /* performance.now del tap en «¡Empuja!» (medición §13.6) */
    var cerrado = false;
    var elegidaFallback = null;  /* camino por toques cuando MFDrag no está cargado */

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

    function estado(s) { est = s; raiz.setAttribute("data-estado", s); }

    /* Los timeouts pendientes y el arrastre mueren con el modal: sin esto,
       cerrar a mitad de la cadena dispararía un `resolver()` sobre una caja que
       ya no existe, o dejaría a MFDrag escuchando en <body> para siempre. Y
       `ocupado` se queda en true para que ninguna devolución de llamada en
       vuelo conceda el «limpio». */
    if (m.alCerrar) {
      m.alCerrar(function () {
        for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
        timers.length = 0;
        ocupado = true;
        if (control && control.destruir) control.destruir();
      });
    }

    /* La prueba de existencia de las láminas vive en la infraestructura: el
       veredicto es POR RUTA y de módulo (retos.js), así que se comparte entre
       piezas, partidas y aperturas del modal. Es obligatoria al montar porque es
       la única tabla que `montaje.sprite()` consulta: sin ella, el primer
       intercambio tumbada→en pie pediría red justo en el frame del encaje. */
    if (m.precargar) {
      var rutas = [], clave;
      for (clave in ARTE) { if (ARTE[clave]) rutas.push(ARTE[clave]); }
      m.precargar(rutas);
    }

    /* ---------------------------------------------------------- la pantalla - */

    var raiz = document.createElement("div");
    raiz.className = "domino";
    raiz.setAttribute("data-n", String(N));
    raiz.setAttribute("data-estado", "montando");

    /* DIV y no P: `tarjeta.html` viene de Markdown y casi siempre trae ya su
       propio <p>; anidarlo dentro de otro <p> es HTML inválido. */
    var enunciado = document.createElement("div");
    enunciado.className = "domino-enunciado";
    enunciado.innerHTML = (m.tarjeta && m.tarjeta.html) || "";
    raiz.appendChild(enunciado);

    /* La zona de MFDrag envuelve ESCENA + BANDEJA y deja fuera el enunciado y el
       panel de feedback: MFDrag pone su zona en `touch-action: none`, y con el
       enunciado dentro el alumno no podría desplazar el cuerpo del modal con el
       dedo sobre el texto. */
    var zona = document.createElement("div");
    zona.className = "domino-zona";
    raiz.appendChild(zona);

    var escena = document.createElement("div");
    escena.className = "domino-escena";
    zona.appendChild(escena);

    /* La mascota son DOS nodos: la caja lleva el empujón y la inclinación por las
       propiedades independientes `translate`/`rotate` (vía `--dom-empuje`) y la
       figura recibe las clases del kit, que se montan sobre `transform` y
       `animation`. Con un solo nodo, los 400 ms de `.juice-anticipa` borrarían el
       empujón y la inclinación justo en el momento de mayor atención. */
    var mascota = document.createElement("span");
    mascota.className = "domino-mascota";
    mascota.setAttribute("aria-hidden", "true");
    /* `rellena` porque la hoja da a la figura `width: auto` —lo que necesita una
       lámina para no deformarse—, y un <span> con ancho automático y posición
       absoluta mide CERO: el bloque del prototipo desaparecería. Es el mismo
       criterio de F1 con los estilos estructurales en línea: lo poco que gana al
       estilo de la hoja tiene que ser un invariante, nunca un gusto. */
    var mascotaFig = lamina("domino-mascota__fig", ARTE.mascota, true);
    mascota.appendChild(mascotaFig);
    escena.appendChild(mascota);

    var fila = document.createElement("div");
    fila.className = "domino-fila";
    escena.appendChild(fila);

    var slots = [];
    for (var k = 0; k < N; k++) slots.push(crearSlot(k));

    function crearSlot(k) {
      var s = document.createElement("div");
      s.className = "domino-slot";
      s.setAttribute("data-k", String(k));
      /* `--i` invierte el apilado de la fila (game.css: `z-index: calc(4 - var(--i))`):
         una ficha que cae hacia la derecha aterriza ENCIMA de la siguiente, y en
         orden de documento pasaría justo lo contrario. */
      s.style.setProperty("--i", String(k));

      /* Grafismo, no texto traducible: el número del hueco es el mismo en ES y
         en EN, y el lector de pantalla lo recibe por los anuncios de
         `.reto-vivo`, no por aquí. */
      var num = document.createElement("span");
      num.className = "domino-num";
      num.setAttribute("aria-hidden", "true");
      num.textContent = String(k + 1);
      s.appendChild(num);

      var hueco = document.createElement("span");
      hueco.className = "domino-hueco";
      /* La marca del suelo es INMUTABLE: se monta una vez y no recibe jamás una
         clase de estado, ni `:hover`, ni filtro. Es la regla dura 2 de la ficha
         convertida en algo que no se puede violar por descuido — un `<img>` sin
         estados es más difícil de romper que un borde CSS al que cualquiera
         puede añadirle un realce «de ayuda». */
      hueco.appendChild(lamina("domino-marca", ARTE.marca));
      s.appendChild(hueco);

      var placa = document.createElement("span");
      placa.className = "domino-placa";
      s.appendChild(placa);

      fila.appendChild(s);
      return { nodo: s, hueco: hueco, placa: placa, ficha: null };
    }

    var campanita = document.createElement("span");
    campanita.className = "domino-campanita";
    campanita.setAttribute("aria-hidden", "true");
    var campanaImg = lamina("domino-campanita__fig", ARTE.campanita);
    campanita.appendChild(campanaImg);
    escena.appendChild(campanita);

    var bandeja = document.createElement("div");
    bandeja.className = "domino-bandeja";
    zona.appendChild(bandeja);

    /* Orden de la bandeja: barajado. En misión con `Math.random`; en examen con
       la semilla determinista de F0 §0.7.3, para que recargar a mitad reproduzca
       la MISMA bandeja y solo el botón de reintento la cambie. Se guarda en la
       memoria de la tarjeta: reabrir tras un abandono no puede rebarajar. */
    if (!mem.orden) {
      var idx = [], j;
      for (j = 0; j < piezas.length; j++) idx.push(j);
      if (m.examen) {
        var cortas = [];
        for (j = 0; j < piezas.length; j++) cortas.push(piezas[j].corta);
        barajar(idx, mulberry32(hash(String(m.content && m.content.id) + "|" + cortas.join("|") + "|" + (m.intento | 0))));
      } else {
        barajar(idx, Math.random);
      }
      mem.orden = idx;
    }

    for (var q = 0; q < mem.orden.length; q++) {
      var p = piezas[mem.orden[q]];
      if (p) crearFicha(p);
    }

    /* Las tres capas de una ficha (contrato de la cabecera). El rótulo va SIEMPRE
       en HTML encima: las láminas de la casa tienen prohibido el lettering. */
    function crearFicha(p) {
      var nodo = document.createElement("span");
      nodo.className = "domino-ficha domino-ficha--bandeja";
      nodo.setAttribute("aria-label", p.corta);

      /* Sin `.reto-lienzo` a propósito, aunque el traje común lo ofrezca: esa
         clase trae `touch-action: manipulation`, y dentro de una zona que MFDrag
         pone en `touch-action: none` justo para quedarse el gesto, un hijo que
         reactiva el paneo deja al navegador quitarle el arrastre a mitad. La
         hoja declara `.domino-ficha__caja` entera (posición y proporción). */
      var caja = document.createElement("span");
      caja.className = "domino-ficha__caja";
      /* Las rutas de los DOS estados viajan en el dataset: es lo que
         `montaje.sprite()` lee para intercambiar la lámina (retos.js:514-553), y
         mientras las rutas sean null no se escribe ninguna y el intercambio es
         un no-op silencioso, que es exactamente lo que debe hacer sin arte. */
      if (ARTE.tumbada) caja.setAttribute("data-lamina-tumbada", ARTE.tumbada);
      if (ARTE.ficha) caja.setAttribute("data-lamina-pie", ARTE.ficha);

      var fig = lamina("domino-ficha__lamina", ARTE.tumbada);
      caja.appendChild(fig);

      /* Etiqueta larga: baja un punto y cabe en dos líneas. Jamás ellipsis —
         cortar una opción a medias es peor que una segunda línea (canon de
         `.reto-placa--larga`, mismo umbral de 18 caracteres). */
      var texto = document.createElement("span");
      texto.className = "domino-ficha__texto" + (p.corta.length > 18 ? " domino-ficha__texto--larga" : "");
      texto.textContent = p.corta;
      caja.appendChild(texto);

      nodo.appendChild(caja);
      bandeja.appendChild(nodo);

      p.nodo = nodo;
      p.caja = caja;
      p.fig = fig;
      p.slot = null;
      return p;
    }

    function piezaDe(nodo) {
      for (var i = 0; i < piezas.length; i++) { if (piezas[i].nodo === nodo) return piezas[i]; }
      return null;
    }

    function slotDe(nodo) {
      for (var i = 0; i < slots.length; i++) { if (slots[i].nodo === nodo) return slots[i]; }
      return null;
    }

    function indiceDe(s) {
      for (var i = 0; i < slots.length; i++) { if (slots[i] === s) return i; }
      return -1;
    }

    /* Aquí iba «¡Empuja!». No hay ni un `<button>` propio en toda la fase: el
       único acto del alumno es colocar, y el tercero arranca la cadena
       (constante de arriba). El inventario de botones del gate F0 §0.13.2 queda
       por tanto en cero. */

    m.cuerpo.appendChild(raiz);

    /* ------------------------------------------------------- calibración ---- */

    /* Paso de calibración obligatorio (apéndice A, e): las proporciones y los
       pivotes salen de `naturalWidth/naturalHeight` de la lámina ENTREGADA, no
       de lo que pedía el prompt. Sin lámina no se escribe nada y la hoja se
       queda con sus valores por defecto, que es lo correcto en el prototipo
       gris. Se llama en el `load` de cada imagen porque una lámina en caché
       puede estar lista ya y otra llegar tarde. */
    function proporcion(img) { return (img.naturalWidth / img.naturalHeight).toFixed(3); }

    function calibrar() {
      var i, p, marca;
      if (esImagen(campanaImg) && campanaImg.naturalWidth) {
        raiz.style.setProperty("--dom-campana-ratio", proporcion(campanaImg));
      }
      /* El pivote del tañido NO se escribe aquí: la hoja lo fija en el 8 % que F6
         midió y verificó en pantalla. Medida propia sobre esta lámina, por si
         algún día molesta: su aro ocupa las filas 13..66 px de 360, así que el
         centro del agujero cae en el 11 % — dos píxeles a 66 px de campana, y la
         uniformidad entre los ocho juegos vale más. La fórmula de la ficha
         (`margenFrac.y + 0,045`) supone un TRAVESAÑO dibujado y solo servirá el
         día que exista una `campanita.webp` propia con él. */

      marca = escena.querySelector("img.domino-marca");
      if (marca && marca.naturalWidth) raiz.style.setProperty("--dom-marca-ratio", proporcion(marca));

      for (i = 0; i < piezas.length; i++) {
        p = piezas[i];
        if (!esImagen(p.fig) || !p.fig.naturalWidth) continue;
        /* El pivote de caída va EN LÍNEA sobre la lámina y pisa el `100% 100%` de
           la hoja: con el troquel, la esquina dibujada cae en ≈94 %/96 % y con el
           100 % la ficha giraría sobre un punto en el aire. */
        p.fig.style.transformOrigin = pivoteCaida(p.fig);
        if (p.slot == null && ARTE.tumbada) {
          raiz.style.setProperty("--dom-ratio", proporcion(p.fig));
          raiz.style.setProperty("--dom-texto-inset", INSET_TEXTO_LAMINA);
        }
        if (p.slot != null && ARTE.ficha) raiz.style.setProperty("--dom-ratio-pie", proporcion(p.fig));
      }
      medirBandeja();
    }

    /* Si la columna de la bandeja no da para un tile de 44 px con la proporción
       real de la lámina, la bandeja pasa a UNA columna: antes eso que deformar
       el dibujo o dejar la diana por debajo del mínimo de la casa. */
    function medirBandeja() {
      var alguna = bandeja.querySelector(".domino-ficha");
      if (!alguna) return;
      var r = alguna.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && r.height < DIANA) bandeja.classList.add("domino-bandeja--una");
    }

    if (esImagen(campanaImg)) campanaImg.addEventListener("load", calibrar);
    if (esImagen(mascotaFig)) mascotaFig.addEventListener("load", calibrar);
    calibrar();

    /* ------------------------------------------------------ colocar y quitar - */

    /* Ritual de reparentado, OBLIGATORIO antes de todo `appendChild` que mueva
       una pieza. MFDrag guarda estado privado por pieza (`__mfdragBase`,
       `__mfdragOff`, mfdrag.js:93-107) y el `control` solo expone
       `{destruir, elegir, elegida}`: ni `destruir()` los borra. Sin limpiarlos,
       la ficha aparece desplazada en su nuevo padre y el siguiente arrastre
       arranca desde el offset viejo. Son campos privados de mfdrag.js: tocarlos
       es la única vía hasta que F0 exponga un `control.reposar(pieza)`. */
    function reparentar(nodo, padre) {
      nodo.style.transform = "";
      nodo.__mfdragOff = { x: 0, y: 0 };
      nodo.__mfdragBase = "";
      padre.appendChild(nodo);
    }

    /* Vuelo propio de 250 ms (apéndice A, D3). Va por `translate` sobre la CAJA
       —un nodo que MFDrag no toca— y con la técnica de leer el rect antes y
       después del reparentado: así el nodo ya vive en su destino desde el primer
       frame y lo único que se anima es la diferencia. Nunca por `transform`
       sobre el nodo-pieza: ahí escribe MFDrag. */
    function volar(p, r0) {
      if (quieto) return;
      var r1 = p.nodo.getBoundingClientRect();
      var dx = Math.round(r0.left - r1.left), dy = Math.round(r0.top - r1.top);
      if (!dx && !dy) return;
      p.caja.style.transition = "none";
      p.caja.style.translate = dx + "px " + dy + "px";
      void p.caja.offsetWidth;                       /* sin reflow, el navegador funde los dos estados */
      p.caja.style.transition = "translate " + MS_VUELO + "ms cubic-bezier(0.2, 0.8, 0.3, 1)";
      p.caja.style.translate = "0px 0px";
      luego(MS_VUELO + 20, function () {
        p.caja.style.transition = "";
        p.caja.style.translate = "";
      });
    }

    /* El «toc»: microsquash + golpe seco de madera. Regla dura 3 de la ficha —
       sin él la fase 1 es sabor cero— y por eso vive en el camino ÚNICO por el
       que pasan el arrastre, el par tocar-tocar y el teclado. */
    function toc(p) {
      if (window.MFJuice && MFJuice.squash) MFJuice.squash(p.caja);
      if (window.MFSonido && MFSonido.nota) {
        MFSonido.nota(180, { tipo: "sine", attack: 3, decay: 90, gain: 0.3 });
      }
    }

    function colocar(p, s) {
      if (!p || !s) return;
      var previa = s.ficha;
      var r0 = p.nodo.getBoundingClientRect();

      if (p.slot) { p.slot.ficha = null; p.slot.placa.textContent = ""; }
      /* Intercambio en un gesto: la incumbente vuelve a la bandeja y la nueva
         ocupa el hueco. Sin esto, el caso «ficha buena en hueco equivocado» se
         convertiría en un bloqueo, que es justo lo que la ficha prohíbe. */
      if (previa && previa !== p) devolver(previa, false);

      reparentar(p.nodo, s.hueco);
      p.nodo.classList.remove("domino-ficha--bandeja");
      p.nodo.classList.add("domino-ficha--puesta");
      p.slot = s;
      s.ficha = p;
      s.placa.textContent = p.corta;
      s.placa.classList.remove("domino-placa--ok");
      if (m.sprite) m.sprite(p.caja, "pie");
      volar(p, r0);
      toc(p);
      /* UN solo anuncio por acción: `.reto-vivo` se vacía y se reescribe en cada
         llamada (retos.js:725-735), así que dos seguidas dejarían al lector de
         pantalla solo con la última y se perdería dónde cayó la ficha. */
      var lleno = revisarFila();
      anunciar(T.puesta.replace("{c}", p.corta).replace("{n}", String(indiceDe(s) + 1)) +
        (lleno ? " " + T.completa : ""));
    }

    function devolver(p, conAnuncio) {
      if (!p) return;
      var r0 = p.nodo.getBoundingClientRect();
      if (p.slot) { p.slot.ficha = null; p.slot.placa.textContent = ""; p.slot = null; }
      reparentar(p.nodo, bandeja);
      p.nodo.classList.remove("domino-ficha--puesta");
      p.nodo.classList.add("domino-ficha--bandeja");
      p.fig.classList.remove("domino-cae", "domino-tambalea", "domino-levanta");
      p.fig.style.removeProperty("--i");
      if (m.sprite) m.sprite(p.caja, "tumbada");
      volar(p, r0);
      revisarFila();
      if (conAnuncio) {
        toc(p);
        anunciar(T.quitada.replace("{c}", p.corta));
      }
    }

    function filaLlena() {
      for (var i = 0; i < slots.length; i++) { if (!slots[i].ficha) return false; }
      return true;
    }

    /* Devuelve si la fila quedó completa, para que quien la llamó componga UN
       solo anuncio. No anuncia por su cuenta.
       Se dispara al llenarse el ÚLTIMO hueco vacío, sea cual sea: si el alumno
       llena el 3, luego el 1 y luego el 2, es esa tercera colocación la que
       arranca la cadena. */
    function revisarFila() {
      if (est !== "plan" && est !== "montando") return filaLlena();
      if (filaLlena()) { arrancar(); return true; }
      estado("plan");
      mascota.classList.remove("domino-mascota--lista");
      return false;
    }

    /* ------------------------------------------------- arrastre y toques ---- */

    /* Las dos rutas devuelven lo MISMO: arrastrar y tocar-tocar tienen que ser
       equivalentes hasta en los tiempos (criterio del gate). El juicio entero
       vive en `alEncajado`, que es el único instante en que la pieza ya está en
       su sitio, y por eso el par tocar-pieza + tocar-destino cambia de lámina y
       suena igual que el dedo. */
    /* El veredicto envuelto: cuando el gesto NO coloca la ficha, MFDrag la
       devuelve a su sitio pero no avisa por `alEncajado`, así que es aquí donde
       hay que volver a tumbar la que se levantó al tomarla. Sin esto, una ficha
       soltada en el vacío se quedaría de pie en la bandeja. */
    function veredicto(pieza, destino) {
      var r = veredictoDe(pieza, destino);
      if (r === "vuelve") {
        var q = piezaDe(pieza);
        if (q && !q.slot && m.sprite) m.sprite(q.caja, "tumbada");
      }
      return r;
    }

    function veredictoDe(pieza, destino) {
      if (ocupado || !destino) return "vuelve";
      if (est !== "plan") return "vuelve";
      var p = piezaDe(pieza);
      if (!p) return "vuelve";
      if (destino === bandeja) return p.slot ? "encaja" : "vuelve";
      var s = slotDe(destino);
      if (!s || s.ficha === p) return "vuelve";
      /* Este gesto va a completar la fila, así que ES el empujón: aquí empieza
         el cronómetro del gate §13.6 —que se mide desde el último gesto del
         alumno, no desde un botón que ya no existe— y aquí arranca también la
         inclinación de la mascota. Ponerla AHORA y no en `arrancar()` es la
         palanca que la ficha manda usar: sus 200 ms transcurren durante el viaje
         del encaje (120 ms a dedo, 250 por toques), que ya estaba pasando, en
         vez de sumarse detrás de él. */
      if (cerrarFila(p, s)) {
        tGesto = ahora();
        mascota.classList.add("domino-mascota--lista");
      }
      return "encaja";
    }

    /* ¿Es esta colocación la que deja los N huecos llenos? Solo puede serlo una
       ficha que viene de la BANDEJA a un hueco vacío: mover una ya puesta libera
       el suyo e intercambiar devuelve la incumbente a la bandeja, así que en los
       dos casos el número de ocupados no sube. */
    function cerrarFila(p, s) {
      if (p.slot || s.ficha) return false;
      for (var i = 0; i < slots.length; i++) {
        if (slots[i] !== s && !slots[i].ficha) return false;
      }
      return true;
    }

    function alEncajado(pieza, destino) {
      if (!vivo()) return;
      var p = piezaDe(pieza);
      if (!p) return;
      if (destino === bandeja) devolver(p, true);
      else colocar(p, slotDe(destino));
    }

    control = window.MFDrag ? MFDrag.crear({
      zona: zona,
      piezas: ".domino-ficha",
      /* El nodo-pieza es un marco que no pinta nada: en vuelo mide 173×101 y no
         tiene fondo, ni borde, ni sombra (medido en pantalla), mientras el
         dibujo es la lámina, pegada al fondo de la caja y 17 px por debajo de su
         centro. Sin decirlo, MFDrag centraría en el dedo un rectángulo vacío y
         la ficha quedaría baja. */
      cuerpo: ".domino-ficha__lamina",
      /* El SLOT (70×130), no el hueco (48×76): MFDrag resuelve el destino con el
         rect del propio elemento-destino (solape mfdrag.js:230-240), así que con
         `.domino-hueco` la diana real sería la mitad de la prometida. */
      destinos: ".domino-slot, .domino-bandeja",
      umbral: 6,
      /* SOLO tolerancia de soltado, idéntica para toda combinación ficha-hueco:
         jamás distingue correcto de incorrecto (regla dura 2). */
      iman: 26,
      limites: true,
      toques: true,                        /* obligatorio: WCAG 2.2 SC 2.5.7 */
      alAgarrar: function (pieza) {
        if (ocupado) return;
        /* El hundimiento va en el pointerdown, que es lo que separa «responde»
           de «va lento» (<100 ms). Va en la CAJA y no en el nodo-pieza: la clase
           del kit es un `transform` y ahí escribe MFDrag en línea. */
        var p = piezaDe(pieza);
        if (p && window.MFJuice && MFJuice.respuesta) MFJuice.respuesta(p.caja);
        /* LA FICHA SE LEVANTA AL TOMARLA (titular 2026-09-04): la lámina pasa
           de tumbada a en pie y la caja adopta el tamaño que tendrá puesta, de
           modo que lo que se arrastra ya es lo que va a quedar y apuntar al
           hueco deja de ser a ciegas. El tamaño y el rótulo los cambia el CSS
           con `.mfdrag-vuelo`/`.mfdrag-elegida`; aquí solo la lámina, que es un
           `src` y el CSS no alcanza.
           Solo las de la BANDEJA: una ya puesta ya está de pie. */
        if (p && !p.slot && m.sprite) m.sprite(p.caja, "pie");
      },
      alSoltar: veredicto,
      alTocar: veredicto,
      alEncajado: alEncajado
    }) : null;

    /* Anuncio de la alternativa por toques: MFDrag marca la pieza elegida con
       `.mfdrag-elegida` (alzado + contorno) y aquí se cuenta con palabras qué
       toca hacer ahora. */
    bandeja.addEventListener("click", function (e) {
      if (!control || ocupado || !e.target || !e.target.closest) return;
      var nodo = e.target.closest(".domino-ficha");
      if (!nodo) return;
      var p = piezaDe(nodo);
      if (p && control.elegida() === nodo) anunciar(T.elegida.replace("{c}", p.corta));
    });

    /* Sin MFDrag cargado el juego no puede arrastrar, pero tampoco puede
       quedarse mudo: tocar una ficha la elige y tocar un hueco la coloca. Es fea
       y no tiene viaje, pero la partida se juega, se gana y cobra igual — que es
       la regla de la casa con las piezas opcionales del sistema. */
    if (!control) {
      zona.addEventListener("click", function (e) {
        if (ocupado || !e.target || !e.target.closest) return;
        if (est !== "plan") return;
        var nodo = e.target.closest(".domino-ficha");
        if (nodo) {
          var p = piezaDe(nodo);
          if (!p) return;
          if (elegidaFallback) elegidaFallback.nodo.classList.remove("mfdrag-elegida");
          elegidaFallback = (elegidaFallback === p) ? null : p;
          if (elegidaFallback) {
            elegidaFallback.nodo.classList.add("mfdrag-elegida");
            anunciar(T.elegida.replace("{c}", p.corta));
          }
          return;
        }
        if (!elegidaFallback) return;
        var destino = e.target.closest(".domino-slot, .domino-bandeja");
        if (!destino) return;
        var elegida = elegidaFallback;
        elegida.nodo.classList.remove("mfdrag-elegida");
        elegidaFallback = null;
        if (destino === bandeja) { if (elegida.slot) devolver(elegida, true); return; }
        var s = slotDe(destino);
        if (!s || s.ficha === elegida) return;
        /* Mismo cronómetro y misma inclinación anticipada que en el camino de
           MFDrag: este toque es el empujón cuando cierra la fila. */
        if (cerrarFila(elegida, s)) { tGesto = ahora(); mascota.classList.add("domino-mascota--lista"); }
        colocar(elegida, s);
      });
    }

    /* --------------------------------------------------------- el veredicto - */

    /* Puro, sin DOM (ficha §9.2): primer índice de hueco cuya ficha no coincide
       con la secuencia esperada —un señuelo en cualquier hueco es error en su
       posición, y una ficha buena en hueco equivocado lo es en el primer
       desajuste—, o -1 si coinciden todas. La culpable para `fallar()` es
       SIEMPRE la primera en orden de caída, no la última colocada: es la
       semántica exacta del contrato de feedback por opción. */
    function primerError() {
      for (var i = 0; i < N; i++) {
        var puesta = slots[i].ficha;
        if (!puesta || puesta.i !== esperada[i].i) return i;
      }
      return -1;
    }

    /* ------------------------------------------------------- EL EMPUJÓN §3 -- */

    /* Lo llama SOLO `revisarFila` al quedar lleno el último hueco. `ocupado` se
       pone en el mismo instante, así que todo toque posterior se ignora —no se
       encola— y no hay ventana para un segundo disparo. */
    function arrancar() {
      if (ocupado) return;
      ocupado = true;
      mem.intentos++;
      if (!tGesto) tGesto = ahora();     /* camino de reserva: sin MFDrag no pasa por `veredicto` */
      estado("redoble");

      /* La inclinación ya viene puesta desde el veredicto y aquí solo se asegura:
         entre la última colocación y el juicio hay TIEMPO, no un control — la
         excepción (c) de F0 §0.13.2 en su forma pura. */
      mascota.classList.add("domino-mascota--lista");
      if (window.MFJuice && MFJuice.anticipar) MFJuice.anticipar(mascotaFig, MS_REDOBLE);
      /* Redoble de taiko suave: cuatro golpes de 147 Hz repartidos en los 400 ms
         de la anticipación. El sonido no es movimiento: suena también con
         movimiento reducido, y solo si el alumno encendió el interruptor. */
      if (window.MFSonido && MFSonido.nota) {
        for (var r = 0; r < 4; r++) {
          MFSonido.nota(147, { tipo: "triangle", attack: 5, decay: 80, gain: 0.12, retardo: r * 100 });
        }
      }
      luego(quieto ? 0 : MS_REDOBLE, correrCadena);
    }

    /* --------------------------------------------------------- LA CADENA §3 - */

    function correrCadena() {
      estado("cadena");
      var fallo = primerError();
      var cajas = [], i;
      for (i = 0; i < N; i++) cajas.push(slots[i].ficha.caja);

      /* Una sola pasada de lectura de layout, con todas las fichas ya en pie: la
         ficha dice «al montar», pero al montar la fila está VACÍA y no hay nada
         que medir. Aquí los rects son los reales, y girar la pantalla entre dos
         empujones recalcula sin cachear nada. */
      var tabla = quieto ? tablaQuieta(N) : tablaDeTiempos(cajas, campanita);

      /* El dedo empuja: el desplazamiento sale de dónde está la YEMA dibujada,
         no del borde del <img>. Sin lámina no hay yema que medir y la hoja se
         queda con su valor por defecto. Va en `translate` y no en `transform`
         porque `.juice-anticipa` acaba de ocupar el `transform` de ese nodo. */
      if (!quieto) {
        var empuje = empujeDelDedo(esImagen(mascotaFig) ? mascotaFig : null, cajas[0]);
        if (empuje != null) mascota.style.setProperty("--dom-empuje", empuje + "px");
        mascota.classList.add("domino-mascota--empuja");
      }

      for (i = 0; i < tabla.length; i++) {
        var ev = tabla[i];
        if (ev.tipo === "cae") {
          if (fallo === ev.i) { programarFallo(ev.ms, ev.i); break; }
          programarCaida(ev.ms, ev.i);
        } else if (ev.tipo === "contacto") {
          programarContacto(ev.ms, ev.i);
        } else {
          programarCampanada(ev.ms, fallo === -1);
        }
      }
    }

    function programarCaida(ms, k) {
      luego(Math.round(ms), function () {
        var p = slots[k].ficha;
        if (p) p.fig.classList.add("domino-cae");
      });
    }

    /* Cada contacto es un GOLPE: 60 ms de tiempo congelado, «clac» de madera con
       peso creciente y microsquash sobre la ficha que lo recibe. El hit-stop ya
       está descontado en la cronología (tablaDeTiempos). */
    function programarContacto(ms, k) {
      luego(Math.round(ms), function () {
        if (window.MFJuice && MFJuice.hitstop) MFJuice.hitstop(escena, MS_HITSTOP);
        if (window.MFSonido && MFSonido.nota) {
          var frecuencias = [262, 233, 208];
          MFSonido.nota(frecuencias[Math.min(k, frecuencias.length - 1)],
            { tipo: "triangle", attack: 3, decay: 70, gain: 0.2 });
        }
        var siguiente = slots[k + 1] && slots[k + 1].ficha;
        if (siguiente && window.MFJuice && MFJuice.squash) MFJuice.squash(siguiente.caja);
      });
    }

    function programarCampanada(ms, limpio) {
      luego(Math.round(ms), function () { campanada(limpio); });
    }

    function programarFallo(ms, k) {
      luego(Math.round(ms), function () { falloPausa(k); });
    }

    /* ------------------------------------------------ CAMPANADA · acierto §5 - */

    function campanada(entera) {
      estado("campanada");
      campanaImg.classList.add("domino-tañe");
      mascotaFig.classList.add("domino-mascota--salta");
      luego(MS_SALTA + 40, function () { mascotaFig.classList.remove("domino-mascota--salta"); });

      /* Variante de racha: si la cadena corre entera al PRIMER empujón, la
         campana da su segunda campanada a +350 ms y las partículas suben a 12.
         Variar el premio, no el gesto. Es además el ÚNICO caso que cobra el +5,
         así que la misma variable manda sobre el premio y sobre el sabor. */
      var perfecto = !!entera && mem.intentos === 1;
      /* Se pregunta UNA vez y el mismo número manda sobre el texto y sobre el
         vuelo al HUD: dos preguntas podrían dar dos cifras y ya habría una
         pantalla mintiendo. Un 0 = esta partida no paga, y entonces no se canta
         ningún XP en ninguno de los dos sitios. */
      var paga = premio(perfecto);

      if (window.MFSonido) {
        if (MFSonido.campana) MFSonido.campana(perfecto);
        if (MFSonido.vibrar) MFSonido.vibrar([10, 30, 20]);
      }

      /* Una sola lectura de layout antes de escribir efectos: el punto de la
         campana en coordenadas del escenario. */
      if (window.MFJuice && m.escenario) {
        var rc = campanita.getBoundingClientRect();
        var re = m.escenario.getBoundingClientRect();
        var cx = rc.left + rc.width / 2 - re.left;
        var cy = rc.top + rc.height / 2 - re.top;
        if (MFJuice.destello) {
          MFJuice.destello(m.escenario, cx, cy, { radio: 52, color: "rgba(255,215,120,0.9)" });
        }
        if (MFJuice.particulas) {
          MFJuice.particulas(m.escenario, {
            x: cx, y: cy, n: perfecto ? 12 : 8, angulo: -90, dispersion: 70,
            dist: [40, 90], dur: [450, 650],
            colores: ["#f2c230", "#e63b2e", "#f7f3ec"], forma: "estrella"
          });
        }
      }

      anunciar(T.gana);
      /* Con movimiento reducido el resultado tiene que poder LEERSE: la fila de
         fichas caídas no basta como única señal (§11.6). */
      if (quieto) resultado(paga ? conXP(T.resultadoXp, paga) : T.resultado);

      luego(quieto ? 0 : MS_SELLO, function () {
        if (window.MFJuice && MFJuice.sello) MFJuice.sello(m.escenario, T.sello);
        /* Medición del gate §13.6: del tap en «¡Empuja!» al fin del sello, techo
           2,0 s. Se deja en el DOM en vez de en la consola para que el playtest
           la lea con el inspector abierto sin instrumentar nada. */
        if (tGesto) raiz.setAttribute("data-ciclo-sello", String(Math.round(ahora() - tGesto)));
      });

      /* El cobro solo vuela si el bonus es de verdad: en examen no existe
         —mission.js lo cobra con `!isExam`— y desde la sala de retos puede valer
         menos, o nada. Prometer un XP que jamás llega sería enseñar una mentira,
         así que con `paga` en 0 no vuela nada. Los nodos del vuelo cuelgan de
         <body> (juice.js:271-278), así que sobreviven al cierre del modal. */
      if (paga && !quieto) {
        luego(MS_COBRO, function () {
          if (window.MFJuice && MFJuice.volarXP) MFJuice.volarXP(campanita, paga);
        });
      }

      luego(quieto ? MS_QUIETO : MS_CIERRE, function () { cerrar(entera); });
    }

    /* --------------------------------------------------- FALLO CÓMICO §5.2 -- */

    /* Sin `MFJuice.fallo()`: su rebote con estrellitas pisaría el gag propio. El
       fallo del dominó es la cadena MURIENDO — la ficha equivocada se queda en
       pie, se tambalea y se disculpa. Nunca humilla: se disculpa la ficha, no el
       alumno. Y sin vibración, nunca (F0 §0.4.3). */
    function falloPausa(k) {
      estado("fallo_pausa");
      var p = slots[k].ficha;
      if (!p) { cerrar(false); return; }

      p.fig.classList.add("domino-tambalea");
      ponerGota(p);
      if (window.MFSonido && MFSonido.fallo) MFSonido.fallo();

      /* Tambaleo + 300 ms de silencio cómico ANTES del panel: el timing de
         comedia es lo que convierte el fallo en un gag y no en un regaño. */
      luego(quieto ? 0 : (MS_TAMBALEO + MS_SILENCIO), function () { leccion(k, p); });
    }

    function ponerGota(p) {
      if (p.gota) return;
      var g = lamina("domino-gota", ARTE.gota);
      p.caja.appendChild(g);
      p.gota = g;
    }

    /* Se QUITA del DOM, no se oculta con display:none: nada de nodos muertos
       entre reintentos. */
    function quitarGota(p) {
      if (p.gota && p.gota.parentNode) p.gota.parentNode.removeChild(p.gota);
      p.gota = null;
    }

    function leccion(k, p) {
      estado(m.examen ? "leccion_examen" : "leccion");
      /* Lo que ENSEÑA es el feedback escrito de ESA opción; el panel, el anuncio
         y el evento `reto_fail` los pone la infraestructura. La ficha manda
         llamar además a `montaje.feedback()`, pero en el código real ese es el
         camino del acierto PARCIAL (`retro`, retos.js:778-783) y pintaría un
         segundo panel en verde encima del rojo: `fallar()` ya abre el suyo. */
      m.fallar(p.i);
      /* Después del panel: `fallar` ya anunció el feedback y esta línea deja
         como estado final del lector la instrucción de qué hacer ahora. */
      anunciar(m.examen
        ? T.fallaExamen.replace("{c}", p.corta).replace("{o}", ordenCorrecto())
        : T.falla.replace("{c}", p.corta));

      if (m.examen) {
        revelarOrden();
        if (quieto) resultado(T.resultadoKo.replace("{c}", p.corta));
        esperarLectura(function () { cerrar(false); });
        return;
      }
      if (quieto) resultado(T.resultadoKo.replace("{c}", p.corta));
      /* Repesca ilimitada, sin cronómetro y SIN BOTÓN (F0 §0.13.2): la cadena se
         repone sola cuando se cumple el tiempo de lectura. */
      esperarLectura(function () { recolocar(k); });
    }

    function ordenCorrecto() {
      var s = [], i;
      for (i = 0; i < esperada.length; i++) s.push(esperada[i].corta);
      return s.join(", ");
    }

    /* Examen sin repesca (F0 §0.9.2): las placas muestran el orden correcto, con
       ✓ delante para que el estado no dependa del color. Anti-celebración
       deliberada: ni sello, ni partículas, ni sonido de premio. El examen
       informa, no premia. */
    function revelarOrden() {
      for (var i = 0; i < N; i++) {
        slots[i].placa.textContent = "✓ " + esperada[i].corta;
        slots[i].placa.classList.add("domino-placa--ok");
      }
    }

    /* Tiempo mínimo de lectura antes de continuar, proporcional al texto: no es
       un cronómetro contra el alumno —nada expira nunca en su contra—, sino la
       forma de dar tiempo a leer SIN un botón «Recolocar»/«Continuar», que F0
       §0.13.2 prohíbe. Patrón y cifras de F3 (pasa.js:1152-1170), ya reutilizado
       por F8. NO lleva el `quieto ? 0 :` del resto de esperas: las demás miden
       ANIMACIONES, que con movimiento reducido no existen; esto mide LECTURA,
       que existe igual. */
    function esperarLectura(fn) {
      var panel = m.cuerpo.querySelector(".reto-feedback");
      var ms = 1400;
      if (panel) {
        ms = Math.min(4200, Math.max(1400, 60 * palabras(textoPlano(panel.innerHTML))));
        /* La barra convierte un avance automático en algo predecible: sin ella
           la escena se mueve sola y parece que la página hizo algo por su
           cuenta. Se reutiliza `.pasa-espera` —la de F3, que ya vive en game.css
           y es exactamente esta pieza— en vez de inventar una `.domino-espera`
           que la hoja no declararía. Su sitio es el traje común de F0 como
           `.reto-espera`; el día que suba, aquí solo cambia el nombre. */
        var barra = document.createElement("span");
        barra.className = "pasa-espera";
        barra.setAttribute("aria-hidden", "true");
        barra.style.setProperty("--pasa-espera-ms", ms + "ms");
        panel.appendChild(barra);
        /* Quien ya leyó no espera: un toque en el panel adelanta. Es un atajo,
           nunca un requisito — si nadie toca, continúa solo. */
        panel.addEventListener("click", function () { fn(); });
      }
      luego(ms, fn);
    }

    /* ----------------------------------------------- RECOLOCAR · repesca §3 -- */

    /* Reponer el teatro: las caídas se levantan (200 ms, escalonadas 60 ms en
       orden INVERSO al de caída) y solo entonces la culpable vuela a la bandeja,
       para que el ojo vea primero la cadena repuesta. La recolocación es
       PARCIAL: nada obliga a rehacer la fila entera, y todas las fichas siguen
       siendo recolocables — es lo que evita el bloqueo cuando la ficha buena
       está en el hueco equivocado. */
    function recolocar(k) {
      if (est !== "leccion") return;               /* el toque del panel puede llegar dos veces */
      estado("recoloca");
      var p = slots[k].ficha;
      var i, caida, orden = 0;

      if (p) {
        quitarGota(p);
        p.fig.classList.remove("domino-tambalea");
      }

      /* El escalón del levantarse va en orden INVERSO al de la caída, así que su
         `--i` no es el del slot: se escribe en la LÁMINA, que es el nodo animado,
         y ahí solo lo lee el `animation-delay`. El `--i` del slot —el que invierte
         el apilado con `z-index`— se queda intacto. */
      for (i = k - 1; i >= 0; i--) {
        caida = slots[i].ficha;
        if (!caida) continue;
        caida.fig.classList.remove("domino-cae");
        caida.fig.style.setProperty("--i", String(orden));
        caida.fig.classList.add("domino-levanta");
        orden++;
      }
      var total = quieto ? 0 : (MS_LEVANTA + MS_ESCALON * Math.max(0, orden - 1) + 40);
      luego(total, function () {
        for (var j = 0; j < N; j++) {
          if (!slots[j].ficha) continue;
          slots[j].ficha.fig.classList.remove("domino-levanta");
          slots[j].ficha.fig.style.removeProperty("--i");
        }
        if (p) devolver(p, false);
        mascota.classList.remove("domino-mascota--empuja");
        anunciar(T.repuesta);
        ocupado = false;
        estado("plan");
        revisarFila();
      });
    }

    /* ------------------------------------------------------------- el cierre - */

    function resultado(texto) {
      if (raiz.querySelector(".reto-resultado")) return;
      var pnodo = document.createElement("p");
      pnodo.className = "reto-resultado";
      pnodo.textContent = texto;
      raiz.appendChild(pnodo);
    }

    /* `intentos` es el equivalente del `attempts` de mission.js: los juicios que
       le costó la tarjeta, 1 en la cadena limpia. El `limpio` lo vuelve a
       comprobar la infraestructura contra su propio conteo persistido: cerrar y
       reabrir no puede regalar el bonus. */
    function cerrar(limpio) {
      if (cerrado) return;
      cerrado = true;
      mem.resuelto = true;
      estado("resuelto");
      if (tGesto) raiz.setAttribute("data-ciclo-total", String(Math.round(ahora() - tGesto)));
      m.resolver({
        limpio: !!limpio && mem.intentos === 1,
        intentos: Math.max(1, mem.intentos),
        ms: Math.round(ahora() - t0)
      });
    }

    /* --------------------------------------------------------------- arranque */

    anunciar(T.abre);

    /* La caja del modal tarda 220 ms en subir (animación de la casa); el juego
       no añade teatro propio, solo espera a que pare. */
    luego(quieto ? 0 : 220, function () {
      ocupado = false;
      estado("plan");
      revisarFila();
    });
  }

  /* ============================================================= REGISTRO === */

  MFRetos.registrar({
    id: "domino",
    nombre: T.nombre,
    icono: "👉",   /* el dedo empujador: mismo gesto que la lámina y mismo verbo
                      del juego, con presentación de color en cualquier móvil.
                      NUNCA un símbolo del bloque Domino Tiles (🁫, 🀰…): son de
                      presentación de texto y saldrían como caja tofu en Android,
                      donde el sitio solo carga Outfit e Inter. */
    banner: T.banner,
    comoSeJuega: T.comoSeJuega,
    /* Tope duro de ronda: nunca la tercera del examen, por duración (es el juego
       más largo del sistema). Lo aplica `admite()` en retos.js:258-263 y la
       permutación pura de `preferirRondas`, así que no cambia qué tarjetas ni
       qué juegos entran: solo el orden. */
    rondaMax: 2,
    /* Declaración de tipo, en una línea (F0 §0.13.3): el dominó representa una
       cadena que SE PROPAGA SOLA —un eslabón provoca el siguiente sin que el
       alumno intervenga—, así que solo entra donde el contenido describe un
       proceso que OCURRE, nunca un procedimiento que se EJECUTA. Contraejemplos
       donde mentiría: los protocolos de «¿qué haces primero?» (son del kata),
       las escalas de intensidad (`Norma › Influencia › … › Coerción`), las
       decisiones únicas y las taxonomías.
       POR ESO PIDE FAMILIA, y esto no es celo: medido sobre el corpus real, el
       `acepta()` de forma pura deja pasar 22 tarjetas (11 ES + 11 EN) y son
       EXACTAMENTE las mismas 22 que acepta el kata — solape del 100 %, ni una
       tarjeta propia. Y las once están escritas «¿qué haces primero?»: son
       procedimientos deliberados, así que el dominó prometería sobre ellas algo
       falso —«empujas una vez y el resto ocurre solo»— justo donde P·A·U·S·A y
       los ocho movimientos existen porque cada paso hay que hacerlo a propósito.
       La prueba de las diez tarjetas de F0 §0.13.3 da 0 de 11, y una sola
       respuesta «no» suspende el filtro.
       CONSECUENCIA, DICHA SIN ADORNOS: hoy `@familia: cadena` tiene CERO
       tarjetas, así que el dominó no sale sorteado ni una vez y las tarjetas de
       `orden` se quedan enteras con el kata, que es su dueño legítimo. Se
       arregla censando —el material está inventariado en §3.1 de la ficha:
       rumiación, puente del «siempre», internalización, escalada—, JAMÁS
       aflojando esta línea: la cobertura se gana con censo editorial (F0
       §0.13.3). `@familia:` admite cualquier valor en minúsculas y no cuesta una
       línea de código (build.py:346); el andamio es el precedente. */
    /* `familia:cadena` dejó de exigirse el 2026-09-02 (decisión del titular:
       todos los juegos sobre toda pregunta con orden completo). El párrafo de
       arriba queda como registro de por qué SE EXIGÍA. */
    necesita: ["corta", "orden"],
    acepta: function (tarjeta) {
      var ops = (tarjeta && tarjeta.options) || [];
      /* Rechazado si la tarjeta declara verdadero/falso: dos fichas de dominó no
         son una cadena, son una moneda. */
      if (tarjeta && tarjeta.reto && tarjeta.reto.vf) return false;
      var ords = [], sinOrden = 0, i;
      for (i = 0; i < ops.length; i++) {
        if (ops[i] && esNumero(ops[i].orden)) ords.push(ops[i].orden);
        else sinOrden++;
      }
      /* Comparador numérico explícito: `[].sort()` ordena como CADENAS, y el día
         que una secuencia llegue a diez pasos «10» se colaría delante de «2» y
         la validación daría por buena una cadena rota. */
      ords.sort(function (a, b) { return a - b; });
      var K = ords.length;
      if (K < 2 || K > 3) return false;                        /* 2-3 huecos exactos */
      for (i = 0; i < K; i++) { if (ords[i] !== i + 1) return false; }  /* 1..K sin huecos ni duplicados */
      /* Al menos un señuelo: sin él la fila se completa sola por descarte y el
         juego deja de medir nada (anti-delación, F0 §0.6.6). */
      /* Señuelos opcionales desde 2026-09-02: con las 3 opciones ordenadas la
         bandeja trae solo la cadena, y colocar 3 en orden sigue siendo reto. */
      return true;
    },
    jugar: jugar
  });
})();

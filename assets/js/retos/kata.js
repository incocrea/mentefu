/* MenteFu / MindFu — KATA DE TRES GOLPES (docs/07-miniretos/F8-kata-de-tres-golpes.md).

   La mascota está frente a tres o cuatro blancos rotulados y el alumno los toca
   EN EL ORDEN CORRECTO, como una kata. Cada golpe acertado enciende la linterna
   de su blanco, graba su número y hace volar la etiqueta hasta el círculo del
   pergamino; el primer toque fuera de orden es el fallo. Es el único juego del
   sistema que mide conocimiento PROCEDIMENTAL: no qué sabes, sino en qué orden
   lo haces.

   Este archivo SOLO pinta y juzga. El XP, los cierres, el historial del
   navegador, el panel de feedback y toda la telemetría los pone la
   infraestructura (retos.js) a través del `montaje`: aquí no hay ni un
   MF.track, ni una suma de XP, ni un listener de Escape.

   OCHO decisiones de este archivo que conviene no deshacer sin leer el porqué:

   · EL JUEGO NO ESCRIBE PÍXELES. Toda la geometría —la columna de la mascota,
     el corredor del avance, las dos columnas de la rejilla, las ranuras de las
     láminas y el presupuesto vertical del blanco— vive en la sección KATA de
     game.css, medida sobre el escenario REAL (~290 px en un móvil de 360, no
     los 340 de la ficha) y sobre las láminas ENTREGADAS. Aquí solo se ponen y
     se quitan clases, y lo único que se escribe en línea es lo que la hoja
     declara como del JS: `--kata-mx` / `--kata-rot` (el avance del remate), el
     `transition-delay` de la cascada y del revelado, y la `opacity` que
     desvanece la etiqueta fantasma. Es el mismo reparto que F1 fijó y que F6
     repite: lo que el JS gana escribiéndolo en línea es un invariante, nunca un
     gusto.

   · LAS DOS CORRECCIONES DE LA MASCOTA SON DE LA HOJA, NO DE AQUÍ. Las cuatro
     láminas casan en línea de suelo (traen el mismo 3,1-3,7 % de margen bajo
     los pies) pero NO en escala de personaje: a igual altura, la patada saca un
     12 % más de cabeza que el reposo y la sentada un 26 %. Y golpe y patada
     volvieron mirando a la IZQUIERDA aunque se pidieran «facing right», con los
     blancos a la derecha. Las dos cosas las arregla game.css —`--kata-fig-h`
     elegido por selector de `src`, y el espejo en la propiedad `scale`—, así
     que la corrección VIAJA CON EL SPRITE: este archivo cambia el `src` y no
     tiene ninguna variable que acordarse de poner ni, peor, de quitar en el
     camino de vuelta.

   · LA MASCOTA SON DOS NODOS. El exterior (`.kata-mascota`) es una CAJA de
     tamaño fijo que lleva el VIAJE en las propiedades independientes
     `translate`/`rotate` (vía `--kata-mx` / `--kata-rot`); el interior
     (`.kata-mascota__fig`) es el <img> que recibe las clases del kit
     (`juice-squash`, `juice-fallo`) y la peonza, que se montan sobre
     `transform` y `animation`. Con un solo nodo, la animación gana SIEMPRE al
     estilo en línea y la mascota se teletransportaría a su marca a mitad del
     remate. Es el canon ya medido en `.tw-mano` / `.tw-mano__fig`
     (`game.css:1447-1463`).

   · NI UN BOTÓN DE CONFIRMACIÓN, PORQUE LA REGLA 2 MANDA SOBRE LA FICHA. La
     ficha pedía un botón «Seguir» tras el fallo y un «Continuar» en el examen;
     F0 §0.13.2 (regla del titular del 2026-08-27, que «manda sobre toda ficha
     de F1 a F9») prohíbe los controles cuyo único cometido es rematar algo ya
     hecho y obliga a resolverlo con TIEMPO. Aquí: tras el fallo de misión la
     partida se reanuda sola en cuanto termina la comedia —el panel se queda
     abierto y el alumno sigue tocando blancos, que es la repesca—, y el
     veredicto de examen cierra con el tiempo de lectura proporcional al texto
     de F3 (1400-4200 ms, `pasa.js:1152-1170`), con barra predecible y toque
     opcional para adelantar. Este archivo no crea ni un `<button>` que no sea
     un blanco.

   · LOS TOQUES SE IGNORAN, NO SE ENCOLAN. Un `ocupado` de closure cubre el
     microimpacto, el fallo, el revelado y el remate. Encolarlos convertiría un
     doble tap nervioso en dos pasos dados de golpe, y el segundo se juzgaría
     contra un `hechos` que ya había cambiado.

   · EL PROGRESO NO SE PIERDE NUNCA. Un fallo no apaga ninguna linterna, no
     borra ningún número y no reinicia la kata: se reanuda desde el paso que
     iba. Y cerrar el modal a mitad conserva pasos, fallos y la barajadura, así
     que reabrir reanuda exacto (la memoria vive en un WeakMap por tarjeta y
     por intento de examen, igual que en F1 y F2).

   · FALTAN DOS LÁMINAS DE LAS NUEVE Y NO SE SUPLEN DIBUJANDO. De las nueve del
     apéndice A de la ficha el titular aprobó siete: `kata-ladrillos` (el cuarto
     prop) y `huellas-par` (la decoración del suelo) no se generaron. La ranura 4
     repite el makiwara —el recorte que la propia ficha deja escrito— y las
     huellas se van enteras. Ni un `filter` para fingir que el cuarto prop es
     otra cosa, ni un SVG para fingir unas huellas: eso es exactamente lo que la
     regla de arte prohíbe, y el orden ya lo cuentan los círculos numerados del
     pergamino y el sello de cada blanco.

   · CON `prefers-reduced-motion` NO HAY TEATRO PERO SÍ INFORMACIÓN. Se apagan
     el fantasma con fundido, el vuelo de la etiqueta (con guarda EXPLÍCITA:
     `element.animate()` NO lo apaga la regla global de CSS), la coreografía de
     golpes, la peonza y la pose sentada; se conservan los swaps que son ESTADO
     —la linterna encendida— y el resultado se cuenta además con TEXTO bajo la
     escena y en `.reto-vivo`. Nunca solo con animación.

   NI UNA ETIQUETA SVG, NI UNA FORMA CSS COMO OBJETO DEL JUEGO (F0 §0.12, regla
   del titular): linternas, props y las cuatro poses de la mascota nacen `<img>`
   con su lámina desde el primer fotograma y sus cambios de estado son
   intercambios de lámina, jamás filtros. Papel, círculos de paso y badges de
   número sí son HTML: son papel y tipografía, no objetos del juego (§7.3).

   DÓNDE ESTÁ EL TRAJE: en la sección `RETO: KATA DE TRES GOLPES` de
   `assets/css/game.css`, como en F1..F6, y en NINGÚN otro sitio. El porqué —y
   lo que costó comprobarlo— está escrito abajo, en el bloque «DÓNDE ESTÁ EL
   TRAJE». */
(function () {
  "use strict";

  /* Sin infraestructura no hay reto: mission.js cae solo a su quiz clásico. */
  if (!window.MFRetos || !MFRetos.registrar) return;

  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var A = cfg.assets || "";
  var XP = cfg.xp || {};

  var T = ES ? {
    nombre: "Kata de tres golpes",
    banner: "KATA",
    /* La línea de «qué hay que hacer», declarada por el JUEGO y no por quien la
       pinta: la enseñan dos interfaces —la ficha de la sala de retos y la
       tarjeta-invitación de la misión— y con una tabla en cada una, el día que
       se retoque la frase se retocará en una sola. Aquí hay una sola verdad. */
    comoSeJuega: "Ejecuta los golpes de la kata en su orden.",
    sello: "¡KATA!",
    abre: "Kata de {k} pasos. Toca los blancos en orden. Paso 1 de {k}.",
    ok: "Paso {n} de {k}: {c}. Correcto.",
    ko: "Aún no: {c}. Lee el consejo y sigue desde el paso {n}.",
    fin: "Kata completo.",
    finExamen: "El kata se corta ahí. La secuencia correcta queda marcada.",
    paso: "Paso {n}: aún no.",
    /* Los señuelos prestados del pool traen el feedback de OTRA pregunta:
       pintarlo confundiría, así que el juego pone su propia línea (§4.3). */
    senuelo: "Ese no es un movimiento de este kata. Vuelve al enunciado.",
    resultado: "Kata completo.",
    resultadoXp: "Kata completo. +5 XP",
    resultadoKo: "El kata se corta ahí."
  } : {
    nombre: "Three-Strike Kata",
    banner: "KATA",
    comoSeJuega: "Perform the kata strikes in order.",
    sello: "KATA!",
    abre: "A {k}-step kata. Tap the targets in order. Step 1 of {k}.",
    ok: "Step {n} of {k}: {c}. Correct.",
    ko: "Not yet: {c}. Read the tip and continue from step {n}.",
    fin: "Kata complete.",
    finExamen: "The kata stops there. The correct sequence is now marked.",
    paso: "Step {n}: not yet.",
    senuelo: "That is not a move of this kata. Check the prompt again.",
    resultado: "Kata complete.",
    resultadoXp: "Kata complete. +5 XP",
    resultadoKo: "The kata stops there."
  };

  /* ====================================================== EL ARTE DE LA FASE ==

     SIEMPRE el `.webp`: al publicar, el `.png` se descarta cuando existe su
     `.webp`, así que apuntar al PNG es apuntar a un 404 en producción. Y el
     prefijo `MF_CONFIG.assets` no es decorativo: las misiones cuelgan de cuatro
     niveles de carpeta y un `src` relativo escrito desde JS se resuelve contra
     la PÁGINA, así que sin él son 404 en todas ellas (retos.js:478-482,
     arbol.js:12). El `.png` sigue siendo la reserva del `onerror` de cada <img>,
     que es la única red que queda cuando el WebP no llega. */
  var JUEGOS = A + "assets/img/juegos/";
  var MASCOTA = A + "assets/img/mascota/";

  /* Nombre de archivo SIN extensión: `poner()` prueba .webp y cae a .png. */
  var LAM_OFF = "linterna-apagada";
  var LAM_ON = "linterna-encendida";
  var LAM_REPOSO = "reposo";
  var LAM_GOLPE = "golpe";
  var LAM_PATADA = "patada";
  var LAM_SENTADA = "sentada";
  /* las poses nuevas viven en la carpeta de escenas (docs/08) */
  var LAM_CANTO = "canto";
  var LAM_GANCHO = "gancho";
  var LAM_VOLADORA = "patada-voladora";

  /* Los props, POR RANURA y jamás por corrección: qué opción cae en qué ranura
     lo decide la barajadura (§4.4), así que la silueta no puede transportar ni
     un bit sobre la respuesta.

     La ranura 4 REPITE el makiwara. `kata-ladrillos` era la novena lámina y el
     titular no la aprobó, así que entra el recorte que la propia ficha deja
     escrito (§2 y §A.6): dos props iguales en pantalla. Las otras dos salidas
     estaban prohibidas y siguen estándolo — teñir el makiwara con un `filter`
     lo saca de la paleta uniforme (parte 4 de la regla de arte) y espejarlo con
     `scaleX(-1)` no engaña a nadie, porque es un poste vertical prácticamente
     simétrico respecto a su eje. Las dos iguales caen en diagonal (ranuras 1 y
     4 son las esquinas opuestas de la rejilla 2×2), que es donde menos se
     notan. El día que exista la lámina, esto es una línea. */
  var PROPS = ["kata-makiwara", "tameshiwari-tabla", "kata-teja", "kata-makiwara"];

  /* Las huellas 1-2-3 del suelo NO se montan, y no es un olvido: `huellas-par`
     era opcional en el apéndice A de la ficha y el titular no la aprobó. La
     regla de arte prohíbe sustituir una lámina que falta por un SVG o por
     formas CSS, así que lo que queda es BORRARLAS —el orden ya lo cuentan los
     círculos numerados del pergamino y el sello de cada blanco (§A.6)—. La hoja
     deja además `.kata-huella { display: none }` escrito como red, por si algún
     día un JS las monta por inercia y deja tres iconos de imagen rota sobre el
     tatami. El día que la lámina exista, se montan aquí y se quita esa regla. */

  /* ============================================================== MEDIDAS ====

     Proporciones REALES (ancho/alto) medidas sobre los archivos entregados, no
     las que pedía el prompt. Aquí no se usan para dimensionar —todas las
     ranuras son fijas y la lámina se contiene dentro— sino para poder auditar
     de un vistazo qué llegó y qué se pidió, y para el cálculo del ancho aparente
     de la mascota:

       kata-makiwara      398×512 = 0.777      (pedida «cuadrada»)
       kata-teja          510×512 = 0.996      (pedida «cuadrada»)
       tameshiwari-tabla 1000×401 = 2.494      (pedida 5:1, reutilizada de F1)
       linterna-apagada   166×256 = 0.648      (pedida 0.800)
       linterna-encendida 167×256 = 0.652      (pedida 0.800; casa al píxel con
                                                su gemela: mismo bbox alfa ±1 px,
                                                así que el swap no salta)
       reposo             550×700 = 0.786      (mascota canónica, de frente; mascota/)
       golpe              478×512 = 0.934      (pedida 0.800; mascota/)
       mascota-patada     453×512 = 0.885      (pedida 0.800)
       mascota-sentada    465×512 = 0.908      (pedida 0.800)

     Ancho de cabeza a igual altura de figura: es el invariante que de verdad
     importa, porque la cabeza es la parte del cuerpo que no puede cambiar de
     talla al golpear, y por tanto lo que delata un cambio de escala del
     personaje entre swaps. Medido: reposo 360 · golpe 381 · patada 377 ·
     sentada 423. La corrección la aplica la hoja (`--kata-fig-h` por selector
     de `src`), no este archivo. */

  /* Notas del arpegio: C5-E5-G5. Cada paso añade la suya, así que toda kata
     parcial suena a acorde a medio construir y la completa cierra el arpegio.
     Con K=2 suenan C5 y E5. */
  var NOTAS = [523.25, 659.25, 783.99];

  /* El sonido de cada pose de la coreografía (titular 2026-08-31: «y sonido a
     cada una»). Cada golpe repite LA NOTA DE SU PASO —la misma que sonó al
     tocar su blanco—, así que la kata se canta entera otra vez, en orden, y el
     acorde del sello reúne las tres: el alumno oye la secuencia que acaba de
     ejecutar, no tres pitidos iguales.

     Son DOS capas y no una porque una nota sola suena a interfaz y no a golpe:
     la del arpegio lleva la melodía y su octava grave le pone el cuerpo del
     impacto. La octava es consonante consigo misma, así que engorda el golpe
     sin ensuciar el acorde. Envolvente más corta y algo más floja que la del
     toque (decay 180 / gain 0.25): esto es el eco de un paso ya dado.

     Todo pasa por MFSonido, que comprueba el interruptor del modal por dentro
     (`listo()` devuelve null con el sonido apagado, juice.js:477): con el
     interruptor apagado no suena ni una, y aquí no hay ninguna guarda propia
     que pueda desincronizarse de la suya. Y el sonido NO es movimiento: no
     lleva `quieto`, aunque en la práctica la coreografía no corre con
     movimiento reducido (ahí el remate suena su arpegio y cierra). */
  function sonarGolpe(n, fxId) {
    if (!window.MFSonido) return;
    /* cada golpe suena a SU técnica (titular 2026-09-02): el fx del censo
       manda y el par de notas de siempre queda de respaldo sin fábrica */
    if (fxId && MFSonido.fx && MFSonido.fx(fxId)) {
      if (MFSonido.vibrar) MFSonido.vibrar(12);
      return;
    }
    var f = NOTAS[(n - 1) % NOTAS.length];
    if (MFSonido.nota) {
      MFSonido.nota(f, { tipo: "triangle", attack: 4, decay: 170, gain: 0.22 });
      MFSonido.nota(f / 2, { tipo: "sine", attack: 2, decay: 120, gain: 0.16 });
    }
    /* La vibración la gobierna el MISMO interruptor y es el MISMO suceso —un
       golpe—, así que acompaña a la nota; más corta que la del toque (15 ms)
       por la misma razón que la nota es más floja. Los 700 ms de separación
       impiden que un patrón cancele al anterior. */
    if (MFSonido.vibrar) MFSonido.vibrar(12);
  }

  /* Tiempos del microimpacto (§5.1). El requisito duro de la ficha es que TODAS
     las señales arranquen antes de 150 ms desde el pointerdown. */
  var MS_LINTERNA = 60, MS_VUELO = 100, MS_VUELO_DUR = 250, MS_IMPACTO = 360;
  /* Remate (§5.1, tramo remate). OJO con la tabla de la ficha: sus tiempos son
     ABSOLUTOS desde el pointerdown y el remate arranca cuando el microimpacto ya
     ha consumido sus 360 ms, así que aquí van RELATIVOS al inicio del remate.
     Sumados dan los de la ficha: hit-stop 360+0, medición 360+70 = 430, primer
     golpe ~440. Escribirlos absolutos dentro del remate lo retrasaba todo 360 ms.

     EL COMPÁS DE LA KATA SON 700 ms, Y NO ES UN NÚMERO LIBRE (titular,
     2026-08-31: «esto pasa muy rápido y no se aprecia, agrega 700 ms entre cada
     pose, y sonido a cada una»). Con los 160 ms de antes las tres poses cabían
     en 480 ms —menos de medio segundo para golpe, patada y golpe— y el ojo solo
     veía un borrón. El presupuesto de 1,2-1,5 s que pedía la ficha para el
     remate queda derogado POR ORDEN DEL TITULAR: la coreografía dura ahora
     K × 700 + 400 ms (2,5 s con K=3), y encima van los dos segundos del sello.

     MS_POSE es cuánto se SOSTIENE la lámina de golpe dentro de cada compás, y
     tampoco es libre: la caja de la mascota viaja a su nuevo avance con una
     transición de 160 ms declarada en la hoja (`.kata-mascota`), así que una
     pose más corta que eso devolvería la guardia mientras el cuerpo todavía
     se desliza hacia delante — el golpe terminaría antes de llegar. 480 = 160
     de viaje + 320 de pose quieta, y los 220 ms que sobran del compás son la
     vuelta a la guardia: el retroceso que hace que las tres poses se PUEDAN
     CONTAR en vez de leerse como una sola postura larga. El último golpe no
     usa MS_POSE: se queda puesto hasta que los blancos ceden (ver `golpe`).

     MS_CIERRE se mide desde `finGolpes` y no es un tope: a finGolpes + 380
     acaba la cascada (200 de escalón + 180 de transición), así que a los 400 ya
     no queda nada moviéndose. */
  var MS_MEDIR = 70, MS_GOLPE = 700, MS_POSE = 480, MS_CEDE = 100, MS_CIERRE = 400;
  /* el respiro entre la tercera seleccion y el remate (titular 2026-09-02):
     2 s tras terminar la ultima pose de seleccion, para que seleccion y kata
     no se confundan */
  var MS_RESPIRO = 2000;
  /* el do-re-mi de los faroles de la tira: razones justas, como en el revela */
  var ESCALA_KATA = [1, 1.125, 1.25];
  /* Demo: la etiqueta fantasma del paso 1 (mejora del titular en la ficha). */
  var MS_FANTASMA = 1000, MS_FANTASMA_OUT = 200;
  /* Fallo cómico: peonza 500 ms, pose sentada hasta 1100, panel a 450. */
  var MS_PEONZA = 500, MS_SENTADA = 1100, MS_PANEL = 450;

  /* ================================================== DÓNDE ESTÁ EL TRAJE ====

     En la sección `RETO: KATA DE TRES GOLPES` de `assets/css/game.css`, y en
     NINGÚN otro sitio. Este archivo llegó a llevar su propia copia del CSS en
     una constante `HOJA` que inyectaba un <style> en el <head>, y durante un
     rato convivieron las dos: se vio en el banco de pruebas, con la mascota
     44 px fuera de su caja y medio cuerpo comido por el borde de la escena. La
     causa es la lección que F2 y F6 ya pagaron (kintsugi.js:88, campana.js:84):
     un <style> inyectado entra en la cascada DESPUÉS del <link>, así que gana
     en lo que ambas declaran —aquí, `left`— y pierde en lo que solo declara la
     hoja —el `translate: -50%` que centra la figura—, y de esa mezcla no sale
     ninguna de las dos geometrías. Dos copias del mismo CSS no empatan: gana la
     que nadie está mirando.

     Este archivo NO escribe CSS. Lo único que pone en línea es lo que la hoja
     declara como suyo: `--kata-mx` / `--kata-rot` sobre la caja de la mascota
     (el avance del remate), el `transition-delay` de la cascada y del revelado
     de examen, y la `opacity` de la etiqueta fantasma. Ni un ancho, ni un alto,
     ni una posición.

     Y hay dos cosas que la hoja resuelve sola y que el JS NO debe tocar: la
     igualación de estatura entre posturas (`--kata-fig-h` por selector de
     `src`, medida sobre las láminas entregadas) y el espejo de la mascota
     —golpe y patada volvieron mirando a la IZQUIERDA aunque se pidieran
     «facing right»—, que vive en la propiedad `scale` de la figura. Escribir
     cualquiera de las dos desde aquí las rompería en el fotograma del swap. */

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

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function reducido() {
    return !!(window.MFJuice && MFJuice.reducido && MFJuice.reducido());
  }

  function centro(r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

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

  /* ==================================================== LÁMINA Y RESERVA ==== */

  function ruta(dir, n, ext) { return dir + n + ext; }

  /* Cuelga una lámina de un <img> que YA está en el árbol. El `onerror` cae al
     `.png` y se desarma acto seguido: sin esa línea, un PNG que tampoco llegue
     dispararía el manejador otra vez y el navegador entraría en bucle de
     peticiones. Los manejadores se apuntan ANTES del `src` porque una imagen ya
     en caché puede resolver dentro de la propia asignación —apuntarlos después
     sería apuntarlos tarde, y ese es justo el caso de la segunda partida de la
     página (lección de F1, tameshiwari.js:157-184). */
  function poner(img, dir, n) {
    img.onerror = function () { img.onerror = null; img.src = ruta(dir, n, ".png"); };
    /* Un 404 servido como página HTML puede «cargar» con 0×0 sin disparar
       `onerror`: sin píxeles no hay lámina, y darla por buena dejaría el hueco
       donde va la pieza. */
    img.onload = function () {
      if (img.naturalWidth && img.naturalHeight) return;
      if (!img.onerror) return;
      img.onerror = null;
      img.src = ruta(dir, n, ".png");
    };
    img.src = ruta(dir, n, ".webp");
  }

  function crearLamina(clase, dir, n) {
    var img = document.createElement("img");
    img.className = clase;
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.draggable = false;
    poner(img, dir, n);
    return img;
  }

  /* ============================ MEMORIA POR TARJETA (§3 y §12 casos (c) y (l)) =

     Cerrar el modal a mitad y reabrir NO devuelve la oportunidad del «limpio» ni
     borra los pasos ya dados. La infraestructura persiste el CONTEO
     (`estado.fallos`, retos.js:423-429) pero no sabe qué pasos se dieron ni cómo
     quedó la barajadura: eso vive aquí. La clave incluye el intento de examen,
     así que el botón de reintento estrena estado —ranuras y señuelos nuevos,
     §12 (l)— sin borrar nada. WeakMap para que las tarjetas de un intento viejo
     se recojan solas; sin WeakMap se cae a un objeto plano, que a escala de una
     página es igual de bueno. Es el patrón ya construido en F1 y F2
     (tameshiwari.js:232-247), y se prefiere al `tarjeta._kata` de la ficha
     porque ese campo, escrito sobre el objeto del content, sobreviviría al
     reintento de examen y devolvería la MISMA barajadura. */
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
    if (!caja[k]) caja[k] = { hechos: 0, fallos: 0, descartados: {}, piezas: null, resuelto: false };
    return caja[k];
  }

  /* ====================================== COMPOSICIÓN DE LOS BLANCOS (§4.4) == */

  /* Pasos = opciones con `orden`; señuelos propios = opciones sin `orden`. Se
     completa hasta cuatro con entradas del pool del nivel (F0 §0.6.4.3),
     filtradas para que no vengan de ESTA tarjeta ni de esta misión. Si el pool
     no da, se juega con los que haya: con K=3 y ningún señuelo el reto es solo
     el orden, que es válido (§12 caso (j)). */
  var OBJETIVO = 4;

  function componer(m, rng) {
    var ops = (m.tarjeta && m.tarjeta.options) || [];
    var piezas = [], i, o, corta;

    for (i = 0; i < ops.length; i++) {
      o = ops[i];
      corta = limpiar(o && o.corta);
      /* Red por si el censo va a medias: sin `corta` el sorteo ni siquiera
         elige este juego (`necesita`), pero una etiqueta vacía por un espacio
         en blanco dejaría la placa muda. */
      if (!corta) corta = textoPlano(o && o.html).slice(0, 24);
      piezas.push({
        i: i,
        corta: corta,
        orden: esNumero(o && o.orden) ? o.orden : null,
        pool: false
      });
    }

    var faltan = OBJETIVO - piezas.length;
    if (faltan > 0) {
      var pool = (m.content && m.content.pool) || [];
      var idPropio = String((m.content && m.content.id) || "") + "#";
      var buenos = [], regulares = [], e, de, c;
      for (i = 0; i < pool.length; i++) {
        e = pool[i];
        if (!e) continue;
        de = String(e.de || "");
        /* Del mismo nivel pero NUNCA de esta misma tarjeta ni de esta misión:
           una opción de la pregunta de al lado se reconocería. */
        if (!de || de.indexOf(idPropio) === 0) continue;
        c = limpiar(e.corta);
        if (!c) continue;
        (e.correct ? regulares : buenos).push({ i: null, corta: c, orden: null, pool: true });
      }
      barajar(buenos, rng);
      barajar(regulares, rng);
      /* Preferencia `correct:false`: una afirmación verdadera de otra misión,
         puesta aquí como señuelo, enseñaría al revés si el alumno la toca. */
      var extra = buenos.concat(regulares).slice(0, faltan);
      piezas = piezas.concat(extra);
    }

    return barajar(piezas, rng);
  }

  /* ================================================================ EL JUEGO = */

  function jugar(m) {
    var ops = (m.tarjeta && m.tarjeta.options) || [];
    /* No debería llegar (lo filtran `necesita` y `acepta`), pero si llegara,
       resolver es mejor que dejar al alumno encerrado con la tarjeta
       bloqueada. */
    if (!ops.length) { m.resolver({ limpio: false, intentos: 1, ms: 0 }); return; }

    var mem = memoria(m);
    var quieto = reducido();
    var t0 = ahora();
    var timers = [];
    var ocupado = true;              /* MONTANDO: los taps se ignoran, no se encolan */
    var K = 0;
    var i;

    /* En examen el azar es DETERMINISTA: recargar a mitad del intento conserva
       ranuras y señuelos, y el botón de reintento —que sube `sorteoCtx.intento`—
       los cambia. Sin ese XOR con `intento`, reintentar devolvería una partida
       idéntica, o sea memorización pura. En misión el azar es del sistema: cada
       partida rebaraja (§4.5). Los dos campos vienen HECHOS en el `montaje`
       (F0 §0.7.1): no hay que buscar la tarjeta con indexOf. */
    var rng = m.examen
      ? mulberry32((hash(String(m.content && m.content.id) + "#" + (m.iTarjeta | 0)) ^ (m.intento | 0)) >>> 0)
      : Math.random;

    /* La barajadura se cachea: reabrir tras un abandono NO recoloca los blancos
       (§4.4), que si no el alumno volvería a una escena distinta con la mitad de
       las linternas ya encendidas. */
    if (!mem.piezas) mem.piezas = componer(m, rng);
    var piezas = mem.piezas;

    /* Rejugar una tarjeta ya superada (§12 caso (k)): la kata se juega ENTERA
       otra vez —vaciar el progreso es lo que la hace jugable— pero `resuelto`
       se conserva, y es la marca que impide volver a prometer el +5. Sin este
       vaciado, reabrir por gusto encontraba `hechos === K` y se cerraba solo,
       que es lo contrario de «juega normal». El sitio de las banderas es la
       PIEZA (sobrevive al cierre dentro de `mem.piezas`), así que se limpian
       también ahí. */
    if (mem.resuelto) {
      mem.hechos = 0;
      mem.fallos = 0;
      mem.descartados = {};
      for (i = 0; i < piezas.length; i++) { piezas[i].hecho = false; piezas[i].descartada = false; }
    }

    for (i = 0; i < piezas.length; i++) { if (piezas[i].orden != null) K++; }
    if (K < 2) { m.resolver({ limpio: false, intentos: 1, ms: 0 }); return; }

    /* Guarda anti-carrera: el alumno puede haber cerrado el modal a mitad de
       cualquier animación. Toda devolución de llamada pregunta antes de tocar el
       DOM (retos.js:714-716). */
    function vivo() {
      if (m.vivo && !m.vivo()) return false;
      return raiz.isConnected !== false;
    }

    /* Camino ÚNICO de los anuncios de lector de pantalla: la región `.reto-vivo`
       la escribe la infraestructura y ningún juego crea la suya. */
    function anunciar(s) { if (m.anunciar) m.anunciar(s); }

    /* Cuánto paga DE VERDAD una victoria limpia de ESTA partida: 5 XP jugando la
       misión, el 10 % de esa misión si quien abrió el reto fue la sala de retos,
       y CERO si allí esa pregunta ya se cobró o si esto es un examen. El juego no
       puede deducirlo —lo hacía con `!m.examen` y por eso cantaba «+5 XP» donde
       se pagaban 3—: se lo pregunta al montaje. Lo que SÍ sigue decidiendo el
       juego es si esta victoria cuenta como limpia: aquí manda además
       `!mem.resuelto` (§12 caso (k), una tarjeta ya superada que se rejuega por
       gusto no cobra). Y `conXP` mete el número en la cadena de T, que sigue
       escrita con su «+5» y no se reescribe. Las guardas son las de `anunciar`:
       por si alguna vez se juega contra un retos.js más antiguo, donde la misión
       pagaba su bonus y el examen no pagaba nada. */
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

    /* Los timeouts pendientes mueren con el modal: sin esto, cerrar a mitad del
       remate dispararía un `resolver()` sobre una caja que ya no existe. Y
       `ocupado` se queda en true, que es lo que impide que un veredicto tardío
       conceda un «limpio» que el alumno no se ganó (§12 caso (c)). */
    if (m.alCerrar) {
      m.alCerrar(function () {
        for (var t = 0; t < timers.length; t++) clearTimeout(timers[t]);
        timers.length = 0;
        ocupado = true;
      });
    }

    /* ------------------------------------------------------------ la pantalla */

    var raiz = document.createElement("div");
    raiz.className = "kata";
    raiz.setAttribute("data-estado", "montando");

    /* DIV y no P: `tarjeta.html` viene de Markdown y casi siempre trae ya su
       propio <p>; anidarlo dentro de otro <p> es HTML inválido y el navegador lo
       rompería en dos párrafos con márgenes de más. */
    var enunciado = document.createElement("div");
    enunciado.className = "kata-enunciado";
    enunciado.innerHTML = (m.tarjeta && m.tarjeta.html) || "";
    raiz.appendChild(enunciado);

    /* --- el pergamino de K círculos --- */
    var pergamino = document.createElement("div");
    pergamino.className = "kata-pergamino";
    /* La tira cuenta el progreso y ya se anuncia por `.reto-vivo` paso a paso:
       leerla entera cada vez que cambia sería ruido. */
    pergamino.setAttribute("aria-hidden", "true");
    raiz.appendChild(pergamino);

    var circulos = [];
    for (i = 0; i < K; i++) circulos.push(crearCirculo(i + 1));

    /* Rediseño del titular (2026-09-01): la tira dejó de ser círculos numerados
       con la etiqueta corta dentro y pasó a ser TRES FAROLES —apagados al
       empezar, encendidos a medida que se acierta—, sin números ni textos. El
       farol es la misma pareja de láminas que encendían las opciones (que ya no
       la llevan): el icono viajó de la opción a la tira. */
    function crearCirculo(n) {
      var c = document.createElement("span");
      c.className = "kata-circulo";
      var fig = crearLamina("kata-circulo__fig", JUEGOS, LAM_OFF);
      c.appendChild(fig);
      pergamino.appendChild(c);
      return { nodo: c, fig: fig, fantasma: null };
    }

    /* --- la escena --- */
    var escena = document.createElement("div");
    escena.className = "kata-escena";
    raiz.appendChild(escena);

    var mascota = document.createElement("span");
    mascota.className = "kata-mascota";
    mascota.setAttribute("aria-hidden", "true");
    var figura = crearLamina("kata-mascota__fig", MASCOTA, LAM_REPOSO);

    /* EL SORTEO DE GOLPES (titular 2026-09-02): con canto y gancho en la
       biblioteca, la kata deja de alternar puño/patada a secas. Los K golpes
       de la ronda se sortean al montar —sin dos iguales seguidos—, cada
       acierto exhibe EL SUYO con su fx del censo, y el remate repite esa
       misma tanda: la secuencia final es la de tus golpes. */
    var GOLPES_KATA = [
      { base: MASCOTA, lam: LAM_GOLPE, fx: "fx-golpe" },
      { base: MASCOTA, lam: LAM_PATADA, fx: "fx-patada" },
      { base: MASCOTA, lam: LAM_CANTO, fx: "fx-canto" },
      { base: MASCOTA, lam: LAM_GANCHO, fx: "fx-gancho" },
      { base: MASCOTA, lam: LAM_VOLADORA, fx: "fx-patada" },
    ];
    var golpesRonda = [];
    (function () {
      var previo = null, k;
      for (k = 0; k < K; k++) {
        var bolsa = GOLPES_KATA.filter(function (g) { return g !== previo; });
        previo = bolsa[Math.floor(Math.random() * bolsa.length)];
        golpesRonda.push(previo);
      }
    })();
    mascota.appendChild(figura);
    escena.appendChild(mascota);

    var rejilla = document.createElement("div");
    rejilla.className = "kata-rejilla";
    escena.appendChild(rejilla);

    var blancos = [];
    for (i = 0; i < piezas.length; i++) blancos.push(crearBlanco(piezas[i], i));

    function crearBlanco(p, r) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "kata-blanco";
      b.setAttribute("data-r", String(r));
      /* La placa ya dice el texto, pero el aria-label explícito cubre el caso de
         que se recorte a dos líneas y el de la lámina sin cargar. */
      b.setAttribute("aria-label", p.corta);

      /* Sin farol en la opción (titular 2026-09-01): el icono viajó a la tira
         de progreso y aquí queda solo la ilustración del prop con su placa. */

      /* El prop lo elige la RANURA, jamás la corrección (§2). */
      b.appendChild(crearLamina("kata-prop", JUEGOS, PROPS[r % PROPS.length]));

      /* Sin modificador de etiqueta larga: aquí la placa va en la columna y no
         superpuesta a la lámina, así que la hoja la resuelve con `overflow-wrap`
         y un `max-height` de dos líneas. Añadir la `--larga` de F1 y F2 sería
         una clase inerte que el próximo lector creería viva. */
      var placa = document.createElement("span");
      placa.className = "kata-placa";
      placa.textContent = p.corta;
      b.appendChild(placa);

      var num = document.createElement("span");
      num.className = "kata-num";
      num.setAttribute("aria-hidden", "true");
      b.appendChild(num);

      /* La respuesta táctil va en el POINTERDOWN, no en el click: es lo que
         separa «responde» de «va lento» (<100 ms). El kit retira la clase solo
         al soltar, cancelar o perder el foco de la ventana. */
      b.addEventListener("pointerdown", function () {
        if (ocupado || b.disabled) return;
        if (window.MFJuice && MFJuice.respuesta) MFJuice.respuesta(b);
      });
      /* El juicio va en el CLICK y no en el `pointerup`: al ser un <button>
         real, Enter y Espacio juegan igual que el dedo sin capturar una sola
         tecla, que es lo que hace que el teclado no necesite código propio. */
      b.addEventListener("click", function () { juzgar(r); });

      rejilla.appendChild(b);
      return { boton: b, placa: placa, num: num, pieza: p, r: r };
    }

    /* Hueco de cortesía del contrato de la hoja. Casi siempre está vacío —el
       panel de fallo lo cuelga la infraestructura al final del cuerpo del
       modal, no aquí dentro— y `:empty` lo esconde, así que no reserva aire. */
    var pie = document.createElement("div");
    pie.className = "kata-pie";
    raiz.appendChild(pie);

    m.cuerpo.appendChild(raiz);

    /* La prueba de existencia de las láminas vive en la infraestructura: el
       veredicto es POR RUTA y de módulo (retos.js:444-507), así que se comparte
       entre piezas, partidas y aperturas del modal. Llamarla al montar es
       obligatorio, y aquí además es lo que precarga las láminas de swap: sin
       ella, el primer intercambio pediría el archivo justo en el frame del
       golpe —el único que el alumno mira— y la pieza parpadearía en blanco. */
    if (m.precargar) {
      m.precargar([
        ruta(JUEGOS, LAM_ON, ".webp"),
        ruta(MASCOTA, LAM_GOLPE, ".webp"),
        ruta(MASCOTA, LAM_PATADA, ".webp"),
        ruta(MASCOTA, LAM_CANTO, ".webp"),
        ruta(MASCOTA, LAM_GANCHO, ".webp"),
        ruta(MASCOTA, LAM_VOLADORA, ".webp"),
        ruta(MASCOTA, LAM_SENTADA, ".webp")
      ]);
    }

    /* ------------------------------------------------- estado y restauración - */

    function estado(s) { raiz.setAttribute("data-estado", s); }

    function blancoDe(r) { return blancos[r]; }

    function blancoDePaso(n) {
      for (var q = 0; q < blancos.length; q++) {
        if (blancos[q].pieza.orden === n) return blancos[q];
      }
      return null;
    }

    /* Deshabilitar el elemento que TIENE el foco lo manda a <body>, y ahí la
       trampa de foco de retos.js ya no puede hacer nada: escucha los Tab en la
       caja del modal, y desde <body> las teclas ni le llegan. Sin este rescate,
       quien juegue con teclado se va de paseo por la misión de debajo justo
       después de acertar (mismo rescate de tameshiwari.js:437-448). */
    function rescatarFoco() {
      var libres = rejilla.querySelectorAll(".kata-blanco:not([disabled])");
      var destino = libres.length ? libres[0] : (m.caja && m.caja.querySelector(".reto-modal__cerrar"));
      if (destino && destino.focus) { try { destino.focus(); } catch (e) { /* nada */ } }
    }

    /* Inerte de verdad: `disabled` y no solo una clase. Un <button> es enfocable
       de nacimiento, así que quitarle el tabindex no lo saca del tabulador y el
       teclado seguiría llegando a un blanco que ya no juega. */
    function apagar(b) {
      var teniaFoco = (document.activeElement === b.boton);
      b.boton.disabled = true;
      if (teniaFoco) rescatarFoco();
    }

    /* `enVivo` = el paso se acaba de dar. Entonces el número y el círculo llegan
       por su cuenta, cada uno en su milisegundo del microimpacto (§5.1); al
       restaurar una reapertura, en cambio, todo tiene que estar ya puesto. */
    function marcarHecho(b, enVivo) {
      b.pieza.hecho = true;
      b.num.textContent = String(b.pieza.orden);
      /* La clase enciende el número por hoja (`.kata-blanco--hecho > .kata-num`),
         así que el sello y la linterna llegan juntos y no hay dos contratos que
         mantener sincronizados. Los 20 ms de diferencia con la tabla de la ficha
         (linterna 60, número 80) no cambian nada: lo que la ficha exige es que
         TODAS las señales arranquen antes de 150 ms. */
      b.boton.classList.add("kata-blanco--hecho");
      apagar(b);
      if (enVivo) return;
      completarCirculo(b.pieza.orden, b.pieza.corta);
    }

    function marcarDescartado(b) {
      b.pieza.descartada = true;
      mem.descartados[b.r] = true;
      /* El badge ✗ se queda a opacidad plena mientras el resto se atenúa: es lo
         que EXPLICA el estado, y nunca puede contarse solo con el color. Su
         traje entero (forma, borde y opacidad) lo pone la hoja desde
         `.kata-blanco--descartado > .kata-num`; aquí solo se escribe el glifo. */
      b.num.textContent = "✗";
      b.boton.classList.add("kata-blanco--descartado");
      apagar(b);
    }

    function completarCirculo(n, corta) {
      var c = circulos[n - 1];
      if (!c) return;
      c.nodo.classList.add("kata-circulo--hecha");
      /* Intercambio de lámina, jamás un filtro (regla del titular): el farol de
         la tira se enciende. La `corta` ya no se escribe en ningún sitio de la
         tira —no van textos—, pero la firma se conserva porque los llamantes
         (el vuelo de la etiqueta y la restauración) no tienen por qué saberlo. */
      poner(c.fig, JUEGOS, LAM_ON);
    }

    function activarCirculo(n) {
      /* Vacía a propósito (titular 2026-09-01): el anillo rojo del paso activo
         parecía un botón que pulsar y confundía. La tira ya no señala el paso
         SIGUIENTE, solo los dados; el orden lo cuenta el lector de pantalla por
         `.reto-vivo` y el juicio sigue siendo el mismo. Se conserva la función
         y sus llamadas para no reordenar el flujo. */
    }

    /* Reapertura tras abandono: los pasos dados siguen dados y los señuelos
       gastados siguen gastados (§12 caso (c)). */
    for (i = 0; i < blancos.length; i++) {
      var b0 = blancos[i];
      if (b0.pieza.orden != null && b0.pieza.orden <= mem.hechos) marcarHecho(b0, false);
      else if (mem.descartados[i]) marcarDescartado(b0);
    }

    /* --------------------------------------------------------- DEMO (§3) ---- */

    /* Etiqueta fantasma del paso 1: enseña el primer movimiento y se va sola.
       Solo en el primer montaje de la tarjeta; un tap válido la cancela. */
    function fantasma() {
      /* La demo de la etiqueta fantasma murió con el rediseño de la tira
         (titular 2026-09-01): vivía DENTRO del primer círculo, y el círculo ya
         no lleva texto, es un farol. Se conserva la función —y quitarFantasma,
         que ahora es inofensiva— para no reordenar el arranque. */
      listo();
    }

    function quitarFantasma() {
      var c = circulos[0];
      if (!c || !c.fantasma) return;
      if (c.fantasma.parentNode) c.fantasma.parentNode.removeChild(c.fantasma);
      c.fantasma = null;
    }

    function listo() {
      ocupado = false;
      estado("esperando");
      activarCirculo(mem.hechos + 1);
    }

    /* ------------------------------------------------------ EL JUICIO (§4.2) - */

    function juzgar(r) {
      var b = blancoDe(r);
      /* Anti-mash: durante cualquier animación los taps se IGNORAN y no se
         encolan; el segundo se juzgaría contra un `hechos` ya cambiado. */
      if (ocupado || !b || b.boton.disabled) return;
      if (b.pieza.hecho || b.pieza.descartada) return;

      /* La demo se puede saltar: un tap válido la cancela al instante y se juzga
         normal (§12 caso (b)). */
      quitarFantasma();

      var sig = mem.hechos + 1;
      if (b.pieza.orden === sig) { acierto(b, sig); return; }
      fallo(b, sig);
    }

    /* ----------------------------------------------- ACIERTO · microimpacto -- */

    /* Todas las señales arrancan antes de 150 ms desde el pointerdown (requisito
       duro de la ficha): hundimiento en el propio pointerdown, nota y squash en
       el mismo frame del juicio, linterna a 60 ms y número a 80. */
    function acierto(b, n) {
      ocupado = true;
      estado("impacto");
      mem.hechos = n;

      var g = golpesRonda[n - 1];
      if (window.MFSonido) {
        if (!(g && MFSonido.fx && MFSonido.fx(g.fx)) && MFSonido.nota) MFSonido.nota(NOTAS[(n - 1) % NOTAS.length]);
        if (MFSonido.vibrar) MFSonido.vibrar(15);
      }
      if (!quieto && window.MFJuice && MFJuice.squash) MFJuice.squash(b.boton);

      /* GOLPE EN SITIO (titular 2026-09-01, ampliado 2026-09-02): TODOS los
         aciertos —el tercero incluido— exhiben SU golpe y vuelven al centro;
         la secuencia entera queda para el remate, que ahora espera MS_RESPIRO
         tras terminar la ultima pose para que seleccion y kata no se
         confundan. Solo cambia la lámina, sin avance (`--kata-mx` no se
         toca): el viaje es del remate y moverse aquí envenenaría aquella
         medida. */
      if (!quieto) {
        poner(figura, g.base, g.lam);
        luego(300, function () {
          /* vuelta a la guardia SIEMPRE: el remate re-pone su lámina 2 s
             después, así que este reposo nunca le pisa una pose */
          if (vivo()) poner(figura, MASCOTA, LAM_REPOSO);
        });
      }

      luego(quieto ? 0 : MS_LINTERNA, function () { marcarHecho(b, true); });
      luego(quieto ? 0 : MS_VUELO, function () { volarChispa(b); });

      anunciar(T.ok.replace("{n}", String(n)).replace("{k}", String(K)).replace("{c}", b.pieza.corta));

      if (n >= K) {
        /* el respiro del titular: la tercera pose entera (300 ms) + 2 s */
        luego(quieto ? 0 : 300 + MS_RESPIRO, function () { remate(b); });
        return;
      }
      luego(quieto ? 0 : MS_IMPACTO, function () {
        ocupado = false;
        estado("esperando");
        activarCirculo(mem.hechos + 1);
      });
    }

    /* LA CHISPA (titular 2026-09-02, trayectoria corregida el mismo día): ya
       no vuela el texto de la placa — del CENTRO DE LA MASCOTA (que en ese
       instante exhibe su golpe) sale un punto de luz que viaja hasta el farol
       de la tira que le toca y lo enciende al llegar, con el fx del farol
       subiendo la escala do-re-mi. Es la mascota quien golpea: la chispa nace
       de ella, no del blanco tocado. La guarda del `animate` va la PRIMERA y
       es obligatoria: las animaciones creadas por script NO las apaga la
       regla global de `styles.css` —solo alcanza transition/animation de
       CSS—, así que sin ella la chispa volaría 250 ms contra lo prometido en
       §11.6. */
    function volarChispa(b) {
      var n = b.pieza.orden, c = circulos[n - 1];
      if (!c) return;
      function prende() {
        if (!vivo()) return;
        completarCirculo(n, b.pieza.corta);
        if (window.MFSonido && MFSonido.fx) MFSonido.fx("fx-farol-enciende", 0, { k: ESCALA_KATA[Math.min(n - 1, 2)] });
      }
      var chispa = document.createElement("span");
      if (quieto || !chispa.animate) { prende(); return; }

      /* UNA sola lectura de rects, y justo antes de animar: cachearlos entre
         gestos dejaría el vuelo apuntando al sitio de antes de rotar el móvil
         (§12 caso (d)). Se mide la FIGURA (la lámina), no la caja exterior:
         su centro es el centro visual de la mascota. */
      var rp = figura.getBoundingClientRect();
      var rc = c.nodo.getBoundingClientRect();
      var cp = centro(rp), cc = centro(rc);

      chispa.className = "revela-chispa";       /* el traje de la chispa del revela */
      chispa.setAttribute("aria-hidden", "true");
      chispa.style.position = "fixed";
      chispa.style.left = Math.round(cp.x - 5) + "px";
      chispa.style.top = Math.round(cp.y - 5) + "px";
      chispa.style.zIndex = "240";
      document.body.appendChild(chispa);

      function aterrizar() {
        if (chispa.parentNode) chispa.parentNode.removeChild(chispa);
        prende();
      }

      var anim = chispa.animate([
        { transform: "translate(0,0)" },
        { transform: "translate(" + (cc.x - cp.x).toFixed(1) + "px," + (cc.y - cp.y).toFixed(1) + "px)" }
      ], { duration: MS_VUELO_DUR, easing: "cubic-bezier(0.2, 0.8, 0.3, 1)" });
      anim.onfinish = aterrizar;
      /* Red de seguridad: si el modal se cierra a mitad del vuelo, `onfinish`
         puede no llegar nunca y la chispa —que cuelga de <body>, no del
         modal— se quedaría flotando sobre la misión. */
      luego(MS_VUELO_DUR + 120, aterrizar);
    }

    /* ------------------------------------------------------- REMATE (§5.1) -- */

    function remate(ultimo) {
      estado("remate");
      ocupado = true;
      for (var q = 0; q < blancos.length; q++) apagar(blancos[q]);

      var limpio = (mem.fallos === 0);
      anunciar(T.fin);

      /* Con movimiento reducido el resultado tiene que poder LEERSE: el estado
         final quieto no basta como única señal (§11.6). */
      if (quieto) {
        /* Este camino acaba aquí y no pasa por `coreografia`, así que es aquí
           donde se pregunta lo que paga la partida. Se pregunta en UNA sola de
           las dos ramas: la pregunta consulta el progreso y no hay motivo para
           hacerla dos veces por partida. */
        var paga = premio(limpio && !mem.resuelto);
        resultado(paga ? conXP(T.resultadoXp, paga) : T.resultado);
        if (window.MFSonido) {
          if (MFSonido.arpegio) MFSonido.arpegio();
          if (MFSonido.vibrar) MFSonido.vibrar([10, 30, 20]);
        }
        if (window.MFJuice && MFJuice.sello) MFJuice.sello(m.escenario, T.sello);
        luego(250, function () { cerrar(limpio, mem.fallos + 1); });
        return;
      }


      /* Congelar 80 ms todo lo que se mueve dentro de la caja es lo que
         convierte el último paso en un GOLPE (nada de screenshake en esta
         casa). Va sin espera: el microimpacto acaba justo aquí. */
      if (window.MFJuice && MFJuice.hitstop) MFJuice.hitstop(m.caja, 80);

      luego(MS_MEDIR, function () {
        /* Medición del avance AQUÍ y no en `montando`: los rects no se cachean
           entre gestos —al rotar el móvil la rejilla se mueve— y al montar el
           <img> de la mascota puede no haber cargado todavía, con lo que su
           borde derecho saldría envenenado para toda la partida. La caja de la
           mascota tiene ancho FIJO, así que el swap de postura no altera `A`. */
        var rr = rejilla.getBoundingClientRect();
        var rm = mascota.getBoundingClientRect();
        /* Los dos rects vienen en píxeles de PANTALLA (zoom de casa,
           styles.css:79) y `--kata-mx` se escribe en píxeles CSS: sin el cambio
           de moneda la mascota recorría el 80 % del pasito. Los 8 px de aire sí
           son CSS, así que se restan DESPUÉS de convertir. */
        var kz = (window.MFDrag && MFDrag.zoomDe) ? MFDrag.zoomDe(mascota) : 1;
        var Av = Math.max(0, (rr.left - rm.right) / kz - 8);
        coreografia(Av, ultimo);
      });
    }

    /* La mascota ejecuta la kata a compás de 700 ms por golpe (K golpes), con su
       nota en cada pose. Ya no es «cámara rápida»: el titular pidió justo lo
       contrario —que la secuencia se vea— y con 160 ms las tres poses pasaban en
       menos de medio segundo. Cada golpe hace DOS cosas y ninguna deforma la
       figura: un cambio real de postura se resuelve INTERCAMBIANDO LÁMINA (regla
       del titular), jamás con un `scaleY` ni con un `translateX` que finja la
       pose.
       TODA la cadena de abajo cuelga de `finGolpes`, así que estirar el compás
       la estira entera y nada se adelanta al sello. Orden con K=3: golpes en
       0 / 700 / 1400, cascada y vuelta a la marca a 2100, squash 2120,
       partículas 2140, SELLO 2180, vuelo del XP 2240 y cierre a 2500 — que es
       cuando empiezan a correr de verdad los dos segundos de la carcasa. */
    function coreografia(Av, ultimo) {
      var n;
      for (n = 1; n <= K; n++) golpe(n, Av);

      var finGolpes = K * MS_GOLPE;

      /* Los blancos de la SECUENCIA ceden en cascada, 100 ms entre ellos; los
         señuelos no ceden. */
      luego(finGolpes, function () {
        var orden = 0;
        for (var q = 0; q < blancos.length; q++) {
          var b = blancos[q];
          if (b.pieza.orden == null) continue;
          b.boton.style.transitionDelay = (orden * MS_CEDE) + "ms";
          b.boton.classList.add("kata-blanco--cede");
          orden++;
        }
        /* La mascota vuelve a su marca con la misma transición de 160 ms: sin
           esto se quedaría clavada dentro de los blancos que acaba de romper.
           Y vuelve a la guardia EN ESTE MISMO FOTOGRAMA, porque el último golpe
           se quedó puesto a propósito hasta aquí (ver `golpe`): la lámina, la
           inclinación y el avance se deshacen a la vez, que es un solo gesto de
           relajación, y los blancos empiezan a ceder con el golpe todavía
           extendido — que es lo que hace que parezca que los tira él. */
        poner(figura, MASCOTA, LAM_REPOSO);
        mascota.style.setProperty("--kata-mx", "0px");
        mascota.style.setProperty("--kata-rot", "0deg");
      });

      luego(finGolpes + 20, function () {
        if (window.MFJuice && MFJuice.squash) MFJuice.squash(figura);
      });

      luego(finGolpes + 40, function () {
        var re = m.escenario ? m.escenario.getBoundingClientRect() : null;
        var rr = rejilla.getBoundingClientRect();
        var cx = re ? (rr.left + rr.width / 2 - re.left) : 0;
        var cy = re ? (rr.top + rr.height / 2 - re.top) : 0;
        if (window.MFJuice && MFJuice.particulas) {
          MFJuice.particulas(m.escenario, {
            x: cx, y: cy, n: 10, angulo: -90, dispersion: 60,
            colores: ["#e63b2e", "#f2c230", "#f7f3ec"], forma: "petalo"
          });
        }
        if (window.MFJuice && MFJuice.destello) MFJuice.destello(m.escenario, cx, cy, { radio: 60 });
      });

      luego(finGolpes + 80, function () {
        if (window.MFJuice && MFJuice.sello) MFJuice.sello(m.escenario, T.sello);
        /* El acorde son las tres notas del arpegio a la vez: lo que el alumno
           fue construyendo paso a paso suena entero. El sonido no es
           movimiento, así que suena también con movimiento reducido — y solo si
           el alumno encendió el interruptor del modal. */
        if (window.MFSonido) {
          if (MFSonido.nota) {
            for (var f = 0; f < NOTAS.length; f++) {
              MFSonido.nota(NOTAS[f], { tipo: "triangle", attack: 8, decay: 400, gain: 0.18 });
            }
          }
          if (MFSonido.vibrar) MFSonido.vibrar([10, 30, 20]);
        }
      });

      var limpio = (mem.fallos === 0);
      /* El cobro solo vuela si el bonus es de verdad: en examen no existe
         —mission.js lo cobra con `!isExam` (F0 §0.8.1) y el examen entrega por
         `completeExam`—, desde la sala de retos puede valer menos o nada, y
         tampoco cobra una tarjeta ya superada que se rejuega por gusto (§12 caso
         (k)). Todo eso cabe en `paga`: un 0 y aquí no vuela nada, porque
         prometer un XP que jamás llega era justo el error que esto arregla. El
         chip vuela con el número exacto que se va a pagar. */
      var paga = premio(limpio && !mem.resuelto);
      if (paga) {
        luego(finGolpes + 140, function () {
          var b = ultimo || blancoDePaso(K);
          if (b && window.MFJuice && MFJuice.volarXP) MFJuice.volarXP(b.boton, paga);
        });
      }

      /* AQUÍ NO PUEDE HABER UN `Math.min`, y esta línea ya pisó esa trampa: el
         cierre llevaba un tope de 1500 ms que con la kata a 160 ms no se
         alcanzaba nunca (finGolpes + 400 = 880) pero que con el compás de 700
         dispararía el cierre a 1500 —a media coreografía y, lo que es peor,
         ANTES del sello, que se estampa a finGolpes + 80 = 2180—.
         Y el destrozo no sería solo estético: los dos segundos que pidió el
         titular NO se cuentan aquí, los cuenta la carcasa, y los cuenta DESDE
         QUE EL SELLO APARECE (retos.js:1112-1169, `cerrarTrasElSello`). Un
         `cerrar()` anterior al sello encuentra `selloListoEn` en 0, entiende que
         no hay nada que apreciar y cierra en el acto: el modal se iría con la
         mascota a medio golpear y sin sello ninguno.
         Por eso el cierre va a finGolpes + MS_CIERRE, después de la estampa: la
         carcasa descuenta lo que ya se ha visto y espera el resto de los 2 s. Y
         por eso este archivo NO añade su propia espera de dos segundos: sumada a
         la de la carcasa serían cuatro. Si algún día vuelve a hacer falta un
         tope, tiene que quedar POR ENCIMA de finGolpes + 80. */
      luego(finGolpes + MS_CIERRE, function () { cerrar(limpio, mem.fallos + 1); });
    }

    /* Golpe n: swap de lámina + avance por propiedades INDEPENDIENTES. El JS
       escribe `--kata-mx` y `--kata-rot` sobre la caja y el CSS los traduce a
       `translate`/`rotate`, de modo que `transform` queda libre para el kit
       sobre la figura. Golpes impares con el puño, pares con la patada; entre
       golpe y golpe la lámina vuelve a la guardia. */
    function golpe(n, Av) {
      var t = (n - 1) * MS_GOLPE;
      luego(t, function () {
        var g = golpesRonda[n - 1];
        poner(figura, g.base, g.lam);
        mascota.style.setProperty("--kata-mx", Math.round(Av * n / (K + 1)) + "px");
        mascota.style.setProperty("--kata-rot", ((n % 2 === 1) ? 6 : -6) + "deg");
        /* La nota va en el MISMO frame que la lámina y que el avance: oído y
           vista tienen que contar el mismo golpe, y 40 ms de desfase ya se
           notan como «suena antes de pegar». En el remate cada golpe COMBINA
           su fx propio con el ding del farol subiendo la escala (titular
           2026-09-02): la kata entera suena a do-re-mi. */
        sonarGolpe(n, g.fx);
        if (window.MFSonido && MFSonido.fx) MFSonido.fx("fx-farol-enciende", 40, { k: ESCALA_KATA[Math.min(n - 1, 2)] });
      });
      /* El ÚLTIMO golpe NO vuelve solo a la guardia: se queda sostenido hasta
         `finGolpes`, que es donde los blancos ceden y donde la mascota vuelve a
         su marca (y a la guardia) de una vez. Es el kime de la kata —la última
         técnica se mantiene— y además arregla la causa: con la vuelta a los
         480 ms, el remate empezaba con la mascota ya en guardia y los blancos
         cayéndose 220 ms después, sin nadie que los tirara. Los intermedios sí
         retroceden, y ese retroceso es lo que separa un golpe del siguiente. */
      if (n < K) luego(t + MS_POSE, function () { poner(figura, MASCOTA, LAM_REPOSO); });
    }

    /* --------------------------------------------------- FALLO CÓMICO (§5.2) - */

    function fallo(b, sig) {
      ocupado = true;
      mem.fallos++;

      /* Un paso POSTERIOR tocado antes de tiempo no se descarta: se va a
         necesitar después. Solo se gastan los señuelos, y solo en misión — en
         examen la partida se cierra ahí mismo. */
      var esSenuelo = (b.pieza.orden == null);
      if (esSenuelo && !m.examen) marcarDescartado(b);

      if (window.MFJuice && MFJuice.fallo) MFJuice.fallo(b.boton, m.escenario);
      /* El kit ya dispara su nota grave y NUNCA vibra: llamar aquí a
         `MFSonido.fallo()` la haría sonar dos veces. */

      if (!quieto) tropiezo();

      luego(quieto ? 0 : MS_PANEL, function () {
        /* Lo que ENSEÑA es el feedback escrito de ESA opción; el panel y el
           evento `reto_fail` los pone la infraestructura. Con un señuelo del
           pool va `null` —la convención ÚNICA del sistema para una pieza que no
           es opción de la tarjeta— y el segundo argumento es obligatorio,
           porque el texto a pintar no está en `tarjeta.options`. */
        var nodo = b.pieza.pool
          ? m.fallar(null, "<p>" + esc(T.senuelo) + "</p>")
          : m.fallar(b.pieza.i);
        /* El error se localiza en el PASO exacto, que es lo que convierte el
           panel en una corrección y no en un regaño. Se antepone al nodo que
           devuelve la infraestructura en vez de reimplementar el panel. */
        if (nodo) {
          var cab = document.createElement("p");
          cab.innerHTML = "<strong>" + esc(T.paso.replace("{n}", String(sig))) + "</strong>";
          nodo.insertBefore(cab, nodo.firstChild);
        }
        anunciar(T.ko.replace("{c}", b.pieza.corta).replace("{n}", String(sig)));

        if (m.examen) { revelar(); return; }

        /* Repesca ilimitada, sin cronómetro y SIN BOTÓN (F0 §0.13.2): el panel
           se queda abierto y la kata se reanuda sola desde el paso que iba. Las
           linternas encendidas y los números no se tocan: el progreso visual no
           se pierde nunca. */
        estado("esperando");
        activarCirculo(mem.hechos + 1);
        ocupado = false;
      });
    }

    /* La mascota tropieza, gira como una peonza y acaba sentada. El swap NO
       cuelga de `animationend`: con `prefers-reduced-motion`, `styles.css`
       aplica `animation: none !important`, el evento no se dispara nunca y la
       secuencia se quedaría a medias con la mascota tumbada para siempre. Se
       secuencia con timers del closure, que sí corren siempre. */
    function tropiezo() {
      figura.classList.add("kata-mascota--peonza");
      luego(MS_PEONZA, function () {
        figura.classList.remove("kata-mascota--peonza");
        /* De pie → sentada es un cambio de estado REAL del objeto, así que es
           un intercambio de lámina. Aplastar la pose de pie con un escalado
           vertical para fingir que se sienta es justo lo que la regla prohíbe
           (y el grep del gate §12.16 tiene que salir a cero, así que ni este
           comentario escribe la función).
           El swap es TODO lo que hace falta: la hoja iguala la estatura de cada
           postura por selector de `src`, así que la corrección viaja con el
           sprite y no hay ninguna variable que este archivo tenga que acordarse
           de poner —ni, peor, de quitar en el camino de vuelta—. */
        poner(figura, MASCOTA, LAM_SENTADA);
      });
      luego(MS_SENTADA, function () { poner(figura, MASCOTA, LAM_REPOSO); });
    }

    /* ------------------------------------- REVELADO · examen sin repesca §10 - */

    /* El primer toque fuera de orden cierra la ronda. Los números de la
       secuencia correcta aparecen por fundido escalonado sobre sus blancos: el
       alumno VE la kata entera sin que parezca victoria (ni sello, ni
       partículas, ni sonido de premio: el examen informa, no premia). */
    function revelar() {
      estado("revelando");
      var q, b, paso = 0;
      for (q = 0; q < blancos.length; q++) apagar(blancos[q]);
      for (var n = 1; n <= K; n++) {
        b = blancoDePaso(n);
        if (!b || b.pieza.hecho) { paso++; continue; }
        b.num.textContent = String(n);
        b.num.style.transitionDelay = quieto ? "0ms" : (paso * 100) + "ms";
        /* `--visible` y no la clase del paso completado: el alumno NO dio este
           paso, así que el blanco no puede vestirse de acertado. Lo que aparece
           es el número, para que la secuencia correcta se lea entera. */
        b.num.classList.add("kata-num--visible");
        paso++;
      }
      for (n = 1; n <= K; n++) {
        b = blancoDePaso(n);
        if (b) completarCirculo(n, b.pieza.corta);
      }
      anunciar(T.finExamen);
      if (quieto) resultado(T.resultadoKo);
      esperarLectura();
    }

    /* Tiempo mínimo de lectura antes de cerrar la ronda, proporcional al texto:
       no es un cronómetro contra el alumno —nada expira nunca en su contra—,
       sino la forma de dar tiempo a leer SIN un botón «Continuar», que F0
       §0.13.2 prohíbe. Patrón y cifras de F3 (pasa.js:1152-1170). NO lleva el
       `quieto ? 0 :` del resto de esperas: las demás miden ANIMACIONES, que con
       movimiento reducido no existen; esto mide LECTURA, que existe igual. */
    function esperarLectura() {
      var panel = m.cuerpo.querySelector(".reto-feedback");
      var ms = 1400;
      if (panel) {
        ms = Math.min(4200, Math.max(1400, 60 * palabras(textoPlano(panel.innerHTML))));
        /* La barra es lo que convierte un cierre automático en algo predecible:
           sin ella el modal se va solo y parece que la página se movió por su
           cuenta. Se reutiliza `.pasa-espera` —la de F3, que ya vive en
           game.css y es exactamente esta pieza, una barra que cuenta hacia
           abajo con `--pasa-espera-ms`— en vez de inventar una `.kata-espera`
           que la hoja de este juego no declara: un nodo sin traje sería un
           <span> de 0 px y la promesa de predictibilidad se quedaría en nada.
           DEUDA declarada: su sitio es el traje común de F0 como
           `.reto-espera`, porque F0 §0.13.2 la nombra patrón canónico del
           sistema; el día que suba, aquí solo cambia el nombre de la clase. */
        var barra = document.createElement("span");
        barra.className = "pasa-espera";
        barra.setAttribute("aria-hidden", "true");
        barra.style.setProperty("--pasa-espera-ms", ms + "ms");
        panel.appendChild(barra);
        /* Quien ya leyó no espera: un toque en el panel adelanta el cierre. Es
           un atajo, nunca un requisito — si nadie toca, se cierra solo. */
        panel.addEventListener("click", function () { cerrar(false, 1); });
      }
      luego(ms, function () { cerrar(false, 1); });
    }

    /* ------------------------------------------------------------- el cierre - */

    function resultado(texto) {
      if (raiz.querySelector(".reto-resultado")) return;
      var p = document.createElement("p");
      p.className = "reto-resultado";
      p.textContent = texto;
      raiz.appendChild(p);
    }

    var cerrado = false;

    /* `intentos` es el equivalente del `attempts` de mission.js: los juicios que
       le costó la tarjeta, 1 en la kata limpia. Lo pasa cada camino, porque no
       es el mismo número: el remate envía `fallos + 1` y el revelado de examen
       envía 1, que es el único juicio que hubo (§10). La ficha escribe en §5.1
       `intentos: fallos`, que en la partida limpia daría 0 y contradice a su
       propio §10; se usa el conteo coherente con mission.js. El `limpio` lo
       vuelve a comprobar la infraestructura contra su propio conteo persistido:
       cerrar y reabrir no puede regalar el bonus. */
    function cerrar(limpio, intentos) {
      if (cerrado) return;
      cerrado = true;
      mem.resuelto = true;
      estado("resuelto");
      m.resolver({
        limpio: !!limpio,
        intentos: Math.max(1, intentos | 0),
        ms: Math.round(ahora() - t0)
      });
    }

    /* --------------------------------------------------------------- arranque */

    anunciar(T.abre.replace(/\{k\}/g, String(K)));

    /* La caja del modal tarda 220 ms en subir (animación de la casa); el juego
       no añade teatro propio, solo espera a que pare para que el fantasma no
       compita con ella. */
    luego(quieto ? 0 : 220, function () {
      /* Ventana estrecha pero real: cerrar el modal entre el último acierto y
         el `resolver()` deja la kata completa y sin resolver. Al reabrir NO se
         cierra en silencio —el alumno vería abrirse y cerrarse una caja vacía—
         sino que se remata desde donde estaba, con la escena ya restaurada. */
      if (mem.hechos >= K) { remate(blancoDePaso(K)); return; }
      estado(mem.hechos === 0 ? "demo" : "esperando");
      if (mem.hechos === 0) fantasma();
      else listo();
    });
  }

  /* ============================================================== REGISTRO === */

  MFRetos.registrar({
    id: "kata",
    nombre: T.nombre,
    icono: "🏮",
    banner: T.banner,
    comoSeJuega: T.comoSeJuega,
    /* Preferencia de ronda CENTRAL en el examen: variedad de verbo entre dos
       juegos de decisión única, y duración segura. El post-pass que la aplica
       ya vive en la infraestructura (`preferirRondas`, retos.js:274-316) y es un
       reordenamiento PURO: no cambia qué tarjetas ni qué juegos salen, así que
       `superados / 3` y `MF.completeExam` quedan intactos. */
    ronda: 2,
    /* La metáfora de este juego es «ejecutar los pasos en orden» (F0 §0.13.3),
       así que solo entra donde hay un PROCEDIMIENTO anotado: `orden` en 2-3
       opciones. En una decisión única mentiría, y por eso el filtro no se puede
       aflojar «por cobertura»: la cobertura se gana con censo editorial. */
    necesita: ["corta", "orden"],
    acepta: function (tarjeta) {
      var ops = (tarjeta && tarjeta.options) || [];
      var ords = [], i;
      /* Tope de cuatro opciones, como F1 y F2. La escena es una rejilla 2×2 y
         con cinco blancos se saldría de la escena; y recortar opciones para que
         quepan sería esconderle al alumno parte de su propia pregunta.
         Rechazar es gratis: el sorteo elige otro juego y, si no hay ninguno
         compatible, la tarjeta cae al quiz clásico sin romper nada. */
      if (ops.length > OBJETIVO) return false;
      for (i = 0; i < ops.length; i++) {
        if (ops[i] && esNumero(ops[i].orden)) ords.push(ops[i].orden);
      }
      /* Comparador numérico explícito: `[].sort()` ordena como CADENAS, y el
         día que una secuencia llegue a diez pasos «10» se colaría delante de
         «2» y la validación daría por buena una kata rota. */
      ords.sort(function (a, b) { return a - b; });
      var K = ords.length;
      if (K < 2 || K > 3) return false;                        /* 2-3 pasos exactos */
      for (i = 0; i < K; i++) { if (ords[i] !== i + 1) return false; }  /* 1..K sin huecos ni duplicados */
      /* Regla editorial de §8.2: la opción `[x]` es la de `orden=1` y el
         enunciado pregunta «qué haces primero». Así la tarjeta sigue siendo un
         quiz clásico VERAZ cuando cae en fallback o en un dispositivo sin
         retos; sin esta comprobación, el fallback enseñaría otra cosa. */
      var x = [];
      for (i = 0; i < ops.length; i++) { if (ops[i] && ops[i].correct) x.push(ops[i]); }
      /* La correcta ES el paso 1 (regla editorial de §8.2): el editor la
         mueve solo al reordenar, y el quiz clásico de respaldo la necesita
         para preguntar «¿qué va primero?» con sentido. */
      return x.length === 1 && x[0].orden === 1;
    },
    jugar: jugar
  });
})();

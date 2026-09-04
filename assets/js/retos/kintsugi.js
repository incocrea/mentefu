/* MenteFu / MindFu — KINTSUGI DEL EMBLEMA (docs/07-miniretos/F2-kintsugi.md).

   El emblema del arte aparece ROTO, con un trozo de menos. En la bandeja hay
   2-4 fragmentos de cerámica IDÉNTICOS —el mismo archivo repetido—, rotulados
   solo con la etiqueta corta de cada opción del quiz. El alumno arrastra (o
   toca-toca, o teclea) el que responde bien: si acierta, el fragmento suelda en
   su hueco y la junta se traza en ORO; si falla, resbala con un fallo cómico,
   se abre el feedback de ESA opción y hay repesca sin límite. En examen no hay
   repesca: el veredicto suelda en PLATA y enseña cuál era la buena.

   Este archivo SOLO pinta y juzga. El XP, los cierres, el historial del
   navegador, el panel de feedback y toda la telemetría los pone la
   infraestructura (retos.js) a través del `montaje`: aquí no hay ni un
   MF.track, ni una suma de XP, ni un listener de Escape.

   SIETE decisiones de este archivo que conviene no deshacer sin leer el porqué:

   · EL HUECO Y LAS VETAS SON LA LÁMINA DEL FRAGMENTO, TRATADA. La ficha pedía
     cuatro láminas (fragmento, hueco, veta de oro, veta de plata). Se generaron
     las cuatro y solo sirve una: las tres capas de tablero tenían que ser
     GEOMÉTRICAMENTE CONGRUENTES entre sí —el fragmento sale del hueco, la veta
     recorre la junta del hueco— y se generaron en tres llamadas independientes
     que no pueden coordinarse; encima `postprocess` (tools/arte.py) recorta al
     contorno alfa y recentra, así que la posición fija que el prompt pedía se
     destruyó al guardar. Medido: las cuatro volvieron casi cuadradas y
     centradas, y el hueco volvió como baldosa maciza, no como agujero.
     Aquí el hueco y las vetas se DERIVAN de la silueta real del fragmento, con
     la propia lámina: el hueco es el mismo <img> con `brightness(0)` (la
     ausencia, negra, encajada al píxel con la pieza que va a entrar) y la veta
     es el mismo <img> con una pila de `drop-shadow` del metal (un contorno que
     sigue EXACTAMENTE el borde de la ilustración, que es justo lo que es una
     junta de kintsugi). La congruencia deja de ser una esperanza y pasa a ser
     una garantía: es literalmente la misma forma.
     Esto NO rompe la regla del titular (F0 §0.12). La regla prohíbe DIBUJAR
     objetos de juego con <svg> o con formas CSS; aquí no se dibuja ninguna
     forma: se usa la ILUSTRACIÓN y el filtro solo la tiñe o la perfila. El
     hueco y la junta tampoco son «estados del fragmento» que obliguen a
     intercambiar lámina: son la MISMA pieza vista como ausencia y como borde
     soldado. El día que existan láminas propias que SÍ encajen, sustituirlas es
     cambiar las rutas de `ARTE` y poner `ARTE.derivadas` a false: nada más.

   · LAS VARIANTES SE COLOCAN, NO SE GIRAN. La ficha resolvía las tres grietas
     girando la lámina 0/90/180° porque la rotura vivía confinada en un cuarto
     del lienzo. La lámina entregada tiene el fragmento CENTRADO y llenando el
     cuadro (bbox alfa medida: 0.037→0.963 en X, 0.036→0.962 en Y), así que
     girarla la deja en el mismo sitio y las tres cicatrices se pisarían. Aquí
     cada variante es una POSICIÓN (fracción del tablero) más un giro propio, y
     la separación está elegida con el test del círculo circunscrito (ver
     VARIANTES): no pueden solaparse por geometría, no por buen ojo.

   · EL TABLERO SE AJUSTA AL EMBLEMA, NO AL REVÉS. Los 12 emblemas NO son
     cuadrados (art-narcifu 0,633 · art-lovefu 1,210 · art-culpafu 512×471): el
     tablero es `inline-block` y lo mide la propia lámina del arte, así que una
     posición en fracciones del tablero cae SIEMPRE sobre el dibujo y nunca
     sobre el papel vacío de al lado. El tamaño de las capas se mide contra el
     lado MENOR, para que en un emblema estrecho el fragmento no se salga.

   · LA PIEZA SON TRES NODOS, Y NO UNO. El <button> lo escribe MFDrag (transform
     EN LÍNEA, mfdrag.js:108-116); el `__vuelo` lleva el viaje que escribe ESTE
     juego (el resbalón y la caída a su casilla, pieza entera: cerámica Y placa);
     el `__ceramica` lleva el giro de la variante y el giro de moneda del fallo.
     Juntos, cada `style.transform` del resbalón borraría el arrastre o el giro
     de variante, y una animación del kit ganaría al estilo en línea. Es la misma
     separación slot/sprite que ya obliga F1 con la mano (tameshiwari.js:29-36).
     El giro de moneda va en la cerámica y NO en el `__vuelo` a propósito: la
     placa no puede acabar boca abajo — el resultado se cuenta con TEXTO y el
     texto tiene que leerse.

   · EL GARNISH DEL FALLO VA EN LA CASILLA, NUNCA EN LA PIEZA. El keyframe
     `juice-fallo` (game.css:1412-1414) declara `0% { transform: translateX(0) }`
     y una animación gana siempre al estilo en línea: aplicado a la pieza, la
     mandaría de golpe a su posición de origen durante 400 ms, justo cuando
     acaba de caer. La `.kintsugi-casilla` nunca lleva transform propio, así que
     es ella la que tiembla. Por lo mismo, el hundimiento de `MFJuice.respuesta`
     también va en la casilla.

   · EL FRAGMENTO QUE CAE DEL HUECO EN EL RITUAL ES SIEMPRE EL PRIMERO. Nunca el
     correcto: la ceremonia no puede delatar la respuesta. Como es SIEMPRE el
     índice 0, con independencia de dónde esté la correcta, no transporta ni un
     bit de información.

   · CON `prefers-reduced-motion` EL RITUAL DURA 0 ms y el resultado se cuenta
     además con TEXTO (§11.6): el emblema nace ya partido, la veta entra por
     fundido con el barrido fijado en 360°, el fallo no anima y bajo el tablero
     se escribe «Restaurado. +5 XP». Nunca solo con animación.

   DÓNDE ESTÁ EL TRAJE: en la sección JUEGOS de `assets/css/game.css`, bloque
   `kintsugi-*` (ficha §9.2 y §A.6). Este archivo lo escribió primero dentro de
   una constante `HOJA` que se inyectaba en el `<head>`, y esa copia se BORRÓ al
   mudar el bloque a la hoja: un `<style>` inyectado entra en la cascada DESPUÉS
   del `<link>` de game.css, así que ganaba con la misma especificidad y tapaba
   las correcciones hechas allí (el tinte de la veta, el contraste de la pieza
   gastada, la etiqueta sin recortar). Dos copias del mismo CSS no empatan:
   siempre gana la que nadie está mirando. El JS aquí no escribe ni un `filter`
   —solo geometría, en `--k-lx` / `--k-ly` / `--k-tam` / `--k-rot` / `--k-comp`—,
   misma disciplina que F1 («el juego no escribe píxeles»). */
(function () {
  "use strict";

  /* Sin infraestructura no hay reto: mission.js cae solo a su quiz clásico. */
  if (!window.MFRetos || !MFRetos.registrar) return;

  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var A = cfg.assets || "";
  var XP = cfg.xp || {};

  var T = ES ? {
    nombre: "Kintsugi del emblema",
    banner: "RESTAURA",
    /* La línea de «qué hay que hacer», declarada por el JUEGO y no por quien la
       pinta: la enseñan dos interfaces —la ficha de la sala de retos y la
       tarjeta-invitación de la misión— y con una tabla en cada una, el día que
       se retoque la frase se retocará en una sola. Aquí hay una sola verdad. */
    comoSeJuega: "Arrastra y repara el emblema con el fragmento que encaja.",
    hueco: "Hueco del emblema",
    roto: "Emblema del arte, roto",
    entero: "Emblema del arte, restaurado",
    sello: "¡RESTAURADO!",
    selloRacha: "KINTSUGI",
    selloExamen: "REPARADO",
    resultado: "Restaurado.",
    resultadoXp: "Restaurado. +5 XP",
    abre: "Emblema roto. Falta un fragmento. Elige el que responde bien y llévalo al hueco.",
    gana: "¡Restaurado! {c} era la respuesta. Veta dorada soldada.",
    falla: "{c} no suelda. Lee por qué y prueba con otro fragmento.",
    pista: "Pista: un fragmento brilla.",
    examen: "No era ese. El emblema queda reparado en plata: la respuesta era {c}."
  } : {
    nombre: "Emblem Kintsugi",
    banner: "RESTORE",
    comoSeJuega: "Drag and mend the emblem with the piece that fits.",
    hueco: "Emblem gap",
    roto: "Art emblem, broken",
    entero: "Art emblem, restored",
    sello: "RESTORED!",
    selloRacha: "KINTSUGI",
    selloExamen: "MENDED",
    resultado: "Restored.",
    resultadoXp: "Restored. +5 XP",
    abre: "The emblem is broken. One piece is missing. Pick the right one and take it to the gap.",
    gana: "Restored! {c} was the answer. Golden seam sealed.",
    falla: "{c} doesn't bond. Read why and try another piece.",
    pista: "Hint: one piece is glowing.",
    examen: "Not that one. The emblem is mended in silver: the answer was {c}."
  };

  /* ===================================================== EL ARTE DE LA FASE ===

     El ÚNICO sitio donde vive el arte de kintsugi. Las rutas llevan el prefijo
     del build (`MF_CONFIG.assets`) porque las misiones cuelgan de cuatro niveles
     de carpeta y un `src` relativo escrito desde JS se resuelve contra la
     PÁGINA: sin el prefijo, 404 en todas ellas (mismo motivo documentado en
     retos.js:478-482 y arbol.js:12).

     `hueco` y `veta` apuntan HOY al mismo archivo que `fragmento`, y su
     tratamiento (el filtro que los convierte en ausencia y en junta) lo pone la
     hoja colgando de `.kintsugi--derivadas`. El día que existan láminas propias
     que encajen de verdad con el fragmento: cambiar estas dos rutas y poner
     `derivadas` a false. Dos líneas, y ni una más — la geometría, la diana, las
     cicatrices y el veredicto de examen siguen funcionando igual porque todos
     leen la MISMA colocación. */
  var JUEGOS = A + "assets/img/juegos/";
  var ARTE = {
    fragmento: JUEGOS + "kintsugi-fragmento.webp",
    hueco: JUEGOS + "kintsugi-fragmento.webp",
    veta: JUEGOS + "kintsugi-fragmento.webp",
    /* La mano de la mascota (F1), reutilizada como adorno del ritual. OPCIONAL:
       no está en MF_CONFIG.gameArt (solo viajan las familias que se buscan por
       clave), así que solo se sabe si existe probándola. */
    mano: A + "assets/img/mascota/mano.webp",
    derivadas: true
  };

  /* Los tres metales del juego. NO son colores de marca: son oro y plata de
     atrezo, y viven aquí y en la hoja como variables para que cambiarlos sea un
     solo sitio. El bermellón de la casa no entra: un destello de gran área en
     acento está vetado por el checklist de accesibilidad (§11.7). */
  var ORO = "#e8b13c";
  var ORO_CLARO = "#f2c230";

  /* ============================================ LAS TRES VARIANTES DE ROTURA ==

     Cada variante es una POSICIÓN en fracciones del tablero más un giro. La
     ficha las resolvía girando la lámina 0/90/180° porque la rotura vivía
     confinada a un cuarto del lienzo; la lámina entregada llena el cuadro
     centrada, así que un giro la deja donde estaba y las tres cicatrices se
     pisarían (criterio 4 del gate, §13).

     Que no se solapen está GARANTIZADO, no confiado al ojo: cada capa cabe en
     un círculo de radio `FRAC * √2 / 2 = 0,212` del lado menor del tablero, así
     que basta con que las tres distancias entre centros superen 0,424. Medidas
     sobre el tablero cuadrado: A-B 0,553 · A-C 0,480 · B-C 0,456. En emblemas
     no cuadrados el margen solo CRECE, porque el lado mayor estira las
     distancias y el radio se mide contra el menor (comprobado con los dos
     extremos del catálogo, art-narcifu 0,633 y art-lovefu 1,210). */
  var FRAC = 0.30;                 /* lado de la capa, en fracción del lado menor */
  var VARIANTES = [
    { id: "A", fx: 0.70, fy: 0.26, rot: 0 },
    { id: "B", fx: 0.28, fy: 0.62, rot: 128 },
    { id: "C", fx: 0.72, fy: 0.74, rot: -104 }
  ];

  /* ============================================================== UTILERÍA === */

  function ahora() { return (window.performance && performance.now) ? performance.now() : Date.now(); }

  function esNumero(v) { return typeof v === "number" && isFinite(v); }

  function textoPlano(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html == null ? "" : html);
    return (d.textContent || "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
  }

  function reducido() {
    return !!(window.MFJuice && MFJuice.reducido && MFJuice.reducido());
  }

  function centro(r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }

  /* Un elemento con su lámina dentro. El <img> nace ya con su `src` —regla del
     titular, F0 §0.12: la pieza es ilustración desde el primer fotograma— y
     lleva encima su propia red: si el archivo no llega, `fallo()` enciende la
     ruta de reserva del tablero entero.
     Los manejadores van ANTES del `src` porque una imagen ya en caché puede
     resolver dentro de la propia asignación: apuntarlos después sería apuntarlos
     tarde, y ese es justo el caso de la segunda partida de la página. Es la
     misma cautela de tameshiwari.js:157-184. */
  function ilustrar(nodo, ruta, fallo) {
    var img = document.createElement("img");
    img.className = "kintsugi-lamina";
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
    img.draggable = false;
    img.onerror = fallo;
    /* Un 404 servido como página HTML puede «cargar» con 0×0 y sin disparar
       `onerror`: sin píxeles no hay lámina, y darla por buena dejaría un hueco
       donde va el objeto. */
    img.onload = function () { if (!img.naturalWidth || !img.naturalHeight) fallo(); };
    nodo.appendChild(img);
    img.src = ruta;
    return img;
  }

  /* ============================ MEMORIA POR TARJETA (§3 ABANDONADO y §12-3) ==

     Cerrar el modal a mitad y reabrir NO devuelve la oportunidad del «limpio» ni
     resucita los fragmentos ya gastados. La infraestructura persiste el CONTEO
     (estado.fallos, retos.js:423-429) pero no sabe QUÉ piezas cayeron: eso vive
     aquí. La clave incluye el intento de examen, así que el botón de reintento
     estrena estado sin borrar nada. WeakMap para que las tarjetas de un intento
     viejo se recojan solas; sin WeakMap se cae a un objeto plano, que a escala
     de una página es igual de bueno. Copiado de tameshiwari.js:232-247. */
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

  /* Cicatrices: { contentId: [ids de variante ya soldadas] } — §5.3. Estado 100 %
     cosmético, de la VIDA DE LA PÁGINA: no viaja a MFStore ni a Supabase y no
     sobrevive a recargar. El progreso de verdad lo guarda progress.js; perder
     esto no rompe nada, y es lo que permite que la memoria del reto superado se
     acumule a la vista sin inventar un segundo almacén. */
  var cicatrices = {};

  /* Aciertos limpios consecutivos en esta carga de página: desde el segundo, la
     cosecha sube y el sello cambia (§5.1). Variar el premio, nunca el gesto. En
     examen se CONGELA —ni suma ni resetea—, para no alterar el sabor de la
     misión siguiente (misma regla que F1 §10). */
  var rachaLimpia = 0;

  /* ================================================================ EL JUEGO = */

  function jugar(m) {
    var ops = (m.tarjeta && m.tarjeta.options) || [];
    var n = ops.length;
    /* Desde 2026-09-01 el objeto reparado es LA VASIJA de kintsugi, no el
       emblema del arte: el gi bermellón remendado con cerámica crema contaba
       mal la metáfora (lo vio el titular en pantalla, y razón no le faltaba).
       La lámina del arte queda de RESPALDO: si la vasija faltara en un
       despliegue, mejor el emblema viejo que un hueco sobre nada. */
    var rutaVasija = "assets/img/juegos/kintsugi-vasija.webp";
    var rutaEmblema = (cfg.gameArt || {})["art-" + (m.content && m.content.art)];
    /* No deberían llegar (los filtran `necesita` y `acepta`), pero si llegaran,
       resolver es mejor que dejar al alumno encerrado con la tarjeta bloqueada. */
    if (!n) { m.resolver({ limpio: false, intentos: 1, ms: 0 }); return; }

    var mem = memoria(m);
    var quieto = reducido();
    var t0 = ahora();
    var timers = [];
    var rafs = [];
    var ocupado = true;             /* RITUAL: los taps se ignoran, no se encolan */
    var control = null;
    var conMano = false;
    var idResize = 0;

    /* La variante es DETERMINISTA (§2.3): en misión, el índice de tarjeta; en
       examen, la ronda. Así las cicatrices acumuladas nunca se pisan y volver
       atrás a la misma tarjeta reencuentra la misma rotura. */
    var iVar = (m.examen && esNumero(m.ronda)) ? (m.ronda - 1) : (m.iTarjeta | 0);
    iVar = ((iVar % VARIANTES.length) + VARIANTES.length) % VARIANTES.length;
    var VAR = VARIANTES[iVar];

    var claveCicatriz = String(m.content && m.content.id);
    var previas = cicatrices[claveCicatriz] || (cicatrices[claveCicatriz] = []);

    /* Guarda anti-carrera: el alumno puede haber cerrado el modal a mitad de
       cualquier animación. Toda devolución de llamada pregunta antes de tocar el
       DOM (retos.js:714-716). */
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

    /* Un tramo de animación por rAF. Con movimiento reducido salta al estado
       final y llama ya: ninguna secuencia del juego puede quedarse esperando una
       animación que no existe. Sin requestAnimationFrame, lo mismo. */
    function animar(ms, paso, fin) {
      if (quieto || !ms || !window.requestAnimationFrame) {
        paso(1);
        if (fin) fin();
        return;
      }
      var ini = ahora();
      var id = 0;
      function marco() {
        if (!vivo()) return;
        var t = Math.min(1, (ahora() - ini) / ms);
        paso(t);
        if (t < 1) { id = window.requestAnimationFrame(marco); rafs.push(id); return; }
        if (fin) fin();
      }
      id = window.requestAnimationFrame(marco);
      rafs.push(id);
    }

    /* Los timeouts, los rAF y el arrastre mueren con el modal: sin esto, cerrar
       a mitad de la ceremonia dispararía un resolver() sobre una caja que ya no
       existe, o dejaría a MFDrag escuchando en <body> para siempre. Y `ocupado`
       se queda en true, que es lo que impide que un veredicto tardío conceda un
       «limpio» que el alumno no se ganó (§12 caso 3). */
    if (m.alCerrar) {
      m.alCerrar(function () {
        var i;
        for (i = 0; i < timers.length; i++) clearTimeout(timers[i]);
        timers.length = 0;
        if (window.cancelAnimationFrame) {
          for (i = 0; i < rafs.length; i++) window.cancelAnimationFrame(rafs[i]);
        }
        rafs.length = 0;
        if (idResize) { clearTimeout(idResize); idResize = 0; }
        window.removeEventListener("resize", alRedimensionar);
        if (control) { control.destruir(); control = null; }
        ocupado = true;
      });
    }

    /* La prueba de existencia de las láminas vive en la infraestructura: el
       veredicto es POR RUTA y de módulo (retos.js:444-507), así que se comparte
       entre capas, piezas y aperturas del modal. No se espera su promesa —la
       escena se monta ya y cada <img> lleva su propia reserva—, pero llamarla al
       montar es obligatorio por contrato. */
    if (m.precargar) m.precargar([ARTE.fragmento, ARTE.hueco, ARTE.veta, ARTE.mano]);

    /* ------------------------------------------------------------ la pantalla */

    var raiz = document.createElement("div");
    raiz.className = "kintsugi" + (ARTE.derivadas ? " kintsugi--derivadas" : "");
    raiz.setAttribute("data-estado", "ritual");

    /* DIV y no P: `tarjeta.html` viene de Markdown y casi siempre trae ya su
       propio <p>; anidarlo dentro de otro <p> es HTML inválido y el navegador lo
       rompería en dos párrafos con márgenes de más. */
    var enunciado = document.createElement("div");
    enunciado.className = "kintsugi-enunciado";
    enunciado.innerHTML = (m.tarjeta && m.tarjeta.html) || "";
    raiz.appendChild(enunciado);

    var zona = document.createElement("div");
    zona.className = "kintsugi-zona";
    raiz.appendChild(zona);

    var escena = document.createElement("div");
    escena.className = "kintsugi-escena";
    zona.appendChild(escena);

    var tablero = document.createElement("div");
    tablero.className = "kintsugi-tablero";
    tablero.setAttribute("role", "img");
    tablero.setAttribute("aria-label", T.roto);
    if (!quieto) tablero.classList.add("k-entrando");
    escena.appendChild(tablero);

    /* Una sola bandera para las dos rutas de reserva: todas las capas del
       tablero y todas las piezas salen del MISMO archivo, así que si esa lámina
       no llega, no llega ninguna. */
    function sinLamina() { raiz.classList.add("kintsugi--sinlamina"); }

    var emblema = document.createElement("img");
    emblema.className = "kintsugi-emblema";
    emblema.alt = "";
    emblema.setAttribute("aria-hidden", "true");
    emblema.draggable = false;
    /* La colocación se rehace cuando la lámina llega: el tablero lo MIDE el
       emblema, y antes de que la imagen cargue su caja es de 0 px. Sin esta
       segunda pasada, las capas y la diana se quedarían en su posición por
       defecto hasta el primer `resize`, que es como decir «para siempre». */
    emblema.onload = function () { if (vivo()) colocar(); };
    /* La cadena de respaldo: vasija → emblema del arte. Un 404 de la vasija no
       deja el tablero vacío; y si tampoco hay arte, quedan las formas de
       reserva de la ruta sin imágenes, como siempre. */
    emblema.onerror = function () {
      emblema.onerror = null;
      if (rutaEmblema) emblema.src = A + rutaEmblema;
    };
    tablero.appendChild(emblema);
    emblema.src = A + rutaVasija;

    /* Una capa = la lámina + sus dos formas de reserva. Las formas nacen
       ocultas y solo se ven en la ruta sin imágenes; van dentro de la capa para
       heredar su sitio, su tamaño y su giro sin repetir una sola medida. */
    var capas = [];

    function crearCapa(clases, v, conFormas) {
      var c = document.createElement("span");
      c.className = "kintsugi-capa " + clases;
      c.setAttribute("aria-hidden", "true");
      ilustrar(c, clases.indexOf("kintsugi-veta") >= 0 || clases.indexOf("kintsugi-cicatriz") >= 0
        ? ARTE.veta : ARTE.hueco, sinLamina);
      if (conFormas) {
        var borde = document.createElement("span");
        borde.className = "kintsugi-forma kintsugi-forma--borde";
        var fondo = document.createElement("span");
        fondo.className = "kintsugi-forma kintsugi-forma--fondo";
        c.appendChild(borde);
        c.appendChild(fondo);
      } else {
        var metal = document.createElement("span");
        metal.className = "kintsugi-forma kintsugi-forma--borde";
        c.appendChild(metal);
      }
      tablero.appendChild(c);
      capas.push({ nodo: c, v: v });
      return c;
    }

    var halo = crearCapa("kintsugi-halo", VAR, false);
    var hueco = crearCapa("kintsugi-hueco", VAR, true);

    /* Las cicatrices de las variantes ya soldadas EN ESTA CARGA DE PÁGINA: la
       acumulación visible, la firma del juego. La variante activa se salta
       aunque estuviera registrada (rejugar una tarjeta superada no duplica su
       cicatriz, §12 caso 4): ahí va el hueco. */
    var j;
    for (j = 0; j < previas.length; j++) {
      if (previas[j] === VAR.id) continue;
      crearCapa("kintsugi-cicatriz", variantePorId(previas[j]), false);
    }

    var veta = crearCapa("kintsugi-veta", VAR, false);

    /* Adorno opcional del ritual: la mano de F1. Si el archivo no está, el
       ritual corre en su variante sin mano y kintsugi funciona íntegro. */
    var mano = null;
    if (!quieto) {
      mano = document.createElement("span");
      mano.className = "kintsugi-mano";
      mano.setAttribute("aria-hidden", "true");
      var imgMano = document.createElement("img");
      imgMano.className = "kintsugi-lamina";
      imgMano.alt = "";
      imgMano.draggable = false;
      imgMano.onerror = function () { if (mano && mano.parentNode) mano.parentNode.removeChild(mano); };
      imgMano.onload = function () {
        if (imgMano.naturalWidth && imgMano.naturalHeight) { conMano = true; return; }
        if (mano && mano.parentNode) mano.parentNode.removeChild(mano);
      };
      mano.appendChild(imgMano);
      escena.appendChild(mano);
      imgMano.src = ARTE.mano;
    }

    var diana = document.createElement("div");
    diana.className = "kintsugi-hueco-drop";
    diana.setAttribute("role", "button");
    diana.setAttribute("tabindex", "0");
    diana.setAttribute("aria-label", T.hueco);
    tablero.appendChild(diana);

    var bandeja = document.createElement("div");
    bandeja.className = "kintsugi-bandeja";
    bandeja.setAttribute("data-n", String(n));
    zona.appendChild(bandeja);

    var piezas = [];
    var k;
    for (k = 0; k < n; k++) piezas.push(crearPieza(ops[k], k));

    function crearPieza(o, i) {
      var corta = (o && typeof o.corta === "string") ? o.corta.replace(/^\s+|\s+$/g, "") : "";
      if (!corta) corta = textoPlano(o && o.html).slice(0, 24);   /* red por si el censo va a medias */

      var casilla = document.createElement("div");
      casilla.className = "kintsugi-casilla";

      var boton = document.createElement("button");
      boton.type = "button";
      boton.className = "kintsugi-pieza";
      boton.setAttribute("data-k", String(i));
      /* La placa ya dice el texto, pero el aria-label explícito cubre el caso de
         que se recorte a dos líneas y el de la lámina sin cargar. */
      boton.setAttribute("aria-label", corta);

      var vuelo = document.createElement("span");
      vuelo.className = "kintsugi-pieza__vuelo";

      var ceramica = document.createElement("span");
      ceramica.className = "kintsugi-pieza__ceramica";
      /* El giro de la variante va aquí, y NO en el `__vuelo`: el resbalón se
         calcula en el marco del `__vuelo` y, dentro de un marco girado, un
         translateY(+90) se iría de lado. */
      ceramica.style.transform = "rotate(" + VAR.rot + "deg)";
      ilustrar(ceramica, ARTE.fragmento, sinLamina);
      vuelo.appendChild(ceramica);

      var placa = document.createElement("span");
      /* Etiqueta larga: baja un punto y cabe sin partir palabras. El umbral es
         el mismo que ya usa F1 (tameshiwari.js:395), para que dos juegos no
         midan «larga» de dos maneras distintas. */
      placa.className = "kintsugi-placa" + (corta.length > 18 ? " kintsugi-placa--larga" : "");
      placa.textContent = corta;
      vuelo.appendChild(placa);

      boton.appendChild(vuelo);
      casilla.appendChild(boton);
      bandeja.appendChild(casilla);

      /* La respuesta táctil va en el POINTERDOWN, no en el click: es lo que
         separa «responde» de «va lento» (<100 ms). Va en la CASILLA porque la
         pieza acumula transform en línea (MFDrag) y `.juice-presionado` es una
         clase: el estilo en línea le ganaría en cuanto la pieza se hubiera
         movido una vez. */
      boton.addEventListener("pointerdown", function () {
        if (ocupado || boton.classList.contains("kintsugi-agotada")) return;
        if (window.MFJuice && MFJuice.respuesta) MFJuice.respuesta(casilla);
      });

      var p = {
        casilla: casilla, boton: boton, vuelo: vuelo, ceramica: ceramica, placa: placa,
        corta: corta, correcta: !!(o && o.correct), i: i
      };
      /* Reapertura tras abandono: los fragmentos que ya se gastaron siguen
         gastados, y la pista sigue puesta si tocaba. */
      if (mem.falladas[i]) agotar(p);
      return p;
    }

    m.cuerpo.appendChild(raiz);

    /* ------------------------------------------- geometría (una lectura, §A.4) */

    /* DOS lecturas de layout por colocación —el tablero y el alto real de la
       placa— y después solo escrituras (presupuesto F0 §0.10.2). Nunca se lee
       dentro de un bucle de puntero ni de un rAF. Lo que se escribe son las
       cuatro variables que comparten las capas, sus formas de reserva y la
       diana: un único origen para todo lo que tiene que encajar. */
    function colocar() {
      var r = tablero.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var menor = Math.min(r.width, r.height);
      var tam = Math.round(menor * FRAC);
      var i, c;
      for (i = 0; i < capas.length; i++) {
        c = capas[i];
        c.nodo.style.setProperty("--k-lx", Math.round(c.v.fx * r.width) + "px");
        c.nodo.style.setProperty("--k-ly", Math.round(c.v.fy * r.height) + "px");
        c.nodo.style.setProperty("--k-tam", tam + "px");
        c.nodo.style.setProperty("--k-rot", c.v.rot + "deg");
      }
      diana.style.setProperty("--k-lx", Math.round(VAR.fx * r.width) + "px");
      diana.style.setProperty("--k-ly", Math.round(VAR.fy * r.height) + "px");
      diana.style.setProperty("--k-tam", tam + "px");
      /* Compensación de la placa: MFDrag centra la PIEZA ENTERA en el destino, y
         el centro del botón cae entre la cerámica y su rótulo. Sin bajar la
         diana media placa, el fragmento aterrizaría POR ENCIMA del agujero justo
         en el instante clímax. Se mide la placa de verdad, no se supone. */
      var hPlaca = piezas.length ? piezas[0].placa.offsetHeight : 0;
      diana.style.setProperty("--k-comp", Math.round((hPlaca + 6) / 2) + "px");
    }

    colocar();

    /* Rotar el móvil con el modal abierto no puede dejar la diana donde estaba
       (§12 caso 8). Debounce de 150 ms: el resize llega en ráfaga. */
    function alRedimensionar() {
      if (idResize) clearTimeout(idResize);
      idResize = setTimeout(function () {
        idResize = 0;
        if (vivo()) colocar();
      }, 150);
    }
    window.addEventListener("resize", alRedimensionar);

    /* ------------------------------------------------- estado y anti-mash (§3) */

    function estado(s) { raiz.setAttribute("data-estado", s); }

    function bloquear(v) {
      ocupado = v;
      if (v) zona.classList.add("kintsugi-ocupada");
      else zona.classList.remove("kintsugi-ocupada");
    }

    function correcta() {
      var i;
      for (i = 0; i < piezas.length; i++) { if (piezas[i].correcta) return piezas[i]; }
      return null;
    }

    function piezaDe(el) {
      var i;
      for (i = 0; i < piezas.length; i++) { if (piezas[i].boton === el) return piezas[i]; }
      return null;
    }

    /* Deshabilitar el elemento que TIENE el foco lo manda a <body>, y ahí la
       trampa de foco de retos.js ya no puede hacer nada: escucha los Tab en la
       caja del modal, y desde <body> las teclas ni le llegan. Sin este rescate,
       quien juegue con teclado se va de paseo por la misión de debajo justo
       después de fallar (mismo rescate de tameshiwari.js:437-448). */
    function rescatarFoco() {
      var libres = bandeja.querySelectorAll(".kintsugi-pieza:not(.kintsugi-agotada)");
      var destino = libres.length ? libres[0] : (m.caja && m.caja.querySelector(".reto-modal__cerrar"));
      if (destino && destino.focus) { try { destino.focus(); } catch (e) { /* nada */ } }
    }

    /* Gastada = INERTE de verdad. `disabled` y no solo `aria-disabled`: un
       <button> es enfocable de nacimiento, así que quitarle el tabindex no lo
       saca del tabulador y el teclado seguiría llegando a un fragmento que ya no
       juega. La clase, además, lo saca del selector de MFDrag —que delega con
       `closest(cfg.piezas)` en cada pointerdown (mfdrag.js:303), así que el
       `:not()` se reevalúa solo. */
    function agotar(p) {
      var teniaFoco = (document.activeElement === p.boton);
      p.boton.classList.add("kintsugi-agotada");
      p.boton.setAttribute("aria-disabled", "true");
      p.boton.disabled = true;
      if (teniaFoco) rescatarFoco();
    }

    /* ------------------------------------------------------- el ritual (§3) -- */

    /* Puerta única a JUGANDO, para que el camino con ceremonia y el de
       movimiento reducido no puedan separarse nunca. */
    function jugando() {
      /* Recolocación obligatoria, y no una precaución: la caja del modal entra
         con `modal-rise` (game.css:1175), que es una animación de TRANSFORM de
         220 ms, así que todo rect leído mientras corre viene ESCALADO. Medido en
         el móvil de referencia: la capa salía de 58 px en vez de 60 y la diana
         heredaba el mismo error. Aquí la animación ya terminó. */
      colocar();
      /* La mano es el actor del ritual, no atrezo permanente: cumplida su
         entrada se retira, o se quedaría tapando el cuarto superior del emblema
         justo donde el alumno tiene que soltar la pieza. */
      if (mano && mano.parentNode) mano.parentNode.removeChild(mano);
      bloquear(false);
      estado("jugando");
      anunciar(T.abre);
    }

    function ritual() {
      var i;
      bloquear(true);
      if (quieto) {
        /* Movimiento reducido: el emblema nace ya partido, las piezas se ven
           desde el primer frame y el estado se cuenta con palabras. */
        for (i = 0; i < piezas.length; i++) piezas[i].casilla.style.visibility = "";
        jugando();
        return;
      }

      for (i = 0; i < piezas.length; i++) piezas[i].casilla.style.visibility = "hidden";

      /* t300: la mano entra en canto (200 ms). Es el ÚNICO tramo opcional del
         ritual: sin su lámina en disco se salta entero y la ceremonia dura 200 ms
         menos, sin cambiar ni un tiempo de lo que viene después. `conMano` no se
         puede saber al montar (lo decide la carga de la imagen), así que se
         consulta aquí, que es cuando hace falta. */
      luego(300, function () {
        if (conMano && mano) {
          mano.classList.add("is-dentro");
          luego(200, golpe);
        } else {
          golpe();
        }
      });

      function golpe() {
        /* El crujido y el hitstop llegan JUNTOS: congelar 70 ms todo lo que se
           mueve dentro de la caja es lo que convierte el cambio de estado en un
           golpe (nada de screenshake en esta casa).
           SONIDO (titular 2026-09-02): la mano rompe DE VERDAD — el puño y la
           madera crujiendo del censo de fx (docs/09), combinados como todo
           contacto: gesto al instante, rotura en el frame del impacto. El
           triangle de siempre queda de respaldo sin fábrica. */
        if (window.MFJuice && MFJuice.hitstop) MFJuice.hitstop(m.caja, 70);
        if (window.MFSonido && MFSonido.fx && MFSonido.fx("fx-golpe")) {
          MFSonido.fx("fx-tabla-rompe", 60);
        } else if (window.MFSonido && MFSonido.nota) {
          MFSonido.nota(196, { tipo: "triangle", attack: 6, decay: 260, gain: 0.2 });
        }
        luego(70, function () {
          /* La rotura entra de golpe, no se dibuja: la lámina del hueco es una
             forma RELLENA y un barrido angular sobre un relleno la revela por
             sectores, como una porción de tarta, en vez de recorrer el contorno
             (§A.5). El impacto lo pone el squash del tablero. */
          tablero.classList.remove("k-entrando");
          if (window.MFJuice && MFJuice.squash) MFJuice.squash(tablero);
          luego(200, caida);
        });
      }

      function caida() {
        var p = piezas[0];
        for (var q = 0; q < piezas.length; q++) piezas[q].casilla.style.visibility = "";
        /* El fragmento que cae del hueco es SIEMPRE el primero, nunca el
           correcto: la ceremonia no puede delatar la respuesta, y como el índice
           es fijo no transporta ni un bit de información. */
        volarDesdeElHueco(p, jugando);
      }
    }

    /* Bézier cuadrática del hueco a la casilla, con giro y escala: el fragmento
       NACE del tamaño del agujero y crece, que es lo que vende «salió de ahí».
       Una sola pareja de rects antes de animar. */
    function volarDesdeElHueco(p, fin) {
      var rh = hueco.getBoundingClientRect();
      var rc = p.ceramica.getBoundingClientRect();
      if (!rc.width) { if (fin) fin(); return; }
      var ch = centro(rh), cc = centro(rc);
      var p0x = ch.x - cc.x, p0y = ch.y - cc.y;
      var largo = Math.sqrt(p0x * p0x + p0y * p0y);
      var cx = p0x / 2, cy = p0y / 2 - largo * 0.18;
      var s0 = Math.max(0.2, rh.width / rc.width);
      animar(250, function (t) {
        var e = t * t;                                   /* ease-in: cae */
        var u = 1 - e;
        var x = u * u * p0x + 2 * e * u * cx;
        var y = u * u * p0y + 2 * e * u * cy;
        var s = s0 + (1 - s0) * e;
        p.ceramica.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) " +
          "rotate(" + (VAR.rot - 12 * (1 - e)).toFixed(1) + "deg) scale(" + s.toFixed(3) + ")";
      }, function () {
        /* Último frame EXACTO: sin esto quedaría un transform residual de
           décimas y la pieza no estaría del todo en su casilla. */
        p.ceramica.style.transform = "rotate(" + VAR.rot + "deg)";
        if (fin) fin();
      });
    }

    /* --------------------------------------------------- el juicio (§3 y §4) - */

    /* MFDrag lleva la pieza al centro del destino SIEMPRE que el veredicto sea
       "encaja" (alCentroDe, mfdrag.js:271-277 y :287-296), tanto con el dedo
       como con el tocar-tocar y el teclado. Por eso las dos rutas devuelven lo
       mismo y el juicio entero vive en `alEncajado`: es el único instante en que
       la pieza ya está en su hueco, y es lo que hace que arrastrar y tocar sean
       EQUIVALENTES —mismas transiciones, mismos veredictos, mismos anuncios—
       como exige el criterio 2 del gate. */
    function veredicto(pieza, destino) {
      if (ocupado || !destino) return "vuelve";
      var p = piezaDe(pieza);
      if (!p || p.boton.classList.contains("kintsugi-agotada")) return "vuelve";
      bloquear(true);
      estado("viajando");
      return "encaja";
    }

    function alEncajado(pieza) {
      var p = piezaDe(pieza);
      if (!p || !vivo()) return;
      mem.intentos++;
      if (p.correcta) soldar(p, mem.intentos === 1);
      else if (m.examen) veredictoExamen(p);
      else resbalar(p);
    }

    control = window.MFDrag ? MFDrag.crear({
      zona: zona,
      piezas: ".kintsugi-pieza:not(.kintsugi-agotada)",
      destinos: ".kintsugi-hueco-drop",
      umbral: 6,
      iman: 28,
      limites: true,
      toques: true,
      alSoltar: veredicto,
      alTocar: veredicto,
      alEncajado: alEncajado
    }) : null;

    /* ------------------------------------------------ SOLDAR · acierto §5.1 -- */

    function soldar(p, limpio) {
      estado("soldando");
      /* La variante de racha se decide ANTES de sumar el acierto en curso: se
         dispara desde el SEGUNDO limpio seguido. En examen la racha ni suma ni
         se resetea (§10). */
      var conRacha = rachaLimpia >= 1;
      if (!m.examen) { if (limpio) rachaLimpia++; else rachaLimpia = 0; }

      /* Una sola lectura de layout antes de animar: el punto de encaje en
         coordenadas del escenario de efectos. */
      var rh = hueco.getBoundingClientRect();
      var re = m.escenario ? m.escenario.getBoundingClientRect() : null;
      var ch = centro(rh);
      var px = re ? ch.x - re.left : 0;
      var py = re ? ch.y - re.top : 0;

      if (window.MFJuice && MFJuice.particulas) {
        MFJuice.particulas(m.escenario, conRacha ? {
          x: px, y: py, n: 12, angulo: -90, dispersion: 180, dist: [30, 70], dur: [450, 650],
          colores: [ORO, ORO_CLARO, "#f7f3ec"], forma: "petalo"
        } : {
          x: px, y: py, n: 6, angulo: -90, dispersion: 180, dist: [10, 26], dur: [180, 260],
          colores: [ORO_CLARO, "#ffffff"], forma: "chispa"
        });
      }
      if (window.MFJuice && MFJuice.hitstop) MFJuice.hitstop(m.caja, 60);

      luego(quieto ? 0 : 60, function () {
        /* Intercambio de estado: el emblema estaba ENTERO debajo todo el tiempo,
           así que basta retirar el hueco y su halo para que vuelva a verse
           completo, y encender la veta encima. El fragmento de la bandeja se
           esconde: a partir de aquí lo que se ve es la junta soldada. */
        tablero.classList.add("k-sellado");
        tablero.setAttribute("aria-label", T.entero);
        p.vuelo.style.visibility = "hidden";
        encenderVeta(400);
        if (window.MFSonido && MFSonido.campana) MFSonido.campana();

        luego(quieto ? 0 : 400, function () {
          if (window.MFJuice && MFJuice.destello) {
            MFJuice.destello(m.escenario, px, py, { radio: 60, color: "rgba(246, 200, 110, 0.9)" });
          }
          if (window.MFJuice && MFJuice.squash) MFJuice.squash(tablero);
        });

        luego(quieto ? 0 : 460, function () {
          if (window.MFJuice && MFJuice.sello) {
            MFJuice.sello(m.escenario, conRacha ? T.selloRacha : T.sello);
          }
          /* El sonido no es movimiento: suena también con movimiento reducido, y
             solo si el alumno encendió el interruptor del modal. */
          if (window.MFSonido) {
            if (MFSonido.arpegio) MFSonido.arpegio();
            if (MFSonido.vibrar) MFSonido.vibrar([10, 30, 20]);
          }
        });

        /* La cicatriz se registra al soldar, no al resolver: si el alumno cierra
           el modal en el último instante, la restauración ya ocurrió. */
        if (previas.indexOf(VAR.id) === -1) previas.push(VAR.id);
        anunciar(T.gana.replace("{c}", p.corta));

        /* Se pregunta UNA vez y el mismo número manda sobre el texto y sobre el
           vuelo al HUD: dos preguntas podrían dar dos cifras y ya habría una
           pantalla mintiendo. */
        var paga = premio(limpio);

        /* Con movimiento reducido el resultado tiene que poder LEERSE: la veta
           quieta no basta como única señal (§11.6). */
        if (quieto) resultado(paga ? conXP(T.resultadoXp, paga) : T.resultado);

        /* El cobro solo vuela si el bonus es de verdad: en examen no existe
           —`mission.js` lo cobra con `!isExam` (§0.8.1) y el examen entrega por
           `completeExam`— y desde la sala de retos puede valer menos, o nada.
           Con `paga` en 0 no vuela nada: prometer un XP que jamás llega era
           justo el error que esto viene a arreglar. El chip vuela con el número
           exacto que se va a pagar. */
        if (paga && !quieto) {
          luego(720, function () {
            if (window.MFJuice && MFJuice.volarXP) MFJuice.volarXP(tablero, paga);
          });
        }

        luego(quieto ? 200 : 780, function () {
          estado("resuelto");
          m.resolver({ limpio: limpio, intentos: mem.intentos, ms: Math.round(ahora() - t0) });
        });
      });
    }

    /* La veta se DIBUJA: barrido angular de la máscara cónica sobre la junta.
       AVISO DE COSTE (§12 caso 9): mover una máscara por custom property repinta
       la capa cada frame, NO se compone en GPU como transform/opacity. Es un
       único elemento de ~65 px durante 400 ms; si algún día no pasara el
       presupuesto de 0.10.2, se degrada al fundido poniendo `ms` a 0 aquí —el
       @supports de la hoja ya cubre el navegador sin máscaras. */
    function encenderVeta(ms) {
      veta.style.setProperty("--k-ang", quieto ? "360deg" : "0deg");
      veta.classList.add("is-visible");
      if (quieto) return;
      animar(ms, function (t) {
        var e = 1 - (1 - t) * (1 - t);                   /* ease-out */
        veta.style.setProperty("--k-ang", (360 * e).toFixed(1) + "deg");
      }, function () {
        veta.style.setProperty("--k-ang", "360deg");
      });
    }

    function resultado(texto) {
      var p = document.createElement("p");
      p.className = "reto-resultado";
      p.textContent = texto;
      raiz.appendChild(p);
    }

    /* -------------------------------------------------- RESBALAR · fallo §5.2 */

    /* El fragmento llegó al hueco y NO suelda: resbala por el emblema, cae
       girando como una moneda y se asienta en su casilla, gastado. El emblema
       JAMÁS reacciona mal al fallo (no tiembla, no se agrieta más): el fallo es
       de la pieza, nunca del símbolo del alumno. */
    function resbalar(p) {
      estado("resbalando");
      rachaLimpia = 0;
      mem.falladas[p.i] = true;

      if (window.MFSonido && MFSonido.nota) {
        MFSonido.nota(1318.5, { tipo: "triangle", attack: 2, decay: 90, gain: 0.15 });
      }

      deslizar(p, true, function () {
        /* El rebote cómico va en la CASILLA y no en la pieza: el keyframe
           `juice-fallo` declara `0% { transform: translateX(0) }` y una animación
           gana siempre al estilo en línea — aplicado a la pieza, la mandaría de
           golpe a su posición de origen durante 400 ms. La casilla nunca lleva
           transform propio. El kit ya dispara su nota grave: kintsugi NUNCA
           llama a MFSonido.fallo() por su cuenta o sonaría dos veces. Sin
           screenshake y sin vibración: el fallo no castiga. */
        if (window.MFJuice && MFJuice.fallo) MFJuice.fallo(p.casilla, m.escenario);
        agotar(p);

        luego(quieto ? 0 : 150, function () {
          /* Lo que ENSEÑA es el feedback escrito de ESA opción; el panel y el
             evento reto_fail los pone la infraestructura. */
          m.fallar(p.i);
          anunciar(T.falla.replace("{c}", p.corta));

          /* Pista desde el 2.º fallo: contorno + ✨ + brillo + anuncio. Con 3
             piezas la tercera ya está forzada, así que es aritméticamente
             inocua y garantiza terminar restaurando habiendo LEÍDO los
             feedbacks (§11.10). */
          if (mem.intentos >= 2) {
            var c = correcta();
            if (c && !c.boton.classList.contains("kintsugi-pista")) {
              c.boton.classList.add("kintsugi-pista");
              luego(60, function () { anunciar(T.pista); });
            }
          }

          /* Repesca ilimitada y sin cronómetro (regla del titular). */
          estado("leyendo");
          bloquear(false);
        });
      });
    }

    /* El resbalón y la caída-giro, en un solo camino para que el veredicto de
       examen pueda pedir solo el primer tramo. `conCaida` a false = resbalón
       acortado, sin comedia: el examen informa, no hace chistes. */
    function deslizar(p, conCaida, fin) {
      /* Una sola pareja de rects: dónde está la pieza AHORA (la dejó MFDrag en
         el hueco) y dónde tiene que acabar (el centro de su casilla). El delta
         se guarda en el marco del `__vuelo`, así el último frame es exacto y no
         queda transform residual. */
      var rv = p.vuelo.getBoundingClientRect();
      var rc = p.casilla.getBoundingClientRect();
      var cv = centro(rv), cc = centro(rc);
      /* Los dos rects vienen en píxeles de PANTALLA y este `translate` se escribe
         en píxeles CSS, que el zoom de casa (styles.css:79) vuelve a encoger: sin
         dividir, la pieza rechazada se quedaba a un 20 % del camino de su casilla
         —medido: 27 px a la derecha y 42 px por encima de su hueco en tablet—,
         flotando sobre el emblema en vez de volver a la bandeja. Los `20` y `90`
         de más abajo NO se tocan: son medidas de diseño y ya están en píxeles
         CSS. Misma cuenta que el arrastre; sin MFDrag, el 1 no cambia nada. */
      var kz = (window.MFDrag && MFDrag.zoomDe) ? MFDrag.zoomDe(p.vuelo) : 1;
      var casaX = (cc.x - cv.x) / kz, casaY = (cc.y - cv.y) / kz;
      /* El signo de la X va hacia el lado de su casilla: la pieza se escurre
         hacia donde vive. */
      var sx = casaX < 0 ? -20 : 20;

      if (quieto) {
        /* Sin animación la pieza aparece ya en su casilla, gastada, y el
           feedback se abre al instante (§11.6). */
        p.vuelo.style.transform = "translate(" + casaX.toFixed(1) + "px," + casaY.toFixed(1) + "px)";
        fin();
        return;
      }

      p.vuelo.style.transition = "transform 350ms ease-in";
      p.vuelo.style.transform = "translate(" + sx + "px, 90px)";
      /* La cerámica se ladea durante el mismo tramo. Va con su propia transición
         porque el `__vuelo` solo lleva translate: si el ladeo viajara ahí, el
         giro de variante se perdería y la placa se ladearía con él. */
      p.ceramica.style.transition = "transform 350ms ease-in";
      p.ceramica.style.transform = "rotate(" + (VAR.rot + 25) + "deg)";

      luego(350, function () {
        p.vuelo.style.transition = "";
        p.ceramica.style.transition = "";
        if (!conCaida) {
          /* Resbalón acortado (examen): la pieza vuelve a su casilla en línea
             recta, sin comedia y sin giro de moneda — el examen informa, no hace
             chistes. Volver es OBLIGATORIO, no un remate: el hueco está en el
             cuarto alto del emblema y una pieza que se quedara 90 px más abajo
             se planta justo encima del dibujo, tapando la veta de plata que es
             TODO lo que este veredicto tiene que enseñar. */
          p.vuelo.style.transition = "transform 150ms ease-out";
          p.vuelo.style.transform = "translate(" + casaX.toFixed(1) + "px," + casaY.toFixed(1) + "px)";
          p.ceramica.style.transition = "transform 150ms ease-out";
          p.ceramica.style.transform = "rotate(" + VAR.rot + "deg)";
          luego(150, function () {
            p.vuelo.style.transition = "";
            p.ceramica.style.transition = "";
            fin();
          });
          return;
        }

        /* Cae y gira como una moneda. El giro va en la CERÁMICA y no en el
           `__vuelo`: la placa no puede acabar boca abajo, porque el resultado se
           cuenta también con texto y el texto tiene que leerse. */
        var d0x = sx, d0y = 90;
        var cx = (d0x + casaX) / 2, cy = (d0y + casaY) / 2 - 30;
        animar(300, function (t) {
          var e = t * t;
          var u = 1 - e;
          var x = u * u * d0x + 2 * e * u * cx + e * e * casaX;
          var y = u * u * d0y + 2 * e * u * cy + e * e * casaY;
          p.vuelo.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
          p.ceramica.style.transform = "rotate(" + (VAR.rot + 25 + 540 * e).toFixed(1) + "deg)";
        }, function () {
          p.vuelo.style.transform = "translate(" + casaX.toFixed(1) + "px," + casaY.toFixed(1) + "px)";
          p.ceramica.style.transform = "rotate(" + (VAR.rot + 565) + "deg)";
          fin();
        });
      });
    }

    /* ------------------------------------- VEREDICTO DE EXAMEN · sin repesca § 10 */

    /* El primer fragmento que llega al hueco decide. La pieza errónea hace el
       resbalón acortado; acto seguido el fragmento CORRECTO viaja solo al hueco
       y suelda en PLATA, con sello y palabra distintos del acierto: el alumno VE
       cuál era la buena sin que parezca victoria. */
    function veredictoExamen(p) {
      estado("veredicto");
      mem.falladas[p.i] = true;

      if (window.MFSonido && MFSonido.nota) {
        MFSonido.nota(1318.5, { tipo: "triangle", attack: 2, decay: 90, gain: 0.15 });
      }

      deslizar(p, false, function () {
        agotar(p);
        var c = correcta();
        /* El arrastre se apaga ANTES del auto-viaje: `control` no expone un
           `viajar()` público (mfdrag.js:516-520 devuelve solo destruir/elegir/
           elegida), así que este tramo lo anima kintsugi con una transición CSS
           sobre `transform` — nunca sobre custom properties, que no interpolan
           sin @property y saltarían. */
        if (control) { control.destruir(); control = null; }
        if (!c) { cerrarExamen(p, null); return; }

        var rc = c.ceramica.getBoundingClientRect();
        var rh = hueco.getBoundingClientRect();
        var cc = centro(rc), ch = centro(rh);
        var dx = ch.x - cc.x, dy = ch.y - cc.y;

        if (!quieto) {
          c.vuelo.style.transition = "transform 250ms ease-out";
          c.vuelo.style.transform = "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px)";
        }

        luego(quieto ? 0 : 250, function () {
          c.vuelo.style.transition = "";
          tablero.classList.add("k-sellado");
          tablero.setAttribute("aria-label", T.entero);
          c.vuelo.style.visibility = "hidden";
          /* Plata: un cambio de la variable del metal, en un solo sitio. La
             junta es la misma; lo que cambia es de qué está hecha. */
          veta.classList.add("kintsugi-veta--plata");
          encenderVeta(350);
          if (window.MFSonido && MFSonido.campana) MFSonido.campana();

          luego(quieto ? 0 : 350, function () {
            if (window.MFJuice && MFJuice.sello) MFJuice.sello(m.escenario, T.selloExamen);
            cerrarExamen(p, c);
          });
        });
      });
    }

    function cerrarExamen(p, c) {
      /* Los dos feedbacks: el de la opción tocada (que además registra el
         reto_fail) y el de la correcta, para que el alumno lea por qué era esa.
         Ninguno de los dos suma ni resta XP: eso es de la infraestructura. */
      m.fallar(p.i);
      if (c) m.feedback(c.i);
      anunciar(T.examen.replace("{c}", c ? c.corta : ""));
      if (quieto) resultado(T.resultado);
      luego(quieto ? 200 : 900, function () {
        estado("resuelto");
        m.resolver({ limpio: false, intentos: 1, ms: Math.round(ahora() - t0) });
      });
    }

    /* --------------------------------------------------------------- arranque */

    ritual();
  }

  function variantePorId(id) {
    var i;
    for (i = 0; i < VARIANTES.length; i++) { if (VARIANTES[i].id === id) return VARIANTES[i]; }
    return VARIANTES[0];
  }

  /* ============================================================== REGISTRO === */

  MFRetos.registrar({
    id: "kintsugi",
    nombre: T.nombre,
    icono: "🏺",
    banner: T.banner,
    comoSeJuega: T.comoSeJuega,
    /* Comodín universal de decisión única: le vale cualquier quiz con etiquetas
       cortas y exactamente una respuesta correcta. Sin `corta` en el contenido,
       el sorteo lo salta y la tarjeta cae al quiz clásico sin romper nada. */
    necesita: ["corta", "correct1", "sinorden"],
    acepta: function (tarjeta, content) {
      var n = ((tarjeta && tarjeta.options) || []).length;
      if (n < 2 || n > 4) return false;                 /* de 2 (verdadero/falso) a 4 piezas */
      /* Sin emblema del arte no hay juego: NUNCA se dibuja un hueco sobre nada.
         Hoy están los 12 en disco, así que esta guarda no veta ninguna tarjeta;
         existe para el día que se añada un arte antes que su lámina. */
      return !!(cfg.gameArt || {})["art-" + (content && content.art)];
    },
    jugar: jugar
  });
})();

/* MenteFu / MindFu — infraestructura de los miniretos (MFRetos).

   Aquí vive todo lo que NO es un juego: el registro donde cada minijuego se
   apunta, el sorteo que decide cuál sale en cada tarjeta, el modal donde se
   juega y la medición. Los juegos solo pintan y juzgan; el XP, los cierres,
   el historial del navegador y los eventos los pone este archivo, para que
   ninguna ficha futura pueda olvidarse de medir ni cobrar de su propia mano.

   Tres invariantes gobiernan el archivo:
     · CON CERO JUEGOS REGISTRADOS el sitio se comporta exactamente como hoy:
       `sortear()` devuelve null, mission.js cae a su quiz clásico y aquí no
       se emite ni un evento. La infraestructura solo despierta cuando alguien
       se registra.
     · El modal calca el contrato ya probado de pergamino.js (uno solo abierto,
       Escape, clic en fondo, historial del móvil, foco que va y vuelve, guarda
       anti-carrera). Lo que allí funcionó no se reinventa aquí.
     · MFJuice, MFSonido y MFDrag son OPCIONALES: si no están cargados, el reto
       se juega igual, sin efectos. Ninguna llamada a ellos va sin guarda.

   El modal se cuelga de document.body y no de .mission__stage a propósito: el
   swipe de misión (mission.js) escucha en el stage, así que colgando fuera ni
   siquiera ve los gestos del juego. */
(function () {
  "use strict";

  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var XP = cfg.xp || {};
  /* Lo que vale una victoria limpia jugada DESDE UNA MISIÓN: el bonus de acertar
     a la primera, el mismo que cobra mission.js con `!isExam`. Es el valor por
     defecto de `montaje.premia` y por eso vive aquí y no en cada ficha. */
  var BONUS_MISION = XP.quiz_first_try || 5;
  var T = ES ? {
    reto: "Reto", cerrar: "Cerrar", sonido: "Sonido",
  } : {
    reto: "Challenge", cerrar: "Close", sonido: "Sound",
  };

  /* Rondas de un examen (0.9): tres miniretos seguidos. */
  var RONDAS = 3;

  /* ------------------- LOS DOS SEGUNDOS DEL SELLO (titular 2026-08-28) ------
     «Una vez logrado aprobar, agrega un delay de 2 segundos antes de cerrar el
     modal, para que se pueda apreciar bien el sello de victoria.» Y su
     aclaración, que es la que manda sobre cualquier atajo: la espera EMPIEZA
     CUANDO EL SELLO YA ESTÁ PUESTO, no cuando se gana la partida. No es un tope
     para la animación ni un `max(2 s, animación)`: si un juego tarda 850 ms en
     estampar —tameshiwari— el modal vive dos segundos MÁS a partir de la
     estampa, o sea 2,85 s desde la victoria. */
  var ESPERA_SELLO = 2000;
  /* Tope de cortesía al leer del CSS cuánto dura la estampa: una hoja rota o un
     retoque desmedido no pueden dejar el modal clavado. */
  var ESTAMPA_TOPE = 1000;

  /* "0.26s" · "260ms" · "0s". Una lista ("0.26s, 1s") se lee por su PRIMER
     valor, que es el de la animación de entrada. */
  function msDe(txt) {
    var s = String(txt == null ? "" : txt).split(",")[0].trim();
    if (!s) return 0;
    var n = parseFloat(s);
    if (!isFinite(n) || n <= 0) return 0;
    return s.indexOf("ms") >= 0 ? n : n * 1000;
  }

  /* Cuánto le falta al sello recién colgado para terminar de ESTAMPARSE. Se lee
     del CSS (`juice-sello-in`, 260 ms hoy) en vez de copiar el número aquí: si
     game.css retoca la estampa, la espera se ajusta sola y nadie tiene que
     acordarse de este archivo. Con movimiento reducido styles.css apaga la
     animación con `!important`, así que sale 0 y el reloj arranca en el acto —
     que es lo correcto: ahí el sello ya está entero desde el primer fotograma. */
  function duracionEstampa(nodo) {
    if (!nodo || !window.getComputedStyle) return 0;
    var cs;
    try { cs = getComputedStyle(nodo); } catch (e) { return 0; }
    if (!cs || !cs.animationName || cs.animationName === "none") return 0;
    var ms = msDe(cs.animationDuration) + msDe(cs.animationDelay);
    return Math.max(0, Math.min(ESTAMPA_TOPE, ms));
  }

  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  /* El texto plano de un feedback en HTML: la región aria-live lee palabras,
     no etiquetas. */
  function texto(html) {
    var d = document.createElement("div");
    d.innerHTML = String(html == null ? "" : html);
    return (d.textContent || "").replace(/\s+/g, " ").trim();
  }

  /* performance.now no existe en navegadores muy modestos y Date.now mide igual
     de bien la duración de una partida. */
  function ahora() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function medir(t0) { return Math.max(0, Math.round(ahora() - t0)); }

  function esNumero(v) { return typeof v === "number" && isFinite(v); }

  /* «+5 XP», con otro número. Los ocho juegos llevan esa cifra ESCRITA DENTRO de
     sus cadenas de ES y EN («Cadena completa. +5 XP», «Gate held. +5 XP»), y esas
     cadenas no se reescriben: entre la misión (5) y la sala de retos (2, 3…) lo
     único que cambia es el número. Se sustituye la PRIMERA cifra precedida de
     «+», que en las ocho fichas es la del bonus.
     Con un número inválido o cero devuelve el texto intacto: quien no cobra no
     debe llamar aquí —el «+0 XP» no existe— y, si llama, al menos no estropea la
     frase. */
  function conXP(texto, n) {
    var s = String(texto == null ? "" : texto);
    if (!esNumero(n) || n <= 0) return s;
    return s.replace(/\+\s*\d+/, "+" + Math.round(n));
  }

  /* Medir nunca puede tumbar una partida: si MF no está o track revienta, el
     juego sigue exactamente igual. */
  function track(evento, item, datos) {
    if (!window.MF || !MF.track) return;
    try { MF.track(evento, { item: item || null, data: datos || {} }); } catch (e) { /* nada */ }
  }

  /* ============================================================== REGISTRO === */

  var JUEGOS = [];      /* en orden de registro: el sorteo es uniforme, el orden solo fija el recorrido */
  var PORID = {};

  function registrar(juego) {
    if (!juego || !juego.id || typeof juego.jugar !== "function") return false;
    /* Registrar dos veces el mismo id (un script servido por duplicado desde
       caché) no debe doblar sus probabilidades en el sorteo: el último
       registro sustituye al anterior en su sitio. */
    if (PORID[juego.id]) {
      for (var i = 0; i < JUEGOS.length; i++) {
        if (JUEGOS[i].id === juego.id) { JUEGOS[i] = juego; break; }
      }
    } else {
      JUEGOS.push(juego);
    }
    PORID[juego.id] = juego;
    return true;
  }

  function juegos() {
    var ids = [];
    for (var i = 0; i < JUEGOS.length; i++) ids.push(JUEGOS[i].id);
    return ids;
  }

  /* La ventanilla de consulta del registro. `juegos()` devuelve solo ids porque
     es lo único que necesita el sorteo, que ya tiene el registro a mano; la sala
     de retos (sala-retos.js) invierte el sorteo —allí el alumno ELIGE el juego y
     lo que sale al azar es la pregunta— y para pintar su ficha necesita el
     nombre y el icono, y para abrirla, el objeto mismo.
     Se devuelve el objeto REGISTRADO, no una copia: `abrir()` compara y usa ese
     mismo objeto, y una copia rompería `PORID`. Con hasOwnProperty, porque
     `PORID` es un objeto plano y un id como «constructor» devolvería una función
     heredada que ni siquiera es un juego. */
  function juego(id) {
    return (id && Object.prototype.hasOwnProperty.call(PORID, id)) ? PORID[id] : null;
  }

  /* ========================================================= COMPATIBILIDAD == */

  function opciones(tarjeta) { return (tarjeta && tarjeta.options) || []; }

  function todasConCorta(tarjeta) {
    var ops = opciones(tarjeta);
    if (!ops.length) return false;
    for (var i = 0; i < ops.length; i++) {
      var c = ops[i] && ops[i].corta;
      if (typeof c !== "string" || !c.replace(/\s+/g, "")) return false;
    }
    return true;
  }

  function conOrden(tarjeta) {
    var ops = opciones(tarjeta), n = 0;
    for (var i = 0; i < ops.length; i++) { if (ops[i] && esNumero(ops[i].orden)) n++; }
    return n >= 2;
  }

  function unaCorrecta(tarjeta) {
    var ops = opciones(tarjeta), n = 0;
    for (var i = 0; i < ops.length; i++) { if (ops[i] && ops[i].correct) n++; }
    return n === 1;
  }

  function familiaDe(tarjeta) {
    if (!tarjeta || !tarjeta.reto) return "";
    var f = tarjeta.reto.familia;
    return typeof f === "string" ? f.replace(/^\s+|\s+$/g, "").toLowerCase() : "";
  }

  function satisface(clave, tarjeta, content) {
    if (clave === "corta") return todasConCorta(tarjeta);
    if (clave === "orden") return conOrden(tarjeta);
    /* El espejo de `orden` (titular 2026-09-02): los juegos de RESPUESTA ÚNICA
       no deben sortearse sobre una pregunta de secuencia — elegir una sola
       opción contradiría el enunciado («ejecuta 1·2·3»). La presencia de orden
       ES el tipo de la pregunta: con orden, secuencia; sin orden, única. */
    if (clave === "sinorden") return !conOrden(tarjeta);
    if (clave === "correct1") return unaCorrecta(tarjeta);
    if (clave === "vf") return !!(tarjeta && tarjeta.reto && tarjeta.reto.vf);
    /* El pool viaja entero: la infraestructura NO filtra porque no conoce el
       criterio de cada juego (F3 y F5 usan filtros distintos). El mínimo de
       candidatos se comprueba en el `acepta` de cada ficha. */
    if (clave === "pool") return !!(content && Array.isArray(content.pool) && content.pool.length);
    if (clave.indexOf("familia:") === 0) return familiaDe(tarjeta) === clave.slice(8).replace(/^\s+|\s+$/g, "").toLowerCase();
    /* Una clave que esta versión no conoce NO se da por satisfecha: es mejor
       caer al quiz clásico que dejar jugar a un juego al que le falta su dato. */
    return false;
  }

  function compatibles(tarjeta, content) {
    var ids = [];
    for (var i = 0; i < JUEGOS.length; i++) {
      var j = JUEGOS[i];
      var necesita = j.necesita || [];
      var ok = true;
      for (var k = 0; k < necesita.length && ok; k++) ok = satisface(String(necesita[k]), tarjeta, content);
      if (ok && typeof j.acepta === "function") {
        /* un `acepta` que lanza es un juego roto, no una tarjeta inválida:
           se descarta ese juego y el resto del sorteo sigue vivo */
        try { ok = !!j.acepta(tarjeta, content); } catch (e) { ok = false; }
      }
      if (ok) ids.push(j.id);
    }
    return ids;
  }

  /* ================================================= AZAR Y DETERMINISMO ===== */

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

  /* En examen el azar tiene que ser reproducible dentro del mismo intento
     (recargar a mitad no puede cambiar el sorteo) y distinto en el siguiente
     (el botón de reintento sube ctx.intento). Se guarda el GENERADOR, no la
     semilla: un generador nuevo por llamada devolvería siempre el mismo primer
     número y las tres rondas caerían en el mismo juego. */
  var FLUJOS = {};

  function claveFlujo(content, ctx) {
    return String(content && content.id) + "#" + ((ctx && ctx.intento) | 0);
  }

  function rngDe(content, ctx) {
    if (!content || content.kind !== "exam") return Math.random;
    var clave = claveFlujo(content, ctx);
    if (!FLUJOS[clave]) FLUJOS[clave] = mulberry32(hash(String(content.id)) ^ ((ctx && ctx.intento) | 0));
    return FLUJOS[clave];
  }

  /* Un índice dentro del array, sin que un rng() de 1.0 se salga por arriba. */
  function elegirIndice(rng, largo) {
    return Math.max(0, Math.min(largo - 1, Math.floor(rng() * largo)));
  }

  function barajar(arr, rng) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = elegirIndice(rng, i + 1);
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* ================================================================ SORTEO === */

  function sortear(tarjeta, content, ctx, iTarjeta) {
    ctx = ctx || {};
    /* Cacheo PRIMERO: reabrir el modal, o volver atrás y reentrar en la
       tarjeta, jamás cambia de juego. */
    if (ctx.sorteos && ctx.sorteos[iTarjeta]) return ctx.sorteos[iTarjeta];

    /* En examen NUNCA se tiran los dados por tarjeta: `seleccionarExamen()` ya
       dejó cacheada, de una vez, la asignación de las rondas (§0.9.1). Un fallo
       de caché aquí solo significa una de dos cosas, y las dos piden quiz
       clásico: o saltó el fallback total (<3 juegos registrados, sin una sola
       asignación válida, o el motor caído — §0.9) o a esa pregunta se le asignó
       deliberadamente `juego: null` para completar las rondas. Sin este guardia
       el examen se convertía en tantos miniretos como preguntas tuviera el mazo
       —seis tameshiwari seguidos con un solo juego registrado— en vez de correr
       «exactamente como hoy». */
    if (content && content.kind === "exam") return null;

    var item = content && content.id;
    var lista = compatibles(tarjeta, content);
    if (!lista.length) {
      /* Sin ningún juego registrado el sistema entero está dormido: emitir un
         evento de «fallback» por cada tarjeta llenaría la cola de 200 filas de
         progress.js con ruido antes de que exista el primer minijuego. */
      if (JUEGOS.length) track("reto_sorteo", item, { tarjeta: iTarjeta, juego: null, compatibles: [], fallback: true });
      return null;
    }

    /* JUEGO FIJADO (Tu Escuela, 2026-09-02): el autor puede fijar el juego de
       una tarjeta con la directiva `@juego:` — que build.py ya transporta en
       tarjeta.reto.juego sin costar una línea. Solo gana si el pedido está
       entre los COMPATIBLES: el fijado jamás es un bypass de necesita/acepta
       («la metáfora no puede mentir»); un fijado imposible cae al sorteo de
       siempre. En examen no aplica (el guardia de arriba corta antes:
       seleccionarExamen manda). */
    var pedido = tarjeta && tarjeta.reto && tarjeta.reto.juego;
    if (pedido && lista.indexOf(pedido) !== -1 && PORID[pedido]) {
      var fijo = PORID[pedido];
      ctx.ultimo = fijo.id;
      if (ctx.sorteos) ctx.sorteos[iTarjeta] = fijo;
      track("reto_sorteo", item, { tarjeta: iTarjeta, juego: fijo.id, compatibles: lista, fallback: false, fijado: true });
      return fijo;
    }

    var urna = lista.slice();
    /* Anti-repetición: no repetir el último juego dentro de la misma misión…
       si hay alternativa. Con un solo compatible se repite sin drama. */
    if (urna.length > 1 && ctx.ultimo) {
      var p = urna.indexOf(ctx.ultimo);
      if (p !== -1) urna.splice(p, 1);
    }

    var elegido = PORID[urna[elegirIndice(rngDe(content, ctx), urna.length)]];
    if (!elegido) {
      track("reto_sorteo", item, { tarjeta: iTarjeta, juego: null, compatibles: lista, fallback: true });
      return null;
    }
    ctx.ultimo = elegido.id;
    /* `sorteos` lo crea start() en mission.js; aquí NO se crea perezosamente
       (si faltara, la escritura lanzaría y el try/catch del llamante dejaría el
       sistema inerte con síntoma silencioso). */
    if (ctx.sorteos) ctx.sorteos[iTarjeta] = elegido;
    track("reto_sorteo", item, { tarjeta: iTarjeta, juego: elegido.id, compatibles: lista, fallback: false });
    return elegido;
  }

  /* ========================================================== MODO EXAMEN ==== */

  function admite(juego, ronda) {
    /* `rondaMax` es un tope duro de ficha (hoy solo el dominó, que nunca puede
       caer en la tercera ronda por duración). */
    if (!juego || !esNumero(juego.rondaMax)) return true;
    return ronda <= juego.rondaMax;
  }

  function intercambiar(as, a, b) { var t = as[a]; as[a] = as[b]; as[b] = t; }

  function indicePorId(as, id) {
    for (var i = 0; i < as.length; i++) { if (as[i].juego && as[i].juego.id === id) return i; }
    return -1;
  }

  /* Paso «3 bis» de 0.9.1: una permutación PURA y determinista del array de
     asignaciones. No cambia qué tarjetas ni qué juegos entran —solo el orden—,
     así que superados/3, el umbral del 75 % y completeExam quedan intactos. */
  function preferirRondas(as) {
    var fijas = {}, i, q, j;

    /* (1) Topes duros primero: es la regla más alta y ninguna posterior puede
       romperla. */
    for (i = as.length - 1; i >= 0; i--) {
      j = as[i].juego;
      if (admite(j, i + 1)) continue;
      for (q = Math.min(as.length, j.rondaMax) - 1; q >= 0; q--) {
        if (fijas[q]) continue;
        if (!admite(as[q].juego, i + 1)) continue;   /* el desplazado tampoco puede violar su tope */
        intercambiar(as, i, q);
        fijas[q] = true;
        break;
      }
    }

    /* (2) La campana cierra la ceremonia: siempre en la última ronda. */
    var c = indicePorId(as, "campana");
    var ultima = as.length - 1;
    if (c !== -1 && c !== ultima && !fijas[c] && !fijas[ultima] && admite(as[ultima].juego, c + 1)) {
      intercambiar(as, c, ultima);
      c = ultima;
    }
    if (c !== -1) fijas[c] = true;

    /* (3) El resto de preferencias, solo si la posición sigue libre de
       conflicto con (1) y (2). Quien ya ocupa su ronda preferida se queda: en
       empate gana el que estaba más cerca de su preferencia. */
    for (i = 0; i < as.length; i++) {
      j = as[i].juego;
      if (!j || j.id === "campana" || !esNumero(j.ronda)) continue;
      var d = j.ronda - 1;
      if (d < 0 || d >= as.length || d === i || fijas[i] || fijas[d]) continue;
      var otro = as[d].juego;
      if (otro && esNumero(otro.ronda) && otro.ronda === j.ronda) continue;
      if (!admite(otro, i + 1) || !admite(j, d + 1)) continue;
      intercambiar(as, i, d);
      fijas[d] = true;
    }
    return as;
  }

  /* Selección de examen (0.9.1). Devuelve el MAZO que debe jugarse; si el modo
     no se activa, devuelve el mazo recibido sin tocar nada, de modo que
     mission.js pueda llamar siempre y sin condicionales.

     El llamante DEBE reasignar `n` y `quizTotal` con el mazo devuelto: son
     variables de closure fijadas una sola vez y, sin reasignarlas, un 3/3
     perfecto se dividiría por el número de preguntas del mazo entero y
     suspendería. */
  function seleccionarExamen(cards, content, ctx) {
    cards = cards || [];
    ctx = ctx || {};
    if (!content || content.kind !== "exam") return cards;
    /* «≥3 juegos registrados»: con menos, el examen entero corre como hoy. */
    if (JUEGOS.length < RONDAS) return cards;

    var i, p, idx, lista, quiz = [];
    for (i = 0; i < cards.length; i++) { if (cards[i] && cards[i].type === "quiz") quiz.push(i); }
    if (!quiz.length) return cards;

    /* La semilla se rearma en cada preparación: recargar la página a mitad del
       examen reproduce el MISMO sorteo, y solo el botón de reintento (que sube
       ctx.intento) lo cambia. */
    delete FLUJOS[claveFlujo(content, ctx)];
    var rng = rngDe(content, ctx);
    var orden = barajar(quiz.slice(), rng);
    var cupo = Math.min(RONDAS, orden.length);

    var asignaciones = [], usados = {}, tomadas = {};
    /* Asignación voraz sobre el orden barajado. Pasada 0: juegos DISTINTOS.
       Pasada 1: se relaja lo de distintos, como manda 0.9.1. */
    for (var pasada = 0; pasada < 2 && asignaciones.length < cupo; pasada++) {
      for (p = 0; p < orden.length && asignaciones.length < cupo; p++) {
        idx = orden[p];
        if (tomadas[idx]) continue;
        lista = compatibles(cards[idx], content);
        if (pasada === 0) {
          var libres = [];
          for (var f = 0; f < lista.length; f++) { if (!usados[lista[f]]) libres.push(lista[f]); }
          lista = libres;
        }
        if (!lista.length) continue;
        var jid = lista[elegirIndice(rng, lista.length)];
        asignaciones.push({ idx: idx, juego: PORID[jid] || null });
        usados[jid] = true;
        tomadas[idx] = true;
      }
    }
    /* Ni una asignación válida: el examen entero corre como hoy (fallback
       total, 0.9). */
    if (!asignaciones.length) return cards;

    /* Si faltan rondas, se completan con preguntas SIN juego: corren como quiz
       clásico dentro del examen, pero el mazo conserva su número de rondas. */
    for (p = 0; p < orden.length && asignaciones.length < cupo; p++) {
      idx = orden[p];
      if (tomadas[idx]) continue;
      asignaciones.push({ idx: idx, juego: null });
      tomadas[idx] = true;
    }

    preferirRondas(asignaciones);

    /* Mazo nuevo: las tarjetas que no son quiz se conservan donde estaban (el
       texto de apertura y el de cierre siguen abriendo y cerrando) y los huecos
       de pregunta se rellenan en el orden de rondas ya decidido. Las preguntas
       no seleccionadas desaparecen de esta pasada. */
    var nuevas = [], posiciones = [], slot = 0;
    for (i = 0; i < cards.length; i++) {
      if (!cards[i] || cards[i].type !== "quiz") { nuevas.push(cards[i]); continue; }
      if (slot >= asignaciones.length) continue;
      nuevas.push(cards[asignaciones[slot].idx]);
      posiciones.push(nuevas.length - 1);
      slot++;
    }

    /* El sorteo del examen se hace AQUÍ, una vez, y se deja cacheado por
       índice: `sortear()` no volverá a tirar los dados en estas tarjetas.
       `rondas` es el mapa que alimenta `montaje.ronda` (la campana lo consulta
       para su cierre ceremonial). Ambos se rearman enteros porque esta función
       corre antes del primer renderCard, también en el reintento. */
    ctx.sorteos = {};
    ctx.rondas = {};
    for (i = 0; i < asignaciones.length; i++) {
      var pos = posiciones[i];
      if (pos === undefined) continue;
      ctx.rondas[pos] = i + 1;
      if (asignaciones[i].juego) {
        ctx.sorteos[pos] = asignaciones[i].juego;
        ctx.ultimo = asignaciones[i].juego.id;
        track("reto_sorteo", content.id, {
          tarjeta: pos, juego: asignaciones[i].juego.id,
          compatibles: compatibles(cards[asignaciones[i].idx], content), fallback: false,
        });
      } else {
        track("reto_sorteo", content.id, { tarjeta: pos, juego: null, compatibles: [], fallback: true });
      }
    }
    return nuevas;
  }

  /* ============================ ESTADO POR TARJETA (sobrevive al cierre) ===== */

  /* Cerrar el modal a mitad y reabrir NO devuelve la oportunidad de «limpio»:
     los intentos consumidos viven fuera del modal. La clave lleva el intento de
     examen, así que el botón de reintento estrena estado sin borrar nada. */
  var ESTADOS = {};

  function estadoDe(content, intento, iTarjeta) {
    var clave = String(content && content.id) + "#" + intento + "#" + iTarjeta;
    if (!ESTADOS[clave]) ESTADOS[clave] = { fallos: 0 };
    return ESTADOS[clave];
  }

  /* ============================================== LÁMINAS DE ESTADO (SPRITES) = */

  /* Todo objeto de juego es una ilustración (§0.12, regla del titular): cuando la
     acción cambia su silueta o su materia —entera → rota, cerrada → abierta— se
     intercambia la LÁMINA, no se dibuja otra cosa. Estas dos funciones son el
     único camino de ese intercambio y viajan en el `montaje`, nunca en
     window.MFRetos: son de la partida abierta, no globales.

     Veredicto de existencia POR RUTA, no por pieza ni por partida: la tabla es de
     módulo para que la misma lámina se pida UNA vez por página y el resultado se
     comparta entre piezas, partidas y aperturas del modal. Es el PRUEBAS/conLamina
     de tameshiwari.js:126-153 subido a infraestructura, para que no queden dos
     mecanismos de precarga compitiendo. */
  var LAMINAS = {};

  function veredicto(p, ok) {
    if (p.hecho) return;
    p.hecho = true;
    p.ok = ok;
    var cola = p.cola;
    p.cola = [];
    /* Un avisado que revienta no puede dejar a los demás sin veredicto: la
       promesa de precargar() quedaría pendiente y el juego, esperando para
       siempre a montar su escena. */
    for (var i = 0; i < cola.length; i++) { try { cola[i](ok); } catch (e) { /* nada */ } }
  }

  function probar(ruta, cb) {
    var p = LAMINAS[ruta];
    if (p && p.hecho) { cb(p.ok); return; }
    if (p) { p.cola.push(cb); return; }
    /* El aviso entra en la cola ANTES de asignar el src, y el src va el último de
       todo: si algún día una carga resolviera dentro de la propia asignación, un
       aviso apuntado después se quedaría sin llamar y la promesa de precargar()
       colgaría para siempre. Misma cautela que los manejadores antes del src de
       tameshiwari.js:171. */
    p = LAMINAS[ruta] = { hecho: false, ok: false, cola: [cb] };
    var img = new Image();
    img.onload = function () {
      /* Un 404 servido como página HTML puede «cargar» con 0×0: sin píxeles no
         hay lámina, y darla por buena dejaría un hueco donde va la pieza. */
      veredicto(p, !!(img.naturalWidth && img.naturalHeight));
    };
    img.onerror = function () { veredicto(p, false); };
    img.src = ruta;
  }

  /* montaje.precargar(rutas) -> Promise. Las rutas llegan YA resueltas con el
     prefijo del build (patrón arbol.js:12, `MF_CONFIG.assets`): aquí no se añade
     ningún prefijo, porque un src relativo escrito desde JS se resolvería contra
     la URL de la página y las misiones cuelgan de cuatro niveles de carpeta.
     Resuelve SIEMPRE, aunque alguna ruta falle, con el mapa { ruta: existe }: con
     él la pieza monta su <img> solo de las láminas que existen (§0.12 punto 8) y
     un fallo de red degrada el dibujo, jamás la partida.
     OBLIGATORIO al montar, antes del primer intercambio: sin él, el primer cambio
     de sprite pide el archivo justo en el frame del impacto —el único que el
     alumno mira— y la pieza parpadea en blanco. */
  function probarLaminas(rutas) {
    var lista = [], i, r;
    if (typeof rutas === "string") { if (rutas) lista.push(rutas); }
    else if (rutas && typeof rutas.length === "number") {
      for (i = 0; i < rutas.length; i++) { r = rutas[i]; if (typeof r === "string" && r) lista.push(r); }
    }
    return new Promise(function (ok) {
      var mapa = {}, pendientes = lista.length;
      if (!pendientes) { ok(mapa); return; }
      for (var j = 0; j < lista.length; j++) {
        (function (ruta) {
          probar(ruta, function (existe) {
            mapa[ruta] = existe;
            pendientes--;
            if (!pendientes) ok(mapa);
          });
        })(lista[j]);
      }
    });
  }

  /* La ruta de un estado la escribe el juego al montar, en el atributo
     `data-lamina-<estado>` del lienzo. Se consulta también la forma camelCase del
     dataset porque los dos caminos NO guardan igual un estado de dos palabras
     (`dataset.laminaRotaTriple` escribe `data-lamina-rota-triple`), y una sola
     lectura convertiría el intercambio en un no-op silencioso. */
  function rutaDeEstado(lienzo, estado) {
    var v = lienzo.getAttribute ? lienzo.getAttribute("data-lamina-" + estado) : null;
    if (v) return v;
    var ds = lienzo.dataset;
    if (!ds) return "";
    v = ds["lamina" + estado.charAt(0).toUpperCase() + estado.slice(1)];
    return typeof v === "string" ? v : "";
  }

  /* montaje.sprite(lienzo, estado) -> bool. Cambia el src del
     <img class="reto-pieza"> hijo de `lienzo` por la lámina del estado pedido.
     NO toca `transform` ni `translate`: el sitio y el viaje son de la trayectoria
     (§0.12 punto 4), y escribirlos aquí borraría el arrastre a mitad de partida.
     Si el estado no está declarado, o su ruta salió AUSENTE en precargar(), no
     hace nada, no lanza y devuelve false: la pieza se queda con la lámina que
     tenía, que siempre es mejor que un hueco. */
  function cambiarSprite(lienzo, estado) {
    if (!lienzo || !estado) return false;
    estado = String(estado);
    var ruta = rutaDeEstado(lienzo, estado);
    if (!ruta) return false;
    /* La prueba manda: solo se salta a una ruta que precargar() dio por buena. Sin
       este filtro, un estado sin lámina generada dejaría la pieza en blanco justo
       en el frame del golpe. */
    var p = LAMINAS[ruta];
    if (!p || !p.hecho || !p.ok) return false;
    var img = lienzo.querySelector(".reto-pieza");
    if (!img) return false;
    /* Se compara el ATRIBUTO, no `img.src`: la propiedad devuelve la URL absoluta
       ya resuelta y nunca coincidiría con la ruta relativa del dataset, así que
       cada llamada reasignaría el mismo archivo. El `onerror` del <img> no se
       toca: es el del juego y sigue siendo la última red, porque entre la prueba y
       este intercambio la lámina puede haberse caído de la caché y solo esa vuelta
       atrás devuelve la silueta de reserva. */
    if (img.getAttribute("src") !== ruta) img.src = ruta;
    /* El estado se escribe SIEMPRE, aunque el src ya fuera ese, para que el CSS del
       juego pueda colgar de [data-estado="rota"] sin que el JS toque clases. */
    lienzo.setAttribute("data-estado", estado);
    return true;
  }

  /* ================================ ETIQUETAS DE OPCIÓN: UNA SOLA LÍNEA ====== */

  /* Encargo del titular (2026-08-28): «siempre preferir una sola línea, antes de
     romper que el texto se reduzca para encajar en contenedor. aplica en todas
     las labels de opciones de todos los juegos».

     ESTO NO PUEDE VIVIR EN LA HOJA DE ESTILOS: el CSS no sabe medir texto. Lo que
     sí vive allí —el recuadro transparente, el halo blanco y el `white-space` de
     `.reto-1linea`— está en UN solo bloque al final de game.css; aquí está la
     única decisión que necesita medir, y también en un solo sitio. Ningún juego
     repite esta lógica: la infraestructura repasa el cuerpo del modal entero.

     LA JERARQUÍA, tal cual la dictó el titular, y por ese orden:
       0. CRECER el contenedor de la opción hasta donde llegue su hueco libre
          (encargo del 2026-08-31: «que se ajusten dentro de lo posible, ya sea
          más ancho o reducir texto»). Vive más abajo, en `crecerGrupo`, porque
          es una decisión de GRUPO y no de etiqueta; hoy solo lo declara la
          campana y los demás juegos entran en el 1 como siempre.
       1. Una línea al cuerpo que manda la hoja, si cabe.
       2. Si no cabe, se BAJA el cuerpo por pasos de medio píxel hasta que quepa.
       3. Si ni al suelo cabe, ENTONCES se parte en dos líneas — al cuerpo
          original, que es como se lee mejor. «Antes de romper que el texto se
          reduzca» no es «no rompas nunca»: cortar una opción a la mitad o
          dejarla ilegible es peor que una segunda línea, que además es
          exactamente lo que estos ocho juegos hacían hasta hoy (o sea: el peor
          caso de este helper es el comportamiento de ayer, nunca algo peor).

     EL CENSO. Las diez etiquetas de opción de los ocho juegos. Está escrito
     igual, y con las mismas diez clases, en el bloque común de game.css: si
     alguna vez se añade una, hay que tocar los dos sitios o ese juego se queda
     hablando distinto. */
  var ETIQUETAS = ".reto-placa, .tw-placa, .kintsugi-placa," +
    " .reto-herr-placa, .reto-andamio-puntal__placa, .kata-placa," +
    " .domino-placa, .domino-ficha__texto";

  /* DOS SUELOS, y el porqué de cada uno (rehecho 2026-08-31 tras jugar los ocho):
     · SUELO (15 px) es el de legibilidad de la casa para etiquetas sobre
       ilustración (está escrito y medido en game.css, en la nota de
       `.kintsugi-placa`). Gobierna a las etiquetas que nacen POR ENCIMA de él
       —tameshiwari y campana, a 18/20 px— y ahí no se baja.
     · SUELO_CHICO (10,5 px) es el de EMERGENCIA para las etiquetas que ya nacen
       en 15 px o por debajo con su propia calibración medida (kintsugi 15,04 ·
       dominó 11,2-14,4 · kata 12,5 · herramienta 11,5-12,8 · andamio 13). Con un
       único suelo de 15, su margen de reducción era CERO y el paso 2 de la
       jerarquía no existía para ellas: se partían en dos líneas opciones que
       cabían enteras bajando medio punto (medido en kata a 768: «Pedir perdón
       igual» cabía a 12,1 y se partía igual). Para esos juegos el 15 nunca fue
       su calibración —nacieron por debajo—, así que aplicárselo como suelo era
       aplicarles el suelo de otro. El 10,5 no es capricho: es el cuerpo más
       pequeño que la casa ya enseña como opción legible (los medallones de pasa,
       10,4 px de rótulo en versalitas), y esas cinco etiquetas viven sobre el
       papel crema del modal, no sobre la ilustración, que es de lo que protegía
       el 15.
     Subirles el cuerpo a 15 para «tener sitio donde encoger» sigue descartado:
     les rompería la escena que ya tienen cuadrada. */
  var SUELO = 15;
  var SUELO_CHICO = 10.5;
  var PASO = 0.5;

  /* LOS DOS SUELOS VIAJAN CON EL TABLERO (2026-08-31, segunda vuelta).
     A pantalla completa la hoja multiplica TODA la geometría de los ocho juegos
     —y el cuerpo de estos rótulos con ella— por `--reto-tablero` (1 · 1,1 · 1,2 ·
     1,3; game.css, «EL TABLERO CRECE CON EL HUECO»). Si los suelos se quedaran
     en píxeles absolutos, este helper NO decidiría igual que en el móvil, y
     decidiría PEOR justo donde más sitio hay:
       · Cambiarían de rama. `sueloDe` no compara razones, compara con 15 px
         pelados, y el cuerpo que le llega es el YA multiplicado. Con el tablero
         al tope, `.kata-placa` pasa de 12,48 a 16,22 y `.kintsugi-placa` de
         15,04 a 19,55: las dos cruzan los 15 y PIERDEN el suelo de emergencia,
         que es precisamente el suyo (nacieron por debajo del 15).
       · Y con él se hundiría el margen de reducción: kata caía del 15,9 %
         (10,5/12,48) al 7,5 % (15/16,22). Como la geometría creció por el mismo
         número, la reducción que el texto PIDE es la misma razón de siempre, así
         que ese margen perdido se traduce en etiquetas que en el móvil caben en
         una línea bajando medio punto y en la tablet se parten en dos. Justo lo
         contrario del encargo del titular («siempre preferir una sola línea»).
     Multiplicando los dos suelos por el mismo factor, las tres razones —lo que
     pide el texto, lo que permite el suelo y el cuerpo de partida— quedan
     INVARIANTES: el helper toma exactamente las mismas decisiones a 375 px que
     en un iPad, solo que dibujadas más grandes. Y no hay riesgo de legibilidad
     en la dirección contraria, porque el factor nunca baja de 1: el cuerpo
     mínimo que se llega a pintar solo puede SUBIR (10,5 → 13,65 al tope). */
  function factorTablero(cs) {
    /* Número puro, sin unidad ni `calc()`: `parseFloat` lo resuelve. Vive en
       `:root` con valor 1, así que siempre hay algo que leer; la horquilla es la
       red por si alguien escribe una barbaridad en la hoja. */
    var f = parseFloat(cs.getPropertyValue("--reto-tablero"));
    return (isFinite(f) && f >= 1 && f <= 3) ? f : 1;
  }

  /* Qué suelo le toca a cada etiqueta: si el de la casa le deja al menos un paso
     de margen, es el suyo; si no —o sea, si la etiqueta ya nace en el suelo o por
     debajo—, aquel suelo no era su calibración y se le da el de emergencia,
     nunca por encima de su propio cuerpo (una etiqueta jamás se AGRANDA).
     `factor` es el del tablero (ver arriba): los dos suelos son medidas de
     DISEÑO, así que se comparan con el cuerpo en la misma escala en que este
     llega. */
  function sueloDe(base, factor) {
    var f = factor > 0 ? factor : 1;
    return base - SUELO * f >= PASO ? SUELO * f : Math.min(base, SUELO_CHICO * f);
  }

  /* Ancho REAL del texto de una etiqueta puesta en una sola línea. Se mide con un
     Range sobre su contenido y NO con `scrollWidth`, a propósito: media docena de
     las etiquetas del censo son cajas `flex` o `grid` con el contenido CENTRADO,
     y `scrollWidth` solo contabiliza el desbordamiento por la derecha — con el
     texto centrado se pierde la mitad y una etiqueta que se sale 20 px parecería
     salirse 10. El Range devuelve la caja del texto sea cual sea el contenedor. */
  function anchoTexto(nodo, escala) {
    try {
      var r = document.createRange();
      r.selectNodeContents(nodo);
      var w = r.getBoundingClientRect().width;
      return escala > 0 ? w / escala : w;
    } catch (e) { return 0; }
  }

  /* Cuánto encoge la página lo que se dibuja, comparado con lo que mide el
     diseño. NO es una paranoia: `getBoundingClientRect()` —lo único con lo que se
     puede medir un texto— devuelve píxeles YA ESCALADOS, mientras que
     `clientWidth` y `offsetWidth` devuelven los del diseño. Mientras valen lo
     mismo da igual; en cuanto un `zoom` de la casa, un pinch del móvil o el
     escalado de una vista previa se meten por medio, comparar el texto (escalado)
     con su hueco (sin escalar) da un 20 % de error y todo «cabe». Medido: con la
     vista previa a 768 px encogida al 80 %, «Algo nuevo» se declaraba de una
     línea a 18 px en un hueco donde no cabía.
     Se saca del propio nodo, que es donde importa, y solo se aplica si la
     diferencia es de verdad (`offsetWidth` es entero y redondea medio píxel). */
  function escalaDe(nodo) {
    var off = nodo.offsetWidth;
    if (!(off > 20)) return 1;                      /* muy pequeño: el redondeo mandaría */
    var caja = nodo.getBoundingClientRect().width;
    if (!(caja > 0)) return 1;
    var e = caja / off;
    if (!(e > 0.05) || !(e < 20)) return 1;         /* medida absurda: no se toca nada */
    return Math.abs(e - 1) > 0.005 ? e : 1;
  }

  /* El relleno horizontal de la etiqueta, los dos lados sumados. Va aparte
     porque el paso de CRECER lo necesita suelto: el relleno NO escala con la
     lámina —son píxeles fijos— así que para saber cuánto hay que crecer hay que
     sumarlo y restarlo a mano (ver `crecerGrupo`). */
  function padH(cs) {
    return (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
  }

  /* Ancho disponible DENTRO de la etiqueta: `clientWidth` es la caja de relleno
     (ya excluye el borde) y hay que descontarle su propio relleno. */
  function anchoUtil(nodo, cs) {
    return nodo.clientWidth - padH(cs || window.getComputedStyle(nodo));
  }

  /* Rendirse es el paso 3 de la jerarquía: se devuelve el cuerpo que manda la
     hoja —una etiqueta que va a partirse se lee mejor grande que pequeña— y se
     deja envolver.
     Y se envuelve APROVECHANDO TODO EL PRESUPUESTO. Las etiquetas absolutas
     centradas (campana, tameshiwari) se dimensionan solas y, al envolverse, se
     encogen hasta la palabra más larga: «Me siento mal» salía en TRES líneas
     dentro de un talismán donde caben dos de sobra, porque la caja se quedaba en
     75 px de los 120 que tiene permitidos. Si hay que romper, que se rompa lo
     menos posible: se le fija el ancho al presupuesto que su propia hoja ya le
     concedía (su `max-width`), ni un píxel más. Solo se hace en las etiquetas
     fuera de flujo: las que van en la columna ya ocupan su ancho entero, y ahí
     fijar nada sería inventarse espacio que no existe. */
  function rendirse(nodo, limite, suelto, factor) {
    nodo.style.fontSize = "";
    nodo.style.width = "";
    nodo.classList.remove("reto-1linea");
    if (suelto && limite > 0) {
      var cs = window.getComputedStyle(nodo);
      /* la casa es border-box; si no, no se toca */
      if (cs.boxSizing === "border-box") {
        var caja = limite +
          (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0) +
          (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0);
        /* Solo si de verdad se está quedando corta: la etiqueta que ya ocupa su
           presupuesto (el rótulo del dominó, anclado por sus dos lados) no necesita
           que nadie le escriba un ancho en línea. Se compara con `offsetWidth` y no
           con el rect: `caja` está en píxeles de DISEÑO y el rect vendría escalado
           (ver `escalaDe`). */
        if (nodo.offsetWidth < caja - 1) nodo.style.width = caja + "px";
      }
    }
    /* GUARDIA VERTICAL (2026-08-31): partir está permitido, CORTAR no. La única
       etiqueta del censo que recorta es `.kata-placa` (`overflow: hidden` +
       `max-height` calculada para dos líneas), y a 320 px una `corta` de tres
       palabras se iba a TRES líneas y salía con la tercera cortada por la mitad
       («Pedir perdón igual»: 47 px de contenido en 42 de caja, medido) — que es
       exactamente el «cortar una opción a la mitad» que la jerarquía prohíbe.
       Si al envolver el contenido no cabe A LO ALTO, se baja el cuerpo hasta que
       quepa o hasta el suelo de emergencia: aquí media línea perdida es peor que
       letra pequeña. En las etiquetas sin recorte, `scrollHeight` nunca supera a
       `clientHeight` y este bucle no da ni una vuelta. */
    if (nodo.scrollHeight > nodo.clientHeight + 1) {
      var px = parseFloat(window.getComputedStyle(nodo).fontSize);
      if (px > 0) {
        /* El suelo de emergencia también viaja con el tablero (ver `sueloDe`):
           si no, en la tablet esta guardia bajaría el cuerpo mucho más de lo que
           lo baja en el móvil para el MISMO texto en la MISMA caja relativa. */
        var fondo = Math.min(px, SUELO_CHICO * (factor > 0 ? factor : 1));
        while (nodo.scrollHeight > nodo.clientHeight + 1 && px - PASO >= fondo) {
          px = Math.round((px - PASO) * 100) / 100;
          nodo.style.fontSize = px + "px";
        }
      }
    }
  }

  /* Deja la etiqueta en su estado de partida y devuelve TODO lo que hay que
     saber de ella en una sola pasada de medidas. Se extrajo de `encajarUno` el
     2026-08-31 sin cambiar ni un número: el paso nuevo de CRECER necesita
     exactamente las mismas medidas —y sobre todo la misma elección de rama— y
     duplicarlas habría sido duplicar la parte cara de aprender de este helper.
     Devuelve null si la etiqueta no tiene cuerpo medible.
     OJO al efecto lateral, que es a propósito: al salir, la etiqueta se queda
     con `.reto-1linea` puesta y sin tamaño en línea. Quien llama decide después
     si la deja así (cabe), le baja el cuerpo o la manda a `rendirse`. */
  function medirEtiqueta(nodo) {
    /* Paso 0: se devuelve la etiqueta al estado que manda la hoja. Sin borrar el
       tamaño en línea, dos repasos seguidos encogerían dos veces, y girar el
       móvil a horizontal —donde sobra ancho— dejaría la letra pequeña para
       siempre. */
    nodo.style.fontSize = "";
    nodo.style.width = "";
    nodo.classList.remove("reto-1linea");

    var cs = window.getComputedStyle(nodo);
    var base = parseFloat(cs.fontSize);
    if (!(base > 0)) return null;
    var pad = padH(cs);

    /* ---- EL LÍMITE: cuánto ancho tiene DE VERDAD esta etiqueta ----
       No hay una sola forma de medirlo, y las dos maneras obvias fallan en mitad
       del censo. Las dos se comprobaron jugando, y por eso hay dos ramas:

       · ETIQUETA EN FLUJO (kintsugi, herramienta, kata). Se ajustan a su
         contenido con un tope en PORCENTAJE del padre, y ese padre también se
         ajusta al suyo. Con `nowrap` puesto, la etiqueta larga NO desborda:
         ENSANCHA al padre, el porcentaje se recalcula contra un padre ya crecido
         y la medida dice que cabe. Medido en kintsugi: la bandeja se estiró hasta
         174 px de rótulo y empujó la tercera cerámica fuera de la pantalla. Aquí
         hay que medir ANTES de forzar la línea, con la etiqueta envuelta: así su
         caja vale exactamente el ancho DISPONIBLE, que es así como se dimensiona
         una caja `fit-content` cuando el texto no le cabe de una pieza.

       · ETIQUETA FUERA DE FLUJO (las absolutas: campana, tameshiwari, andamio y
         las dos del dominó). Aquí es al revés y medir envuelta MIENTE POR ABAJO:
         una caja absoluta anclada en `left: 50%` solo tiene «disponible» media
         caja del padre, así que envuelta se encoge hasta la palabra más larga
         —92 px medidos en campana— cuando su presupuesto real es su `max-width`,
         que son 120. Y aquí forzar la línea es INOFENSIVO: lo que está fuera de
         flujo no ensancha a nadie. Se mide con `nowrap` ya puesto, y el navegador
         devuelve el tope de verdad (el `max-width`, o el ancho entre sus dos
         anclajes).

       En los dos casos el número se guarda UNA vez y todo el ajuste compara
       contra él: remedirlo mientras se encoge lo movería bajo los pies. */
    var suelto = cs.position === "absolute" || cs.position === "fixed";
    var limite;
    if (suelto) {
      nodo.classList.add("reto-1linea");
      limite = anchoUtil(nodo, cs);
    } else {
      limite = anchoUtil(nodo, cs);
      nodo.classList.add("reto-1linea");
    }

    var escala = escalaDe(nodo);
    return {
      base: base,                    /* cuerpo que manda la hoja, sin tocar */
      pad: pad,                      /* relleno horizontal: no escala, se suma aparte */
      suelto: suelto,                /* fuera de flujo: `rendirse` le fija el ancho */
      limite: limite,                /* ancho útil de UNA línea, hoy */
      escala: escala,                /* zoom de la página (ver `escalaDe`) */
      factor: factorTablero(cs),     /* crecimiento del tablero: escala los suelos */
      ancho: anchoTexto(nodo, escala) /* lo que ocupa el texto de una pieza */
    };
  }

  function encajarUno(nodo) {
    if (!nodo || nodo.nodeType !== 1) return;
    var m = medirEtiqueta(nodo);
    if (!m) return;
    var base = m.base, limite = m.limite, escala = m.escala, suelto = m.suelto;
    var factor = m.factor;

    /* Sin ancho medible todavía (el modal se está montando, o el juego tiene la
       etiqueta escondida): se deja como estaba y ya la remedirá el observador. */
    if (!(limite > 0)) { rendirse(nodo, 0, false, factor); return; }

    /* La tolerancia de 1 px no es pereza: `clientWidth` es entero y el ancho del
       texto no, así que en la etiqueta que se ajusta a su contenido los dos
       números son el mismo con medio píxel de redondeo entre medias. Sin
       tolerancia, una etiqueta que cabe se leería como que no cabe y se pondría a
       encoger para nada. */
    var ancho = m.ancho;
    if (ancho <= limite + 1) return;                 /* cabe en una línea: no se toca */

    var suelo = sueloDe(base, factor);
    if (base - suelo < PASO) { rendirse(nodo, limite, suelto, factor); return; }   /* sin margen: se parte */

    /* Primer tiro PROPORCIONAL y no a ciegas desde arriba: el ancho de una cadena
       crece casi lineal con el cuerpo, así que `base * limite / ancho` cae al lado
       bueno a la primera. Importa porque cada paso obliga al navegador a
       recalcular el diseño para poder medir otra vez: bajando de uno en uno son
       una decena de recálculos por etiqueta y, por ocho etiquetas, se nota en un
       móvil modesto; así son dos o tres. */
    var px = Math.floor((base * limite / ancho) / PASO) * PASO;
    if (px > base - PASO) px = base - PASO;
    if (px < suelo) px = suelo;
    px = Math.round(px * 100) / 100;
    nodo.style.fontSize = px + "px";
    while (anchoTexto(nodo, escala) > limite + 1) {
      if (px - PASO < suelo) { rendirse(nodo, limite, suelto, factor); return; }
      px = Math.round((px - PASO) * 100) / 100;
      nodo.style.fontSize = px + "px";
    }
  }

  function encajarEn(raiz) {
    if (!raiz || !raiz.querySelectorAll) return;
    var lista = raiz.querySelectorAll(ETIQUETAS);
    for (var i = 0; i < lista.length; i++) encajarUno(lista[i]);
  }

  /* ============ AUTOAJUSTE: PRIMERO CRECE EL HUECO, DESPUÉS ENCOGE LA LETRA ===

     Encargo del titular (2026-08-31), mirando la campana con tres tablillas
     partidas en dos líneas y sitio libre a los lados: «los contenedores de
     opciones se ajusten dentro de lo posible, ya sea más ancho o reducir texto,
     para procurar siempre opciones de una sola línea».

     LA JERARQUÍA COMPLETA, y este bloque es el escalón que faltaba:
       1. CRECER el contenedor hasta donde llegue el hueco libre de verdad.  ← nuevo
       2. ENCOGER el texto por pasos de medio píxel, con los suelos de arriba.
       3. RENDIRSE a dos líneas si con 1 y 2 no cabe.
     Hasta hoy se hacían el 2 y el 3, nunca el 1: por eso una tablilla se partía
     rodeada de espacio vacío.

     POR QUÉ CRECER NO ES «PONER UN ANCHO». La tablita de estos juegos NO es una
     caja de CSS: es una LÁMINA con proporción fija (la de la campana es la tabla
     de F1, 2.494). Ensancharla sola estiraría el dibujo, que es lo que la regla
     de arte de la casa prohíbe. Aquí CRECER es ESCALAR la lámina entera —más
     ancha Y más alta— subiendo la ÚNICA variable de la que cuelga su tamaño. Por
     eso lo que se toca es una custom property y jamás un `width`.

     LOS CINCO PELIGROS, y cómo los para cada línea de `crecerGrupo`:
       · PISAR AL VECINO. Una opción absoluta anclada en `left: 50%` crece hacia
         los DOS lados. El hueco no se supone: sale de medir el contenedor del
         grupo (que en un juego bien declarado ES el hueco) menos el aire que el
         juego reserva. Una opción encima de otra es peor que una de dos líneas.
       · CRECER TAMBIÉN ES CRECER A LO ALTO. Proporción fija: puede sobrar ancho
         y no sobrar alto (la campana, con tres apiladas, es justo ese caso).
         Se calculan los dos factores y MANDA EL MENOR.
       · QUE NO CREZCAN DESIGUALES. El factor es UNO por grupo —la escala que
         pide la etiqueta más larga de la ronda— y se escribe en el contenedor,
         no en cada opción: tres tablillas de tamaños distintos en la misma
         ronda se leen como un error de montaje.
       · LOS JUEGOS MIDEN CON RECTS. Varios calculan trayectorias y dianas con
         `getBoundingClientRect`. Esto corre dentro de `repasar()`, que la
         carcasa llama SÍNCRONA justo después de `juego.jugar()` y con rAF en el
         resize, mientras los juegos miden en su propio rAF o con rebote de
         150 ms: el tamaño ya está decidido cuando ellos miden. (En la campana
         además da igual: crecer solo toca la columna de talismanes, y la torre,
         la campana y el disco —lo que ella mide— no cambian ni un píxel.)
       · IDEMPOTENCIA. Lo primero que hace `crecerGrupo` es BORRAR la escala
         anterior y medir desde la base. Así dos repasos seguidos no crecen dos
         veces y girar a una pantalla estrecha devuelve la tablilla a su tamaño.

     EL CONTRATO ES 100 % CSS Y NINGÚN JUEGO CAMBIA UNA LÍNEA DE JS. La geometría
     de estos ocho juegos vive en la hoja, así que el hueco se declara donde vive
     la geometría; aquí solo está lo que hay que MEDIR, que es lo que el CSS no
     puede hacer. Un juego se apunta declarando, en el contenedor de su grupo de
     opciones (las propiedades personalizadas HEREDAN, así que se leen desde la
     propia etiqueta de una sola pasada):
       --reto-crece        nombre de la variable que da tamaño a la opción y que
                           hay que escalar. Obligatoria; sin ella no pasa nada,
                           que es el estado de los siete juegos restantes.
       --reto-crece-caja   selector del contenedor del grupo, para `closest()`.
                           Es donde se escribe la variable y de cuyo `clientWidth`
                           sale el ancho libre. Obligatoria.
       --reto-crece-alto   fracción del alto del padre posicionado que el grupo
                           puede ocupar (por defecto 1). Es la vía para descontar
                           lo que no se puede tapar.
       --reto-crece-aire   píxeles reservados a cada lado (por defecto 8).
       --reto-crece-tope   factor máximo (por defecto CRECE_TOPE).

     EL TOPE, y por qué existe: el cuerpo de letra NO escala con la lámina —lo
     fija la hoja y este helper solo lo baja—, así que pasado cierto punto una
     tablita rotulada se convierte en un cartelón con la letra pequeña dentro.
     1.5 sale de la propia hoja: la campana ya declara tablillas de 72 px (dos
     opciones) a 44 px (cinco) con el MISMO rótulo de 18 px, o sea que la casa ya
     dibuja una horquilla de ×1.64 entre la más grande y la más pequeña; ×1.5 se
     queda dentro de lo que ese mismo diseño considera una tablilla. Y casi nunca
     llega a morder, porque el factor que se aplica es el que el texto PIDE:
     crecer es a demanda, no «ocupar todo lo que haya». */

  var CRECE_TOPE = 1.5;      /* techo de escala (ver arriba) */
  var CRECE_AIRE = 8;        /* px reservados a cada lado si el juego no dice otra cosa */
  var CRECE_MINIMO = 1.01;   /* por debajo de un 1 % no merece un reflow */

  /* Las propiedades personalizadas vuelven como texto crudo, con el espacio de
     después de los dos puntos y —en un selector— con sus comillas. */
  function textoVar(cs, prop) {
    var v = cs.getPropertyValue(prop);
    if (!v) return "";
    return String(v).replace(/^[\s"']+/, "").replace(/[\s"']+$/, "");
  }
  function numeroVar(cs, prop, porDefecto) {
    var v = parseFloat(cs.getPropertyValue(prop));
    return (isFinite(v) && v >= 0) ? v : porDefecto;
  }

  function crecerGrupo(grupo, nombre, fracAlto, aire, tope) {
    /* Paso 0, y es lo que hace el ajuste REVERSIBLE. Todo lo que viene después
       mide el grupo en su tamaño de hoja, nunca en el que le dejó el repaso
       anterior. */
    grupo.style.removeProperty(nombre);
    var base = parseFloat(window.getComputedStyle(grupo).getPropertyValue(nombre));
    if (!(base > 0)) return;

    /* Las opciones son los hijos ELEMENTO del grupo. No se buscan por clase a
       propósito: cada juego llama a la suya y el contrato tiene que valer para
       el noveno juego que se escriba. */
    var opciones = [], hijos = grupo.children, i;
    for (i = 0; i < hijos.length; i++) {
      if (hijos[i].nodeType === 1) opciones.push(hijos[i]);
    }
    if (!opciones.length) return;

    /* LO QUE SE USA Y LO QUE HAY. Todo en píxeles de DISEÑO (`offset*` y
       `client*`) y ni un rect: con el `zoom: 0.8` de escritorio los rects vuelven
       ya encogidos y mezclar las dos unidades da un 20 % de error (la lección
       está escrita entera en `escalaDe`, y también en campana.js). */
    var usadoW = 0;
    for (i = 0; i < opciones.length; i++) {
      if (opciones[i].offsetWidth > usadoW) usadoW = opciones[i].offsetWidth;
    }
    var usadoH = grupo.offsetHeight;
    var libreW = grupo.clientWidth - 2 * aire;
    /* El alto se mide contra el bloque que de verdad contiene al grupo. Para un
       grupo absoluto ese es su `offsetParent`, que es exactamente la escena. */
    var padre = grupo.offsetParent || grupo.parentNode;
    var libreH = (padre && padre.nodeType === 1 ? padre.clientHeight : 0) * fracAlto - 2 * aire;
    if (!(usadoW > 0) || !(usadoH > 0) || !(libreW > 0) || !(libreH > 0)) return;

    /* MANDA EL MENOR de los dos ejes: la lámina escala entera y no se puede
       ensanchar sin crecer también a lo alto. */
    var techo = Math.min(libreW / usadoW, libreH / usadoH, tope);
    if (!(techo > CRECE_MINIMO)) return;   /* no hay hueco: aquí no se fuerza nada */

    /* CUÁNTO PIDE EL TEXTO. Una sola escala para todo el grupo: la que necesite
       la etiqueta más larga de la ronda.
       La cuenta es lineal y lo es por construcción: el tope de la etiqueta se
       declara como una fracción del ancho de su opción (`max-width: min(86%, …)`
       en `.reto-placa`), así que crecer ×f multiplica ese tope por f… pero NO el
       relleno, que son píxeles fijos. De ahí que se comparen CAJAS COMPLETAS
       (texto + relleno contra ancho actual + relleno) y no anchos útiles.
       Si algún juego futuro no fuese lineal, el error solo puede sobrar o faltar
       tamaño: sobrar lo corta el techo, y faltar lo remata el paso 2, que corre
       justo después. */
    var pide = 1, etiquetas = grupo.querySelectorAll(ETIQUETAS);
    for (i = 0; i < etiquetas.length; i++) {
      var m = medirEtiqueta(etiquetas[i]);
      if (!m || !(m.limite > 0)) continue;
      var caja = m.limite + m.pad;
      var quiere = (m.ancho + m.pad) / caja;
      if (quiere > pide) pide = quiere;
    }
    if (!(pide > CRECE_MINIMO)) return;    /* todo cabe ya: crecer sería engordar por engordar */

    /* Se redondea a medio píxel, y CADA UNO PARA SU LADO, que no es manía:
       la demanda se redondea hacia ARRIBA porque quedarse medio píxel corto
       manda a la etiqueta a bajar medio punto de cuerpo para nada (medido con la
       geometría de la campana: pedía 63,95 px y a 63,5 el rótulo se quedaba a
       0,8 px de caber); y el techo hacia ABAJO, porque es un límite y pasarse es
       pisar al vecino. El techo gana siempre. */
    var valor = Math.ceil(base * Math.min(pide, techo) * 2) / 2;
    var maximo = Math.floor(base * techo * 2) / 2;
    if (valor > maximo) valor = maximo;
    if (!(valor > base + PASO)) return;    /* menos de medio píxel: no vale el reflow */
    grupo.style.setProperty(nombre, valor + "px");
  }

  /* Recorre las etiquetas del modal, agrupa por contenedor declarado y crece cada
     grupo UNA vez. Se apoya en el mismo censo `ETIQUETAS` que el paso 2 para que
     no puedan separarse: un juego que se apunte al autoajuste ya está en el censo
     por narices. */
  function crecerEn(raiz) {
    if (!raiz || !raiz.querySelectorAll) return;
    var lista = raiz.querySelectorAll(ETIQUETAS);
    if (!lista.length) return;
    var hechos = [];
    for (var i = 0; i < lista.length; i++) {
      var cs = window.getComputedStyle(lista[i]);
      var nombre = textoVar(cs, "--reto-crece");
      /* Sin declaración no se toca nada: es el estado por defecto y el de los
         juegos cuya geometría no deja hueco. */
      if (nombre.slice(0, 2) !== "--") continue;
      var sel = textoVar(cs, "--reto-crece-caja");
      if (!sel) continue;
      var grupo = null;
      /* Un selector mal escrito en la hoja no puede tumbar una partida. */
      try { grupo = lista[i].closest(sel); } catch (e) { grupo = null; }
      if (!grupo || hechos.indexOf(grupo) >= 0) continue;
      hechos.push(grupo);
      crecerGrupo(grupo, nombre,
        numeroVar(cs, "--reto-crece-alto", 1),
        numeroVar(cs, "--reto-crece-aire", CRECE_AIRE),
        numeroVar(cs, "--reto-crece-tope", CRECE_TOPE));
    }
  }

  /* El repaso completo, en el único orden que tiene sentido: primero se decide
     de qué tamaño es el hueco y solo después se mide si el texto cabe en él. */
  function ajustarEn(raiz) {
    crecerEn(raiz);
    encajarEn(raiz);
  }

  /* ================================================================= MODAL === */

  var FOCABLES = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function enfocables(raiz) {
    var todos = raiz.querySelectorAll(FOCABLES), lista = [];
    for (var i = 0; i < todos.length; i++) {
      /* offsetParent nulo = oculto; se lee solo al pulsar Tab, nunca en un
         bucle de puntero. */
      if (todos[i].offsetParent !== null || todos[i] === document.activeElement) lista.push(todos[i]);
    }
    return lista;
  }

  function atraparFoco(e, raiz) {
    var lista = enfocables(raiz);
    if (!lista.length) { e.preventDefault(); try { raiz.focus(); } catch (err) { /* nada */ } return; }
    var primero = lista[0], ultimo = lista[lista.length - 1], act = document.activeElement;
    var dentro = raiz.contains(act);
    if (e.shiftKey) {
      if (!dentro || act === primero || act === raiz) { e.preventDefault(); ultimo.focus(); }
    } else if (!dentro || act === ultimo) {
      e.preventDefault(); primero.focus();
    }
  }

  var abierto = null;

  function cerrar(desdeHistorial) {
    if (!abierto) return;                 /* idempotente: las dos capas de teclado nunca cierran dos veces */
    var a = abierto;
    abierto = null;
    var conHistorial = a.historial;
    a.limpiar();                          /* teardown de los juegos (MFDrag, timers) ANTES de tirar el DOM */
    a.caja.remove();
    document.removeEventListener("keydown", a.tecla);
    document.body.classList.remove("has-reto");
    if (a.volverA && a.volverA.focus) { try { a.volverA.focus(); } catch (e) { /* nada */ } }
    a.fin();                              /* si nadie resolvió, la partida fue un abandono */
    /* el «atrás» del móvil cierra el reto, no la página */
    if (conHistorial && !desdeHistorial) { try { history.back(); } catch (e) { /* nada */ } }
  }
  window.addEventListener("popstate", function () { if (abierto) cerrar(true); });

  /* ctx = { content, iTarjeta, intento, ronda, origen, premia }
     Se toleran los alias `data` (content), `i` (iTarjeta) y `volverA` (origen)
     y, si se entrega el propio sorteoCtx, la ronda se lee de `ctx.rondas`.
     `premia` es OPCIONAL: una función sin argumentos que responde cuánto paga de
     verdad una victoria limpia de esta partida (0 = no paga nada). Quien no la
     entregue —la misión— se queda con el bonus de siempre. Ver «EL PREMIO». */
  function abrir(juego, tarjeta, ctx) {
    /* Sin juego no hay reto: se devuelve una promesa ya resuelta como abandono
       para que el llamante no tenga que distinguir este caso del cierre normal. */
    if (!juego || typeof juego.jugar !== "function") {
      return Promise.resolve({ estado: "abandonado", limpio: false, intentos: 0, ms: 0 });
    }
    /* Nunca dos retos abiertos a la vez. Si había uno, su entrada de historial
       se HEREDA en vez de deshacerse: un history.back() aquí llegaría tarde
       —es asíncrono— y su popstate cerraría el reto recién abierto. Una entrada
       por sesión de modal basta para que el «atrás» del móvil cierre el de
       arriba. */
    var heredaHistorial = !!(abierto && abierto.historial);
    cerrar(heredaHistorial);
    /* «un solo audio a la vez»: si el minipodcast de un pergamino seguía
       sonando, se calla al empezar a jugar */
    if (window.MFAudio && MFAudio.parar) MFAudio.parar();

    ctx = ctx || {};
    var content = ctx.content || ctx.data || {};
    var iTarjeta = esNumero(ctx.iTarjeta) ? ctx.iTarjeta : (esNumero(ctx.i) ? ctx.i : -1);
    var examen = content.kind === "exam";
    var intento = (ctx.intento | 0);
    var ronda = null;
    if (examen) {
      if (esNumero(ctx.ronda)) ronda = ctx.ronda;
      else if (ctx.rondas && esNumero(ctx.rondas[iTarjeta])) ronda = ctx.rondas[iTarjeta];
    }

    var estado = estadoDe(content, intento, iTarjeta);
    var t0 = ahora();
    var resuelto = false, resultado = null, entregar = null;
    var nombre = (juego && (juego.nombre || juego.id)) || "";

    /* --------------------------------------------------------- EL PREMIO ----
       Cuánto vale DE VERDAD una victoria limpia de ESTA partida.

       Los ocho juegos cantaban «+5 XP» —texto y vuelo al HUD— con solo mirar
       `!m.examen`, y eso era cierto mientras la única puerta de entrada fuese la
       misión. Ya no: la sala de retos (sala-retos.js) abre las mismas partidas y
       allí la misma victoria paga el 10 % de lo que dio esa misión (2 o 3 XP) o
       CERO si esa pregunta ya se cobró. El juego no puede saberlo solo, así que
       deja de deducirlo y lo PREGUNTA.

       Lo que viaja en `ctx.premia` es una pregunta y no un número porque el
       importe no se conoce hasta que la partida se resuelve: depende de si la
       pregunta ya estaba cobrada (`MF.replayPaid`), y quien responde consulta el
       progreso en el instante mismo en que el juego va a cantar.

       Sin `ctx.premia` el comportamiento es EXACTAMENTE el de hoy —el bonus de
       la misión, 0 en examen—, así que ningún llamante que no se entere de este
       campo queda peor que antes. */
    var preguntarPremio = typeof ctx.premia === "function" ? ctx.premia : null;

    function premia() {
      /* En examen no hay bonus que cantar: el XP lo entrega `completeExam`. Era
         la mitad de la condición que los ocho juegos traían escrita y se queda
         aquí, en un solo sitio, donde ninguno puede olvidarla. */
      if (examen) return 0;
      if (!preguntarPremio) return BONUS_MISION;
      var n;
      /* Un llamante que revienta al calcular su premio no puede tumbar la
         partida —ni hacer cantar un XP que nadie ha confirmado—: se responde 0,
         que es la única respuesta que jamás miente. */
      try { n = preguntarPremio(); } catch (e) { return 0; }
      return (esNumero(n) && n > 0) ? Math.round(n) : 0;
    }

    /* Los dos controles de la barra son LÁMINAS y ya no letras (2026-08-28): el
       sello entero —disco, borde y glifo— viene dibujado, así que el botón no
       pinta fondo ni borde (game.css) y la imagen lo llena al 100 %.
       La <img> va con `alt=""` a propósito: el nombre accesible lo pone el
       aria-label del botón, y un alt con texto lo haría leer dos veces. */
    var SELLOS = (cfg.assets || "") + "assets/img/game/";
    /* El interruptor nace con el estado REAL en vez de nacer apagado: desde que
       el sonido está encendido por defecto, un markup fijo enseñaría el sello
       gris hasta que MFSonido.pintar() corrigiera, y eso es un parpadeo visible
       en cada apertura de reto. */
    var sonidoOn = !!(window.MFSonido && MFSonido.activo && MFSonido.activo());

    var caja = el('<div class="reto-modal" role="dialog" aria-modal="true" aria-label="' + esc(T.reto + ": " + nombre) + '">' +
      '<div class="reto-modal__caja marco-reto" tabindex="-1">' +
        '<div class="reto-modal__barra">' +
          '<span class="reto-modal__titulos">' +
            '<span class="reto-banner"></span>' +
          "</span>" +
          '<button type="button" class="reto-sonido' + (sonidoOn ? "" : " is-mudo") + '"' +
            ' aria-pressed="' + (sonidoOn ? "true" : "false") + '"' +
            ' title="' + esc(T.sonido) + '" aria-label="' + esc(T.sonido) + '">' +
            '<img class="sello-icono" src="' + SELLOS + 'sonido.webp" alt="" width="256" height="256" decoding="async">' +
          "</button>" +
          '<button type="button" class="reto-modal__cerrar" title="' + esc(T.cerrar) + '" aria-label="' + esc(T.cerrar) + '">' +
            '<img class="sello-icono" src="' + SELLOS + 'cerrar.webp" alt="" width="256" height="255" decoding="async">' +
          "</button>" +
        "</div>" +
        '<div class="reto-modal__cuerpo"></div>' +
        '<div class="reto-vivo" aria-live="polite"></div>' +
      "</div></div>");

    var interior = caja.querySelector(".reto-modal__caja");
    var cuerpo = caja.querySelector(".reto-modal__cuerpo");
    var region = caja.querySelector(".reto-vivo");
    var btnCerrar = caja.querySelector(".reto-modal__cerrar");
    var btnSonido = caja.querySelector(".reto-sonido");
    caja.querySelector(".reto-banner").textContent = (juego && juego.banner) || "";

    /* LA INSTRUCCIÓN, DENTRO DEL MODAL (titular 2026-08-31). Antes de abrir, el
       alumno la lee en la ficha de la sala y en la tarjeta-invitación de la
       misión; al abrir, desaparecía y la barra solo decía el rótulo corto
       («KATA»), que no recuerda qué hay que hacer. Se pinta aquí la MISMA frase
       que enseñan las dos puertas de entrada —`juego.comoSeJuega`, declarada por
       cada juego en su propio archivo y ya traducida—, no una copia: retocarla
       sigue siendo cosa de un solo sitio.
       El nodo se crea solo si hay frase, igual que en la invitación: un juego
       que no la declare deja la barra exactamente como estaba, sin hueco vacío.
       SIN ARIA A PROPÓSITO: es texto normal dentro del diálogo, así que el
       lector de pantalla lo encuentra al recorrer el contenido. Colgarlo del
       `aria-describedby` de la caja lo haría cantar dos veces —al abrir y al
       recorrer—, y ni el aria-label del diálogo ni los de los dos botones se
       tocan. */
    var comoJuega = (juego && typeof juego.comoSeJuega === "string") ? juego.comoSeJuega.trim() : "";
    if (comoJuega) {
      var nodoComo = document.createElement("span");
      nodoComo.className = "reto-comojuega";
      nodoComo.textContent = comoJuega;
      caja.querySelector(".reto-modal__titulos").appendChild(nodoComo);
    }

    /* Sin MFSonido cargado el interruptor no haría nada: mejor no ofrecerlo. */
    if (window.MFSonido && MFSonido.alternar) {
      btnSonido.addEventListener("click", function () { MFSonido.alternar(); });
    } else {
      btnSonido.hidden = true;
    }

    btnCerrar.addEventListener("click", function () { cerrar(); });
    caja.addEventListener("click", function (e) { if (e.target === caja) cerrar(); });

    /* Capa 1 del blindaje: TODA tecla se queda dentro de la caja, la consuma el
       juego o no. El listener global de mission.js llama a goPrev() con ← sin
       ninguna guarda, así que una flecha fugada repintaría la misión de debajo
       y dejaría el reto huérfano sobre otra tarjeta. */
    caja.addEventListener("keydown", function (e) {
      e.stopPropagation();
      if (e.key === "Escape") { e.preventDefault(); cerrar(); return; }
      if (e.key === "Tab") atraparFoco(e, interior);
    });
    /* Capa 2: red de seguridad para cuando el foco se ha escapado a <body> (basta
       tocar un elemento no enfocable del juego) y el keydown ya no burbujea
       hasta la caja. Ahí la capa 1 no puede detener nada, así que esta también
       se come las flechas: mission.js:401 llama a goPrev()/goNext() sin ninguna
       guarda y una flecha fugada repintaría la misión bajo el reto abierto. */
    function tecla(e) {
      if (e.key === "Escape") { cerrar(); return; }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); e.stopPropagation(); }
    }
    document.addEventListener("keydown", tecla);

    document.body.appendChild(caja);
    document.body.classList.add("has-reto");
    /* Red de seguridad del pintado: el markup ya nace con el estado real, pero
       si MFSonido cargara DESPUÉS de que se construyera esta barra, `sonidoOn`
       habría salido en falso. Repintar desde el estado real una vez la barra
       está en el documento no cuesta nada y cierra ese hueco. */
    if (window.MFSonido && MFSonido.pintar) { try { MFSonido.pintar(); } catch (e) { /* nada */ } }

    var conHistorial = heredaHistorial;
    if (!conHistorial) {
      try { history.pushState({ mf: "reto" }, ""); conHistorial = true; } catch (e) { /* nada */ }
    }

    var limpiezas = [];
    function registrarLimpieza(fn) { if (typeof fn === "function") limpiezas.push(fn); }
    function limpiar() {
      for (var i = 0; i < limpiezas.length; i++) {
        try { limpiezas[i](); } catch (e) { /* una limpieza rota no impide cerrar */ }
      }
      limpiezas.length = 0;
    }

    function fin() {
      if (resuelto) return;
      resuelto = true;
      resultado = { estado: "abandonado", limpio: false, intentos: estado.fallos, ms: medir(t0) };
      track("reto_abandono", content.id, { tarjeta: iTarjeta, juego: juego.id, ms: resultado.ms });
      if (entregar) entregar(resultado);
    }

    abierto = { caja: caja, tecla: tecla, volverA: ctx.origen || ctx.volverA || null, historial: conHistorial, fin: fin, limpiar: limpiar };

    /* Guarda anti-carrera: toda animación asíncrona de un juego debe preguntar
       antes de tocar el DOM (el alumno puede haber cerrado a mitad). */
    function sigueSiendoElMio() { return !!abierto && abierto.caja === caja; }

    /* La capa de efectos la crea la infraestructura UNA vez y se va con la caja
       al cerrar: ningún juego la crea ni la destruye. */
    var escenario = null;
    if (window.MFJuice && MFJuice.preparar) {
      try { escenario = MFJuice.preparar(interior); } catch (e) { escenario = null; }
    }

    /* ------------------------- LOS DOS SEGUNDOS DEL SELLO -------------------
       El encargo vive aquí y NO en los ocho juegos porque el cierre sale por un
       único sitio: `resolver()`. Repartido en ocho `setTimeout`, el primer juego
       futuro nacería sin la espera y los ocho podrían desincronizarse con el
       primer retoque. Lo único que cada juego decide es CUÁNDO estampa su sello,
       y eso ya lo dice el DOM: aquí solo se escucha.

       Con la escucha se cubre además el caso que el titular describió: el
       instante del sello NO es el de la victoria (tameshiwari estampa 250 ms
       después de partir la tabla y resuelve a los 1100; herramienta estampa a
       los 340 o 520 según sea mancha o cofre). Colgar la espera del sello y no
       de `resolver()` es lo que hace que los ocho enseñen el sello el mismo
       tiempo aunque cada uno tenga su propia cadencia. */
    var selloListoEn = 0;      /* instante en que la estampa TERMINA; 0 = todavía no hay sello */
    /* La espera con el sello puesto es de la casa (2 s), pero un juego puede
       pedir la SUYA en su registro: pasa la subió a 4 s porque su último
       feedback permanece en pantalla y el titular quiere releerlo con el sello
       puesto (2026-09-01). Solo se acepta un número positivo: cualquier otra
       cosa cae a la de la casa. */
    var esperaDelSello = (juego && +juego.esperaSello > 0) ? +juego.esperaSello : ESPERA_SELLO;

    function anotarSello(nodo) {
      selloListoEn = ahora() + duracionEstampa(nodo);
    }

    if (escenario && window.MutationObserver) {
      /* Sin `subtree`: `MFJuice.sello()` cuelga el sello como hijo DIRECTO de la
         capa de efectos. Vigilar el árbol entero obligaría a filtrar, una por
         una, las decenas de partículas de cada cosecha. */
      var vigiaSello = new MutationObserver(function (lotes) {
        for (var i = 0; i < lotes.length; i++) {
          var nuevos = lotes[i].addedNodes;
          for (var j = 0; j < nuevos.length; j++) {
            var n = nuevos[j];
            /* `classList.contains` y no `matches`: el sello es un <div> plano y
               esto se ejecuta también sobre partículas, donde lo barato manda. */
            if (n && n.nodeType === 1 && n.classList && n.classList.contains("juice-sello")) anotarSello(n);
          }
        }
      });
      vigiaSello.observe(escenario, { childList: true });
      registrarLimpieza(function () { vigiaSello.disconnect(); });
    }

    var temporizadorCierre = 0;

    /* El cierre del final feliz, con los dos cinturones que le faltan a un
       `setTimeout` escrito a la ligera:
         · se CANCELA al cerrar —va registrado como limpieza, así que lo apagan
           por igual la X, Escape, el clic en el fondo, el «atrás» del móvil y el
           reto siguiente que hereda el sitio—;
         · y, aun así, el disparo comprueba que la caja que va a cerrar sigue
           siendo la SUYA. Sin lo primero quedaría un cierre vivo sobre un modal
           que ya no existe; sin lo segundo, ese cierre se llevaría por delante
           la partida siguiente, que es el fallo que más caro sale. */
    function cerrarTrasElSello() {
      if (!selloListoEn) {
        /* Red de seguridad: un juego que estampara su sello fuera de la capa
           vigilada, o un navegador sin MutationObserver. Se da por RECIÉN
           puesto, que es el lado seguro del error: dos segundos de más se
           perdonan, dos segundos de menos son justo lo que se viene a arreglar. */
        var puesto = interior.querySelector(".juice-sello");
        if (puesto) anotarSello(puesto);
      }
      /* Sin sello no hay nada que apreciar y el modal se va como siempre: el
         abandono, la partida degenerada (menos opciones de las que el juego
         necesita) y el revelado SECO del examen —que renuncia al sello a
         propósito, «el examen informa, no premia»— no ganan una espera que
         solo sería una pantalla congelada. */
      var falta = selloListoEn ? Math.max(0, esperaDelSello - (ahora() - selloListoEn)) : 0;
      if (!falta) { cerrar(); return; }
      temporizadorCierre = setTimeout(function () {
        temporizadorCierre = 0;
        if (!sigueSiendoElMio()) return;
        cerrar();
      }, falta);
    }
    registrarLimpieza(function () {
      if (temporizadorCierre) { clearTimeout(temporizadorCierre); temporizadorCierre = 0; }
    });

    /* ------------------------- EL REPASO DE LAS ETIQUETAS DE OPCIÓN ---------
       Los ocho juegos NO llaman a nada: la infraestructura repasa el cuerpo del
       modal entero y encaja lo que encuentre. Es lo que pidió el titular —«ajustes
       generales», «todas las labels de todos los juegos»— llevado hasta el final:
       una ficha nueva hereda el traje sin escribir una línea, y ninguna puede
       olvidarse de él. `montaje.encajar` queda expuesta igualmente para el juego
       que prefiera pedir el repaso en el mismo instante en que monta su etiqueta. */
    var repasoPedido = false;

    function repasar() {
      repasoPedido = false;
      if (!sigueSiendoElMio()) return;
      /* Los dos pasos, y en este orden: crecer el contenedor de opción hasta
         donde llegue su hueco y solo después encajar el texto en el hueco ya
         decidido. Ver el bloque de `crecerGrupo`. */
      ajustarEn(cuerpo);
    }

    function repasarPronto() {
      if (repasoPedido) return;
      repasoPedido = true;
      if (window.requestAnimationFrame) requestAnimationFrame(repasar);
      else setTimeout(repasar, 16);
    }

    function encajar(que) {
      if (!sigueSiendoElMio()) return;
      /* Sin argumento es el repaso completo (crecer + encajar). Con un nodo
         concreto solo se encaja: crecer es una decisión de GRUPO y hacerlo desde
         una etiqueta suelta dejaría a sus hermanas con otra escala, que es justo
         el «tres tablitas de tamaños distintos» que hay que evitar. */
      if (!que) { ajustarEn(cuerpo); return; }
      if (que.nodeType === 1) { encajarUno(que); return; }
      if (typeof que.length === "number") {
        for (var i = 0; i < que.length; i++) {
          if (que[i] && que[i].nodeType === 1) encajarUno(que[i]);
        }
      }
    }

    if (window.MutationObserver) {
      /* Se vigilan `childList` y `characterData`: la etiqueta puede NACER al
         montar la escena (los ocho juegos) o CAMBIAR DE TEXTO a mitad de partida
         (el hueco del dominó se rotula cuando cae una ficha, y el revelado de
         examen le antepone un ✓). Los ATRIBUTOS no se vigilan a propósito: este
         helper escribe `class` y `style` en cada etiqueta que toca, y vigilarlos
         sería un bucle que se realimenta solo. */
      var observador = new MutationObserver(repasarPronto);
      observador.observe(cuerpo, { childList: true, characterData: true, subtree: true });
      registrarLimpieza(function () { observador.disconnect(); });
    }
    if (window.ResizeObserver) {
      /* Girar el móvil con el juego abierto cambia el ancho disponible, y desde
         que el modal es de pantalla completa ese cambio es de la mitad de la
         pantalla: sin remedir, media escena se quedaría con la letra de la otra
         orientación. La primera llamada la dispara el propio `observe`, así que
         el repaso inicial sale gratis. */
      var medidor = new ResizeObserver(repasarPronto);
      medidor.observe(cuerpo);
      registrarLimpieza(function () { medidor.disconnect(); });
    } else {
      window.addEventListener("resize", repasarPronto);
      registrarLimpieza(function () { window.removeEventListener("resize", repasarPronto); });
    }
    /* Outfit e Inter llegan por red: si aterrizan DESPUÉS del primer repaso,
       todas las medidas cambian de golpe y hay que rehacerlas. */
    if (document.fonts && document.fonts.ready && document.fonts.ready.then) {
      document.fonts.ready.then(repasarPronto, function () { /* nada */ });
    }

    function anunciar(t) {
      if (!region) return;
      var s = String(t == null ? "" : t);
      /* Se vacía y se vuelve a escribir en el siguiente tic: si el texto es el
         mismo de antes, el lector de pantalla no detectaría cambio y se
         quedaría callado. 40 ms, muy por debajo del presupuesto de camino
         crítico con movimiento reducido. */
      region.textContent = "";
      if (!s) return;
      setTimeout(function () { if (sigueSiendoElMio()) region.textContent = s; }, 40);
    }

    function panel(html, clase) {
      var viejo = cuerpo.querySelector(".reto-feedback");
      if (viejo) viejo.remove();                 /* uno solo a la vez, espejo de mission.js */
      var nodo = el('<div class="reto-feedback feedback ' + clase + '"></div>');
      nodo.innerHTML = html || "";
      cuerpo.appendChild(nodo);
      /* el panel nace al final del cuerpo: sin este empujón, en un móvil donde
         la escena ya llena la caja el alumno no llega a ver por qué falló */
      try { cuerpo.scrollTop = cuerpo.scrollHeight; } catch (e) { /* nada */ }
      return nodo;
    }

    /* Convención única: las piezas que NO son opciones de la tarjeta (señuelos
       del pool, cartas prestadas de otra misión) llegan con opcionIdx = null y
       su propio htmlAlternativo. Cualquier índice fuera de rango se lee como
       null: options[-1] pintaría «undefined» y reventaría el panel. */
    function juicioDe(opcionIdx, htmlAlternativo) {
      var ops = opciones(tarjeta);
      var idx = (esNumero(opcionIdx) && opcionIdx >= 0 && opcionIdx < ops.length) ? opcionIdx : null;
      var general = (tarjeta && tarjeta.feedback) || "";
      var html = idx !== null
        ? ((ops[idx] && ops[idx].feedback) || htmlAlternativo || general)
        : (htmlAlternativo || general);
      return { idx: idx, html: html || "" };
    }

    function fallar(opcionIdx, htmlAlternativo) {
      var d = juicioDe(opcionIdx, htmlAlternativo);
      estado.fallos++;
      track("reto_fail", content.id, { tarjeta: iTarjeta, juego: juego.id, opcion: d.idx, intento: estado.fallos });
      var nodo = panel(d.html, "feedback--ko");
      anunciar(texto(d.html));
      /* Fuera de examen el fallo SIEMPRE da otra oportunidad (repesca ilimitada,
         regla del titular): la repesca se mide aquí para que ningún juego pueda
         olvidarse de contarla. */
      if (!examen) track("reto_retry", content.id, { tarjeta: iTarjeta, juego: juego.id, intento: estado.fallos + 1 });
      return nodo;
    }

    /* Acierto parcial: enseña sin cerrar la partida y SIN emitir evento (no es
       un fallo ni una victoria). */
    function retro(opcionIdx, htmlAlternativo) {
      var d = juicioDe(opcionIdx, htmlAlternativo);
      var nodo = panel(d.html, "feedback--ok");
      anunciar(texto(d.html));
      return nodo;
    }

    function resolver(datos) {
      if (resuelto) return;                    /* la partida se cierra una sola vez: anti-mash */
      resuelto = true;
      datos = datos || {};
      /* «limpio» es el equivalente exacto de attempts === 1 en mission.js: el
         primer juicio del primer intento de ESTA tarjeta. Se comprueba contra
         el estado persistido, no solo contra lo que diga el juego: cerrar y
         reabrir no puede regalar el bonus. */
      var limpio = !!datos.limpio && estado.fallos === 0;
      var intentos = esNumero(datos.intentos) ? datos.intentos : estado.fallos + 1;
      var ms = esNumero(datos.ms) ? Math.round(datos.ms) : medir(t0);
      /* Tres estados, no dos: en examen no hay repesca, así que una ronda
         fallada RESUELVE la tarjeta igual que una ganada (si no, el alumno se
         quedaría bloqueado con setNext en false). */
      var res = { estado: (examen && !limpio) ? "fallado" : "ganado", limpio: limpio, intentos: intentos, ms: ms };
      track("reto_win", content.id, { tarjeta: iTarjeta, juego: juego.id, limpio: limpio, intentos: intentos, ms: ms });
      resultado = res;
      /* El cierre —y SOLO el cierre— espera a que el sello se haya podido
         apreciar. `entregar` se queda donde estaba, síncrono y en el acto: el
         XP se cobra cuando se cobraba (la sala de retos paga dentro de este
         `then`) y el vuelo al HUD ya salió del juego mucho antes. Lo único que
         cambia para quien escucha es que el modal sigue en pantalla dos
         segundos más, y ni la misión ni la sala abren nada al recibirlo. */
      if (abierto && abierto.caja === caja) cerrarTrasElSello();   /* fin() ya no hará nada: resuelto === true */
      if (entregar) entregar(res);
    }

    var montaje = {
      cuerpo: cuerpo,
      escenario: escenario,
      caja: interior,          /* añadido: lo piden MFJuice.hitstop y los closest() de las fichas */
      tarjeta: tarjeta,
      content: content,
      examen: examen,
      ronda: ronda,
      intento: intento,
      iTarjeta: iTarjeta,
      resolver: resolver,
      fallar: fallar,
      feedback: retro,
      /* El premio de esta partida y el texto que lo canta. Van juntos a
         propósito: el número que vuela al HUD y el número que se lee tienen que
         salir de la misma pregunta, que es justo lo que fallaba cuando el juego
         gritaba «+5 XP» y la sala pagaba 3. */
      premia: premia,
      conXP: conXP,
      anunciar: anunciar,      /* añadido: escribe en .reto-vivo sin buscarla por el DOM */
      vivo: sigueSiendoElMio,  /* añadido: guarda anti-carrera para las animaciones */
      alCerrar: registrarLimpieza, /* añadido: aquí se registra control.destruir() de MFDrag */
      /* §0.12: los objetos de juego son ilustraciones y las acciones las
         intercambian. Van aquí y NO en window.MFRetos porque un juego solo debe
         poder cambiar sprites mientras SU modal está abierto. `precargar` resuelve
         aunque el alumno cierre a mitad: quien monte después debe pasar por
         `vivo()` antes de tocar el DOM. */
      sprite: cambiarSprite,
      precargar: probarLaminas,
      /* Encargo del titular sobre las etiquetas de opción (una sola línea, con
         reducción antes de partir). NO es obligatorio llamarla: el observador de
         arriba repasa solo. Llamarla justo después de montar una etiqueta ahorra
         el fotograma en que se vería envuelta antes del primer repaso. */
      encajar: encajar,
    };

    var promesa = new Promise(function (ok) {
      entregar = ok;
      if (resultado) ok(resultado);            /* por si algo resolvió antes de tiempo */
    });

    btnCerrar.focus();
    track("reto_open", content.id, { tarjeta: iTarjeta, juego: juego.id, examen: examen });

    try {
      juego.jugar(montaje);
    } catch (e) {
      /* Un juego que revienta al montar no puede dejar al alumno encerrado en
         una caja vacía: se cierra como abandono y la tarjeta sigue jugable. */
      track("reto_error", content.id, { tarjeta: iTarjeta, juego: juego.id });
      cerrar();
    }

    /* Repaso SÍNCRONO nada más montar, y fuera del try de arriba: el observador
       llegaría un fotograma después y se vería el parpadeo de la etiqueta
       envuelta. Va en su propio try porque una medida que reventara no puede
       tumbar una partida ya montada, y si el juego se cayó al montar,
       `sigueSiendoElMio()` ya lo deja en nada. */
    try { repasar(); } catch (e) { /* nada: el observador lo reintentará */ }

    return promesa;
  }

  /* ---------- El icono de un juego, ilustrado ----------
     Los ocho retos se anunciaban con un emoji del sistema (`juego.icono`), que
     se dibuja distinto en cada plataforma y no es del estilo de la casa. Desde
     2026-09-01 hay una lámina por juego, `icono-<id>.webp`, y build.py las
     publica en `MF_CONFIG.gameArt`.

     Vive AQUÍ y no en cada llamante porque lo usan dos sitios —la ficha de la
     sala de retos y la tarjeta de invitación de las misiones— que están en
     archivos distintos: repetirlo era garantizar que algún día dijeran cosas
     distintas.

     El emoji NO se borra: sigue siendo el respaldo. Un juego nuevo sin lámina, o
     un despliegue al que le falte el archivo, enseña su emoji en vez de un
     hueco. */
  function pintarIcono(nodo, j) {
    if (!nodo || !j) return;
    var arte = cfg.gameArt || {};
    var src = arte["icono-" + j.id];
    nodo.textContent = "";
    if (!src) { nodo.textContent = j.icono || ""; return; }
    var img = document.createElement("img");
    img.className = "reto-icono";
    /* `alt` vacío a propósito: el nombre del juego va escrito al lado, en texto.
       Con alt, un lector de pantalla lo diría dos veces. */
    img.src = (cfg.assets || "") + src;
    img.alt = "";
    img.width = 256; img.height = 256;
    img.loading = "lazy";
    img.decoding = "async";
    nodo.appendChild(img);
  }

  window.MFRetos = {
    registrar: registrar,
    pintarIcono: pintarIcono,
    juegos: juegos,
    juego: juego,
    compatibles: compatibles,
    sortear: sortear,
    abrir: abrir,
    cerrar: cerrar,
    seleccionarExamen: seleccionarExamen,
    prepararExamen: seleccionarExamen,   /* alias: mission.js llama a su prepararExamen() con este nombre */
  };
})();

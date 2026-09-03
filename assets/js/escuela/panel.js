/* Tu Escuela — el panel (F1 lectura + F2 edición núcleo).
 *
 * La Baraja Viva de verdad: la tarjeta que se ve es la que se toca. Cada zona
 * editable comite al JSON fuente (pares {md, html}: el html lo recompila el
 * markdown ligero de la casa) y se re-renderiza — nunca contenteditable crudo
 * sobre el runtime (decisión del juez, 00-PLAN §4.0). El autosave vive en
 * datos.js (debounce + versión); aquí solo se marca sucio y se pinta el
 * estado. Tipos editables en F2: text, quiz y scroll; los visuales
 * (escena, revela, puertas, elección) llegan en F3.
 *
 * Rutas (hash): #/ · #/<curso> · #/<curso>/n/<n> · #/<curso>/m/<id>[/c/<k>]
 *               · #/<curso>/pergaminos
 */
(function () {
  "use strict";
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang !== "en";

  /* Los rótulos del panel siguen al selector ES/EN, no al idioma de la página:
     el titular no quiere ver dos idiomas a la vez (2026-09-02), así que el
     mismo botón cambia el idioma del CONTENIDO y el de la INTERFAZ. Por eso
     las tres tablas que dependen del idioma son funciones y no constantes. */
  function textosDe(ES) { return ES ? {
    titulo: "Tu escuela",
    pronto: "El taller de los Maestros Fu abre pronto.",
    prontoNota: "Tu cuenta ya está lista; la forja de cursos se enciende en una fase próxima.",
    errorCarga: "No se pudo cargar tu escuela.",
    reintentar: "Reintentar",
    misArtes: "Mis artes",
    fundar: "Fundar un arte", fundarNota: "llega con la apertura",
    publicado: "PUBLICADO", borrador: "BORRADOR",
    niveles: "niveles", misiones: "misiones", misione: "misión",
    tarjetas: "tarjetas", examen: "Examen", sinMisiones: "nivel en niebla",
    selloCamino: "El camino tiene 8 cinturones",
    salaPergaminos: "Pergaminos", salaRetos: "Sala de retos",
    seGeneraSola: "se genera sola del contenido",
    probar: "▶ Probar la misión", probarExamen: "▶ Probar el examen",
    demo: "DEMO — sin XP", cerrar: "Cerrar",
    correcta: "correcta", laDelCurso: "la elección del curso",
    feedbackDe: "Aclaración", sintesis: "Síntesis",
    /* Rótulos del formulario de pregunta: cada dato dice DÓNDE se ve. */
    rotOpcion: "Respuesta completa (la que lee el alumno en el quiz)",
    rotCorta: "Opción de respuesta corta",
    rotOrden: "Orden correcto de selección, para juegos que apliquen",
    rotAclaracion: "Aclaración (aparece al seleccionar esta opción)",
    rotAclaracionG: "Aclaración general (aparece siempre, tras responder bien o mal)",
    esCorrecta: "Respuesta correcta",
    marcarCorrecta: "Marcar como correcta",
    sinOrden: "— sin orden (señuelo) —", ordenCambia: "intercambia",
    quitarOpcion2: "Quitar esta opción",
    anadirNivel: "+ Añadir nivel", topeNiveles: "8 cinturones es el tope del camino",
    juegoAzar: "🎲 Azar", eligeJuego: "Selecciona juego",
    tipoPregunta: "Tipo de pregunta",
    dominioNivel: "Dominio del nivel",
    dominioPorque: "una palabra, hasta 20 letras; el «Nivel N —» lo pone el dojo",
    dominioUna: "El dominio del nivel es UNA palabra",
    dominioHeredado: "este arte trae páginas propias del sitio: el nombre manda en el mapa del curso, pero sus páginas publicadas se regeneran con el build",
    tipoUnica: "Respuesta única", tipoOrden: "Orden correcto",
    tipoUnicaPorque: "el alumno elige UNA; juegos de puntería (rompe, campana, kintsugi, herramienta, candado)",
    tipoOrdenPorque: "el alumno ejecuta los pasos 1·2·3; kata y dominó (el paso 1 hace de correcta)",
    pasoDe: "Paso",
    juegoAlAzar: "El juego vuelve a Azar: el que había no sirve para este tipo",
    anadirIdioma: "Añadir idioma al curso",
    anadirIdiomaNota: "El curso se escribió en su idioma base. Añadir un idioma lo declara aquí; el relleno lo hace la traducción con IA leyendo el curso entero (exige el curso completo y en verde). Hasta entonces, el idioma queda pendiente.",
    sinIdiomas: "Este curso ya tiene todos los idiomas disponibles.",
    idiomaPendiente: "Idioma pendiente de traducir: corre la traducción para llenarlo",
    idiomaConRojos: "Hay {n} avisos rojos: completa el curso antes de añadir un idioma",
    idiomaAnadido: "{lg} añadido: pendiente de traducción",
    sinTraducir: "{n} textos sin traducir",
    desfasadaBase: "↻ el base cambió tras traducir",
    idiomaAMedias: "traducido a medias: {h} de {t} piezas",
    estructuraDivergente: "la tarjeta no es la misma en todos los idiomas: edita algo en el idioma bueno para sincronizarla",
    ensayar: "Ensayar la publicación",
    ensayarNota: "En desarrollo no hay base a la que estampar: el ensayo compila todo lo que se enviaría y avisa si algo falla. Para publicar de verdad desde aquí, genera el sitio con gate (python tools/build.py) e inicia sesión.",
    ensayoBien: "Compilado sin errores: se enviarían {n} piezas.",
    ensayoMal: "El ensayo encontró fallos de compilación:",
    esElBase: "es el idioma base del curso: no se quita ni se traduce",
    quitarIdioma: "Quitar este idioma",
    confirmarQuitarIdioma: "¿Quitar el {lg} del curso?",
    detalleQuitarIdioma: "Se borran sus {n} piezas traducidas. El idioma base y los demás no se tocan.",
    idiomaQuitado: "{lg} quitado del curso",
    probarPregunta: "▶ Probar pregunta",
    probarSinJuego: "Ningún juego puede montar esta pregunta aún: revisa cortas, correcta y orden",
    eligeJuegoTitulo: "El juego de esta pregunta",
    eligeJuegoNota: "Azar es lo recomendado: el dojo sortea entre los juegos compatibles y el entrenamiento no se repite.",
    quitarNivel: "Quitar este nivel",
    confirmarNivel: "¿Quitar el {t}?",
    nivelVacio: "Está vacío: no se pierde nada. Los niveles de abajo suben un peldaño y los cinturones se reparten de nuevo.",
    nivelLleno: "Se van con él sus {n} y no hay vuelta atrás tras guardar. Los niveles de abajo suben un peldaño y los cinturones se reparten de nuevo.",
    unicoNivel: "Un curso necesita al menos un nivel",
    tarjetaIncompleta: "Esta tarjeta está sin terminar",
    tarjetaIncompletaPie: "No puedes cambiar de tarjeta ni guardar hasta arreglarla. Esto le falta:",
    completarTarjeta: "Completar tarjeta",
    descartarCambios: "Descartar cambios",
    descartarTarjeta: "Descartar tarjeta",
    eliminarTarjeta: "Eliminar tarjeta",
    vineta: "Viñeta", palabras: "palabras", minutos: "min", conAudio: "con minipodcast",
    cargando: "Abriendo tu escuela…",
    guardando: "Guardando…", guardado: "Guardado ✓", sinGuardar: "⚠ Sin guardar — reintentar",
    conflicto: "Otra pestaña guardó antes.", recargar: "Recargar",
    editar: "Editar", listo: "Listo", cancelar: "Cancelar",
    volverBaraja: "‹ Volver a la baraja",
    guardar: "Guardar", guardarCambios: "Guardar cambios", sinCambios: "Sin cambios",
    deshacer: "Deshacer", nadaQueDeshacer: "Nada que deshacer",
    hayPendientes: "Tienes cambios sin guardar.",
    salirIgual: "Salir sin guardar",
    confirmarOpcion: "¿Borrar esta opción?",
    confirmarFrase: "¿Borrar esta frase?",
    confirmarPuerta: "¿Borrar esta puerta?",
    confirmarVineta: "¿Borrar esta viñeta?",
    confirmarSintesis: "¿Quitar la síntesis?",
    seDeshace: "Puedes deshacerlo con ↶ mientras no guardes.",
    confirmarTarjeta: "¿Borrar esta tarjeta?",
    confirmarMision: "¿Enviar esta misión a la papelera?",
    detalleTarjeta: "Podrás deshacerlo durante unos segundos.",
    detalleMision: "Se guarda 30 días en la papelera del curso (con Supabase).",
    soloF3: "se edita en la siguiente fase",
    anadirOpcion: "+ opción", quitarOpcion: "quitar",
    elegirPergamino: "Elegir pergamino…",
    porque: {
      enunciado: "cabe en una pantalla con sus opciones",
      opcion: "se lee de un vistazo en una teja",
      feedback: "aparece solo, tras responder",
      cuerpo: "una idea por tarjeta, sin scroll",
      scrollCuerpo: "es una invitación, no el pergamino",
      frase: "una acción, una idea revelada",
      orden: "1..K, solo para secuencias (kata, dominó)",
      titulo: "el nombre en el mapa y el HUD",
    },
  } : {
    titulo: "Your school",
    pronto: "The Fu Masters' workshop opens soon.",
    prontoNota: "Your account is ready; the course forge lights up in an upcoming phase.",
    errorCarga: "Your school could not be loaded.",
    reintentar: "Retry",
    misArtes: "My arts",
    fundar: "Found an art", fundarNota: "arrives with the opening",
    publicado: "PUBLISHED", borrador: "DRAFT",
    niveles: "levels", misiones: "missions", misione: "mission",
    tarjetas: "cards", examen: "Exam", sinMisiones: "level in the mist",
    selloCamino: "The path has 8 belts",
    salaPergaminos: "Scrolls", salaRetos: "Challenge hall",
    seGeneraSola: "generated from the content",
    probar: "▶ Play this mission", probarExamen: "▶ Play the exam",
    demo: "DEMO — no XP", cerrar: "Close",
    correcta: "correct", laDelCurso: "the course's pick",
    feedbackDe: "Feedback", sintesis: "Synthesis",
    rotOpcion: "Full answer (what the student reads in the quiz)",
    rotCorta: "Short answer option",
    rotOrden: "Correct pick order, for games that use it",
    rotAclaracion: "Feedback (shown when this option is picked)",
    rotAclaracionG: "General feedback (always shown, right or wrong)",
    esCorrecta: "Correct answer",
    marcarCorrecta: "Mark as correct",
    sinOrden: "— no order (decoy) —", ordenCambia: "swaps",
    quitarOpcion2: "Remove this option",
    anadirNivel: "+ Add level", topeNiveles: "8 belts is the path's limit",
    juegoAzar: "🎲 Random", eligeJuego: "Choose a game",
    tipoPregunta: "Question type",
    dominioNivel: "Level mastery",
    dominioPorque: "one word, up to 20 letters; the dojo writes the «Level N —»",
    dominioUna: "The level mastery is ONE word",
    dominioHeredado: "this art ships its own site pages: the name rules the course map, but its published pages are regenerated by the build",
    tipoUnica: "Single answer", tipoOrden: "Correct order",
    tipoUnicaPorque: "the student picks ONE; aim games (break, bell, kintsugi, tool, padlock)",
    tipoOrdenPorque: "the student performs steps 1·2·3; kata and domino (step 1 doubles as the correct one)",
    pasoDe: "Step",
    juegoAlAzar: "The game is back to Random: the previous one does not fit this type",
    anadirIdioma: "Add a language to the course",
    anadirIdiomaNota: "The course was written in its base language. Adding a language declares it here; the filling is done by AI translation reading the whole course (requires the course complete and green). Until then the language stays pending.",
    sinIdiomas: "This course already has every available language.",
    idiomaPendiente: "Language pending translation: run the translation to fill it",
    idiomaConRojos: "There are {n} red issues: complete the course before adding a language",
    idiomaAnadido: "{lg} added: pending translation",
    sinTraducir: "{n} untranslated texts",
    desfasadaBase: "↻ the base changed after translation",
    idiomaAMedias: "half translated: {h} of {t} pieces",
    estructuraDivergente: "the card is not the same across languages: edit anything in the good one to sync it",
    ensayar: "Rehearse the publish",
    ensayarNota: "In development there is no database to stamp: the rehearsal compiles everything that would be sent and reports failures. To publish for real from here, build with the gate on (python tools/build.py) and sign in.",
    ensayoBien: "Compiled with no errors: {n} pieces would be sent.",
    ensayoMal: "The rehearsal found compilation failures:",
    esElBase: "is the base language of the course: neither removed nor translated",
    quitarIdioma: "Remove this language",
    confirmarQuitarIdioma: "Remove {lg} from the course?",
    detalleQuitarIdioma: "Its {n} translated pieces are deleted. The base language and the others are untouched.",
    idiomaQuitado: "{lg} removed from the course",
    probarPregunta: "▶ Try the question",
    probarSinJuego: "No game can mount this question yet: check short answers, correct and order",
    eligeJuegoTitulo: "This question's game",
    eligeJuegoNota: "Random is recommended: the dojo draws among compatible games so training never repeats itself.",
    quitarNivel: "Remove this level",
    confirmarNivel: "Remove {t}?",
    nivelVacio: "It is empty: nothing is lost. The levels below move up one step and the belts are dealt again.",
    nivelLleno: "Its {n} go with it, and there is no way back once you save. The levels below move up one step and the belts are dealt again.",
    unicoNivel: "A course needs at least one level",
    tarjetaIncompleta: "This card is unfinished",
    tarjetaIncompletaPie: "You cannot switch cards or save until it is fixed. This is missing:",
    completarTarjeta: "Finish the card",
    descartarCambios: "Discard changes",
    descartarTarjeta: "Discard card",
    eliminarTarjeta: "Delete card",
    vineta: "Panel", palabras: "words", minutos: "min", conAudio: "with minipodcast",
    cargando: "Opening your school…",
    guardando: "Saving…", guardado: "Saved ✓", sinGuardar: "⚠ Not saved — retry",
    conflicto: "Another tab saved first.", recargar: "Reload",
    editar: "Edit", listo: "Done", cancelar: "Cancel",
    volverBaraja: "‹ Back to the deck",
    guardar: "Save", guardarCambios: "Save changes", sinCambios: "No changes",
    deshacer: "Undo", nadaQueDeshacer: "Nothing to undo",
    hayPendientes: "You have unsaved changes.",
    salirIgual: "Leave without saving",
    confirmarOpcion: "Delete this option?",
    confirmarFrase: "Delete this phrase?",
    confirmarPuerta: "Delete this door?",
    confirmarVineta: "Delete this panel?",
    confirmarSintesis: "Remove the synthesis?",
    seDeshace: "You can undo it with ↶ until you save.",
    confirmarTarjeta: "Delete this card?",
    confirmarMision: "Send this mission to the trash?",
    detalleTarjeta: "You can undo it for a few seconds.",
    detalleMision: "Kept 30 days in the course trash (with Supabase).",
    soloF3: "editable in the next phase",
    anadirOpcion: "+ option", quitarOpcion: "remove",
    elegirPergamino: "Choose a scroll…",
    porque: {
      enunciado: "fits one screen with its options",
      opcion: "readable at a glance on a tile",
      feedback: "shown alone, after answering",
      cuerpo: "one idea per card, no scrolling",
      scrollCuerpo: "an invitation, not the scroll",
      frase: "one action, one idea revealed",
      orden: "1..K, only for sequences (kata, domino)",
      titulo: "the name on the map and the HUD",
    },
  }; }
  var T = textosDe(ES);

  /* Límites POR CAMPO aprobados por el titular (00-PLAN §1.5). */
  var LIM = { enunciado: 220, opcion: 140, feedback: 300, frase: 175, vineta: 110,
              cuerpo: 450, scrollCuerpo: 200, corta: 24, titulo: 80 };

  var ICONO = { text: "✍️", quiz: "❓", choice: "❓", apuesta: "🎯", puertas: "🚪",
                revela: "👊", escena: "🎬", scroll: "📜", reflect: "💭" };
  /* La palabra «apuesta» está vetada del UI (brief): se muestra «elección». */
  function tiposDe(ES) {
    return { apuesta: ES ? "elección" : "choice", text: ES ? "texto" : "text",
             scroll: ES ? "pergamino" : "scroll",
             escena: ES ? "escena" : "scene", revela: ES ? "revela" : "reveal",
             puertas: ES ? "puertas" : "doors", quiz: ES ? "pregunta" : "question" };
  }
  var TIPO_NOMBRE = tiposDe(ES);
  function nombreTipo(t) { return TIPO_NOMBRE[t] || t; }

  var BELT_COLOR = {};
  (cfg.belts || []).forEach(function (b) { BELT_COLOR[b.key] = b.color; });

  /* Los 8 retos: icono, nombre y el requisito que explica un medallón apagado
     (espejo de la matriz de compatibilidad del censo F0). La compatibilidad
     REAL la juzga MFRetos.compatibles sobre la tarjeta compilada. */
  function fichasDe(ES) { return [
    { id: "tameshiwari", icono: "🪵", nombre: ES ? "Rompe" : "Break", req: ES ? "pregunta de respuesta única con sus 3 cortas" : "single-answer question with its 3 short answers" },
    { id: "campana", icono: "🔔", nombre: ES ? "La campana" : "The bell", req: ES ? "pregunta de respuesta única con sus 3 cortas" : "single-answer question with its 3 short answers" },
    { id: "kintsugi", icono: "🏺", nombre: "Kintsugi", req: ES ? "respuesta única, 3 cortas y el emblema del arte" : "single answer, 3 short answers and the art emblem" },
    { id: "herramienta", icono: "🔧", nombre: ES ? "La herramienta" : "The tool", req: ES ? "pregunta de respuesta única con sus 3 cortas" : "single-answer question with its 3 short answers" },
    { id: "andamio", icono: "🔒", nombre: ES ? "El candado" : "The padlock", req: ES ? "respuesta única, 3 cortas y aclaración por opción (o general)" : "single answer, 3 short answers and feedback per option (or general)" },
    { id: "kata", icono: "🥋", nombre: "Kata", req: ES ? "pregunta de orden correcto (pasos 1·2·3)" : "correct-order question (steps 1·2·3)" },
    { id: "domino", icono: "🁢", nombre: ES ? "Dominó" : "Domino", req: ES ? "pregunta de orden correcto (pasos 1·2·3)" : "correct-order question (steps 1·2·3)" },
  ]; }
  var JUEGOS_FICHA = fichasDe(ES);

  /* El único sitio donde se cambia de idioma: contenido e interfaz a la vez. */
  function fijarIdioma(lg) {
    langVista = lg;
    /* La interfaz solo habla es/en hasta F0 (catálogo de plataforma): para
       cualquier otro idioma de CONTENIDO, la UI se queda en español. */
    ES = lg !== "en";
    T = textosDe(ES);
    TIPO_NOMBRE = tiposDe(ES);
    JUEGOS_FICHA = fichasDe(ES);
    document.documentElement.setAttribute("data-escuela-lang", lg);
  }

  /* Un par fuente nuevo, compilado por el markdown de la casa. */
  function par(md, inline) {
    return { md: md || "", html: md ? (inline ? MFEscuela.compilar.mdInline(md) : MFEscuela.compilar.mdBloque(md)) : "" };
  }

  /* La biblioteca de tipos que el «+» ofrece en F2 (los visuales llegan en
     F3 y se muestran sellados). Cada plantilla nace con lo mínimo digno. */
  function plantillasTarjeta() {
    return [
      { tipo: "text", listo: true, desc: ES ? "Una idea en prosa" : "One idea in prose",
        crear: function () { return { tipo: "text", cuerpo: par("") }; } },
      { tipo: "quiz", listo: true, desc: ES ? "Pregunta que se juega" : "Question played as a game",
        /* Tres opciones fijas (titular 2026-09-02), de RESPUESTA ÚNICA por
           defecto: sin orden. El conmutador «Orden correcto» de la tarjeta
           sella los pasos 1·2·3 cuando la pregunta es una secuencia. */
        crear: function () {
          return { tipo: "quiz", enunciado: par(""), feedback: par(""),
                   opciones: [
                     { texto: par("", true), correct: true, feedback: par("", true) },
                     { texto: par("", true), correct: false, feedback: par("", true) },
                     { texto: par("", true), correct: false, feedback: par("", true) }] };
        } },
      { tipo: "scroll", listo: true, desc: ES ? "Invitación a un pergamino" : "Invitation to a scroll",
        crear: function () { return { tipo: "scroll", titulo: "", href: "", cuerpo: par("") }; } },
      { tipo: "escena", listo: true, desc: ES ? "Cómic con la mascota" : "Mascot comic",
        crear: function () {
          var fondo = primerFondo();
          return { tipo: "escena",
                   vinetas: [{ fondo: fondo, ancla: primeraAncla(fondo), pose: "reposo", texto: par("", true) }] };
        } },
      { tipo: "revela", listo: true, desc: ES ? "Frases que se ganan a golpes" : "Phrases earned by strikes",
        /* Tres frases desde el minuto uno: la animación hace tres acciones. */
        crear: function () { return { tipo: "revela", enunciado: par(""), frases: [par("", true), par("", true), par("", true)] }; } },
      { tipo: "puertas", listo: true, desc: ES ? "Hasta tres puertas, una elección" : "Up to three doors, one choice",
        crear: function () {
          return { tipo: "puertas", enunciado: par(""), sintesis: null,
                   opciones: [{ texto: par("", true), feedback: par("", true) },
                              { texto: par("", true), feedback: par("", true) }] };
        } },
      { tipo: "apuesta", listo: true, desc: ES ? "Elección sin respuesta correcta" : "Choice with no right answer",
        crear: function () {
          return { tipo: "apuesta", enunciado: par(""),
                   opciones: [{ texto: par("", true), correct: false, feedback: par("", true) },
                              { texto: par("", true), correct: false, feedback: par("", true) }] };
        } },
    ];
  }

  function abrirBiblioteca(insertIx) {
    var esExamen = misionActiva && misionActiva.m.kind === "exam";
    var fichas = plantillasTarjeta().map(function (p, i) {
      var permitida = p.listo && (!esExamen || p.tipo === "quiz" || p.tipo === "text");
      var sello = !p.listo ? "印 F3" : (!permitida ? "印 " + (ES ? "el examen es de preguntas" : "the exam takes questions") : "");
      return '<button type="button" class="escuela-plantilla' + (permitida ? "" : " is-sellada") +
        '" data-plantilla="' + i + '"' + (permitida ? "" : " disabled") + ">" +
        '<span class="escuela-plantilla__icono">' + (ICONO[p.tipo] || "▫️") + "</span>" +
        "<b>" + esc(nombreTipo(p.tipo)) + "</b><small>" + esc(p.desc) + "</small>" +
        (sello ? '<span class="escuela-sello escuela-sello--mini">' + esc(sello) + "</span>" : "") +
        "</button>";
    }).join("");
    var v = ventana({ titulo: "＋ " + (ES ? "Nueva tarjeta" : "New card"), panel: true,
      cuerpo: '<div class="escuela-plantillas">' + fichas + "</div>" });
    v.cuerpo.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-plantilla]");
      if (!b || b.disabled) return;
      var p = plantillasTarjeta()[parseInt(b.getAttribute("data-plantilla"), 10)];
      var capaM = capa(misionActiva.m);
      capaM.cards.splice(insertIx, 0, p.crear());
      marcarTocado();
      v.cerrar();
      location.hash = "#/" + ruta().curso + "/m/" + misionActiva.m.id + "/c/" + insertIx;
      rutear();
    });
  }

  /* ------------------------------------ fábricas de misiones y pergaminos - */

  var BELT_ES = { white: "blanco", yellow: "amarillo", orange: "naranja", green: "verde",
                  blue: "azul", purple: "morado", brown: "marron", black: "negro" };

  function maxOrdenArchivo(curso, lg) {
    var max = 0;
    curso.misiones.forEach(function (m) {
      if (m.ordenArchivo && typeof m.ordenArchivo[lg] === "number") max = Math.max(max, m.ordenArchivo[lg]);
    });
    return max;
  }

  function capaNueva(slug, url, title) {
    return { slug: slug, url: url, title: title, description: "", summary: "", cards: [] };
  }

  function nuevaMision(clave, n, base) {
    var curso = capaCurso(clave);
    var k = 1;
    while (misionPorId(curso, clave + "-" + n + "-" + k)) k++;
    var nivel = curso.niveles[String(n)] || {};
    var urlEs = (nivel.es ? nivel.es.url : clave + "/dojo/nivel-" + n + "/") + "mision-" + k + "-nueva/";
    var urlEn = (nivel.en ? nivel.en.url : clave + "/dojo/level-" + n + "/") + "mission-" + k + "-new/";
    var entry;
    if (base) {
      entry = JSON.parse(JSON.stringify(base));
      entry.id = clave + "-" + n + "-" + k;
      entry.nivel = n;
      entry.orden = k;
      if (entry.es) { entry.es.slug = "mision-" + k + "-nueva"; entry.es.url = urlEs; entry.es.title += " (copia)"; }
      if (entry.en) { entry.en.slug = "mission-" + k + "-new"; entry.en.url = urlEn; entry.en.title += " (copy)"; }
    } else {
      entry = { id: clave + "-" + n + "-" + k, nivel: n, orden: k, kind: "mission",
        es: capaNueva("mision-" + k + "-nueva", urlEs, "Misión " + k + " — nueva"),
        en: capaNueva("mission-" + k + "-new", urlEn, "Mission " + k + " — new") };
      var pls = plantillasTarjeta();
      ["es", "en"].forEach(function (lg) {
        entry[lg].cards = [pls[0].crear(), pls[1].crear()];
      });
    }
    entry.ordenArchivo = { es: maxOrdenArchivo(curso, "es") + 1, en: maxOrdenArchivo(curso, "en") + 1 };
    entry.creada = true;                 /* su página estática pide un rebuild */
    return entry;
  }

  function nuevoExamen(clave, n) {
    var curso = capaCurso(clave);
    var nivel = curso.niveles[String(n)] || {};
    var belt = (nivel.belt || "white");
    var urlEs = (nivel.es ? nivel.es.url : clave + "/dojo/nivel-" + n + "/") + "examen-cinturon-" + (BELT_ES[belt] || belt) + "/";
    var urlEn = (nivel.en ? nivel.en.url : clave + "/dojo/level-" + n + "/") + belt + "-belt-exam/";
    var entry = { id: clave + "-" + n + "-exam", nivel: n, orden: 99, kind: "exam",
      es: capaNueva("examen-cinturon-" + (BELT_ES[belt] || belt), urlEs, "Examen del cinturón " + (BELT_ES[belt] || belt)),
      en: capaNueva(belt + "-belt-exam", urlEn, capitalizar(belt) + " belt exam") };
    entry.es.cards = [{ tipo: "text", cuerpo: par("Tres retos seguidos, no hay tiempo límite; si fallas puedes intentarlo cuantas veces quieras.") }];
    entry.en.cards = [{ tipo: "text", cuerpo: par("Three challenges in a row, no time limit; if you fail you can retry as many times as you want.") }];
    entry.ordenArchivo = { es: maxOrdenArchivo(curso, "es") + 1, en: maxOrdenArchivo(curso, "en") + 1 };
    entry.creada = true;
    return entry;
  }
  function capitalizar(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  function nuevoPergamino(clave, layout) {
    var curso = capaCurso(clave);
    var k = 1;
    var existe = {};
    curso.pergaminos.forEach(function (p) { existe[p.id] = true; });
    while (existe[clave + "-p-" + k]) k++;
    var artEs = curso.es.url, artEn = curso.en ? curso.en.url : curso.es.url;
    var entry = { id: clave + "-p-" + k, layout: layout,
      es: { slug: "aprende/pergamino-" + k, url: artEs + "aprende/pergamino-" + k + "/",
            title: (layout === "story" ? "Historia " : "Pergamino ") + k, description: "", summary: "",
            kicker: "Aprende", order: 900 + k, words: 0, cuerpo: par("") },
      en: { slug: "learn/scroll-" + k, url: artEn + "learn/scroll-" + k + "/",
            title: (layout === "story" ? "Story " : "Scroll ") + k, description: "", summary: "",
            kicker: "Learn", order: 900 + k, words: 0, cuerpo: par("") } };
    entry.creada = true;
    return entry;
  }

  /* ------------------------------------------ fundar un arte (wizard F6) -- */

  function repartoCinturon(n, total) {
    var claves = MFEscuela.compilar.BELTS;
    if (total <= 1) return claves[claves.length - 1];
    var ix = Math.round((n - 1) * (claves.length - 1) / (total - 1));
    return claves[ix];
  }

  /* El título de un nivel es «Nivel N — Dominio»: el prefijo lo pone la casa
     (número y separador) y SOLO el dominio es del maestro (titular
     2026-09-02). Estas dos funciones son la única verdad sobre esa costura.
     El separador es la raya larga; se acepta también el guion simple por si
     un curso importado lo escribió así. */
  /* Canónicas en compilar.js desde la reforma de idiomas (una sola costura). */
  function dominioDeNivel(t) { return MFEscuela.compilar.dominioDeNivel(t); }
  function tituloDeNivel(n, dominio, lang) { return MFEscuela.compilar.tituloDeNivel(n, dominio, lang); }

  /* Cuántos peldaños tiene la escalera. Se cuenta hasta el primer hueco: un
     curso con niveles 1,2,3 mide 3, y jamás se dibuja un 5 sin un 4. */
  function alturaCurso(curso) {
    var n = 0;
    while (n < 8 && curso.niveles[String(n + 1)]) n++;
    return n || 1;
  }

  /* Tras quitar o añadir, la escalera se vuelve a repartir: los cinturones se
     reparten EN ORDEN sobre los niveles que quedan (decisión del titular: menos
     de 8 niveles reparte los mismos 8 cinturones, nunca un negro antes que un
     amarillo). Los slugs y las direcciones solo se reescriben si son los que
     pone la casa por defecto — un curso importado con rutas propias (CulpaFu:
     `nivel-1-reconocimiento`) no se toca, que sus enlaces ya están publicados. */
  function reindexarNiveles(curso, clave) {
    var total = alturaCurso(curso);
    for (var n = 1; n <= total; n++) {
      var nv = curso.niveles[String(n)];
      if (!nv) continue;
      nv.belt = repartoCinturon(n, total);
      Object.keys(nv).forEach(function (lg) {
        var cara = nv[lg];
        if (!cara || typeof cara !== "object" || !("slug" in cara)) return;
        cara.order = n;
        var patron = lg === "es" ? /^nivel-\d+$/ : /^level-\d+$/;
        if (!patron.test(cara.slug || "")) return;
        var slugNuevo = (lg === "es" ? "nivel-" : "level-") + n;
        var urlVieja = cara.url;
        cara.slug = slugNuevo;
        cara.url = clave + "/" + slugNuevo + "/";
        if (cara.title && /^(Nivel|Level) \d+$/.test(cara.title)) {
          cara.title = (lg === "es" ? "Nivel " : "Level ") + n;
        }
        /* Las misiones cuelgan de la dirección del nivel: se les cambia el
           prefijo, no la dirección entera (su propio slug es del maestro). */
        if (urlVieja && urlVieja !== cara.url) {
          curso.misiones.forEach(function (m) {
            var mc = m[lg];
            if (mc && mc.url && mc.url.indexOf(urlVieja) === 0) {
              mc.url = cara.url + mc.url.slice(urlVieja.length);
            }
          });
        }
      });
    }
  }

  /* Un nivel nace SOLO en el idioma base del curso (docs/11): los demás
     idiomas los rellena la traducción. El slug usa la palabra de la casa en
     ese idioma para que las direcciones se lean naturales. */
  function slugNivel(lang) { return lang === "en" ? "level-" : "nivel-"; }
  function capaNivelNueva(clave, n, lang) {
    return { slug: slugNivel(lang) + n, url: clave + "/" + slugNivel(lang) + n + "/",
             title: MFEscuela.compilar.tituloDeNivel(n, "", lang),
             description: "", summary: "", order: n };
  }
  function nivelNuevo(clave, n, lang) {
    var nivel = { id: clave + "-level-" + n, belt: MFEscuela.compilar.BELTS[n - 1] };
    nivel[lang || idiomaBaseActivo] = capaNivelNueva(clave, n, lang || idiomaBaseActivo);
    return nivel;
  }

  function construirCursoNuevo(clave, titulo, categoria, nNiveles, lang) {
    /* El curso nace en UN idioma —el de la plataforma al fundarlo— y ese
       queda como base (docs/11). Los demás se añaden con el «+» y los
       rellena la traducción por IA. */
    lang = lang || cfg.lang || "es";
    var curso = { categoria: categoria || "general", status: "draft", visibilidad: "privado",
      idioma_base: lang, idiomas: [],
      niveles: {}, misiones: [], pergaminos: [], salas: {} };
    curso[lang] = { slug: "", url: clave + "/", title: titulo, description: "", summary: "" };
    var salaP = { id: clave + "-pergaminos" };
    salaP[lang] = { url: clave + (lang === "en" ? "/scrolls/" : "/pergaminos/"),
                    title: lang === "en" ? "Scrolls" : "Pergaminos", cuerpo: par("") };
    var salaR = { id: clave + "-retos" };
    salaR[lang] = { url: clave + (lang === "en" ? "/challenges/" : "/retos/"),
                    title: lang === "en" ? "Challenge hall" : "Sala de retos", cuerpo: par("") };
    curso.salas = { pergaminos: salaP, retos: salaR };
    for (var n = 1; n <= nNiveles; n++) {
      curso.niveles[String(n)] = { id: clave + "-level-" + n, belt: repartoCinturon(n, nNiveles) };
      curso.niveles[String(n)][lang] = capaNivelNueva(clave, n, lang);
    }
    var pls = plantillasTarjeta();
    var mision = { id: clave + "-1-1", nivel: 1, orden: 1, kind: "mission",
      ordenArchivo: {}, creada: true };
    mision.ordenArchivo[lang] = 1;
    mision[lang] = { slug: lang === "en" ? "mission-1" : "mision-1",
      url: curso.niveles["1"][lang].url + (lang === "en" ? "mission-1/" : "mision-1/"),
      title: lang === "en" ? "Mission 1 — your first" : "Misión 1 — tu primera",
      description: "", summary: "", cards: [pls[0].crear(), pls[1].crear()] };
    curso.misiones.push(mision);
    return curso;
  }

  function abrirFundar() {
    var v = ventana({ titulo: "🥋 " + T.fundar, panel: true, cuerpo:
      '<form class="escuela-fundar">' +
      '<label>' + esc(ES ? "Nombre del arte" : "Art name") + '<input name="nombre" required maxlength="40" placeholder="' + esc(ES ? "p. ej. CalculiFu" : "e.g. CalculiFu") + '"></label>' +
      '<p class="escuela-nota">' + esc(ES
        ? "El curso nace en " + (MFEscuela.compilar.IDIOMAS[cfg.lang] || "español") + " (su idioma base); los demás idiomas se añaden después con el «+»."
        : "The course is born in " + (MFEscuela.compilar.IDIOMAS[cfg.lang] || "English") + " (its base language); other languages are added later with the «+».") + "</p>" +
      '<label>' + esc(ES ? "Clave (la dirección del curso)" : "Key (the course address)") + '<input name="clave" required maxlength="30" pattern="[a-z0-9][a-z0-9\-]{2,29}" placeholder="calculifu"></label>' +
      '<label>' + esc(ES ? "Categoría" : "Category") + '<input name="categoria" maxlength="24" value="general"></label>' +
      '<label>' + esc(ES ? "Niveles del camino (1-8)" : "Path levels (1-8)") + '<input name="niveles" type="number" min="1" max="8" value="8"></label>' +
      '<p class="escuela-nota">印 ' + esc(ES ? "Nace privado, con su nivel 1 sembrado y una misión de ejemplo. Los cinturones se reparten en orden hasta el negro." : "Born private, with level 1 seeded and an example mission. Belts are dealt in order up to black.") + "</p>" +
      '<p class="escuela-avisos" data-fundar-error hidden></p>' +
      '<button type="submit" class="escuela-probar">印 ' + esc(ES ? "Fundar" : "Found it") + "</button>" +
      "</form>" });
    var caja = v.caja;
    var cerrar = v.cerrar;
    var form = caja.querySelector("form");
    var esCampo = form.querySelector('[name="nombre"]');
    var claveCampo = form.querySelector('[name="clave"]');
    esCampo.addEventListener("input", function () {
      if (claveCampo.dataset.tocado) return;
      claveCampo.value = esCampo.value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
    });
    claveCampo.addEventListener("input", function () { claveCampo.dataset.tocado = "1"; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var clave = claveCampo.value.trim();
      var errorEl = caja.querySelector("[data-fundar-error]");
      if (!/^[a-z0-9][a-z0-9-]{2,29}$/.test(clave)) {
        errorEl.hidden = false;
        errorEl.textContent = "⚠ " + (ES ? "clave inválida: minúsculas, números y guiones" : "invalid key: lowercase, digits and dashes");
        return;
      }
      if (capaCurso(clave)) {
        errorEl.hidden = false;
        errorEl.textContent = "⚠ " + (ES ? "esa clave ya existe" : "that key already exists");
        return;
      }
      var curso = construirCursoNuevo(clave, esCampo.value.trim(),
        form.querySelector('[name="categoria"]').value.trim().toLowerCase(),
        parseInt(form.querySelector('[name="niveles"]').value, 10) || 8, cfg.lang);
      MFEscuelaDatos.fundarCurso(clave, curso).then(function () {
        cerrar();
        location.hash = "#/" + clave;
        rutear();
      }, function (err) {
        errorEl.hidden = false;
        var texto = String((err && err.message) || err || "");
        errorEl.textContent = "⚠ " + (texto.indexOf("cupo-lleno") >= 0
          ? (ES ? "tu cupo de cursos está lleno" : "your course quota is full")
          : texto.indexOf("ya-existe") >= 0 || texto.indexOf("clave") >= 0
            ? (ES ? "esa clave no está disponible" : "that key is not available")
            : (ES ? "no se pudo fundar el arte" : "the art could not be founded"));
      });
    });
    esCampo.focus();
  }

  function abrirNuevaMision(clave, n) {
    var curso = capaCurso(clave);
    var normales = curso.misiones.filter(function (m) { return m.kind !== "exam"; });
    var filas = '<button type="button" class="escuela-plantilla" data-nm-base="">' +
      '<span class="escuela-plantilla__icono">🎴</span><b>' + esc(ES ? "Baraja mínima" : "Minimal deck") + "</b>" +
      "<small>" + esc(ES ? "texto de apertura + una pregunta" : "opening text + one question") + "</small></button>" +
      normales.map(function (m) {
        var mc = capa(m);
        return '<button type="button" class="escuela-plantilla" data-nm-base="' + esc(m.id) + '">' +
          '<span class="escuela-plantilla__icono">⧉</span><b>' + esc(ES ? "Duplicar: " : "Duplicate: ") + esc(mc.title) + "</b>" +
          '<small>' + esc(mc.cards.length + " " + T.tarjetas) + "</small></button>";
      }).join("");
    var v = ventana({ titulo: "＋ " + (ES ? "Nueva misión" : "New mission"), panel: true,
      cuerpo: '<div class="escuela-plantillas">' + filas + "</div>" });
    v.cuerpo.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-nm-base]");
      if (!b) return;
      var baseId = b.getAttribute("data-nm-base");
      var base = baseId ? misionPorId(curso, baseId) : null;
      var entry = nuevaMision(clave, n, base);
      v.cerrar();
      MFEscuelaDatos.crearMision(clave, entry).then(function () {
        location.hash = "#/" + clave + "/m/" + entry.id;
        rutear();
      }, function () { toast(ES ? "No se pudo crear la misión" : "Could not create the mission", { error: true }); });
    });
  }

  /* --- los avisos de acción: toasts arriba a la derecha ---
     TODO lo que el panel tiene que contar tras un gesto sale por aquí, con la
     misma cara que el «borrado con Deshacer» (titular 2026-09-02). Se apilan
     en vez de pisarse: dos gestos seguidos dejan dos avisos. El botón solo
     aparece si de verdad hay algo que deshacer. */
  var pilaToasts = null;
  function cajaToasts() {
    if (!pilaToasts || !pilaToasts.isConnected) {
      pilaToasts = document.querySelector(".escuela-toasts");
      if (!pilaToasts) {
        pilaToasts = el('<div class="escuela-toasts" aria-live="polite"></div>');
        document.body.appendChild(pilaToasts);
      }
    }
    return pilaToasts;
  }
  function toast(texto, opts) {
    opts = opts || {};
    var caja = cajaToasts();
    var t = el('<div class="escuela-toast' + (opts.error ? " is-error" : "") + '" role="status"><span>' +
      esc(texto) + "</span>" +
      (opts.deshacer ? '<button type="button" class="escuela-toast__accion">' + esc(T.deshacer) + "</button>" : "") +
      "</div>");
    /* Más de tres a la vez tapan la pantalla: el más viejo se retira. */
    while (caja.children.length >= 3) caja.removeChild(caja.firstChild);
    caja.appendChild(t);
    var quitar = function () { t.classList.add("is-out"); setTimeout(function () { t.remove(); }, 300); };
    var timer = setTimeout(quitar, opts.deshacer ? 8000 : 4500);
    if (opts.deshacer) {
      t.querySelector("button").addEventListener("click", function () {
        clearTimeout(timer);
        t.remove();
        opts.deshacer();
      });
    }
  }
  function toastDeshacer(texto, deshacer) { toast(texto, { deshacer: deshacer }); }

  function compatiblesDe(cardF) {
    if (!window.MFRetos || !MFRetos.compatibles) return [];
    try {
      var cc = MFEscuela.compilar.compilarCard(cardF, R);
      /* El arte importa: kintsugi exige el emblema del curso (gameArt). */
      var art = misionActiva ? misionActiva.curso : ruta().curso;
      return MFRetos.compatibles(cc, { id: "escuela", kind: "mission", art: art, pool: [] }) || [];
    } catch (e) { return []; }
  }

  var raiz = null;
  var modelo = null;
  var langVista = cfg.lang;
  var otherRoot = ES ? cfg.prefix + "en/" : cfg.assets;
  var puedeEditar = false;   /* superadmin o master (con SB); en local, sí */

  function esc(t) {
    return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function R(html) { return MFEscuela.compilar.resolver(html, cfg.prefix, otherRoot); }
  function plano(html, tope) { return MFEscuela.compilar.textoPlano(R(html), tope); }
  function el(html) {
    var d = document.createElement("div");
    d.innerHTML = html;
    return d.firstElementChild;
  }

  /* -------------------------------------------------------- las ventanas --
     Una sola fábrica para TODAS las ventanas del panel (probar, catálogos,
     biblioteca, wizard): modal del tamaño del área de trabajo en escritorio
     y pantalla completa en móvil, con Escape, clic en el fondo y foco
     devuelto. opts: {titulo, panel, cuerpo, volver} */
  function ventana(opts) {
    var previo = document.activeElement;
    var caja = el('<div class="escuela-demo' + (opts.panel ? " escuela-demo--panel" : "") +
      (opts.confirmar ? " escuela-demo--confirmar" : "") +
      '" role="dialog" aria-modal="true" aria-label="' + esc(opts.titulo || "") + '">' +
      '<div class="escuela-demo__marco">' +
      '<div class="escuela-demo__barra">' +
      (opts.volver ? '<button type="button" class="escuela-demo__volver" data-volver>' + esc(opts.volver) + "</button>" : "") +
      '<span class="escuela-demo__banda">' + esc(opts.titulo || "") + "</span>" +
      /* el mismo sello bermellón que cierra los retos y los pergaminos */
      '<button type="button" class="escuela-demo__cerrar" title="' + esc(T.cerrar) + '" aria-label="' + esc(T.cerrar) + '">' +
      '<img class="sello-icono" src="' + (cfg.assets || "") + 'assets/img/game/cerrar.webp" alt="" width="256" height="255" decoding="async">' +
      "</button>" +
      "</div>" +
      '<div class="escuela-demo__cuerpo">' + (opts.cuerpo || "") + "</div>" +
      "</div></div>");
    var api = {
      caja: caja,
      cuerpo: caja.querySelector(".escuela-demo__cuerpo"),
      alCerrar: null,
      cerrar: function () {
        document.removeEventListener("keydown", alEsc, true);
        caja.remove();
        if (api.alCerrar) api.alCerrar();
        if (previo && previo.focus) { try { previo.focus(); } catch (e) { /* nada */ } }
      },
    };
    function alEsc(e) { if (e.key === "Escape") { e.stopPropagation(); api.cerrar(); } }
    document.addEventListener("keydown", alEsc, true);
    caja.addEventListener("click", function (e) { if (e.target === caja) api.cerrar(); });
    caja.querySelector(".escuela-demo__cerrar").addEventListener("click", api.cerrar);
    var vol = caja.querySelector("[data-volver]");
    if (vol) vol.addEventListener("click", api.cerrar);
    document.body.appendChild(caja);
    return api;
  }

  /* Mover una tarjeta de sitio. Un solo camino para las dos maneras de
     pedirlo —arrastrar por el río y Alt+←/→—, para que no acaben discrepando. */
  function moverCarta(desde, hasta) {
    if (!misionActiva) return;
    var capaMv = capa(misionActiva.m);
    var n = capaMv.cards.length;
    if (desde === hasta || desde < 0 || desde >= n || hasta < 0 || hasta >= n) return;
    capaMv.cards.splice(hasta, 0, capaMv.cards.splice(desde, 1)[0]);
    marcarTocado();
    var rM = ruta();
    location.hash = "#/" + rM.curso + "/m/" + rM.id + "/c/" + hasta;
    rutear();
  }

  /* El borrado de una tarjeta, tras confirmar: sale del mazo, se guarda y
     deja su toast de Deshacer unos segundos (la red DESPUÉS de la pregunta). */
  function borrarTarjeta(rB, misionB, capaBr, kB) {
    var quitada = capaBr.cards.splice(kB, 1)[0];
    MFEscuelaDatos.marcarSucio("mision:" + misionB.id);
    location.hash = "#/" + rB.curso + "/m/" + rB.id + "/c/" + Math.max(0, kB - 1);
    rutear();
    toastDeshacer(ES ? "Tarjeta borrada" : "Card deleted", function () {
      capaBr.cards.splice(Math.min(kB, capaBr.cards.length), 0, quitada);
      MFEscuelaDatos.marcarSucio("mision:" + misionB.id);
      location.hash = "#/" + rB.curso + "/m/" + rB.id + "/c/" + kB;
      rutear();
    });
  }

  /* Confirmar de verdad antes de destruir (titular 2026-09-02): un toast de
     Deshacer es la red DESPUÉS; esto es la pregunta ANTES. */
  function confirmar(texto, detalle, alSi) {
    /* La pregunta vive SOLO en el título de la barra: repetirla dentro sería
       preguntar dos veces (titular 2026-09-02). */
    var v = ventana({
      titulo: texto, panel: true, confirmar: true,
      cuerpo: (detalle ? '<p class="escuela-nota">' + esc(detalle) + "</p>" : "") +
        '<div class="escuela-confirmar__botones">' +
        '<button type="button" class="btn btn--ghost escuela-confirmar__no" data-no>' + esc(T.cancelar) + "</button>" +
        '<button type="button" class="escuela-probar escuela-probar--rojo" data-si>' + esc(ES ? "Sí, borrar" : "Yes, delete") + "</button></div>",
    });
    v.cuerpo.querySelector("[data-no]").addEventListener("click", v.cerrar);
    v.cuerpo.querySelector("[data-si]").addEventListener("click", function () {
      v.cerrar();
      alSi();
    });
    v.cuerpo.querySelector("[data-si]").focus();
  }

  /* ------------------------------------------------------------- rutas ---- */

  function ruta(hash) {
    var h = (hash || location.hash || "#/").replace(/^#\/?/, "");
    var p = h.split("/").filter(Boolean);
    if (!p.length) return { v: "artes" };
    if (p.length === 1) return { v: "portada", curso: p[0] };
    if (p[1] === "pergaminos") return { v: "pergaminos", curso: p[0] };
    if (p[1] === "p" && p[2]) return { v: "pergamino", curso: p[0], id: p[2] };
    if (p[1] === "publicar") return { v: "publicar", curso: p[0] };
    if (p[1] === "papelera") return { v: "papelera", curso: p[0] };
    if (p[1] === "estudiantes") return { v: "estudiantes", curso: p[0] };
    if (p[1] === "n" && p[2]) return { v: "nivel", curso: p[0], n: parseInt(p[2], 10) };
    if (p[1] === "m" && p[2]) return { v: "baraja", curso: p[0], id: p[2], k: (p[3] === "c" && p[4]) ? parseInt(p[4], 10) : 0 };
    return { v: "artes" };
  }
  /* El idioma base del curso en pantalla: el fallback de capa() cae a él
     (docs/11): un curso fundado en EN no tiene por qué tener capa `es`. */
  var idiomaBaseActivo = "es";
  function capaCurso(clave) {
    var c = modelo.fuente.cursos[clave] || null;
    if (c) idiomaBaseActivo = MFEscuela.compilar.baseDe(c);
    return c;
  }
  function capa(obj) {
    return obj && (obj[langVista] || obj[idiomaBaseActivo] || obj.es || obj.en);
  }
  function misionPorId(curso, id) {
    for (var i = 0; i < curso.misiones.length; i++) if (curso.misiones[i].id === id) return curso.misiones[i];
    return null;
  }

  /* ------------------------------------------------------- campo editable - */

  /* Una zona editable: el contenido REAL envuelto con su receta de edición.
     ed = { ruta, modo: bloque|inline|plano|numero, tope, porque } — la ruta
     apunta DENTRO de la capa de idioma de la misión activa. */
  /* Los campos están SIEMPRE ABIERTOS (titular 2026-09-02): se ve de un
     vistazo dónde se puede escribir, sin tener que adivinar qué es clicable.
     Cada campo lleva su contador y su porqué debajo, y ocupa todo el ancho.
     Escribir toca el borrador en memoria; persistir sigue siendo cosa del
     botón Guardar. */
  var nCampo = 0;
  function zona(html, ed) {
    if (!puedeEditar) return html;
    var capaM = (contextoEdicion() || {}).capa;
    var valor = capaM ? leerCampo(capaM, ed) : "";
    var id = "c" + (++nCampo);
    var attrs = 'data-campo="' + esc(JSON.stringify(ed)) + '" id="' + id + '"';
    var control;
    if (ed.modo === "numero") {
      control = '<input class="escuela-campo__control escuela-campo__control--corto" type="number" min="1" max="9" ' +
        attrs + ' value="' + esc(valor) + '">';
    } else if (ed.modo === "plano") {
      control = '<input class="escuela-campo__control" type="text" ' + attrs +
        (ed.tope ? ' maxlength="' + ed.tope + '"' : "") + ' value="' + esc(valor) + '">';
    } else {
      var filas = ed.filas || (ed.contar === "palabras" ? 14 : ed.modo === "bloque" ? 3 : 2);
      control = '<textarea class="escuela-campo__control" rows="' + filas + '" ' + attrs + ">" + esc(valor) + "</textarea>";
    }
    return '<span class="escuela-campo">' +
      (ed.rotulo ? '<label class="escuela-campo__rotulo" for="' + id + '">' + esc(ed.rotulo) + "</label>" : "") +
      control +
      '<span class="escuela-campo__pie">' +
      '<b class="escuela-campo__cuenta" data-cuenta-de="' + id + '">' + textoCuenta(valor, ed) + "</b>" +
      (ed.porque ? '<span class="escuela-campo__porque">' + esc(ed.porque) + "</span>" : "") +
      "</span></span>";
  }

  function textoCuenta(valor, ed) {
    if (ed.contar === "palabras") {
      return MFEscuela.compilar.contarPalabras(valor) + " " + (ES ? "palabras" : "words") + " (180-300)";
    }
    return String(valor.length) + (ed.tope ? "/" + ed.tope : "");
  }
  function claseCuenta(valor, ed) {
    if (ed.contar === "palabras") {
      var p = MFEscuela.compilar.contarPalabras(valor);
      return p >= 180 && p <= 300 ? "" : (p > 380 || p < 80 ? " is-rojo" : " is-ambar");
    }
    if (!ed.tope) return "";
    var n = valor.length;
    return n > ed.tope ? " is-rojo" : n > ed.tope * 0.9 ? " is-ambar" : "";
  }

  function resolverRuta(obj, ruta) {
    var partes = ruta.split(".");
    var fin = partes.pop();
    var nodo = obj;
    for (var i = 0; i < partes.length; i++) {
      if (nodo == null) return null;
      nodo = nodo[partes[i]];
    }
    return nodo == null ? null : { padre: nodo, clave: fin };
  }

  function leerCampo(capaM, ed) {
    var sitio = resolverRuta(capaM, ed.ruta);
    if (!sitio) return "";
    var v = sitio.padre[sitio.clave];
    if (v == null) return "";
    if (ed.modo === "plano" || ed.modo === "numero") return String(v);
    return v.md || "";
  }

  function escribirCampo(capaM, ed, valor) {
    var sitio = resolverRuta(capaM, ed.ruta);
    if (!sitio) return;
    /* Escribir en una posición que el array todavía no tiene (la 3.ª frase de
       un revela que llegó con dos) rellena las intermedias: un `undefined` en
       medio reventaría al compilar la tarjeta. */
    if (Array.isArray(sitio.padre)) {
      var ix = parseInt(sitio.clave, 10);
      if (!isNaN(ix)) {
        for (var q = sitio.padre.length; q < ix; q++) sitio.padre[q] = { md: "", html: "" };
      }
    }
    if (ed.modo === "numero") {
      var n = parseInt(valor, 10);
      if (isNaN(n)) delete sitio.padre[sitio.clave];
      else sitio.padre[sitio.clave] = n;
      return;
    }
    if (ed.modo === "plano") {
      var t = String(valor).trim();
      if (ed.tope) t = t.slice(0, ed.tope);
      if (t) sitio.padre[sitio.clave] = t;
      else delete sitio.padre[sitio.clave];
      return;
    }
    var md = String(valor).replace(/\r\n/g, "\n");
    sitio.padre[sitio.clave] = {
      md: md,
      html: ed.modo === "bloque" ? MFEscuela.compilar.mdBloque(md) : MFEscuela.compilar.mdInline(md),
    };
  }

  var misionActiva = null;   /* {curso, m} de la baraja en pantalla */
  var pergActivo = null;     /* {curso, ent} del pergamino en pantalla */

  /* ------------------------------------------------ el par ES/EN (F5) ----- */

  /* Huella del contenido ES de una entrada (misión o pergamino). La capa EN
     guarda la huella del ES que tradujo (esHash): si el ES cambia después,
     la EN queda «desfasada» y lo canta con ↻. Las entradas importadas sin
     esHash se dan por al día (nacieron emparejadas). */
  /* La huella canónica vive en compilar.js (huellaBase, misma fórmula djb2
     de siempre: la continuidad de las huellas estampadas depende de ello).
     `esHash` es el nombre viejo de `baseHash` cuando el base era siempre ES:
     se sigue leyendo como respaldo. */
  function hashDe(entry) { return MFEscuela.compilar.huellaBase(entry, idiomaBaseActivo); }
  function desfasada(entry, lg) {
    lg = lg || "en";
    if (lg === idiomaBaseActivo || !entry[lg]) return false;
    var sello = entry[lg].baseHash || entry[lg].esHash;
    return !!(sello && sello !== hashDe(entry));
  }
  function entidadActiva() {
    return pergActivo ? pergActivo.ent : misionActiva ? misionActiva.m : null;
  }

  /* ------------------------------------------------ deshacer y guardar ----
     La edición NO se guarda sola. Cada gesto empuja el estado ANTERIOR de la
     entidad a una pila; ↶ lo devuelve, y solo «Guardar» lo persiste. La pila
     se limpia al guardar (lo guardado ya no se deshace desde aquí: para eso
     está el historial de versiones). */
  var pila = [];              /* [{clave, antes}] — estados previos */
  var previo = null;          /* clon del estado actual, listo para la pila */
  var claveActiva = null;
  /* El estado TAL COMO SE GUARDÓ, para poder descartar cambios de una tarjeta
     sin tocar las demás. Se refresca al entrar en la entidad y al guardar. */
  var base = null;

  function clon(x) { return JSON.parse(JSON.stringify(x)); }

  function fijarEntidad() {
    var ctxE = contextoEdicion();
    var nueva = ctxE ? ctxE.clave : null;
    if (nueva !== claveActiva) {
      claveActiva = nueva;
      pila = [];
      previo = null;
      base = null;
    }
    if (claveActiva && !previo) {
      var ent = entidadActiva();
      if (ent) previo = clon(ent);
    }
    if (claveActiva && !base) {
      var ent2 = entidadActiva();
      if (ent2) base = clon(ent2);
    }
  }

  /* TODO tocar pasa por aquí: guarda el paso atrás, estampa la huella del par
     EN si toca, y ensucia el borrador (sin escribir nada en ningún sitio). */
  function marcarTocado() {
    var ctxE = contextoEdicion();
    if (!ctxE) return;
    var entry = entidadActiva();
    if (previo) pila.push({ clave: ctxE.clave, antes: previo });
    if (pila.length > 40) pila.shift();
    /* La tarjeta es UNA sola (titular 2026-09-03): lo que se acaba de tocar
       manda su ESTRUCTURA a los demás idiomas, que conservan sus textos. Va
       aquí, en el único sitio por el que pasa TODO gesto de edición, para que
       ningún camino nuevo pueda volver a bifurcar una tarjeta. */
    if (entry && entry.cards === undefined) {
      MFEscuela.compilar.sincronizarEstructura(entry, langVista);
    }
    if (entry && langVista !== idiomaBaseActivo && entry[langVista]) {
      entry[langVista].baseHash = hashDe(entry);
      delete entry[langVista].esHash;   /* el nombre viejo muere al re-tocar */
    }
    previo = clon(entry);
    MFEscuelaDatos.marcarSucio(ctxE.clave);
  }

  /* Deshacer: el último estado vuelve a su sitio, dentro de la MISMA lista
     (misiones o pergaminos) para que las referencias del modelo no se rompan. */
  function deshacer() {
    if (!pila.length) return;
    var paso = pila.pop();
    var ent = entidadActiva();
    if (!ent) return;
    for (var k in ent) if (Object.prototype.hasOwnProperty.call(ent, k)) delete ent[k];
    var copia = clon(paso.antes);
    for (var k2 in copia) ent[k2] = copia[k2];
    previo = clon(ent);
    MFEscuelaDatos.marcarSucio(paso.clave);
    if (!pila.length) MFEscuelaDatos.limpiarSucio(paso.clave);
    rutear();
    toast(ES ? "Cambio deshecho" : "Change undone");
  }

  function guardarActivo() {
    var ctxE = contextoEdicion();
    if (!ctxE) return;
    /* Una tarjeta a medias no se guarda: primero se arregla, se descarta o se
       borra (titular 2026-09-02). */
    if (guardiaTarjeta()) return;
    MFEscuelaDatos.guardarAhora(ctxE.clave).then(function () {
      pila = [];
      previo = clon(entidadActiva());
      base = clon(entidadActiva());
      rutear();
      toast(ES ? "Cambios guardados" : "Changes saved");
    }, function () {
      toast(ES ? "No se pudieron guardar los cambios" : "The changes could not be saved", { error: true });
    });
  }

  /* ------------------------------------------- la tarjeta bien diligenciada -
     Una tarjeta a medias no viaja: no se puede cambiar de tarjeta ni guardar
     hasta arreglarla (titular 2026-09-02). Los problemas son los avisos ROJOS
     que ya sabía calcular el panel — los mismos que frenan el sello de
     publicar—, así que no hay dos verdades sobre qué es una tarjeta rota.
     Devuelve true si BLOQUEA (y entonces ya ha abierto la ventana). */
  function rojosDe(cardF) {
    return avisosDeCard(cardF).filter(function (a) { return a.n === "rojo"; });
  }
  function guardiaTarjeta(rDada) {
    if (!puedeEditar) return false;
    var r = rDada || ruta();
    if (r.v !== "baraja") return false;
    var curso = capaCurso(r.curso);
    var m = curso && misionPorId(curso, r.id);
    if (!m) return false;
    var mc = capa(m);
    var card = mc.cards[r.k];
    if (!card) return false;
    var problemas = rojosDe(card);
    if (!problemas.length) return false;
    ventanaIncompleta(r, m, problemas);
    return true;
  }

  /* ¿La tarjeta es NUEVA (aún no guardada)? Si el borrador tiene más tarjetas
     que la última versión guardada, hay altas sin guardar y los índices ya no
     casan: entonces solo se puede descartar la tarjeta entera, no «volver a
     como estaba», porque ese «como estaba» no existe. */
  function tarjetaSinGuardar(mc, k) {
    var baseC = base && capa(base) && capa(base).cards;
    if (!baseC) return true;
    return mc.cards.length !== baseC.length || k >= baseC.length;
  }

  function ventanaIncompleta(r, m, problemas) {
    var mc = capa(m);
    var nueva = tarjetaSinGuardar(mc, r.k);
    var lista = problemas.map(function (p) { return "<li>" + esc(p.t) + "</li>"; }).join("");
    var v = ventana({
      titulo: T.tarjetaIncompleta, panel: true, confirmar: true,
      cuerpo: '<p class="escuela-nota">' + esc(T.tarjetaIncompletaPie) + "</p>" +
        '<ul class="escuela-problemas">' + lista + "</ul>" +
        '<div class="escuela-confirmar__botones">' +
        (nueva
          ? '<button type="button" class="btn btn--ghost" data-descartar>' + esc(T.descartarTarjeta) + "</button>"
          : '<button type="button" class="btn btn--ghost" data-descartar>' + esc(T.descartarCambios) + "</button>" +
            '<button type="button" class="btn btn--ghost" data-borrar>' + esc(T.eliminarTarjeta) + "</button>") +
        '<button type="button" class="escuela-probar" data-completar>' + esc(T.completarTarjeta) + "</button></div>",
    });
    v.cuerpo.querySelector("[data-completar]").addEventListener("click", v.cerrar);
    v.cuerpo.querySelector("[data-completar]").focus();
    v.cuerpo.querySelector("[data-descartar]").addEventListener("click", function () {
      v.cerrar();
      if (nueva) {
        mc.cards.splice(r.k, 1);
        toast(ES ? "Tarjeta descartada: nunca llegó a existir" : "Card discarded: it never existed");
      } else {
        mc.cards[r.k] = clon(capa(base).cards[r.k]);
        toast(ES ? "Cambios de la tarjeta descartados" : "Card changes discarded");
      }
      /* La misión nunca se queda sin baraja. */
      if (!mc.cards.length) mc.cards.push(plantillasTarjeta()[0].crear());
      MFEscuelaDatos.marcarSucio("mision:" + m.id);
      location.hash = "#/" + r.curso + "/m/" + r.id + "/c/" + Math.max(0, Math.min(r.k, mc.cards.length - 1));
      rutear();
    });
    var bBorrar = v.cuerpo.querySelector("[data-borrar]");
    if (bBorrar) {
      bBorrar.addEventListener("click", function () {
        v.cerrar();
        borrarTarjeta(r, m, mc, r.k);
      });
    }
  }

  /* Nadie pierde trabajo por navegar: si hay cambios, se pregunta antes. */
  function haySinGuardar() {
    return MFEscuelaDatos.haySucios && MFEscuelaDatos.haySucios();
  }

  /* La entidad cuya capa de idioma editan las zonas de ESTA pantalla. */
  function contextoEdicion() {
    if (pergActivo) return { capa: capa(pergActivo.ent), clave: "pergamino:" + pergActivo.ent.id };
    if (misionActiva) return { capa: capa(misionActiva.m), clave: "mision:" + misionActiva.m.id };
    return null;
  }

  /* (El editor inline con sus sellos ✓/✕ por campo se retiró el 2026-09-02:
     los campos están SIEMPRE abiertos y quien decide es el «Guardar» de la
     tarjeta — uno solo para todo lo que hayas tocado.) */

  /* ------------------------------------------------------------ avisos ---- */

  /* Avisos con severidad: ROJO rompe la experiencia del alumno (bloquea el
     sello de publicar); ÁMBAR es editorial (publica avisando), como en
     build.py. Cada aviso: {n: "rojo"|"ambar", t: texto}. */
  function avisosDeCard(cardF) {
    var av = [];
    function ambar(t) { av.push({ n: "ambar", t: t }); }
    function rojo(t) { av.push({ n: "rojo", t: t }); }
    function mide(par, tope, nombre) {
      if (par && par.md && par.md.length > tope) ambar(nombre + " " + par.md.length + "/" + tope);
    }
    if (cardF.tipo === "quiz" || cardF.tipo === "choice") {
      mide(cardF.enunciado, LIM.enunciado, ES ? "enunciado" : "prompt");
      if (!cardF.enunciado.md) rojo(ES ? "sin pregunta" : "no question");
      var correctas = 0;
      (cardF.opciones || []).forEach(function (op, j) {
        if (op.correct) correctas++;
        mide(op.texto, LIM.opcion, ES ? "opción" : "option");
        mide(op.feedback, LIM.feedback, "feedback");
        /* La corta ES la respuesta desde 2026-09-02, y los juegos la exigen
           en TODAS las opciones (todasConCorta): sin ella no hay pregunta. */
        if (cardF.tipo === "quiz" && !op.corta) {
          rojo((ES ? "la opción " : "option ") + (j + 1) + (ES ? " no tiene respuesta corta" : " has no short answer"));
        }
      });
      /* Sin juego posible no hay pregunta: desde 2026-09-02 las preguntas SE
         JUEGAN, así que caer al quiz clásico de respaldo es un defecto, no una
         alternativa. Solo se juzga con el motor cargado (en el navegador del
         panel siempre lo está); sin él no se inventa un veredicto. */
      if (cardF.tipo === "quiz" && window.MFRetos && MFRetos.compatibles &&
          !compatiblesDe(cardF).length) {
        rojo(ES ? "ningún juego puede montar esta pregunta" : "no game can mount this question");
      }
      /* Pregunta de ORDEN CORRECTO: los tres pasos son mandatorios y el paso 1
         es la correcta (el editor lo mantiene; esto caza datos viejos rotos). */
      if (cardF.tipo === "quiz") {
        var ordenes = (cardF.opciones || []).filter(function (o) { return typeof o.orden === "number"; })
          .map(function (o) { return o.orden; }).sort();
        if (ordenes.length && String(ordenes) !== "1,2,3") {
          rojo(ES ? "la secuencia necesita los pasos 1, 2 y 3" : "the sequence needs steps 1, 2 and 3");
        }
        if (String(ordenes) === "1,2,3") {
          var paso1 = (cardF.opciones || []).filter(function (o) { return o.orden === 1; })[0];
          if (paso1 && !paso1.correct) rojo(ES ? "en una secuencia la correcta es el paso 1" : "in a sequence the correct one is step 1");
        }
      }
      if (cardF.tipo === "quiz" && correctas !== 1) rojo(ES ? "sin correcta única" : "needs one correct");
      /* Tres opciones, ni más ni menos (titular 2026-09-02): la señuelo doble
         y la correcta, que es lo que reparten TODOS los juegos. */
      if (cardF.tipo === "quiz" && (cardF.opciones || []).length !== 3) {
        rojo(ES ? "una pregunta lleva exactamente 3 opciones" : "a question takes exactly 3 options");
      }
      if (cardF.tipo === "choice" && (cardF.opciones || []).length < 2) rojo(ES ? "mínimo 2 opciones" : "min 2 options");
    } else if (cardF.tipo === "scroll") {
      mide(cardF.cuerpo, LIM.scrollCuerpo, ES ? "invitación" : "invite");
      if (!cardF.href) rojo(ES ? "sin pergamino elegido" : "no scroll chosen");
    } else if (cardF.tipo === "revela") {
      mide(cardF.enunciado, LIM.enunciado, ES ? "enunciado" : "prompt");
      /* Tres acciones hace la animación, tres textos pide la tarjeta: se
         recorren las TRES posiciones, exista o no el dato, para que el aviso
         señale la acción concreta que falta y no un recuento abstracto. */
      for (var jf = 0; jf < 3; jf++) {
        var fr = cardF.frases[jf];
        if (fr) mide(fr, LIM.frase, (ES ? "frase " : "phrase ") + (jf + 1));
        if (!fr || !fr.md) rojo((ES ? "la acción " : "action ") + (jf + 1) + (ES ? " no revela nada" : " reveals nothing"));
      }
      if (cardF.frases.length > 3) ambar(ES ? "sobran textos: la animación hace 3 acciones" : "extra texts: the animation does 3 actions");
    } else if (cardF.tipo === "escena") {
      /* (sin entradilla que medir desde 2026-09-02) */
      var fondos = (cfg.escenas && cfg.escenas.fondos) || {};
      var posesA = (cfg.escenas && cfg.escenas.poses) || {};
      if (cardF.vinetas.length < 1 || cardF.vinetas.length > 3) ambar(ES ? "1-3 viñetas" : "1-3 panels");
      cardF.vinetas.forEach(function (v, j) {
        mide(v.texto, LIM.vineta, (ES ? "viñeta " : "panel ") + (j + 1));
        if (!v.texto.md) rojo((ES ? "viñeta muda: la " : "silent panel: ") + (j + 1));
        if (!fondos[v.fondo]) rojo((ES ? "fondo desconocido en viñeta " : "unknown background in panel ") + (j + 1));
        else if (!fondos[v.fondo].anclas[v.ancla]) rojo((ES ? "ancla desconocida en viñeta " : "unknown anchor in panel ") + (j + 1));
        if (!posesA[v.pose]) rojo((ES ? "pose desconocida en viñeta " : "unknown pose in panel ") + (j + 1));
      });
    } else if (cardF.tipo === "puertas") {
      mide(cardF.enunciado, LIM.enunciado, ES ? "enunciado" : "prompt");
      if (cardF.opciones.length > 3) ambar(ES ? "máximo 3 puertas" : "max 3 doors");
      cardF.opciones.forEach(function (op, j) {
        mide(op.texto, LIM.opcion, (ES ? "puerta " : "door ") + (j + 1));
        mide(op.feedback, LIM.feedback, (ES ? "consecuencia " : "consequence ") + (j + 1));
        if (!op.feedback.md) rojo((ES ? "puerta sin consecuencia: la " : "door with no consequence: ") + (j + 1));
      });
    } else if (cardF.tipo === "apuesta") {
      mide(cardF.enunciado, LIM.enunciado, ES ? "enunciado" : "prompt");
      cardF.opciones.forEach(function (op, j) {
        mide(op.texto, LIM.opcion, (ES ? "opción " : "option ") + (j + 1));
        mide(op.feedback, LIM.feedback, "feedback " + (j + 1));
        if (!op.feedback.md) rojo((ES ? "opción sin feedback: la " : "option with no feedback: ") + (j + 1));
      });
    } else if (cardF.cuerpo) {
      mide(cardF.cuerpo, LIM.cuerpo, ES ? "texto" : "text");
      if (!cardF.cuerpo.md) rojo(ES ? "tarjeta sin texto" : "card with no text");
    }
    return av;
  }

  /* Solo los topes de largo de una capa de misión (para idiomas añadidos:
     la estructura ya se juzgó en el base y es la misma). */
  function avisosLargo(capaM) {
    var av = [];
    (capaM.cards || []).forEach(function (c, ix) {
      avisosDeCard(c).forEach(function (a) {
        if (a.n === "ambar") av.push({ n: "ambar", t: (ES ? "tarjeta " : "card ") + (ix + 1) + ": " + a.t });
      });
    });
    return av;
  }

  function textosAvisos(av) {
    var rojos = av.filter(function (a) { return a.n === "rojo"; });
    var ambares = av.filter(function (a) { return a.n === "ambar"; });
    var partes = [];
    if (rojos.length) partes.push("⛔ " + rojos.map(function (a) { return a.t; }).join(" · "));
    if (ambares.length) partes.push("⚠ " + ambares.map(function (a) { return a.t; }).join(" · "));
    return partes.join("  ");
  }

  /* Los avisos de una MISIÓN entera (tarjetas + molde de examen + prohibidas). */
  function avisosDeMision(m, capaM, lang) {
    var av = [];
    capaM.cards.forEach(function (cf, ix) {
      avisosDeCard(cf).forEach(function (a) {
        av.push({ n: a.n, t: (ES ? "tarjeta " : "card ") + (ix + 1) + ": " + a.t, k: ix });
      });
    });
    if (m.kind === "exam") {
      var nQuiz = capaM.cards.filter(function (c) { return c.tipo === "quiz"; }).length;
      if (nQuiz !== 6) av.push({ n: "rojo", t: ES ? "el molde del examen pide 6 preguntas (hay " + nQuiz + ")" : "the exam mold takes 6 questions (there are " + nQuiz + ")" });
    }
    var prohibidas = MFEscuela.compilar.FRASES_PROHIBIDAS[lang || langVista] || [];
    var todo = JSON.stringify(capaM.cards).toLowerCase();
    prohibidas.forEach(function (fr) {
      if (todo.indexOf(fr) >= 0) av.push({ n: "ambar", t: (ES ? "frase prohibida del brief: «" : "forbidden brief phrase: “") + fr + (ES ? "»" : "”") });
    });
    if (desfasada(m)) av.push({ n: "ambar", t: ES ? "↻ EN desfasado: el ES cambió tras traducir" : "↻ EN out of date: ES changed after translation" });
    /* La tarjeta es UNA: si dos idiomas traen estructura distinta, el dato
       llegó torcido (importado o de un borrador viejo) y hay que arreglarlo —
       cualquier edición en el idioma bueno lo sincroniza solo. */
    if (MFEscuela.compilar.estructuraDivergente(m, idiomaBaseActivo)) {
      av.push({ n: "rojo", t: T.estructuraDivergente });
    }
    return av;
  }

  function nDesfasadas(clave, lg) {
    var curso = modelo.fuente.cursos[clave];
    if (!curso) return 0;
    var n = 0;
    curso.misiones.forEach(function (m) { if (desfasada(m, lg)) n++; });
    curso.pergaminos.forEach(function (p) { if (desfasada(p, lg)) n++; });
    return n;
  }

  /* ---------------------------------------------------------- pantallas --- */

  function barra(migas) {
    var rB = ruta();
    var nDesf = rB.curso ? nDesfasadas(rB.curso) : 0;
    /* Los idiomas son DEL CURSO (docs/11): chip del base + añadidos + «+»
       para pedir uno nuevo. Un añadido aún sin traducir sale con ⏳. Fuera de
       un curso no hay nada que conmutar y no se pintan chips. */
    var cursoB = rB.curso ? capaCurso(rB.curso) : null;
    var listaLg = cursoB ? MFEscuela.compilar.idiomasDe(cursoB) : [];
    var chips = listaLg.map(function (lg) {
      var esBase = lg === MFEscuela.compilar.baseDe(cursoB);
      var conCapa = esBase || !!(cursoB[lg]) || cursoB.misiones.some(function (m) { return !!m[lg]; });
      var nD = esBase ? 0 : nDesfasadas(rB.curso, lg);
      var badge = nD
        ? '<span class="escuela-badge" title="' + esc(nD + (ES ? " piezas con el base cambiado tras traducir" : " pieces where the base changed after translation")) + '">' + nD + "</span>"
        : (conCapa ? "" : '<span class="escuela-badge" title="' + esc(ES ? "pendiente de traducir" : "pending translation") + '">⏳</span>');
      return '<button type="button" class="escuela-idioma' + (langVista === lg ? " is-on" : "") +
        '" data-lg="' + lg + '" data-con-capa="' + (conCapa ? "1" : "") + '">' + lg.toUpperCase() + badge + "</button>";
    }).join("");
    if (cursoB && puedeEditar) {
      chips += selloBoton("mas", "data-mas-idioma", T.anadirIdioma, false, "escuela-idioma-mas");
    }
    return '<div class="escuela-barra">' +
      '<nav class="escuela-migas">' + migas.map(function (m, i) {
        return m.href && i < migas.length - 1
          ? '<a href="' + esc(m.href) + '">' + esc(m.t) + "</a>"
          : "<b>" + esc(m.t) + "</b>";
      }).join(' <span aria-hidden="true">›</span> ') + "</nav>" +
      '<span class="escuela-guardado" data-guardado hidden></span>' +
      '<span class="escuela-idiomas">' + chips + "</span></div>";
  }

  function estadoCurso(curso) {
    var pub = (curso.status || "published") === "published";
    return '<span class="escuela-pill ' + (pub ? "is-pub" : "is-borr") + '">' + (pub ? T.publicado : T.borrador) + "</span>";
  }

  /* La Senda del Constructor: cinco cintas que se ganan construyendo. */
  function sendaDe(curso) {
    var logros = [];
    var algunaJugable = curso.misiones.some(function (m) {
      var mc = capa(m);
      return mc && mc.cards.length && !avisosDeMision(m, mc).some(function (a) { return a.n === "rojo"; });
    });
    var nivelCompleto = false;
    for (var n = 1; n <= 8; n++) {
      var delNivel = curso.misiones.filter(function (m) { return m.nivel === n; });
      if (!delNivel.length || !delNivel.some(function (m) { return m.kind === "exam"; })) continue;
      if (delNivel.every(function (m) { var mc = capa(m); return mc && !avisosDeMision(m, mc).some(function (a) { return a.n === "rojo"; }); })) {
        nivelCompleto = true;
        break;
      }
    }
    logros.push({ ok: true, t: ES ? "arte fundada" : "art founded", c: "white" });
    logros.push({ ok: algunaJugable, t: ES ? "primera misión jugable" : "first playable mission", c: "yellow" });
    logros.push({ ok: nivelCompleto, t: ES ? "un nivel completo con examen" : "a full level with exam", c: "green" });
    logros.push({ ok: (curso.status || "") === "published", t: ES ? "publicada" : "published", c: "purple" });
    logros.push({ ok: nDesfasadasCurso(curso) === 0 && curso.misiones.every(function (m) { return m.en; }),
                  t: ES ? "bilingüe al día" : "bilingual up to date", c: "black" });
    return '<span class="escuela-senda">' + logros.map(function (l) {
      return '<span class="escuela-senda__cinta' + (l.ok ? " is-ok" : "") + '" style="--belt:' +
        esc(BELT_COLOR[l.c] || "#888") + '" title="' + esc(l.t + (l.ok ? " ✓" : " — " + (ES ? "pendiente" : "pending"))) + '"></span>';
    }).join("") + "</span>";
  }
  function nDesfasadasCurso(curso) {
    var n = 0;
    curso.misiones.forEach(function (m) { if (desfasada(m)) n++; });
    curso.pergaminos.forEach(function (p) { if (desfasada(p)) n++; });
    return n;
  }

  function vArtes() {
    var claves = Object.keys(modelo.fuente.cursos);
    var tarjetas = claves.map(function (clave) {
      var curso = capaCurso(clave), c = capa(curso);
      var nivelesCon = 0;
      for (var n = 1; n <= 8; n++) {
        if (curso.misiones.some(function (m) { return m.nivel === n; })) nivelesCon++;
      }
      var nMis = curso.misiones.filter(function (m) { return m.kind !== "exam"; }).length;
      return '<a class="escuela-curso" href="#/' + esc(clave) + '">' +
        '<span class="escuela-curso__icono">' + esc((curso.es && curso.es.icon) || "🥋") + "</span>" +
        "<h3>" + esc(c.title) + "</h3>" +
        '<span class="escuela-curso__cat">' + esc((curso.categoria || "bienestar").toUpperCase()) + "</span>" +
        sendaDe(curso) +
        '<span class="escuela-curso__datos">' + nivelesCon + " " + T.niveles + " · " + nMis + " " + T.misiones + "</span>" +
        '<span class="escuela-curso__estado">' + estadoCurso(curso) + "</span></a>";
    }).join("");
    /* El cupo del regalo: 1 curso; más cursos y lo público son de Maestro Fu. */
    var cupoLleno = modelo.origen === "sb" && modelo.rol === "student" && claves.length >= 1;
    var fundar = cupoLleno
      ? '<div class="escuela-curso escuela-curso--fundar"><span class="escuela-curso__icono">🥋</span>' +
        "<h3>" + esc(ES ? "Tu regalo ya está en uso" : "Your gift is in use") + "</h3>" +
        '<small>印 ' + esc(ES ? "Hazte Maestro Fu para fundar más artes y publicarlas en abierto (próximamente)" : "Become a Fu Master to found more arts and publish them openly (coming soon)") + "</small></div>"
      : '<button type="button" class="escuela-curso escuela-curso--fundar" data-fundar>' +
        '<span class="escuela-curso__icono">＋</span>' +
        "<h3>" + esc(T.fundar) + "</h3><small>" +
        esc(ES ? "1 curso gratis con tu cuenta, privado y para siempre" : "1 free course with your account, private and forever") + "</small></button>";
    return barra([{ t: T.titulo }]) +
      "<h2 class='escuela-h2'>" + esc(T.misArtes) + "</h2>" +
      '<div class="escuela-cursos">' + tarjetas + fundar + "</div>";
  }

  function vPortada(clave) {
    var curso = capaCurso(clave);
    if (!curso) return vArtes();
    var c = capa(curso);
    /* La escalera son los niveles que EXISTEN, no ocho huecos fijos: se quitan
       y se añaden desde aquí (tope 8, el número de cinturones). Cada peldaño se
       anuncia con la LÁMINA de su cinturón, que es lo que el alumno reconoce. */
    var altura = alturaCurso(curso);
    var arteB = cfg.gameArt || {};
    var filas = "";
    for (var n = 1; n <= altura; n++) {
      var nivel = curso.niveles[String(n)];
      var nc = nivel && capa(nivel);
      var mis = curso.misiones.filter(function (m) { return m.nivel === n && m.kind !== "exam"; });
      var examen = curso.misiones.some(function (m) { return m.nivel === n && m.kind === "exam"; });
      var beltK = (nivel && nivel.belt) || MFEscuela.compilar.BELTS[n - 1];
      var lam = arteB["belt-" + beltK];
      var vacio = !mis.length && !examen;
      /* Los avisos del NIVEL, sumados de sus misiones (titular 2026-09-03):
         desde la portada se ve en qué peldaño está el problema, sin abrir uno
         por uno. Se juzgan sobre el idioma base, como la checklist. */
      var avN = [];
      curso.misiones.forEach(function (m) {
        if (m.nivel !== n) return;
        var mcN = m[MFEscuela.compilar.baseDe(curso)];
        if (!mcN) return;
        avisosDeMision(m, mcN, MFEscuela.compilar.baseDe(curso)).forEach(function (a) {
          avN.push({ n: a.n, t: mcN.title + ": " + a.t });
        });
      });
      var rojosN = avN.filter(function (a) { return a.n === "rojo"; }).length;
      var ojoN = avN.length
        ? '<span class="escuela-nodo__ojo' + (rojosN ? " is-rojo" : "") + '" title="' +
          esc(avN.slice(0, 6).map(function (a) { return (a.n === "rojo" ? "⛔ " : "⚠ ") + a.t; }).join(" · ") +
              (avN.length > 6 ? " · +" + (avN.length - 6) : "")) + '">' + (rojosN || avN.length) + "</span>"
        : "";
      filas += '<div class="escuela-nodo-fila">' +
        '<a class="escuela-nodo' + (vacio ? " is-niebla" : "") + '" href="#/' + esc(clave) + "/n/" + n + '">' +
        (lam ? '<img class="escuela-cinta-lam" src="' + esc((cfg.assets || "") + lam) + '" alt="" width="256" height="256" loading="lazy" decoding="async">'
             : '<span class="escuela-cinta" style="--belt:' + esc(BELT_COLOR[beltK] || "#888") + '"></span>') +
        '<span class="escuela-nodo__tit">' + esc(nc ? nc.title : "Nivel " + n) + "</span>" +
        '<span class="escuela-nodo__datos">' +
        (vacio ? esc(T.sinMisiones)
               : mis.length + " " + (mis.length === 1 ? T.misione : T.misiones) + (examen ? " + " + T.examen.toLowerCase() : "")) +
        "</span>" + ojoN + "</a>" +
        (puedeEditar && altura > 1 ? botonCerrar('data-quitar-nivel="' + n + '"', T.quitarNivel) : "") +
        "</div>";
    }
    if (puedeEditar) {
      /* Con los ocho puestos no se dice nada: el «+» simplemente no está, y
         eso ya lo cuenta (titular 2026-09-03, fuera las leyendas punteadas). */
      if (altura < 8) {
        filas += '<button type="button" class="escuela-nodo escuela-nodo--mas" data-mas-nivel>' + esc(T.anadirNivel) + "</button>";
      }
    }
    var nPerg = curso.pergaminos.length;
    var publicar = puedeEditar
      ? '<a class="escuela-probar" href="#/' + esc(clave) + '/publicar">印 ' + esc(ES ? "Revisar y publicar" : "Review & publish") + "</a>"
      : "";
    /* Acceso del curso (F6): visibilidad, código de acceso y código de curso.
       Solo con Supabase (en local, un sello honesto). CulpaFu y los artes
       clásicos no llevan fila de acceso: su curso vive abierto como siempre. */
    var acceso = "";
    if (puedeEditar) {
      if (modelo.origen !== "sb") {
        acceso = '<p class="escuela-nota">印 ' + esc(ES ? "visibilidad y códigos viven en el sitio real" : "visibility and codes live on the real site") + "</p>";
      } else {
        var priv = (curso.visibilidad || "privado") === "privado";
        var soloMaestros = modelo.rol === "student";
        acceso = '<div class="escuela-acceso">' +
          '<button type="button" class="escuela-idioma' + (!priv ? " is-on" : "") + '" data-visibilidad="publico"' +
          (soloMaestros ? ' disabled title="' + esc(ES ? "publicar en abierto es de Maestros Fu" : "open publishing is for Fu Masters") + '"' : "") + ">🌐 " + esc(ES ? "Público" : "Public") + "</button>" +
          '<button type="button" class="escuela-idioma' + (priv ? " is-on" : "") + '" data-visibilidad="privado">🔒 ' + esc(ES ? "Privado" : "Private") + "</button>" +
          (priv ? '<input class="curso-candado__campo escuela-acceso__codigo" type="text" maxlength="40" placeholder="' +
            esc(ES ? "código de acceso" : "access code") + '" value="' + esc(curso.codigo_acceso || "") + '">' +
            '<button type="button" class="escuela-chip escuela-chip--ed" data-guardar-codigo>' + esc(ES ? "guardar código" : "save code") + "</button>" : "") +
          (curso.codigo_curso ? '<span class="escuela-chip" title="' + esc(ES ? "el código del buscador: compártelo" : "the directory code: share it") + '">#' + esc(curso.codigo_curso) + "</span>"
            : '<span class="escuela-chip">' + esc(ES ? "el código de curso se acuña al publicar" : "the course code is minted on publish") + "</span>") +
          "</div>";
      }
    }
    return barra([{ t: T.titulo, href: "#/" }, { t: c.title }]) +
      '<header class="escuela-hero"><h2>' + esc(c.title) + "</h2>" + estadoCurso(curso) + publicar +
      (c.description ? '<p class="escuela-hero__lead">' + esc(c.description) + "</p>" : "") + "</header>" +
      acceso +
      '<div class="escuela-mapa">' + filas + "</div>" +
      '<div class="escuela-salas">' +
      '<a class="escuela-sala" href="#/' + esc(clave) + '/pergaminos">📜 ' + esc(T.salaPergaminos) + " <b>" + nPerg + "</b></a>" +
      '<span class="escuela-sala is-sola">🏮 ' + esc(T.salaRetos) + " <small>" + esc(T.seGeneraSola) + "</small></span>" +
      (puedeEditar ? '<a class="escuela-sala" href="#/' + esc(clave) + '/papelera">🗑 ' + esc(ES ? "Papelera" : "Trash") + "</a>" : "") +
      (puedeEditar && modelo.origen === "sb"
        ? '<a class="escuela-sala" href="#/' + esc(clave) + '/estudiantes">👥 ' + esc(ES ? "Mis estudiantes" : "My students") + "</a>" : "") +
      "</div>";
  }

  /* Los estudiantes del curso (F6, solo Supabase): quién entró, su avance en
     este arte y la puerta de exclusión. */
  function vEstudiantes(clave) {
    var curso = capaCurso(clave);
    if (!curso) return vArtes();
    var c = capa(curso);
    if (modelo.origen === "sb") {
      SB.rpc("escuela_mis_estudiantes", { p_clave: clave }).then(function (lista) {
        var cont = raiz.querySelector("[data-estudiantes]");
        if (!cont) return;
        if (!lista || !lista.length) {
          cont.innerHTML = '<p class="escuela-nota">' + esc(ES ? "Aún no ha entrado nadie." : "Nobody has entered yet.") + "</p>";
          return;
        }
        cont.innerHTML = lista.map(function (e2) {
          var arte = e2.arte || {};
          var nMis = Object.keys(arte.missions || {}).length;
          var nBelts = Object.keys(arte.belts || {}).length;
          return '<div class="escuela-chk__fila">👤 <span>' + esc(e2.nombre || e2.email || e2.uid.slice(0, 8)) + "</span>" +
            '<span class="escuela-chk__detalle">' + nMis + " " + T.misiones + " · " + nBelts + " 🥋 · " +
            esc(e2.ultimaVez || "") + "</span>" +
            (e2.acceso ? '<button type="button" class="escuela-chk__ir" data-excluir="' + esc(e2.uid) + '">' +
              esc(ES ? "excluir" : "revoke") + "</button>" : "") + "</div>";
        }).join("");
      }, function () {
        var cont = raiz.querySelector("[data-estudiantes]");
        if (cont) cont.innerHTML = '<p class="escuela-avisos">⚠ ' + esc(T.errorCarga) + "</p>";
      });
      /* Mentoría (por existencia de la llave): los alumnos que agregaron TU
         email a su lista de maestros aparecen aquí al instante, con su
         avance completo — y desaparecen igual de rápido si te quitan. */
      SB.rpc("escuela_mis_mentoreados").then(function (lista) {
        var cont = raiz.querySelector("[data-mentoreados]");
        if (!cont) return;
        if (!lista || !lista.length) {
          cont.innerHTML = '<p class="escuela-nota">' + esc(ES ? "Nadie te ha autorizado como mentor todavía." : "Nobody has authorized you as a mentor yet.") + "</p>";
          return;
        }
        cont.innerHTML = lista.map(function (e2) {
          var pr = e2.progreso || {};
          var artes = Object.keys(pr.arts || {}).length;
          return '<div class="escuela-chk__fila">🤝 <span>' + esc(e2.nombre || e2.email) + "</span>" +
            '<span class="escuela-chk__detalle">' + (pr.xp || 0) + " XP · " + artes + " " +
            esc(ES ? "artes" : "arts") + " · " + esc((ES ? "desde " : "since ") + (e2.desde || "")) + "</span></div>";
        }).join("");
      }, function () { /* sin mentoreados no se rompe nada */ });
    }
    return barra([{ t: T.titulo, href: "#/" }, { t: c.title, href: "#/" + clave }, { t: ES ? "Mis estudiantes" : "My students" }]) +
      '<header class="escuela-hero"><h2>👥 ' + esc(ES ? "Mis estudiantes" : "My students") + "</h2></header>" +
      (modelo.origen === "sb"
        ? '<div class="escuela-chk" data-estudiantes>' + (window.MFCargador ? MFCargador("…") : "…") + "</div>" +
          "<h2 class='escuela-h2'>🤝 " + esc(ES ? "Por mentoría (te autorizaron)" : "By mentorship (they authorized you)") + "</h2>" +
          '<div class="escuela-chk" data-mentoreados></div>'
        : '<div class="escuela-pronto"><span class="escuela-sello">印</span><p>' +
          esc(ES ? "el seguimiento vive en el sitio real" : "tracking lives on the real site") + "</p></div>");
  }

  function ritmo(cards) {
    return cards.map(function (c) { return ICONO[c.tipo] || "▫️"; }).join("");
  }

  function vNivel(clave, n) {
    var curso = capaCurso(clave);
    if (!curso) return vArtes();
    var c = capa(curso);
    var nivel = curso.niveles[String(n)];
    var nc = nivel && capa(nivel);
    var color = BELT_COLOR[(nivel && nivel.belt) || ""] || "#888";
    var filas = curso.misiones.filter(function (m) { return m.nivel === n; }).map(function (m) {
      var mc = capa(m);
      if (!mc) return "";
      var avs = avisosDeMision(m, mc);
      var rojos = avs.filter(function (a) { return a.n === "rojo"; }).length;
      return '<a class="escuela-fila" href="#/' + esc(clave) + "/m/" + esc(m.id) + '">' +
        (m.kind === "exam" ? '<span class="escuela-fila__icono">🏮</span>' : '<span class="escuela-fila__icono">🎴</span>') +
        '<span class="escuela-fila__tit">' + esc(mc.title) + "</span>" +
        (m.creada ? '<span class="escuela-chip escuela-chip--ambar" title="' +
          esc(ES ? "misión nueva: su página estática pide un rebuild del titular" : "new mission: its static page needs a rebuild") + '">🧱</span>' : "") +
        (desfasada(m) ? '<span class="escuela-chip escuela-chip--ambar" title="' +
          esc(ES ? "EN desfasado: el ES cambió tras traducir" : "EN out of date: ES changed after translation") + '">↻</span>' : "") +
        (avs.length ? '<span class="escuela-ojo' + (rojos ? " escuela-ojo--rojo" : "") + '" title="' +
          esc(avs.map(function (a) { return a.t; }).join(" · ").slice(0, 300)) + '">' + avs.length + "</span>" : "") +
        '<span class="escuela-fila__datos"><span class="escuela-ritmo">' + ritmo(mc.cards) + "</span> " +
        mc.cards.length + " " + T.tarjetas + "</span>" +
        (puedeEditar ? '<span class="escuela-quitar" role="button" tabindex="0" data-borrar-mision="' + esc(m.id) + '" title="' +
          esc(ES ? "borrar (papelera 30 días con Supabase)" : "delete (30-day trash with Supabase)") + '">🗑</span>' : "") +
        "</a>";
    }).join("");
    var crear = "";
    if (puedeEditar) {
      var hayExamen = curso.misiones.some(function (m) { return m.nivel === n && m.kind === "exam"; });
      crear = '<div class="escuela-salas">' +
        '<button type="button" class="escuela-sala" data-nueva-mision="' + n + '">＋ ' + esc(ES ? "Misión" : "Mission") + "</button>" +
        (hayExamen ? "" : '<button type="button" class="escuela-sala" data-nuevo-examen="' + n + '">＋ 🏮 ' + esc(T.examen) + "</button>") +
        "</div>";
    }
    /* Editable SOLO el dominio: el «Nivel N —» se pinta aparte y no se toca. */
    var tituloN = (nc && nc.title) || ("Nivel " + n);
    var domN = dominioDeNivel(tituloN);
    var cabezaN = puedeEditar
      ? '<h2 class="escuela-titulo-nivel"><span class="escuela-titulo-nivel__fijo">' +
        esc((langVista === "en" ? "Level " : "Nivel ") + n + " — ") + "</span>" +
        '<input class="escuela-titulo-nivel__campo" type="text" maxlength="20" spellcheck="false"' +
        ' data-dominio-nivel="' + n + '" value="' + esc(domN) + '" placeholder="' +
        esc(T.dominioNivel) + '" title="' + esc(T.dominioPorque) + '"></h2>' +
        '<span class="escuela-campo__porque">' + esc(T.dominioPorque) + "</span>" +
        /* Un arte IMPORTADO tiene páginas de nivel propias (las genera build.py
           y Tu Escuela no las publica: F0 limita la publicación a kind ≠ page).
           Se reconoce por su ruta, que no es la que pone la casa. Decirlo aquí
           evita prometer un cambio que esas páginas no van a enseñar. */
        (nc && !/^(nivel|level)-\d+$/.test(nc.slug || "")
          ? '<span class="escuela-avisos">⚠ ' + esc(T.dominioHeredado) + "</span>" : "")
      : "<h2>" + esc(tituloN) + "</h2>";
    return barra([{ t: T.titulo, href: "#/" }, { t: c.title, href: "#/" + clave }, { t: tituloN }]) +
      '<header class="escuela-hero escuela-hero--nivel">' +
      '<span class="escuela-cinta escuela-cinta--grande" style="--belt:' + esc(color) + '"></span>' +
      cabezaN +
      (nc && nc.description ? '<p class="escuela-hero__lead">' + esc(nc.description) + "</p>" : "") +
      "</header><div class='escuela-lista'>" + filas + "</div>" + crear;
  }

  /* --- detalle de tarjeta: el contenido real, editable donde toca --- */

  /* Una opción es un BLOQUE FLUIDO, no una fila de chips: cada dato lleva su
     rótulo encima —que dice dónde se ve— y ocupa el ancho entero. Los dos
     textos no son lo mismo y confundirlos era fácil: la respuesta completa es
     la que se lee en el quiz clásico; la etiqueta corta es la que cabe en una
     teja, un talismán o un puntal, o sea la que se ve DENTRO del juego. */
  function htmlOpciones(cardF, tipo, base) {
    /* El TIPO de la pregunta se deriva del dato: con orden es de «orden
       correcto» (secuencia); sin orden, de «respuesta única». Es el mismo
       criterio que usan los juegos (necesita orden / sinorden). */
    var enSecuencia = cardF.opciones.some(function (o) { return typeof o.orden === "number"; });
    var usados = {};
    cardF.opciones.forEach(function (o) {
      if (typeof o.orden === "number") usados[o.orden] = true;
    });
    return cardF.opciones.map(function (op, j) {
      var rOp = base + ".opciones." + j;
      var esQuiz = tipo === "quiz" || tipo === "choice";
      var cab = "", cuerpo = "";
      if (esQuiz) {
        /* El sello de la correcta se DICE, no se insinúa: antes era un círculo
           mudo que nadie sabía leer (titular 2026-09-02). */
        /* En secuencia manda el ORDEN y nada más: la «correcta» ni se toca ni
           se nombra (titular 2026-09-02). El dato sigue existiendo por debajo
           —el paso 1 lo lleva, y el editor lo mueve solo al reordenar— porque
           el motor y el quiz de respaldo lo necesitan, pero el maestro no
           tiene que pensar en él: lo que decide es la secuencia. */
        cab = enSecuencia
          ? '<span class="escuela-op__rotulo">👊 ' + esc(T.pasoDe) + " " +
            (typeof op.orden === "number" ? op.orden : "—") + "</span>"
          : (puedeEditar
            ? '<button type="button" class="escuela-correcta' + (op.correct ? " is-on" : "") +
              '" data-correcta="' + j + '"><span class="escuela-correcta__marca" aria-hidden="true">✓</span>' +
              esc(op.correct ? T.esCorrecta : T.marcarCorrecta) + "</button>"
            : (op.correct ? '<span class="escuela-correcta is-on"><span class="escuela-correcta__marca" aria-hidden="true">✓</span>' + esc(T.esCorrecta) + "</span>" : ""));
        /* Una pregunta lleva 3 opciones fijas (titular 2026-09-02): el aspa
           solo aparece como REPARACIÓN cuando una tarjeta vieja trae de más. */
        if (puedeEditar && cardF.tipo !== "choice" && cardF.opciones.length > 3) {
          cab += botonCerrar("data-quitar-op=\"" + j + "\"", T.quitarOpcion2);
        }
        if (puedeEditar && cardF.tipo === "choice" && cardF.opciones.length > 2) {
          cab += botonCerrar("data-quitar-op=\"" + j + "\"", T.quitarOpcion2);
        }
      }
      if (tipo === "apuesta" && op.correct) cab += '<span class="escuela-chip">★ ' + esc(T.laDelCurso) + "</span>";
      /* Aquí no hay quiz clásico: las preguntas SE JUEGAN (titular 2026-09-02),
         y en un juego lo que se lee es la etiqueta de la teja. Por eso el
         texto largo desaparece del formulario y la respuesta es la corta. */
      if (esQuiz) {
        /* Sin porqué: el rótulo ya dice lo que es y la línea sobraba en una
           tarjeta que se lee de un vistazo (titular 2026-09-02). */
        cuerpo += zona(esc(op.corta || ""), { ruta: rOp + ".corta", modo: "plano", tope: LIM.corta,
          rotulo: T.rotCorta });
        /* El orden solo existe en las preguntas de orden correcto: en las de
           respuesta única los controles DESAPARECEN y el dato queda en blanco
           (titular 2026-09-02). */
        if (enSecuencia) cuerpo += selectorOrden(op, j, cardF.opciones.length, usados);
      } else {
        cuerpo += zona(R(op.texto.html), { ruta: rOp + ".texto", modo: "inline", filas: 2, tope: LIM.opcion,
          porque: T.porque.opcion });
      }
      /* Sin plegable ni resumen: el rótulo del campo ya dice qué es y cuándo
         se ve, y repetirlo en un «summary» era ruido. */
      var fb = '<div class="escuela-fb"><div>' +
        zona(R(op.feedback.html), { ruta: rOp + ".feedback", modo: "inline", filas: 3, tope: LIM.feedback,
          rotulo: esQuiz ? T.rotAclaracion : T.feedbackDe, porque: esQuiz ? null : T.porque.feedback }) +
        "</div></div>";
      if (!puedeEditar && !(op.feedback && op.feedback.html)) fb = "";
      return '<li class="escuela-op">' +
        (cab ? '<div class="escuela-op__cab">' + cab + "</div>" : "") +
        cuerpo + fb + "</li>";
    }).join("");
  }

  /* El orden es un desplegable y no una casilla libre. Con las 3 opciones
     fijas todos los números están siempre repartidos, así que vetar los
     tomados dejaría el orden INMUTABLE: elegir el número de otra opción las
     INTERCAMBIA (ella hereda el tuyo). El 1·2·3 viene ya puesto de fábrica. */
  function selectorOrden(op, j, n, usados) {
    if (!puedeEditar) {
      return typeof op.orden === "number"
        ? '<p class="escuela-dato"><b>' + esc(T.rotOrden) + ":</b> " + op.orden + "</p>" : "";
    }
    /* Mandatorio: sin opción de «sin orden». El hueco solo asoma, apagado,
       si una tarjeta vieja llega rota (y el aviso rojo pide completarla). */
    var opts = typeof op.orden === "number" ? "" : '<option value="" disabled selected>—</option>';
    for (var k = 1; k <= Math.max(3, n); k++) {
      opts += '<option value="' + k + '"' + (op.orden === k ? " selected" : "") + ">" + k +
        (usados[k] && op.orden !== k ? " (" + esc(T.ordenCambia) + ")" : "") + "</option>";
    }
    return '<span class="escuela-campo"><label class="escuela-campo__rotulo" for="orden' + j + '">' +
      esc(T.rotOrden) + "</label>" +
      '<select class="escuela-campo__control" id="orden' + j +
      '" data-orden="' + j + '">' + opts + "</select></span>";
  }

  /* El aspa de los modales, en pequeño: el mismo sello para cerrar y quitar. */
  function botonCerrar(attrs, titulo) {
    return '<button type="button" class="escuela-cerrar-mini" ' + attrs + ' title="' + esc(titulo) +
      '" aria-label="' + esc(titulo) + '"><img src="' + (cfg.assets || "") +
      'assets/img/game/cerrar.webp" alt="" width="256" height="255" decoding="async"></button>';
  }

  /* La viñeta se decide MIRANDO: el texto se edita en el bocadillo, las
     anclas son huellas tocables sobre la lámina, y fondo/pose abren su
     catálogo de miniaturas reales. Sin editor, es la vista de siempre. */
  function vinetaEditable(v, j, base, cardF) {
    var fondos = (cfg.escenas && cfg.escenas.fondos) || {};
    var poses = (cfg.escenas && cfg.escenas.poses) || {};
    var f = fondos[v.fondo];
    var ancla = f && f.anclas && f.anclas[v.ancla];
    var img = f ? cfg.assets + "assets/img/" + f.ruta : "";
    var lam = poses[v.pose] ? cfg.assets + "assets/img/" + poses[v.pose] : "";
    var miraAqui = typeof v.flip === "boolean" ? v.flip : !!(ancla && ancla.flip);
    var estilo = ancla ? "left:" + ancla.x + "%;bottom:" + (100 - ancla.y) + "%;" +
      "height:" + (44 * (ancla.e || 1)) + "%;"   /* mismo 44 % que el juego */ + (miraAqui ? "transform:translateX(-50%) scaleX(-1);" : "") : "";
    var huellas = "";
    if (puedeEditar && f && f.anclas) {
      huellas = Object.keys(f.anclas).map(function (nombre) {
        var a = f.anclas[nombre];
        return '<button type="button" class="escuela-huella' + (nombre === v.ancla ? " is-on" : "") +
          '" data-ancla="' + j + ":" + esc(nombre) + '" style="left:' + a.x + "%;bottom:" + (100 - a.y) + '%" title="' +
          esc((ES ? "pisa en " : "stand at ") + nombre) + '"></button>';
      }).join("");
    }
    /* Hacia dónde mira: la viñeta manda si trae `flip`; si no, lo propone el
       ancla. El icono es una flecha circular — girar, no mover. */
    var mira = typeof v.flip === "boolean" ? v.flip : !!(ancla && ancla.flip);
    var botones = puedeEditar
      ? '<span class="escuela-vineta__botones">' +
        '<button type="button" class="escuela-vineta__girar" data-girar="' + j + '" title="' +
        esc(ES ? "girar: ahora mira a la " + (mira ? "derecha" : "izquierda") : "flip: now facing " + (mira ? "right" : "left")) + '">' +
        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M3.5 12a8.5 8.5 0 0 1 14.3-6.2"></path><path d="M20.5 12a8.5 8.5 0 0 1-14.3 6.2"></path>' +
        '<path d="M18 2.2v3.9h-3.9"></path><path d="M6 21.8v-3.9h3.9"></path></svg></button>' +
        '<button type="button" data-cat="fondo:' + j + '" title="' + esc(ES ? "cambiar fondo" : "change background") + '">🖼</button>' +
        '<button type="button" data-cat="pose:' + j + '" title="' + esc(ES ? "cambiar pose" : "change pose") + '">🧍</button>' +
        '<button type="button" data-dup-vineta="' + j + '" title="' + esc(ES ? "duplicar viñeta" : "duplicate panel") + '">⧉</button>' +
        (cardF.vinetas.length > 1 ? '<button type="button" data-quitar-vineta="' + j + '" title="' + esc(ES ? "quitar viñeta" : "remove panel") + '">🗑</button>' : "") +
        "</span>"
      : "";
    /* La escena se dibuja dentro de un lienzo recortado; los controles cuelgan
       FUERA de él, a caballo del borde inferior izquierdo, para no robarle sitio
       al texto ni taparle la cara a la mascota. */
    return '<figure class="escuela-vineta">' +
      '<span class="escuela-vineta__lienzo">' +
      (img ? '<img class="escuela-vineta__fondo" src="' + esc(img) + '" alt="">' : "") +
      (lam ? '<img class="escuela-vineta__mascota" src="' + esc(lam) + '" alt="" style="' + esc(estilo) + '">' : "") +
      huellas +
      '<figcaption class="escuela-vineta__texto">' +
      zona(R(v.texto.html), { ruta: base + ".vinetas." + j + ".texto", modo: "inline", filas: 3, tope: LIM.vineta, porque: ES ? "cabe en el bocadillo" : "fits the speech bubble" }) +
      "</figcaption>" +
      '<span class="escuela-vineta__claves">' + esc(v.fondo) + " · " + esc(v.ancla) + " · " + esc(v.pose) + "</span>" +
      "</span>" + botones + "</figure>";
  }

  function primerFondo() {
    var claves = Object.keys((cfg.escenas && cfg.escenas.fondos) || {});
    return claves.length ? claves[0] : "";
  }
  function primeraAncla(fondo) {
    var f = cfg.escenas && cfg.escenas.fondos && cfg.escenas.fondos[fondo];
    var claves = f && f.anclas ? Object.keys(f.anclas) : [];
    return claves.length ? claves[0] : "";
  }

  /* El catálogo de fondos o poses, con miniaturas REALES. */
  function abrirCatalogo(tipo, vinIx) {
    var capaM = capa(misionActiva.m);
    var k = parseInt(raiz.querySelector("[data-carta]").getAttribute("data-carta"), 10);
    var cardF = capaM.cards[k];
    var fichas;
    if (tipo === "fondo") {
      var fondos = cfg.escenas.fondos;
      fichas = Object.keys(fondos).map(function (key) {
        return '<button type="button" class="escuela-catalogo__el" data-cat-el="' + esc(key) + '">' +
          '<img src="' + esc(cfg.assets + "assets/img/" + fondos[key].ruta) + '" alt="">' +
          "<b>" + esc(key) + "</b></button>";
      }).join("");
    } else {
      var poses = cfg.escenas.poses;
      fichas = Object.keys(poses).map(function (key) {
        return '<button type="button" class="escuela-catalogo__el escuela-catalogo__el--pose" data-cat-el="' + esc(key) + '">' +
          '<img src="' + esc(cfg.assets + "assets/img/" + poses[key]) + '" alt="">' +
          "<b>" + esc(key) + "</b></button>";
      }).join("");
    }
    var v = ventana({ panel: true,
      titulo: tipo === "fondo" ? "🖼 " + (ES ? "Fondo de la viñeta" : "Panel background")
                               : "🧍 " + (ES ? "Pose de la mascota" : "Mascot pose"),
      cuerpo: '<div class="escuela-catalogo">' + fichas + "</div>" });
    var cerrar = v.cerrar;
    v.cuerpo.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-cat-el]");
      if (!b) return;
      var vin = cardF.vinetas[vinIx];
      var key = b.getAttribute("data-cat-el");
      if (tipo === "fondo") {
        vin.fondo = key;
        var f = cfg.escenas.fondos[key];
        if (!f.anclas[vin.ancla]) vin.ancla = primeraAncla(key);
      } else {
        vin.pose = key;
      }
      marcarTocado();
      cerrar();
      rutear();
    });
  }

  /* (`lecturaCard` —la tarjeta en solo lectura— se fue con el espejo ES.) */

  function detalleCard(cardF, ix) {
    var t = cardF.tipo;
    var base = "cards." + ix;
    var cab = '<span class="escuela-tipo">' + (ICONO[t] || "") + " " + esc(nombreTipo(t)) + "</span>";
    /* El `@juego` NO se lista aquí: su medallón ya sale resaltado abajo, y
       repetirlo en un chip solo era ruido (titular 2026-09-02). */
    var clavesReto = cardF.reto ? Object.keys(cardF.reto).filter(function (k) { return k !== "juego"; }) : [];
    var reto = clavesReto.length
      ? '<div class="escuela-chips">' + clavesReto.map(function (k) {
          var v = cardF.reto[k];
          return '<span class="escuela-chip">@' + esc(k) + (v === true ? "" : ": " + esc(v)) + "</span>";
        }).join("") + "</div>" : "";
    var selloF3 = puedeEditar ? '<span class="escuela-sello escuela-sello--mini">印 ' + esc(T.soloF3) + "</span>" : "";

    if (t === "quiz" || t === "choice" || t === "apuesta" || t === "puertas") {
      var enun = zona(R(cardF.enunciado.html), { ruta: base + ".enunciado", modo: "bloque", filas: 2, tope: LIM.enunciado, porque: T.porque.enunciado });
      var tipoPreg = "";
      if (t === "quiz" && puedeEditar) {
        var esSec = cardF.opciones.some(function (o) { return typeof o.orden === "number"; });
        tipoPreg = '<div class="escuela-tipo-preg">' +
          '<span class="escuela-campo__rotulo">' + esc(T.tipoPregunta) + "</span>" +
          '<div class="escuela-juego__fila">' +
          '<button type="button" class="escuela-juego__btn' + (esSec ? "" : " is-on") + '" data-tipo-pregunta="unica">' + esc(T.tipoUnica) + "</button>" +
          '<button type="button" class="escuela-juego__btn' + (esSec ? " is-on" : "") + '" data-tipo-pregunta="orden">' + esc(T.tipoOrden) + "</button>" +
          "</div>" +
          '<span class="escuela-campo__porque">' + esc(esSec ? T.tipoOrdenPorque : T.tipoUnicaPorque) + "</span></div>";
      }
      var ops;
      if (t === "quiz" || t === "choice") ops = htmlOpciones(cardF, t, base);
      else if (t === "apuesta") ops = htmlOpcionesEleccion(cardF, base);
      else ops = htmlPuertas(cardF, base);
      var fbG = "";
      if (t === "quiz" || t === "choice") {
        fbG = '<div class="escuela-fb"><div>' +
          zona(R(cardF.feedback.html), { ruta: base + ".feedback", modo: "bloque", filas: 3, tope: LIM.feedback,
            rotulo: T.rotAclaracionG }) +
          "</div></div>";
      }
      var extra = "";
      if (t === "quiz" && puedeEditar && cardF.opciones.length < 3) {
        extra = '<button type="button" class="escuela-op escuela-op--mas" data-mas-op>' + esc(T.anadirOpcion) +
          " (" + esc(ES ? "una pregunta lleva 3" : "a question takes 3") + ")</button>";
      } else if (t === "choice" && puedeEditar && cardF.opciones.length < 6) {
        extra = '<button type="button" class="escuela-op escuela-op--mas" data-mas-op>' + esc(T.anadirOpcion) + " (máx. 6)</button>";
      }
      if (t === "puertas" && puedeEditar) {
        extra = cardF.opciones.length < 3
          ? '<button type="button" class="escuela-op escuela-op--mas" data-mas-puerta>+ ' + esc(ES ? "puerta" : "door") + "</button>"
          : '<li class="escuela-op escuela-op--sello"><span class="escuela-sello escuela-sello--mini">印 ' +
            esc(ES ? "3 puertas máximo: el alumno debe poder dudar, no abrumarse" : "3 doors max: the student should hesitate, not drown") + "</span></li>";
      }
      var sint = "";
      if (t === "puertas") {
        if (cardF.sintesis) {
          sint = '<p class="escuela-sintesis"><b>' + esc(T.sintesis) + ":</b> " +
            zona(R(cardF.sintesis.html), { ruta: base + ".sintesis", modo: "inline", tope: LIM.feedback, porque: T.porque.feedback }) +
            (puedeEditar ? ' <button type="button" class="escuela-quitar" data-quitar-sintesis title="' + esc(ES ? "quitar síntesis" : "remove synthesis") + '">✕</button>' : "") + "</p>";
        } else if (puedeEditar) {
          sint = '<button type="button" class="escuela-chip escuela-chip--ed" data-mas-sintesis>+ ' + esc(T.sintesis.toLowerCase()) + "</button>";
        }
      }
      var juego = t === "quiz" && puedeEditar ? seccionJuego(cardF) : "";
      return cab + '<div class="escuela-carta__cuerpo">' + enun + "</div>" + tipoPreg +
        '<ol class="escuela-ops">' + ops + extra + "</ol>" + fbG + sint + juego + reto;
    }
    if (t === "revela") {
      /* Tres golpes, tres ideas: ni más ni menos. La animación SIEMPRE hace
         las tres acciones (titular 2026-09-02), así que aquí no se añaden ni
         se quitan frases, y el formulario no lleva entradilla: lo único que
         el alumno lee es lo que revela cada golpe. */
      /* TRES huecos SIEMPRE, aunque el dato traiga menos (un borrador viejo,
         un importado a medias): sin controles de añadir, un formulario que
         pintara solo lo que hay dejaría la tarjeta rota y sin salida — que es
         exactamente lo que le pasó al titular el 2026-09-02. */
      var frasesHtml = [0, 1, 2].map(function (j) {
        var f = cardF.frases[j] || { md: "", html: "" };
        return "<li>" + zona(R(f.html), { ruta: base + ".frases." + j, modo: "inline", filas: 2, tope: LIM.frase,
          rotulo: "👊 " + (ES ? "Texto que aparece con la acción " : "Text revealed by action ") + (j + 1),
          porque: T.porque.frase }) + "</li>";
      }).join("");
      return cab + '<ul class="escuela-frases">' + frasesHtml + "</ul>" +
        '<p class="escuela-nota">' + esc(ES ? "la escenita (makiwara, campana, tejas, faroles) la sortea el motor — pruébala" : "the scene (makiwara, bell, tiles, lanterns) is drawn by the engine — play it") + "</p>" + reto;
    }
    if (t === "escena") {
      var vin = cardF.vinetas.map(function (v, j) { return vinetaEditable(v, j, base, cardF); }).join("");
      var masVin = puedeEditar && cardF.vinetas.length < 3
        ? '<button type="button" class="escuela-chip escuela-chip--ed" data-mas-vineta>+ ' + esc(T.vineta.toLowerCase()) + " (máx. 3)</button>"
        : (puedeEditar ? '<span class="escuela-sello escuela-sello--mini">印 ' + esc(ES ? "tres viñetas: el cómic respira" : "three panels: the comic breathes") + "</span>" : "");
      /* Sin entradilla (titular 2026-09-02): la escena habla sola por sus
         viñetas. Si hace falta contexto, va en una tarjeta de texto delante. */
      return cab + '<div class="escuela-vinetas">' + vin + "</div>" +
        '<div class="escuela-chips">' + masVin + "</div>" + reto;
    }
    if (t === "scroll") {
      var destino = puedeEditar
        ? '<button type="button" class="escuela-chip escuela-chip--ed" data-elige-perg>📜 ' + esc(cardF.titulo || T.elegirPergamino) + "</button>"
        : '<span class="escuela-chip">' + esc(cardF.href) + "</span>";
      return cab + "<p><b>📜 " + esc(cardF.titulo) + "</b></p>" +
        '<div class="escuela-carta__cuerpo">' +
        zona(R(cardF.cuerpo.html), { ruta: base + ".cuerpo", modo: "bloque", tope: LIM.scrollCuerpo, porque: T.porque.scrollCuerpo }) +
        "</div>" + '<div class="escuela-chips">' + destino + "</div>" + reto;
    }
    return cab + '<div class="escuela-carta__cuerpo">' +
      zona(R(cardF.cuerpo.html), { ruta: base + ".cuerpo", modo: "bloque", tope: LIM.cuerpo, porque: T.porque.cuerpo }) +
      "</div>" + reto;
  }

  /* El juego del reto, en tres mandos (titular 2026-09-02): «Azar» —el estado
     por defecto—, «Selecciona juego» —abre el catálogo en un modal— y «Probar
     pregunta» —monta el modal del juego elegido (o sorteado) con ESTA
     pregunta, solo si está bien diligenciada—. La fila de medallones se fue:
     ahora vive dentro del modal del catálogo. */
  function seccionJuego(cardF) {
    var compat = compatiblesDe(cardF);
    var fijado = (cardF.reto && cardF.reto.juego) || "";
    var ficha = null;
    for (var i = 0; i < JUEGOS_FICHA.length; i++) if (JUEGOS_FICHA[i].id === fijado) ficha = JUEGOS_FICHA[i];
    var arte = cfg.gameArt || {};
    var caraSel = "";
    if (ficha) {
      var srcF = arte["icono-" + ficha.id];
      caraSel = (srcF ? '<img src="' + esc((cfg.assets || "") + srcF) + '" alt="" width="256" height="256" decoding="async">' : ficha.icono) +
        " " + esc(ficha.nombre);
    }
    return '<div class="escuela-juego"><h4>' + (ES ? "Juego del reto" : "Challenge game") + "</h4>" +
      '<div class="escuela-juego__fila">' +
      '<button type="button" class="escuela-juego__btn' + (fijado ? "" : " is-on") + '" data-azar>' + esc(T.juegoAzar) + "</button>" +
      '<button type="button" class="escuela-juego__btn' + (fijado ? " is-on" : "") + '" data-elige-juego>' +
      (ficha ? caraSel : esc(T.eligeJuego)) + "</button>" +
      '<button type="button" class="escuela-probar escuela-probar--pregunta" data-probar-pregunta>' + esc(T.probarPregunta) + "</button>" +
      "</div>" +
      (fijado && compat.indexOf(fijado) === -1
        ? '<p class="escuela-avisos">⚠ ' + esc(ES ? "el juego fijado ya no es compatible: se sorteará" : "the pinned game is no longer compatible: it will be drawn") + "</p>" : "") +
      "</div>";
  }

  /* El catálogo de juegos, en su modal: los mismos medallones ilustrados de
     siempre, con Azar el primero. Un medallón apagado no es un error — su
     title dice qué dato le falta a la pregunta. */
  function abrirSelectorJuego(cardF) {
    var compat = compatiblesDe(cardF);
    var arte = cfg.gameArt || {};
    /* Solo los que PUEDEN jugar esta pregunta (titular 2026-09-02): un
       medallón apagado no aporta —quien elige no quiere saber qué le falta a
       un juego que no ha pedido—, y sin marca de «fijado» porque el modal se
       cierra al elegir y el botón de fuera ya enseña el elegido. */
    var fichas = JUEGOS_FICHA.filter(function (f) { return compat.indexOf(f.id) !== -1; })
      .map(function (f) {
        var src = arte["icono-" + f.id];
        var cara = src
          ? '<img src="' + esc((cfg.assets || "") + src) + '" alt="" width="256" height="256" loading="lazy" decoding="async">'
          : f.icono;
        return '<button type="button" class="escuela-medallon" data-sel-juego="' + f.id + '" title="' +
          esc(f.nombre) + '">' + cara +
          '<span class="escuela-medallon__nombre">' + esc(f.nombre) + "</span></button>";
      }).join("");
    var v = ventana({ titulo: "🎲 " + T.eligeJuegoTitulo, panel: true, cuerpo:
      '<p class="escuela-nota">' + esc(T.eligeJuegoNota) + "</p>" +
      '<div class="escuela-medallones">' +
      '<button type="button" class="escuela-medallon escuela-medallon--azar" data-sel-juego="">' +
      '<span class="escuela-medallon__dado" aria-hidden="true">🎲</span>' +
      '<span class="escuela-medallon__nombre">' + esc(ES ? "Azar" : "Random") + "</span></button>" + fichas + "</div>" +
      (fichas ? "" : '<p class="escuela-avisos">⚠ ' + esc(T.probarSinJuego) + "</p>") });
    v.cuerpo.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-sel-juego]");
      if (!b) return;
      var idJuego = b.getAttribute("data-sel-juego");
      if (idJuego && compatiblesDe(cardF).indexOf(idJuego) === -1) return;   /* apagado: el title explica */
      if (!idJuego) {
        if (cardF.reto) { delete cardF.reto.juego; if (!Object.keys(cardF.reto).length) delete cardF.reto; }
      } else {
        cardF.reto = cardF.reto || {};
        cardF.reto.juego = idJuego;
      }
      marcarTocado();
      v.cerrar();
      rutear();
    });
  }

  /* El modal de añadir idioma (docs/11 F1): ofrece los idiomas de plataforma
     MENOS el base (el curso ya ES en ese idioma) y los ya añadidos. Añadir
     declara el idioma en el curso; el RELLENO lo hace la traducción por IA
     (tools/escuela_traducir.py hoy; la Edge Function en F5) — por eso el chip
     nace con ⏳ y la checklist lo marca pendiente hasta que llegue. */
  function abrirIdiomas(clave) {
    var curso = capaCurso(clave);
    if (!curso) return;
    var base = MFEscuela.compilar.baseDe(curso);
    var ya = MFEscuela.compilar.idiomasDe(curso);
    var candidatos = Object.keys(MFEscuela.compilar.IDIOMAS)
      .filter(function (lg) { return ya.indexOf(lg) < 0; });
    var lista = candidatos.length
      ? candidatos.map(function (lg) {
          return '<button type="button" class="escuela-medallon" data-anade-idioma="' + lg + '">' +
            '<span class="escuela-medallon__dado" aria-hidden="true">' + lg.toUpperCase() + "</span>" +
            '<span class="escuela-medallon__nombre">' + esc(MFEscuela.compilar.IDIOMAS[lg]) + "</span></button>";
        }).join("")
      : '<p class="escuela-nota">' + esc(T.sinIdiomas) + "</p>";
    /* Los que YA tiene, con su avance y su aspa: un idioma añadido por error
       —o a medio traducir— tiene que poder deshacerse (titular 2026-09-03). */
    var puestos = ya.filter(function (lg) { return lg !== base; }).map(function (lg) {
      var av = MFEscuela.compilar.avanceIdioma(curso, lg);
      return '<li class="escuela-op"><div class="escuela-op__cab">' +
        '<span class="escuela-op__rotulo">🌐 ' + esc(MFEscuela.compilar.IDIOMAS[lg] || lg) +
        " · " + av.hechas + "/" + av.total + "</span>" +
        botonCerrar('data-quita-idioma="' + lg + '"', T.quitarIdioma) + "</div></li>";
    }).join("");
    var v = ventana({ titulo: "🌐 " + T.anadirIdioma, panel: true, cuerpo:
      '<p class="escuela-nota"><b>' + esc(MFEscuela.compilar.IDIOMAS[base] || base) + "</b> — " +
      esc(T.esElBase) + "</p>" +
      (puestos ? '<ol class="escuela-ops">' + puestos + "</ol>" : "") +
      '<p class="escuela-nota">' + esc(T.anadirIdiomaNota) + "</p>" +
      '<div class="escuela-medallones">' + lista + "</div>" });
    v.cuerpo.addEventListener("click", function (e) {
      var q = e.target.closest && e.target.closest("[data-quita-idioma]");
      if (!q) return;
      var lg = q.getAttribute("data-quita-idioma");
      var av = MFEscuela.compilar.avanceIdioma(curso, lg);
      v.cerrar();
      confirmar(T.confirmarQuitarIdioma.replace("{lg}", MFEscuela.compilar.IDIOMAS[lg] || lg),
        T.detalleQuitarIdioma.replace("{n}", av.hechas), function () {
          MFEscuela.compilar.quitarIdioma(curso, lg);
          if (langVista === lg) fijarIdioma(base);
          MFEscuelaDatos.guardarAhora("curso:" + clave).then(function () { rutear(); });
          rutear();
          toast(T.idiomaQuitado.replace("{lg}", MFEscuela.compilar.IDIOMAS[lg] || lg));
        });
    });
    v.cuerpo.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-anade-idioma]");
      if (!b) return;
      var lg = b.getAttribute("data-anade-idioma");
      /* La puerta del plan: curso COMPLETO y en verde antes de traducir. */
      var rojos = 0;
      curso.misiones.forEach(function (m) {
        var mc = capa(m);
        if (mc) avisosDeMision(m, mc).forEach(function (a) { if (a.n === "rojo") rojos++; });
      });
      if (rojos) {
        v.cerrar();
        toast(T.idiomaConRojos.replace("{n}", rojos), { error: true });
        return;
      }
      curso.idiomas = curso.idiomas || [];
      curso.idiomas.push(lg);
      MFEscuelaDatos.guardarAhora("curso:" + clave).then(function () { rutear(); });
      v.cerrar();
      rutear();
      toast(T.idiomaAnadido.replace("{lg}", MFEscuela.compilar.IDIOMAS[lg]));
    });
  }

  /* «Probar pregunta»: el modal del juego de verdad, con ESTA pregunta y sin
     XP (el MF de la demo). Solo si la tarjeta está bien diligenciada — si no,
     se abre la ventana que enumera lo que falta. */
  function probarPregunta() {
    var r = ruta();
    if (r.v !== "baraja" || !misionActiva) return;
    if (guardiaTarjeta()) return;
    if (!window.MFRetos || !MFRetos.abrir || !MFRetos.sortear) { toast(T.probarSinJuego, { error: true }); return; }
    var data;
    try {
      data = MFEscuela.compilar.armarMisionDemo(modelo.fuente, r.curso, langVista, r.id, cfg.prefix, cfg.assets);
    } catch (e) { toast(T.probarSinJuego, { error: true }); return; }
    /* Nunca como examen: el guardia del examen anularía el sorteo por tarjeta. */
    var contenido = {};
    for (var kD in data) contenido[kD] = data[kD];
    contenido.kind = "mission";
    contenido.id = String(data.id || r.id) + ":probar";
    var cTarjeta = contenido.cards[r.k];
    if (!cTarjeta || cTarjeta.type !== "quiz") return;
    var MFreal = window.MF;
    window.MF = crearMFDemo();
    var soltar = function () { window.MF = MFreal; };
    var juegoObj = null;
    try { juegoObj = MFRetos.sortear(cTarjeta, contenido, { sorteos: {}, resueltas: {}, intento: 0 }, r.k); }
    catch (e) { juegoObj = null; }
    if (!juegoObj) { soltar(); toast(T.probarSinJuego, { error: true }); return; }
    var pr = null;
    try { pr = MFRetos.abrir(juegoObj, cTarjeta, { content: contenido, examen: false, intento: 0, iTarjeta: r.k }); }
    catch (e) { pr = null; }
    if (!pr || typeof pr.then !== "function") { soltar(); toast(T.probarSinJuego, { error: true }); return; }
    pr.then(soltar, soltar);
  }

  /* La elección (apuesta): dos opciones, cada una responde; la estrella marca
     «la elección del curso» y se mueve (o se quita tocando la activa). */
  function htmlOpcionesEleccion(cardF, base) {
    return cardF.opciones.map(function (op, j) {
      var rOp = base + ".opciones." + j;
      var estrella = puedeEditar
        ? '<button type="button" class="escuela-estrella' + (op.correct ? " is-on" : "") + '" data-estrella="' + j + '" title="' + esc(T.laDelCurso) + '">★</button>'
        : (op.correct ? '<span class="escuela-chip">★ ' + esc(T.laDelCurso) + "</span>" : "");
      var fb = '<div class="escuela-fb"><div>' +
        zona(R(op.feedback.html), { ruta: rOp + ".feedback", modo: "inline", filas: 2, tope: LIM.feedback,
          rotulo: T.rotAclaracion }) + "</div></div>";
      return '<li class="escuela-op"><div class="escuela-op__cab">' + estrella + "</div>" +
        zona(R(op.texto.html), { ruta: rOp + ".texto", modo: "inline", filas: 2, tope: LIM.opcion,
          rotulo: T.rotOpcion, porque: T.porque.opcion }) + fb + "</li>";
    }).join("");
  }

  /* Las puertas: texto + consecuencia por puerta; máximo 3 (sello). */
  function htmlPuertas(cardF, base) {
    return cardF.opciones.map(function (op, j) {
      var rOp = base + ".opciones." + j;
      var quitar = puedeEditar && cardF.opciones.length > 2
        ? botonCerrar('data-quitar-puerta="' + j + '"', ES ? "Quitar esta puerta" : "Remove this door") : "";
      return '<li class="escuela-op"><div class="escuela-op__cab"><span class="escuela-op__rotulo">🚪 ' +
        esc(ES ? "Puerta " : "Door ") + (j + 1) + "</span>" + quitar + "</div>" +
        zona(R(op.texto.html), { ruta: rOp + ".texto", modo: "inline", filas: 2, tope: LIM.opcion,
          rotulo: ES ? "Lo que dice la puerta" : "What the door says", porque: T.porque.opcion }) +
        '<div class="escuela-fb"><div>' +
        zona(R(op.feedback.html), { ruta: rOp + ".feedback", modo: "inline", filas: 2, tope: LIM.feedback,
          rotulo: ES ? "Consecuencia (lo que el alumno ve al abrirla)" : "Consequence (what the student sees on opening)" }) +
        "</div></div></li>";
    }).join("");
  }

  function vBaraja(clave, id, k) {
    var curso = capaCurso(clave);
    if (!curso) return vArtes();
    var c = capa(curso);
    var m = misionPorId(curso, id);
    if (!m) return vNivel(clave, 1);
    var mc = capa(m);
    misionActiva = { curso: clave, m: m };
    var cards = mc.cards;
    k = Math.max(0, Math.min(k || 0, cards.length - 1));
    var mas = function (ix) {
      return puedeEditar ? selloBoton("mas", 'data-mas="' + ix + '"',
        ES ? "añadir tarjeta aquí" : "add a card here", false, "escuela-mas") : "";
    };
    var rio = cards.map(function (cardF, ix) {
      var avisos = avisosDeCard(cardF);
      var conRojo = avisos.some(function (a) { return a.n === "rojo"; });
      var extracto = plano((cardF.enunciado && cardF.enunciado.html) || (cardF.cuerpo && cardF.cuerpo.html) || "", 26);
      return mas(ix) + '<a class="escuela-mini' + (ix === k ? " is-activa" : "") +
        '" href="#/' + esc(clave) + "/m/" + esc(id) + "/c/" + ix + '"' +
        (puedeEditar ? ' data-orden-carta="' + ix + '" title="' +
          esc(ES ? "arrastra para cambiarla de sitio" : "drag to move it") + '"' : "") + ">" +
        (avisos.length ? '<span class="escuela-mini__ojo' + (conRojo ? " is-rojo" : "") + '" title="' +
          esc(avisos.map(function (a) { return a.t; }).join(" · ")) + '">!</span>' : "") +
        '<span class="escuela-mini__tipo">' + (ICONO[cardF.tipo] || "▫️") + "</span>" +
        '<span class="escuela-mini__extracto">' + esc(extracto || nombreTipo(cardF.tipo)) + "</span></a>";
    }).join("") + mas(cards.length);
    /* La barra de flechas, duplicar y papelera se retiró (titular 2026-09-02): el orden se cambia
       ARRASTRANDO la miniatura por el río, y borrar sube con los otros mandos.
       El atajo Alt+←/→ sobrevive sin botones: quien navega con teclado no puede
       quedarse sin poder mover una tarjeta. */
    var herr = "";
    var nivel = curso.niveles[String(m.nivel)];
    var avisosCarta = avisosDeCard(cards[k]);
    return barra([
      { t: T.titulo, href: "#/" }, { t: c.title, href: "#/" + clave },
      { t: (nivel && capa(nivel) ? capa(nivel).title : "Nivel " + m.nivel), href: "#/" + clave + "/n/" + m.nivel },
      { t: mc.title }]) +
      '<header class="escuela-hero escuela-hero--mision"><h2>' +
      zona(esc(mc.title), { ruta: "title", modo: "plano", tope: LIM.titulo, porque: T.porque.titulo }) + "</h2>" +
      /* Sin sello de XP: la economía la fija la plataforma y no es asunto del
         maestro (titular 2026-09-02). Los tres mandos van juntos a la derecha,
         como sellos: deshacer, guardar y probar. */
      '<span class="escuela-mandos">' + barraGuardado(cards.length) +
      selloBoton("probar", 'data-mision="' + esc(id) + '"',
        m.kind === "exam" ? T.probarExamen.replace("▶ ", "") : T.probar.replace("▶ ", ""), false) +
      "</span></header>" +
      examenInfo(m, mc, cards) +
      (avisosCarta.length ? '<p class="escuela-avisos">' + esc(textosAvisos(avisosCarta)) + "</p>" : "") +
      herr +
      '<div class="escuela-parejas">' +
      '<article class="escuela-carta" data-carta="' + k + '">' + detalleCard(cards[k], k) + "</article>" +
      /* El espejo ES lado a lado se retiró (titular 2026-09-02): una sola
         columna, en el idioma elegido. Traer el original sigue a un clic. */
      (langVista === "en" && puedeEditar && m.es && m.es.cards[k]
        ? '<p class="escuela-chips"><button type="button" class="escuela-chip escuela-chip--ed" data-copiar-es>⧉ ' +
          esc("Copy this card from ES") + "</button></p>"
        : "") +
      "</div>" +
      '<div class="escuela-rio">' + rio + "</div>" +
      '<p class="escuela-nota">' + cards.length + " " + T.tarjetas + "</p>";
  }

  /* Refresca solo los dos botones (escribir no debe re-renderizar la tarjeta). */
  function pintarBotonGuardar() {
    var grupo = raiz && raiz.querySelector(".escuela-guardar-grupo");
    if (!grupo) return;
    var nuevo = el(barraGuardado());
    if (nuevo) grupo.replaceWith(nuevo);
  }

  /* Guardar y Deshacer viven JUNTOS y junto a Probar: se ve de un vistazo si
     queda trabajo sin guardar, y se puede probar la misión sin guardarla. */
  /* Los tres mandos de la barra son SELLOS de la casa (titular 2026-09-02):
     hermanos de `cerrar` y `aprobar`, con el nombre solo en el tooltip. Un
     sello apagado se ve apagado y su tooltip dice por qué. */
  function selloBoton(lamina, attrs, titulo, apagado, clase) {
    /* La clase extra viaja aparte y NO dentro de `attrs`: dos atributos
       `class` en el mismo botón y el navegador se queda con el primero — así
       se perdieron los «+» del río en el primer intento. */
    return '<button type="button" class="escuela-sello-btn' + (clase ? " " + clase : "") + '" ' + attrs +
      (apagado ? " disabled" : "") + ' title="' + esc(titulo) + '" aria-label="' + esc(titulo) + '">' +
      '<img src="' + (cfg.assets || "") + "assets/img/game/" + lamina + '.webp" alt="" ' +
      'width="256" height="255" decoding="async"></button>';
  }

  function barraGuardado(nCards) {
    if (!puedeEditar) return "";
    var sucio = haySinGuardar();
    return (nCards === undefined ? "" : selloBoton("cerrar", "data-borrar",
        T.confirmarTarjeta, nCards <= 1)) +
      selloBoton("deshacer", "data-deshacer",
        pila.length ? T.deshacer + " (Ctrl+Z)" : T.nadaQueDeshacer, !pila.length) +
      selloBoton("guardar", "data-guardar",
        sucio ? T.guardarCambios : T.sinCambios, !sucio);
  }

  /* El molde del examen, siempre a la vista: 6 preguntas, 3 al azar, 2 de 3. */
  function examenInfo(m, mc, cards) {
    if (m.kind !== "exam") return "";
    var nQuiz = cards.filter(function (c) { return c.tipo === "quiz"; }).length;
    var banner = ES
      ? "El alumno jugará 3 de estas " + nQuiz + " preguntas al azar como retos; aprueba con 2 de 3"
      : "The student plays 3 of these " + nQuiz + " questions at random as challenges; passes with 2 of 3";
    var molde = nQuiz === 6 ? "" :
      ' <b class="escuela-avisos">⚠ ' + (ES ? "el molde pide 6 preguntas (hay " + nQuiz + ")" : "the mold takes 6 questions (there are " + nQuiz + ")") + "</b>";
    var teaser = "";
    if (puedeEditar || (mc.siguiente && mc.siguiente.html)) {
      teaser = '<p class="escuela-nota">' + (ES ? "Teaser del siguiente nivel: " : "Next-level teaser: ") +
        zona(mc.siguiente ? R(mc.siguiente.html) : "",
          { ruta: "siguiente", modo: "inline", tope: LIM.feedback, porque: ES ? "se muestra solo al aprobar" : "shown only on passing" }) + "</p>";
    }
    return '<p class="escuela-nota">🏮 ' + esc(banner) + molde + "</p>" + teaser;
  }

  function vPergaminos(clave) {
    var curso = capaCurso(clave);
    if (!curso) return vArtes();
    var c = capa(curso);
    var filas = curso.pergaminos.map(function (p) {
      var pc = capa(p);
      if (!pc) return "";
      var audio = (modelo.fuente.audio[langVista] || []).indexOf(p.id) >= 0;
      return '<a class="escuela-fila escuela-fila--perg" href="#/' + esc(clave) + "/p/" + esc(p.id) + '">' +
        '<span class="escuela-fila__icono">' + (p.layout === "tool" ? "🛠️" : "📜") + "</span>" +
        '<span class="escuela-fila__tit">' + esc(pc.title) + "</span>" +
        (desfasada(p) ? '<span class="escuela-chip escuela-chip--ambar" title="' +
          esc(ES ? "EN desfasado" : "EN out of date") + '">↻</span>' : "") +
        '<span class="escuela-fila__datos">' + (pc.kicker ? esc(pc.kicker) + " · " : "") +
        pc.words + " " + T.palabras + " · " + Math.max(1, Math.round(pc.words / 200)) + " " + T.minutos +
        (audio ? " · 🎧 " + esc(T.conAudio) : "") + "</span></a>";
    }).join("");
    var crear = puedeEditar
      ? '<div class="escuela-salas">' +
        '<button type="button" class="escuela-sala" data-nuevo-perg="article">＋ 📜 ' + esc(ES ? "Pergamino" : "Scroll") + "</button>" +
        '<button type="button" class="escuela-sala" data-nuevo-perg="story">＋ 📖 ' + esc(ES ? "Historia" : "Story") + "</button></div>"
      : "";
    return barra([{ t: T.titulo, href: "#/" }, { t: c.title, href: "#/" + clave }, { t: T.salaPergaminos }]) +
      "<div class='escuela-lista'>" + filas + "</div>" + crear;
  }

  /* La papelera del curso (30 días, solo con Supabase). */
  function vPapelera(clave) {
    var curso = capaCurso(clave);
    if (!curso) return vArtes();
    var c = capa(curso);
    var cuerpo = modelo.origen !== "sb"
      ? '<div class="escuela-pronto"><span class="escuela-sello">印</span><p>' +
        esc(ES ? "En modo local la red de seguridad es el Deshacer del momento; la papelera de 30 días vive con Supabase." :
                 "In local mode the safety net is the instant Undo; the 30-day trash lives with Supabase.") + "</p></div>"
      : '<div class="escuela-lista" data-papelera>' + (window.MFCargador ? MFCargador("…") : "…") + "</div>";
    if (modelo.origen === "sb") {
      MFEscuelaDatos.papeleraDe(clave).then(function (r) {
        var cont = raiz.querySelector("[data-papelera]");
        if (!cont) return;
        var filas = [];
        r.misiones.forEach(function (f) {
          var t = (f.datos && f.datos[langVista] && f.datos[langVista].title) || f.id;
          filas.push('<div class="escuela-chk__fila">🎴 <span>' + esc(t) + "</span>" +
            '<button type="button" class="escuela-chk__ir" data-restaurar="mision:' + esc(f.id) + '">' + esc(ES ? "restaurar" : "restore") + "</button></div>");
        });
        r.pergaminos.forEach(function (f) {
          var t = (f.datos && f.datos[langVista] && f.datos[langVista].title) || f.id;
          filas.push('<div class="escuela-chk__fila">📜 <span>' + esc(t) + "</span>" +
            '<button type="button" class="escuela-chk__ir" data-restaurar="pergamino:' + esc(f.id) + '">' + esc(ES ? "restaurar" : "restore") + "</button></div>");
        });
        cont.innerHTML = filas.length ? filas.join("") :
          '<p class="escuela-nota">' + esc(ES ? "La papelera está vacía." : "The trash is empty.") + "</p>";
        cont.setAttribute("data-papelera-filas", JSON.stringify({
          misiones: r.misiones.map(function (f) { return { id: f.id, datos: f.datos }; }),
          pergaminos: r.pergaminos.map(function (f) { return { id: f.id, datos: f.datos }; }),
        }));
      });
    }
    return barra([{ t: T.titulo, href: "#/" }, { t: c.title, href: "#/" + clave }, { t: ES ? "Papelera" : "Trash" }]) +
      '<header class="escuela-hero"><h2>🗑 ' + esc(ES ? "Papelera (30 días)" : "Trash (30 days)") + "</h2></header>" + cuerpo;
  }

  /* El editor de un pergamino: título, cuerpo con medidor de PALABRAS, audio
     como estado (jamás autogenerar), backlinks y vista previa del borrador. */
  function vPergamino(clave, id) {
    var curso = capaCurso(clave);
    if (!curso) return vArtes();
    var c = capa(curso);
    var ent = null;
    for (var i = 0; i < curso.pergaminos.length; i++) if (curso.pergaminos[i].id === id) ent = curso.pergaminos[i];
    if (!ent) return vPergaminos(clave);
    pergActivo = { curso: clave, ent: ent };
    var pc = capa(ent);
    var audio = (modelo.fuente.audio[langVista] || []).indexOf(id) >= 0;
    var citas = 0;
    curso.misiones.forEach(function (m) {
      var mc = capa(m);
      if (!mc) return;
      mc.cards.forEach(function (cf) {
        if (cf.tipo === "scroll" && cf.href && cf.href.indexOf(pc.url) >= 0) citas++;
      });
    });
    var esTool = ent.layout === "tool";
    var palabras = pc.words || 0;
    var medidor = '<span class="escuela-chip' + (palabras >= 180 && palabras <= 300 ? "" : " escuela-chip--ambar") + '">' +
      palabras + " " + T.palabras + " · " + Math.max(1, Math.round(palabras / 200)) + " " + T.minutos + "</span>";
    var selloTool = esTool
      ? '<p class="escuela-avisos">印 ' + esc(ES ? "las herramientas llevan HTML interactivo: las edita la casa" : "tools carry interactive HTML: the house edits them") + "</p>" : "";
    return barra([{ t: T.titulo, href: "#/" }, { t: c.title, href: "#/" + clave },
      { t: T.salaPergaminos, href: "#/" + clave + "/pergaminos" }, { t: pc.title }]) +
      '<header class="escuela-hero escuela-hero--mision"><h2>' +
      (esTool ? esc(pc.title) : zona(esc(pc.title), { ruta: "title", modo: "plano", tope: LIM.titulo, porque: T.porque.titulo })) +
      "</h2>" + medidor +
      '<span class="escuela-chip">' + (audio ? "🎧 MP3 ✓" : "🎧 — " + esc(ES ? "el minipodcast lo produce la casa" : "the minipodcast is produced by the house")) + "</span>" +
      (citas ? '<span class="escuela-chip">🔗 ' + esc((ES ? "lo citan " : "cited by ") + citas + (ES ? " tarjetas" : " cards")) + "</span>" : "") +
      barraGuardado() +
      '<button type="button" class="escuela-probar" data-previa>👁 ' + esc(ES ? "Vista previa del borrador" : "Preview the draft") + "</button>" +
      "</header>" + selloTool +
      '<div class="escuela-parejas">' +
      '<article class="escuela-carta escuela-carta--pergamino">' +
      (esTool
        ? '<div class="escuela-carta__cuerpo">' + R(pc.cuerpo.html) + "</div>"
        : '<div class="escuela-carta__cuerpo">' +
          zona(R(pc.cuerpo.html), { ruta: "cuerpo", modo: "bloque", contar: "palabras", porque: ES ? "así cabe en un minipodcast" : "so it fits a minipodcast" }) +
          "</div>") +
      "</article>" +
      (langVista === "en" && puedeEditar && !esTool && ent.es
        ? '<p class="escuela-chips"><button type="button" class="escuela-chip escuela-chip--ed" data-copiar-es-perg>⧉ ' +
          esc("Copy the body from ES") + "</button></p>"
        : "") +
      "</div>";
  }

  /* -------------------------------------------------- selector de pergamino */

  function abrirSelectorPergamino(cardIx) {
    var clave = ruta().curso;
    var curso = capaCurso(clave);
    var capaM = capa(misionActiva.m);
    var filas = curso.pergaminos.map(function (p) {
      var pc = capa(p);
      return '<button type="button" class="escuela-fila" data-el-perg="' + esc(p.id) + '">' +
        '<span class="escuela-fila__icono">' + (p.layout === "tool" ? "🛠️" : "📜") + "</span>" +
        '<span class="escuela-fila__tit">' + esc(pc.title) + "</span>" +
        '<span class="escuela-fila__datos">' + esc(pc.kicker || "") + "</span></button>";
    }).join("");
    var v = ventana({ titulo: "📜 " + T.elegirPergamino, panel: true,
      cuerpo: '<div class="escuela-lista">' + filas + "</div>" });
    var cerrar = v.cerrar;
    v.cuerpo.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-el-perg]");
      if (!b) return;
      var ent = null;
      for (var i = 0; i < curso.pergaminos.length; i++) if (curso.pergaminos[i].id === b.getAttribute("data-el-perg")) ent = curso.pergaminos[i];
      var pc = capa(ent);
      var cardF = capaM.cards[cardIx];
      cardF.titulo = pc.title;
      cardF.href = "{P}" + pc.url;
      marcarTocado();
      cerrar();
      rutear();
    });
  }

  function avisosDePergamino(ent, pc, lang) {
    var av = [];
    if (ent.layout === "tool") return av;        /* solo-titular: no se audita */
    if (!pc.title) av.push({ n: "rojo", t: ES ? "sin título" : "no title" });
    if (!pc.cuerpo.md || MFEscuela.compilar.contarPalabras(pc.cuerpo.md) < 40) {
      av.push({ n: "rojo", t: ES ? "cuerpo vacío o mínimo" : "empty or minimal body" });
    } else {
      /* El molde 180-300 existe PARA el minipodcast. Un pergamino con su audio
         YA GRABADO tiene esa prueba superada: avisarlo sería pedir reescribir
         un texto cuya narración está publicada (y regrabarla cuesta saldo de
         API, que no se gasta sin aprobación). El molde sigue vivo para los
         pergaminos SIN audio, que son los que aún pueden ajustarse gratis.
         (Decisión al reparar la checklist, 2026-09-02: los 36 fuera de molde
         eran todos 302-354 palabras con su MP3 grabado.) */
      var conAudio = ((modelo.fuente.audio || {})[lang || langVista] || []).indexOf(ent.id) >= 0;
      var p = pc.words || MFEscuela.compilar.contarPalabras(pc.cuerpo.md);
      if (!conAudio && (p < 180 || p > 300)) {
        av.push({ n: "ambar", t: (ES ? "fuera del molde 180-300: " : "outside the 180-300 mold: ") + p + " " + T.palabras });
      }
    }
    return av;
  }

  /* La checklist: la única barrera dura. Rojo bloquea el sello; ámbar avisa. */
  function vPublicar(clave) {
    var curso = capaCurso(clave);
    if (!curso) return vArtes();
    var c = capa(curso);
    var filas = [], rojos = 0, ambares = 0;
    function fila(dot, titulo, avs, href) {
      var nR = avs.filter(function (a) { return a.n === "rojo"; }).length;
      var nA = avs.length - nR;
      rojos += nR; ambares += nA;
      var color = nR ? "p-rojo" : nA ? "p-ambar" : "p-verde";
      var detalle = avs.slice(0, 3).map(function (a) { return (a.n === "rojo" ? "⛔ " : "⚠ ") + a.t; }).join(" · ") +
        (avs.length > 3 ? " · +" + (avs.length - 3) : "");
      filas.push('<div class="escuela-chk__fila"><span class="punto ' + color + '"></span>' +
        "<span>" + dot + " " + esc(titulo) + "</span>" +
        (detalle ? '<span class="escuela-chk__detalle">' + esc(detalle) + "</span>" : "") +
        '<a class="escuela-chk__ir" href="' + esc(href) + '">' + esc(ES ? "ir" : "go") + "</a></div>");
    }
    /* Reforma de idiomas (docs/11 §4): las condiciones ESTRUCTURALES se
       juzgan una vez, sobre el idioma base; por cada idioma añadido solo se
       revisa lo suyo — cobertura de strings (falta = rojo), frescura frente
       al base (desfase = ámbar) y topes de largo. */
    var lgBase = MFEscuela.compilar.baseDe(curso);
    var anadidos = MFEscuela.compilar.idiomasDe(curso).filter(function (lg) { return lg !== lgBase; });
    curso.misiones.forEach(function (m) {
      var mc = m[lgBase];
      if (mc) fila((m.kind === "exam" ? "🏮" : "🎴") + " " + lgBase.toUpperCase(), mc.title,
        avisosDeMision(m, mc, lgBase), "#/" + clave + "/m/" + m.id);
    });
    curso.pergaminos.forEach(function (p) {
      var pc = p[lgBase];
      if (pc) fila((p.layout === "tool" ? "🛠️" : "📜") + " " + lgBase.toUpperCase(), pc.title,
        avisosDePergamino(p, pc, lgBase), "#/" + clave + "/p/" + p.id);
    });
    anadidos.forEach(function (lg) {
      /* La foto honesta del idioma ANTES de mirar entidad por entidad: si
         faltan capas enteras, el recorrido de abajo no las vería (solo pinta
         las que existen) y el idioma pasaría por completo estando a medias —
         defecto que el titular cazó el 2026-09-03 con el PT al 3 %. */
      var avance = MFEscuela.compilar.avanceIdioma(curso, lg);
      var nombreLg = MFEscuela.compilar.IDIOMAS[lg] || lg;
      if (!avance.hechas) {
        fila("🌐 " + lg.toUpperCase(), nombreLg,
          [{ n: "rojo", t: T.idiomaPendiente }], "#/" + clave);
        return;
      }
      if (avance.hechas < avance.total) {
        fila("🌐 " + lg.toUpperCase(), nombreLg, [{ n: "rojo",
          t: T.idiomaAMedias.replace("{h}", avance.hechas).replace("{t}", avance.total) }],
          "#/" + clave);
      }
      var faltan = MFEscuela.compilar.coberturaIdioma(curso, lg);
      var porEntidad = {};
      faltan.forEach(function (k) {
        var m2 = k.match(/^(mision|pergamino)\.([^.]+)\./);
        var ent = m2 ? m2[1] + ":" + m2[2] : "curso";
        porEntidad[ent] = (porEntidad[ent] || 0) + 1;
      });
      curso.misiones.forEach(function (m) {
        var mc = m[lg];
        if (!mc) return;
        var avs = [];
        var nF = porEntidad["mision:" + m.id] || 0;
        if (nF) avs.push({ n: "rojo", t: T.sinTraducir.replace("{n}", nF) });
        if (desfasada(m, lg)) avs.push({ n: "ambar", t: T.desfasadaBase });
        avs = avs.concat(avisosLargo(mc));
        fila("🌐 " + lg.toUpperCase(), mc.title, avs, "#/" + clave + "/m/" + m.id);
      });
      curso.pergaminos.forEach(function (p) {
        var pc = p[lg];
        if (!pc || p.layout === "tool") return;
        var avs = [];
        var nF = porEntidad["pergamino:" + p.id] || 0;
        if (nF) avs.push({ n: "rojo", t: T.sinTraducir.replace("{n}", nF) });
        if (desfasada(p, lg)) avs.push({ n: "ambar", t: T.desfasadaBase });
        avs = avs.concat(avisosDePergamino(p, pc, lg).filter(function (a) { return a.n === "ambar"; }));
        fila("🌐 " + lg.toUpperCase(), pc.title, avs, "#/" + clave + "/p/" + p.id);
      });
    });
    var piezas = 0;
    ["es", "en"].forEach(function (lg) {
      piezas += MFEscuela.compilar.armarCurso(modelo.fuente, clave, lg).length;
    });
    var estampar;
    if (modelo.origen !== "sb") {
      /* En desarrollo no hay base a la que estampar, pero SÍ se puede ensayar
         el camino entero: compilar las filas de todos los idiomas del curso y
         ver si alguna revienta (titular 2026-09-03, para poder probar la
         publicación desde local). Lo único que no ocurre es el envío. */
      estampar = '<button type="button" class="escuela-probar" data-ensayar' +
        (rojos ? ' disabled title="' + esc(ES ? "hay " + rojos + " avisos rojos: corrígelos primero" : rojos + " red issues block it") + '"' : "") +
        ">印 " + esc(T.ensayar) + "</button>" +
        '<p class="escuela-nota">' + esc(T.ensayarNota) + "</p>";
    } else {
      estampar = '<button type="button" class="escuela-probar" data-publicar' +
        (rojos ? ' disabled title="' + esc(ES ? "hay " + rojos + " avisos rojos: corrígelos para estampar" : rojos + " red issues block the seal") + '"' : "") +
        ">印 " + esc(ES ? "Estampar el sello — publicar todo" : "Stamp the seal — publish all") + "</button>";
    }
    return barra([{ t: T.titulo, href: "#/" }, { t: c.title, href: "#/" + clave }, { t: ES ? "Revisar y publicar" : "Review & publish" }]) +
      '<header class="escuela-hero"><h2>' + esc(ES ? "Revisar y publicar" : "Review & publish") + "</h2>" +
      '<span class="escuela-chip' + (rojos ? " escuela-chip--ambar" : "") + '">⛔ ' + rojos + " · ⚠ " + ambares + "</span></header>" +
      '<div class="escuela-chk">' + filas.join("") + "</div>" +
      '<div class="escuela-estampar">' +
      '<p class="escuela-nota">' + esc(ES
        ? "La publicación estampa el curso COMPLETO: " + piezas + " piezas (ES + EN). Los alumnos ven la versión nueva al instante."
        : "Publishing stamps the WHOLE course: " + piezas + " pieces (ES + EN). Students see the new version instantly.") + "</p>" +
      estampar + "</div>";
  }

  /* ----------------------------------------------------------- publicar --- */

  /* Publicación mínima de F2 (la checklist completa llega en F4): guarda lo
     pendiente, compila TODO el curso en ambos idiomas con el ensamblador
     verificado de F0 y sube las filas `content` por lotes vía la RPC — un
     maestro solo puede escribir filas de sus artes (lo verifica el servidor). */
  /* El ensayo de publicación (solo en local): compila EXACTAMENTE lo que se
     enviaría —las mismas llamadas del ensamblador que usa `publicarCurso`— y
     enseña el recuento por idioma. Si una fila revienta, aquí se ve; en
     producción sería a mitad del envío. No escribe en ningún sitio. */
  function ensayarPublicacion(clave) {
    var curso = capaCurso(clave);
    if (!curso) return;
    var lineas = [], total = 0, fallos = [];
    MFEscuela.compilar.idiomasDe(curso).forEach(function (lg) {
      var hayCapa = lg === MFEscuela.compilar.baseDe(curso) ||
        curso.misiones.some(function (m) { return !!m[lg]; });
      if (!hayCapa) {
        lineas.push("🌐 " + lg.toUpperCase() + " — " + T.idiomaPendiente);
        return;
      }
      var n = 0;
      try {
        n = MFEscuela.compilar.armarCurso(modelo.fuente, clave, lg).length;
        if (MFEscuela.compilar.armarIndiceCurso(modelo.fuente, clave, lg)) n++;
      } catch (e) {
        fallos.push(lg.toUpperCase() + ": " + (e && e.message ? e.message : e));
      }
      total += n;
      lineas.push("🌐 " + lg.toUpperCase() + " — " + n + " " + (ES ? "piezas" : "pieces"));
    });
    ventana({ titulo: "印 " + T.ensayar, panel: true, confirmar: true, cuerpo:
      '<p class="escuela-nota">' + esc(fallos.length ? T.ensayoMal : T.ensayoBien.replace("{n}", total)) + "</p>" +
      '<ul class="escuela-problemas">' +
      lineas.concat(fallos.map(function (f) { return "⛔ " + f; }))
        .map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") +
      "</ul>" +
      '<p class="escuela-nota">' + esc(T.ensayarNota) + "</p>" });
  }

  function publicarCurso(clave) {
    var boton = raiz.querySelector("[data-publicar]");
    var curso = capaCurso(clave);
    var filas = [];
    /* Se publican los idiomas del curso QUE TIENEN capa (un añadido pendiente
       de traducir no publica huecos). */
    MFEscuela.compilar.idiomasDe(curso).forEach(function (lg) {
      var hayCapa = lg === MFEscuela.compilar.baseDe(curso) ||
        curso.misiones.some(function (m) { return !!m[lg]; });
      if (!hayCapa) return;
      MFEscuela.compilar.armarCurso(modelo.fuente, clave, lg).forEach(function (f) {
        filas.push({ id: f.id, lang: f.lang, kind: f.kind, art: f.art, data: f.data });
      });
      /* La fila ÍNDICE del player dinámico (/curso/#/clave): el mapa entero. */
      var ind = MFEscuela.compilar.armarIndiceCurso(modelo.fuente, clave, lg);
      if (ind) filas.push({ id: lg + ":curso-" + clave, lang: lg, kind: "escuela-curso", art: clave, data: ind });
    });
    if (!filas.length || !window.SB) return;
    var texto = (ES ? "Se publicarán " : "Publishing ") + filas.length +
      (ES ? " piezas (ES + EN). Los alumnos verán la versión nueva al instante. ¿Estampar el sello?"
          : " pieces (ES + EN). Students will see the new version instantly. Stamp the seal?");
    if (!window.confirm(texto)) return;
    var LOTE = 12, i = 0;
    boton.disabled = true;
    function paso() {
      if (i >= filas.length) {
        return SB.rpc("escuela_marcar_publicado", { p_clave: clave }).then(function () {
          curso.status = "published";
          boton.disabled = false;
          rutear();
          toast(ES ? "印 Sello estampado: " + filas.length + " piezas publicadas" :
            "印 Seal stamped: " + filas.length + " pieces published");
        });
      }
      var lote = filas.slice(i, i + LOTE);
      boton.textContent = (ES ? "Publicando " : "Publishing ") + Math.min(i + LOTE, filas.length) + "/" + filas.length + "…";
      return SB.rpc("escuela_publicar_filas", { p_filas: lote }).then(function () {
        i += LOTE;
        return paso();
      });
    }
    MFEscuelaDatos.guardarTodo().then(paso).catch(function (err) {
      boton.disabled = false;
      boton.textContent = "⚠ " + (ES ? "Falló la publicación — reintentar" : "Publish failed — retry");
      if (window.console) console.warn("publicar", err);
    });
  }

  /* --------------------------------------------------------- modo Probar -- */

  function crearMFDemo() {
    return {
      track: function () {}, reflect: function () {}, confetti: function () {},
      scrollRead: function () {}, toolUsed: function () {},
      art: function () { return { missions: {}, scrolls: {}, tools: {}, belts: {}, exams: {} }; },
      state: function () { return { reflections: {} }; },
      completeMission: function () { return []; },
      completeExam: function (art, level, score) {
        var passed = score >= ((cfg.xp && cfg.xp.exam_pass) || 0.75);
        return { passed: passed, newBelt: passed, belt: null, unlocked: [] };
      },
      replayKey: function () { return "demo"; }, replayXP: function () { return 0; },
      replayWon: function () { return false; }, replayPaid: function () { return false; },
    };
  }

  function abrirDemo(clave, misionId) {
    var data = MFEscuela.compilar.armarMisionDemo(modelo.fuente, clave, langVista, misionId, cfg.prefix, cfg.assets);
    if (!data) return;
    var MFreal = window.MF;
    window.MF = crearMFDemo();
    var v = ventana({ titulo: T.demo, volver: T.volverBaraja,
      cuerpo: '<div data-gate data-kind="' + esc(data.kind) + '"><div data-gated-body></div></div>' });
    /* la economía real vuelve en cuanto la ventana se cierra, salga por donde salga */
    v.alCerrar = function () { window.MF = MFreal; };
    var host = v.cuerpo.querySelector("[data-gate]");
    host.dispatchEvent(new CustomEvent("mf:content", { detail: data, bubbles: true }));
  }

  /* ------------------------------------------------------------- montaje -- */

  function rutear() {
    if (!raiz || !modelo) return;
    misionActiva = null;
    pergActivo = null;
    var r = ruta();
    var html;
    if (r.v === "portada") html = vPortada(r.curso);
    else if (r.v === "nivel") html = vNivel(r.curso, r.n);
    else if (r.v === "baraja") html = vBaraja(r.curso, r.id, r.k);
    else if (r.v === "pergaminos") html = vPergaminos(r.curso);
    else if (r.v === "pergamino") html = vPergamino(r.curso, r.id);
    else if (r.v === "publicar") html = vPublicar(r.curso);
    else if (r.v === "papelera") html = vPapelera(r.curso);
    else if (r.v === "estudiantes") html = vEstudiantes(r.curso);
    else html = vArtes();
    raiz.innerHTML = html;
    fijarEntidad();
    pintarGuardado(ultimoEstado);
  }

  /* --- indicador de guardado en la barra --- */
  var ultimoEstado = null;
  var timerGuardado = null;
  function pintarGuardado(estado) {
    var chip = raiz && raiz.querySelector("[data-guardado]");
    if (!chip) return;
    clearTimeout(timerGuardado);
    if (!estado) { chip.hidden = true; return; }
    chip.hidden = false;
    chip.classList.remove("is-error");
    if (estado === "sucio") { chip.textContent = "● " + T.hayPendientes; chip.hidden = false; return; }
    if (estado === "limpio") { chip.hidden = true; return; }
    if (estado === "guardando") chip.textContent = T.guardando;
    else if (estado === "guardado") {
      chip.textContent = T.guardado;
      timerGuardado = setTimeout(function () { chip.hidden = true; ultimoEstado = null; }, 2500);
    } else if (estado === "error") {
      chip.textContent = T.sinGuardar;
      chip.classList.add("is-error");
    } else if (estado === "conflicto") {
      chip.textContent = "⚠ " + T.conflicto + " " + T.recargar;
      chip.classList.add("is-error");
    }
  }

  function enganchar() {
    raiz.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-lg]");
      if (b) {
        if (b.getAttribute("data-con-capa") === "") {
          toast(T.idiomaPendiente, { error: true });
          return;
        }
        fijarIdioma(b.getAttribute("data-lg"));
        rutear();
        return;
      }
      var masLg = e.target.closest && e.target.closest("[data-mas-idioma]");
      if (masLg) { abrirIdiomas(ruta().curso); return; }
      var pub = e.target.closest && e.target.closest("[data-publicar]");
      if (pub) { publicarCurso(ruta().curso); return; }
      var ens = e.target.closest && e.target.closest("[data-ensayar]");
      if (ens && !ens.disabled) { ensayarPublicacion(ruta().curso); return; }
      /* Por el ATRIBUTO y no por la clase: el botón de probar es un sello
         ilustrado desde 2026-09-02 y ya no lleva `.escuela-probar`. */
      var pr = e.target.closest && e.target.closest("[data-mision]");
      if (pr) { abrirDemo(ruta().curso, pr.getAttribute("data-mision")); return; }
      var ok = e.target.closest && e.target.closest("[data-correcta]");
      if (ok && misionActiva) {
        var j = parseInt(ok.getAttribute("data-correcta"), 10);
        var carta = parseInt(raiz.querySelector("[data-carta]").getAttribute("data-carta"), 10);
        var cardF = capa(misionActiva.m).cards[carta];
        cardF.opciones.forEach(function (op, jj) { op.correct = jj === j; });
        marcarTocado();
        rutear();
        return;
      }
      var mas = e.target.closest && e.target.closest("[data-mas-op]");
      if (mas && misionActiva) {
        var carta2 = parseInt(raiz.querySelector("[data-carta]").getAttribute("data-carta"), 10);
        var cardM = capa(misionActiva.m).cards[carta2];
        var nuevaOp = { texto: { md: "", html: "" }, correct: false, feedback: { md: "", html: "" } };
        if (cardM.tipo === "quiz" && cardM.opciones.some(function (o) { return typeof o.orden === "number"; })) {
          var tomados = {};
          cardM.opciones.forEach(function (o) { if (typeof o.orden === "number") tomados[o.orden] = true; });
          for (var nLibre = 1; nLibre <= 3; nLibre++) if (!tomados[nLibre]) { nuevaOp.orden = nLibre; break; }
        }
        cardM.opciones.push(nuevaOp);
        marcarTocado();
        rutear();
        return;
      }
      var quita = e.target.closest && e.target.closest("[data-quitar-op]");
      if (quita && misionActiva) {
        var carta3 = parseInt(raiz.querySelector("[data-carta]").getAttribute("data-carta"), 10);
        var cardQ = capa(misionActiva.m).cards[carta3];
        var jQ = parseInt(quita.getAttribute("data-quitar-op"), 10);
        confirmar(T.confirmarOpcion, T.seDeshace, function () {
          cardQ.opciones.splice(jQ, 1);
          marcarTocado();
          rutear();
        });
        return;
      }
      var masB = e.target.closest && e.target.closest("[data-mas]");
      if (masB && misionActiva) { abrirBiblioteca(parseInt(masB.getAttribute("data-mas"), 10)); return; }
      var borra = e.target.closest && e.target.closest("[data-borrar]");
      if (borra && !borra.disabled && misionActiva) {
        var rB = ruta();
        var misionB = misionActiva.m;
        var capaBr = capa(misionB);
        var kB = rB.k || 0;
        confirmar(T.confirmarTarjeta, T.detalleTarjeta, function () { borrarTarjeta(rB, misionB, capaBr, kB); });
        return;
      }
      /* Acciones de las tarjetas visuales (F3): frases, puertas, síntesis,
         estrella de la elección, viñetas, huellas y catálogos. */
      /* (Las frases del revela ya no se añaden ni se quitan: son tres fijas.) */
      var acc = e.target.closest && e.target.closest(
        "[data-mas-puerta],[data-quitar-puerta]," +
        "[data-mas-sintesis],[data-quitar-sintesis],[data-estrella],[data-mas-vineta]," +
        "[data-dup-vineta],[data-quitar-vineta],[data-ancla],[data-cat],[data-girar]");
      if (acc && misionActiva) {
        var cartaEl = raiz.querySelector("[data-carta]");
        if (!cartaEl) return;
        var kA = parseInt(cartaEl.getAttribute("data-carta"), 10);
        var cardA = capa(misionActiva.m).cards[kA];
        var toca = true;
        /* Todo lo que DESTRUYE pregunta primero (titular 2026-09-02) y, aun
           así, se puede deshacer mientras no se guarde. */
        function borrando(pregunta, hazlo) {
          confirmar(pregunta, T.seDeshace, function () {
            hazlo();
            marcarTocado();
            rutear();
          });
        }
        if (acc.hasAttribute("data-mas-puerta")) cardA.opciones.push({ texto: par("", true), feedback: par("", true) });
        else if (acc.hasAttribute("data-quitar-puerta")) {
          var jP = parseInt(acc.getAttribute("data-quitar-puerta"), 10);
          borrando(T.confirmarPuerta, function () { cardA.opciones.splice(jP, 1); });
          return;
        } else if (acc.hasAttribute("data-mas-sintesis")) cardA.sintesis = par("", true);
        else if (acc.hasAttribute("data-quitar-sintesis")) {
          borrando(T.confirmarSintesis, function () { cardA.sintesis = null; });
          return;
        }
        else if (acc.hasAttribute("data-estrella")) {
          var jE = parseInt(acc.getAttribute("data-estrella"), 10);
          var ya = cardA.opciones[jE].correct;
          cardA.opciones.forEach(function (o, q) { o.correct = !ya && q === jE; });
        } else if (acc.hasAttribute("data-mas-vineta")) {
          var ult = cardA.vinetas[cardA.vinetas.length - 1];
          cardA.vinetas.push(ult
            ? { fondo: ult.fondo, ancla: ult.ancla, pose: ult.pose, texto: par("", true) }
            : { fondo: primerFondo(), ancla: primeraAncla(primerFondo()), pose: "reposo", texto: par("", true) });
        } else if (acc.hasAttribute("data-dup-vineta")) {
          var jD = parseInt(acc.getAttribute("data-dup-vineta"), 10);
          cardA.vinetas.splice(jD + 1, 0, JSON.parse(JSON.stringify(cardA.vinetas[jD])));
        } else if (acc.hasAttribute("data-quitar-vineta")) {
          var jV = parseInt(acc.getAttribute("data-quitar-vineta"), 10);
          borrando(T.confirmarVineta, function () { cardA.vinetas.splice(jV, 1); });
          return;
        } else if (acc.hasAttribute("data-girar")) {
          /* La viñeta se queda con SU dirección: a partir de aquí el ancla
             solo propone (y el compilador la escribe únicamente si existe). */
          var vG = cardA.vinetas[parseInt(acc.getAttribute("data-girar"), 10)];
          var anclaG = (cfg.escenas.fondos[vG.fondo] || { anclas: {} }).anclas[vG.ancla];
          var actual = typeof vG.flip === "boolean" ? vG.flip : !!(anclaG && anclaG.flip);
          vG.flip = !actual;
        } else if (acc.hasAttribute("data-ancla")) {
          var pa = acc.getAttribute("data-ancla").split(":");
          cardA.vinetas[parseInt(pa[0], 10)].ancla = pa[1];
        } else if (acc.hasAttribute("data-cat")) {
          var pc2 = acc.getAttribute("data-cat").split(":");
          abrirCatalogo(pc2[0], parseInt(pc2[1], 10));
          toca = false;
        }
        if (toca) { marcarTocado(); rutear(); }
        return;
      }
      /* Los tres mandos del juego del reto (el catálogo vive en su modal). */
      var azarB = e.target.closest && e.target.closest("[data-azar]");
      if (azarB && misionActiva) {
        var cartaAz = parseInt(raiz.querySelector("[data-carta]").getAttribute("data-carta"), 10);
        var cardAz = capa(misionActiva.m).cards[cartaAz];
        if (cardAz.reto && cardAz.reto.juego) {
          delete cardAz.reto.juego;
          if (!Object.keys(cardAz.reto).length) delete cardAz.reto;
          marcarTocado();
        }
        rutear();
        return;
      }
      var tipoP = e.target.closest && e.target.closest("[data-tipo-pregunta]");
      if (tipoP && misionActiva) {
        var cartaTp = parseInt(raiz.querySelector("[data-carta]").getAttribute("data-carta"), 10);
        var cardTp = capa(misionActiva.m).cards[cartaTp];
        if (tipoP.getAttribute("data-tipo-pregunta") === "orden") {
          /* secuencia: pasos 1·2·3 por posición y la correcta al paso 1 */
          cardTp.opciones.forEach(function (o, i) { o.orden = i + 1; o.correct = i === 0; });
        } else {
          /* única: el orden se borra (queda en blanco); una correcta se queda */
          cardTp.opciones.forEach(function (o) { delete o.orden; });
          if (!cardTp.opciones.some(function (o) { return o.correct; }) && cardTp.opciones.length) {
            cardTp.opciones[0].correct = true;
          }
        }
        /* El juego fijado era del tipo CONTRARIO: se suelta y vuelve el azar,
           que sortea entre los que sí saben jugar esto (titular 2026-09-02).
           Dejarlo puesto solo servía para arrastrar un fijado imposible. */
        if (cardTp.reto && cardTp.reto.juego) {
          delete cardTp.reto.juego;
          if (!Object.keys(cardTp.reto).length) delete cardTp.reto;
          toast(T.juegoAlAzar);
        }
        marcarTocado();
        rutear();
        return;
      }
      var eligeJ = e.target.closest && e.target.closest("[data-elige-juego]");
      if (eligeJ && misionActiva) {
        var cartaEj = parseInt(raiz.querySelector("[data-carta]").getAttribute("data-carta"), 10);
        abrirSelectorJuego(capa(misionActiva.m).cards[cartaEj]);
        return;
      }
      var probarP = e.target.closest && e.target.closest("[data-probar-pregunta]");
      if (probarP && misionActiva) { probarPregunta(); return; }
      var elige = e.target.closest && e.target.closest("[data-elige-perg]");
      if (elige && misionActiva) {
        abrirSelectorPergamino(parseInt(raiz.querySelector("[data-carta]").getAttribute("data-carta"), 10));
        return;
      }
      if (e.target.closest && e.target.closest("[data-guardar]")) { guardarActivo(); return; }
      if (e.target.closest && e.target.closest("[data-deshacer]")) { deshacer(); return; }
      var fundarB = e.target.closest && e.target.closest("[data-fundar]");
      if (fundarB) { abrirFundar(); return; }
      var vis = e.target.closest && e.target.closest("[data-visibilidad]");
      if (vis && !vis.disabled) {
        var claveV = ruta().curso;
        var cursoV = capaCurso(claveV);
        var quiere = vis.getAttribute("data-visibilidad");
        var codigoV = quiere === "privado"
          ? ((raiz.querySelector(".escuela-acceso__codigo") || {}).value || cursoV.codigo_acceso || "")
          : null;
        if (quiere === "privado" && (!codigoV || codigoV.length < 4)) {
          toast(ES ? "El código de acceso necesita al menos 4 caracteres" : "The access code needs at least 4 characters", { error: true });
          return;
        }
        SB.rpc("escuela_visibilidad", { p_clave: claveV, p_visibilidad: quiere, p_codigo_acceso: codigoV }).then(function () {
          cursoV.visibilidad = quiere;
          if (codigoV) cursoV.codigo_acceso = codigoV;
          rutear();
        }, function () { toast(ES ? "No se pudo cambiar la visibilidad" : "Visibility could not change", { error: true }); });
        return;
      }
      var gc = e.target.closest && e.target.closest("[data-guardar-codigo]");
      if (gc) {
        var claveG = ruta().curso;
        var cursoG = capaCurso(claveG);
        var codigoG = (raiz.querySelector(".escuela-acceso__codigo") || {}).value || "";
        if (codigoG.length < 4) {
          toast(ES ? "El código de acceso necesita al menos 4 caracteres" : "The access code needs at least 4 characters", { error: true });
          return;
        }
        SB.rpc("escuela_visibilidad", { p_clave: claveG, p_visibilidad: "privado", p_codigo_acceso: codigoG }).then(function () {
          cursoG.visibilidad = "privado";
          cursoG.codigo_acceso = codigoG;
          rutear();
        }, function () { toast(ES ? "No se pudo guardar el código" : "The code could not be saved", { error: true }); });
        return;
      }
      var excl = e.target.closest && e.target.closest("[data-excluir]");
      if (excl) {
        var claveE = ruta().curso;
        SB.rpc("escuela_revocar_acceso", { p_clave: claveE, p_uid: excl.getAttribute("data-excluir") }).then(function () {
          rutear();
        });
        return;
      }
      var nm = e.target.closest && e.target.closest("[data-nueva-mision]");
      if (nm) { abrirNuevaMision(ruta().curso, parseInt(nm.getAttribute("data-nueva-mision"), 10)); return; }
      var nx = e.target.closest && e.target.closest("[data-nuevo-examen]");
      if (nx) {
        var claveNx = ruta().curso;
        var entryNx = nuevoExamen(claveNx, parseInt(nx.getAttribute("data-nuevo-examen"), 10));
        MFEscuelaDatos.crearMision(claveNx, entryNx).then(function () {
          location.hash = "#/" + claveNx + "/m/" + entryNx.id;
          rutear();
        });
        return;
      }
      var np = e.target.closest && e.target.closest("[data-nuevo-perg]");
      if (np) {
        var claveNp = ruta().curso;
        var entryNp = nuevoPergamino(claveNp, np.getAttribute("data-nuevo-perg"));
        MFEscuelaDatos.crearPergamino(claveNp, entryNp).then(function () {
          location.hash = "#/" + claveNp + "/p/" + entryNp.id;
          rutear();
        });
        return;
      }
      var bm = e.target.closest && e.target.closest("[data-borrar-mision]");
      if (bm) {
        e.preventDefault();
        e.stopPropagation();
        var claveBm = ruta().curso;
        var idBm = bm.getAttribute("data-borrar-mision");
        confirmar(T.confirmarMision, T.detalleMision, function () {
          var res = MFEscuelaDatos.borrarFila(claveBm, "mision", idBm);
          rutear();
          if (res.quitada) {
            toastDeshacer(ES ? "Misión enviada a la papelera" : "Mission sent to the trash", function () {
              MFEscuelaDatos.restaurarFila(claveBm, "mision", res.quitada);
              rutear();
            });
          }
        });
        return;
      }
      /* Añadir un peldaño: nace al final, y los cinturones se reparten otra vez
         sobre la escalera entera (menos niveles, mismos ocho cinturones). */
      var masN = e.target.closest && e.target.closest("[data-mas-nivel]");
      if (masN) {
        var claveMN = ruta().curso;
        var cursoMN = capaCurso(claveMN);
        var alturaMN = alturaCurso(cursoMN);
        if (!cursoMN || alturaMN >= 8) return;
        cursoMN.niveles[String(alturaMN + 1)] = nivelNuevo(claveMN, alturaMN + 1);
        reindexarNiveles(cursoMN, claveMN);
        MFEscuelaDatos.guardarAhora("curso:" + claveMN).then(function () { rutear(); });
        rutear();
        toast((ES ? "Nivel " : "Level ") + (alturaMN + 1) + (ES ? " añadido" : " added"));
        return;
      }
      /* Quitar un peldaño: se lleva SUS misiones (a la papelera, que con
         Supabase las guarda 30 días) y los de abajo suben uno. */
      var quitaN = e.target.closest && e.target.closest("[data-quitar-nivel]");
      if (quitaN) {
        e.preventDefault();
        e.stopPropagation();
        var claveQN = ruta().curso;
        var cursoQN = capaCurso(claveQN);
        var nQN = parseInt(quitaN.getAttribute("data-quitar-nivel"), 10);
        if (!cursoQN || alturaCurso(cursoQN) < 2) return;
        var nvQN = cursoQN.niveles[String(nQN)];
        var tituloQN = (nvQN && capa(nvQN) && capa(nvQN).title) || "Nivel " + nQN;
        var dentro = cursoQN.misiones.filter(function (m) { return m.nivel === nQN; });
        var cuantas = dentro.filter(function (m) { return m.kind !== "exam"; }).length;
        var hayEx = dentro.length > cuantas;
        var lista = (cuantas ? cuantas + " " + (cuantas === 1 ? T.misione : T.misiones) : "") +
          (hayEx ? (cuantas ? " + " : "") + T.examen.toLowerCase() : "");
        confirmar(T.confirmarNivel.replace("{t}", tituloQN),
          dentro.length ? T.nivelLleno.replace("{n}", lista) : T.nivelVacio, function () {
            dentro.forEach(function (m) { MFEscuelaDatos.borrarFila(claveQN, "mision", m.id); });
            for (var k = nQN; k < 8; k++) {
              if (cursoQN.niveles[String(k + 1)]) {
                cursoQN.niveles[String(k)] = cursoQN.niveles[String(k + 1)];
                delete cursoQN.niveles[String(k + 1)];
              } else { delete cursoQN.niveles[String(k)]; }
            }
            cursoQN.misiones.forEach(function (m) { if (m.nivel > nQN) m.nivel -= 1; });
            reindexarNiveles(cursoQN, claveQN);
            MFEscuelaDatos.guardarAhora("curso:" + claveQN).then(function () { rutear(); });
            rutear();
            toast(tituloQN + (ES ? " quitado" : " removed"));
          });
        return;
      }
      var rest = e.target.closest && e.target.closest("[data-restaurar]");
      if (rest) {
        var claveR = ruta().curso;
        var parR = rest.getAttribute("data-restaurar").split(":");
        var cajaR = raiz.querySelector("[data-papelera]");
        var filasR = cajaR ? JSON.parse(cajaR.getAttribute("data-papelera-filas") || "{}") : {};
        var listaR = parR[0] === "mision" ? filasR.misiones : filasR.pergaminos;
        var filaR = (listaR || []).filter(function (f) { return f.id === parR[1]; })[0];
        if (!filaR) return;
        MFEscuelaDatos.restaurarFila(claveR, parR[0], filaR.datos).then(function () { rutear(); });
        return;
      }
      var copiaEs = e.target.closest && e.target.closest("[data-copiar-es]");
      if (copiaEs && misionActiva && misionActiva.m.es) {
        var kC = parseInt(raiz.querySelector("[data-carta]").getAttribute("data-carta"), 10);
        var clonC = JSON.parse(JSON.stringify(misionActiva.m.es.cards[kC]));
        if (kC < misionActiva.m.en.cards.length) misionActiva.m.en.cards[kC] = clonC;
        else misionActiva.m.en.cards.push(clonC);
        marcarTocado();
        rutear();
        return;
      }
      var copiaEsPerg = e.target.closest && e.target.closest("[data-copiar-es-perg]");
      if (copiaEsPerg && pergActivo && pergActivo.ent.es) {
        pergActivo.ent.en.cuerpo = JSON.parse(JSON.stringify(pergActivo.ent.es.cuerpo));
        pergActivo.ent.en.words = pergActivo.ent.es.words;
        marcarTocado();
        rutear();
        return;
      }
      var previa = e.target.closest && e.target.closest("[data-previa]");
      if (previa && pergActivo) {
        /* La vista previa es el LECTOR REAL del curso (MFPergamino): mismas
           páginas, mismo sello, mismo modal — con el BORRADOR de ahora mismo
           (`contenido`), no con lo publicado. Nada de ventanas propias. */
        var pcP = capa(pergActivo.ent);
        if (!window.MFPergamino) return;
        MFPergamino.abrir({
          id: pergActivo.ent.id + ":borrador", art: pergActivo.curso,
          kind: pergActivo.ent.layout === "tool" ? "tool" : "scroll",
          titulo: pcP.title, xp: 0,
          contenido: { id: pergActivo.ent.id, kind: pergActivo.ent.layout,
                       title: pcP.title, html: R(pcP.cuerpo.html), xp: 0 },
          hecho: function () { return true; },   /* un borrador no se «completa» */
          origen: previa,
        });
        return;
      }
    });
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        if (/TEXTAREA|INPUT/.test((document.activeElement || {}).tagName || "")) return;
        if (!pila.length) return;
        e.preventDefault();
        deshacer();
      }
    });
    raiz.addEventListener("keydown", function (e) {
      if (e.altKey && (e.key === "ArrowLeft" || e.key === "ArrowRight") && misionActiva) {
        var rK = ruta();
        if (rK.v !== "baraja") return;
        e.preventDefault();
        moverCarta(rK.k || 0, (rK.k || 0) + (e.key === "ArrowLeft" ? -1 : 1));
        return;
      }
    });
    /* --- los campos abiertos: escribir toca el borrador, sin re-render ---
       Re-renderizar en cada tecla robaría el foco; la tarjeta se refresca al
       salir del campo (blur), que es cuando el texto ya está completo. */
    var antesDeEditar = null;
    /* El orden SÍ re-renderiza: al tomar un número hay que apagarlo en las
       demás opciones, y un desplegable no pierde nada por refrescarse. */
    raiz.addEventListener("change", function (e) {
      var sel = e.target.closest && e.target.closest("[data-orden]");
      if (!sel || !misionActiva) return;
      var cartaO = parseInt(raiz.querySelector("[data-carta]").getAttribute("data-carta"), 10);
      var cardO = capa(misionActiva.m).cards[cartaO];
      var jO = parseInt(sel.getAttribute("data-orden"), 10);
      var opO = cardO.opciones[jO];
      var nO = parseInt(sel.value, 10);
      var mio = typeof opO.orden === "number" ? opO.orden : null;
      if (isNaN(nO)) { delete opO.orden; }
      else {
        /* la dueña anterior del número hereda el mío (o queda señuelo) */
        cardO.opciones.forEach(function (o, kk) {
          if (kk !== jO && o.orden === nO) {
            if (mio === null) delete o.orden; else o.orden = mio;
          }
        });
        opO.orden = nO;
      }
      /* la correcta viaja SIEMPRE con el paso 1 */
      cardO.opciones.forEach(function (o) { o.correct = o.orden === 1; });
      marcarTocado();
      rutear();
    });
    /* El dominio del nivel vive en el curso, no en una misión: tiene su propio
       camino de guardado (como el alta y la baja de niveles). Se escribe al
       salir del campo, con UNA palabra —los espacios se comen— y máx. 20. */
    raiz.addEventListener("change", function (e) {
      var dn = e.target.closest && e.target.closest("[data-dominio-nivel]");
      if (!dn) return;
      var rD = ruta();
      var cursoD = capaCurso(rD.curso);
      var nivelD = cursoD && cursoD.niveles[dn.getAttribute("data-dominio-nivel")];
      if (!nivelD) return;
      var limpio = dn.value.replace(/\s+/g, " ").trim();
      var nD = parseInt(dn.getAttribute("data-dominio-nivel"), 10);
      if (limpio.indexOf(" ") >= 0) {
        limpio = limpio.split(" ")[0];
        toast(T.dominioUna, { error: true });
      }
      limpio = limpio.slice(0, 20);
      var caraD = nivelD[langVista] || nivelD.es;
      if (!caraD) return;
      if (tituloDeNivel(nD, limpio, langVista) === caraD.title) return;
      caraD.title = tituloDeNivel(nD, limpio, langVista);
      MFEscuelaDatos.guardarAhora("curso:" + rD.curso).then(function () { rutear(); });
      rutear();
      toast(ES ? "Nombre del nivel guardado" : "Level name saved");
    });
    raiz.addEventListener("input", function (e) {
      var campo = e.target.closest && e.target.closest("[data-campo]");
      if (!campo) return;
      var ed = JSON.parse(campo.getAttribute("data-campo"));
      var ctxE = contextoEdicion();
      if (!ctxE) return;
      /* El paso de deshacer se captura en la PRIMERA tecla de la visita, no
         en el foco: `focus` no siempre llega (foco programático, móvil). */
      var entAntes = entidadActiva();
      if (antesDeEditar === null && entAntes) antesDeEditar = JSON.stringify(entAntes);
      escribirCampo(ctxE.capa, ed, campo.value);
      if (ed.contar === "palabras") ctxE.capa.words = MFEscuela.compilar.contarPalabras(campo.value);
      var cuenta = raiz.querySelector('[data-cuenta-de="' + campo.id + '"]');
      if (cuenta) {
        cuenta.textContent = textoCuenta(campo.value, ed);
        cuenta.className = "escuela-campo__cuenta" + claseCuenta(campo.value, ed);
      }
      MFEscuelaDatos.marcarSucio(ctxE.clave);
      pintarBotonGuardar();
    });
    raiz.addEventListener("focusout", function (e) {
      var campo = e.target.closest && e.target.closest("[data-campo]");
      if (!campo) return;
      var ent = entidadActiva();
      var ahora = ent ? JSON.stringify(ent) : null;
      if (!antesDeEditar || antesDeEditar === ahora) return;
      /* un paso de deshacer por VISITA al campo, no por tecla */
      previo = JSON.parse(antesDeEditar);
      antesDeEditar = null;
      marcarTocado();
      rutear();
    });
    /* El portero de la baraja: si la tarjeta que se deja atrás está a medias,
       la ruta VUELVE y se abre la ventana que explica qué falta. Moverse
       DENTRO de la misma tarjeta (o llegar por primera vez) no se toca. */
    var hashPrevio = location.hash;
    /* ---------- El río: arrastrar una miniatura la cambia de sitio ----------
       Con punteros y no con el arrastre nativo de HTML: el nativo no existe en
       móvil, y este panel es mobile-first como el resto de la casa. El enlace
       sigue siendo un enlace —un toque limpio navega—; solo cuando el dedo se
       mueve más de 6 px se convierte en arrastre y se cancela la navegación.
       El destino es la miniatura que hay DEBAJO del dedo: sueltas encima de la
       que quieres ocupar y te pones en su sitio. Sin cuentas de mitades — con
       fichas tan anchas, la posición del dedo ya es la respuesta. */
    var arr = null;   /* {ix, nodo, x0, y0, movido, destino} */

    function miniaturas() {
      return [].slice.call(raiz.querySelectorAll("[data-orden-carta]"));
    }
    function limpiarPistas() {
      miniaturas().forEach(function (n) {
        n.classList.remove("is-arrastrando", "is-antes", "is-despues");
      });
    }
    function destinoEn(x) {
      var minis = miniaturas();
      if (!minis.length) return arr.ix;
      if (x < minis[0].getBoundingClientRect().left) return 0;
      var ultima = minis.length - 1;
      if (x > minis[ultima].getBoundingClientRect().right) return ultima;
      for (var i = 0; i < minis.length; i++) {
        var r = minis[i].getBoundingClientRect();
        if (x >= r.left && x <= r.right) return i;
      }
      return arr.ix;   /* en el hueco entre dos: se queda donde estaba */
    }

    raiz.addEventListener("pointerdown", function (e) {
      if (!puedeEditar || e.button > 0) return;
      var mini = e.target.closest && e.target.closest("[data-orden-carta]");
      if (!mini) return;
      arr = { ix: parseInt(mini.getAttribute("data-orden-carta"), 10), nodo: mini,
              x0: e.clientX, y0: e.clientY, movido: false, destino: null };
    });

    raiz.addEventListener("pointermove", function (e) {
      if (!arr) return;
      if (!arr.movido) {
        if (Math.abs(e.clientX - arr.x0) < 6 && Math.abs(e.clientY - arr.y0) < 6) return;
        arr.movido = true;
        arr.nodo.classList.add("is-arrastrando");
        /* El puntero se captura DESPUÉS de decidir que hay arrastre: capturarlo
           antes se comería los clics limpios. */
        try { arr.nodo.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
      }
      e.preventDefault();
      var d = destinoEn(e.clientX);
      if (d === arr.destino) return;
      arr.destino = d;
      limpiarPistas();
      arr.nodo.classList.add("is-arrastrando");
      var minis = miniaturas();
      if (minis[d] && d !== arr.ix) minis[d].classList.add(d < arr.ix ? "is-antes" : "is-despues");
    });

    function soltarArrastre(e) {
      if (!arr) return;
      var a = arr;
      arr = null;
      limpiarPistas();
      if (!a.movido) return;                       /* fue un toque: navega solo */
      a.nodo.classList.add("no-navega");
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (a.destino !== null && a.destino !== a.ix) moverCarta(a.ix, a.destino);
    }
    raiz.addEventListener("pointerup", soltarArrastre);
    raiz.addEventListener("pointercancel", function () { arr = null; limpiarPistas(); });
    /* Un arrastre no debe navegar: el click llega DESPUÉS del pointerup. */
    raiz.addEventListener("click", function (e) {
      var mini = e.target.closest && e.target.closest("[data-orden-carta].no-navega");
      if (mini) { e.preventDefault(); mini.classList.remove("no-navega"); }
    }, true);

    window.addEventListener("hashchange", function () {
      var vieja = hashPrevio, nueva = location.hash;
      hashPrevio = nueva;
      var rv = ruta(vieja), rn = ruta(nueva);
      var mismaTarjeta = rn.v === "baraja" && rv.v === "baraja" &&
        rn.curso === rv.curso && rn.id === rv.id && rn.k === rv.k;
      if (rv.v === "baraja" && !mismaTarjeta && guardiaTarjeta(rv)) {
        hashPrevio = vieja;
        location.hash = vieja;
        return;
      }
      rutear();
    });
    /* La red de seguridad del navegador: cerrar o recargar con trabajo sin
       guardar pide confirmación (el aviso lo redacta el propio navegador). */
    window.addEventListener("beforeunload", function (e) {
      if (!haySinGuardar()) return;
      e.preventDefault();
      e.returnValue = "";
    });
    MFEscuelaDatos.onEstado(function (estado) {
      ultimoEstado = estado;
      pintarGuardado(estado);
    });
  }

  function pantalla(html) { raiz.innerHTML = html; }

  function arrancar(cuerpo) {
    cuerpo.innerHTML = '<div class="escuela" data-escuela></div>';
    raiz = cuerpo.querySelector("[data-escuela]");
    raiz.innerHTML = window.MFCargador ? MFCargador(T.cargando) : esc(T.cargando);
    MFEscuelaDatos.cargar().then(function (m) {
      modelo = m;
      /* El regalo de la cuenta (F6): TODO usuario con sesión entra a su
         escuela — quien no tiene cursos ve solo «Fundar un arte». */
      puedeEditar = true;
      if (!Object.keys(m.fuente.cursos).length && m.origen !== "sb") {
        pantalla('<div class="escuela-pronto"><span class="escuela-sello">印</span>' +
          "<h2>" + esc(T.errorCarga) + "</h2><p>" + esc(ES ? "No hay cursos en la fuente todavía (ejecuta el importador)." : "No courses in the source yet (run the importer).") + "</p></div>");
        return;
      }
      enganchar();
      rutear();
    }, function () {
      pantalla('<div class="escuela-pronto"><h2>' + esc(T.errorCarga) + "</h2>" +
        '<button type="button" class="btn btn--primary" data-reintenta>' + esc(T.reintentar) + "</button></div>");
      raiz.querySelector("[data-reintenta]").addEventListener("click", function () { arrancar(cuerpo); });
    });
  }

  document.addEventListener("mf:content", function (e) {
    var host = e.target;
    if (!host || !host.matches || !host.matches("[data-gate][data-kind='escuela']")) return;
    var cuerpo = host.querySelector("[data-gated-body]") || host;
    arrancar(cuerpo);
  });
})();

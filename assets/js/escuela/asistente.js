/* Tu Escuela — el asistente de generación (F3 y F4, docs/12 §3 y §8).
 *
 * TÉCNICA «MOLDE + RELLENO». Aquí no se le pide al modelo que invente un curso:
 * se le pide que RELLENE uno. La plataforma construye el molde con
 * `plantillaExamen` / `plantillaCurso` —ids, urls, cinturones, la baraja de
 * cada misión— y de ahí saca la lista exacta de claves de texto; la Edge
 * Function pide al modelo esas claves y nada más, con un esquema estricto; y
 * `materializarTextos` las devuelve a su sitio.
 *
 * Tres cosas se ganan con eso: la salida pesa lo que pesan las palabras (unos
 * 0,03 USD un examen de 10, unos 0,40 un curso de 8×3 con Sonnet 5), la
 * estructura no puede salir mal porque el modelo nunca la toca, y lo generado
 * pasa por las MISMAS guardias que lo escrito a mano — se guarda por la vía
 * única de F0, así que si tiene rojos, no se guarda.
 *
 * Un curso se genera POR NIVELES y cada nivel se guarda en cuanto llega: es
 * coherente con «guardar es publicar» y evita perderlo todo si la última
 * llamada falla.
 */
(function () {
  "use strict";
  var esc = MFDom.esc;   /* dom.js: una sola copia para todos */
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";

  var T = ES ? {
    tituloEx: "Crear examen con el asistente",
    tituloCurso: "Crear curso con el asistente",
    material: "Material de base",
    materialPie: "Pega aquí el texto del que saldrán las preguntas. Cuanto más concreto, mejores señuelos.",
    materialCurso: "Pega el texto del que saldrá el curso: apuntes, un guion, un artículo…",
    nombre: "Nombre", preguntas: "Preguntas", niveles: "Niveles", porNivel: "Misiones por nivel",
    investigar: "Completar con búsqueda web si falta material",
    generar: "Generar", generando: "Generando…", nivelN: "Nivel {n} de {t}…",
    listo: "Listo: revísalo y guarda cuando te guste",
    falloIA: "El asistente no pudo generar esto",
    sinCuota: "Has usado tu generación gratis. Hazte Maestro Fu para generar sin límite.",
    topeDia: "El asistente ha llegado a su tope de hoy. Inténtalo mañana.",
    tardo: "El asistente tardó demasiado. Prueba con menos material.",
    coste: "≈ {c} USD",
    aviso: "Lo que genere el asistente es un borrador tuyo: revísalo antes de compartirlo.",
  } : {
    tituloEx: "Create exam with the assistant",
    tituloCurso: "Create course with the assistant",
    material: "Source material",
    materialPie: "Paste the text the questions come from. The more concrete, the better the distractors.",
    materialCurso: "Paste the text the course comes from: notes, a script, an article…",
    nombre: "Name", preguntas: "Questions", niveles: "Levels", porNivel: "Missions per level",
    investigar: "Fill gaps with web search",
    generar: "Generate", generando: "Generating…", nivelN: "Level {n} of {t}…",
    listo: "Done: review it and save when you like it",
    falloIA: "The assistant could not generate this",
    sinCuota: "You used your free generation. Become a Fu Master for unlimited.",
    topeDia: "The assistant hit today's cap. Try tomorrow.",
    tardo: "The assistant took too long. Try with less material.",
    coste: "≈ {c} USD",
    aviso: "Whatever the assistant writes is your draft: review it before sharing.",
  };


  /* LOS PROMPTS DE SISTEMA TIENEN UNA FUENTE: la sección «## Sistema» de
     tools/prompts/generar-examen.md y generar-curso.md. build.py la inyecta en
     MF_CONFIG.prompts para el panel y de aquí viaja a la Edge Function, que no
     lleva prompt propio. El {IDIOMA} se rellena en el momento. Antes este
     archivo llevaba una copia recortada y el .md era solo documentación: dos
     prompts y ninguno mandaba del todo (radiografía 2026-09-04). El mínimo de
     abajo solo evita que el asistente salga sin instrucciones si un build viejo
     no trajo los prompts. */
  var PROMPTS = cfg.prompts || {};
  function idiomaDe(lang) { return lang === "en" ? "inglés" : "español"; }
  function sistemaExamen(lang) {
    return (PROMPTS.examen || "Eres el redactor de exámenes de MenteFu. Escribes en {IDIOMA}. Devuelves SOLO los textos de las claves pedidas.")
      .replace("{IDIOMA}", idiomaDe(lang));
  }
  function sistemaCurso(lang) {
    return (PROMPTS.curso || "Eres el redactor de cursos de MenteFu. Escribes en {IDIOMA}. Devuelves SOLO los textos de las claves pedidas.")
      .replace("{IDIOMA}", idiomaDe(lang));
  }

  function fallo(err) {
    var t = String((err && err.message) || err || "");
    if (t.indexOf("tope-diario") >= 0) return T.topeDia;
    if (t.indexOf("cuota") >= 0) return T.sinCuota;
    if (t.indexOf("tiempo-agotado") >= 0) return T.tardo;
    return T.falloIA + (t ? " (" + t + ")" : "");
  }

  /* Una llamada al asistente: se le dan las claves y el material, devuelve los
     textos. El sistema y el material van aparte para que la función pueda
     cachear el material entre lotes (docs/12 §8). */
  function pedir(accion, claves, sistema, material, encargo) {
    return SB.fn("escuela-ia", {
      accion: accion, claves: claves, sistema: sistema, material: material, encargo: encargo,
    });
  }

  window.MFAsistente = {
    T: T, esc: esc, pedir: pedir, fallo: fallo,
    sistemaExamen: sistemaExamen, sistemaCurso: sistemaCurso,

    /* ------------------------------------------------- examen (F3) ------ */
    /* Devuelve una promesa con el curso-examen YA relleno, listo para fundar.
       No guarda: de eso se encarga quien lo llame, por la vía única. */
    generarExamen: function (opts) {
      var C = MFEscuela.compilar;
      var lang = opts.lang || cfg.lang || "es";
      var hecho = C.plantillaExamen(opts.clave, opts.nombre, {
        lang: lang, n: opts.n, intentos: opts.intentos, tiempo_min: opts.tiempo_min,
      });
      var curso = hecho.curso;
      /* Las claves del examen: la portada y las N preguntas. Se piden TODAS de
         una vez porque un examen entero cabe de sobra en una llamada. */
      var claves = C.clavesDeTextos(curso, lang, "mision." + hecho.mision.id + ".");
      var encargo = "Rellena el examen «" + opts.nombre + "» de " + opts.n +
        " preguntas. La clave que acaba en `card.0.cuerpo` es la PORTADA: un párrafo corto que " +
        "presente el examen y anime a empezar. Las demás son las preguntas, en orden.";
      return pedir("examen", claves, sistemaExamen(lang), opts.material || "", encargo)
        .then(function (r) {
          C.materializarTextos(curso, lang, (r && r.textos) || {});
          curso[lang].title = opts.nombre;
          hecho.mision[lang].title = opts.nombre;
          return { curso: curso, mision: hecho.mision, uso: r && r.uso };
        });
    },

    /* -------------------------------------------------- curso (F4) ------ */
    /* Genera NIVEL A NIVEL y avisa por cada uno (`alNivel`) para que quien
       llame pueda guardarlo en cuanto llega: así un fallo en el nivel 6 no se
       lleva por delante los cinco anteriores. */
    generarCurso: function (opts) {
      var C = MFEscuela.compilar;
      var lang = opts.lang || cfg.lang || "es";
      var curso = C.plantillaCurso(opts.clave, opts.nombre, {
        lang: lang, niveles: opts.niveles, misiones: opts.misiones, categoria: opts.categoria,
      });
      var sistema = sistemaCurso(lang);
      var usos = [];

      /* Primero la cáscara: título, descripción y los rótulos de nivel y sala.
         Es barata y le da al modelo el marco antes de escribir las misiones. */
      var clavesRaiz = C.clavesDeTextos(curso, lang).filter(function (k) {
        return k.indexOf("mision.") !== 0 && k.indexOf("pergamino.") !== 0;
      });
      var cadena = pedir("esqueleto", clavesRaiz, sistema, opts.material || "",
        "Rellena la presentación del curso «" + opts.nombre + "» y los rótulos de sus " +
        opts.niveles + " niveles. Cada `nivel.N.dominio` es UNA palabra que nombre lo que se " +
        "entrena en ese nivel." + (opts.investigar ? " Si el material no alcanza, complétalo con lo que sepas del tema." : ""))
        .then(function (r) {
          C.materializarTextos(curso, lang, (r && r.textos) || {});
          curso[lang].title = opts.nombre;
          if (r && r.uso) usos.push(r.uso);
          if (opts.alNivel) opts.alNivel(0, opts.niveles, curso);
          return curso;
        });

      /* Y luego un nivel por llamada. En serie a propósito: el modelo ve lo que
         ya se escribió (el dominio del nivel) y no repite ideas. */
      var _loop = function (n) {
        cadena = cadena.then(function () {
          var deNivel = curso.misiones.filter(function (m) { return m.nivel === n; });
          var claves = [];
          deNivel.forEach(function (m) {
            claves = claves.concat(C.clavesDeTextos(curso, lang, "mision." + m.id + "."));
          });
          var dominio = C.dominioDeNivel(curso.niveles[String(n)][lang].title);
          return pedir("nivel", claves, sistema, opts.material || "",
            "Rellena el nivel " + n + " («" + dominio + "») del curso «" + opts.nombre + "». " +
            "Sus misiones van de menos a más. La última entidad del nivel es el EXAMEN de cinturón: " +
            "seis preguntas que repasan lo del nivel, y su `card.0.cuerpo` presenta el examen.")
            .then(function (r) {
              C.materializarTextos(curso, lang, (r && r.textos) || {});
              if (r && r.uso) usos.push(r.uso);
              if (opts.alNivel) opts.alNivel(n, opts.niveles, curso);
              return curso;
            });
        });
      };
      for (var n = 1; n <= opts.niveles; n++) _loop(n);

      return cadena.then(function () {
        return { curso: curso, usos: usos };
      });
    },
  };
})();

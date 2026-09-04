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

  function esc(t) {
    return String(t == null ? "" : t)
      .split("&").join("&amp;").split("<").join("&lt;")
      .split(">").join("&gt;").split('"').join("&quot;");
  }

  /* Los prompts viven en tools/prompts/*.md y se copian al bundle de la función
     al desplegar; aquí solo viaja el ENCARGO (qué claves y con qué contexto),
     porque el sistema ya lo pone la función. Se manda igualmente el sistema
     corto para que la función no dependa de un archivo si se despliega suelta. */
  function sistemaExamen(lang) {
    return "Eres el redactor de exámenes de MenteFu. Escribes en " + (lang === "en" ? "inglés" : "español") +
      ". Devuelves SOLO los textos de las claves pedidas. Cada pregunta: enunciado de una idea (≤220), " +
      "tres opciones donde la 0 es la CORRECTA y la 1 y la 2 son señuelos plausibles (un error común, " +
      "una verdad a medias), una respuesta corta por opción (≤24, es la etiqueta que se dibuja sobre la " +
      "pieza del juego) y un feedback que ENSEÑA en cada opción. Sin citas de autores. Sin inventar datos. " +
      "Tono cercano, de tú.";
  }
  function sistemaCurso(lang) {
    return "Eres el redactor de cursos de MenteFu, donde se aprende jugando. Escribes en " +
      (lang === "en" ? "inglés" : "español") + ". Devuelves SOLO los textos de las claves pedidas. " +
      "Las claves `vineta` son las viñetas de una escena en cómic: frases cortas de una situación cotidiana. " +
      "Las claves `frase` de un revela son tres ideas que se descubren una a una. Las `quiz` son preguntas " +
      "que se juegan: tres opciones, la 0 correcta, señuelos plausibles, respuesta corta ≤24 y feedback que " +
      "enseña. Los `cuerpo` son prosa breve, una idea por tarjeta, ≤60 palabras. Sin citas de autores.";
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

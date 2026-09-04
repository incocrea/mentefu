/* Tu Escuela — compilador y ensamblador de contenido (F0, docs/10-tu-escuela).
 *
 * Dos oficios en un archivo, a propósito:
 *
 * 1) ENSAMBLAR: fuente estructurada (pares {md, html} importados de build.py)
 *    → las MISMAS filas `content` que build.py siembra en Supabase. Los html
 *    de la fuente llevan {P} y {SISTER} literales; aquí se resuelven POR FILA
 *    consumidora, porque el prefijo relativo depende de la profundidad de la
 *    página que muestra el contenido (la misma quiz apunta distinto desde su
 *    misión que desde el banco de la sala de retos).
 *
 * 2) COMPILAR EDICIÓN: markdown ligero del editor → HTML seguro con la
 *    tipografía de la casa (comillas «smarty», rayas, puntos suspensivos).
 *    SOLO para campos que el maestro toca; el corpus importado publica su
 *    html de build.py byte a byte.
 *
 * Corre en navegador (window.MFEscuela) y en node (module.exports) para que
 * tools/escuela_verificar.mjs demuestre la paridad contra el seed real.
 */
(function (raiz) {
  "use strict";

  /* El audio de los pergaminos, DESHABILITADO (titular 2026-09-04). Espejo
     exacto de AUDIO_PERGAMINOS en build.py: sin él, apagar el audio solo en el
     generador dejaba encendido el de la ESCUELA, que es quien escribe las filas
     `content` de un curso vivo — y el reproductor seguía saliendo en el modal
     con un minipodcast de dos minutos sobre una cápsula de cinco líneas (lo vio
     el titular en producción). Poner los DOS en true vuelve a conectarlo. */
  var AUDIO_PERGAMINOS = false;

  /* Economía y escalera FIJAS de plataforma (espejo de build.py:100-125). */
  var XP = { mission: 20, exam: 50, scroll: 10, tool: 15 };
  var BELTS = ["white", "yellow", "orange", "green", "blue", "purple", "brown", "black"];

  /* ------------------------------------------------------------ utilidades */

  function profundidad(url) {
    var n = 0;
    for (var i = 0; i < url.length; i++) if (url[i] === "/") n++;
    return n;
  }
  function prefijoDe(url) { return new Array(profundidad(url) + 1).join("../"); }

  /* Resuelve {P}/{SISTER} en un html de la fuente para una fila concreta. */
  function resolver(html, prefix, otherRoot) {
    return String(html == null ? "" : html)
      .split("{P}").join(prefix)
      .split("{SISTER}").join(otherRoot);
  }

  /* Puerto de texto_plano (build.py:457): el texto desnudo de un html, con
     las entidades de smarty desescapadas y el recorte contando el «…» DENTRO
     del tope. Lo usa la entrada de pool («pregunta») y debe coincidir. */
  var ENTIDADES = {
    amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
    hellip: "…", mdash: "—", ndash: "–",
    ldquo: "“", rdquo: "”", lsquo: "‘", rsquo: "’",
    laquo: "«", raquo: "»",
  };
  function desescapar(t) {
    return t.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, function (todo, cuerpo) {
      if (cuerpo[0] === "#") {
        var cod = cuerpo[1] === "x" || cuerpo[1] === "X"
          ? parseInt(cuerpo.slice(2), 16) : parseInt(cuerpo.slice(1), 10);
        return isNaN(cod) ? todo : String.fromCodePoint(cod);
      }
      return Object.prototype.hasOwnProperty.call(ENTIDADES, cuerpo) ? ENTIDADES[cuerpo] : todo;
    });
  }
  function textoPlano(fragmento, tope) {
    var t = desescapar(String(fragmento || "").replace(/<[^>]+>/g, " "));
    t = t.replace(/\s+/g, " ").trim();
    if (tope && t.length > tope) t = t.slice(0, tope - 1).replace(/\s+$/, "") + "…";
    return t;
  }

  /* ------------------------------------------- fuente → tarjetas compiladas */

  function copiarReto(card, destino) {
    if (card.reto) destino.reto = card.reto;
    return destino;
  }

  /* El texto de una opción. Desde 2026-09-02 el maestro solo escribe la
     RESPUESTA CORTA (esta plataforma no tiene quiz clásico: las preguntas se
     juegan), pero el runtime y el pool de señuelos siguen esperando un `html`.
     Si el texto largo está vacío, manda la corta. Las opciones importadas, que
     traen los dos, no cambian ni un byte. */
  function htmlOpcion(op, R) {
    var h = R((op.texto && op.texto.html) || "");
    return h || (op.corta ? escaparHtml(op.corta) : "");
  }

  /* Una tarjeta fuente → la tarjeta que consume mission.js (build_card). */
  function compilarCard(card, R) {
    var tipo = card.tipo, out, i, op, o;
    if (tipo === "quiz" || tipo === "choice") {
      out = { type: tipo, html: R(card.enunciado.html), options: [], feedback: R(card.feedback.html) };
      for (i = 0; i < card.opciones.length; i++) {
        op = card.opciones[i];
        o = { html: htmlOpcion(op, R), correct: !!op.correct, feedback: R(op.feedback.html) };
        if (op.corta) o.corta = op.corta;
        if (typeof op.orden === "number") o.orden = op.orden;
        if (op.extra) o.extra = op.extra;
        out.options.push(o);
      }
      return copiarReto(card, out);
    }
    if (tipo === "apuesta") {
      out = { type: tipo, html: R(card.enunciado.html), options: [] };
      for (i = 0; i < card.opciones.length; i++) {
        op = card.opciones[i];
        out.options.push({ html: R(op.texto.html), correct: !!op.correct, feedback: R(op.feedback.html) });
      }
      return copiarReto(card, out);
    }
    if (tipo === "revela") {
      out = { type: "revela", html: R(card.enunciado.html), frases: [] };
      for (i = 0; i < card.frases.length; i++) out.frases.push(R(card.frases[i].html));
      return copiarReto(card, out);
    }
    if (tipo === "escena") {
      /* Sin `html`: la escena perdió su entradilla (titular 2026-09-02) y
         habla sola por sus viñetas. */
      out = { type: "escena", vinetas: [] };
      for (i = 0; i < card.vinetas.length; i++) {
        var v = card.vinetas[i];
        var vin = { fondo: v.fondo, ancla: v.ancla, pose: v.pose, html: R(v.texto.html) };
        /* La dirección solo viaja cuando el autor la decidió: sin ella manda
           el ancla, y el corpus importado compila byte a byte como siempre. */
        if (typeof v.flip === "boolean") vin.flip = v.flip;
        out.vinetas.push(vin);
      }
      return copiarReto(card, out);
    }
    if (tipo === "scroll") {
      out = { type: "scroll", html: R(card.cuerpo.html), title: card.titulo, href: R(card.href) };
      return copiarReto(card, out);
    }
    if (tipo === "reflect") {
      return copiarReto(card, { type: "reflect", html: R(card.cuerpo.html), placeholder: card.placeholder || "" });
    }
    /* `text` y cualquier tarjeta de cuerpo simple. Un tipo RETIRADO (las
       «puertas» del 2026-09-03, el microreto, el juego «pasa») puede seguir
       vivo en la base de un curso guardado antes de la retirada: se OMITE en
       vez de reventar el ensamblador entero — una tarjeta de menos es un
       arreglo editorial; un panel que no carga deja al maestro sin curso. */
    /* Se mira si el campo EXISTE, no si tiene texto: una tarjeta `text` recién
       creada está vacía a propósito (la portada de un examenFu nace así) y debe
       compilar igual. Solo se omite la que no trae `cuerpo` en absoluto, que es
       la señal de un tipo retirado guardado antes de la retirada. */
    if (!card.cuerpo) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("compilar: tarjeta de tipo «" + tipo + "» sin cuerpo — omitida (¿tipo retirado?)");
      }
      return null;
    }
    return copiarReto(card, { type: tipo, html: R(card.cuerpo.html) });
  }

  /* --------------------------------------------------------- el ensamblador */

  /* Contexto por (curso, lang): índices y prefijos que las filas comparten. */
  function contexto(fuente, clave, lang) {
    var curso = fuente.cursos[clave];
    var capaArte = curso[lang];
    if (!capaArte) return null;
    /* La clave CANÓNICA del arte es la misma en ambos idiomas (el frontmatter
       EN declara `art: culpafu`): las filas del seed la llevan, no la carpeta. */
    var artDir = clave;
    var porUrl = {};                    /* url de pergamino → entrada */
    for (var i = 0; i < curso.pergaminos.length; i++) {
      var p = curso.pergaminos[i];
      if (p[lang]) porUrl[p[lang].url] = p;
    }
    return {
      curso: curso, lang: lang, capaArte: capaArte, artDir: artDir,
      porUrl: porUrl, audio: (fuente.audio && fuente.audio[lang]) || [],
      /* raíz del otro idioma, relativa — espejo de build.py:1379 */
      otherRoot: function (prefix, aprefix) {
        return lang === "es" ? prefix + "en/" : aprefix;
      },
    };
  }

  function prefijos(ctx, url) {
    /* La demo del panel fuerza SUS prefijos: los enlaces del contenido deben
       resolverse desde /escuela/, no desde la página real de la misión. */
    if (ctx.forzar) return ctx.forzar;
    var prefix = prefijoDe(url);
    var aprefix = prefix + (ctx.lang === "en" ? "../" : "");
    return { prefix: prefix, aprefix: aprefix, otherRoot: ctx.otherRoot(prefix, aprefix) };
  }

  function R_de(ctx, url) {
    var pr = prefijos(ctx, url);
    return function (html) { return resolver(html, pr.prefix, pr.otherRoot); };
  }

  function xpPergamino(ent, capa) {
    if (capa.xp) return capa.xp;
    return ent.layout === "tool" ? XP.tool : XP.scroll;
  }

  /* La tarjeta scroll gana item/itemArt/itemXp/itemKind/audio si su destino es
     un pergamino real del curso (espejo de build.py:1399-1411). */
  function enriquecerScroll(c, ctx, prefix, aprefix) {
    if (c.type !== "scroll" || !c.href || c.href.indexOf(prefix) !== 0) return;
    var ent = ctx.porUrl[c.href.slice(prefix.length)];
    if (!ent) return;
    var capa = ent[ctx.lang];
    c.item = ent.id;
    c.itemArt = ctx.artDir;
    c.itemXp = xpPergamino(ent, capa);
    c.itemKind = ent.layout === "tool" ? "tool" : "scroll";
    if (AUDIO_PERGAMINOS && ctx.audio.indexOf(ent.id) >= 0) {
      c.audio = aprefix + "assets/audio/" + ctx.lang + "/" + ent.id + ".mp3";
    }
  }

  /* Pools de señuelos por nivel (espejo de llenar_pools): tarjetas quiz de las
     misiones del nivel EN ORDEN DE ARCHIVO (ordenArchivo del walk del
     importador: los exámenes van alfabéticamente antes que las misiones). */
  function armarPools(ctx) {
    var pools = {};
    var misiones = ctx.curso.misiones.slice().sort(function (a, b) {
      return (a.ordenArchivo[ctx.lang] || 0) - (b.ordenArchivo[ctx.lang] || 0);
    });
    for (var i = 0; i < misiones.length; i++) {
      var m = misiones[i], capa = m[ctx.lang];
      if (!capa) continue;
      var R = R_de(ctx, capa.url);
      var pool = pools[m.nivel] = pools[m.nivel] || [];
      for (var ic = 0; ic < capa.cards.length; ic++) {
        var card = capa.cards[ic];
        if (card.tipo !== "quiz") continue;
        var negado = !!(card.reto && card.reto.negado);
        var pregunta = textoPlano(R(card.enunciado.html), 140);
        for (var io = 0; io < card.opciones.length; io++) {
          var op = card.opciones[io];
          var entrada = {
            de: m.id + "#" + ic + "#" + io, html: htmlOpcion(op, R),
            corta: op.corta || null, correct: !!op.correct, feedback: R(op.feedback.html),
          };
          if (negado) entrada.negado = true;
          if (pregunta) entrada.pregunta = pregunta;
          pool.push(entrada);
        }
      }
    }
    return pools;
  }

  /* Misiones ordenadas como las listas del curso: (nivel, examen al final, orden). */
  function misionesOrdenadas(curso) {
    return curso.misiones.slice().sort(function (a, b) {
      return (a.nivel - b.nivel)
        || ((a.kind === "exam") - (b.kind === "exam"))
        || (a.orden - b.orden);
    });
  }

  function filaMision(ctx, pools, lista, idx) {
    var m = lista[idx], capa = m[ctx.lang];
    var pr = prefijos(ctx, capa.url);
    var R = R_de(ctx, capa.url);
    var cards = [];
    for (var i = 0; i < capa.cards.length; i++) {
      var c = compilarCard(capa.cards[i], R);
      if (!c) continue;                      /* tipo retirado: se omite */
      enriquecerScroll(c, ctx, pr.prefix, pr.aprefix);
      cards.push(c);
    }
    /* la siguiente misión DEL MISMO NIVEL (mismo directorio en build.py) */
    var nxt = null;
    if (idx + 1 < lista.length && lista[idx + 1].nivel === m.nivel) {
      var sCapa = lista[idx + 1][ctx.lang];
      if (sCapa) nxt = { title: sCapa.title, href: pr.prefix + sCapa.url };
    }
    var nivel = ctx.curso.niveles[String(m.nivel)];
    var nivelCapa = nivel && nivel[ctx.lang];
    var data = {
      id: m.id, kind: m.kind, art: ctx.artDir, level: m.nivel,
      xp: capa.xp || (m.kind === "exam" ? XP.exam : XP.mission),
      title: capa.title, cards: cards, next: nxt,
      levelHref: nivelCapa ? pr.prefix + nivelCapa.url : pr.prefix,
    };
    if (m.kind === "exam" && capa.siguiente) data.siguiente = R(capa.siguiente.html);
    /* Cinturón redistribuido (00-PLAN §3.7): solo viaja cuando difiere de la
       escalera fija — así CulpaFu compila byte a byte como siempre y el
       round-trip de F0 sigue limpio. */
    if (m.kind === "exam" && nivel && nivel.belt && BELTS[m.nivel - 1] !== nivel.belt) {
      data.belt = nivel.belt;
    }
    if (m.kind === "exam" && m.nivel) {
      var lp = ctx.curso.niveles[String(m.nivel + 1)];
      var lpCapa = lp && lp[ctx.lang];
      if (lpCapa) data.nextLevel = { title: lpCapa.title, href: pr.prefix + lpCapa.url };
    }
    /* examenFu (docs/12 §2): el examen suelto que un maestro comparte por
       enlace. Los ajustes viajan en la fila para que mission.js sepa cuántas
       rondas jugar, con cuántos aciertos se aprueba y si hay reloj o tope de
       intentos, sin tener que consultar la base. `examenFu: true` es lo que
       separa este examen del examen de CINTURÓN de un curso, que no lleva
       reloj ni intentos y sí reparte cinturón. */
    if (m.kind === "exam" && ctx.curso.tipo === "examen") {
      var ex = ctx.curso.examen || {};
      data.examenFu = true;
      data.clave = ctx.artDir;
      data.rondas = ex.n || cards.filter(function (c) { return c.type === "quiz"; }).length;
      data.aprobar_min = ex.aprobar_min || Math.max(1, Math.ceil(data.rondas * 0.75));
      data.intentos = ex.intentos == null ? null : ex.intentos;
      data.tiempo_min = ex.tiempo_min == null ? null : ex.tiempo_min;
      delete data.nextLevel;             /* no hay nivel siguiente que ofrecer */
      delete data.belt;                  /* un examenFu no reparte cinturón */
    }
    data.pool = pools[m.nivel] || [];
    return { id: ctx.lang + ":" + m.id, lang: ctx.lang, kind: m.kind, art: ctx.artDir, url: capa.url, data: data };
  }

  function filaPergamino(ctx, ent) {
    var capa = ent[ctx.lang];
    var R = R_de(ctx, capa.url);
    var data = {
      id: ent.id, kind: ent.layout, art: ctx.artDir, title: capa.title,
      html: R(capa.cuerpo.html), xp: xpPergamino(ent, capa),
    };
    return { id: ctx.lang + ":" + ent.id, lang: ctx.lang, kind: ent.layout, art: ctx.artDir, url: capa.url, data: data };
  }

  /* Los pergaminos del arte en el orden del entrenamiento (scrolls_del_arte). */
  function itemsAudioteca(ctx, salaUrl) {
    var pr = prefijos(ctx, salaUrl);
    var vistos = {}, items = [];
    var lista = misionesOrdenadas(ctx.curso);
    for (var i = 0; i < lista.length; i++) {
      var m = lista[i], capa = m[ctx.lang];
      if (!capa) continue;
      for (var ic = 0; ic < capa.cards.length; ic++) {
        var card = capa.cards[ic];
        if (card.tipo !== "scroll") continue;
        var href = resolver(card.href, pr.prefix, pr.otherRoot);
        if (href.indexOf(pr.prefix) !== 0) continue;
        var ent = ctx.porUrl[href.slice(pr.prefix.length)];
        if (!ent || vistos[ent.id]) continue;
        vistos[ent.id] = true;
        var pc = ent[ctx.lang];
        var nivel = ctx.curso.niveles[String(m.nivel)];
        var nivelCapa = nivel && nivel[ctx.lang];
        items.push({
          id: ent.id, title: pc.title,
          summary: pc.summary || pc.description,
          href: pr.prefix + pc.url,
          audio: (AUDIO_PERGAMINOS && ctx.audio.indexOf(ent.id) >= 0)
            ? pr.aprefix + "assets/audio/" + ctx.lang + "/" + ent.id + ".mp3" : null,
          xp: xpPergamino(ent, pc),
          kind: ent.layout === "tool" ? "tool" : "scroll",
          level: m.nivel, levelTitle: nivelCapa ? nivelCapa.title : "",
          belt: m.nivel >= 1 && m.nivel <= 8 ? BELTS[m.nivel - 1] : null,
          mission: capa.title, minutes: Math.max(1, Math.round(pc.words / 200)),
        });
      }
    }
    return items;
  }

  /* El banco de la sala de retos: las quiz de las misiones (sin exámenes),
     compiladas con el prefijo de LA SALA (banco_de_preguntas). */
  function bancoSala(ctx, salaUrl) {
    var R = R_de(ctx, salaUrl);
    var banco = [];
    var lista = ctx.curso.misiones.slice().sort(function (a, b) {
      return (a.nivel - b.nivel) || (a.orden - b.orden);
    });
    for (var i = 0; i < lista.length; i++) {
      var m = lista[i];
      if (m.kind === "exam") continue;
      var capa = m[ctx.lang];
      if (!capa) continue;
      var cards = [];
      for (var ic = 0; ic < capa.cards.length; ic++) {
        if (capa.cards[ic].tipo === "quiz") cards.push(compilarCard(capa.cards[ic], R));
      }
      if (!cards.length) continue;
      banco.push({ mision: m.id, nivel: m.nivel, titulo: capa.title, cards: cards });
    }
    return banco;
  }

  function filaSala(ctx, tipo, pools) {
    var sala = ctx.curso.salas[tipo];
    var capa = sala[ctx.lang];
    var R = R_de(ctx, capa.url);
    var data;
    if (tipo === "pergaminos") {
      data = { id: sala.id, kind: "audioteca", art: ctx.artDir, title: capa.title,
               html: R(capa.cuerpo.html), xp: 0, items: itemsAudioteca(ctx, capa.url) };
    } else {
      var ps = {};
      for (var n in pools) if (pools[n] && Number(n)) ps[String(n)] = pools[n];
      data = { id: sala.id, kind: "sala-retos", art: ctx.artDir, title: capa.title,
               html: R(capa.cuerpo.html), xp: 0, banco: bancoSala(ctx, capa.url), pools: ps };
    }
    return { id: ctx.lang + ":" + sala.id, lang: ctx.lang, kind: data.kind, art: ctx.artDir, url: capa.url, data: data };
  }

  /* TODAS las filas content de un curso en un idioma (misiones, exámenes,
     pergaminos, herramientas, audioteca y sala de retos). */
  function armarCurso(fuente, clave, lang) {
    var ctx = contexto(fuente, clave, lang);
    if (!ctx) return [];
    var filas = [];
    var pools = armarPools(ctx);
    var lista = misionesOrdenadas(ctx.curso);
    for (var i = 0; i < lista.length; i++) {
      if (lista[i][lang]) filas.push(filaMision(ctx, pools, lista, i));
    }
    for (var j = 0; j < ctx.curso.pergaminos.length; j++) {
      if (ctx.curso.pergaminos[j][lang]) filas.push(filaPergamino(ctx, ctx.curso.pergaminos[j]));
    }
    if (ctx.curso.salas.pergaminos && ctx.curso.salas.pergaminos[lang]) filas.push(filaSala(ctx, "pergaminos", pools));
    if (ctx.curso.salas.retos && ctx.curso.salas.retos[lang]) filas.push(filaSala(ctx, "retos", pools));
    return filas;
  }

  /* El ÍNDICE de un curso para el player dinámico (/curso/): la estructura
     que el mapa necesita — niveles ACTIVOS (con misiones) y pergaminos —,
     publicada como fila `escuela-curso` junto al resto. */
  function armarIndiceCurso(fuente, clave, lang) {
    var ctx = contexto(fuente, clave, lang);
    if (!ctx) return null;
    /* El player lee `tipo` para saltarse el mapa de niveles cuando es un
       examenFu y llevar directo a la única misión (docs/12 §2.3). */
    var tipoCurso = ctx.curso.tipo || "curso";
    var capaArte = ctx.capaArte;
    var niveles = [];
    for (var n = 1; n <= 8; n++) {
      var nivel = ctx.curso.niveles[String(n)];
      var misiones = [];
      var lista = misionesOrdenadas(ctx.curso);
      for (var i = 0; i < lista.length; i++) {
        var m = lista[i];
        if (m.nivel !== n) continue;
        var capaM = m[lang];
        if (!capaM) continue;
        misiones.push({ id: m.id, kind: m.kind, title: capaM.title,
                        url: capaM.url, cards: capaM.cards.length });
      }
      if (!misiones.length) continue;             /* nivel inactivo: no existe */
      var capaN = nivel && nivel[lang];
      niveles.push({ n: n, belt: (nivel && nivel.belt) || BELTS[n - 1],
                     title: capaN ? capaN.title : "Nivel " + n,
                     description: capaN ? capaN.description : "",
                     url: capaN ? capaN.url : "", misiones: misiones });
    }
    var pergaminos = [];
    for (var j = 0; j < ctx.curso.pergaminos.length; j++) {
      var p = ctx.curso.pergaminos[j];
      var capaP = p[lang];
      if (!capaP) continue;
      pergaminos.push({ id: p.id, layout: p.layout, title: capaP.title,
                        kicker: capaP.kicker || "", words: capaP.words || 0, url: capaP.url,
                        audio: AUDIO_PERGAMINOS && ctx.audio.indexOf(p.id) >= 0,
                        xp: xpPergamino(p, capaP) });
    }
    /* Los idiomas DISPONIBLES del curso (con capa de verdad): el selector del
       player ofrece estos, no la lista declarada — un añadido pendiente de
       traducir no aparece hasta que la traducción lo llena. */
    var idiomas = idiomasDe(ctx.curso).filter(function (lg) {
      return lg === baseDe(ctx.curso) || ctx.curso.misiones.some(function (m) { return !!m[lg]; });
    });
    return { id: "curso-" + clave, kind: "escuela-curso", clave: clave,
             tipo: tipoCurso, examen: ctx.curso.examen || null,
             idioma_base: baseDe(ctx.curso), idiomas: idiomas,
             title: capaArte.title, description: capaArte.description || "",
             categoria: ctx.curso.categoria || "general",
             niveles: niveles, pergaminos: pergaminos };
  }

  /* La baraja de UNA misión para el modo Probar del panel: mismas tarjetas,
     mismo pool de señuelos del nivel, pero con los enlaces resueltos desde la
     página del panel (prefix/aprefix suyos). Devuelve el `data` que espera
     mission.js, o null si la misión no existe en ese idioma. */
  function armarMisionDemo(fuente, clave, lang, misionId, prefix, aprefix) {
    var ctx = contexto(fuente, clave, lang);
    if (!ctx) return null;
    ctx.forzar = { prefix: prefix, aprefix: aprefix, otherRoot: ctx.otherRoot(prefix, aprefix) };
    var pools = armarPools(ctx);
    var lista = misionesOrdenadas(ctx.curso);
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].id === misionId && lista[i][lang]) return filaMision(ctx, pools, lista, i).data;
    }
    return null;
  }

  /* ------------------------------------------ markdown ligero de EDICIÓN --- */

  /* Escapado total primero; después se abren SOLO las marcas permitidas. La
     tipografía imita a smarty: comillas de apertura/cierre, rayas y «…». */
  function escaparHtml(t) {
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function tipografia(t) {
    return t
      .replace(/\.\.\./g, "&hellip;")
      .replace(/---/g, "&mdash;").replace(/--/g, "&ndash;")
      .replace(/(^|[\s(\[{&«])"/g, "$1&ldquo;").replace(/"/g, "&rdquo;")
      .replace(/(^|[\s(\[{&«])'/g, "$1&lsquo;").replace(/'/g, "&rsquo;");
  }
  function marcasInline(t) {
    /* enlaces [texto]({P}ruta/) — solo rutas internas {P}/{SISTER}, http(s)
       y relativas simples; nada de javascript: ni data: */
    t = t.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, function (todo, texto, href) {
      if (!/^(\{P\}|\{SISTER\}|https?:\/\/|\.{0,2}\/|#)/.test(href)) return todo;
      return '<a href="' + href.replace(/"/g, "&quot;") + '">' + texto + "</a>";
    });
    t = t.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
    t = t.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
    t = t.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    return t;
  }
  function mdInline(md) {
    return marcasInline(tipografia(escaparHtml(md))).trim();
  }
  /* Un bloque de HTML crudo de la casa (callouts, chain, quote-big, compare)
     puede pasar TAL CUAL, pero solo si no lleva nada ejecutable: cualquier
     rastro de script/manejadores lo manda al escape completo. Los pergaminos
     importados de CulpaFu llevan estos bloques y editarlos no debe romperlos. */
  var HTML_PELIGROSO = /<\s*script|<\s*iframe|<\s*object|<\s*embed|<\s*link|<\s*meta|on[a-z]+\s*=|javascript:|data:text\/html/i;
  function bloqueHtmlCrudo(b) {
    if (b[0] !== "<") return null;
    if (HTML_PELIGROSO.test(b)) return "<p>" + mdInline(b).replace(/\n/g, "<br>") + "</p>";
    return b;
  }

  function mdBloque(md) {
    var bloques = String(md == null ? "" : md).replace(/\r\n/g, "\n").split(/\n{2,}/);
    var out = [];
    for (var i = 0; i < bloques.length; i++) {
      var b = bloques[i].trim();
      if (!b) continue;
      var crudo = bloqueHtmlCrudo(b);
      if (crudo !== null) { out.push(crudo); continue; }
      var m = b.match(/^(#{2,4})\s+(.*)$/);
      if (m && b.indexOf("\n") < 0) {
        var nH = m[1].length;
        out.push("<h" + nH + ">" + mdInline(m[2]) + "</h" + nH + ">");
        continue;
      }
      if (/^([-*]\s+.*\n?)+$/.test(b + "\n")) {
        var items = b.split("\n").map(function (ln) {
          return "<li>" + mdInline(ln.replace(/^[-*]\s+/, "")) + "</li>";
        });
        out.push("<ul>" + items.join("\n") + "</ul>");
        continue;
      }
      out.push("<p>" + mdInline(b).replace(/\n/g, "<br>") + "</p>");
    }
    return out.join("\n");
  }

  /* Palabras de un markdown (el medidor de pergaminos cuenta como build.py:
     \w+ sobre el texto). */
  function contarPalabras(md) {
    var m = String(md == null ? "" : md).match(/\w+/g);
    return m ? m.length : 0;
  }

  /* Guardarraíl editorial del brief (espejo de FORBIDDEN_PHRASES, build.py:107;
     por ahora es la barandilla de la categoría Bienestar). */
  var FRASES_PROHIBIDAS = {
    es: ["no debes sentir culpa", "los demás te manipulan", "haz lo que quieras",
         "ignora tus errores", "toda culpa es manipulación", "tu familia te controla",
         "la religión es culpable", "la sociedad quiere controlarte"],
    en: ["you should not feel guilt", "everyone manipulates you", "do whatever you want",
         "ignore your mistakes", "all guilt is manipulation", "your family controls you",
         "religion is to blame", "society wants to control you"],
  };


  /* ============================================================ IDIOMAS ====
     La gran reforma (docs/11-idiomas): cada curso tiene un IDIOMA BASE (en el
     que se escribió) e idiomas AÑADIDOS que rellena la IA. Todo lo que aquí
     vive corre igual en navegador y en node: el recorredor es la ÚNICA
     definición de qué es texto traducible — extraer e inyectar lo comparten,
     y esa unicidad es lo que hace determinista el viaje de ida y vuelta. */

  var IDIOMAS = { es: "Español", en: "English", pt: "Português" };
  var PREFIJO_NIVEL = { es: "Nivel", en: "Level", pt: "Nível" };

  function baseDe(curso) { return (curso && curso.idioma_base) || "es"; }
  function idiomasDe(curso) {
    var lista = [baseDe(curso)];
    (curso && curso.idiomas || []).forEach(function (lg) {
      if (lista.indexOf(lg) < 0) lista.push(lg);
    });
    return lista;
  }

  /* El título de un nivel es «Nivel N — Dominio»: el prefijo lo pone la casa
     EN CADA IDIOMA y solo el dominio es del maestro (y viaja al traducir). */
  function dominioDeNivel(titulo) {
    var m = String(titulo || "").match(/^[^—-]*[—-]\s*(.*)$/);
    return m ? m[1].trim() : "";
  }
  function tituloDeNivel(n, dominio, lang) {
    var base = (PREFIJO_NIVEL[lang] || PREFIJO_NIVEL.es) + " " + n;
    dominio = String(dominio || "").trim();
    return dominio ? base + " — " + dominio : base;
  }

  /* La huella de una capa (misión o pergamino): djb2 del contenido que ve el
     alumno. MISMA fórmula que usaba el panel para `esHash` — la continuidad de
     las huellas ya estampadas depende de no cambiarla ni un byte. */
  function huellaBase(entry, baseLang) {
    var capa = entry[baseLang] || {};
    var base = JSON.stringify({ t: capa.title, c: capa.cards, s: capa.siguiente,
                                q: capa.cuerpo && capa.cuerpo.md });
    var h = 5381;
    for (var i = 0; i < base.length; i++) h = ((h << 5) + h + base.charCodeAt(i)) | 0;
    return String(h);
  }

  /* ------------------------------------------- el recorredor único ---------
     Visita todos los textos traducibles de la capa `lang` del curso, en orden
     estable. `visitor({clave, tipo, leer, escribir})` con tipo:
       plano   — string suelta (títulos, descripciones, cortas)
       inline  — par {md, html} compilado con mdInline
       bloque  — par {md, html} compilado con mdBloque
       dominio — el sufijo del título de nivel (escribir recompone el título)
     Las claves son rutas ESTABLES (ids + índices), el contrato del JSON. */
  function recorrerTextos(curso, lang, visitor) {
    function plano(clave, obj, campo) {
      if (!obj) return;
      visitor({ clave: clave, tipo: "plano",
        leer: function () { return obj[campo] == null ? "" : String(obj[campo]); },
        escribir: function (v) { obj[campo] = v; } });
    }
    function par(clave, obj, campo, tipo) {
      if (!obj || !obj[campo]) return;
      visitor({ clave: clave, tipo: tipo,
        leer: function () { return obj[campo].md || ""; },
        escribir: function (v) {
          obj[campo] = { md: v, html: v ? (tipo === "bloque" ? mdBloque(v) : mdInline(v)) : "" };
        },
        /* El PAR entero, para quien necesita conservar el html EXACTO en vez de
           recompilarlo: el importado viene de python-markdown y el compilador
           JS no lo reproduce byte a byte (9,3 % del corpus difiere — ids de
           encabezado y saltos entre bloques). El traductor y la IA siguen
           usando `leer`/`escribir`, que hablan markdown. */
        leerPar: function () { return obj[campo]; },
        escribirPar: function (p) { obj[campo] = p; } });
    }

    var cc = curso[lang];
    if (cc) {
      ["title", "description", "summary", "lead", "kicker", "nav_label"].forEach(function (campo) {
        if (cc[campo] != null) plano("curso." + campo, cc, campo);
      });
    }
    Object.keys(curso.niveles || {}).sort().forEach(function (n) {
      var nc = curso.niveles[n][lang];
      if (!nc) return;
      visitor({ clave: "nivel." + n + ".dominio", tipo: "dominio",
        leer: function () { return dominioDeNivel(nc.title); },
        escribir: function (v) { nc.title = tituloDeNivel(parseInt(n, 10), v, lang); } });
      ["description", "summary", "kicker"].forEach(function (campo) {
        if (nc[campo] != null) plano("nivel." + n + "." + campo, nc, campo);
      });
    });
    Object.keys(curso.salas || {}).sort().forEach(function (k) {
      var sc = curso.salas[k][lang];
      if (!sc) return;
      ["title", "description", "summary"].forEach(function (campo) {
        if (sc[campo] != null) plano("sala." + k + "." + campo, sc, campo);
      });
      par("sala." + k + ".cuerpo", sc, "cuerpo", "bloque");
    });
    (curso.misiones || []).forEach(function (m) {
      var mc = m[lang];
      if (!mc) return;
      var base = "mision." + m.id;
      plano(base + ".title", mc, "title");
      ["description", "summary"].forEach(function (campo) {
        if (mc[campo] != null) plano(base + "." + campo, mc, campo);
      });
      par(base + ".siguiente", mc, "siguiente", "bloque");
      (mc.cards || []).forEach(function (c, ix) {
        var b = base + ".card." + ix;
        if (c.tipo === "quiz" || c.tipo === "choice" || c.tipo === "apuesta") {
          par(b + ".enunciado", c, "enunciado", "bloque");
          par(b + ".feedback", c, "feedback", "bloque");
          (c.opciones || []).forEach(function (op, j) {
            par(b + ".op." + j + ".texto", op, "texto", "inline");
            par(b + ".op." + j + ".feedback", op, "feedback", "inline");
            if (op.corta != null) plano(b + ".op." + j + ".corta", op, "corta");
          });
        } else if (c.tipo === "revela") {
          par(b + ".enunciado", c, "enunciado", "bloque");
          (c.frases || []).forEach(function (f, j) {
            visitor({ clave: b + ".frase." + j, tipo: "inline",
              leer: function () { return f.md || ""; },
              escribir: function (v) { c.frases[j] = { md: v, html: v ? mdInline(v) : "" }; },
              leerPar: function () { return c.frases[j]; },
              escribirPar: function (p) { c.frases[j] = p; } });
          });
        } else if (c.tipo === "escena") {
          (c.vinetas || []).forEach(function (v, j) {
            par(b + ".vineta." + j, v, "texto", "inline");
          });
        } else if (c.tipo === "scroll") {
          plano(b + ".titulo", c, "titulo");
          par(b + ".cuerpo", c, "cuerpo", "bloque");
        } else if (c.tipo === "reflect") {
          par(b + ".cuerpo", c, "cuerpo", "bloque");
          if (c.placeholder != null) plano(b + ".placeholder", c, "placeholder");
        } else {
          par(b + ".cuerpo", c, "cuerpo", "bloque");
        }
      });
    });
    (curso.pergaminos || []).forEach(function (p) {
      var pc = p[lang];
      if (!pc) return;
      var base = "pergamino." + p.id;
      ["title", "description", "summary", "kicker"].forEach(function (campo) {
        if (pc[campo] != null) plano(base + "." + campo, pc, campo);
      });
      par(base + ".cuerpo", pc, "cuerpo", "bloque");
    });
  }

  /* Extraer: mapa plano clave → md/string. Las vacías no viajan (no gastan
     tokens); la COBERTURA se juzga contra las claves del base no vacías. */
  function extraerTextos(curso, lang) {
    var mapa = {};
    recorrerTextos(curso, lang, function (v) {
      var t = v.leer();
      if (t !== "") mapa[v.clave] = t;
    });
    return mapa;
  }

  /* Inyectar: crea la capa `aLang` de cada entidad CLONANDO la estructura del
     base (índices idénticos ⇒ mismas claves) y escribe el mapa traducido.
     Clave ausente ⇒ string vacía (la cobertura la delatará, nunca se cuela el
     texto del base como si fuera traducción). Estampa `baseHash` por entrada
     y recalcula `words` de pergaminos. Devuelve {faltantes, escritas}. */
  function inyectarTextos(curso, aLang, mapa, opts) {
    opts = opts || {};
    var deLang = baseDe(curso);
    if (aLang === deLang) throw new Error("inyectar sobre el idioma base");
    var clon = function (x) { return JSON.parse(JSON.stringify(x)); };
    /* Modo PARCIAL (lotes del traductor): solo se crean las capas de las
       entidades que traen alguna clave en el mapa — así un lote de una misión
       no siembra el resto del curso de capas vacías. */
    var tiene = function (prefijo) {
      if (!opts.parcial) return true;
      for (var k in mapa) if (k.indexOf(prefijo) === 0) return true;
      return false;
    };
    if (tiene("curso.")) curso[aLang] = curso[aLang] && opts.parcial ? curso[aLang] : clon(curso[deLang]);
    Object.keys(curso.niveles || {}).forEach(function (n) {
      if (curso.niveles[n][deLang] && tiene("nivel." + n + "."))
        curso.niveles[n][aLang] = clon(curso.niveles[n][deLang]);
    });
    Object.keys(curso.salas || {}).forEach(function (k) {
      if (curso.salas[k][deLang] && tiene("sala." + k + "."))
        curso.salas[k][aLang] = clon(curso.salas[k][deLang]);
    });
    (curso.misiones || []).forEach(function (m) {
      if (m[deLang] && tiene("mision." + m.id + ".")) {
        m[aLang] = clon(m[deLang]);
        m[aLang].baseHash = huellaBase(m, deLang);
      }
    });
    (curso.pergaminos || []).forEach(function (p) {
      if (p[deLang] && tiene("pergamino." + p.id + ".")) {
        p[aLang] = clon(p[deLang]);
        p[aLang].baseHash = huellaBase(p, deLang);
      }
    });
    var res = { faltantes: [], escritas: 0 };
    recorrerTextos(curso, aLang, function (v) {
      if (Object.prototype.hasOwnProperty.call(mapa, v.clave)) {
        v.escribir(String(mapa[v.clave]));
        res.escritas++;
      } else if (!opts.parcial && v.leer() !== "") {
        /* Solo el modo COMPLETO blanquea lo ausente (para que la cobertura lo
           delate). En parcial, un lote nuevo no puede tocar lo que otro lote
           ya tradujo: las claves fuera del mapa se dejan como están. */
        v.escribir("");
        res.faltantes.push(v.clave);
      }
    });
    (curso.pergaminos || []).forEach(function (p) {
      var pc = p[aLang];
      if (pc && pc.cuerpo) pc.words = contarPalabras(pc.cuerpo.md);
    });
    if (curso.idiomas == null) curso.idiomas = [];
    if (curso.idiomas.indexOf(aLang) < 0) curso.idiomas.push(aLang);
    return res;
  }

  /* Quitar un idioma añadido: borra TODAS sus capas y lo saca de la lista.
     El base no se puede quitar (es el curso mismo). Devuelve cuántas capas
     se llevaron por delante, para poder contarlo en la confirmación. */
  function quitarIdioma(curso, lang) {
    if (lang === baseDe(curso)) throw new Error("el idioma base no se quita");
    var n = 0;
    var borra = function (obj) { if (obj && obj[lang]) { delete obj[lang]; n++; } };
    borra(curso);
    Object.keys(curso.niveles || {}).forEach(function (k) { borra(curso.niveles[k]); });
    Object.keys(curso.salas || {}).forEach(function (k) { borra(curso.salas[k]); });
    (curso.misiones || []).forEach(borra);
    (curso.pergaminos || []).forEach(borra);
    curso.idiomas = (curso.idiomas || []).filter(function (lg) { return lg !== lang; });
    return n;
  }

  /* Cuántas entidades (misiones + pergaminos) tienen capa en ese idioma y
     cuántas deberían tenerla: es la foto honesta de «cuánto falta». */
  function avanceIdioma(curso, lang) {
    var total = 0, hechas = 0;
    (curso.misiones || []).concat(curso.pergaminos || []).forEach(function (e) {
      if (!e[baseDe(curso)]) return;
      total++;
      if (e[lang]) hechas++;
    });
    return { total: total, hechas: hechas };
  }

  /* Cobertura de un idioma añadido: claves con texto en el base cuya
     traducción falta (capa ausente o string vacía). Para la checklist. */
  function coberturaIdioma(curso, aLang) {
    var base = extraerTextos(curso, baseDe(curso));
    var alli = extraerTextos(curso, aLang);
    return Object.keys(base).filter(function (k) { return !alli[k]; });
  }


  /* ------------------------------------------------- guardar es publicar ---
     Los idiomas que de verdad se sirven al alumno (docs/12 §1.2). El base
     siempre; un añadido, SOLO si está completo: media traducción publicada son
     huecos en mitad de una misión, y eso es peor que no ofrecer el idioma. El
     panel lo enseña con el chip ⏳ y «Salud del curso», así que nadie se queda
     sin saber por qué su PT al 90 % todavía no aparece. */
  function idiomasServibles(curso) {
    var base = baseDe(curso);
    return idiomasDe(curso).filter(function (lg) {
      if (lg === base) return true;
      if (!curso.misiones.some(function (m) { return !!m[lg]; })) return false;
      return coberturaIdioma(curso, lg).length === 0;
    });
  }

  /* TODAS las filas `content` de un curso, listas para la RPC única. Es el
     curso ENTERO a propósito (docs/12 §«El modelo óptimo»): las filas dependen
     unas de otras —el pool de señuelos de cada misión sale de las demás del
     nivel, `next`/`nextLevel` de la vecina, la sala de retos y la audioteca de
     todo el curso—, así que materializar «solo lo que cambió» dejaría pools
     viejos sin que nada avise. Compilar el curso completo cuesta milisegundos
     y quita de en medio una clase entera de errores. */
  function armarVisible(fuente, clave) {
    var curso = fuente.cursos[clave];
    if (!curso) return [];
    var filas = [];
    idiomasServibles(curso).forEach(function (lg) {
      armarCurso(fuente, clave, lg).forEach(function (f) {
        filas.push({ id: f.id, lang: f.lang, kind: f.kind, art: f.art, data: f.data });
      });
      /* La fila ÍNDICE del player dinámico (/curso/#/clave): el mapa entero. */
      var ind = armarIndiceCurso(fuente, clave, lg);
      if (ind) filas.push({ id: lg + ":curso-" + clave, lang: lg, kind: "escuela-curso", art: clave, data: ind });
    });
    return filas;
  }

  /* ------------------------------------ una sola tarjeta, muchos idiomas ---
     La tarjeta es UNA (titular 2026-09-03): su ESTRUCTURA —el tipo, el juego,
     cuántas opciones hay, cuál es la correcta, el orden, los fondos, anclas,
     poses y direcciones de las viñetas— es la misma en todos los idiomas; lo
     único que cambia son los TEXTOS. El modelo guarda una capa por idioma con
     su propio array de tarjetas (así lo importó build.py de dos markdowns
     separados), y eso PERMITÍA que divergieran: editar el fondo de una viñeta
     en español dejaba el inglés con el fondo viejo.
     `sincronizarEstructura` cierra esa puerta: copia la estructura de la capa
     que se acaba de tocar a las demás, conservando de cada una sus textos. */

  /* Los campos que SON del idioma (todo lo demás es estructura). `href` entra
     aquí: el destino del pergamino es la misma pieza, pero su dirección la
     escribe cada idioma. */
  function textosDeCard(c) {
    var t = { _tipo: c.tipo };
    ["enunciado", "feedback", "cuerpo", "siguiente"].forEach(function (k) {
      if (c[k] && typeof c[k] === "object") t[k] = c[k];
    });
    if (typeof c.titulo === "string") t.titulo = c.titulo;
    if (typeof c.href === "string") t.href = c.href;
    if (typeof c.placeholder === "string") t.placeholder = c.placeholder;
    if (c.opciones) {
      t.opciones = c.opciones.map(function (o) {
        return { texto: o.texto, feedback: o.feedback, corta: o.corta };
      });
    }
    if (c.frases) t.frases = c.frases.slice();
    if (c.vinetas) t.vinetas = c.vinetas.map(function (v) { return v.texto; });
    return t;
  }

  /* Estructura de `molde` + textos de `viejos` (si son del mismo tipo). */
  function fundirCard(molde, viejos) {
    var out = JSON.parse(JSON.stringify(molde));
    if (!viejos || viejos._tipo !== molde.tipo) return out;
    ["enunciado", "feedback", "cuerpo", "siguiente"].forEach(function (k) {
      if (out[k] && viejos[k]) out[k] = viejos[k];
    });
    if (typeof out.titulo === "string" && typeof viejos.titulo === "string") out.titulo = viejos.titulo;
    if (typeof out.href === "string" && typeof viejos.href === "string") out.href = viejos.href;
    if (typeof out.placeholder === "string" && typeof viejos.placeholder === "string") out.placeholder = viejos.placeholder;
    (out.opciones || []).forEach(function (o, i) {
      var v = (viejos.opciones || [])[i];
      if (!v) return;
      if (v.texto) o.texto = v.texto;
      if (v.feedback) o.feedback = v.feedback;
      /* `corta` puede no existir en el molde (una opción recién creada): se
         asigna solo si el idioma viejo tenía una. */
      if (typeof v.corta === "string") o.corta = v.corta;
    });
    (out.frases || []).forEach(function (f, i) {
      if ((viejos.frases || [])[i]) out.frases[i] = viejos.frases[i];
    });
    (out.vinetas || []).forEach(function (vin, i) {
      if ((viejos.vinetas || [])[i]) vin.texto = viejos.vinetas[i];
    });
    return out;
  }

  /* Copia la estructura de la capa `desde` a las demás capas de la entrada,
     conservando los textos de cada idioma. Devuelve cuántas capas cambiaron. */
  function sincronizarEstructura(entry, desde) {
    var mando = entry[desde];
    if (!mando || !mando.cards) return 0;
    var n = 0;
    Object.keys(entry).forEach(function (lg) {
      if (lg === desde || lg.length !== 2) return;
      var otra = entry[lg];
      if (!otra || !otra.cards) return;
      var textos = otra.cards.map(textosDeCard);
      var nuevas = mando.cards.map(function (c, i) { return fundirCard(c, textos[i]); });
      if (JSON.stringify(otra.cards) !== JSON.stringify(nuevas)) { otra.cards = nuevas; n++; }
    });
    return n;
  }

  /* ¿Alguna capa de esta entrada tiene estructura distinta a la del base? */
  function estructuraDivergente(entry, base) {
    var mando = entry[base];
    if (!mando || !mando.cards) return false;
    var molde = JSON.stringify(mando.cards.map(function (c) {
      var e = JSON.parse(JSON.stringify(c));
      var t = textosDeCard(c);
      /* se compara TODO menos los textos */
      ["enunciado", "feedback", "cuerpo", "siguiente", "titulo", "href", "placeholder"].forEach(function (k) { delete e[k]; });
      (e.opciones || []).forEach(function (o) { delete o.texto; delete o.feedback; delete o.corta; });
      if (e.frases) e.frases = e.frases.length;
      (e.vinetas || []).forEach(function (v) { delete v.texto; });
      return e;
    }));
    return Object.keys(entry).some(function (lg) {
      if (lg === base || lg.length !== 2 || !entry[lg] || !entry[lg].cards) return false;
      var otro = JSON.stringify(entry[lg].cards.map(function (c) {
        var e = JSON.parse(JSON.stringify(c));
        ["enunciado", "feedback", "cuerpo", "siguiente", "titulo", "href", "placeholder"].forEach(function (k) { delete e[k]; });
        (e.opciones || []).forEach(function (o) { delete o.texto; delete o.feedback; delete o.corta; });
        if (e.frases) e.frases = e.frases.length;
        (e.vinetas || []).forEach(function (v) { delete v.texto; });
        return e;
      }));
      return otro !== molde;
    });
  }


  /* ============================ ESTRUCTURA UNA VEZ, TEXTOS POR CLAVE (F0.5)
     Hasta aquí cada entidad guardaba una CAPA COMPLETA por idioma: la
     estructura (tipos de tarjeta, opciones, cuál es la correcta, el orden, los
     fondos, anclas y poses de las viñetas) viajaba duplicada en cada idioma y
     `sincronizarEstructura` tenía que reigualarla en cada edición para que no
     divergiera — y ya divergió una vez (commit 9a5ddb5).

     El formato nuevo la guarda UNA sola vez y deja por idioma únicamente los
     textos, en el mismo mapa plano `clave → md` que produce `recorrerTextos`
     para el traductor. Con eso: pesa menos de la mitad, la divergencia entre
     idiomas deja de ser posible (no hay dos estructuras que igualar), la
     cobertura es una diferencia de conjuntos, y crear con IA, traducir y editar
     son la misma operación sobre el mismo mapa (docs/12 §7).

     Estas dos funciones son inversas exactas: `hidratar(deshidratar(e)) === e`.
     El `html` NO se guarda: se recompila al hidratar con el mismo mdInline /
     mdBloque de la casa, así que el formato nuevo tampoco arrastra derivados. */

  /* Un curso MÍNIMO que contenga solo esta entidad: así el recorredor único
     sirve igual para una misión suelta que para el curso entero, y no hay una
     segunda lista de campos traducibles que se pueda desincronizar. */
  function envolverEntidad(entrada, tipo) {
    if (tipo === "mision") return { niveles: {}, salas: {}, misiones: [entrada], pergaminos: [] };
    if (tipo === "pergamino") return { niveles: {}, salas: {}, misiones: [], pergaminos: [entrada] };
    /* curso: sus propias capas, niveles y salas; las entidades van aparte */
    var c = {};
    for (var k in entrada) if (k !== "misiones" && k !== "pergaminos") c[k] = entrada[k];
    c.misiones = []; c.pergaminos = [];
    return c;
  }
  function prefijoEntidad(entrada, tipo) {
    return tipo === "curso" ? "" : tipo + "." + entrada.id + ".";
  }

  /* Los campos de una capa que NO son texto ni estructura de tarjeta: la ruta
     que ese idioma ocupa en el sitio. Viajan por idioma, aparte de los textos,
     porque un slug traducido es una decisión de publicación, no una frase. */
  /* `words` va aquí y no en la estructura: es el recuento del texto DE ESE
     idioma (el inglés de un pergamino no tiene las mismas palabras que el
     español) y alimenta el «X min de lectura» de la audioteca. */
  var CAMPOS_RUTA = ["slug", "url", "words"];

  /* Lo que cambia por idioma sin ser una frase: la ruta que ocupa la capa y el
     `href` de cada tarjeta que enlaza a un pergamino (el destino es la misma
     pieza, pero su dirección la escribe cada idioma — `{P}guiltfu/learn/…`
     frente a `{P}culpafu/aprende/…`). Si esto viviera en la estructura común,
     el inglés apuntaría a las urls del español. */
  function camposDeRuta(capa) {
    var r = {};
    if (!capa) return r;
    CAMPOS_RUTA.forEach(function (c) { if (capa[c] != null) r[c] = capa[c]; });
    if (capa.baseHash != null) r.baseHash = capa.baseHash;
    (capa.cards || []).forEach(function (c, i) {
      if (typeof c.href === "string") r["card." + i + ".href"] = c.href;
    });
    return r;
  }
  function aplicarRutas(capa, r) {
    for (var c in r) {
      var m = c.match(/^card\.(\d+)\.href$/);
      if (m) { if (capa.cards && capa.cards[+m[1]]) capa.cards[+m[1]].href = r[c]; }
      else capa[c] = r[c];
    }
  }

  /* Entidad en capas → { estructura, rutas, textos } */
  function deshidratarEntidad(entrada, tipo, base) {
    var envoltorio = envolverEntidad(entrada, tipo);
    var pref = prefijoEntidad(entrada, tipo);
    var textos = {}, rutas = {};
    var idiomas = Object.keys(entrada).filter(function (k) {
      return k.length === 2 && entrada[k] && typeof entrada[k] === "object";
    });
    idiomas.forEach(function (lg) {
      var mapa = {};
      recorrerTextos(envoltorio, lg, function (v) {
        var clave = v.clave.slice(pref.length);
        /* Los campos con markdown guardan el PAR: así el html importado viaja
           intacto y la paridad con build.py se conserva. Los campos planos
           (title, corta, placeholder, dominio) son un string. */
        if (v.leerPar) {
          var p = v.leerPar();
          if (p && (p.md || p.html)) {
            /* Se guarda SOLO el markdown cuando el html es derivable de él —lo
               es en el 90,7 % del corpus—, y el par entero cuando no (el
               importado viene de python-markdown, que numera los encabezados
               con `id` y espacia distinto los bloques con HTML crudo dentro;
               recompilar ahí cambiaría el contenido publicado sin que nadie lo
               haya decidido). Así el formato pesa lo que pesa el texto y la
               paridad byte a byte con build.py se conserva. */
            var re = p.md ? (v.tipo === "bloque" ? mdBloque(p.md) : mdInline(p.md)) : "";
            mapa[clave] = (re === (p.html || "")) ? p.md : p;
          }
        } else {
          var t = v.leer();
          if (t !== "") mapa[clave] = t;
        }
      });
      textos[lg] = mapa;
      rutas[lg] = camposDeRuta(entrada[lg]);
    });
    /* La estructura es la capa BASE con todos sus textos vaciados: se saca con
       el mismo recorredor, así que ningún campo traducible puede quedarse
       dentro por descuido. */
    var estructura = JSON.parse(JSON.stringify(entrada[base] || {}));
    var soloEstructura = envolverEntidad(
      tipo === "curso" ? estructura : asignar({}, entrada, base, estructura), tipo);
    recorrerTextos(soloEstructura, base, function (v) { v.escribir(""); });
    /* El `href` es del idioma (va en rutas), no de la estructura común. */
    (estructura.cards || []).forEach(function (c) { if (typeof c.href === "string") c.href = ""; });
    CAMPOS_RUTA.concat(["baseHash", "esHash"]).forEach(function (c) { delete estructura[c]; });

    var fuera = { estructura: estructura, rutas: rutas, textos: textos };
    /* Todo lo que no es ni capa de idioma ni lista de hijos es identidad de la
       entidad (id, nivel, orden, kind, ordenArchivo, tipo…) y se conserva. */
    for (var k in entrada) {
      if (k.length === 2 && entrada[k] && typeof entrada[k] === "object") continue;
      if (k === "misiones" || k === "pergaminos") continue;
      fuera[k] = entrada[k];
    }
    return fuera;
  }
  function asignar(dest, entrada, lg, capa) {
    for (var k in entrada) if (k.length !== 2) dest[k] = entrada[k];
    dest[lg] = capa;
    return dest;
  }

  /* { estructura, rutas, textos } → entidad en capas (lo que el panel edita) */
  function hidratarEntidad(guardado, tipo) {
    var entrada = {};
    for (var k in guardado) {
      if (k === "estructura" || k === "rutas" || k === "textos") continue;
      entrada[k] = guardado[k];
    }
    Object.keys(guardado.textos || {}).forEach(function (lg) {
      var capa = JSON.parse(JSON.stringify(guardado.estructura || {}));
      aplicarRutas(capa, (guardado.rutas || {})[lg] || {});
      entrada[lg] = capa;
    });
    /* Los textos se escriben con el MISMO recorredor que los sacó: cada clave
       vuelve a su sitio y el html se recompila con la tipografía de la casa. */
    Object.keys(guardado.textos || {}).forEach(function (lg) {
      var envoltorio = envolverEntidad(entrada, tipo);
      var pref = prefijoEntidad(entrada, tipo);
      var mapa = guardado.textos[lg];
      recorrerTextos(envoltorio, lg, function (v) {
        var clave = v.clave.slice(pref.length);
        var val = Object.prototype.hasOwnProperty.call(mapa, clave) ? mapa[clave] : "";
        if (val && typeof val === "object" && v.escribirPar) v.escribirPar(val);
        else v.escribir(typeof val === "string" ? val : "");
      });
    });
    return entrada;
  }

  /* ¿Esta fila viene en el formato nuevo? (la base convive con los dos durante
     la migración: cada entidad se pasa al nuevo la primera vez que se guarda) */
  function esDeshidratada(fila) {
    return !!(fila && fila.textos && fila.estructura);
  }


  /* ======================================================= examenFu (F1) ===
     Un examenFu es un curso con `tipo: "examen"`: UN nivel, UNA misión de tipo
     examen y cero pergaminos. Se construye aquí, en el ensamblador, y no en el
     panel, porque la misma plantilla la van a usar dos productores: el wizard
     «Nuevo examen» (que la deja vacía para que el maestro la rellene) y el
     asistente de IA de F3 (que la rellena de una vez). Una sola forma, dos
     caminos — que es la regla de la casa desde que hay tres productores de
     contenido (docs/12 §«El modelo óptimo»). */

  function parVacio(md) { return { md: md || "", html: md ? mdBloque(md) : "" }; }

  function quizVacia() {
    /* Tres opciones, respuesta única: el molde de la casa desde 2026-09-02. */
    return { tipo: "quiz", enunciado: parVacio(""), feedback: parVacio(""),
      opciones: [
        { texto: { md: "", html: "" }, correct: true, feedback: { md: "", html: "" } },
        { texto: { md: "", html: "" }, correct: false, feedback: { md: "", html: "" } },
        { texto: { md: "", html: "" }, correct: false, feedback: { md: "", html: "" } }] };
  }

  /* Cuántos aciertos se piden por defecto para aprobar: tres cuartos, redondeado
     hacia arriba y nunca menos de uno. El maestro lo cambia con un selector
     1..N (decisión del titular: por CANTIDAD, jamás por porcentaje). */
  function aprobarPorDefecto(n) {
    /* Redondeo normal y no hacia arriba: con 3 preguntas da 2, que es
       exactamente el «2 de 3» de los exámenes de cinturón de la casa. */
    return Math.max(1, Math.min(n, Math.round(n * 0.75)));
  }

  /* Devuelve { curso, mision } listos para `fundarCurso` + `crearMision`. */
  function plantillaExamen(clave, titulo, opts) {
    opts = opts || {};
    var lang = opts.lang || "es";
    var n = Math.max(1, Math.min(30, opts.n || 10));
    var en = lang === "en";
    var curso = {
      categoria: "examen", tipo: "examen", visibilidad: "enlace",
      idioma_base: lang, idiomas: [],
      examen: {
        n: n,
        aprobar_min: opts.aprobar_min || aprobarPorDefecto(n),
        intentos: opts.intentos == null ? null : opts.intentos,
        tiempo_min: opts.tiempo_min == null ? null : opts.tiempo_min,
      },
      niveles: {}, misiones: [], pergaminos: [], salas: {},
    };
    curso[lang] = { slug: "", url: clave + "/", title: titulo, description: "", summary: "" };
    /* Las salas existen VACÍAS a propósito: `contexto()` y `armarCurso` dan por
       hecho que `salas.pergaminos` y `salas.retos` están (aunque sin capa de
       idioma, y entonces no emiten fila). Sin ellas, compilar un examen
       reventaría. */
    curso.salas = { pergaminos: { id: clave + "-pergaminos" }, retos: { id: clave + "-retos" } };
    curso.niveles["1"] = { id: clave + "-level-1", belt: "black" };
    curso.niveles["1"][lang] = {
      slug: en ? "exam" : "examen", url: clave + (en ? "/exam/" : "/examen/"),
      title: en ? "Exam" : "Examen", description: "", summary: "",
    };
    var cards = [{ tipo: "text", cuerpo: parVacio("") }];   /* la portada */
    for (var i = 0; i < n; i++) cards.push(quizVacia());
    var mision = { id: clave + "-1-exam", nivel: 1, orden: 99, kind: "exam", ordenArchivo: {} };
    mision.ordenArchivo[lang] = 99;
    mision[lang] = {
      slug: en ? "exam" : "examen",
      url: curso.niveles["1"][lang].url,
      title: titulo, description: "", summary: "", cards: cards,
    };
    curso.misiones.push(mision);
    return { curso: curso, mision: mision };
  }

  /* ================================= el molde de un CURSO entero (F4) ===
     La misma idea que `plantillaExamen`, a lo grande: la plataforma construye
     ids, urls, el reparto de cinturones y la baraja de cada misión, y lo deja
     TODO vacío. Luego el maestro lo rellena a mano o el asistente de IA lo
     rellena de una vez; en los dos casos, lo que se guarda pasa por las mismas
     guardias. El modelo nunca escribe estructura (docs/12 §8). */

  /* La rotación de barajas de la casa: una misión no es una lista de preguntas,
     es un ritmo. Se alternan tres moldes para que dos misiones seguidas no se
     sientan iguales, y todos acaban en una tarjeta de cierre. */
  var BARAJAS = [
    ["escena", "revela", "quiz", "quiz", "text"],
    ["escena", "text", "quiz", "revela", "quiz", "text"],
    ["escena", "quiz", "revela", "quiz", "text"],
  ];

  function cardVacia(tipo) {
    if (tipo === "quiz") return quizVacia();
    if (tipo === "revela") {
      return { tipo: "revela", enunciado: parVacio(""),
        frases: [{ md: "", html: "" }, { md: "", html: "" }, { md: "", html: "" }] };
    }
    if (tipo === "escena") {
      /* Tres viñetas con fondo y pose por defecto: la IA elige el fondo y la
         pose entre los del catálogo, pero la ESTRUCTURA ya está puesta. */
      var v = function () {
        return { fondo: "salon", ancla: "centro", pose: "reposo", texto: { md: "", html: "" } };
      };
      return { tipo: "escena", vinetas: [v(), v(), v()] };
    }
    return { tipo: "text", cuerpo: parVacio("") };
  }

  /* ============================ el puente con el asistente de IA (F3/F4) ===
     El molde ya construido se traduce a la LISTA DE CLAVES que el modelo tiene
     que rellenar, y su respuesta se devuelve a su sitio. Las dos funciones se
     apoyan en el recorredor único, así que no hay una segunda lista de campos
     que se pueda desincronizar: si mañana una tarjeta gana un campo de texto,
     la IA lo rellena sola. */

  /* Las claves de texto de un curso (o de una de sus entidades) en el idioma
     dado, EN ORDEN. `filtro` recorta a una entidad concreta —una misión, un
     nivel— para poder generar por lotes sin pedir el curso entero de una vez. */
  function clavesDeTextos(curso, lang, filtro) {
    var out = [];
    recorrerTextos(curso, lang, function (v) {
      if (filtro && v.clave.indexOf(filtro) !== 0) return;
      out.push(v.clave);
    });
    return out;
  }

  /* Devuelve los textos del modelo a su sitio. Ignora lo que no reconozca (un
     modelo servicial a veces añade una clave de su cosecha) y no toca lo que no
     venga: así un lote parcial nunca borra lo que ya estaba escrito. */
  function materializarTextos(curso, lang, mapa) {
    var puestos = 0;
    recorrerTextos(curso, lang, function (v) {
      if (!Object.prototype.hasOwnProperty.call(mapa, v.clave)) return;
      var t = mapa[v.clave];
      if (typeof t !== "string" || !t) return;
      v.escribir(t);
      puestos++;
    });
    return puestos;
  }

  function plantillaCurso(clave, titulo, opts) {
    opts = opts || {};
    var lang = opts.lang || "es";
    var en = lang === "en";
    var nNiveles = Math.max(1, Math.min(8, opts.niveles || 4));
    var porNivel = Math.max(1, Math.min(6, opts.misiones || 3));
    var curso = {
      categoria: opts.categoria || "general", tipo: "curso", visibilidad: "privado",
      idioma_base: lang, idiomas: [], niveles: {}, misiones: [], pergaminos: [], salas: {},
    };
    curso[lang] = { slug: "", url: clave + "/", title: titulo, description: "", summary: "" };
    var salaP = { id: clave + "-pergaminos" };
    salaP[lang] = { url: clave + (en ? "/scrolls/" : "/pergaminos/"),
                    title: en ? "Scrolls" : "Pergaminos", cuerpo: parVacio("") };
    var salaR = { id: clave + "-retos" };
    salaR[lang] = { url: clave + (en ? "/challenges/" : "/retos/"),
                    title: en ? "Challenge hall" : "Sala de retos", cuerpo: parVacio("") };
    curso.salas = { pergaminos: salaP, retos: salaR };

    for (var n = 1; n <= nNiveles; n++) {
      /* Los cinturones se reparten en orden por la escalera fija de ocho: un
         curso de 4 niveles no da blanco-amarillo-naranja-verde, da los cuatro
         repartidos hasta el negro (docs/10 §3.7). */
      var idxBelt = nNiveles === 1 ? 7 : Math.round((n - 1) * (BELTS.length - 1) / (nNiveles - 1));
      curso.niveles[String(n)] = { id: clave + "-level-" + n, belt: BELTS[idxBelt] };
      curso.niveles[String(n)][lang] = {
        slug: (en ? "level-" : "nivel-") + n,
        url: clave + "/dojo/" + (en ? "level-" : "nivel-") + n + "/",
        title: (en ? "Level " : "Nivel ") + n, description: "", summary: "",
      };
      for (var k = 1; k <= porNivel; k++) {
        var baraja = BARAJAS[(n + k) % BARAJAS.length];
        var cards = [];
        for (var c = 0; c < baraja.length; c++) cards.push(cardVacia(baraja[c]));
        var m = { id: clave + "-" + n + "-" + k, nivel: n, orden: k, kind: "mission", ordenArchivo: {} };
        m.ordenArchivo[lang] = k;
        m[lang] = {
          slug: (en ? "mission-" : "mision-") + k,
          url: curso.niveles[String(n)][lang].url + (en ? "mission-" : "mision-") + k + "/",
          title: (en ? "Mission " : "Misión ") + n + "." + k, description: "", summary: "", cards: cards,
        };
        curso.misiones.push(m);
      }
      /* Cada nivel cierra con su examen de cinturón: seis preguntas, el molde
         de la casa. */
      var ex = { id: clave + "-" + n + "-exam", nivel: n, orden: 99, kind: "exam", ordenArchivo: {} };
      ex.ordenArchivo[lang] = 99;
      var exCards = [cardVacia("text")];
      for (var q = 0; q < 6; q++) exCards.push(quizVacia());
      ex[lang] = {
        slug: en ? "belt-exam" : "examen-cinturon",
        url: curso.niveles[String(n)][lang].url + (en ? "belt-exam/" : "examen-cinturon/"),
        title: (en ? "Belt exam " : "Examen de cinturón ") + n, description: "", summary: "",
        cards: exCards, siguiente: parVacio(""),
      };
      curso.misiones.push(ex);
    }
    return curso;
  }

  /* Añade o quita preguntas hasta dejar exactamente N (el maestro cambia el
     número en los ajustes y las preguntas se ajustan solas; quitar va por el
     final y nunca toca la portada). */
  function ajustarPreguntas(capa, n) {
    var quizzes = capa.cards.filter(function (c) { return c.tipo === "quiz"; }).length;
    while (quizzes < n) { capa.cards.push(quizVacia()); quizzes++; }
    while (quizzes > n) {
      for (var i = capa.cards.length - 1; i >= 0; i--) {
        if (capa.cards[i].tipo === "quiz") { capa.cards.splice(i, 1); break; }
      }
      quizzes--;
    }
    return capa;
  }

  var API = {
    XP: XP, BELTS: BELTS, FRASES_PROHIBIDAS: FRASES_PROHIBIDAS,
    resolver: resolver, textoPlano: textoPlano, desescapar: desescapar,
    compilarCard: compilarCard, armarCurso: armarCurso, armarMisionDemo: armarMisionDemo,
    armarIndiceCurso: armarIndiceCurso, armarVisible: armarVisible, idiomasServibles: idiomasServibles,
    mdInline: mdInline, mdBloque: mdBloque, contarPalabras: contarPalabras,
    IDIOMAS: IDIOMAS, PREFIJO_NIVEL: PREFIJO_NIVEL,
    baseDe: baseDe, idiomasDe: idiomasDe,
    dominioDeNivel: dominioDeNivel, tituloDeNivel: tituloDeNivel,
    huellaBase: huellaBase, recorrerTextos: recorrerTextos,
    extraerTextos: extraerTextos, inyectarTextos: inyectarTextos,
    coberturaIdioma: coberturaIdioma, quitarIdioma: quitarIdioma,
    sincronizarEstructura: sincronizarEstructura,
    estructuraDivergente: estructuraDivergente,
    avanceIdioma: avanceIdioma,
    deshidratarEntidad: deshidratarEntidad, hidratarEntidad: hidratarEntidad,
    esDeshidratada: esDeshidratada,
    plantillaExamen: plantillaExamen, quizVacia: quizVacia, plantillaCurso: plantillaCurso,
    ajustarPreguntas: ajustarPreguntas, aprobarPorDefecto: aprobarPorDefecto,
    clavesDeTextos: clavesDeTextos, materializarTextos: materializarTextos,
    /* Un pergamino es una CÁPSULA (titular 2026-09-04): una lectura corta que
       se abre en modal desde UNA tarjeta de su misión, opcional y de un
       vistazo. Vale para todos los cursos, no solo para el fundador. Espejo de
       SCROLL_MAX_CHARS / SCROLL_MAX_POR_MISION en build.py. */
    SCROLL_MAX_CHARS: 600, SCROLL_MAX_POR_MISION: 1,
    AUDIO_PERGAMINOS: AUDIO_PERGAMINOS,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else raiz.MFEscuela = Object.assign(raiz.MFEscuela || {}, { compilar: API });
})(typeof window !== "undefined" ? window : globalThis);

/* MenteFu / MindFu — la sala de retos del curso (los 8 minijuegos a la carta).

   Hermana pequeña de la sala de pergaminos (audioteca.js) y construida con su
   mismo esqueleto: recibe el contenido CERRADO por `mf:content` sobre el host
   `[data-gate]`, pinta una lista de fichas numeradas y no va a buscar nada por
   su cuenta. Por eso hereda gratis el gate, el modo local y el reseed, y por eso
   el traje son las mismas clases `.audioteca__*`: es la misma lista, las mismas
   fichas y el mismo tono, no un invento aparte.

   LO QUE AQUÍ CAMBIA ES EL SENTIDO DEL SORTEO. En una misión el alumno elige la
   pregunta y el sistema sortea el juego (`MFRetos.sortear`); en la sala elige el
   JUEGO y el sistema sortea la pregunta entre las que ya se ha ganado. Es la
   misma maquinaria mirada del revés: ni una línea del sorteo de retos.js se
   toca, solo se le pide la pieza que falta (`MFRetos.juego`).

   DOS REGLAS QUE NO SE TOCAN:
   · AQUÍ SE GANA UNA PROPINA, NO UN SUELDO. Repasar paga el 10 % del XP que dio
     ESA misión y UNA sola vez por pregunta en la vida de la cuenta. Sin ese tope
     bastaría con dejar pulsado el mismo reto para fabricar XP infinito, y el
     rango, los cinturones y el expediente entero dejarían de significar nada.
     Quien lleva la cuenta de lo ya cobrado es el progreso (`MF.replayWon`), no
     esta sala: dos memorias serían dos verdades y una de ellas mentiría. Lo que
     este archivo sigue sin tocar es `MF.completeMission`: una misión se completa
     entrenando, no repasando.
   · La medición SÍ se emite, con nombre propio (`sala_retos_*`): jugar en la
     sala es justo lo que el titular quiere medir, pero no puede confundirse con
     jugar la misión.

   Lo que la sala NUNCA decide por su cuenta es qué pregunta encaja en qué juego:
   eso se le pregunta a `MFRetos.compatibles`, que es el mismo juez que usa el
   sorteo de la misión. Si mañana un juego cambia su `acepta`, la sala se entera
   sola. */
(function () {
  "use strict";
  var el = MFDom.el, esc = MFDom.esc;   /* dom.js: una sola copia para todos */

  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";

  var T = ES ? {
    jugar: "Jugar", otra: "Otra pregunta",
    una: "pregunta lista", varias: "preguntas listas",
    /* Dos frases enteras y no un «{p} pregunta(s)»: la sala empieza SIEMPRE en
       una —la primera misión completada deja una sola pregunta aquí—, así que
       el singular no es un caso raro, es la primera pantalla que ve el alumno.
       Se guarda la frase completa, no la palabra suelta, porque en otro idioma
       la concordancia puede mover más de una palabra. */
    resumenUna: "1 pregunta ganada · {j} de {t} retos abiertos",
    resumen: "{p} preguntas ganadas · {j} de {t} retos abiertos",
    aviso: "Gana un poco más de experiencia jugando de nuevo los juegos que superes en el entrenamiento",
    /* Las tres frases del resultado. Se dice SIEMPRE lo que pasó con el XP —lo
       que se ganó, que esa pregunta ya estaba cobrada o por qué esta partida no
       paga—, porque mentir sobre el XP, en cualquiera de las dos direcciones,
       es lo peor que puede hacer esta pantalla. */
    pagado: "+{n} XP",
    yaCobrada: "Ya cobraste esta.",
    soloLimpio: "Solo suma a la primera.",
    ganado: "¡Ganado!", fallado: "Otra vez será.",
    sinMisiones: "Completa misiones del entrenamiento y sus preguntas irán llegando a esta sala.",
    sinPreguntas: "Todavía no hay preguntas del curso para este reto.",
    sinEnNivel: "Este reto no tiene preguntas en el nivel {n}.",
    completaNivel: "Completa misiones del nivel {n} para desbloquearlo.",
    sinMotor: "Los retos no se han podido cargar en esta página.",
    nivelTodos: "Todos", nivel: "Nivel {n}", nivelesAria: "Nivel de las preguntas", nivelEtiqueta: "Nivel",
  } : {
    jugar: "Play", otra: "Another question",
    una: "question ready", varias: "questions ready",
    resumenUna: "1 question won · {j} of {t} challenges open",
    resumen: "{p} questions won · {j} of {t} challenges open",
    aviso: "Earn a little more experience by replaying the challenges you clear in the training hall",
    pagado: "+{n} XP",
    yaCobrada: "You already earned this one.",
    soloLimpio: "Only a first-try win earns XP.",
    ganado: "Cleared!", fallado: "Next time.",
    sinMisiones: "Complete missions in the training hall and their questions will show up here.",
    sinPreguntas: "No questions in the course fit this challenge yet.",
    sinEnNivel: "This challenge has no questions on level {n}.",
    completaNivel: "Complete level {n} missions to unlock it.",
    sinMotor: "Challenges could not be loaded on this page.",
    nivelTodos: "All", nivel: "Level {n}", nivelesAria: "Question level", nivelEtiqueta: "Level",
  };

  function propio(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }

  /* Un índice dentro del array sin que un redondeo se salga por arriba: mismo
     recorte que `elegirIndice` en retos.js. */
  function alAzar(lista) {
    if (!lista.length) return null;
    return lista[Math.max(0, Math.min(lista.length - 1, Math.floor(Math.random() * lista.length)))];
  }

  /* El color del cinturón de cada nivel, que el CSS de los chips lee en `--belt`
     para que el filtro recuerde de qué tramo del camino se está hablando. Sale
     de MF_CONFIG, que ya lleva la tabla; sin ella el chip queda exactamente
     igual que el filtro de la sala hermana. */
  var COLOR_NIVEL = {};
  var CINTURON_NIVEL = {};
  (function () {
    var b = cfg.belts || [], arte = cfg.gameArt || {}, i, k;
    for (i = 0; i < b.length; i++) {
      if (!b[i] || !b[i].n) continue;
      COLOR_NIVEL[b[i].n] = b[i].color;
      /* La lamina del cinturon, para que el chip diga el nivel con el dibujo que
         el alumno ya reconoce del camino y no con la palabra «Nivel». Si un
         cinturon no tuviera lamina, el chip se queda solo con su numero: se ve
         peor, pero nunca sale un hueco roto. */
      k = "belt-" + b[i].key;
      if (arte[k]) CINTURON_NIVEL[b[i].n] = (cfg.assets || "") + arte[k];
    }
  })();

  /* ---------------- El sorteo CICLICO de la sala ----------------
     Aqui no se practica al azar puro: se RECORRE. El titular quiere revisarlas
     todas, y con `Math.random()` a secas eso tarda muchisimo — con 27 preguntas
     hacen falta ~106 tiradas de media para ver las 27, y algunas salen cuatro
     veces antes de que aparezca la ultima.
     Se guarda lo YA VISTO por juego, no una baraja fija: la lista viva cambia
     debajo (se desbloquean misiones, se cambia el filtro de nivel), asi que la
     baraja se recalcula en cada tirada contra lo que hay AHORA. Cuando no queda
     nada por ver se cierra la vuelta y empieza otra.
     Vive en memoria y muere con la pagina: es una ayuda de repaso, no progreso,
     y no tiene por que sobrevivir a una recarga. */
  var VISTAS = {};
  function claveTirada(f) { return f.entrada.mision + "#" + f.i; }
  function sorteoCiclico(idJuego, lista) {
    if (!lista.length) return null;
    var vistas = VISTAS[idJuego] || (VISTAS[idJuego] = {});
    var frescas = [], i;
    for (i = 0; i < lista.length; i++) if (!propio(vistas, claveTirada(lista[i]))) frescas.push(lista[i]);
    if (!frescas.length) { vistas = VISTAS[idJuego] = {}; frescas = lista; }
    var elegida = alAzar(frescas);
    if (elegida) vistas[claveTirada(elegida)] = 1;
    return elegida;
  }

  /* Medir nunca puede tumbar la sala: si MF no está o track revienta, la lista
     sigue funcionando igual (mismo blindaje que retos.js). */
  function track(evento, art, item, datos) {
    if (!window.MF || !MF.track) return;
    try { MF.track(evento, { art: art || null, item: item || null, data: datos || {} }); } catch (e) { /* nada */ }
  }

  function start(host, data) {
    var body = host.querySelector("[data-gated-body]");
    var art = data.art;
    var banco = data.banco || [];
    var pools = data.pools || {};
    var nivelFiltro = "todos";
    /* Partidas jugadas en esta visita. Alimenta el `intento` de cada apertura:
       ver más abajo por qué no puede quedarse en cero. */
    var practicas = 0;

    /* ------------------------------------------------------ EL CENSO DE JUEGOS
       Los ocho salen del registro, no de una lista escrita a mano: si un juego
       no se ha cargado, aquí no aparece y la sala no promete lo que no puede
       dar. `MFRetos.juego(id)` es la única adición que esta sala pidió al motor
       (el sorteo solo necesitaba ids; la sala necesita el objeto entero). */
    var juegos = [];
    (function () {
      if (!window.MFRetos || !MFRetos.juegos || !MFRetos.juego || !MFRetos.abrir) return;
      var ids = MFRetos.juegos() || [];
      for (var i = 0; i < ids.length; i++) {
        var j = MFRetos.juego(ids[i]);
        if (j) juegos.push(j);
      }
    })();

    /* --------------------------------------------- EL CONTENIDO QUE VE EL JUEGO
       Es el de la MISIÓN de origen, no el de la sala, y por dos razones que no
       son cosméticas:
       · `pool` son los señuelos del nivel: kata completa con ellos su rejilla y
         sin ellos la partida sale coja. Por eso el contrato de datos trae
         `pools` por nivel.
       · `id` tiene que ser el id REAL de la misión. kata descarta del pool toda
         entrada que empiece por `<id>#` para no prestar como señuelo una carta
         de la propia pregunta; con un id inventado («sala:…») ese filtro no
         casaría y el señuelo podría ser la respuesta correcta que el alumno está
         buscando. El precio es que los eventos internos de retos.js (reto_open,
         reto_win…) viajan con el id de la misión: por eso la sala emite ADEMÁS
         los suyos, `sala_retos_*`, que son los que distinguen la práctica del
         entrenamiento.
       Se cachea por misión: el objeto tiene que ser el MISMO en cada apertura
       porque los juegos cuelgan de él memorias por partida. */
    var CONTENIDOS = {};
    function contenidoDe(entrada) {
      var k = "m:" + entrada.mision;
      if (!CONTENIDOS[k]) {
        CONTENIDOS[k] = {
          id: entrada.mision,
          /* «mission» y nunca «exam»: en examen no hay repesca y una ronda
             fallada resolvería la tarjeta (retos.js), que es justo lo contrario
             de lo que se viene a hacer aquí. En la sala siempre se puede volver
             a intentarlo. */
          kind: "mission",
          art: art, level: entrada.nivel, title: entrada.titulo,
          /* El mazo completo de la misión: andamio lo usa para nombrar la
             tarjeta con un índice estable (`cards.indexOf`). */
          cards: entrada.cards || [],
          pool: (propio(pools, String(entrada.nivel)) && pools[String(entrada.nivel)]) || [],
        };
      }
      return CONTENIDOS[k];
    }

    /* ------------------------------------------------ QUÉ PREGUNTA VA CON QUÉ
       Se calcula UNA vez y se guarda: la compatibilidad depende de la tarjeta y
       del pool, nunca del progreso ni del filtro, así que rehacerla en cada
       repintado serían ocho `acepta` por pregunta a cada clic. */
    var INDICE = null;
    function indice() {
      if (INDICE) return INDICE;
      INDICE = [];
      if (!window.MFRetos || !MFRetos.compatibles) return INDICE;
      for (var e = 0; e < banco.length; e++) {
        var entrada = banco[e];
        if (!entrada) continue;
        var cards = entrada.cards || [];
        var contenido = contenidoDe(entrada);
        for (var c = 0; c < cards.length; c++) {
          var lista = [];
          /* Un juez que revienta con una tarjeta rara no puede dejar la sala en
             blanco: esa pregunta se queda sin juegos y las demás siguen. */
          try { lista = MFRetos.compatibles(cards[c], contenido) || []; } catch (err) { lista = []; }
          INDICE.push({ entrada: entrada, card: cards[c], i: c, juegos: lista });
        }
      }
      return INDICE;
    }

    /* ¿Se ha ganado ya esta misión? Se lee del progreso, que es donde viven las
       misiones hechas del arte (progress.js, `MF.art`), y SOLO de `missions`.
       No se mira el cinturón del nivel a propósito: aprobar el examen no obliga
       a haber hecho todas las misiones del nivel (la puerta se abre por
       cinturón, auth.js), así que dar por ganadas las de un nivel aprobado
       traería aquí preguntas que el alumno no ha visto nunca. Eso no es
       practicar, es destripar.
       El banco tampoco trae exámenes: build.py los excluye a propósito, porque
       la prueba no se regala de práctica. Si algún día entraran, la comprobación
       que les toca es `exams[nivel].passed` POR ENTRADA, nunca por nivel. */
    /* ---- MODO DE PRUEBAS, TEMPORAL (pedido por el titular, 2026-08-28) ----
       Abre TODAS las preguntas y juegos de la sala sin haber hecho las
       misiones, para poder revisar los ocho miniretos sin recorrer el curso
       entero. NO desmonta el desbloqueo por progreso: `completada()` sigue
       entera justo debajo y vuelve a mandar en cuanto esto se apague.

       Se enciende SOLO en localhost. En el sitio publicado esta apagado por
       construccion, para que no pueda escaparse a produccion en un despiste:
       alli regalaria el curso entero a cualquiera. Para forzarlo fuera de
       localhost no hay forma de encenderlo; aqui, `?todo=0` lo apaga.

       PARA QUITARLO cuando ya no haga falta: borrar este bloque y la primera
       linea de `completada()`. No hay nada mas que deshacer. */
    var TODO_ABIERTO = (function () {
      /* El host manda ANTES que el parametro: fuera de localhost esto es false
         diga lo que diga la URL. Antes `?todo=1` se leia primero y abria la sala
         entera en el sitio publicado a cualquier alumno que lo anadiera (lo
         encontro la radiografia del 2026-09-04). */
      var h = window.location.hostname;
      if (!(h === "localhost" || h === "127.0.0.1" || h === "")) return false;
      var q = (window.location.search.match(/[?&]todo=([01])/) || [])[1];
      return q !== "0";
    })();

    function completada(entrada) {
      if (TODO_ABIERTO) return true;                 /* modo de pruebas: ver arriba */
      if (!window.MF || !MF.art) return false;
      return !!MF.art(art).missions[entrada.mision];
    }

    /* ------------------------------------------------------------ EL COBRO
       Repasar paga el 10 % del XP que dio esa misión, una sola vez por pregunta.
       Aquí NO se guarda ninguna lista de pagadas: el importe lo calcula
       `MF.replayXP` sobre el XP realmente registrado de la misión (20 o 25, sin
       constantes escritas a mano) y el «una sola vez» lo hace cumplir
       `MF.replayWon`, que es idempotente. Repetir ese control en la sala crearía
       una segunda memoria y en cuanto las dos discreparan una estaría mintiendo.
       Las dos funciones devuelven lo mismo para poder contarlo en pantalla: `xp`
       es lo que se cobra y `yaCobrada` distingue «esta pregunta ya estaba pagada»
       de «no había motor que pagara».

       Son DOS porque el importe se necesita en dos momentos: el juego lo pide
       mientras celebra —para cantar el número exacto, no un «+5 XP» de adorno— y
       `cobrar()` lo paga un instante después, al resolverse la partida. La cuenta
       es una sola (`previsto`) precisamente para que no puedan discrepar: dos
       cuentas distintas eran lo que hacía que el juego gritara «+5 XP» y la ficha
       dijera después «+3 XP». */

    /* Lo que pagaría AHORA MISMO una victoria limpia sobre esta pregunta, SIN
       cobrar nada todavía. */
    function previsto(pick) {
      var nada = { xp: 0, yaCobrada: false };
      if (!window.MF || !MF.replayKey || !MF.replayXP || !MF.replayPaid) return nada;
      try {
        /* Se pregunta ANTES solo para poder decirlo; quien impide el segundo
           cobro es replayWon, no esta línea. */
        if (MF.replayPaid(art, MF.replayKey(pick.entrada.mision, pick.i))) {
          return { xp: 0, yaCobrada: true };
        }
        return { xp: MF.replayXP(art, pick.entrada.mision) || 0, yaCobrada: false };
      } catch (err) {
        /* Consultar nunca puede tumbar la sala: si el progreso falla, la partida
           sigue siendo válida y simplemente no se anuncia XP. */
        return nada;
      }
    }

    /* Y el cobro de verdad, sobre ese mismo importe. */
    function cobrar(pick) {
      var vacio = { xp: 0, yaCobrada: false };
      if (!window.MF || !MF.replayKey || !MF.replayWon) return vacio;
      var antes = previsto(pick);
      if (antes.yaCobrada) return { xp: 0, yaCobrada: true };
      try {
        var clave = MF.replayKey(pick.entrada.mision, pick.i);
        return { xp: MF.replayWon(art, clave, antes.xp) || 0, yaCobrada: false };
      } catch (err) {
        /* Cobrar nunca puede tumbar la sala: si el progreso falla, la partida
           jugada sigue siendo válida y simplemente no se anuncia XP. */
        return vacio;
      }
    }

    function enFiltro(entrada) {
      return nivelFiltro === "todos" || String(entrada.nivel) === nivelFiltro;
    }

    /* Un solo recorrido devuelve las cuatro cifras que la ficha necesita:
       `listas` (las jugables ahora mismo), `visibles` (las que el filtro deja
       ver), `total` (las que este juego tiene en todo el curso) y `falta` (el
       nivel más bajo donde hay pregunta pero aún no está ganada). Esa última es
       la que convierte un botón muerto en una instrucción. */
    function estadoDe(id) {
      var todo = indice(), r = { listas: [], visibles: 0, total: 0, falta: null }, k, f, n;
      for (k = 0; k < todo.length; k++) {
        f = todo[k];
        if (f.juegos.indexOf(id) === -1) continue;
        r.total++;
        if (!enFiltro(f.entrada)) continue;
        r.visibles++;
        if (completada(f.entrada)) { r.listas.push(f); continue; }
        n = f.entrada.nivel;
        if (n && (r.falta === null || n < r.falta)) r.falta = n;
      }
      return r;
    }

    /* Un botón apagado sin explicación es peor que no tenerlo: aquí se decide
       qué frase lo acompaña, siempre la más concreta que los datos permitan. */
    function motivo(e) {
      if (!e.total) return T.sinPreguntas;
      if (!e.visibles) return T.sinEnNivel.replace("{n}", nivelFiltro);
      if (e.falta !== null) return T.completaNivel.replace("{n}", e.falta);
      return T.sinPreguntas;
    }

    /* Los niveles que ya dan juego. Se listan solo los ganados: un chip que
       siempre saliera vacío no sería un filtro, sería una trampa. */
    function nivelesJugables() {
      var todo = indice(), vistos = {}, out = [], k, f, n;
      for (k = 0; k < todo.length; k++) {
        f = todo[k];
        if (!f.juegos.length) continue;          /* pregunta que no abre ningún reto */
        if (!completada(f.entrada)) continue;
        n = f.entrada.nivel;
        if (!n || vistos[n]) continue;
        vistos[n] = true;
        out.push(n);
      }
      out.sort(function (a, b) { return a - b; });
      return out;
    }

    /* ================================================================ PINTAR == */

    /* El cuerpo de la página (si el .md trae texto) va antes de la lista, como
       en cualquier sala; con `html` vacío no se añade nada. */
    if (data.html) {
      var intro = document.createElement("div");
      intro.className = "prose sala-retos__intro";
      intro.innerHTML = data.html;
      body.appendChild(intro);
    }

    /* Las DOS clases en el contenedor y en cada ficha (`audioteca` + `sala-retos`)
       no son adorno: el traje de la sala hereda el esqueleto de la hermana y solo
       viste lo que de verdad cambia (game.css). Quitar la primera dejaría la
       lista sin rejilla. */
    var wrap = el('<div class="audioteca sala-retos">' +
      '<p class="sala-retos__aviso"></p>' +
      '<div class="audioteca__top">' +
        '<p class="audioteca__resumen"></p>' +
        '<div class="audioteca__filtros sala-retos__niveles" role="group" aria-label="' + esc(T.nivelesAria) + '">' +
        "</div>" +
      "</div>" +
      '<ol class="audioteca__lista"></ol></div>');
    body.appendChild(wrap);

    var lista = wrap.querySelector(".audioteca__lista");
    var resumen = wrap.querySelector(".audioteca__resumen");
    var filtros = wrap.querySelector(".sala-retos__niveles");
    /* La invitación de la sala, siempre a la vista: el cuerpo del .md ya no
       explica nada (la sala se explica sola con su hero y su lista), así que
       esta línea es lo único que anuncia que repasar también suma. */
    wrap.querySelector(".sala-retos__aviso").textContent = T.aviso;

    function pintarResumen() {
      var todo = indice(), ganadas = 0, abiertos = 0, k, f;
      for (k = 0; k < todo.length; k++) {
        f = todo[k];
        if (!f.juegos.length || !enFiltro(f.entrada) || !completada(f.entrada)) continue;
        ganadas++;
      }
      for (k = 0; k < juegos.length; k++) { if (estadoDe(juegos[k].id).listas.length) abiertos++; }
      resumen.textContent = ganadas
        ? (ganadas === 1 ? T.resumenUna : T.resumen.replace("{p}", ganadas))
            .replace("{j}", abiertos).replace("{t}", juegos.length)
        : T.sinMisiones;
    }

    function chip(valor, texto, color, lamina) {
      var activo = String(valor) === nivelFiltro;
      var b = el('<button class="audioteca__filtro sala-retos__nivel' + (activo ? " is-on" : "") + '" type="button"></button>');
      b.setAttribute("data-nivel", String(valor));
      /* Botón de dos estados: `aria-pressed` es lo que dice a un lector de
         pantalla cuál está puesto; `is-on` solo lo pinta. */
      b.setAttribute("aria-pressed", activo ? "true" : "false");
      if (color) b.style.setProperty("--belt", color);
      /* «Todos» sigue siendo palabra; los niveles son lamina + numero. El
         `aria-label` conserva «Nivel 3» entero: quitar la palabra es una
         economia VISUAL, y un lector de pantalla que solo dijera «3» dejaria el
         boton sin sentido. */
      b.textContent = "";
      if (lamina) {
        var img = document.createElement("img");
        img.className = "sala-retos__cinturon";
        img.src = lamina; img.alt = ""; img.setAttribute("aria-hidden", "true");
        img.width = 40; img.height = 40; img.loading = "lazy";
        b.appendChild(img);
      }
      b.appendChild(document.createTextNode(lamina ? String(valor) : texto));
      b.setAttribute("aria-label", texto);
      b.setAttribute("title", texto);
      b.addEventListener("click", function () {
        nivelFiltro = String(valor);
        pintarFiltros();
        pintar();
        track("sala_retos_filter", art, data.id, { nivel: nivelFiltro });
      });
      return b;
    }

    function pintarFiltros() {
      var niveles = nivelesJugables(), k, n;
      /* Ya no hay rótulo que respetar: el grupo entero son filtros. El nombre
         accesible lo pone el `aria-label` del contenedor, no un <span> visible. */
      while (filtros.lastChild) filtros.removeChild(filtros.lastChild);
      /* Con un solo nivel ganado el selector no separa nada: sobra entero. */
      if (niveles.length < 2) { filtros.hidden = true; return; }
      filtros.hidden = false;
      filtros.appendChild(chip("todos", T.nivelTodos, null));
      for (k = 0; k < niveles.length; k++) {
        n = niveles[k];
        filtros.appendChild(chip(n, T.nivel.replace("{n}", n), COLOR_NIVEL[n] || null, CINTURON_NIVEL[n] || null));
      }
    }

    function crearFicha(juego) {
      var idCont = "sala-retos-n-" + juego.id;
      var idMotivo = "sala-retos-motivo-" + juego.id;
      var li = el('<li class="audioteca__item sala-retos__item" data-juego="' + esc(juego.id) + '">' +
        '<div class="audioteca__ficha">' +
          /* El icono ocupa la columna del número de la sala hermana: misma
             rejilla, otro contenido. */
          '<span class="sala-retos__icono" aria-hidden="true"></span>' +
          '<div class="audioteca__texto">' +
            '<h3 class="audioteca__titulo"></h3>' +
            '<p class="audioteca__sumario"></p>' +
            '<p class="sala-retos__motivo" id="' + esc(idMotivo) + '" hidden></p>' +
          "</div>" +
          '<div class="audioteca__acciones">' +
            '<span class="sala-retos__contador" id="' + esc(idCont) + '"></span>' +
            /* `btn--sm` como en la sala hermana; los 44 px de diana los pone
               `.sala-retos__jugar` en game.css. */
            '<button class="btn btn--primary btn--sm sala-retos__jugar" type="button" ' +
              'aria-describedby="' + esc(idCont) + " " + esc(idMotivo) + '"></button>' +
          "</div>" +
        "</div></li>");

      /* textContent y no innerHTML: el icono, el nombre y la línea de «qué hay
         que hacer» los declara cada juego en su propio archivo, no son plantilla
         de esta sala. Esa última línea vivió aquí mientras la sala era la única
         que la enseñaba; hoy la enseña también la tarjeta-invitación de la
         misión, así que subió al juego (`comoSeJuega`) para que las dos digan lo
         mismo y una sola mano la retoque. La red se queda: un juego futuro que
         no la declare cae a su banner, que se verá pobre pero nunca vacío. */
      /* La lámina del juego, con el emoji de respaldo: la decisión vive en
         MFRetos porque la tarjeta de invitación de las misiones pinta el mismo
         icono y las dos tienen que decir lo mismo. */
      if (MFRetos.pintarIcono) MFRetos.pintarIcono(li.querySelector(".sala-retos__icono"), juego);
      else li.querySelector(".sala-retos__icono").textContent = juego.icono || "🥋";
      li.querySelector(".audioteca__titulo").textContent = juego.nombre || juego.id;
      li.querySelector(".audioteca__sumario").textContent =
        juego.comoSeJuega || juego.banner || "";

      var contador = li.querySelector(".sala-retos__contador");
      var razon = li.querySelector(".sala-retos__motivo");
      var boton = li.querySelector(".sala-retos__jugar");
      var panel = null;
      var jugadas = 0;

      function refrescar() {
        var e = estadoDe(juego.id), hay = e.listas.length;
        boton.disabled = !hay;
        /* `is-off` es lo que apaga la ficha en game.css: el juego se sigue
           viendo —y leyendo— para que el alumno sepa qué le falta por ganar. */
        li.classList.toggle("is-off", !hay);
        /* El número en <b> es el gancho que el CSS del contador realza. */
        contador.innerHTML = "<b>" + hay + "</b> " + esc(hay === 1 ? T.una : T.varias);
        razon.textContent = hay ? "" : motivo(e);
        razon.hidden = !!hay;
        boton.textContent = jugadas ? T.otra : T.jugar;
      }

      /* El resultado se cuenta en la ficha, junto al botón que se acaba de
         pulsar: el toast de «+N XP» lo lanza el progreso al cobrar, y es el
         mismo que sale entrenando. Aquí se dice además POR QUÉ, que es lo que
         un toast no puede contar. Devuelve el cobro para que la medición
         registre exactamente lo que vio el alumno. */
      function resultado(res, pick) {
        if (panel) { panel.remove(); panel = null; }
        /* Cerrar el modal a mitad no es un resultado: la ficha se queda como
           estaba y el botón vuelve a invitar. */
        if (!res || res.estado === "abandonado") { refrescar(); return null; }
        var ganado = res.estado !== "fallado";
        /* Solo paga la partida GANADA y LIMPIA. Es exactamente la misma vara que
           usa la misión para su +5 de acertar a la primera: aflojarla aquí
           pagaría mejor el repaso que el entrenamiento. */
        var cobro = (ganado && res.limpio) ? cobrar(pick) : null;
        /* Perder no paga y no hace falta decirlo (nadie espera cobrar por
           perder); ganar SIEMPRE explica qué ha pasado con el XP. */
        var nota = "";
        if (ganado && !res.limpio) nota = T.soloLimpio;
        else if (cobro && cobro.xp) nota = T.pagado.replace("{n}", cobro.xp);
        else if (cobro && cobro.yaCobrada) nota = T.yaCobrada;
        panel = el('<div class="feedback feedback--' + (ganado ? "ok" : "ko") + ' sala-retos__resultado" role="status">' +
          "<p><strong>" + esc(ganado ? T.ganado : T.fallado) + "</strong> " +
          '<span class="sala-retos__pago">' + esc(nota) + "</span></p></div>");
        li.appendChild(panel);
        refrescar();
        return cobro;
      }

      boton.addEventListener("click", function () {
        if (boton.disabled) return;
        var e = estadoDe(juego.id);
        var pick = sorteoCiclico(juego.id, e.listas);
        /* La lista se recalcula al pulsar, no se guarda del pintado: si algo
           hubiera cambiado por debajo, se refresca la ficha y no se abre nada. */
        if (!pick) { refrescar(); return; }

        practicas++;
        jugadas++;
        track("sala_retos_play", art, data.id, {
          juego: juego.id, mision: pick.entrada.mision, nivel: pick.entrada.nivel,
          tarjeta: pick.i, disponibles: e.listas.length, filtro: nivelFiltro,
        });

        var p = null;
        try {
          p = MFRetos.abrir(juego, pick.card, {
            content: contenidoDe(pick.entrada),
            iTarjeta: pick.i,
            /* Un `intento` NUEVO por partida. retos.js guarda los fallos por
               (content, intento, tarjeta) y los juegos guardan ahí su tablero:
               sin estrenarlo, la segunda partida sobre la misma pregunta
               heredaría los fallos y el tablero de la primera y ya no podría ser
               «limpia». En la misión el intento solo sube al repetir un examen;
               aquí se practica en bucle, así que sube siempre. */
            intento: practicas,
            /* CUÁNTO VALE ESTA PARTIDA. Sin esto los ocho juegos cantaban «+5 XP»
               y volaban un 5 al HUD también aquí, donde una victoria paga el 10 %
               de la misión (2 o 3) o CERO si esa pregunta ya estaba cobrada: el
               alumno veía volar un 5 un segundo antes de que la ficha le dijera
               «+3 XP». Viaja la PREGUNTA y no el número porque el importe depende
               de lo ya cobrado y solo es cierto en el instante en que se pregunta;
               un 0 le dice al juego que no cante ningún XP ni lance el vuelo.
               La respuesta sale de la misma cuenta que paga `cobrar()`. */
            premia: function () { return previsto(pick).xp; },
            origen: boton,
          });
        } catch (err) { p = null; }

        if (!p || typeof p.then !== "function") {
          track("sala_retos_error", art, data.id, { juego: juego.id, mision: pick.entrada.mision });
          refrescar();
          return;
        }
        p.then(function (res) {
          var cobro = resultado(res, pick);
          track("sala_retos_result", art, data.id, {
            juego: juego.id, mision: pick.entrada.mision, nivel: pick.entrada.nivel,
            estado: (res && res.estado) || "abandonado", limpio: !!(res && res.limpio),
            intentos: (res && res.intentos) || 0, ms: (res && res.ms) || 0,
            /* Lo cobrado y lo no cobrado se miden por separado: es la única
               forma de comprobar desde fuera que el techo de la sala se
               respeta (una vez por pregunta y nada más). */
            xp: (cobro && cobro.xp) || 0, ya: !!(cobro && cobro.yaCobrada),
          });
        }, function () {
          track("sala_retos_error", art, data.id, { juego: juego.id, mision: pick.entrada.mision });
          refrescar();
        });
      });

      refrescar();
      return li;
    }

    function pintar() {
      lista.innerHTML = "";
      if (!juegos.length) {
        /* Sin motor de retos la sala no puede prometer nada: lo dice y calla. */
        lista.appendChild(el('<li class="muted">' + esc(T.sinMotor) + "</li>"));
        filtros.hidden = true;
        resumen.textContent = "";
        return;
      }
      for (var k = 0; k < juegos.length; k++) lista.appendChild(crearFicha(juegos[k]));
      pintarResumen();
    }

    pintarFiltros();
    pintar();
    track("sala_retos_open", art, data.id, {
      juegos: juegos.length, preguntas: indice().length, banco: banco.length,
    });
  }

  document.querySelectorAll("[data-gate][data-kind='sala-retos']").forEach(function (host) {
    host.addEventListener("mf:content", function (e) { start(host, e.detail); });
  });
})();

/* MenteFu / MindFu — Árbol Cerebro: el avatar-planta del alumno (docs/05).
   El árbol evoluciona con el rango (XP) y se decora con los adornos que dan
   los entrenamientos: uno por cinturón y el trofeo al completar el curso.
   El alumno elige cuáles cuelga y dónde: toca en el cofre, toca en el árbol,
   y arrastra para recolocar. Todo se guarda en el estado sincronizado.
   Requiere progress.js. Expone window.MFArbol. */
(function () {
  "use strict";
  if (!window.MF) return;
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var RUTA = (cfg.assets || "") + "assets/img/arbol/";

  var T = ES ? {
    titulo: "Tu Árbol Cerebro", lema: "Tu mente crece con cada logro.",
    ayuda: "Toca un adorno para colgarlo o quitarlo del árbol. Arrástralo sobre el árbol para moverlo: recordará su sitio.",
    cofre: "Cofre de adornos", set: "Set CulpaFu",
    bloqueado: "Se desbloquea con: {c}", colocado: "Ya está en tu árbol",
    trofeo: "Trofeo de curso · Legendario", cinturon: "Adorno de cinturón",
    colocando: "Toca el árbol para colgarlo…", etapa: "Etapa {n} de {m}",
  } : {
    titulo: "Your Brain Tree", lema: "Your mind grows with every achievement.",
    ayuda: "Tap an ornament to hang it or remove it. Drag it on the tree to move it: it remembers its spot.",
    cofre: "Ornament chest", set: "GuiltFu set",
    bloqueado: "Unlocks with: {c}", colocado: "Already on your tree",
    trofeo: "Course trophy · Legendary", cinturon: "Belt ornament",
    colocando: "Tap the tree to hang it…", etapa: "Stage {n} of {m}",
  };

  /* ---------- catálogo de adornos (CulpaFu) ---------- */
  function A(id, belt, nom_es, nom_en, cond_es, cond_en, stats_es, stats_en) {
    return { id: id, art: "culpafu", belt: belt, nombre: ES ? nom_es : nom_en,
             cond: ES ? cond_es : cond_en, stats: ES ? stats_es : stats_en,
             img: RUTA + id + ".webp", trofeo: belt === 0 };
  }
  var CATALOGO = [
    A("culpafu-1", 1, "Farolillo del Reconocimiento", "Lantern of Recognition",
      "Cinturón blanco de CulpaFu", "GuiltFu white belt",
      ["Ilumina la culpa en cuanto entra en la sala", "Permite ponerle nombre antes de obedecerla"],
      ["Lights up guilt the moment it enters the room", "Lets you name it before you obey it"]),
    A("culpafu-2", 2, "Campana de la Conciencia", "Bell of Awareness",
      "Cinturón amarillo de CulpaFu", "GuiltFu yellow belt",
      ["Suena cuando habla el culpador interior", "Distingue tu voz de los ecos heredados"],
      ["Rings when the inner accuser speaks", "Tells your voice from inherited echoes"]),
    A("culpafu-3", 3, "Lupa del Análisis", "Magnifier of Analysis",
      "Cinturón naranja de CulpaFu", "GuiltFu orange belt",
      ["Revela de quién es cada «debería»", "Detecta normas que ya no representan tus valores"],
      ["Reveals whose each “should” is", "Spots rules that no longer match your values"]),
    A("culpafu-4", 4, "Escudo de los Límites", "Shield of Boundaries",
      "Cinturón verde de CulpaFu", "GuiltFu green belt",
      ["Bloquea culpas ajenas que quieran imponerte", "Sostiene un «no» sin escalar el conflicto"],
      ["Blocks other people's guilt aimed at you", "Holds a “no” without escalating"]),
    A("culpafu-5", 5, "Brújula de la Autonomía", "Compass of Autonomy",
      "Cinturón azul de CulpaFu", "GuiltFu blue belt",
      ["Señala tu dirección aunque haya decepción alrededor", "Convierte «debería» en decisión propia"],
      ["Points your way even through others' disappointment", "Turns “should” into your own decision"]),
    A("culpafu-6", 6, "Corazón Kintsugi", "Kintsugi Heart",
      "Cinturón morado de CulpaFu", "GuiltFu purple belt",
      ["Permite agarrar solo tu responsabilidad en cada situación", "Repara con oro, no con castigo"],
      ["Lets you carry only your share of each situation", "Repairs with gold, not with punishment"]),
    A("culpafu-7", 7, "Pluma de la Liberación", "Feather of Release",
      "Cinturón marrón de CulpaFu", "GuiltFu brown belt",
      ["Suelta la culpa una vez has reparado lo posible", "Cierra expedientes que ya fueron juzgados"],
      ["Lets guilt go once repair is done", "Closes files that were already judged"]),
    A("culpafu-8", 8, "Cinturón del Dominio", "Belt of Mastery",
      "Cinturón negro de CulpaFu", "GuiltFu black belt",
      ["El método entero, enrollado y a mano", "La guardia ya no se piensa: se tiene"],
      ["The whole method, rolled up and at hand", "The guard is no longer thought — it is had"]),
    A("culpafu-trofeo", 0, "Sello Dorado de CulpaFu", "Golden Seal of GuiltFu",
      "Completar CulpaFu entera", "Completing all of GuiltFu",
      ["Prueba de que recorriste el arte completo", "La culpa ya no decide por ti: eliges tú"],
      ["Proof that you walked the whole art", "Guilt no longer decides for you: you choose"]),
  ];

  /* ---------- estado ---------- */
  function estadoArbol() {
    var s = MF.state();
    if (!s.tree) { s.tree = { p: [], mem: {} }; }
    if (!s.tree.p) s.tree.p = [];
    if (!s.tree.mem) s.tree.mem = {};   /* última posición de cada adorno */
    return s.tree;
  }
  function desbloqueado(a) {
    var st = MF.art(a.art);
    if (a.trofeo) return Object.keys(st.belts || {}).length >= 8;
    return !!st.belts[a.belt];
  }
  function puesto(id) {
    return estadoArbol().p.some(function (x) { return x.id === id; });
  }
  function etapaActual() {
    var xp = MF.totalXP(), n = 0;
    (cfg.ranks || []).forEach(function (r) { if (xp >= r[0]) n++; });
    return Math.max(1, Math.min(n, 6));
  }

  /* ---------- render ---------- */
  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function tooltipHTML(a, abierto) {
    return '<span class="adorno-tip' + (a.trofeo ? " adorno-tip--legendario" : "") + '" role="tooltip">' +
      '<b class="adorno-tip__nombre">' + esc(a.nombre) + "</b>" +
      '<i class="adorno-tip__rango">' + (a.trofeo ? T.trofeo : T.cinturon) + " · " + T.set + "</i>" +
      '<u class="adorno-tip__stats">' + a.stats.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</u>" +
      (abierto ? "" : '<em class="adorno-tip__cond">' + esc(T.bloqueado.replace("{c}", a.cond)) + "</em>") +
      "</span>";
  }

  function pintarLienzo(lienzo, interactivo) {
    var etapa = etapaActual();
    lienzo.innerHTML = '<img class="arbol__etapa" alt="" draggable="false" src="' + RUTA + "etapa-" + etapa + '.webp">';
    lienzo.setAttribute("data-etapa", etapa);
    estadoArbol().p.forEach(function (x) {
      var a = CATALOGO.filter(function (c) { return c.id === x.id; })[0];
      if (!a || !desbloqueado(a)) return;   /* un adorno ya no ganado no se pinta */
      var img = el('<img class="arbol__adorno" draggable="false" alt="' + esc(a.nombre) + '" src="' + a.img + '">');
      img.style.left = x.x + "%";
      img.style.top = x.y + "%";
      img.setAttribute("data-id", x.id);
      lienzo.appendChild(img);
    });
    if (interactivo) armarArrastre(lienzo);
  }

  /* Coloca el tooltip ENTERO dentro del viewport, midiéndolo antes de
     enseñarlo. Nunca se recorta ni lleva scroll: si no cabe, primero se
     ensancha —más ancho, menos líneas, menos alto— y, si aun así no cabe por
     arriba ni por abajo, se va al costado, donde dispone de toda la franja
     entre la cabecera y el borde inferior.

     El techo NO es el borde de la pantalla: la cabecera es pegajosa y se pinta
     por encima del tooltip, así que lo que quede debajo de ella sale cortado
     (se veía en escritorio, 2026-08-26). */
  function situarTip(cel) {
    var tip = cel.querySelector(".adorno-tip");
    if (!tip) return;
    var margen = 8, hueco = 10;              /* holgura al borde y para la flecha */
    tip.classList.remove("is-abajo", "is-lado", "is-lado-izq");
    tip.style.removeProperty("--tip-dx");
    tip.style.removeProperty("--tip-dy");
    tip.style.removeProperty("--tip-ancho");

    var techo = margen;
    var cab = document.querySelector(".header");
    if (cab) {
      var rc = cab.getBoundingClientRect();
      var pos = getComputedStyle(cab).position;
      if ((pos === "sticky" || pos === "fixed") && rc.bottom > techo) techo = rc.bottom + margen;
    }
    var suelo = window.innerHeight - margen;
    var r = cel.getBoundingClientRect();
    var arriba = r.top - hueco - techo;                   /* alto libre por encima */
    var abajo = suelo - (r.bottom + hueco);               /* y por debajo */
    var franja = suelo - techo;                           /* y de lado: toda la franja */

    tip.classList.add("is-midiendo");        /* visible pero invisible: se puede medir */
    function medir(ancho) {
      if (ancho) tip.style.setProperty("--tip-ancho", ancho + "px");
      else tip.style.removeProperty("--tip-ancho");
      return { w: tip.offsetWidth, h: tip.offsetHeight };
    }
    var base = medir(null);                  /* el ancho que manda el CSS */
    var anchoMax = Math.min(30 * 16, window.innerWidth - margen * 2);   /* 30rem tope */
    var vertical = Math.max(arriba, abajo);

    /* 1. ¿cabe ya en el lado con más sitio? */
    var elegido = base.h <= vertical ? base : null;
    /* 2. si no, se ensancha por pasos hasta que quepa */
    for (var w = base.w + 56; !elegido && w <= anchoMax; w += 56) {
      var m = medir(w);
      if (m.h <= vertical) elegido = m;
    }
    if (elegido) {
      if (elegido !== base) tip.style.setProperty("--tip-ancho", elegido.w + "px");
      else tip.style.removeProperty("--tip-ancho");
      if (abajo > arriba && elegido.h > arriba) tip.classList.add("is-abajo");
      colocarEnHorizontal(tip, r, elegido.w, margen);
      tip.classList.remove("is-midiendo");
      return;
    }

    /* 3. al costado: se elige el lado con más aire y el ancho que quepa ahí */
    var sitioDer = window.innerWidth - margen - (r.right + hueco);
    var sitioIzq = (r.left - hueco) - margen;
    var izquierda = sitioIzq > sitioDer;
    var anchoLado = Math.min(base.w, Math.max(sitioIzq, sitioDer));
    var lat = medir(Math.max(140, Math.round(anchoLado)));
    /* si aun de lado sobra alto, se ensancha lo que el hueco permita */
    for (var w2 = lat.w + 56; lat.h > franja && w2 <= Math.max(sitioIzq, sitioDer); w2 += 56) {
      lat = medir(w2);
    }
    /* Ni de lado cabe (contenido larguísimo en una pantalla mínima): entre
       quedarse de lado o arriba/abajo al ancho máximo, gana lo que deje menos
       texto fuera. Nunca hay scroll: se enseña lo máximo posible. */
    if (lat.h > franja) {
      var ancho2 = medir(anchoMax);
      if (ancho2.h - vertical < lat.h - franja) {
        tip.style.setProperty("--tip-ancho", ancho2.w + "px");
        if (abajo > arriba) tip.classList.add("is-abajo");
        colocarEnHorizontal(tip, r, ancho2.w, margen);
        tip.classList.remove("is-midiendo");
        return;
      }
      lat = medir(lat.w);
    }
    tip.classList.add("is-lado");
    if (izquierda) tip.classList.add("is-lado-izq");
    tip.style.setProperty("--tip-ancho", lat.w + "px");
    /* centrado en el accesorio y empujado dentro de la franja */
    var centroY = r.top + r.height / 2;
    var dy = 0;
    if (centroY - lat.h / 2 < techo) dy = techo - (centroY - lat.h / 2);
    else if (centroY + lat.h / 2 > suelo) dy = suelo - (centroY + lat.h / 2);
    tip.style.setProperty("--tip-dy", Math.round(dy) + "px");
    tip.classList.remove("is-midiendo");
  }

  /* Corre el tooltip en horizontal lo justo para no salirse; la flecha se queda
     apuntando al accesorio (compensa el mismo desplazamiento en el CSS). */
  function colocarEnHorizontal(tip, r, ancho, margen) {
    var centro = r.left + r.width / 2;
    var izq = centro - ancho / 2, der = centro + ancho / 2;
    var dx = 0;
    if (izq < margen) dx = margen - izq;
    else if (der > window.innerWidth - margen) dx = (window.innerWidth - margen) - der;
    tip.style.setProperty("--tip-dx", Math.round(dx) + "px");
  }

  function pintarCofre(cofre, lienzo) {
    var filas = CATALOGO.map(function (a) {
      var abierto = desbloqueado(a), enArbol = puesto(a.id);
      var cls = "adorno" + (abierto ? "" : " adorno--bloqueado") + (enArbol ? " adorno--puesto" : "") + (a.trofeo ? " adorno--legendario" : "");
      return '<button type="button" class="' + cls + '" data-adorno="' + a.id + '"' + (abierto ? "" : " aria-disabled=\"true\"") + ">" +
        '<img src="' + a.img + '" alt="" draggable="false">' +
        (abierto ? "" : '<span class="adorno__candado" aria-hidden="true">🔒</span>') +
        (enArbol ? '<span class="adorno__check" aria-hidden="true">✓</span>' : "") +
        tooltipHTML(a, abierto) + "</button>";
    }).join("");
    cofre.innerHTML = '<p class="arbol__cofre-titulo">' + T.cofre + " · " + T.set + "</p>" +
      '<div class="arbol__adornos">' + filas + "</div>";

    cofre.querySelectorAll("[data-adorno]").forEach(function (b) {
      /* El tooltip se sitúa solo dentro de la pantalla (2026-08-26): en móvil
         los de las columnas de los bordes se salían y no se podían leer. */
      ["pointerenter", "focus", "touchstart"].forEach(function (ev) {
        b.addEventListener(ev, function () { situarTip(b); }, { passive: true });
      });
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-adorno");
        var a = CATALOGO.filter(function (c) { return c.id === id; })[0];
        if (!desbloqueado(a)) return;              /* bloqueado: el tooltip ya explica */
        if (puesto(id)) quitar(id, lienzo, cofre); /* conmutador: quitar recordando el sitio */
        else colocar(id, lienzo, cofre);           /* volver a su último sitio, o a uno al azar */
      });
    });
  }

  /* ---------- colocar, arrastrar, devolver ---------- */
  function repintar(lienzo, cofre) {
    MF.save();
    pintarLienzo(lienzo, true);
    pintarCofre(cofre, lienzo);
    sincronizarMinis();
  }

  function colocar(id, lienzo, cofre) {
    var t = estadoArbol();
    /* su último sitio recordado; sin memoria, un punto al azar en la copa */
    var pos = t.mem[id] || { x: Math.round((22 + Math.random() * 56) * 10) / 10,
                             y: Math.round((14 + Math.random() * 52) * 10) / 10 };
    t.p.push({ id: id, x: pos.x, y: pos.y });
    repintar(lienzo, cofre);
  }

  function quitar(id, lienzo, cofre) {
    var t = estadoArbol();
    var fila = t.p.filter(function (x) { return x.id === id; })[0];
    if (fila) t.mem[id] = { x: fila.x, y: fila.y };   /* recuerda dónde estaba */
    t.p = t.p.filter(function (x) { return x.id !== id; });
    repintar(lienzo, cofre);
  }

  function armarArrastre(lienzo) {
    var cofre = lienzo.__cofre;
    var d = null;   /* {img, id, movido} */
    lienzo.addEventListener("pointerdown", function (e) {
      var img = e.target.closest && e.target.closest(".arbol__adorno");
      if (!img) return;
      e.preventDefault();
      d = { img: img, id: img.getAttribute("data-id"), movido: false };
      img.setPointerCapture && img.setPointerCapture(e.pointerId);
      img.classList.add("arbol__adorno--vuelo");
    });
    lienzo.addEventListener("pointermove", function (e) {
      if (!d) return;
      d.movido = true;
      var r = lienzo.getBoundingClientRect();
      /* El adorno no puede salirse del lienzo: el tope se calcula con su medio
         ancho y medio alto reales (va centrado en su posición), así se queda
         ENTERO dentro aunque cambie su tamaño. */
      var mx = r.width ? (d.img.offsetWidth / 2 / r.width) * 100 : 6.5;
      var my = r.height ? (d.img.offsetHeight / 2 / r.height) * 100 : 6.5;
      d.img.style.left = Math.max(mx, Math.min(100 - mx, ((e.clientX - r.left) / r.width) * 100)) + "%";
      d.img.style.top = Math.max(my, Math.min(100 - my, ((e.clientY - r.top) / r.height) * 100)) + "%";
    });
    /* si el navegador se queda el gesto (scroll de la página), el arrastre se
       cancela: sin esto el adorno seguía pegado al dedo después */
    lienzo.addEventListener("pointercancel", function () {
      if (!d) return;
      d.img.classList.remove("arbol__adorno--vuelo");
      d = null;
    });
    lienzo.addEventListener("pointerup", function (e) {
      if (!d) return;
      d.img.classList.remove("arbol__adorno--vuelo");
      if (d.movido) {
        var t = estadoArbol();
        var fila = t.p.filter(function (x) { return x.id === d.id; })[0];
        if (fila) {
          fila.x = Math.round(parseFloat(d.img.style.left) * 10) / 10;
          fila.y = Math.round(parseFloat(d.img.style.top) * 10) / 10;
          t.mem[d.id] = { x: fila.x, y: fila.y };
          MF.save();
          sincronizarMinis();
        }
      }
      d = null;
    });
    lienzo.addEventListener("dblclick", function (e) {
      var img = e.target.closest && e.target.closest(".arbol__adorno");
      if (img) quitar(img.getAttribute("data-id"), lienzo, cofre);
    });
  }

  /* ---------- minis (tarjeta del perfil, cabeceras futuras) ---------- */
  function sincronizarMinis() {
    document.querySelectorAll("[data-arbol-mini]").forEach(function (m) { pintarLienzo(m, false); });
  }

  /* ---------- API ---------- */
  /* En la cabecera del perfil, el árbol vivo ocupa el sitio de la mascota:
     responde a la etapa y a los adornos igual que el lienzo grande. */
  (function () {
    if (!cfg.page || cfg.page.layout !== "profile") return;
    var escena = document.querySelector(".page-head--scene .hero__scene");
    if (!escena) return;
    var caja = el('<div class="hero__arbol" data-arbol-mini aria-hidden="true"></div>');
    escena.appendChild(caja);
    pintarLienzo(caja, false);
  })();

  /* El mini de la cabecera vive FUERA del cuerpo que repinta profile.js, asi
     que ningun render lo toca: `renderIn()` lo resincroniza a mano, pero
     `renderOut()` no, y al cerrar sesion el arbol se quedaba con la etapa y los
     adornos del alumno anterior hasta recargar la pagina. Se engancha al
     PROGRESO y no a la vista, para que valga igual al salir, al entrar y cuando
     el panel reinicia un expediente. La firma evita redibujar con cada gota de
     XP: solo se repinta si de verdad cambia la etapa o los adornos. */
  if (window.MF && MF.onChange) {
    var firmaMini = null;
    MF.onChange(function () {
      var firma = etapaActual() + "|" + JSON.stringify(estadoArbol().p);
      if (firma === firmaMini) return;
      firmaMini = firma;
      sincronizarMinis();
    });
  }

  window.MFArbol = {
    T: T,
    etapa: etapaActual,
    montar: function (lienzo, cofre) {
      lienzo.__cofre = cofre;
      pintarLienzo(lienzo, true);
      pintarCofre(cofre, lienzo);
    },
    mini: sincronizarMinis,
  };
})();

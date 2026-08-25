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
    ayuda: "Toca un adorno del cofre y luego toca el árbol donde quieras colgarlo. Arrástralo para moverlo; doble toque para devolverlo al cofre.",
    cofre: "Cofre de adornos", set: "Set CulpaFu",
    bloqueado: "Se desbloquea con: {c}", colocado: "Ya está en tu árbol",
    trofeo: "Trofeo de curso · Legendario", cinturon: "Adorno de cinturón",
    colocando: "Toca el árbol para colgarlo…", etapa: "Etapa {n} de {m}",
  } : {
    titulo: "Your Brain Tree", lema: "Your mind grows with every achievement.",
    ayuda: "Tap an ornament in the chest, then tap the tree where you want to hang it. Drag to move it; double-tap to send it back to the chest.",
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
    if (!s.tree) { s.tree = { p: [] }; }
    if (!s.tree.p) s.tree.p = [];
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
      '<div class="arbol__adornos">' + filas + "</div>" +
      '<p class="arbol__ayuda muted">' + T.ayuda + "</p>";

    cofre.querySelectorAll("[data-adorno]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-adorno");
        var a = CATALOGO.filter(function (c) { return c.id === id; })[0];
        if (!desbloqueado(a)) return;              /* bloqueado: el tooltip ya explica */
        if (puesto(id)) return;                     /* ya está en el árbol */
        seleccionar(id, lienzo, cofre);
      });
    });
  }

  /* ---------- colocar, arrastrar, devolver ---------- */
  var pendiente = null;   /* id elegido en el cofre, esperando el toque en el árbol */

  function seleccionar(id, lienzo, cofre) {
    pendiente = id;
    lienzo.classList.add("arbol__lienzo--colocando");
    var aviso = lienzo.querySelector(".arbol__aviso") || el('<span class="arbol__aviso"></span>');
    aviso.textContent = T.colocando;
    lienzo.appendChild(aviso);
  }

  function soltarEn(lienzo, cofre, cx, cy) {
    var r = lienzo.getBoundingClientRect();
    var x = Math.max(2, Math.min(98, ((cx - r.left) / r.width) * 100));
    var y = Math.max(2, Math.min(98, ((cy - r.top) / r.height) * 100));
    estadoArbol().p.push({ id: pendiente, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
    pendiente = null;
    lienzo.classList.remove("arbol__lienzo--colocando");
    MF.save();
    pintarLienzo(lienzo, true);
    pintarCofre(cofre, lienzo);
    sincronizarMinis();
  }

  function quitar(id, lienzo, cofre) {
    var t = estadoArbol();
    t.p = t.p.filter(function (x) { return x.id !== id; });
    MF.save();
    pintarLienzo(lienzo, true);
    pintarCofre(cofre, lienzo);
    sincronizarMinis();
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
      d.img.style.left = Math.max(2, Math.min(98, ((e.clientX - r.left) / r.width) * 100)) + "%";
      d.img.style.top = Math.max(2, Math.min(98, ((e.clientY - r.top) / r.height) * 100)) + "%";
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
    lienzo.addEventListener("click", function (e) {
      if (!pendiente) return;
      soltarEn(lienzo, cofre, e.clientX, e.clientY);
    });
  }

  /* ---------- minis (tarjeta del perfil, cabeceras futuras) ---------- */
  function sincronizarMinis() {
    document.querySelectorAll("[data-arbol-mini]").forEach(function (m) { pintarLienzo(m, false); });
  }

  /* ---------- API ---------- */
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

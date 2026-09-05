/* Tu Escuela — el directorio de cursos (/cursos/, F6).
 *
 * Buscar por código de 8 encuentra CUALQUIER curso publicado (también los
 * privados: encontrables, cerrados — el player pide su código de acceso al
 * entrar). Debajo, los públicos del super dojo y la puerta a CulpaFu.
 */
(function () {
  "use strict";
  var esc = MFDom.esc;   /* dom.js: una sola copia para todos */
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang !== "en";

  var T = ES ? {
    buscar: "Buscar por código", placeholder: "p. ej. K7M2X9Q4",
    nada: "Ningún curso responde a ese código.",
    publicos: "Cursos públicos", entrar: "Entrar",
    privado: "privado — pide código al entrar",
    clasico: "El arte fundadora del dojo",
    cargando: "Cargando el directorio…",
    local: "modo local: los códigos viven en el sitio real",
  } : {
    buscar: "Search by code", placeholder: "e.g. K7M2X9Q4",
    nada: "No course answers to that code.",
    publicos: "Public courses", entrar: "Enter",
    privado: "private — asks for a code on entry",
    clasico: "The dojo's founding art",
    cargando: "Loading the directory…",
    local: "local mode: codes live on the real site",
  };

  var esLocal = !(cfg.gate && window.SB && SB.enabled());
  var raiz = null;


  function cardCurso(c) {
    var titulo = ES ? (c.titulo_es || c.titulo_en) : (c.titulo_en || c.titulo_es);
    var lead = ES ? (c.lead_es || "") : (c.lead_en || "");
    var priv = c.visibilidad === "privado";
    return '<div class="escuela-curso">' +
      '<span class="escuela-curso__icono">' + (priv ? "🔒" : "🎓") + "</span>" +
      "<h3>" + esc(titulo || c.clave) + "</h3>" +
      '<span class="escuela-curso__cat">' + esc((c.categoria || "").toUpperCase()) + "</span>" +
      (lead ? '<span class="escuela-curso__datos">' + esc(lead.slice(0, 120)) + "</span>" : "") +
      '<span class="escuela-curso__datos">' + (c.codigo ? "#" + esc(c.codigo) : "") +
      (priv ? " · " + esc(T.privado) : "") +
      (c.maestro ? " · " + esc(c.maestro) : "") + "</span>" +
      '<span class="escuela-curso__estado"><a class="btn btn--primary" href="' +
      esc(cfg.prefix + (ES ? "curso/" : "course/") + "#/" + c.clave) + '">' + esc(T.entrar) + "</a></span></div>";
  }

  function pintar(resultado, publicos) {
    /* CulpaFu tiene su propia casa estática: se ofrece como «arte fundadora»
       SOLO si no viene ya en la lista de públicos — nadie quiere ver el mismo
       curso dos veces en la misma rejilla. */
    var yaListado = /"clave":"culpafu"|href="[^"]*culpafu/.test(publicos || "") ||
      (publicos || "").indexOf(">CulpaFu<") >= 0 || (publicos || "").indexOf(">GuiltFu<") >= 0;
    var clasico = yaListado ? "" :
      '<a class="escuela-curso" href="' + esc(cfg.prefix + (ES ? "culpafu/" : "guiltfu/")) + '">' +
      '<span class="escuela-curso__icono">🥋</span><h3>' + (ES ? "CulpaFu" : "GuiltFu") + "</h3>" +
      '<span class="escuela-curso__cat">' + esc(T.clasico.toUpperCase()) + "</span></a>";
    raiz.innerHTML =
      '<div class="escuela-barra"><nav class="escuela-migas"><b>' + esc(ES ? "Directorio de cursos" : "Course directory") + "</b></nav></div>" +
      '<div class="curso-candado curso-candado--buscar">' +
      '<input class="curso-candado__campo" type="text" maxlength="12" autocomplete="off" placeholder="' + esc(T.placeholder) + '" aria-label="' + esc(T.buscar) + '">' +
      '<button type="button" class="btn btn--primary" data-buscar>' + esc(T.buscar) + "</button>" +
      (esLocal ? ' <span class="escuela-sello">' + esc(T.local) + "</span>" : "") + "</div>" +
      '<div class="escuela-cursos" data-resultado>' + (resultado || "") + "</div>" +
      "<h2 class='escuela-h2'>" + esc(T.publicos) + "</h2>" +
      '<div class="escuela-cursos">' + clasico + (publicos || "") + "</div>";
    raiz.querySelector("[data-buscar]").addEventListener("click", buscar);
    raiz.querySelector(".curso-candado__campo").addEventListener("keydown", function (e) {
      if (e.key === "Enter") buscar();
    });
  }

  var publicosHtml = "";
  function buscar() {
    var codigo = raiz.querySelector(".curso-candado__campo").value.trim();
    var caja = raiz.querySelector("[data-resultado]");
    if (!codigo) return;
    if (esLocal) { caja.innerHTML = '<p class="escuela-nota">' + esc(T.local) + "</p>"; return; }
    SB.rpc("escuela_buscar_curso", { p_codigo: codigo }).then(function (c) {
      caja.innerHTML = c ? cardCurso(c) : '<p class="escuela-nota">' + esc(T.nada) + "</p>";
    }, function () { caja.innerHTML = '<p class="escuela-nota">' + esc(T.nada) + "</p>"; });
  }

  function cargarPublicos() {
    if (esLocal) {
      fetch((cfg.assets || cfg.prefix) + "escuela-fuente.json").then(function (r) { return r.json(); }).then(function (f) {
        publicosHtml = Object.keys(f.cursos).map(function (clave) {
          var capa = f.cursos[clave][cfg.lang] || f.cursos[clave].es;
          return cardCurso({ clave: clave, titulo_es: capa.title, titulo_en: capa.title,
                             categoria: f.cursos[clave].categoria, codigo: "", visibilidad: "publico" });
        }).join("");
        pintar("", publicosHtml);
      }).catch(function () { pintar("", ""); });
      return;
    }
    SB.rpc("escuela_cursos_publicos").then(function (lista) {
      publicosHtml = (lista || []).map(cardCurso).join("");
      pintar("", publicosHtml);
    }, function () { pintar("", ""); });
  }

  document.addEventListener("mf:content", function (e) {
    var host = e.target;
    if (!host || !host.matches || !host.matches("[data-gate][data-kind='cursos']")) return;
    var cuerpo = host.querySelector("[data-gated-body]") || host;
    cuerpo.innerHTML = '<div class="escuela" data-directorio>' +
      (window.MFCargador ? MFCargador(T.cargando) : esc(T.cargando)) + "</div>";
    raiz = cuerpo.querySelector("[data-directorio]");
    cargarPublicos();
  });
})();

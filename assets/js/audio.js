/* MenteFu / MindFu — reproductor de minipodcast reutilizable.

   Una sola pieza para los dos sitios donde se escuchan los pergaminos: la
   tarjeta de la misión (mission.js) y la sala de pergaminos del curso
   (audioteca.js). Reglas de la casa:
     · play/stop, sin barra de salto: «completado» solo puede significar
       «escuchado entero» (el XP se concede en el evento ended);
     · velocidad cíclica 1× · 1,25× · 1,5×, recordada durante la visita;
     · se reanuda donde quedó, así cambiar de tarjeta no obliga a repetir;
     · nunca suenan dos audios a la vez, ni sigue sonando al salir. */
(function () {
  "use strict";
  var el = MFDom.el;   /* dom.js: una sola copia para todos */
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var T = ES ? {
    listen: "Escucharlo en audio", meta: "Minipodcast · +{n} XP al escucharlo completo",
    metaHecho: "Minipodcast", stop: "Detener", speed: "Velocidad de reproducción",
    listened: "Pergamino escuchado",
  } : {
    listen: "Listen to it", meta: "Mini-podcast · +{n} XP when you listen to the end",
    metaHecho: "Mini-podcast", stop: "Stop", speed: "Playback speed",
    listened: "Scroll listened",
  };
  var VELOCIDADES = [1, 1.25, 1.5];

  function mmss(s) { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }

  /* ---- preferencias de la visita (no ensucian el progreso del alumno) ---- */
  function velGuardada() {
    try { return parseFloat(sessionStorage.getItem("mf.audioVel")) || 1; } catch (e) { return 1; }
  }
  function guardarVel(v) { try { sessionStorage.setItem("mf.audioVel", String(v)); } catch (e) { /* nada */ } }
  /* La clave sale del ARCHIVO de audio, nunca del id del pergamino: el id es el
     mismo en español e inglés pero las grabaciones duran distinto, así que con
     una clave compartida el cambio de idioma saltaba a un punto no escuchado y
     el XP se cobraba sin oír el pergamino entero (2026-08-26). */
  function claveDe(src) {
    var m = /assets\/audio\/([a-z]{2})\/([^\/?#]+)\.mp3/i.exec(src || "");
    return "mf.audioPos." + (m ? m[1] + "/" + m[2] : encodeURIComponent(src || "?"));
  }
  function posGuardada(clave) {
    try { return parseFloat(sessionStorage.getItem(clave)) || 0; } catch (e) { return 0; }
  }
  function guardarPos(clave, t) {
    try {
      if (t > 1) sessionStorage.setItem(clave, String(Math.floor(t)));
      else sessionStorage.removeItem(clave);
    } catch (e) { /* nada */ }
  }

  /* ---- uno solo suena a la vez, en toda la página ---- */
  var sonando = null;
  function parar() {
    if (!sonando) return;
    guardarPos(sonando.clave, sonando.au.currentTime);   /* el evento pause llega tarde al cerrar */
    sonando.au.pause();
    if (sonando.apagar) sonando.apagar();
    sonando = null;
  }
  window.addEventListener("pagehide", parar);

  /* opts: { src, item, art, xp, kind ("scroll"|"tool"), hecho: fn, alTerminar: fn }
     Devuelve el elemento del reproductor, listo para insertar donde sea. */
  function montar(opts) {
    var xp = opts.xp || 10;
    var yaHecho = typeof opts.hecho === "function" ? opts.hecho : function () { return false; };
    var clave = claveDe(opts.src);
    var player = el('<div class="scroll-audio">' +
      '<button class="scroll-audio__btn" type="button" aria-label="' + T.listen + '">' +
        '<svg class="scroll-audio__play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6.2c0-1 1.1-1.6 2-1.1l8.2 5.3c.8.5.8 1.7 0 2.2L10.5 18c-.9.6-2 0-2-1.1z"/></svg>' +
        '<svg class="scroll-audio__stop" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>' +
      '</button>' +
      '<span class="scroll-audio__text"><span class="scroll-audio__label">' + T.listen + '</span>' +
      '<span class="scroll-audio__meta">' + (yaHecho() ? T.metaHecho : T.meta.replace("{n}", xp)) + "</span></span>" +
      '<span class="scroll-audio__der">' +
        '<button class="scroll-audio__vel" type="button" aria-label="' + T.speed + '"></button>' +
        '<span class="scroll-audio__time" hidden></span></span>' +
      '<div class="scroll-audio__bar" aria-hidden="true"><div class="scroll-audio__fill"></div></div></div>');
    var btn = player.querySelector(".scroll-audio__btn");
    var btnVel = player.querySelector(".scroll-audio__vel");
    var fill = player.querySelector(".scroll-audio__fill");
    var time = player.querySelector(".scroll-audio__time");
    var au = null, reanudar = null;

    var iVel = Math.max(0, VELOCIDADES.indexOf(velGuardada()));
    function pintarVel() {
      var v = VELOCIDADES[iVel];
      var etiqueta = (v === 1 ? "1" : (ES ? String(v).replace(".", ",") : String(v))) + "×";
      btnVel.textContent = etiqueta;
      btnVel.setAttribute("aria-label", T.speed + ": " + etiqueta);
      btnVel.classList.toggle("is-rapido", v !== 1);
    }
    pintarVel();
    btnVel.addEventListener("click", function (e) {
      e.stopPropagation();
      iVel = (iVel + 1) % VELOCIDADES.length;
      pintarVel();
      guardarVel(VELOCIDADES[iVel]);
      if (au) au.playbackRate = VELOCIDADES[iVel];
      if (window.MF) MF.track("audio_speed", { item: opts.item, art: opts.art, data: { speed: VELOCIDADES[iVel] } });
    });

    function icono(playing) {
      player.classList.toggle("is-playing", playing);
      btn.setAttribute("aria-label", playing ? T.stop : T.listen);
    }

    btn.addEventListener("click", function () {
      if (au && !au.paused) { au.pause(); icono(false); if (sonando && sonando.au === au) sonando = null; return; }
      if (!au) {
        au = new Audio(opts.src);
        au.preload = "metadata";
        au.playbackRate = VELOCIDADES[iVel];
        /* se intenta con el evento Y al pulsar play, porque con el MP3 en
           caché los metadatos pueden estar listos antes del escuchador */
        reanudar = function () {
          if (!au.duration) return;
          /* un pergamino ya completado se repasa desde el principio: no hay XP
             en juego y no se puede rebobinar a mano */
          var pos = yaHecho() ? 0 : posGuardada(clave);
          if (pos > 1 && pos < au.duration - 1 && Math.abs(au.currentTime - pos) > 1) au.currentTime = pos;
          time.hidden = false; time.textContent = mmss(au.currentTime) + " / " + mmss(au.duration);
        };
        au.addEventListener("loadedmetadata", reanudar);
        au.addEventListener("pause", function () { guardarPos(clave, au.currentTime); });
        au.addEventListener("timeupdate", function () {
          if (au.duration) fill.style.width = Math.round((au.currentTime / au.duration) * 100) + "%";
          time.textContent = mmss(au.currentTime) + " / " + mmss(au.duration);
        });
        au.addEventListener("ended", function () {
          icono(false);
          if (sonando && sonando.au === au) sonando = null;
          fill.style.width = "100%";
          guardarPos(clave, 0);
          if (window.MF && opts.item && !yaHecho()) {
            MF.scrollRead(opts.art, opts.item, xp, T.listened);
            MF.track("audio_done", { item: opts.item, art: opts.art });
          }
          if (opts.alTerminar) opts.alTerminar();
        });
        au.addEventListener("error", function () {
          icono(false);
          if (sonando && sonando.au === au) sonando = null;
          player.classList.add("is-broken"); btn.disabled = true;
        });
      }
      parar();                              /* nunca dos audios a la vez */
      sonando = { au: au, clave: clave, apagar: function () { icono(false); } };
      if (au.readyState >= 1 && reanudar) reanudar();
      au.play();
      icono(true);
      if (window.MF) MF.track("audio_play", { item: opts.item, art: opts.art });
    });

    return player;
  }

  window.MFAudio = { montar: montar, parar: parar, T: T };
})();

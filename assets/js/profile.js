/* MenteFu / MindFu — página de perfil: rango, XP, racha, cinturones por arte,
   logros, certificados y cuenta. Requiere progress.js, auth.js. */
(function () {
  "use strict";
  var esc = MFDom.esc;   /* dom.js: una sola copia para todos */
  var host = document.querySelector("[data-profile]");
  if (!host || !window.MF) return;
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var T = ES ? {
    student: "Alumno", xp: "XP", streak: "Racha", belts: "Cinturones", missions: "Misiones", toNext: "{n} XP para {rank}", max: "Rango máximo alcanzado",
    achievements: "Logros", certs: "Certificados de cinturón", certNote: "Reconocimiento de progreso personal. No es una certificación profesional.",
    account: "Cuenta", arbolTitulo: "Árbol de progreso", arbolLema: "Tu mente crece con cada logro: ¡decórala con los accesorios que desbloqueas! Puedes ponerlos, quitarlos y moverlos para personalizar tu árbol de progreso.", avatarTitle: "Tu avatar de estudiante", avatarHelp: "Elige la cara con la que entrenas. Puedes cambiarla cuando quieras.", local: "Modo local: tu progreso vive solo en este navegador. Cuando la escuela conecte las cuentas, podrás registrarte para guardarlo en todos tus dispositivos.",
    signedAs: "Conectado como", signOut: "Cerrar sesión", name: "Tu nombre (para los certificados)", save: "Guardar", saved: "Guardado.",
    phone: "Teléfono (opcional)", newPass: "Nueva contraseña (mínimo 8 caracteres)", changePass: "Cambiar contraseña", passChanged: "Contraseña actualizada.",
    noBelts: "Todavía no tienes cinturones. Aprueba el examen de un nivel para conseguir el primero.", belt: "Cinturón", art: "Arte", date: "Fecha", none: "Sin cinturón", outKicker: "Tu entrenamiento",
    outText: "Aquí viven tu rango, tus cinturones, tus logros y tus certificados. Crea tu cuenta gratis o entra para verlos.",
    outLocal: "Ya llevas {n} XP entrenando en este navegador: al entrar se suman a tu cuenta.",
  } : {
    student: "Student", xp: "XP", streak: "Streak", belts: "Belts", missions: "Missions", toNext: "{n} XP to {rank}", max: "Top rank reached",
    achievements: "Achievements", certs: "Belt certificates", certNote: "Recognition of personal progress. Not a professional certification.",
    account: "Account", arbolTitulo: "Progress tree", arbolLema: "Your mind grows with every achievement: decorate it with the accessories you unlock! You can place them, remove them and move them to personalize your progress tree.", avatarTitle: "Your student avatar", avatarHelp: "Pick the face you train with. You can change it whenever you want.", local: "Local mode: your progress lives only in this browser. Once the school connects accounts you will be able to sign up to keep it on all your devices.",
    signedAs: "Signed in as", signOut: "Sign out", name: "Your name (for certificates)", save: "Save", saved: "Saved.",
    phone: "Phone (optional)", newPass: "New password (at least 8 characters)", changePass: "Change password", passChanged: "Password updated.",
    noBelts: "No belts yet. Pass a level exam to earn your first one.", belt: "Belt", art: "Art", date: "Date", none: "No belt", outKicker: "Your training",
    outText: "Your rank, belts, achievements and certificates live here. Create your free account or sign in to see them.",
    outLocal: "You already have {n} XP from training in this browser: signing in adds them to your account.",
  };
  var ARTS = cfg.arts || [];

  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString(ES ? "es" : "en", { year: "numeric", month: "long", day: "numeric" }); } catch (e) { return iso; } }

  /* Una vista O la otra, nunca las dos: con sesión, el perfil completo; sin
     ella, sólo la caja de entrada. Mostrar las dos a la vez era justo lo que
     hacía imposible saber si estabas dentro. */
  var pintado = null;
  function render() {
    pintado = MF.session();
    if (pintado === "out") return renderOut();
    return renderIn();
  }

  /* Sin sesión no hay expediente que enseñar, solo la invitación: el formulario
     de entrada vive en el modal de auth.js y se abre desde estos botones
     (titular 2026-08-26). */
  function renderOut() {
    var xp = MF.totalXP();
    var mascota = MF.artImg("avatar", "1", "gate__mascot");
    host.innerHTML = '<section class="gate gate--profile">'
      + (mascota ? '<div class="gate__art gate__art--mascot" aria-hidden="true">' + mascota + "</div>" : "")
      + '<p class="kicker">' + T.outKicker + "</p>"
      + '<p class="gate__text">' + T.outText + "</p>"
      + '<p class="gate__acciones">'
      + '<button class="btn btn--primary" type="button" data-abrir="signup">' + esc(MFAuth.T.tabSignup) + "</button>"
      + '<button class="btn btn--ghost" type="button" data-abrir="login">' + esc(MFAuth.T.tabLogin) + "</button></p>"
      + (xp > 0 ? '<p class="form__note">' + T.outLocal.replace("{n}", xp) + "</p>" : "")
      + "</section>";
    host.querySelectorAll("[data-abrir]").forEach(function (b) {
      b.addEventListener("click", function () {
        MFAuth.abrirModal({ modo: b.getAttribute("data-abrir"), alEntrar: function () {
          /* al entrar traemos el progreso de la cuenta antes de pintar el perfil */
          MFAuth.irArriba();
          MFAuth.pull().then(render, render);
        } });
      });
    });
  }

  function renderIn() {
    var s = MF.state(), xp = MF.totalXP(), r = MF.rank(xp);
    var beltsTotal = 0, missionsTotal = 0;
    for (var k in s.arts) { beltsTotal += Object.keys(s.arts[k].belts || {}).length; missionsTotal += Object.keys(s.arts[k].missions || {}).length; }
    var html = '<section class="profile__hero profile__hero--filas"><div class="profile__ring" style="--pct:' + r.pct + '"><span>' + r.pct + '%</span></div>'
      + '<div class="profile__id"><p class="kicker" style="color:var(--c-accent-soft)">' + T.student + (s.name ? " · " + esc(s.name) : "") + '</p><h2 class="profile__rank">' + esc(r.name) + '</h2><p class="profile__sub">' + (r.next ? T.toNext.replace("{n}", r.nextAt - xp).replace("{rank}", r.next) : T.max) + "</p></div>"
      + '<div class="profile__stats"><span class="profile__stat"><b>' + xp + "</b>" + T.xp + '</span><span class="profile__stat"><b>' + (s.streak.days || 0) + "🔥</b>" + T.streak + '</span><span class="profile__stat"><b>' + beltsTotal + "</b>" + T.belts + '</span><span class="profile__stat"><b>' + missionsTotal + "</b>" + T.missions + "</span>"
      + "</div></section>"
      /* Los accesos van en SU caja, aparte del progreso (titular 2026-09-04):
         cuatro y cuatro, que mezclados en una sola fila se leían confusos. «Mis
         artes» abre el modal con los cursos empezados (misartes.js). */
      + '<section class="profile__accesos">'
      + '<a class="profile__acceso" href="' + (cfg.prefix || "") + (ES ? "escuela/" : "school/") + '"><b>🎓</b>' + (ES ? "Mi escuela" : "My school") + "</a>"
      + '<button type="button" class="profile__acceso" data-maestros><b>🥋</b>' + (ES ? "Maestros Fu" : "Fu masters") + "</button>"
      + '<button type="button" class="profile__acceso" data-examenes><b>🏮</b>' + (ES ? "Mis exámenes" : "My exams") + "</button>"
      + '<button type="button" class="profile__acceso" data-misartes><b>🗺️</b>' + (ES ? "Mis artes" : "My arts") + "</button>"
      + "</section>";

    /* Árbol Cerebro: el avatar-planta que crece con el rango y se decora con
       los trofeos de los entrenamientos (arbol.js) */
    html += '<section class="profile__section profile__section--arbol"><h2 class="visually-hidden">' + T.arbolTitulo + '</h2>'
          + '<p class="arbol__leyenda">' + T.arbolLema + '</p>'
          + '<div class="arbol"><div class="arbol__lienzo" data-arbol></div><div class="arbol__cofre" data-arbol-cofre></div></div></section>';

    /* La sección «Tus artes» salió del perfil (titular 2026-09-04): los cursos
       empezados viven en el modal «Mis artes», y su avance se ve al entrar. */

    /* logros */
    html += '<section class="profile__section"><h2>' + T.achievements + " (" + Object.keys(s.achievements).length + "/" + MF.achievements.length + ')</h2><ul class="badges">';
    MF.achievements.forEach(function (a) {
      var got = s.achievements[a.key];
      var txt = ES ? a.es : a.en;
      var badgeArt = MF.artImg("badge", a.key, "badge__art");
      html += '<li class="badge' + (got ? "" : " badge--locked") + '" title="' + esc(txt[1]) + '"><span class="badge__icon" aria-hidden="true">' + (badgeArt || a.icon) + '</span><span class="badge__name">' + esc(txt[0]) + "</span><span>" + esc(txt[1]) + "</span></li>";
    });
    html += "</ul></section>";


    /* certificados */
    html += '<section class="profile__section"><h2>' + T.certs + "</h2>";
    var certs = [];
    ARTS.forEach(function (a) { var st = MF.art(a.key); for (var n in st.belts) certs.push({ art: a, n: parseInt(n, 10), at: st.belts[n] }); });
    if (!certs.length) html += '<p class="muted">' + T.noBelts + "</p>";
    else {
      html += '<div class="certs">';
      certs.sort(function (x, y) { return y.n - x.n; }).forEach(function (c) {
        var b = MF.beltInfo(c.n);
        html += '<div class="cert" style="--belt:' + b.color + '"><span class="cert__kicker">' + esc(ES ? "MenteFu" : "MindFu") + " · " + esc(c.art.name) + '</span><p class="cert__title">' + (ES ? "Cinturón " + b.name.toLowerCase() : b.name + " belt") + "</p>"
          + "<p>" + (s.name ? esc(s.name) + " · " : "") + fmtDate(c.at) + "</p>" + MF.beltPill(c.n) + '<p class="cert__note">' + T.certNote + "</p></div>";
      });
      html += "</div>";
    }
    html += "</section>";

    /* cuenta */
    /* sin botón de reinicio: reiniciar el avance es potestad del panel de
       administración (decisión 2026-08-25) */
    html += '<section class="profile__section"><h2>' + T.account + '</h2><div class="account" data-account></div></section>';
    host.innerHTML = html;
    renderAccount(host.querySelector("[data-account]"));
    if (window.MFArbol) {
      MFArbol.montar(host.querySelector("[data-arbol]"), host.querySelector("[data-arbol-cofre]"));
      MFArbol.mini();
    }
  }

  function nameForm(phone) {
    var s = MF.state();
    return '<form class="account__row" data-name-form><label for="pf-name">' + T.name + '</label><input id="pf-name" class="input" type="text" maxlength="60" value="' + esc(s.name || "") + '">'
      + '<label class="visually-hidden" for="pf-phone">' + T.phone + '</label><input id="pf-phone" class="input" type="tel" maxlength="24" placeholder="' + T.phone.toLowerCase() + '" value="' + esc(phone || "") + '">'
      + '<button class="btn btn--ghost btn--sm" type="submit">' + T.save + '</button><span class="form__feedback" role="status"></span></form>';
  }
  function bindName(box, u) {
    var f = box.querySelector("[data-name-form]");
    if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = f.querySelector("#pf-name").value.trim();
      var phone = f.querySelector("#pf-phone") ? f.querySelector("#pf-phone").value.trim() : "";
      MF.state().name = name; MF.save();
      if (u && window.SB && SB.enabled()) {
        SB.upsert("profiles", { id: u.id, display_name: name, phone: phone }, "id").catch(function () {});
        SB.updateUser({ data: { name: name, phone: phone } }).catch(function () {});
      }
      f.querySelector(".form__feedback").textContent = T.saved;
    });
  }
  function passForm(box) {
    var f = box.querySelector("[data-pass-form]");
    if (!f) return;
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var p = f.querySelector("input").value;
      var out = f.querySelector(".form__feedback");
      if (p.length < 8) { out.textContent = T.newPass; return; }
      SB.updateUser({ password: p }).then(function () { out.textContent = T.passChanged; f.reset(); }).catch(function () { out.textContent = "…"; });
    });
  }

  function renderAccount(box) {
    if (!window.SB || !SB.enabled()) { box.innerHTML = "<p class='muted'>" + T.local + "</p>" + nameForm(""); bindName(box, null); return; }
    /* Aquí sólo se llega con sesión (render() ya separó los dos casos); si aun
       así el servidor dice que no hay usuario, se corrige y se repinta. */
    MFAuth.user().then(function (u) {
      if (!u) return render();
      var meta = u.user_metadata || {};
      box.innerHTML = '<div class="account__row"><span>' + T.signedAs + ' <span class="account__email">' + esc(u.email || "") + '</span></span><button class="btn btn--ghost btn--sm" type="button" data-signout>' + T.signOut + "</button></div>" + nameForm(meta.phone || "")
        + '<form class="account__row" data-pass-form><label class="visually-hidden" for="pf-pass">' + T.newPass + '</label><input id="pf-pass" class="input" type="password" minlength="8" placeholder="' + T.newPass.toLowerCase() + '" autocomplete="new-password"><button class="btn btn--ghost btn--sm" type="submit">' + T.changePass + '</button><span class="form__feedback" role="status"></span></form>';
      bindName(box, u); passForm(box);
      box.querySelector("[data-signout]").addEventListener("click", function () { MFAuth.signOut().then(render); });
    });
  }

  render();
  /* auth.js confirma la sesión contra el servidor después del primer pintado:
     si el veredicto cambia, se cambia de vista (y sólo entonces). */
  MF.onChange(function () { if (MF.session() !== pintado) render(); });
  /* «Mis artes» (reiniciar o salir de un curso) cambia el expediente que el
     hero y los certificados enseñan: se repinta entero. No se repinta en cada
     save() porque el árbol guarda al mover adornos y perdería su lienzo. */
  document.addEventListener("mf:expediente", function () { if (MF.session() === pintado) render(); });
})();

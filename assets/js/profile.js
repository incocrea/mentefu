/* MenteFu / MyselfU — página de perfil: rango, XP, racha, cinturones por arte,
   logros, certificados y cuenta. Requiere progress.js, auth.js. */
(function () {
  "use strict";
  var host = document.querySelector("[data-profile]");
  if (!host || !window.MF) return;
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var T = ES ? {
    student: "Alumno", xp: "XP", streak: "Racha", belts: "Cinturones", missions: "Misiones", toNext: "{n} XP para {rank}", max: "Rango máximo alcanzado",
    arts: "Tus artes", achievements: "Logros", certs: "Certificados de cinturón", certNote: "Reconocimiento de progreso personal. No es una certificación profesional.",
    account: "Cuenta", avatarTitle: "Tu avatar de estudiante", avatarHelp: "Elige la cara con la que entrenas. Puedes cambiarla cuando quieras.", local: "Modo local: tu progreso vive solo en este navegador. Cuando la escuela conecte las cuentas, podrás registrarte para guardarlo en todos tus dispositivos.",
    signedAs: "Conectado como", signOut: "Cerrar sesión", name: "Tu nombre (para los certificados)", save: "Guardar", saved: "Guardado.",
    login: "Crea tu cuenta o inicia sesión para guardar tu progreso en todos tus dispositivos.",
    phone: "Teléfono (opcional)", newPass: "Nueva contraseña (mínimo 8 caracteres)", changePass: "Cambiar contraseña", passChanged: "Contraseña actualizada.",
    reset: "Reiniciar progreso local", resetConfirm: "¿Borrar todo tu progreso de este navegador? Si tienes cuenta, el progreso guardado en ella no se borra.",
    noBelts: "Todavía no tienes cinturones. Aprueba el examen de un nivel para conseguir el primero.", belt: "Cinturón", art: "Arte", date: "Fecha", none: "Sin cinturón",
  } : {
    student: "Student", xp: "XP", streak: "Streak", belts: "Belts", missions: "Missions", toNext: "{n} XP to {rank}", max: "Top rank reached",
    arts: "Your arts", achievements: "Achievements", certs: "Belt certificates", certNote: "Recognition of personal progress. Not a professional certification.",
    account: "Account", avatarTitle: "Your student avatar", avatarHelp: "Pick the face you train with. You can change it whenever you want.", local: "Local mode: your progress lives only in this browser. Once the school connects accounts you will be able to sign up to keep it on all your devices.",
    signedAs: "Signed in as", signOut: "Sign out", name: "Your name (for certificates)", save: "Save", saved: "Saved.",
    login: "Create your account or sign in to keep your progress on all your devices.",
    phone: "Phone (optional)", newPass: "New password (at least 8 characters)", changePass: "Change password", passChanged: "Password updated.",
    reset: "Reset local progress", resetConfirm: "Delete all your progress in this browser? If you have an account, the progress stored there is not deleted.",
    noBelts: "No belts yet. Pass a level exam to earn your first one.", belt: "Belt", art: "Art", date: "Date", none: "No belt",
  };
  var ARTS = cfg.arts || [];

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fmtDate(iso) { try { return new Date(iso).toLocaleDateString(ES ? "es" : "en", { year: "numeric", month: "long", day: "numeric" }); } catch (e) { return iso; } }

  function render() {
    var s = MF.state(), xp = MF.totalXP(), r = MF.rank(xp);
    var beltsTotal = 0, missionsTotal = 0;
    for (var k in s.arts) { beltsTotal += Object.keys(s.arts[k].belts || {}).length; missionsTotal += Object.keys(s.arts[k].missions || {}).length; }
    var html = '<section class="profile__hero"><div class="profile__ring" style="--pct:' + r.pct + '"><span>' + r.pct + '%</span></div>'
      + '<div><p class="kicker" style="color:var(--c-accent-soft)">' + T.student + (s.name ? " · " + esc(s.name) : "") + '</p><h2 class="profile__rank">' + esc(r.name) + '</h2><p class="profile__sub">' + (r.next ? T.toNext.replace("{n}", r.nextAt - xp).replace("{rank}", r.next) : T.max) + "</p></div>"
      + '<div class="profile__stats"><span class="profile__stat"><b>' + xp + "</b>" + T.xp + '</span><span class="profile__stat"><b>' + (s.streak.days || 0) + "🔥</b>" + T.streak + '</span><span class="profile__stat"><b>' + beltsTotal + "</b>" + T.belts + '</span><span class="profile__stat"><b>' + missionsTotal + "</b>" + T.missions + "</span></div></section>";

    /* artes */
    html += '<section class="profile__section"><h2>' + T.arts + '</h2><div class="profile__arts">';
    ARTS.forEach(function (a) {
      var n = MF.beltOf(a.key), st = MF.art(a.key);
      var artIcon = MF.artImg("art", a.key, "profile__art-icon");
      html += '<a class="profile__art" href="' + a.url + '" style="--art:' + a.color + '"><span style="font-size:1.6rem" aria-hidden="true">' + (artIcon || a.icon || "🥋") + '</span><span><b>' + esc(a.name) + "</b><small>" + Object.keys(st.missions).length + " " + T.missions.toLowerCase() + " · " + MF.artXP(a.key) + " XP</small></span>" + MF.beltPill(n, true) + "</a>";
    });
    html += "</div></section>";

    /* logros */
    html += '<section class="profile__section"><h2>' + T.achievements + " (" + Object.keys(s.achievements).length + "/" + MF.achievements.length + ')</h2><ul class="badges">';
    MF.achievements.forEach(function (a) {
      var got = s.achievements[a.key];
      var txt = ES ? a.es : a.en;
      var badgeArt = MF.artImg("badge", a.key, "badge__art");
      html += '<li class="badge' + (got ? "" : " badge--locked") + '" title="' + esc(txt[1]) + '"><span class="badge__icon" aria-hidden="true">' + (badgeArt || a.icon) + '</span><span class="badge__name">' + esc(txt[0]) + "</span><span>" + esc(txt[1]) + "</span></li>";
    });
    html += "</ul></section>";

    /* avatar */
    var avs = MF.avatars();
    if (avs.length) {
      html += '<section class="profile__section"><h2>' + T.avatarTitle + '</h2><p class="muted">' + T.avatarHelp + '</p><ul class="avatars">';
      avs.forEach(function (a) {
        var sel = String(s.avatar) === String(a.key);
        html += '<li><button class="avatar' + (sel ? " is-selected" : "") + '" type="button" data-avatar="' + esc(a.key) + '" aria-pressed="' + sel + '">'
              + '<img src="' + esc(a.src) + '" alt="Avatar ' + esc(a.key) + '" loading="lazy"></button></li>';
      });
      html += "</ul></section>";
    }

    /* certificados */
    html += '<section class="profile__section"><h2>' + T.certs + "</h2>";
    var certs = [];
    ARTS.forEach(function (a) { var st = MF.art(a.key); for (var n in st.belts) certs.push({ art: a, n: parseInt(n, 10), at: st.belts[n] }); });
    if (!certs.length) html += '<p class="muted">' + T.noBelts + "</p>";
    else {
      html += '<div class="certs">';
      certs.sort(function (x, y) { return y.n - x.n; }).forEach(function (c) {
        var b = MF.beltInfo(c.n);
        html += '<div class="cert" style="--belt:' + b.color + '"><span class="cert__kicker">' + esc(cfg.brand === "mentefu" ? "MenteFu" : "MyselfU") + " · " + esc(c.art.name) + '</span><p class="cert__title">' + (ES ? "Cinturón " + b.name.toLowerCase() : b.name + " belt") + "</p>"
          + "<p>" + (s.name ? esc(s.name) + " · " : "") + fmtDate(c.at) + "</p>" + MF.beltPill(c.n) + '<p class="cert__note">' + T.certNote + "</p></div>";
      });
      html += "</div>";
    }
    html += "</section>";

    /* cuenta */
    html += '<section class="profile__section"><h2>' + T.account + '</h2><div class="account" data-account></div>'
      + '<p style="margin:1rem 0 0"><button class="btn btn--ghost btn--sm" type="button" data-reset>' + T.reset + "</button></p></section>";
    host.innerHTML = html;
    renderAccount(host.querySelector("[data-account]"));
    host.querySelectorAll("[data-avatar]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-avatar");
        MF.state().avatar = (String(MF.state().avatar) === k) ? "" : k;
        MF.save(); MF.paint();
        if (window.SB && SB.enabled()) MFAuth.user().then(function (u) {
          if (u) SB.upsert("profiles", { id: u.id, avatar: MF.state().avatar }, "id").catch(function () {});
        });
        render();
      });
    });
    host.querySelector("[data-reset]").addEventListener("click", function () { if (window.confirm(T.resetConfirm)) { MF.reset(); render(); } });
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
    MFAuth.user().then(function (u) {
      if (u) {
        var meta = u.user_metadata || {};
        box.innerHTML = '<div class="account__row"><span>' + T.signedAs + ' <span class="account__email">' + esc(u.email || "") + '</span></span><button class="btn btn--ghost btn--sm" type="button" data-signout>' + T.signOut + "</button></div>" + nameForm(meta.phone || "")
          + '<form class="account__row" data-pass-form><label class="visually-hidden" for="pf-pass">' + T.newPass + '</label><input id="pf-pass" class="input" type="password" minlength="8" placeholder="' + T.newPass.toLowerCase() + '" autocomplete="new-password"><button class="btn btn--ghost btn--sm" type="submit">' + T.changePass + '</button><span class="form__feedback" role="status"></span></form>';
        bindName(box, u); passForm(box);
        box.querySelector("[data-signout]").addEventListener("click", function () { MFAuth.signOut().then(function () { box.__built = false; renderAccount(box); }); });
      } else {
        box.innerHTML = "<p>" + T.login + '</p><div data-auth-ui></div>' + nameForm("");
        MFAuth.renderAuthUI(box.querySelector("[data-auth-ui]"), function () { window.location.reload(); });
        bindName(box, null);
      }
    });
  }

  render();
  MF.onChange(function () { /* re-render ligero al cambiar el estado desde otra parte */ });
})();

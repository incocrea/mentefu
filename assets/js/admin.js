/* MenteFu / MindFu — panel de administración de alumnos (super admin único).
   Corre en todas las páginas: revela la entrada «Admin» del menú cuando la
   sesión es la del super admin, y en /admin/ pinta la tabla de usuarios con
   sus acciones. TODO el poder real vive en las RPC de supabase/admin.sql, que
   verifican el email del JWT en el servidor: este archivo es solo interfaz. */
(function () {
  "use strict";
  var el = MFDom.el, esc = MFDom.esc;   /* dom.js: una sola copia para todos */
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  if (!window.SB || !SB.enabled()) return;
  var T = ES ? {
    title: "Alumnos", denied: "Esta sala es solo para la administración de la escuela.",
    rolCol: "Rol", rolDar: "Hacer Maestro Fu", rolQuitar: "Quitar Maestro Fu",
    rolConfirmDar: "¿Hacer Maestro Fu a {e}? Podrá fundar hasta 50 cursos y publicarlos en el directorio.",
    rolConfirmQuitar: "¿Quitar Maestro Fu a {e}? Vuelve al regalo de la cuenta: 1 curso privado.",
    okRol: "Rol cambiado", roles: { student: "alumno", master: "Maestro Fu", superadmin: "admin" },
    cols: { name: "Nombre", email: "Email", phone: "Teléfono", country: "País", created: "Registro", seen: "Último acceso" },
    actions: "Acciones", reset: "Reiniciar", edit: "Editar", pass: "Cambiar clave", del: "Eliminar",
    resetConfirm: "¿Reiniciar TODO el avance de {e}? Quedará a cero (XP, cinturones, logros, reflexiones) en todos sus dispositivos al recargar. No se puede deshacer.",
    delConfirm: "¿Eliminar la cuenta de {e}? Se borran la cuenta y todo su avance. No se puede deshacer.",
    editTitle: "Editar datos de {e}", passTitle: "Nueva clave para {e}",
    nameLbl: "Nombre", phoneLbl: "Teléfono", countryLbl: "País", passLbl: "Nueva contraseña (mínimo 8 caracteres)",
    save: "Guardar", cancel: "Cancelar", confirm: "Confirmar", generate: "Generar",
    okReset: "Avance reiniciado.", okEdit: "Datos guardados.", okPass: "Clave cambiada.", okDel: "Cuenta eliminada.",
    never: "nunca", err: "No se pudo: {m}", empty: "No hay alumnos todavía.", passCopy: "Cópiala antes de guardar: no se vuelve a mostrar.",
  } : {
    title: "Students", denied: "This room is for school administration only.",
    rolCol: "Role", rolDar: "Make Fu Master", rolQuitar: "Remove Fu Master",
    rolConfirmDar: "Make {e} a Fu Master? They will be able to found up to 50 courses and publish them to the directory.",
    rolConfirmQuitar: "Remove Fu Master from {e}? Back to the account gift: 1 private course.",
    okRol: "Role changed", roles: { student: "student", master: "Fu Master", superadmin: "admin" },
    cols: { name: "Name", email: "Email", phone: "Phone", country: "Country", created: "Signed up", seen: "Last seen" },
    actions: "Actions", reset: "Reset", edit: "Edit", pass: "Change password", del: "Delete",
    resetConfirm: "Reset ALL progress for {e}? XP, belts, achievements and reflections will be zero on every device after reload. This cannot be undone.",
    delConfirm: "Delete the account of {e}? The account and all its progress will be erased. This cannot be undone.",
    editTitle: "Edit data of {e}", passTitle: "New password for {e}",
    nameLbl: "Name", phoneLbl: "Phone", countryLbl: "Country", passLbl: "New password (at least 8 characters)",
    save: "Save", cancel: "Cancel", confirm: "Confirm", generate: "Generate",
    okReset: "Progress reset.", okEdit: "Data saved.", okPass: "Password changed.", okDel: "Account deleted.",
    never: "never", err: "Failed: {m}", empty: "No students yet.", passCopy: "Copy it before saving: it will not be shown again.",
  };

  /* acción como icono con tooltip (decisión 2026-08-25: iconos, no botones) */
  function iconBtn(accion, etiqueta, dibujo, peligro) {
    return '<button class="icon-btn' + (peligro ? " icon-btn--danger" : "") + '" type="button" data-a="' + accion + '" data-tip="' + etiqueta + '" aria-label="' + etiqueta + '">'
      + '<svg viewBox="0 0 24 24" aria-hidden="true">' + dibujo + "</svg></button>";
  }
  function aviso(msg, icon) { if (window.MF && MF.toast) MF.toast("xp", msg, "", icon || "🛡️"); else window.alert(msg); }
  function fecha(iso) { if (!iso) return T.never; try { return new Date(iso).toLocaleDateString(ES ? "es" : "en", { year: "2-digit", month: "short", day: "numeric" }); } catch (e) { return iso; } }

  /* ---------- ¿soy el super admin? ---------- */
  function revelar() {
    /* data-admin-on, no data-admin: ese selector es el del panel */
    document.documentElement.setAttribute("data-admin-on", "1");
    document.querySelectorAll("[data-admin-link]").forEach(function (li) { li.hidden = false; });
  }
  /* La clave lleva versión a propósito: al subir esta línea, los «no» que las
     pestañas abiertas tengan guardados de la época en que se cacheaban los
     fallos se quedan huérfanos y la comprobación se rehace limpia. */
  var CLAVE = "mf.admin2";
  try { sessionStorage.removeItem("mf.admin"); } catch (e) { /* nada */ }

  function comprobar() {
    var visto = null;
    try { visto = sessionStorage.getItem(CLAVE); } catch (e) { /* nada */ }
    if (visto === "1") revelar();          /* sin parpadeo entre páginas */
    if (visto !== null && !document.querySelector("[data-admin]")) return Promise.resolve(visto === "1");
    /* getSession() renueva un access token caducado antes de preguntar; sin
       esto, la RPC devolvía 401 con sesión válida y se cacheaba un «no» */
    var comprobado = SB.hasSession()
      ? SB.getSession().then(function (s) {
          /* null, NO false: «no pude preguntar» y «me dijeron que no» son cosas
             distintas y hasta ahora se guardaban igual. */
          if (!s) return null;
          return SB.rpc("admin_is").then(function (si) { return si === true; }).catch(function () { return null; });
        })
      : Promise.resolve(null);
    return comprobado.then(function (si) {
      /* SOLO SE GUARDA UNA RESPUESTA CIERTA. Antes, un fallo de red, un 500 o
         una RPC caída un instante —por ejemplo mientras se aplica una migración
         en Supabase— se guardaban como «no eres admin», y como sessionStorage
         dura toda la vida de la pestaña y el atajo de arriba corta la
         comprobación, el enlace de Admin desaparecía hasta cerrar la pestaña.
         Esto es lo que hacía desaparecer el menú (dos veces, dijo el titular).
         Sin cachear el fallo, la siguiente página lo vuelve a preguntar.
         No hay riesgo en reintentar: revelar() es cosmético y toda la autoridad
         vive en las RPC `SECURITY DEFINER` de supabase/admin.sql. */
      if (si !== null) { try { sessionStorage.setItem(CLAVE, si ? "1" : "0"); } catch (e) { /* nada */ } }
      if (si) revelar();
      return si === true;
    });
  }

  /* ---------- países (mismo criterio que el registro) ---------- */
  function paises() {
    /* la MISMA lista del registro (auth.js la exporta): una lista propia más
       corta hacía que el select vaciara en silencio países válidos al editar */
    var codigos = (window.MFAuth && MFAuth.countryCodes) || [];
    var primero = (window.MFAuth && MFAuth.countryFirst) || ["CO", "US", "MX"];
    var lista = [];
    try {
      var dn = new Intl.DisplayNames([ES ? "es" : "en"], { type: "region" });
      lista = codigos.map(function (c) { var n; try { n = dn.of(c); } catch (e) { n = c; } return { c: c, n: n || c }; })
        .sort(function (a, b) { return a.n.localeCompare(b.n, ES ? "es" : "en"); });
    } catch (e) { /* navegador sin Intl.DisplayNames: campo de texto */ }
    return primero.map(function (c) { return lista.find(function (x) { return x.c === c; }); }).filter(Boolean)
      .concat(lista.filter(function (x) { return primero.indexOf(x.c) === -1; }));
  }
  function nombrePais(code) {
    if (!code) return "";
    try { return new Intl.DisplayNames([ES ? "es" : "en"], { type: "region" }).of(code) || code; } catch (e) { return code; }
  }

  /* ---------- modal ---------- */
  function modal(titulo, cuerpoHtml, onOpen) {
    var m = el('<div class="modal" role="dialog" aria-modal="true"><div class="modal__panel modal__panel--admin">'
      + '<header class="modal__head"><h2 class="modal__title"></h2><button class="modal__close" type="button" aria-label="×">&times;</button></header>'
      + '<div class="modal__body"></div></div></div>');
    m.querySelector(".modal__title").textContent = titulo;
    m.querySelector(".modal__body").innerHTML = cuerpoHtml;
    function cerrar() { m.remove(); document.removeEventListener("keydown", tecla); }
    function tecla(e) { if (e.key === "Escape") cerrar(); }
    m.addEventListener("click", function (e) { if (e.target === m) cerrar(); });
    m.querySelector(".modal__close").addEventListener("click", cerrar);
    document.addEventListener("keydown", tecla);
    document.body.appendChild(m);
    if (onOpen) onOpen(m, cerrar);
    return m;
  }
  function confirmar(texto, onSi) {
    modal(T.confirm, '<p>' + esc(texto) + '</p><div class="modal__actions"><button class="btn btn--primary" type="button" data-si></button><button class="btn btn--ghost" type="button" data-no></button></div>',
      function (m, cerrar) {
        m.querySelector("[data-si]").textContent = T.confirm;
        m.querySelector("[data-no]").textContent = T.cancel;
        m.querySelector("[data-no]").addEventListener("click", cerrar);
        m.querySelector("[data-si]").addEventListener("click", function () { this.disabled = true; onSi(cerrar, this); });
      });
  }

  /* ---------- panel ---------- */
  function pintar(host) {
    SB.rpc("admin_list_users").then(function (rows) {
      rows = rows || [];
      var html = '<div class="admin"><h2 class="admin__title">' + T.title + ' <span class="admin__count">' + rows.length + "</span></h2>";
      if (!rows.length) html += '<p class="muted">' + T.empty + "</p>";
      else {
        html += '<div class="admin__scroll"><table class="admin-table"><thead><tr>'
          + ["name", "email", "phone", "country", "created", "seen"].map(function (k) { return "<th>" + T.cols[k] + "</th>"; }).join("")
          + "<th>" + T.rolCol + "</th>"
          + "<th>" + T.actions + "</th></tr></thead><tbody></tbody></table></div>";
      }
      html += "</div>";
      host.innerHTML = html;
      var tbody = host.querySelector("tbody");
      if (tbody) {
        /* las filas van por innerHTML del tbody (un <tr> suelto en un div se
           descarta) y las acciones por delegación con el índice de la fila */
        tbody.innerHTML = rows.map(function (u, i) {
          return "<tr data-i=\"" + i + "\">"
            + '<td data-th="' + T.cols.name + '">' + esc(u.name) + "</td>"
            + '<td data-th="' + T.cols.email + '" class="admin-table__email">' + esc(u.email) + "</td>"
            + '<td data-th="' + T.cols.phone + '">' + esc(u.phone) + "</td>"
            + '<td data-th="' + T.cols.country + '">' + esc(nombrePais(u.country)) + "</td>"
            + '<td data-th="' + T.cols.created + '">' + fecha(u.created_at) + "</td>"
            + '<td data-th="' + T.cols.seen + '">' + fecha(u.last_sign_in_at) + "</td>"
            + '<td data-th="' + T.rolCol + '"><span class="admin-rol admin-rol--' + esc(u.role || "student") + '">' + esc(T.roles[u.role] || u.role || "") + "</span></td>"
            + '<td class="admin-table__actions">'
            + iconBtn("reset", T.reset, '<path d="M4 10a8 8 0 1 1 2.3 6.3M4 10V4m0 6h6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>')
            + iconBtn("edit", T.edit, '<path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 7l3 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>')
            + iconBtn("pass", T.pass, '<circle cx="8" cy="12" r="3.6" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M11.6 12H21m-3 0v3.4M14.5 12v2.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>')
            + (u.role === "superadmin" ? "" : iconBtn("rol", u.role === "master" ? T.rolQuitar : T.rolDar,
                '<path d="M12 3.5l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.5l-5.1 2.7 1-5.7-4.1-4 5.7-.8z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>'))
            + iconBtn("del", T.del, '<path d="M4.5 7h15M9.5 7V4.8h5V7m-8 0l.8 12.4h9.4L17.5 7M10 10.5v5.5m4-5.5v5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>', true)
            + "</td></tr>";
        }).join("");
        tbody.addEventListener("click", function (e) {
          var b = e.target.closest && e.target.closest("[data-a]");
          if (!b) return;
          var u = rows[+b.closest("tr").getAttribute("data-i")];
          if (!u) return;
          if (b.getAttribute("data-a") === "reset") accionReset(u, host);
          else if (b.getAttribute("data-a") === "edit") accionEditar(u, host);
          else if (b.getAttribute("data-a") === "pass") accionClave(u);
          else if (b.getAttribute("data-a") === "rol") accionRol(u, host);
          else accionEliminar(u, host);
        });
      }
    }).catch(function (e) {
      host.innerHTML = '<p class="muted">' + esc(T.err.replace("{m}", (e && e.message) || "?")) + "</p>";
    });
  }

  function fallo(e) { aviso(T.err.replace("{m}", (e && e.message) || "?"), "⚠️"); }

  function accionReset(u, host) {
    confirmar(T.resetConfirm.replace("{e}", u.email), function (cerrar) {
      SB.rpc("admin_reset_user", { uid: u.id }).then(function () { cerrar(); aviso(T.okReset); pintar(host); }).catch(function (e) { cerrar(); fallo(e); });
    });
  }
  /* Dar o quitar Maestro Fu. La RPC escuela_set_role existía desde f6 y solo
     se podía usar desde SQL (radiografía 2026-09-04); solo admite student y
     master, así que al superadmin ni se le ofrece el botón. */
  function accionRol(u, host) {
    var aMaster = u.role !== "master";
    confirmar((aMaster ? T.rolConfirmDar : T.rolConfirmQuitar).replace("{e}", u.email), function (cerrar) {
      SB.rpc("escuela_set_role", { p_uid: u.id, p_role: aMaster ? "master" : "student" })
        .then(function () { cerrar(); aviso(T.okRol, "🥋"); pintar(host); })
        .catch(function (e) { cerrar(); fallo(e); });
    });
  }
  function accionEliminar(u, host) {
    confirmar(T.delConfirm.replace("{e}", u.email), function (cerrar) {
      SB.rpc("admin_delete_user", { uid: u.id }).then(function () { cerrar(); aviso(T.okDel); pintar(host); }).catch(function (e) { cerrar(); fallo(e); });
    });
  }
  function accionEditar(u, host) {
    var lista = paises();
    var opciones = lista.map(function (p) { return '<option value="' + p.c + '"' + (p.c === u.country ? " selected" : "") + ">" + esc(p.n) + "</option>"; }).join("");
    var campoPais = lista.length
      ? '<select class="input" data-f="country"><option value=""></option>' + opciones + "</select>"
      : '<input class="input" data-f="country" value="' + esc(u.country) + '">';
    modal(T.editTitle.replace("{e}", u.email),
      '<label class="form__label">' + T.nameLbl + '<input class="input" data-f="name" value="' + esc(u.name) + '"></label>'
      + '<label class="form__label">' + T.phoneLbl + '<input class="input" data-f="phone" value="' + esc(u.phone) + '"></label>'
      + '<label class="form__label">' + T.countryLbl + campoPais + "</label>"
      + '<div class="modal__actions"><button class="btn btn--primary" type="button" data-guardar>' + T.save + '</button><button class="btn btn--ghost" type="button" data-no>' + T.cancel + "</button></div>",
      function (m, cerrar) {
        m.querySelector("[data-no]").addEventListener("click", cerrar);
        m.querySelector("[data-guardar]").addEventListener("click", function () {
          this.disabled = true;
          SB.rpc("admin_update_user", {
            uid: u.id,
            new_name: m.querySelector('[data-f="name"]').value.trim(),
            new_phone: m.querySelector('[data-f="phone"]').value.trim(),
            new_country: m.querySelector('[data-f="country"]').value.trim(),
          }).then(function () { cerrar(); aviso(T.okEdit); pintar(host); }).catch(function (e) { cerrar(); fallo(e); });
        });
      });
  }
  function accionClave(u) {
    modal(T.passTitle.replace("{e}", u.email),
      '<label class="form__label">' + T.passLbl + '<span class="admin__passrow"><input class="input" data-f="pass" type="text" autocomplete="off" spellcheck="false">'
      + '<button class="btn btn--ghost btn--sm" type="button" data-gen>' + T.generate + "</button></span></label>"
      + '<p class="form__note">' + T.passCopy + "</p>"
      + '<div class="modal__actions"><button class="btn btn--primary" type="button" data-guardar>' + T.save + '</button><button class="btn btn--ghost" type="button" data-no>' + T.cancel + "</button></div>",
      function (m, cerrar) {
        var inp = m.querySelector('[data-f="pass"]');
        m.querySelector("[data-no]").addEventListener("click", cerrar);
        m.querySelector("[data-gen]").addEventListener("click", function () {
          var abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!#%+";
          var v = "", a = new Uint32Array(12); crypto.getRandomValues(a);
          for (var i = 0; i < 12; i++) v += abc[a[i] % abc.length];
          inp.value = v; inp.focus(); inp.select();
        });
        m.querySelector("[data-guardar]").addEventListener("click", function () {
          if (inp.value.length < 8) { inp.focus(); return; }
          this.disabled = true;
          SB.rpc("admin_set_password", { uid: u.id, new_password: inp.value }).then(function () { cerrar(); aviso(T.okPass); }).catch(function (e) { cerrar(); fallo(e); });
        });
      });
  }

  /* ---------- arranque ---------- */
  var panel = document.querySelector("[data-admin]");
  comprobar().then(function (si) {
    if (!panel) return;
    if (!si) { panel.innerHTML = '<p class="muted">' + T.denied + "</p>"; return; }
    pintar(panel);
  });
})();

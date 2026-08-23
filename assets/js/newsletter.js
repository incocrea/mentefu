/* MenteFu / MyselfU — alta en la newsletter.
   El endpoint lo define NEWSLETTER_ENDPOINT en tools/build.py (action del form).
   Vacío = modo demo: no se envía nada y se avisa. */
(function () {
  "use strict";
  var ES = (document.documentElement.lang || "").indexOf("es") === 0;
  var T = ES ? {
    invalid: "Revisa el email: no parece válido.",
    sending: "Enviando…",
    ok: "✅ Listo. Te avisaremos cuando haya algo que merezca tu atención.",
    demo: "✅ (Demo) El formulario funciona, pero el alta todavía no se guarda.",
    err: "No se pudo enviar. Inténtalo de nuevo en un momento."
  } : {
    invalid: "Check the email: it does not look valid.",
    sending: "Sending…",
    ok: "✅ Done. We will let you know when there is something worth your attention.",
    demo: "✅ (Demo) The form works, but sign-ups are not stored yet.",
    err: "Could not send. Please try again in a moment."
  };

  document.querySelectorAll("form[data-newsletter]").forEach(function (form) {
    var input = form.querySelector("input[type=email]");
    var out = form.querySelector(".form__feedback");
    var btn = form.querySelector("button[type=submit]");
    var endpoint = (form.getAttribute("action") || "").trim();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = (input.value || "").trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { out.textContent = T.invalid; input.focus(); return; }
      if (!endpoint) { out.textContent = T.demo; return; }
      out.textContent = T.sending;
      btn.disabled = true;
      var body = new URLSearchParams({ email: email, lang: ES ? "es" : "en", source: window.location.href });
      var opts = { method: "POST", body: body };
      if (endpoint.indexOf("script.google.com") !== -1) opts.mode = "no-cors"; /* Apps Script no devuelve CORS */
      fetch(endpoint, opts).then(function (res) {
        if (opts.mode === "no-cors" || res.ok) { out.textContent = T.ok; form.reset(); }
        else { out.textContent = T.err; }
      }).catch(function () { out.textContent = T.err; }).then(function () { btn.disabled = false; });
    });
  });
})();

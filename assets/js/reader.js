/* MenteFu / MyselfU — lector de pergaminos y herramientas gated (docs/04 §2).
   Recibe mf:content con {html, kind, xp, art, id}. Los pergaminos (article,
   story) se paginan por apartado (H2) con barra de progreso y dan XP al
   terminar; las herramientas (tool) se inyectan y se inicializan (tools.js). */
(function () {
  "use strict";
  var cfg = window.MF_CONFIG || {};
  var ES = cfg.lang === "es";
  var T = ES ? { page: "Parte {i} de {n}", prev: "Anterior", next: "Siguiente", done: "Marcar como leído (+{n} XP)", read: "Pergamino leído: +{n} XP", already: "Ya leíste este pergamino." }
             : { page: "Part {i} of {n}", prev: "Previous", next: "Next", done: "Mark as read (+{n} XP)", read: "Scroll read: +{n} XP", already: "You already read this scroll." };

  function el(html) { var d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstChild; }

  function paginate(html) {
    var tmp = document.createElement("div"); tmp.innerHTML = html;
    var pages = [], cur = document.createElement("div");
    [].slice.call(tmp.childNodes).forEach(function (node) {
      if (node.nodeType === 1 && node.tagName === "H2" && cur.childNodes.length) { pages.push(cur); cur = document.createElement("div"); }
      cur.appendChild(node);
    });
    if (cur.childNodes.length) pages.push(cur);
    return pages;
  }

  function scroll(host, data) {
    var body = host.querySelector("[data-gated-body]");
    var pages = paginate(data.html || "");
    var n = pages.length, i = 0;
    var a = window.MF ? MF.art(data.art) : null;
    var already = a && !!a.scrolls[data.id];
    var wrap = el('<div class="reader"><div class="reader__top"><div class="mission__bar"><div class="mission__fill"></div></div><span class="mission__count"></span></div><div class="prose reader__page"></div><div class="reader__nav"><button class="btn btn--ghost" type="button" data-prev>' + T.prev + '</button><button class="btn btn--primary" type="button" data-next>' + T.next + "</button></div></div>");
    body.appendChild(wrap);
    var fill = wrap.querySelector(".mission__fill"), count = wrap.querySelector(".mission__count"), page = wrap.querySelector(".reader__page");
    var prev = wrap.querySelector("[data-prev]"), next = wrap.querySelector("[data-next]");
    function show() {
      page.innerHTML = ""; page.appendChild(pages[i].cloneNode(true));
      fill.style.width = Math.round(((i + 1) / n) * 100) + "%";
      count.textContent = T.page.replace("{i}", i + 1).replace("{n}", n);
      prev.disabled = i === 0;
      next.textContent = i >= n - 1 ? (already ? T.already : T.done.replace("{n}", data.xp)) : T.next;
      next.disabled = i >= n - 1 && already;
      if (window.MF) MF.track("card_view", { item: data.id, art: data.art, data: { part: i, type: "scroll" } });
      wrap.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prev.addEventListener("click", function () { if (i > 0) { i--; show(); } });
    next.addEventListener("click", function () {
      if (i < n - 1) { i++; show(); return; }
      if (window.MF && !already) { MF.scrollRead(data.art, data.id, data.xp); already = true; next.disabled = true; next.textContent = T.read.replace("{n}", data.xp); }
    });
    show();
  }

  function tool(host, data) {
    var body = host.querySelector("[data-gated-body]");
    var box = el('<div class="prose"></div>');
    box.innerHTML = data.html || "";
    body.appendChild(box);
    if (window.MFTools) MFTools.init(box);
    var used = false;
    function first() { if (used) return; used = true; if (window.MF) MF.toolUsed(data.art, data.id, data.xp); }
    box.addEventListener("input", first);
    box.addEventListener("submit", first);
    box.addEventListener("click", function (e) { if (e.target.closest("[data-step-next]")) first(); });
  }

  document.querySelectorAll("[data-gate]").forEach(function (host) {
    var kind = host.getAttribute("data-kind");
    if (kind === "mission" || kind === "exam") return;
    host.addEventListener("mf:content", function (e) { (kind === "tool" ? tool : scroll)(host, e.detail); });
  });
})();

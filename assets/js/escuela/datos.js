/* Tu Escuela — capa de datos (F1, docs/10-tu-escuela).
 *
 * Un único modelo en memoria con la forma de la FUENTE de F0, venga de donde
 * venga: en modo local (build sin gate) se lee el archivo escuela-fuente.json
 * que el build deja junto al sitio; con Supabase se leen las tablas
 * escuela_* (RLS: solo el autor y el super admin ven algo) y se recompone la
 * misma forma. El panel no distingue orígenes; solo esta capa sabe de dónde
 * vino cada cosa y qué versión lleva cada fila (para el guardado de F2).
 */
(function () {
  "use strict";
  var cfg = window.MF_CONFIG || {};
  var modelo = null;
  var promesa = null;

  function ordenarCurso(curso) {
    (curso.misiones || []).sort(function (a, b) {
      return (a.nivel - b.nivel)
        || ((a.kind === "exam") - (b.kind === "exam"))
        || (a.orden - b.orden);
    });
    return curso;
  }

  function desdeArchivo() {
    return fetch(cfg.prefix + "escuela-fuente.json").then(function (res) {
      if (!res.ok) throw new Error("fuente local " + res.status);
      return res.json();
    }).then(function (fuente) {
      Object.keys(fuente.cursos).forEach(function (k) { ordenarCurso(fuente.cursos[k]); });
      return { fuente: fuente, rol: "superadmin", origen: "local", versiones: {} };
    });
  }

  function desdeSupabase() {
    return Promise.all([
      SB.rpc("escuela_rol").catch(function () { return "student"; }),
      SB.select("escuela_cursos", "select=clave,categoria,status,visibilidad,codigo_curso,datos,version&order=clave"),
      SB.select("escuela_misiones", "select=id,curso,nivel,orden,kind,datos,version&deleted_at=is.null"),
      SB.select("escuela_pergaminos", "select=id,curso,layout,datos,version&deleted_at=is.null"),
    ]).then(function (r) {
      var rol = typeof r[0] === "string" ? r[0] : "student";
      var fuente = { version: 1, audio: { es: [], en: [] }, cursos: {} };
      var versiones = {};
      (r[1] || []).forEach(function (fila) {
        var curso = fila.datos || {};
        curso.misiones = [];
        curso.pergaminos = [];
        curso.categoria = fila.categoria || curso.categoria || "bienestar";
        curso.status = fila.status;
        curso.visibilidad = fila.visibilidad;
        curso.codigo_curso = fila.codigo_curso;
        if (curso.audio) fuente.audio = curso.audio;
        fuente.cursos[fila.clave] = curso;
        versiones["curso:" + fila.clave] = fila.version;
      });
      (r[2] || []).forEach(function (fila) {
        var c = fuente.cursos[fila.curso];
        if (!c) return;
        c.misiones.push(fila.datos);
        versiones["mision:" + fila.id] = fila.version;
      });
      (r[3] || []).forEach(function (fila) {
        var c = fuente.cursos[fila.curso];
        if (!c) return;
        c.pergaminos.push(fila.datos);
        versiones["pergamino:" + fila.id] = fila.version;
      });
      Object.keys(fuente.cursos).forEach(function (k) { ordenarCurso(fuente.cursos[k]); });
      return { fuente: fuente, rol: rol, origen: "sb", versiones: versiones };
    });
  }

  /* ------------------------------------------------------------ guardado --
     Autosave con debounce por misión. Con Supabase: RPC escuela_guardar_mision
     con chequeo de versión (un 'conflicto' avisa al panel — nada de
     last-write-wins). En modo local (dev): la misión editada se guarda en
     localStorage y se re-aplica sobre la fuente en la próxima carga. */
  var LS_PREFIJO = "mf.escuela.borrador.";
  var timers = {};
  var sucios = {};            /* id → true mientras hay edición sin guardar */
  var oyentes = [];

  function avisar(estado, extra) {
    for (var i = 0; i < oyentes.length; i++) {
      try { oyentes[i](estado, extra || {}); } catch (e) { /* nada */ }
    }
  }

  /* Una clave de guardado es "tipo:id" — mision:culpafu-1-1,
     pergamino:learn-what-is-guilt, curso:culpafu. La búsqueda devuelve la
     FILA que se persiste entera (datos jsonb en Supabase, JSON en local). */
  function filaDe(claveGuardado) {
    var sep = claveGuardado.indexOf(":");
    var tipo = claveGuardado.slice(0, sep), id = claveGuardado.slice(sep + 1);
    var cursos = modelo.fuente.cursos;
    for (var clave in cursos) {
      var curso = cursos[clave];
      if (tipo === "curso" && clave === id) {
        var datosCurso = {};
        for (var k in curso) if (k !== "misiones" && k !== "pergaminos") datosCurso[k] = curso[k];
        return { tipo: tipo, id: id, datos: datosCurso, rpc: "escuela_guardar_curso", arg: "p_clave" };
      }
      var lista = tipo === "mision" ? curso.misiones : tipo === "pergamino" ? curso.pergaminos : [];
      for (var i = 0; i < lista.length; i++) {
        if (lista[i].id === id) {
          return { tipo: tipo, id: id, datos: lista[i],
                   rpc: tipo === "mision" ? "escuela_guardar_mision" : "escuela_guardar_pergamino", arg: "p_id" };
        }
      }
    }
    return null;
  }

  function guardarAhora(claveGuardado) {
    if (claveGuardado.indexOf(":") < 0) claveGuardado = "mision:" + claveGuardado;
    var fila = filaDe(claveGuardado);
    if (!fila) return Promise.resolve();
    clearTimeout(timers[claveGuardado]);
    delete sucios[claveGuardado];
    avisar("guardando", { id: claveGuardado });
    if (modelo.origen !== "sb") {
      try {
        localStorage.setItem(LS_PREFIJO + claveGuardado, JSON.stringify(fila.datos));
        avisar("guardado", { id: claveGuardado });
        return Promise.resolve();
      } catch (e) {
        avisar("error", { id: claveGuardado });
        return Promise.reject(e);
      }
    }
    var version = modelo.versiones[claveGuardado] || 1;
    var args = { p_datos: fila.datos, p_version: version };
    args[fila.arg] = fila.id;
    return SB.rpc(fila.rpc, args)
      .then(function (nueva) {
        modelo.versiones[claveGuardado] = typeof nueva === "number" ? nueva : version + 1;
        avisar("guardado", { id: claveGuardado });
      }, function (err) {
        var texto = String((err && err.message) || err || "");
        if (texto.indexOf("conflicto") >= 0) avisar("conflicto", { id: claveGuardado });
        else avisar("error", { id: claveGuardado });
        throw err;
      });
  }

  /* NADA se guarda solo (titular 2026-09-02): editar solo ENSUCIA el borrador
     en memoria y enciende el botón «Guardar». Un autosave silencioso convirtió
     un borrado accidental en pérdida real, y eso no vuelve a pasar. */
  function marcarSucio(claveGuardado) {
    if (claveGuardado.indexOf(":") < 0) claveGuardado = "mision:" + claveGuardado;
    sucios[claveGuardado] = true;
    avisar("sucio", { id: claveGuardado });
  }

  /* Guarda TODO lo pendiente ya mismo (lo llama publicar antes de compilar:
     publicar un borrador a medio guardar sería mentirle al maestro). */
  function guardarTodo() {
    var ids = Object.keys(sucios);
    return Promise.all(ids.map(function (id) { return guardarAhora(id); }));
  }

  /* Los borradores locales sobreviven a la recarga: se re-aplican sobre la
     fuente del archivo (solo dev; con Supabase la verdad ya viene guardada). */
  function aplicarLista(lista, prefijoTipo) {
    for (var i = 0; i < lista.length; i++) {
      var crudo = null;
      try { crudo = localStorage.getItem(LS_PREFIJO + prefijoTipo + lista[i].id); } catch (e) { /* nada */ }
      if (!crudo) continue;
      try { lista[i] = JSON.parse(crudo); } catch (e) { /* borrador corrupto: se ignora */ }
    }
  }
  function aplicarBorradoresLocales(fuente) {
    aplicarCursosNuevosLocales(fuente);
    for (var clave in fuente.cursos) {
      aplicarLista(fuente.cursos[clave].misiones, "mision:");
      /* compatibilidad con los borradores de F2 (sin prefijo de tipo) */
      aplicarLista(fuente.cursos[clave].misiones, "");
      aplicarLista(fuente.cursos[clave].pergaminos, "pergamino:");
      ordenarCurso(fuente.cursos[clave]);
    }
  }

  function descartarBorradorLocal(claveGuardado) {
    try { localStorage.removeItem(LS_PREFIJO + claveGuardado); } catch (e) { /* nada */ }
  }

  function cargar() {
    if (modelo) return Promise.resolve(modelo);
    if (promesa) return promesa;
    var esSb = cfg.gate && window.SB && SB.enabled();
    var via = esSb ? desdeSupabase() : desdeArchivo().then(function (m) {
      aplicarBorradoresLocales(m.fuente);
      return m;
    });
    promesa = via.then(function (m) { modelo = m; promesa = null; return m; },
      function (err) { promesa = null; throw err; });
    return promesa;
  }

  /* ---------------------------------------- crear, papelera, restaurar ---- */

  /* Fundar un curso (F6): con Supabase pasa por la RPC (que aplica el CUPO
     del rol: el regalo es 1, los maestros 50); en local se funda directo y
     persiste entero en localStorage para el dev. */
  function fundarCurso(clave, curso) {
    if (modelo.origen !== "sb") {
      modelo.fuente.cursos[clave] = curso;
      try { localStorage.setItem(LS_PREFIJO + "cursoNuevo:" + clave, JSON.stringify(curso)); } catch (e) { /* nada */ }
      return Promise.resolve();
    }
    var datos = {};
    for (var k in curso) if (k !== "misiones" && k !== "pergaminos") datos[k] = curso[k];
    return SB.rpc("escuela_fundar_curso", { p_clave: clave, p_datos: datos }).then(function () {
      modelo.fuente.cursos[clave] = curso;
      modelo.versiones["curso:" + clave] = 1;
      var pendientes = curso.misiones.map(function (m) {
        return SB.rpc("escuela_crear_mision", {
          p_id: m.id, p_curso: clave, p_nivel: m.nivel, p_orden: m.orden,
          p_kind: m.kind, p_datos: m,
        });
      });
      return Promise.all(pendientes);
    });
  }

  function aplicarCursosNuevosLocales(fuente) {
    var claves = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(LS_PREFIJO + "cursoNuevo:") === 0) claves.push(k);
      }
    } catch (e) { /* nada */ }
    claves.forEach(function (k) {
      try {
        var curso = JSON.parse(localStorage.getItem(k));
        fuente.cursos[k.slice((LS_PREFIJO + "cursoNuevo:").length)] = curso;
      } catch (e) { /* corrupto: se ignora */ }
    });
  }

  function crearMision(clave, entry) {
    var curso = modelo.fuente.cursos[clave];
    curso.misiones.push(entry);
    ordenarCurso(curso);
    if (modelo.origen !== "sb") {
      try { localStorage.setItem(LS_PREFIJO + "mision:" + entry.id, JSON.stringify(entry)); } catch (e) { /* nada */ }
      return Promise.resolve();
    }
    return SB.rpc("escuela_crear_mision", {
      p_id: entry.id, p_curso: clave, p_nivel: entry.nivel,
      p_orden: entry.orden, p_kind: entry.kind, p_datos: entry,
    }).then(function () { modelo.versiones["mision:" + entry.id] = 1; });
  }

  function crearPergamino(clave, entry) {
    var curso = modelo.fuente.cursos[clave];
    curso.pergaminos.push(entry);
    if (modelo.origen !== "sb") {
      try { localStorage.setItem(LS_PREFIJO + "pergamino:" + entry.id, JSON.stringify(entry)); } catch (e) { /* nada */ }
      return Promise.resolve();
    }
    return SB.rpc("escuela_crear_pergamino", {
      p_id: entry.id, p_curso: clave, p_layout: entry.layout, p_datos: entry,
    }).then(function () { modelo.versiones["pergamino:" + entry.id] = 1; });
  }

  /* Borrado blando: la fila sale del modelo YA (y del borrador local); con
     Supabase además se estampa deleted_at (papelera de 30 días). Devuelve la
     entrada quitada para que el panel pueda ofrecer Deshacer al vuelo. */
  function borrarFila(clave, tipo, id) {
    var curso = modelo.fuente.cursos[clave];
    var lista = tipo === "mision" ? curso.misiones : curso.pergaminos;
    var quitada = null;
    for (var i = 0; i < lista.length; i++) {
      if (lista[i].id === id) { quitada = lista.splice(i, 1)[0]; break; }
    }
    try { localStorage.removeItem(LS_PREFIJO + tipo + ":" + id); } catch (e) { /* nada */ }
    var promesa = modelo.origen === "sb"
      ? SB.rpc(tipo === "mision" ? "escuela_borrar_mision" : "escuela_borrar_pergamino", { p_id: id })
      : Promise.resolve();
    return { quitada: quitada, promesa: promesa };
  }

  function restaurarFila(clave, tipo, entry) {
    var curso = modelo.fuente.cursos[clave];
    (tipo === "mision" ? curso.misiones : curso.pergaminos).push(entry);
    if (tipo === "mision") ordenarCurso(curso);
    if (modelo.origen !== "sb") {
      try { localStorage.setItem(LS_PREFIJO + tipo + ":" + entry.id, JSON.stringify(entry)); } catch (e) { /* nada */ }
      return Promise.resolve();
    }
    return SB.rpc(tipo === "mision" ? "escuela_restaurar_mision" : "escuela_restaurar_pergamino", { p_id: entry.id });
  }

  /* Las filas en la papelera (solo con Supabase; en local el Deshacer del
     toast es toda la red de seguridad). */
  function papeleraDe(clave) {
    if (modelo.origen !== "sb") return Promise.resolve({ misiones: [], pergaminos: [] });
    return Promise.all([
      SB.select("escuela_misiones", "select=id,datos,deleted_at&curso=eq." + encodeURIComponent(clave) + "&deleted_at=not.is.null&order=deleted_at.desc"),
      SB.select("escuela_pergaminos", "select=id,datos,deleted_at&curso=eq." + encodeURIComponent(clave) + "&deleted_at=not.is.null&order=deleted_at.desc"),
    ]).then(function (r) { return { misiones: r[0] || [], pergaminos: r[1] || [] }; });
  }

  window.MFEscuelaDatos = {
    fundarCurso: fundarCurso,
    crearMision: crearMision,
    crearPergamino: crearPergamino,
    borrarFila: borrarFila,
    restaurarFila: restaurarFila,
    papeleraDe: papeleraDe,
    cargar: cargar,
    modelo: function () { return modelo; },
    recargar: function () { modelo = null; return cargar(); },
    marcarSucio: marcarSucio,
    limpiarSucio: function (clave) { delete sucios[clave]; avisar("limpio", { id: clave }); },
    guardarAhora: guardarAhora,
    guardarTodo: guardarTodo,
    haySucios: function () { return Object.keys(sucios).length > 0; },
    descartarBorradorLocal: descartarBorradorLocal,
    onEstado: function (cb) { oyentes.push(cb); },
  };
})();

// Formulario de Solicitud Individual — Kiddo Lite.
// Captura tomador, asegurado y beneficiarios. NO captura datos de pago (tarjeta/cuenta):
// el paso final solo enlaza a la pasarela de pago externa de cada plan (ver KIDDO.enlacesPago en data.js).

(function () {
  const form = document.getElementById("form-solicitud");
  const panels = Array.from(document.querySelectorAll(".form-panel[data-panel]"));
  let pasoActual = 1;

  const state = {
    plan: "M",
    periodo: "mensual",
  };

  let ultimaSolicitud = null;

  // ---------- Helpers de query string ----------
  function leerQuery() {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");
    const periodo = params.get("periodo");
    if (plan && KIDDO.planes[plan]) state.plan = plan;
    if (periodo === "mensual" || periodo === "anual") state.periodo = periodo;
  }

  // ---------- Chips de radio ----------
  function initRadioChips(containerId, onChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const chips = container.querySelectorAll(".radio-chip");
    chips.forEach((chip) => {
      const input = chip.querySelector("input");
      input.addEventListener("change", () => {
        chips.forEach((c) => c.classList.toggle("checked", c.querySelector("input").checked));
        if (onChange) onChange(input.value);
      });
    });
  }

  function marcarChip(containerId, value) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll(".radio-chip").forEach((chip) => {
      const input = chip.querySelector("input");
      const marcado = input.value === value;
      input.checked = marcado;
      chip.classList.toggle("checked", marcado);
    });
  }

  // ---------- Encabezado / pill de plan ----------
  function actualizarPill() {
    document.getElementById("pill-plan").textContent = state.plan;
    document.getElementById("pill-periodo").textContent = state.periodo === "mensual" ? "Mensual" : "Anual";
    document.getElementById("cambiar-plan").href = `index.html#planes`;
  }

  // ---------- Navegación entre pasos ----------
  function mostrarPaso(n) {
    pasoActual = n;
    panels.forEach((p) => p.classList.toggle("active", Number(p.dataset.panel) === n));
    document.querySelectorAll(".progress-track span").forEach((s) => {
      s.classList.toggle("done", Number(s.dataset.step) <= n);
    });
    document.querySelectorAll(".progress-steps li").forEach((li) => {
      li.classList.toggle("active", Number(li.dataset.step) === n);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (n === 4) pintarRevision();
  }

  function validarPaso(n) {
    const panel = panels.find((p) => Number(p.dataset.panel) === n);
    let valido = true;

    panel.querySelectorAll("input[required], input[data-required], select[data-required]").forEach((el) => {
      // se valida abajo por campo específico
    });

    // Campos de texto/select requeridos, marcados en HTML con name y sin "opcional"
    const requeridos = panel.querySelectorAll(
      "input[type=text][name], input[type=date][name], input[type=tel][name], input[type=email][name], select[name]"
    );
    requeridos.forEach((el) => {
      const esOpcional = el.closest(".field")?.querySelector("label")?.textContent.includes("opcional");
      if (esOpcional) return;
      if (el.name === "telefonoOficina") return;
      const campo = el.closest(".field");
      const vacio = !el.value || !el.value.trim();
      if (vacio) {
        campo?.classList.add("invalid");
        valido = false;
      } else {
        campo?.classList.remove("invalid");
      }
    });

    if (n === 1) {
      if (!form.querySelector('input[name="plan"]:checked')) valido = false;
      if (!form.querySelector('input[name="periodo"]:checked')) valido = false;
    }

    if (n === 2) {
      const celular = form.telefonoCelular.value.replace(/\D/g, "");
      const campoCel = form.telefonoCelular.closest(".field");
      if (celular.length < 7) {
        campoCel.classList.add("invalid");
        valido = false;
      } else {
        campoCel.classList.remove("invalid");
      }

      const correo = form.correo.value.trim();
      const campoCorreo = form.correo.closest(".field");
      if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        campoCorreo.classList.add("invalid");
        valido = false;
      } else {
        campoCorreo.classList.remove("invalid");
      }

      if (!form.querySelector('input[name="sexo"]:checked')) valido = false;

      const edad = kiddoCalcularEdad(form.fechaNacimiento.value);
      if (!kiddoEsElegible(edad)) valido = false;
    }

    return valido;
  }

  // ---------- Cálculo y banner de edad ----------
  function actualizarBannerEdad() {
    const banner = document.getElementById("banner-edad");
    const edad = kiddoCalcularEdad(form.fechaNacimiento.value);

    if (edad === null) {
      banner.classList.remove("show", "alerta");
      banner.innerHTML = "";
      return;
    }

    banner.classList.add("show");

    if (!kiddoEsElegible(edad)) {
      banner.classList.add("alerta");
      banner.innerHTML = `Tienes ${edad} años. Este seguro aplica para edades entre ${KIDDO.elegibilidad.edadIngresoMin} y ${KIDDO.elegibilidad.edadIngresoMax} años. Escríbenos a ${KIDDO.marca.correo} para conocer otras opciones.`;
    } else {
      banner.classList.remove("alerta");
      const tarifa = kiddoTarifaPorEdad(edad);
      banner.innerHTML = `Tienes ${edad} años → rango tarifario <strong>${tarifa.rango}</strong>. Tu prima se calculará con este rango en el paso de revisión.`;
    }
  }

  // ---------- Beneficiario único ----------
  // Cada póliza cubre a un solo hijo, así que solo se permite un beneficiario (100% fijo).
  // Si intentan agregar otro, se les invita a contratar un plan adicional en vez de agregar una fila más.
  function intentarAgregarOtroBeneficiario() {
    document.getElementById("alerta-beneficiario-adicional").style.display = "block";
    document.getElementById("alerta-beneficiario-adicional").scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function leerBeneficiarios() {
    const nombre = document.getElementById("benef-nombre").value.trim();
    const parentesco = document.getElementById("benef-parentesco").value.trim();
    if (!nombre && !parentesco) return [];
    return [{ nombre, parentesco, porcentaje: 100 }];
  }

  // ---------- Revisión ----------
  function pintarRevision() {
    const datos = new FormData(form);
    const tomadorEsAsegurado = form.tomadorEsAsegurado.checked;
    const edad = kiddoCalcularEdad(datos.get("fechaNacimiento"));
    const tarifa = kiddoTarifaPorEdad(edad);
    const beneficiarios = leerBeneficiarios();

    const block = document.getElementById("review-block");
    block.innerHTML = `
      <div class="review-card">
        <h4>Tomador</h4>
        <div class="review-row"><span>Nombre</span><span>${datos.get("tomadorNombre") || "—"}</span></div>
        <div class="review-row"><span>¿Es el asegurado?</span><span>${tomadorEsAsegurado ? "Sí" : "No"}</span></div>
      </div>
      <div class="review-card">
        <h4>Asegurado</h4>
        <div class="review-row"><span>Nombre</span><span>${datos.get("aseguradoNombre") || "—"}</span></div>
        <div class="review-row"><span>Documento</span><span>${datos.get("tipoDocumento") || "—"} ${datos.get("numeroDocumento") || ""}</span></div>
        <div class="review-row"><span>Fecha de nacimiento</span><span>${datos.get("fechaNacimiento") || "—"} (${edad ?? "—"} años)</span></div>
        <div class="review-row"><span>Sexo</span><span>${datos.get("sexo") || "—"}</span></div>
        <div class="review-row"><span>Celular</span><span>${datos.get("telefonoCelular") || "—"}</span></div>
        <div class="review-row"><span>Correo</span><span>${datos.get("correo") || "—"}</span></div>
      </div>
      <div class="review-card">
        <h4>Beneficiario</h4>
        ${
          beneficiarios.length
            ? `<div class="review-row"><span>${beneficiarios[0].nombre || "—"} (${beneficiarios[0].parentesco || "—"})</span><span>${beneficiarios[0].porcentaje}%</span></div>`
            : '<div class="review-row"><span>Sin beneficiario diligenciado</span><span>Aplica por Ley</span></div>'
        }
      </div>
    `;

    document.getElementById("review-plan-tag").textContent = `${state.plan} · ${KIDDO.planes[state.plan].nombre}`;
    document.getElementById("review-periodo-tag").textContent = state.periodo === "mensual" ? "Pago mensual" : "Pago anual";

    if (tarifa) {
      const valor = tarifa[state.periodo][state.plan];
      document.getElementById("review-prima").textContent = `${kiddoFormatCOP(valor)} ${
        state.periodo === "mensual" ? "/ mes" : "/ año"
      }`;
    } else {
      document.getElementById("review-prima").textContent = "Completa el paso 2 para calcular tu prima";
    }
  }

  function actualizarBotonEnviar() {
    const btn = document.getElementById("btn-enviar");
    const checks = form.querySelectorAll('#panel-4 input[type=checkbox], .legal-box input[type=checkbox]');
    const todasMarcadas = Array.from(document.querySelectorAll(".legal-box input[type=checkbox]")).every((c) => c.checked);
    btn.disabled = !todasMarcadas;
  }

  // ---------- Envío ----------
  function generarFolio() {
    const ahora = new Date();
    return `KID-${ahora.getFullYear()}${String(ahora.getMonth() + 1).padStart(2, "0")}${String(ahora.getDate()).padStart(2, "0")}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
  }

  function guardarSolicitud(payload) {
    try {
      const previas = JSON.parse(localStorage.getItem("kiddo_solicitudes") || "[]");
      previas.push(payload);
      localStorage.setItem("kiddo_solicitudes", JSON.stringify(previas));
    } catch (e) {
      console.warn("No se pudo guardar en localStorage", e);
    }

    // TODO: reemplazar por el envío real al backend/CRM (Airtable, HubSpot, etc.) cuando exista KIDDO.formEndpoint.
    if (KIDDO.formEndpoint) {
      fetch(KIDDO.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((e) => console.warn("No se pudo enviar la solicitud al backend", e));
    }
  }

  function pintarOpcionesPago(folio) {
    const datos = new FormData(form);
    const edad = kiddoCalcularEdad(datos.get("fechaNacimiento"));
    const tarifa = kiddoTarifaPorEdad(edad);

    const cont = document.getElementById("pay-options");
    cont.innerHTML = Object.values(KIDDO.planes)
      .map((plan) => {
        const activo = plan.id === state.plan;
        const valor = tarifa ? tarifa[state.periodo][plan.id] : null;
        const link = tarifa ? tarifa.enlacesPago[state.periodo][plan.id] : "#";
        return `
        <div class="pay-option" style="${activo ? "border-color:var(--morado);box-shadow:var(--sombra-sm)" : ""}">
          <strong>Plan ${plan.id}${activo ? " (elegido)" : ""}</strong>
          <span class="amount">${valor ? kiddoFormatCOP(valor) : "—"}</span>
          <a class="btn ${activo ? "btn-naranja" : "btn-ghost"} btn-sm" target="_blank" rel="noopener"
             href="${link === "#" ? "#" : link}"
             onclick="${link === "#" ? "alert('Pasarela de pago pendiente de configurar para este plan.');return false;" : ""}">
             Ir a pagar
          </a>
        </div>`;
      })
      .join("");
  }

  // ---------- Resumen imprimible (PDF vía "Imprimir a PDF" del navegador) ----------
  function generarResumenImprimible() {
    if (!ultimaSolicitud) return;
    const datos = ultimaSolicitud;
    const plan = KIDDO.planes[datos.plan];
    const tarifa = kiddoTarifaPorEdad(kiddoCalcularEdad(datos.fechaNacimiento));
    const prima = tarifa ? kiddoFormatCOP(tarifa[datos.periodo][datos.plan]) : "—";
    const fecha = new Date(datos.fechaEnvio).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const filasCobertura = KIDDO.coberturas
      .map((c) => `<tr><td>${c.nombre}</td><td>${c.valores[datos.plan]}</td></tr>`)
      .join("");

    document.getElementById("resumen-imprimible").innerHTML = `
      <div class="ri-header">
        <div>
          <h1>Resumen de solicitud — Kiddo Lite</h1>
          <div>N.º de solicitud: <strong>${datos.folio}</strong> · Fecha: ${fecha}</div>
        </div>
        <img src="assets/img/logo-kiddo-color.png" alt="Kiddo" />
      </div>

      <h2>Tomador</h2>
      <div class="ri-row"><span>Nombre</span><span>${datos.tomadorNombre || "—"}</span></div>

      <h2>Plan contratado</h2>
      <div class="ri-row"><span>Plan</span><span>${plan.etiqueta} · ${plan.nombre}</span></div>
      <div class="ri-row"><span>Periodicidad</span><span>${datos.periodo === "mensual" ? "Mensual" : "Anual"}</span></div>
      <div class="ri-row"><span>Prima estimada</span><span>${prima} ${datos.periodo === "mensual" ? "/ mes" : "/ año"}</span></div>

      <h2>Coberturas incluidas</h2>
      <table>
        <thead><tr><th>Amparo</th><th>Valor asegurado</th></tr></thead>
        <tbody>${filasCobertura}</tbody>
      </table>

      <div class="ri-nota">
        Este resumen es informativo y está sujeto a verificación del pago y a la emisión definitiva de la
        póliza por parte de Seguros Bolívar S.A.
      </div>
    `;

    window.print();
  }

  function enviarSolicitud(e) {
    e.preventDefault();
    if (!validarPaso(4)) return;

    const datos = Object.fromEntries(new FormData(form).entries());
    datos.beneficiarios = leerBeneficiarios();
    datos.plan = state.plan;
    datos.periodo = state.periodo;
    datos.folio = generarFolio();
    datos.fechaEnvio = new Date().toISOString();
    datos.producto = KIDDO.producto;

    guardarSolicitud(datos);
    ultimaSolicitud = datos;

    document.getElementById("form-solicitud").style.display = "none";
    document.querySelector(".form-header").style.display = "none";
    const confirm = document.getElementById("panel-confirmacion");
    confirm.classList.add("active");
    document.getElementById("folio-id").textContent = `N.º de solicitud: ${datos.folio}`;
    pintarOpcionesPago(datos.folio);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Wiring ----------
  document.addEventListener("DOMContentLoaded", () => {
    leerQuery();
    actualizarPill();
    marcarChip("radios-plan", state.plan);
    marcarChip("radios-periodo", state.periodo);

    initRadioChips("radios-plan", (v) => {
      state.plan = v;
      actualizarPill();
    });
    initRadioChips("radios-periodo", (v) => {
      state.periodo = v;
      actualizarPill();
    });
    initRadioChips("radios-sexo");

    form.fechaNacimiento.addEventListener("change", actualizarBannerEdad);

    document.querySelectorAll("[data-next]").forEach((btn) =>
      btn.addEventListener("click", () => {
        if (validarPaso(pasoActual)) {
          mostrarPaso(Math.min(pasoActual + 1, 4));
        } else {
          btn.closest(".form-panel").scrollIntoView({ behavior: "smooth" });
        }
      })
    );
    document.querySelectorAll("[data-prev]").forEach((btn) =>
      btn.addEventListener("click", () => mostrarPaso(Math.max(pasoActual - 1, 1)))
    );

    document.getElementById("btn-agregar-beneficiario").addEventListener("click", intentarAgregarOtroBeneficiario);

    document.getElementById("pay-options").addEventListener("click", (e) => {
      if (e.target.closest("a.btn")) {
        document.getElementById("cta-otro-hijo").style.display = "block";
      }
    });

    document.getElementById("btn-imprimir-resumen").addEventListener("click", generarResumenImprimible);

    document.querySelectorAll(".legal-box input[type=checkbox]").forEach((c) =>
      c.addEventListener("change", actualizarBotonEnviar)
    );

    form.addEventListener("submit", enviarSolicitud);

    mostrarPaso(1);
  });
})();

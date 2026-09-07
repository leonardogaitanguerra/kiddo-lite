// Landing page: pinta la matriz de coberturas y las tarjetas de precio (S/M/L) desde data.js.

(function () {
  const tarifaBase = KIDDO.tarifas[0]; // 18 a 30 años, usada como precio "desde" en la landing.

  function pintarCoberturas() {
    const tbody = document.getElementById("tabla-coberturas");
    if (!tbody) return;
    tbody.innerHTML = KIDDO.coberturas
      .map(
        (c) => `
        <tr>
          <td>${c.nombre}</td>
          <td>${c.valores.S}</td>
          <td>${c.valores.M}</td>
          <td>${c.valores.L}</td>
        </tr>`
      )
      .join("");

    const nota = document.getElementById("nota-carencia");
    if (nota) nota.textContent = KIDDO.elegibilidad.carenciaTexto;
  }

  function planDescripcion(id) {
    return (
      {
        S: "Protección esencial para empezar a cubrir lo básico.",
        M: "El equilibrio ideal entre cobertura y precio.",
        L: "Máxima protección para ti y tu familia.",
      }[id] || ""
    );
  }

  function pintarPlanes(periodo) {
    const grid = document.getElementById("pricing-grid");
    if (!grid) return;

    grid.innerHTML = Object.values(KIDDO.planes)
      .map((plan) => {
        const precio = tarifaBase[periodo][plan.id];
        const sufijo = periodo === "mensual" ? "/ mes" : "/ año";
        const cobertura = (nombre) =>
          KIDDO.coberturas.find((c) => c.nombre.startsWith(nombre)).valores[plan.id];

        return `
        <div class="plan-card ${plan.destacado ? "destacado" : ""}">
          ${plan.destacado ? '<span class="plan-badge">Más elegido</span>' : ""}
          <div class="plan-tag">${plan.etiqueta}</div>
          <div>
            <h3>${plan.nombre}</h3>
            <p class="plan-desc">${planDescripcion(plan.id)}</p>
          </div>
          <div class="plan-price">
            <span class="amount">${kiddoFormatCOP(precio)}</span>
            <span class="period">${sufijo}</span>
          </div>
          <p class="plan-price-note">Desde 18 a 30 años · el valor final depende de tu edad</p>
          <ul class="plan-features">
            <li><span class="check">✓</span> Vida: ${cobertura("Vida")}</li>
            <li><span class="check">✓</span> Incapacidad Total y Permanente: ${cobertura("Incapacidad Total")}</li>
            <li><span class="check">✓</span> Incapacidad Temporal: 4 pagos</li>
            <li><span class="check">✓</span> Bono Gastos Protegidos: ${cobertura("Bono Gastos")}</li>
            <li><span class="check">✓</span> Renta diaria por hospitalización: ${cobertura("Renta Diaria")}</li>
          </ul>
          <a href="solicitud.html?plan=${plan.id}&periodo=${periodo}" class="btn ${
            plan.destacado ? "btn-morado" : "btn-ghost"
          } btn-block">Contratar Plan ${plan.id}</a>
        </div>`;
      })
      .join("");
  }

  function initToggle() {
    const btns = document.querySelectorAll(".pricing-toggle button");
    btns.forEach((btn) => {
      btn.addEventListener("click", () => {
        btns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        pintarPlanes(btn.dataset.periodo);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    pintarCoberturas();
    pintarPlanes("mensual");
    initToggle();
  });
})();

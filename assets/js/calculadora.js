// Calculadora de educación — landing Kiddo Lite.
// Colegio: años restantes (según grado) x 12 x costo mensual = costo total restante.
//          valor asegurado de cada plan / costo mensual = meses de colegio cubiertos.
// Universidad: valor asegurado de cada plan / costo semestral = semestres de universidad cubiertos.

(function () {
  let nivel = "colegio";

  function poblarGrados() {
    const select = document.getElementById("calc-grado");
    if (!select) return;
    select.innerHTML = KIDDO.grados
      .map((g) => `<option value="${g.valor}">${g.label}</option>`)
      .join("");
  }

  function initRadiosNivel() {
    const chips = document.querySelectorAll("#calc-radios-nivel .radio-chip");
    chips.forEach((chip) => {
      const input = chip.querySelector("input");
      input.addEventListener("change", () => {
        chips.forEach((c) => c.classList.toggle("checked", c.querySelector("input").checked));
        nivel = input.value;
        document.getElementById("calc-campos-colegio").style.display = nivel === "colegio" ? "grid" : "none";
        document.getElementById("calc-campos-universidad").style.display = nivel === "universidad" ? "grid" : "none";
      });
    });
    // Colegio seleccionado por defecto.
    chips[0].querySelector("input").checked = true;
    chips[0].classList.add("checked");
  }

  function formatoAnios(meses) {
    const anios = Math.floor(meses / 12);
    const restoMeses = Math.round(meses % 12);
    if (anios <= 0) return `${restoMeses} ${restoMeses === 1 ? "mes" : "meses"}`;
    if (restoMeses === 0) return `${anios} ${anios === 1 ? "año" : "años"}`;
    return `${anios} ${anios === 1 ? "año" : "años"} y ${restoMeses} ${restoMeses === 1 ? "mes" : "meses"}`;
  }

  function calcularColegio() {
    const costo = Number(document.getElementById("calc-costo-colegio").value);
    const gradoValor = document.getElementById("calc-grado").value;
    const grado = KIDDO.grados.find((g) => g.valor === gradoValor) || KIDDO.grados[0];
    const error = document.getElementById("calc-error");

    if (!costo || costo <= 0) {
      error.style.display = "block";
      return;
    }
    error.style.display = "none";

    const añosRestantes = grado.restantes;
    const costoTotalRestante = costo * 12 * añosRestantes;
    const mesesRestantes = añosRestantes * 12;

    const resultados = Object.values(KIDDO.planes).map((plan) => {
      const valorAsegurado = KIDDO.valorVida[plan.id];
      const mesesCubiertos = valorAsegurado / costo;
      const porcentaje = Math.min(100, Math.round((mesesCubiertos / mesesRestantes) * 100));
      return { plan, valorAsegurado, texto: formatoAnios(mesesCubiertos), porcentaje };
    });

    pintarResultado({
      resumen: `Desde <strong>${grado.label}</strong> hasta 11°, la educación de tu hijo costaría aproximadamente <strong>${kiddoFormatCOP(
        costoTotalRestante
      )}</strong> en los próximos <strong>${añosRestantes} ${añosRestantes === 1 ? "año" : "años"}</strong>.`,
      resultados,
      subLabel: (r) => `${r.porcentaje}% de los ${añosRestantes} ${añosRestantes === 1 ? "año" : "años"} que faltan`,
      mostrarBarra: true,
    });
  }

  function calcularUniversidad() {
    const costo = Number(document.getElementById("calc-costo-universidad").value);
    const error = document.getElementById("calc-error");

    if (!costo || costo <= 0) {
      error.style.display = "block";
      return;
    }
    error.style.display = "none";

    const resultados = Object.values(KIDDO.planes).map((plan) => {
      const valorAsegurado = KIDDO.valorVida[plan.id];
      const semestresCubiertos = valorAsegurado / costo;
      const anios = semestresCubiertos / 2;
      const texto = `${semestresCubiertos.toFixed(1).replace(".0", "")} semestres`;
      return { plan, valorAsegurado, texto, sub: `≈ ${formatoAnios(anios * 12)} de universidad` };
    });

    pintarResultado({
      resumen: `Con un costo de <strong>${kiddoFormatCOP(costo)}</strong> por semestre, así de lejos llega cada plan.`,
      resultados,
      subLabel: (r) => r.sub,
      mostrarBarra: false,
    });
  }

  function pintarResultado({ resumen, resultados, subLabel, mostrarBarra }) {
    const cont = document.getElementById("calc-resultado");
    const mejor = resultados.reduce((a, b) => (b.valorAsegurado > a.valorAsegurado ? b : a), resultados[0]);

    cont.innerHTML = `
      <p class="calc-resumen">${resumen}</p>
      ${resultados
        .map(
          (r) => `
        <div class="calc-card ${r.plan.id === mejor.plan.id ? "destacado" : ""}">
          <div class="calc-card-top">
            <div class="calc-card-tag">${r.plan.etiqueta}</div>
            <div>
              <strong>${r.plan.nombre}</strong>
              <div class="calc-card-valor">${kiddoFormatCOP(r.valorAsegurado)} asegurados</div>
            </div>
          </div>
          <div class="calc-card-cobertura"><strong>${r.texto}</strong> cubiertos</div>
          ${
            mostrarBarra
              ? `<div class="calc-progress"><span style="width:${r.porcentaje}%"></span></div>
                 <div class="calc-progress-label">${subLabel(r)}</div>`
              : `<div class="calc-progress-label">${subLabel(r)}</div>`
          }
        </div>`
        )
        .join("")}
      <a href="solicitud.html?plan=${mejor.plan.id}" class="btn btn-morado btn-block">Contratar Plan ${mejor.plan.id}</a>
    `;
  }

  function calcular() {
    if (nivel === "colegio") calcularColegio();
    else calcularUniversidad();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("calc-btn")) return;
    poblarGrados();
    initRadiosNivel();
    document.getElementById("calc-btn").addEventListener("click", calcular);
  });
})();

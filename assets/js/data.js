/**
 * Datos del producto Kiddo Lite (respaldado por Seguros Bolívar).
 * Fuente: Ayuda Ventas Kiddo (pptx) + Solicitud Individual del seguro.
 *
 * OJO PRODUCTO: el ayuda-ventas trae dos códigos distintos para "Producto":
 * una diapositiva de parámetros dice 922 y la tabla de campos del formulario dice 923.
 * Se dejó 923 por defecto (documentado junto a los demás campos fijos del formulario).
 * Confirmar con Seguros Bolívar / Producto cuál es el correcto antes de ir a producción.
 */
const KIDDO = {
  marca: {
    nombre: "Kiddo Lite",
    aseguradora: "Seguros Bolívar S.A.", // solo para el aviso legal exigido en el footer
    correo: "hola@somoskiddo.com",
    whatsappTexto: "+57 302 668 2981",
    whatsappLink: "https://wa.me/15175144120",
  },

  // Valores fijos del producto acordados con Seguros Bolívar para el canal digital Kiddo.
  producto: {
    codigoProducto: 923, // revisar frente a "922" (ver nota arriba)
    oferta: 69,
    compania: 2,
    codigoAgente: 60619,
  },

  elegibilidad: {
    edadIngresoMin: 18,
    edadIngresoMax: 65,
    permanenciaMaxAnios: 70,
    permanenciaMaxDias: 364,
    declaracionSalud: false, // NO aplica declaración de asegurabilidad para el sponsor Kiddo
    carenciaTexto:
      "Periodo de carencia de 30 días para Incapacidad Temporal, Renta por Hospitalización y Bono de Gastos Protegidos.",
  },

  planes: {
    S: { id: "S", nombre: "Plan Esencial", etiqueta: "S", destacado: false },
    M: { id: "M", nombre: "Plan Integral", etiqueta: "M", destacado: true },
    L: { id: "L", nombre: "Plan Premium", etiqueta: "L", destacado: false },
  },

  // Valor asegurado por Vida (indemnización que respaldaría la educación de los hijos) — usado por la calculadora.
  valorVida: { S: 15000000, M: 40000000, L: 80000000 },

  // Grados escolares de Pre-Jardín (PK) a 11°, con los años que faltan para graduarse.
  // PK = 14 años restantes ... 11° = 1 año restante (calculadora de educación).
  grados: [
    { valor: "pk", label: "Pre-Jardín (PK)", restantes: 14 },
    { valor: "jardin", label: "Jardín", restantes: 13 },
    { valor: "transicion", label: "Transición", restantes: 12 },
    { valor: "1", label: "1°", restantes: 11 },
    { valor: "2", label: "2°", restantes: 10 },
    { valor: "3", label: "3°", restantes: 9 },
    { valor: "4", label: "4°", restantes: 8 },
    { valor: "5", label: "5°", restantes: 7 },
    { valor: "6", label: "6°", restantes: 6 },
    { valor: "7", label: "7°", restantes: 5 },
    { valor: "8", label: "8°", restantes: 4 },
    { valor: "9", label: "9°", restantes: 3 },
    { valor: "10", label: "10°", restantes: 2 },
    { valor: "11", label: "11°", restantes: 1 },
  ],

  // Matriz de amparos — Diapositiva "Matriz de Coberturas y Planes Aprobados".
  coberturas: [
    {
      nombre: "Vida (muerte por cualquier causa)",
      valores: { S: "$15.000.000", M: "$40.000.000", L: "$80.000.000" },
    },
    {
      nombre: "Incapacidad Total y Permanente (ITP)",
      valores: { S: "$15.000.000", M: "$40.000.000", L: "$80.000.000" },
    },
    {
      nombre: "Incapacidad Temporal (>15 días cont. hasta 120 días)",
      valores: { S: "4 pagos", M: "4 pagos", L: "4 pagos" },
    },
    {
      nombre: "Bono Gastos Protegidos (desempleo cónyuge/compañero)",
      valores: {
        S: "$500.000 (4 pagos)",
        M: "$1.000.000 (4 pagos)",
        L: "$1.500.000 (4 pagos)",
      },
    },
    {
      nombre: "Renta Diaria por Hospitalización (desde el 2° día)",
      valores: { S: "$50.000 / día", M: "$100.000 / día", L: "$150.000 / día" },
    },
  ],

  // Tarifas 100% confirmadas por producto — Diapositiva "Tarifas Vigentes por Rango de Edad".
  tarifas: [
    {
      rango: "18 a 30 años",
      edadMin: 18,
      edadMax: 30,
      anual: { S: 227700, M: 465300, L: 628100 },
      mensual: { S: 22770, M: 46530, L: 62810 },
    },
    {
      rango: "31 a 45 años",
      edadMin: 31,
      edadMax: 45,
      anual: { S: 240900, M: 491700, L: 683100 },
      mensual: { S: 24090, M: 49170, L: 68310 },
    },
    {
      rango: "46 a 65 años",
      edadMin: 46,
      edadMax: 65,
      anual: { S: 290400, M: 605000, L: 800800 },
      mensual: { S: 29040, M: 60500, L: 80080 },
    },
    {
      rango: "Mayor a 65 años",
      edadMin: 66,
      edadMax: 200,
      anual: { S: 350900, M: 657800, L: 964700 },
      mensual: { S: 35090, M: 65780, L: 96470 },
    },
  ],

  // TODO: reemplazar cada "#" por el link de pago real (Wompi/PayU/pasarela Kiddo) por plan y periodicidad.
  // La plataforma NO captura datos de tarjeta/cuenta: estos botones deben llevar a una pasarela externa.
  enlacesPago: {
    S: { anual: "#", mensual: "#" },
    M: { anual: "#", mensual: "#" },
    L: { anual: "#", mensual: "#" },
  },

  // TODO: endpoint donde se enviará la solicitud diligenciada (Airtable / HubSpot / backend Kiddo).
  // Mientras no exista, el formulario guarda la solicitud en localStorage y permite descargarla/imprimirla.
  formEndpoint: "",
};

function kiddoFormatCOP(valor) {
  return "$" + Math.round(valor).toLocaleString("es-CO");
}

function kiddoCalcularEdad(fechaNacimientoISO) {
  if (!fechaNacimientoISO) return null;
  const hoy = new Date();
  const nac = new Date(fechaNacimientoISO);
  if (isNaN(nac.getTime())) return null;
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
}

function kiddoTarifaPorEdad(edad) {
  if (edad === null) return null;
  return KIDDO.tarifas.find((t) => edad >= t.edadMin && edad <= t.edadMax) || null;
}

function kiddoEsElegible(edad) {
  return (
    edad !== null &&
    edad >= KIDDO.elegibilidad.edadIngresoMin &&
    edad <= KIDDO.elegibilidad.edadIngresoMax
  );
}

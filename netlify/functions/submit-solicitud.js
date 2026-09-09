// Recibe la solicitud diligenciada en solicitud.html y la escribe en Airtable.
// El token de Airtable vive SOLO en la variable de entorno AIRTABLE_TOKEN de Netlify
// (Site configuration → Environment variables) — nunca se expone al navegador.

const BASE_ID = "appj3Qn5rvkYVzvNA";
const TABLE_ID = "tblv034L9VKDs8Fb6"; // Tabla "Solicitudes"

const PLAN_LABELS = { S: "S - Esencial", M: "M - Integral", L: "L - Premium" };
const PERIODO_LABELS = { mensual: "Mensual", anual: "Anual" };

function limpiar(fields) {
  Object.keys(fields).forEach((key) => {
    if (fields[key] === undefined || fields[key] === null || fields[key] === "") {
      delete fields[key];
    }
  });
  return fields;
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.error("Falta configurar AIRTABLE_TOKEN en las variables de entorno de Netlify.");
    return { statusCode: 500, body: JSON.stringify({ error: "server_not_configured" }) };
  }

  let datos;
  try {
    datos = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "invalid_json" }) };
  }

  const beneficiario = (datos.beneficiarios && datos.beneficiarios[0]) || {};

  const fields = limpiar({
    Folio: datos.folio,
    "Fecha de envío": datos.fechaEnvio,
    Estado: "Nueva",
    Plan: PLAN_LABELS[datos.plan],
    Periodicidad: PERIODO_LABELS[datos.periodo],
    "Prima estimada": datos.prima,
    "Tomador - Nombre": datos.tomadorNombre,
    "Tomador es Asegurado": datos.tomadorEsAsegurado === "on",
    "Asegurado - Nombre": datos.aseguradoNombre,
    "Asegurado - Tipo Documento": datos.tipoDocumento,
    "Asegurado - No. Documento": datos.numeroDocumento,
    "Asegurado - Fecha Nacimiento": datos.fechaNacimiento,
    "Asegurado - Edad": datos.edadAsegurado,
    "Asegurado - Fecha Expedición": datos.fechaExpedicion,
    "Asegurado - Sexo": datos.sexo,
    "Asegurado - Celular": datos.telefonoCelular,
    "Asegurado - Teléfono Oficina": datos.telefonoOficina,
    "Asegurado - Correo": datos.correo,
    "Asegurado - Ocupación": datos.ocupacion,
    "Asegurado - Ciudad": datos.ciudad,
    "Asegurado - Departamento": datos.departamento,
    "Asegurado - Dirección": datos.direccion,
    "Beneficiario - Nombre": beneficiario.nombre,
    "Beneficiario - Parentesco": beneficiario.parentesco,
    "Beneficiario - %": beneficiario.porcentaje,
    "Autorización Ley 1581": datos.autDatos === "on",
    "Declaración Veraz": datos.declaracionVeraz === "on",
    "Código Producto": datos.producto && datos.producto.codigoProducto,
    Oferta: datos.producto && datos.producto.oferta,
    Compañía: datos.producto && datos.producto.compania,
    "Código Agente": datos.producto && datos.producto.codigoAgente,
  });

  try {
    const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Airtable respondió con error:", res.status, errText);
      return { statusCode: 502, body: JSON.stringify({ error: "airtable_error" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    console.error("Error de red al llamar a Airtable:", e);
    return { statusCode: 500, body: JSON.stringify({ error: "network_error" }) };
  }
};

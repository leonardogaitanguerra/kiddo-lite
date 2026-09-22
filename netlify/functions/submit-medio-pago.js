// Recibe el medio de pago elegido en la pantalla de confirmación y actualiza el
// registro de la solicitud en Airtable. NO recibe ni procesa datos de tarjeta:
// para tarjeta solo se guarda la elección del medio, las instrucciones de pago
// se envían por correo junto con la firma de la solicitud.

const BASE_ID = "appj3Qn5rvkYVzvNA";
const TABLE_ID = "tblv034L9VKDs8Fb6"; // Tabla "Solicitudes"

const MEDIO_LABELS = {
  ahorro: "Débito cuenta de ahorro",
  corriente: "Débito cuenta corriente",
  tarjeta: "Tarjeta de crédito/débito",
};

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

  if (!datos.recordId) {
    return { statusCode: 400, body: JSON.stringify({ error: "missing_record_id" }) };
  }

  const fields = limpiar({
    "Medio de Pago": MEDIO_LABELS[datos.medioPago],
    "Número de Cuenta": datos.medioPago !== "tarjeta" ? datos.numeroCuenta : undefined,
    "Entidad Bancaria": datos.medioPago !== "tarjeta" ? datos.entidadBancaria : undefined,
  });

  try {
    const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${datos.recordId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields, typecast: true }),
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

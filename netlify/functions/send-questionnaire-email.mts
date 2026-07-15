import type { Context, Config } from "@netlify/functions";

const NOTIFY_EMAIL = "info@avantyservices.com";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { pdfBase64, fileNum, dba, legalName, contactEmail, lang } = await req.json();

    if (!pdfBase64 || !fileNum) {
      return new Response(JSON.stringify({ error: "Faltan datos (pdfBase64 o fileNum)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY no configurada" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const isEs = lang !== "en";
    const subject = isEs
      ? `Cuestionario ABC recibido — ${fileNum}${legalName ? " — " + legalName : ""}`
      : `ABC Questionnaire received — ${fileNum}${legalName ? " — " + legalName : ""}`;

    const htmlBody = `
      <div style="font-family:Arial,sans-serif;color:#2B2420;max-width:560px;margin:0 auto;">
        <div style="background:#8B1A1A;padding:20px;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;margin:0;font-size:18px;">Avanty Services</h2>
          <p style="color:#E8D9B0;margin:4px 0 0;font-size:13px;">
            ${isEs ? "Cuestionario de Transferencia de Licencia (ABC)" : "Alcohol License Transfer Questionnaire (ABC)"}
          </p>
        </div>
        <div style="padding:20px;border:1px solid #E6DFD3;border-top:none;border-radius:0 0 8px 8px;">
          <p style="font-size:14px;line-height:1.6;">
            ${isEs ? "Se recibió un nuevo cuestionario. El PDF completo va adjunto a este correo." : "A new questionnaire was received. The full PDF is attached to this email."}
          </p>
          <table style="font-size:13px;width:100%;border-collapse:collapse;margin-top:12px;">
            <tr><td style="padding:4px 0;color:#6b5f55;">${isEs ? "Expediente" : "File #"}</td><td style="padding:4px 0;font-weight:bold;">${fileNum}</td></tr>
            ${dba ? `<tr><td style="padding:4px 0;color:#6b5f55;">DBA</td><td style="padding:4px 0;">${dba}</td></tr>` : ""}
            ${legalName ? `<tr><td style="padding:4px 0;color:#6b5f55;">${isEs ? "Nombre legal" : "Legal name"}</td><td style="padding:4px 0;">${legalName}</td></tr>` : ""}
            ${contactEmail ? `<tr><td style="padding:4px 0;color:#6b5f55;">${isEs ? "Correo de contacto" : "Contact email"}</td><td style="padding:4px 0;">${contactEmail}</td></tr>` : ""}
          </table>
        </div>
      </div>
    `;

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Avanty Services <cuestionarios@avantyservices.com>",
        to: [NOTIFY_EMAIL],
        subject,
        html: htmlBody,
        attachments: [
          {
            filename: `Cuestionario-ABC-${fileNum}.pdf`,
            content: pdfBase64,
          },
        ],
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      return new Response(JSON.stringify({ error: "Resend error", detail: resendData }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: resendData.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config: Config = {
  path: "/api/send-questionnaire-email",
};

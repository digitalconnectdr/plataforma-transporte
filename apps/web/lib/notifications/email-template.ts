// ── Template HTML para emails (compatible con clientes de correo) ─────────────
// Layout de tablas + estilos inline. Tema Silent Luxury: fondo oscuro,
// acento champagne gold, tipografía serif en el header.

const GOLD = '#e9c176'
const DARK = '#141313'

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Envuelve el cuerpo de texto del template en un email HTML con la marca.
 * Conserva los saltos de línea del template original.
 */
export function wrapEmailHtml(opts: {
  body: string
  companyName?: string | null
  heading?: string | null
}): string {
  const bodyHtml = escapeHtml(opts.body).replace(/\n/g, '<br/>')
  const brand = opts.companyName ? escapeHtml(opts.companyName) : 'LuxeRide'
  const heading = opts.heading ? escapeHtml(opts.heading) : null

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:#f4f2ee;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f2ee;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:${DARK};border-radius:16px 16px 0 0;padding:28px 36px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" align="center">
                <tr>
                  <td style="width:34px;height:34px;background-color:${GOLD};border-radius:50%;text-align:center;vertical-align:middle;font-family:Georgia,serif;font-weight:bold;font-size:16px;color:#1d1d1f;">L</td>
                  <td style="padding-left:12px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#ffffff;letter-spacing:0.5px;">${brand}</td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};">
                Premium Ground Transportation
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:36px;border-left:1px solid #e8e4dc;border-right:1px solid #e8e4dc;">
              ${heading ? `<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:600;color:#1d1d1f;">${heading}</h1>` : ''}
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#3a3a3c;">
                ${bodyHtml}
              </p>
            </td>
          </tr>

          <!-- Divider gold -->
          <tr>
            <td style="background-color:#ffffff;border-left:1px solid #e8e4dc;border-right:1px solid #e8e4dc;padding:0 36px;">
              <div style="height:1px;background-color:${GOLD};opacity:0.4;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#ffffff;border-radius:0 0 16px 16px;border:1px solid #e8e4dc;border-top:none;padding:22px 36px;text-align:center;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8e8e93;line-height:1.6;">
                Este es un mensaje automático de ${brand}.<br/>
                <span style="color:#b0a890;">LuxeRide — Powered by JPRS Digital Connect</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

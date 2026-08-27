/**
 * Plantillas de correo por defecto.
 *
 * Las plantillas se leen de la colección `templates`, así que Carmen puede
 * editarlas desde el panel sin tocar código. Estas son las que se usan la
 * primera vez, y sirven de red por si alguien borra una.
 */

export interface Plantilla {
  subject: string;
  html: string;
  descripcion: string;
}

const ENVOLTORIO = (contenido: string) => `
<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;color:#2E2A26;background:#F2EBE1">
  <p style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#B0592B;margin:0 0 24px">
    Veta · Estudio Creativo
  </p>
  ${contenido}
  <hr style="border:none;border-top:1px solid #E3D5C4;margin:32px 0" />
  <p style="font-size:12px;color:#6B635B;margin:0">
    Veta Estudio Creativo · Sevilla
  </p>
</div>`;

const RESUMEN = (filas: string) => `
  <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6B635B;margin:32px 0 8px">
    Resumen de tu solicitud
  </p>
  <table style="width:100%;border-collapse:collapse">${filas}</table>`;

const FILA = (etiqueta: string, valor: string) => `
  <tr>
    <td style="padding:8px 12px 8px 0;color:#6B635B;font-size:13px;vertical-align:top;width:35%">${etiqueta}</td>
    <td style="padding:8px 0;font-size:14px">${valor}</td>
  </tr>`;

export const PLANTILLAS: Record<string, Plantilla> = {
  'admin-password': {
    descripcion: 'Enlace para ponerse una contraseña nueva. Se envía desde Administradoras.',
    subject: 'Cambia tu contraseña de acceso · Veta',
    html: ENVOLTORIO(`
      <h1 style="font-size:22px;font-weight:normal;margin:0 0 16px">Hola, {{nombre}}</h1>
      <p>Se ha pedido un cambio de contraseña para tu acceso al panel de Veta. Pulsa el botón y
      elige una nueva.</p>
      <p style="margin:24px 0">
        <a href="{{enlace}}" style="display:inline-block;padding:14px 28px;background:#B0592B;color:#F2EBE1;text-decoration:none;border-radius:4px">
          Elegir contraseña nueva
        </a>
      </p>
      <p style="font-size:13px;color:#6B635B">
        El enlace caduca y solo se puede usar una vez. Si no has sido tú, avisa a la otra
        administradora: no hace falta que hagas nada más, tu contraseña actual sigue funcionando.
      </p>
    `),
  },

  'solicitud-veta': {
    descripcion: 'Aviso interno cuando llega una solicitud de presupuesto.',
    subject: 'Nueva solicitud de {{tipo}}{{#if piezas}} · {{piezas}}{{/if}} · {{nombre}}',
    html: ENVOLTORIO(`
      <h1 style="font-size:22px;font-weight:normal;margin:0 0 16px">Nueva solicitud de {{tipo}}</h1>
      {{#if piezas}}
        <p style="padding:12px 16px;background:#E3D5C4;border-radius:4px;margin:0 0 16px">
          <strong>Piden:</strong> {{piezas}}
        </p>
      {{/if}}
      <p><strong>{{nombre}}</strong><br />{{email}}<br />{{telefono}}</p>
      {{{respuestasHtml}}}
      <p style="font-size:13px;color:#6B635B">Contesta directamente a este correo para responderle.</p>
    `),
  },

  'solicitud-cliente': {
    descripcion: 'Acuse de recibo para quien pide un presupuesto. Le devuelve lo que nos ha contado.',
    subject: 'Hemos recibido tu solicitud de {{tipo}} · Veta',
    html: ENVOLTORIO(`
      <h1 style="font-size:22px;font-weight:normal;margin:0 0 16px">Gracias, {{nombre}}</h1>
      <p>Hemos recibido tu solicitud de <strong>{{tipo}}</strong> y la estamos mirando con calma.</p>
      <p>Te escribiremos en los próximos días con un presupuesto a medida. Si necesitas contarnos
      algo más mientras tanto, responde a este correo.</p>
      ${RESUMEN(`
        ${FILA('Sobre', '{{tipo}}')}
        {{#if piezas}}${FILA('Piezas', '{{piezas}}')}{{/if}}
        ${FILA('A nombre de', '{{nombre}}')}
        ${FILA('Correo', '{{email}}')}
        ${FILA('Teléfono', '{{telefono}}')}
      `)}
      {{#if respuestasHtml}}
        <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6B635B;margin:32px 0 8px">
          Lo que nos has contado
        </p>
        {{{respuestasHtml}}}
      {{/if}}
      <p style="font-size:13px;color:#6B635B">
        Si ves algo mal en estos datos, responde a este correo y lo corregimos.
      </p>
    `),
  },

  'reserva-veta': {
    descripcion: 'Aviso interno cuando alguien pide plaza en un taller o un bono.',
    subject: 'Nueva reserva · {{nombre}} · {{taller}}',
    html: ENVOLTORIO(`
      <h1 style="font-size:22px;font-weight:normal;margin:0 0 16px">Nueva solicitud de reserva</h1>
      <p><strong>{{taller}}</strong>{{#if fecha}}<br />{{fecha}}{{/if}}</p>
      <p><strong>{{nombre}}</strong> · {{nPersonas}} persona(s)<br />{{email}}<br />{{telefono}}</p>
      {{{respuestasHtml}}}
      <p style="font-size:13px;color:#6B635B">
        Recuerda: la plaza no se descuenta hasta que la confirmes desde el panel.
      </p>
    `),
  },

  'reserva-cliente': {
    descripcion: 'Acuse de recibo de una solicitud de plaza. Todavía no está confirmada.',
    subject: 'Hemos recibido tu solicitud de plaza · {{taller}}',
    html: ENVOLTORIO(`
      <h1 style="font-size:22px;font-weight:normal;margin:0 0 16px">Gracias, {{nombre}}</h1>
      <p>Hemos recibido tu solicitud de <strong>{{nPersonas}} plaza(s)</strong> para
      <strong>{{taller}}</strong>{{#if fecha}} el {{fecha}}{{/if}}.</p>
      <p style="padding:16px;background:#E3D5C4;border-radius:4px">
        <strong>Tu plaza todavía no está reservada.</strong> Te escribiremos en breve para
        confirmártela y contarte cómo hacer el pago.
      </p>
      ${RESUMEN(`
        ${FILA('{{etiqueta}}', '{{taller}}')}
        {{#if fecha}}${FILA('Fecha', '{{fecha}}')}{{/if}}
        ${FILA('Personas', '{{nPersonas}}')}
        ${FILA('A nombre de', '{{nombre}}')}
        ${FILA('Correo', '{{email}}')}
        ${FILA('Teléfono', '{{telefono}}')}
      `)}
      {{#if respuestasHtml}}
        <p style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6B635B;margin:32px 0 8px">
          Lo que nos has contado
        </p>
        {{{respuestasHtml}}}
      {{/if}}
      <p style="font-size:13px;color:#6B635B">
        Si ves algo mal en estos datos, responde a este correo y lo corregimos.
      </p>
    `),
  },

  'reserva-confirmada': {
    descripcion: 'Se envía al confirmar una reserva desde el panel. Lleva las instrucciones de pago.',
    subject: '¡Plaza confirmada! · {{taller}}',
    html: ENVOLTORIO(`
      <h1 style="font-size:22px;font-weight:normal;margin:0 0 16px">Tu plaza está confirmada</h1>
      <p>{{nombre}}, ya tienes tu sitio en <strong>{{taller}}</strong>{{#if fecha}} el {{fecha}}{{/if}}.</p>
      <p><strong>{{nPersonas}} persona(s)</strong> · {{importe}} € en total</p>
      <p style="padding:16px;background:#E3D5C4;border-radius:4px">
        Puedes pagar en el estudio el mismo día o por Bizum antes. Escríbenos y te pasamos el número.
      </p>
      <p>Si al final no puedes venir, avísanos con tiempo para poder ofrecer la plaza a otra persona.</p>
    `),
  },

  'reserva-cancelada': {
    descripcion: 'Se envía si se cancela una reserva desde el panel.',
    subject: 'Tu reserva ha sido cancelada · Veta',
    html: ENVOLTORIO(`
      <h1 style="font-size:22px;font-weight:normal;margin:0 0 16px">Reserva cancelada</h1>
      <p>{{nombre}}, hemos cancelado tu reserva de <strong>{{taller}}</strong>.</p>
      <p>Si ha sido un error o quieres cambiar de fecha, responde a este correo y lo arreglamos.</p>
    `),
  },
};

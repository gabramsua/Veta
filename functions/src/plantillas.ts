/**
 * Plantillas de correo por defecto.
 *
 * La extensión Trigger Email lee las plantillas de la colección `templates`,
 * así que Carmen puede editarlas desde el panel sin tocar código. Estas son las
 * que se usan la primera vez, y sirven de red por si alguien borra una.
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

export const PLANTILLAS: Record<string, Plantilla> = {
  'solicitud-veta': {
    descripcion: 'Aviso interno cuando llega una solicitud de presupuesto.',
    subject: 'Nueva solicitud de {{tipo}} · {{nombre}}',
    html: ENVOLTORIO(`
      <h1 style="font-size:22px;font-weight:normal;margin:0 0 16px">Nueva solicitud de {{tipo}}</h1>
      <p><strong>{{nombre}}</strong><br />{{email}}<br />{{telefono}}</p>
      {{{respuestasHtml}}}
      <p style="font-size:13px;color:#6B635B">Contesta directamente a este correo para responderle.</p>
    `),
  },

  'solicitud-cliente': {
    descripcion: 'Acuse de recibo para quien pide un presupuesto.',
    subject: 'Hemos recibido tu solicitud · Veta',
    html: ENVOLTORIO(`
      <h1 style="font-size:22px;font-weight:normal;margin:0 0 16px">Gracias, {{nombre}}</h1>
      <p>Hemos recibido tu solicitud y la estamos mirando con calma.</p>
      <p>Te escribiremos en los próximos días con un presupuesto a medida. Si necesitas contarnos
      algo más mientras tanto, responde a este correo.</p>
    `),
  },

  'reserva-veta': {
    descripcion: 'Aviso interno cuando alguien pide plaza en un taller o un bono.',
    subject: 'Nueva reserva · {{nombre}} · {{taller}}',
    html: ENVOLTORIO(`
      <h1 style="font-size:22px;font-weight:normal;margin:0 0 16px">Nueva solicitud de reserva</h1>
      <p><strong>{{taller}}</strong><br />{{fecha}}</p>
      <p><strong>{{nombre}}</strong> · {{nPersonas}} persona(s)<br />{{email}}<br />{{telefono}}</p>
      {{{respuestasHtml}}}
      <p style="font-size:13px;color:#6B635B">
        Recuerda: la plaza no se descuenta hasta que la confirmes desde el panel.
      </p>
    `),
  },

  'reserva-cliente': {
    descripcion: 'Acuse de recibo de una solicitud de plaza. Todavía no está confirmada.',
    subject: 'Hemos recibido tu solicitud de plaza · Veta',
    html: ENVOLTORIO(`
      <h1 style="font-size:22px;font-weight:normal;margin:0 0 16px">Gracias, {{nombre}}</h1>
      <p>Hemos recibido tu solicitud para <strong>{{taller}}</strong>{{#if fecha}} el {{fecha}}{{/if}}.</p>
      <p style="padding:16px;background:#E3D5C4;border-radius:4px">
        <strong>Tu plaza todavía no está reservada.</strong> Te escribiremos en breve para
        confirmártela y contarte cómo hacer el pago.
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

import { DOCUMENT, isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { DatosContacto, RedesSociales } from '../models';

export interface DatosSeo {
  titulo: string;
  descripcion: string;
  ruta: string;
  imagen?: string;
  tipo?: 'website' | 'article';
  noIndex?: boolean;
}

const ID_JSONLD = 'veta-datos-estructurados';
const NOMBRE = 'Veta · Estudio Creativo';

/**
 * Dónde trabajan, para el `areaServed` de la ficha del negocio.
 *
 * Son los municipios del área de Sevilla donde de verdad hacen bodas, no una
 * lista larga para aparecer en todas partes: declarar zonas en las que no se
 * trabaja no engaña a Google y sí a quien llame desde allí.
 */
const ZONAS_DE_SERVICIO = [
  'Sevilla',
  'Dos Hermanas',
  'Alcalá de Guadaíra',
  'Mairena del Aljarafe',
  'Tomares',
  'Bormujos',
  'Carmona',
  'Utrera',
];

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly documento = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly esServidor = isPlatformServer(inject(PLATFORM_ID));

  // El dominio definitivo aún no está decidido (pendientes C3). Mientras tanto
  // se deduce del propio navegador, y en servidor se usa el de Hosting.
  private get origen(): string {
    if (this.esServidor) return 'https://veta-estudio-creativo.web.app';
    return this.documento.location.origin;
  }

  aplicar(datos: DatosSeo): void {
    const url = `${this.origen}${datos.ruta}`;
    // Imagen por defecto al compartir: 1200x630, que es lo que esperan WhatsApp
    // y las redes. El logotipo suelto es demasiado apaisado y se recorta mal.
    const imagen = datos.imagen ?? `${this.origen}/assets/marca/veta-og.png`;

    this.title.setTitle(datos.titulo);

    this.meta.updateTag({ name: 'description', content: datos.descripcion });
    this.meta.updateTag({
      name: 'robots',
      content: datos.noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    });

    this.meta.updateTag({ property: 'og:title', content: datos.titulo });
    this.meta.updateTag({ property: 'og:description', content: datos.descripcion });
    this.meta.updateTag({ property: 'og:type', content: datos.tipo ?? 'website' });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: imagen });
    this.meta.updateTag({ property: 'og:site_name', content: NOMBRE });
    this.meta.updateTag({ property: 'og:locale', content: 'es_ES' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: datos.titulo });
    this.meta.updateTag({ name: 'twitter:description', content: datos.descripcion });
    this.meta.updateTag({ name: 'twitter:image', content: imagen });

    this.canonical(url);
  }

  private canonical(url: string): void {
    const cabeza = this.documento.head;
    let enlace = cabeza.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!enlace) {
      enlace = this.documento.createElement('link');
      enlace.setAttribute('rel', 'canonical');
      cabeza.appendChild(enlace);
    }

    enlace.setAttribute('href', url);
  }

  // Un solo bloque JSON-LD por página: se reemplaza en cada navegación para no
  // acumular datos de rutas anteriores.
  datosEstructurados(datos: object | object[] | null): void {
    const cabeza = this.documento.head;
    const anterior = this.documento.getElementById(ID_JSONLD);

    anterior?.remove();

    if (!datos) return;

    const script = this.documento.createElement('script');
    script.id = ID_JSONLD;
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(datos);
    cabeza.appendChild(script);
  }

  /**
   * La ficha del negocio, que es la pieza que sostiene el SEO local.
   *
   * Google la cruza con el Perfil de Empresa para decidir si la web y la ficha
   * del mapa son el mismo negocio. Por eso el nombre, la dirección y el teléfono
   * que salen aquí tienen que ser **idénticos** a los de la ficha, letra por
   * letra: es lo que en SEO local llaman NAP consistente, y es más determinante
   * que cualquier palabra clave que metamos en un título.
   *
   * Todo sale de `settings/site`, editable desde el panel, para que cuando
   * cambien el teléfono no haya que desplegar.
   */
  negocioLocal(contacto: DatosContacto, redes?: RedesSociales): object {
    const perfiles = Object.values(redes ?? {}).filter((url) => url.trim().length > 0);

    // El valor de partida de `direccion` es «Sevilla», que es la ciudad y no una
    // calle. Mandarlo como `streetAddress` sería decirle a Google que el estudio
    // está en la calle Sevilla de Sevilla. Hasta que pongan la dirección real,
    // mejor no decir nada.
    const calle = contacto.direccion.trim();
    const esCalle = calle.length > 0 && calle.toLowerCase() !== 'sevilla';

    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      // Un identificador estable permite referenciar el negocio desde otros
      // bloques (los talleres, sin ir más lejos) en vez de repetir la ficha.
      '@id': `${this.origen}/#negocio`,
      name: NOMBRE,
      description:
        'Estudio creativo en Sevilla. Papelería de bodas, acuarela en directo y talleres de cerámica y pintura.',
      url: this.origen,
      image: `${this.origen}/assets/marca/veta-og.png`,
      logo: `${this.origen}/assets/marca/veta-logo.png`,
      email: contacto.email || undefined,
      telephone: contacto.telefono || undefined,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Sevilla',
        addressRegion: 'Sevilla',
        addressCountry: 'ES',
        streetAddress: esCalle ? calle : undefined,
      },
      openingHours: contacto.horario || undefined,
      // Los talleres son presenciales, pero la papelería y los encargos se
      // mandan, así que la zona no se limita a la ciudad.
      areaServed: ZONAS_DE_SERVICIO.map((nombre) => ({ '@type': 'City', name: nombre })),
      sameAs: perfiles.length > 0 ? perfiles : undefined,
      priceRange: '€€',
      currenciesAccepted: 'EUR',
    };
  }

  /**
   * Migas de pan para las páginas que cuelgan de otra.
   *
   * Google las usa para sustituir la URL cruda del resultado por la ruta legible
   * («Veta › Papelería de bodas › Invitaciones»), que se lee mejor y se pulsa
   * más. La home no lleva: una miga de un solo nivel no dice nada.
   */
  migasDePan(ruta: { nombre: string; url: string }[]): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: ruta.map((paso, indice) => ({
        '@type': 'ListItem',
        position: indice + 1,
        name: paso.nombre,
        item: `${this.origen}${paso.url}`,
      })),
    };
  }

  eventoTaller(datos: {
    nombre: string;
    descripcion: string;
    inicio: Date;
    fin: Date;
    precio: number;
    plazasLibres: number;
    ruta: string;
  }): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: datos.nombre,
      description: datos.descripcion,
      startDate: datos.inicio.toISOString(),
      endDate: datos.fin.toISOString(),
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      eventStatus: 'https://schema.org/EventScheduled',
      location: {
        '@type': 'Place',
        name: NOMBRE,
        address: { '@type': 'PostalAddress', addressLocality: 'Sevilla', addressCountry: 'ES' },
      },
      organizer: { '@type': 'Organization', name: NOMBRE, url: this.origen },
      offers: {
        '@type': 'Offer',
        price: datos.precio,
        priceCurrency: 'EUR',
        url: `${this.origen}${datos.ruta}`,
        availability:
          datos.plazasLibres > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/SoldOut',
      },
    };
  }
}

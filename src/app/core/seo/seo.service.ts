import { DOCUMENT, isPlatformServer } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

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

  negocioLocal(contacto: { email: string; telefono: string; direccion: string }): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: NOMBRE,
      description:
        'Estudio creativo en Sevilla. Papelería de bodas, acuarela en directo y talleres presenciales.',
      url: this.origen,
      image: `${this.origen}/assets/marca/veta-og.png`,
      email: contacto.email || undefined,
      telephone: contacto.telefono || undefined,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Sevilla',
        addressCountry: 'ES',
        streetAddress: contacto.direccion || undefined,
      },
      areaServed: 'Sevilla',
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

import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Observable, catchError, map, of } from 'rxjs';
import { isPlatformServer } from '@angular/common';

import { Imagen, Pagina } from '../models';
import { leerDocumento } from './lectura-ssr';
import { EstiloTexto, estilosPorDefecto, textosPorDefecto } from './textos';

@Injectable({ providedIn: 'root' })
export class PaginasService {
  private readonly firestore = inject(Firestore);
  private readonly esServidor = isPlatformServer(inject(PLATFORM_ID));

  // Si el documento no existe todavía, se devuelven los textos por defecto del
  // catálogo. La web nunca depende de que alguien haya entrado antes al panel.
  textos(slug: string): Observable<Record<string, string>> {
    return leerDocumento(this.firestore, `pages/${slug}`, this.esServidor).pipe(
      map((datos) => ({
        ...textosPorDefecto(slug),
        ...((datos as Partial<Pagina> | undefined)?.textos ?? {}),
      })),
      catchError(() => of(textosPorDefecto(slug))),
    );
  }

  /**
   * Qué familia tipográfica usa cada texto.
   *
   * Igual que con los textos, lo guardado pisa al catálogo y lo que falte cae
   * en el valor por defecto, para que una página que nadie ha tocado se vea
   * como la diseñamos.
   */
  estilos(slug: string): Observable<Record<string, EstiloTexto>> {
    return leerDocumento(this.firestore, `pages/${slug}`, this.esServidor).pipe(
      map((datos) => ({
        ...estilosPorDefecto(slug),
        ...(((datos as Partial<Pagina> | undefined)?.estilos ?? {}) as Record<string, EstiloTexto>),
      })),
      catchError(() => of(estilosPorDefecto(slug))),
    );
  }

  seo(slug: string): Observable<{ title: string; description: string; ogImage: string }> {
    return leerDocumento(this.firestore, `pages/${slug}`, this.esServidor).pipe(
      map((datos) => {
        const seo = (datos as Partial<Pagina> | undefined)?.seo;
        return {
          title: seo?.title ?? '',
          description: seo?.description ?? '',
          ogImage: seo?.ogImage ?? '',
        };
      }),
      catchError(() => of({ title: '', description: '', ogImage: '' })),
    );
  }

  imagenes(slug: string): Observable<Record<string, Imagen>> {
    return leerDocumento(this.firestore, `pages/${slug}`, this.esServidor).pipe(
      map((datos) => ((datos as Partial<Pagina> | undefined)?.imagenes ?? {}) as Record<string, Imagen>),
      catchError(() => of({} as Record<string, Imagen>)),
    );
  }

  async guardar(
    slug: string,
    textos: Record<string, string>,
    imagenes: Record<string, Imagen>,
    seo: { title: string; description: string; ogImage: string },
    estilos: Record<string, EstiloTexto>,
  ): Promise<void> {
    await setDoc(
      doc(this.firestore, 'pages', slug),
      { textos, imagenes, seo, estilos },
      { merge: true },
    );
  }
}

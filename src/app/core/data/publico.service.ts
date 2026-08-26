import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map } from 'rxjs';

import {
  BonosService,
  FaqsService,
  FrasesService,
  PortfolioService,
  ProductosService,
  SesionesService,
  TalleresService,
} from './contenido.services';
import { Bono, Faq, Frase, PiezaPortfolio, Producto, Sesion, Taller } from '../models';
import { Cierre, CierresService, estaBloqueado } from './vacaciones.service';

export interface SesionConTaller {
  sesion: Sesion;
  taller: Taller;
  plazasLibres: number;
}

/**
 * Lecturas para la parte pública.
 *
 * El filtro de «activo» se hace en memoria en lugar de en la consulta: son
 * colecciones pequeñas, y así no hacen falta índices compuestos en Firestore
 * para cada combinación de filtros.
 *
 * De elegir entre listener y lectura suelta según el entorno se encarga
 * `ColeccionBase`, que es donde importa para que el renderizado en servidor no
 * se quede esperando.
 */
@Injectable({ providedIn: 'root' })
export class PublicoService {
  private readonly talleres = inject(TalleresService);
  private readonly sesiones = inject(SesionesService);
  private readonly bonos = inject(BonosService);
  private readonly productos = inject(ProductosService);
  private readonly portfolio = inject(PortfolioService);
  private readonly faqs = inject(FaqsService);
  private readonly frases = inject(FrasesService);
  private readonly cierres = inject(CierresService);

  talleresActivos(): Observable<Taller[]> {
    return this.talleres.listarOrdenados().pipe(map((lista) => lista.filter((t) => t.activo)));
  }

  bonosActivos(): Observable<Bono[]> {
    return this.bonos.listarOrdenados().pipe(map((lista) => lista.filter((b) => b.activo)));
  }

  productosActivos(): Observable<Producto[]> {
    return this.productos.listarOrdenados().pipe(map((lista) => lista.filter((p) => p.activo)));
  }

  portfolioDe(seccion: string): Observable<PiezaPortfolio[]> {
    return this.portfolio
      .listarOrdenado()
      .pipe(map((lista) => lista.filter((p) => p.activo && p.seccion === seccion)));
  }

  faqsActivas(): Observable<Faq[]> {
    return this.faqs.listarOrdenadas().pipe(map((lista) => lista.filter((f) => f.activa)));
  }

  frasesActivas(): Observable<Frase[]> {
    return this.frases.listarOrdenadas().pipe(map((lista) => lista.filter((f) => f.activa)));
  }

  // Próximas sesiones, ya emparejadas con su taller para no tener que cruzarlas
  // en cada plantilla. Las fechas que caen en vacaciones no se ofrecen.
  proximasSesiones(limite = 0): Observable<SesionConTaller[]> {
    return combinarSesiones(
      this.sesiones.listarPorFecha(),
      this.talleres.listarOrdenados(),
      this.cierres.listar(),
      limite,
    );
  }

  sesion(id: string): Observable<Sesion | undefined> {
    return this.sesiones.obtener(id);
  }

  taller(id: string): Observable<Taller | undefined> {
    return this.talleres.obtener(id);
  }

  bono(id: string): Observable<Bono | undefined> {
    return this.bonos.obtener(id);
  }
}

function combinarSesiones(
  sesiones$: Observable<Sesion[]>,
  talleres$: Observable<Taller[]>,
  cierres$: Observable<Cierre[]>,
  limite: number,
): Observable<SesionConTaller[]> {
  return combineLatest([sesiones$, talleres$, cierres$]).pipe(
    map(([sesiones, talleres, cierres]) => {
      const ahora = Date.now();
      const porId = new Map(talleres.map((t) => [t.id, t]));

      const resultado = sesiones
        .filter((s) => s.activa && s.fechaInicio.toMillis() >= ahora)
        .map((sesion) => {
          const taller = porId.get(sesion.workshopId);
          if (!taller || !taller.activo) return null;
          if (estaBloqueado(cierres, sesion.workshopId, sesion.fechaInicio, sesion.fechaFin)) {
            return null;
          }

          return {
            sesion,
            taller,
            plazasLibres: Math.max(0, sesion.plazasTotales - sesion.plazasConfirmadas),
          };
        })
        .filter((x): x is SesionConTaller => x !== null);

      return limite > 0 ? resultado.slice(0, limite) : resultado;
    }),
  );
}

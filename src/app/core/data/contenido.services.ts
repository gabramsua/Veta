import { Injectable } from '@angular/core';
import { orderBy, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { Bono, Faq, Frase, PiezaPortfolio, Producto, Sesion, Taller } from '../models';
import { ColeccionBase } from './firestore-base';

@Injectable({ providedIn: 'root' })
export class TalleresService extends ColeccionBase<Taller> {
  protected readonly ruta = 'workshops';

  listarOrdenados(): Observable<Taller[]> {
    return this.listar(orderBy('orden'));
  }
}

@Injectable({ providedIn: 'root' })
export class SesionesService extends ColeccionBase<Sesion> {
  protected readonly ruta = 'sessions';

  listarPorFecha(): Observable<Sesion[]> {
    return this.listar(orderBy('fechaInicio'));
  }

  listarDeTaller(workshopId: string): Observable<Sesion[]> {
    return this.listar(where('workshopId', '==', workshopId), orderBy('fechaInicio'));
  }
}

@Injectable({ providedIn: 'root' })
export class BonosService extends ColeccionBase<Bono> {
  protected readonly ruta = 'bonos';

  listarOrdenados(): Observable<Bono[]> {
    return this.listar(orderBy('orden'));
  }
}

@Injectable({ providedIn: 'root' })
export class ProductosService extends ColeccionBase<Producto> {
  protected readonly ruta = 'products';

  listarOrdenados(): Observable<Producto[]> {
    return this.listar(orderBy('orden'));
  }
}

@Injectable({ providedIn: 'root' })
export class PortfolioService extends ColeccionBase<PiezaPortfolio> {
  protected readonly ruta = 'portfolio';

  listarOrdenado(): Observable<PiezaPortfolio[]> {
    return this.listar(orderBy('orden'));
  }
}

@Injectable({ providedIn: 'root' })
export class FaqsService extends ColeccionBase<Faq> {
  protected readonly ruta = 'faqs';

  listarOrdenadas(): Observable<Faq[]> {
    return this.listar(orderBy('orden'));
  }
}

@Injectable({ providedIn: 'root' })
export class FrasesService extends ColeccionBase<Frase> {
  protected readonly ruta = 'quotes';

  listarOrdenadas(): Observable<Frase[]> {
    return this.listar(orderBy('orden'));
  }
}

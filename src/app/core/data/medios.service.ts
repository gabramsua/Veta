import { Injectable, inject } from '@angular/core';
import {
  Storage,
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from '@angular/fire/storage';
import { orderBy } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { CategoriaMedio, Medio } from '../models';
import { ColeccionBase } from './firestore-base';

const MAX_IMAGEN = 10 * 1024 * 1024;
const MAX_PDF = 20 * 1024 * 1024;

export class ErrorSubida extends Error {}

@Injectable({ providedIn: 'root' })
export class MediosService extends ColeccionBase<Medio> {
  protected readonly ruta = 'media';
  private readonly storage = inject(Storage);

  listarRecientes(): Observable<Medio[]> {
    return this.listar(orderBy('createdAt', 'desc'));
  }

  async subir(archivo: File, categoriaId: string | null, alt: string): Promise<string> {
    const tipo = this.tipoDe(archivo);
    const limite = tipo === 'imagen' ? MAX_IMAGEN : MAX_PDF;

    if (archivo.size > limite) {
      throw new ErrorSubida(
        `El archivo pesa ${this.enMegas(archivo.size)} y el máximo son ${this.enMegas(limite)}.`,
      );
    }

    const medidas = tipo === 'imagen' ? await this.medirImagen(archivo) : null;
    const storagePath = `media/${crypto.randomUUID()}-${this.nombreSeguro(archivo.name)}`;
    const referencia = ref(this.storage, storagePath);

    await uploadBytes(referencia, archivo, { contentType: archivo.type });
    const url = await getDownloadURL(referencia);

    return this.crear({
      nombre: archivo.name,
      url,
      storagePath,
      tipo,
      categoriaId,
      alt,
      bytes: archivo.size,
      width: medidas?.width ?? null,
      height: medidas?.height ?? null,
    } as Omit<Medio, 'id'>);
  }

  // Primero el fichero y después el documento: si falla el borrado del binario,
  // preferimos un huérfano en Storage antes que una ficha que apunta a nada.
  async borrarConArchivo(medio: Medio): Promise<void> {
    await deleteObject(ref(this.storage, medio.storagePath)).catch(() => undefined);
    await this.borrar(medio.id);
  }

  private tipoDe(archivo: File): 'imagen' | 'pdf' {
    if (archivo.type.startsWith('image/')) return 'imagen';
    if (archivo.type === 'application/pdf') return 'pdf';
    throw new ErrorSubida('Solo se admiten imágenes y archivos PDF.');
  }

  private nombreSeguro(nombre: string): string {
    return nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.\-_]/g, '-')
      .toLowerCase();
  }

  private enMegas(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  private medirImagen(archivo: File): Promise<{ width: number; height: number } | null> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(archivo);
      const imagen = new Image();

      imagen.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: imagen.naturalWidth, height: imagen.naturalHeight });
      };

      imagen.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };

      imagen.src = url;
    });
  }
}

@Injectable({ providedIn: 'root' })
export class CategoriasMedioService extends ColeccionBase<CategoriaMedio> {
  protected readonly ruta = 'mediaCategories';

  listarOrdenadas(): Observable<CategoriaMedio[]> {
    return this.listar(orderBy('orden'));
  }
}

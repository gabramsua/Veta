import { DocumentData, Firestore, doc, docData, getDoc } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';

/**
 * Lee un documento de la forma adecuada según dónde se esté ejecutando.
 *
 * En navegador interesa un listener (`docData`): si otra administradora cambia
 * algo, la pantalla se actualiza sola.
 *
 * En servidor **no**. Un listener abre un canal permanente contra Firestore, y
 * Angular no da por terminado el renderizado hasta que la aplicación se queda
 * quieta. Con un listener abierto eso no pasa nunca, así que la petición se
 * queda esperando hasta que algo expira: de ahí que una recarga tardara casi un
 * minuto mientras que navegar dentro de la web fuera instantáneo.
 *
 * Una lectura suelta (`getDoc`) resuelve, termina, y el renderizado continúa.
 */
export function leerDocumento(
  firestore: Firestore,
  ruta: string,
  esServidor: boolean,
): Observable<DocumentData | undefined> {
  const referencia = doc(firestore, ruta);

  return esServidor
    ? from(getDoc(referencia)).pipe(map((instantanea) => instantanea.data()))
    : docData(referencia);
}

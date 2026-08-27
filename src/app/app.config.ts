import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import {
  ReCaptchaV3Provider,
  initializeAppCheck,
  provideAppCheck,
} from '@angular/fire/app-check';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

/**
 * App Check solo puede registrarse en navegador.
 *
 * `ReCaptchaV3Provider` inyecta el script de Google en el documento, así que en
 * el render de servidor lanza al no existir `window`. La aplicación no llega a
 * arrancar y Cloud Run responde 503, sin más pista que un stack en los logs.
 *
 * Se comprueba con `typeof window` y no con `isPlatformBrowser` porque este
 * array se construye al cargar el módulo, fuera de contexto de inyección.
 */
const enNavegador = typeof window !== 'undefined';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    provideClientHydration(withEventReplay()),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    // Solo se registra en navegador y si hay clave: activarlo sin ella dejaría
    // la web sin poder escribir en Firestore.
    ...(enNavegador && environment.recaptchaSiteKey
      ? [
          provideAppCheck(() =>
            initializeAppCheck(undefined, {
              provider: new ReCaptchaV3Provider(environment.recaptchaSiteKey),
              isTokenAutoRefreshEnabled: true,
            }),
          ),
        ]
      : []),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideFunctions(() => getFunctions(undefined, 'europe-west1')),
  ],
};

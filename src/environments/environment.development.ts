export const environment = {
  production: false,
  useEmulators: false,
  firebase: {
    apiKey: 'AIzaSyBfMzgNIE5j6f_Z11d_G_uULwTI0B1s_lM',
    authDomain: 'veta-estudio-creativo.firebaseapp.com',
    projectId: 'veta-estudio-creativo',
    storageBucket: 'veta-estudio-creativo.firebasestorage.app',
    messagingSenderId: '202355480982',
    appId: '1:202355480982:web:9ecc6dd56b76e7f78d65b7',
  },
  contactoFallback: 'gabramsua@gmail.com',
  // App Check protege bookings y requests frente a scripts que escriban
  // saltándose el formulario. Se activa poniendo aquí la clave de sitio de
  // reCAPTCHA v3 (Consola de Firebase → App Check). Ver pendientes.md D1.
  recaptchaSiteKey: '',
};

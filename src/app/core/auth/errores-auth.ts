const MENSAJES: Record<string, string> = {
  'auth/invalid-email': 'El correo no tiene un formato válido.',
  'auth/user-disabled': 'Esta cuenta está desactivada. Habla con la otra administradora.',
  'auth/user-not-found': 'No hay ninguna cuenta con ese correo y esa contraseña.',
  'auth/wrong-password': 'No hay ninguna cuenta con ese correo y esa contraseña.',
  'auth/invalid-credential': 'No hay ninguna cuenta con ese correo y esa contraseña.',
  'auth/too-many-requests': 'Demasiados intentos seguidos. Espera unos minutos y vuelve a probar.',
  'auth/network-request-failed': 'No hay conexión con el servidor. Revisa tu red.',
  'sin-permisos': 'Esta cuenta no tiene permisos de administración.',
};

// Firebase no distingue entre correo inexistente y contraseña incorrecta a
// propósito: revelarlo permitiría averiguar qué correos están registrados.
export function mensajeDeError(error: unknown): string {
  const codigo =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : error instanceof Error
        ? error.message
        : '';

  return MENSAJES[codigo] ?? 'No hemos podido iniciar sesión. Inténtalo de nuevo.';
}

/**
 * Cambia la contraseña de una administradora existente.
 *
 *   node scripts/reset-password.mjs
 *
 * Útil mientras no haya SMTP configurado y por tanto no exista el correo de
 * «restablecer contraseña». Necesita la misma clave de cuenta de servicio que
 * crear-admin.mjs.
 */

import { existsSync, readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const RUTA_CLAVE = process.env.CLAVE_SERVICIO ?? './clave-servicio.json';
const rl = createInterface({ input: stdin, output: stdout });

if (!existsSync(RUTA_CLAVE)) {
  console.error(`\n✗ No encuentro ${RUTA_CLAVE}. Mira las instrucciones del README.\n`);
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(readFileSync(RUTA_CLAVE, 'utf8'))) });
const auth = getAuth();

const email = (await rl.question('\n  Correo de la cuenta: ')).trim();
const usuario = await auth.getUserByEmail(email).catch(() => null);

if (!usuario) {
  console.error(`\n✗ No hay ninguna cuenta con el correo ${email}.\n`);
  rl.close();
  process.exit(1);
}

let password = '';
while (password.length < 8) {
  password = (await rl.question('  Nueva contraseña (mínimo 8 caracteres): ')).trim();
  if (password.length < 8) console.log('  ↳ Necesita al menos 8 caracteres.');
}

await auth.updateUser(usuario.uid, { password });
await auth.revokeRefreshTokens(usuario.uid);

console.log('\n  ✓ Contraseña cambiada y sesiones anteriores cerradas.\n');
rl.close();

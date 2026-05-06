import express from 'express';
import { readdirSync, statSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { join, dirname, relative, sep } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const router = express.Router();

// Recorre recursivamente buscando todos los archivos *Routes.js
function collectRouteFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectRouteFiles(full, files);
    } else if (entry.endsWith('Routes.js')) {
      files.push(full);
    }
  }
  return files;
}

// La primera carpeta dentro de routes/ determina el prefijo URL.
// Archivos en la raíz de routes/ se montan en '/'.
for (const file of collectRouteFiles(__dirname)) {
  const rel         = relative(__dirname, file); // ej: "auth/authenticateRoutes.js"
  const firstSegment = rel.split(sep)[0];        // ej: "auth"
  const prefix      = firstSegment.endsWith('Routes.js') ? '/' : `/${firstSegment}`;

  const mod = await import(pathToFileURL(file).href);
  router.use(prefix, mod.default);
}

export default router;


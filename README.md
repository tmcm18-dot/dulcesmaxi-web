# Dulces Maxi — tienda web

Clon fiel de [dulcesmaxi.base44.app](https://dulcesmaxi.base44.app) sin Base44: catálogo, carrito, pastelería por encargo, pedidos por WhatsApp y un editor de página.

Hecho con **Vite + React + TypeScript**. El contenido se guarda en el navegador (`localStorage`).

## Cómo probarlo

```bash
npm install
npm run dev
```

Abrí `http://localhost:5173`.

Build de producción:

```bash
npm run build
npm run preview
```

Para probar el editor con login real (cookie + rate limit), usá `vercel dev` con las variables de `.env.local` (ver más abajo). `npm run dev` solo sirve la tienda pública.

## Rutas

| Ruta | Qué hace |
| --- | --- |
| `/` | Inicio: portada, categorías, destacados y catálogo |
| `/product/:id` | Ficha de producto |
| `/cart` | Carrito (se guarda en este dispositivo) |
| `/checkout` | Pedido → WhatsApp |
| `/pasteleria` | Encargos de tortas, tartas y mesas dulces |
| `/privacidad` `/terminos` `/entregas` `/consumo-responsable` | Textos legales |

**`/admin` ya no existe.** Si alguien entra, va al inicio. El editor no está linkeado en el sitio ni en el sitemap.

## Editor (URL secreta)

El panel no es una ruta pública. Se entra por un path aleatorio configurado en el servidor (`ADMIN_PATH`, formato `editar-<token>`). Esa URL **no** va en el README público ni en la UI de la tienda: está en las env vars del hosting (Vercel) y se comparte por un canal privado.

Cómo entrar:

1. Abrí `https://<dominio>/<ADMIN_PATH>`
2. Completá la contraseña en el formulario (la clave **no** viaja en el JavaScript del cliente)
3. El servidor setea una cookie **httpOnly** de sesión (12 h). Después ves el mismo editor de siempre
4. **Salir** llama a `/api/admin/logout` y borra la cookie

Tras 5 contraseñas mal, hay bloqueo de 15 minutos (cookie firmada + límite por IP).

### Variables de entorno

Copiá `.env.example` a `.env.local` en desarrollo. En Vercel: Project → Settings → Environment Variables.

| Variable | Qué es |
| --- | --- |
| `ADMIN_PATH` | Path secreto **sin** `/` inicial. Obligatorio: `editar-` + 12–64 caracteres `[A-Za-z0-9_-]` |
| `ADMIN_PASSWORD_HASH` | Hash PBKDF2-SHA256. **Nunca** la contraseña en claro |
| `ADMIN_SESSION_SECRET` | Secreto HMAC de la cookie. Cadena larga aleatoria |

Generar el hash de una password nueva:

```bash
node scripts/hash-admin-password.mjs "tu-password-nueva"
```

Pegá la línea `pbkdf2$sha256$...` en `ADMIN_PASSWORD_HASH`. Para rotar el path, cambiá `ADMIN_PATH` (mismo formato) y redesplegá. No commitees `.env.local`.

Desde el panel podés:

- Editar textos de marca, portada, SEO y pastelería
- Crear, editar o quitar productos (precio, stock, fotos, categoría)
- Añadir, ocultar y reordenar secciones del inicio
- Cambiar los colores de la marca
- Exportar / importar un JSON y restaurar el original

Los cambios se guardan en `localStorage` (`dulces_maxi_site_v1`). El JSON exportado sirve de respaldo.

## Qué se corrigió respecto del original

- Imágenes convertidas a **WebP** (de ~2 MB PNG a ~80–200 KB) con `loading="lazy"`
- `robots.txt` y `sitemap.xml` reales (en Base44 devolvían el HTML de la SPA)
- Título de iOS: *Dulces Maxi* (el original decía *Artesano Gourmet*)
- Color de tema unificado `#C51D5D`
- Tipografía y contraste: skip link, etiquetas en formularios, `lang="es-AR"`
- Errores de texto: *artsanal*, *cascara*, *azucar*, *500gs*
- Enlaces legales visibles en el pie
- Checkout de Mercado Pago del original no tenía backend usable: acá el pedido se registra en el dispositivo y se confirma por WhatsApp
- Sin badge de Base44
- `/admin` público y contraseña en el cliente eliminados: acceso por URL secreta + auth en el servidor

El diseño (colores, Fredoka + Nunito Sans, tarjetas, hero, pastelería) se mantiene.

## WhatsApp

Número de demostración del original: **387 610-6268** (`5493876106268`). Se puede cambiar en el editor.

## Scripts

- `npm run dev` — desarrollo (tienda pública)
- `npm run build` — typecheck + bundle
- `npm run preview` — servir el build
- `npx vercel dev` — local con login del editor
- `npx vercel deploy --prod --yes` — producción

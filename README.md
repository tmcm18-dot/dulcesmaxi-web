# Dulces Maxi — tienda web

Clon de [dulcesmaxi.base44.app](https://dulcesmaxi.base44.app) sin Base44: catálogo, carrito, pastelería por encargo, pedidos por WhatsApp y un panel de administración propio.

Hecho con **Vite + React + TypeScript** y funciones de Vercel. El catálogo persistido vive en un Blob store privado; la tienda pública lo lee por `/api/catalog`.

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

Para el panel (login, cookie, Blob), usá `npx vercel dev` con `.env.local` (ver más abajo). `npm run dev` sirve la tienda pública con el catálogo embebido como respaldo.

## Rutas públicas

| Ruta | Qué hace |
| --- | --- |
| `/` | Inicio: portada, categorías, destacados y catálogo |
| `/product/:id` | Ficha de producto |
| `/cart` | Carrito (también se guarda en este dispositivo) |
| `/checkout` | Pedido → WhatsApp (y queda registrado en el panel) |
| `/pasteleria` | Encargos de tortas, tartas y mesas dulces |
| `/privacidad` `/terminos` `/entregas` `/consumo-responsable` | Textos legales |
| `/api/catalog` | Catálogo público (sin costos ni datos internos) |

**`/admin` no existe.** Si alguien entra, va al inicio. El panel no está linkeado en el sitio ni en el sitemap.

## Panel (URL secreta)

El panel no es una ruta pública. Se entra por un path aleatorio configurado en el servidor (`ADMIN_PATH`, formato `editar-<token>`). Esa URL **no** va en este README ni en la UI de la tienda: está en las env vars del hosting y se comparte por un canal privado.

Cómo entrar:

1. Abrí `https://<dominio>/<ADMIN_PATH>`
2. Completá la contraseña en el formulario (la clave **no** viaja en el JavaScript del cliente)
3. El servidor setea una cookie **httpOnly** de sesión (12 h)
4. **Salir** llama a `/api/admin/logout` y borra la cookie

Tras 5 contraseñas mal, hay bloqueo de 15 minutos (cookie firmada + límite por IP).

Módulos (siempre bajo el path secreto, nunca bajo `/admin`):

| Subruta | Módulo |
| --- | --- |
| `/` | Dashboard operativo |
| `/productos` | Catálogo, fotos, importación CSV |
| `/precios` | Simulación y aplicación de márgenes |
| `/inventario` | Stock, lotes y movimientos |
| `/pedidos` | Pedidos y transiciones de estado |
| `/carritos` | Carritos con consentimiento analítico |
| `/clientes` | Fichas e historial |
| `/pasteleria` | Solicitudes de presupuesto |
| `/creativo` | Piezas promocionales |
| `/sitio` | Editor de textos, secciones y colores |

Las operaciones de escritura van a `/api/admin-operations` (sesión + rol admin). Copy y fondos del estudio creativo usan **plantillas locales** si no hay API de IA.

### Persistencia

- Blob privado de Vercel, archivo `admin/db.json`
- La tienda pública pide `/api/catalog` y muestra los mismos productos activos (sin costo ni margen)
- Pedidos, carritos (con consentimiento), clientes, pastelería y auditoría se guardan ahí
- `localStorage` queda como cache/respaldo del navegador, no como fuente de verdad

### Variables de entorno

Copiá `.env.example` a `.env.local` en desarrollo. En Vercel: Project → Settings → Environment Variables.

| Variable | Qué es |
| --- | --- |
| `ADMIN_PATH` | Path secreto **sin** `/` inicial. Obligatorio: `editar-` + 12–64 caracteres `[A-Za-z0-9_-]` |
| `ADMIN_PASSWORD_HASH` | Hash PBKDF2-SHA256. **Nunca** la contraseña en claro |
| `ADMIN_SESSION_SECRET` | Secreto HMAC de la cookie. Cadena larga aleatoria |
| `BLOB_READ_WRITE_TOKEN` | Lo inyecta Vercel al vincular el Blob store |

Generar el hash de una password nueva:

```bash
node scripts/hash-admin-password.mjs "tu-password-nueva"
```

Pegá la línea `pbkdf2$sha256$...` en `ADMIN_PASSWORD_HASH`. Para rotar el path, cambiá `ADMIN_PATH` (mismo formato) y redesplegá. No commitees `.env.local`.

## Qué se corrigió respecto del original

- Backend propio en Vercel (sin Base44 / sin HTTP 402 de plan)
- Imágenes convertidas a **WebP** (de ~2 MB PNG a ~80–200 KB) con `loading="lazy"`
- `robots.txt` y `sitemap.xml` reales (en Base44 devolvían el HTML de la SPA)
- Título de iOS: *Dulces Maxi* (el original decía *Artesano Gourmet*)
- Color de tema unificado `#C51D5D`
- Tipografía y contraste: skip link, etiquetas en formularios, `lang="es-AR"`
- Errores de texto: *artsanal*, *cascara*, *azucar*, *500gs*
- Enlaces legales visibles en el pie
- Pedido por WhatsApp + registro durable en el panel (Mercado Pago del original no tenía backend usable)
- Sin badge de Base44
- `/admin` público y contraseña en el cliente eliminados: acceso por URL secreta + auth en el servidor
- Validaciones de negocio (SKU único, precio ≥ costo, transiciones de pedido, stock al confirmar/cancelar)
- Auditoría de operaciones sensibles y módulos con carga diferida

El diseño (colores, Fredoka + Nunito Sans, tarjetas, hero, pastelería) se mantiene.

## WhatsApp

Número de demostración del original: **387 610-6268** (`5493876106268`). Se puede cambiar en el editor del sitio.

## Scripts

- `npm run dev` — desarrollo (tienda pública)
- `npm run build` — typecheck + bundle
- `npm run preview` — servir el build
- `npx vercel dev` — local con login del panel
- `npx vercel deploy --prod --yes` — producción

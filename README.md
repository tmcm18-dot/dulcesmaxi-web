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

## Rutas

| Ruta | Qué hace |
| --- | --- |
| `/` | Inicio: portada, categorías, destacados y catálogo |
| `/product/:id` | Ficha de producto |
| `/cart` | Carrito (se guarda en este dispositivo) |
| `/checkout` | Pedido → WhatsApp |
| `/pasteleria` | Encargos de tortas, tartas y mesas dulces |
| `/privacidad` `/terminos` `/entregas` `/consumo-responsable` | Textos legales |
| `/admin` | Editor de la página |

## Editor (`/admin`)

Contraseña inicial: **`maxi2026`**

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

El diseño (colores, Fredoka + Nunito Sans, tarjetas, hero, pastelería) se mantiene.

## WhatsApp

Número de demostración del original: **387 610-6268** (`5493876106268`). Se puede cambiar en el editor.

## Scripts

- `npm run dev` — desarrollo
- `npm run build` — typecheck + bundle
- `npm run preview` — servir el build

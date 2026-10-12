# MADEVHUB Growth Engine

[![CI](https://github.com/juanMasis777/madevhub-growth-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/juanMasis777/madevhub-growth-engine/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

**[▶ Probar la demo](https://madevhub-growth-engine-1enx.vercel.app)** — se abre con
un pipeline de ejemplo cargado, sin necesidad de registro ni clave de API.

CRM ligero de generación de leads locales. Busca negocios en Google Maps
(vía [Outscraper](https://outscraper.com)), enriquece sus datos de contacto
(email y redes sociales), genera auditorías y mensajes de outreach, y te ayuda
a llevar el pipeline de ventas — todo desde una sola interfaz.

Pensado para agencias y freelancers que venden webs y automatización a negocios
locales: **encuentra negocios que necesitan una web, genera la propuesta y cierra.**

---

## Probar sin configurar nada

La primera vez que abres la app sin datos guardados, el CRM siembra **12 leads
de ejemplo** (ficticios, de negocios de Miami) que cubren las seis etapas del
pipeline. Así puedes recorrer el dashboard, las auditorías, los mensajes y el
pipeline sin montar el backend ni gastar créditos de Outscraper.

Un banner los identifica como datos de prueba y los elimina en un clic. Una vez
borrados no vuelven, ni siquiera al recargar.

Lo único que necesita el backend es la **búsqueda real** de negocios en Google
Maps; todo lo demás funciona en local.

---

## Stack

| Capa      | Tecnología                                             |
| --------- | ------------------------------------------------------ |
| Frontend  | React 19 + Vite 8, `lucide-react`, `jspdf`             |
| Backend   | Express 5 (proxy a Outscraper) con Helmet + rate-limit |
| Datos     | `localStorage` en el navegador (+ backup/restore JSON) |
| Tests     | Vitest (79 casos sobre la lógica pura)                 |
| Lint      | Oxlint                                                  |
| CI        | GitHub Actions (lint + tests + build)                   |

---

## Puesta en marcha

### 1. Requisitos

- Node.js 18+ y npm
- Una clave de API de [Outscraper](https://app.outscraper.com/profile)

### 2. Instalación

```bash
git clone https://github.com/juanMasis777/madevhub-growth-engine.git
cd madevhub-growth-engine
npm install
```

### 3. Configuración

```bash
cp .env.example .env
```

Edita `.env` y añade tu `OUTSCRAPER_API_KEY`. El resto de variables tienen
valores por defecto razonables para desarrollo local. Consulta
[`.env.example`](./.env.example) para ver todas las opciones.

### 4. Arrancar en desarrollo

```bash
npm run dev:all      # arranca backend (Express) + frontend (Vite) a la vez
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000

También puedes arrancarlos por separado:

```bash
npm run server       # solo backend
npm run dev          # solo frontend
```

---

## Scripts disponibles

| Script            | Descripción                                    |
| ----------------- | ---------------------------------------------- |
| `npm run dev`     | Frontend Vite con HMR                          |
| `npm run server`  | Backend Express                                |
| `npm run dev:all` | Backend + frontend simultáneos (concurrently)  |
| `npm test`        | Ejecuta la suite de Vitest                     |
| `npm run test:watch` | Vitest en modo watch                        |
| `npm run lint`    | Oxlint sobre todo el proyecto                  |
| `npm run lint:fix`| Oxlint aplicando las correcciones automáticas  |
| `npm run build`   | Build de producción del frontend               |
| `npm run preview` | Sirve el build de producción localmente        |

---

## Arquitectura

```
madevhub-growth-engine/
├── server/
│   ├── index.js        # API Express: rutas y proxy seguro a Outscraper
│   └── lib.js          # Parsing de Outscraper, filtrado de emails, scoring
├── src/
│   ├── App.jsx         # Estado del CRM y handlers
│   ├── components/     # Una vista por archivo + Sidebar, Topbar, toasts
│   ├── lib/            # Lógica pura: constantes, scoring, plantillas,
│   │                   #   plan de acción, exportaciones, datos demo
│   ├── App.css         # Sistema de diseño (glass premium, claro/oscuro)
│   └── useTheme.js     # Hook de tema claro/oscuro
├── .github/workflows/  # CI
├── render.yaml         # Blueprint de despliegue del backend
└── .env.example        # Plantilla de variables de entorno
```

La lógica que no depende de React ni del DOM vive en `src/lib/` y `server/lib.js`.
Esa separación es lo que permite que la suite de tests cubra el scoring de leads,
el filtrado de emails, las plantillas de outreach y el export CSV sin montar un
servidor ni renderizar la app.

### Vistas de la app

| Vista             | Qué hace                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| **Dashboard**     | *Today's Action Plan* + métricas, pipeline y log de actividad             |
| **Search Leads**  | Búsqueda en Google Maps con Safe Mode y alta manual de leads              |
| **Businesses**    | Lista completa con buscador por nombre, email, teléfono, ciudad o rubro   |
| **Audits**        | Auditoría de presencia digital, enriquecimiento y export TXT/PDF/propuesta|
| **Messages**      | Mensaje por canal (email/IG/llamada) + secuencia de outreach de 5 pasos   |
| **Pipeline**      | Estado del lead, fecha de seguimiento y notas                             |
| **Settings**      | Editar/borrar lead, backup, estado del backend y tema claro/oscuro        |

#### Today's Action Plan

El dashboard agrupa automáticamente los leads en las cinco acciones que mueven
el pipeline, para no revisar la lista entera a mano:

1. **Overdue follow-ups** — seguimientos con fecha pasada.
2. **Due today** — seguimientos agendados para hoy.
3. **Hot leads to contact** — leads calientes que siguen en `New`.
4. **Waiting on reply** — contactados o interesados sin próximo paso agendado.
5. **Proposals to close** — propuestas ya enviadas.

Cada tarjeta lleva directo al lead en la vista correcta. Los leads en `Closed`
o `Lost` quedan fuera del plan.

#### Secuencia de outreach

En **Messages** hay cinco plantillas personalizadas con los datos reales del
lead (nombre, ciudad, rubro, rating, reseñas y estado de su web): *Initial
Email*, *Instagram DM*, *Follow-up 1*, *Follow-up 2* y *Call Script*. Se copian
al portapapeles y marcan el lead como `Contacted` en un clic.

### Endpoints del backend

| Método | Ruta                            | Protegido | Descripción                                      |
| ------ | ------------------------------- | :-------: | ------------------------------------------------ |
| GET    | `/api/health`                   |    No     | Comprobación de salud                            |
| GET    | `/api/safe-mode`                |    No     | Límites del modo seguro                          |
| GET    | `/api/search-leads`             |    Sí¹    | Busca negocios en Google Maps                    |
| POST   | `/api/enrich-lead`              |    Sí¹    | Enriquece un lead (email + redes) por su web     |
| GET    | `/api/search-leads-with-emails` |    Sí¹    | Busca y enriquece leads en un solo paso          |

¹ Protegido **solo si** defines `API_ACCESS_TOKEN` en el `.env`. Envía el token
en la cabecera `x-access-token` o `Authorization: Bearer <token>`.

---

## Seguridad

Cada llamada a los endpoints de scraping **consume créditos reales de
Outscraper**, así que el backend incluye varias capas de protección:

- **Helmet** — cabeceras HTTP seguras por defecto.
- **Rate limiting** — máximo de requests por IP (configurable con
  `RATE_LIMIT_WINDOW_MS` y `RATE_LIMIT_MAX`).
- **CORS restringido** — en producción, define `FRONTEND_URL` para permitir
  solo tu dominio.
- **Token de acceso opcional** — define `API_ACCESS_TOKEN` para exigir un token
  en los endpoints caros.
- **Safe Mode** — límites de resultados por búsqueda para no disparar el gasto.

> ⚠️ **Nunca subas tu `.env`.** Ya está en `.gitignore`. Rota tu
> `OUTSCRAPER_API_KEY` si sospechas que se ha filtrado.

---

## Despliegue

El proyecto son dos piezas que se despliegan por separado: un frontend estático
y un backend que guarda la clave de Outscraper.

### 1. Backend (Render)

El repo incluye [`render.yaml`](./render.yaml), así que basta con un Blueprint:

1. En Render: **New → Blueprint** y elige este repositorio.
2. Render detecta el archivo y crea el servicio `madevhub-growth-engine-api`.
3. En **Environment**, rellena los valores marcados como secretos:

   | Variable | Valor |
   | --- | --- |
   | `OUTSCRAPER_API_KEY` | Tu clave de Outscraper |
   | `FRONTEND_URL` | La URL del frontend, p. ej. `https://tuapp.vercel.app` |
   | `API_ACCESS_TOKEN` | Un token generado con `openssl rand -hex 32` |

4. Comprueba que `https://tu-servicio.onrender.com/api/health` responde.

> El plan gratuito de Render duerme el servicio tras un rato sin tráfico; la
> primera petición después de dormir tarda unos segundos en responder.

### 2. Frontend (Vercel)

1. Importa el repositorio en Vercel. Detecta Vite automáticamente.
2. En **Settings → Environment Variables** añade:

   | Variable | Valor |
   | --- | --- |
   | `VITE_API_URL` | La URL del backend en Render |
   | `VITE_API_ACCESS_TOKEN` | El mismo token que pusiste en `API_ACCESS_TOKEN` |

3. Vuelve a desplegar para que el build recoja las variables.

Sin `VITE_API_URL` el frontend apunta a `http://localhost:4000`: la app sigue
funcionando con los datos de ejemplo, pero la búsqueda real de leads falla.

Un recordatorio sobre `VITE_API_ACCESS_TOKEN`: al ser una app de navegador, ese
valor queda visible en el bundle. Sirve para frenar el abuso casual y poder
rotarlo; la protección real es la combinación de CORS restringido, rate limiting
y token.

---

## Datos y backup

Los leads se guardan en el `localStorage` del navegador. Usa los botones
**Export Backup** / **Import Backup** de la interfaz para mover tus datos entre
navegadores o dispositivos, y **Export CSV** para llevarlos a otras
herramientas.

En **Settings → Backend Connection** puedes comprobar si el servidor Express
responde (`/api/health`) y ver los límites de Safe Mode que el backend está
aplicando de verdad (`/api/safe-mode`), en lugar de los valores por defecto del
frontend.

---

## Rendimiento

`jspdf` (y sus dependencias `html2canvas` + `dompurify`, ~380 kB) se carga de
forma diferida, solo cuando exportas un PDF. El bundle inicial del CRM queda en
torno a 255 kB (78 kB gzip).

---

## Licencia

[MIT](./LICENSE) © Juan Masis

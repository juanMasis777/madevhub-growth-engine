# MADEVHUB Growth Engine

CRM ligero de generación de leads locales. Busca negocios en Google Maps
(vía [Outscraper](https://outscraper.com)), enriquece sus datos de contacto
(email y redes sociales), genera auditorías y mensajes de outreach, y te ayuda
a llevar el pipeline de ventas — todo desde una sola interfaz.

Pensado para agencias y freelancers que venden webs y automatización a negocios
locales: **encuentra negocios que necesitan una web, genera la propuesta y cierra.**

---

## Stack

| Capa      | Tecnología                                             |
| --------- | ------------------------------------------------------ |
| Frontend  | React 19 + Vite 8, `lucide-react`, `jspdf`             |
| Backend   | Express 5 (proxy a Outscraper) con Helmet + rate-limit |
| Datos     | `localStorage` en el navegador (+ backup/restore JSON) |
| Lint      | Oxlint                                                  |

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
| `npm run build`   | Build de producción del frontend               |
| `npm run preview` | Sirve el build de producción localmente        |

---

## Arquitectura

```
madevhub-growth-engine/
├── server/
│   └── index.js        # API Express: proxy seguro a Outscraper
├── src/
│   ├── App.jsx         # Aplicación React (CRM)
│   ├── App.css         # Sistema de diseño (glass premium, claro/oscuro)
│   ├── index.css       # Estilos base globales
│   ├── useTheme.js     # Hook de tema claro/oscuro
│   └── data/           # Datos mock de ejemplo
├── public/             # Assets estáticos
└── .env.example        # Plantilla de variables de entorno
```

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

## Datos y backup

Los leads se guardan en el `localStorage` del navegador. Usa los botones
**Export Backup** / **Import Backup** de la interfaz para mover tus datos entre
navegadores o dispositivos, y **Export CSV** para llevarlos a otras
herramientas.

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
| `npm run lint`    | Oxlint sobre todo el proyecto                  |
| `npm run lint:fix`| Oxlint aplicando las correcciones automáticas  |
| `npm run build`   | Build de producción del frontend               |
| `npm run preview` | Sirve el build de producción localmente        |

---

## Arquitectura

```
madevhub-growth-engine/
├── server/
│   └── index.js        # API Express: proxy seguro a Outscraper
├── src/
│   ├── App.jsx         # Aplicación React (CRM completo, 7 vistas)
│   ├── offer.js        # Precios y paquete de MADEVHUB
│   ├── templates.js    # Mensajes, auditoría y propuesta (ES / EN)
│   ├── demoSite.js     # Generador de la página demo del cliente
│   ├── App.css         # Sistema de diseño (glass premium, claro/oscuro)
│   ├── index.css       # Estilos base globales
│   └── useTheme.js     # Hook de tema claro/oscuro
├── public/             # Assets estáticos
└── .env.example        # Plantilla de variables de entorno
```

### Vistas de la app

| Vista             | Qué hace                                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| **Dashboard**     | *Today's Action Plan* + métricas, pipeline y log de actividad             |
| **Search Leads**  | Búsqueda en Google Maps con Safe Mode y alta manual de leads              |
| **Businesses**    | Lista completa con buscador por nombre, email, teléfono, ciudad o rubro   |
| **Audits**        | Auditoría, enriquecimiento, propuesta PDF y **página demo** del negocio   |
| **Messages**      | Mensaje por canal (WhatsApp/email/IG/llamada) + secuencia de 6 pasos      |
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

#### Página demo para el cliente

En **Audits → Demo Website** la app genera una página web de muestra del negocio
con sus datos reales de Google: nombre, rubro, ciudad, teléfono, calificación,
reseñas, dirección con mapa y botones de llamar y WhatsApp. El diseño cambia
según el rubro (barbería, salón, limpieza, restaurante, dentista, contratista,
bienes raíces o genérico) y sale en el idioma del lead.

1. **Create Demo Website** y revisa la vista previa.
2. **Download HTML** y arrastra el archivo a [Netlify Drop](https://app.netlify.com/drop)
   para tener un link público gratis.
3. Pega el link en **Demo link** y toca **Send on WhatsApp**: se abre WhatsApp
   con el mensaje listo y el lead pasa a `Contacted`.

#### Idioma y WhatsApp

Cada lead tiene idioma (**ES** por defecto, **EN** opcional) que cambia los
mensajes, la auditoría, la propuesta PDF y la página demo. El canal
**WhatsApp** abre `wa.me` con el teléfono del negocio y el mensaje escrito.

#### Precios

La oferta vive en [`src/offer.js`](./src/offer.js): paquete de **$697** (un solo
pago) y mantenimiento opcional de **$97/mes**. La auditoría, la propuesta PDF y
los mensajes leen de ahí. La propuesta incluye el link de pago de Stripe.

#### Secuencia de outreach

En **Messages** hay seis plantillas personalizadas con los datos reales del
lead (nombre, ciudad, rubro, rating, reseñas y estado de su web): *WhatsApp
inicial*, *Email inicial*, *DM de Instagram*, *Seguimiento 1*, *Seguimiento 2* y
*Guion de llamada*. Se copian o se abren en WhatsApp, y marcan el lead como
`Contacted` en un clic.

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

## Publicar en Vercel

El proyecto entero (app + backend) se publica en Vercel desde `main`. El
backend corre como función: `api/index.js` importa la app Express de
`server/index.js` y `vercel.json` manda todas las rutas `/api/*` ahí.

Configura en **Vercel → Settings → Environment Variables**:

| Variable             | Valor                                   |
| -------------------- | --------------------------------------- |
| `OUTSCRAPER_API_KEY` | Tu clave de Outscraper (obligatoria)    |
| `VITE_API_URL`       | No la agregues: vacía usa el mismo link |

Después de agregar o cambiar una variable, haz **Redeploy**. La protección de
Vercel (inicio de sesión) deja la app y la API solo para tu cuenta.

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

En **Settings → Backend Connection** puedes comprobar si el servidor Express
responde (`/api/health`) y ver los límites de Safe Mode que el backend está
aplicando de verdad (`/api/safe-mode`), en lugar de los valores por defecto del
frontend.

---

## Rendimiento

`jspdf` (y sus dependencias `html2canvas` + `dompurify`, ~380 kB) se carga de
forma diferida, solo cuando exportas un PDF. El bundle inicial del CRM queda en
torno a 255 kB (78 kB gzip).

# Tierra de Todos 3

Documentacion tecnica principal del proyecto. Este README esta organizado como guia de documentacion clasica para facilitar onboarding, operacion y mantenimiento.

## Contenido

- Resumen
- Getting Started
- Configuracion
- Scripts
- Arquitectura
- API Backend
- Seguridad y Permisos
- Logging y Auditoria
- Modelos de Datos
- Frontend
- Solucion de Problemas

## Resumen

Tierra de Todos 3 es una plataforma web con backend API y frontend SPA.

- Backend: Node.js, Express, Sequelize, MySQL.
- Frontend: React, Vite, React Router, Axios.
- Autenticacion: JWT con sesiones persistidas en base de datos.
- Control de acceso: permisos granulares por usuario y rol.

## Getting Started

### Prerrequisitos

- Node.js 20+
- npm 10+
- MySQL 8+

### Instalacion

- Clonar el repositorio.
- Instalar dependencias del backend.
- Instalar dependencias del frontend.

```bash
cd backend
npm install

cd ../frontend
npm install
```

### Ejecucion en desarrollo

Abrir dos terminales:

```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

El frontend usa proxy de desarrollo hacia el backend por la ruta /api.

## Configuracion

### Variables de entorno backend

Definir en backend/.env:

- NODE_ENV
- PORT
- BACKEND_URL
- FOLDER
- JWT_SECRET
- SECURE_DELAY
- db_name
- db_user
- db_pass
- db_host
- db_port
- DB_LOGS
- DB_USER
- DB_PASS
- DB_HOST
- DB_PORT

Notas importantes:

- El backend mantiene dos conexiones MySQL: una principal y otra para logs.
- FOLDER actua como prefijo global de rutas si se necesita montar la API bajo una subruta.

### Variables de entorno frontend

Definir en frontend/.env:

- VITE_API_BASE
- VITE_API_PORT

Notas importantes:

- En desarrollo, Axios usa baseURL /api.
- Vite proxy redirige /api a VITE_API_BASE:VITE_API_PORT.
- En produccion, Axios construye la URL con VITE_API_BASE y VITE_API_PORT.

## Scripts

### Backend

- npm run dev: arranque con nodemon.
- npm start: arranque normal.

### Frontend

- npm run dev: servidor de desarrollo Vite.
- npm run build: build de produccion.
- npm run preview: preview del build.
- npm run lint: lint del frontend.

## Arquitectura

### Estructura principal

```txt
backend/
  server.js
  config/
  controllers/
  handlers/
  helpers/
  middlewares/
  migrations/
  models/
  routes/

frontend/
  src/
    api/
    components/
    elements/
    layouts/
    pages/
```

### Flujo de arranque backend

- Carga modelos dinamicamente.
- Verifica conexion a base de datos.
- Ejecuta sync de Sequelize.
- Monta middlewares globales.
- Monta rutas con deteccion dinamica de archivos Routes.js.

Estado actual de bootstrap de base de datos:

- Se usa db.sync().
- ensureForeignKeyConstraints esta desactivado.
- runModelSeeds esta desactivado.

### Ruteo backend

El cargador de rutas recorre backend/routes recursivamente y monta prefijo por primera carpeta.

- routes/auth -> /auth
- routes/home -> /home
- routes/user -> /user
- routes/system -> /system
- routes/admin -> /admin

### Ruteo frontend

El frontend usa rutas anidadas con layout autenticado persistente para evitar remount del shell principal.

- Publico: /, /login, /register, /verifyAccess, /password-recovery
- Privado bajo DashboardLayout: /start, /profile, /progress, /news, /tickets, /players, /community, /commands, /users, /gestion, /reports, /emblems-admin

## API Backend

Base general:

- En desarrollo desde frontend: /api
- Backend directo: BACKEND_URL:PORT

### Modulo auth

Incluye login, registro, verificacion de codigo, logout y recuperacion de password.

Rutas clave:

- POST /auth/login
- POST /auth/register
- POST /auth/verify-code
- POST /auth/logout
- POST /auth/request-password-recovery
- POST /auth/reset-password

### Modulo user

Incluye perfil, credencial, noticias, comunidades, progreso, streamer y tickets.

Rutas clave:

- GET /user/profile
- GET /user/credential
- GET /user/news
- GET /user/progress/emblems
- GET /user/tickets

### Modulo system

Incluye menu dinamico, settings y catalogos transversales.

Rutas clave:

- GET /system/menu
- GET /system/public-settings
- GET /system/settings
- PATCH /system/settings

### Modulo admin

Incluye reportes, usuarios, roles, permisos, ediciones, catalogos, comunidades y configuracion de sistema.

Rutas clave:

- GET /admin/users
- PATCH /admin/user/:id/details
- GET /admin/roles
- GET /admin/reports/tickets
- GET /admin/editions

## Seguridad y Permisos

### Middlewares globales

- injectLogAction: expone req.logAction para auditoria.
- secureDelay: agrega retardo configurable a respuestas.
- parsers JSON y urlencoded.

### Autenticacion

verifyToken valida:

- Bearer token.
- Firma JWT.
- Usuario vigente.
- Sesion activa no revocada y no expirada.

### Autorizacion

checkPermissions valida permisos requeridos por endpoint, incluyendo alias para algunos catalogos.

Permisos funcionales relevantes:

- users.view, users.edit
- roles.view, roles.gest, roles.edit, roles.remove
- permissions.view, permissions.gest, permissions.edit, permissions.remove
- tickets.view, tickets.manage, tickets.police, tickets.close
- system.view, system.gest, system.edit
- news.create, news.edit, news.delete

## Logging y Auditoria

### Winston

- Logs de consola.
- Rotacion diaria de logs generales.
- Rotacion diaria de logs de error.

### Logs en base de datos

- Conexion separada DB_LOGS.
- Tablas mensuales dinamicas tipo Logs_YYYY_MM.
- Sanitizacion de datos sensibles.
- Registro de metadata de auditoria: usuario, IP, dispositivo, accion y payloads.

## Modelos de Datos

Conjunto principal de entidades:

- Usuarios y acceso: Users, Sessions, UserDevices, AccessCodes, Attempts.
- Seguridad: Roles, Permissions, PresetPermissions, UserPermissions.
- Contenido: news, news_comments, likes.
- Comunidad: community, user_community, user_community_request.
- Progreso: emblems, goals, user_emblems, user_goals.
- Sistema: system_settings, system_statuses, Menu.
- Soporte: tickets, tickets_messages.
- Ediciones: edition, edition_dates, edition_rules.

## Frontend

### Cliente API

El cliente Axios:

- Inyecta Authorization Bearer automaticamente si existe token.
- Maneja timeout global.
- Redirige a login al recibir 401.

### Layout autenticado

DashboardLayout y Controls centralizan:

- Navegacion principal.
- Header y menu movil.
- Render del contenido de ruta hija.

## Solucion de Problemas

### El frontend no conecta con backend

- Verificar VITE_API_BASE y VITE_API_PORT.
- Confirmar que backend este activo en BACKEND_URL:PORT.
- Revisar configuracion de proxy en Vite.

### Error de autenticacion en rutas privadas

- Verificar JWT_SECRET en backend.
- Confirmar token en localStorage.
- Confirmar que la sesion no este revocada ni expirada.

### Error de base de datos al iniciar

- Verificar credenciales db_name, db_user, db_pass, db_host, db_port.
- Confirmar conectividad de red al servidor MySQL.
- Revisar permisos del usuario MySQL.

### Logs no se guardan en DB

- Verificar variables DB_LOGS, DB_USER, DB_PASS, DB_HOST, DB_PORT.
- Confirmar que la base de logs exista y acepte conexiones.

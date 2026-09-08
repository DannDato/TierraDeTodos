# Tierra de Todos 3

Plataforma web de **Tierra de Todos**, compuesta por una API REST en Node.js/Express y una SPA en React.

Este documento es la **referencia técnica principal del proyecto**. Está pensado tanto para onboarding de nuevos desarrolladores como para mantenimiento, debugging y ampliación del sistema.

> **Importante:** cuando exista una diferencia entre documentación antigua y el código actual, el comportamiento implementado en la rama activa del repositorio es la fuente de verdad. Si un cambio modifica arquitectura, configuración, convenciones o procedimientos descritos aquí, este README debe actualizarse en el mismo PR.

---

# Índice

1. [Resumen técnico](#1-resumen-técnico)
2. [Stack](#2-stack)
3. [Getting Started](#3-getting-started)
4. [Variables de entorno](#4-variables-de-entorno)
5. [Scripts](#5-scripts)
6. [Arquitectura general](#6-arquitectura-general)
7. [Mapa rápido: ¿dónde modifico qué?](#7-mapa-rápido-dónde-modifico-qué)
8. [Backend](#8-backend)
9. [Base de datos](#9-base-de-datos)
10. [Modelos y asociaciones](#10-modelos-y-asociaciones)
11. [Sistema de rutas](#11-sistema-de-rutas)
12. [Controllers y flujo de una petición](#12-controllers-y-flujo-de-una-petición)
13. [Autenticación y sesiones](#13-autenticación-y-sesiones)
14. [Autorización y permisos](#14-autorización-y-permisos)
15. [Logging y auditoría](#15-logging-y-auditoría)
16. [Manejo de errores](#16-manejo-de-errores)
17. [Códigos de acceso y verificación](#17-códigos-de-acceso-y-verificación)
18. [Correo electrónico](#18-correo-electrónico)
19. [Archivos públicos y uploads](#19-archivos-públicos-y-uploads)
20. [Frontend](#20-frontend)
21. [Cliente HTTP / API frontend](#21-cliente-http--api-frontend)
22. [Routing frontend](#22-routing-frontend)
23. [Cómo agregar funcionalidad](#23-cómo-agregar-funcionalidad)
24. [Convenciones del proyecto](#24-convenciones-del-proyecto)
25. [Debugging y troubleshooting](#25-debugging-y-troubleshooting)
26. [Consideraciones de producción](#26-consideraciones-de-producción)
27. [Flujo de trabajo para el equipo](#27-flujo-de-trabajo-para-el-equipo)
28. [Checklist antes de PR](#28-checklist-antes-de-pr)
29. [Deuda técnica y precauciones conocidas](#29-deuda-técnica-y-precauciones-conocidas)

---

# 1. Resumen técnico

Tierra de Todos 3 utiliza una arquitectura web separada en:

```text
┌─────────────────────┐
│      Frontend       │
│    React + Vite     │
└──────────┬──────────┘
           │ HTTP / Axios
           │ Bearer JWT
           ▼
┌─────────────────────┐
│       Backend       │
│  Node.js + Express  │
└──────────┬──────────┘
           │ Sequelize
           ▼
┌─────────────────────┐
│   MySQL principal   │
└─────────────────────┘

           +
           
┌─────────────────────┐
│ MySQL de auditoría  │
│    Logs_YYYY_MM     │
└─────────────────────┘
```

Características principales:

* API REST.
* SPA en React.
* Autenticación mediante JWT.
* Sesiones persistidas en base de datos.
* Revocación server-side de sesiones.
* Verificación de dispositivos.
* Sistema granular de roles y permisos.
* Menús dinámicos según permisos.
* Auditoría persistente.
* Logging de aplicación con Winston.
* Base de datos independiente para logs.
* Tablas mensuales de auditoría.
* Carga automática de modelos Sequelize.
* Carga automática de rutas Express.
* Gestión de usuarios.
* Noticias.
* Comunidades.
* Progreso, metas y emblemas.
* Tickets.
* Ediciones.
* Comandos.
* Configuración global del sistema.

---

# 2. Stack

## Backend

* Node.js
* Express 5
* Sequelize 6
* MySQL / mysql2
* JWT (`jsonwebtoken`)
* bcrypt
* dotenv
* cors
* Winston
* winston-daily-rotate-file
* Nodemon

## Frontend

* React
* Vite
* React Router
* Axios
* ESLint

## Persistencia

Existen **dos conexiones MySQL independientes**:

1. **Base principal**

   * usuarios
   * sesiones
   * permisos
   * contenido
   * comunidades
   * progreso
   * tickets
   * configuración
   * etc.

2. **Base de logs**

   * auditoría histórica
   * tablas mensuales `Logs_YYYY_MM`

---

# 3. Getting Started

## Requisitos

Se recomienda:

* Node.js 20+
* npm 10+
* MySQL 8+
* Git

## Clonar

```bash
git clone https://github.com/DannDato/TierraDeTodos.git
cd TierraDeTodos
```

## Instalar backend

```bash
cd backend
npm install
```

Crear:

```text
backend/.env
```

tomando como referencia:

```text
backend/.env.example
```

## Instalar frontend

```bash
cd ../frontend
npm install
```

Crear el `.env` correspondiente si el entorno lo requiere.

## Ejecutar

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Por defecto, Vite sirve el frontend de desarrollo y utiliza `/api` como entrada hacia el backend mediante su proxy.

---

# 4. Variables de entorno

## Backend

Archivo:

```text
backend/.env
```

### Servidor

```env
NODE_ENV=development
PORT=3000
BACKEND_URL=http://localhost
FOLDER=
JWT_SECRET=
SECURE_DELAY=
```

### Base principal

```env
db_name=
db_user=
db_pass=
db_host=
db_port=
```

> Atención: actualmente las variables de la base principal utilizan nombres en minúsculas. No cambiar su capitalización sin modificar también `config/database.js`.

### Base de logs

```env
DB_LOGS=
DB_USER=
DB_PASS=
DB_HOST=
DB_PORT=
```

## Significado

### `NODE_ENV`

Entorno actual.

Ejemplo:

```env
NODE_ENV=development
```

Algunas partes del sistema modifican su comportamiento dependiendo de esta variable, particularmente logging.

### `PORT`

Puerto de Express.

Fallback actual:

```text
3000
```

### `BACKEND_URL`

URL utilizada para representar la ubicación del backend.

### `FOLDER`

Prefijo global opcional de la aplicación.

El servidor monta las rutas mediante:

```text
FOLDER + ruta generada
```

Si está vacío:

```text
/auth/login
```

Si, por ejemplo:

```env
FOLDER=/api
```

la misma ruta quedaría disponible bajo:

```text
/api/auth/login
```

No confundir `FOLDER` con los prefijos generados automáticamente por el sistema de rutas.

### `JWT_SECRET`

Clave utilizada para firmar/verificar JWT.

**Nunca debe versionarse.**

Cambiarla invalida los JWT emitidos con la clave anterior.

### `SECURE_DELAY`

Controla el middleware de retardo de respuestas.

Consultar:

```text
backend/middlewares/secureDelay.js
```

antes de cambiar su comportamiento.

---

## Frontend

Variables utilizadas por la configuración actual:

```env
VITE_API_BASE=
VITE_API_PORT=
```

En desarrollo, Axios trabaja contra:

```text
/api
```

y Vite actúa como proxy.

En producción, la URL se construye utilizando la configuración del entorno.

---

# 5. Scripts

## Backend

Desarrollo:

```bash
npm run dev
```

Producción / ejecución normal:

```bash
npm start
```

## Frontend

Desarrollo:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

Lint:

```bash
npm run lint
```

---

# 6. Arquitectura general

Estructura simplificada:

```text
TierraDeTodos/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── emails/
│   ├── handlers/
│   ├── helpers/
│   ├── middlewares/
│   ├── migrations/
│   ├── models/
│   ├── public/
│   │   └── uploads/
│   ├── routes/
│   ├── seeders/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── elements/
│   │   ├── img/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── templates/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── README.md
└── TDT3_Roadmap.md
```

## Principio general

El backend está organizado aproximadamente bajo el flujo:

```text
HTTP Request
    ↓
Route
    ↓
Authentication middleware
    ↓
Permission middleware
    ↓
Controller
    ↓
Model / Sequelize
    ↓
MySQL
    ↓
Response
```

La auditoría puede intervenir transversalmente:

```text
Request
    ↓
injectLogAction
    ↓
req.logAction(...)
    ↓
logger.js
    ├── Winston
    └── DB Logs
```

---

# 7. Mapa rápido: ¿dónde modifico qué?

| Necesidad                  | Archivo / directorio                            |
| -------------------------- | ----------------------------------------------- |
| Arranque de Express        | `backend/server.js`                             |
| Conexión MySQL principal   | `backend/config/database.js`                    |
| Inicialización de BD       | `backend/config/databaseBootstrap.js`           |
| Orden de seeds / FK        | `backend/config/databaseBootstrapConfig.js`     |
| Conexión BD logs           | `backend/config/databaseLogs.js`                |
| Modelo Sequelize           | `backend/models/*.model.js`                     |
| Autoload de modelos        | `backend/models/index.js`                       |
| Endpoints                  | `backend/routes/`                               |
| Autoload de rutas          | `backend/routes/index.js`                       |
| Lógica de endpoints        | `backend/controllers/`                          |
| Autenticación JWT          | `backend/middlewares/verifyToken.js`            |
| Permisos                   | `backend/middlewares/checkPermissions.js`       |
| Inyección de auditoría     | `backend/middlewares/injectLogAction.js`        |
| Retardo de seguridad       | `backend/middlewares/secureDelay.js`            |
| Auditoría BD               | `backend/helpers/logger.js`                     |
| Logging consola/archivos   | `backend/helpers/winston.js`                    |
| Crear sesión               | `backend/helpers/CreateSession.js`              |
| Crear códigos              | `backend/helpers/createCodes.js`                |
| Verificar códigos          | `backend/helpers/verifyCodes.js`                |
| Aplicar preset de rol      | `backend/helpers/applyRolePresetPermissions.js` |
| Emblemas equipados         | `backend/helpers/getEquippedEmblems.js`         |
| Templates de correo        | `backend/helpers/emailTemplates.js`             |
| Correos                    | `backend/emails/`                               |
| Errores                    | `backend/handlers/`                             |
| Seeds                      | `backend/seeders/` y/o `seed()` de modelos      |
| Migraciones                | `backend/migrations/`                           |
| Uploads                    | `backend/public/uploads/`                       |
| Entrada React              | `frontend/src/main.jsx`                         |
| Router frontend            | `frontend/src/App.jsx`                          |
| API frontend               | `frontend/src/api/`                             |
| Layout principal           | `frontend/src/layouts/`                         |
| Pantallas                  | `frontend/src/pages/`                           |
| Componentes                | `frontend/src/components/`                      |
| Elementos UI reutilizables | `frontend/src/elements/`                        |
| Templates frontend         | `frontend/src/templates/`                       |
| Utilidades frontend        | `frontend/src/utils/`                           |
| Configuración Vite/proxy   | `frontend/vite.config.js`                       |

Esta tabla debe ser el primer lugar a consultar cuando un desarrollador nuevo necesite localizar una responsabilidad.

---

# 8. Backend

## `server.js`

Es el **composition root** práctico del backend.

Responsabilidades actuales:

1. Crear Express.
2. Exponer `FOLDER` mediante `res.locals`.
3. Inicializar la base de datos.
4. Servir `public/`.
5. Configurar CORS.
6. Inyectar `req.logAction`.
7. Aplicar `secureDelay`.
8. Habilitar parsers.
9. Montar las rutas.
10. Iniciar HTTP server.
11. Registrar estado de inicialización mediante el sistema de logs.

Flujo:

```text
server.js
   │
   ├── initializeDatabase()
   │
   ├── express.static("public")
   │
   ├── cors()
   │
   ├── injectLogAction
   │
   ├── secureDelay
   │
   ├── express.urlencoded()
   │
   ├── express.json()
   │
   ├── routes
   │
   └── listen()
```

### CORS

Actualmente el origen permitido está configurado directamente para:

```text
http://localhost:5173
```

Esto es apropiado para desarrollo local, pero debe revisarse antes de un despliegue con otro dominio.

---

# 9. Base de datos

## 9.1 Conexión principal

Archivo:

```text
backend/config/database.js
```

Utiliza Sequelize con dialecto:

```text
mysql
```

Configuración global actual:

```text
timestamps: true
```

Por lo tanto, salvo que un modelo sobrescriba este comportamiento, Sequelize espera/maneja timestamps.

### Pool

Configuración actual:

```text
max: 5
min: 0
acquire: 30000
idle: 10000
```

Interpretación:

* máximo 5 conexiones en pool;
* mínimo 0;
* hasta 30 segundos para adquirir conexión;
* una conexión ociosa puede liberarse después de 10 segundos.

### SQL logging

Actualmente:

```text
logging: false
```

Sequelize no imprime automáticamente cada query SQL.

Para debugging SQL temporal puede modificarse, pero **no debe dejarse habilitado indiscriminadamente en producción**.

---

## 9.2 Bootstrap

Archivo:

```text
backend/config/databaseBootstrap.js
```

La función principal es:

```text
initializeDatabase()
```

Flujo actual:

```text
loadModels()
    ↓
db.authenticate()
    ↓
db.sync()
    ↓
resultado de conexión
```

### Estado actual importante

Actualmente está activo:

```js
await db.sync();
```

Actualmente están desactivados:

```js
// await db.sync({ alter: true });
// await ensureForeignKeyConstraints();
// await runModelSeeds();
```

### Regla para el equipo

**No activar `alter: true`, foreign keys automáticas o seeds en producción sin revisar previamente su impacto.**

`sync({ alter: true })` puede modificar estructuras existentes automáticamente.

Antes de activarlo:

1. revisar diferencias de esquema;
2. respaldar la BD;
3. comprobar relaciones;
4. validar datos existentes;
5. preferir migraciones controladas cuando el cambio lo amerite.

---

## 9.3 Foreign keys

La lógica está implementada en:

```text
databaseBootstrap.js
```

y las definiciones se encuentran en:

```text
databaseBootstrapConfig.js
```

El sistema puede:

1. consultar `information_schema.TABLE_CONSTRAINTS`;
2. determinar si una FK ya existe;
3. crearla mediante Sequelize QueryInterface;
4. definir `onUpdate`;
5. definir `onDelete`.

Defaults del helper:

```text
ON UPDATE CASCADE
ON DELETE SET NULL
```

Las definiciones concretas pueden sobrescribirlos.

Actualmente la ejecución automática está desactivada.

---

## 9.4 Seeds

Existe soporte para modelos que implementen:

```js
model.seed = async () => {
    ...
}
```

El orden prioritario está definido en:

```text
databaseBootstrapConfig.js
```

mediante:

```text
SEED_ORDER
```

`runModelSeeds()`:

1. ejecuta primero modelos listados en `SEED_ORDER`;
2. registra cuáles fueron ejecutados;
3. posteriormente ejecuta cualquier otro modelo con `seed()`.

Actualmente:

```js
// await runModelSeeds();
```

está desactivado.

---

# 10. Modelos y asociaciones

Directorio:

```text
backend/models/
```

## Autoload

Los modelos **no necesitan registrarse manualmente uno por uno**.

`backend/models/index.js` lee el directorio y carga automáticamente cualquier archivo que termine en:

```text
.model.js
```

Flujo:

```text
models/
   ↓
buscar *.model.js
   ↓
import dinámico
   ↓
default(db, DataTypes)
   ↓
models[model.name] = model
   ↓
associate(models)
```

## Convención obligatoria

Un modelo nuevo debe seguir:

```text
nombre.model.js
```

y exportar por defecto una función compatible con:

```js
export default (db, DataTypes) => {
    ...
    return Model;
};
```

## Asociaciones

Después de cargar **todos** los modelos, el loader recorre el registro.

Si un modelo contiene:

```js
Model.associate = (models) => {
    ...
};
```

la función se ejecuta automáticamente.

Esto permite crear relaciones cuando todos los modelos ya existen en memoria.

### Importante

No crear asociaciones que dependan del orden alfabético de carga.

Utilizar siempre:

```js
Model.associate = (models) => {}
```

para relaciones entre modelos.

---

## Entidades principales

### Usuarios y acceso

* Users
* Sessions
* UserDevices
* AccessCodes
* Attempts

### Seguridad

* Roles
* Permissions
* PresetPermissions
* UserPermissions

### Contenido

* news
* news_comments
* likes

### Comunidad

* community
* user_community
* user_community_request

### Progreso

* emblems
* goals
* user_emblems
* user_goals

### Sistema

* system_settings
* system_statuses
* Menu
* catalog

### Soporte

* tickets
* tickets_messages

### Ediciones

* edition
* edition_dates
* edition_rules

### Comandos

* commands
* commandPermissions

La lista puede crecer. Para conocer la fuente de verdad, revisar:

```text
backend/models/
```

---

# 11. Sistema de rutas

Directorio:

```text
backend/routes/
```

El proyecto utiliza **autoload de rutas**.

Esto significa que añadir una ruta correctamente nombrada dentro del árbol puede hacer que sea descubierta automáticamente.

## Estructura conceptual

```text
routes/
├── admin/
├── auth/
├── home/
├── system/
├── user/
└── index.js
```

La primera carpeta determina el prefijo funcional.

Ejemplos:

```text
routes/auth/...     → /auth/...
routes/user/...     → /user/...
routes/system/...   → /system/...
routes/admin/...    → /admin/...
routes/home/...     → /home/...
```

Además, `FOLDER` puede anteponerse globalmente desde `server.js`.

Ejemplo:

```env
FOLDER=/api
```

Resultado:

```text
/api/admin/...
/api/user/...
/api/auth/...
```

## Convención

Los archivos de rutas deben respetar la convención esperada por el loader:

```text
*Routes.js
```

### Advertencia

Mover un archivo de:

```text
routes/user/
```

a:

```text
routes/admin/
```

puede cambiar el endpoint público.

**Mover rutas no es solamente una reorganización interna.**

---

## Módulos principales

### Auth

Responsabilidades:

* login;
* registro;
* verificación de códigos;
* logout;
* recuperación de contraseña.

Endpoints importantes:

```text
POST /auth/login
POST /auth/register
POST /auth/verify-code
POST /auth/logout
POST /auth/request-password-recovery
POST /auth/reset-password
```

### User

Responsabilidades:

* perfil;
* credencial;
* noticias;
* comunidades;
* progreso;
* streamer;
* tickets.

Ejemplos:

```text
GET /user/profile
GET /user/credential
GET /user/news
GET /user/progress/emblems
GET /user/tickets
```

### System

Información transversal.

Ejemplos:

```text
GET   /system/menu
GET   /system/public-settings
GET   /system/settings
PATCH /system/settings
```

### Admin

Administración del sistema.

Incluye:

* usuarios;
* roles;
* permisos;
* tickets;
* reportes;
* ediciones;
* catálogos;
* comunidades;
* configuración.

Ejemplos:

```text
GET   /admin/users
PATCH /admin/user/:id/details
GET   /admin/roles
GET   /admin/reports/tickets
GET   /admin/editions
```

---

# 12. Controllers y flujo de una petición

Los controllers viven en:

```text
backend/controllers/
```

Organizados por dominio funcional.

Regla general:

```text
Route
  ↓
Middlewares
  ↓
Controller
  ↓
Modelos/helpers
  ↓
Response
```

## Responsabilidad de una route

Una route debería definir principalmente:

* método HTTP;
* path;
* autenticación;
* permisos;
* controller.

No debe convertirse en el lugar principal de lógica de negocio.

## Responsabilidad de controller

El controller:

* valida datos propios del caso de uso;
* coordina modelos;
* ejecuta operaciones;
* genera respuesta HTTP;
* registra auditoría cuando corresponde.

## Helpers

Código reutilizable o transversal debe preferirse en:

```text
backend/helpers/
```

si no pertenece naturalmente a un controller.

---

# 13. Autenticación y sesiones

Archivo central:

```text
backend/middlewares/verifyToken.js
```

La autenticación no se basa únicamente en comprobar que el JWT tenga una firma válida.

El middleware valida:

1. presencia del Bearer token;
2. firma JWT;
3. usuario;
4. existencia de sesión persistida;
5. que la sesión no esté revocada;
6. que no esté expirada;
7. información necesaria para continuar con autorización.

Conceptualmente:

```text
Authorization: Bearer <JWT>
          ↓
     jwt.verify()
          ↓
        User
          ↓
       Session
          ↓
 ¿activa / vigente?
          ↓
       Request
```

Esto permite **revocación server-side**.

Aunque un JWT siga siendo criptográficamente válido, una sesión revocada en BD debe dejar de autorizar peticiones.

---

## Sesiones

Helper relacionado:

```text
backend/helpers/CreateSession.js
```

Modelo relacionado:

```text
Sessions
```

La sesión persistida permite controlar:

* vigencia;
* expiración;
* revocación;
* relación usuario/dispositivo;
* acceso activo.

## Logout

El logout no debe entenderse solamente como “borrar localStorage”.

El backend dispone de sesiones persistidas, por lo que la revocación server-side forma parte del modelo de seguridad.

---

# 14. Autorización y permisos

Middleware:

```text
backend/middlewares/checkPermissions.js
```

La autorización ocurre **después de autenticación**.

Diferencia:

```text
verifyToken
    ↓
¿Quién eres?

checkPermissions
    ↓
¿Qué puedes hacer?
```

## Sistema

Existen:

* roles;
* permisos;
* presets;
* permisos individuales.

Modelos relacionados:

```text
Roles
Permissions
PresetPermissions
UserPermissions
```

Helper:

```text
backend/helpers/applyRolePresetPermissions.js
```

## Ejemplos de permisos

```text
users.view
users.edit

roles.view
roles.gest
roles.edit
roles.remove

permissions.view
permissions.gest
permissions.edit
permissions.remove

tickets.view
tickets.manage
tickets.police
tickets.close

system.view
system.gest
system.edit

news.create
news.edit
news.delete
```

La lista real debe consultarse en los modelos/seeds/configuración correspondiente.

## Regla

Una pantalla oculta en frontend **NO constituye autorización**.

Todo endpoint sensible debe validar permisos en backend.

Frontend:

```text
mejora UX
```

Backend:

```text
aplica seguridad
```

---

# 15. Logging y auditoría

Tierra de Todos utiliza **dos capas complementarias**:

```text
                logAction()
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
       Winston           MySQL Logs
   consola/archivo        auditoría
```

---

## 15.1 Winston

Archivo:

```text
backend/helpers/winston.js
```

Responsable de:

* consola;
* logs generales;
* logs de error;
* rotación;
* retención.

### Directorio

```text
backend/logs/
```

Se crea automáticamente si no existe.

### Log general

Formato:

```text
logs/combined-%DATE%.log
```

Configuración:

```text
rotación diaria
máximo 20 MB
retención 14 días
archivo comprimido
JSON
```

### Errores

Formato:

```text
logs/error-%DATE%.log
```

Configuración:

```text
rotación diaria
máximo 20 MB
retención 30 días
archivo comprimido
JSON
```

### Consola

En desarrollo se muestra información ampliada.

Fuera de desarrollo, el comportamiento de consola se reduce para evitar exposición innecesaria de información.

---

# 15.2 Auditoría MySQL

Archivo:

```text
backend/helpers/logger.js
```

Conexión:

```text
backend/config/databaseLogs.js
```

Utiliza una base independiente.

Esto evita mezclar la auditoría operativa con las tablas principales de la aplicación.

---

## Tablas mensuales

El logger determina automáticamente:

```text
Logs_YYYY_MM
```

Ejemplo:

```text
Logs_2026_09
```

Cuando cambia el mes:

1. calcula el nombre;
2. comprueba si existe;
3. si no existe, crea la tabla;
4. guarda los nuevos eventos allí.

No es necesario crear manualmente la tabla mensual en condiciones normales.

---

## Campos de auditoría

La tabla registra:

```text
id
usuario
username
ip
device
fecha
accion
apartado
tabla
query
condicion
valor
old_data
```

## Tipos de operación

El campo `query` contempla:

```text
select
insert
update
delete
click
N/A
```

---

## `old_data`

Para operaciones:

```text
update
delete
```

el logger puede consultar previamente el registro afectado y almacenar su estado anterior en:

```text
old_data
```

Esto permite reconstruir qué existía antes de una modificación.

### Importante

Para que funcione correctamente deben proporcionarse:

* `tabla`;
* `condicion`;
* tipo `update` o `delete`.

---

## Sanitización

`logger.js` contiene sanitización de valores sensibles antes de persistirlos.

Esto es especialmente importante para:

* JWT;
* Bearer tokens;
* passwords;
* secrets;
* credenciales.

### Regla de seguridad

**No asumir que por existir sanitización es correcto enviar secretos deliberadamente al logger.**

Nunca registrar intencionalmente:

```text
passwords
JWT completos
refresh tokens
API keys
cookies de autenticación
secretos
```

La sanitización es una segunda barrera, no una licencia para loggear credenciales.

---

## `injectLogAction`

Middleware:

```text
backend/middlewares/injectLogAction.js
```

Expone una función de auditoría dentro del request:

```js
req.logAction(...)
```

Esto permite a los controllers registrar acciones sin reconstruir manualmente todo el contexto del request.

Usarlo para operaciones relevantes como:

* login;
* cambios administrativos;
* creación;
* modificación;
* eliminación;
* cambios de permisos;
* cambios de configuración;
* operaciones sensibles.

---

# 16. Manejo de errores

Directorio:

```text
backend/handlers/
```

El manejo de errores debe buscar:

1. no exponer información sensible;
2. responder con status HTTP correcto;
3. registrar errores relevantes;
4. mantener formato consistente.

Ejemplos conceptuales:

```text
400 → request inválido
401 → no autenticado
403 → autenticado sin autorización
404 → recurso inexistente
409 → conflicto
500 → error interno
```

No devolver stack traces al cliente en producción.

---

# 17. Códigos de acceso y verificación

Helpers:

```text
backend/helpers/createCodes.js
backend/helpers/verifyCodes.js
```

Modelos relacionados:

```text
AccessCodes
Attempts
UserDevices
```

Son utilizados en flujos que requieren validación adicional, por ejemplo:

* dispositivo nuevo;
* recuperación;
* validaciones temporales.

Al modificar estos flujos revisar conjuntamente:

```text
controller
helper
modelo
expiración
intentos
logging
correo
```

No modificar únicamente el frontend.

---

# 18. Correo electrónico

Puntos principales:

```text
backend/helpers/emailTemplates.js
backend/emails/
```

Separación esperada:

```text
controller
    ↓
helper / servicio
    ↓
template
    ↓
envío
```

Cuando se agregue un nuevo correo:

1. mantener el template separado de la lógica HTTP;
2. no introducir secretos directamente en templates;
3. validar datos interpolados;
4. comprobar URLs para development/production;
5. registrar fallo de envío sin guardar códigos o secretos innecesarios.

---

# 19. Archivos públicos y uploads

Express publica:

```text
backend/public/
```

mediante:

```js
express.static('public')
```

Actualmente existen uploads como:

```text
backend/public/uploads/community-logos/
```

## Precaución

Todo lo que se coloque en `public/` debe considerarse potencialmente accesible mediante HTTP.

Nunca guardar allí:

* `.env`;
* respaldos SQL;
* archivos internos;
* credenciales;
* documentos privados;
* dumps;
* logs.

Para nuevos tipos de upload validar:

* extensión;
* MIME;
* tamaño;
* nombre generado;
* path;
* permisos;
* posibilidad de ejecución;
* política de reemplazo/eliminación.

---

# 20. Frontend

Estructura:

```text
frontend/src/
├── api/
├── assets/
├── components/
├── elements/
├── img/
├── layouts/
├── pages/
├── templates/
├── utils/
├── App.css
├── App.jsx
├── index.css
└── main.jsx
```

## Responsabilidades

### `api/`

Comunicación HTTP con backend.

### `assets/`

Recursos estáticos importados por React/Vite.

### `components/`

Componentes funcionales reutilizables.

### `elements/`

Elementos visuales/base reutilizables.

### `layouts/`

Estructuras persistentes de páginas.

### `pages/`

Pantallas asociadas a rutas.

### `templates/`

Composiciones reutilizables de UI.

### `utils/`

Funciones auxiliares frontend.

### `App.jsx`

Router/composición principal de la aplicación.

### `main.jsx`

Entry point de React.

---

# 21. Cliente HTTP / API frontend

Directorio:

```text
frontend/src/api/
```

El cliente Axios centraliza la comunicación.

Comportamiento esperado:

* `baseURL` centralizada;
* Bearer token;
* timeout;
* tratamiento de errores comunes;
* redirección ante autenticación inválida.

Conceptualmente:

```text
Component/Page
     ↓
API function
     ↓
Axios
     ↓
Authorization: Bearer JWT
     ↓
Backend
```

## Regla

No crear instancias Axios independientes dentro de cada página salvo que exista una razón técnica documentada.

Centralizar comportamiento común evita:

* diferentes URLs;
* headers inconsistentes;
* manejo distinto de 401;
* duplicación.

---

# 22. Routing frontend

Archivo principal:

```text
frontend/src/App.jsx
```

La aplicación separa rutas públicas y privadas.

## Públicas

Entre otras:

```text
/
/login
/register
/verifyAccess
/password-recovery
```

## Privadas

Bajo el layout autenticado se encuentran pantallas como:

```text
/start
/profile
/progress
/news
/tickets
/players
/community
/commands
/users
/gestion
/reports
/emblems-admin
```

## Layout persistente

`DashboardLayout` permite mantener el shell principal mientras cambia el contenido hijo.

Esto evita remontar innecesariamente elementos como:

* navegación;
* header;
* controles;
* menú móvil.

---

# 23. Cómo agregar funcionalidad

Esta sección define el procedimiento recomendado para nuevos desarrollos.

---

## 23.1 Nuevo modelo

Crear:

```text
backend/models/<nombre>.model.js
```

Debe respetar el contrato esperado por el autoloader.

Pasos:

1. definir campos;
2. definir nombre de modelo/tabla correctamente;
3. configurar índices necesarios;
4. definir `associate(models)` si tiene relaciones;
5. considerar si requiere seed;
6. revisar FK;
7. iniciar en entorno de desarrollo;
8. verificar esquema generado;
9. probar CRUD;
10. revisar logs.

No importar manualmente el modelo en `models/index.js`.

---

## 23.2 Nuevo endpoint

Ejemplo:

```text
backend/routes/user/exampleRoutes.js
backend/controllers/user/exampleController.js
```

Procedimiento:

1. determinar módulo;
2. crear controller;
3. crear route;
4. aplicar `verifyToken` si es privada;
5. aplicar `checkPermissions` si corresponde;
6. validar entrada;
7. ejecutar operación;
8. registrar auditoría si corresponde;
9. manejar errores;
10. probar respuestas.

Casos mínimos:

```text
✓ éxito
✓ datos inválidos
✓ recurso inexistente
✓ usuario no autenticado
✓ usuario sin permiso
✓ conflicto
✓ error interno controlado
```

---

## 23.3 Nuevo permiso

Antes de crear uno:

1. comprobar que no exista uno equivalente;
2. mantener convención de nombres;
3. decidir roles/presets;
4. proteger endpoint backend;
5. adaptar menú/UI;
6. comprobar usuario con permiso;
7. comprobar usuario sin permiso.

Nunca implementar un permiso únicamente ocultando un botón.

---

## 23.4 Nueva página React

Crear dentro de:

```text
frontend/src/pages/
```

Después:

1. agregar ruta en `App.jsx`;
2. decidir si es pública/privada;
3. utilizar API centralizada;
4. respetar layout existente;
5. aplicar controles visuales de permisos;
6. probar loading/error/empty states;
7. probar responsive.

---

## 23.5 Nueva operación auditada

Desde un request utilizar:

```text
req.logAction(...)
```

Proporcionar información útil:

```text
accion
apartado
tabla
query
condicion
valor
```

según corresponda.

Evitar:

```text
password
JWT
secret
token completo
datos privados innecesarios
```

Para `update/delete`, revisar si `old_data` debe conservar el estado anterior.

---

# 24. Convenciones del proyecto

## Modelos

```text
*.model.js
```

son descubiertos automáticamente.

## Rutas

```text
*Routes.js
```

son descubiertas por el sistema de rutas.

## Asociaciones

Definirlas mediante:

```js
Model.associate = (models) => {}
```

## Variables de entorno

Nunca versionar:

```text
.env
```

Actualizar:

```text
.env.example
```

cuando aparezca una nueva variable obligatoria.

## Seguridad

Nunca confiar en validaciones frontend para proteger recursos.

## Logging

Toda operación sensible/importante debe considerar auditoría.

## Código compartido

Evitar duplicar lógica existente en:

```text
helpers/
utils/
api/
components/
```

## Documentación

Un cambio arquitectónico debe actualizar este documento.

---

# 25. Debugging y troubleshooting

## Backend no inicia

Revisar:

```text
backend/.env
```

y especialmente:

```text
db_name
db_user
db_pass
db_host
db_port
```

Comprobar acceso a MySQL.

---

## Error de base de datos

Revisar:

```text
backend/config/database.js
backend/config/databaseBootstrap.js
```

Recordar que actualmente se ejecuta:

```text
db.sync()
```

y no:

```text
db.sync({ alter: true })
```

---

## Un modelo no aparece

Comprobar:

1. archivo dentro de `backend/models/`;
2. termina en `.model.js`;
3. tiene `default export`;
4. retorna un modelo Sequelize válido;
5. no falla durante import;
6. `model.name` es correcto.

Después revisar:

```text
backend/models/index.js
```

---

## Una asociación falla

Comprobar:

```js
Model.associate = (models) => {}
```

y que el nombre utilizado coincida con:

```js
models[model.name]
```

No asumir que el nombre de archivo es igual al nombre del modelo.

---

## Una ruta devuelve 404

Revisar:

1. ubicación del archivo;
2. nombre `*Routes.js`;
3. carpeta funcional;
4. path interno;
5. `FOLDER`;
6. proxy frontend.

Ejemplo:

```text
routes/admin/usersRoutes.js
```

no tiene el mismo prefijo que:

```text
routes/user/usersRoutes.js
```

---

## 401

Revisar:

* header Authorization;
* JWT;
* `JWT_SECRET`;
* expiración;
* usuario;
* sesión;
* revocación.

Recordar:

```text
JWT válido ≠ sesión válida
```

---

## 403

El usuario está autenticado, pero no autorizado.

Revisar:

```text
checkPermissions.js
Roles
Permissions
PresetPermissions
UserPermissions
```

---

## Frontend no conecta

Revisar:

```text
VITE_API_BASE
VITE_API_PORT
vite.config.js
```

y comprobar que backend esté activo.

En desarrollo revisar `/api`.

---

## CORS

Actualmente `server.js` permite:

```text
http://localhost:5173
```

Si el frontend se ejecuta desde otro origen, revisar CORS.

---

## Logs no aparecen en archivos

Revisar:

```text
backend/helpers/winston.js
```

y permisos de escritura sobre:

```text
backend/logs/
```

---

## Logs no aparecen en MySQL

Revisar:

```text
DB_LOGS
DB_USER
DB_PASS
DB_HOST
DB_PORT
```

y:

```text
backend/config/databaseLogs.js
backend/helpers/logger.js
```

Comprobar además permisos para:

```text
CREATE TABLE
INSERT
SELECT
```

porque el sistema crea tablas mensuales automáticamente.

---

## `old_data` no aparece

Sólo se obtiene cuando existe información suficiente para consultar el registro anterior.

Revisar:

```text
tabla
condicion
query
```

y que `query` sea:

```text
update
```

o:

```text
delete
```

---

# 26. Consideraciones de producción

Antes de desplegar:

## Entorno

```env
NODE_ENV=production
```

## Secretos

Usar valores seguros para:

```text
JWT_SECRET
credenciales MySQL
credenciales de correo
cualquier API key
```

## CORS

No dejar el origen de localhost como configuración final.

Mover/configurar los orígenes de producción de forma controlada.

## Base de datos

No activar automáticamente:

```text
sync({ alter: true })
```

sin evaluación.

Preferir cambios de esquema controlados.

## Logs

Comprobar:

* permisos del directorio;
* rotación;
* espacio en disco;
* conexión a BD logs;
* política de retención.

## Uploads

Comprobar:

* tamaño máximo;
* extensiones;
* MIME;
* almacenamiento;
* backups;
* permisos.

## Proxy

En producción es recomendable que el servidor web/reverse proxy gestione:

* HTTPS;
* dominio;
* frontend estático;
* proxy hacia API;
* headers.

---

# 27. Flujo de trabajo para el equipo

Recomendación:

```text
main
  ↑
PR
  ↑
feature/<descripcion>
```

Ejemplo:

```bash
git checkout main
git pull
git checkout -b feature/ticket-filters
```

Después:

```bash
git add .
git commit -m "feat: add ticket filters"
git push origin feature/ticket-filters
```

Crear PR.

## Evitar desarrollar directamente sobre `main`

Especialmente con múltiples desarrolladores.

---

## Commits recomendados

Ejemplos:

```text
feat: add community moderation
fix: prevent duplicated sessions
refactor: centralize permission checks
docs: update database bootstrap documentation
chore: update dependencies
test: add auth integration tests
```

No es obligatorio adoptar Conventional Commits estrictamente, pero mantener mensajes descriptivos facilita mantenimiento.

---

# 28. Checklist antes de PR

Antes de solicitar revisión:

### Código

* [ ] La funcionalidad hace lo esperado.
* [ ] No hay código de debugging olvidado.
* [ ] No hay `console.log` innecesarios.
* [ ] No se duplicó un helper existente.
* [ ] Los nombres siguen las convenciones.

### Backend

* [ ] Endpoints privados utilizan autenticación.
* [ ] Endpoints sensibles utilizan permisos.
* [ ] Inputs están validados.
* [ ] Status HTTP son adecuados.
* [ ] Operaciones importantes generan auditoría.
* [ ] No se registran secretos.

### Base de datos

* [ ] Relaciones revisadas.
* [ ] Índices revisados.
* [ ] Cambios de esquema identificados.
* [ ] No se activó `alter` accidentalmente.
* [ ] Se consideró compatibilidad con datos existentes.

### Frontend

* [ ] Loading state.
* [ ] Error state.
* [ ] Empty state si aplica.
* [ ] Permisos visuales.
* [ ] Responsive.
* [ ] No hay llamadas HTTP duplicadas innecesarias.

### Seguridad

* [ ] No hay passwords/tokens/API keys hardcodeados.
* [ ] `.env` no está versionado.
* [ ] No se confía en frontend para autorización.
* [ ] No se expone información sensible en errores.

### Documentación

* [ ] README actualizado si cambió arquitectura.
* [ ] `.env.example` actualizado si cambió configuración.
* [ ] Se documentó cualquier procedimiento nuevo no evidente.

---

# 29. Deuda técnica y precauciones conocidas

Esta sección documenta aspectos que un desarrollador debe conocer antes de modificarlos.

## Bootstrap

Actualmente:

```js
await db.sync();
```

Mientras:

```js
db.sync({ alter: true })
ensureForeignKeyConstraints()
runModelSeeds()
```

están implementados pero desactivados.

No reactivarlos sin revisar el estado real de la BD.

---

## CORS

Actualmente existe configuración específica para desarrollo local:

```text
http://localhost:5173
```

Debe parametrizarse antes de depender de múltiples entornos.

---

## Testing

La cobertura automatizada debe ampliarse.

Áreas prioritarias:

```text
auth
sessions
permissions
password recovery
device verification
admin endpoints
tickets
```

Especialmente probar:

```text
sesión válida
sesión expirada
sesión revocada
JWT inválido
usuario sin permiso
usuario con permiso
```

---

## Dependencias

Antes de agregar una dependencia:

1. comprobar que no exista una solución ya instalada;
2. justificar su uso;
3. revisar mantenimiento;
4. revisar vulnerabilidades;
5. evitar paquetes frontend dentro de backend y viceversa.

---

## `node_modules`

`node_modules` no debe formar parte del código fuente versionado.

Las dependencias deben reproducirse mediante:

```text
package.json
package-lock.json
```

y:

```bash
npm install
```

---

# Regla de oro para nuevos desarrolladores

Antes de modificar una parte del sistema, localizar primero su flujo completo.

Ejemplo:

```text
Frontend Page
    ↓
frontend/src/api
    ↓
backend/routes
    ↓
middlewares
    ↓
controller
    ↓
helper/model
    ↓
database
    ↓
auditoría
```

Evitar resolver problemas saltándose capas existentes.

Si una funcionalidad ya tiene una arquitectura establecida, extender esa arquitectura antes de crear una implementación paralela.

---

# Resumen rápido de onboarding

Un desarrollador nuevo debería leer, en este orden:

```text
1. README.md
2. backend/server.js
3. backend/config/database.js
4. backend/config/databaseBootstrap.js
5. backend/models/index.js
6. backend/routes/index.js
7. backend/middlewares/verifyToken.js
8. backend/middlewares/checkPermissions.js
9. backend/helpers/logger.js
10. frontend/src/App.jsx
11. frontend/src/api/
12. un módulo completo route → controller → model
```

Después de eso debería poder seguir el flujo principal del sistema sin necesidad de inspeccionar todo el repositorio.

---

# Mantenimiento de esta documentación

Este README forma parte del sistema.

Debe actualizarse cuando cambie cualquiera de estos elementos:

* estructura de carpetas;
* variables de entorno;
* bootstrap;
* base de datos;
* autenticación;
* sesiones;
* permisos;
* logging;
* routing;
* convenciones;
* deployment;
* procedimiento para agregar funcionalidades.

Una modificación que vuelva incorrecta esta documentación debe considerar la actualización del README como parte de la misma tarea.

---

## Proyecto

**Tierra de Todos 3**

Servidor WEB | Tierra de Todos

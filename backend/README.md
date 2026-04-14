# Backend - Tierra de Todos 3 (TDT3)

API REST de autenticacion, autorizacion por permisos y administracion de usuarios/roles para TDT3.

## 1. Que hace este backend

- Autenticacion con JWT + sesiones persistidas en base de datos.
- Verificacion de nuevo dispositivo con codigo temporal.
- Sistema de permisos por rol y permisos individuales por usuario.
- Menu dinamico segun permisos.
- Modulo de administracion para roles y usuarios.
- Auditoria y logging (Winston + tablas mensuales en BD de logs).

## 2. Stack y herramientas

### Core
- Node.js + Express 5
- Sequelize 6 + mysql2
- dotenv

### Seguridad
- jsonwebtoken (JWT)
- bcrypt
- cors
- csurf (instalado)

### Observabilidad
- winston
- winston-daily-rotate-file
- chalk

### Desarrollo
- nodemon

## 3. Estructura principal

```txt
backend/
  server.js
  config/
    database.js
    databaseLogs.js
  controllers/
    admin/
    auth/
    profile/
    system/
  helpers/
  middlewares/
  models/
  routes/
```

## 4. Flujo de arranque

Al iniciar `server.js`:

1. Crea la app de Express.
2. Carga modelos dinamicamente (`loadModels()`).
3. Se conecta a MySQL (`db.authenticate()`).
4. Sincroniza esquema con `db.sync({ alter: true })`.
5. Ejecuta seeds automaticamente para modelos que implementan `seed()`.
6. Aplica middlewares globales (`cors`, `injectLogAction`, `secureDelay`, parsers JSON/urlencoded).
7. Monta rutas con prefijo opcional `FOLDER`.
8. Inicia el servidor en `PORT`.

## 5. Variables de entorno

El backend usa estas variables:

### Servidor
- `NODE_ENV` (ej: `development`)
- `PORT` (ej: `3000`)
- `BACKEND_URL` (ej: `http://localhost`)
- `FOLDER` (prefijo de rutas, opcional)
- `JWT_SECRET` (clave de firma JWT)
- `SECURE_DELAY` (delay en ms para respuestas)

### Base principal
- `db_name`
- `db_user`
- `db_pass`
- `db_host`
- `db_port`

### Base de logs
- `DB_LOGS`
- `DB_USER`
- `DB_PASS`
- `DB_HOST`
- `DB_PORT`

Notas:
- El proyecto usa dos conexiones: una principal y otra para logs.

## 6. Scripts

```bash
npm install
npm run dev   # desarrollo (nodemon)
npm start     # ejecucion normal
```

## 7. Endpoints

Si `FOLDER` esta vacio, los prefijos quedan como abajo.

### Health
- `GET /`
  - Respuesta HTML indicando que el backend esta activo.

### Auth (`/auth`)
- `POST /auth/login`
  - Login por usuario/email + password.
  - Puede disparar verificacion de nuevo dispositivo.
- `POST /auth/verify-code`
  - Verifica codigo temporal de acceso y emite JWT.
- `POST /auth/register`
  - Registro de usuario nuevo.
- `POST /auth/logout` (requiere JWT)
  - Revoca sesion actual o todas segun payload.

### User (`/user`) (requiere JWT)
- `GET /user/profile`
  - Datos de perfil, estado y dispositivos.
- `GET /user/menu`
  - Menu visible segun permisos del usuario.

### Admin (`/admin`) (requiere JWT + permisos)
- `GET /admin/roles` (`gest.roles`)
- `POST /admin/roles` (`gest.roles`)
- `PUT /admin/roles/:id` (`gest.roles`)
- `DELETE /admin/roles/:id` (`gest.roles`)

- `GET /admin/users` (`menu.users`)
- `GET /admin/user/:id` (`user.view` o `user.edit`)
- `PATCH /admin/user/:id/details` (`menu.users` o `menu.userscontrol`)
- `PATCH /admin/user/:id/role` (`menu.users` o `menu.userscontrol`)
- `PATCH /admin/user/:id/permissions` (`menu.users` o `menu.userscontrol`)

## 8. Middlewares clave

- `verifyToken`
  - Valida JWT y sesion activa/no revocada/no expirada.
- `checkPermissions(requiredPermissions)`
  - Autoriza acceso si el usuario tiene algun permiso requerido.
- `injectLogAction`
  - Inyecta `req.logAction()` para auditar acciones en cualquier controlador.
- `secureDelay`
  - Retarda respuestas segun `SECURE_DELAY` para endurecer contra timing attacks.

## 9. Seguridad implementada

- Anti brute-force en login y verificacion de codigo.
- Verificacion de dispositivo por hash `IP + User-Agent`.
- Codigos temporales con expiracion.
- Sesiones JWT persistidas en BD y revocables.
- Permisos granulares para endpoints administrativos.

## 10. Logging y auditoria

### Winston
- Logs a consola.
- Rotacion diaria de archivos.

### Auditoria en BD
- Se crea/usa tabla mensual tipo `Logs_YYYY_MM`.
- Registra accion, usuario, IP, device y metadata de consulta.
- Puede capturar estado previo (`old_data`) en `update/delete`.

## 11. Modelos principales

- `Users`
- `Roles`
- `Permissions`
- `PresetPermissions`
- `UserPermissions`
- `Sessions`
- `AccessCodes`
- `UserDevices`
- `Attempts`
- `UserStatuses`
- `UserStatusHistory`
- `Menu`

El cargado de modelos es dinamico desde `models/index.js` y aplica asociaciones automaticamente.

## 12. Flujo funcional resumido

1. Usuario hace login (`/auth/login`).
2. Si el dispositivo es nuevo, se genera codigo temporal.
3. Usuario verifica codigo (`/auth/verify-code`).
4. Backend autoriza dispositivo, crea sesion y entrega JWT.
5. Cliente consume `/user/*` y `/admin/*` con `Authorization: Bearer <token>`.

## 13. Recomendaciones para produccion

- Definir un `JWT_SECRET` robusto y privado.
- Ajustar CORS al dominio real del frontend.
- Revisar `db.sync({ alter: true })` para estrategia de migraciones formal.
- Configurar backups para BD principal y BD de logs.
- Ejecutar el backend detras de proxy seguro (HTTPS).

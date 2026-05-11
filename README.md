# TDT 3 - Documentacion Tecnica Real

Este README documenta el estado real del proyecto segun el codigo actual de `backend/` y `frontend/`.

## 1. Arquitectura General

### Backend
- Stack: `Node.js + Express + Sequelize + MySQL`.
- Entrada principal: `backend/server.js`.
- Carga de rutas dinamica: `backend/routes/index.js` monta todos los archivos `*Routes.js` recursivamente.
- Prefijo de rutas por carpeta:
1. `backend/routes/auth/*` -> `/auth/*`
2. `backend/routes/home/*` -> `/home/*`
3. `backend/routes/system/*` -> `/system/*`
4. `backend/routes/user/*` -> `/user/*`
5. `backend/routes/admin/*` -> `/admin/*`

### Frontend
- Stack: `React + Vite + React Router + Axios`.
- Entrada principal de rutas: `frontend/src/App.jsx`.
- Layout autenticado principal: `frontend/src/layouts/DashboardLayout.jsx`.

## 2. Flujo de Seguridad y Middleware

### Middleware global en servidor
En `backend/server.js` se aplica este orden:
1. `injectLogAction` (inyecta `req.logAction`).
2. `secureDelay` (retarda respuestas con `SECURE_DELAY`).
3. Parseo de body (`urlencoded` y `json`).
4. Rutas.

### Autenticacion JWT
`backend/middlewares/verifyToken.js`:
1. Valida header `Authorization: Bearer <token>`.
2. Verifica JWT con `JWT_SECRET`.
3. Busca usuario en `Users`.
4. Valida sesion activa en `Sessions` (`revoked = false`, `expiresAt > now`).
5. Carga permisos de usuario en `req.user.permissions` desde `user_permissions`.

### Control de permisos
`backend/middlewares/checkPermissions.js`:
1. Recibe arreglo de permisos requeridos.
2. Soporta alias:
	- `catalog.news_type.*` <-> `news_types.*`
	- `catalog.ticket_status.*` <-> `ticket_statuses.*`
3. Consulta `user_permissions` + `Permissions.active = 1`.
4. Si no hay permiso, retorna `403`.

## 3. Manejo de Errores

### Handler reutilizable
`backend/handlers/handleError.js`:
1. Hace rollback de transaccion si existe.
2. Registra log de error via `req.logAction`.
3. Responde `500` con mensaje generico en produccion.

### Errores de auth/permiso
1. `verifyToken` responde `401` en token ausente/invalido/sesion revocada.
2. `checkPermissions` responde `403` en falta de permisos.

## 4. Sistema de Logs (archivo + base de datos)

### Logs a archivo y consola
`backend/helpers/winston.js`:
1. Consola (filtrada por ambiente).
2. Rotacion diaria `logs/combined-%DATE%.log`.
3. Rotacion diaria de errores `logs/error-%DATE%.log`.

### Logs a base de datos
`backend/helpers/logger.js` + `backend/config/databaseLogs.js`:
1. Usa conexion separada `DB_LOGS`.
2. Crea tabla mensual dinamica `Logs_YYYY_MM` si no existe.
3. Sanitiza datos sensibles (JWT, tokens, passwords, authorization).
4. Limita longitudes de campos para evitar overflow.
5. Guarda metadata: usuario, ip, device, accion, query, old_data, etc.

## 5. Endpoints Backend Existentes

Base URL real:
1. Dev frontend usa proxy `/api` (`frontend/src/api/axios.js`).
2. Backend directo: `http://<BACKEND_URL>:<PORT>/<prefijo>`.

### 5.1 Auth (`/auth`)
1. `POST /auth/login`
2. `POST /auth/register`
3. `POST /auth/verify-code`
4. `POST /auth/resend-verify-code`
5. `POST /auth/logout` (JWT)
6. `GET /auth/google/authorized`
7. `GET /auth/google/unauthorized`
8. `POST /auth/request-password-recovery`
9. `POST /auth/reset-password`

### 5.2 Home Publico (`/home`)
1. `GET /home/news`
2. `GET /home/rules`
3. `GET /home/timeline`

### 5.3 User (`/user`)
1. `GET /user/credential` (JWT)
2. `POST /user/avatar` (JWT, upload)
3. `PATCH /user/avatar/position` (JWT)
4. `DELETE /user/avatar` (JWT)
5. `GET /user/commands` (JWT)
6. `GET /user/communities` (JWT)
7. `GET /user/community` (JWT)
8. `GET /user/communities/can-manage` (JWT)
9. `POST /user/community/:id/join` (JWT)
10. `POST /user/community/:id/leave` (JWT)
11. `GET /user/community/requests` (JWT)
12. `DELETE /user/community/requests/:requestId` (JWT)
13. `GET /user/community/members` (JWT)
14. `POST /user/communities` (JWT, `community.manage`)
15. `POST /user/communities/logo` (JWT, upload, `community.manage`)
16. `GET /user/community/manage/requests` (JWT, `community.manage`)
17. `PATCH /user/community/requests/:requestId/approve` (JWT, `community.manage`)
18. `PATCH /user/community/requests/:requestId/reject` (JWT, `community.manage`)
19. `DELETE /user/community/members/:memberId` (JWT, `community.manage`)
20. `GET /user/news` (JWT)
21. `GET /user/news/types` (JWT)
22. `GET /user/news/:id/comments` (JWT)
23. `POST /user/news/:id/likes` (JWT)
24. `POST /user/news` (JWT, `news.create`)
25. `PUT /user/news/:id` (JWT, `news.edit`)
26. `DELETE /user/news/:id` (JWT, `news.delete`)
27. `POST /user/news/:id/image` (JWT, upload, `news.create|news.edit`)
28. `POST /user/news/:id/comments` (JWT)
29. `POST /user/news/:id/comments/:commentId/likes` (JWT)
30. `GET /user/players` (JWT)
31. `GET /user/profile` (JWT)
32. `PATCH /user/profile/email` (JWT)
33. `PATCH /user/profile/username` (JWT)
34. `POST /user/profile/verify-change` (JWT)
35. `DELETE /user/profile/devices/:id` (JWT)
36. `GET /user/progress/emblems` (JWT)
37. `PUT /user/progress/emblems` (JWT)
38. `GET /user/streamer` (JWT)
39. `PUT /user/streamer` (JWT, upload opcional)
40. `GET /user/tickets` (JWT)
41. `POST /user/tickets` (JWT)
42. `GET /user/tickets/:id/messages` (JWT)
43. `POST /user/tickets/:id/messages` (JWT)

### 5.4 System (`/system`)
1. `GET /system/menu` (JWT)
2. `GET /system/public-settings`
3. `GET /system/settings` (JWT, `system.view`)
4. `PATCH /system/settings` (JWT, `system.edit`)
5. `GET /system/health` (JWT, `system.view`)
6. `GET /system/tickets/catalogs` (JWT, `menu.tickets` o `ticket_catalogs.view`)
7. `GET /system/achievements/catalog` (JWT, `emblems.view|goals.view|emblems.gest|goals.gest`)
8. `GET /system/achievements/users` (JWT, `emblems.give`)
9. `GET /system/achievements/user-emblems` (JWT, `emblems.give`)
10. `POST /system/achievements/user-emblems` (JWT, `emblems.give`)
11. `PATCH /system/achievements/user-emblems/:id` (JWT, `emblems.give`)
12. `DELETE /system/achievements/user-emblems/:id` (JWT, `emblems.give`)
13. `GET /system/achievements/emblems` (JWT, `emblems.view`)
14. `POST /system/achievements/emblems/upload-icon` (JWT, upload, `emblems.gest|emblems.edit`)
15. `POST /system/achievements/emblems` (JWT, `emblems.gest`)
16. `PUT /system/achievements/emblems/:id` (JWT, `emblems.edit`)
17. `DELETE /system/achievements/emblems/:id` (JWT, `emblems.remove`)
18. `GET /system/achievements/goals` (JWT, `goals.view`)
19. `POST /system/achievements/goals` (JWT, `goals.gest`)
20. `PUT /system/achievements/goals/:id` (JWT, `goals.edit`)
21. `DELETE /system/achievements/goals/:id` (JWT, `goals.remove`)

### 5.5 Admin (`/admin`)
#### Reportes
1. `GET /admin/reports/tickets` (`tickets.view|tickets.police`)
2. `GET /admin/reports/tickets/:id/messages` (`tickets.view|tickets.manage|tickets.police`)
3. `POST /admin/reports/tickets/:id/messages` (`tickets.manage|tickets.police`)
4. `PATCH /admin/reports/tickets/:id/close` (`tickets.close`)
5. `PATCH /admin/reports/tickets/:id/reject` (`tickets.close`)

#### Usuarios
1. `GET /admin/users` (`users.view`)
2. `GET /admin/user/:id` (`users.view`)
3. `PATCH /admin/user/:id/details` (`users.edit`)
4. `PATCH /admin/user/:id/role` (`users.edit`)
5. `PATCH /admin/user/:id/permissions` (`users.edit`)

#### Gestion - roles/permisos/status
1. `GET /admin/roles` (`roles.view`)
2. `POST /admin/roles` (`roles.gest`)
3. `PUT /admin/roles/:id` (`roles.edit`)
4. `DELETE /admin/roles/:id` (`roles.remove`)
5. `GET /admin/roles/:id/permissions` (`roles.view`)
6. `PATCH /admin/roles/:id/permissions` (`roles.edit`)
7. `GET /admin/permissions` (`permissions.view`)
8. `POST /admin/permissions` (`permissions.gest`)
9. `PUT /admin/permissions/:id` (`permissions.edit`)
10. `DELETE /admin/permissions/:id` (`permissions.remove`)
11. `GET /admin/statuses` (`statuses.view`)
12. `POST /admin/statuses` (`statuses.gest`)
13. `PUT /admin/statuses/:id` (`statuses.edit`)
14. `DELETE /admin/statuses/:id` (`statuses.remove`)

#### Gestion - sesiones/dispositivos
1. `GET /admin/sessions` (`sessions.view`)
2. `PATCH /admin/sessions/:id/revoke` (`sessions.edit`)
3. `GET /admin/devices` (`devices.view`)
4. `GET /admin/devices/:deviceHash/history` (`devices.view`)
5. `PATCH /admin/devices/:deviceHash/users/:userId/authorization` (`devices.edit`)

#### Gestion - ediciones
1. `GET /admin/editions` (`editions.view`)
2. `POST /admin/editions` (`editions.gest`)
3. `GET /admin/editions/:id/resources` (`editions.view`)
4. `PUT /admin/editions/:id` (`editions.edit`)
5. `PATCH /admin/editions/:id/open` (`editions.gest`)
6. `PATCH /admin/editions/:id/close` (`editions.gest`)
7. `POST /admin/editions/:id/dates` (`editions.gest`)
8. `PUT /admin/editions/:id/dates/:dateId` (`editions.edit`)
9. `DELETE /admin/editions/:id/dates/:dateId` (`editions.edit`)
10. `POST /admin/editions/:id/dates/import-previous` (`editions.gest`)
11. `POST /admin/editions/:id/rules` (`editions.gest`)
12. `PUT /admin/editions/:id/rules/:ruleId` (`editions.edit`)
13. `DELETE /admin/editions/:id/rules/:ruleId` (`editions.edit`)
14. `POST /admin/editions/:id/rules/import-previous` (`editions.gest`)
15. `DELETE /admin/editions/:id` (`editions.remove`)

#### Gestion - catalogos y comandos
1. `GET /admin/news-types` (`catalog.news_type.view`)
2. `POST /admin/news-types` (`catalog.news_type.gest`)
3. `PUT /admin/news-types/:id` (`catalog.news_type.edit`)
4. `DELETE /admin/news-types/:id` (`catalog.news_type.remove`)
5. `GET /admin/ticket-statuses` (`catalog.ticket_status.view`)
6. `POST /admin/ticket-statuses` (`catalog.ticket_status.gest`)
7. `PUT /admin/ticket-statuses/:id` (`catalog.ticket_status.edit`)
8. `DELETE /admin/ticket-statuses/:id` (`catalog.ticket_status.remove`)
9. `GET /admin/ticket-catalogs` (`ticket_catalogs.view`)
10. `POST /admin/ticket-catalogs/types` (`ticket_catalogs.gest`)
11. `PUT /admin/ticket-catalogs/types/:id` (`ticket_catalogs.edit`)
12. `DELETE /admin/ticket-catalogs/types/:id` (`ticket_catalogs.remove`)
13. `POST /admin/ticket-catalogs/priorities` (`ticket_catalogs.gest`)
14. `PUT /admin/ticket-catalogs/priorities/:id` (`ticket_catalogs.edit`)
15. `DELETE /admin/ticket-catalogs/priorities/:id` (`ticket_catalogs.remove`)
16. `GET /admin/commands` (`commands.view`)
17. `GET /admin/commands/permissions` (`commands.view`)
18. `POST /admin/commands` (`commands.gest`)
19. `PUT /admin/commands/:id` (`commands.edit`)

#### Gestion - comunidades y sistema
1. `GET /admin/communities` (`communities.view`)
2. `PUT /admin/communities/:id` (`communities.gest`)
3. `DELETE /admin/communities/:id/logo` (`communities.gest`)
4. `DELETE /admin/communities/:id` (`communities.remove`)
5. `GET /admin/communities/:id/member-options` (`communities.view`)
6. `POST /admin/communities/:id/bulk-action` (`communities.gest`)
7. `GET /admin/system-settings` (`system.view`)
8. `GET /admin/system-settings/links` (`system.view`)
9. `PUT /admin/system-settings/links` (`system.gest`)
10. `PUT /admin/system-settings/:key` (`system.gest`)

## 6. Permisos: usados y necesarios

### 6.1 Permisos requeridos por rutas backend
Permisos detectados en `checkPermissions([...])`:

1. `catalog.news_type.view`
2. `catalog.news_type.gest`
3. `catalog.news_type.edit`
4. `catalog.news_type.remove`
5. `catalog.ticket_status.view`
6. `catalog.ticket_status.gest`
7. `catalog.ticket_status.edit`
8. `catalog.ticket_status.remove`
9. `commands.view`
10. `commands.gest`
11. `commands.edit`
12. `communities.view`
13. `communities.gest`
14. `communities.remove`
15. `community.manage`
16. `devices.view`
17. `devices.edit`
18. `editions.view`
19. `editions.gest`
20. `editions.edit`
21. `editions.remove`
22. `emblems.view`
23. `emblems.gest`
24. `emblems.edit`
25. `emblems.remove`
26. `emblems.give`
27. `goals.view`
28. `goals.gest`
29. `goals.edit`
30. `goals.remove`
31. `menu.tickets`
32. `news.create`
33. `news.edit`
34. `news.delete`
35. `permissions.view`
36. `permissions.gest`
37. `permissions.edit`
38. `permissions.remove`
39. `roles.view`
40. `roles.gest`
41. `roles.edit`
42. `roles.remove`
43. `sessions.view`
44. `sessions.edit`
45. `statuses.view`
46. `statuses.gest`
47. `statuses.edit`
48. `statuses.remove`
49. `system.view`
50. `system.gest`
51. `system.edit`
52. `ticket_catalogs.view`
53. `ticket_catalogs.gest`
54. `ticket_catalogs.edit`
55. `ticket_catalogs.remove`
56. `tickets.view`
57. `tickets.manage`
58. `tickets.police`
59. `tickets.close`
60. `users.view`
61. `users.edit`

### 6.2 Permisos de menu (seed actual)
Definidos en `backend/seeders/20260427-menu-seed.js`:

1. `menu.start`
2. `menu.news`
3. `menu.players`
4. `menu.tickets`
5. `menu.reports`
6. `menu.profile`
7. `menu.community`
8. `menu.userscontrol`
9. `menu.gestion`

### 6.3 Permisos usados por frontend en UI
Adicionales detectados en frontend:

1. `news.create`
2. `news.edit`
3. `news.delete`
4. `menu.tickets`
5. `commands.manage` (tambien `Commands.manage`)
6. `Communities.admin`

Nota: `commands.manage`/`Commands.manage` y `Communities.admin` no coinciden con el backend actual (`commands.gest`, `communities.gest`/`communities.view`/`communities.remove`). Conviene normalizar nomenclatura para evitar desajustes de UI.

## 7. Modelos Sequelize (todos)

Fuente: `backend/models/*.model.js`.

1. `AccessCodes` (`access_codes`): codigos de verificacion por dispositivo/login.
2. `Attempts` (`Attempts`): historial de intentos/acciones de usuario (estado, razon, ip, ua).
3. `catalog` (`catalog`): catalogo generico por categoria (key, name, color, orden).
4. `command_permissions` (`command_permissions`): pivote comando-permiso.
5. `commands` (`commands`): comandos del juego y permisos asociados.
6. `community` (`community`): comunidades (lider, colores, descripcion, logo).
7. `Edition` (`edition`): ediciones/eventos principales.
8. `EditionDates` (`edition_dates`): fechas/hitos por edicion.
9. `EditionRules` (`edition_rules`): reglas por edicion.
10. `emblems` (`emblems`): insignias por edicion.
11. `goals` (`goals`): metas/logros asociados a emblemas/edicion.
12. `likes` (`likes`): likes por objetivo (`targetType`, `targetId`).
13. `Menu` (`Menu`): entradas de menu dinamicas con permisos requeridos.
14. `news` (`news`): noticias publicadas.
15. `news_comments` (`news_comments`): comentarios de noticias.
16. `Permissions` (`Permissions`): catalogo central de permisos.
17. `PresetPermissions` (`preset_permissions`): permisos por rol predefinido.
18. `Roles` (`Roles`): catalogo de roles y estilos visuales.
19. `Sessions` (`Sessions`): sesiones JWT activas/revocadas.
20. `streamer` (`streamer`): perfil streamer por usuario.
21. `system` (`system_settings`): configuraciones del sistema.
22. `system_statuses` (`system_statuses`): catalogo de estatus de sistema.
23. `tickets` (`tickets`): tickets de soporte/denuncia.
24. `tickets_messages` (`tickets_messages`): mensajes internos de ticket.
25. `Users` (`Users`): usuarios principales.
26. `user_emblems` (`user_emblems`): emblemas ganados/equipados por usuario.
27. `user_goals` (`user_goals`): progreso de usuario por meta.
28. `user_community` (`user_community`): membresia de usuarios en comunidades.
29. `user_community_request` (`user_community_request`): solicitudes de ingreso a comunidad.
30. `UserDevices` (`user_devices`): dispositivos autorizados por usuario.
31. `UserEdition` (`user_editions`): relacion usuario-edicion.
32. `UserMails` (`user_mails`): cambios de correo pendientes/verificados.
33. `UserPasswords` (`User_passwords`): historial/cambios de password.
34. `UserPermissions` (`user_permissions`): permisos efectivos por usuario.
35. `user_profile_images` (`user_profile_images`): avatar/crop del perfil.
36. `user_status_history` (`user_status_history`): historial de cambios de estatus de usuario.
37. `UserTokens` (`user_tokens`): tokens de flujo (recovery/verificacion).
38. `UserUsernames` (`user_usernames`): cambios de username pendientes/verificados.

## 8. Pantallas Frontend (todas las existentes)

### 8.1 Ruteadas en `App.jsx`
1. `/` -> `pages/home/Home.jsx`
2. `/login` -> `pages/auth/Login.jsx`
3. `/register` -> `pages/auth/Register.jsx`
4. `/verifyAccess` -> `pages/auth/VerifyAccess.jsx`
5. `/password-recovery` -> `pages/auth/passwordRecovery.jsx`
6. `/profile` -> `pages/user/Profile.jsx`
7. `/progress` -> `pages/user/Progress.jsx`
8. `/start` -> `pages/user/start.jsx`
9. `/tickets` -> `pages/user/Tickets.jsx`
10. `/players` -> `pages/user/players.jsx`
11. `/news` -> `pages/user/news.jsx`
12. `/gestion` -> `pages/admin/gestion.jsx`
13. `/reports` -> `pages/admin/Reports.jsx`
14. `/emblems-admin` -> `pages/admin/Emblems.jsx`
15. `/commands` -> `pages/user/Commands.jsx`
16. `/community` -> `pages/user/Community.jsx`
17. `/users` -> `pages/admin/users.jsx`
18. `*` -> `pages/home/NotFound.jsx`

### 8.2 Descripcion funcional por pantalla
1. `Home`: landing publica, noticias/reglas/timeline publicos.
2. `Login`: inicio de sesion, soporte para flujo de dispositivo nuevo.
3. `Register`: alta de usuario.
4. `VerifyAccess`: validacion de codigo de acceso/verificacion.
5. `passwordRecovery`: recuperacion y reseteo de contrasena.
6. `Profile`: perfil de usuario, cambio de correo/username, avatar/dispositivos.
7. `Progress`: gestion y visualizacion de emblemas/logros del usuario.
8. `start`: pantalla inicial autenticada.
9. `Tickets`: bandeja y detalle de tickets del usuario.
10. `players`: listado de jugadores y accesos relacionados.
11. `news`: feed de noticias con comentarios/likes y CRUD condicionado por permisos.
12. `gestion`: panel administrativo por secciones (roles, permisos, estatus, sesiones, ediciones, catalogos, comandos, comunidades, sistema, achievements).
13. `Reports`: gestion administrativa de reportes/tickets.
14. `Emblems`: administracion de insignias/logros.
15. `Commands`: vista de comandos para usuario.
16. `Community`: vista de comunidad del usuario y operaciones de membresia.
17. `users`: administracion de usuarios, roles y permisos.
18. `NotFound`: pagina 404.

## 9. Observaciones tecnicas actuales

1. El README anterior estaba vacio; esta version documenta el estado implementado real.
2. Existen diferencias de nomenclatura de permisos entre frontend y backend en algunos casos (`*.manage`, mayusculas).
3. El sistema combina control por permiso explicito en ruta y control por menu dinamico (`/system/menu`).
4. Los logs se guardan doble: archivos rotativos + base de logs mensual.

## 10. Recomendacion de mantenimiento de esta documentacion

Actualizar este README cuando se modifique:
1. Cualquier archivo `backend/routes/*Routes.js`.
2. Middleware de seguridad (`verifyToken`, `checkPermissions`).
3. Estructura de `backend/models/*.model.js`.
4. Rutas de React en `frontend/src/App.jsx`.
5. Seeder de menu y nomenclatura de permisos.

## 11. Guia Operativa Rapida

### 11.1 Arranque local (desarrollo)
1. Backend:
	- Entrar a `backend/`.
	- Instalar dependencias: `npm install`.
	- Ejecutar: `npm run dev`.
2. Frontend:
	- Entrar a `frontend/`.
	- Instalar dependencias: `npm install`.
	- Ejecutar: `npm run dev`.
3. Verificar:
	- Backend levantado en `PORT`.
	- Frontend levantado en Vite.
	- Proxy de Vite activo usando `VITE_API_BASE` y `VITE_API_PORT`.

### 11.2 Arranque en modo produccion
1. Backend: `npm start` en `backend/`.
2. Frontend: `npm run build` y servir `dist/`.
3. Confirmar valores de `NODE_ENV`, DB principal, DB de logs y JWT.

### 11.3 Checklist de humo (post-deploy)
1. Login exitoso (`POST /auth/login`).
2. Carga de menu (`GET /system/menu`).
3. Lectura de perfil (`GET /user/profile`).
4. Logs en archivo (`logs/combined-*.log`) y tabla mensual `Logs_YYYY_MM`.
5. Acceso de modulo admin con usuario con permisos.

## 12. Variables de Entorno (operativas)

### 12.1 Backend criticas
1. `PORT`: puerto del servidor Express.
2. `NODE_ENV`: `development` o `production`.
3. `JWT_SECRET`: firma/verificacion de JWT.
4. `db_name`, `db_user`, `db_pass`, `db_host`, `db_port`: conexion DB principal.
5. `DB_LOGS`, `DB_USER`, `DB_PASS`, `DB_HOST`, `DB_PORT`: conexion DB de logs.

### 12.2 Backend funcionales
1. `BACKEND_URL`: URL base para logs y enlaces.
2. `FRONTEND_URL` o `APP_URL`: links de correos y recovery.
3. `FOLDER`: prefijo de montaje opcional de rutas.
4. `SECURE_DELAY`: retardo artificial de respuestas.
5. `SEND_MAIL`, `DANNBOT_MAIL_USER`, `DANNBOT_MAIL_PASS`: envio de correos.

### 12.3 Almacenamiento de archivos (R2/S3)
1. `R2_ENDPOINT`
2. `R2_ACCESS_KEY`
3. `R2_SECRET_KEY`
4. `R2_BUCKET`
5. `R2_PUBLIC_URL`
6. `R2_FOLDER`

### 12.4 Frontend criticas
1. `VITE_API_BASE`: host/base del backend para proxy.
2. `VITE_API_PORT`: puerto backend para proxy.

## 13. Runbook de Incidencias

### 13.1 Error 401 en rutas protegidas
1. Confirmar header `Authorization` con formato Bearer.
2. Validar `JWT_SECRET` consistente entre emision y validacion.
3. Revisar sesion en tabla `Sessions` (`revoked=0` y `expiresAt` vigente).
4. Revisar logs de auth en archivo y DB de logs.

### 13.2 Error 403 por permisos
1. Revisar permisos efectivos del usuario en `user_permissions`.
2. Confirmar permiso requerido por ruta (seccion 5 y 6).
3. Revisar si `Permissions.active = 1` para la key.
4. Validar diferencias de naming en frontend (`*.manage`) vs backend (`*.gest`).

### 13.3 Frontend sin datos (fallo de proxy)
1. Verificar `VITE_API_BASE` y `VITE_API_PORT`.
2. Confirmar backend activo y accesible.
3. Confirmar que frontend llama `/api/*` en dev.

### 13.4 No se registran logs en DB
1. Confirmar credenciales `DB_LOGS` y demas variables de logs.
2. Verificar permisos de usuario MySQL para crear tablas mensuales.
3. Revisar errores en `logs/error-*.log`.

### 13.5 Fallos de upload (imagenes)
1. Validar `R2_*` completos.
2. Confirmar bucket y permisos de escritura.
3. Confirmar limites de upload (middleware `uploadsCheck`).

## 14. Matriz de Trazabilidad (Endpoint -> Ruta -> Controlador)

Esta matriz permite ubicar rapidamente donde depurar cada endpoint.

### 14.1 Auth
1. Ruta: `backend/routes/auth/authenticateRoutes.js`
	- `/auth/login` -> `ctrlAuthenticate.authenticate`
	- `/auth/register` -> `ctrlRegister.register`
	- `/auth/verify-code` -> `ctrlVerify.verifyAccess`
	- `/auth/resend-verify-code` -> `ctrlVerify.resendAccessCode`
	- `/auth/logout` -> `ctrlLogout.logout`
	- `/auth/google/authorized` -> `ctrlGoogleAuth.handleGoogleAuth`
	- `/auth/google/unauthorized` -> `ctrlGoogleAuth.handleGoogleNoAuth`
2. Ruta: `backend/routes/auth/passwordRecoveryRoutes.js`
	- `/auth/request-password-recovery` -> `PasswordRecoveryController.requestPasswordRecovery`
	- `/auth/reset-password` -> `PasswordRecoveryController.resetPassword`

### 14.2 Home
1. Ruta: `backend/routes/home/pageRoutes.js`
	- `/home/news` -> `ctrlPage.getLatestNews`
	- `/home/rules` -> `ctrlPage.getActiveEditionRules`
	- `/home/timeline` -> `ctrlPage.getActiveEditionTimeline`

### 14.3 User
1. `backend/routes/user/profileRoutes.js` -> `ctrlProfile.*`
2. `backend/routes/user/ticketsRoutes.js` -> `ctrlTickets.*`
3. `backend/routes/user/newsRoutes.js` -> `ctrlNews.*`
4. `backend/routes/user/communityRoutes.js` -> `communityController.*` y `communityAdminController.*`
5. `backend/routes/user/playersRoutes.js` -> `ctrlPlayers.players`
6. `backend/routes/user/progressRoutes.js` -> `ctrlProgress.*`
7. `backend/routes/user/commandsRoutes.js` -> `ctrlCommands.getUserCommands`
8. `backend/routes/user/avatarRoutes.js` -> `ctrlAvatar.*`
9. `backend/routes/user/credentialRoutes.js` -> `ctrlCredential.credential`
10. `backend/routes/user/streamerRoutes.js` -> `ctrlStreamer.*`

### 14.4 System
1. `backend/routes/system/menuRoutes.js` -> `ctrlMenu.getUserMenu`
2. `backend/routes/system/systemRoutes.js` -> `ctrlSystem.*`
3. `backend/routes/system/ticketCatalogsRoutes.js` -> `ctrlTicketCatalogs.catalogs`
4. `backend/routes/system/achievementsRoutes.js` -> `ctrlAchievements.*`

### 14.5 Admin
1. `backend/routes/admin/reportsRoutes.js` -> `ctrlAdminReports.*`
2. `backend/routes/admin/users/usersRoutes.js` -> `ctrlUsers.*`
3. `backend/routes/admin/gestion/rolesRoutes.js` -> `ctrlRoles.*`
4. `backend/routes/admin/gestion/permissionsRoutes.js` -> `ctrlPermissions.*`
5. `backend/routes/admin/gestion/statusRoutes.js` -> `ctrlStatus.*`
6. `backend/routes/admin/gestion/sessionsRoutes.js` -> `ctrlSessions.*`
7. `backend/routes/admin/gestion/devicesRoutes.js` -> `ctrlDevices.*`
8. `backend/routes/admin/gestion/editionsRoutes.js` -> `ctrlEditions.*`
9. `backend/routes/admin/gestion/newsTypesRoutes.js` -> `ctrlNewsTypes.*`
10. `backend/routes/admin/gestion/ticketStatusRoutes.js` -> `ctrlTicketStatus.*`
11. `backend/routes/admin/gestion/ticketCatalogsRoutes.js` -> `ctrlTicketCatalogs.*`
12. `backend/routes/admin/gestion/commandsRoutes.js` -> `ctrlCommandsAdmin.*`
13. `backend/routes/admin/gestion/communitiesRoutes.js` -> `communitiesController.*`
14. `backend/routes/admin/gestion/systemRoutes.js` -> `ctrlSystemAdmin.*`

## 15. Deuda Tecnica Priorizada (alto impacto)

1. Estandarizar naming de permisos entre frontend y backend:
	- `commands.manage` -> `commands.gest`
	- `Communities.admin` -> usar llaves existentes `communities.*`
2. Definir convencion unica de nombres de tablas Sequelize:
	- Hoy coexisten `Users`, `Permissions`, `User_passwords`, `Attempts`, etc.
3. Agregar pruebas de humo automatizadas para:
	- Login.
	- Carga de menu.
	- Ruta protegida con permiso.
	- Escritura de logs en DB.
4. Publicar `.env.example` para backend y frontend con variables minimas obligatorias.

## 16. Flujos de Negocio Detallados (Backend)

### 16.1 Login con control anti abuso y dispositivo
Archivo base: `backend/controllers/auth/authenticateController.js`

1. Entrada esperada: `usuario`, `password`.
2. Validaciones y defensa:
	- Si faltan datos -> `400`.
	- Rate limit por IP en ventana de 5 min (>= 20 fallos) -> `429`.
	- Rate limit por usuario en ventana de 5 min (>= 5 fallos) -> `429`.
3. Si el usuario no existe:
	- Se ejecuta `bcrypt.compare` contra hash fijo para evitar user enumeration por timing.
	- Se registra intento en `Attempts`.
	- Retorna `401` generico.
4. Si password no coincide:
	- Guarda intento fallido en `Attempts`.
	- Retorna `401` generico.
5. Si login exitoso:
	- Limpia intentos fallidos previos de LOGIN.
	- Inserta intento `SUCCESS` en `Attempts`.
	- Garantiza registro en edicion activa (`UserEdition` con source `LOGIN`).
	- Calcula `deviceHash` y revisa `UserDevices`.
6. Dispositivo:
	- `DENIED` -> `403`.
	- No autorizado -> crea `PENDING`, genera AccessCode y retorna `{ type: "new_device" }`.
	- Autorizado -> actualiza `last_login`.
7. Sesion:
	- Emite JWT (`1d`).
	- Crea/renueva sesion via `CreateSession`.
	- Retorna `token` + bloque `user`.

### 16.2 Registro de usuario
Archivo base: `backend/controllers/auth/registerController.js`

1. Requiere edicion activa (`getActualEdition`), si no hay -> `409`.
2. Valida formato de email, username y password.
3. Opera dentro de transaccion:
	- Crea `Users` (role default `USER`).
	- Asigna `folio` (`TDT-########`).
	- Aplica preset de permisos por rol (`applyRolePresetPermissions`).
	- Registra dispositivo `PENDING` en `UserDevices`.
	- Genera codigo de acceso por correo.
	- Inserta `UserEdition` con source `REGISTER`.
4. Respuesta: `201` con `{ type: "new_device" }`.

### 16.3 Verificacion de dispositivo y reenvio
Archivo base: `backend/controllers/auth/verifyController.js`

1. `verifyAccess`:
	- Valida `codigo` + `usuario`.
	- Rate limit por usuario para `VERIFY-DEVICE` (>= 5 en 5 min) -> `429`.
	- Valida codigo hash en `AccessCodes`.
	- Marca codigo como usado y autoriza dispositivo en `UserDevices`.
	- Emite JWT y crea sesion.
2. `resendAccessCode`:
	- Busca codigo activo por usuario + device.
	- Reenvia por correo con `sendAccessCodeEmail`.

### 16.4 Recuperacion y reset de password
Archivo base: `backend/controllers/auth/passwordRecoveryController.js`

1. `requestPasswordRecovery`:
	- Acepta email desde `req.user` o `req.body`.
	- Si email no existe, responde `200` (sin filtrar existencia).
	- Genera JWT de recovery (`30m`) y guarda en `user_tokens` con `used=false`.
	- Envia correo con template.
2. `resetPassword`:
	- Verifica token JWT y token en DB.
	- `check=true` permite validar token sin cambiar password.
	- Valida largo de nueva password (8..128).
	- Rechaza reutilizacion de ultimas 10 passwords (`User_passwords` + bcrypt compare).
	- Guarda password anterior en historial.
	- Hash nueva password.
	- Revoca todas las sesiones activas (`Sessions.revoked=true`).
	- Marca token recovery como usado.

### 16.5 Perfil de usuario
Archivo base: `backend/controllers/user/profileController.js`

1. Cambio de email:
	- Crea registro en `user_mails` con `verifyCode` + expiracion 30m.
	- Envia codigo por correo.
2. Cambio de username:
	- Aplica directo (no usa codigo) y registra en `user_usernames` como `verified=true`.
	- Restriccion: max 1 cambio cada 3 meses.
3. Verificacion de cambios:
	- Para email verifica codigo vigente y aplica `Users.email`.
4. Perfil tambien integra:
	- Dispositivos autorizados/revocacion.
	- Imagen de perfil y posicion.
	- Datos de streamer y credencial.

### 16.6 Tickets (usuario)
Archivo base: `backend/controllers/user/ticketsController.js`

1. Limites y validaciones:
	- Maximo 2 tickets abiertos por usuario.
	- Longitudes: `subject<=200`, `description<=5000`, `evidence<=500`, `message<=5000`.
	- Coordenadas: si se envia alguna, X/Y/Z deben ser numericas.
2. Creacion:
	- Valida `typeKey` y `priorityKey` contra `catalog` activos.
	- Crea ticket y primer mensaje en una transaccion.
3. Lectura:
	- Retorna tickets del usuario con `unreadCount` (mensajes de fuente `REPORTS`, `seen_by_user=0`).

### 16.7 Tickets (admin/reports)
Archivo base: `backend/controllers/admin/reportsController.js`

1. Scope de acceso:
	- Derivado de `tickets.view`, `tickets.manage`, `tickets.police`, `tickets.close`.
	- `tickets.police` restringe a tipos `REPORTE` y `REPORTE_ROBO`.
2. Bandeja:
	- Por defecto solo `ABIERTO`.
	- Filtros `includeClosed`, `includeRejected`, `q`.
	- Orden por prioridad y antiguedad.
	- Incluye `unreadCount` por mensaje de fuente `TICKETS` no visto por admin.
3. Conversacion:
	- Marcar mensajes vistos por admin (`seenByAdmin=true`).
4. Respuesta admin:
	- Solo si ticket `ABIERTO`.
	- Crea mensaje con `authorRole='SYSTEM'` y `sourceScreen='REPORTS'`.
5. Cierre/Rechazo:
	- Solo sobre tickets `ABIERTO`.

### 16.8 Noticias
Archivo base: `backend/controllers/user/newsController.js`

1. Lectura:
	- Solo noticias de ultimos 4 meses.
	- Carga tipos de noticia activos (`catalog.news_type`).
	- Agrega `likesCount` y `likedByCurrentUser` por join en memoria.
2. CRUD:
	- Crear requiere `news.create`.
	- Editar requiere `news.edit`.
	- Eliminar requiere `news.delete`.
3. Imagenes:
	- Upload a R2 con `uploadsCheck` + cliente S3.
	- Si se reemplaza/elimina, intenta borrar objeto previo en bucket.

### 16.9 Comunidad
Archivos base: `backend/controllers/user/communityController.js`, `backend/controllers/user/communityAdminController.js`, `backend/controllers/admin/gestion/communitiesController.js`

1. Usuario:
	- Consulta comunidad actual, solicitudes y miembros.
	- Join/leave de comunidad.
2. Lider (`community.manage`):
	- Crear comunidad.
	- Subir logo.
	- Aprobar/rechazar solicitudes.
	- Expulsar miembros.
3. Admin (`communities.*`):
	- Listado global.
	- Edicion y acciones masivas.
	- Borrado de logo y eliminacion de comunidad.

### 16.10 Achievements (insignias y metas)
Archivo base: `backend/controllers/system/achievementsController.js`

1. Entidades: `emblems`, `goals`, `user_emblems`, `user_goals`.
2. Enumeraciones de negocio:
	- Rarezas de emblema.
	- Tipos y modo de progreso de metas.
3. API cubre:
	- Catalogo consolidado.
	- CRUD de emblemas y metas.
	- Asignacion de emblemas a usuario.
	- Upload de iconos a R2.

## 17. Contratos de API (resumen operativo)

### 17.1 Auth
1. `POST /auth/login`
	- Body: `{ usuario, password }`
	- Respuesta normal: `{ token, user: { id, username, role } }`
	- Respuesta nuevo dispositivo: `{ type: "new_device", message }`
2. `POST /auth/register`
	- Body: `{ email, password, username }`
	- Respuesta: `{ type: "new_device", message }`
3. `POST /auth/verify-code`
	- Body: `{ codigo, usuario }`
	- Respuesta: `{ token, user }`
4. `POST /auth/request-password-recovery`
	- Body: `{ email }` (o usuario autenticado)
	- Respuesta: mensaje generico de envio.
5. `POST /auth/reset-password`
	- Body: `{ token, password }` o `{ token, check: true }`

### 17.2 Tickets
1. `POST /user/tickets`
	- Body: `{ typeKey, priorityKey, subject, description, coordX?, coordY?, coordZ?, evidence? }`
2. `POST /user/tickets/:id/messages`
	- Body: `{ message }`
3. `POST /admin/reports/tickets/:id/messages`
	- Body: `{ message }`

### 17.3 News
1. `POST /user/news`
	- Body: `{ title, type, fecha, note }` (y/o payload complementario segun UI)
2. `POST /user/news/:id/image`
	- FormData: archivo `newsImage`
3. `POST /user/news/:id/comments`
	- Body: `{ comment }`
4. `POST /user/news/:id/likes`
	- Body vacio, toggle like.

### 17.4 Perfil
1. `PATCH /user/profile/email` -> `{ newEmail }`
2. `PATCH /user/profile/username` -> `{ newUsername }`
3. `POST /user/profile/verify-change` -> `{ code, type }`
4. `POST /user/avatar` -> FormData `avatar`
5. `PATCH /user/avatar/position` -> `{ posX, posY, zoom }`

## 18. Frontend: Mapa Pantalla -> APIs -> Permisos

### 18.1 Layout y shell de app
1. `DashboardLayout`:
	- Protege por token en localStorage.
	- Renderiza `HeadBar` + `Background` scrolleable + `MenuBar`.
2. `MenuBar`:
	- Carga menu dinamico desde `/system/menu`.
	- Construye acciones de usuario y admin segun `menuGroup`.

### 18.2 Pantallas usuario
1. `Profile`:
	- Consume `/user/profile`, `/user/credential`.
	- Cambios de identidad via `/user/profile/email`, `/user/profile/username`, `/user/profile/verify-change`.
	- Password recovery via `/auth/request-password-recovery`.
	- Avatar y streamer via endpoints `/user/avatar*` y `/user/streamer`.
2. `Tickets`:
	- Catalogos desde `/system/tickets/catalogs`.
	- Tickets propios desde `/user/tickets`.
	- Chat por ticket `/user/tickets/:id/messages`.
3. `news`:
	- Carga `/user/news` y permisos desde `/system/menu`.
	- UI condiciona botones por `news.create`, `news.edit`, `news.delete`.
4. `players`:
	- Habilita accion de tickets si trae `menu.tickets`.

### 18.3 Pantallas admin
1. `gestion`:
	- Sidebar de secciones administrativas.
	- Activa modulos segun permisos cargados desde `/system/menu`.
	- Actualmente usa llaves `commands.manage`/`Commands.manage` y `Communities.admin` (desalineadas con backend).
2. `users`:
	- Gestion de rol, permisos, estatus y detalle integral.
3. `reports`:
	- Bandeja administrativa de tickets con cierre/rechazo.

## 19. Inicializacion de Base de Datos y Referencias

### 19.1 Boot de DB
Archivo base: `backend/config/databaseBootstrap.js`

1. `loadModels()` carga y asocia modelos.
2. `db.authenticate()` valida conexion.
3. `db.sync({ alter: true })` sincroniza esquema.
4. `ensureForeignKeyConstraints()` agrega FKs faltantes.
5. `runModelSeeds()` ejecuta seeds por orden y luego resto de modelos con `seed()`.

### 19.2 Orden de seed configurado
Archivo base: `backend/config/databaseBootstrapConfig.js`

Orden explicito:
1. `Roles`
2. `Permissions`
3. `PresetPermissions`
4. `Users`
5. `Edition`
6. `news`
7. `community`
8. `emblems`
9. `user_profile_images`
10. `commands`
11. `command_permissions`
12. `UserPermissions`

### 19.3 Politica de FKs
1. Predomina `CASCADE` para relaciones dependientes.
2. Se usa `SET NULL` en historicos o referencias blandas.
3. Se usa `RESTRICT` para proteger lider de comunidad.

## 20. Responsabilidad de Helpers y Utils

### 20.1 Helpers
1. `createCodes.js`: genera y envia codigos de acceso por dispositivo.
2. `verifyCodes.js`: valida codigo, marca uso y autoriza dispositivo.
3. `CreateSession.js`: invalida sesion previa por device y crea sesion JWT persistida.
4. `applyRolePresetPermissions.js`: aplica permisos por preset de rol al usuario.
5. `emailTemplates.js`: envio de correo de recovery con template HTML.
6. `getEquippedEmblems.js`: consulta insignias equipadas de usuario.
7. `logger.js` + `winston.js`: logging estructurado en DB y archivo.

### 20.2 Utils
1. `generateDeviceHash.js`: huella de dispositivo para control de acceso.
2. `getEdition.js`: obtiene edicion activa para login/register.
3. `uploadsCheck.js`: validacion de tipo/tamano de archivos multipart.

## 21. Inconsistencias y Riesgos Detectados (documentados)

1. Naming de permisos desalineado entre frontend y backend:
	- Front usa `commands.manage`/`Commands.manage`, backend usa `commands.gest`.
	- Front usa `Communities.admin`, backend usa `communities.view|gest|remove`.
2. Mezcla de convenciones de nombres en tablas/modelos (`Users`/`Attempts`/`User_passwords`/snake_case).
3. `db.sync({ alter: true })` en runtime puede introducir riesgo en ambientes productivos si no se controla con migraciones.
4. Existen acentos con encoding irregular en algunos mensajes de respuesta/log; conviene normalizar UTF-8 de extremo a extremo.

## 22. Checklists Operativos de Desarrollo

### 22.1 Al agregar endpoint nuevo
1. Crear/actualizar archivo en `backend/routes/*`.
2. Agregar middleware de auth/permiso si aplica.
3. Implementar controlador y registrar logs de negocio.
4. Documentar permiso requerido en seccion 6.
5. Documentar endpoint en seccion 5 y trazabilidad en seccion 14.

### 22.2 Al agregar pantalla frontend
1. Definir ruta en `frontend/src/App.jsx`.
2. Conectar API en `frontend/src/api/axios.js`.
3. Ajustar menu dinamico (seed/menu y permisos).
4. Documentar pantalla y APIs consumidas.

### 22.3 Al agregar permiso nuevo
1. Crear permiso en catalogo `Permissions`.
2. Asignarlo a `PresetPermissions` si aplica.
3. Ajustar `checkPermissions` en rutas.
4. Alinear clave de permiso en frontend (`/system/menu`).


# TDT 3 – Arquitectura General del Sistema

## 📌 Idea Base

Desarrollar un **launcher personalizado** que:

- Instale automáticamente los mods según el perfil elegido
- Permita login del usuario
- Lance el juego
- Se comunique con el sistema web para detectar actualizaciones
- Valide acceso al servidor mediante token seguro
- Permita rollback de versiones
- Controle actualizaciones tanto del modpack como del launcher

---

# 🧱 Stack Tecnológico

| Componente        | Tecnología |
|------------------|------------|
| Base de Datos     | MySQL |
| Backend API       | Node.js |
| Launcher          | Electron |
| Servidor Minecraft| Vultam |
| Comunicación MC   | Plugin custom en Java |

---

# 🏗 Arquitectura por Capas

## 1️⃣ Sistema Web

### 🔐 Autenticación

- Login clásico:
  - `username` → Nunca editable
  - `displayName` → Editable
  - `email`
  - `password`

- OAuth:
  - Google OAuth
  - Discord OAuth

### 🎭 Roles

- `role_admin`
- `role_mod`
- `role_police`
- `role_streamer`
- `role_user`

### 🔑 Autenticación Cruzada

- Uso de JWT para autenticación entre:
  - Web
  - Launcher
  - Plugin del servidor

---

## 2️⃣ Launcher

### 🔐 Login Microsoft (Premium)

Flujo:

1. Microsoft OAuth
2. Servicios Mojang
3. Perfil Minecraft
4. Obtener:
   - `access_token`
   - `uuid oficial`
5. Vincular UUID con cuenta del sistema web

---

# 🔁 Flujo Completo del Usuario

```
[Crea cuenta en sistema WEB]
        ↓
[Descarga instalador]
        ↓
[Instala launcher]
        ↓
[Inicia launcher]
        ↓
[Inicia sesión en launcher]
        ↓
[API Node]
        ↓
[Base de datos]
        ↓
[Servidor Minecraft en Vultam]
        ↓
[Plugin personalizado]
        ↓
[API Node]
```

---

# 🎮 Sistema de Login Seguro con Token

## Flujo de Play

```
[Click en Play]
        ↓
[Launcher → POST /session/create]
        ↓
[API genera token expirable]
        ↓
[Minecraft inicia con token]
        ↓
[Jugador entra a Vultam]
        ↓
[Plugin intercepta login]
        ↓
[Plugin lee token]
        ↓
[Plugin llama API]
        ↓
[API valida token]
        ↓
[Permitir / Denegar acceso]
```

---

## 🔒 Reglas de Seguridad del Token

- El token debe:
  - Ser expirable
  - Ser de un solo uso
- Cuando el plugin lo valide:
  - Marcarlo inmediatamente como `USED`
- Si se detectan 2 validaciones simultáneas:
  - Invalidar ambas
  - Obligar reconexión

---

# 🧬 UUID Strategy

Servidor en:

```
online-mode=false
```

## Generación de UUID

```python
if user.isPremium:
    uuid = premium_uuid
else:
    uuid = deterministic_uuid_from_username
```

- Para no-premium:
  - Generar UUID v3/v5 basado en username
  - Siempre determinístico

---

# 🗂 Sistema de Sesiones

Tabla `sessions`:

| Campo | Descripción |
|-------|------------|
| user_id | ID del usuario |
| uuid | UUID del jugador |
| ip | IP |
| login_timestamp | Timestamp login |
| disconnect_timestamp | Timestamp salida |
| status | Estado |

### Estados posibles:

- `PENDING` → Token creado, no validado
- `ACTIVE`
- `DISCONNECTED`
- `EXPIRED`
- `KICKED`

---

## Reglas de sesión

- No permitir más de una sesión `ACTIVE`
- Al desconectarse:
  - Marcar como `DISCONNECTED`
- Permitir reconexión sin nuevo token si:
  - Desconexión < 2–5 minutos

---

# 📦 Sistema de Actualización de Mods

## Flujo

```
[Launcher inicia]
        ↓
[Comparar manifiesto local]
        ↓
[Pedir manifiesto API]
        ↓
[Comparar]
        ↓
[Descargar diferencias desde Cloudflare R2]
```

---

## 📁 Carpeta Global

```
C:\Users\Daniel\AppData\Local\TDT3\
```

Estructura:

```
/TDT3/
    /runtime/
    /instances/
        /low/
        /balanced/
        /high/
    /cache/
    /logs/
    launcher_config.json
```

---

## 📄 install_state.json

Durante instalación:

```json
{
  "status": "installing",
  "target_version": "3.2.0"
}
```

Cuando termina:

```json
{
  "status": "ready",
  "installed_version": "3.2.0"
}
```

Si `status != ready` → Modo reparación automático.

---

## 📜 Reglas del Manifest

Para cada archivo:

- Si no existe → descargar
- Si hash diferente → descargar
- Si existe pero no está en manifest → eliminar

### Descarga:

- 3–5 archivos en paralelo
- Barra de progreso
- Verificar SHA256 post-descarga
- Reintentar si falla

---

# 🔁 Rollback de Modpack

Manifest:

```json
{
  "version": "3.2.0",
  "previous": "3.1.9",
  "files": [...]
}
```

Tabla `modpack_versions`:

| Campo | Descripción |
|-------|------------|
| id | ID |
| version | Versión |
| manifest_json | JSON completo |
| active | Boolean |
| created_at | Timestamp |

---

# 🛠 Funciones del Launcher

- Reparar instalación
  - Borrar:
    - `/mods`
    - `/config`
    - `/shaderpacks`
    - `manifest_local.json`
  - Reinstalar desde manifiesto

- Reinstalar instancias
- Reinstalar todo
- Desinstalar completamente
- Limpiar cache
- Ver logs
- Forzar actualización
- Cambiar perfil

---

# 🔄 Sistema de Actualización del Launcher

Electron auto-update usando API propia.

Flujo:

```
[Launcher inicia]
        ↓
[Check update]
        ↓
[Si hay update]
        ↓
[Descargar]
        ↓
[Reiniciar launcher]
```

Manifest launcher:

```json
{
  "launcher_version": "1.2.3",
  "mandatory": true
}
```

Si `mandatory = true`:
- Bloquear botón Play
- Mostrar estado “Actualizando”

Releases almacenadas en Cloudflare R2.

---

# 🚫 Evitar múltiples instancias del Launcher

En `main.js`:

```javascript
const { app } = require('electron');

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // enfocar ventana existente
  });
}
```

---

# 🎯 Objetivo Final

Un ecosistema cerrado y controlado donde:

- El launcher controla:
  - Instalación
  - Integridad
  - Login
  - Tokens
  - Versionado
- El servidor solo acepta usuarios validados
- El backend centraliza:
  - Usuarios
  - Sesiones
  - Roles
  - Versiones
  - Seguridad
- Se puede:
  - Hacer rollback
  - Forzar updates
  - Bloquear versiones
  - Evitar exploits de sesión
  - Evitar duplicación de login

---

# 🔐 Principios Clave

- Token de un solo uso
- Sesiones controladas
- Integridad por hash
- Instalación transaccional
- UUID determinístico
- Actualizaciones diferenciales
- Control centralizado desde backend

---

**Este documento define la guía completa de funcionamiento del sistema TDT 3.**
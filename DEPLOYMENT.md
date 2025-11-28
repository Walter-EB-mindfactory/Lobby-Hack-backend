# Despliegue en Render

## Opción 1: Usando render.yaml (Blueprint) - RECOMENDADO

1. **Conecta tu repositorio de GitHub a Render:**
   - Ve a https://dashboard.render.com/
   - Click en "New +" → "Blueprint"
   - Conecta tu cuenta de GitHub
   - Selecciona el repositorio `Walter-EB-mindfactory/Lobby-Hack-backend`
   - Render detectará automáticamente el archivo `render.yaml`

2. **Configura las variables de entorno requeridas:**
   - `GOOGLE_CLIENT_ID`: Tu Client ID de Google OAuth
   - `GOOGLE_CLIENT_SECRET`: Tu Client Secret de Google OAuth
   - `GOOGLE_CALLBACK_URL`: `https://tu-app.onrender.com/api/auth/google/callback`
   - Las demás variables (DATABASE_PASSWORD, JWT_SECRET, etc.) se generarán automáticamente

3. **Despliega:**
   - Click en "Apply" para crear los servicios
   - Render creará automáticamente:
     - Base de datos PostgreSQL
     - Backend NestJS
     - Configurará las conexiones entre servicios

## Opción 2: Despliegue Manual

### Paso 1: Crear la Base de Datos PostgreSQL

1. En Render Dashboard, click "New +" → "PostgreSQL"
2. Configuración:
   - Name: `lobby-hack-db`
   - Database: `lobby_hack`
   - User: `postgres`
   - Region: Oregon (o el más cercano)
   - Plan: Free
3. Click "Create Database"
4. Guarda la "Internal Database URL" que aparecerá

### Paso 2: Crear el Web Service

1. En Render Dashboard, click "New +" → "Web Service"
2. Conecta tu repositorio de GitHub
3. Configuración:
   - Name: `lobby-hack-backend`
   - Region: Oregon (mismo que la base de datos)
   - Branch: `main`
   - Runtime: Docker
   - Plan: Free

4. **Variables de entorno:**
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_HOST=<host-de-tu-db-interna>
   DATABASE_PORT=5432
   DATABASE_USER=postgres
   DATABASE_PASSWORD=<password-de-tu-db>
   DATABASE_NAME=lobby_hack
   JWT_SECRET=<genera-un-string-aleatorio-seguro>
   JWT_REFRESH_SECRET=<genera-otro-string-aleatorio-seguro>
   GOOGLE_CLIENT_ID=<tu-google-client-id>
   GOOGLE_CLIENT_SECRET=<tu-google-client-secret>
   GOOGLE_CALLBACK_URL=https://tu-app.onrender.com/api/auth/google/callback
   ```

5. Click "Create Web Service"

### Paso 3: Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Selecciona tu proyecto
3. Edita tus credenciales OAuth 2.0
4. Agrega estas URIs autorizadas:
   - `https://tu-app.onrender.com`
   - `https://tu-app.onrender.com/api/auth/google/callback`
5. Guarda los cambios

## Verificación del Despliegue

Una vez desplegado, tu API estará disponible en:
- **API Base:** `https://tu-app.onrender.com/api`
- **Swagger Docs:** `https://tu-app.onrender.com/api/docs`
- **Health Check:** `https://tu-app.onrender.com/api`

## Endpoints Principales

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/google
GET    /api/auth/google/callback
POST   /api/auth/refresh
GET    /api/auth/profile

GET    /api/users
POST   /api/users
GET    /api/users/:id
PATCH  /api/users/:id
DELETE /api/users/:id

GET    /api/visits
POST   /api/visits
GET    /api/visits/:id
PATCH  /api/visits/:id
POST   /api/visits/:id/check-in
POST   /api/visits/:id/check-out

GET    /api/calendar/visits
GET    /api/calendar/my-visits

GET    /api/reports/visits
GET    /api/reports/metrics
```

## Consideraciones del Plan Free de Render

- ⚠️ Los servicios free se duermen después de 15 minutos de inactividad
- ⚠️ El primer request después de dormir puede tardar 50+ segundos
- ⚠️ 750 horas de compute por mes (suficiente para un servicio 24/7)
- ⚠️ Base de datos PostgreSQL free: 1GB de almacenamiento, expira en 90 días

## Actualizar el Despliegue

Render detecta automáticamente cambios en la rama `main`:
```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
```

Render iniciará un nuevo deploy automáticamente.

## Monitoreo

- **Logs:** Dashboard de Render → tu servicio → "Logs"
- **Métricas:** Dashboard de Render → tu servicio → "Metrics"
- **Events:** Dashboard de Render → tu servicio → "Events"

## Solución de Problemas

### Error: Cannot connect to database
- Verifica que DATABASE_HOST use la URL interna de la base de datos
- Asegúrate de que ambos servicios estén en la misma región

### Error: Google OAuth redirect_uri_mismatch
- Actualiza las URIs autorizadas en Google Cloud Console
- Verifica que GOOGLE_CALLBACK_URL coincida exactamente

### Error: Health check failed
- Revisa los logs en Render
- Verifica que el endpoint /api responda correctamente
- Asegúrate de que todas las variables de entorno estén configuradas

## Comandos Útiles

Generar secrets seguros (ejecutar localmente):
```bash
# Para JWT_SECRET y JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Soporte

- Documentación de Render: https://render.com/docs
- Dashboard: https://dashboard.render.com/

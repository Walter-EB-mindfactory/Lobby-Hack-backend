# Sistema de Gestión de Visitas - NestJS

Sistema modular de gestión de visitas corporativas con autenticación JWT y OAuth2, construido con NestJS, TypeORM y PostgreSQL.

## 🚀 Características

- **Arquitectura Modular**: Módulos independientes (Auth, Users, Visits, Calendar, Reports)
- **Autenticación Multi-método**: JWT y Google OAuth2
- **Autorización por Roles**: Admin, Recepcionista, Autorizante, Visitante
- **Base de Datos**: PostgreSQL con TypeORM
- **Documentación**: Swagger/OpenAPI integrado
- **Métricas**: Prometheus para monitoreo
- **Auditoría**: Registro completo de acciones
- **Docker**: Containerización completa

## 📋 Requisitos

- Node.js 20+
- PostgreSQL 16+ (o Docker)
- npm o yarn

## 🔧 Instalación

### Opción 1: Con Docker (Recomendado)

```bash
# 1. Clonar y entrar al directorio
cd Hackaton

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Levantar servicios
docker-compose up -d

# La API estará disponible en http://localhost:3000/api
# Swagger en http://localhost:3000/api/docs
```

### Opción 2: Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar base de datos PostgreSQL y variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 3. Ejecutar en desarrollo
npm run start:dev

# 4. La API estará disponible en http://localhost:3000/api
```

## 📁 Estructura del Proyecto

```
src/
├── common/
│   ├── decorators/       # Decoradores personalizados (@Roles, @CurrentUser)
│   ├── enums/            # Enumeraciones (UserRole, VisitStatus)
│   ├── guards/           # Guards de autorización
│   └── interceptors/     # Interceptors (Logging)
├── modules/
│   ├── auth/             # Autenticación JWT y OAuth
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/            # Gestión de usuarios
│   │   ├── dto/
│   │   ├── user.entity.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── visits/           # Gestión de visitas
│   │   ├── dto/
│   │   ├── visit.entity.ts
│   │   ├── audit-log.entity.ts
│   │   ├── visits.controller.ts
│   │   ├── visits.service.ts
│   │   └── visits.module.ts
│   ├── calendar/         # Calendario de visitas
│   │   ├── calendar.controller.ts
│   │   ├── calendar.service.ts
│   │   └── calendar.module.ts
│   └── reports/          # Reportes y métricas
│       ├── reports.controller.ts
│       ├── reports.service.ts
│       └── reports.module.ts
├── app.module.ts
└── main.ts
```

## 🔐 Roles y Permisos

### Roles Disponibles

- **Admin**: Acceso completo al sistema
- **Recepcionista**: Gestión de visitas y check-in/check-out
- **Autorizante**: Aprobación de visitas y acceso a reportes
- **Visitante**: Acceso básico (usuario por defecto)

### Endpoints Principales

#### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Login con email/password
- `GET /api/auth/google` - Login con Google OAuth
- `GET /api/auth/profile` - Obtener perfil del usuario actual

#### Usuarios
- `POST /api/users` - Crear usuario (Admin)
- `GET /api/users` - Listar usuarios (Admin, Recepcionista)
- `GET /api/users/:id` - Obtener usuario por ID
- `PATCH /api/users/:id` - Actualizar usuario (Admin)
- `DELETE /api/users/:id` - Eliminar usuario (Admin)

#### Visitas
- `POST /api/visits` - Crear visita (Recepcionista, Admin)
- `GET /api/visits` - Listar visitas (con filtros)
- `GET /api/visits/:id` - Obtener visita por ID
- `PATCH /api/visits/:id` - Actualizar visita
- `POST /api/visits/:id/checkin` - Check-in de visita
- `POST /api/visits/:id/checkout` - Check-out de visita
- `DELETE /api/visits/:id` - Eliminar visita (Admin)
- `GET /api/visits/audit-logs` - Logs de auditoría (Admin)

#### Calendario
- `GET /api/calendar/scheduled` - Visitas programadas por rango de fechas
- `GET /api/calendar/today` - Visitas de hoy
- `GET /api/calendar/upcoming` - Próximas visitas
- `GET /api/calendar/pending-approvals` - Visitas pendientes de aprobación

#### Reportes
- `GET /api/reports/statistics` - Estadísticas de visitas
- `GET /api/reports/visitors` - Reporte por empresa
- `GET /api/reports/authorizers` - Reporte por autorizante
- `GET /api/reports/audit` - Reporte de auditoría
- `GET /api/reports/metrics` - Métricas Prometheus

## 📊 Métricas y Monitoreo

### Prometheus

El endpoint `/api/reports/metrics` expone métricas en formato Prometheus:

- `visits_total` - Total de visitas por estado
- `visits_active` - Visitas activas en este momento
- `visit_duration_hours` - Histograma de duración de visitas

### Integración con Grafana

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'hackaton-visits'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/api/reports/metrics'
```

## 🔒 Configuración de Google OAuth

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. Crear un nuevo proyecto o seleccionar uno existente
3. Habilitar Google+ API
4. Crear credenciales OAuth 2.0
5. Configurar URLs autorizadas:
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
6. Copiar Client ID y Client Secret al archivo `.env`

## 🧪 Scripts Disponibles

```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod

# Testing
npm run test
npm run test:e2e
npm run test:cov

# Linting y Formato
npm run lint
npm run format
```

## 📚 Documentación API

Una vez iniciada la aplicación, acceder a:

- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json

## 🐳 Docker

### Comandos útiles

```bash
# Levantar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Detener servicios
docker-compose down

# Rebuild
docker-compose up -d --build

# Limpiar volúmenes
docker-compose down -v
```

## 🏗️ Principios de Diseño

- **Clean Architecture**: Separación clara de responsabilidades
- **SOLID**: Principios aplicados en toda la arquitectura
- **DRY**: Código reutilizable y modular
- **Validación**: Class-validator en todos los DTOs
- **Documentación**: Swagger para todos los endpoints
- **Seguridad**: JWT, OAuth2, Guards y validación de roles
- **Auditoría**: Registro completo de acciones

## 🔄 Flujo de Trabajo

### Registro de Visita

1. **Recepcionista** crea una nueva visita (programada o walk-in)
2. **Autorizante** aprueba la visita (si es necesaria autorización)
3. **Recepcionista** realiza check-in cuando el visitante llega
4. **Recepcionista** realiza check-out cuando el visitante se retira
5. Sistema registra todas las acciones en audit logs

## 📝 Entidades

### User
- id, email, passwordHash, googleId
- firstName, lastName, roles
- isActive, createdAt, updatedAt

### Visit
- id, visitorName, dni, company
- phoneNumber, email, purpose
- programada, status, scheduledDate
- checkinTime, checkoutTime
- authorizer (relación), notes

### AuditLog
- id, action, details
- entityType, entityId
- user (relación), ipAddress, timestamp

## 🚦 Estados de Visita

- `PENDING` - Pendiente de aprobación
- `APPROVED` - Aprobada
- `REJECTED` - Rechazada
- `IN_PROGRESS` - En curso (checked-in)
- `COMPLETED` - Completada (checked-out)
- `CANCELLED` - Cancelada

## 🛡️ Seguridad

- Passwords hasheados con bcrypt
- JWT con expiración configurable
- Guards para protección de rutas
- Validación de roles a nivel de endpoint
- CORS configurado
- Validación de entrada con class-validator
- Audit logs para trazabilidad

## 🔄 Pipeline CI/CD

El proyecto incluye un pipeline automatizado con:

- ✅ **Pre-commit**: ESLint + Prettier en archivos modificados
- ✅ **Pre-push**: Lint check + Tests
- ✅ **Commit messages**: Validación con Conventional Commits
- ✅ **GitHub Actions**: Lint, Test, Build y Docker

Ver [PIPELINE.md](./PIPELINE.md) para más detalles.

### Commits Convencionales

```bash
# Ejemplos válidos
git commit -m "feat: agregar endpoint de visitas"
git commit -m "fix: corregir validación de email"
git commit -m "docs: actualizar documentación"
git commit -m "test: agregar tests unitarios"
```

## 📝 Licencia

MIT

## 👥 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Hacer cambios siguiendo [Conventional Commits](https://www.conventionalcommits.org/)
4. Los hooks verificarán automáticamente tu código
5. Push a la rama (`git push origin feature/AmazingFeature`)
6. Abrir un Pull Request

## 📞 Soporte

Para soporte, crear un issue en el repositorio del proyecto.

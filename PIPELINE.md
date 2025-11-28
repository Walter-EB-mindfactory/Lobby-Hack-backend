# Pipeline CI/CD

Este proyecto incluye un pipeline automatizado de CI/CD con las siguientes características:

## 🔧 Pre-commit Hook

Se ejecuta **antes de cada commit** y realiza:

- ✅ **ESLint**: Corrige automáticamente errores de código
- ✅ **Prettier**: Formatea el código automáticamente
- 📝 Solo procesa archivos que están en staging (lint-staged)

```bash
# Se ejecuta automáticamente al hacer commit
git add .
git commit -m "feat: nueva funcionalidad"
```

## 🚀 Pre-push Hook

Se ejecuta **antes de cada push** y realiza:

- ✅ **Lint Check**: Verifica que no haya errores de ESLint
- ✅ **Tests**: Ejecuta todos los tests unitarios

```bash
# Se ejecuta automáticamente al hacer push
git push origin main
```

## 📝 Commit Message Validation

Los mensajes de commit deben seguir [Conventional Commits](https://www.conventionalcommits.org/):

### Tipos permitidos:

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bugs
- `docs`: Documentación
- `style`: Formato, espacios, etc.
- `refactor`: Refactorización de código
- `perf`: Mejoras de rendimiento
- `test`: Tests
- `chore`: Tareas de mantenimiento
- `ci`: Cambios en CI/CD
- `build`: Cambios en build
- `revert`: Revertir cambios

### Ejemplos válidos:

```bash
git commit -m "feat: agregar autenticación OAuth2"
git commit -m "fix: corregir error en login"
git commit -m "docs: actualizar README"
git commit -m "test: agregar tests para AuthService"
```

### Ejemplos inválidos:

```bash
git commit -m "cambios varios"  # ❌ No tiene tipo
git commit -m "Fix bug"         # ❌ Tipo debe estar en minúscula
```

## 🤖 GitHub Actions CI/CD

El pipeline se ejecuta automáticamente en GitHub en estos casos:

- Push a `main` o `develop`
- Pull requests a `main` o `develop`

### Jobs del Pipeline:

#### 1. Lint (Análisis de código)
- Instala dependencias
- Ejecuta ESLint
- Verifica formato con Prettier

#### 2. Test (Pruebas)
- Ejecuta tests unitarios
- Genera reporte de cobertura
- Sube reporte a Codecov

#### 3. Build (Compilación)
- Compila el proyecto TypeScript
- Guarda artefactos (dist/) por 7 días

#### 4. Docker (Contenedor)
- Solo en push a `main`
- Construye imagen Docker
- Usa caché para optimizar

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Inicia en modo desarrollo con hot-reload

# Testing
npm run test               # Ejecuta tests
npm run test:watch         # Tests en modo watch
npm run test:cov           # Tests con cobertura

# Linting & Formatting
npm run lint               # Lint y fix automático
npm run lint:check         # Solo verificar errores
npm run format             # Formatear código
npm run format:check       # Solo verificar formato

# Build
npm run build              # Compilar a JavaScript

# Hooks (ejecutados automáticamente)
npm run pre-commit         # Pre-commit hook
npm run pre-push           # Pre-push hook
```

## 🛠️ Configuración Local

### Primera vez (después de clonar):

```bash
# Instalar dependencias (incluye setup de husky)
npm install

# Los hooks se configuran automáticamente
```

### Saltarse hooks (solo en casos excepcionales):

```bash
# Saltarse pre-commit
git commit -m "mensaje" --no-verify

# Saltarse pre-push
git push --no-verify
```

## 🔍 Verificación Manual

Si quieres ejecutar las verificaciones manualmente:

```bash
# Verificar todo antes de commit
npm run lint:check && npm run format:check

# Verificar todo antes de push
npm run lint:check && npm run test

# Verificar mensaje de commit
echo "feat: mi mensaje" | npx commitlint
```

## 📊 Estado del Pipeline

El estado del pipeline se puede ver en:
- Badge en el README (después de configurar GitHub Actions)
- Pestaña "Actions" en el repositorio de GitHub
- Checks en los Pull Requests

## ⚙️ Configuración Avanzada

### Modificar reglas de ESLint:
Edita `.eslintrc.js`

### Modificar reglas de Prettier:
Edita `.prettierrc`

### Modificar reglas de commits:
Edita `.commitlintrc.js`

### Modificar archivos verificados en pre-commit:
Edita la sección `lint-staged` en `package.json`

## 🚨 Solución de Problemas

### Los hooks no se ejecutan:
```bash
# Re-instalar hooks
rm -rf .husky
npm run prepare
```

### Tests fallan en pre-push:
```bash
# Ejecutar tests localmente
npm run test

# Ver tests con más detalle
npm run test:watch
```

### Error de formato:
```bash
# Formatear automáticamente
npm run format

# O solo los archivos staged
npm run pre-commit
```

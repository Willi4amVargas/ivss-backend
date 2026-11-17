# IVSS Backend

API REST para el **Sistema Piloto de Automatización Estadística** del Hospital
Dr. Patrocinio Peñuela Ruíz (Departamento de Medicina Interna). Construida con
[NestJS](https://nestjs.com/) 11 y TypeScript.

## ¿Qué hace este backend?

- **Pacientes** — registro, búsqueda (por cédula, nombre o número de historia),
  actualización y baja lógica de pacientes.
- **Historias clínicas** — gestión de ingresos (*admissions*), egresos
  (*discharges*) y evoluciones hospitalarias, con sus diagnósticos y exportación
  de documentos en PDF.
- **Diagnósticos CIE-11** — proxy de búsqueda hacia un servicio local de la
  clasificación ICD-11 de la OMS (`whoicd/icd-api`).
- **Estadísticas** — reportes epidemiológicos y exportación a Excel (en
  desarrollo).
- **Autenticación** — registro y acceso con JWT, perfiles de usuario y
  recuperación de contraseña por correo electrónico.
- **Caché** — las consultas de listado se cachean en Redis a través de TypeORM.

La documentación completa de los endpoints está en
[`api_documentation.md`](./api_documentation.md). Con la app corriendo, también
puedes ver el Swagger interactivo en `http://localhost:3000/api/docs`.

## Requisitos

- [Docker](https://docs.docker.com/get-docker/) y Docker Compose (para el
  despliegue completo).
- Node.js 24+ y [pnpm](https://pnpm.io/) (solo si desarrollas fuera de Docker).
- PostgreSQL y Redis (incluidos en `docker-compose.yaml`).

## Despliegue rápido con Docker Compose

`docker-compose.yaml` levanta toda la aplicación: PostgreSQL, Redis, el servicio
ICD-11 y el backend.

```bash
# 1. Crea tu archivo de variables de entorno y edítalo
cp .env.example .env

# 2. Construye y levanta todos los servicios
docker compose up -d --build

# 3. Revisa el estado
docker compose ps
```

Al arrancar, la app ejecuta automáticamente las migraciones de TypeORM y crea
las tablas en una base de datos vacía.

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/docs`

> **Nota:** si ya tienes PostgreSQL y/o Redis corriendo en tu máquina en los
> puertos `5432` y `6379`, detenlos antes de `docker compose up` o cambia los
> puertos publicados en `docker-compose.yaml`.

Para detener todo (conservando los datos de PostgreSQL):

```bash
docker compose down
# ...o para borrar también el volumen de datos:
docker compose down -v
```

## Desarrollo local (fuera de Docker)

Levanta solo las dependencias con Compose y corre la app con pnpm:

```bash
# Dependencias (PostgreSQL + Redis + ICD-11)
docker compose up -d postgres redis icd-api

# Instala dependencias y arranca en modo watch
pnpm install
pnpm start:dev
```

La app queda disponible en `http://localhost:3000/api/v1`.

## Comandos

| Comando | Descripción |
| --- | --- |
| `pnpm install` | Instala las dependencias |
| `pnpm start:dev` | Arranca en modo watch (desarrollo) |
| `pnpm start:prod` | Compila y ejecuta `dist/main.js` |
| `pnpm build` | Compila con webpack (genera `dist/`) |
| `pnpm lint` | ESLint con reglas de tipos (actúa como typecheck) y auto-fix |
| `pnpm test` | Tests unitarios (Jest) |
| `pnpm test:e2e` | Tests end-to-end (`test/jest-e2e.json`) |
| `pnpm format` | Formatea el código con Prettier |
| `pnpm swagger:export` | Genera `swagger.json` a partir de los controladores |
| `pnpm migration:generate <ruta>` | Genera una migración a partir de las entidades |
| `pnpm migration:run` | Ejecuta las migraciones pendientes |
| `pnpm migration:revert` | Revierte la última migración |
| `pnpm migration:show` | Lista las migraciones aplicadas/pendientes |

Ejemplos de migraciones:

```bash
pnpm migration:generate src/migrations/MiCambio
pnpm migration:run
```

## Migraciones y base de datos

El esquema se administra con migraciones de TypeORM (directorio
`src/migrations/`). La configuración de la CLI vive en `data-source.ts` y las
entidades en cada módulo (`src/**/entities/*.entity.ts`).

- `synchronize` está **desactivado**; las tablas se crean exclusivamente con las
  migraciones.
- Al arrancar, `migrationsRun: true` ejecuta las migraciones pendientes de forma
  automática (la base de datos queda creada **vacía pero con las tablas listas**).
- La migración inicial crea la extensión `uuid-ossp` (usada para los UUID de las
  claves primarias).

> Si ya tenías una base de datos creada con el antiguo `synchronize: true`,
> regístrala como "migración ya aplicada" para que la app no intente recrear las
> tablas:
>
> ```sql
> INSERT INTO migrations (timestamp, name)
> VALUES (1794929755037, 'InitialSchema1794929755037');
> ```

### Ciclo de vida de la base de datos

Los datos viven en el volumen nombrado `postgres_data` (definido en
`docker-compose.yaml`) y **no se borran** con `docker compose up` ni con
`docker compose down`.

| Acción | Qué ocurre con la base de datos |
| --- | --- |
| Primer `docker compose up -d` | Crea el volumen vacío; Postgres crea la BD `ivss_v2` y la app ejecuta `InitialSchema` (tablas sin datos). |
| `docker compose up -d` posterior | Postgres detecta el volumen con datos y **omite** la inicialización. TypeORM ve la migración ya registrada y no toca nada. |
| `docker compose down` | Detiene/elimina contenedores y red, pero **conserva** `postgres_data`. El próximo `up` recupera todo. |
| `docker compose down -v` | **⚠️ Destruye los volúmenes**: se pierde toda la base de datos. |
| `docker compose build` / `up -d --build` | Solo recompila la imagen `app`; no afecta a Postgres ni al volumen. |

**Cambiar una tabla (editar una entidad):**

- `synchronize` está en `false`, así que editar `src/**/entities/*.entity.ts`
  **no** altera la base de datos automáticamente (ni crea, ni modifica, ni
  elimina columnas o tablas).
- El flujo correcto es generar una migración incremental y dejar que la app la
  aplique al arrancar:

  ```bash
  pnpm migration:generate src/migrations/MiCambio
  # la siguiente ejecución de la app la aplica (ALTER TABLE ...), conservando
  # los datos existentes
  ```

**Situaciones que sí borran datos:**

- `docker compose down -v` (o eliminar el volumen `postgres_data` manualmente).
- `pnpm migration:revert` — ejecuta el `down()` de la última migración; en la
  migración inicial el `down()` hace `DROP TABLE` de todo.
- Escribir DDL destructivo (p. ej. `DROP COLUMN`) en el `up()` de una migración.
- Subir la versión mayor de la imagen `postgres:` (17 → 18): el volumen conserva
  los datos, pero en un formato incompatible y Postgres no arranca hasta migrarlo
  con `pg_upgrade`. No borra datos, pero requiere un paso manual.

## Variables de entorno

La app lee `.env` (ConfigModule) más las variables del entorno. En Docker se
inyectan vía `env_file` + `environment` en `docker-compose.yaml`.

| Variable | Descripción |
| --- | --- |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | Conexión a PostgreSQL |
| `PORT` / `CORS_ORIGIN` | Puerto HTTP y origen CORS |
| `ICD_API_LOCAL_URL` / `ICD_RELEASE_ID` / `ICD_LINEARIZATION` / `ICD_API_VERSION` / `ICD_API_LANGUAGE` | Servicio local ICD-11 |
| `REDIS_URL` / `REDIS_TLS` / `REDIS_HOST` / `REDIS_PORT` / `REDIS_USERNAME` / `REDIS_PASSWORD` / `REDIS_DB` | Redis para caché de consultas |
| `JWT_SECRET` | Secreto para firmar los JSON Web Tokens |
| `MAIL_HOST` / `MAIL_PORT` / `MAIL_USERNAME` / `MAIL_PASSWORD` / `MAIL_ENCRYPTION` / `MAIL_FROM` | SMTP para envío de correos |

## Estructura del proyecto

```
src/
├── auth/            # Registro, acceso JWT y recuperación de contraseña
├── patients/        # Pacientes y números de historia
├── clinical-records/# Ingresos, egresos, evoluciones y diagnósticos
├── diagnostics/     # Proxy ICD-11 (src/icd-api)
├── statistics/      # Reportes y exportación (en desarrollo)
├── users/           # Entidad y servicio de usuarios
├── profile/         # Perfiles y permisos
├── mail/            # Envío de correos (nodemailer)
├── files/           # Generación de PDFs (pdfmake) y lectura de assets
├── utils/           # Paginación, caché y transformaciones
└── migrations/      # Migraciones de TypeORM
```

## Despliegue a producción

El despliegue al VPS se hace con GitHub Actions (`.github/workflows/main.yml`):
al hacer push a `master`, se conecta por SSH, hace `git restore . && git pull`,
instala dependencias, compila y reinicia el servicio `systemd` del servidor.

Las variables de entorno de producción se cargan desde un perfil del shell del
servidor (no desde `.env`). El directorio de despliegue del workflow es
específico del VPS actual, no un contrato fijo.

## Documentación

- **Endpoints:** [`api_documentation.md`](./api_documentation.md)
- **Swagger:** `http://localhost:3000/api/docs` (con la app corriendo)

# Guía de la API — IVSS Backend

API REST para el Sistema Piloto de Automatización Estadística del Hospital
Dr. Patrocinio Peñuela Ruíz (Departamento de Medicina Interna).

- **Base URL:** `http://localhost:3000/api/v1`
- **Swagger interactivo:** `http://localhost:3000/api/docs`
- **Formato:** JSON

---

## 1. Autenticación

La API usa **JSON Web Tokens (JWT)**. Un guard global (`AuthGuard`, registrado
con `APP_GUARD`) protege **todos** los endpoints por defecto: cualquier petición
debe incluir el token en la cabecera:

```
Authorization: Bearer <access_token>
```

Para obtener el token usa `POST /auth/signin`. El token expira a las 24 horas.

### Endpoints públicos (no requieren token)

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/auth/signin` | Obtener el access token |
| `POST` | `/auth/signup` | Registrar un usuario |
| `POST` | `/auth/recovery` | Solicitar código de recuperación |
| `PUT` | `/auth/recovery` | Restablecer la contraseña |

> **Nota:** `GET /` (health check) **sí requiere token**, igual que el resto de
> endpoints, por no estar marcado como público.

---

## 2. Convenciones

### Paginación

Los endpoints de listado aceptan estos parámetros de *query*:

| Parámetro | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `page` | number | `1` | Página solicitada (mínimo 1) |
| `limit` | number | `10` | Elementos por página (máximo 1000) |
| `scope` | enum | `me` | `me` = solo registros creados por el usuario autenticado; `all` = todos |

### Respuesta paginada

Las listas devuelven la estructura:

```json
{
  "data": [ /* ... */ ],
  "meta": {
    "page": 1,
    "page_items": 10,
    "limit": 10,
    "total_items": 42,
    "total_pages": 5
  }
}
```

### Errores comunes

| Código | Significado |
| --- | --- |
| `400 Bad Request` | Datos inválidos o parámetros incorrectos |
| `401 Unauthorized` | Token ausente, inválido o expirado |
| `404 Not Found` | Recurso no encontrado |
| `409 Conflict` | Conflicto de reglas de negocio (cédula duplicada, etc.) |
| `500 Internal Server Error` | Error no controlado |

---

## 3. Módulo: App (root)

### `GET /`

Health check / Hello World.

- **Auth:** Requiere token (no es público).
- **Respuesta `200`:** `"Hello World!"`

---

## 4. Módulo: Auth

### `POST /auth/signin`

Obtiene el JSON Web Token necesario para usar los endpoints.

- **Auth:** Público.
- **Body:**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `username` | string | Sí | Nombre de usuario |
| `password` | string | Sí | Contraseña |

```json
{
  "username": "USER01",
  "password": "1234"
}
```

- **Respuesta `200`:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

- **Errores:** `401` si el usuario no existe, está inactivo o la contraseña es
  incorrecta.

### `POST /auth/signup`

Crea un usuario y envía un correo de confirmación.

- **Auth:** Público.
- **Body:**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `username` | string | Sí | Nombre de usuario (único) |
| `description` | string | Sí | Nombre/descripción del usuario |
| `password` | string | Sí | Contraseña |
| `email` | string | Sí | Email válido (único) |
| `profile_id` | uuid | Sí | Perfil asignado |

```json
{
  "username": "USER01",
  "description": "Juan Carlos",
  "password": "1234",
  "email": "user@example.com",
  "profile_id": "3dd8bfc9-7e4a-77c7-0971-591bdcb00000"
}
```

- **Respuesta `201`:** el usuario creado (sin `password`, `status`, `recovery_code`
  ni marcas de tiempo):

```json
{
  "id": "cace4a15-9ff9-2512-4237-376000000000",
  "username": "USER01",
  "description": "JUAN CARLOS",
  "profile_id": "3dd8bfc9-7e4a-77c7-0971-591bdcb00000",
  "email": "user@example.com"
}
```

- **Errores:** `400` si el perfil no existe (`Perfil no valido`) o si el email /
  nombre de usuario ya están registrados.

### `POST /auth/recovery`

Inicia la recuperación de contraseña: genera un código de 6 dígitos y lo envía
por correo. El código expira en 15 minutos.

- **Auth:** Público.
- **Body:**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `username` | string | Sí | Nombre de usuario |

```json
{ "username": "USER01" }
```

- **Respuesta `201`:**

```json
{
  "message": "Correo de recuperación enviado a u***1@example.com"
}
```

### `PUT /auth/recovery`

Verifica el código de recuperación y cambia la contraseña.

- **Auth:** Público.
- **Body:**

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `username` | string | Sí | Nombre de usuario |
| `recovery_code` | string | Sí | Código de recuperación recibido por correo |
| `new_password` | string | Sí | Nueva contraseña |

```json
{
  "username": "USER01",
  "recovery_code": "123456",
  "new_password": "nueva-clave"
}
```

- **Respuesta `200`:**

```json
{ "message": "Recuperacion de contraseña exitoso" }
```

- **Errores:** `400` si el código es inválido o expiró.

### `GET /auth/me`

Devuelve la información del usuario asociada al token enviado.

- **Auth:** Requiere token.
- **Respuesta `200`:** el payload del token (datos del usuario).

---

## 5. Módulo: Patients

### `POST /patients`

Registra un nuevo paciente.

- **Auth:** Requiere token. El paciente queda asociado al usuario autenticado.

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `document_id` | string | Sí | Cédula de identidad (máx. 12) |
| `names` | string | Sí | Nombres (máx. 100) |
| `lastnames` | string | Sí | Apellidos (máx. 100) |
| `gender` | enum `M` \| `F` | Sí | Sexo biológico |
| `history_numbers` | string[] | No | Números de historia clínica (máx. 100 c/u) |
| `birth_year` | number | No | Año de nacimiento (mín. 1800) |
| `birth_month` | number | No | Mes (1-12) |
| `birth_day` | number | No | Día (1-31) |
| `address` | string | No | Dirección (máx. 200) |
| `status` | boolean | No | Activo/inactivo (default `true`) |

> Los campos de texto se convierten a **MAYÚSCULAS** automáticamente.

```json
{
  "document_id": "12345678",
  "history_numbers": ["HC-001", "HC-002"],
  "names": "JUAN CARLOS",
  "lastnames": "PEREZ",
  "birth_year": 1980,
  "birth_month": 8,
  "birth_day": 25,
  "gender": "M",
  "address": "BARRIO OBRERO, SAN CRISTOBAL",
  "status": true
}
```

- **Respuesta `201`:** el paciente creado.
- **Errores:** `409` si la cédula o el número de historia ya existen.

### `GET /patients`

Lista de pacientes activos, ordenados alfabéticamente.

- **Auth:** Requiere token.
- **Query:** parámetros de [paginación](#paginación) (`page`, `limit`, `scope`).
- **Respuesta `200`:** [respuesta paginada](#respuesta-paginada) de pacientes,
  con `history_numbers` como array de strings:

```json
{
  "data": [
    {
      "id": "8dfa510b-b29a-431a-2139-fbfb99000000",
      "document_id": "12345678",
      "names": "JUAN CARLOS",
      "lastnames": "PEREZ",
      "address": "BARRIO OBRERO, SAN CRISTOBAL",
      "gender": "M",
      "birth_year": 1980,
      "birth_month": 8,
      "birth_day": 25,
      "status": true,
      "created_at": "2026-11-17T12:00:00.000Z",
      "updated_at": "2026-11-17T12:00:00.000Z",
      "created_by": "cace4a15-9ff9-2512-4237-376000000000",
      "history_numbers": ["HC-001", "HC-002"]
    }
  ],
  "meta": { "page": 1, "page_items": 1, "limit": 10, "total_items": 1, "total_pages": 1 }
}
```

### `GET /patients/search`

Busca pacientes por un filtro.

- **Auth:** Requiere token.
- **Query:**

| Parámetro | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `q` | string | — | Valor a buscar (requerido) |
| `type` | enum | `document_id` | `document_id`, `name` o `history_number` |
| `page` / `limit` / `scope` | — | — | [Paginación](#paginación) |

- **Respuesta `200`:** [respuesta paginada](#respuesta-paginada) de pacientes.

### `GET /patients/{value}`

Busca un paciente por su identificador.

- **Auth:** Requiere token.
- **Query:**

| Parámetro | Tipo | Default | Descripción |
| --- | --- | --- | --- |
| `type` | enum | `id` | `id`, `document_id` o `history_number` |

- **Respuesta `200`:** el paciente (incluye `admissions` y `history_numbers`).
- **Errores:** `400` si el valor no es un UUID válido (cuando `type=id`) o si
  `type` es inválido; `404` si no existe.

### `PATCH /patients/{id}`

Actualiza los datos de un paciente. Acepta todos los campos de creación
(parcialmente).

- **Auth:** Requiere token.
- **Path:** `id` (UUID).
- **Body:** cualquiera de los campos de [`CreatePatientDto`](#post-patients).
- **Respuesta `200`:** resultado de la actualización.
- **Errores:** `404` si no existe; `409` si la cédula nueva ya pertenece a otro.

### `DELETE /patients/{id}`

Elimina un paciente (baja lógica: cambia `status` a `false`).

- **Auth:** Requiere token.
- **Path:** `id` (UUID).
- **Respuesta `204`:** sin contenido.

### `DELETE /patients/history/{id}/{history}`

Elimina un número de historia específico de un paciente.

- **Auth:** Requiere token.
- **Path:** `id` (UUID del paciente), `history` (número de historia).
- **Respuesta `204`:** sin contenido.

---

## 6. Módulo: Clinical Records

### Ingresos (admissions)

#### `POST /clinical-records/admissions`

Crea un nuevo ingreso con sus diagnósticos.

- **Auth:** Requiere token.

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `patient_id` | uuid | Sí | Paciente asociado |
| `consult_reason` | string[] | Sí | Motivos de la consulta |
| `current_condition` | string | Sí | Condición actual del paciente |
| `background` | string[] | Sí | Antecedentes médicos |
| `admission_exam` | string | Sí | Examen físico de admisión |
| `admission_date` | string (ISO8601) | No | Fecha/hora del ingreso |
| `diagnoses` | object[] | Sí | Diagnósticos de admisión (mín. 1) |

Cada elemento de `diagnoses`:

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `code` | string | Sí | Código (máx. 20) |
| `title` | string | Sí | Título (máx. 500) |
| `description` | string | No | Descripción adicional |

```json
{
  "patient_id": "123e4567-e89b-12d3-a456-426614174000",
  "admission_date": "2026-03-30T14:32:00.000Z",
  "consult_reason": ["Fiebre alta", "Dolor de cabeza intenso"],
  "current_condition": "Paciente consciente, orientado, con deshidratación leve.",
  "background": ["Hipertensión arterial", "Alergia a la penicilina"],
  "admission_exam": "Presión arterial: 120/80 mmHg, FC: 75 bpm, T: 38.5°C.",
  "diagnoses": [
    {
      "code": "A00.0",
      "title": "Cólera debido a Vibrio cholerae 01",
      "description": "Diagnóstico principal"
    }
  ]
}
```

- **Respuesta `201`:** el ingreso creado.

#### `GET /clinical-records/admissions`

Lista de ingresos.

- **Auth:** Requiere token.
- **Query:** [paginación](#paginación) + `status` (opcional; `active` filtra los
  ingresos sin egreso).
- **Respuesta `200`:** [respuesta paginada](#respuesta-paginada) de ingresos.

#### `GET /clinical-records/admissions/{id}`

Devuelve un ingreso por su ID.

- **Auth:** Requiere token.
- **Path:** `id` (UUID).
- **Respuesta `200`:** el ingreso.

#### `PATCH /clinical-records/admissions/{id}`

Actualiza un ingreso y sus diagnósticos.

- **Auth:** Requiere token.
- **Path:** `id` (UUID).
- **Body:** campos opcionales del ingreso + `diagnoses` (cada diagnóstico con
  `id` UUID, `code`, `title`, `description`).
- **Respuesta `200`:** el ingreso actualizado.

#### `DELETE /clinical-records/admissions/{id}`

Elimina un ingreso.

- **Auth:** Requiere token.
- **Path:** `id` (UUID).
- **Respuesta `204`:** sin contenido.

#### `DELETE /clinical-records/admissions/diagnoses/{id}`

Elimina un diagnóstico de ingreso por su ID.

- **Auth:** Requiere token.
- **Path:** `id` (UUID del diagnóstico).
- **Respuesta `204`:** sin contenido.

#### `GET /clinical-records/admissions/{id}/document`

Genera y devuelve el documento PDF del ingreso.

- **Auth:** Requiere token.
- **Path:** `id` (UUID).
- **Respuesta `200`:** archivo `application/pdf`.

### Evoluciones hospitalarias (evolutions)

#### `POST /clinical-records/evolutions`

Crea una nota de evolución.

- **Auth:** Requiere token.

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `admission_id` | uuid | Sí | Ingreso asociado |
| `description` | string | Sí | Nota de evolución |
| `date` | string (ISO8601) | Sí | Fecha de la evolución |

```json
{
  "admission_id": "8b7c4142-2d17-4952-97a5-7186d38e2101",
  "description": "Evolución favorable, afebril, signos vitales estables.",
  "date": "2026-01-02"
}
```

- **Respuesta `201`:** la evolución creada.

#### `GET /clinical-records/evolutions/admissions/{admissionId}`

Lista todas las evoluciones de un ingreso.

- **Auth:** Requiere token.
- **Path:** `admissionId` (UUID).
- **Respuesta `200`:** array de evoluciones.

#### `GET /clinical-records/evolutions/{id}`

Devuelve una evolución por su ID.

- **Auth:** Requiere token.
- **Respuesta `200`:** la evolución.

#### `PATCH /clinical-records/evolutions/{id}`

Actualiza la descripción de una evolución.

- **Auth:** Requiere token.
- **Body:** `description` (opcional).
- **Respuesta `200`:** la evolución actualizada.

#### `DELETE /clinical-records/evolutions/{id}`

Elimina una evolución.

- **Auth:** Requiere token.
- **Respuesta `204`:** sin contenido.

### Egresos (discharges)

#### `POST /clinical-records/discharges`

Crea un egreso con sus diagnósticos definitivos.

- **Auth:** Requiere token.

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `admission_id` | uuid | Sí | Ingreso correlativo |
| `discharge_exam` | string | Sí | Examen físico de egreso |
| `discharge_date` | string (ISO8601) | No | Fecha/hora del egreso |
| `morbility_status` | boolean | No | Estado de morbilidad (default `false`) |
| `treatment_plan` | string | No | Plan terapéutico post-hospitalización |
| `diagnoses` | object[] | Sí | Diagnósticos definitivos (mín. 1) |

Cada elemento de `diagnoses`:

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `code` | string | Sí | Código (máx. 20) |
| `title` | string | Sí | Título (máx. 500) |
| `description` | string | No | Descripción adicional |

```json
{
  "admission_id": "a5c84d72-1b34-4bc2-89fa-112233445566",
  "discharge_date": "2026-06-12T10:00:00.000Z",
  "discharge_exam": "Campos pulmonares limpios, ruidos cardíacos rítmicos.",
  "morbility_status": false,
  "treatment_plan": "Amoxicilina 500mg VO cada 8 horas por 7 días.",
  "diagnoses": [
    {
      "code": "BC02.0",
      "title": "Neumonía bacteriana no especificada",
      "description": "Diagnóstico definitivo"
    }
  ]
}
```

- **Respuesta `201`:** el egreso creado.

#### `GET /clinical-records/discharges`

Lista de egresos.

- **Auth:** Requiere token.
- **Query:** [paginación](#paginación).
- **Respuesta `200`:** [respuesta paginada](#respuesta-paginada) de egresos.

#### `GET /clinical-records/discharges/{id}`

Devuelve un egreso por su ID.

- **Auth:** Requiere token.
- **Respuesta `200`:** el egreso.

#### `PATCH /clinical-records/discharges/{id}`

Actualiza un egreso y sus diagnósticos.

- **Auth:** Requiere token.
- **Body:** campos opcionales del egreso + `diagnoses` (cada diagnóstico con
  `id` UUID, `code`, `title`, `description`).
- **Respuesta `200`:** el egreso actualizado.

#### `DELETE /clinical-records/discharges/{id}`

Elimina un egreso.

- **Auth:** Requiere token.
- **Respuesta `204`:** sin contenido.

#### `DELETE /clinical-records/discharges/diagnoses/{id}`

Elimina un diagnóstico de egreso por su ID.

- **Auth:** Requiere token.
- **Respuesta `204`:** sin contenido.

#### `GET /clinical-records/discharges/{id}/document`

Genera y devuelve el documento PDF del egreso.

- **Auth:** Requiere token.
- **Respuesta `200`:** archivo `application/pdf`.

---

## 7. Módulo: Diagnostics (ICD-11)

Proxy al servicio local de clasificación ICD-11 de la OMS.

### `GET /diagnostics/search`

Busca diagnósticos por texto (búsqueda exacta con modo de codificación médica).

- **Auth:** Requiere token.
- **Query:**

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `query` | string | Término de búsqueda (mín. 2 caracteres, requerido) |

```text
GET /api/v1/diagnostics/search?query=diabetes
```

- **Respuesta `200`:** array de resultados normalizados:

```json
[
  {
    "code": "5A10",
    "title": "Diabetes mellitus tipo 2",
    "uri": "http://id.who.int/icd/entity/1234567890"
  }
]
```

- **Errores:** `400` si falta `query` o tiene menos de 2 caracteres.

### `GET /diagnostics/search/flexible`

Igual que `search`, pero con búsqueda flexible (tolerante a errores
ortográficos) y resultados aplanados.

- **Auth:** Requiere token.
- **Query:** `query` (string, mínimo 2 caracteres, requerido).
- **Respuesta `200`:** mismo formato que `search`.

---

## 8. Módulo: Statistics

### `GET /statistics/discharge`

Reporte de estadísticas de egresos.

- **Auth:** Requiere token.
- **Respuesta `200`:** *en desarrollo* (devuelve un placeholder de texto).

> ⚠️ Este módulo está en desarrollo; el endpoint actualmente no devuelve datos
> estructurados.

---

## 9. Modelos de datos (referencia)

Tablas gestionadas por las migraciones de TypeORM:

| Entidad | Tabla | Descripción |
| --- | --- | --- |
| `User` | `user` | Usuarios del sistema |
| `Profile` | `profile` | Perfiles de usuario |
| `ProfilePermisions` | `profile_permisions` | Permisos por perfil |
| `Patient` | `patient` | Pacientes |
| `HistoryNumber` | `history_number` | Números de historia por paciente |
| `Admission` | `admission` | Ingresos hospitalarios |
| `AdmissionDiagnosis` | `admission_diagnosis` | Diagnósticos de ingreso |
| `Discharges` | `discharge` | Egresos hospitalarios |
| `DischargeDiagnosis` | `discharge_diagnosis` | Diagnósticos de egreso |
| `HospitalEvolution` | `hospital_evolution` | Evoluciones hospitalarias |

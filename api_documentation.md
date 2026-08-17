# Guía Completa de la API Backend (NestJS)

## 1. Visión General
- **Resumen:** API REST construida en NestJS para el Sistema Piloto de Automatización Estadística del Hospital Dr. Patrocinio Peñuela Ruíz (Departamento de Medicina Interna). Administra de forma centralizada pacientes, historias clínicas (ingresos y egresos), evoluciones hospitalarias y cuenta con integración de diagnósticos apoyados en la API de la CIE-11 (ICD-11).
- **URL Base Local:** `http://localhost:3000/api/v1`
- **URL Base Entorno (Ejemplo):** `https://api.tudominio.com/api/v1`
- **Autenticación/Autorización:** Actualmente no se han implementado Guards de autenticación (`@UseGuards`, JWT, etc.) ni autorización por roles en los controladores. Todos los endpoints se encuentran expuestos de manera **Pública**.
- **Respuestas de Error Globales:** 
  La API cuenta con un `ValidationPipe` global que asegura la integridad de los datos.
  - `400 Bad Request`: Faltan campos requeridos en el Body, tipos de datos incorrectos o validación DTO fallida.
  - `404 Not Found`: El recurso solicitado (paciente, historia, admisión, etc.) no existe.
  - `409 Conflict`: Infracción de reglas de negocio (ej. cédula duplicada o intento de eliminar un paciente con historias asociadas).
  - `500 Internal Error`: Errores de servidor no controlados.

---

## 2. Documentación por Módulo

### Módulo: App (Root)
*Ruta Base:* `/`

#### `GET` `/`
- **Descripción:** Endpoint de *Health Check* / *Hello World* para verificar la disponibilidad de la API.
- **Headers Requeridos:** Ninguno

##### Parametros de Entrada:
- No requiere parámetros ni Body.

##### Respuestas del Endpoint:
* **`200 OK`:**
```json
"Hello World!"
```

---

### Módulo: Patients (Pacientes)
*Ruta Base:* `/patients`

#### `POST` `/patients`
- **Descripción:** Registra un nuevo paciente en el sistema.
- **Headers Requeridos:**
  - `Content-Type`: `application/json`

##### Parametros de Entrada:
- **Body (`JSON`):**
  ```json
  {
    "document_id": "12345678",
    "history_numbers": ["HC-001", "HC-002"],
    "names": "JUAN CARLOS",
    "lastnames": "PEREZ",
    "birth_year": 1980,
    "birth_month": 8,
    "birth_day": 25,
    "gender": "MALE",
    "address": "BARRIO OBRERO, SAN CRISTOBAL",
    "status": true
  }
  ```
  - `document_id` (string, max: 12, *Requerido*): Cédula de identidad.
  - `history_numbers` (string[], max: 100 char por item, *Opcional*): Números de historia clínica.
  - `names` (string, max: 100, *Requerido*): Nombres del paciente.
  - `lastnames` (string, max: 100, *Requerido*): Apellidos del paciente.
  - `birth_year` (number, min: 1800, *Opcional*): Año de nacimiento.
  - `birth_month` (number, 1-12, *Opcional*): Mes de nacimiento.
  - `birth_day` (number, 1-31, *Opcional*): Día de nacimiento.
  - `gender` (enum de string, *Requerido*): Sexo biológico (ej. `MALE`, `FEMALE`).
  - `address` (string, max: 200, *Requerido*): Dirección residencial.
  - `status` (boolean, *Opcional*): Estado activo/inactivo del paciente.

##### Respuestas del Endpoint:
* **`201 Created`:** Paciente registrado exitosamente.
* **Errores Frecuentes:**
  - `400 Bad Request`: Si se envían datos con formatos incorrectos.
  - `409 Conflict`: La cédula o el número de historia ya existen.

#### `GET` `/patients`
- **Descripción:** Retorna todos los pacientes ordenados alfabéticamente.
- **Headers Requeridos:** Ninguno
##### Respuestas del Endpoint:
* **`200 OK`:** Lista de todos los pacientes.

#### `GET` `/patients/cedula/:cedula`
- **Descripción:** Busca un paciente (coincidencia exacta) por su cédula de identidad.
##### Parametros de Entrada:
- **URL Params:**
  - `cedula` (string, *Requerido*): Cédula del paciente.
##### Respuestas del Endpoint:
* **`200 OK`:** Retorna el objeto del paciente.
* **`404 Not Found`:** Paciente no encontrado.

#### `GET` `/patients/cedula/search/:cedula`
- **Descripción:** Busca pacientes (coincidencia parcial/like) por su cédula de identidad.
##### Parametros de Entrada:
- **URL Params:**
  - `cedula` (string, *Requerido*): Fragmento de la cédula del paciente.
##### Respuestas del Endpoint:
* **`200 OK`:** Retorna una lista de pacientes coincidentes.

#### `GET` `/patients/history/:historia`
- **Descripción:** Busca un paciente (coincidencia exacta) por su número de historia.
##### Parametros de Entrada:
- **URL Params:**
  - `historia` (string, *Requerido*): Número de historia del paciente.
##### Respuestas del Endpoint:
* **`200 OK`:** Retorna el objeto del paciente.
* **`404 Not Found`:** Paciente no encontrado.

#### `GET` `/patients/history/search/:historia`
- **Descripción:** Busca pacientes (coincidencia parcial) por su número de historia.
##### Parametros de Entrada:
- **URL Params:**
  - `historia` (string, *Requerido*): Fragmento del número de historia.
##### Respuestas del Endpoint:
* **`200 OK`:** Retorna lista de pacientes coincidentes.

#### `GET` `/patients/:id`
- **Descripción:** Retorna un paciente por su UUID interno, incluyendo sus historias clínicas asociadas.
##### Parametros de Entrada:
- **URL Params:**
  - `id` (uuid, *Requerido*): ID interno del paciente.
##### Respuestas del Endpoint:
* **`200 OK`:** Retorna el paciente en detalle.
* **`404 Not Found`:** Paciente no encontrado.

#### `PATCH` `/patients/:id`
- **Descripción:** Actualiza los datos de un paciente existente.
- **Headers Requeridos:**
  - `Content-Type`: `application/json`
##### Parametros de Entrada:
- **URL Params:**
  - `id` (uuid, *Requerido*): ID del paciente.
- **Body (`JSON`):** (Mismos campos de creación, pero todos opcionales).
##### Respuestas del Endpoint:
* **`200 OK`:** Paciente actualizado exitosamente.
* **`404 Not Found`:** Paciente no encontrado.

#### `DELETE` `/patients/:id`
- **Descripción:** Elimina un paciente del sistema.
##### Parametros de Entrada:
- **URL Params:**
  - `id` (uuid, *Requerido*): ID del paciente.
##### Respuestas del Endpoint:
* **`204 No Content`:** Paciente eliminado exitosamente.
* **`409 Conflict`:** Conflicto, el paciente tiene historias clínicas asociadas y no puede ser eliminado (Restricción de FK).

#### `DELETE` `/patients/history/:id/:history`
- **Descripción:** Elimina un número de historia clínico específico de un paciente.
##### Parametros de Entrada:
- **URL Params:**
  - `id` (uuid, *Requerido*): ID del paciente.
  - `history` (string, *Requerido*): Número de historia a eliminar.
##### Respuestas del Endpoint:
* **`204 No Content`:** Número de historia eliminado exitosamente.
* **`409 Conflict`:** Conflicto, existen historias clínicas asociadas.

---

### Módulo: Clinical Records (Admisiones, Evoluciones y Egresos)
*Ruta Base:* `/clinical-records`

#### `POST` `/clinical-records/admissions`
- **Descripción:** Crea un nuevo ingreso (admisión) para un paciente.
- **Headers Requeridos:**
  - `Content-Type`: `application/json`

##### Parametros de Entrada:
- **Body (`JSON`):**
  ```json
  {
    "patient_id": "123e4567-e89b-12d3-a456-426614174000",
    "admission_date": "2026-03-30T14:32:00.000Z",
    "consult_reason": ["Fiebre alta", "Dolor de cabeza intenso"],
    "current_condition": "Paciente consciente, orientado en tiempo y espacio...",
    "background": ["Hipertensión arterial", "Alergia a la penicilina"],
    "admission_exam": "Presión arterial: 120/80 mmHg, Frecuencia cardíaca: 75 bpm...",
    "diagnoses": [
      {
        "code": "A00.0",
        "title": "Cólera debido a Vibrio cholerae 01, biotipo cholerae",
        "description": "Descripción adicional opcional"
      }
    ]
  }
  ```
  - `patient_id` (uuid, *Requerido*): ID del paciente asociado.
  - `admission_date` (Date ISO8601, *Opcional*): Fecha de ingreso.
  - `consult_reason` (string[], *Requerido*): Lista de motivos de consulta.
  - `current_condition` (string, *Requerido*): Estado o condición actual.
  - `background` (string[], *Requerido*): Antecedentes médicos relevantes.
  - `admission_exam` (string, *Requerido*): Detalles del examen físico.
  - `diagnoses` (array de objetos, min: 1, *Requerido*): Diagnósticos de admisión.

##### Respuestas del Endpoint:
* **`201 Created`:** Admisión creada exitosamente.

#### `GET` `/clinical-records/admissions`
- **Descripción:** Obtiene todos los ingresos/admisiones del sistema.
##### Respuestas del Endpoint:
* **`200 OK`:** Lista de admisiones devuelta.

#### `GET` `/clinical-records/admissions/:id`
- **Descripción:** Obtiene una admisión específica por su ID.
##### Parametros de Entrada:
- **URL Params:**
  - `id` (uuid, *Requerido*): ID de la admisión.

#### `PATCH` `/clinical-records/admissions/:id`
- **Descripción:** Actualiza un ingreso existente.
- **Headers Requeridos:**
  - `Content-Type`: `application/json`
##### Parametros de Entrada:
- **URL Params:**
  - `id` (uuid, *Requerido*): ID de la admisión.
- **Body (`JSON`):** (Mismos campos que la creación, todos opcionales y en los diagnosticos el campo "id" de tipo uuid del diagnostico a modificar).

#### `DELETE` `/clinical-records/admissions/:id`
- **Descripción:** Elimina un ingreso por su ID.
##### Parametros de Entrada:
- **URL Params:**
  - `id` (uuid, *Requerido*): ID de la admisión.
##### Respuestas del Endpoint:
* **`204 No Content`:** Admisión eliminada.

#### `POST` `/clinical-records/evolutions`
- **Descripción:** Crea una nota de evolución hospitalaria para una admisión.
- **Headers Requeridos:**
  - `Content-Type`: `application/json`
##### Parametros de Entrada:
- **Body (`JSON`):**
  ```json
  {
    "admission_id": "8b7c4142-2d17-4952-97a5-7186d38e2101",
    "description": "El paciente presenta una evolución favorable. Tolerando la vía oral..."
  }
  ```
##### Respuestas del Endpoint:
* **`201 Created`:** Evolución creada.

#### `GET` `/clinical-records/evolutions/admissions/:admissionId`
- **Descripción:** Obtiene todas las evoluciones asociadas a una admisión específica.
##### Parametros de Entrada:
- **URL Params:**
  - `admissionId` (uuid, *Requerido*): ID de la admisión.

#### `GET` `/clinical-records/evolutions/:id`
- **Descripción:** Obtiene una nota de evolución específica por ID.

#### `PATCH` `/clinical-records/evolutions/:id`
- **Descripción:** Actualiza una evolución por su ID.
##### Parametros de Entrada:
- **URL Params:**
  - `id` (uuid, *Requerido*): ID de la evolución.
- **Body (`JSON`):**
  ```json
  {
    "description": "Nota actualizada..."
  }
  ```

#### `DELETE` `/clinical-records/evolutions/:id`
- **Descripción:** Elimina una evolución hospitalaria por su ID.
##### Respuestas del Endpoint:
* **`204 No Content`**

#### `POST` `/clinical-records/discharges`
- **Descripción:** Crea un nuevo egreso o alta médica.
- **Headers Requeridos:**
  - `Content-Type`: `application/json`
##### Parametros de Entrada:
- **Body (`JSON`):**
  ```json
  {
    "admission_id": "a5c84d72-1b34-4bc2-89fa-112233445566",
    "discharge_date": "2026-06-12T10:00:00.000Z",
    "discharge_exam": "Campos pulmonares limpios, ruidos cardíacos rítmicos...",
    "morbility_status": false,
    "treatment_plan": "Amoxicilina 500mg VO cada 8 horas...",
    "diagnoses": [
      {
        "code": "BC02.0",
        "title": "Neumonía bacteriana no especificada",
        "description": "123"
      }
    ]
  }
  ```
  - `admission_id` (uuid, *Requerido*): ID de la admisión a dar de alta.
  - `discharge_exam` (string, *Requerido*): Detalles de examen físico de egreso.
  - `diagnoses` (array de objetos, min: 1, *Requerido*): Diagnósticos definitivos de egreso.
  - `morbility_status` (boolean, *Opcional*): Estado de morbilidad al salir.
  - `treatment_plan` (string, *Opcional*): Plan terapéutico e indicaciones post-hospitalización.

##### Respuestas del Endpoint:
* **`201 Created`:** Egreso registrado exitosamente.

#### `GET` `/clinical-records/discharges`
- **Descripción:** Obtiene la lista completa de egresos médicos.

#### `GET` `/clinical-records/discharges/:id`
- **Descripción:** Obtiene un egreso en específico por su ID.

#### `PATCH` `/clinical-records/discharges/:id`
- **Descripción:** Actualiza un egreso existente.

#### `DELETE` `/clinical-records/discharges/:id`
- **Descripción:** Elimina un egreso médico por su ID.


---

### Módulo: Diagnostics (CIE-11 / ICD-11 API)
*Ruta Base:* `/diagnostics`

#### `GET` `/diagnostics/search`
- **Descripción:** Funciona como un proxy a la API de CIE-11 local para buscar diagnósticos estándar en tiempo real. Es utilizado por el frontend para codificar diagnósticos antes de guardarlos.
##### Parametros de Entrada:
- **Query Params:**
  - `query` (string, *Requerido*, min: 2 caracteres): Término de búsqueda (Ej. `diabetes`).
##### Respuestas del Endpoint:
* **`200 OK`:**
```json
[
  {
    "code": "5A10",
    "title": "Diabetes mellitus tipo 1"
  }
]
```
* **`400 Bad Request`:** Si el query está vacío o tiene menos de 2 caracteres.

#### `GET` `/diagnostics/search/flexible`
- **Descripción:** Versión de búsqueda con tolerancia a fallos ortográficos (*flexisearch*).
##### Parametros de Entrada:
- **Query Params:**
  - `query` (string, *Requerido*, min: 2 caracteres): Término de búsqueda aproximado.
##### Respuestas del Endpoint:
* **`200 OK`:** Arreglo con resultados aproximados CIE-11.


---

## 3. Matriz Rápidas de Endpoints (Cheatsheet)

| Método | Endpoint | Módulo | Auth | Descripción |
| --- | --- | --- | --- | --- |
| `GET` | `/` | App (Root) | Pública | Health Check / Verifica la disponibilidad |
| `POST` | `/patients` | Patients | Pública | Registra un nuevo paciente |
| `GET` | `/patients` | Patients | Pública | Lista todos los pacientes (ordenados) |
| `GET` | `/patients/cedula/:cedula` | Patients | Pública | Busca paciente por cédula (exacta) |
| `GET` | `/patients/cedula/search/:cedula` | Patients | Pública | Búsqueda parcial por cédula |
| `GET` | `/patients/history/:historia` | Patients | Pública | Busca paciente por nro de historia (exacto) |
| `GET` | `/patients/history/search/:historia` | Patients | Pública | Búsqueda parcial por nro de historia |
| `GET` | `/patients/:id` | Patients | Pública | Busca un paciente por su UUID |
| `PATCH` | `/patients/:id` | Patients | Pública | Actualiza información de un paciente |
| `DELETE` | `/patients/:id` | Patients | Pública | Elimina un paciente |
| `DELETE` | `/patients/history/:id/:history` | Patients | Pública | Elimina un Nro de Historia específico |
| `POST` | `/clinical-records/admissions` | Clinical Records | Pública | Crea una nueva admisión/ingreso |
| `GET` | `/clinical-records/admissions` | Clinical Records | Pública | Lista todas las admisiones |
| `GET` | `/clinical-records/admissions/:id` | Clinical Records | Pública | Busca admisión por su UUID |
| `PATCH` | `/clinical-records/admissions/:id` | Clinical Records | Pública | Actualiza una admisión |
| `DELETE` | `/clinical-records/admissions/:id` | Clinical Records | Pública | Elimina una admisión |
| `POST` | `/clinical-records/evolutions` | Clinical Records | Pública | Crea una nota de evolución hospitalaria |
| `GET` | `/clinical-records/evolutions/admissions/:admissionId` | Clinical Records | Pública | Lista las evoluciones de una admisión |
| `GET` | `/clinical-records/evolutions/:id` | Clinical Records | Pública | Busca una evolución por UUID |
| `PATCH` | `/clinical-records/evolutions/:id` | Clinical Records | Pública | Actualiza una evolución |
| `DELETE` | `/clinical-records/evolutions/:id` | Clinical Records | Pública | Elimina una evolución |
| `POST` | `/clinical-records/discharges` | Clinical Records | Pública | Registra un egreso/alta de paciente |
| `GET` | `/clinical-records/discharges` | Clinical Records | Pública | Lista todos los egresos |
| `GET` | `/clinical-records/discharges/:id` | Clinical Records | Pública | Busca un egreso por UUID |
| `PATCH` | `/clinical-records/discharges/:id` | Clinical Records | Pública | Actualiza un egreso |
| `DELETE` | `/clinical-records/discharges/:id` | Clinical Records | Pública | Elimina un egreso |
| `GET` | `/diagnostics/search` | Diagnostics | Pública | Busca diagnósticos CIE-11 (estándar) |
| `GET` | `/diagnostics/search/flexible` | Diagnostics | Pública | Busca diagnósticos CIE-11 (tolerancia a errores) |

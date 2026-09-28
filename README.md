# ExpresoFast — Consola de Operación Logística

**Universidad de Costa Rica — Sede del Atlántico, Recinto Paraíso**
**Carrera de Informática Empresarial**
**Curso:** IF0009 - Desarrollo de Software IV
**Profesor:** Mag. Jonathan Granados C.
**Ciclo:** II-2026
**Laboratorios:** 8 — Integración Pila Completa (Full-Stack) y 9 — Procedimientos Almacenados, Paginación Relacional y Vistas HTML5 Paginadas
**Estudiante:** Kendall Méndez Calderón
**Carné:** C4H142

---

## Descripción

Consola web de operación logística para la plataforma ExpresoFast. Permite a
usuarios con los roles `ROLE_ADMIN`, `ROLE_OPERADOR` y `ROLE_CONDUCTOR`
autenticarse mediante JWT y gestionar envíos, vehículos y bitácoras de
auditoría desde un cliente web responsivo (HTML5 + CSS3 + JavaScript) que
consume una API REST construida con Spring Boot.

El Laboratorio 9 agrega dos módulos de optimización: **procedimientos
almacenados** (Stored Procedures) en SQL Server y **paginación relacional**
ejecutada a nivel de base de datos, con una vista web paginada.

## Requisitos de entorno

| Herramienta | Versión utilizada |
|---|---|
| Java | 25 |
| Maven | última versión |
| Microsoft SQL Server | Developer Edition |
| Navegador | Google Chrome / Firefox (con DevTools) |
| Servidor de desarrollo frontend | Live Server (VS Code) |

## Estructura del repositorio

```
expresofast-lab6-c4h142/
├── backend/
│   ├── src/
│   ├── pom.xml
│   └── application.properties.template
├── database/
│   ├── 01_schema_lab5.sql
│   ├── 02_schema_lab6_extension.sql
│   ├── 03_data_seeds.sql
│   └── 04_lab9_stored_procedures.sql
├── frontend/
│   ├── login.html
│   ├── index.html
│   ├── dashboard_paginado.html
│   ├── styles.css
│   ├── app.js
│   └── paginado.js
├── docs/
│   └── ExpresoFast_Postman_Collection.json
└── README.md
```

## 1. Configuración de la base de datos

1. Asegúrate de tener SQL Server corriendo localmente y una base de datos
   vacía llamada `ExpresoFast_C4H142_II2026`.
2. Ejecuta los scripts **en orden** desde la raíz del repositorio usando
   `sqlcmd` (el flag `-C` confía en el certificado del servidor, necesario
   con el Driver ODBC 18):

   ```cmd
   sqlcmd -S localhost -U sa -P "<tu-password>" -C -i database\01_schema_lab5.sql
   sqlcmd -S localhost -U sa -P "<tu-password>" -C -i database\02_schema_lab6_extension.sql
   sqlcmd -S localhost -U sa -P "<tu-password>" -C -i database\03_data_seeds.sql
   sqlcmd -S localhost -U sa -P "<tu-password>" -C -i database\04_lab9_stored_procedures.sql
   ```

   El script `04_lab9_stored_procedures.sql` (Lab 9):
   - agrega la columna `destinatario` a la tabla `Envio`;
   - crea los procedimientos `SP_OBTENER_ENVIOS_POR_ESTADO` y
     `SP_RESUMEN_METRICAS_ENVIOS`;
   - inserta 16 envíos de prueba adicionales (18 en total) con los estados
     PENDIENTE, EN_TRANSITO, ENTREGADO y CANCELADO.

3. Verifica que las tablas se crearon correctamente:

   ```cmd
   sqlcmd -S localhost -U sa -P "<tu-password>" -d ExpresoFast_C4H142_II2026 -C -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo' ORDER BY TABLE_NAME;"
   ```

> **Nota sobre las contraseñas del seed:** las contraseñas de los usuarios de
> prueba se almacenan como hash BCrypt. Si necesitas regenerar un hash para
> una contraseña específica, puedes usar el `PasswordEncoder` de Spring
> Security en una clase de utilidad temporal:
> ```java
> BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
> System.out.println(encoder.encode("Password123!"));
> ```

## 2. Usuarios de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Password123!` | ROLE_ADMIN |
| `operador1` | `Password123!` | ROLE_OPERADOR |
| `conductor1` | `Password123!` | ROLE_CONDUCTOR |

## 3. Ejecutar el backend (API REST)

1. Copia `backend/application.properties.template` a
   `backend/src/main/resources/application.properties` y completa los datos
   de conexión a tu instancia de SQL Server (usuario, contraseña, nombre de
   base de datos, `trustServerCertificate=true`) y el secreto JWT
   (`app.jwt.secret`, de al menos 256 bits).
2. Confirma que el archivo contenga esta línea, necesaria para que Hibernate
   respete los nombres de tabla definidos en las entidades:

   ```properties
   spring.jpa.hibernate.naming.physical-strategy=org.hibernate.boot.model.naming.PhysicalNamingStrategyStandardImpl
   ```

3. Desde la carpeta `backend/`, compila y levanta el servidor:

   ```cmd
   mvn spring-boot:run
   ```

4. La API quedará disponible en `http://localhost:8080/api`.
5. Puedes verificar que está arriba probando el login:

   ```
   POST http://localhost:8080/api/auth/login
   Content-Type: application/json

   { "username": "admin", "password": "Password123!" }
   ```

   Una respuesta `200 OK` con un token JWT confirma que el backend y la base
   de datos están correctamente conectados.

## 4. Desplegar el cliente (frontend)

1. Abre la carpeta `frontend/` en Visual Studio Code.
2. Instala la extensión **Live Server** si no la tienes.
3. Haz clic derecho sobre `login.html` → **"Open with Live Server"**.
4. Esto abrirá el sitio en `http://127.0.0.1:5500/` (o el puerto que tengas
   configurado).
5. Inicia sesión con cualquiera de los usuarios de prueba de la tabla
   anterior. Serás redirigido al dashboard (`index.html`) según el rol
   autenticado.

| Vista | Descripción |
|---|---|
| `login.html` | Inicio de sesión. El JWT se guarda en `sessionStorage`. |
| `index.html` | Tablero de operaciones: KPIs, tarjetas de envío, bitácora y formularios según el rol. |
| `dashboard_paginado.html` | (Lab 9) Tabla paginada de envíos. Se accede desde el enlace **Envíos paginados** de la barra superior del tablero. |

> **CORS:** el backend está configurado para aceptar peticiones desde
> `http://127.0.0.1:5500` y `http://localhost:5500`. Si usas otro puerto,
> actualiza la configuración de CORS en `SecurityConfig.java` /
> `WebConfig.java` del backend.

## 5. Laboratorio 9: Stored Procedures y paginación relacional

### 5.1 Procedimientos almacenados

| Procedimiento | Descripción |
|---|---|
| `SP_OBTENER_ENVIOS_POR_ESTADO(@pEstado)` | Devuelve los envíos de un estado, ordenados por `fecha_creacion` descendente. Se mapea en JPA con `@NamedStoredProcedureQuery` y `@Procedure` en `EnvioRepository`. |
| `SP_RESUMEN_METRICAS_ENVIOS` | (Extra) Devuelve el conteo de envíos y la suma de fletes agrupados por estado. |

### 5.2 Endpoints nuevos

Todos requieren el encabezado `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/envios` | Lista paginada de envíos. |
| GET | `/api/v1/envios/procedimiento/{estado}` | Envíos obtenidos mediante el Stored Procedure. |
| GET | `/api/v1/envios/metricas` | (Extra) Resumen por estado. |

Parámetros opcionales de `GET /api/v1/envios`:

| Parámetro | Por defecto | Descripción |
|---|---|---|
| `page` | `0` | Número de página (base 0, como Spring Data). |
| `size` | `5` | Elementos por página. |
| `sortBy` | `fechaCreacion` | Campo de ordenamiento (`id`, `codigoRastreo`, `destinatario`, `direccionDestino`, `montoFlete`, `estado`, `fechaCreacion`). |
| `direction` | `desc` | `asc` o `desc`. |
| `busqueda` | — | Texto a buscar en código de rastreo, destinatario o dirección. |
| `estado` | — | Filtra por estado del envío. |

Ejemplo de respuesta:

```json
{
  "content": [
    {
      "id": 5,
      "codigoRastreo": "EXP-0005",
      "destinatario": "Laura Rojas",
      "direccionDestino": "Cartago, Tres Rios",
      "montoFlete": 2800.00,
      "estado": "PENDIENTE",
      "fechaCreacion": "2026-09-28T10:15:00"
    }
  ],
  "number": 0,
  "size": 5,
  "totalElements": 18,
  "totalPages": 4,
  "first": true,
  "last": false
}
```

La paginación se ejecuta físicamente en SQL mediante `Pageable`, sin cargar
todos los registros en memoria y sin usar `JOIN FETCH` sobre colecciones
(evita la advertencia HHH000104).

### 5.3 Consola web paginada

`dashboard_paginado.html` incluye:

- Barra de filtros: búsqueda por texto, selector de **Stored Procedure** por
  estado y selector de tamaño de página (5, 10 o 20).
- Tabla semántica con Rastreo, Destinatario, Dirección, Flete y Estado.
- Controles de navegación: **« Primera**, **‹ Anterior**, **Siguiente ›** y
  **Última »**, con el indicador *"Página X de Y (Total: Z envíos)"*. Los
  botones se deshabilitan automáticamente en la primera y la última página.
- Al elegir una opción del selector de Stored Procedure, la tabla muestra el
  resultado del procedimiento y la paginación queda deshabilitada. Para volver
  a la lista paginada se elige **"Sin SP (lista paginada)"**.

> **Índice base 0:** Spring Data numera las páginas desde 0. La interfaz envía
> `page` en base 0 a la API y muestra `number + 1` al usuario.

## 6. Ejecutar las pruebas y ver la cobertura (Lab 7)

Desde la carpeta `backend/`:

```cmd
mvn clean verify
```

El reporte de cobertura JaCoCo queda disponible en
`target/site/jacoco/index.html`.

## Notas de solución de problemas

- **Error SSL/certificado con `sqlcmd`:** agrega el flag `-C` a todos los
  comandos (`sqlcmd ... -C -i archivo.sql`).
- **Error 401 en el login:** verifica que el hash de contraseña en la tabla
  `Usuario` corresponda realmente a `Password123!` (ver nota de la sección 1)
  y que el campo `activo = 1`.
- **Bloqueo CORS en peticiones OPTIONS:** confirma que
  `.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()` esté presente en
  `SecurityConfig.java`.
- **`Could not resolve placeholder 'app.jwt.secret'`:** falta el archivo
  `backend/src/main/resources/application.properties`; cópialo desde la
  plantilla.
- **`Schema validation: missing table` o `missing column`:** los scripts SQL no
  se ejecutaron en orden (incluido el `04`), o falta la propiedad
  `spring.jpa.hibernate.naming.physical-strategy` en `application.properties`.
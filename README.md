# ExpresoFast — Consola de Operación Logística

**Universidad de Costa Rica — Sede del Atlántico, Recinto Paraíso**
**Carrera de Informática Empresarial**
**Curso:** IF0009 - Desarrollo de Software IV
**Profesor:** Mag. Jonathan Granados C.
**Ciclo:** II-2026
**Laboratorio:** 8 — Integración Pila Completa (Full-Stack)
**Estudiante:** Kendall Méndez Calderón
**Carné:** C4H142

---

## Descripción

Consola web de operación logística para la plataforma ExpresoFast. Permite a
usuarios con los roles `ROLE_ADMIN`, `ROLE_OPERADOR` y `ROLE_CONDUCTOR`
autenticarse mediante JWT y gestionar envíos, vehículos y bitácoras de
auditoría desde un cliente web responsivo (HTML5 + CSS3 + JavaScript) que
consume una API REST construida con Spring Boot.

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
│   └── 03_data_seeds.sql
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── styles.css
│   └── app.js
├── docs/
│   └── ExpresoFast_Postman_Collection.json
└── README.md
```

## 1. Configuración de la base de datos

1. Asegúrate de tener SQL Server corriendo localmente.
2. Ejecuta los scripts en orden desde la carpeta `database/` usando `sqlcmd`
   (el flag `-C` confía en el certificado del servidor, necesario con el
   Driver ODBC 18):

   ```cmd
   sqlcmd -S localhost -U sa -P "<tu-password>" -C -i database\01_schema_lab5.sql
   sqlcmd -S localhost -U sa -P "<tu-password>" -C -i database\02_schema_lab6_extension.sql
   sqlcmd -S localhost -U sa -P "<tu-password>" -C -i database\03_data_seeds.sql
   ```

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
   base de datos, `trustServerCertificate=true`).
2. Desde la carpeta `backend/`, compila y levanta el servidor:

   ```cmd
   mvn spring-boot:run
   ```

3. La API quedará disponible en `http://localhost:8080/api`.
4. Puedes verificar que está arriba probando el login:

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
3. Haz clic derecho sobre `index.html` (login) → **"Open with Live Server"**.
4. Esto abrirá el sitio en `http://127.0.0.1:5500/` (o el puerto que tengas
   configurado).
5. Inicia sesión con cualquiera de los usuarios de prueba de la tabla
   anterior. Serás redirigido al dashboard según el rol autenticado.

> **CORS:** el backend está configurado para aceptar peticiones desde
> `http://127.0.0.1:5500` y `http://localhost:5500`. Si usas otro puerto,
> actualiza la configuración de CORS en `SecurityConfig.java` /
> `WebConfig.java` del backend.

## 5. Ejecutar las pruebas y ver la cobertura (Lab 7)

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
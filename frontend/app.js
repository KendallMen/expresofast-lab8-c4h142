const API_BASE = "http://localhost:8080/api";
let envios = [];
let filtroActual = "TODOS";
let historialActual = [];

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        sessionStorage.setItem("jwt_token", data.token);
        sessionStorage.setItem("username", data.username);
        sessionStorage.setItem("roles", JSON.stringify(data.roles));
        window.location.href = "index.html"; // dashboard
      } else {
        document.getElementById("errorLogin").textContent = "Usuario o contraseña incorrectos";
      }
    } catch (err) {
      document.getElementById("errorLogin").textContent = "Error de conexión con el servidor";
    }
  });
}

const enviosGridEl = document.getElementById("enviosGrid");

if (enviosGridEl) {

  if (!sessionStorage.getItem("jwt_token")) {
    // No hay token: redirigimos y NO ejecutamos nada más de la lógica del dashboard.
    window.location.href = "login.html";
  } else {

    document.getElementById("usuarioActivo").textContent =
      sessionStorage.getItem("username") || "";

    document.getElementById("btnLogout").addEventListener("click", () => {
      sessionStorage.removeItem("jwt_token");
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("roles");
      window.location.href = "login.html";
    });

    function getRoles() {
      return JSON.parse(sessionStorage.getItem("roles") || "[]");
    }

    function tieneRol(rol) {
      return getRoles().includes(rol);
    }

    async function fetchWithAuth(url, options = {}) {
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${sessionStorage.getItem("jwt_token")}`,
        ...(options.headers || {})
      };

      const res = await fetch(url, { ...options, headers });

      if (res.status === 401 || res.status === 403) {
        sessionStorage.removeItem("jwt_token");
        sessionStorage.removeItem("username");
        sessionStorage.removeItem("roles");
        window.location.href = "login.html";
        throw new Error("Sesión expirada");
      }

      return res;
    }

    function aplicarPermisosUI() {
      const formEnvioSection = document.getElementById("formEnvio")?.closest("section");
      const tabFlota = document.getElementById("tabFlota");
      const asideAuditoria = document.getElementById("asideAuditoria");

      const soloConductor = tieneRol("ROLE_CONDUCTOR")
        && !tieneRol("ROLE_ADMIN")
        && !tieneRol("ROLE_OPERADOR");

      if (soloConductor && formEnvioSection) {
        formEnvioSection.style.display = "none";
      }

      if (tabFlota && !tieneRol("ROLE_ADMIN")) {
        tabFlota.style.display = "none";
      }

      if (asideAuditoria) {
        asideAuditoria.style.display = tieneRol("ROLE_ADMIN") ? "block" : "none";
      }
    }

    function actualizarKPIs() {
      document.getElementById("kpiTotalEnvios").textContent = envios.length;
      document.getElementById("kpiEntregados").textContent =
        envios.filter(e => e.estadoEnvio === "ENTREGADO").length;

      const placasActivas = new Set(
        envios.filter(e => e.estadoEnvio !== "ENTREGADO" && e.estadoEnvio !== "CANCELADO")
              .map(e => e.placaVehiculo)
      );
      document.getElementById("kpiVehiculosActivos").textContent = placasActivas.size;
    }

    async function cargarEnvios() {
      try {
        const res = await fetchWithAuth(`${API_BASE}/envios/optimizados`);
        if (!res.ok) throw new Error("No se pudieron cargar los envíos");
        envios = await res.json();
        renderizarTablero();
        if (tieneRol("ROLE_ADMIN")) {
          cargarAuditoriaGlobal();
        }
      } catch (error) {
        document.getElementById("enviosGrid").innerHTML = `<p class="error-msg">${error.message}</p>`;
      }
    }

    function renderizarTablero() {
      actualizarKPIs();

      const tablero = document.getElementById("enviosGrid");
      const visibles = filtroActual === "TODOS"
        ? envios
        : envios.filter(e => e.estadoEnvio === filtroActual);

      document.getElementById("contadorEnvios").textContent = `${visibles.length} envíos`;

      const mostrarBitacora = tieneRol("ROLE_ADMIN") || tieneRol("ROLE_OPERADOR");
      const puedeMarcarTransito = tieneRol("ROLE_ADMIN") || tieneRol("ROLE_OPERADOR");
      const puedeMarcarEntregado = tieneRol("ROLE_ADMIN") || tieneRol("ROLE_CONDUCTOR");

      tablero.innerHTML = visibles.map(e => `
        <article class="tarjeta-envio" data-id="${e.id}">
          <h3>${e.codigoRastreo}</h3>
          <p>${e.direccionDestino}</p>
          <p>${e.pesoKg} kg — ₡${e.costo}</p>
          <p>Vehículo: ${e.placaVehiculo} · Empresa: ${e.nombreEmpresa}</p>
          <p>Conductor: ${e.nombreConductor}</p>
          <span class="pill-status ${e.estadoEnvio}">${e.estadoEnvio}</span>
          <div class="acciones">
            ${puedeMarcarTransito && e.estadoEnvio === "PENDIENTE"
              ? `<button onclick="cambiarEstado(${e.id}, 'EN_TRANSITO')">Marcar en Tránsito</button>` : ""}
            ${puedeMarcarEntregado && e.estadoEnvio === "EN_TRANSITO"
              ? `<button onclick="cambiarEstado(${e.id}, 'ENTREGADO')">Marcar Entregado</button>` : ""}
            ${mostrarBitacora ? `<button onclick="verBitacora(${e.id})">Ver Bitácora</button>` : ""}
          </div>
        </article>
      `).join("");
    }

    window.cambiarEstado = async function (id, nuevoEstado) {
      const res = await fetchWithAuth(`${API_BASE}/envios/${id}/estado`, {
        method: "PATCH",
        body: JSON.stringify({ nuevoEstado, observaciones: "" })
      });

      if (res.ok) {
        cargarEnvios();
      } else {
        const error = await res.json();
        alert(error.mensaje || "No se pudo actualizar el estado");
      }
    };

    document.getElementById("formEnvio").addEventListener("submit", async (ev) => {
      ev.preventDefault();

      const payload = {
        codigoRastreo: document.getElementById("codigoRastreo").value,
        direccionDestino: document.getElementById("direccionDestino").value,
        pesoKg: parseFloat(document.getElementById("pesoKg").value),
        costo: parseFloat(document.getElementById("costo").value),
        vehiculoId: parseInt(document.getElementById("vehiculoId").value),
        conductorId: parseInt(document.getElementById("conductorId").value)
      };

      const errorMsg = document.getElementById("errorFormEnvio");

      try {
        const res = await fetchWithAuth(`${API_BASE}/envios`, {
          method: "POST",
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          errorMsg.textContent = "";
          ev.target.reset();
          cargarEnvios();
        } else {
          const error = await res.json();
          errorMsg.textContent = error.mensaje || Object.values(error.errores || {}).join(" ");
        }
      } catch (err) {
        errorMsg.textContent = "Error de conexión con el servidor";
      }
    });

    const formVehiculo = document.getElementById("formVehiculo");
    if (formVehiculo) {
      formVehiculo.addEventListener("submit", async (ev) => {
        ev.preventDefault();

        const payload = {
          placa: document.getElementById("placaVehiculo").value,
          marca: document.getElementById("marcaVehiculo").value,
          modelo: document.getElementById("modeloVehiculo").value,
          capacidadKg: parseFloat(document.getElementById("capacidadVehiculo").value),
          empresaId: parseInt(document.getElementById("empresaIdVehiculo").value)
        };

        const errorMsg = document.getElementById("errorFormVehiculo");

        try {
          const res = await fetchWithAuth(`${API_BASE}/vehiculos`, {
            method: "POST",
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            errorMsg.textContent = "";
            ev.target.reset();
            cargarEnvios();
          } else {
            const error = await res.json();
            errorMsg.textContent = error.mensaje || Object.values(error.errores || {}).join(" ");
          }
        } catch (err) {
          errorMsg.textContent = "Error de conexión con el servidor";
        }
      });
    }

    document.getElementById("filtros").addEventListener("click", (ev) => {
      if (ev.target.tagName !== "BUTTON") return;
      document.querySelectorAll("#filtros button").forEach(b => b.classList.remove("activo"));
      ev.target.classList.add("activo");
      filtroActual = ev.target.dataset.filtro;
      renderizarTablero();
    });

    window.verBitacora = async function (envioId) {
      const res = await fetchWithAuth(`${API_BASE}/envios/${envioId}/bitacora`);
      historialActual = await res.json();

      document.getElementById("fechaDesde").value = "";
      document.getElementById("fechaHasta").value = "";

      pintarBitacora(historialActual);
      document.getElementById("modalBitacora").style.display = "flex";
    };

    function pintarBitacora(lista) {
      const contenido = document.getElementById("bitacoraContenido");

      contenido.innerHTML = lista.map(h => `
        <div class="fila-bitacora">
          <strong>${h.estadoAnterior} → ${h.estadoNuevo}</strong>
          <span>${new Date(h.fechaCambio).toLocaleString()}</span>
          <span>Usuario: ${h.usuario}</span>
          ${h.observaciones ? `<p>${h.observaciones}</p>` : ""}
        </div>
      `).join("") || "<p>Sin historial registrado en este rango.</p>";
    }

    function filtrarBitacoraPorFecha() {
      const desde = document.getElementById("fechaDesde").value;
      const hasta = document.getElementById("fechaHasta").value;

      const filtrado = historialActual.filter(h => {
        const fecha = h.fechaCambio.substring(0, 10);
        return (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
      });

      pintarBitacora(filtrado);
    }

    document.getElementById("fechaDesde").addEventListener("change", filtrarBitacoraPorFecha);
    document.getElementById("fechaHasta").addEventListener("change", filtrarBitacoraPorFecha);

    document.getElementById("cerrarModal").addEventListener("click", () => {
      document.getElementById("modalBitacora").style.display = "none";
    });

    async function cargarAuditoriaGlobal() {
      const contenedor = document.getElementById("auditoriaGlobal");
      if (!contenedor) return;

      try {
        const todasLasBitacoras = await Promise.all(
          envios.map(e =>
            fetchWithAuth(`${API_BASE}/envios/${e.id}/bitacora`).then(r => r.json())
          )
        );

        const combinado = todasLasBitacoras
          .flat()
          .sort((a, b) => new Date(b.fechaCambio) - new Date(a.fechaCambio))
          .slice(0, 10);

        contenedor.innerHTML = combinado.map(h => `
          <div class="fila-auditoria">
            <strong>${h.estadoAnterior} → ${h.estadoNuevo}</strong><br>
            <span>${new Date(h.fechaCambio).toLocaleString()}</span><br>
            <span>Usuario: ${h.usuario}</span>
          </div>
        `).join("") || "<p>Sin actividad reciente.</p>";
      } catch (err) {
        contenedor.innerHTML = "<p class='error-msg'>No se pudo cargar la auditoría.</p>";
      }
    }

    aplicarPermisosUI();
    cargarEnvios();
  }
}
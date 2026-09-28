const API_V1 = "http://localhost:8080/api/v1";

if (!sessionStorage.getItem("jwt_token")) {
  window.location.href = "login.html";
}

const $ = (id) => document.getElementById(id);

$("usuarioActivo").textContent = sessionStorage.getItem("username") || "";
$("btnLogout").addEventListener("click", () => {
  sessionStorage.clear();
  window.location.href = "login.html";
});

let paginaActual = 0;
let totalPaginas = 0;

const esc = (t) => String(t ?? "").replace(/[&<>"']/g,
  (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function fetchWithAuth(url) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${sessionStorage.getItem("jwt_token")}`
    }
  });
  if (res.status === 401 || res.status === 403) {
    sessionStorage.clear();
    window.location.href = "login.html";
    throw new Error("Sesión expirada");
  }
  if (!res.ok) throw new Error(`Error del servidor (HTTP ${res.status})`);
  return res.json();
}

function pintarFilas(lista) {
  const cuerpo = $("cuerpoTabla");
  if (!lista.length) {
    cuerpo.innerHTML = `<tr><td colspan="5">No hay envíos para mostrar.</td></tr>`;
    return;
  }
  cuerpo.innerHTML = lista.map(e => `
    <tr>
      <td>${esc(e.codigoRastreo)}</td>
      <td>${esc(e.destinatario)}</td>
      <td>${esc(e.direccionDestino)}</td>
      <td>₡${Number(e.montoFlete).toLocaleString("es-CR")}</td>
      <td><span class="pill-status ${esc(e.estado)}">${esc(e.estado)}</span></td>
    </tr>`).join("");
}

function actualizarPaginador(data) {
  totalPaginas = data.totalPages;
  $("btnPrimera").disabled = data.first;
  $("btnAnterior").disabled = data.first;
  $("btnSiguiente").disabled = data.last;
  $("btnUltima").disabled = data.last;
  $("infoPagina").textContent =
    `Página ${data.number + 1} de ${Math.max(data.totalPages, 1)} (Total: ${data.totalElements} envíos)`;
}

function modoStoredProcedure(total) {
  ["btnPrimera", "btnAnterior", "btnSiguiente", "btnUltima"].forEach(id => $(id).disabled = true);
  $("infoPagina").textContent =
    `Resultado del Stored Procedure SP_OBTENER_ENVIOS_POR_ESTADO (${total} envíos)`;
}

async function cargar() {
  $("mensajeError").textContent = "";
  const sp = $("selectSP").value;
  try {
    if (sp) {
      const lista = await fetchWithAuth(`${API_V1}/envios/procedimiento/${encodeURIComponent(sp)}`);
      pintarFilas(lista);
      modoStoredProcedure(lista.length);
      return;
    }
    const params = new URLSearchParams({
      page: paginaActual,                    // base 0 hacia la API
      size: $("selectSize").value,
      busqueda: $("busqueda").value.trim()
    });
    const data = await fetchWithAuth(`${API_V1}/envios?${params}`);
    pintarFilas(data.content);
    actualizarPaginador(data);
  } catch (e) {
    $("mensajeError").textContent = e.message;
  }
}

$("btnPrimera").addEventListener("click", () => { paginaActual = 0; cargar(); });
$("btnAnterior").addEventListener("click", () => { if (paginaActual > 0) { paginaActual--; cargar(); } });
$("btnSiguiente").addEventListener("click", () => { paginaActual++; cargar(); });
$("btnUltima").addEventListener("click", () => { paginaActual = Math.max(totalPaginas - 1, 0); cargar(); });

$("formFiltros").addEventListener("submit", (ev) => { ev.preventDefault(); paginaActual = 0; cargar(); });
$("selectSize").addEventListener("change", () => { paginaActual = 0; cargar(); });
$("selectSP").addEventListener("change", () => {
  const usaSP = $("selectSP").value !== "";
  $("busqueda").disabled = usaSP;
  $("selectSize").disabled = usaSP;
  paginaActual = 0;
  cargar();
});

cargar();
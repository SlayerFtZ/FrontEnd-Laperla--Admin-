document.addEventListener("DOMContentLoaded", function () {
    // Obtener datos del localStorage
    const token = localStorage.getItem("token");
    const id = getDecryptedUserId();
    const rol = localStorage.getItem("rol");
    const estado = localStorage.getItem("estado");

    // Validar existencia de datos y el estado del usuario
    if (!token || !id || !rol || !estado) {
        window.location.href = "../../view/modulo-login/page-login.html";
    } else if (estado.toLowerCase() === "inactivo") {
        // Si el estado es inactivo, limpiar almacenamiento y redirigir
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "../../view/modulo-login/page-login.html";
    }

});



const select = document.getElementById("opcionesBuscarEgreso");
const input = document.getElementById("inputBusqueda");
const tablaBody = document.querySelector("tbody");
const urlBase = "https://laperlacentrocomercial.dyndns.org/api/pagos";

// Función reutilizable para buscar y renderizar la tabla
function buscarEgresos() {
    const opcion = select.value;
    const valor = input.value.trim();
    const token = localStorage.getItem("token");
    let url = "";
    let paginacion = "?numeroPagina=0&tamanoPagina=10";  // Para implementar paginación si es necesario

    switch (opcion) {
        case "todos":
            url = `${urlBase}`; // Lista todos los pagos
            break;
        case "nUsuario":
            url = `${urlBase}/buscar/usuario?nombre=${encodeURIComponent(valor)}`; // Buscar por nombre de usuario
            break;
        case "fecha":
            let [fechaInicio] = valor.split(",");
            // Reemplazar "/" por "-" y reordenar si es necesario
            fechaInicio = fechaInicio.replace(/\//g, "-");
            const partesFecha = fechaInicio.split("-");
            if (partesFecha.length === 3) {
            // Si el formato es DD-MM-YYYY, convertirlo a YYYY-MM-DD
            const [dia, mes, anio] = partesFecha;
            fechaInicio = `${anio}-${mes}-${dia}`;
            }
            url = `${urlBase}/buscar/fecha?fechaPago=${fechaInicio}`; // Buscar por fecha
            break;
            case "descripcion":
                url = `${urlBase}/buscar/descripcion?descripcion=${encodeURIComponent(valor)}`; // Buscar por descripción
                break;
        default:
            Swal.fire({
                icon: 'warning',
                title: 'Advertencia',
                text: 'Selecciona una opción válida.',
                confirmButtonText: 'Aceptar'
            });
            return;
    }

    fetch(url, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (!response.ok) throw new Error("No se encontraron datos");
        return response.json();
    })
    .then(data => {
        const resultados = data.content || data;
        tablaBody.innerHTML = "";
        resultados.forEach(egreso => {
            const fila = `
                <tr>
                    <td>${egreso.idPago}</td>
                    <td><img src="${egreso.foto || '../../images/perfilUsuario.jpg'}" width="50" class="me-2">
                    ${egreso.nombreCompleto}</td>
                    <td>${egreso.descripcion}</td>
                    <td>${egreso.fechaPago}</td>
                    <td>$${egreso.monto.toFixed(2)}</td>
                    <td>
                        <button type="button" class="btn btn-warning btn-abrir-modal" 
                            data-id="${egreso.idPago}"
                            data-nombre="${egreso.nombreCompleto}"
                            data-descripcion="${egreso.descripcion}"
                            data-fecha="${egreso.fechaPago}"
                            data-monto="${egreso.monto}"
                            data-bs-toggle="modal"
                            data-bs-target="#modalActualizarEgreso">
                            Actualizar
                        </button>
                    </td>
                </tr>
            `;
            tablaBody.insertAdjacentHTML("beforeend", fila);
        });
    })
    .catch(error => {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se encontraron resultados.',
            confirmButtonText: 'Aceptar'
        });
        tablaBody.innerHTML = "<tr><td colspan='6'>No se encontraron resultados</td></tr>";
    });
}

// Buscar cuando se hace clic en el botón
document.querySelector(".app-search__button").addEventListener("click", buscarEgresos);


// Delegación de eventos para abrir el modal
tablaBody.addEventListener("click", (e) => {
    if (e.target.classList.contains('btn-abrir-modal')) {
        const btn = e.target;
        document.getElementById('usuarioEgreso').value = btn.getAttribute('data-nombre');
        document.getElementById('descripcionEgreso').value = btn.getAttribute('data-descripcion');
        document.getElementById('fechaEgreso').value = btn.getAttribute('data-fecha');
        document.getElementById('costMen').value = btn.getAttribute('data-monto');
        document.getElementById('modalActualizarEgreso').setAttribute('data-id-pago', btn.getAttribute('data-id'));
    }
});

// Actualizar egreso
document.getElementById('btnActualizarEgreso').addEventListener('click', () => {
    const modal = document.getElementById('modalActualizarEgreso');
    const idPago = modal.getAttribute('data-id-pago');
    const token = localStorage.getItem("token");
    const descripcion = document.getElementById('descripcionEgreso').value.trim();
    const fechaPago = document.getElementById('fechaEgreso').value;
    const monto = parseFloat(document.getElementById('costMen').value);

    const data = {
        descripcion,
        fechaPago,
        monto,
        idUsuario: getDecryptedUserId() // Ajusta dinámicamente si es necesario
    };

    fetch(`${urlBase}/actualizar/${idPago}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al actualizar el pago');
        return response.json();
    })
    .then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Pago actualizado',
            text: 'El pago se actualizó correctamente.',
            confirmButtonText: 'Aceptar'
        }).then(() => {
            buscarEgresos(); // Recarga solo la tabla
            const modalInstance = bootstrap.Modal.getInstance(modal);
            modalInstance.hide(); // Cierra el modal
        });
    })
    .catch(error => {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al actualizar el egreso.',
            confirmButtonText: 'Aceptar'
        });
    });
});




document.getElementById("logoutBtn").addEventListener("click", function () {
    localStorage.clear();  // Limpia todo el localStorage
    sessionStorage.clear(); // Limpia todo el sessionStorage
    window.location.href = "../modulo-login/page-login.html"; // Redirige al login
});

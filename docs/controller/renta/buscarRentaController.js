let page = 0;
let size = 10;
let token, id, rol, estado;

document.addEventListener("DOMContentLoaded", function () {
    token = localStorage.getItem("token");
    id = getDecryptedUserId();
    rol = localStorage.getItem("rol");
    estado = localStorage.getItem("estado");

    if (!token || !id || !rol || !estado || estado.toLowerCase() === "inactivo") {
        console.log("No se encontraron credenciales válidas. Redirigiendo al login.");
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "../../view/modulo-login/page-login.html";
        return;
    }

    inicializarEventos();
});

function inicializarEventos() {
    const botonBuscar = document.querySelector('.app-search__button');
    if (botonBuscar) {
        botonBuscar.addEventListener('click', buscarRentas);
    }

    const inputBusqueda = document.getElementById('inputBusqueda');
    if (inputBusqueda) {
        inputBusqueda.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                buscarRentas();
            }
        });
    }

    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const seleccionarTamano = document.querySelector('select[name="seleccionarTamano"]');

    btnAnterior.addEventListener('click', (e) => {
        e.preventDefault();
        if (page > 0) {
            page--;
            buscarRentas();
        }
    });

    btnSiguiente.addEventListener('click', (e) => {
        e.preventDefault();
        page++;
        buscarRentas();
    });

    seleccionarTamano.addEventListener('change', () => {
        size = parseInt(seleccionarTamano.value);
        page = 0;
        buscarRentas();
    });

    // Event delegation para modal de abonos
    document.addEventListener('click', manejarClicksGlobales);

    // Evento para el formulario de pago
    const formPago = document.getElementById('formPago');
    if (formPago) {
        formPago.addEventListener('submit', procesarPago);
    }
}

function buscarRentas() {
    const valorBusqueda = document.getElementById('inputBusqueda')?.value.trim();
    const opcion = document.getElementById('opcionesBuscarUsuario')?.value;

    if (!valorBusqueda || opcion === 'seleccion') {
        Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'Selecciona una opción de búsqueda y escribe un valor.',
        });
        return;
    }

    let url = construirURL(opcion, valorBusqueda);
    if (!url) return;

    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
        .then(res => {
            if (!res.ok) throw new Error("Respuesta no OK");
            return res.json();
        })
        .then(data => {
            actualizarBotonesPaginacion(data.number, data.totalPages);
            renderizarTablaRentas(data.content);
            actualizarInfoPagina(data.number, data.totalPages, data.numberOfElements, data.totalElements);
        })
        .catch(() => {
            Swal.fire({
                icon: 'error',
                title: 'Sin resultados',
                text: 'No se encontraron registros con esos datos.',
            });
            document.querySelector('.table-responsive tbody').innerHTML = `
                <tr><td colspan="9" class="text-center">No se encontraron resultados.</td></tr>
            `;
        });
}

function construirURL(opcion, valorBusqueda) {
    let url = '';
    
    switch (opcion) {
        case 'localNombreUsuario':
            url = `https://laperlacentrocomercial.dyndns.org/api/rentas/buscar/usuario?nombreUsuario=${valorBusqueda}&page=${page}&size=${size}`;
            break;
        case 'localNombreLocal':
            url = `https://laperlacentrocomercial.dyndns.org/api/rentas/buscar/local?nombreLocal=${valorBusqueda}&page=${page}&size=${size}`;
            break;
        case 'estadoPagoLocal':
            url = `https://laperlacentrocomercial.dyndns.org/api/rentas/buscar/estadoPago?estadoPago=${valorBusqueda}&page=${page}&size=${size}`;
            break;
        case 'fechaInicio':
            const fechaFormateada = convertirFecha(valorBusqueda);
            if (!fechaFormateada) {
                Swal.fire({
                    icon: 'error',
                    title: 'Fecha inválida',
                    text: 'Por favor ingresa una fecha válida en formatos como DD/MM/YYYY o YYYY-MM-DD.',
                });
                return null;
            }
            url = `https://laperlacentrocomercial.dyndns.org/api/rentas/buscar/fecha?fechaInicio=${fechaFormateada}&page=${page}&size=${size}`;
            break;
        default:
            Swal.fire({
                icon: 'warning',
                title: 'Advertencia',
                text: 'Opción de búsqueda no válida.',
            });
            return null;
    }
    
    return url;
}

function convertirFecha(fechaTexto) {
    const partes = fechaTexto.includes('/') ? fechaTexto.split('/') : fechaTexto.split('-');

    if (partes.length !== 3) return null;

    let dia, mes, anio;

    if (partes[0].length === 4) {
        anio = partes[0];
        mes = partes[1];
        dia = partes[2];
    } else {
        dia = partes[0];
        mes = partes[1];
        anio = partes[2];
    }

    if (dia.length === 1) dia = '0' + dia;
    if (mes.length === 1) mes = '0' + mes;

    return `${anio}-${mes}-${dia}`;
}

function renderizarTablaRentas(rentas) {
    const tbody = document.querySelector('.table-responsive tbody');
    tbody.innerHTML = '';

    rentas.sort((a, b) => {
        const prioridad = { 'Abono': 1, 'Pendiente': 2, 'Pagado': 3 };
        return prioridad[a.estadoPago] - prioridad[b.estadoPago];
    });

    rentas.forEach(renta => {
        const botonEstadoPago = renta.estadoPago === 'Pagado'
            ? `<button class="btn btn-warning" disabled>Liquidado</button>`
            : `<button class="btn btn-warning btn-abonar" 
                data-bs-toggle="modal" 
                data-bs-target="#simularPagoModal"
                data-monto="${renta.montoPagado}" 
                data-adeudo="${renta.adeudo}" 
                data-id-renta="${renta.idRenta}">
                <i class="bi bi-coin"></i>Abono
            </button>`;

        let botonInfo = '';
        if ((renta.estadoPago === 'Abono' || renta.estadoPago === 'Pagado') && renta.abonos && renta.abonos.length > 0) {
            botonInfo = `
            <button class="btn btn-primary btn-info-abonos"
                data-abonos='${JSON.stringify(renta.abonos)}'>
                <i class="bi bi-cash-coin"></i>Info
            </button>`;
        }
        
        let botonRecibo = '';
        if (renta.estadoPago === 'Pagado' && renta.abonos && renta.abonos.length > 0) {
            botonRecibo = `
            <button class="btn btn-info btn-recibo" 
                data-id-renta="${renta.idRenta}"
                title="Generar Recibo">
                <i class="bi bi-cloud-download-fill"></i>Recibo
            </button>`;
        }

        let claseFondoEstado = '';
        switch (renta.estadoPago) {
            case 'Pagado': claseFondoEstado = 'bg-success text-white'; break;
            case 'Abono': claseFondoEstado = 'bg-warning text-dark'; break;
            case 'Pendiente': claseFondoEstado = 'bg-danger text-white'; break;
        }

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td><strong>${renta.nombreLocal}</strong></td>
            <td>
                <img src="${renta.fotoPerfilUrl || '../../images/perfilUsuario.jpg'}" width="80" class="rounded-circle me-2">
                ${renta.nombreUsuario} ${renta.apellidoPaterno} ${renta.apellidoMaterno}
            </td>
            <td>${renta.fechaInicio.split('-').reverse().join('/')}</td>
            <td>${renta.fechaFin.split('-').reverse().join('/')}</td>
            <td>${renta.estadoLocal}</td>
            <td>$${renta.adeudo.toFixed(2)}</td>
            <td>$${renta.montoPagado.toFixed(2)}</td>
            <td class="${claseFondoEstado} fw-bold">${renta.estadoPago}</td>
            <td>${botonEstadoPago}${botonInfo}${botonRecibo}</td>
        `;
        tbody.appendChild(fila);
    });

    // Agregar listeners a botones de abonar
    document.querySelectorAll('.btn-abonar').forEach(btn => {
        btn.addEventListener('click', () => {
            const monto = btn.getAttribute('data-monto');
            const adeudo = btn.getAttribute('data-adeudo');
            const idRenta = btn.getAttribute('data-id-renta');

            const inputMonto = document.getElementById('montoAbonado');
            const inputAdeudo = document.getElementById('Adeudo');
            const inputHiddenAdeudo = document.getElementById('hiddenAdeudo');
            const inputHiddenIdRenta = document.getElementById('hiddenIdRenta');

            if (inputMonto) inputMonto.value = `$${parseFloat(monto).toFixed(2)}`;
            if (inputAdeudo) inputAdeudo.value = `$${parseFloat(adeudo).toFixed(2)}`;
            if (inputHiddenAdeudo) inputHiddenAdeudo.value = adeudo;
            if (inputHiddenIdRenta) inputHiddenIdRenta.value = idRenta;
        });
    });

    // ✅ NUEVO: Agregar listeners a botones de recibo
    document.querySelectorAll('.btn-recibo').forEach(btn => {
        btn.addEventListener('click', () => {
            const idRenta = btn.getAttribute('data-id-renta');
            manejarGeneracionRecibo(idRenta);
        });
    });
}

// ✅ NUEVA FUNCIÓN: Manejar la generación de recibo
async function manejarGeneracionRecibo(idRenta) {
    try {
        // Mostrar loading
        Swal.fire({
            title: 'Verificando...',
            text: 'Comprobando el estado del recibo',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // 1. Validar si puede generar recibo
        const validacion = await validarRecibo(idRenta);
        
        if (!validacion.puedeGenerar) {
            Swal.fire({
                icon: 'warning',
                title: 'Recibo No Disponible',
                text: validacion.mensaje,
                confirmButtonText: 'Entendido'
            });
            return;
        }

        // 2. Obtener estado de pago (opcional, para mostrar info)
        const estado = await obtenerEstadoPago(idRenta);

        // 3. Confirmar antes de generar
        const confirmar = await Swal.fire({
            icon: 'question',
            title: '¿Generar Recibo?',
            html: `
                <p><strong>Monto Total:</strong> $${estado.montoTotal.toFixed(2)}</p>
                <p><strong>Monto Pagado:</strong> $${estado.montoPagado.toFixed(2)}</p>
                <p><strong>Estado:</strong> ${estado.estadoPago}</p>
                <br>
                <p>¿Desea generar y visualizar el recibo en PDF?</p>
            `,
            showCancelButton: true,
            confirmButtonText: '📄 Generar PDF',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745'
        });

        if (confirmar.isConfirmed) {
            // 4. Generar y mostrar PDF
            mostrarReciboPDF(idRenta);
        }

    } catch (error) {
        console.error('Error al manejar recibo:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Hubo un problema al procesar el recibo. Por favor intente nuevamente.',
            confirmButtonText: 'Aceptar'
        });
    }
}

// ✅ NUEVA FUNCIÓN: Validar si puede generar recibo
async function validarRecibo(idRenta) {
    const response = await fetch(`https://laperlacentrocomercial.dyndns.org/api/recibos-renta/validar/${idRenta}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Renta no encontrada');
        }
        throw new Error('Error al validar recibo');
    }

    return await response.json();
}

// ✅ NUEVA FUNCIÓN: Obtener estado de pago
async function obtenerEstadoPago(idRenta) {
    const response = await fetch(`https://laperlacentrocomercial.dyndns.org/api/recibos-renta/estado-pago/${idRenta}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Renta no encontrada');
        }
        throw new Error('Error al obtener estado');
    }

    return await response.json();
}

// ✅ NUEVA FUNCIÓN: Mostrar PDF en modal
function mostrarReciboPDF(idRenta) {
    const token = localStorage.getItem("token");
    const urlAPI = `https://laperlacentrocomercial.dyndns.org/api/recibos-renta/generar/${idRenta}`;

    // Fetch con JWT y tipo blob
    fetch(urlAPI, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => {
        if (!res.ok) throw new Error('Error al generar el PDF');
        return res.blob();
    })
    .then(blob => {
        const blobURL = URL.createObjectURL(blob);

        const modalHTML = `
        <div class="modal fade" id="modalReciboPDF" tabindex="-1" aria-labelledby="modalReciboPDFLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header bg-success text-white">
                        <h5 class="modal-title" id="modalReciboPDFLabel">
                            <i class="bi bi-file-earmark-pdf-fill"></i> Recibo de Pago - Renta #${idRenta}
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-0">
                        <iframe 
                            src="${blobURL}" 
                            style="width:100%; height:80vh; border:none;"
                            title="Recibo PDF">
                        </iframe>
                    </div>
                    <div class="modal-footer">
                        <a href="${blobURL}" 
                           download="recibo_renta_${idRenta}.pdf" 
                           class="btn btn-success">
                            <i class="bi bi-download"></i> Descargar PDF
                        </a>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
        `;

        // Remover modal anterior si existe
        const modalAnterior = document.getElementById('modalReciboPDF');
        if (modalAnterior) modalAnterior.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = new bootstrap.Modal(document.getElementById('modalReciboPDF'));
        modal.show();

        // Limpiar el modal cuando se cierre
        document.getElementById('modalReciboPDF').addEventListener('hidden.bs.modal', function () {
            this.remove();
            URL.revokeObjectURL(blobURL); // liberar memoria del blob
        });
    })
    .catch(err => {
        console.error(err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar el recibo PDF. Intenta de nuevo.',
        });
    });
}


function manejarClicksGlobales(e) {
    // Mostrar modal de abonos
    if (e.target.classList.contains('btn-info-abonos')) {
        const abonos = JSON.parse(e.target.getAttribute('data-abonos'));
        const contenedor = document.getElementById('abonosContenido');
        contenedor.innerHTML = '';

        abonos.forEach(abono => {
            const fecha = new Date(abono.fecha).toLocaleString('es-MX');
            contenedor.innerHTML += `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px; border-bottom:1px solid #ddd; padding-bottom:10px;">
                <img src="${abono.fotoPerfilUrl}" style="width:60px; height:60px; border-radius:50%; object-fit:cover;">
                <div>
                <strong>${abono.nombreUsuario}</strong><br>
                Fecha: ${fecha}<br>
                Monto: $${abono.monto.toFixed(2)}<br>
                Tipo: ${abono.tipo}
                </div>
            </div>
            `;
        });

        document.getElementById('modalAbonos').style.display = 'block';
    }

    // Cerrar modal
    if (e.target.classList.contains('close')) {
        e.target.closest('.modal').style.display = 'none';
    }
}

// Cerrar modal al hacer clic fuera
window.onclick = function (e) {
    const modal = document.getElementById('modalAbonos');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
};

function procesarPago(e) {
    e.preventDefault();

    const montoInput = document.getElementById('montoAbonado');
    const hiddenAdeudo = document.getElementById('hiddenAdeudo');
    const hiddenIdRenta = document.getElementById('hiddenIdRenta');

    const montoRenta = parseFloat(document.getElementById('montoRenta').value);
    const adeudo = hiddenAdeudo ? parseFloat(hiddenAdeudo.value) : NaN;
    const idRenta = hiddenIdRenta?.value;
    const idUsuarioRegistro = getDecryptedUserId();

    if (isNaN(adeudo) || montoRenta <= 0) {
        Swal.fire({
            icon: 'error',
            title: '¡Error!',
            text: 'Por favor ingrese un monto válido para abonar.',
            confirmButtonText: 'Aceptar'
        });
    } else if (montoRenta > adeudo) {
        Swal.fire({
            icon: 'error',
            title: '¡Error!',
            text: 'El monto a abonar no puede ser mayor que el adeudo.',
            confirmButtonText: 'Aceptar'
        });
    } else {
        fetch(`https://laperlacentrocomercial.dyndns.org/api/rentas/${idRenta}/abono?monto=${montoRenta}&&idUsuarioQuienRegistra=${idUsuarioRegistro}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ monto: montoRenta })
        })
            .then(response => response.json())
            .then(data => {
                console.log('Respuesta de la API:', data);
                if (data.estadoPago === 'ABONO') {
                    Swal.fire({
                        title: '¡Éxito!',
                        text: 'Se ha abonado correctamente.',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    }).then(() => {
                        montoInput.value = '';
                        $('#simularPagoModal').modal('hide');
                        buscarRentas();
                    });
                } else if (data.estadoPago === 'PAGADO') {
                    Swal.fire({
                        title: '¡Pago exitoso!',
                        text: 'La Renta ya ha sido liquidada.',
                        icon: 'success',
                        confirmButtonText: 'Aceptar'
                    }).then(() => {
                        $('#simularPagoModal').modal('hide');
                        buscarRentas();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: '¡Error!',
                        text: data.message || 'Hubo un problema al procesar el abono.',
                        confirmButtonText: 'Aceptar'
                    });
                }
            })
            .catch(error => {
                console.error("Error en el abono: ", error);
                Swal.fire({
                    icon: 'error',
                    title: '¡Error!',
                    text: 'Hubo un error al procesar la solicitud.',
                    confirmButtonText: 'Aceptar'
                });
            });
    }
}

function actualizarInfoPagina(pageNumber, totalPages, numberOfElements, totalElements) {
    const info = document.getElementById('seccionPagina');
    
    // Calcular el rango de registros mostrados
    const desde = (pageNumber * size) + 1;
    const hasta = Math.min((pageNumber * size) + numberOfElements, totalElements);
    
    if (info) {
        info.innerText = `Página ${pageNumber + 1} de ${totalPages}, mostrando ${desde}-${hasta} de ${totalElements} registros`;
    }

    const pagContainer = document.querySelector('#paginacion ul.pagination');
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    
    // LIMITAR PÁGINAS MOSTRADAS PARA EVITAR QUE SE ALARGUE
    pagContainer.querySelectorAll('li.page-number').forEach(li => li.remove());

    const MAX_PAGES_SHOWN = 5; // Mostrar máximo 5 números de página
    let startPage = Math.max(0, pageNumber - 2);
    let endPage = Math.min(totalPages, startPage + MAX_PAGES_SHOWN);

    if (endPage - startPage < MAX_PAGES_SHOWN) {
        startPage = Math.max(0, endPage - MAX_PAGES_SHOWN);
    }

    for (let i = startPage; i < endPage; i++) {
        const li = document.createElement('li');
        li.classList.add('paginate_button', 'page-item', 'page-number');
        if (i === pageNumber) li.classList.add('active');
        li.innerHTML = `<a class="page-link" href="#">${i + 1}</a>`;
        li.addEventListener('click', (e) => {
            e.preventDefault();
            page = i;
            buscarRentas();
        });
        pagContainer.insertBefore(li, btnSiguiente);
    }
}

function actualizarBotonesPaginacion(paginaActual, totalPaginas) {
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    
    btnAnterior.classList.toggle('disabled', paginaActual <= 0);
    btnSiguiente.classList.toggle('disabled', paginaActual >= totalPaginas - 1);
}
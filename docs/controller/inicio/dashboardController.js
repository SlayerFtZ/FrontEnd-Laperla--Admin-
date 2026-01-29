// ========== VARIABLES GLOBALES ==========
let selectedYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth() + 1;

// ========== INICIALIZACIÓN ==========
document.addEventListener("DOMContentLoaded", function () {
    // Verificar autenticación
    const token = localStorage.getItem("token");
    const id = getDecryptedUserId();
    const rol = localStorage.getItem("rol");

    if (!token || !id || !rol) {
        window.location.href = "../../view/modulo-login/page-login.html";
        return;
    }

    // Inicializar controles de filtro
    inicializarFiltros();
    
    // Cargar datos iniciales
    cargarDatosDashboard();
    
    // Event listeners para filtros
    document.getElementById('btnFiltrar').addEventListener('click', function() {
        selectedMonth = parseInt(document.getElementById('selectMes').value);
        selectedYear = parseInt(document.getElementById('selectAnio').value);
        cargarDatosDashboard();
    });

    document.getElementById('btnResetear').addEventListener('click', function() {
        const fechaActual = new Date();
        selectedMonth = fechaActual.getMonth() + 1;
        selectedYear = fechaActual.getFullYear();
        document.getElementById('selectMes').value = selectedMonth;
        document.getElementById('selectAnio').value = selectedYear;
        cargarDatosDashboard();
    });

    // Logout
    document.getElementById("logoutBtn").addEventListener("click", function () {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "../modulo-login/page-login.html";
    });
});

// ========== INICIALIZAR FILTROS ==========
function inicializarFiltros() {
    const selectAnio = document.getElementById('selectAnio');
    const selectMes = document.getElementById('selectMes');
    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth() + 1;

    // Llenar select de años (últimos 5 años + próximos 2)
    for (let i = anioActual - 5; i <= anioActual + 2; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        if (i === anioActual) option.selected = true;
        selectAnio.appendChild(option);
    }

    // Seleccionar mes actual
    selectMes.value = mesActual;
}

// ========== CARGAR TODOS LOS DATOS DEL DASHBOARD ==========
function cargarDatosDashboard() {
    cargarUsuariosPorRol();
    cargarIngresosMensuales();
    cargarIngresosCombinados();
    cargarReparaciones();
    cargarEgresos();
    cargarGraficaIngresos();
    cargarGraficaEgresos();
    cargarEstadoResultados();
}

// ========== USUARIOS POR ROL ==========
function cargarUsuariosPorRol() {
    const token = localStorage.getItem("token");

    fetch("https://laperlacentrocomercial.dyndns.org/api/dashboard/usuarios/por-rol", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (!response.ok) throw new Error("Error en la respuesta del servidor");
        return response.json();
    })
    .then(data => {
        const socioData = data.find(item => item.rol === "Socio");
        const socioTotal = socioData ? socioData.cantidad : 0;
        document.getElementById("total-socios").textContent = socioTotal;

        const adminData = data.find(item => item.rol === "Administrador");
        const adminTotal = adminData ? adminData.cantidad : 0;
        document.getElementById("total-administradores").textContent = adminTotal;

        const empleadoData = data.find(item => item.rol === "Empleado");
        const empleadoTotal = empleadoData ? empleadoData.cantidad : 0;
        document.getElementById("total-empleado").textContent = empleadoTotal;
    })
    .catch(error => {
        console.error("Error al obtener los datos de roles:", error);
        document.getElementById("total-socios").textContent = "Error";
        document.getElementById("total-administradores").textContent = "Error";
        document.getElementById("total-empleado").textContent = "Error";
    });
}

// ========== INGRESOS MENSUALES (GRÁFICA DE PASTEL) ==========
function cargarIngresosMensuales() {
    const token = localStorage.getItem('token');
    const url = `https://laperlacentrocomercial.dyndns.org/api/dashboard/ingresos?year=${selectedYear}&month=${selectedMonth}`;

    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al obtener ingresos');
        return response.json();
    })
    .then(data => {
        const totalJuegos = data.totalJuego || 0;
        const totalRentas = data.totalRenta || 0;
        const totalExtras = data.totalExtras || 0;
        const sumaTotal = totalJuegos + totalRentas + totalExtras;

        // Actualizar widgets
        const juegosElement = document.querySelector('.widget-small.warning .info p b');
        if (juegosElement) juegosElement.textContent = `$${totalJuegos.toLocaleString('es-MX')}`;

        const rentaElement = document.querySelector('.widget-small.info .info p b');
        if (rentaElement) rentaElement.textContent = `$${totalRentas.toLocaleString('es-MX')}`;

        const graficatotalElement = document.getElementById('graficatotal');
        if (graficatotalElement) {
            graficatotalElement.textContent = `Total: $${sumaTotal.toLocaleString('es-MX')}`;
        }

        // Gráfica de pastel
        const supportChartElement = document.getElementById("supportRequestChart");
        if (supportChartElement) {
            const supportChart = echarts.init(supportChartElement, null, { renderer: 'svg' });

            const updatedSupportRequests = {
                tooltip: {
                    trigger: 'item',
                    formatter: "<b>{b}:</b> ${c}"
                },
                legend: {
                    orient: 'vertical',
                    left: 'left'
                },
                series: [{
                    name: 'Ingresos',
                    type: 'pie',
                    radius: '75%',
                    data: [
                        { value: totalJuegos, name: 'Juegos' },
                        { value: totalRentas, name: 'Rentas' },
                        { value: totalExtras, name: 'Pagos extras' }
                    ],
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }]
            };

            supportChart.setOption(updatedSupportRequests);
            new ResizeObserver(() => supportChart.resize()).observe(supportChartElement);
        }
    })
    .catch(error => {
        console.error('Error al cargar datos del dashboard:', error);
        const juegosElement = document.querySelector('.widget-small.warning .info p b');
        if (juegosElement) juegosElement.textContent = 'Error al cargar';

        const rentaElement = document.querySelector('.widget-small.info .info p b');
        if (rentaElement) rentaElement.textContent = 'Error al cargar';

        const graficatotalElement = document.getElementById('graficatotal');
        if (graficatotalElement) {
            graficatotalElement.textContent = 'Error al cargar';
        }
    });
}

// ========== INGRESOS COMBINADOS ==========
function cargarIngresosCombinados() {
    const token = localStorage.getItem('token');
    const url = `https://laperlacentrocomercial.dyndns.org/api/dashboard/ingresos/combinados?year=${selectedYear}&month=${selectedMonth}`;

    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        return response.json();
    })
    .then(data => {
        const totalCombinado = data.totalCombinado || 0;
        const ingresosElement = document.querySelector('#totalIngresos .info p b');
        if (ingresosElement) {
            ingresosElement.textContent = `$${totalCombinado.toLocaleString('es-MX')}`;
        }
    })
    .catch(error => {
        console.error('Error al obtener los ingresos combinados:', error);
        const ingresosElement = document.querySelector('#totalIngresos .info p b');
        if (ingresosElement) {
            ingresosElement.textContent = 'Error al cargar';
        }
    });
}

// ========== REPARACIONES ==========
function cargarReparaciones() {
    const token = localStorage.getItem('token');
    const url = `https://laperlacentrocomercial.dyndns.org/api/dashboard/reparaciones/costo?year=${selectedYear}&month=${selectedMonth}`;

    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        return response.json();
    })
    .then(data => {
        const totalCosto = data.totalCosto || 0;
        const ingresosElement = document.querySelector('#totalReparaciones .info p b');
        if (ingresosElement) {
            ingresosElement.textContent = `$${totalCosto.toLocaleString('es-MX')}`;
        }
    })
    .catch(error => {
        console.error('Error al obtener reparaciones:', error);
        const ingresosElement = document.querySelector('#totalReparaciones .info p b');
        if (ingresosElement) {
            ingresosElement.textContent = 'Error al cargar';
        }
    });
}

// ========== EGRESOS ==========
function cargarEgresos() {
    const token = localStorage.getItem('token');
    const url = `https://laperlacentrocomercial.dyndns.org/api/dashboard/egresos?year=${selectedYear}&month=${selectedMonth}`;

    fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        return response.json();
    })
    .then(data => {
        const totalEgresos = data.totalEgresos || 0;
        const ingresosElement = document.querySelector('#totalEgresos .info p b');
        if (ingresosElement) {
            ingresosElement.textContent = `$${totalEgresos.toLocaleString('es-MX')}`;
        }
    })
    .catch(error => {
        console.error('Error al obtener egresos:', error);
        const ingresosElement = document.querySelector('#totalEgresos .info p b');
        if (ingresosElement) {
            ingresosElement.textContent = 'Error al cargar';
        }
    });
}

// ========== GRÁFICA DE INGRESOS ANUALES ==========
function cargarGraficaIngresos() {
    const token = localStorage.getItem('token');
    const url = `https://laperlacentrocomercial.dyndns.org/api/dashboard/ingresos/anuales?year=${selectedYear}`;

    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const monthlyTotals = [
            'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
            'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
        ].map(mes => {
            const item = data.find(d => d.mes.toLowerCase() === mes);
            return item ? item.total : 0;
        });

        const totalSum = monthlyTotals.reduce((sum, value) => sum + value, 0);

        const totalSumElement = document.getElementById('totalSumCard');
        if (totalSumElement) {
            totalSumElement.textContent = `$${totalSum.toLocaleString('es-MX')}`;
        }

        const salesData = {
            xAxis: {
                type: 'category',
                data: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
            },
            yAxis: {
                type: 'value',
                axisLabel: {
                    formatter: '${value}'
                }
            },
            series: [{
                data: monthlyTotals,
                type: 'bar',
                itemStyle: {
                    color: function (params) {
                        const colors = ['#ff9e80', '#a3ffb0', '#a3b8ff', '#ff99d5', '#d8a3ff', '#a3fff9', '#fbff99', '#ffbf80', '#c5ff99', '#99c5ff', '#ff99bf', '#99ffd8'];
                        return colors[params.dataIndex];
                    }
                }
            }],
            tooltip: {
                trigger: 'axis',
                formatter: "<b>{b0}:</b> ${c0}"
            }
        };

        const salesChartElement = document.getElementById('salesChart');
        if (salesChartElement) {
            const salesChart = echarts.init(salesChartElement, null, { renderer: 'svg' });
            salesChart.setOption(salesData);
            new ResizeObserver(() => salesChart.resize()).observe(salesChartElement);
        }
    })
    .catch(error => {
        console.error('Error al cargar gráfica de ingresos:', error);
    });
}

// ========== GRÁFICA DE EGRESOS ANUALES ==========
function cargarGraficaEgresos() {
    const token = localStorage.getItem('token');
    const url = `https://laperlacentrocomercial.dyndns.org/api/dashboard/egresos/anuales?year=${selectedYear}`;

    fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const egresosData = [
            "enero", "febrero", "marzo", "abril", "mayo", "junio",
            "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
        ].map(mes => {
            const item = data.find(d => d.mes.toLowerCase() === mes);
            return item ? item.total : 0;
        });

        const totalEgresos = egresosData.reduce((sum, value) => sum + value, 0);

        const totalGraficaEgresosElement = document.getElementById('totalGraficaEgresos');
        if (totalGraficaEgresosElement) {
            totalGraficaEgresosElement.textContent = `$${totalEgresos.toLocaleString('es-MX')}`;
        }

        const egresosChartElement = document.getElementById("egresosAnual");
        if (egresosChartElement) {
            const egresosChart = echarts.init(egresosChartElement);

            const egresosOption = {
                tooltip: { trigger: "axis" },
                xAxis: {
                    type: "category",
                    data: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
                },
                yAxis: { type: "value" },
                series: [{
                    name: "Egresos",
                    type: "bar",
                    data: egresosData,
                    itemStyle: { color: "#ff5733" }
                }]
            };

            egresosChart.setOption(egresosOption);
        }
    })
    .catch(error => {
        console.error('Error al cargar egresos:', error);
    });
}

// ========== ESTADO DE RESULTADOS ==========
function cargarEstadoResultados() {
    const token = localStorage.getItem('token');
    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const ingresosUrl = `https://laperlacentrocomercial.dyndns.org/api/dashboard/ingresos/anuales?year=${selectedYear}`;
    const egresosUrl = `https://laperlacentrocomercial.dyndns.org/api/dashboard/egresos/anuales?year=${selectedYear}`;

    const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    Promise.all([
        fetch(egresosUrl, { headers }).then(res => res.json()),
        fetch(ingresosUrl, { headers }).then(res => res.json())
    ])
    .then(([egresosData, ingresosData]) => {
        const egresosTotales = meses.map(mes => {
            const item = egresosData.find(d => d.mes.toLowerCase() === mes);
            return item ? item.total : 0;
        });

        const ingresosTotales = meses.map(mes => {
            const item = ingresosData.find(d => d.mes.toLowerCase() === mes);
            return item ? item.total : 0;
        });

        const totalIngresos = ingresosTotales.reduce((acc, val) => acc + val, 0);
        const totalEgresos = egresosTotales.reduce((acc, val) => acc + val, 0);
        const resultado = totalIngresos - totalEgresos;

        document.getElementById('totalIngreso').textContent = `Ingresos: $${totalIngresos.toLocaleString()}`;
        document.getElementById('totalEgreso').textContent = `Egresos: $${totalEgresos.toLocaleString()}`;
        document.getElementById('total').textContent = `Resultado: $${resultado.toLocaleString()}`;

        const chartElement = document.getElementById("estadoResultados");
        if (chartElement) {
            const chart = echarts.init(chartElement);
            const options = {
                tooltip: { trigger: "axis" },
                legend: { data: ['Ingresos', 'Egresos'], left: 'left' },
                xAxis: {
                    type: 'category',
                    data: meses.map(m => m.charAt(0).toUpperCase() + m.slice(1))
                },
                yAxis: { type: 'value' },
                series: [
                    {
                        name: 'Egresos',
                        type: 'line',
                        data: egresosTotales,
                        smooth: true,
                        color: '#ff5733'
                    },
                    {
                        name: 'Ingresos',
                        type: 'line',
                        data: ingresosTotales,
                        smooth: true,
                        color: '#33ff57'
                    }
                ]
            };

            chart.setOption(options);
        }
    })
    .catch(error => {
        console.error("Error al cargar estado de resultados:", error);
    });
}

    document.getElementById("logoutBtn").addEventListener("click", function () {
        localStorage.clear();  // Limpia todo el localStorage
        sessionStorage.clear(); // Limpia todo el sessionStorage
        window.location.href = "../modulo-login/page-login.html"; // Redirige al login
    });


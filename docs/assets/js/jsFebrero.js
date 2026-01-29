// ============================================
// MODAL BANNER FEBRERO
// ============================================

// Control de visualización del banner
const MOSTRAR_BANNER = true; // Cambiar a false para desactivar
const MOSTRAR_UNA_VEZ_POR_SESION = false; // true = solo una vez por sesión

// Función para mostrar el banner
function mostrarBannerFebrero() {
    const modal = document.getElementById('modalBannerFebrero');
    const bannerDesktop = document.getElementById('bannerDesktop');
    const bannerMobile = document.getElementById('bannerMobile');
    
    if (MOSTRAR_UNA_VEZ_POR_SESION && sessionStorage.getItem('bannerFebrero_mostrado')) {
        return;
    }
    
    const esMobile = window.innerWidth <= 768;
    
    if (esMobile) {
        bannerDesktop.style.display = 'none';
        bannerMobile.style.display = 'block';
    } else {
        bannerDesktop.style.display = 'block';
        bannerMobile.style.display = 'none';
    }
    
    // Mostrar modal con un pequeño delay para mejor UX
    setTimeout(() => {
        modal.classList.add('active');
        // Marcar como mostrado en esta sesión
        if (MOSTRAR_UNA_VEZ_POR_SESION) {
            sessionStorage.setItem('bannerFebrero_mostrado', 'true');
        }
    }, 1000); // Espera 1 segundo después de cargar la página
}

// Función para cerrar el banner
function cerrarBannerFebrero() {
    const modal = document.getElementById('modalBannerFebrero');
    modal.classList.remove('active');
}

// Cerrar al hacer clic fuera del contenido
document.getElementById('modalBannerFebrero')?.addEventListener('click', function(e) {
    if (e.target === this) {
        cerrarBannerFebrero();
    }
});

// Cerrar con la tecla ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        cerrarBannerFebrero();
    }
});

// Inicializar banner cuando cargue la página
window.addEventListener('load', function() {
    if (MOSTRAR_BANNER) {
        mostrarBannerFebrero();
    }
});

// Ajustar imagen en cambio de orientación o resize
window.addEventListener('resize', function() {
    const modal = document.getElementById('modalBannerFebrero');
    if (modal.classList.contains('active')) {
        const bannerDesktop = document.getElementById('bannerDesktop');
        const bannerMobile = document.getElementById('bannerMobile');
        const esMobile = window.innerWidth <= 768;
        
        if (esMobile) {
            bannerDesktop.style.display = 'none';
            bannerMobile.style.display = 'block';
        } else {
            bannerDesktop.style.display = 'block';
            bannerMobile.style.display = 'none';
        }
    }
});
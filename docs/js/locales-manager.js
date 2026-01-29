/**
 * Módulo de Carga Dinámica de Locales - Centro Comercial La Perla
 * Optimización: Lazy Loading de imágenes con Intersection Observer
 * Autor: Sistema Optimizado
 * Fecha: 2025
 */

class LocalesManager {
  constructor() {
    this.locales = [];
    this.container = null;
    this.observer = null;
    this.swiper = null;
    this.imageCache = new Set();
    this.loadingQueue = [];
    this.isLoading = false;
  }

  /**
   * Inicializa el gestor de locales
   */
  async init() {
    try {
      // Cargar datos desde el JSON
      await this.loadData();
      
      // Obtener el contenedor
      this.container = document.querySelector('.swiper-wrapper');
      
      if (!this.container) {
        return;
      }

      // Configurar Intersection Observer para lazy loading
      this.setupIntersectionObserver();
      
      // Renderizar las tarjetas (sin imágenes aún)
      this.renderCards();
      
      // Inicializar Swiper
      this.initSwiper();
      
    } catch (error) {
    }
  }

  /**
   * Carga los datos desde el archivo JSON
   */
  async loadData() {
    try {
      const response = await fetch('/FronEnd-Perla/docs/utils/locales.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      this.locales = data.locales;
      
      console.log(`✓ ${this.locales.length} locales cargados`);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      throw error;
    }
  }

  /**
   * Configura el Intersection Observer para lazy loading
   */
  setupIntersectionObserver() {
    // Opciones del observer
    const options = {
      root: null, // usa el viewport
      rootMargin: '50px', // pre-carga 50px antes de que sea visible
      threshold: 0.01 // se activa cuando el 1% es visible
    };

    // Callback cuando un elemento es visible
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const card = entry.target;
          this.loadCardImage(card);
          this.observer.unobserve(card); // deja de observar una vez cargado
        }
      });
    }, options);
  }

  /**
   * Carga la imagen de una tarjeta específica
   */
  loadCardImage(card) {
    const imageUrl = card.dataset.image;
    
    if (!imageUrl || this.imageCache.has(imageUrl)) {
      return;
    }

    // Crear una imagen temporal para pre-cargar
    const img = new Image();
    
    img.onload = () => {
      // Aplicar la imagen como background
      card.style.backgroundImage = `url('${imageUrl}')`;
      card.classList.add('image-loaded');
      this.imageCache.add(imageUrl);
      
      // Remover el placeholder
      const placeholder = card.querySelector('.image-placeholder');
      if (placeholder) {
        placeholder.style.opacity = '0';
        setTimeout(() => placeholder.remove(), 300);
      }
    };
    
    img.onerror = () => {
      console.warn(`No se pudo cargar la imagen: ${imageUrl}`);
      card.classList.add('image-error');
    };
    
    // Iniciar la carga
    img.src = imageUrl;
  }

  /**
   * Renderiza las tarjetas de locales
   */
  renderCards() {
    // Limpiar contenedor
    this.container.innerHTML = '';
    
    // Crear fragmento para mejor rendimiento
    const fragment = document.createDocumentFragment();
    
    this.locales.forEach((local, index) => {
      const slide = this.createCardElement(local, index);
      fragment.appendChild(slide);
    });
    
    // Agregar todo de una vez al DOM
    this.container.appendChild(fragment);
    
    // Observar todas las tarjetas para lazy loading
    const cards = this.container.querySelectorAll('.card');
    cards.forEach(card => {
      this.observer.observe(card);
    });
    
    console.log(`✓ ${this.locales.length} tarjetas renderizadas`);
  }

  createCardElement(local, index) {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.image = local.imagen;
    card.dataset.localId = local.id;
    card.onclick = () => this.mostrarModal(card);
    const placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder';
    card.appendChild(placeholder);
    const priceDiv = document.createElement('div');
    priceDiv.className = 'price';
    priceDiv.innerHTML = `<h6>${local.numero}</h6>`;
    card.appendChild(priceDiv);
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'info';
    
    const title = document.createElement('h1');
    title.className = 'title';
    title.textContent = local.nombre;
    infoDiv.appendChild(title);
    
    const description = document.createElement('p');
    description.className = 'description';
    description.innerHTML = this.formatDescription(local.descripcion);
    infoDiv.appendChild(description);
    
    const mainButton = this.createSocialButton(local);
    infoDiv.appendChild(mainButton);
    
    card.appendChild(infoDiv);
    slide.appendChild(card);
    
    return slide;
  }


  formatDescription(description) {
    if (description === 'Centro Comercial La Perla') {
      return '<br><br>' + description;
    }
    return description;
  }

  createSocialButton(local) {
    const mainButton = document.createElement('div');
    mainButton.className = 'main-text-button';
    
    const scrollSection = document.createElement('div');
    scrollSection.className = 'scroll-to-section';
    
    const btnContainer = document.createElement('div');
    btnContainer.className = 'btn-redes-container';
  
    const btnRedes = document.createElement('a');
    btnRedes.className = 'btn-redes';
    
    const btnText = document.createElement('span');
    btnText.className = 'btn-text';
    
    if (local.disponible) {
      btnText.textContent = '🌐 Visítanos';
    } else {
      btnText.innerHTML = local.descripcion.length < 50 ? '<br><br>🌐 Visítanos proximamente' : '🌐 Visítanos proximamente';
    }
    
    btnRedes.appendChild(btnText);
    btnContainer.appendChild(btnRedes);
    
    const socialIcons = this.createSocialIcons(local.redesSociales);
    btnContainer.appendChild(socialIcons);
    
    scrollSection.appendChild(btnContainer);
    mainButton.appendChild(scrollSection);
    
    return mainButton;
  }

  createSocialIcons(redes) {
    const socialDiv = document.createElement('div');
    socialDiv.className = 'social-icons';
    
    if (redes.facebook) {
      const fbLink = document.createElement('a');
      fbLink.href = redes.facebook;
      fbLink.target = '_blank';
      fbLink.innerHTML = '<i class="fab fa-facebook-f"></i>';
      socialDiv.appendChild(fbLink);
    } else {
      const fbLink = document.createElement('a');
      fbLink.target = '_blank';
      fbLink.innerHTML = '<i class="fab fa-facebook-f"></i>';
      socialDiv.appendChild(fbLink);
    }
    
    if (redes.instagram) {
      const igLink = document.createElement('a');
      igLink.href = redes.instagram;
      igLink.target = '_blank';
      igLink.innerHTML = '<i class="fab fa-instagram"></i>';
      socialDiv.appendChild(igLink);
    } else {
      const igLink = document.createElement('a');
      igLink.target = '_blank';
      igLink.innerHTML = '<i class="fab fa-instagram"></i>';
      socialDiv.appendChild(igLink);
    }
  
    if (redes.uber) {
      const uberLink = document.createElement('a');
      uberLink.href = redes.uber;
      uberLink.target = '_blank';
      uberLink.title = 'Uber Eats';
      uberLink.innerHTML = '<i class="fab fa-uber"></i>';
      socialDiv.appendChild(uberLink);
    }
    
    return socialDiv;
  }

  mostrarModal(card) {
    const imageUrl = card.dataset.image;
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('imagenModal');
    
    if (modal && modalContent) {
      if (card.style.backgroundImage) {
        modalContent.style.backgroundImage = card.style.backgroundImage;
      } else {
        modalContent.style.backgroundImage = `url('${imageUrl}')`;
      }
      
      modal.style.display = 'flex';
    }
  }


  initSwiper() {
    requestAnimationFrame(() => {
      this.swiper = new Swiper('.swiper', {
        loop: true,
        slidesPerView: 1,
        spaceBetween: 20,
        pagination: {
          el: '.swiper-pagination',
          clickable: true
        },
        navigation: {
          nextEl: '.swiper-button-next',
          prevEl: '.swiper-button-prev'
        },
        autoplay: {
          delay: 9000,
          disableOnInteraction: false
        },
        breakpoints: {
          850: {
            slidesPerView: 3
          }
        },
        lazy: {
          loadPrevNext: true,
          loadPrevNextAmount: 2
        }
      });
      
      console.log('✓ Swiper inicializado');
    });
  }

  filterLocales(categoria) {
    console.log('Filtrar por:', categoria);
  }

  searchLocales(query) {
    console.log('Buscar:', query);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const manager = new LocalesManager();
  manager.init();
  window.localesManager = manager;
});

function cerrarModal(event) {
  const modal = document.getElementById('modal');
  if (modal && (event?.target === modal || !event)) {
    modal.style.display = 'none';
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocalesManager;
}
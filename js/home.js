// ===================================
// CARRUSEL DEL HERO
// ===================================
var swiper = new Swiper(".mySwiper", {
        loop: true,
        autoplay: {
            delay: 3500, // cambia de slide cada 3.5 segundos
            disableOnInteraction: false
        },
        navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
        },
    });

// ===================================
// DESPLAZAMIENTO SUAVE
// ===================================

// Añade desplazamiento suave a todos los enlaces que comienzan con #
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault(); // Evita el comportamiento predeterminado del enlace
        const target = document.querySelector(this.getAttribute('href')); // Obtiene el elemento objetivo
        if (target) {
            // Desplaza suavemente hasta el elemento objetivo
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===================================
// FUNCIONALIDAD DE PREGUNTAS FRECUENTES (FAQ)
// ===================================
function toggleFAQ(element) {
    const faqItem = element.parentElement; // Elemento padre de la pregunta FAQ
    const answer = faqItem.querySelector('.faq-answer'); // Respuesta de la pregunta FAQ
    const icon = faqItem.querySelector('.faq-icon'); // Icono de la pregunta FAQ

    // Cierra todas las demás preguntas FAQ
    document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== faqItem) {
            item.classList.remove('active'); // Elimina clase activa
            item.querySelector('.faq-answer').classList.remove('active'); // Oculta la respuesta
        }
    });

    // Alterna la pregunta FAQ actual
    faqItem.classList.toggle('active'); // Alterna clase activa
    answer.classList.toggle('active'); // Alterna visibilidad de la respuesta
}

// ===================================
// MANEJO DE FORMULARIOS
// ===================================
function handleSubmit(event) {
    event.preventDefault(); // Evita el envío predeterminado del formulario

    // Obtiene los datos del formulario
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);

    // Validación simple
    if (!data.fullName || !data.email || !data.phone || !data.company || !data.message) {
        showNotification('Please fill in all required fields.', 'error'); // Muestra notificación de error
        return;
    }

    // Validación de correo electrónico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
        showNotification('Please enter a valid email address.', 'error'); // Muestra notificación de error
        return;
    }

    // Validación de teléfono
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
        showNotification('Please enter a valid phone number.', 'error'); // Muestra notificación de error
        return;
    }

    // Simula el envío del formulario
    const submitButton = event.target.querySelector('.submit-button');
    const originalText = submitButton.innerHTML;

    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...'; // Cambia el texto del botón
    submitButton.disabled = true; // Desactiva el botón

    setTimeout(() => {
        submitButton.innerHTML = originalText; // Restaura el texto del botón
        submitButton.disabled = false; // Reactiva el botón
        showNotification('Thank you for your message! We will contact you as soon as possible.', 'success'); // Muestra notificación de éxito
        event.target.reset(); // Restaura el formulario
    }, 2000);
}

// ===================================
// SISTEMA DE NOTIFICACIONES
// ===================================
function showNotification(message, type = 'info') {
    // Elimina notificaciones existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    // Crea elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Añade estilos
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;

    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 1rem;
    `;

    notification.querySelector('.notification-close').style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 0.2rem;
        border-radius: 50%;
        transition: background 0.3s ease;
    `;

    // Añade a la página
    document.body.appendChild(notification);

    // Anima entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Elimina automáticamente después de 5 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ===================================
// ANIMACIONES DE DESPLAZAMIENTO
// ===================================
function animateOnScroll() {
    const elements = document.querySelectorAll('.scroll-animate'); // Elementos con animación de desplazamiento

    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;

        if (elementTop < window.innerHeight - elementVisible) {
            element.classList.add('active'); // Añade clase activa para animar
        }
    });
}

// ===================================
// EFECTOS PARALLAX
// ===================================
function handleParallax() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero'); // Sección hero
    const particles = document.querySelectorAll('.particle'); // Partículas en la sección hero
    const floatingShapes = document.querySelectorAll('.floating-shape'); // Formas flotantes en el fondo

    // Efecto parallax en la sección hero
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.5}px)`;
    }

    // Efecto parallax en partículas
    particles.forEach((particle, index) => {
        const speed = 0.2 + (index * 0.1);
        particle.style.transform = `translateY(${scrolled * speed}px)`;
    });

    // Efecto parallax en formas flotantes
    floatingShapes.forEach((shape, index) => {
        const speed = 0.1 + (index * 0.05);
        shape.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.1}deg)`;
    });
}

// ===================================
// INTERACCIONES DE TARJETAS 3D
// ===================================
function init3DCards() {
    // Tarjetas con efecto 3D, flotantes y de precios
    const cards = document.querySelectorAll('.card-hover-3d, .floating-card, .pricing-card');

    cards.forEach(card => {
        // Efecto de movimiento del ratón sobre la tarjeta
        card.addEventListener('mousemove', function(e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });

        // Restaura la tarjeta cuando el ratón sale
        card.addEventListener('mouseleave', function() {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
}

// ===================================
// ANIMACIÓN DEL DASHBOARD FLOTANTE
// ===================================
function animateFloatingDashboard() {
    const dashboardCards = document.querySelectorAll('.dashboard-card'); // Tarjetas del dashboard flotante

    dashboardCards.forEach((card, index) => {
        const delay = index * 500;

        setInterval(() => {
            card.style.transform += ` translateZ(${Math.sin(Date.now() * 0.001 + delay) * 10}px)`;
        }, 50);
    });
}

// ===================================
// INTERACCIONES DE TARJETAS DE PRECIOS
// ===================================
function initPricingCards() {
    const pricingCards = document.querySelectorAll('.pricing-card'); // Tarjetas de precios

    pricingCards.forEach(card => {
        const button = card.querySelector('.plan-button'); // Botón de compra en la tarjeta de precios

        button.addEventListener('click', function(e) {
            e.preventDefault();

            // Crea efecto de onda
            const ripple = button.querySelector('.button-ripple');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';

            // Muestra notificación
            const planName = card.querySelector('h3').textContent;
            showNotification(`You selected the ${planName}! Redirecting to checkout...`, 'success');

            // Simula redirección
            setTimeout(() => {
                showNotification('Checkout feature coming soon!', 'info');
            }, 2000);
        });
    });
}

// ===================================
// ANIMACIONES DE CARGA
// ===================================
function initLoadingAnimations() {
    // Añade clase de carga al cuerpo del documento
    document.body.classList.add('loading');

    // Elimina clase de carga después de que la página se cargue
    window.addEventListener('load', () => {
        setTimeout(() => {
            document.body.classList.remove('loading');
            document.body.style.opacity = '1';
        }, 500);
    });
}

// ===================================
// OBSERVADOR DE INTERSECCIÓN PARA ANIMACIONES
// ===================================
function initIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');

                // Añade animación escalonada para elementos de la cuadrícula
                if (entry.target.classList.contains('features-grid') ||
                    entry.target.classList.contains('help-grid') ||
                    entry.target.classList.contains('pricing-grid')) {

                    const items = entry.target.children;
                    Array.from(items).forEach((item, index) => {
                        setTimeout(() => {
                            item.style.animation = `fadeInUp 0.6s ease-out forwards`;
                        }, index * 200);
                    });
                }
            }
        });
    }, observerOptions);

    // Observa todas las secciones
    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section);
    });

    // Observa contenedores de cuadrícula
    document.querySelectorAll('.features-grid, .help-grid, .pricing-grid').forEach(grid => {
        observer.observe(grid);
    });
}

// ===================================
// EFECTOS DEL CURSOR
// ===================================
function initCursorEffects() {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, var(--golden-yellow), transparent);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transition: transform 0.1s ease;
        opacity: 0;
    `;
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX - 10 + 'px';
        cursor.style.top = e.clientY - 10 + 'px';
        cursor.style.opacity = '0.6';
    });

    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = '0.6';
    });

    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
    });

    // Escala el cursor al pasar sobre elementos interactivos
    const interactiveElements = document.querySelectorAll('a, button, .card-hover-3d, .floating-card');

    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            cursor.style.transform = 'scale(2)';
        });

        element.addEventListener('mouseleave', () => {
            cursor.style.transform = 'scale(1)';
        });
    });
}

// ===================================
// ESCUCHADORES DE EVENTOS
// ===================================
window.addEventListener('scroll', () => {
    animateOnScroll(); // Anima elementos al desplazarse
    handleParallax(); // Aplica efectos parallax al desplazarse
});

window.addEventListener('load', () => {
    animateOnScroll(); // Anima elementos al cargar
    init3DCards(); // Inicializa tarjetas 3D
    animateFloatingDashboard(); // Anima dashboard flotante
    initPricingCards(); // Inicializa tarjetas de precios
    initIntersectionObserver(); // Inicializa observador de intersección
    initCursorEffects(); // Inicializa efectos del cursor
});

// Inicializa animaciones de carga
initLoadingAnimations();

// ===================================
// OPTIMIZACIÓN DE RENDIMIENTO
// ===================================
let ticking = false;

function requestTick() {
    if (!ticking) {
        requestAnimationFrame(() => {
            handleParallax(); // Aplica efectos parallax
            ticking = false;
        });
        ticking = true;
    }
}

window.addEventListener('scroll', requestTick);

// ===================================
// MEJORAS DE ACCESIBILIDAD
// ===================================
document.addEventListener('keydown', function(e) {
    // Tecla ESC cierra el menú móvil
    if (e.key === 'Escape') {
        const navLinks = document.getElementById('navLinks');
        const mobileMenu = document.getElementById('mobileMenu');
        navLinks.classList.remove('active');
        mobileMenu.classList.remove('active');
    }

    // Tecla Enter en elementos de preguntas frecuentes
    if (e.key === 'Enter' && e.target.classList.contains('faq-question')) {
        toggleFAQ(e.target);
    }
});

// Añade estilos de enfoque para navegación con teclado
const style = document.createElement('style');
style.textContent = `
    .nav-link:focus,
    .cta-primary:focus,
    .cta-secondary:focus,
    .plan-button:focus,
    .submit-button:focus {
        outline: 3px solid var(--golden-yellow);
        outline-offset: 2px;
    }

    .faq-question:focus {
        outline: 2px solid var(--golden-yellow);
        outline-offset: 2px;
    }
`;
document.head.appendChild(style);

console.log('🚀 Página de aterrizaje de FoodWIZZ cargada con éxito!');

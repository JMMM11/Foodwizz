// =====================================================
// HOME - Scripts de la página principal (index.html)
// =====================================================

// ===================================
// CARRUSEL DEL HERO (Swiper)
// ===================================
new Swiper(".mySwiper", {
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
// Enlaces que apuntan a una sección de la misma página (href="#...")
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ===================================
// CURSOR PERSONALIZADO
// ===================================
// Punto naranja que sigue al ratón; solo en dispositivos con ratón
function initCursorEffects() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

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

    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
    });

    // Se agranda sobre enlaces y botones
    document.querySelectorAll('a, button').forEach(element => {
        element.addEventListener('mouseenter', () => cursor.style.transform = 'scale(2)');
        element.addEventListener('mouseleave', () => cursor.style.transform = 'scale(1)');
    });
}

window.addEventListener('load', initCursorEffects);

// ===================================
// ACCESIBILIDAD
// ===================================
// Escape cierra el menú móvil del header
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.getElementById('navbar')?.classList.remove('active');
    }
});

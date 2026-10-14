// Carga el header
fetch('/Pages/Aditional/tarjeta.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('pricesplans-placeholder').innerHTML = data;
    });

function flipCard(card) {
    // Si la tarjeta ya está volteada, la devolvemos al estado original
    if (card.classList.contains('flipped')) {
        card.classList.remove('flipped');
    } else {
        // Si no está volteada, la volteamos
        card.classList.add('flipped');
    }
    
    // Opcional: Agregar un efecto de sonido o vibración
    if (navigator.vibrate) {
        navigator.vibrate(50); // Vibración suave en dispositivos móviles
    }
}

// Función para resetear todas las tarjetas
function resetCards() {
    const allCards = document.querySelectorAll('.card');
    allCards.forEach(card => card.classList.remove('flipped'));
}

// Event listener para resetear las tarjetas al hacer clic fuera de ellas
document.addEventListener('click', function(event) {
    const cardsContainer = document.querySelector('.cards-container');
    const clickedCard = event.target.closest('.card');
    
    // Solo resetear si se hace clic fuera de las tarjetas
    if (cardsContainer && !cardsContainer.contains(event.target)) {
        resetCards();
    }
});

// Efectos adicionales para mejorar la experiencia
document.addEventListener('DOMContentLoaded', function() {
    // Animación de entrada para las tarjetas
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
    
    // Efecto de hover mejorado
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('flipped')) {
                this.style.transform = 'scale(1.05)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (!this.classList.contains('flipped')) {
                this.style.transform = 'scale(1)';
            }
        });
    });
});

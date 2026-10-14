// =====================================================
// PLANES DE PRECIOS - Tarjetas que se voltean (Home)
// =====================================================

// Carga las tarjetas de planes (Pages/Aditional/tarjeta.html) en el Home
fetch('/Pages/Aditional/tarjeta.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('pricesplans-placeholder').innerHTML = data;
    });

// Voltea una tarjeta (se llama desde onclick en tarjeta.html)
function flipCard(card) {
    card.classList.toggle('flipped');

    // Vibración suave en celulares que la soportan
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Devuelve todas las tarjetas a su cara frontal
function resetCards() {
    document.querySelectorAll('.pricing-section .card').forEach(card => card.classList.remove('flipped'));
}

// Clic fuera de las tarjetas: las regresa al frente
document.addEventListener('click', (event) => {
    const cardsContainer = document.querySelector('.cards-container');
    if (cardsContainer && !cardsContainer.contains(event.target)) {
        resetCards();
    }
});

// Carga el header
fetch('/Pages/header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header-placeholder').innerHTML = data;

        // Ahora sí puedes acceder a los elementos del header
        const menuToggle = document.getElementById("menu-toggle");
        const navbar = document.getElementById("navbar");

        if (menuToggle && navbar) {
            menuToggle.addEventListener("click", () => {
                navbar.classList.toggle("active");
                menuToggle.querySelector("i").classList.toggle("fa-bars");
                menuToggle.querySelector("i").classList.toggle("fa-times");
            });
        }
    });
// Carga el footer
fetch('/Pages/footer.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('footer-placeholder').innerHTML = data;
    });

// Load chatbot
fetch('/Pages/chatbot.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('chatbot-container').innerHTML = html;
            // Si tu JS necesita inicialización
            if (typeof initChatbot === 'function') {
                initChatbot();
            }
        });
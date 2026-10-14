// Show banner only if no cookie preference is set
if (document.cookie.indexOf("cookieAccepted=") === -1) {
    fetch('/Pages/Policy/cookies.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('cookie-placeholder').innerHTML = data;

            // Wait for the DOM to update
            setTimeout(() => {
                const acceptBtn = document.querySelector('#cookieBanner .accept');
                if (acceptBtn) {
                    acceptBtn.addEventListener('click', function() {
                        setCookiePreference('aceptar');
                    });
                }

                // Evento para mostrar el modal de preferencias
                const prefBtn = document.querySelector('#cookieBanner .preferences');
                const modal = document.getElementById('cookieModal');
                if (prefBtn && modal) {
                    prefBtn.addEventListener('click', function() {
                        modal.style.display = 'block';
                    });
                }

                // Evento para cerrar el modal (puedes agregar un botón con clase .close-modal en tu modal)
                const closeBtn = document.querySelector('#cookieModal .close-modal');
                if (closeBtn && modal) {
                    closeBtn.addEventListener('click', function() {
                        modal.style.display = 'none';
                    });
                }
            }, 100);
        });
}

// Define the function to set cookie preference
function setCookiePreference(option) {
    document.cookie = "cookieAccepted=" + option + "; path=/; max-age=31536000"; 
    var banner = document.getElementById("cookieBanner");
    if (banner) banner.style.display = "none";
}

function openModal() {
    var modal = document.getElementById("cookieModal");
    if (modal) modal.style.display = "block";
}

function closeModal() {
    var modal = document.getElementById("cookieModal");
    if (modal) modal.style.display = "none";
}

function savePreferences() {
    const form = document.getElementById("cookieForm");
    if (!form) return;
    let prefs = {
        necesarias: true,
        analiticas: form.analiticas.checked,
        marketing: form.marketing.checked
    };
    document.cookie = "cookieAccepted=" + JSON.stringify(prefs) + "; path=/; max-age=31536000";
    closeModal();
    var banner = document.getElementById("cookieBanner");
    if (banner) banner.style.display = "none";
}

function getCookie(name) {
    let cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i].trim();
        if (cookie.indexOf(name + "=") === 0) {
            return cookie.substring(name.length + 1);
        }
    }
    return null;
}

// Ocultar banner si ya hay preferencia
window.onload = function() {
    if (getCookie("cookieAccepted")) {
        var banner = document.getElementById("cookieBanner");
        if (banner) banner.style.display = "none";
    }
}
const container = document.getElementById('container');

// Overlay buttons
const signUpOverlayBtn = document.getElementById('signUpOverlay');
const signInOverlayBtn = document.getElementById('signInOverlay');

// Text links
const signUpLink = document.getElementById('signUpLink');
const signInLink = document.getElementById('signInLink');

// Forms
const signUpForm = document.querySelector('.sign-up-container form');
const signInForm = document.querySelector('.sign-in-container form');

// Overlay functions (desktop and tablet)
const toggleToSignUp = (e) => {
    e.preventDefault();
    if (window.innerWidth > 768) {
        container.classList.add("right-panel-active");
    } else {
        showForm("signup");
    }
};

const toggleToSignIn = (e) => {
    e.preventDefault();
    if (window.innerWidth > 768) {
        container.classList.remove("right-panel-active");
    } else {
        showForm("signin");
    }
};

// Listeners for overlay buttons
if (signUpOverlayBtn && signInOverlayBtn) {
    signUpOverlayBtn.addEventListener('click', toggleToSignUp);
    signInOverlayBtn.addEventListener('click', toggleToSignIn);
}

// Listeners for text links
signUpLink.addEventListener('click', toggleToSignUp);
signInLink.addEventListener('click', toggleToSignIn);

// Show/hide password functionality
document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
        const input = toggle.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);

        // Change icon
        if (type === 'password') {
            toggle.classList.remove('ri-eye-line');
            toggle.classList.add('ri-eye-off-line');
        } else {
            toggle.classList.remove('ri-eye-off-line');
            toggle.classList.add('ri-eye-line');
        }
    });
});

// =======================
//  Mobile responsive
// =======================

// Function to toggle forms on mobile
function showForm(formToShow) {
    if (window.innerWidth <= 768) {
        const signInContainer = document.querySelector(".sign-in-container");
        const signUpContainer = document.querySelector(".sign-up-container");

        if (formToShow === "signin") {
            signInContainer.classList.remove("hidden");
            signUpContainer.classList.add("hidden");
        } else {
            signUpContainer.classList.remove("hidden");
            signInContainer.classList.add("hidden");
        }
    }
}

// On load, show only Sign In on mobile
window.addEventListener("load", () => {
    if (window.innerWidth <= 768) {
        showForm("signin");
    }
});

// If screen size changes
window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
        // Restore normal overlay
        const signInContainer = document.querySelector(".sign-in-container");
        const signUpContainer = document.querySelector(".sign-up-container");
        signInContainer.classList.remove("hidden");
        signUpContainer.classList.remove("hidden");
    } else {
        showForm("signin");
    }
});

//=================================================================
// ================Import auth from connection.js================
//=================================================================

import { auth, db } from "./Authentication/conection.js";
import {
    GoogleAuthProvider, 
    GithubAuthProvider, 
    OAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    fetchSignInMethodsForEmail,
    updateProfile
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ================== EMAIL/PASSWORD LOGIN ==================

// --- Sign Up ---
signUpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const businessName = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    try {
        // Create account in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update user profile with business name
        await updateProfile(user, {
            displayName: businessName
        });

        // Save to Firestore
        await setDoc(doc(db, "users", user.uid), {
            businessName: businessName,
            email: email,
            createdAt: serverTimestamp(),
            authProvider: "email"
        });

        console.log("User registered:", user.uid);
        alert("Account created successfully! 🚀");
        
        // Redirect to dashboard
        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Sign Up error:", error.message);
        alert("Sign Up failed: " + error.message);
    }
});

// --- Sign In ---
signInForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value.trim();

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Signed in:", userCredential.user.uid);

        alert("Welcome back!");

        // Redirect to dashboard
        window.location.href = "dashboard.html";

    } catch (error) {
        console.error("Sign In error:", error.message);
        let errorMessage = "Sign In failed: ";
        
        switch(error.code) {
            case 'auth/invalid-login-credentials':
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
                errorMessage += "No account found with this email.";
                break;
            case 'auth/wrong-password':
                errorMessage += "Incorrect password.";
                break;
            case 'auth/invalid-email':
                errorMessage += "Invalid email address.";
                break;
            case 'auth/user-disabled':
                errorMessage += "This account has been disabled.";
                break;
            default:
                errorMessage += error.message;
        }
        
        // If the issue is invalid credentials or no user, check sign-in methods to guide the user
        if (['auth/invalid-login-credentials','auth/invalid-credential','auth/user-not-found','auth/wrong-password'].includes(error.code)) {
            try {
                const methods = await fetchSignInMethodsForEmail(auth, email);
                if (methods && methods.length > 0) {
                    // Map Firebase methods to user-friendly provider names
                    const providerHints = methods.map(m => {
                        if (m === 'google.com') return 'Google';
                        if (m === 'github.com') return 'GitHub';
                        if (m === 'microsoft.com') return 'Microsoft';
                        if (m === 'password') return 'Email & Password';
                        return m;
                    }).join(', ');
                    alert(`${errorMessage}\nThis email is registered with: ${providerHints}. Please use the corresponding sign-in button or reset your password.`);
                } else {
                    alert(`${errorMessage}\nNo sign-in methods found. You may need to sign up first.`);
                }
            } catch (mError) {
                console.warn('Could not fetch sign-in methods:', mError);
                alert(errorMessage);
            }
        } else {
            alert(errorMessage);
        }
    }
});

// ================== SOCIAL LOGIN ==================

// Google
const googleBtn = document.getElementById("googleBtn");
if (googleBtn) {
    googleBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Save user data to Firestore
            await setDoc(doc(db, "users", user.uid), {
                businessName: user.displayName || "Google User",
                email: user.email,
                createdAt: serverTimestamp(),
                authProvider: "google",
                photoURL: user.photoURL
            }, { merge: true });
            
            console.log("Google user:", result.user);
            alert("Welcome with Google! 👋");
            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Google login error:", error.message);
            if (error.code !== 'auth/popup-closed-by-user') {
                alert("Google sign-in failed: " + error.message);
            }
        }
    });
}

// GitHub
const githubBtn = document.getElementById('githubBtn');
if (githubBtn) {
    githubBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const provider = new GithubAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Save user data to Firestore
            await setDoc(doc(db, "users", user.uid), {
                businessName: user.displayName || "GitHub User",
                email: user.email,
                createdAt: serverTimestamp(),
                authProvider: "github",
                photoURL: user.photoURL
            }, { merge: true });
            
            console.log("GitHub login:", user.uid, user.email);
            alert("Welcome with GitHub! 👋");
            window.location.href = "dashboard.html";
        } catch (error) {
            if (error.code === 'auth/popup-closed-by-user') {
                console.warn("User closed the sign-in popup.");
            } else {
                console.error("GitHub login error:", error);
                alert("GitHub sign-in failed: " + error.message);
            }
        }
    });
}

// Microsoft
const microsoftBtn = document.getElementById("microsoftBtn");
if (microsoftBtn) {
    microsoftBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const provider = new OAuthProvider("microsoft.com");
        
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            // Save user data to Firestore
            await setDoc(doc(db, "users", user.uid), {
                businessName: user.displayName || "Microsoft User",
                email: user.email,
                createdAt: serverTimestamp(),
                authProvider: "microsoft",
                photoURL: user.photoURL
            }, { merge: true });
            
            console.log("Microsoft user:", result.user);
            alert("Welcome with Microsoft! 👋");
            window.location.href = "dashboard.html";
        } catch (error) {
            console.error("Microsoft login error:", error.message);
            if (error.code !== 'auth/popup-closed-by-user') {
                alert("Microsoft sign-in failed: " + error.message);
            }
        }
    });
}
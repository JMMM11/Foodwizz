// firebase-config.js (o el nombre que prefieras)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCqmCYVi4l48PyXO3snoztB0AYFCEIUNHY",
    authDomain: "foodwizz-website.firebaseapp.com",
    projectId: "foodwizz-website",
    storageBucket: "foodwizz-website.appspot.com",
    messagingSenderId: "892148786578",
    appId: "1:892148786578:web:8123401168924855538d4b",
    measurementId: "G-CMLKTYCC14"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
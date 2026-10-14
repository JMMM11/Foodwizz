// js/user_profile.js
// Handles loading and updating the authenticated user's profile

import { auth, db } from "./Authentication/conection.js";
import {
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

function $(id) { return document.getElementById(id); }

function setStatus(msg, kind = "info") {
  const el = $("pf_status");
  if (!el) return;
  el.style.color = kind === "error" ? "#b00020" : kind === "success" ? "#0a7f3f" : "#666";
  el.textContent = msg || "";
}

async function ensureUserDoc(uid, defaults) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: defaults.name || null,
      email: defaults.email || null,
      business: defaults.business || null,
      phone: defaults.phone || null,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return (await getDoc(ref)).data();
  }
  return snap.data();
}

async function loadProfile(user) {
  try {
    const nameInput = $("pf_name");
    const emailInput = $("pf_email");
    const businessInput = $("pf_business");
    const phoneInput = $("pf_phone");
    const avatarPreview = $("avatarPreview");

    if (emailInput) emailInput.value = user.email || "";

    // Load Firestore user doc
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    let data;
    if (!snap.exists()) {
      data = await ensureUserDoc(user.uid, {
        name: user.displayName || "",
        email: user.email || "",
        business: "",
        phone: "",
      });
    } else {
      data = snap.data();
    }

    if (nameInput) nameInput.value = data.name || user.displayName || "";
    if (businessInput) businessInput.value = data.business || "";
    if (phoneInput) phoneInput.value = data.phone || "";

    // Set avatar preview: prefer Firestore photo_url, then Auth photoURL
    const photoUrl = data.photo_url || user.photoURL || "";
    if (avatarPreview && photoUrl) avatarPreview.src = photoUrl;
  } catch (e) {
    console.error("Error loading profile:", e);
    setStatus("Failed to load profile.", "error");
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', async () => {
      try {
        setStatus('Removing avatar…');
        const storage = getStorage();
        // Attempt to delete known extensions
        const exts = ['jpg','jpeg','png','webp'];
        for (const ext of exts) {
          try {
            const ref = storageRef(storage, `Perfil/${user.uid}.${ext}`);
            await deleteObject(ref);
          } catch {}
        }
        await updateProfile(user, { photoURL: null });
        const uref = doc(db, 'users', user.uid);
        await updateDoc(uref, { photo_url: null, updated_at: new Date() }).catch(async () => {
          await setDoc(uref, { email: user.email || null, photo_url: null, updated_at: new Date() }, { merge: true });
        });
        if (avatarPreview) avatarPreview.src = '../assets/logos/IconoNaranja.svg';
        setStatus('Avatar removed.', 'success');
      } catch (e) {
        console.error('Remove avatar error:', e);
        setStatus('Could not remove avatar.', 'error');
      }
    });
  }
}

async function saveProfile(user, evt) {
  evt?.preventDefault?.();
  const name = $("pf_name")?.value?.trim?.() || "";
  const business = $("pf_business")?.value?.trim?.() || "";
  const phone = $("pf_phone")?.value?.trim?.() || "";

  try {
    setStatus("Saving…");

    // Update Firebase Auth displayName (if changed)
    if (name && name !== (user.displayName || "")) {
      await updateProfile(user, { displayName: name });
    }

    // Update Firestore user doc
    const ref = doc(db, "users", user.uid);
    const payload = {
      name: name || null,
      business: business || null,
      phone: phone || null,
      updated_at: new Date(),
    };
    // Merge with existing
    await updateDoc(ref, payload).catch(async () => {
      await setDoc(ref, { email: user.email || null, ...payload }, { merge: true });
    });

    setStatus("Profile updated successfully.", "success");
  } catch (e) {
    console.error("Error saving profile:", e);
    setStatus("Could not save profile.", "error");
  }
}

function bindForm(user) {
  const form = $("profileForm");
  if (!form) return;
  form.addEventListener("submit", (e) => saveProfile(user, e));

  // Handle avatar upload
  const avatarInput = $("avatarFile");
  const avatarPreview = $("avatarPreview");
  const removeBtn = $("btnRemoveAvatar");
  if (avatarInput) {
    avatarInput.addEventListener("change", async () => {
      const file = avatarInput.files && avatarInput.files[0];
      if (!file) return;
      try {
        // Validate file
        const allowed = ["image/jpeg", "image/png", "image/webp"]; // add more if needed
        const maxBytes = 5 * 1024 * 1024; // 5 MB
        if (!allowed.includes(file.type)) {
          setStatus("Invalid image type. Please use JPG, PNG, or WEBP.", "error");
          return;
        }
        if (file.size > maxBytes) {
          setStatus("Image too large. Max 5 MB.", "error");
          return;
        }
        setStatus("Uploading avatar…");
        // Preview immediately
        if (avatarPreview) {
          const reader = new FileReader();
          reader.onload = (e) => { avatarPreview.src = e.target.result; };
          reader.readAsDataURL(file);
        }
        // Upload to Firebase Storage
        const storage = getStorage();
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        // Store in Firebase Storage folder aligned with your bucket: 'Perfil/'
        const path = `Perfil/${user.uid}.${ext}`;
        const ref = storageRef(storage, path);
        await uploadBytes(ref, file, { contentType: file.type || 'image/jpeg' });
        const url = await getDownloadURL(ref);

        // Update Auth and Firestore with new URL
        await updateProfile(user, { photoURL: url });
        const uref = doc(db, "users", user.uid);
        await updateDoc(uref, { photo_url: url, updated_at: new Date() }).catch(async () => {
          await setDoc(uref, { email: user.email || null, photo_url: url, updated_at: new Date() }, { merge: true });
        });

        setStatus("Avatar updated.", "success");
      } catch (e) {
        console.error("Avatar upload error:", e);
        setStatus("Could not upload avatar.", "error");
      }
    });
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "loginRegister.html";
    return;
  }
  await loadProfile(user);
  bindForm(user);
});

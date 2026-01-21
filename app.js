const firebaseConfig = {
    apiKey: "AIzaSyDOTYqq3Tab8jnluFL-eANtuXpgYA6qVgI",
    authDomain: "boread-6073f.firebaseapp.com",
    projectId: "boread-6073f",
    storageBucket: "boread-6073f.appspot.com",
    messagingSenderId: "798582355708",
    appId: "1:798582355708:web:17f63f520a923587720979"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const hobiler = [
    { name: "Korku", icon: "fa-ghost" },
    { name: "Bilim Kurgu", icon: "fa-rocket" },
    { name: "Macera", icon: "fa-map" },
    { name: "Psikoloji", icon: "fa-brain" },
    { name: "Yazılım", icon: "fa-code" },
    { name: "Felsefe", icon: "fa-lightbulb" },
    { name: "Tarih", icon: "fa-landmark" },
    { name: "Biyografi", icon: "fa-user-tie" },
    { name: "Romantik", icon: "fa-heart" },
    { name: "Fantastik", icon: "fa-dragon" },
    { name: "Polisiye", icon: "fa-magnifying-glass" },
    { name: "Şiir", icon: "fa-feather" }
];

let secilenHobiler = [];
let userValid = false;
let usernameCheckTimeout;

// Tab Switching
function switchTab(tab) {
    const tabs = document.querySelectorAll('.tab-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    tabs.forEach(t => t.classList.remove('active'));
    
    if (tab === 'login') {
        tabs[0].classList.add('active');
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        tabs[1].classList.add('active');
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
}

// Google Login
async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (e) {
        showNotification("Google girişi başarısız: " + e.message, "error");
    }
}

// Login
async function handleLogin() {
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-pass").value;
    
    if (!email || !pass) {
        showNotification("Lütfen tüm alanları doldurun", "warning");
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, pass);
        showNotification("Giriş başarılı!", "success");
    } catch(err) {
        showNotification("Giriş hatası: " + getErrorMessage(err.code), "error");
    }
}

// Register
async function handleRegister() {
    const email = document.getElementById("reg-email").value.trim();
    const pass = document.getElementById("reg-pass").value;
    const passConfirm = document.getElementById("reg-pass-confirm").value;
    
    if (!email || !pass || !passConfirm) {
        showNotification("Lütfen tüm alanları doldurun", "warning");
        return;
    }
    
    if (pass.length < 8) {
        showNotification("Şifre en az 8 karakter olmalı", "warning");
        return;
    }
    
    if (pass !== passConfirm) {
        showNotification("Şifreler eşleşmiyor", "warning");
        return;
    }
    
    try {
        await auth.createUserWithEmailAndPassword(email, pass);
        showNotification("Kayıt başarılı! Profilini tamamla", "success");
    } catch(err) {
        showNotification("Kayıt hatası: " + getErrorMessage(err.code), "error");
    }
}

// Auth State
auth.onAuthStateChanged(async user => {
    const scenes = [
        document.getElementById("auth-scene"),
        document.getElementById("onboarding-scene"),
        document.getElementById("main-scene")
    ];

    scenes.forEach(s => s.classList.add("hidden"));

    if (user) {
        const doc = await db.collection("users").doc(user.uid).get();
        if (!doc.exists) {
            scenes[1].classList.remove("hidden");
            initOnboarding(user);
        } else {
            scenes[2].classList.remove("hidden");
            loadMainScene(user, doc.data());
        }
    } else {
        scenes[0].classList.remove("hidden");
    }
});

// Init Onboarding
function initOnboarding(user) {
    const list = document.getElementById("hobi-list");
    list.innerHTML = "";
    
    // Avatar preview
    const avatarPreview = document.getElementById("avatar-preview");
    if (user.photoURL) {
        avatarPreview.innerHTML = `<img src="${user.photoURL}" alt="Avatar">`;
    }
    
    hobiler.forEach(h => {
        const tag = document.createElement("div");
        tag.className = "interest-tag";
        tag.innerHTML = `
            <i class="fas ${h.icon}"></i>
            <span>${h.name}</span>
            <div class="tag-glow"></div>
        `;
        tag.onclick = () => {
            tag.classList.toggle("selected");
            if(secilenHobiler.includes(h.name)) {
                secilenHobiler = secilenHobiler.filter(i => i !== h.name);
            } else {
                if (secilenHobiler.length < 6) {
                    secilenHobiler.push(h.name);
                } else {
                    showNotification("En fazla 6 ilgi alanı seçebilirsin", "warning");
                    return;
                }
            }
            updateSelectedCount();
            checkOnboardingReady();
        };
        list.appendChild(tag);
    });
}

// Username Check
async function checkUsername(name) {
    const status = document.getElementById("username-status");
    
    clearTimeout(usernameCheckTimeout);
    
    if(name.length < 3) {
        userValid = false;
        status.innerHTML = '<i class="fas fa-times"></i> En az 3 karakter';
        status.className = 'input-status error';
        checkOnboardingReady();
        return;
    }
    
    status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kontrol ediliyor...';
    status.className = 'input-status checking';
    
    usernameCheckTimeout = setTimeout(async () => {
        const snap = await db.collection("users").where("username", "==", name.toLowerCase()).get();
        userValid = snap.empty;
        
        if (userValid) {
            status.innerHTML = '<i class="fas fa-check"></i> Kullanılabilir';
            status.className = 'input-status success';
        } else {
            status.innerHTML = '<i class="fas fa-times"></i> Kullanımda';
            status.className = 'input-status error';
        }
        checkOnboardingReady();
    }, 500);
}

function updateSelectedCount() {
    document.getElementById("selected-count").textContent = `${secilenHobiler.length}/6`;
}

function checkOnboardingReady() {
    const btn = document.getElementById("finish-btn");
    const username = document.getElementById("new-username").value;
    const birth = document.getElementById("birth-date").value;
    
    const isOk = userValid && username.length >= 3 && birth && secilenHobiler.length > 0;
    btn.disabled = !isOk;
}

// Event listeners for onboarding
document.addEventListener('input', e => {
    if(e.target.id === 'birth-date') checkOnboardingReady();
});

// Complete Registration
async function completeRegistration() {
    const user = auth.currentUser;
    const username = document.getElementById("new-username").value.toLowerCase();
    const birth = document.getElementById("birth-date").value;
    
    if (!userValid || secilenHobiler.length === 0) {
        showNotification("Lütfen tüm alanları kontrol edin", "warning");
        return;
    }
    
    try {
        await db.collection("users").doc(user.uid).set({
            username,
            birth,
            hobbies: secilenHobiler,
            photo: user.photoURL || "",
            email: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showNotification("Profil oluşturuldu! Hoş geldin 🚀", "success");
    } catch(e) {
        showNotification("Hata: " + e.message, "error");
    }
}

// Load Main Scene
function loadMainScene(user, userData) {
    document.getElementById("welcome-msg").innerHTML = 
        `Hoş geldin, <span class="highlight">${userData.username}</span>`;
    
    document.getElementById("nav-username").textContent = userData.username;
    
    const navAvatar = document.getElementById("user-avatar");
    if (userData.photo) {
        navAvatar.src = userData.photo;
    } else {
        navAvatar.src = `https://ui-avatars.com/api/?name=${userData.username}&background=7000ff&color=fff`;
    }
}

// User Menu Toggle
function toggleUserMenu() {
    document.getElementById("user-dropdown").classList.toggle("active");
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-menu')) {
        document.getElementById("user-dropdown")?.classList.remove("active");
    }
});

// Notification System
function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    
    const icons = {
        success: "fa-check-circle",
        error: "fa-exclamation-circle",
        warning: "fa-exclamation-triangle",
        info: "fa-info-circle"
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add("show"), 10);
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Error Messages
function getErrorMessage(code) {
    const messages = {
        "auth/user-not-found": "Kullanıcı bulunamadı",
        "auth/wrong-password": "Hatalı şifre",
        "auth/email-already-in-use": "Bu e-posta zaten kullanımda",
        "auth/weak-password": "Şifre çok zayıf",
        "auth/invalid-email": "Geçersiz e-posta adresi"
    };
    return messages[code] || "Bir hata oluştu";
}

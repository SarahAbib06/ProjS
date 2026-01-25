// ===== CONFIGURATION =====
const CONFIG = {
    BACKEND_URL: 'http://localhost:5000'
};

// ===== INITIALISATION =====
document.addEventListener("DOMContentLoaded", function() {
    initLoginPage();
});

// ===== PAGE DE CONNEXION =====
function initLoginPage() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const otpForm = document.getElementById("otpForm");
    const showRegisterBtn = document.getElementById("showRegister");
    const showLoginBtn = document.getElementById("showLogin");
    const forgotPasswordBtn = document.getElementById("forgotPassword");
    const changeEmailBtn = document.getElementById("changeEmail");
    const resendOtpBtn = document.getElementById("resendOtp");

    showRegisterBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        showForm("register");
    });

    showLoginBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        showForm("login");
    });

    loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        await handleLogin();
    });

    registerForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        await handleRegister();
    });

    otpForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        await verifyOtp();
    });

    forgotPasswordBtn?.addEventListener("click", async (e) => {
        e.preventDefault();
        await handleForgotPassword();
    });

    resendOtpBtn?.addEventListener("click", async (e) => {
        e.preventDefault();
        await resendOtp();
    });

    changeEmailBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        showForm("register");
    });

    
}

function showForm(formType) {
    document.getElementById("loginForm").classList.toggle("hidden", formType !== "login");
    document.getElementById("registerForm").classList.toggle("hidden", formType !== "register");
    document.getElementById("otpForm").classList.toggle("hidden", formType !== "otp");
}

async function handleLogin() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const loginBtn = document.getElementById("loginBtn");

    if (!email || !password) {
        showMessage("Veuillez remplir tous les champs", "error");
        return;
    }

    try {
        setButtonLoading(loginBtn, true);

        // 🆕 ENVOI SIMPLIFIÉ - SEULEMENT EMAIL ET PASSWORD
        // Le backend détecte automatiquement les infos du device
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }), // ← PLUS de deviceInfo envoyé
        });

        const data = await response.json();

        if (response.ok) {
            if (data.requiresOtp) {
                document.getElementById("otpEmail").textContent = email;
                showForm("otp");
                showMessage("Code de vérification envoyé par email", "success");
            } else {
                await handleSuccessfulAuth(data);
            }
        } else {
            showMessage(data.message || "Erreur de connexion", "error");
        }
    } catch (error) {
        console.error("Login error:", error);
        showMessage("Erreur de connexion au serveur", "error");
    } finally {
        setButtonLoading(loginBtn, false);
    }
}

async function handleRegister() {
    const username = document.getElementById("regUsername").value;
    const email = document.getElementById("regEmail").value;
    const password = document.getElementById("regPassword").value;
    const passwordConfirm = document.getElementById("regPasswordConfirm").value;
    const registerBtn = document.getElementById("registerBtn");

    if (!username || !email || !password || !passwordConfirm) {
        showMessage("Veuillez remplir tous les champs", "error");
        return;
    }

    if (password !== passwordConfirm) {
        showMessage("Les mots de passe ne correspondent pas", "error");
        return;
    }

    try {
        setButtonLoading(registerBtn, true);

        const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password, passwordConfirm }),
        });

        const data = await response.json();

        if (response.ok) {
            document.getElementById("otpEmail").textContent = email;
            showForm("otp");
            showMessage("Code de vérification envoyé par email", "success");
        } else {
            showMessage(data.message || "Erreur d'inscription", "error");
        }
    } catch (error) {
        console.error("Register error:", error);
        showMessage("Erreur de connexion au serveur", "error");
    } finally {
        setButtonLoading(registerBtn, false);
    }
}

async function verifyOtp() {
    const email = document.getElementById("otpEmail").textContent;
    const otp = document.getElementById("otpCode").value;
    const verifyBtn = document.getElementById("verifyOtpBtn");

    if (!otp) {
        showMessage("Veuillez entrer le code de vérification", "error");
        return;
    }

    try {
        setButtonLoading(verifyBtn, true);

        const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/verify-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp }),
        });

        const data = await response.json();

        if (response.ok) {
            await handleSuccessfulAuth(data);
        } else {
            showMessage(data.message || "Code invalide", "error");
        }
    } catch (error) {
        console.error("OTP verification error:", error);
        showMessage("Erreur de vérification", "error");
    } finally {
        setButtonLoading(verifyBtn, false);
    }
}

async function resendOtp() {
    const email = document.getElementById("otpEmail").textContent;

    try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/resend-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            showMessage("Nouveau code envoyé", "success");
        } else {
            showMessage(data.message || "Erreur d'envoi", "error");
        }
    } catch (error) {
        console.error("Resend OTP error:", error);
        showMessage("Erreur d'envoi", "error");
    }
}

async function handleForgotPassword() {
    const email = prompt("Entrez votre email pour réinitialiser le mot de passe:");
    if (!email) return;

    try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
            showMessage("Instructions de réinitialisation envoyées par email", "success");
        } else {
            showMessage(data.message || "Erreur", "error");
        }
    } catch (error) {
        console.error("Forgot password error:", error);
        showMessage("Erreur de connexion", "error");
    }
}

async function handleSuccessfulAuth(authData) {
    const token = authData.data?.token || authData.token;
    const user = authData.data?.user || {
        id: authData.id,
        username: authData.username,
        email: authData.email,
    };

    localStorage.setItem("owly_token", token);
    localStorage.setItem("owly_user", JSON.stringify(user));

    showMessage("Connexion réussie! Redirection...", "success");

    setTimeout(() => {
        window.location.href = "conversations.html";
    }, 1000);
}

async function checkExistingAuth() {
    // NOUVELLE LIGNE MAGIQUE → si tu as ?noredirect ou ?login dans l'URL → ON NE REDIRIGE JAMAIS
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("noredirect") || urlParams.has("login") || urlParams.has("forceLogin")) {
        console.log("Redirection désactivée par paramètre URL");
        return;
    }

    const token = localStorage.getItem("owly_token");
    if (!token) return;

    try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            // SEULEMENT si pas de paramètre → on redirige
            window.location.href = "conversations.html";
        } else {
            forceLogout();
        }
    } catch (err) {
        forceLogout();
    }
}

function forceLogout() {
    localStorage.removeItem("owly_token");
    localStorage.removeItem("owly_user");
    sessionStorage.clear();
    showMessage("Session expirée. Veuillez vous reconnecter.", "warning");
}

function setButtonLoading(button, isLoading) {
    const btnText = button.querySelector(".btn-text");
    const btnLoading = button.querySelector(".btn-loading");

    if (btnText && btnLoading) {
        btnText.classList.toggle("hidden", isLoading);
        btnLoading.classList.toggle("hidden", !isLoading);
    }

    button.disabled = isLoading;
}

function showMessage(message, type = "info") {
    const container = document.getElementById("messageContainer");
    if (!container) return;

    container.className = `message-container ${type}`;
    container.textContent = message;
    container.style.display = "block";

    setTimeout(() => {
        container.style.display = "none";
    }, 5000);
}



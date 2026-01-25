// ===== CONFIGURATION =====
const CONFIG = {
  BACKEND_URL: "http://localhost:5000",
  SOCKET_URL: "http://localhost:5000",
  RECONNECT_DELAY: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
};

// ===== ÉTAT GLOBAL =====
let state = {
  user: null,
  token: null,
  conversations: [],
  currentConversation: null,
  messages: new Map(),
  socket: null,
  isConnected: false,
  reconnectAttempts: 0,
  typingUsers: new Map(),
  notificationPermission: null,
  isLoadingMessages: false,
  pendingFiles: [],
  availableReactions: [],
  currentMessageForReaction: null,
  isSendingMessage: false,
  currentMessageForForward: null,

  // 🎤 ÉTAT ENREGISTREMENT VOCAL AMÉLIORÉ
  audioRecorder: {
    mediaRecorder: null,
    audioChunks: [],
    audioBlob: null,
    audioUrl: null,
    isRecording: false,
    recordingTimer: null,
    recordingStartTime: null,
    audioDuration: 0,
  },

  // 🆕 ÉTAT ARCHIVAGE
  archivedConversations: [],
  isViewingArchived: false,
  currentArchiveFilter: "",
};

// ===== INITIALISATION =====
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("loginForm")) {
    initLoginPage();
  } else if (document.getElementById("contactsList")) {
    initMessagingPage();
  }
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
  document
    .getElementById("loginForm")
    .classList.toggle("hidden", formType !== "login");
  document
    .getElementById("registerForm")
    .classList.toggle("hidden", formType !== "register");
  document
    .getElementById("otpForm")
    .classList.toggle("hidden", formType !== "otp");
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

    const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      if (data.requiresOtp) {
        state.tempToken = data.debug_token;
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

    let response;
    if (state.tempToken) {
      response = await fetch(
        `${CONFIG.BACKEND_URL}/api/auth/verify-inactivity-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: state.tempToken, otp }),
        }
      );
    } else {
      response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
    }

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
  const email = prompt(
    "Entrez votre email pour réinitialiser le mot de passe:"
  );
  if (!email) return;

  try {
    const response = await fetch(
      `${CONFIG.BACKEND_URL}/api/auth/forgot-password`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      showMessage(
        "Instructions de réinitialisation envoyées par email",
        "success"
      );
    } else {
      showMessage(data.message || "Erreur", "error");
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    showMessage("Erreur de connexion", "error");
  }
}

async function handleSuccessfulAuth(authData) {
  state.token = authData.data?.token || authData.token;
  state.user = authData.data?.user || {
    id: authData.id,
    username: authData.username,
    email: authData.email,
  };

  localStorage.setItem("owly_token", state.token);
  localStorage.setItem("owly_user", JSON.stringify(state.user));

  showMessage("Connexion réussie! Redirection...", "success");

  setTimeout(() => {
    window.location.href = "conversations.html";
  }, 1000);
}

function checkExistingAuth() {
  // Si on est sur conversations.html → on ne fait rien ici
  if (window.location.pathname.includes("conversations.html")) {
    return;
  }

  // Si on a un paramètre dans l'URL qui force le login → on reste ici même si connecté
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("noredirect") || urlParams.has("debug") || urlParams.has("force") || urlParams.has("login")) {
    console.log("Mode debug activé → pas de redirection automatique");
    return;
  }

  // Sinon : comportement normal
  const token = localStorage.getItem("owly_token");
  const userData = localStorage.getItem("owly_user");

  if (token && userData) {
    console.log("Token trouvé → redirection vers conversations.html");
    window.location.replace("conversations.html"); // replace = pas de retour en arrière
  }
}

// ===== PAGE DE MESSAGERIE =====
function initMessagingPage() {
  if (!checkAuth()) return;

  initUserPanel();
  initConversations();
  initMessageInput();
  initFileUploads();
  initWebSocket();
  initTestButtons();
  initModals();
  initGroupCreation();
  initReactionsSystem();
  initUserProfileSystem();
  initVoiceRecording();
  initForwardSystem();
  initArchiveSystem(); // 🆕 SYSTÈME D'ARCHIVAGE

  loadInitialData();
  initArchiveSystem();
}

function checkAuth() {
  const token = localStorage.getItem("owly_token");
  const userData = localStorage.getItem("owly_user");

  if (!token || !userData) {
    window.location.href = "login.html";
    return false;
  }

  state.token = token;
  state.user = JSON.parse(userData);
  return true;
}

function initUserPanel() {
  if (state.user) {
    document.getElementById("userName").textContent = state.user.username;
    document.getElementById("userEmail").textContent = state.user.email;
    document.getElementById("userAvatar").textContent = state.user.username
      .charAt(0)
      .toUpperCase();
  }
}

// ==================== GALERIE MÉDIAS & FICHIERS — VERSION FINALE AVEC API ====================

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('mediaGalleryBtn');
    if (btn) btn.addEventListener('click', openMediaGallery);
});

async function openMediaGallery() {
    if (!state.currentConversation?._id) {
        showMessage("Ouvre une conversation d'abord !", "warning");
        return;
    }

    const modal = document.getElementById('mediaGalleryModal');
    modal.style.display = 'flex';

    // Onglet Médias par défaut
    document.getElementById('tabMedia').classList.add('active');
    document.getElementById('tabFiles').classList.remove('active');
    document.getElementById('mediaGrid').style.display = 'grid';
    document.getElementById('filesList').style.display = 'none';

    await loadMediaFromAPI();
}

async function loadMediaFromAPI() {
    const convId = state.currentConversation._id;
    const token = state.token;

    try {
        const res = await fetch(`${CONFIG.BACKEND_URL}/api/messages/${convId}/media`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success) throw new Error("Erreur serveur");

        renderMediaGrid(data.media.items || []);
        renderFilesList(data.files.items || []);

        document.getElementById('mediaCount').textContent = data.media.items?.length || 0;
        document.getElementById('filesCount').textContent = data.files.items?.length || 0;

    } catch (err) {
        console.error("Erreur chargement galerie:", err);
        showMessage("Impossible de charger la galerie", "error");
        document.getElementById('mediaGrid').innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#f9ee34; padding:50px;">Erreur de chargement</p>';
    }
}

function renderMediaGrid(items) {
    const grid = document.getElementById('mediaGrid');
    if (!items || items.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:80px 20px; color:#999;">
                <i class="fas fa-images" style="font-size:70px; color:#555; margin-bottom:20px;"></i>
                <p style="font-size:18px;">Aucun média partagé</p>
            </div>`;
        return;
    }

    grid.innerHTML = items.map(m => {
        const isVideo = m.type === 'video';
        return `
            <div style="cursor:pointer; border-radius:16px; overflow:hidden; position:relative; box-shadow:0 8px 30px rgba(0,0,0,0.8); transition:0.3s;"
                 onclick="openImageModal('${m.url}')">
                ${isVideo 
                    ? `<video src="${m.url}" loading="lazy" style="width:100%; height:180px; object-fit:cover; background:#000;">
                         <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.6);">
                             <i class="fas fa-play-circle" style="font-size:70px; color:#f9ee34;"></i>
                         </div>
                       </video>`
                    : `<img src="${m.url}" loading="lazy" style="width:100%; height:180px; object-fit:cover;">`
                }
                <div style="position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.7); color:#f9ee34; padding:4px 10px; border-radius:8px; font-size:12px; font-weight:bold;">
                    ${m.senderName}
                </div>
            </div>
        `;
    }).join('');
}

function renderFilesList(items) {
    const container = document.getElementById('filesContainer');
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:100px 20px; color:#999;">
                <i class="fas fa-file-alt" style="font-size:70px; color:#555; margin-bottom:20px;"></i>
                <p style="font-size:18px;">Aucun fichier partagé</p>
            </div>`;
        return;
    }

    container.innerHTML = items.map(f => {
        const size = f.size ? formatFileSize(f.size) : '';
        const name = f.fileName || 'Fichier';
        return `
            <div style="background:#1f1f1f; padding:22px; border-radius:16px; margin-bottom:16px; border:2px solid #333; display:flex; justify-content:space-between; align-items:center; transition:0.3s;"
                 onmouseover="this.style.borderColor='#f9ee34'"
                 onmouseout="this.style.borderColor='#333'">
                <div>
                    <div style="font-weight:bold; color:#f9ee34; font-size:17px;">${name}</div>
                    <div style="color:#aaa; font-size:13px; margin-top:5px;">
                        ${size} • ${f.senderName} • ${formatTime(f.timestamp)}
                    </div>
                </div>
                <a href="${f.url}" download="${name}" 
                   style="background:#f9ee34; color:black; padding:14px 30px; border-radius:12px; text-decoration:none; font-weight:bold;">
                   Télécharger
                </a>
            </div>
        `;
    }).join('');
}

// Onglets
document.getElementById('tabMedia')?.addEventListener('click', () => {
    document.getElementById('tabMedia').classList.add('active');
    document.getElementById('tabFiles').classList.remove('active');
    document.getElementById('mediaGrid').style.display = 'grid';
    document.getElementById('filesList').style.display = 'none';
});

document.getElementById('tabFiles')?.addEventListener('click', () => {
    document.getElementById('tabFiles').classList.add('active');
    document.getElementById('tabMedia').classList.remove('active');
    document.getElementById('mediaGrid').style.display = 'none';
    document.getElementById('filesList').style.display = 'block';
});

// ====================== FIN GALERIE ======================

function initConversations() {
  console.log("✅ Conversations initialisées");
}

// 🆕 SYSTÈME D'ARCHIVAGE
function initArchiveSystem() {
  console.log("🗃️ Initialisation du système d'archivage...");

  // Écouteurs d'événements
  document
    .getElementById("archiveBtn")
    ?.addEventListener("click", toggleArchiveConversation);
  document
    .getElementById("showArchivedBtn")
    ?.addEventListener("click", showArchivedModal);
  document
    .getElementById("closeArchivedModal")
    ?.addEventListener("click", closeArchivedModal);
  document
    .getElementById("searchArchivedInput")
    ?.addEventListener("input", handleArchiveSearch);

  // Initialisation du modal
  initArchiveModal();

  console.log("✅ Système d'archivage initialisé");
}

function initArchiveModal() {
  const modal = document.getElementById("archivedModal");
  const closeBtn = document.getElementById("closeArchivedModal");
  const searchInput = document.getElementById("searchArchivedInput");

  // Fermeture du modal
  closeBtn?.addEventListener("click", closeArchivedModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeArchivedModal();
    }
  });

  // Recherche dans les archives
  searchInput?.addEventListener("input", handleArchiveSearch);
}

// 🆕 ARCHIVER/DÉSARCHIVER UNE CONVERSATION
async function toggleArchiveConversation() {
  if (!state.currentConversation) {
    showMessage("Sélectionnez d'abord une conversation", "warning");
    return;
  }

  const conversationId = state.currentConversation._id;
  const isCurrentlyArchived = state.currentConversation.isArchived;

  try {
    if (isCurrentlyArchived) {
      // Désarchiver
      await unarchiveConversation(conversationId);
    } else {
      // Archiver
      await archiveConversation(conversationId);
    }
  } catch (error) {
    console.error("❌ Erreur archivage:", error);
    showMessage("Erreur: " + error.message, "error");
  }
}

// 🆕 ARCHIVER VIA WEBSOCKET
async function archiveConversation(conversationId) {
  return new Promise((resolve, reject) => {
    if (!state.socket || !state.isConnected) {
      reject(new Error("WebSocket déconnecté"));
      return;
    }

    console.log("🗃️ Archivage conversation:", conversationId);

    state.socket.emit("archive_conversation", { conversationId });

    // Écouter la confirmation
    const successHandler = (data) => {
      if (data.conversationId === conversationId) {
        state.socket.off("conversation_archived", successHandler);
        state.socket.off("archive_error", errorHandler);

        showMessage("✅ Conversation archivée", "success");
        updateArchiveUI(true);
        loadConversations(); // Recharger la liste
        resolve(data);
      }
    };

    const errorHandler = (data) => {
      state.socket.off("conversation_archived", successHandler);
      state.socket.off("archive_error", errorHandler);
      reject(new Error(data.error || "Erreur d'archivage"));
    };

    state.socket.on("conversation_archived", successHandler);
    state.socket.on("archive_error", errorHandler);

    // Timeout de sécurité
    setTimeout(() => {
      state.socket.off("conversation_archived", successHandler);
      state.socket.off("archive_error", errorHandler);
      reject(new Error("Timeout archivage"));
    }, 10000);
  });
}

// 🆕 DÉSARCHIVER VIA WEBSOCKET
async function unarchiveConversation(conversationId) {
  return new Promise((resolve, reject) => {
    if (!state.socket || !state.isConnected) {
      reject(new Error("WebSocket déconnecté"));
      return;
    }

    console.log("🗃️ Désarchivage conversation:", conversationId);

    state.socket.emit("unarchive_conversation", { conversationId });

    // Écouter la confirmation
    const successHandler = (data) => {
      if (data.conversationId === conversationId) {
        state.socket.off("conversation_unarchived", successHandler);
        state.socket.off("archive_error", errorHandler);

        showMessage("✅ Conversation désarchivée", "success");
        updateArchiveUI(false);
        loadConversations(); // Recharger la liste
        resolve(data);
      }
    };

    const errorHandler = (data) => {
      state.socket.off("conversation_unarchived", successHandler);
      state.socket.off("archive_error", errorHandler);
      reject(new Error(data.error || "Erreur de désarchivage"));
    };

    state.socket.on("conversation_unarchived", successHandler);
    state.socket.on("archive_error", errorHandler);

    // Timeout de sécurité
    setTimeout(() => {
      state.socket.off("conversation_unarchived", successHandler);
      state.socket.off("archive_error", errorHandler);
      reject(new Error("Timeout désarchivage"));
    }, 10000);
  });
}

// 🆕 METTRE À JOUR L'UI POUR L'ARCHIVAGE
function updateArchiveUI(isArchived) {
  const archiveBtn = document.getElementById("archiveBtn");
  const archiveMenuItem = document.getElementById("archiveMenuItem");

  if (archiveBtn) {
    archiveBtn.title = isArchived ? "Désarchiver" : "Archiver";
    archiveBtn.innerHTML = isArchived
      ? '<i class="fas fa-inbox"></i>'
      : '<i class="fas fa-archive"></i>';
  }

  if (archiveMenuItem) {
    archiveMenuItem.textContent = isArchived ? "Désarchiver" : "Archiver";
  }

  // Mettre à jour l'état local
  if (state.currentConversation) {
    state.currentConversation.isArchived = isArchived;
  }
}

// 🆕 AFFICHER LE MODAL DES ARCHIVES
async function showArchivedModal() {
  const modal = document.getElementById("archivedModal");

  try {
    // Charger les conversations archivées
    await loadArchivedConversations();
    modal.style.display = "flex";
  } catch (error) {
    console.error("❌ Erreur chargement archives:", error);
    showMessage("Erreur de chargement des archives", "error");
  }
}

// 🆕 FERMER LE MODAL DES ARCHIVES
function closeArchivedModal() {
  const modal = document.getElementById("archivedModal");
  modal.style.display = "none";
  state.currentArchiveFilter = "";
}

// 🆕 CHARGER LES CONVERSATIONS ARCHIVÉES
async function loadArchivedConversations() {
  return new Promise((resolve, reject) => {
    if (!state.socket || !state.isConnected) {
      reject(new Error("WebSocket déconnecté"));
      return;
    }

    console.log("🔄 Chargement des conversations archivées...");

    state.socket.emit("get_archived_conversations");

    const successHandler = (data) => {
      if (data.success) {
        state.socket.off("archived_conversations_data", successHandler);
        state.socket.off("archive_error", errorHandler);

        state.archivedConversations = data.conversations || [];
        renderArchivedConversations();
        updateArchivedCount();
        resolve(data);
      }
    };

    const errorHandler = (data) => {
      state.socket.off("archived_conversations_data", successHandler);
      state.socket.off("archive_error", errorHandler);
      reject(new Error(data.error || "Erreur de chargement"));
    };

    state.socket.on("archived_conversations_data", successHandler);
    state.socket.on("archive_error", errorHandler);

    // Timeout
    setTimeout(() => {
      state.socket.off("archived_conversations_data", successHandler);
      state.socket.off("archive_error", errorHandler);
      reject(new Error("Timeout chargement archives"));
    }, 10000);
  });
}

// 🆕 AFFICHER LES CONVERSATIONS ARCHIVÉES
function renderArchivedConversations() {
  const container = document.getElementById("archivedConversationsList");
  const conversations = state.archivedConversations;

  if (!conversations || conversations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-archive"></i>
        <p>Aucune conversation archivée</p>
        <p style="font-size: 12px; margin-top: 5px;">Les conversations archivées n'apparaîtront pas dans votre liste principale</p>
      </div>
    `;
    return;
  }

  // Appliquer le filtre de recherche
  let filteredConversations = conversations;
  if (state.currentArchiveFilter) {
    const term = state.currentArchiveFilter.toLowerCase();
    filteredConversations = conversations.filter(
      (conv) =>
        conv.name.toLowerCase().includes(term) ||
        (conv.participants &&
          conv.participants.some(
            (p) => p.username && p.username.toLowerCase().includes(term)
          ))
    );
  }

  if (filteredConversations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <p>Aucun résultat trouvé</p>
        <p style="font-size: 12px; margin-top: 5px;">Essayez avec d'autres termes de recherche</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredConversations
    .map((conv) => {
      const isGroup = conv.type === "group";
      const avatarText = isGroup
        ? "👥"
        : (conv.name || "C").charAt(0).toUpperCase();
      const archivedDate = conv.archivedAt
        ? new Date(conv.archivedAt)
        : new Date();

      return `
      <div class="archived-conversation" data-conversation-id="${conv._id}" 
           style="padding: 12px; border-bottom: 1px solid #333; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: background 0.2s;"
           onmouseover="this.style.background='#252525'" onmouseout="this.style.background='transparent'">
        <div class="contact-avatar" style="width: 45px; height: 45px; border-radius: 50%; background: #666; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">
          ${avatarText}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: bold; color: #ccc; font-size: 14px;">
            ${conv.name || "Conversation"}
            ${
              isGroup
                ? '<span style="font-size: 10px; background: #444; padding: 2px 6px; border-radius: 10px; margin-left: 8px;">Groupe</span>'
                : ""
            }
          </div>
          <div style="font-size: 11px; color: #888; margin-top: 2px;">
            Archivée le ${archivedDate.toLocaleDateString("fr-FR")}
          </div>
        </div>
        <button class="action-btn small" onclick="event.stopPropagation(); unarchiveFromModal('${
          conv._id
        }')" 
                title="Désarchiver" style="background: #f9ee34; color: #1c1c1c; border: none; border-radius: 6px; padding: 6px 10px; font-size: 11px; cursor: pointer;">
          <i class="fas fa-inbox"></i>
        </button>
      </div>
    `;
    })
    .join("");

  // Ajouter les écouteurs pour ouvrir la conversation
  container.querySelectorAll(".archived-conversation").forEach((element) => {
    element.addEventListener("click", function () {
      const conversationId = this.dataset.conversationId;
      openArchivedConversation(conversationId);
    });
  });
}

// 🆕 DÉSARCHIVER DEPUIS LE MODAL
async function unarchiveFromModal(conversationId) {
  try {
    await unarchiveConversation(conversationId);
    // Recharger la liste des archives
    await loadArchivedConversations();
  } catch (error) {
    console.error("❌ Erreur désarchivage modal:", error);
    showMessage("Erreur: " + error.message, "error");
  }
}

// 🆕 OUVRIR UNE CONVERSATION ARCHIVÉE
async function openArchivedConversation(conversationId) {
  try {
    // Désarchiver d'abord
    await unarchiveConversation(conversationId);
    // Fermer le modal
    closeArchivedModal();
    // La conversation apparaîtra maintenant dans la liste principale
    showMessage("Conversation désarchivée et ouverte", "success");
  } catch (error) {
    console.error("❌ Erreur ouverture conversation archivée:", error);
    showMessage("Erreur: " + error.message, "error");
  }
}

// 🆕 RECHERCHE DANS LES ARCHIVES
function handleArchiveSearch(event) {
  state.currentArchiveFilter = event.target.value.trim();
  renderArchivedConversations();
}

// 🆕 METTRE À JOUR LE COMPTEUR D'ARCHIVES
function updateArchivedCount() {
  const countElement = document.getElementById("archivedCount");
  const count = state.archivedConversations.length;

  if (countElement) {
    countElement.textContent = `${count} conversation${
      count > 1 ? "s" : ""
    } archivée${count > 1 ? "s" : ""}`;
  }
}

// 🆕 SYSTÈME DE TRANSFERT DE MESSAGES
function initForwardSystem() {
  console.log("🔄 Initialisation du système de transfert...");

  // Initialisation du menu contextuel
  initMessageContextMenu();

  // Initialisation du modal de transfert
  initForwardModal();

  console.log("✅ Système de transfert initialisé");
}

// 🆕 INITIALISATION DU MENU CONTEXTUEL
function initMessageContextMenu() {
  const contextMenu = document.getElementById("messageContextMenu");

  // Cacher le menu quand on clique ailleurs
  document.addEventListener("click", function (e) {
    if (!contextMenu.contains(e.target)) {
      contextMenu.style.display = "none";
    }
  });

  // Empêcher le menu contextuel par défaut sur les messages
  document.addEventListener("contextmenu", function (e) {
    const messageElement = e.target.closest(".message");
    if (messageElement) {
      e.preventDefault();
    }
  });

  // Gérer les clics sur les options du menu
  contextMenu.addEventListener("click", function (e) {
    const menuItem = e.target.closest(".menu-item");
    if (menuItem) {
      const action = menuItem.dataset.action;
      const messageId = this.dataset.messageId;

      if (action === "forward") {
        handleForwardAction(messageId);
      }
      // Masquer le menu après action
      this.style.display = "none";
    }
  });

  console.log("✅ Menu contextuel initialisé");
}

// 🆕 AFFICHAGE DU MENU CONTEXTUEL AU CLIC LONG
function initMessageLongPress() {
  let pressTimer;
  const messagesContainer = document.getElementById("messagesList");

  messagesContainer.addEventListener("mousedown", function (e) {
    const messageElement = e.target.closest(".message");
    if (messageElement) {
      pressTimer = setTimeout(() => {
        showMessageContextMenu(e, messageElement);
      }, 500); // 500ms pour un clic long
    }
  });

  messagesContainer.addEventListener("mouseup", function () {
    clearTimeout(pressTimer);
  });

  messagesContainer.addEventListener("mouseleave", function () {
    clearTimeout(pressTimer);
  });

  // Gestion du clic droit aussi
  messagesContainer.addEventListener("contextmenu", function (e) {
    const messageElement = e.target.closest(".message");
    if (messageElement) {
      e.preventDefault();
      showMessageContextMenu(e, messageElement);
    }
  });
}

// 🆕 AFFICHER LE MENU CONTEXTUEL
function showMessageContextMenu(e, messageElement) {
  const contextMenu = document.getElementById("messageContextMenu");
  const messageId = messageElement.dataset.messageId;

  if (!messageId) {
    console.log("❌ ID de message non trouvé");
    return;
  }

  // Stocker l'ID du message pour le transfert
  contextMenu.dataset.messageId = messageId;

  // Positionner le menu
  const x = e.clientX;
  const y = e.clientY;

  contextMenu.style.left = x + "px";
  contextMenu.style.top = y + "px";
  contextMenu.style.display = "block";

  console.log("📋 Menu contextuel affiché pour le message:", messageId);
}

// 🆕 GESTION DE L'ACTION "TRANSFÉRER"
function handleForwardAction(messageId) {
  if (!messageId) {
    showMessage("Aucun message sélectionné", "error");
    return;
  }

  console.log("🔄 Lancement du transfert pour le message:", messageId);

  // Trouver le message dans les messages chargés
  const messages = state.messages.get(state.currentConversation._id) || [];
  const messageToForward = messages.find((msg) => msg._id === messageId);

  if (!messageToForward) {
    showMessage("Message non trouvé", "error");
    return;
  }

  state.currentMessageForForward = messageToForward;
  showForwardModal(messageToForward);
}

// 🆕 INITIALISATION DU MODAL DE TRANSFERT
function initForwardModal() {
  const modal = document.getElementById("forwardModal");
  const closeBtn = document.getElementById("closeForwardModal");
  const cancelBtn = document.getElementById("cancelForwardBtn");
  const searchInput = document.getElementById("searchForwardInput");

  // Fermeture du modal
  closeBtn?.addEventListener("click", closeForwardModal);
  cancelBtn?.addEventListener("click", closeForwardModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeForwardModal();
    }
  });

  // Recherche dans les conversations
  searchInput?.addEventListener("input", handleForwardSearch);

  console.log("✅ Modal de transfert initialisé");
}

// 🆕 AFFICHER LE MODAL DE TRANSFERT
function showForwardModal(message) {
  const modal = document.getElementById("forwardModal");
  const preview = document.getElementById("forwardMessagePreview");
  const previewContent = document.getElementById("forwardPreviewContent");

  if (!modal) {
    console.error("❌ Modal de transfert non trouvé");
    return;
  }

  // Afficher l'aperçu du message
  if (message && preview && previewContent) {
    let previewText = "";

    switch (message.typeMessage) {
      case "text":
        previewText =
          message.content.length > 50
            ? message.content.substring(0, 50) + "..."
            : message.content;
        break;
      case "image":
        previewText = "📷 Image";
        break;
      case "video":
        previewText = "🎥 Vidéo";
        break;
      case "audio":
        previewText = "🎤 Message audio";
        break;
      case "file":
        previewText = "📁 Fichier";
        break;
      default:
        previewText = "Message";
    }

    previewContent.textContent = previewText;
    preview.style.display = "block";
  }

  // Charger la liste des conversations
  loadForwardConversations();

  // Afficher le modal
  modal.style.display = "flex";

  console.log("📤 Modal de transfert ouvert pour le message:", message._id);
}

// 🆕 FERMER LE MODAL DE TRANSFERT
function closeForwardModal() {
  const modal = document.getElementById("forwardModal");
  if (modal) {
    modal.style.display = "none";
    state.currentMessageForForward = null;
  }
}

// 🆕 CHARGER LES CONVERSATIONS POUR LE TRANSFERT
function loadForwardConversations(searchTerm = "") {
  const conversationsList = document.getElementById("forwardConversationsList");

  if (!conversationsList) return;

  // Filtrer les conversations (exclure la conversation actuelle)
  let availableConversations = state.conversations.filter(
    (conv) => conv._id !== state.currentConversation._id
  );

  // Appliquer la recherche si un terme est fourni
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    availableConversations = availableConversations.filter(
      (conv) =>
        conv.name.toLowerCase().includes(term) ||
        (conv.participants &&
          conv.participants.some(
            (p) => p.username && p.username.toLowerCase().includes(term)
          ))
    );
  }

  if (availableConversations.length === 0) {
    conversationsList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-inbox"></i>
        <p>Aucune conversation disponible</p>
        <p style="font-size: 12px; margin-top: 5px;">Créez une nouvelle conversation pour transférer</p>
      </div>
    `;
    return;
  }

  // Générer la liste des conversations
  conversationsList.innerHTML = availableConversations
    .map((conv) => {
      const isGroup = conv.type === "group";
      const avatarText = isGroup
        ? "👥"
        : (conv.name || "C").charAt(0).toUpperCase();
      const participantCount =
        conv.participantCount || conv.participants?.length || 0;

      return `
      <div class="forward-conversation" data-conversation-id="${conv._id}" 
           style="padding: 12px; border-bottom: 1px solid #333; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: background 0.2s;"
           onmouseover="this.style.background='#252525'" onmouseout="this.style.background='transparent'">
        <div class="contact-avatar" style="width: 45px; height: 45px; border-radius: 50%; background: #f9ee34; color: #1c1c1c; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">
          ${avatarText}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: bold; color: #f9ee34; font-size: 14px;">
            ${conv.name || "Conversation"}
            ${
              isGroup
                ? '<span style="font-size: 10px; background: #666; padding: 2px 6px; border-radius: 10px; margin-left: 8px;">Groupe</span>'
                : ""
            }
          </div>
          <div style="font-size: 12px; color: #ccc; margin-top: 2px;">
            ${isGroup ? `${participantCount} membre(s)` : "Discussion privée"}
          </div>
          ${
            conv.lastMessage
              ? `<div style="font-size: 11px; color: #888; margin-top: 2px;">${getLastMessagePreview(
                  conv
                )}</div>`
              : ""
          }
        </div>
        <i class="fas fa-share" style="color: #f9ee34; font-size: 14px;"></i>
      </div>
    `;
    })
    .join("");

  // Ajouter les écouteurs d'événements
  conversationsList
    .querySelectorAll(".forward-conversation")
    .forEach((convElement) => {
      convElement.addEventListener("click", function () {
        const targetConversationId = this.dataset.conversationId;
        confirmForward(targetConversationId);
      });
    });
}

// 🆕 RECHERCHE DANS LES CONVERSATIONS POUR LE TRANSFERT
function handleForwardSearch(event) {
  const searchTerm = event.target.value.trim();
  loadForwardConversations(searchTerm);
}

// 🆕 CONFIRMER ET EXÉCUTER LE TRANSFERT
async function confirmForward(targetConversationId) {
  if (!state.currentMessageForForward || !targetConversationId) {
    showMessage("Données manquantes pour le transfert", "error");
    return;
  }

  const messageId = state.currentMessageForForward._id;

  console.log("🎯 Confirmation du transfert:", {
    messageId,
    targetConversationId,
    currentConversation: state.currentConversation._id,
  });

  try {
    // Vérifier la connexion WebSocket
    if (!state.socket || !state.isConnected) {
      throw new Error("WebSocket déconnecté - Impossible de transférer");
    }

    // Émettre l'événement de transfert
    state.socket.emit("forward_message", {
      messageId: messageId,
      targetConversationId: targetConversationId,
    });

    showMessage("Transfert en cours...", "info");
    closeForwardModal();
  } catch (error) {
    console.error("❌ Erreur lors du transfert:", error);
    showMessage("Erreur: " + error.message, "error");
  }
}

function initReactionsSystem() {
  console.log("🎯 Initialisation du système de réactions...");
  loadAvailableReactions();

  document
    .getElementById("reactionsBtn")
    ?.addEventListener("click", showReactionsForCurrentConversation);
  document
    .getElementById("closeReactionsModal")
    ?.addEventListener("click", closeReactionsModal);
  document
    .getElementById("testReactionBtn")
    ?.addEventListener("click", testReactionSystem);

  document.getElementById("reactionsModal")?.addEventListener("click", (e) => {
    if (e.target.id === "reactionsModal") {
      closeReactionsModal();
    }
  });

  console.log("✅ Système de réactions initialisé");
}

async function loadAvailableReactions() {
  try {
    console.log("🔄 Chargement des réactions disponibles...");

    const response = await fetch(
      `${CONFIG.BACKEND_URL}/api/reactions/available`,
      {
        headers: { Authorization: `Bearer ${state.token}` },
      }
    );

    if (response.ok) {
      const data = await response.json();
      state.availableReactions = data.reactions || [];
      console.log("✅ Réactions chargées:", state.availableReactions);
      updateReactionsModal();
    } else {
      console.warn(
        "⚠️ Impossible de charger les réactions, utilisation des valeurs par défaut"
      );
      state.availableReactions = [
        "❤️",
        "👍",
        "😂",
        "😮",
        "😢",
        "😡",
        "🎉",
        "🔥",
        "👏",
        "💯",
      ];
    }
  } catch (error) {
    console.error("❌ Erreur chargement réactions:", error);
    state.availableReactions = [
      "❤️",
      "👍",
      "😂",
      "😮",
      "😢",
      "😡",
      "🎉",
      "🔥",
      "👏",
      "💯",
    ];
  }
}

function updateReactionsModal() {
  const reactionsGrid = document.getElementById("reactionsGrid");
  if (!reactionsGrid) return;

  reactionsGrid.innerHTML = "";

  if (state.availableReactions.length === 0) {
    reactionsGrid.innerHTML =
      '<div class="no-reactions">Aucune réaction disponible</div>';
    return;
  }

  state.availableReactions.forEach((emoji) => {
    const button = document.createElement("button");
    button.className = "reaction-btn";
    button.textContent = emoji;
    button.dataset.emoji = emoji;
    button.title = `Réagir avec ${emoji}`;

    button.addEventListener("click", () => {
      addReactionToCurrentMessage(emoji);
    });

    reactionsGrid.appendChild(button);
  });
}

function showReactionsForCurrentConversation() {
  if (!state.currentConversation) {
    showMessage("Sélectionnez d'abord une conversation", "warning");
    return;
  }
  showReactionsModal();
}

function showReactionsModal(messageId = null) {
  state.currentMessageForReaction = messageId;
  const modal = document.getElementById("reactionsModal");
  modal.style.display = "flex";
  updateReactionsModal();
}

function closeReactionsModal() {
  const modal = document.getElementById("reactionsModal");
  modal.style.display = "none";
  state.currentMessageForReaction = null;
}

async function addReactionToCurrentMessage(emoji) {
  if (!state.currentMessageForReaction) {
    showMessage("Aucun message sélectionné pour réagir", "warning");
    closeReactionsModal();
    return;
  }

  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/api/reactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify({
        messageId: state.currentMessageForReaction,
        emoji: emoji,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Réaction ajoutée:", data);
      showMessage(`Réaction ${emoji} ajoutée!`, "success");

      if (state.currentConversation) {
        await loadMessages(state.currentConversation._id, false);
      }
    } else {
      showMessage(
        data.error || "Erreur lors de l'ajout de la réaction",
        "error"
      );
    }
  } catch (error) {
    console.error("❌ Erreur ajout réaction:", error);
    showMessage("Erreur de connexion", "error");
  }

  closeReactionsModal();
}

function testReactionSystem() {
  if (!state.currentConversation) {
    showMessage("Ouvrez une conversation pour tester les réactions", "warning");
    return;
  }

  const messages = state.messages.get(state.currentConversation._id) || [];
  if (messages.length === 0) {
    showMessage("Envoyez un message pour tester les réactions", "warning");
    return;
  }

  const testMessage = messages[0];
  showReactionsModal(testMessage._id);
  showMessage("Cliquez sur une réaction pour tester!", "info");
}

function initUserProfileSystem() {
  console.log("🎯 Initialisation du système de profil...");

  document
    .getElementById("infoBtn")
    ?.addEventListener("click", showUserProfile);
  document
    .getElementById("closeProfileModal")
    ?.addEventListener("click", closeUserProfile);
  document
    .getElementById("blockUserBtn")
    ?.addEventListener("click", blockCurrentUser);
  document
    .getElementById("unblockUserBtn")
    ?.addEventListener("click", unblockCurrentUser);

  document
    .getElementById("userProfileModal")
    ?.addEventListener("click", (e) => {
      if (e.target.id === "userProfileModal") {
        closeUserProfile();
      }
    });

  console.log("✅ Système de profil initialisé");
}

function showUserProfile() {
  if (!state.currentConversation) {
    showMessage("Sélectionnez une conversation pour voir le profil", "warning");
    return;
  }

  const modal = document.getElementById("userProfileModal");
  const otherUser = getOtherParticipant();

  if (otherUser) {
    document.getElementById("profileAvatar").textContent =
      otherUser.username?.charAt(0)?.toUpperCase() || "U";
    document.getElementById("profileUsername").textContent =
      otherUser.username || "Utilisateur";
    document.getElementById("profileEmail").textContent =
      otherUser.email || "Email non disponible";
    document.getElementById("profileStatus").textContent = "🟢 En ligne";
  }

  checkBlockStatus().then((isBlocked) => {
    document.getElementById("blockUserBtn").style.display = isBlocked
      ? "none"
      : "block";
    document.getElementById("unblockUserBtn").style.display = isBlocked
      ? "block"
      : "none";
  });

  modal.style.display = "flex";
}

function closeUserProfile() {
  const modal = document.getElementById("userProfileModal");
  modal.style.display = "none";
}

async function blockCurrentUser() {
  const otherUser = getOtherParticipant();
  if (!otherUser) return;

  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/api/relations/block`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify({
        blockedUserId: otherUser._id,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      showMessage("Utilisateur bloqué avec succès", "success");
      document.getElementById("blockUserBtn").style.display = "none";
      document.getElementById("unblockUserBtn").style.display = "block";
    } else {
      showMessage(data.error || "Erreur lors du blocage", "error");
    }
  } catch (error) {
    console.error("❌ Erreur blocage:", error);
    showMessage("Erreur de connexion", "error");
  }
}

async function unblockCurrentUser() {
  const otherUser = getOtherParticipant();
  if (!otherUser) return;

  try {
    const response = await fetch(
      `${CONFIG.BACKEND_URL}/api/relations/unblock`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.token}`,
        },
        body: JSON.stringify({
          blockedUserId: otherUser._id,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      showMessage("Utilisateur débloqué avec succès", "success");
      document.getElementById("blockUserBtn").style.display = "block";
      document.getElementById("unblockUserBtn").style.display = "none";
    } else {
      showMessage(data.error || "Erreur lors du déblocage", "error");
    }
  } catch (error) {
    console.error("❌ Erreur déblocage:", error);
    showMessage("Erreur de connexion", "error");
  }
}

async function checkBlockStatus() {
  const otherUser = getOtherParticipant();
  if (!otherUser) return false;

  try {
    return false;
  } catch (error) {
    console.error("❌ Erreur vérification blocage:", error);
    return false;
  }
}

function getOtherParticipant() {
  if (!state.currentConversation || !state.currentConversation.participants)
    return null;

  return state.currentConversation.participants.find(
    (p) => p._id !== state.user.id
  );
}

// 🎤 SYSTÈME D'ENREGISTREMENT VOCAL ADAPTÉ AU BACKEND
function initVoiceRecording() {
  console.log("🎤 Initialisation enregistrement vocal...");

  const voiceBtn = document.getElementById("voiceMessageBtn");
  const startBtn = document.getElementById("startRecordBtn");
  const stopBtn = document.getElementById("stopRecordBtn");
  const playBtn = document.getElementById("playRecordBtn");
  const sendBtn = document.getElementById("sendRecordBtn");
  const closeBtn = document.getElementById("closeVoiceModal");

  voiceBtn?.addEventListener("click", showVoiceRecordModal);
  startBtn?.addEventListener("click", startRecording);
  stopBtn?.addEventListener("click", stopRecording);
  playBtn?.addEventListener("click", playRecording);
  sendBtn?.addEventListener("click", sendVoiceMessage);
  closeBtn?.addEventListener("click", closeVoiceRecordModal);

  console.log("✅ Enregistrement vocal initialisé");
}

// 🎤 AFFICHER LE MODAL D'ENREGISTREMENT
async function showVoiceRecordModal() {
  if (!state.currentConversation) {
    showMessage("Sélectionnez une conversation d'abord", "warning");
    return;
  }

  try {
    console.log("🎤 Demande d'accès au microphone...");

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 44100,
      },
    });

    state.audioRecorder.mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });
    state.audioRecorder.audioChunks = [];

    state.audioRecorder.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        state.audioRecorder.audioChunks.push(event.data);
      }
    };

    state.audioRecorder.mediaRecorder.onstop = () => {
      state.audioRecorder.audioBlob = new Blob(
        state.audioRecorder.audioChunks,
        {
          type: "audio/webm;codecs=opus",
        }
      );
      state.audioRecorder.audioUrl = URL.createObjectURL(
        state.audioRecorder.audioBlob
      );

      document.getElementById("playRecordBtn").disabled = false;
      document.getElementById("sendRecordBtn").disabled = false;
      document.getElementById("recordingStatus").textContent =
        "✅ Enregistrement terminé";
      document.getElementById("recordingStatus").style.color = "#4caf50";

      // Calculer la durée réelle
      const duration = Math.round(
        (Date.now() - state.audioRecorder.recordingStartTime) / 1000
      );
      state.audioRecorder.audioDuration = duration;

      console.log(
        `🎤 Enregistrement terminé - Durée: ${duration}s - Taille: ${state.audioRecorder.audioBlob.size} bytes`
      );
    };

    document.getElementById("voiceRecordModal").style.display = "flex";
    resetRecordingUI();

    console.log("✅ Microphone accessible, modal ouvert");
  } catch (error) {
    console.error("❌ Erreur accès microphone:", error);
    showMessage("Accès au microphone refusé ou non disponible", "error");
  }
}

// 🎤 DÉMARRER L'ENREGISTREMENT
function startRecording() {
  if (!state.audioRecorder.mediaRecorder) return;

  state.audioRecorder.audioChunks = [];
  state.audioRecorder.isRecording = true;
  state.audioRecorder.recordingStartTime = Date.now();
  state.audioRecorder.audioDuration = 0;

  state.audioRecorder.mediaRecorder.start(100);

  document.getElementById("startRecordBtn").disabled = true;
  document.getElementById("stopRecordBtn").disabled = false;
  document.getElementById("recordingStatus").textContent =
    "🔴 Enregistrement en cours...";
  document.getElementById("recordingStatus").style.color = "#ff4444";

  startRecordingTimer();
}

// 🎤 ARRÊTER L'ENREGISTREMENT
function stopRecording() {
  if (!state.audioRecorder.mediaRecorder || !state.audioRecorder.isRecording)
    return;

  state.audioRecorder.mediaRecorder.stop();
  state.audioRecorder.isRecording = false;

  document.getElementById("startRecordBtn").disabled = false;
  document.getElementById("stopRecordBtn").disabled = true;

  stopRecordingTimer();
}

// 🎤 ÉCOUTER L'ENREGISTREMENT
function playRecording() {
  if (!state.audioRecorder.audioUrl) return;

  const audio = new Audio(state.audioRecorder.audioUrl);

  document.getElementById("recordingStatus").textContent =
    "▶️ Lecture en cours...";
  document.getElementById("recordingStatus").style.color = "#2196f3";

  audio.play().catch((error) => {
    console.error("❌ Erreur lecture audio:", error);
    showMessage("Erreur lors de la lecture", "error");
  });

  audio.onended = () => {
    document.getElementById("recordingStatus").textContent =
      "✅ Enregistrement terminé";
    document.getElementById("recordingStatus").style.color = "#4caf50";
  };
}

// 🎤 ENVOYER LE MESSAGE VOCAL - ADAPTÉ AU BACKEND
async function sendVoiceMessage() {
  if (!state.audioRecorder.audioBlob || !state.currentConversation) {
    showMessage("Aucun enregistrement à envoyer", "error");
    return;
  }

  const sendBtn = document.getElementById("sendRecordBtn");

  try {
    setButtonLoading(sendBtn, true);
    console.log("🎤 Envoi du message vocal via API...");

    // Créer un FormData pour l'envoi multipart
    const formData = new FormData();

    // Ajouter le fichier audio
    const audioFile = new File(
      [state.audioRecorder.audioBlob],
      `voice_message_${Date.now()}.webm`,
      {
        type: "audio/webm",
      }
    );
    formData.append("audio", audioFile);

    // Ajouter les métadonnées REQUISES par votre backend
    formData.append("conversationId", state.currentConversation._id);

    console.log("📤 Données envoyées:", {
      conversationId: state.currentConversation._id,
      duration: state.audioRecorder.audioDuration,
      fileSize: audioFile.size,
    });

    // ENVOI VIA L'API HTTP
    const response = await fetch(
      `${CONFIG.BACKEND_URL}/api/messages/audio/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${state.token}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Message audio envoyé avec succès:", data);
      showMessage("Message vocal envoyé!", "success");

      // Fermer le modal
      closeVoiceRecordModal();

      // Recharger les messages pour afficher le nouveau message audio
      if (state.currentConversation) {
        await loadMessages(state.currentConversation._id, false);
      }
    } else {
      throw new Error(data.message || data.error || "Erreur d'envoi");
    }
  } catch (error) {
    console.error("❌ Erreur envoi message vocal:", error);
    showMessage(`Erreur: ${error.message}`, "error");
  } finally {
    setButtonLoading(sendBtn, false);
  }
}

// 🎤 TIMER POUR L'ENREGISTREMENT
function startRecordingTimer() {
  state.audioRecorder.recordingTimer = setInterval(() => {
    const elapsed = Date.now() - state.audioRecorder.recordingStartTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const displaySeconds = seconds % 60;

    document.getElementById("recordingTime").textContent = `${minutes
      .toString()
      .padStart(2, "0")}:${displaySeconds.toString().padStart(2, "0")}`;

    // Arrêter automatiquement après 5 minutes
    if (seconds >= 300) {
      stopRecording();
      showMessage(
        "Enregistrement automatiquement arrêté après 5 minutes",
        "info"
      );
    }
  }, 1000);
}

function stopRecordingTimer() {
  if (state.audioRecorder.recordingTimer) {
    clearInterval(state.audioRecorder.recordingTimer);
  }
}

// 🎤 RÉINITIALISER L'UI
function resetRecordingUI() {
  document.getElementById("recordingTime").textContent = "00:00";
  document.getElementById("recordingStatus").textContent = "Prêt à enregistrer";
  document.getElementById("recordingStatus").style.color = "#f9ee34";

  document.getElementById("startRecordBtn").disabled = false;
  document.getElementById("stopRecordBtn").disabled = true;
  document.getElementById("playRecordBtn").disabled = true;
  document.getElementById("sendRecordBtn").disabled = true;
}

// 🎤 FERMER LE MODAL
function closeVoiceRecordModal() {
  if (state.audioRecorder.isRecording) {
    stopRecording();
  }

  if (
    state.audioRecorder.mediaRecorder &&
    state.audioRecorder.mediaRecorder.stream
  ) {
    state.audioRecorder.mediaRecorder.stream
      .getTracks()
      .forEach((track) => track.stop());
  }

  if (state.audioRecorder.audioUrl) {
    URL.revokeObjectURL(state.audioRecorder.audioUrl);
  }

  state.audioRecorder = {
    mediaRecorder: null,
    audioChunks: [],
    audioBlob: null,
    audioUrl: null,
    isRecording: false,
    recordingTimer: null,
    recordingStartTime: null,
    audioDuration: 0,
  };

  document.getElementById("voiceRecordModal").style.display = "none";
  console.log("🎤 Modal enregistrement fermé");
}

function initFileUploads() {
  const imageBtn = document.getElementById("imageBtn");
  const fileBtn = document.getElementById("fileBtn");
  const videoBtn = document.getElementById("videoBtn");
  const imageInput = document.getElementById("imageInput");
  const fileInput = document.getElementById("fileInput");
  const videoInput = document.getElementById("videoInput");

  imageBtn?.addEventListener("click", () => imageInput.click());
  fileBtn?.addEventListener("click", () => fileInput.click());
  videoBtn?.addEventListener("click", () => videoInput.click());

  imageInput?.addEventListener("change", (e) => handleFileSelect(e, "image"));
  fileInput?.addEventListener("change", (e) => handleFileSelect(e, "file"));
  videoInput?.addEventListener("change", (e) => handleFileSelect(e, "video"));

  document
    .getElementById("closePreviewModal")
    ?.addEventListener("click", closePreviewModal);
  document
    .getElementById("cancelPreviewBtn")
    ?.addEventListener("click", closePreviewModal);
  document
    .getElementById("sendPreviewBtn")
    ?.addEventListener("click", sendFileMessage);

  console.log("✅ Système upload fichiers initialisé");
}

function handleFileSelect(event, type) {
  const files = event.target.files;
  if (!files.length) return;

  const file = files[0];

  if (file.size > CONFIG.MAX_FILE_SIZE) {
    showMessage(
      `Fichier trop volumineux (max ${formatFileSize(CONFIG.MAX_FILE_SIZE)})`,
      "error"
    );
    return;
  }

  if (type === "image" && !file.type.startsWith("image/")) {
    showMessage("Veuillez sélectionner une image valide", "error");
    return;
  }

  if (type === "video" && !file.type.startsWith("video/")) {
    showMessage("Veuillez sélectionner une vidéo valide", "error");
    return;
  }

  state.pendingFiles = [
    {
      file: file,
      type: type,
      previewUrl: URL.createObjectURL(file),
    },
  ];

  showPreviewModal(state.pendingFiles[0]);
  event.target.value = "";
}

function showPreviewModal(fileData) {
  const previewContent = document.getElementById("previewContent");
  const modal = document.getElementById("previewModal");

  let content = "";

  switch (fileData.type) {
    case "image":
      content = `<img src="${fileData.previewUrl}" alt="Prévisualisation">`;
      break;
    case "video":
      content = `<video controls><source src="${fileData.previewUrl}" type="${fileData.file.type}"></video>`;
      break;
    case "audio":
      content = `
                <div class="audio-preview-large">
                    <div class="audio-icon">🎵</div>
                    <div class="audio-info">
                        <div class="audio-name">${fileData.file.name}</div>
                        <div class="audio-size">${formatFileSize(
                          fileData.file.size
                        )}</div>
                        <div class="audio-type">Fichier audio</div>
                    </div>
                    <audio controls class="audio-player">
                        <source src="${fileData.previewUrl}" type="${
        fileData.file.type
      }">
                        Votre navigateur ne supporte pas la lecture audio.
                    </audio>
                </div>
            `;
      break;
    case "file":
      content = `
                <div class="file-preview-large">
                    <div class="file-icon">📄</div>
                    <div class="file-info">
                        <div class="file-name">${fileData.file.name}</div>
                        <div class="file-size">${formatFileSize(
                          fileData.file.size
                        )}</div>
                        <div class="file-type">${
                          fileData.file.type || "Type inconnu"
                        }</div>
                    </div>
                </div>
            `;
      break;
  }

  previewContent.innerHTML = content;
  modal.style.display = "flex";
}

function closePreviewModal() {
  const modal = document.getElementById("previewModal");
  modal.style.display = "none";

  state.pendingFiles.forEach((fileData) => {
    if (fileData.previewUrl) {
      URL.revokeObjectURL(fileData.previewUrl);
    }
  });

  state.pendingFiles = [];
}

async function sendFileMessage() {
  if (!state.pendingFiles.length || !state.currentConversation) {
    showMessage("Aucun fichier à envoyer", "error");
    return;
  }

  const fileData = state.pendingFiles[0];
  const sendBtn = document.getElementById("sendPreviewBtn");
  const sendStatus = document.getElementById("sendStatus");

  try {
    setButtonLoading(sendBtn, true);
    sendStatus.textContent = "Envoi en cours...";

    const base64 = await fileToBase64(fileData.file);

    const messageData = {
      conversationId: state.currentConversation._id,
      Id_receiver: getOtherParticipantId(),
      file: base64,
      fileName: fileData.file.name,
      fileType: fileData.file.type,
      fileSize: fileData.file.size,
      originalName: fileData.file.name,
    };

    let eventName;
    switch (fileData.type) {
      case "image":
        eventName = "send_image_message";
        break;
      case "video":
        eventName = "send_video_message";
        break;
      case "audio":
        eventName = "send_audio_message";
        break;
      case "file":
        eventName = "send_file_message";
        break;
    }

    if (state.socket && state.isConnected) {
      state.socket.emit(eventName, messageData);
      sendStatus.textContent = "Envoi...";
      closePreviewModal();
      showMessage("Fichier en cours d'envoi...", "success");
    } else {
      closePreviewModal();
      showMessage(
        "WebSocket déconnecté - Recharge la page et réessaye",
        "error"
      );
    }
  } catch (error) {
    console.error("Send file error:", error);
    sendStatus.textContent = "❌ Erreur";
    showMessage("Erreur: " + error.message, "error");
  } finally {
    setButtonLoading(sendBtn, false);
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getOtherParticipantId() {
  if (!state.currentConversation || !state.currentConversation.participants)
    return null;

  const otherParticipant = state.currentConversation.participants.find(
    (p) => p._id !== state.user.id
  );

  return otherParticipant?._id || null;
}

async function loadInitialData() {
  showLoading(true);

  try {
    await Promise.all([loadConversations(), loadUnreadCounts()]);
    await loadAvailableReactions();
  } catch (error) {
    console.error("Error loading initial data:", error);
    showMessage("Erreur de chargement des données", "error");
  } finally {
    showLoading(false);
  }
}

async function loadConversations() {
  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/api/conversations`, {
      headers: { Authorization: `Bearer ${state.token}` },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      state.conversations = data.conversations || [];
      renderConversations();
    } else {
      throw new Error(data.error || "Erreur de chargement des conversations");
    }
  } catch (error) {
    console.error("Load conversations error:", error);
    throw error;
  }
}

function renderConversations() {
  const contactsList = document.getElementById("contactsList");
  const conversationsContainer =
    contactsList.querySelector(".contacts-list") || contactsList;

  const existingHeader =
    conversationsContainer.querySelector(".contacts-header");
  conversationsContainer.innerHTML = "";

  if (existingHeader) {
    conversationsContainer.appendChild(existingHeader);
  } else {
    const header = document.createElement("div");
    header.className = "contacts-header";
    header.innerHTML =
      '<h3>Conversations</h3><span class="unread-count" id="totalUnread">0</span>';
    conversationsContainer.appendChild(header);
  }

  if (state.conversations.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #666;">
                <p>Aucune conversation</p>
                <p style="font-size: 12px; margin-top: 10px;">Commencez une nouvelle discussion</p>
            </div>
        `;
    conversationsContainer.appendChild(emptyState);
    return;
  }

  const sortedConversations = state.conversations.sort((a, b) => {
    const dateA = new Date(a.lastMessageAt || a.createdAt);
    const dateB = new Date(b.lastMessageAt || b.createdAt);
    return dateB - dateA;
  });

  sortedConversations.forEach((conversation) => {
    const contactElement = createConversationElement(conversation);
    conversationsContainer.appendChild(contactElement);
  });
}

function createConversationElement(conversation) {
  const element = document.createElement("div");
  element.className = "contact";
  element.dataset.conversationId = conversation._id;

  const isGroup = conversation.type === "group";
  const displayName = conversation.name || "Conversation";
  const lastMessage = getLastMessagePreview(conversation);
  const unreadCount = conversation.unreadCount || 0;

  const avatarText = isGroup ? "👥" : displayName.charAt(0).toUpperCase();

  element.innerHTML = `
        <div class="contact-avatar online">${avatarText}</div>
        <div class="contact-info">
            <h3>${displayName} ${
    isGroup ? '<span class="group-badge">G</span>' : ""
  }</h3>
            <p class="last-message">${lastMessage}</p>
        </div>
        <div class="conversation-meta">
            <div class="conversation-time">${formatTime(
              conversation.lastMessageAt
            )}</div>
            ${
              unreadCount > 0
                ? `<div class="conversation-badge">${unreadCount}</div>`
                : ""
            }
        </div>
    `;

  element.addEventListener("click", () => selectConversation(conversation));

  return element;
}

function getLastMessagePreview(conversation) {
  if (!conversation.lastMessage) {
    return "Aucun message";
  }

  // 🎤 ADAPTÉ AU BACKEND : Détection améliorée des messages audio
  if (
    conversation.lastMessageType === "audio" ||
    conversation.lastMessage.includes("Message audio") ||
    (conversation.lastMessage.includes("res.cloudinary.com") &&
      (conversation.lastMessage.includes("/audio_messages/") ||
        conversation.lastMessage.includes(".mp3")))
  ) {
    return "🎤 Message audio";
  }
  if (conversation.lastMessageType === "image") {
    return "📷 Image";
  }
  if (conversation.lastMessageType === "video") {
    return "🎥 Vidéo";
  }
  if (conversation.lastMessageType === "file") {
    return "📁 Fichier";
  }

  return conversation.lastMessage.length > 30
    ? conversation.lastMessage.substring(0, 30) + "..."
    : conversation.lastMessage;
}

async function selectConversation(conversation) {
  if (state.isLoadingMessages) return;

  document
    .querySelectorAll(".contact")
    .forEach((c) => c.classList.remove("active"));
  document
    .querySelector(`[data-conversation-id="${conversation._id}"]`)
    .classList.add("active");

  state.currentConversation = conversation;

  updateChatHeader(conversation);

  document.getElementById("messageInputContainer").style.display = "flex";
  document.getElementById("welcomeMessage").style.display = "none";
  document.getElementById("messagesList").style.display = "block";

  await loadMessages(conversation._id);

  await markAsRead(conversation._id);

  if (state.socket) {
    state.socket.emit("join_conversation", conversation._id);
  }
}

function updateChatHeader(conversation) {
  const isGroup = conversation.type === "group";
  const displayName = conversation.name || "Conversation";

  document.getElementById("chatHeader").style.display = "flex";
  document.getElementById("chatContactName").textContent = displayName;
  document.getElementById("chatAvatar").textContent = isGroup
    ? "👥"
    : displayName.charAt(0).toUpperCase();
  document.getElementById(
    "chatAvatar"
  ).className = `chat-contact-avatar online`;
  document.getElementById("chatContactStatus").textContent = isGroup
    ? `Groupe • ${conversation.participantCount || 0} membres`
    : "🟢 En ligne";
}

async function loadMessages(conversationId, showLoader = true) {
  if (state.isLoadingMessages && !showLoader) {
    return;
  }

  state.isLoadingMessages = true;

  if (showLoader) {
    showMessageLoading(true);
  }

  try {
    console.log(
      "📨 Chargement des messages pour la conversation:",
      conversationId
    );

    const response = await fetch(
      `${CONFIG.BACKEND_URL}/api/messages/${conversationId}?limit=100`,
      {
        headers: { Authorization: `Bearer ${state.token}` },
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      console.log("✅ Messages reçus de l'API:", data.messages.length);

      // 🎤 ADAPTATION : Vérifier la structure des messages audio
      const processedMessages = data.messages.map((message) => {
        // Si c'est un message audio mais que content est du texte, utiliser audioUrl
        if (
          message.typeMessage === "audio" &&
          message.audioUrl &&
          message.content.includes("Message audio")
        ) {
          return {
            ...message,
            content: message.audioUrl, // Remplacer par l'URL audio réelle
          };
        }
        return message;
      });

      const sortedMessages = processedMessages.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.timestamp || a.date);
        const dateB = new Date(b.createdAt || b.timestamp || b.date);
        return dateA - dateB;
      });

      state.messages.set(conversationId, sortedMessages);
      renderMessages(conversationId);
    } else {
      throw new Error(data.error || "Erreur de chargement des messages");
    }
  } catch (error) {
    console.error("Load messages error:", error);
    showMessage("Erreur de chargement des messages", "error");
  } finally {
    state.isLoadingMessages = false;
    if (showLoader) {
      showMessageLoading(false);
    }
  }
}

function renderMessages(conversationId) {
  const messagesList = document.getElementById("messagesList");
  const messages = state.messages.get(conversationId) || [];

  console.log(
    "🔍 Affichage de",
    messages.length,
    "messages dans l'ordre chronologique"
  );

  messagesList.innerHTML = "";

  if (messages.length === 0) {
    messagesList.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <p>Aucun message</p>
                <p style="font-size: 12px; margin-top: 10px;">Envoyez le premier message !</p>
            </div>
        `;
    return;
  }

  messages.forEach((message) => {
    const messageElement = createMessageElement(message);
    messagesList.appendChild(messageElement);
  });

  scrollToBottom();
}

function createMessageElement(message) {
  const element = document.createElement("div");
  const isSent = isMyMessage(message);

  console.log(
    `🎯 Création message: "${message.content?.substring(0, 50)}..." - type: ${
      message.typeMessage
    } - estDeMoi: ${isSent}`,
    message
  );

  element.className = `message ${isSent ? "sent" : "received"} ${
    message.typeMessage
  }-message`;
  element.dataset.messageId = message._id;

  const time = formatMessageTimeRobuste(message);
  const statusIcon = isSent ? (message.status === "seen" ? "✓✓" : "✓") : "";

  let contentHtml = "";

  // 🎤 ADAPTÉ AU BACKEND : Gestion des messages audio
  if (
    message.typeMessage === "audio" ||
    (message.content &&
      message.content.includes("res.cloudinary.com") &&
      message.content.includes("/audio_messages/")) ||
    message.audioUrl
  ) {
    console.log("🎵 Message audio détecté - Structure:", message);

    // 🎯 DÉTERMINER LA BONNE URL AUDIO
    let audioUrl = message.audioUrl || message.content;
    let audioDuration =
      message.audioDuration || message.fileInfo?.audioDuration || "0:09";

    // 🎯 CORRECTION CLOUDINARY : S'assurer que c'est une URL valide
    if (audioUrl && audioUrl.includes("res.cloudinary.com")) {
      // Vérifier que c'est bien une URL raw/upload pour les fichiers audio
      if (audioUrl.includes("/image/upload/")) {
        audioUrl = audioUrl.replace("/image/upload/", "/raw/upload/");
      }
      // Ajouter des paramètres pour forcer le téléchargement si nécessaire
      if (!audioUrl.includes("fl_attachment")) {
        audioUrl += (audioUrl.includes("?") ? "&" : "?") + "fl_attachment";
      }
    }

    console.log("🔊 URL audio finale:", audioUrl);

    if (audioUrl && audioUrl.includes("http")) {
      contentHtml = `
                <div class="message-content">
                    <div class="audio-message">
                        <div class="audio-icon">${isSent ? "🎤" : "🎵"}</div>
                        <div class="audio-info">
                            <div class="audio-name">${
                              isSent ? "Votre message audio" : "Message audio"
                            }</div>
                            <div class="audio-duration">${formatAudioDuration(
                              audioDuration
                            )}</div>
                        </div>
                        <audio controls class="audio-player" preload="metadata">
                            <source src="${audioUrl}" type="audio/webm">
                            <source src="${audioUrl}" type="audio/mpeg">
                            <source src="${audioUrl}" type="audio/wav">
                            Votre navigateur ne supporte pas la lecture audio.
                        </audio>
                    </div>
                </div>
            `;
    } else {
      // Fallback si pas d'URL valide
      contentHtml = `
                <div class="message-content">
                    <div class="audio-message">
                        <div class="audio-icon">🔇</div>
                        <div class="audio-info">
                            <div class="audio-name">Message audio</div>
                            <div class="audio-duration">${formatAudioDuration(
                              audioDuration
                            )}</div>
                            <div class="audio-error" style="font-size: 11px; color: #ff4444;">
                                ${
                                  audioUrl
                                    ? "Fichier en cours de traitement..."
                                    : "Fichier non disponible"
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;
    }
  } else {
    // Gestion des autres types de messages
    switch (message.typeMessage) {
      case "image":
        contentHtml = `
                    <div class="message-content">
                        <img src="${message.content}" alt="Image partagée" onclick="openImageModal('${message.content}')">
                    </div>
                `;
        break;

      case "video":
        contentHtml = `
                    <div class="message-content">
                        <video controls onclick="this.paused ? this.play() : this.pause()">
                            <source src="${message.content}" type="video/mp4">
                            Votre navigateur ne supporte pas la lecture vidéo.
                        </video>
                    </div>
                `;
        break;

      case "file":
        const fileName =
          message.fileInfo?.fileName ||
          message.content.split("/").pop() ||
          "Fichier";
        const fileSize = message.fileInfo?.fileSize
          ? formatFileSize(message.fileInfo.fileSize)
          : "";
        contentHtml = `
                    <div class="message-content">
                        <div class="file-message">
                            <div class="file-icon">📄</div>
                            <div class="file-info">
                                <div class="file-name">${fileName}</div>
                                ${
                                  fileSize
                                    ? `<div class="file-size">${fileSize}</div>`
                                    : ""
                                }
                            </div>
                            <a href="${
                              message.content
                            }" download="${fileName}" class="download-btn">
                                Télécharger
                            </a>
                        </div>
                    </div>
                `;
        break;

      default:
        contentHtml = `
                    <div class="message-content">${escapeHtml(
                      message.content
                    )}</div>
                `;
    }
  }

  element.innerHTML = `
        ${contentHtml}
        <div class="message-time">${time} ${statusIcon}</div>
    `;

  // 🆕 ACTIVATION DU CLIC LONG POUR LE MENU CONTEXTUEL
  element.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    showMessageContextMenu(e, element);
  });

  // 🆕 CLIC LONG SUR MOBILE
  let pressTimer;
  element.addEventListener("mousedown", function (e) {
    pressTimer = setTimeout(() => {
      showMessageContextMenu(e, element);
    }, 500);
  });

  element.addEventListener("mouseup", function () {
    clearTimeout(pressTimer);
  });

  element.addEventListener("mouseleave", function () {
    clearTimeout(pressTimer);
  });

  return element;
}

// 🎤 FORMATER LA DURÉE AUDIO
function formatAudioDuration(duration) {
  if (!duration) return "0:00";

  if (typeof duration === "number") {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  if (typeof duration === "string") {
    // Si c'est déjà au format "X:XX"
    if (duration.match(/^\d+:\d{2}$/)) {
      return duration;
    }

    // Si c'est en secondes
    const seconds = parseInt(duration);
    if (!isNaN(seconds)) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    }
  }

  return "0:00";
}

function openImageModal(imageUrl) {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.style.display = "flex";
  modal.innerHTML = `
        <div class="modal-content" style="max-width: 90vw; max-height: 90vh; background: transparent; border: none;">
            <div class="modal-header" style="justify-content: flex-end; background: transparent;">
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
            </div>
            <div class="modal-body" style="padding: 0; display: flex; justify-content: center; align-items: center; background: transparent;">
                <img src="${imageUrl}" style="max-width: 100%; max-height: 80vh; border-radius: 12px;">
            </div>
        </div>
    `;

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  document.body.appendChild(modal);
}

function isMyMessage(message) {
  if (!message || !state.user) {
    console.log("❌ Message ou user manquant");
    return false;
  }

  let senderId;

  if (typeof message.Id_sender === "string") {
    senderId = message.Id_sender;
  } else if (message.Id_sender && message.Id_sender._id) {
    senderId = message.Id_sender._id.toString();
  } else if (message.Id_sender && typeof message.Id_sender === "object") {
    senderId = message.Id_sender.toString();
  } else {
    senderId = message.senderId || null;
  }

  const myId = state.user.id || state.user._id;

  if (!senderId || !myId) {
    console.log("❌ ID manquant - senderId:", senderId, "myId:", myId);
    return false;
  }

  return senderId === myId;
}

function formatMessageTimeRobuste(message) {
  const dateString =
    message.createdAt ||
    message.timestamp ||
    message.date ||
    message.created_at;

  if (!dateString) {
    console.log("❌ Aucune date trouvée pour le message:", message._id);
    return "--:--";
  }

  try {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      console.log("❌ Date invalide:", dateString);
      return "--:--";
    }

    const timeString = date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return timeString;
  } catch (error) {
    console.error("❌ Erreur formatage date:", error, "Date:", dateString);
    return "--:--";
  }
}

function initMessageInput() {
  const messageInput = document.getElementById("messageInput");
  const sendButton = document.getElementById("sendButton");
  let typingTimer;

  messageInput.addEventListener("input", () => {
    if (state.currentConversation && state.socket) {
      state.socket.emit("user_typing", {
        conversationId: state.currentConversation._id,
        isTyping: true,
      });

      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        if (state.socket) {
          state.socket.emit("user_typing", {
            conversationId: state.currentConversation._id,
            isTyping: false,
          });
        }
      }, 1000);
    }
  });

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendButton.addEventListener("click", sendMessage);
}

async function sendMessage() {
  const messageInput = document.getElementById("messageInput");
  const content = messageInput.value.trim();

  if (!content || !state.currentConversation) return;

  // 🆕 PROTECTION ANTI-DOUBLE CLIC
  if (state.isSendingMessage) {
    console.log("🚫 Message déjà en cours d'envoi - bloqué");
    return;
  }

  state.isSendingMessage = true;

  const sendButton = document.getElementById("sendButton");
  const sendStatus = document.getElementById("sendStatus");

  try {
    setButtonLoading(sendButton, true);
    sendStatus.textContent = "Envoi...";

    console.log("🎯 ENVOI TEMPS RÉEL WebSocket");

    // 🆕 VÉRIFICATION RENFORCÉE WEBSOCKET
    if (!state.socket) {
      throw new Error("WebSocket non initialisé");
    }

    if (!state.isConnected) {
      // 🆕 TENTATIVE DE RECONNEXION AUTOMATIQUE
      console.log("🔄 Tentative de reconnexion WebSocket...");
      state.socket.connect();

      // Attendre un peu pour la reconnexion
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (!state.socket.connected) {
        throw new Error("WebSocket toujours déconnecté après reconnexion");
      }
    }

    // 🎯 ENVOI PAR WEBSOCKET UNIQUEMENT
    console.log("📤 Émission WebSocket:", {
      conversationId: state.currentConversation._id,
      content: content.substring(0, 50) + "...",
    });

    state.socket.emit("send_message", {
      conversationId: state.currentConversation._id,
      content: content,
      typeMessage: "text",
    });

    // Vide immédiatement le champ
    messageInput.value = "";
    sendStatus.textContent = "Envoi en cours...";

    // 🆕 TIMEOUT DE SÉCURITÉ
    setTimeout(() => {
      if (sendStatus.textContent === "Envoi en cours...") {
        sendStatus.textContent = "✓ Envoyé (temps réel)";
      }
    }, 2000);
  } catch (error) {
    console.error("❌ Erreur envoi WebSocket:", error);
    sendStatus.textContent = "❌ Erreur WebSocket";
    showMessage("WebSocket déconnecté - Rechargez la page", "error");
    // Remet le contenu pour réessayer
    messageInput.value = content;
  } finally {
    setButtonLoading(sendButton, false);
    state.isSendingMessage = false;
  }
}

function scrollToBottom() {
  const messagesContainer = document.getElementById("messagesContainer");
  setTimeout(() => {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }, 100);
}

// ===== WEBSOCKET =====
function initWebSocket() {
  if (!state.token) return;

  try {
    if (typeof io !== "undefined") {
      connectSocketIO();
    } else {
      console.warn("Socket.IO not available, using fallback");
    }
  } catch (error) {
    console.error("WebSocket initialization error:", error);
  }
}

function connectSocketIO() {
  state.socket = io(CONFIG.SOCKET_URL, {
    auth: { token: state.token },
    transports: ["websocket", "polling"],
  });

  state.socket.on("connect", () => {
    console.log("🔗 WebSocket connected");
    state.isConnected = true;
    state.reconnectAttempts = 0;
    updateConnectionStatus("🟢 Connecté");

    state.socket.emit("join_notifications");
    if (state.currentConversation) {
      state.socket.emit("join_conversation", state.currentConversation._id);
    }
  });

  state.socket.on("disconnect", (reason) => {
    console.log("🔴 WebSocket disconnected:", reason);
    state.isConnected = false;
    updateConnectionStatus("🔴 Déconnecté");

    if (reason === "io server disconnect") {
      setTimeout(() => {
        state.socket.connect();
      }, CONFIG.RECONNECT_DELAY);
    }
  });

  state.socket.on("connect_error", (error) => {
    console.error("WebSocket connection error:", error);
    updateConnectionStatus("🔴 Erreur connexion");

    state.reconnectAttempts++;
    if (state.reconnectAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
      setTimeout(() => {
        state.socket.connect();
      }, CONFIG.RECONNECT_DELAY * state.reconnectAttempts);
    }
  });

  // ==== GESTIONNAIRES DE MESSAGES ====
  state.socket.on("new_message", (data) => {
    console.log("🔔 [STRUCTURE BACKEND] Message reçu:", data);

    // 🎯 ADAPTATION À LA STRUCTURE BACKEND
    const message = {
      _id: data._id || data.messageId,
      conversationId: data.conversationId,
      Id_sender: data.Id_sender, // ✅ Structure backend
      senderId: data.Id_sender, // ✅ Compatibilité frontend
      content: data.content,
      typeMessage: data.typeMessage,
      status: data.status || "sent",
      timestamp: data.timestamp || new Date(),
      createdAt: data.createdAt || data.timestamp || new Date(),

      // 🎯 Support des fichiers multimédias
      ...(data.imageInfo && { imageInfo: data.imageInfo }),
      ...(data.fileInfo && { fileInfo: data.fileInfo }),
      ...(data.videoInfo && { videoInfo: data.videoInfo }),
    };

    console.log("🔄 Message adapté pour le frontend:", message);
    handleNewMessage(message);
  });

  // 🆕 GESTIONNAIRES WEBSOCKET POUR LE TRANSFERT
  state.socket.on("forward_success", (data) => {
    console.log("✅ Transfert réussi:", data);
    showMessage("✓ Message transféré avec succès!", "success");

    // Optionnel : recharger les conversations pour voir le message transféré
    if (data.targetConversationId === state.currentConversation?._id) {
      loadMessages(state.currentConversation._id, false);
    }
  });

  state.socket.on("forward_error", (data) => {
    console.error("❌ Erreur de transfert:", data);
    showMessage(
      "Erreur de transfert: " + (data.error || "Échec du transfert"),
      "error"
    );
  });

  // 🆕 GESTIONNAIRES WEBSOCKET POUR L'ARCHIVAGE
  state.socket.on("conversation_archived_update", (data) => {
    console.log("🔄 Mise à jour archivage:", data);

    if (data.type === "archived") {
      showMessage("✅ Conversation archivée", "success");
    } else if (data.type === "unarchived") {
      showMessage("✅ Conversation désarchivée", "success");
    }

    // Recharger les conversations
    loadConversations();
  });

  state.socket.on("archived_conversations_data", (data) => {
    console.log(
      "📁 Conversations archivées reçues:",
      data.conversations?.length
    );
    state.archivedConversations = data.conversations || [];
    renderArchivedConversations();
    updateArchivedCount();
  });

  state.socket.on("archived_count_data", (data) => {
    console.log("📊 Compteur archives:", data.archivedCount);
    updateArchivedCountDisplay(data.archivedCount);
  });

  // 🎤 ÉVÉNEMENTS AUDIO ADAPTÉS
  state.socket.on("audio_message_sent", (data) => {
    console.log("✅ Audio sent confirmation:", data);
    handleFileMessageSent(data);
  });

  state.socket.on("audio_message_error", (data) => {
    console.error("❌ Audio send error:", data);
    showMessage("Erreur d'envoi de l'audio: " + data.error, "error");
  });

  state.socket.on("new_audio_message", (data) => {
    console.log("🔊 Nouveau message audio en temps réel:", data);
    handleNewMessage(data.message);
  });

  state.socket.on("reaction_added", (data) => {
    console.log("❤️ Réaction ajoutée:", data);
    handleReactionAdded(data);
  });

  state.socket.on("reaction_removed", (data) => {
    console.log("🗑️ Réaction supprimée:", data);
    handleReactionRemoved(data);
  });

  state.socket.on("reaction_error", (data) => {
    console.error("❌ Erreur réaction:", data);
    showMessage(data.error || "Erreur avec la réaction", "error");
  });

  state.socket.on("image_message_sent", (data) => {
    console.log("✅ Image sent confirmation:", data);
    handleFileMessageSent(data);
  });

  state.socket.on("file_message_sent", (data) => {
    console.log("✅ File sent confirmation:", data);
    handleFileMessageSent(data);
  });

  state.socket.on("video_message_sent", (data) => {
    console.log("✅ Video sent confirmation:", data);
    handleFileMessageSent(data);
  });

  state.socket.on("image_message_error", (data) => {
    console.error("❌ Image send error:", data);
    showMessage("Erreur d'envoi de l'image: " + data.error, "error");
  });

  state.socket.on("file_message_error", (data) => {
    console.error("❌ File send error:", data);
    showMessage("Erreur d'envoi du fichier: " + data.error, "error");
  });

  state.socket.on("video_message_error", (data) => {
    console.error("❌ Video send error:", data);
    showMessage("Erreur d'envoi de la vidéo: " + data.error, "error");
  });

  state.socket.on("user_typing", (data) => {
    handleTypingIndicator(data);
  });

  state.socket.on("message_sent", (data) => {
    console.log("✅ Message sent confirmation:", data);
    updateMessageStatus(data.data._id, "sent");
  });

  state.socket.on("message_error", (data) => {
    console.error("❌ Message error:", data);
    showMessage("Erreur d'envoi du message", "error");
  });
}

function handleReactionAdded(data) {
  if (state.currentConversation && data.messageId) {
    loadMessages(state.currentConversation._id, false);
  }
}

function handleReactionRemoved(data) {
  if (state.currentConversation && data.messageId) {
    loadMessages(state.currentConversation._id, false);
  }
}

function handleFileMessageSent(data) {
  if (data.success && state.currentConversation) {
    loadMessages(state.currentConversation._id, false);
    showMessage("Fichier envoyé avec succès!", "success");
  }
}

function handleNewMessage(message) {
  console.log("📨 Nouveau message reçu:", message);

  // 🎯 Mettre à jour la dernière conversation
  updateConversationLastMessage(message.conversationId, message);

  // 🎯 Mettre à jour les badges de notification
  if (
    !state.currentConversation ||
    message.conversationId !== state.currentConversation._id
  ) {
    updateConversationBadge(message.conversationId);

    let preview = message.content;
    if (message.typeMessage === "image") preview = "📷 Image";
    if (message.typeMessage === "video") preview = "🎥 Vidéo";
    if (message.typeMessage === "file") preview = "📁 Fichier";
    if (message.typeMessage === "audio") preview = "🎤 Message audio";

    showNotification({
      type: "new_message",
      conversationId: message.conversationId,
      senderName: message.Id_sender?.username || "Quelqu'un",
      messagePreview: preview,
    });
  }

  // 🎯 SI c'est la conversation active, recharger les messages UNE FOIS
  if (
    state.currentConversation &&
    message.conversationId === state.currentConversation._id
  ) {
    // ⛔ NE PAS ajouter manuellement le message
    // ✅ Laisser le rechargement naturel se faire
    markAsRead(state.currentConversation._id);

    // Optionnel : recharger les messages après un court délai
    setTimeout(() => {
      loadMessages(state.currentConversation._id, false);
    }, 100);
  }
}

function handleTypingIndicator(data) {
  const typingIndicator = document.getElementById("typingIndicator");
  const typingText = document.getElementById("typingText");

  if (data.isTyping) {
    state.typingUsers.set(data.userId, {
      userName: data.userName,
      timestamp: Date.now(),
    });

    const typingUsers = Array.from(state.typingUsers.values()).map(
      (u) => u.userName
    );
    typingText.textContent = `${typingUsers.join(", ")} ${
      typingUsers.length === 1 ? "est" : "sont"
    } en train d'écrire...`;
    typingIndicator.style.display = "flex";
  } else {
    state.typingUsers.delete(data.userId);

    if (state.typingUsers.size === 0) {
      typingIndicator.style.display = "none";
    } else {
      const typingUsers = Array.from(state.typingUsers.values()).map(
        (u) => u.userName
      );
      typingText.textContent = `${typingUsers.join(", ")} ${
        typingUsers.length === 1 ? "est" : "sont"
      } en train d'écrire...`;
    }
  }

  const now = Date.now();
  state.typingUsers.forEach((value, key) => {
    if (now - value.timestamp > 5000) {
      state.typingUsers.delete(key);
    }
  });
}

// ===== FONCTIONNALITÉS AVANCÉES =====
function initTestButtons() {
  document.getElementById("testNotifBtn")?.addEventListener("click", () => {
    showTestNotification();
  });

  document
    .getElementById("notifPermissionBtn")
    ?.addEventListener("click", () => {
      requestNotificationPermission();
    });

  document
    .getElementById("newConversationBtn")
    ?.addEventListener("click", () => {
      showNewConversationModal();
    });

  document.getElementById("createGroupBtn")?.addEventListener("click", () => {
    showCreateGroupModal();
  });
}

function initModals() {
  document
    .getElementById("closeConversationModal")
    ?.addEventListener("click", () => {
      document.getElementById("newConversationModal").style.display = "none";
    });

  document.getElementById("closeGroupModal")?.addEventListener("click", () => {
    document.getElementById("createGroupModal").style.display = "none";
  });

  document.querySelectorAll(".modal-overlay").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.style.display = "none";
      }
    });
  });
}

function initGroupCreation() {
  const searchInput = document.getElementById("searchMemberInput");
  const createBtn = document.getElementById("createGroupConfirmBtn");

  searchInput?.addEventListener("input", handleUserSearch);
  createBtn?.addEventListener("click", createGroup);
}

async function handleUserSearch(event) {
  const searchTerm = event.target.value.trim();
  const resultsContainer = document.getElementById("searchMemberResults");

  if (searchTerm.length < 2) {
    resultsContainer.style.display = "none";
    return;
  }

  try {
    const response = await fetch(
      `${CONFIG.BACKEND_URL}/api/users/search?q=${encodeURIComponent(
        searchTerm
      )}`,
      {
        headers: { Authorization: `Bearer ${state.token}` },
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      displaySearchResults(data.users);
    } else {
      showMessage(data.message || "Aucun utilisateur trouvé", "info");
      resultsContainer.innerHTML =
        '<div style="padding: 10px; color: #666; text-align: center;">Aucun utilisateur trouvé</div>';
      resultsContainer.style.display = "block";
    }
  } catch (error) {
    console.error("❌ Erreur recherche BDD:", error);
    showMessage(
      "Erreur de recherche - Vérifie que la route API existe",
      "error"
    );
    resultsContainer.innerHTML =
      '<div style="padding: 10px; color: #ff4444; text-align: center;">Erreur de recherche</div>';
    resultsContainer.style.display = "block";
  }
}

function displaySearchResults(users) {
  const resultsContainer = document.getElementById("searchMemberResults");

  if (users.length === 0) {
    resultsContainer.innerHTML =
      '<div style="padding: 10px; color: #666; text-align: center;">Aucun utilisateur trouvé</div>';
    resultsContainer.style.display = "block";
    return;
  }

  resultsContainer.innerHTML = users
    .map(
      (user) => `
        <div class="user-result" data-user-id="${
          user._id
        }" style="display: flex; justify-content: between; align-items: center; padding: 10px; border-bottom: 1px solid #333; cursor: pointer;">
            <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <div class="user-avatar" style="width: 30px; height: 30px; border-radius: 50%; background: #f9ee34; color: #1c1c1c; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                    ${user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div style="font-weight: bold; color: #f9ee34;">${
                      user.username
                    }</div>
                    <div style="font-size: 11px; color: #ffeca2;">${
                      user.email
                    }</div>
                </div>
            </div>
            <button class="add-user-btn" style="background: #f9ee34; color: #1c1c1c; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-weight: bold;">
                +
            </button>
        </div>
    `
    )
    .join("");

  resultsContainer.style.display = "block";

  resultsContainer.querySelectorAll(".add-user-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const userElement = btn.closest(".user-result");
      const userId = userElement.dataset.userId;
      const username = userElement.querySelector(
        "div > div:first-child"
      ).textContent;
      addUserToGroup(userId, username);
    });
  });

  resultsContainer.querySelectorAll(".user-result").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (!e.target.classList.contains("add-user-btn")) {
        const userId = row.dataset.userId;
        const username = row.querySelector("div > div:first-child").textContent;
        addUserToGroup(userId, username);
      }
    });
  });
}

function addUserToGroup(userId, username) {
  const selectedList = document.getElementById("selectedMembersList");
  const selectedCount = document.getElementById("selectedCount");

  if (selectedList.querySelector(`[data-user-id="${userId}"]`)) {
    showMessage(`${username} est déjà dans le groupe`, "info");
    return;
  }

  if (
    selectedList.children.length === 1 &&
    selectedList.children[0].style.color === "rgb(102, 102, 102)"
  ) {
    selectedList.innerHTML = "";
  }

  const memberElement = document.createElement("div");
  memberElement.className = "member-item";
  memberElement.dataset.userId = userId;
  memberElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; background: #252525; border-radius: 6px; margin: 5px 0;">
            <span style="color: #f9ee34;">${username}</span>
            <button class="remove-user-btn" style="background: #ff4444; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; cursor: pointer; font-size: 12px;">
                ×
            </button>
        </div>
    `;

  memberElement
    .querySelector(".remove-user-btn")
    .addEventListener("click", () => {
      memberElement.remove();
      updateSelectedCount();

      if (selectedList.children.length === 0) {
        selectedList.innerHTML =
          '<div style="color: #666; text-align: center; font-size: 12px;">Aucun membre sélectionné</div>';
      }
    });

  selectedList.appendChild(memberElement);
  updateSelectedCount();

  document.getElementById("searchMemberResults").style.display = "none";
  document.getElementById("searchMemberInput").value = "";

  showMessage(`${username} ajouté au groupe!`, "success");
}

function updateSelectedCount() {
  const selectedCount = document.getElementById("selectedCount");
  const members = document.querySelectorAll(
    "#selectedMembersList .member-item"
  );
  selectedCount.textContent = members.length;
}

async function createGroup() {
  const groupName = document.getElementById("groupNameInput").value.trim();
  const selectedMembers = Array.from(
    document.querySelectorAll("#selectedMembersList .member-item")
  ).map((item) => item.dataset.userId);

  if (!groupName) {
    showMessage("Donne un nom à ton groupe!", "error");
    return;
  }

  if (selectedMembers.length < 2) {
    showMessage("Ajoute au moins 2 membres pour créer un groupe!", "error");
    return;
  }

  try {
    showMessage("Création du groupe en cours...", "info");

    const response = await fetch(
      `${CONFIG.BACKEND_URL}/api/conversations/groups/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.token}`,
        },
        body: JSON.stringify({
          groupName: groupName,
          participantIds: selectedMembers,
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      showMessage(
        `✅ Groupe "${groupName}" créé avec ${selectedMembers.length} membres!`,
        "success"
      );

      document.getElementById("createGroupModal").style.display = "none";

      document.getElementById("groupNameInput").value = "";
      document.getElementById("selectedMembersList").innerHTML =
        '<div style="color: #666; text-align: center; font-size: 12px;">Aucun membre sélectionné</div>';
      document.getElementById("selectedCount").textContent = "0";
      document.getElementById("searchMemberResults").style.display = "none";
      document.getElementById("searchMemberInput").value = "";

      await loadConversations();
    } else {
      throw new Error(data.error || data.message || "Erreur de création");
    }
  } catch (error) {
    console.error("❌ Erreur création groupe:", error);
    showMessage(`Erreur: ${error.message}`, "error");
  }
}

function showNewConversationModal() {
  document.getElementById("newConversationModal").style.display = "flex";
}

function showCreateGroupModal() {
  document.getElementById("createGroupModal").style.display = "flex";
}

async function markAsRead(conversationId) {
  try {
    await fetch(
      `${CONFIG.BACKEND_URL}/api/conversations/mark-as-read/${conversationId}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${state.token}` },
      }
    );

    updateConversationBadge(conversationId, 0);
  } catch (error) {
    console.error("Mark as read error:", error);
  }
}

async function loadUnreadCounts() {
  try {
    const response = await fetch(
      `${CONFIG.BACKEND_URL}/api/conversations/unread-counts/${state.user.id}`,
      {
        headers: { Authorization: `Bearer ${state.token}` },
      }
    );

    const data = await response.json();

    if (response.ok && data.success) {
      data.conversationCounts.forEach((item) => {
        updateConversationBadge(item.conversationId, item.unreadCount);
      });

      document.getElementById("totalUnread").textContent = data.totalUnread;
    }
  } catch (error) {
    console.error("Load unread counts error:", error);
  }
}

function updateConversationBadge(conversationId, count = null) {
  const conversationElement = document.querySelector(
    `[data-conversation-id="${conversationId}"]`
  );
  if (conversationElement) {
    const badge = conversationElement.querySelector(".conversation-badge");
    const meta = conversationElement.querySelector(".conversation-meta");

    if (count === null || count > 0) {
      if (badge) {
        const currentCount = parseInt(badge.textContent) || 0;
        count = currentCount + 1;
        badge.textContent = count;
      } else {
        count = count || 1;
        if (!badge && meta) {
          const newBadge = document.createElement("div");
          newBadge.className = "conversation-badge";
          newBadge.textContent = count;
          meta.appendChild(newBadge);
        }
      }
    } else if (badge) {
      badge.remove();
    }

    updateTotalUnreadCount();
  }
}

function updateTotalUnreadCount() {
  const total = Array.from(
    document.querySelectorAll(".conversation-badge")
  ).reduce((sum, badge) => sum + parseInt(badge.textContent), 0);

  document.getElementById("totalUnread").textContent = total;

  const notificationBadge = document.getElementById("notificationBadge");
  if (total > 0) {
    notificationBadge.textContent = total;
    notificationBadge.style.display = "flex";
  } else {
    notificationBadge.style.display = "none";
  }
}

function updateConversationLastMessage(conversationId, message) {
  const conversationElement = document.querySelector(
    `[data-conversation-id="${conversationId}"]`
  );
  if (conversationElement) {
    const lastMessageElement =
      conversationElement.querySelector(".contact-info p");
    const timeElement = conversationElement.querySelector(".conversation-time");

    if (lastMessageElement) {
      let preview = message.content;
      if (message.typeMessage === "image") preview = "📷 Image";
      if (message.typeMessage === "video") preview = "🎥 Vidéo";
      if (message.typeMessage === "file") preview = "📁 Fichier";
      if (message.typeMessage === "audio") preview = "🎤 Message audio";

      lastMessageElement.textContent =
        preview.length > 30 ? preview.substring(0, 30) + "..." : preview;
    }

    if (timeElement) {
      timeElement.textContent = formatTime(message.createdAt);
    }

    const contactsList = document.getElementById("contactsList");
    const conversationsContainer =
      contactsList.querySelector(".contacts-list") || contactsList;

    conversationElement.remove();
    const header = conversationsContainer.querySelector(".contacts-header");
    conversationsContainer.insertBefore(
      conversationElement,
      header.nextSibling
    );
  }
}

// ===== NOTIFICATIONS =====
function showTestNotification() {
  showNotification({
    type: "test",
    title: "Test de notification",
    content: "Ceci est une notification de test depuis Owly!",
    senderName: "Système",
  });
}

function showNotification(data) {
  const notificationPopup = document.getElementById("notificationPopup");
  const notificationTitle = document.getElementById("notificationTitle");
  const notificationContent = document.getElementById("notificationContent");

  if (data.type === "new_message") {
    notificationTitle.textContent = "Nouveau message";
    notificationContent.innerHTML = `<strong>${data.senderName}</strong>: ${data.messagePreview}`;
  } else {
    notificationTitle.textContent = data.title || "Notification";
    notificationContent.textContent = data.content || "Nouvelle notification";
  }

  notificationPopup.style.display = "block";

  const replyBtn = document.getElementById("notificationReplyBtn");
  const openBtn = document.getElementById("notificationOpenBtn");

  replyBtn.onclick = () => {
    if (data.conversationId) {
      const conversation = state.conversations.find(
        (c) => c._id === data.conversationId
      );
      if (conversation) {
        selectConversation(conversation);
      }
      notificationPopup.style.display = "none";
    }
  };

  openBtn.onclick = () => {
    if (data.conversationId) {
      const conversation = state.conversations.find(
        (c) => c._id === data.conversationId
      );
      if (conversation) {
        selectConversation(conversation);
      }
    }
    notificationPopup.style.display = "none";
  };

  document.getElementById("closeNotification").onclick = () => {
    notificationPopup.style.display = "none";
  };

  setTimeout(() => {
    if (notificationPopup.style.display !== "none") {
      notificationPopup.style.display = "none";
    }
  }, 5000);
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    alert("Votre navigateur ne supporte pas les notifications");
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    state.notificationPermission = permission;

    if (permission === "granted") {
      showMessage("Notifications activées!", "success");
      document.getElementById("notifPermissionBtn").classList.add("hidden");
    } else {
      showMessage("Notifications bloquées", "error");
    }
  } catch (error) {
    console.error("Notification permission error:", error);
    showMessage("Erreur d'activation des notifications", "error");
  }
}

// ===== UTILITAIRES =====
function setButtonLoading(button, isLoading) {
  const btnText = button.querySelector(".btn-text");
  const btnLoading = button.querySelector(".btn-loading");

  if (btnText && btnLoading) {
    btnText.classList.toggle("hidden", isLoading);
    btnLoading.classList.toggle("hidden", !isLoading);
  }

  button.disabled = isLoading;
}

function showLoading(show) {
  const overlay = document.getElementById("loadingOverlay");
  if (overlay) {
    overlay.style.display = show ? "flex" : "none";
  }
}

function showMessageLoading(show) {
  const messagesList = document.getElementById("messagesList");
  if (!messagesList) return;

  if (show) {
    const loader = document.createElement("div");
    loader.className = "message-loader";
    loader.innerHTML =
      '<div class="loading-spinner"></div><span>Chargement des messages...</span>';
    loader.id = "messageLoader";
    messagesList.appendChild(loader);
  } else {
    const loader = document.getElementById("messageLoader");
    if (loader) {
      loader.remove();
    }
  }
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

function updateConnectionStatus(status) {
  const statusElement = document.getElementById("wsStatus");
  if (statusElement) {
    statusElement.textContent = status;
  }
}

function formatTime(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Maintenant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  if (diffDays < 7) return `Il y a ${diffDays} j`;

  return date.toLocaleDateString("fr-FR");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function updateMessageStatus(messageId, status) {
  const messageElement = document.querySelector(
    `[data-message-id="${messageId}"]`
  );
  if (messageElement) {
    messageElement.classList.remove("pending");
    const timeElement = messageElement.querySelector(".message-time");
    if (timeElement) {
      const timeText = timeElement.textContent.replace(/[✓✓✓]/g, "").trim();
      timeElement.textContent = `${timeText} ${status === "seen" ? "✓✓" : "✓"}`;
    }
  }
}

// 🆕 METTRE À JOUR L'AFFICHAGE DU COMPTEUR D'ARCHIVES
function updateArchivedCountDisplay(count) {
  const countElement = document.getElementById("archivedCount");
  if (countElement) {
    countElement.textContent = `${count} conversation${
      count > 1 ? "s" : ""
    } archivée${count > 1 ? "s" : ""}`;
  }
}

// Gestion de la déconnexion
window.addEventListener("beforeunload", () => {
  if (state.socket) {
    state.socket.disconnect();
  }

  state.pendingFiles.forEach((fileData) => {
    if (fileData.previewUrl) {
      URL.revokeObjectURL(fileData.previewUrl);
    }
  });
});

// ====================================================================
//                     ÉPINGLAGE MESSAGES (COMME MESSENGER)
// ====================================================================

// Ajout du bandeau épinglé en haut du chat (une seule fois)
function initPinnedBanner() {
  if (document.getElementById("pinnedBanner")) return;

  const banner = document.createElement("div");
  banner.id = "pinnedBanner";
  banner.className =
    "pinned-banner bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-5 shadow-2xl border-b-4 border-yellow-400 hidden";
  banner.innerHTML = `
        <div class="max-w-4xl mx-auto">
            <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-lg flex items-center gap-2">
                    Messages épinglés (<span id="pinnedCount">0</span>)
                </h3>
                <button onclick="document.getElementById('pinnedBanner').classList.add('hidden')" class="text-sm opacity-70 hover:opacity-100">
                    Masquer
                </button>
            </div>
            <div id="pinnedList" class="space-y-3 max-h-64 overflow-y-auto"></div>
        </div>
    `;

  // Insérer juste avant la zone des messages
  document
    .querySelector(".chat-area")
    .insertBefore(banner, document.querySelector(".messages-container"));
}

// Charger les messages épinglés
async function loadPinnedMessages(conversationId) {
  try {
    const res = await fetch(
      `${CONFIG.BACKEND_URL}/api/messages/${conversationId}/pinned`,
      {
        headers: { Authorization: `Bearer ${state.token}` },
      }
    );
    const data = await res.json();
    if (data.pinnedMessages) {
      renderPinnedBanner(data.pinnedMessages);
    }
  } catch (err) {
    console.error("Erreur chargement messages épinglés:", err);
  }
}

// Afficher le bandeau avec les messages épinglés
function renderPinnedBanner(pinnedMessages) {
  const banner = document.getElementById("pinnedBanner");
  const list = document.getElementById("pinnedList");
  const count = document.getElementById("pinnedCount");

  if (!pinnedMessages || pinnedMessages.length === 0) {
    banner.classList.add("hidden");
    return;
  }

  banner.classList.remove("hidden");
  count.textContent = pinnedMessages.length;
  list.innerHTML = "";

  pinnedMessages.forEach((msg) => {
    const isMine = isMyMessage(msg);
    const item = document.createElement("div");
    item.className =
      "bg-white/20 backdrop-blur rounded-lg p-4 flex justify-between items-center";
    item.innerHTML = `
            <div class="flex-1 pr-4">
                <strong>${isMine ? "Toi" : "Autre"} :</strong>
                <span class="ml-2 break-words">
                    ${
                      msg.typeMessage === "text"
                        ? escapeHtml(msg.content)
                        : msg.typeMessage === "image"
                        ? "Photo"
                        : msg.typeMessage === "video"
                        ? "Vidéo"
                        : msg.typeMessage === "audio"
                        ? "Message vocal"
                        : "Fichier"
                    }
                </span>
            </div>
            ${
              isMine
                ? `<button onclick="togglePin('${msg._id}', true)" class="text-yellow-300 hover:text-white text-sm">Retirer</button>`
                : ""
            }
        `;
    list.appendChild(item);
  });
}

// Fonction d'épinglage / désépinglage
async function togglePin(messageId, isPinned = false) {
  if (!state.currentConversation) return;

  const url = isPinned
    ? `${CONFIG.BACKEND_URL}/api/messages/${messageId}/unpin`
    : `${CONFIG.BACKEND_URL}/api/messages/${messageId}/pin`;

  try {
    await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${state.token}` },
    });

    // Recharger les messages + bandeau
    await loadMessages(state.currentConversation._id, false);
    await loadPinnedMessages(state.currentConversation._id);
  } catch (err) {
    showMessage("Erreur épinglage", "error");
  }
}

// Modifier createMessageElement pour ajouter le bouton étoile
const originalCreateMessageElement = createMessageElement;
createMessageElement = function (message) {
  const el = originalCreateMessageElement(message);
  const isSent = isMyMessage(message);

  // Ajouter le bouton étoile au survol
  const bubble =
    el.querySelector(".message-content") ||
    el.querySelector(".message-bubble") ||
    el;
  if (bubble) {
    bubble.classList.add("group", "relative");

    const pinBtn = document.createElement("button");
    pinBtn.className = `absolute -top-10 right-4 bg-gray-900 text-yellow-400 text-3xl px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-2xl z-10 hover:bg-gray-800`;
    pinBtn.innerHTML = message.isPinned ? "Épinglé" : "Épingler";
    pinBtn.onclick = (e) => {
      e.stopPropagation();
      togglePin(message._id, message.isPinned);
    };

    el.appendChild(pinBtn);
  }

  // Marquer les messages épinglés visuellement
  if (message.isPinned) {
    el.style.borderLeft = "4px solid #f9ee34";
    el.style.backgroundColor = isSent
      ? "rgba(249, 238, 52, 0.15)"
      : "rgba(249, 238, 52, 0.1)";
  }

  return el;
};

// Écoute des événements Socket.IO pour l'épinglage en temps réel
if (state.socket) {
  state.socket.on("message:pinned", (data) => {
    if (state.currentConversation?._id === data.conversationId) {
      loadMessages(state.currentConversation._id, false);
      loadPinnedMessages(state.currentConversation._id);
    }
  });

  state.socket.on("message:unpinned", (data) => {
    if (state.currentConversation?._id === data.conversationId) {
      loadMessages(state.currentConversation._id, false);
      loadPinnedMessages(state.currentConversation._id);
    }
  });
}

// Initialiser le bandeau au chargement
document.addEventListener("DOMContentLoaded", () => {
  initPinnedBanner();
});

// Quand on ouvre une conversation → charger aussi les épinglés
const originalSelectConversation = selectConversation;
selectConversation = async function (conversation) {
  await originalSelectConversation(conversation);
  await loadPinnedMessages(conversation._id);
};

// ====================================================================
//                  SYSTÈME D'ARCHIVAGE COMPLET
// ====================================================================
function initArchiveSystem() {
  console.log("Initialisation du système d'archivage...");

  document.getElementById("archiveBtn")?.addEventListener("click", toggleArchiveConversation);
  document.getElementById("showArchivedBtn")?.addEventListener("click", showArchivedModal);
  document.getElementById("closeArchivedModal")?.addEventListener("click", closeArchivedModal);
  document.getElementById("searchArchivedInput")?.addEventListener("input", handleArchiveSearch);

  initArchiveModal();
  console.log("Système d'archivage initialisé");
}

function initArchiveModal() {
  const modal = document.getElementById("archivedModal");
  const closeBtn = document.getElementById("closeArchivedModal");
  const searchInput = document.getElementById("searchArchivedInput");

  closeBtn?.addEventListener("click", closeArchivedModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeArchivedModal();
  });
  searchInput?.addEventListener("input", handleArchiveSearch);
}

async function toggleArchiveConversation() {
  if (!state.currentConversation) {
    showMessage("Sélectionnez d'abord une conversation", "warning");
    return;
  }

  const conversationId = state.currentConversation._id;
  const isCurrentlyArchived = state.currentConversation.isArchived;

  try {
    if (isCurrentlyArchived) {
      await unarchiveConversation(conversationId);
    } else {
      await archiveConversation(conversationId);
    }
  } catch (error) {
    console.error("Erreur archivage:", error);
    showMessage("Erreur: " + error.message, "error");
  }
}

async function archiveConversation(conversationId) {
  return new Promise((resolve, reject) => {
    if (!state.socket || !state.isConnected) {
      reject(new Error("WebSocket déconnecté"));
      return;
    }

    state.socket.emit("archive_conversation", { conversationId });

    const successHandler = (data) => {
      if (data.conversationId === conversationId) {
        cleanup();
        showMessage("Conversation archivée", "success");
        updateArchiveUI(true);
        loadConversations();
        resolve(data);
      }
    };

    const errorHandler = (data) => {
      cleanup();
      reject(new Error(data.error || "Erreur d'archivage"));
    };

    const cleanup = () => {
      state.socket.off("conversation_archived", successHandler);
      state.socket.off("archive_error", errorHandler);
    };

    state.socket.on("conversation_archived", successHandler);
    state.socket.on("archive_error", errorHandler);

    setTimeout(() => {
      cleanup();
      reject(new Error("Timeout archivage"));
    }, 10000);
  });
}

async function unarchiveConversation(conversationId) {
  return new Promise((resolve, reject) => {
    if (!state.socket || !state.isConnected) {
      reject(new Error("WebSocket déconnecté"));
      return;
    }

    state.socket.emit("unarchive_conversation", { conversationId });

    const successHandler = (data) => {
      if (data.conversationId === conversationId) {
        cleanup();
        showMessage("Conversation désarchivée", "success");
        updateArchiveUI(false);
        loadConversations();
        resolve(data);
      }
    };

    const errorHandler = (data) => {
      cleanup();
      reject(new Error(data.error || "Erreur de désarchivage"));
    };

    const cleanup = () => {
      state.socket.off("conversation_unarchived", successHandler);
      state.socket.off("archive_error", errorHandler);
    };

    state.socket.on("conversation_unarchived", successHandler);
    state.socket.on("archive_error", errorHandler);

    setTimeout(() => {
      cleanup();
      reject(new Error("Timeout désarchivage"));
    }, 10000);
  });
}

function updateArchiveUI(isArchived) {
  const archiveBtn = document.getElementById("archiveBtn");
  const archiveMenuItem = document.getElementById("archiveMenuItem");

  if (archiveBtn) {
    archiveBtn.title = isArchived ? "Désarchiver" : "Archiver";
    archiveBtn.innerHTML = isArchived
      ? '<i class="fas fa-inbox"></i>'
      : '<i class="fas fa-archive"></i>';
  }

  if (archiveMenuItem) {
    archiveMenuItem.textContent = isArchived ? "Désarchiver" : "Archiver";
  }

  if (state.currentConversation) {
    state.currentConversation.isArchived = isArchived;
  }
}

async function showArchivedModal() {
  const modal = document.getElementById("archivedModal");
  try {
    await loadArchivedConversations();
    modal.style.display = "flex";
  } catch (error) {
    console.error("Erreur chargement archives:", error);
    showMessage("Erreur de chargement des archives", "error");
  }
}

function closeArchivedModal() {
  const modal = document.getElementById("archivedModal");
  modal.style.display = "none";
  state.currentArchiveFilter = "";
}

async function loadArchivedConversations() {
  return new Promise((resolve, reject) => {
    if (!state.socket || !state.isConnected) {
      reject(new Error("WebSocket déconnecté"));
      return;
    }

    state.socket.emit("get_archived_conversations");

    const successHandler = (data) => {
      cleanup();
      state.archivedConversations = data.conversations || [];
      renderArchivedConversations();
      updateArchivedCount();
      resolve(data);
    };

    const errorHandler = (data) => {
      cleanup();
      reject(new Error(data.error || "Erreur de chargement"));
    };

    const cleanup = () => {
      state.socket.off("archived_conversations_data", successHandler);
      state.socket.off("archive_error", errorHandler);
    };

    state.socket.on("archived_conversations_data", successHandler);
    state.socket.on("archive_error", errorHandler);

    setTimeout(() => {
      cleanup();
      reject(new Error("Timeout chargement archives"));
    }, 10000);
  });
}

function renderArchivedConversations() {
  const container = document.getElementById("archivedConversationsList");
  const conversations = state.archivedConversations;

  if (!conversations || conversations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-archive"></i>
        <p>Aucune conversation archivée</p>
        <p style="font-size: 12px; margin-top: 5px;">Les conversations archivées n'apparaîtront pas dans votre liste principale</p>
      </div>
    `;
    return;
  }

  let filteredConversations = conversations;
  if (state.currentArchiveFilter) {
    const term = state.currentArchiveFilter.toLowerCase();
    filteredConversations = conversations.filter(
      (conv) =>
        conv.name.toLowerCase().includes(term) ||
        (conv.participants &&
          conv.participants.some(
            (p) => p.username && p.username.toLowerCase().includes(term)
          ))
    );
  }

  if (filteredConversations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <p>Aucun résultat trouvé</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredConversations
    .map((conv) => {
      const isGroup = conv.type === "group";
      const avatarText = isGroup ? "Group" : (conv.name || "C").charAt(0).toUpperCase();
      const archivedDate = conv.archivedAt ? new Date(conv.archivedAt) : new Date();

      return `
      <div class="archived-conversation" data-conversation-id="${conv._id}"
           style="padding: 12px; border-bottom: 1px solid #333; cursor: pointer; display: flex; align-items: center; gap: 12px; transition: background 0.2s;"
           onmouseover="this.style.background='#252525'" onmouseout="this.style.background='transparent'">
        <div class="contact-avatar" style="width: 45px; height: 45px; border-radius: 50%; background: #666; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 16px;">
          ${avatarText}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: bold; color: #ccc; font-size: 14px;">
            ${conv.name || "Conversation"}
            ${isGroup ? '<span style="font-size: 10px; background: #444; padding: 2px 6px; border-radius: 10px; margin-left: 8px;">Groupe</span>' : ""}
          </div>
          <div style="font-size: 11px; color: #888; margin-top: 2px;">
            Archivée le ${archivedDate.toLocaleDateString("fr-FR")}
          </div>
        </div>
        <button class="action-btn small" onclick="event.stopPropagation(); unarchiveFromModal('${conv._id}')"
                title="Désarchiver" style="background: #f9ee34; color: #1c1c1c; border: none; border-radius: 6px; padding: 6px 10px; font-size: 11px; cursor: pointer;">
          <i class="fas fa-inbox"></i>
        </button>
      </div>
    `;
    })
    .join("");

  container.querySelectorAll(".archived-conversation").forEach((element) => {
    element.addEventListener("click", function () {
      const conversationId = this.dataset.conversationId;
      openArchivedConversation(conversationId);
    });
  });
}

async function unarchiveFromModal(conversationId) {
  try {
    await unarchiveConversation(conversationId);
    await loadArchivedConversations();
  } catch (error) {
    showMessage("Erreur: " + error.message, "error");
  }
}

async function openArchivedConversation(conversationId) {
  try {
    await unarchiveConversation(conversationId);
    closeArchivedModal();
    showMessage("Conversation désarchivée et ouverte", "success");
  } catch (error) {
    showMessage("Erreur: " + error.message, "error");
  }
}

function handleArchiveSearch(event) {
  state.currentArchiveFilter = event.target.value.trim();
  renderArchivedConversations();
}

function updateArchivedCount() {
  const countElement = document.getElementById("archivedCount");
  const count = state.archivedConversations.length;
  if (countElement) {
    countElement.textContent = `${count} conversation${count > 1 ? "s" : ""} archivée${count > 1 ? "s" : ""}`;
  }
}




// Export pour debug
window.owlyState = state;
window.openImageModal = openImageModal;
window.showReactionsModal = showReactionsModal;
window.showVoiceRecordModal = showVoiceRecordModal;
window.showMessageContextMenu = showMessageContextMenu;
window.handleForwardAction = handleForwardAction;
window.showArchivedModal = showArchivedModal;
window.toggleArchiveConversation = toggleArchiveConversation;

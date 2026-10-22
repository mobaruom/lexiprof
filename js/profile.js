/* ============================================================
   LEXIPROF — PROFILE.JS (LOT A)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("profilePage")) return;
  applyUserPrefs();
  renderProfile();
});

function renderProfile() {
  const session = getSession();
  const gate = document.getElementById("profileGate");
  const content = document.getElementById("profileContent");

  if (!session) {
    if (gate) gate.style.display = "block";
    if (content) content.style.display = "none";
    return;
  }
  if (gate) gate.style.display = "none";
  if (content) content.style.display = "block";

  const initial = session.displayName.charAt(0).toUpperCase();
  const avatarEl = document.getElementById("profileAvatar");
  if (avatarEl) {
    avatarEl.innerHTML = session.avatar
      ? `<img src="${session.avatar}" alt="">`
      : `<span>${initial}</span>`;
  }
  document.getElementById("profileName").textContent = session.displayName;
  document.getElementById("profileEmail").textContent = session.email;
  const created = new Date(session.createdAt);
  document.getElementById("profileCreated").textContent =
    "Membre depuis le " + created.toLocaleDateString("fr-FR");

  document.getElementById("editName").value = session.displayName;
  document.getElementById("editEmail").value = session.email;

  const prefs = getUserPrefs();
  document.getElementById("prefTheme").value = prefs.theme;
  document.getElementById("prefFontSize").value = prefs.fontSize;
  document.getElementById("prefFontSizeValue").textContent = prefs.fontSize + "%";
  document.getElementById("prefNotifications").checked = prefs.notifications;
  document.getElementById("prefReduceMotion").checked = prefs.reduceMotion;

  document.getElementById("statFavorites").textContent = loadFavoritesLocal().length;
  document.getElementById("statMastered").textContent = loadMasteredLocal().length;
  document.getElementById("statProposals").textContent = loadSentProposals().length;
}

async function saveProfileIdentity() {
  const name = document.getElementById("editName").value.trim();
  const avatarInput = document.getElementById("editAvatar");
  let avatar = undefined;

  if (avatarInput && avatarInput.files && avatarInput.files[0]) {
    const file = avatarInput.files[0];
    if (file.size > 2 * 1024 * 1024) {
      showToast("⚠️ Image trop lourde (max 2 Mo).");
      return;
    }
    avatar = await fileToBase64(file);
  }

  try {
    await updateUserProfile({ displayName: name, avatar });
    showToast("✅ Profil mis à jour.");
    renderProfile();
    renderAuthButton();
  } catch (e) { showToast("⚠️ " + e.message); }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function savePreference(key, value) {
  saveUserPrefs({ [key]: value });
  applyUserPrefs();

  if (key === "theme") {
    if (value === "dark") localStorage.setItem(THEME_KEY, "dark");
    else if (value === "light") localStorage.setItem(THEME_KEY, "light");
    else localStorage.removeItem(THEME_KEY);
  }
}

function onThemeChange() {
  savePreference("theme", document.getElementById("prefTheme").value);
  showToast("🎨 Thème mis à jour.");
}

function onFontSizeChange() {
  const val = Number(document.getElementById("prefFontSize").value);
  document.getElementById("prefFontSizeValue").textContent = val + "%";
  savePreference("fontSize", val);
}

function onNotificationsChange() {
  savePreference("notifications", document.getElementById("prefNotifications").checked);
}

function onReduceMotionChange() {
  savePreference("reduceMotion", document.getElementById("prefReduceMotion").checked);
}

async function saveNewPassword() {
  const current = document.getElementById("pwdCurrent").value;
  const newPwd = document.getElementById("pwdNew").value;
  const confirm = document.getElementById("pwdConfirm").value;

  if (newPwd !== confirm) { showToast("⚠️ Les mots de passe ne correspondent pas."); return; }
  try {
    await updateUserPassword({ currentPassword: current, newPassword: newPwd });
    document.getElementById("pwdCurrent").value = "";
    document.getElementById("pwdNew").value = "";
    document.getElementById("pwdConfirm").value = "";
    showToast("🔑 Mot de passe modifié.");
  } catch (e) { showToast("⚠️ " + e.message); }
}

function handleLogout() {
  if (!confirm("Se déconnecter ?")) return;
  logoutLocal();
  showToast("👋 Déconnecté.");
  renderProfile();
  renderAuthButton();
}

function handleDeleteAccount() {
  const confirmText = prompt(
    "⚠️ Cette action supprime définitivement ton compte local.\nTape SUPPRIMER pour confirmer."
  );
  if (confirmText !== "SUPPRIMER") { showToast("Suppression annulée."); return; }
  deleteAccount();
  showToast("🗑 Compte supprimé.");
  renderProfile();
  renderAuthButton();
}

function handleExportRGPD() {
  exportUserDataRGPD();
}

function handleClearLocalData() {
  if (!confirm("Effacer toutes les données locales (favoris, historique, cache) ?")) return;
  [FAVORITES_KEY, PROGRESS_KEY, SEARCH_HISTORY_KEY, SEARCH_MISSES_KEY, FALLBACK_KEY, PROPOSALS_SENT_KEY]
    .forEach(k => localStorage.removeItem(k));
  Object.keys(localStorage).filter(k => k.startsWith("cache:")).forEach(k => localStorage.removeItem(k));
  showToast("🧹 Données locales effacées.");
  renderProfile();
}

function switchProfileTab(tab) {
  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const formLogin = document.getElementById("formLogin");
  const formRegister = document.getElementById("formRegister");
  if (tab === "login") {
    tabLogin?.classList.add("active");
    tabRegister?.classList.remove("active");
    formLogin?.style.display = "block";
    formRegister?.style.display = "none";
  } else {
    tabLogin?.classList.remove("active");
    tabRegister?.classList.add("active");
    formLogin?.style.display = "none";
    formRegister?.style.display = "block";
  }
}

async function profileLogin() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  try {
    await loginLocal({ email, password });
    showToast("✅ Connecté.");
    renderProfile();
    renderAuthButton();
  } catch (e) { showToast("⚠️ " + e.message); }
}

async function profileRegister() {
  const displayName = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  try {
    await registerLocal({ email, password, displayName });
    showToast("✅ Compte créé.");
    renderProfile();
    renderAuthButton();
  } catch (e) { showToast("⚠️ " + e.message); }
}

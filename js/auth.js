/* ============================================================
   LEXIPROF — AUTH.JS (LOT A)
   ============================================================ */

async function sha256(text) {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function randomSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
}

function loadUsers() {
  try {
    const data = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try {
    const id = localStorage.getItem(SESSION_KEY);
    if (!id) return null;
    return loadUsers().find(u => u.id === id) || null;
  } catch { return null; }
}

function setSession(userId) {
  if (userId) localStorage.setItem(SESSION_KEY, userId);
  else localStorage.removeItem(SESSION_KEY);
}

async function registerLocal({ email, password, displayName }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanName = String(displayName || "").trim();

  if (!cleanEmail || !cleanEmail.includes("@")) throw new Error("Email invalide.");
  if (!cleanName || cleanName.length < 2) throw new Error("Nom trop court.");
  if (!password || password.length < 6) throw new Error("Mot de passe : 6 caractères minimum.");

  const users = loadUsers();
  if (users.some(u => u.email === cleanEmail)) throw new Error("Cet email est déjà utilisé.");

  const salt = randomSalt();
  const passwordHash = await sha256(salt + password);
  const user = {
    id: "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    email: cleanEmail,
    displayName: cleanName,
    salt,
    passwordHash,
    avatar: null,
    createdAt: new Date().toISOString()
  };
  users.push(user);
  saveUsers(users);
  setSession(user.id);
  return user;
}

async function loginLocal({ email, password }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const users = loadUsers();
  const user = users.find(u => u.email === cleanEmail);
  if (!user) throw new Error("Aucun compte avec cet email.");

  const passwordHash = await sha256(user.salt + password);
  if (passwordHash !== user.passwordHash) throw new Error("Mot de passe incorrect.");

  setSession(user.id);
  return user;
}

function logoutLocal() {
  setSession(null);
}

async function updateUserProfile({ displayName, avatar }) {
  const session = getSession();
  if (!session) throw new Error("Non connecté.");
  const users = loadUsers();
  const idx = users.findIndex(u => u.id === session.id);
  if (idx === -1) throw new Error("Utilisateur introuvable.");
  if (displayName !== undefined) users[idx].displayName = String(displayName).trim();
  if (avatar !== undefined) users[idx].avatar = avatar;
  saveUsers(users);
  return users[idx];
}

async function updateUserPassword({ currentPassword, newPassword }) {
  const session = getSession();
  if (!session) throw new Error("Non connecté.");
  if (newPassword.length < 6) throw new Error("Nouveau mot de passe : 6 caractères minimum.");

  const users = loadUsers();
  const idx = users.findIndex(u => u.id === session.id);
  if (idx === -1) throw new Error("Utilisateur introuvable.");

  const checkHash = await sha256(users[idx].salt + currentPassword);
  if (checkHash !== users[idx].passwordHash) throw new Error("Mot de passe actuel incorrect.");

  users[idx].salt = randomSalt();
  users[idx].passwordHash = await sha256(users[idx].salt + newPassword);
  saveUsers(users);
  return users[idx];
}

function deleteAccount() {
  const session = getSession();
  if (!session) return;
  const users = loadUsers().filter(u => u.id !== session.id);
  saveUsers(users);
  setSession(null);
  const prefs = loadAllPrefs();
  delete prefs[session.id];
  localStorage.setItem(USER_PREFS_KEY, JSON.stringify(prefs));
}

function loadAllPrefs() {
  try {
    const data = JSON.parse(localStorage.getItem(USER_PREFS_KEY) || "{}");
    return data && typeof data === "object" ? data : {};
  } catch { return {}; }
}

function getUserPrefs() {
  const session = getSession();
  const all = loadAllPrefs();
  const key = session ? session.id : "anonymous";
  return { ...DEFAULT_PREFS, ...(all[key] || {}) };
}

function saveUserPrefs(partial) {
  const session = getSession();
  const key = session ? session.id : "anonymous";
  const all = loadAllPrefs();
  all[key] = { ...(all[key] || {}), ...partial };
  localStorage.setItem(USER_PREFS_KEY, JSON.stringify(all));
  return all[key];
}

function renderAuthButton() {
  const btn = document.getElementById("authBtn");
  if (!btn) return;
  const session = getSession();
  if (session) {
    const initial = session.displayName.charAt(0).toUpperCase();
    btn.innerHTML = session.avatar
      ? `<img src="${session.avatar}" alt="" class="auth-avatar">`
      : `<span class="auth-initial">${initial}</span>`;
    btn.title = `${session.displayName} — Mon profil`;
    btn.setAttribute("aria-label", `${session.displayName}, ouvrir mon profil`);
    btn.onclick = () => { location.href = "profile.html"; };
  } else {
    btn.innerHTML = "👤";
    btn.title = "Connexion / Inscription";
    btn.setAttribute("aria-label", "Connexion");
    btn.onclick = () => { location.href = "profile.html"; };
  }
}

function applyUserPrefs() {
  const prefs = getUserPrefs();

  document.body.classList.remove("dark");
  if (prefs.theme === "dark") {
    document.body.classList.add("dark");
  } else if (prefs.theme === "auto") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) document.body.classList.add("dark");
  }

  document.documentElement.style.fontSize = prefs.fontSize + "%";
  document.body.classList.toggle("reduce-motion", Boolean(prefs.reduceMotion));
  document.body.classList.toggle("font-dyslexic", prefs.font === "dyslexic");
}

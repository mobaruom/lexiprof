/* ============================================================
   LexiProf — backend-firebase.js : Firebase Realtime Database (REST) + Firebase Auth (REST)
   - SANS apiKey (js/config.js) : mode « local » → comptes sur l'appareil, admin protégé par un mot de passe côté navigateur (provisoire).
   - AVEC apiKey : vrais comptes Firebase Auth, synchronisation de la progression, admin = compte listé dans /admins, règles serveur.
   ============================================================ */
(function () {
  'use strict';
  const LP = window.LP, lsGet = LP.lsGet, lsSet = LP.lsSet, K = LP.K;
  const ME = 'lexiprof_me', TOK = 'lexiprof_tok';
  const enc = encodeURIComponent;

  LP.backends.firebase = function () {
    const C = LP.cfg, cloud = !!C.apiKey;
    LP.authMode = cloud ? 'firebase' : 'local';

    /* ---------- jetons ---------- */
    const tokStore = () => lsGet(TOK, null);
    const setTok = t => { t ? lsSet(TOK, t) : localStorage.removeItem(TOK); };
    const setMe = u => { u ? lsSet(ME, u) : localStorage.removeItem(ME); };
    async function idp(endpoint, body) {
      const r = await fetch('https://identitytoolkit.googleapis.com/v1/' + endpoint + '?key=' + enc(C.apiKey), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(authMsg(j && j.error && j.error.message));
      return j;
    }
    function authMsg(m) {
      m = String(m || '');
      if (/EMAIL_EXISTS/.test(m)) return 'Cet email est déjà utilisé.';
      if (/INVALID_LOGIN|EMAIL_NOT_FOUND|INVALID_PASSWORD|INVALID_EMAIL|MISSING_PASSWORD/.test(m)) return 'Email ou mot de passe incorrect.';
      if (/WEAK_PASSWORD/.test(m)) return 'Mot de passe trop faible (6 caractères minimum).';
      if (/TOO_MANY/.test(m)) return 'Trop d’essais. Réessaie dans quelques minutes.';
      if (/USER_DISABLED/.test(m)) return 'Compte désactivé.';
      if (/CREDENTIAL_TOO_OLD|TOKEN_EXPIRED|INVALID_ID_TOKEN/.test(m)) return 'Session expirée : reconnecte-toi.';
      return 'Erreur de connexion (' + (m || 'réseau') + ').';
    }
    const keepTokens = j => setTok({ id: j.idToken, refresh: j.refreshToken, exp: Date.now() + (Number(j.expiresIn) - 90) * 1000, uid: j.localId });
    async function token() {
      const t = tokStore(); if (!t) return null;
      if (t.exp > Date.now()) return t.id;
      try {
        const r = await fetch('https://securetoken.googleapis.com/v1/token?key=' + enc(C.apiKey), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=refresh_token&refresh_token=' + enc(t.refresh) });
        const j = await r.json(); if (!r.ok) throw new Error(j.error && j.error.message);
        const n = { id: j.id_token, refresh: j.refresh_token, exp: Date.now() + (Number(j.expires_in) - 90) * 1000, uid: j.user_id }; setTok(n); return n.id;
      } catch (e) { if (/TOKEN_EXPIRED|INVALID_REFRESH|USER_NOT_FOUND|USER_DISABLED/.test(String(e.message))) { setTok(null); setMe(null); } return null; }
    }

    /* ---------- Realtime Database (REST) ---------- */
    async function fb(path, opts = {}) {
      const ctl = new AbortController(), method = opts.method || 'GET';
      const t = setTimeout(() => ctl.abort(), method === 'GET' ? 8000 : 12000);
      try {
        let [p0, q0] = String(path).split('?');
        if ((p0 === 'events' || p0 === 'audit') && method === 'GET' && !q0) q0 = 'orderBy=' + enc('"$key"') + '&limitToLast=8000';
        const tok = cloud && !(method === 'GET' && p0 === 'definitions') ? await token() : null;
        const qs = [q0, tok ? 'auth=' + enc(tok) : ''].filter(Boolean).join('&');
        const res = await fetch(`${C.db}/${p0}.json${qs ? '?' + qs : ''}`, Object.assign({}, opts, { signal: ctl.signal }));
        if (!res.ok) { const e = new Error(res.status === 401 || res.status === 403 ? 'Accès refusé par le serveur.' : 'Erreur serveur (' + res.status + ')'); e.status = res.status; throw e; }
        return res;
      } catch (e) {
        if (e.name === 'AbortError') throw new Error('Délai dépassé — vérifie ta connexion.');
        if (e instanceof TypeError) throw new Error('Serveur injoignable.');
        throw e;
      } finally { clearTimeout(t); }
    }
    const J = { 'Content-Type': 'application/json' };
    LP.api = {
      async get(path) {
        const data = await (await fb(path)).json();
        if (data == null) return [];
        if (Array.isArray(data)) return data.map((v, i) => (v == null ? null : Object.assign({}, v, { _key: String(i) }))).filter(Boolean);
        if (typeof data === 'object') {
          if (Array.isArray(data.definitions)) return data.definitions;
          return Object.entries(data).map(([k, v]) => Object.assign({}, v, { _key: k }));
        }
        return [];
      },
      async raw(path) { return (await fb(path)).json(); },
      async put(path, body) { return (await fb(path, { method: 'PUT', headers: J, body: JSON.stringify(body) })).json(); },
      async post(path, body) { return (await fb(path, { method: 'POST', headers: J, body: JSON.stringify(body) })).json(); },
      async patch(path, body) { return (await fb(path, { method: 'PATCH', headers: J, body: JSON.stringify(body) })).json(); },
      async del(path) { await fb(path, { method: 'DELETE' }); return true; }
    };
    LP.http = null;

    /* ---------- mode local (sans apiKey) ---------- */
    const rnd = () => Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
    const users = () => { const d = lsGet(K.users, []); return Array.isArray(d) ? d : []; };
    const localAuth = {
      session() { const id = localStorage.getItem(K.session); const u = id ? users().find(x => x.id === id) : null; return u ? Object.assign({}, u, { role: 'user', plan: 'free' }) : null; },
      async register({ email, password, displayName }) {
        email = String(email || '').trim().toLowerCase(); displayName = String(displayName || '').trim();
        if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Email invalide.');
        if (displayName.length < 2) throw new Error('Prénom trop court.');
        if (!password || password.length < 8) throw new Error('Mot de passe : 8 caractères minimum.');
        const list = users(); if (list.some(u => u.email === email)) throw new Error('Cet email est déjà utilisé.');
        const salt = rnd(), u = { id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8), email, displayName, salt, passwordHash: await LP.sha256(salt + password), createdAt: new Date().toISOString() };
        list.push(u); lsSet(K.users, list); localStorage.setItem(K.session, u.id); LP.applyPrefs(); return this.session();
      },
      async login({ email, password }) {
        email = String(email || '').trim().toLowerCase(); const u = users().find(x => x.email === email);
        if (!u || (await LP.sha256(u.salt + password)) !== u.passwordHash) throw new Error('Email ou mot de passe incorrect.');
        localStorage.setItem(K.session, u.id); LP.applyPrefs(); return this.session();
      },
      async logout() { localStorage.removeItem(K.session); LP.applyPrefs(); },
      async update(p) { const s = this.session(); if (!s) throw new Error('Non connecté.'); const n = String(p.displayName || '').trim(); if (n.length < 2) throw new Error('Prénom trop court.'); const l = users(); l.find(u => u.id === s.id).displayName = n; lsSet(K.users, l); return this.session(); },
      async password(cur, next) {
        const s = this.session(); if (!s) throw new Error('Non connecté.'); if (!next || next.length < 8) throw new Error('Nouveau mot de passe : 8 caractères minimum.');
        const l = users(), u = l.find(x => x.id === s.id); if ((await LP.sha256(u.salt + cur)) !== u.passwordHash) throw new Error('Mot de passe actuel incorrect.');
        u.salt = rnd(); u.passwordHash = await LP.sha256(u.salt + next); lsSet(K.users, l);
      },
      async remove(pw) {
        const s = this.session(); if (!s) return; const l = users(), u = l.find(x => x.id === s.id);
        if ((await LP.sha256(u.salt + pw)) !== u.passwordHash) throw new Error('Mot de passe incorrect.');
        lsSet(K.users, l.filter(x => x.id !== s.id)); const all = LP.prefs.all(); delete all[s.id]; lsSet(K.prefs, all); localStorage.removeItem(K.session); LP.applyPrefs();
      },
      async refresh() { return this.session(); }
    };
    const localAdmin = {
      needsEmail: false, cloud: false,
      async signIn(_e, pw) {
        const fails = Number(sessionStorage.getItem('lp_fails') || 0), until = Number(sessionStorage.getItem('lp_until') || 0);
        if (Date.now() < until) throw new Error('Trop d\'essais. Réessaie dans ' + Math.ceil((until - Date.now()) / 1000) + ' s.');
        const h = await LP.sha256(pw), stored = localStorage.getItem(K.adminPwd); const ok = h === (stored || DEFAULT_HASH);
        if (ok) { sessionStorage.removeItem('lp_fails'); sessionStorage.setItem('lp_admin', String(Date.now())); return true; }
        sessionStorage.setItem('lp_fails', String(fails + 1)); if (fails + 1 >= 5) { sessionStorage.setItem('lp_until', String(Date.now() + 60000)); sessionStorage.setItem('lp_fails', '0'); }
        throw new Error('Mot de passe incorrect.');
      },
      unlocked() { const t = Number(sessionStorage.getItem('lp_admin') || 0); return !!t && Date.now() - t < LP.cfg.sessionMax * 60000; },
      who() { return 'Admin (mode test)'; },
      touch() { if (this.unlocked()) sessionStorage.setItem('lp_admin', String(Date.now())); },
      lock() { sessionStorage.removeItem('lp_admin'); },
      async changePassword(cur, next) { if (!(await this.signIn('', cur))) return; if (!next || next.length < 8) throw new Error('8 caractères minimum.'); localStorage.setItem(K.adminPwd, await LP.sha256(next)); },
      async overview() { return null; }
    };
    // SHA-256 de l'ancien mot de passe admin par défaut (aucun mot de passe en clair dans le code)
    const DEFAULT_HASH = 'f7d4c56a642f7f6c7390095ba15c9a59b4c1639ae460dacea5cd039ee39beff9';

    /* ---------- mode cloud (Firebase Auth) ---------- */
    let syncTimer = null, syncing = false;
    const me = () => lsGet(ME, null);
    async function loadProfile(uid, email, displayName, createdMs) {
      let role = 'user', plan = 'free';
      try { role = (await LP.api.raw('admins/' + uid)) === true ? 'admin' : 'user'; } catch (e) {}
      try { const p = await LP.api.raw('profiles/' + uid); if (p && p.plan) plan = p.plan; } catch (e) {}
      const u = { id: uid, email, displayName: displayName || email.split('@')[0], role, plan, createdAt: new Date(createdMs || Date.now()).toISOString() }; setMe(u); return u;
    }
    const cloudAuth = {
      session: () => me(),
      async register({ email, password, displayName }) {
        email = String(email || '').trim().toLowerCase(); displayName = String(displayName || '').trim();
        if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Email invalide.');
        if (displayName.length < 2) throw new Error('Prénom trop court.');
        if (!password || password.length < 8) throw new Error('Mot de passe : 8 caractères minimum.');
        const j = await idp('accounts:signUp', { email, password, returnSecureToken: true }); keepTokens(j);
        try { await idp('accounts:update', { idToken: j.idToken, displayName, returnSecureToken: false }); } catch (e) {}
        const now = Date.now();
        try { await LP.api.put('profiles/' + j.localId, { createdAt: now, plan: 'free', lastSeen: now }); } catch (e) {}
        const u = await loadProfile(j.localId, email, displayName, now); LP.applyPrefs(); LP.sync.pull(); return u;
      },
      async login({ email, password }) {
        email = String(email || '').trim().toLowerCase();
        const j = await idp('accounts:signInWithPassword', { email, password, returnSecureToken: true }); keepTokens(j);
        let created = Date.now(); try { const l = await idp('accounts:lookup', { idToken: j.idToken }); created = Number(l.users[0].createdAt) || created; } catch (e) {}
        const u = await loadProfile(j.localId, j.email || email, j.displayName, created); LP.applyPrefs(); LP.sync.pull(); touchSeen(); return u;
      },
      async logout() { setTok(null); setMe(null); LP.applyPrefs(); },
      async update(p) {
        const n = String(p.displayName || '').trim(); if (n.length < 2) throw new Error('Prénom trop court.');
        const t = await token(); if (!t) throw new Error('Session expirée : reconnecte-toi.');
        await idp('accounts:update', { idToken: t, displayName: n, returnSecureToken: false }); const u = Object.assign({}, me(), { displayName: n }); setMe(u); return u;
      },
      async password(cur, next) {
        const s = me(); if (!s) throw new Error('Non connecté.'); if (!next || next.length < 8) throw new Error('Nouveau mot de passe : 8 caractères minimum.');
        let j; try { j = await idp('accounts:signInWithPassword', { email: s.email, password: cur, returnSecureToken: true }); } catch (e) { throw new Error('Mot de passe actuel incorrect.'); }
        const r = await idp('accounts:update', { idToken: j.idToken, password: next, returnSecureToken: true }); keepTokens(r);
      },
      async remove(pw) {
        const s = me(); if (!s) return;
        let j; try { j = await idp('accounts:signInWithPassword', { email: s.email, password: pw, returnSecureToken: true }); } catch (e) { throw new Error('Mot de passe incorrect.'); }
        keepTokens(j);
        try { await LP.api.del('users/' + s.id); await LP.api.del('profiles/' + s.id); } catch (e) {}
        await idp('accounts:delete', { idToken: j.idToken }); setTok(null); setMe(null); LP.applyPrefs();
      },
      async refresh() {
        const s = me(); if (!s) return null; const t = await token(); if (!t) { LP.emit('session'); return null; }
        try { const u = await loadProfile(s.id, s.email, s.displayName, Date.parse(s.createdAt)); touchSeen(); return u; } catch (e) { return me(); }
      }
    };
    function touchSeen() { const s = me(); if (!s) return; const d = LP.dkey(); if (localStorage.getItem('lexiprof_seen') === d) return; LP.api.patch('profiles/' + s.id, { lastSeen: Date.now() }).then(() => { try { localStorage.setItem('lexiprof_seen', d); } catch (e) {} }).catch(() => {}); }
    const cloudAdmin = {
      needsEmail: true, cloud: true,
      async signIn(email, pw) { const u = await cloudAuth.login({ email, password: pw }); if (u.role !== 'admin') { await cloudAuth.logout(); throw new Error('Ce compte n\'est pas administrateur.'); } return true; },
      unlocked() { const s = me(); return !!s && s.role === 'admin' && !!tokStore(); },
      who() { const s = me(); return (s && s.email) || 'Admin'; },
      touch() {}, lock() { cloudAuth.logout(); },
      changePassword: (c, n) => cloudAuth.password(c, n),
      async overview() {
        const P = (await LP.api.raw('profiles')) || {}, now = Date.now(), list = Object.values(P), days = {};
        for (let i = 89; i >= 0; i--) { const d = new Date(now - i * 864e5); days[LP.dkey(d)] = 0; }
        list.forEach(p => { if (p.createdAt) { const k = LP.dkey(new Date(p.createdAt)); if (k in days) days[k]++; } });
        const plans = { free: 0, premium: 0 }; list.forEach(p => { plans[p.plan === 'premium' ? 'premium' : 'free']++; });
        return { users: list.length, plans, signups: days, active7: list.filter(p => p.lastSeen > now - 7 * 864e5).length, active30: list.filter(p => p.lastSeen > now - 30 * 864e5).length, plansLaunched: LP.plans ? LP.plans.launched : false };
      }
    };
    LP.auth = cloud ? cloudAuth : localAuth;
    LP.admin = cloud ? cloudAdmin : localAdmin;

    /* ---------- synchronisation de la progression (cloud) ---------- */
    LP.sync = {
      async pull() {
        const s = me(); if (!cloud || !s || syncing) return; syncing = true;
        try { const d = await LP.api.raw('users/' + s.id + '/progress'); if (d && d.app === 'LexiProf') LP.importAll(d); await LP.api.put('users/' + s.id + '/progress', LP.exportAll()); } catch (e) {}
        syncing = false;
      },
      push() { const s = me(); if (!cloud || !s) return; clearTimeout(syncTimer); syncTimer = setTimeout(() => LP.api.put('users/' + s.id + '/progress', LP.exportAll()).catch(() => {}), 4000); }
    };
    LP.on('progress', () => LP.sync.push());
  };
})();

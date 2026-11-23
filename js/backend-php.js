/* ============================================================
   LexiProf — backend-php.js : backend PHP + SQLite (OPTIONNEL, pour plus tard — voir php-backend/)
   Activer : js/config.js → backend: 'php'
   ============================================================ */
(function () {
  'use strict';
  const LP = window.LP, lsGet = LP.lsGet, lsSet = LP.lsSet, K = LP.K;
  LP.backends.php = function () {
  /* ---------- API PHP ---------- */
  async function http(method, path, body) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), method === 'GET' ? 8000 : 15000);
    try {
      const res = await fetch(LP.cfg.api + '/' + String(path).replace(/^\//, ''), {
        method, credentials: 'include', signal: ctl.signal,
        headers: Object.assign({ 'X-LP': '1' }, body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
      let j = null; try { j = await res.json(); } catch (e) {}
      if (!res.ok) { const err = new Error((j && j.error) || 'Erreur serveur (' + res.status + ')'); err.status = res.status; throw err; }
      return j;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('Délai dépassé — vérifie ta connexion.');
      if (e instanceof TypeError) throw new Error('Serveur injoignable.');
      throw e;
    } finally { clearTimeout(t); }
  }
  LP.http = http;
  LP.api = {
    async get(path) { const j = await http('GET', String(path).split('?')[0]); return Array.isArray(j) ? j : []; },
    put: (path, body) => http('PUT', path, body), post: (path, body) => http('POST', path, body),
    patch: (path, body) => http('PATCH', path, body), async del(path) { await http('DELETE', path); return true; }
  };

  /* ---------- comptes ---------- */
  const ME = 'lexiprof_me';
  const setMe = u => { u ? lsSet(ME, u) : localStorage.removeItem(ME); };
  const norm_u = u => u && { id: 'u' + u.id, email: u.email, displayName: u.displayName, role: u.role, plan: u.plan, createdAt: u.createdAt };
  let syncTimer = null, syncing = false;
  LP.auth = {
    session() { return lsGet(ME, null); },
    async register({ email, password, displayName }) {
      const r = await http('POST', 'auth/register', { email, password, displayName });
      setMe(norm_u(r.user)); LP.applyPrefs(); LP.sync.pull(); return this.session();
    },
    async login({ email, password }) {
      const r = await http('POST', 'auth/login', { email, password });
      setMe(norm_u(r.user)); LP.applyPrefs(); LP.sync.pull(); return this.session();
    },
    async logout() { setMe(null); LP.applyPrefs(); try { await http('POST', 'auth/logout', {}); } catch (e) {} },
    async update(p) { const r = await http('PATCH', 'me', { displayName: p.displayName }); setMe(norm_u(r.user)); return this.session(); },
    async password(cur, next) { await http('POST', 'me/password', { current: cur, next }); },
    async remove(pw) { await http('DELETE', 'me', { password: pw }); setMe(null); LP.applyPrefs(); },
    // Vérifie auprès du serveur que la session est toujours valide (rôle, offre à jour)
    async refresh() {
      if (!this.session()) return null;
      try { const r = await http('GET', 'me'); setMe(norm_u(r.user)); return this.session(); }
      catch (e) { if (e.status === 401) { setMe(null); LP.applyPrefs(); LP.emit('session'); } return this.session(); }
    }
  };
  // Synchronisation de la progression entre appareils (fusion sans perte, jamais d'écrasement)
  LP.sync = {
    async pull() {
      if (!LP.auth.session() || syncing) return; syncing = true;
      try { const r = await http('GET', 'me/progress'); if (r && r.data && r.data.app === 'LexiProf') { LP.importAll(r.data); } await http('PUT', 'me/progress', { data: LP.exportAll() }); } catch (e) { /* hors ligne : on réessaiera */ }
      syncing = false;
    },
    push() { if (!LP.auth.session()) return; clearTimeout(syncTimer); syncTimer = setTimeout(() => http('PUT', 'me/progress', { data: LP.exportAll() }).catch(() => {}), 4000); }
  };
  LP.on('progress', () => LP.sync.push());

  /* ---------- administration (compte serveur avec rôle admin) ---------- */
  LP.admin = {
    async signIn(email, pw) {
      const r = await http('POST', 'auth/login', { email, password: pw });
      if (r.user.role !== 'admin') { try { await http('POST', 'auth/logout', {}); } catch (e) {} throw new Error('Ce compte n\'est pas administrateur.'); }
      setMe(norm_u(r.user)); return true;
    },
    unlocked() { const s = LP.auth.session(); return !!s && s.role === 'admin'; },
    touch() {},
    lock() { LP.auth.logout(); }
  };


    LP.admin.needsEmail = true;
    LP.admin.changePassword = (cur, next) => LP.auth.password(cur, next);
    LP.admin.overview = () => http('GET', 'admin/overview');
  };
})();

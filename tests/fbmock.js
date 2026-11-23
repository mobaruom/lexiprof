// Faux Firebase (Realtime Database REST + Auth REST) pour les tests, avec des règles d'accès approchant database.rules.json.
module.exports = function makeMock() {
  const S = { db: { definitions: [], proposals: {}, reports: {}, events: {}, profiles: {}, users: {}, admins: {} }, accounts: {}, tokens: {}, refresh: {}, n: 0, flags: {} };
  const mkTok = uid => { const id = 'id' + (++S.n) + '_' + uid, rf = 'rf' + S.n + '_' + uid; S.tokens[id] = uid; S.refresh[rf] = uid; return { idToken: id, refreshToken: rf, expiresIn: '3600', localId: uid }; };
  S.addAccount = (email, pw, name) => { const uid = 'uid' + (++S.n); S.accounts[email] = { uid, pw, name, created: Date.now() }; return uid; };
  const seg = p => p.split('/').filter(Boolean);
  const get = (path) => seg(path).reduce((o, k) => (o == null ? o : o[k]), S.db);
  const set = (path, v) => { const s = seg(path); let o = S.db; s.slice(0, -1).forEach(k => { if (o[k] == null || typeof o[k] !== 'object') o[k] = {}; o = o[k]; }); if (v === null) delete o[s[s.length - 1]]; else o[s[s.length - 1]] = v; };
  const isAdmin = uid => !!uid && S.db.admins[uid] === true;
  const canRead = (s, uid) => { const [a, b] = s; if (a === 'definitions') return true; if (['proposals', 'reports', 'events', 'interest'].includes(a)) return isAdmin(uid); if (a === 'audit') return isAdmin(uid); if (a === 'profiles') return isAdmin(uid) || (!!b && b === uid); if (a === 'admins') return !!b && b === uid; if (a === 'users') return !!b && b === uid; return false; };
  const canWrite = (s, m, body, uid) => {
    const [a, b, c] = s;
    if (a === 'definitions') return isAdmin(uid);
    if (a === 'audit') return isAdmin(uid) && !!body && (m === 'POST' && !b || (m === 'PUT' && !!b && get('audit/' + b) == null));
    if (['proposals', 'reports', 'events', 'interest'].includes(a)) { if (isAdmin(uid)) return true; if (m === 'POST' && !b) return true; return b && m !== 'DELETE' && get(a + '/' + b) == null; }
    if (a === 'profiles' && b) { if (isAdmin(uid)) return true; if (uid !== b) return false; if (m === 'DELETE' && !c) return true; if (c === 'lastSeen') return true; if (m === 'PATCH' && body && Object.keys(body).every(k => k === 'lastSeen')) return true; return get('profiles/' + b) == null && body && body.plan === 'free'; }
    if (a === 'users' && b) return uid === b;
    return false;
  };
  S.install = async (pg, o = {}) => {
    const H = { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
    const J = (rt, status, j) => rt.fulfill({ status, headers: H, body: JSON.stringify(j) });
    await pg.route('**/*firebaseio.com/**', rt => {
      const rq = rt.request(), u = new URL(rq.url()), m = rq.method();
      if (m === 'OPTIONS') return rt.fulfill({ status: 204, headers: H });
      const p = decodeURIComponent(u.pathname).replace(/^\/|\.json$/g, ''), s = seg(p), tok = u.searchParams.get('auth'), uid = tok ? S.tokens[tok] : null;
      if (tok && !uid) return J(rt, 401, { error: 'Auth token is expired' });
      let body = null; try { body = rq.postData() ? JSON.parse(rq.postData()) : null; } catch (e) {}
      if (m === 'GET') { if (!canRead(s, uid)) return J(rt, 401, { error: 'Permission denied' }); const v = get(p); return J(rt, 200, v === undefined ? null : v); }
      if (!canWrite(s, m, body, uid)) return J(rt, 401, { error: 'Permission denied' });
      if (p === 'definitions' && m === 'PUT' && (S.flags.failDefsPut || (o.flags && o.flags.failDefsPut))) return J(rt, 500, { error: 'boom' });
      if (m === 'PUT') { set(p, body); if (s[0] === 'events' && o.onEvent) o.onEvent(body); return J(rt, 200, body); }
      if (m === 'PATCH') { const cur = get(p) || {}; set(p, Object.assign({}, cur, body)); return J(rt, 200, body); }
      if (m === 'DELETE') { set(p, null); return J(rt, 200, null); }
      if (m === 'POST') { const k = '-k' + (++S.n); set(p + '/' + k, body); if (s[0] === 'events' && o.onEvent) o.onEvent(body); return J(rt, 200, { name: k }); }
      J(rt, 400, {});
    });
    await pg.route('**/identitytoolkit.googleapis.com/**', rt => {
      const rq = rt.request(), u = new URL(rq.url()), m = rq.method(); if (m === 'OPTIONS') return rt.fulfill({ status: 204, headers: H });
      const ep = u.pathname.split('/').pop(), b = JSON.parse(rq.postData() || '{}'), err = msg => J(rt, 400, { error: { code: 400, message: msg } });
      if (u.searchParams.get('key') !== 'TESTKEY') return err('API_KEY_INVALID');
      const byUid = uid => Object.entries(S.accounts).find(([, a]) => a.uid === uid);
      if (ep === 'accounts:signUp') { if (S.accounts[b.email]) return err('EMAIL_EXISTS'); if (!b.password || b.password.length < 6) return err('WEAK_PASSWORD'); const uid = S.addAccount(b.email, b.password, ''); return J(rt, 200, Object.assign({ email: b.email }, mkTok(uid))); }
      if (ep === 'accounts:signInWithPassword') { const a = S.accounts[b.email]; if (!a || a.pw !== b.password) return err('INVALID_LOGIN_CREDENTIALS'); return J(rt, 200, Object.assign({ email: b.email, displayName: a.name }, mkTok(a.uid))); }
      const uid = S.tokens[b.idToken]; if (!uid) return err('INVALID_ID_TOKEN'); const ent = byUid(uid); if (!ent) return err('USER_NOT_FOUND'); const [email, a] = ent;
      if (ep === 'accounts:lookup') return J(rt, 200, { users: [{ localId: uid, email, displayName: a.name, createdAt: String(a.created) }] });
      if (ep === 'accounts:update') { if (b.displayName) a.name = b.displayName; if (b.password) a.pw = b.password; return J(rt, 200, Object.assign({ email }, b.returnSecureToken ? mkTok(uid) : {})); }
      if (ep === 'accounts:delete') { delete S.accounts[email]; return J(rt, 200, {}); }
      err('OPERATION_NOT_ALLOWED');
    });
    await pg.route('**/securetoken.googleapis.com/**', rt => {
      const rq = rt.request(); if (rq.method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: H });
      const rf = new URLSearchParams(rq.postData() || '').get('refresh_token'), uid = S.refresh[rf]; if (!uid) return J(rt, 400, { error: { message: 'INVALID_REFRESH_TOKEN' } });
      const t = mkTok(uid); J(rt, 200, { id_token: t.idToken, refresh_token: t.refreshToken, expires_in: '3600', user_id: uid });
    });
  };
  return S;
};

// Tests unitaires de la logique des flammes (Node, sans navigateur).
const store = {};
global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, get length() { return Object.keys(store).length; }, key: i => Object.keys(store)[i] };
global.sessionStorage = global.localStorage;
global.matchMedia = () => ({ matches: false, addEventListener() {} });
global.document = { documentElement: { dataset: {}, style: {}, removeAttribute() {} }, querySelector: () => null };
global.window = global; global.EventTarget = EventTarget; global.CustomEvent = CustomEvent;
global.crypto = require('crypto').webcrypto; global.fetch = () => Promise.reject(new Error('offline'));
require('../js/core.js');
const LP = window.LP, assert = require('assert');
let pass = 0; const t = (n, f) => { try { f(); pass++; console.log('  ok  ' + n); } catch (e) { console.error(' FAIL ' + n + ' → ' + e.message); process.exitCode = 1; } };
const act = LP.activity(), day = o => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + o); return LP.dkey(d); };

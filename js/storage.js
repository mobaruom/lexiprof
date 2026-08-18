/* ============================================================
   LEXIPROF — STORAGE.JS
   Chargement rapide avec timeout + fallback
   ============================================================ */

async function loadRemote() {
  // Timeout de 3 secondes max pour JSONBin
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(BIN_URL + '/latest', {
      method: 'GET',
      headers: HEADERS_R,
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('HTTP ' + response.status);

    const data = await response.json();
    const record = data?.record ?? data;
    const remoteDefs = record?.definitions;

    if (!Array.isArray(remoteDefs)) throw new Error('Format invalide');

    definitions = remoteDefs.map(normalizeDefinition);

    try {
      localStorage.setItem('lexiprof_fallback', JSON.stringify(definitions));
    } catch (e) {}

    console.log('✅ JSONBin: ' + definitions.length + ' definitions');
    return true;

  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('⚠️ JSONBin indisponible:', error.message);

    // Fallback local immediat
    try {
      const stored = localStorage.getItem('lexiprof_fallback');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          definitions = parsed.map(normalizeDefinition);
          console.log('✅ Fallback local: ' + definitions.length + ' definitions');
          return true;
        }
      }
    } catch (e) {
      localStorage.removeItem('lexiprof_fallback');
    }

    // Dernier recours: donnees par defaut
    definitions = defaultData.map(normalizeDefinition);
    console.log('✅ Donnees par defaut: ' + definitions.length + ' definitions');
    try {
      localStorage.setItem('lexiprof_fallback', JSON.stringify(definitions));
    } catch (_) {}
    return false;
  }
}

async function saveRemote() {
  try {
    const response = await fetch(BIN_URL, {
      method: 'PUT',
      headers: HEADERS_W,
      body: JSON.stringify({ definitions: definitions })
    });

    if (!response.ok) throw new Error('HTTP ' + response.status);

    try {
      localStorage.setItem('lexiprof_fallback', JSON.stringify(definitions));
    } catch (e) {}

    console.log('✅ JSONBin sauvegarde: ' + definitions.length + ' definitions');
    return true;

  } catch (error) {
    console.error('❌ Sauvegarde JSONBin:', error);
    try {
      localStorage.setItem('lexiprof_fallback', JSON.stringify(definitions));
    } catch (e) {}
    showToast('⚠️ JSONBin indisponible — copie locale conservee.');
    return false;
  }
}

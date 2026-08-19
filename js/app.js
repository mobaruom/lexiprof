/* ============================================================
   LEXIPROF — APP.JS v7.0
   ============================================================ */

// ----------------------------
// DONNÉES PAR DÉFAUT
// ----------------------------
const defaultData = [
  {
    id: 1,
    term: 'Management',
    matiere: 'Management',
    def: 'Ensemble des techniques permettant de diriger, organiser et coordonner les ressources d\'une organisation afin d\'atteindre ses objectifs.',
    example: 'Un manager organise le travail de son equipe, repartit les taches et suit les resultats.',
    remember: 'Le management consiste notamment a organiser, decider, coordonner et motiver.'
  },
  {
    id: 2,
    term: 'Leadership',
    matiere: 'Management',
    def: 'Capacite d\'une personne a guider, influencer et motiver un groupe d\'individus vers la realisation d\'objectifs communs.',
    example: 'Un responsable qui motive son equipe autour d\'un projet fait preuve de leadership.',
    remember: 'Leadership = influencer, guider et motiver.'
  },
  {
    id: 3,
    term: 'Organigramme',
    matiere: 'Management',
    def: 'Representation graphique de la structure hierarchique et fonctionnelle d\'une organisation.',
    example: 'L\'organigramme d\'une entreprise permet de voir qui depend de quel responsable.',
    remember: 'Il permet de visualiser les relations hierarchiques.'
  },
  {
    id: 4,
    term: 'Contrat de travail',
    matiere: 'Droit',
    def: 'Convention par laquelle une personne, le salarie, s\'engage a travailler pour le compte et sous la direction d\'un employeur en echange d\'une remuneration.',
    example: 'Un CDI signe entre une entreprise et un salarie constitue un contrat de travail.',
    remember: 'Travail + remuneration + lien de subordination.'
  },
  {
    id: 5,
    term: 'Personne morale',
    matiere: 'Droit',
    def: 'Entite juridique distincte des personnes physiques qui la composent, dotee de droits et d\'obligations propres.',
    example: 'Une societe ou une association peut etre une personne morale.',
    remember: 'Une personne morale possede une existence juridique propre.'
  },
  {
    id: 6,
    term: 'PIB',
    matiere: 'Économie',
    def: 'Produit Interieur Brut. Indicateur macroeconomique mesurant la valeur totale des biens et services produits sur le territoire national au cours d\'une periode donnee.',
    example: 'Le PIB permet notamment de mesurer la production economique d\'un pays.',
    remember: 'PIB = valeur des biens et services produits sur un territoire.'
  },
  {
    id: 7,
    term: 'Inflation',
    matiere: 'Économie',
    def: 'Hausse generalisee et durable du niveau des prix des biens et services dans une economie.',
    example: 'Lorsque les prix augmentent durablement, le pouvoir d\'achat de la monnaie diminue.',
    remember: 'Inflation = hausse generale et durable des prix.'
  },
  {
    id: 8,
    term: 'Recrutement',
    matiere: 'RH',
    def: 'Processus par lequel une organisation identifie, attire et selectionne des candidats afin de pourvoir un poste vacant.',
    example: 'Une entreprise publie une offre d\'emploi puis selectionne les candidats.',
    remember: 'Recruter = rechercher, selectionner puis integrer un candidat.'
  },
  {
    id: 9,
    term: 'GPEC',
    matiere: 'RH',
    def: 'Gestion Previsionnelle des Emplois et des Competences. Demarche permettant d\'anticiper les besoins futurs d\'une organisation en emplois et en competences.',
    example: 'Une entreprise peut prevoir des formations pour preparer ses salaries a de nouvelles competences.',
    remember: 'GPEC = anticiper les besoins futurs en emplois et competences.'
  }
];

// ----------------------------
// VARIABLES GLOBALES
// ----------------------------
let definitions = [];
let currentFilter = 'all';
let searchQuery = '';
let favorites = JSON.parse(localStorage.getItem('lexiprof_favorites') || '[]');
let currentFlashcardIndex = 0;
let flashcardList = [];
let deferredInstallPrompt = null;
let editingDefinitionId = null;
let searchHistory = JSON.parse(localStorage.getItem('lexiprof_search_history') || '[]');
let currentRandomId = null;
let focusMode = false;
let konamiIndex = 0;
let visibleCardCount = 0;

const CARDS_PER_BATCH = 10;
const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

// ----------------------------
// FONCTIONS UTILITAIRES
// ----------------------------
function nextId() {
  if (!definitions.length) return 1;
  return Math.max(...definitions.map(d => Number(d.id) || 0)) + 1;
}

function getPassword() {
  return localStorage.getItem(PWD_KEY) || DEFAULT_PW;
}

function escapeHTML(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeDefinition(d) {
  return {
    id: Number(d.id) || nextId(),
    term: String(d.term || '').trim(),
    matiere: String(d.matiere || 'Management').trim(),
    def: String(d.def || d.definition || '').trim(),
    example: String(d.example || '').trim(),
    remember: String(d.remember || '').trim()
  };
}

function highlight(text, q) {
  const safe = escapeHTML(text);
  if (!q) return safe;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return safe.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>');
}

// ----------------------------
// ANIMATION HERO
// ----------------------------
function initHeroAnimation() {
  const title = document.getElementById('heroTitle');
  if (!title) return;

  const text = 'Dictionnaire STMG';
  title.innerHTML = '';

  text.split('').forEach((char, i) => {
    const span = document.createElement('span');
    span.className = 'hero-char';
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.animationDelay = `${i * 0.06}s`;
    title.appendChild(span);
  });
}

// ----------------------------
// CHARGEMENT AVEC SKELETON
// ----------------------------
async function load() {
  showSkeleton(true);
  try {
    await loadRemote();
  } catch (e) {
    console.error(e);
  }
  showSkeleton(false);
  render();
  initHeroAnimation();

  const loader = document.getElementById('globalLoader');
  if (loader) loader.classList.add('hidden');
}

function showSkeleton(show) {
  const skeleton = document.getElementById('skeletonContainer');
  const container = document.getElementById('cardsContainer');
  if (skeleton) skeleton.style.display = show ? 'flex' : 'none';
  if (container) container.style.display = show ? 'none' : 'flex';
}

function setLoading(on) {
  const container = document.getElementById('cardsContainer');
  if (!container) return;

  if (on) {
    container.innerHTML = `
      <div class='empty-state'>
        <div class='icon'>⏳</div>
        <h3>Chargement...</h3>
        <p>Récupération des définitions.</p>
      </div>
    `;
  }
}

// ----------------------------
// FILTRAGE
// ----------------------------
function getFilteredDefinitions() {
  const q = searchQuery.toLowerCase().trim();
  let filtered = [...definitions];

  if (currentFilter === 'favorites') {
    filtered = filtered.filter(d => favorites.includes(Number(d.id)));
  } else if (currentFilter !== 'all') {
    filtered = filtered.filter(d => d.matiere === currentFilter);
  }

  if (q) {
    filtered = filtered.filter(d => {
      const term = d.term.toLowerCase();
      const def = d.def.toLowerCase();
      return term.includes(q) || def.includes(q);
    });
  }

  filtered.sort((a, b) => a.term.localeCompare(b.term, 'fr'));
  return filtered;
}

// ----------------------------
// RENDU PRINCIPAL AVEC FLIP
// ----------------------------
function render() {
  const container = document.getElementById('cardsContainer');
  const info = document.getElementById('resultsInfo');

  if (!container) return;

  const filtered = getFilteredDefinitions();

  if (info) {
    if (searchQuery || currentFilter !== 'all') {
      info.textContent = `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}`;
    } else {
      info.textContent = `${definitions.length} définition${definitions.length !== 1 ? 's' : ''}`;
    }
  }

  updateCounter();

  if (!filtered.length) {
    container.innerHTML = `
      <div class='empty-state'>
        <div class='icon'>🔍</div>
        <h3>Aucun résultat</h3>
        <p>Essaie un autre terme ou change le filtre.</p>
      </div>
    `;
    visibleCardCount = 0;
    return;
  }

  visibleCardCount = Math.min(CARDS_PER_BATCH, filtered.length);
  renderCardsBatch(filtered, 0, visibleCardCount);
}

function renderCardsBatch(filtered, start, end) {
  const container = document.getElementById('cardsContainer');
  if (!container) return;

  const batch = filtered.slice(start, end);
  const html = batch.map((d, i) => createCardHTML(d, start + i)).join('');

  if (start === 0) {
    container.innerHTML = html;
  } else {
    container.insertAdjacentHTML('beforeend', html);
  }
}

function createCardHTML(d, index) {
  const isFav = favorites.includes(Number(d.id));

  return `
    <article
      class='card'
      data-id='${d.id}'
      data-matiere='${escapeHTML(d.matiere)}'
      style='animation-delay:${Math.min(index * 30, 300)}ms'
    >
      <div class='card-top'>
        <div class='card-term'>${highlight(d.term, searchQuery)}</div>
        <span class='matiere-badge badge-${escapeHTML(d.matiere)}'>${escapeHTML(d.matiere)}</span>
      </div>
      <div class='card-def'>${highlight(d.def, searchQuery)}</div>
      <div class='card-actions-row'>
        <button class='open-card-btn' onclick='toggleCard(${d.id}, this)'>📖 Ouvrir la fiche</button>
        <button class='card-action-btn' onclick='copyDefinition(${d.id})' title='Copier'>📋</button>
        <button class='card-action-btn' onclick='shareDefinition(${d.id})' title='Partager'>🔗</button>
        <button
          class='card-action-btn fav-btn ${isFav ? 'active' : ''}'
          onclick='toggleFavorite(${d.id})'
          title='Favori'
        >
          ${isFav ? '★' : '☆'}
        </button>
      </div>
      <div class='card-extra' id='card-${d.id}'>
        ${d.example ? `<div class='extra-block'><h4>💡 Exemple concret</h4><p>${escapeHTML(d.example)}</p></div>` : ''}
        ${d.remember ? `<div class='extra-block'><h4>📝 À retenir</h4><p>${escapeHTML(d.remember)}</p></div>` : ''}
      </div>
    </article>
  `;
}

function toggleCard(id, btn) {
  const extra = document.getElementById(`card-${id}`);
  if (!extra) return;

  const open = extra.classList.contains('open');
  if (open) {
    extra.classList.remove('open');
    btn.innerHTML = '📖 Ouvrir la fiche';
  } else {
    extra.classList.add('open');
    btn.innerHTML = '📕 Fermer la fiche';
  }
}

// ----------------------------
// COPIER / PARTAGER
// ----------------------------
async function copyDefinition(id) {
  const d = definitions.find(x => Number(x.id) === Number(id));
  if (!d) return;

  const text = `${d.term} (${d.matiere})
${d.def}${d.example ? `\n💡 Exemple : ${d.example}` : ''}${d.remember ? `\n📝 À retenir : ${d.remember}` : ''}`;

  try {
    await navigator.clipboard.writeText(text);
    showToast('📋 Définition copiée !');
  } catch (e) {
    showToast('⚠️ Impossible de copier');
  }
}

async function shareDefinition(id) {
  const d = definitions.find(x => Number(x.id) === Number(id));
  if (!d) return;

  const url = `${location.origin}${location.pathname}#def=${d.id}`;
  const text = `${d.term} — ${d.matiere}`;

  if (navigator.share) {
    try {
      await navigator.share({
        title: `LexiProf — ${d.term}`,
        text,
        url
      });
    } catch (e) {}
  } else {
    try {
      await navigator.clipboard.writeText(url);
      showToast('🔗 Lien copié !');
    } catch (e) {
      showToast('⚠️ Impossible de partager');
    }
  }
}

// ----------------------------
// HASH
// ----------------------------
function checkHash() {
  const hash = location.hash;
  if (!hash.startsWith('#def=')) return;

  const id = Number(hash.replace('#def=', ''));
  if (!id) return;

  setTimeout(() => {
    const card = document.querySelector(`.card[data-id='${id}']`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const btn = card.querySelector('.open-card-btn');
      if (btn) toggleCard(id, btn);
    }
  }, 600);
}

// ----------------------------
// RECHERCHE
// ----------------------------
function onSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  searchQuery = input.value;
  updateSearchClear();
  addToSearchHistory(searchQuery);
  render();
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  input.value = '';
  searchQuery = '';
  updateSearchClear();
  render();
  input.focus();
}

function updateSearchClear() {
  const btn = document.getElementById('searchClear');
  if (!btn) return;
  btn.classList.toggle('visible', Boolean(searchQuery));
}

function addToSearchHistory(query) {
  if (!query || query.length < 2) return;

  searchHistory = searchHistory.filter(q => q.toLowerCase() !== query.toLowerCase());
  searchHistory.unshift(query);

  if (searchHistory.length > 5) searchHistory.pop();

  localStorage.setItem('lexiprof_search_history', JSON.stringify(searchHistory));
  renderSearchHistory();
}

function renderSearchHistory() {
  const container = document.getElementById('searchHistory');
  if (!container) return;

  if (!searchHistory.length) {
    container.classList.remove('visible');
    return;
  }

  container.classList.add('visible');
  container.innerHTML = searchHistory
    .map(q => `<button onclick='setSearchQuery(${JSON.stringify(escapeHTML(q))})'>${escapeHTML(q)}</button>`)
    .join('');
}

function setSearchQuery(q) {
  const input = document.getElementById('searchInput');
  if (input) input.value = q;
  searchQuery = q;
  updateSearchClear();
  render();
}

// ----------------------------
// FILTRES DROPDOWN
// ----------------------------
function toggleFilterDropdown() {
  const menu = document.getElementById('filterDropdownMenu');
  const btn = document.getElementById('filterDropdownBtn');

  if (!menu || !btn) return;

  const isOpen = menu.classList.contains('open');
  if (isOpen) {
    closeFilterDropdown();
  } else {
    menu.classList.add('open');
    btn.classList.add('open');
    document.addEventListener('click', closeFilterDropdownOnClickOutside);
  }
}

function closeFilterDropdown() {
  const menu = document.getElementById('filterDropdownMenu');
  const btn = document.getElementById('filterDropdownBtn');

  if (menu) menu.classList.remove('open');
  if (btn) btn.classList.remove('open');
  document.removeEventListener('click', closeFilterDropdownOnClickOutside);
}

function closeFilterDropdownOnClickOutside(e) {
  const wrap = document.querySelector('.filter-dropdown-wrap');
  if (wrap && !wrap.contains(e.target)) {
    closeFilterDropdown();
  }
}

function setFilterFromDropdown(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-dropdown-item').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const label = document.getElementById('filterDropdownLabel');
  const dot = document.getElementById('filterDropdownDot');

  if (label) {
    const labels = {
      all: 'Toutes les matières',
      Management: 'Management',
      Droit: 'Droit',
      'Économie': 'Économie',
      RH: 'RH',
      favorites: 'Mes favoris'
    };
    label.textContent = labels[filter] || filter;
  }

  if (dot) {
    const colors = {
      all: 'var(--text)',
      Management: 'var(--mgt)',
      Droit: 'var(--drt)',
      'Économie': 'var(--eco)',
      RH: 'var(--rh)',
      favorites: 'var(--drt)'
    };
    dot.style.background = colors[filter] || 'var(--text)';
  }

  closeFilterDropdown();
  render();
}

// ----------------------------
// FAVORIS
// ----------------------------
function toggleFavorite(id) {
  id = Number(id);
  const card = document.querySelector(`.card[data-id='${id}']`);

  if (favorites.includes(id)) {
    favorites = favorites.filter(x => x !== id);
    showToast('☆ Retiré des favoris');
  } else {
    favorites.push(id);
    showToast('★ Ajouté aux favoris');
    if (card) card.classList.add('pop');
  }

  localStorage.setItem('lexiprof_favorites', JSON.stringify(favorites));
  render();
}

function updateCounter() {
  const counter = document.getElementById('defCounter');
  if (!counter) return;
  counter.textContent = `${definitions.length} définition${definitions.length !== 1 ? 's' : ''} disponible${definitions.length !== 1 ? 's' : ''}`;
}

// ----------------------------
// THÈME
// ----------------------------
function initTheme() {
  const saved = localStorage.getItem('lexiprof_theme');
  if (saved === 'dark') document.body.classList.add('dark');
  updateThemeButton();
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  localStorage.setItem('lexiprof_theme', dark ? 'dark' : 'light');
  updateThemeButton();
}

function updateThemeButton() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;

  const dark = document.body.classList.contains('dark');
  btn.innerHTML = dark ? '☀️' : '🌙';
  btn.title = dark ? 'Mode clair' : 'Mode sombre';
}

// ----------------------------
// MODE FOCUS
// ----------------------------
function toggleFocusMode() {
  focusMode = !focusMode;
  document.body.classList.toggle('focus-mode-active', focusMode);

  const btn = document.getElementById('btnFocusMode');
  if (btn) btn.classList.toggle('active', focusMode);

  showToast(focusMode ? '🎯 Mode Focus activé' : '🎯 Mode Focus désactivé');
}

// ----------------------------
// AUTHENTIFICATION ADMIN
// ----------------------------
function openAdmin() {
  const input = document.getElementById('pwdInput');
  const error = document.getElementById('pwdError');
  const overlay = document.getElementById('pwdOverlay');

  if (!overlay) return;

  if (input) {
    input.value = '';
    input.classList.remove('error');
  }

  if (error) error.textContent = '';
  overlay.classList.add('open');

  setTimeout(() => {
    if (input) input.focus();
  }, 150);
}

function closePwdModal() {
  const overlay = document.getElementById('pwdOverlay');
  if (overlay) overlay.classList.remove('open');
}

function checkPassword() {
  const input = document.getElementById('pwdInput');
  const error = document.getElementById('pwdError');

  if (!input) return;

  if (input.value === getPassword()) {
    closePwdModal();
    openAdminPanel();
  } else {
    if (error) error.textContent = 'Mot de passe incorrect.';
    input.classList.add('error');
    input.value = '';
    setTimeout(() => input.classList.remove('error'), 400);
  }
}

// ----------------------------
// PANEL ADMIN
// ----------------------------
function openAdminPanel() {
  renderAdminList();

  const changePwd = document.getElementById('changePwdForm');
  if (changePwd) changePwd.classList.remove('open');

  const overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.add('open');
}

function closeAdmin() {
  const overlay = document.getElementById('overlay');
  if (overlay) overlay.classList.remove('open');
}

function handleOverlayClick(e) {
  const overlay = document.getElementById('overlay');
  if (overlay && e.target === overlay) closeAdmin();
}

// ----------------------------
// LISTE ADMIN
// ----------------------------
function renderAdminList() {
  const list = document.getElementById('adminList');
  const count = document.getElementById('adminCount');

  if (!list) return;

  if (count) count.textContent = definitions.length;

  const sorted = [...definitions].sort((a, b) => a.term.localeCompare(b.term, 'fr'));

  if (!sorted.length) {
    list.innerHTML = `
      <p style='color:var(--text-muted);font-size:13px;text-align:center;padding:16px 0;'>
        Aucune définition.
      </p>
    `;
    return;
  }

  list.innerHTML = sorted
    .map(
      d => `
        <div class='admin-item'>
          <div>
            <div class='admin-item-term'>${escapeHTML(d.term)}</div>
            <div class='admin-item-meta'>${escapeHTML(d.matiere)}</div>
          </div>
          <div class='admin-item-actions'>
            <button class='btn-edit' onclick='editDefinition(${d.id})' title='Modifier'>✎</button>
            <button class='btn-del' onclick='deleteDefinition(${d.id})' title='Supprimer'>✕</button>
          </div>
        </div>
      `
    )
    .join('');
}

// ----------------------------
// FORMULAIRE
// ----------------------------
function handleFormAction() {
  if (editingDefinitionId) {
    saveEditedDefinition();
  } else {
    addDefinition();
  }
}

function cancelEdit() {
  editingDefinitionId = null;
  clearDefinitionForm();

  const btnFormAction = document.getElementById('btnFormAction');
  const btnCancelEdit = document.getElementById('btnCancelEdit');
  const formTitle = document.getElementById('formTitle');

  if (btnFormAction) btnFormAction.textContent = '+ Ajouter la définition';
  if (btnCancelEdit) btnCancelEdit.style.display = 'none';
  if (formTitle) formTitle.textContent = 'Ajouter une définition';
}

async function addDefinition() {
  const term = document.getElementById('formTerm')?.value.trim();
  const matiere = document.getElementById('formMatiere')?.value;
  const def = document.getElementById('formDef')?.value.trim();

  if (!term || !def) {
    showToast('⚠️ Remplis le terme et la définition !');
    return;
  }

  const duplicate = definitions.find(
    d => d.term.toLowerCase() === term.toLowerCase() && d.matiere === matiere
  );

  if (duplicate) {
    showToast('⚠️ Ce terme existe déjà.');
    return;
  }

  const example = document.getElementById('formExample')?.value.trim() || '';
  const remember = document.getElementById('formRemember')?.value.trim() || '';

  definitions.push({ id: nextId(), term, matiere, def, example, remember });

  showToast('⏳ Sauvegarde...');

  try {
    await saveRemote();
    render();
    renderAdminList();
    clearDefinitionForm();
    showToast('✅ Définition ajoutée !');
  } catch (error) {
    console.error(error);
    showToast('⚠️ Erreur de sauvegarde.');
  }
}

function clearDefinitionForm() {
  ['formTerm', 'formDef', 'formExample', 'formRemember'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const matiere = document.getElementById('formMatiere');
  if (matiere) matiere.value = 'Management';
}

function editDefinition(id) {
  const d = definitions.find(x => Number(x.id) === Number(id));
  if (!d) return;

  const term = document.getElementById('formTerm');
  const matiere = document.getElementById('formMatiere');
  const def = document.getElementById('formDef');
  const example = document.getElementById('formExample');
  const remember = document.getElementById('formRemember');

  if (term) term.value = d.term;
  if (matiere) matiere.value = d.matiere;
  if (def) def.value = d.def;
  if (example) example.value = d.example || '';
  if (remember) remember.value = d.remember || '';

  editingDefinitionId = Number(id);

  const btnFormAction = document.getElementById('btnFormAction');
  const btnCancelEdit = document.getElementById('btnCancelEdit');
  const formTitle = document.getElementById('formTitle');

  if (btnFormAction) btnFormAction.textContent = '💾 Enregistrer les modifications';
  if (btnCancelEdit) btnCancelEdit.style.display = 'block';
  if (formTitle) formTitle.textContent = 'Modifier la définition';

  showToast('✏️ Modification en cours');

  const admin = document.querySelector('.admin-panel');
  if (admin) admin.scrollTo({ top: 0, behavior: 'smooth' });
}

async function saveEditedDefinition() {
  const id = editingDefinitionId;
  if (!id) {
    await addDefinition();
    return;
  }

  const d = definitions.find(x => Number(x.id) === Number(id));
  if (!d) return;

  d.term = document.getElementById('formTerm')?.value.trim();
  d.matiere = document.getElementById('formMatiere')?.value;
  d.def = document.getElementById('formDef')?.value.trim();
  d.example = document.getElementById('formExample')?.value.trim() || '';
  d.remember = document.getElementById('formRemember')?.value.trim() || '';

  await saveRemote();

  editingDefinitionId = null;
  clearDefinitionForm();

  const btnFormAction = document.getElementById('btnFormAction');
  const btnCancelEdit = document.getElementById('btnCancelEdit');
  const formTitle = document.getElementById('formTitle');

  if (btnFormAction) btnFormAction.textContent = '+ Ajouter la définition';
  if (btnCancelEdit) btnCancelEdit.style.display = 'none';
  if (formTitle) formTitle.textContent = 'Ajouter une définition';

  render();
  renderAdminList();
  showToast('✅ Définition modifiée !');
}

async function deleteDefinition(id) {
  if (!confirm('Supprimer cette définition ?')) return;

  definitions = definitions.filter(d => Number(d.id) !== Number(id));
  favorites = favorites.filter(x => Number(x) !== Number(id));

  localStorage.setItem('lexiprof_favorites', JSON.stringify(favorites));

  try {
    await saveRemote();
    render();
    renderAdminList();
    showToast('🗑️ Définition supprimée.');
  } catch (error) {
    console.error(error);
    showToast('⚠️ Erreur de sauvegarde.');
  }
}

// ----------------------------
// MOT DE PASSE
// ----------------------------
function toggleChangePwd() {
  const form = document.getElementById('changePwdForm');
  if (form) form.classList.toggle('open');
}

function changePassword() {
  const p1 = document.getElementById('newPwd1')?.value;
  const p2 = document.getElementById('newPwd2')?.value;

  if (!p1 || p1.length < 4) {
    showToast('⚠️ Minimum 4 caractères.');
    return;
  }

  if (p1 !== p2) {
    showToast('⚠️ Les mots de passe ne correspondent pas.');
    return;
  }

  localStorage.setItem(PWD_KEY, p1);
  document.getElementById('newPwd1').value = '';
  document.getElementById('newPwd2').value = '';
  document.getElementById('changePwdForm')?.classList.remove('open');
  showToast('🔑 Mot de passe mis à jour !');
}

// ----------------------------
// IMPORT / EXPORT
// ----------------------------
function importJson() {
  const input = document.getElementById('jsonImport');
  if (!input || !input.files || !input.files[0]) {
    showToast('⚠️ Sélectionne un fichier JSON.');
    return;
  }

  handleJSONImportFile(input.files[0]);
  input.value = '';
}

function handleJSONImportFile(file) {
  const reader = new FileReader();
  reader.onload = async e => {
    try {
      const parsed = JSON.parse(e.target.result);
      await processImport(parsed);
    } catch (error) {
      console.error(error);
      showToast('❌ JSON invalide.');
    }
  };
  reader.readAsText(file);
}

function handleJSONImport() {
  const textarea = document.getElementById('jsonPaste');
  if (!textarea) return;

  const text = textarea.value.trim();
  if (!text) {
    showToast('⚠️ Colle d\'abord ton JSON.');
    return;
  }

  try {
    const parsed = JSON.parse(text);
    processImport(parsed).then(() => {
      textarea.value = '';
    });
  } catch (error) {
    console.error(error);
    showToast('❌ JSON invalide ou mauvais format.');
  }
}

async function processImport(parsed) {
  const imported = Array.isArray(parsed)
    ? parsed
    : (Array.isArray(parsed.definitions) ? parsed.definitions : []);

  if (!imported.length) throw new Error('Aucune définition trouvée.');

  let added = 0;
  imported.forEach(raw => {
    const d = normalizeDefinition(raw);
    if (!d.term || !d.def) return;

    const exists = definitions.some(
      existing => existing.term.toLowerCase() === d.term.toLowerCase() && existing.matiere === d.matiere
    );

    if (exists) return;

    d.id = nextId();
    definitions.push(d);
    added++;
  });

  await saveRemote();
  render();
  renderAdminList();
  showToast(`✅ ${added} définition${added !== 1 ? 's' : ''} importée${added !== 1 ? 's' : ''}`);
}

function exportJson() {
  const data = JSON.stringify(definitions, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'lexiprof-definitions.json';
  a.click();

  URL.revokeObjectURL(url);
  showToast('📦 JSON exporté !');
}

// ----------------------------
// FLASHCARDS
// ----------------------------
function openFlashcards() {
  flashcardList = getFilteredDefinitions();
  if (!flashcardList.length) {
    showToast('⚠️ Aucune définition disponible.');
    return;
  }

  currentFlashcardIndex = 0;
  renderFlashcard();
}

function renderFlashcard() {
  const d = flashcardList[currentFlashcardIndex];
  if (!d) return;

  const overlay = document.getElementById('flashcardOverlay');
  if (!overlay) return;

  const meta = document.getElementById('flashcardMeta');
  const term = document.getElementById('flashcardTerm');
  const def = document.getElementById('flashcardDef');
  const counter = document.getElementById('flashcardCounter');
  const reveal = document.getElementById('flashcardReveal');

  if (meta) meta.textContent = d.matiere;
  if (term) term.textContent = d.term;
  if (def) {
    def.textContent = d.def;
    def.style.display = 'none';
  }
  if (counter) counter.textContent = `${currentFlashcardIndex + 1} / ${flashcardList.length}`;
  if (reveal) {
    reveal.style.display = 'block';
    reveal.textContent = 'Cliquez pour révéler';
  }

  overlay.classList.add('open');
}

function revealFlashcard() {
  const def = document.getElementById('flashcardDef');
  const reveal = document.getElementById('flashcardReveal');

  if (!def || !reveal) return;

  const hidden = def.style.display === 'none';
  def.style.display = hidden ? 'block' : 'none';
  reveal.textContent = hidden ? 'Cliquez pour masquer' : 'Cliquez pour révéler';
}

function nextFlashcard() {
  if (!flashcardList.length) return;
  currentFlashcardIndex = (currentFlashcardIndex + 1) % flashcardList.length;
  renderFlashcard();
}

function prevFlashcard() {
  if (!flashcardList.length) return;
  currentFlashcardIndex = (currentFlashcardIndex - 1 + flashcardList.length) % flashcardList.length;
  renderFlashcard();
}

function closeFlashcard(e) {
  if (e && e.target !== e.currentTarget) return;
  const overlay = document.getElementById('flashcardOverlay');
  if (overlay) overlay.classList.remove('open');
}

// ----------------------------
// DÉFINITION ALÉATOIRE
// ----------------------------
function showRandomDefinition() {
  if (!definitions.length) {
    showToast('⚠️ Aucune définition.');
    return;
  }

  const d = definitions[Math.floor(Math.random() * definitions.length)];
  currentRandomId = d.id;

  const modal = document.getElementById('randomModal');
  if (!modal) return;

  const matiere = document.getElementById('randomMatiere');
  const term = document.getElementById('randomTerm');
  const def = document.getElementById('randomDef');

  if (matiere) matiere.textContent = d.matiere;
  if (term) term.textContent = d.term;
  if (def) def.textContent = d.def;

  modal.classList.add('open');
}

function openRandomDefinition() {
  closeRandomModal();
  if (currentRandomId) {
    const card = document.querySelector(`.card[data-id='${currentRandomId}']`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const btn = card.querySelector('.open-card-btn');
      if (btn) toggleCard(currentRandomId, btn);
    }
  }
}

function closeRandomModal() {
  const modal = document.getElementById('randomModal');
  if (modal) modal.classList.remove('open');
}

// ----------------------------
// TOAST
// ----------------------------
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// ----------------------------
// KONAMI CODE
// ----------------------------
function initKonami() {
  document.addEventListener('keydown', e => {
    if (e.key === KONAMI_CODE[konamiIndex]) {
      konamiIndex++;
      if (konamiIndex === KONAMI_CODE.length) {
        activateRetroMode();
        konamiIndex = 0;
      }
    } else {
      konamiIndex = 0;
    }
  });
}

function activateRetroMode() {
  const overlay = document.getElementById('retroOverlay');
  if (overlay) overlay.classList.add('active');
  showToast('🕹️ Mode Rétro activé !');
}

function deactivateRetroMode() {
  const overlay = document.getElementById('retroOverlay');
  if (overlay) overlay.classList.remove('active');
}

// ----------------------------
// SCROLL INFINI
// ----------------------------
function initInfiniteScroll() {
  const sentinel = document.getElementById('scrollSentinel');
  if (!sentinel) return;

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadMoreCards();
        }
      });
    },
    { rootMargin: '100px' }
  );

  observer.observe(sentinel);
}

function loadMoreCards() {
  const filtered = getFilteredDefinitions();
  if (visibleCardCount >= filtered.length) return;

  const nextBatch = Math.min(visibleCardCount + CARDS_PER_BATCH, filtered.length);
  renderCardsBatch(filtered, visibleCardCount, nextBatch);
  visibleCardCount = nextBatch;
}

// ----------------------------
// RACCOURCIS CLAVIER
// ----------------------------
function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      document.getElementById('searchInput')?.focus();
    }

    if (e.key.toLowerCase() === 'r' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      showRandomDefinition();
    }

    if (e.key === 'Escape') {
      closePwdModal();
      closeAdmin();
      closeFlashcard();
      closeRandomModal();
      deactivateRetroMode();
      closeFilterDropdown();
    }
  });
}

// ----------------------------
// EFFETS DE SCROLL
// ----------------------------
function initScrollEffects() {
  const scrollTop = document.getElementById('scrollTop');
  const progress = document.getElementById('readingProgress');
  const keyboardHint = document.getElementById('keyboardHint');

  window.addEventListener(
    'scroll',
    () => {
      const scroll = window.scrollY;

      if (scrollTop) {
        scrollTop.classList.toggle('visible', scroll > 400);
      }

      if (progress) {
        const height = document.documentElement.scrollHeight - window.innerHeight;
        const percentage = height > 0 ? (scroll / height) * 100 : 0;
        progress.style.width = `${percentage}%`;
      }

      if (keyboardHint) {
        if (scroll < 100) {
          keyboardHint.classList.add('show');
        } else {
          keyboardHint.classList.remove('show');
        }
      }
    },
    { passive: true }
  );
}

// ----------------------------
// INSTALLATION PWA
// ----------------------------
function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredInstallPrompt = e;
    const button = document.getElementById('installAppBtn');
    if (button) button.classList.add('visible');
  });

  const installBtn = document.getElementById('installAppBtn');
  if (installBtn) {
    installBtn.addEventListener('click', installApp);
  }
}

async function installApp() {
  if (!deferredInstallPrompt) {
    showToast('ℹ️ Utilise le menu Partager de ton navigateur pour ajouter LexiProf.');
    return;
  }

  deferredInstallPrompt.prompt();
  const result = await deferredInstallPrompt.userChoice;

  if (result.outcome === 'accepted') {
    showToast('✅ LexiProf ajouté à l\'écran d\'accueil !');
  }

  deferredInstallPrompt = null;
  const button = document.getElementById('installAppBtn');
  if (button) button.classList.remove('visible');
}

// ----------------------------
// BIENVENUE
// ----------------------------
function closeWelcome() {
  const banner = document.getElementById('welcomeBanner');
  if (banner) banner.classList.remove('show');
  localStorage.setItem('lexiprof_welcome_seen', 'true');
}

function initWelcome() {
  if (localStorage.getItem('lexiprof_welcome_seen')) return;

  const banner = document.getElementById('welcomeBanner');
  if (banner) {
    setTimeout(() => banner.classList.add('show'), 800);
    setTimeout(() => banner.classList.remove('show'), 6000);
  }
}

// ----------------------------
// ÉCOUTEURS D'ÉVÉNEMENTS
// ----------------------------
function initEventListeners() {
  const btnFlashcard = document.getElementById('btnFlashcard');
  if (btnFlashcard) btnFlashcard.addEventListener('click', openFlashcards);

  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

  const btnFocus = document.getElementById('btnFocusMode');
  if (btnFocus) btnFocus.addEventListener('click', toggleFocusMode);

  const randomModal = document.getElementById('randomModal');
  if (randomModal) {
    randomModal.addEventListener('click', e => {
      if (e.target === randomModal) closeRandomModal();
    });
  }
}

// ----------------------------
// INITIALISATION
// ----------------------------
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  load();
  initKeyboardShortcuts();
  initScrollEffects();
  initInstallPrompt();
  initWelcome();
  initEventListeners();
  initKonami();
  initInfiniteScroll();
  renderSearchHistory();
  checkHash();
});

console.log('📚 LexiProf — app.js v7.0 chargé');
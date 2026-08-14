// ==================================================
// DONNÉES PAR DÉFAUT
// ==================================================
const defaultData = [
  {
    id: 1,
    term: "Management",
    matiere: "Management",
    def: "Ensemble des techniques de direction, de coordination et de contrôle permettant à une organisation d'atteindre ses objectifs de manière efficace et efficiente.",
    example: "Le management d'une entreprise implique de planifier les stratégies, organiser les ressources, diriger les équipes et contrôler les résultats.",
    remember: "Penser au cycle PDCA : Planifier, Déployer, Contrôler, Ajuster.",
    createdAt: "2024-01-01",
    qcm: {
      question: "Quel est le rôle principal du management ?",
      answers: [
        { text: "Diriger et coordonner les ressources", correct: true },
        { text: "Vendre des produits", correct: false },
        { text: "Rédiger des contrats juridiques", correct: false }
      ]
    }
  },
  {
    id: 2,
    term: "Leadership",
    matiere: "Management",
    def: "Capacité d'une personne à guider, influencer et motiver un groupe d'individus vers la réalisation d'objectifs communs, en inspirant confiance et adhésion.",
    example: "Un bon leader sait écouter son équipe, communiquer une vision claire et donner l'exemple.",
    remember: "Le leader inspire, le manager organise.",
    createdAt: "2024-01-01",
    qcm: {
      question: "Quelle est la différence clé entre un leader et un manager ?",
      answers: [
        { text: "Le leader inspire et motive, le manager organise", correct: true },
        { text: "Le leader gagne plus d'argent", correct: false },
        { text: "Il n'y a aucune différence", correct: false }
      ]
    }
  },
  {
    id: 3,
    term: "Organigramme",
    matiere: "Management",
    def: "Représentation graphique de la structure hiérarchique et fonctionnelle d'une organisation, montrant les liens d'autorité et de communication entre les différents postes.",
    example: "L'organigramme d'une entreprise montre le PDG en haut, puis les directeurs, les chefs de service et les employés.",
    remember: "Organigramme = organe + gramme (dessin des organes de l'entreprise).",
    createdAt: "2024-01-01",
    qcm: {
      question: "À quoi sert un organigramme ?",
      answers: [
        { text: "Représenter la structure hiérarchique", correct: true },
        { text: "Calculer les salaires", correct: false },
        { text: "Planifier les vacances", correct: false }
      ]
    }
  },
  {
    id: 4,
    term: "Contrat de travail",
    matiere: "Droit",
    def: "Convention par laquelle une personne (le salarié) s'engage à travailler pour le compte et sous la direction d'une autre personne (l'employeur) en échange d'une rémunération.",
    example: "Un CDI est un contrat à durée indéterminée, tandis qu'un CDD a une date de fin fixée dès le départ.",
    remember: "CDI = Contrat Durée Indéterminée, CDD = Contrat Durée Déterminée.",
    createdAt: "2024-01-01",
    qcm: {
      question: "Quel est l'élément essentiel d'un contrat de travail ?",
      answers: [
        { text: "Une rémunération en échange du travail", correct: true },
        { text: "Un logement fourni", correct: false },
        { text: "Une voiture de fonction", correct: false }
      ]
    }
  },
  {
    id: 5,
    term: "Personne morale",
    matiere: "Droit",
    def: "Entité juridique distincte des personnes physiques qui la composent, dotée de droits et d'obligations propres, telle qu'une société, une association ou une collectivité publique.",
    example: "Une SARL est une personne morale qui peut signer des contrats, posséder des biens et être poursuivie en justice.",
    remember: "Personne physique = toi, moi. Personne morale = l'entreprise, l'association.",
    createdAt: "2024-01-01",
    qcm: {
      question: "Quelle entité est une personne morale ?",
      answers: [
        { text: "Une société (SARL, SAS, SA)", correct: true },
        { text: "Un individu", correct: false },
        { text: "Un animal domestique", correct: false }
      ]
    }
  },
  {
    id: 6,
    term: "PIB",
    matiere: "Économie",
    def: "Produit Intérieur Brut. Indicateur macroéconomique mesurant la valeur totale des biens et services produits sur le territoire national au cours d'une période donnée.",
    example: "Si le PIB de la France augmente de 2%, cela signifie que l'économie française a créé 2% de richesse supplémentaire.",
    remember: "PIB = Production Intérieure Brute (ce que le pays produit).",
    createdAt: "2024-01-01",
    qcm: {
      question: "Que mesure le PIB ?",
      answers: [
        { text: "La richesse produite sur le territoire national", correct: true },
        { text: "Le nombre d'habitants", correct: false },
        { text: "Le taux de chômage", correct: false }
      ]
    }
  },
  {
    id: 7,
    term: "Inflation",
    matiere: "Économie",
    def: "Hausse généralisée et durable du niveau des prix des biens et services dans une économie, entraînant une diminution du pouvoir d'achat de la monnaie.",
    example: "Avec une inflation de 5%, un produit qui coûtait 100€ l'année dernière coûtera 105€ cette année.",
    remember: "Inflation = les prix montent, ton pouvoir d'achat descend.",
    createdAt: "2024-01-01",
    qcm: {
      question: "Quel est l'effet principal de l'inflation ?",
      answers: [
        { text: "Diminution du pouvoir d'achat", correct: true },
        { text: "Augmentation des salaires", correct: false },
        { text: "Baisse des prix", correct: false }
      ]
    }
  },
  {
    id: 8,
    term: "Recrutement",
    matiere: "RH",
    def: "Processus par lequel une organisation identifie, attire et sélectionne des candidats qualifiés pour pourvoir un poste vacant, en adéquation avec ses besoins et sa culture d'entreprise.",
    example: "Le recrutement peut passer par des annonces en ligne, des cabinets de recrutement ou du cooptage (recommandation interne).",
    remember: "Recrutement = trouver la bonne personne au bon poste.",
    createdAt: "2024-01-01",
    qcm: {
      question: "Quel est l'objectif du recrutement ?",
      answers: [
        { text: "Trouver le candidat adapté au poste", correct: true },
        { text: "Réduire les salaires", correct: false },
        { text: "Augmenter les congés", correct: false }
      ]
    }
  },
  {
    id: 9,
    term: "GPEC",
    matiere: "RH",
    def: "Gestion Prévisionnelle des Emplois et des Compétences. Démarche prospective visant à anticiper les besoins en ressources humaines d'une organisation à moyen terme afin d'adapter les effectifs et les compétences.",
    example: "Une entreprise qui prévoit de se digitaliser va anticiper le besoin de former ses employés aux nouveaux outils numériques.",
    remember: "GPEC = regarder dans le futur pour préparer les RH d'aujourd'hui.",
    createdAt: "2024-01-01",
    qcm: {
      question: "La GPEC vise à :",
      answers: [
        { text: "Anticiper les besoins futurs en compétences", correct: true },
        { text: "Réduire les salaires immédiatement", correct: false },
        { text: "Embaucher sans stratégie", correct: false }
      ]
    }
  }
];

// ==================================================
// ÉTAT
// ==================================================
let definitions = [];
let currentFilter = 'all';
let searchQuery = '';
let editingId = null;

// ==================================================
// FAVORIS
// ==================================================
function getFavorites() {
  const raw = localStorage.getItem('lexiprof_favorites');
  return raw ? JSON.parse(raw) : [];
}
function toggleFavorite(id) {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx > -1) favs.splice(idx, 1);
  else favs.push(id);
  localStorage.setItem('lexiprof_favorites', JSON.stringify(favs));
  render();
  showToast(idx > -1 ? '☆ Retiré des favoris' : '★ Ajouté aux favoris');
}

// ==================================================
// HISTORIQUE
// ==================================================
function getSearchHistory() {
  const raw = localStorage.getItem('lexiprof_search_history');
  return raw ? JSON.parse(raw) : [];
}
function addToHistory(q) {
  if (!q.trim()) return;
  let hist = getSearchHistory();
  hist = hist.filter(h => h.toLowerCase() !== q.toLowerCase());
  hist.unshift(q.trim());
  if (hist.length > 5) hist = hist.slice(0, 5);
  localStorage.setItem('lexiprof_search_history', JSON.stringify(hist));
  renderHistory();
}
function removeFromHistory(q, ev) {
  ev.stopPropagation();
  let hist = getSearchHistory().filter(h => h !== q);
  localStorage.setItem('lexiprof_search_history', JSON.stringify(hist));
  renderHistory();
}
function renderHistory() {
  const container = document.getElementById('searchHistory');
  const hist = getSearchHistory();
  if (!hist.length) { container.innerHTML = ''; return; }
  container.innerHTML = hist.map(h => `
    <span class="history-chip" onclick="setSearch('${h.replace(/'/g, "\\'")}')">
      ${h}
      <span class="remove-chip" onclick="removeFromHistory('${h.replace(/'/g, "\\'")}', event)">✕</span>
    </span>
  `).join('');
}
function setSearch(q) {
  document.getElementById('searchInput').value = q;
  searchQuery = q;
  onSearch();
}
function clearSearch() {
  if (searchQuery.trim()) addToHistory(searchQuery);
  document.getElementById('searchInput').value = '';
  searchQuery = '';
  onSearch();
}

// ==================================================
// MODE SOMBRE
// ==================================================
function initTheme() {
  const saved = localStorage.getItem('lexiprof_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = saved ? saved === 'dark' : prefersDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
}
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('lexiprof_theme', next);
  updateThemeIcon(!isDark);
}
function updateThemeIcon(isDark) {
  document.getElementById('iconMoon').style.display = isDark ? 'none' : 'block';
  document.getElementById('iconSun').style.display = isDark ? 'block' : 'none';
}

// ==================================================
// COMPTEUR
// ==================================================
function updateCounter(filteredCount) {
  const total = definitions.length;
  const el = document.getElementById('defCounter');
  if (currentFilter === 'all' && !searchQuery.trim()) {
    el.textContent = `${total} définition${total !== 1 ? 's' : ''} disponible${total !== 1 ? 's' : ''}`;
  } else {
    el.textContent = `${filteredCount} résultat${filteredCount !== 1 ? 's' : ''} sur ${total}`;
  }
}

// ==================================================
// BADGE "NOUVEAU"
// ==================================================
function isNew(createdAt) {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now - created) / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
}

// ==================================================
// UTILITAIRES
// ==================================================
function nextId() {
  return definitions.length > 0 ? Math.max(...definitions.map(d => d.id)) + 1 : 1;
}
function getPassword() {
  return localStorage.getItem(PWD_KEY) || DEFAULT_PW;
}
function setLoading(on) {
  if (on) {
    document.getElementById('cardsContainer').innerHTML = `
      <div class="empty-state">
        <div class="icon">⏳</div>
        <h3>Chargement…</h3>
        <p>Récupération des définitions en ligne.</p>
      </div>`;
  }
}
function highlight(text, q) {
  if (!q) return text;
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${esc})`, 'gi'), '<mark>$1</mark>');
}

// ==================================================
// SCROLL OBSERVER
// ==================================================
let scrollObserver;
function initScrollObserver() {
  if (scrollObserver) scrollObserver.disconnect();
  scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });
}
function observeCards() {
  document.querySelectorAll('.card:not(.visible)').forEach((card, i) => {
    card.style.transitionDelay = `${Math.min(i * 60, 400)}ms`;
    scrollObserver.observe(card);
  });
}

// ==================================================
// SCROLL TO TOP
// ==================================================
function initScrollTop() {
  const btn = document.getElementById('scrollTop');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) btn.classList.add('visible');
    else btn.classList.remove('visible');
  });
}

// ==================================================
// PARTAGE
// ==================================================
async function shareDefinition(term, def) {
  const shareData = {
    title: `LexiProf — ${term}`,
    text: `${term} : ${def.substring(0, 120)}${def.length > 120 ? '...' : ''}`,
    url: window.location.href
  };
  if (navigator.share) {
    try { await navigator.share(shareData); }
    catch (e) { if (e.name !== 'AbortError') fallbackShare(term, def); }
  } else {
    fallbackShare(term, def);
  }
}
function fallbackShare(term, def) {
  const text = `${term}\n${def}`;
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Définition copiée !');
  }).catch(() => {
    showToast('❌ Impossible de copier');
  });
}

// ==================================================
// COPIER DÉFINITION
// ==================================================
function copyDefinition(term, def) {
  const text = `${term}\n\n${def}`;
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Copié dans le presse-papiers');
  }).catch(() => {
    showToast('❌ Impossible de copier');
  });
}

// ==================================================
// EXPORT PDF PAR CARTE
// ==================================================
function exportCardToPDF(id) {
  const d = definitions.find(x => x.id === id);
  if (!d) return;

  const container = document.createElement('div');
  container.style.padding = '30px';
  container.style.fontFamily = "'DM Sans', sans-serif";
  container.style.color = '#1a1814';
  container.style.background = '#fff';
  container.innerHTML = `
    <div style="text-align:center; margin-bottom:30px;">
      <h1 style="font-family:'Lora',serif; font-size:28px; margin-bottom:8px;">LexiProf — Dictionnaire STMG</h1>
      <p style="color:#7a7570; font-size:13px;">Exporté le ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>
    <div style="margin-bottom:24px; padding-bottom:20px; border-bottom:1px solid #e2ddd5;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
        <h2 style="font-family:'Lora',serif; font-size:18px; margin:0; color:#1a1814;">${d.term}</h2>
        <span style="font-size:10px; font-weight:700; text-transform:uppercase; padding:3px 10px; border-radius:20px;
          ${d.matiere === 'Management' ? 'background:#dbeafe; color:#2563a8;' : ''}
          ${d.matiere === 'Droit' ? 'background:#fef3c7; color:#b45309;' : ''}
          ${d.matiere === 'Économie' ? 'background:#dcfce7; color:#166534;' : ''}
          ${d.matiere === 'RH' ? 'background:#ede9fe; color:#7c3aed;' : ''}
        ">${d.matiere}</span>
      </div>
      <p style="font-size:14px; line-height:1.7; color:#3a3530; margin:0;">${d.def}</p>
      ${d.example ? `<p style="font-size:13px; color:#7a7570; margin-top:8px; margin-bottom:0;"><strong>Exemple :</strong> ${d.example}</p>` : ''}
      ${d.remember ? `<p style="font-size:13px; color:#7a7570; margin-top:8px; margin-bottom:0;"><strong>À retenir :</strong> ${d.remember}</p>` : ''}
    </div>
    <div style="text-align:center; margin-top:30px; font-size:11px; color:#b0aba4;">
      LexiProf · mobaruom.github.io/lexiprof
    </div>
  `;
  document.body.appendChild(container);

  html2pdf().set({
    margin: 10,
    filename: `lexiprof-${d.term.toLowerCase().replace(/\\s+/g, '-')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(container).save().then(() => {
    document.body.removeChild(container);
    showToast('📄 PDF exporté !');
  }).catch(() => {
    document.body.removeChild(container);
    showToast('❌ Erreur export PDF');
  });
}

// ==================================================
// FLASHCARD
// ==================================================
let flashcardDefs = [];
let flashcardIndex = 0;
let flashcardRevealed = false;

function openFlashcard() {
  const q = searchQuery.toLowerCase().trim();
  let filtered = definitions;
  if (currentFilter !== 'all') {
    if (currentFilter === 'favorites') {
      const favs = getFavorites();
      filtered = filtered.filter(d => favs.includes(d.id));
    } else {
      filtered = filtered.filter(d => d.matiere === currentFilter);
    }
  }
  if (q) filtered = filtered.filter(d => d.term.toLowerCase().includes(q) || d.def.toLowerCase().includes(q));
  if (!filtered.length) { showToast('⚠️ Aucune définition pour le mode flashcard'); return; }

  flashcardDefs = filtered.sort((a, b) => a.term.localeCompare(b.term, 'fr'));
  flashcardIndex = 0;
  flashcardRevealed = false;
  renderFlashcard();
  document.getElementById('flashcardOverlay').classList.add('open');
}

function closeFlashcard(e) {
  if (e && e.target !== document.getElementById('flashcardOverlay')) return;
  document.getElementById('flashcardOverlay').classList.remove('open');
}

function renderFlashcard() {
  const d = flashcardDefs[flashcardIndex];
  document.getElementById('flashcardCounter').textContent = `${flashcardIndex + 1} / ${flashcardDefs.length}`;
  document.getElementById('flashcardTerm').textContent = d.term;
  document.getElementById('flashcardDef').textContent = d.def;
  document.getElementById('flashcardMeta').textContent = d.matiere;
  document.getElementById('flashcardMeta').style.background = 
    d.matiere === 'Management' ? '#dbeafe' : 
    d.matiere === 'Droit' ? '#fef3c7' : 
    d.matiere === 'Économie' ? '#dcfce7' : '#ede9fe';
  document.getElementById('flashcardMeta').style.color = 
    d.matiere === 'Management' ? '#2563a8' : 
    d.matiere === 'Droit' ? '#b45309' : 
    d.matiere === 'Économie' ? '#166534' : '#7c3aed';

  flashcardRevealed = false;
  document.getElementById('flashcardReveal').style.display = 'block';
  document.getElementById('flashcardDef').style.display = 'none';
  document.getElementById('flashcardMeta').style.display = 'none';
}

function revealFlashcard() {
  if (flashcardRevealed) return;
  flashcardRevealed = true;
  document.getElementById('flashcardReveal').style.display = 'none';
  document.getElementById('flashcardDef').style.display = 'block';
  document.getElementById('flashcardMeta').style.display = 'inline-block';
}

function nextFlashcard() {
  flashcardIndex = (flashcardIndex + 1) % flashcardDefs.length;
  renderFlashcard();
}

function prevFlashcard() {
  flashcardIndex = (flashcardIndex - 1 + flashcardDefs.length) % flashcardDefs.length;
  renderFlashcard();
}

// ==================================================
// RENDU
// ==================================================
function render() {
  const q = searchQuery.toLowerCase().trim();
  let filtered = definitions;

  if (currentFilter !== 'all') {
    if (currentFilter === 'favorites') {
      const favs = getFavorites();
      filtered = filtered.filter(d => favs.includes(d.id));
    } else {
      filtered = filtered.filter(d => d.matiere === currentFilter);
    }
  }

  if (q) filtered = filtered.filter(d => d.term.toLowerCase().includes(q) || d.def.toLowerCase().includes(q));
  filtered.sort((a, b) => a.term.localeCompare(b.term, 'fr'));

  const container = document.getElementById('cardsContainer');
  const info = document.getElementById('resultsInfo');

  info.textContent = (q || currentFilter !== 'all') ? `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}` : '';
  updateCounter(filtered.length);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <h3>Aucun résultat</h3>
        <p>Essaie un autre terme ou change le filtre.</p>
      </div>`;
    return;
  }

  const favs = getFavorites();

  container.innerHTML = filtered.map(d => {
    const fav = favs.includes(d.id);
    const isNewDef = isNew(d.createdAt);
    return `
    <div class="card">
      ${isNewDef ? '<span class="card-badge-new">Nouveau</span>' : ''}
      <div class="card-top">
        <div class="card-term">${highlight(d.term, q)}</div>
        <span class="matiere-badge badge-${d.matiere}">${d.matiere}</span>
      </div>
      <div class="card-def">${highlight(d.def, q)}</div>

      ${d.example ? `
      <details class="card-details">
        <summary>💡 Exemple concret</summary>
        <div class="details-content">${d.example}</div>
      </details>` : ""}

      ${d.remember ? `
      <details class="card-details">
        <summary>📝 À retenir</summary>
        <div class="details-content">${d.remember}</div>
      </details>` : ""}

      ${d.qcm ? `
      <details class="card-details">
        <summary>❓ Mini QCM</summary>
        <div class="details-content">
          <p style="font-weight:600; margin-bottom:10px;">${d.qcm.question}</p>
          ${d.qcm.answers.map((a, i) => `
            <button class="qcm-btn" data-correct="${a.correct}" onclick="handleQcmClick(this)">
              ${a.text}
            </button>
          `).join("")}
        </div>
      </details>` : ""}

      <div class="card-actions">
        <button class="card-action-btn favorite-btn ${fav ? 'active' : ''}" onclick="toggleFavorite(${d.id})" title="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
          ${fav ? '★' : '☆'}<span class="btn-text">${fav ? ' Favori' : ' Favori'}</span>
        </button>
        <button class="card-action-btn" onclick="shareDefinition('${d.term.replace(/'/g, "\\'")}', '${d.def.replace(/'/g, "\\'")}')" title="Partager">
          📤<span class="btn-text"> Partager</span>
        </button>
        <button class="card-action-btn" onclick="copyDefinition('${d.term.replace(/'/g, "\\'")}', '${d.def.replace(/'/g, "\\'")}')" title="Copier">
          📋<span class="btn-text"> Copier</span>
        </button>
        <button class="card-action-btn" onclick="exportCardToPDF(${d.id})" title="Exporter en PDF">
          📄<span class="btn-text"> PDF</span>
        </button>
      </div>
    </div>`;
  }).join('');

  observeCards();
}

// QCM click handler
function handleQcmClick(btn) {
  if (btn.dataset.correct === "true") {
    btn.classList.add('correct');
  } else {
    btn.classList.add('wrong');
  }
  const parent = btn.closest('.details-content');
  parent.querySelectorAll('.qcm-btn').forEach(b => b.disabled = true);
}

// ==================================================
// RECHERCHE
// ==================================================
function onSearch() {
  searchQuery = document.getElementById('searchInput').value;
  const clearBtn = document.getElementById('searchClear');
  clearBtn.style.display = searchQuery ? 'flex' : 'none';
  render();
}

function setFilter(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  render();
}

// ==================================================
// AUTHENTIFICATION
// ==================================================
function openAdmin() {
  document.getElementById('pwdInput').value = '';
  document.getElementById('pwdError').textContent = '';
  document.getElementById('pwdInput').classList.remove('error');
  document.getElementById('pwdOverlay').classList.add('open');
  setTimeout(() => document.getElementById('pwdInput').focus(), 150);
}
function closePwdModal() {
  document.getElementById('pwdOverlay').classList.remove('open');
}
function checkPassword() {
  const val = document.getElementById('pwdInput').value;
  if (val === getPassword()) {
    closePwdModal();
    openAdminPanel();
  } else {
    const f = document.getElementById('pwdInput');
    document.getElementById('pwdError').textContent = 'Mot de passe incorrect.';
    f.classList.add('error');
    f.value = '';
    setTimeout(() => f.classList.remove('error'), 400);
  }
}

// ==================================================
// ADMINISTRATION (avec modification)
// ==================================================
function openAdminPanel() {
  cancelEdit();
  renderAdminList();
  document.getElementById('changePwdForm').classList.remove('open');
  document.getElementById('overlay').classList.add('open');
}
function closeAdmin() {
  document.getElementById('overlay').classList.remove('open');
}
function handleOverlayClick(e) {
  if (e.target === document.getElementById('overlay')) closeAdmin();
}

function renderAdminList() {
  const list = document.getElementById('adminList');
  document.getElementById('adminCount').textContent = definitions.length;
  const sorted = [...definitions].sort((a, b) => a.term.localeCompare(b.term, 'fr'));
  if (!sorted.length) {
    list.innerHTML = '<p style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px 0">Aucune définition.</p>';
    return;
  }
  list.innerHTML = sorted.map(d => `
    <div class="admin-item">
      <div>
        <div class="admin-item-term">${d.term}</div>
        <div class="admin-item-meta">${d.matiere}</div>
      </div>
      <div class="admin-item-actions">
        <button class="btn-edit" onclick="startEdit(${d.id})" title="Modifier">✏️</button>
        <button class="btn-del" onclick="deleteDefinition(${d.id})" title="Supprimer">✕</button>
      </div>
    </div>
  `).join('');
}

function startEdit(id) {
  const d = definitions.find(x => x.id === id);
  if (!d) return;
  editingId = id;
  document.getElementById('formTerm').value = d.term;
  document.getElementById('formMatiere').value = d.matiere;
  document.getElementById('formDef').value = d.def;
  document.getElementById('formExample').value = d.example || '';
  document.getElementById('formRemember').value = d.remember || '';
  document.getElementById('formTitle').textContent = 'Modifier la définition';
  document.getElementById('btnFormAction').textContent = '💾 Enregistrer';
  document.getElementById('btnCancelEdit').style.display = 'block';
  document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
  editingId = null;
  document.getElementById('formTerm').value = '';
  document.getElementById('formMatiere').value = 'Management';
  document.getElementById('formDef').value = '';
  document.getElementById('formExample').value = '';
  document.getElementById('formRemember').value = '';
  document.getElementById('formTitle').textContent = 'Ajouter une définition';
  document.getElementById('btnFormAction').textContent = '+ Ajouter';
  document.getElementById('btnCancelEdit').style.display = 'none';
}

async function handleFormAction() {
  if (editingId !== null) {
    await updateDefinition();
  } else {
    await addDefinition();
  }
}

async function updateDefinition() {
  const term = document.getElementById('formTerm').value.trim();
  const matiere = document.getElementById('formMatiere').value;
  const def = document.getElementById('formDef').value.trim();
  const example = document.getElementById('formExample').value.trim();
  const remember = document.getElementById('formRemember').value.trim();

  if (!term || !def) { showToast('⚠️ Remplis le terme et la définition !'); return; }

  const idx = definitions.findIndex(d => d.id === editingId);
  if (idx === -1) return;

  const existing = definitions.find(d => d.id !== editingId && d.term.toLowerCase() === term.toLowerCase() && d.matiere === matiere);
  if (existing) { showToast('⚠️ Ce terme existe déjà.'); return; }

  definitions[idx] = {
    ...definitions[idx],
    term, matiere, def,
    example: example || undefined,
    remember: remember || undefined
  };

  showToast('⏳ Sauvegarde…');
  await saveRemote();
  render(); renderAdminList();
  cancelEdit();
  showToast('✅ Définition modifiée !');
}

async function addDefinition() {
  const term = document.getElementById('formTerm').value.trim();
  const matiere = document.getElementById('formMatiere').value;
  const def = document.getElementById('formDef').value.trim();
  const example = document.getElementById('formExample').value.trim();
  const remember = document.getElementById('formRemember').value.trim();

  if (!term || !def) { showToast('⚠️ Remplis le terme et la définition !'); return; }
  if (definitions.find(d => d.term.toLowerCase() === term.toLowerCase() && d.matiere === matiere)) {
    showToast('⚠️ Ce terme existe déjà.'); return;
  }

  const newDef = {
    id: nextId(),
    term, matiere, def,
    createdAt: new Date().toISOString().slice(0, 10),
    example: example || undefined,
    remember: remember || undefined
  };

  definitions.push(newDef);
  showToast('⏳ Sauvegarde…');
  await saveRemote();
  render(); renderAdminList();
  document.getElementById('formTerm').value = '';
  document.getElementById('formDef').value = '';
  document.getElementById('formExample').value = '';
  document.getElementById('formRemember').value = '';
  showToast('✅ Définition ajoutée !');
}

async function deleteDefinition(id) {
  if (!confirm('Supprimer cette définition ?')) return;
  definitions = definitions.filter(d => d.id !== id);
  await saveRemote();
  render(); renderAdminList();
  showToast('🗑 Définition supprimée.');
}

function toggleChangePwd() {
  document.getElementById('changePwdForm').classList.toggle('open');
}
function changePassword() {
  const p1 = document.getElementById('newPwd1').value;
  const p2 = document.getElementById('newPwd2').value;
  if (!p1 || p1.length < 4) { showToast('⚠️ Minimum 4 caractères.'); return; }
  if (p1 !== p2) { showToast('⚠️ Les mots de passe ne correspondent pas.'); return; }
  localStorage.setItem(PWD_KEY, p1);
  document.getElementById('newPwd1').value = '';
  document.getElementById('newPwd2').value = '';
  document.getElementById('changePwdForm').classList.remove('open');
  showToast('🔑 Mot de passe mis à jour !');
}

// ==================================================
// IMPORT MASSIF JSON
// ==================================================

async function importJson() {

  const input = document.getElementById('jsonImport');

  if (!input || !input.files.length) {
    showToast('⚠️ Sélectionne un fichier JSON.');
    return;
  }

  const file = input.files[0];

  try {

    // Lecture du fichier
    const text = await file.text();

    // Conversion JSON
    const data = JSON.parse(text);

    // Accepte :
    // 1. [ {...}, {...} ]
    // 2. { "definitions": [ {...}, {...} ] }

    let imported = Array.isArray(data)
      ? data
      : data.definitions;

    if (!Array.isArray(imported)) {
      throw new Error(
        'Le JSON doit contenir un tableau de définitions.'
      );
    }

    if (imported.length === 0) {
      throw new Error(
        'Le fichier JSON est vide.'
      );
    }

    // Vérification et préparation
    const prepared = [];

    for (const item of imported) {

      if (
        !item.term ||
        !item.matiere ||
        !item.def
      ) {
        console.warn(
          'Définition ignorée : champs manquants',
          item
        );
        continue;
      }

      // Vérifie les doublons
      const alreadyExists = definitions.some(
        d =>
          d.term.toLowerCase() === item.term.toLowerCase() &&
          d.matiere === item.matiere
      );

      if (alreadyExists) {
        continue;
      }

      // Nouvelle définition
      const newDefinition = {
        id: nextId() + prepared.length,

        term: String(item.term).trim(),

        matiere: String(item.matiere).trim(),

        def: String(item.def).trim(),

        createdAt:
          item.createdAt ||
          new Date().toISOString().slice(0, 10),

        example:
          item.example
            ? String(item.example).trim()
            : undefined,

        remember:
          item.remember
            ? String(item.remember).trim()
            : undefined
      };

      // QCM facultatif
      if (
        item.qcm &&
        item.qcm.question &&
        Array.isArray(item.qcm.answers)
      ) {

        newDefinition.qcm = {
          question: String(item.qcm.question),

          answers: item.qcm.answers
            .filter(a => a && a.text)
            .map(a => ({
              text: String(a.text),
              correct: Boolean(a.correct)
            }))
        };

      }

      prepared.push(newDefinition);
    }

    // Rien de nouveau
    if (prepared.length === 0) {

      showToast(
        '⚠️ Aucune nouvelle définition à importer.'
      );

      input.value = '';

      return;
    }

    // Confirmation avant modification du JSONBin
    const confirmImport = confirm(
      `📥 ${prepared.length} définition(s) prête(s) à être importée(s).\n\n` +
      `${imported.length - prepared.length} définition(s) ignorée(s) ` +
      `(doublons ou données invalides).\n\n` +
      `Continuer ?`
    );

    if (!confirmImport) {
      return;
    }

    // Ajout dans la base actuelle
    definitions.push(...prepared);

    showToast('⏳ Import et sauvegarde…');

    // Sauvegarde JSONBin
    await saveRemote();

    // Actualisation de l'interface
    render();
    renderAdminList();

    // Nettoyage du champ fichier
    input.value = '';

    showToast(
      `✅ ${prepared.length} définition(s) importée(s) !`
    );

  } catch (error) {

    console.error(
      'Erreur import JSON :',
      error
    );

    input.value = '';

    showToast(
      '❌ Fichier JSON invalide ou incompatible.'
    );

  }

}

// ==================================================
// IMPORT JSON PAR COPIER-COLLER
// ==================================================

async function importJsonText() {

  const textarea = document.getElementById('jsonPaste');

  if (!textarea) {
    showToast('❌ Zone JSON introuvable.');
    return;
  }

  const text = textarea.value.trim();

  if (!text) {
    showToast('⚠️ Colle d’abord ton JSON.');
    return;
  }

  try {

    let data = JSON.parse(text);

    // Accepte :
    // [ {...}, {...} ]
    // ou
    // { "definitions": [ {...}, {...} ] }

    const imported = Array.isArray(data)
      ? data
      : data.definitions;

    if (!Array.isArray(imported)) {
      throw new Error('Format JSON incorrect.');
    }

    if (imported.length === 0) {
      throw new Error('JSON vide.');
    }

    const prepared = [];

    for (const item of imported) {

      if (!item.term || !item.matiere || !item.def) {
        continue;
      }

      const duplicate = definitions.some(d =>
        d.term.trim().toLowerCase() ===
        String(item.term).trim().toLowerCase()
        &&
        d.matiere === item.matiere
      );

      if (duplicate) continue;

      const newDefinition = {
        id: nextId() + prepared.length,

        term: String(item.term).trim(),

        matiere: String(item.matiere).trim(),

        def: String(item.def).trim(),

        example: item.example
          ? String(item.example).trim()
          : "",

        remember: item.remember
          ? String(item.remember).trim()
          : "",

        createdAt: item.createdAt ||
          new Date().toISOString().slice(0,10)
      };

      // QCM
      if (
        item.qcm &&
        item.qcm.question &&
        Array.isArray(item.qcm.answers)
      ) {

        newDefinition.qcm = {
          question: String(item.qcm.question),

          answers: item.qcm.answers
            .filter(a => a && a.text)
            .map(a => ({
              text: String(a.text),
              correct: Boolean(a.correct)
            }))
        };

      }

      prepared.push(newDefinition);
    }

    if (prepared.length === 0) {

      showToast(
        '⚠️ Aucune nouvelle définition à importer.'
      );

      return;
    }

    const confirmed = confirm(
      `📥 ${prepared.length} définition(s) prête(s) à être importée(s).\n\n` +
      `Les doublons seront ignorés.\n\n` +
      `Continuer ?`
    );

    if (!confirmed) return;

    definitions.push(...prepared);

    showToast('⏳ Sauvegarde…');

    await saveRemote();

    render();
    renderAdminList();

    textarea.value = '';

    showToast(
      `✅ ${prepared.length} définition(s) importée(s) !`
    );

  } catch (error) {

    console.error(
      'Erreur JSON collé :',
      error
    );

    showToast(
      '❌ JSON invalide. Vérifie le format.'
    );

  }
}

// ==================================================
// NOTIFICATIONS
// ==================================================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2500);
}

// ==================================================
// INITIALISATION
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initScrollObserver();
  initScrollTop();
  renderHistory();
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('btnFlashcard').addEventListener('click', openFlashcard);

  document.getElementById('searchInput').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      addToHistory(searchQuery);
    }
  });

  load();
});

console.log("LexiProf v3 chargé !");

/* ==========================================================
   LEXIPROF — UI UPGRADE
   ========================================================== */

(function () {

  "use strict";

  /* --------------------------------------------------------
     LOADER
     -------------------------------------------------------- */

  function finishLoader() {

    const loader = document.getElementById("globalLoader");

    if (!loader) return;

    setTimeout(() => {
      loader.classList.add("loaded");
    }, 500);

  }

  window.addEventListener("load", finishLoader);


  /* --------------------------------------------------------
     PROGRESSION DE LECTURE
     -------------------------------------------------------- */

  function updateReadingProgress() {

    const progress =
      document.getElementById("readingProgress");

    if (!progress) return;

    const scrollTop = window.scrollY;

    const height =
      document.documentElement.scrollHeight -
      window.innerHeight;

    const percentage =
      height > 0
        ? (scrollTop / height) * 100
        : 0;

    progress.style.width =
      Math.min(100, percentage) + "%";
  }

  window.addEventListener(
    "scroll",
    updateReadingProgress,
    { passive: true }
  );


  /* --------------------------------------------------------
     BIENVENUE
     -------------------------------------------------------- */

  window.closeWelcome = function () {

    const banner =
      document.getElementById("welcomeBanner");

    if (!banner) return;

    banner.classList.add("hide");

    localStorage.setItem(
      "lexiprof_welcome_seen",
      "1"
    );

    setTimeout(() => {
      banner.remove();
    }, 400);
  };


  function initWelcome() {

    const banner =
      document.getElementById("welcomeBanner");

    if (!banner) return;

    if (
      localStorage.getItem(
        "lexiprof_welcome_seen"
      )
    ) {
      banner.remove();
      return;
    }

    setTimeout(() => {

      if (
        localStorage.getItem(
          "lexiprof_welcome_seen"
        )
      ) return;

      banner.style.display = "flex";

    }, 1200);
  }


  /* --------------------------------------------------------
     DEFINITION ALÉATOIRE
     -------------------------------------------------------- */

  let randomDefinition = null;


  window.showRandomDefinition = function () {

    if (
      typeof definitions === "undefined" ||
      !definitions.length
    ) {
      showToast("⚠️ Aucune définition disponible.");
      return;
    }

    const index =
      Math.floor(
        Math.random() * definitions.length
      );

    randomDefinition =
      definitions[index];

    const term =
      document.getElementById("randomTerm");

    const def =
      document.getElementById("randomDef");

    const matiere =
      document.getElementById("randomMatiere");

    if (!term || !def || !matiere) return;

    term.textContent =
      randomDefinition.term;

    def.textContent =
      randomDefinition.def;

    matiere.textContent =
      randomDefinition.matiere;

    const modal =
      document.getElementById("randomModal");

    modal.classList.add("open");
  };


  window.closeRandomModal = function () {

    const modal =
      document.getElementById("randomModal");

    if (modal) {
      modal.classList.remove("open");
    }

  };


  window.openRandomDefinition = function () {

    if (!randomDefinition) return;

    closeRandomModal();

    const card =
      document.getElementById(
        "card-" + randomDefinition.id
      );

    if (card) {

      card.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      const btn =
        document.querySelector(
          `[onclick*="toggleCard(${randomDefinition.id}"]`
        );

      if (
        btn &&
        !card.classList.contains("open")
      ) {
        btn.click();
      }

      return;
    }

    const search =
      document.getElementById("searchInput");

    if (search) {

      search.value =
        randomDefinition.term;

      searchQuery =
        randomDefinition.term;

      onSearch();

      setTimeout(() => {

        const newCard =
          document.getElementById(
            "card-" + randomDefinition.id
          );

        if (newCard) {

          newCard.scrollIntoView({
            behavior: "smooth",
            block: "center"
          });

        }

      }, 200);
    }
  };


  /* --------------------------------------------------------
     BOUTON ALÉATOIRE
     -------------------------------------------------------- */

  function initRandomButton() {

    const btn =
      document.getElementById("randomDefBtn");

    if (!btn) return;

    btn.addEventListener(
      "click",
      showRandomDefinition
    );
  }


  /* --------------------------------------------------------
     SCROLL VERS LES DÉFINITIONS
     -------------------------------------------------------- */

  function initScrollCards() {

    const btn =
      document.getElementById("scrollCardsBtn");

    if (!btn) return;

    btn.addEventListener(
      "click",
      () => {

        const cards =
          document.getElementById(
            "cardsContainer"
          );

        if (!cards) return;

        cards.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });

      }
    );
  }


  /* --------------------------------------------------------
     RACCOURCIS CLAVIER
     -------------------------------------------------------- */

  document.addEventListener(
    "keydown",
    function (event) {

      const target =
        event.target;

      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

      if (
        event.key === "/" &&
        !typing
      ) {

        event.preventDefault();

        const input =
          document.getElementById(
            "searchInput"
          );

        if (input) {
          input.focus();
        }

      }

      if (
        event.key.toLowerCase() === "r" &&
        !typing
      ) {

        event.preventDefault();

        showRandomDefinition();

      }

      if (
        event.key === "Escape"
      ) {

        const modal =
          document.getElementById(
            "randomModal"
          );

        if (
          modal &&
          modal.classList.contains("open")
        ) {
          closeRandomModal();
        }

      }

    }
  );


  /* --------------------------------------------------------
     INSTALLATION PWA
     -------------------------------------------------------- */

  let deferredInstallPrompt = null;

  window.addEventListener(
    "beforeinstallprompt",
    function (event) {

      event.preventDefault();

      deferredInstallPrompt =
        event;

      const button =
        document.getElementById(
          "installAppBtn"
        );

      if (button) {
        button.classList.add("show");
      }

    }
  );


  async function installApp() {

    const button =
      document.getElementById(
        "installAppBtn"
      );

    if (!deferredInstallPrompt) {

      showToast(
        "📱 Sur iPhone : Partager → Ajouter à l’écran d’accueil."
      );

      return;
    }

    deferredInstallPrompt.prompt();

    const result =
      await deferredInstallPrompt.userChoice;

    if (
      result.outcome === "accepted"
    ) {

      showToast(
        "✅ LexiProf est en cours d’installation !"
      );

    }

    deferredInstallPrompt = null;

    if (button) {
      button.classList.remove("show");
    }

  }


  function initInstallButton() {

    const button =
      document.getElementById(
        "installAppBtn"
      );

    if (!button) return;

    button.addEventListener(
      "click",
      installApp
    );

  }


  window.addEventListener(
    "appinstalled",
    function () {

      const button =
        document.getElementById(
          "installAppBtn"
        );

      if (button) {
        button.classList.remove("show");
      }

      showToast(
        "🎉 LexiProf a été installé !"
      );

    }
  );


  /* --------------------------------------------------------
     FERMETURE MODAL EN CLIQUANT À L'EXTÉRIEUR
     -------------------------------------------------------- */

  const randomModal =
    document.getElementById(
      "randomModal"
    );

  if (randomModal) {

    randomModal.addEventListener(
      "click",
      function (event) {

        if (
          event.target === randomModal
        ) {
          closeRandomModal();
        }

      }
    );

  }


  /* --------------------------------------------------------
     ANIMATION DES CARTES
     -------------------------------------------------------- */

  function upgradeCards() {

    if (
      typeof scrollObserver ===
      "undefined"
    ) return;

    if (
      typeof observeCards ===
      "function"
    ) {
      observeCards();
    }

  }


  /* --------------------------------------------------------
     OUVERTURE DOUCE DES FICHES
     -------------------------------------------------------- */

  window.smoothOpenCard = function (
    id,
    button
  ) {

    const card =
      document.getElementById(
        "card-" + id
      );

    if (!card) return;

    const isOpen =
      card.classList.contains("open");

    if (isOpen) {

      card.classList.remove("open");

      if (button) {
        button.innerHTML =
          "📖 Ouvrir la fiche";
      }

      return;

    }

    card.classList.add("open");

    if (button) {
      button.innerHTML =
        "📕 Fermer la fiche";
    }

  };


  /* --------------------------------------------------------
     INITIALISATION
     -------------------------------------------------------- */

  function initUpgrade() {

    initWelcome();

    initRandomButton();

    initScrollCards();

    initInstallButton();

    updateReadingProgress();

  }


  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      initUpgrade
    );

  } else {

    initUpgrade();

  }

})();
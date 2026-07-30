


// ==================================================
// DONNÉES
// ==================================================
const defaultData = [
  { id:1, term:"Management",      matiere:"Management", def:"Ensemble des techniques de direction, d'organisation et de gestion d'une entreprise visant à atteindre des objectifs fixés en utilisant efficacement les ressources disponibles." },
  { id:2, term:"Leadership",      matiere:"Management", def:"Capacité d'une personne à guider, influencer et motiver un groupe d'individus vers la réalisation d'objectifs communs, en inspirant confiance et adhésion." },
  { id:3, term:"Organigramme",    matiere:"Management", def:"Représentation graphique de la structure hiérarchique et fonctionnelle d'une organisation, montrant les liens d'autorité et de communication entre les différents postes." },
  { id:4, term:"Contrat de travail", matiere:"Droit",   def:"Convention par laquelle une personne (le salarié) s'engage à travailler pour le compte et sous la direction d'une autre personne (l'employeur) en échange d'une rémunération." },
  { id:5, term:"Personne morale", matiere:"Droit",      def:"Entité juridique distincte des personnes physiques qui la composent, dotée de droits et d'obligations propres, telle qu'une société, une association ou une collectivité publique." },
  { id:6, term:"PIB",             matiere:"Économie",   def:"Produit Intérieur Brut. Indicateur macroéconomique mesurant la valeur totale des biens et services produits sur le territoire national au cours d'une période donnée." },
  { id:7, term:"Inflation",       matiere:"Économie",   def:"Hausse généralisée et durable du niveau des prix des biens et services dans une économie, entraînant une diminution du pouvoir d'achat de la monnaie." },
  { id:8, term:"Recrutement",     matiere:"RH",         def:"Processus par lequel une organisation identifie, attire et sélectionne des candidats qualifiés pour pourvoir un poste vacant, en adéquation avec ses besoins et sa culture d'entreprise." },
  { id:9, term:"GPEC",            matiere:"RH",         def:"Gestion Prévisionnelle des Emplois et des Compétences. Démarche prospective visant à anticiper les besoins en ressources humaines d'une organisation à moyen terme afin d'adapter les effectifs et les compétences." },
];


// ==================================================
// ÉTAT DE L'APPLICATION
// ==================================================
let definitions = [];
let currentFilter = 'all';
let searchQuery = '';



function nextId() {
  return definitions.length > 0 ? Math.max(...definitions.map(d => d.id)) + 1 : 1;
}

function getPassword() {
  return localStorage.getItem(PWD_KEY) || DEFAULT_PW;
}

// ==================================================
// INTERFACE UTILISATEUR
// ==================================================
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

function render() {
  const q = searchQuery.toLowerCase().trim();
  let filtered = definitions;
  if (currentFilter !== 'all') filtered = filtered.filter(d => d.matiere === currentFilter);
  if (q) filtered = filtered.filter(d => d.term.toLowerCase().includes(q) || d.def.toLowerCase().includes(q));
  filtered.sort((a,b) => a.term.localeCompare(b.term, 'fr'));

  const container = document.getElementById('cardsContainer');
  const info = document.getElementById('resultsInfo');

  info.textContent = (q || currentFilter !== 'all') ? `${filtered.length} résultat${filtered.length !== 1 ? 's' : ''}` : '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔍</div>
        <h3>Aucun résultat</h3>
        <p>Essaie un autre terme ou change le filtre.</p>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(d => `
    <div class="card">
      <div class="card-top">
        <div class="card-term">${highlight(d.term, q)}</div>
        <span class="matiere-badge badge-${d.matiere}">${d.matiere}</span>
      </div>
      <div class="card-def">${highlight(d.def, q)}</div>
    </div>
  `).join('');
}



// ==================================================
// RECHERCHE
// ==================================================
function onSearch() {
  searchQuery = document.getElementById('searchInput').value;
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
// ADMINISTRATION
// ==================================================
function openAdminPanel() {
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
  const sorted = [...definitions].sort((a,b) => a.term.localeCompare(b.term, 'fr'));

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
      <button class="btn-del" onclick="deleteDefinition(${d.id})">✕</button>
    </div>
  `).join('');
}

async function addDefinition() {
  const term = document.getElementById('formTerm').value.trim();
  const matiere = document.getElementById('formMatiere').value;
  const def = document.getElementById('formDef').value.trim();
  if (!term || !def) { showToast('⚠️ Remplis le terme et la définition !'); return; }
  if (definitions.find(d => d.term.toLowerCase() === term.toLowerCase() && d.matiere === matiere)) {
    showToast('⚠️ Ce terme existe déjà.'); return;
  }
  definitions.push({ id: nextId(), term, matiere, def });
  showToast('⏳ Sauvegarde…');
  await saveRemote();
  render(); renderAdminList();
  document.getElementById('formTerm').value = '';
  document.getElementById('formDef').value = '';
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
// NOTIFICATIONS
// ==================================================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2500);
}

console.log("app.js chargé !");
load();
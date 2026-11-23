require('./_boot.js');
global.PDFLib = require('/opt/npm-tools/node_modules/pdf-lib');
require('../js/pdf.js');
const LP = window.LP, fs = require('fs'), assert = require('assert');
(async () => {
  const rows = []; for (let i = 1; i <= 90; i++) rows.push(['Notion n°' + i + ' — œuvre « é à ç »', i % 2 ? 'Droit' : 'Économie', 'Définition très longue '.repeat(8) + 'avec emoji 😀 et flèche → ≥ “guillemets” ’apostrophe’ ' + 'Superlongmotsansespaceaucun'.repeat(3), String(i)]);
  const bytes = await LP.pdf.build({ title: 'LexiProf — Export administrateur', subtitle: 'Généré le 29 octobre 2026', footer: 'Confidentiel', sections: [
    { title: 'Indicateurs', kpis: [['Notions', 90], ['Propositions', 3], ['Signalements', 0], ['Actifs 7 j', '—']] },
    { title: 'Notions', intro: 'Liste complète des notions (filtre : toutes).', columns: [{ h: 'Terme', w: 3 }, { h: 'Matière', w: 1.4 }, { h: 'Définition', w: 6 }, { h: 'ID', w: .6, align: 'right' }], rows },
    { title: 'Section vide', columns: [{ h: 'A' }], rows: [] }] });
  fs.writeFileSync(process.argv[2] || '/tmp/t.pdf', bytes);
  const d = await PDFLib.PDFDocument.load(bytes); assert.ok(d.getPageCount() >= 3); assert.equal(Buffer.from(bytes).slice(0, 5).toString(), '%PDF-');
  console.log('PDF ok, pages =', d.getPageCount(), ' octets =', bytes.length);
})().catch(e => { console.error('FAIL', e); process.exit(1); });

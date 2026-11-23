/* ============================================================
   LexiProf 2.0 — pdf.js : génération de PDF (pdf-lib embarqué, hors ligne)
   LP.pdf.build({ title, subtitle, footer, sections:[{ title, intro, kpis:[[label,value]], columns:[{h,w,align}], rows:[[…]] }] })
   ============================================================ */
(function () {
  'use strict';
  const LP = (window.LP = window.LP || {});
  let loading = null;
  const load = () => {
    if (window.PDFLib) return Promise.resolve(window.PDFLib);
    return loading || (loading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'js/vendor/pdf-lib.min.js?v=1.17.1'; s.onload = () => res(window.PDFLib); s.onerror = () => { loading = null; rej(new Error('Moteur PDF introuvable.')); }; document.head.appendChild(s); }));
  };
  const MAP = { '’': "'", '‘': "'", '“': '"', '”': '"', '–': '-', '—': '-', '→': '->', '≥': '>=', '≤': '<=', ' ': ' ', ' ': ' ', '​': '', '•': '•', '✓': 'v', '×': 'x' };
  const clean = (font, s) => {
    s = String(s == null ? '' : s).normalize('NFC').replace(/[\r\t]/g, ' ').replace(/[‘’“”–—→≥≤  ​✓×]/g, c => MAP[c]);
    const set = new Set(font.getCharacterSet()); let o = '';
    for (const ch of s) { const cp = ch.codePointAt(0); o += ch === '\n' ? '\n' : set.has(cp) ? ch : (/\p{M}/u.test(ch) ? '' : '?'); }
    return o;
  };
  function wrap(font, text, size, width) {
    const lines = [];
    String(text).split('\n').forEach(par => {
      const words = par.split(' '); let cur = '';
      words.forEach(w => {
        while (font.widthOfTextAtSize(w, size) > width) { // mot trop long : coupe
          let k = w.length; while (k > 1 && font.widthOfTextAtSize(w.slice(0, k), size) > width) k--;
          if (cur) { lines.push(cur); cur = ''; } lines.push(w.slice(0, k)); w = w.slice(k);
        }
        const t = cur ? cur + ' ' + w : w;
        if (font.widthOfTextAtSize(t, size) <= width) cur = t; else { if (cur) lines.push(cur); cur = w; }
      });
      lines.push(cur);
    });
    return lines;
  }
  LP.pdf = {
    clean,
    async build(doc) {
      const { PDFDocument, StandardFonts, rgb } = await load();
      const pdf = await PDFDocument.create();
      pdf.setTitle(clean(await pdf.embedFont(StandardFonts.Helvetica), doc.title)); pdf.setCreator('LexiProf'); pdf.setProducer('LexiProf'); pdf.setLanguage('fr-FR'); pdf.setCreationDate(new Date());
      const F = await pdf.embedFont(StandardFonts.Helvetica), B = await pdf.embedFont(StandardFonts.HelveticaBold), I = await pdf.embedFont(StandardFonts.HelveticaOblique);
      const W = 595.28, H = 841.89, M = 44, CW = W - 2 * M, ink = rgb(.09, .1, .14), mut = rgb(.42, .45, .52), acc = rgb(.23, .42, .92), line = rgb(.86, .88, .92), band = rgb(.95, .96, .98);
      let page, y; const pages = [];
      const newPage = () => { page = pdf.addPage([W, H]); pages.push(page); y = H - M - 10; };
      const need = h => { if (y - h < M + 22) newPage(); };
      const T = (s, x, yy, size, font, color) => page.drawText(clean(font, s), { x, y: yy, size, font, color: color || ink });
      newPage();
      page.drawRectangle({ x: 0, y: H - 96, width: W, height: 96, color: rgb(.09, .12, .22) });
      T(doc.title, M, H - 52, 22, B, rgb(1, 1, 1)); T(doc.subtitle || '', M, H - 72, 10.5, F, rgb(.78, .82, .95));
      y = H - 96 - 30;
      (doc.sections || []).forEach(sec => {
        need(60);
        T(sec.title, M, y, 14, B, ink); y -= 6; page.drawRectangle({ x: M, y: y - 2, width: 36, height: 2.5, color: acc }); y -= 18;
        if (sec.intro) { wrap(I, clean(I, sec.intro), 9.5, CW).forEach(l => { need(14); T(l, M, y, 9.5, I, mut); y -= 13; }); y -= 4; }
        if (sec.kpis && sec.kpis.length) {
          const per = 4, bw = (CW - (per - 1) * 8) / per;
          for (let i = 0; i < sec.kpis.length; i += per) {
            need(54);
            sec.kpis.slice(i, i + per).forEach((k, j) => {
              const x = M + j * (bw + 8); page.drawRectangle({ x, y: y - 44, width: bw, height: 44, color: band, borderColor: line, borderWidth: .6 });
              T(String(k[1]), x + 9, y - 22, 16, B, ink); T(k[0], x + 9, y - 36, 8, F, mut);
            }); y -= 54;
          }
        }
        if (sec.columns && sec.rows) {
          const tot = sec.columns.reduce((a, c) => a + (c.w || 1), 0), cols = sec.columns.map(c => Object.assign({}, c, { px: (c.w || 1) / tot * CW }));
          const header = () => { need(24); page.drawRectangle({ x: M, y: y - 17, width: CW, height: 19, color: band }); let x = M; cols.forEach(c => { const t = clean(B, c.h); T(t, c.align === 'right' ? x + c.px - 6 - B.widthOfTextAtSize(t, 8.5) : x + 6, y - 11, 8.5, B, mut); x += c.px; }); y -= 21; };
          header();
          if (!sec.rows.length) { T('Aucune donnée.', M + 6, y - 10, 9, I, mut); y -= 22; }
          sec.rows.forEach(r => {
            const cells = cols.map((c, i) => wrap(F, clean(F, r[i]), 8.5, c.px - 12)), lh = 11.2, h = Math.max(...cells.map(c => c.length)) * lh + 7;
            if (y - h < M + 22) { newPage(); header(); }
            let x = M; cells.forEach((ls, i) => { ls.forEach((l, k) => { const c = cols[i]; T(l, c.align === 'right' ? x + c.px - 6 - F.widthOfTextAtSize(l, 8.5) : x + 6, y - 10 - k * lh, 8.5, F); }); x += cols[i].px; });
            y -= h; page.drawLine({ start: { x: M, y }, end: { x: M + CW, y }, thickness: .4, color: line });
          });
          y -= 6;
        }
        y -= 14;
      });
      pages.forEach((p, i) => { p.drawLine({ start: { x: M, y: M }, end: { x: W - M, y: M }, thickness: .5, color: line }); p.drawText(clean(F, doc.footer || 'LexiProf'), { x: M, y: M - 13, size: 8, font: F, color: mut }); const t = `Page ${i + 1} / ${pages.length}`; p.drawText(t, { x: W - M - F.widthOfTextAtSize(t, 8), y: M - 13, size: 8, font: F, color: mut }); });
      return pdf.save();
    }
  };
})();

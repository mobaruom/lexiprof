/* ============================================================
   Fenn v2 — mascotte de LexiProf (un fennec), dessin SVG en calques
   LP.fenn(mood, { acc, size, crop, anim, label })
     mood : happy | cheer | proud | sad | sleepy | think | wave | wink | wow
     crop : full | bust | head          anim : true = idle animé (CSS)
   Les calques portent des classes (.f-eye, .f-earL…) animées dans app.css.
   ============================================================ */
(function () {
  'use strict';
  const LP = (window.LP = window.LP || {});
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const K = { sand: '#F1A94E', sandD: '#DB8A33', sandL: '#F7C27C', cream: '#FFF1DA', creamD: '#F3DDB9', pink: '#F7A8A0', dark: '#2B1F2E', tip: '#5E4034', red: '#7B2335' };
  // miroir horizontal d'un tracé en coordonnées absolues (M, L, C, Q, Z)
  const mirror = d => d.replace(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g, (m, x, y) => (200 - Number(x)) + ' ' + y);

  const EAR = 'M49 86 C26 68 12 36 18 3 C52 8 84 36 92 68 Z', EAR_IN = 'M51 76 C37 60 30 40 32 20 C54 27 74 46 81 64 Z';
  const HEAD = 'M100 50 C143 50 167 74 167 105 C167 136 141 156 100 156 C59 156 33 136 33 105 C33 74 57 50 100 50 Z';
  const MASK = 'M100 88 C128 88 152 106 152 130 C152 148 129 156 100 156 C71 156 48 148 48 130 C48 106 72 88 100 88 Z';
  const NOSE = 'M92 119 C92 113.500 108 113.500 108 119 C108 124.500 100 130 100 130 C100 130 92 124.500 92 119 Z';
  const ARM = 'M64 158 C49 167 47 191 60 198 C72 195 78 178 76 160 Z';

  function eyes(m) {
    const open = (cx, dx, dy, big) => `<g class="f-eye"><ellipse cx="${cx}" cy="104" rx="19" ry="22" fill="#fff"/><ellipse cx="${cx + dx}" cy="${104 + dy}" rx="${big ? 9 : 11.500}" ry="${big ? 11.500 : 14}" fill="${K.dark}"/><circle cx="${cx + dx + 5}" cy="${104 + dy - 5}" r="4.600" fill="#fff"/><circle cx="${cx + dx - 4}" cy="${104 + dy + 6}" r="2" fill="#fff" opacity=".85"/></g>`;
    const arc = (cx, up) => `<path d="M${cx - 17} ${up ? 108 : 102} Q${cx} ${up ? 86 : 124} ${cx + 17} ${up ? 108 : 102}" stroke="${K.dark}" stroke-width="5.500" fill="none" stroke-linecap="round"/>`;
    switch (m) {
      case 'cheer': return arc(72, 1) + arc(128, 1);
      case 'sleepy': return arc(72, 0) + arc(128, 0);
      case 'wink': return open(72, 2, 2) + arc(128, 1);
      case 'sad': return open(72, 1, 4) + open(128, 1, 4) + `<path d="M50 84 L90 76M150 84 L110 76" stroke="${K.dark}" stroke-width="4.500" stroke-linecap="round"/><path class="f-tear" d="M142 128 C136 138 137 146 142 146 C147 146 148 138 142 128 Z" fill="#7CC8F2"/>`;
      case 'think': return open(72, -6, -6) + open(128, -6, -6) + `<path d="M110 80 Q130 70 148 80" stroke="${K.dark}" stroke-width="4.500" fill="none" stroke-linecap="round"/>`;
      case 'wow': return open(72, 0, 0, 1) + open(128, 0, 0, 1) + `<path d="M52 80 Q72 68 92 80M108 80 Q128 68 148 80" stroke="${K.dark}" stroke-width="4.500" fill="none" stroke-linecap="round"/>`;
      default: return open(72, 2, 3) + open(128, 2, 3);
    }
  }
  function mouth(m) {
    const stem = `<path d="M100 130 V137" stroke="${K.dark}" stroke-width="4" stroke-linecap="round"/>`;
    switch (m) {
      case 'cheer': return `<path d="M82 134 Q100 168 118 134 Z" fill="${K.red}" stroke="${K.dark}" stroke-width="4" stroke-linejoin="round"/><path d="M91 150 Q100 142 109 150 Q100 160 91 150 Z" fill="${K.pink}"/>`;
      case 'sad': return stem + `<path d="M87 148 Q100 136 113 148" stroke="${K.dark}" stroke-width="4.500" fill="none" stroke-linecap="round"/>`;
      case 'sleepy': return stem + `<ellipse cx="100" cy="146" rx="4.500" ry="3.200" fill="${K.dark}" opacity=".85"/>`;
      case 'think': return stem + `<path d="M90 144 Q102 140 114 135" stroke="${K.dark}" stroke-width="4.500" fill="none" stroke-linecap="round"/>`;
      case 'wow': return `<ellipse cx="100" cy="145" rx="8" ry="10" fill="${K.red}" stroke="${K.dark}" stroke-width="4"/>`;
      case 'proud': return stem + `<path d="M84 137 Q100 156 116 137" stroke="${K.dark}" stroke-width="4.500" fill="none" stroke-linecap="round"/>`;
      default: return stem + `<path d="M86 136 Q100 151 114 136" stroke="${K.dark}" stroke-width="4.500" fill="none" stroke-linecap="round"/>`;
    }
  }
  const ACC = {
    glasses: { over: `<g fill="rgba(255,255,255,.22)" stroke="#2B3A67" stroke-width="5"><circle cx="72" cy="104" r="25"/><circle cx="128" cy="104" r="25"/></g><path d="M97 102 H103" stroke="#2B3A67" stroke-width="5" stroke-linecap="round"/>` },
    scarf: { front: `<path d="M60 151 C82 168 118 168 140 151 L146 170 C120 188 80 188 54 170 Z" fill="#DE4B40"/><path d="M60 151 C82 168 118 168 140 151" stroke="#B9362D" stroke-width="3" fill="none"/><path d="M116 176 L124 212 L142 205 L136 172 Z" fill="#C23A31"/>` },
    cap: { over: `<path d="M36 82 C70 66 130 66 164 82 L160 96 C128 82 72 82 40 96 Z" fill="#E04B4B"/><path d="M38 89 C72 74 128 74 162 89" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>` },
    phones: { back: `<path d="M36 108 C28 36 172 36 164 108" stroke="#2B2F3A" stroke-width="8" fill="none" stroke-linecap="round"/>`, over: `<rect x="24" y="96" width="19" height="34" rx="9" fill="#E9453B"/><rect x="157" y="96" width="19" height="34" rx="9" fill="#E9453B"/>` },
    grad: { over: `<path d="M100 30 L156 52 L100 74 L44 52 Z" fill="#232B3B"/><path d="M70 62 V82 Q100 94 130 82 V62 L100 74 Z" fill="#2F3B52"/><path d="M148 55 V86" stroke="#E9B949" stroke-width="3.500" stroke-linecap="round"/><circle cx="148" cy="89" r="4.500" fill="#E9B949"/>` },
    star: { over: `<path d="M100 60 L106 73 L120 75 L110 85 L112 99 L100 92 L88 99 L90 85 L80 75 L94 73 Z" fill="#F7C93A" stroke="#D29A1B" stroke-width="2.500" stroke-linejoin="round"/>` },
    crown: { over: `<path d="M70 62 L72 28 L87 44 L100 20 L113 44 L128 28 L130 62 Z" fill="#F7C93A" stroke="#D29A1B" stroke-width="3.500" stroke-linejoin="round"/><circle cx="100" cy="22" r="4" fill="#E9453B"/>` },
    ninja: { over: `<path d="M35 80 C70 66 130 66 165 80 L161 95 C128 82 72 82 39 95 Z" fill="#242833"/><path d="M158 82 L192 70 L184 88 L196 100 L160 96 Z" fill="#242833"/><rect x="86" y="75" width="28" height="14" rx="4" fill="#9AA3B5"/>` },
    shades: { over: `<path d="M34 83 H166 V105 Q160 130 133 130 Q112 130 108 110 Q100 105 92 110 Q88 130 67 130 Q40 130 40 105 Z" fill="#1B1F2A"/><path d="M52 100 L70 100M114 100 L132 100" stroke="rgba(255,255,255,.35)" stroke-width="3.500" stroke-linecap="round"/>` },
    party: { over: `<path d="M100 8 L128 66 H72 Z" fill="#7A5CE0"/><path d="M82 46 H118M90 28 H110" stroke="#F7C93A" stroke-width="4.500" stroke-linecap="round"/><circle cx="100" cy="9" r="7" fill="#F7C93A"/>` }
  };
  // rotations des bras (degrés) selon l'humeur : [gauche, droit]
  const POSE = { happy: [-4, 4], wink: [-4, 4], wave: [-4, -128], cheer: [128, -128], proud: [22, -22], sad: [-8, 8], sleepy: [-4, 4], think: [-4, -146], wow: [26, -26] };
  const VB = { full: '0 0 200 232', bust: '8 0 184 204', head: '10 0 180 176' };
  let uid = 0;

  LP.fenn = function (mood, o) {
    o = o || {}; const m = POSE[mood] ? mood : 'happy', id = 'fn' + (++uid);
    const acc = o.acc && ACC[o.acc] ? ACC[o.acc] : {}, crop = VB[o.crop] ? o.crop : 'bust', size = o.size || 120;
    const [w, h] = VB[crop].split(' ').slice(2).map(Number);
    const px = Math.round(size), py = Math.round(size * h / w);
    const delay = (-(uid * 1.7) % 4).toFixed(2) + 's';
    const [al, ar] = POSE[m];
    const armL = `<g transform="rotate(${al} 66 158)"><g class="f-armL"><path d="${ARM}" fill="${K.sand}"/><ellipse cx="62" cy="194" rx="9" ry="7" fill="${K.cream}"/></g></g>`, armR = `<g transform="rotate(${ar} 134 158)"><g class="f-armR"><path d="${mirror(ARM)}" fill="${K.sand}"/><ellipse cx="138" cy="194" rx="9" ry="7" fill="${K.cream}"/></g></g>`;
    const blush = `<ellipse cx="50" cy="132" rx="10" ry="6" fill="${K.pink}" opacity=".6"/><ellipse cx="150" cy="132" rx="10" ry="6" fill="${K.pink}" opacity=".6"/>`;
    const extras = m === 'sleepy' ? `<g class="f-z" fill="none" stroke="currentColor" stroke-width="3.500" stroke-linecap="round" stroke-linejoin="round" opacity=".55"><path d="M150 40 h14 l-14 16 h14"/><path d="M170 20 h10 l-10 12 h10"/></g>`
      : m === 'proud' || m === 'cheer' ? `<g class="f-spark" fill="#F7C93A"><path d="M170 30 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/><path d="M26 44 l2.500 6 6 2.500 -6 2.500 -2.500 6 -2.500 -6 -6 -2.500 6 -2.500z"/></g>`
      : m === 'think' ? `<g fill="currentColor" opacity=".35"><circle cx="160" cy="44" r="4"/><circle cx="172" cy="28" r="6"/></g>` : '';
    return `<svg class="fenn m-${m}${o.anim ? ' anim' : ''}" width="${px}" height="${py}" viewBox="${VB[crop]}" role="img" aria-label="${esc(o.label || 'Fenn, la mascotte')}" style="--fd:${delay}">
      <g class="f-all">
        ${acc.back || ''}
        <g class="f-tail"><path d="M126 206 C162 212 192 190 190 150 C189 126 176 110 163 118 C171 140 158 170 128 180 Z" fill="${K.sand}"/><path d="M176 113 C187 123 191 138 190 152 C184 140 173 130 163 118 C167 111 173 110 176 113 Z" fill="${K.tip}"/></g>
        <g class="f-body"><path d="M56 222 C48 176 68 142 100 142 C132 142 152 176 144 222 Z" fill="${K.sand}"/><path d="M80 222 C75 192 86 162 100 162 C114 162 125 192 120 222 Z" fill="${K.cream}"/><ellipse cx="76" cy="222" rx="18" ry="9" fill="${K.sandD}"/><ellipse cx="124" cy="222" rx="18" ry="9" fill="${K.sandD}"/></g>
        ${Math.abs(al)>100?'':armL}
        ${Math.abs(ar)>100?'':armR}
        <g class="f-earL"><path d="${EAR}" fill="${K.sand}"/><path d="${EAR_IN}" fill="${K.pink}"/></g>
        <g class="f-earR"><path d="${mirror(EAR)}" fill="${K.sand}"/><path d="${mirror(EAR_IN)}" fill="${K.pink}"/></g>
        <g class="f-head">
          <path d="${HEAD}" fill="${K.sand}"/><path d="${MASK}" fill="${K.cream}"/>
          <path d="M33 110 C24 118 24 132 34 138 C44 138 50 130 52 120 Z" fill="${K.sand}"/><path d="${mirror('M33 110 C24 118 24 132 34 138 C44 138 50 130 52 120 Z')}" fill="${K.sand}"/>
          ${blush}${eyes(m)}<path d="${NOSE}" fill="${K.dark}"/><ellipse cx="97" cy="117" rx="3" ry="1.600" fill="#fff" opacity=".5"/>${mouth(m)}
          ${acc.over || ''}
        </g>
        ${Math.abs(al)>100?armL:''}${Math.abs(ar)>100?armR:''}${acc.front || ''}${extras}
      </g></svg>`;
  };
  LP.fenn.moods = Object.keys(POSE); LP.fenn.accs = Object.keys(ACC);
})();

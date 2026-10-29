// OU 캐릭터 순위 — 문장 240 · 단어 30에 세 캐릭터의 1·2·3순위를 매긴다.
// 화면은 순위만 받는다. 4점 척도 환산은 데이터를 처리할 때 한다.

// 캐릭터 이름·설명은 기아 원문 그대로 (00_기아자료/OU Pairing.docx)
const CHARS = [
  { id: 'cv',  col: '선구자', ko: '문화적 선구자',   en: 'CULTURE VANGUARD',
    qko: '우리는 새로운 문화를 발견하고 재창조합니다.', qen: 'We uncover and remix emerging culture.', color: '#FFC83D' },
  { id: 'crt', col: '모험가', ko: '창의적 모험가',   en: 'CREATIVE RISK-TAKERS',
    qko: '우리는 창의적 모험을 통해 한계에 도전합니다.', qen: 'We challenge ourselves to take creative risks.', color: '#FF7A8A' },
  { id: 'ri',  col: '혁신가', ko: '끊임없는 혁신가', en: 'RELENTLESS INNOVATORS',
    qko: '우리는 새로운 방식으로 보고 행동합니다.', qen: 'We seek new ways of seeing and doing.', color: '#5FE6B0' },
];

const STAGES = [
  { key: 'artist',   name: '예술가의 문장',     kind: 'SENTENCE' },
  { key: 'magazine', name: '기아 매거진 발췌',   kind: 'SENTENCE' },
  { key: 'words',    name: '디알렉티카 단어',   kind: 'WORD' },
];

// 카드 270장을 한 줄로 편다
const CARDS = [];
STAGES.forEach((st, si) => {
  SRC[st.key].rows.forEach((r, ri) => {
    if (st.key === 'words') CARDS.push({ si, ri, text: r[0], who: '' });
    else CARDS.push({ si, ri, text: r[9], who: r[7], when: st.key === 'artist' ? r[8] : '', link: st.key === 'magazine' ? r[8] : '' });
  });
});
const TOTAL = CARDS.length;

// ---------- 저장 (같은 브라우저에서 이어하기) ----------
const KEY = 'ou-ranking-v1';
let S = { name: '', idx: 0, ranks: {}, last: null };  // ranks[카드번호] = ['cv','ri','crt'] (1위→3위)
function load() { try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.ranks) S = v; } catch (e) {} }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

// ---------- 화면 전환 ----------
const $ = id => document.getElementById(id);
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  $(id).classList.add('on');
}

function charBlock(c, extra = '') {
  return `<div class="ko">${c.ko}</div><div class="en">${c.en}</div>
          <div class="q-ko">${c.qko}</div><div class="q-en">${c.qen}</div>${extra}`;
}

// ---------- 시작 ----------
function initStart() {
  $('cast').innerHTML = CHARS.map(c => `<div class="who" style="--c:${c.color}">${charBlock(c)}</div>`).join('');
  $('name').value = S.name;
  const done = Object.keys(S.ranks).length;
  if (done > 0) {
    $('btn-go').textContent = `이어하기 (${done}/${TOTAL}) ▶`;
    $('btn-reset').hidden = false;
  }
  $('btn-go').onclick = () => {
    const n = $('name').value.trim();
    if (!n) { $('name').focus(); $('name').placeholder = '이름을 먼저 입력하세요'; return; }
    S.name = n; save();
    if (Object.keys(S.ranks).length >= TOTAL) return showEnd();
    const first = S.idx === 0 || CARDS[S.idx].ri === 0;
    first ? showStageIntro(CARDS[S.idx].si) : startPlay();
  };
  $('btn-reset').onclick = () => {
    if (!confirm('지금까지 매긴 순위가 모두 지워져요. 처음부터 할까요?')) return;
    S = { name: $('name').value.trim(), idx: 0, ranks: {}, last: null }; save();
    $('btn-go').textContent = '시작 ▶'; $('btn-reset').hidden = true;
  };
  $('name').addEventListener('keydown', e => { if (e.key === 'Enter') $('btn-go').click(); });
}

// ---------- 스테이지 시작·클리어 ----------
function showStageIntro(si) {
  const st = STAGES[si];
  const n = SRC[st.key].rows.length;
  $('stage-no').textContent = `STAGE ${si + 1} / ${STAGES.length}`;
  $('stage-name').textContent = st.name;
  $('stage-sub').textContent = `${n}${st.kind === 'WORD' ? '개 단어' : '개 문장'}`;
  $('btn-stage').textContent = '시작 ▶';
  $('btn-stage').onclick = startPlay;
  show('s-stage');
}
function showStageClear(si) {
  $('stage-no').textContent = `STAGE ${si + 1} CLEAR`;
  $('stage-name').textContent = STAGES[si].name;
  $('stage-sub').textContent = `${SRC[STAGES[si].key].rows.length}장 완료 · 다음은 ${STAGES[si + 1].name}`;
  $('btn-stage').textContent = '다음 스테이지 ▶';
  $('btn-stage').onclick = () => showStageIntro(si + 1);
  show('s-stage');
}

// ---------- 플레이 ----------
let pick = [];        // 지금 카드에서 고른 순서
let typing = null;

function buildRoad() {
  let h = '';
  STAGES.forEach((st, si) => {
    h += '<div class="seg">';
    CARDS.forEach((c, i) => { if (c.si === si) h += `<i data-i="${i}"${(c.ri + 1) % 10 === 0 ? ' class="flag"' : ''}></i>`; });
    h += '</div>';
  });
  $('road').innerHTML = h;
}
function paintRoad() {
  $('road').querySelectorAll('i').forEach(el => {
    const i = +el.dataset.i;
    el.classList.toggle('done', !!S.ranks[i]);
    el.classList.toggle('now', i === S.idx);
  });
}

function buildMedals() {
  $('medals').innerHTML = CHARS.map((c, k) =>
    `<button class="medal" data-id="${c.id}" style="--c:${c.color}">${charBlock(c, `<span class="key">${k + 1}</span>`)}</button>`).join('');
  $('medals').querySelectorAll('.medal').forEach(b => b.onclick = () => choose(b.dataset.id));
}

function startPlay() {
  show('s-play');
  renderCard(true);
}

function renderCard(animate) {
  const c = CARDS[S.idx];
  const st = STAGES[c.si];
  $('hud-stage').textContent = `STAGE ${c.si + 1} · ${st.name}`;
  $('hud-count').textContent = `${c.ri + 1} / ${SRC[st.key].rows.length}   ·   전체 ${Object.keys(S.ranks).length} / ${TOTAL}`;
  $('card-kind').textContent = st.kind;
  const t = $('card-text');
  t.className = 'card-text' + (st.kind === 'WORD' ? ' word' : '');
  let who = c.who || '';
  if (c.when) who += ` · ${c.when}`;
  if (c.link) who += ` · <a href="${c.link}" target="_blank" rel="noopener">원문 기사</a>`;
  $('card-who').innerHTML = who;
  typeText(t, c.text);
  pick = (S.ranks[S.idx] || []).slice();
  paintPick();
  paintRoad();
  $('btn-undo').disabled = S.last === null;
  if (animate) { const k = $('card'); k.classList.remove('in', 'out'); void k.offsetWidth; k.classList.add('in'); }
}

// 타자 치듯 찍는다. 길어도 0.7초 안에 끝나고, 카드를 누르면 바로 다 보인다.
function typeText(el, s) {
  clearInterval(typing);
  const chars = [...s];
  const step = Math.max(1, Math.ceil(chars.length / 28));
  let n = 0;
  el.innerHTML = '<span class="cur"></span>';
  typing = setInterval(() => {
    n = Math.min(chars.length, n + step);
    el.textContent = chars.slice(0, n).join('');
    if (n >= chars.length) clearInterval(typing);
    else el.insertAdjacentHTML('beforeend', '<span class="cur"></span>');
  }, 25);
  $('card').onclick = e => { if (e.target.tagName !== 'A') { clearInterval(typing); el.textContent = s; } };
}

function choose(id) {
  if (pick.includes(id)) { pick = pick.slice(0, pick.indexOf(id)); }   // 고른 메달을 다시 누르면 그 자리부터 다시
  else if (pick.length < 3) {
    pick.push(id);
    if (pick.length === 2) pick.push(CHARS.find(c => !pick.includes(c.id)).id);  // 둘 고르면 남은 하나가 3위
  }
  paintPick();
}

function paintPick() {
  document.querySelectorAll('.medal').forEach(b => {
    const r = pick.indexOf(b.dataset.id);
    b.classList.toggle('taken', r >= 0);
    b.querySelector('.rank')?.remove();
    if (r >= 0) b.insertAdjacentHTML('beforeend', `<span class="rank">${r + 1}</span>`);
  });
  document.querySelectorAll('.slot').forEach(sl => {
    const id = pick[+sl.dataset.r - 1];
    const c = CHARS.find(x => x.id === id);
    const seat = sl.querySelector('.seat');
    const had = seat.dataset.id || '';
    if (had !== (id || '')) {
      seat.innerHTML = c ? `<b style="--c:${c.color}">${c.ko}</b>` : '';
      seat.dataset.id = id || '';
    }
  });
  $('btn-next').disabled = pick.length < 3;
}

function confirmCard() {
  if (pick.length < 3) return;
  S.ranks[S.idx] = pick.slice();
  S.last = S.idx;
  const cur = CARDS[S.idx];
  // 다음 빈 카드 (되돌아온 카드를 다시 확정했을 때도 앞으로 이어 간다)
  let nxt = S.idx + 1;
  while (nxt < TOTAL && S.ranks[nxt]) nxt++;
  if (nxt >= TOTAL) { nxt = 0; while (nxt < TOTAL && S.ranks[nxt]) nxt++; }
  save();
  const k = $('card'); k.classList.remove('in'); void k.offsetWidth; k.classList.add('out');
  setTimeout(() => {
    if (nxt >= TOTAL) { S.idx = TOTAL - 1; save(); return showEnd(); }
    S.idx = nxt; save();
    if (CARDS[nxt].si !== cur.si) return showStageClear(cur.si);
    renderCard(true);
  }, 260);
}

function undo() {
  if (S.last === null) return;
  S.idx = S.last; S.last = null; save();
  renderCard(true);
}

// ---------- 엔딩 ----------
function showEnd() {
  const firsts = { cv: 0, crt: 0, ri: 0 };
  Object.values(S.ranks).forEach(r => firsts[r[0]]++);
  const top = Math.max(...Object.values(firsts));
  const tops = CHARS.filter(c => firsts[c.id] === top);   // 같으면 함께 보여 준다
  $('end-char').style.setProperty('--c', tops[0].color);
  $('end-char').innerHTML = tops.map(c => `<div style="--c:${c.color}">${charBlock(c)}</div>`).join('<hr style="border:0;border-top:2px dashed var(--line);margin:16px 0">');
  show('s-end');
}

// ---------- 엑셀 ----------
// 원본 시트 이름·열 그대로. 문장 시트는 선구자·모험가·혁신가 열(E~G)에 순위(1·2·3)를 넣고,
// 단어 시트는 원본 다섯 열 뒤에 같은 세 열을 붙인다.
function downloadXlsx() {
  const wb = XLSX.utils.book_new();
  const rankOf = (i, col) => {
    const r = S.ranks[i]; if (!r) return '';
    return r.indexOf(CHARS.find(c => c.col === col).id) + 1;
  };
  STAGES.forEach((st, si) => {
    const src = SRC[st.key];
    const base = CARDS.findIndex(c => c.si === si);
    let header = src.header.slice();
    let rows;
    if (st.key === 'words') {
      header = header.concat(CHARS.map(c => c.col));
      rows = src.rows.map((r, ri) => r.concat(CHARS.map(c => rankOf(base + ri, c.col))));
    } else {
      rows = src.rows.map((r, ri) => {
        const o = r.slice();
        CHARS.forEach(c => { o[header.indexOf(c.col)] = rankOf(base + ri, c.col); });
        return o;
      });
    }
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows].map(r => r.map(v => v ?? '')));
    XLSX.utils.book_append_sheet(wb, ws, src.sheet);
  });
  const now = new Date();
  const info = [
    ['참여자', S.name],
    ['내려받은 시각', now.toLocaleString('ko-KR')],
    ['매긴 카드', `${Object.keys(S.ranks).length} / ${TOTAL}`],
    ['값', '1 = 1순위, 2 = 2순위, 3 = 3순위'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(info), '정보');
  const ymd = String(now.getFullYear()).slice(2) + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
  XLSX.writeFile(wb, `3CC순위_${S.name}_${ymd}.xlsx`);
}

// ---------- 키보드 ----------
document.addEventListener('keydown', e => {
  if (!$('s-play').classList.contains('on')) return;
  if (['1', '2', '3'].includes(e.key)) choose(CHARS[+e.key - 1].id);
  else if (e.key === 'Enter') confirmCard();
  else if (e.key === 'Backspace') { pick = []; paintPick(); }
});

// ---------- 시작 ----------
load();
buildRoad();
buildMedals();
initStart();
$('btn-next').onclick = confirmCard;
$('btn-clear').onclick = () => { pick = []; paintPick(); };
$('btn-undo').onclick = undo;
$('btn-xlsx').onclick = downloadXlsx;
$('btn-back').onclick = () => { S.idx = TOTAL - 1; save(); startPlay(); };

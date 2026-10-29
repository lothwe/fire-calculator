import { calculate, DEFAULTS, WITHDRAWAL_RATES, CURRENCIES, parseNumber } from './calc.js';
import { COPY } from './copy.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// ---------- Copy ----------
// t('key', { placeholder: value }) → text from js/copy.js, with {placeholders}
// filled in and **bold** turned into <strong>.
function t(key, vars = {}) {
  const s = COPY[key];
  if (s === undefined) { console.warn(`Missing text in copy.js: ${key}`); return key; }
  return s
    .replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m))
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
function applyStaticCopy() {
  $$('[data-copy]').forEach((el) => { el.innerHTML = t(el.dataset.copy); });
  document.title = COPY.pageTitle;
  $('#byline')?.setAttribute('href', COPY.titleBylineUrl);
  $('meta[name=description]')?.setAttribute('content', COPY.metaDescription);
}

// ---------- State ----------
// Coast FIRE is a by-product of the inputs, so the goal is always FIRE.
const KEYS = Object.keys(DEFAULTS).filter((k) => k !== 'goal');
// Optional inputs: left empty, they use their default (shown as a grey placeholder).
const OPTIONAL = ['ret', 'g', 'inf'];
const URLKEY = (k) => (k === 'currency' ? 'cur' : k);
const NUMERIC = ['spend', 'wr', 'age', 'ret', 'pv', 'c', 'by', 'g', 'inf'];
const state = readUrl();
let E = effective();                 // state with defaults filled in for empty optional fields
function effective() {
  const e = { ...state, goal: 'fire' };
  for (const k of OPTIONAL) if (!Number.isFinite(e[k])) e[k] = DEFAULTS[k];
  return e;
}
const touched = new Set();
let tableView = 'real';
let firstName = '';                  // only used for the image export; never put in the URL
let last = null;

function readUrl() {
  const s = { ...DEFAULTS };
  const q = new URLSearchParams(location.search);
  for (const k of KEYS) {
    if (!q.has(URLKEY(k))) continue;
    const raw = q.get(URLKEY(k));
    if (NUMERIC.includes(k)) {
      const n = parseNumber(raw);
      if (Number.isFinite(n)) s[k] = n;
    } else s[k] = raw;
  }
  if (!CURRENCIES.includes(s.currency)) s.currency = DEFAULTS.currency;
  if (!['m', 'y'].includes(s.per)) s.per = DEFAULTS.per;
  if (!WITHDRAWAL_RATES.includes(s.wr)) s.wr = DEFAULTS.wr;
  return s;
}

function scenarioQuery() {
  const q = new URLSearchParams();
  for (const k of KEYS) {
    const v = state[k];
    if (typeof v === 'number' && !Number.isFinite(v)) continue;
    q.set(URLKEY(k), v);
  }
  return q;
}
let urlTimer;
function writeUrl() {
  clearTimeout(urlTimer);
  urlTimer = setTimeout(() => history.replaceState(null, '', `${location.pathname}?${scenarioQuery()}`), 250);
}

// ---------- Formatting ----------
const fmtCache = {};
function money(v, compact = false) {
  if (compact) {
    const sym = symbol(); const sp = sym.length > 1 ? ' ' : '';
    const a = Math.abs(v);
    if (a >= 1e6) return sym + sp + Number((v / 1e6).toFixed(a >= 1e7 ? 0 : 2)) + 'M';
    if (a >= 1e3) return sym + sp + Math.round(v / 1e3) + 'k';
    return sym + sp + Math.round(v);
  }
  fmtCache[state.currency] ??= new Intl.NumberFormat('en-US', {
    style: 'currency', currency: state.currency, maximumFractionDigits: 0, minimumFractionDigits: 0,
  });
  return fmtCache[state.currency].format(Math.round(v));
}
const symbol = () => new Intl.NumberFormat('en-US', { style: 'currency', currency: state.currency })
  .formatToParts(0).find((p) => p.type === 'currency').value;
const msLabel = (t0) => {
  const s = symbol(); const sp = s.length > 1 ? ' ' : '';
  return s + sp + (t0 >= 1e6 ? `${t0 / 1e6}M` : `${t0 / 1e3}k`);
};
const num = (v) => (Number.isFinite(v) ? v.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '');
const pct = (v) => `${Number((v * 100).toFixed(2))}%`;

const now = new Date();
const yearAt = (m) => new Date(now.getFullYear(), now.getMonth() + m, 1).getFullYear();
const ageAt = (m) => Math.floor(E.age + m / 12 + 1e-9);
function duration(m) {
  m = Math.abs(m);
  const y = Math.floor(m / 12), mo = m % 12;
  const parts = [];
  if (y) parts.push(`${y} ${y === 1 ? COPY.year : COPY.years}`);
  if (mo) parts.push(`${mo} ${mo === 1 ? COPY.month : COPY.months}`);
  return parts.join(', ') || `0 ${COPY.months}`;
}
function shortDur(m) {
  if (m < 12) return `${m} ${COPY.shortMonths}`;
  const y = Math.round(m / 12);
  return `${y} ${y === 1 ? COPY.shortYear : COPY.shortYears}`;
}

// ---------- Info tooltips ----------
const INFO_ICON = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7"/><path d="M8 7.2v4.1M8 4.7v.1"/></svg>';
function initInfo() {
  $$('.info').forEach((b) => { b.innerHTML = INFO_ICON; b.setAttribute('aria-label', COPY.infoLabel); });
  const tip = $('#tooltip');
  let current = null;
  const content = (b) => b.dataset.tipHtml ?? t(b.dataset.tip);
  const show = (b) => {
    current = b;
    tip.innerHTML = content(b);
    tip.hidden = false;
    b.setAttribute('aria-describedby', 'tooltip');
    const r = b.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight, pad = 12;
    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - tw - pad));
    let top = r.top - th - 10;
    let below = false;
    if (top < pad) { top = r.bottom + 10; below = true; }
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
    tip.style.setProperty('--arrow-x', `${r.left + r.width / 2 - left}px`);
    tip.classList.toggle('below', below);
  };
  const hide = () => { if (current) current.removeAttribute('aria-describedby'); current = null; tip.hidden = true; };
  document.addEventListener('mouseover', (e) => { const b = e.target.closest('.info'); if (b) show(b); });
  document.addEventListener('mouseout', (e) => { const b = e.target.closest('.info'); if (b && !b.contains(e.relatedTarget)) hide(); });
  document.addEventListener('focusin', (e) => { const b = e.target.closest('.info'); if (b) show(b); });
  document.addEventListener('focusout', (e) => { if (e.target.closest('.info')) hide(); });
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.info');
    if (b) { e.preventDefault(); e.stopPropagation(); if (current === b && !tip.hidden) hide(); else show(b); }
    else hide();
  }, true);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  window.addEventListener('scroll', hide, { passive: true });
}

// ---------- Sliders with notches ----------
const SLIDERS = {
  pv: () => ({ max: 1000000, step: 1000, notch: 100000, labelEvery: 2 }),  // notch 100k, label 200k
  c: () => ({ max: 10000, step: 50, notch: 500, labelEvery: 4 }),           // notch 500, label 2k
  spend: () => (state.per === 'y'
    ? { max: 120000, step: 500, notch: 10000, labelEvery: 4 }               // notch 10k, label 40k
    : { max: 10000, step: 50, notch: 500, labelEvery: 4 }),                  // notch 500, label 2k
};
function initTicks() {
  for (const [k, cfgFn] of Object.entries(SLIDERS)) {
    const cfg = cfgFn();
    const range = $(`#${k}-range`);
    range.max = cfg.max; range.step = cfg.step;
    const max = cfg.max;
    let html = '';
    for (let v = 0, n = 0; v <= max; v += cfg.notch, n++) {
      const major = n % cfg.labelEvery === 0;
      html += `<span class="tick${major ? ' major' : ''}" style="left:${(v / max) * 100}%" data-v="${v}">`
        + (major ? `<em>${money(v, true)}</em>` : '') + '</span>';
    }
    $(`[data-ticks="${k}"]`).innerHTML = html;
  }
}
// Gently snap to a notch when the slider lands close to one.
function snap(k, v) {
  const { notch } = SLIDERS[k]();
  const nearest = Math.round(v / notch) * notch;
  return Math.abs(v - nearest) <= Number($(`#${k}-range`).max) * 0.012 ? nearest : v;
}
function syncRange(k) {
  const r = $(`#${k}-range`);
  if (Number.isFinite(state[k])) r.value = Math.min(Math.max(state[k], 0), Number(r.max));
  r.style.setProperty('--fill', `${(Number(r.value) / Number(r.max)) * 100}%`);
  $$(`[data-ticks="${k}"] .tick`).forEach((tk) => tk.classList.toggle('on', Number(tk.dataset.v) <= Number(r.value)));
}

// ---------- Init inputs ----------
function initInputs() {
  $('#currency').value = state.currency;
  $('#wr-chips').innerHTML = WITHDRAWAL_RATES.map((r) =>
    `<button type="button" role="radio" data-wr="${r}" aria-checked="${r === state.wr}">${r}%</button>`).join('');
  for (const k of ['spend', 'pv', 'c']) $(`#${k}`).value = num(state[k]);
  for (const k of ['age', 'ret', 'by', 'g', 'inf']) $(`#${k}`).value = Number.isFinite(state[k]) ? state[k] : '';
  for (const k of OPTIONAL) $(`#${k}`).placeholder = DEFAULTS[k];
  setSeg('[data-per]', 'per', state.per);
  updateSymbols();
}
function setSeg(sel, attr, value) {
  $$(sel).forEach((b) => b.setAttribute('aria-checked', String(b.dataset[attr] === value)));
}
function updateSymbols() {
  const s = symbol();
  $$('[data-sym]').forEach((el) => { el.textContent = s; });
  document.documentElement.style.setProperty('--sym-pad', s.length > 1 ? '50px' : '28px');
  initTicks(); syncRange('pv'); syncRange('c'); syncRange('spend');
}

// ---------- Events ----------
function bind() {
  $('#currency').addEventListener('change', (e) => {
    state.currency = e.target.value; updateSymbols(); update();
  });

  for (const k of ['spend', 'pv', 'c', 'age', 'ret', 'by', 'g', 'inf']) {
    const el = $(`#${k}`);
    el.addEventListener('input', () => {
      state[k] = parseNumber(el.value);
      touched.add(k);
      if (k in SLIDERS) syncRange(k);
      update();
    });
    el.addEventListener('blur', () => {
      touched.add(k);
      if (['spend', 'pv', 'c'].includes(k) && Number.isFinite(state[k])) el.value = num(state[k]);
      update();
    });
  }

  for (const k of Object.keys(SLIDERS)) {
    $(`#${k}-range`).addEventListener('input', (e) => {
      state[k] = snap(k, Number(e.target.value));
      $(`#${k}`).value = num(state[k]);
      syncRange(k);
      update();
    });
  }

  $$('[data-per]').forEach((b) => b.addEventListener('click', () => {
    const per = b.dataset.per;
    if (per === state.per) return;
    if (Number.isFinite(state.spend)) {
      state.spend = per === 'y' ? state.spend * 12 : Math.round((state.spend / 12) * 100) / 100;
      $('#spend').value = num(state.spend);
    }
    state.per = per; setSeg('[data-per]', 'per', per);
    initTicks(); syncRange('spend'); update();
  }));

  $('#wr-chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-wr]'); if (!b) return;
    state.wr = Number(b.dataset.wr);
    $$('[data-wr]').forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    update();
  });

  $('#name').addEventListener('input', (e) => { firstName = e.target.value.trim(); });
  initExport();

  $$('[data-tv]').forEach((b) => b.addEventListener('click', () => {
    tableView = b.dataset.tv; setSeg('[data-tv]', 'tv', tableView);
    if (last?.yearly) renderTable(last);
  }));

  $$('[data-step]').forEach((b) => b.addEventListener('click', () => {
    const k = b.dataset.step, d = Number(b.dataset.d);
    const max = k === 'g' ? 15 : 10;
    const cur = Number.isFinite(state[k]) ? state[k] : DEFAULTS[k];
    state[k] = Math.min(max, Math.max(0, Math.round((cur + d) * 10) / 10));
    $(`#${k}`).value = state[k]; update();
  }));

  $('#copy').addEventListener('click', async () => {
    clearTimeout(urlTimer);
    const url = `${location.origin}${location.pathname}?${scenarioQuery()}`;
    history.replaceState(null, '', url);
    try { await navigator.clipboard.writeText(url); }
    catch { window.prompt(COPY.sharePrompt, url); return; }
    const label = $('#copy-label');
    label.innerHTML = t('shareCopied');
    $('#copy').classList.add('copied');
    setTimeout(() => { label.innerHTML = t('shareButton'); $('#copy').classList.remove('copied'); }, 2200);
  });

  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => last?.ok && last.hasPortfolio && drawChart(last), 120); });
}

// ---------- Render ----------
function showErrors(errors) {
  $$('[data-err]').forEach((p) => {
    const k = p.dataset.err;
    const show = errors[k] && (touched.has(k) || Number.isFinite(state[k]));
    p.textContent = show ? COPY[errors[k]] ?? errors[k] : '';
    $(`#${k}`)?.classList.toggle('invalid', Boolean(show));
  });
}

function update() {
  writeUrl();
  E = effective();
  const r = calculate(E);
  last = r;
  showErrors(r.errors || {});

  $('#empty').hidden = r.ok;
  if (!r.ok) $('#sticky').hidden = true;
  $('#out').hidden = !r.ok;
  if (!r.ok) {
    $('#real-growth').innerHTML = t('realGrowth', { rate: '–' });
    return;
  }

  $('#real-growth').innerHTML = t('realGrowth', { rate: pct(r.realReturn) });

  // Coast FIRE (left) and FIRE (right)
  $('#coast-number').textContent = money(r.coastToday);
  $('#coast-sub').innerHTML = t('coastShort', { fireNumber: money(r.fire), retAge: E.ret });
  $('#coast-info').dataset.tipHtml = t('coastExplain', { retAge: E.ret });

  $('#fire-number').textContent = money(r.fire);
  const mult = Number((100 / state.wr).toFixed(1));
  const multiple = t('fireMultiple', { multiple: mult, yearlySpend: money(r.annualSpend) });
  if (r.fireFuture) {
    const vars = {
      year: yearAt(r.fireEvent.months), futureAmount: money(r.fireFuture), fireNumber: money(r.fire),
      monthlySpend: money(r.monthlySpend), futureMonthlySpend: money(r.monthlySpendFuture),
    };
    $('#fire-sub').innerHTML = t('fireFutureShort', vars);
    $('#fire-info').dataset.tipHtml = `${multiple}<br><br>${t('fireFuture', vars)}`;
  } else {
    $('#fire-sub').innerHTML = multiple;
    $('#fire-info').dataset.tipHtml = multiple;
  }

  const warn = $('#warn');
  warn.hidden = !r.warnings.includes('negativeReal');
  warn.innerHTML = t('warnNegativeReal');

  renderSticky(r);
  $$('[data-when]').forEach((el) => { el.hidden = !r.hasPortfolio; });
  $('#projections').hidden = !r.hasPortfolio;
  $('#no-portfolio').hidden = r.hasPortfolio;
  if (!r.hasPortfolio) return;

  renderEvent('coast', r.coast);
  renderEvent('fire', r.fireEvent);
  renderGoal(r);
  renderMilestones(r);
  drawChart(r);
  renderTable(r);
}

function renderSticky(r) {
  const st = $('#sticky');
  st.hidden = false;
  const ev = (e) => (!e || !e.reached ? '–' : e.past ? '✓' : t('stickyAt', { age: ageAt(e.months) }));
  st.innerHTML = `<span><b>${t('stickyFire')}</b> ${money(r.fire, true)}${r.hasPortfolio ? ` ${ev(r.fireEvent)}` : ''}</span>`
    + (r.hasPortfolio ? `<span><b>${t('stickyCoast')}</b> ${ev(r.coast)}</span>` : '')
    + `<a href="#out">${t('stickyLink')}</a>`;
}

function renderEvent(kind, ev) {
  const when = $(`#${kind}-when`), detail = $(`#${kind}-detail`);
  if (!ev.reached) {
    if (kind === 'coast' && ev.afterRetirement) {
      when.innerHTML = t('coastNotBeforeRetirement', { retAge: E.ret });
      detail.innerHTML = t('coastNotBeforeRetirementDetail');
    } else {
      when.innerHTML = t('notReached');
      detail.innerHTML = t('notReachedDetail');
    }
    return;
  }
  const vars = { age: ageAt(ev.months), year: yearAt(ev.months), duration: duration(ev.months), retAge: E.ret };
  const check = (s) => s.replace('✓', '<span class="check">✓</span>');
  if (!ev.past) {
    when.innerHTML = t('reachedFuture', vars);
    detail.innerHTML = t(kind === 'coast' ? 'coastFutureDetail' : 'fireFutureDetail', vars);
    return;
  }
  let text;
  if (ev.estimable) {
    when.innerHTML = check(t('reachedPast', vars));
    const tip = t('reachedPastEstimate', { contribution: money(state.c) }).replace(/"/g, '&quot;');
    text = `${t('reachedPastDetail', vars)}<button type="button" class="info" data-tip-html="${tip}" aria-label="${COPY.infoLabel}">${INFO_ICON}</button>`;
  } else {
    when.innerHTML = check(t('reachedPastNoDate'));
    text = t(state.c > 0 ? 'reachedBefore18' : 'addContributionForDate');
  }
  detail.innerHTML = (kind === 'coast' ? `${t('coastAlreadyIntro', vars)} ` : '') + text;
}

function renderGoal(r) {
  const main = $('#goal-main'), sub = $('#goal-sub'), explain = $('#goal-explain');
  sub.className = 'tl-sub';
  sub.innerHTML = ''; explain.innerHTML = '';
  const fe = r.fireEvent;
  $('#by').placeholder = fe.reached && !fe.past ? ageAt(fe.months) : '';

  // No target age entered: show the current contribution and where it gets you.
  if (!Number.isFinite(state.by)) {
    if (fe.reached && fe.past) {
      main.innerHTML = t('savingsReached');
    } else if (fe.reached) {
      main.innerHTML = `${t('goalAmount', { amount: money(state.c || 0) })}<span class="per">${t('goalPerMonth')}</span>`;
      explain.innerHTML = t('savingsExplain', { byAge: ageAt(fe.months) });
    } else {
      main.textContent = '–';
      explain.innerHTML = t('savingsNotReached');
    }
    return;
  }

  // Target age entered: what you'd need to reach FIRE by then.
  const g = r.required;
  const byAge = state.by;
  const target = g.target ? ` ${t('goalTarget', { target: money(g.target) })}` : '';
  switch (g.status) {
    case 'needed': {
      main.innerHTML = `${t('goalAmount', { amount: money(g.amount) })}<span class="per">${t('goalPerMonth')}</span>`;
      explain.innerHTML = t('savingsExplain', { byAge });
      const gap = Math.round(g.gap);
      if (gap > 0) { sub.innerHTML = t('goalMore', { gap: money(gap) }) + target; sub.classList.add('is-more'); }
      else if (gap < 0) { sub.innerHTML = t('goalLess', { gap: money(-gap) }) + target; sub.classList.add('is-less'); }
      else sub.innerHTML = t('goalExact') + target;
      break;
    }
    case 'onTrack':
      main.innerHTML = t('goalOnTrack');
      sub.innerHTML = t('goalOnTrackDetail', { goal: t('goalFire'), byAge }) + target;
      break;
    default:
      main.textContent = '–';
      sub.innerHTML = t('goalInvalidAge');
  }
}

const CHECK_ICON = '<svg class="ms-check" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9"/><path d="M6 10.3l2.6 2.6L14 7.5"/></svg>';
function renderMilestones(r) {
  const strip = (s) => s.replace(/^✓\s*/, '');
  $('#milestones').innerHTML = r.milestones.map((ms) => {
    const v = { age: ageAt(ms.months ?? 0), year: yearAt(ms.months ?? 0), shortDuration: shortDur(ms.months ?? 0) };
    const head = (done) => `<span class="amt">${msLabel(ms.threshold)}${done ? CHECK_ICON : ''}</span>`;
    if (!ms.reached) return `<li class="none">${head(false)}<span class="when">${t('milestoneNotReached')}</span></li>`;
    if (!ms.past) return `<li>${head(false)}<span class="when">${t('milestoneFuture', v)}</span><span class="yr">${t('milestoneFutureYear', v)}</span></li>`;
    if (ms.estimable) return `<li class="done">${head(true)}<span class="when">${strip(t('milestonePast', v))}</span><span class="yr">${t('milestonePastYear', v)}</span></li>`;
    return `<li class="done">${head(true)}<span class="when">${strip(t('milestonePastNoDate'))}</span><span class="yr">&nbsp;</span></li>`;
  }).join('');
}

function renderTable(r) {
  const tags = (events) => events.map((e) => {
    if (e === 'coast') return `<span class="tag tag-coast">${t('tagCoast')}</span>`;
    if (e === 'fire') return `<span class="tag tag-fire">${t('tagFire')}</span>`;
    return `<span class="tag">${msLabel(e)}</span>`;
  }).join('');
  $('#yearly tbody').innerHTML = r.yearly.map((row) => {
    const v = row[tableView];
    return `<tr class="${row.events.includes('fire') ? 'is-fire' : ''}">
      <td><span class="yr-n">${row.year}</span><span class="yr-cal">${yearAt(row.endMonth)}</span></td>
      <td>${ageAt(row.endMonth)}</td>
      <td>${money(v.start)}</td>
      <td>${money(v.added)}</td>
      <td>${money(v.growth)}</td>
      <td class="end"><span>${money(v.end)}</span>${tags(row.events)}</td>
    </tr>`;
  }).join('');
}

// ---------- Plan image export ----------
// The plan uses your monthly contribution, or, if you entered a target FIRE age,
// the monthly savings goal needed to reach it. All dates are recalculated for that amount.
function planScenario() {
  const r = last;
  let c = Number.isFinite(state.c) ? state.c : 0;
  if (Number.isFinite(state.by) && r.required) {
    if (r.required.status === 'needed') c = r.required.amount;
    else if (r.required.status === 'onTrack') c = 0;
  }
  return { c, p: calculate({ ...E, c }) };
}

const EX = {
  W: 1600, H: 900, bg: '#005E51', card: '#0E7262', light: '#F2F9F5',
  ink: '#12231F', ink2: '#4A5D58', mint: '#CDEBDD', leaf: '#4DBB86', ring: '#A8E0C2',
};
function roundRect(ctx, x, y, w, h, rad) {
  ctx.beginPath();
  ctx.moveTo(x + rad, y); ctx.arcTo(x + w, y, x + w, y + h, rad); ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad); ctx.arcTo(x, y, x + w, y, rad); ctx.closePath();
}
function fitFont(ctx, text, weight, size, family, maxW) {
  let s0 = size;
  do { ctx.font = `${weight} ${s0}px ${family}`; s0 -= 1; } while (ctx.measureText(text).width > maxW && s0 > 12);
}
const PLEX = '"IBM Plex Sans", system-ui, sans-serif';
const SHRIK = 'Shrikhand, Georgia, serif';

async function renderPlanImage() {
  await Promise.all([
    document.fonts.load(`400 40px ${SHRIK}`), document.fonts.load(`400 20px ${PLEX}`), document.fonts.load(`600 20px ${PLEX}`),
  ]).catch(() => {});
  const { c, p } = planScenario();
  const scale = 2;
  const cv = document.createElement('canvas');
  cv.width = EX.W * scale; cv.height = EX.H * scale;
  const ctx = cv.getContext('2d');
  ctx.scale(scale, scale);
  ctx.textBaseline = 'alphabetic';

  // background
  ctx.fillStyle = EX.bg; ctx.fillRect(0, 0, EX.W, EX.H);

  const yearOf = (ev) => yearAt(ev.months);
  const byText = (ev) => {
    if (!ev || !ev.reached) return t('exportNotReached');
    if (ev.past) return t('exportReached');
    return t('exportBy', { year: yearOf(ev), age: ageAt(ev.months) });
  };

  // layout
  const row1 = 272, row2 = 470, h = 184, gap = 20;
  const colW = 340, midW = 340, outer = 34;
  const total = colW * 2 + midW * 2 + outer * 2 + gap;
  const xL = (EX.W - total) / 2, xM1 = xL + colW + outer, xM2 = xM1 + midW + gap, xR = xM2 + midW + outer;

  // title + brush underline
  const title = firstName ? t('exportTitle', { name: firstName }) : t('exportTitleNoName');
  ctx.fillStyle = '#fff';
  fitFont(ctx, title, 400, 64, SHRIK, EX.W - 180);
  ctx.fillText(title, xL + 15, 150);
  const tw = Math.min(ctx.measureText(title).width * 0.45, 320);
  ctx.strokeStyle = EX.leaf; ctx.lineCap = 'round';
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(xL + 17, 176); ctx.quadraticCurveTo(xL + 15 + tw / 2, 166, xL + 15 + tw, 170); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(xL + 27, 182); ctx.quadraticCurveTo(xL + 15 + tw / 2, 176, xL + 15 + tw * 0.85, 178); ctx.stroke();

  // first row: four stat cards (label, big value, line below)
  // theme 'dark' = savings + target FIRE age, 'light' = Coast FIRE + FIRE numbers
  const statCard = (x, y, w, { label, value, sub, theme, highlight = false }) => {
    const dark = theme === 'dark';
    ctx.fillStyle = dark ? EX.card : EX.light; roundRect(ctx, x, y, w, h, 18); ctx.fill();
    if (highlight) { ctx.strokeStyle = EX.leaf; ctx.lineWidth = 4; roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 16); ctx.stroke(); }
    ctx.fillStyle = dark ? EX.mint : EX.ink2; fitFont(ctx, label, 400, 20, PLEX, w - 56); ctx.fillText(label, x + 28, y + 48);
    ctx.fillStyle = dark ? '#fff' : EX.ink; fitFont(ctx, value, 400, 42, SHRIK, w - 56); ctx.fillText(value, x + 28, y + 106);
    if (sub) { ctx.fillStyle = dark ? EX.mint : EX.ink2; fitFont(ctx, sub, 400, 20, PLEX, w - 56); ctx.fillText(sub, x + 28, y + 148); }
  };
  const fe = p.fireEvent;
  statCard(xL, row1, colW, { theme: 'dark', label: t('exportSavingsLabel'), value: `${money(c)}${t('exportPerMonth')}`, sub: t('exportSavingsSub') });
  statCard(xM1, row1, midW, { theme: 'light', label: t('exportCoastTitle'), value: money(p.coastToday), sub: byText(p.coast) });
  statCard(xM2, row1, midW, { theme: 'light', label: t('exportFireTitle'), value: money(p.fire), sub: byText(fe) });
  if (fe.reached && !fe.past) {
    statCard(xR, row1, colW, { theme: 'dark', label: t('exportYearsLabel'),
      value: t('exportTargetAge', { age: ageAt(fe.months) }),
      sub: t('exportTargetSub', { year: yearOf(fe), years: Math.round(fe.months / 12) }) });
  } else {
    statCard(xR, row1, colW, { theme: 'dark', label: t('exportYearsLabel'), value: fe.reached ? t('exportReached') : '–', sub: fe.reached ? '' : t('exportNotReached') });
  }

  // milestone cards (dark, display-font title)
  const darkCard = (x, y, titleText, line) => {
    ctx.fillStyle = EX.card; roundRect(ctx, x, y, midW, h, 18); ctx.fill();
    ctx.fillStyle = '#fff'; fitFont(ctx, titleText, 400, 36, SHRIK, midW - 60); ctx.fillText(titleText, x + 32, y + 84);
    ctx.fillStyle = EX.mint; fitFont(ctx, line, 400, 22, PLEX, midW - 60); ctx.fillText(line, x + 32, y + 132);
  };

  // bottom row: upcoming milestones, then fun tiles to fill the remaining spots
  const slots = [[xL, colW], [xM1, midW], [xM2, midW], [xR, colW]];
  const upcoming = p.milestones.filter((m) => m.reached && !m.past).slice(0, 4);
  upcoming.forEach((m, k) => {
    const [x, w] = slots[k];
    milestoneCard(x, row2, w, t('exportFirstMilestone', { amount: msLabel(m.threshold) }), byText(m));
  });
  const progress = Math.max(0, Math.min(99, Math.floor((Number.isFinite(state.pv) ? state.pv : 0) / p.fire * 100)));
  const whimsies = [
    { bar: true, title: t('whimsyProgressTitle'), sub: t('whimsyProgressSub', { percent: progress }), draw: (x, y, w) => drawProgress(ctx, x, y, w, progress / 100) },
    { title: t('whimsySproutTitle'), sub: t('whimsySproutSub'), draw: (x, y, w) => drawSprout(ctx, x + w - 72, y + h / 2 + 6) },
    { title: t('whimsySunTitle'), sub: t('whimsySunSub'), draw: (x, y, w) => drawSun(ctx, x + w - 74, y + h / 2) },
  ];
  slots.slice(upcoming.length).forEach(([x, w], k) => whimsyCard(x, row2, w, whimsies[k % whimsies.length]));

  // credit + date
  ctx.fillStyle = EX.mint; ctx.font = `400 24px ${PLEX}`;
  ctx.fillText(t('exportCredit'), xL + 15, EX.H - 40);
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const created = t('exportCreatedOn', { date });
  ctx.textAlign = 'right';
  ctx.fillText(created, xR + colW - 15, EX.H - 40);
  ctx.textAlign = 'left';

  return new Promise((res) => cv.toBlob(res, 'image/png'));

  function milestoneCard(x, y, w, titleText, line) {
    ctx.fillStyle = EX.card; roundRect(ctx, x, y, w, h, 18); ctx.fill();
    ctx.fillStyle = '#fff'; fitFont(ctx, titleText, 400, 36, SHRIK, w - 60); ctx.fillText(titleText, x + 32, y + 84);
    ctx.fillStyle = EX.mint; fitFont(ctx, line, 400, 22, PLEX, w - 60); ctx.fillText(line, x + 32, y + 132);
  }
  function whimsyCard(x, y, w, wh) {
    ctx.fillStyle = EX.card; roundRect(ctx, x, y, w, h, 18); ctx.fill();
    const isBar = Boolean(wh.bar);
    const textW = isBar ? w - 60 : w - 140;
    ctx.fillStyle = '#fff';
    if (isBar) {
      fitFont(ctx, wh.title, 400, 28, SHRIK, textW); ctx.fillText(wh.title, x + 32, y + 62);
      ctx.fillStyle = EX.mint; fitFont(ctx, wh.sub, 400, 20, PLEX, textW); ctx.fillText(wh.sub, x + 32, y + 96);
    } else {
      // long titles wrap onto two lines instead of shrinking
      const words = wh.title.split(' ');
      let size = 26;
      ctx.font = `400 ${size}px ${SHRIK}`;
      while (size > 16 && Math.max(...words.map((wd) => ctx.measureText(wd).width)) > textW) {
        size -= 1; ctx.font = `400 ${size}px ${SHRIK}`;
      }
      let line1 = '', k = 0;
      while (k < words.length && ctx.measureText((line1 ? line1 + ' ' : '') + words[k]).width <= textW) line1 += (line1 ? ' ' : '') + words[k++];
      const line2 = words.slice(k).join(' ');
      const top = line2 ? y + 66 : y + 82;
      ctx.fillText(line1, x + 32, top);
      if (line2) { fitFont(ctx, line2, 400, size, SHRIK, textW); ctx.fillText(line2, x + 32, top + size + 8); }
      ctx.fillStyle = EX.mint; fitFont(ctx, wh.sub, 400, 20, PLEX, textW); ctx.fillText(wh.sub, x + 32, top + (line2 ? 74 : 40));
    }
    wh.draw(x, y, w);
  }
}

// ---- little illustrations for the export's fun tiles ----
function drawProgress(ctx, x, y, w, frac) {
  const bx = x + 32, by = y + 124, bw = w - 64, bh = 18;
  ctx.fillStyle = 'rgba(255,255,255,.18)'; roundRect(ctx, bx, by, bw, bh, 9); ctx.fill();
  const fw = Math.max(bh, bw * frac);
  ctx.fillStyle = EX.leaf; roundRect(ctx, bx, by, fw, bh, 9); ctx.fill();
  // little flag at the finish line
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(bx + bw - 4, by - 2); ctx.lineTo(bx + bw - 4, by - 30); ctx.stroke();
  ctx.fillStyle = '#F6C55B';
  ctx.beginPath(); ctx.moveTo(bx + bw - 4, by - 30); ctx.lineTo(bx + bw + 14, by - 24); ctx.lineTo(bx + bw - 4, by - 18); ctx.closePath(); ctx.fill();
}
function drawSprout(ctx, cx, cy) {
  // pot
  ctx.fillStyle = '#E08A2E';
  ctx.beginPath(); ctx.moveTo(cx - 30, cy + 4); ctx.lineTo(cx + 30, cy + 4); ctx.lineTo(cx + 22, cy + 46); ctx.lineTo(cx - 22, cy + 46); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#C9741C'; roundRect(ctx, cx - 34, cy - 4, 68, 12, 4); ctx.fill();
  // stem
  ctx.strokeStyle = EX.leaf; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, cy - 4); ctx.quadraticCurveTo(cx - 4, cy - 30, cx + 2, cy - 52); ctx.stroke();
  // leaves
  const leaf = (lx, ly, rot, len) => {
    ctx.save(); ctx.translate(lx, ly); ctx.rotate(rot);
    ctx.fillStyle = EX.leaf;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len / 2, -len / 2.6, len, 0); ctx.quadraticCurveTo(len / 2, len / 2.6, 0, 0); ctx.fill();
    ctx.restore();
  };
  leaf(cx, cy - 30, -2.6, 30);
  leaf(cx + 1, cy - 40, -0.5, 34);
  leaf(cx + 2, cy - 52, -1.6, 22);
}
function drawSun(ctx, cx, cy) {
  // sun
  ctx.fillStyle = '#F6C55B';
  ctx.beginPath(); ctx.arc(cx, cy - 10, 20, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#F6C55B'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  for (let k = 0; k < 8; k++) {
    const a = (Math.PI * 2 * k) / 8;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 28, cy - 10 + Math.sin(a) * 28);
    ctx.lineTo(cx + Math.cos(a) * 38, cy - 10 + Math.sin(a) * 38);
    ctx.stroke();
  }
  // waves
  ctx.strokeStyle = EX.mint; ctx.lineWidth = 3.5;
  for (const [dy, off] of [[34, 0], [48, 10]]) {
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const sx = cx - 44 + off + k * 26;
      ctx.moveTo(sx, cy + dy); ctx.quadraticCurveTo(sx + 6.5, cy + dy - 7, sx + 13, cy + dy); ctx.quadraticCurveTo(sx + 19.5, cy + dy + 7, sx + 26, cy + dy);
    }
    ctx.stroke();
  }
}

function initExport() {
  const modal = $('#export-modal'), img = $('#export-img');
  let blob = null, url = null;
  const fileName = () => `${(firstName || 'my').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-fire-plan.png`;
  const close = () => { modal.hidden = true; document.body.classList.remove('modal-open'); };
  $('#export').addEventListener('click', async () => {
    if (!last?.ok || !last.hasPortfolio) { $('#form').scrollIntoView({ behavior: 'smooth' }); return; }
    blob = await renderPlanImage();
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(blob);
    img.src = url; img.alt = t('exportModalTitle');
    const file = new File([blob], fileName(), { type: 'image/png' });
    $('#export-share').hidden = !(navigator.canShare && navigator.canShare({ files: [file] }));
    modal.hidden = false; document.body.classList.add('modal-open');
    $('#export-download').focus();
  });
  $('#export-download').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = url; a.download = fileName(); document.body.appendChild(a); a.click(); a.remove();
  });
  $('#export-share').addEventListener('click', async () => {
    try { await navigator.share({ files: [new File([blob], fileName(), { type: 'image/png' })] }); } catch { /* cancelled */ }
  });
  $('#export-close').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
}

// ---------- Chart ----------
function niceStep(max, target = 4) {
  const rough = max / target;
  const p = Math.pow(10, Math.floor(Math.log10(rough)));
  const f = rough / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}

function drawChart(r) {
  const svg = $('#chart');
  const W = Math.max(300, svg.parentElement.clientWidth);
  const H = Math.round(Math.min(360, Math.max(240, W * 0.5)));
  const M = { l: W < 480 ? 46 : 58, r: 14, t: 18, b: 34 };
  const iw = W - M.l - M.r, ih = H - M.t - M.b;

  const fireM = r.fireM;
  let endM = fireM !== null ? Math.max(fireM + 60, r.N) : r.N + 120;
  endM = Math.max(60, Math.min(endM, r.maxM));
  const bal = r.balance.slice(0, endM + 1);

  const maxBal = Math.max(...bal);
  const yMaxRaw = Math.max(r.fire * 1.15, Math.min(maxBal, r.fire * 2.5));
  const step = niceStep(yMaxRaw);
  const yMax = Math.ceil(yMaxRaw / step) * step;

  const x = (m) => M.l + (m / endM) * iw;
  const y = (v) => M.t + ih - (Math.max(0, v) / yMax) * ih;

  const years = endM / 12;
  const xStepY = years > 50 ? 10 : years > 20 ? 5 : years > 8 ? 2 : 1;
  const firstAge = Math.ceil(E.age / xStepY) * xStepY;

  let s = `<defs>
    <linearGradient id="balFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#005E51" stop-opacity=".18"/><stop offset="1" stop-color="#005E51" stop-opacity="0"/></linearGradient>
    <clipPath id="plot"><rect x="${M.l}" y="${M.t - 4}" width="${iw + 4}" height="${ih + 4}"/></clipPath></defs>`;

  for (let v = 0; v <= yMax + 1; v += step) {
    s += `<line class="grid" x1="${M.l}" x2="${M.l + iw}" y1="${y(v)}" y2="${y(v)}"/>`;
    s += `<text x="${M.l - 8}" y="${y(v) + 4}" text-anchor="end">${money(v, true)}</text>`;
  }
  for (let a = firstAge; a <= E.age + years + 1e-9; a += xStepY) {
    s += `<text x="${x((a - E.age) * 12)}" y="${H - 10}" text-anchor="middle">${a}</text>`;
  }

  const pts = bal.map((v, m) => `${x(m).toFixed(1)},${y(v).toFixed(1)}`);
  s += `<g clip-path="url(#plot)">`;
  s += `<path class="area" d="M${x(0)},${y(0)} L${pts.join(' L')} L${x(bal.length - 1)},${y(0)} Z"/>`;
  const coastEnd = Math.min(r.N, endM);
  const cpts = [];
  for (let m = 0; m <= coastEnd; m += 3) cpts.push(`${x(m).toFixed(1)},${y(r.coastTarget(m)).toFixed(1)}`);
  cpts.push(`${x(coastEnd).toFixed(1)},${y(r.coastTarget(coastEnd)).toFixed(1)}`);
  s += `<path class="coast" d="M${cpts.join(' L')}"/>`;
  s += `<line class="fire" x1="${M.l}" x2="${M.l + iw}" y1="${y(r.fire)}" y2="${y(r.fire)}"/>`;
  s += `<path class="bal" d="M${pts.join(' L')}"/>`;
  s += `</g>`;

  r.milestones.forEach((ms) => {
    if (ms.reached && !ms.past && ms.months <= endM) {
      s += `<circle cx="${x(ms.months)}" cy="${y(bal[ms.months])}" r="4" fill="#fff" stroke="#005E51" stroke-width="2"/>`;
    }
  });

  const label = (m, v, text, color, above = true) => {
    const cx = x(m), cy = y(v);
    const anchor = cx > M.l + iw - 60 ? 'end' : cx < M.l + 60 ? 'start' : 'middle';
    return `<circle class="marker" cx="${cx}" cy="${cy}" r="6.5" fill="${color}"/>
      <text class="mk-label" x="${cx}" y="${above ? cy - 13 : cy + 22}" text-anchor="${anchor}">${text}</text>`;
  };
  if (r.coast.reached && !r.coast.past && r.coastM <= endM) {
    s += label(r.coastM, bal[r.coastM], t('chartMarkerCoast', { age: ageAt(r.coastM) }), '#E08A2E', false);
  }
  if (fireM !== null && fireM > 0 && fireM <= endM) {
    s += label(fireM, bal[fireM], t('chartMarkerFire', { age: ageAt(fireM) }), '#2BA36B', true);
  }

  s += `<line class="cursor" id="cur" x1="0" x2="0" y1="${M.t}" y2="${M.t + ih}" visibility="hidden"/>
        <circle id="curdot" r="5" fill="#005E51" stroke="#fff" stroke-width="2" visibility="hidden"/>
        <rect id="hit" x="${M.l}" y="${M.t}" width="${iw}" height="${ih}" fill="transparent"/>`;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.innerHTML = s;

  const tip = $('#tip'), cur = $('#cur'), dot = $('#curdot');
  const infM = Math.pow(1 + E.inf / 100, 1 / 12);
  const move = (ev) => {
    const box = svg.getBoundingClientRect();
    const px = ((ev.clientX - box.left) / box.width) * W;
    const m = Math.round(Math.min(endM, Math.max(0, ((px - M.l) / iw) * endM)));
    const v = bal[m];
    cur.setAttribute('x1', x(m)); cur.setAttribute('x2', x(m)); cur.setAttribute('visibility', 'visible');
    dot.setAttribute('cx', x(m)); dot.setAttribute('cy', y(v)); dot.setAttribute('visibility', 'visible');
    const coastLine = m <= r.N ? `<br>${t('tooltipCoast', { amount: money(r.coastTarget(m)) })}` : '';
    tip.innerHTML = `<b>${t('tooltipTitle', { age: ageAt(m), year: yearAt(m) })}</b>`
      + `<br>${t('tooltipPortfolio', { amount: money(v) })}`
      + `<br>${t('tooltipAccount', { amount: money(v * Math.pow(infM, m)) })}${coastLine}`;
    tip.hidden = false;
    tip.style.left = `clamp(80px, ${(x(m) / W) * 100}%, calc(100% - 80px))`;
    tip.style.top = `${(y(v) / H) * 100}%`;
  };
  const hide = () => { tip.hidden = true; cur.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden'); };
  const hit = $('#hit');
  hit.addEventListener('pointermove', move);
  hit.addEventListener('pointerdown', move);
  hit.addEventListener('pointerleave', hide);
}

applyStaticCopy();
initInfo();
initInputs();
bind();
update();

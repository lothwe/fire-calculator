// FIRE & Coast FIRE calculation engine.
// Pure functions only: no DOM access. All money values are in TODAY'S money
// (real terms) unless the field name says "nominal" or "future".

export const MILESTONES = [10000, 100000, 500000, 1000000];
export const WITHDRAWAL_RATES = [3, 3.25, 3.5, 3.75, 4];
export const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];

export const DEFAULTS = {
  currency: 'EUR',
  spend: 2500,
  per: 'm',      // 'm' monthly | 'y' yearly
  wr: 4,         // withdrawal rate, %
  age: 30,
  ret: 67,       // retirement age (when you'd stop working anyway)
  pv: 25000,     // invested today
  c: 1000,       // monthly contribution (today's money)
  goal: 'fire',  // 'fire' | 'coast'
  by: NaN,       // target FIRE age: empty = use the projected FIRE age
  g: 8,          // market growth, nominal %/yr
  inf: 2.7,      // inflation %/yr
};

const MAX_AGE = 100;
const MIN_AGE = 18;

const isNum = (x) => typeof x === 'number' && Number.isFinite(x);

/** Field-level validation. Returns { errors, requiredOk }.
 *  Errors are keys into COPY (js/copy.js), so the wording lives there. */
export function validate(inp) {
  const e = {};
  if (!isNum(inp.spend) || inp.spend <= 0) e.spend = 'errSpend';
  if (!WITHDRAWAL_RATES.includes(inp.wr)) e.wr = 'errWr';
  if (!isNum(inp.age) || inp.age < MIN_AGE || inp.age > 80) e.age = 'errAge';
  if (!isNum(inp.ret) || inp.ret > 80) e.ret = 'errRetMax';
  else if (isNum(inp.age) && inp.ret <= inp.age) e.ret = 'errRetBelowAge';
  if (!isNum(inp.g) || inp.g < 0 || inp.g > 15) e.g = 'errGrowth';
  if (!isNum(inp.inf) || inp.inf < 0 || inp.inf > 10) e.inf = 'errInflation';
  const requiredOk = !e.spend && !e.wr && !e.age && !e.ret && !e.g && !e.inf;
  if (isNum(inp.pv) && inp.pv < 0) e.pv = 'errNegative';
  if (isNum(inp.c) && inp.c < 0) e.c = 'errNegative';
  if (isNum(inp.by) && isNum(inp.age) && inp.by <= inp.age) e.by = 'errByBelowAge';
  else if (isNum(inp.by) && inp.by > MAX_AGE) e.by = 'errByMax';
  return { errors: e, requiredOk };
}

export function calculate(inp) {
  const { errors, requiredOk } = validate(inp);
  if (!requiredOk) return { ok: false, errors };

  const annualSpend = inp.per === 'y' ? inp.spend : inp.spend * 12;
  const monthlySpend = annualSpend / 12;
  const w = inp.wr / 100;
  const fire = annualSpend / w;

  const realReturn = (1 + inp.g / 100) / (1 + inp.inf / 100) - 1;
  const i = Math.pow(1 + realReturn, 1 / 12) - 1;          // monthly real
  const im = Math.pow(1 + inp.inf / 100, 1 / 12) - 1;      // monthly inflation
  const zeroI = Math.abs(i) < 1e-12;

  const N = Math.round((inp.ret - inp.age) * 12);          // months to retirement age
  const maxM = Math.round((MAX_AGE - inp.age) * 12);
  const coastTarget = (m) => fire / Math.pow(1 + i, Math.max(N - m, 0));

  const result = {
    ok: true,
    errors,
    fire,
    annualSpend,
    monthlySpend,
    realReturn,
    coastToday: coastTarget(0),
    fireByRate: Object.fromEntries(WITHDRAWAL_RATES.map((r) => [r, annualSpend / (r / 100)])),
    warnings: [],
    N,
  };
  if (realReturn < 0) result.warnings.push('negativeReal');

  // Projections need "invested today" (0 counts).
  const hasPortfolio = isNum(inp.pv) && inp.pv >= 0;
  result.hasPortfolio = hasPortfolio;
  if (!hasPortfolio) return result;

  const pv = inp.pv;
  const c = isNum(inp.c) && inp.c >= 0 ? inp.c : 0;
  const nominalAt = (p, m) => p * Math.pow(1 + im, m);

  // ---- Forward projection (monthly) ----
  const balance = [];
  let p = pv, coastM = null, fireM = null;
  const msM = {};
  for (let m = 0; m <= maxM; m++) {
    balance.push(p);
    if (coastM === null && m <= N && p >= coastTarget(m)) coastM = m;
    if (fireM === null && p >= fire) fireM = m;
    for (const t of MILESTONES) if (msM[t] === undefined && nominalAt(p, m) >= t) msM[t] = m;
    p = p * (1 + i) + c;
  }

  // ---- Backwards estimate for anything already reached today ----
  const minK = Math.round((inp.age - MIN_AGE) * 12);
  const backcast = (cond) => {
    let q = pv, k = 0;
    while (k < minK) {
      const prev = (q - c) / (1 + i);
      if (prev < 0 || !cond(prev, -(k + 1))) break;
      q = prev; k++;
    }
    return { months: -k, hitLimit: k >= minK };
  };
  const event = (m, cond, invariantWhenNoContrib = false) => {
    if (m === null) return { reached: false };
    if (m > 0) return { reached: true, past: false, months: m };
    // already reached today
    if ((c === 0 && invariantWhenNoContrib) || (c === 0 && zeroI)) {
      return { reached: true, past: true, months: 0, estimable: false };
    }
    const b = backcast(cond);
    if (b.hitLimit) return { reached: true, past: true, months: 0, estimable: false };
    return { reached: true, past: true, months: b.months, estimable: true };
  };

  // Coast FIRE: with no contributions the portfolio/target ratio is constant
  // going backwards, so a date would be meaningless.
  result.coast = event(coastM, (q, m) => q >= coastTarget(m), true);
  if (!result.coast.reached && fireM !== null) result.coast.afterRetirement = true;
  result.fireEvent = event(fireM, (q) => q >= fire);
  result.milestones = MILESTONES.map((t) => ({
    threshold: t,
    ...event(msM[t] === undefined ? null : msM[t], (q, m) => nominalAt(q, m) >= t),
  }));

  // FIRE number in future money, at the moment it's reached
  if (fireM !== null && fireM > 0) {
    const f = Math.pow(1 + inp.inf / 100, fireM / 12);
    result.fireFuture = fire * f;
    result.monthlySpendFuture = monthlySpend * f;
  }

  // ---- Required monthly contribution for the selected goal ----
  result.required = requiredContribution({ inp, pv, c, i, zeroI, fire, coastTarget });

  // ---- Year-by-year table: rows until FIRE is reached, or until retirement age ----
  result.yearly = yearlyRows({ balance, c, im, coastM, fireM, msM, N, maxM });

  result.balance = balance;
  result.coastTarget = coastTarget;
  result.fireM = fireM;
  result.coastM = coastM;
  result.maxM = maxM;
  return result;
}

/**
 * One row per year. `real` = today's money, `nominal` = account balance incl. inflation.
 * Each view satisfies: start + added + growth = end, and end = next row's start.
 * `events` lists what happens during that year: 'coast', 'fire', or a milestone amount.
 */
function yearlyRows({ balance, c, im, coastM, fireM, msM, N, maxM }) {
  const lastM = Math.min(maxM, fireM !== null && fireM > 0 ? fireM : N);
  const years = Math.max(1, Math.ceil(lastM / 12));
  const f = (m) => Math.pow(1 + im, m);
  const inYear = (m, y) => m !== null && m !== undefined && m > 12 * (y - 1) && m <= 12 * y;
  const rows = [];
  for (let y = 1; y <= years && 12 * y < balance.length; y++) {
    const m0 = 12 * (y - 1), m1 = 12 * y;
    const start = balance[m0], end = balance[m1], added = 12 * c;
    let addedNom = 0;
    for (let k = m0 + 1; k <= m1; k++) addedNom += c * f(k);
    const startNom = start * f(m0), endNom = end * f(m1);
    const events = [];
    if (inYear(coastM, y)) events.push('coast');
    if (inYear(fireM, y)) events.push('fire');
    for (const t of MILESTONES) if (inYear(msM[t], y)) events.push(t);
    rows.push({
      year: y,
      endMonth: m1,
      real: { start, added, growth: end - start - added, end },
      nominal: { start: startNom, added: addedNom, growth: endNom - startNom - addedNom, end: endNom },
      events,
    });
  }
  return rows;
}

function requiredContribution({ inp, pv, c, i, zeroI, fire, coastTarget }) {
  const goal = inp.goal === 'coast' ? 'coast' : 'fire';
  if (!isNum(inp.by) || inp.by <= inp.age || inp.by > MAX_AGE) return { goal, status: 'invalidAge' };
  if (goal === 'coast' && inp.by >= inp.ret) return { goal, status: 'coastAfterRetirement' };
  const n = Math.round((inp.by - inp.age) * 12);
  const target = goal === 'fire' ? fire : coastTarget(n);
  let amount;
  if (zeroI) amount = (target - pv) / n;
  else {
    const growth = Math.pow(1 + i, n);
    amount = ((target - pv * growth) * i) / (growth - 1);
  }
  if (amount <= 0) return { goal, status: 'onTrack', target, n };
  return { goal, status: 'needed', amount, gap: amount - c, target, n };
}

/** Parse "1,000", "1000.50", " 2.7 " → number, or NaN. */
export function parseNumber(s) {
  if (typeof s === 'number') return s;
  if (s === null || s === undefined) return NaN;
  const cleaned = String(s).replace(/[,\s€$£%]/g, '').replace(/^CHF/i, '');
  if (cleaned === '') return NaN;
  return Number(cleaned);
}

// Reference test cases from spec v03. Run: node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate, DEFAULTS, parseNumber } from '../js/calc.js';

const run = (over) => calculate({ ...DEFAULTS, ...over });
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: got ${a}, expected ${b}`);

test('TC1: demo defaults', () => {
  const r = run({ by: 50 });
  near(r.fire, 750000, 1, 'FIRE number');
  near(r.coastToday, 116544, 1, 'Coast today');
  assert.equal(r.coast.months, 116);
  assert.equal(r.fireEvent.months, 316);
  near(r.required.amount, 1650, 1, 'required for FIRE by 50');
  near(r.required.gap, 650, 1, 'gap');
  near(r.fireFuture, 1512689, 2, 'FIRE in future money');
  near(r.monthlySpendFuture, 5042, 1, 'future spending');
  const ms = r.milestones.map((x) => x.months);
  assert.equal(r.milestones[0].past, true);
  near(30 + ms[1] / 12, 34.4, 0.05, '100k age');
  near(30 + ms[2] / 12, 45.4, 0.05, '500k age');
  near(30 + ms[3] / 12, 52.0, 0.05, '1M age');
});

test('TC2: conservative 3.5% rate, 800/month', () => {
  const r = run({ wr: 3.5, c: 800 });
  near(r.fire, 857143, 1, 'FIRE number');
  near(30 + r.coast.months / 12, 46.8, 0.05, 'Coast age');
  near(30 + r.fireEvent.months / 12, 61.5, 0.05, 'FIRE age');
});

test('TC3: Coast FIRE by 40', () => {
  const r = run({ goal: 'coast', by: 40, c: 800 });
  near(r.required.amount, 973, 1, 'required for Coast by 40');
});

test('TC4: retroactive Coast FIRE', () => {
  const r = run({ age: 40, pv: 250000, c: 800 });
  near(r.coastToday, 192762, 1, 'Coast today');
  assert.equal(r.coast.past, true);
  assert.equal(r.coast.estimable, true);
  near(40 + r.coast.months / 12, 34.8, 0.05, 'Coast reached age');
  near(40 + r.fireEvent.months / 12, 55.1, 0.05, 'FIRE age');
});

test('TC5: retroactive, no contribution → no date', () => {
  const r = run({ age: 40, pv: 250000, c: 0 });
  assert.equal(r.coast.past, true);
  assert.equal(r.coast.estimable, false);
  near(40 + r.fireEvent.months / 12, 61.8, 0.05, 'FIRE age');
});

test('edge: zero real return does not divide by zero', () => {
  const r = run({ g: 2.7, inf: 2.7, by: 50 });
  assert.ok(Number.isFinite(r.required.amount));
  assert.ok(r.fireEvent.reached);
});

test('edge: never reaches FIRE', () => {
  const r = run({ pv: 0, c: 0 });
  assert.equal(r.fireEvent.reached, false);
  assert.equal(r.coast.reached, false);
});

test('edge: already FIRE shows on-track', () => {
  const r = run({ pv: 2000000, by: 50 });
  assert.equal(r.fireEvent.past, true);
  assert.equal(r.required.status, 'onTrack');
  assert.equal(r.fireFuture, undefined);
});

test('edge: Coast goal at/after retirement age', () => {
  assert.equal(run({ goal: 'coast', by: 67 }).required.status, 'coastAfterRetirement');
});

test('validation: required fields', () => {
  assert.equal(run({ spend: NaN }).ok, false);
  assert.equal(run({ ret: 30 }).ok, false);
  assert.equal(run({ age: 15 }).ok, false);
});

test('yearly spending equals monthly ×12', () => {
  assert.equal(run({ per: 'y', spend: 30000 }).fire, run({}).fire);
});

test('yearly table: rows chain, add up, and end at FIRE', () => {
  const r = run({});
  const rows = r.yearly;
  assert.equal(rows.length, Math.ceil(316 / 12));            // FIRE in month 316 → 27 rows
  for (const view of ['real', 'nominal']) {
    rows.forEach((row, k) => {
      const v = row[view];
      near(v.start + v.added + v.growth, v.end, 1e-6, `${view} row ${k} adds up`);
      if (k > 0) near(rows[k - 1][view].end, v.start, 1e-6, `${view} row ${k} chains`);
    });
  }
  near(rows[0].real.start, 25000, 1e-9, 'starts at invested today');
  near(rows[0].real.added, 12000, 1e-9, '12 × contribution');
  near(rows[9].real.end, r.balance[120], 1e-9, 'matches projection');
  assert.ok(rows.at(-1).events.includes('fire'));
  assert.ok(rows.find((x) => x.events.includes('coast')).year === Math.ceil(116 / 12));
  assert.ok(rows.some((x) => x.events.includes(100000)));
});

test('yearly table: FIRE never reached → runs to retirement age', () => {
  const r = run({ pv: 0, c: 0 });
  assert.equal(r.fireEvent.reached, false);
  assert.equal(r.yearly.length, 37);
});

test('yearly table: FIRE after retirement age → runs to FIRE', () => {
  const r = run({ pv: 0, c: 100 });
  assert.ok(r.fireM > r.N);
  assert.equal(r.yearly.length, Math.ceil(r.fireM / 12));
});

test('target FIRE age empty by default → no required amount', () => {
  assert.equal(run({}).required.status, 'invalidAge');
});

test('parseNumber', () => {
  assert.equal(parseNumber('1,000'), 1000);
  assert.equal(parseNumber('1000.50'), 1000.5);
  assert.ok(Number.isNaN(parseNumber('')));
});

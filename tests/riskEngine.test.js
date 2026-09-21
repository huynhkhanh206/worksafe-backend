const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculateHeatIndexC,
  mapToRiskLevel,
  computeSnapshot,
  DEFAULT_THRESHOLDS,
} = require('../src/services/riskEngine');

test('calculateHeatIndexC gan bang nhiet do that khi troi mat', () => {
  const hi = calculateHeatIndexC(24, 50);
  assert.ok(hi < 27, `expected < 27, got ${hi}`);
});

test('calculateHeatIndexC cao hon nhiet do that khi nong + am uot', () => {
  const hi = calculateHeatIndexC(35, 70);
  assert.ok(hi > 40, `expected > 40, got ${hi}`);
});

test('calculateHeatIndexC khop tham chieu NWS (100F/55% ~ 124F)', () => {
  const hiC = calculateHeatIndexC(37.8, 55);
  const hiF = (hiC * 9) / 5 + 32;
  assert.ok(Math.abs(hiF - 124) < 2, `expected ~124F, got ${hiF.toFixed(1)}F`);
});

test('mapToRiskLevel anh xa dung 4 muc voi nguong mac dinh', () => {
  assert.equal(mapToRiskLevel(20, DEFAULT_THRESHOLDS), 'low');
  assert.equal(mapToRiskLevel(29, DEFAULT_THRESHOLDS), 'medium');
  assert.equal(mapToRiskLevel(35, DEFAULT_THRESHOLDS), 'high');
  assert.equal(mapToRiskLevel(42, DEFAULT_THRESHOLDS), 'danger');
});

test('computeSnapshot tra ve dung shape JSON ma frontend can', () => {
  const snapshot = computeSnapshot({
    current: { temperature: 36, humidity: 68 },
    hourly: [
      { hour: '10:00', temperature: 32, humidity: 60 },
      { hour: '12:00', temperature: 36, humidity: 68 },
      { hour: '18:00', temperature: 30, humidity: 55 },
    ],
    profile: { jobType: 'delivery', workStart: '07:00', workEnd: '19:00' },
    thresholds: DEFAULT_THRESHOLDS,
  });

  assert.ok(['low', 'medium', 'high', 'danger'].includes(snapshot.riskLevel));
  assert.equal(typeof snapshot.temperature, 'number');
  assert.equal(typeof snapshot.humidity, 'number');
  assert.equal(typeof snapshot.recommendation, 'string');
  assert.ok(Array.isArray(snapshot.hourlyForecast));
  assert.equal(snapshot.hourlyForecast.length, 3);

  for (const h of snapshot.hourlyForecast) {
    assert.equal(typeof h.hour, 'string');
    assert.ok(['low', 'medium', 'high', 'danger'].includes(h.riskLevel));
    assert.equal(typeof h.temperature, 'number');
    assert.equal(typeof h.recommended, 'boolean');
  }

  assert.ok(new Date(snapshot.lastUpdated).toString() !== 'Invalid Date');
});

test('computeSnapshot chi danh dau recommended trong khoang gio lam viec', () => {
  const snapshot = computeSnapshot({
    current: { temperature: 30, humidity: 60 },
    hourly: [
      { hour: '05:00', temperature: 24, humidity: 70 }, // mat nhat nhung ngoai gio lam
      { hour: '10:00', temperature: 30, humidity: 60 },
      { hour: '13:00', temperature: 38, humidity: 65 },
    ],
    profile: { jobType: 'construction', workStart: '08:00', workEnd: '17:00' },
    thresholds: DEFAULT_THRESHOLDS,
  });

  const recommended = snapshot.hourlyForecast.filter((h) => h.recommended).map((h) => h.hour);
  assert.ok(!recommended.includes('05:00'), 'khong duoc chon gio ngoai khung lam viec');
});

test('computeSnapshot khong crash khi khong co profile', () => {
  const snapshot = computeSnapshot({
    current: { temperature: 33, humidity: 60 },
    hourly: [{ hour: '12:00', temperature: 33, humidity: 60 }],
    profile: null,
    thresholds: DEFAULT_THRESHOLDS,
  });

  assert.equal(snapshot.hourlyForecast[0].recommended, false);
});

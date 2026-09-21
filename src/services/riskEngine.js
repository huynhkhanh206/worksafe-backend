// Risk Engine - module thuan logic, KHONG phu thuoc DB/HTTP, de test doc lap.
// Dau vao: nhiet do (C) + do am (%). Dau ra: 1 trong 4 muc low/medium/high/danger.

function celsiusToFahrenheit(c) {
  return (c * 9) / 5 + 32;
}

function fahrenheitToCelsius(f) {
  return ((f - 32) * 5) / 9;
}

function roundTo1(n) {
  return Math.round(n * 10) / 10;
}

// Cong thuc Heat Index chuan cua NWS (Rothfusz regression), co ap dung
// hieu chinh cho do am rat thap/rat cao, va dung cong thuc don gian hon
// khi Heat Index uoc tinh duoi 80F (khong can do chinh xac cua Rothfusz).
function calculateHeatIndexC(tempC, humidityPercent) {
  const T = celsiusToFahrenheit(tempC);
  const R = humidityPercent;

  const simpleHI = 0.5 * (T + 61 + (T - 68) * 1.2 + R * 0.094);

  if ((simpleHI + T) / 2 < 80) {
    return roundTo1(fahrenheitToCelsius(simpleHI));
  }

  let HI =
    -42.379 +
    2.04901523 * T +
    10.14333127 * R -
    0.22475541 * T * R -
    0.00683783 * T * T -
    0.05481717 * R * R +
    0.00122874 * T * T * R +
    0.00085282 * T * R * R -
    0.00000199 * T * T * R * R;

  if (R < 13 && T >= 80 && T <= 112) {
    HI -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17);
  } else if (R > 85 && T >= 80 && T <= 87) {
    HI += ((R - 85) / 10) * ((87 - T) / 5);
  }

  return roundTo1(fahrenheitToCelsius(HI));
}

// Nguong mac dinh (do C) - dung khi DB chua co du lieu risk_thresholds,
// hoac khi khong doc duoc DB. Gia tri that nen duoc xac nhan boi nguoi
// phu trach Risk Engine va nap vao bang risk_thresholds.
const DEFAULT_THRESHOLDS = [
  { risk_level: 'low', min_heat_index: -Infinity, max_heat_index: 27 },
  { risk_level: 'medium', min_heat_index: 27, max_heat_index: 32 },
  { risk_level: 'high', min_heat_index: 32, max_heat_index: 39 },
  { risk_level: 'danger', min_heat_index: 39, max_heat_index: Infinity },
];

function mapToRiskLevel(heatIndexC, thresholds) {
  const list = thresholds && thresholds.length ? thresholds : DEFAULT_THRESHOLDS;
  const match = list.find((t) => heatIndexC >= t.min_heat_index && heatIndexC < t.max_heat_index);
  return match ? match.risk_level : 'danger';
}

const RECOMMENDATION_BY_LEVEL = {
  low: 'An toàn để làm việc bình thường.',
  medium: 'Nên theo dõi, uống đủ nước.',
  high: 'Cân nhắc giảm cường độ, nghỉ giữa ca.',
  danger: 'Nên tạm dừng, tìm nơi tránh nóng.',
};

function isWithinWindow(hourStr, workStart, workEnd) {
  return hourStr >= workStart && hourStr <= workEnd;
}

// Danh dau 1-2 khung gio co heat index thap nhat trong khoang gio lam
// viec da khai bao la "recommended" (dung de FE highlight trong Hourly
// Timeline). Neu khong co profile, khong danh dau khung gio nao.
function markRecommendedHours(hourlyWithRisk, profile) {
  if (!profile || !profile.workStart || !profile.workEnd) {
    return hourlyWithRisk.map((h) => ({ ...h, recommended: false }));
  }

  const within = hourlyWithRisk.filter((h) => isWithinWindow(h.hour, profile.workStart, profile.workEnd));
  const pool = within.length > 0 ? within : hourlyWithRisk;
  const sorted = [...pool].sort((a, b) => a.heatIndex - b.heatIndex);
  const recommendedHours = new Set(sorted.slice(0, 2).map((h) => h.hour));

  return hourlyWithRisk.map((h) => ({ ...h, recommended: recommendedHours.has(h.hour) }));
}

function buildRecommendation(currentLevel, markedHourly) {
  const base = RECOMMENDATION_BY_LEVEL[currentLevel] || RECOMMENDATION_BY_LEVEL.danger;

  if (currentLevel === 'high' || currentLevel === 'danger') {
    const recommendedHours = markedHourly.filter((h) => h.recommended).map((h) => h.hour);
    if (recommendedHours.length > 0) {
      return `${base} Thời điểm phù hợp hơn để làm việc: ${recommendedHours.join(', ')}.`;
    }
  }

  return base;
}

// current: { temperature, humidity }
// hourly: [{ hour: 'HH:mm', temperature, humidity }]
// profile: { jobType, workStart: 'HH:mm', workEnd: 'HH:mm' } | null
// thresholds: ket qua tu risk_thresholds (hoac DEFAULT_THRESHOLDS)
function computeSnapshot({ current, hourly, profile, thresholds }) {
  const currentHeatIndex = calculateHeatIndexC(current.temperature, current.humidity);
  const currentLevel = mapToRiskLevel(currentHeatIndex, thresholds);

  const hourlyWithRisk = (hourly || []).map((h) => {
    const heatIndex = calculateHeatIndexC(h.temperature, h.humidity);
    return {
      hour: h.hour,
      temperature: h.temperature,
      heatIndex,
      riskLevel: mapToRiskLevel(heatIndex, thresholds),
    };
  });

  const marked = markRecommendedHours(hourlyWithRisk, profile);
  const recommendation = buildRecommendation(currentLevel, marked);

  return {
    riskLevel: currentLevel,
    temperature: current.temperature,
    humidity: current.humidity,
    recommendation,
    hourlyForecast: marked.map(({ hour, riskLevel, temperature, recommended }) => ({
      hour,
      riskLevel,
      temperature,
      recommended,
    })),
    lastUpdated: new Date().toISOString(),
  };
}

module.exports = {
  calculateHeatIndexC,
  mapToRiskLevel,
  computeSnapshot,
  DEFAULT_THRESHOLDS,
};

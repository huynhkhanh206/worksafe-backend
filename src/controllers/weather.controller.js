const pool = require('../config/db');
const { ok, fail } = require('../utils/response');
const { fetchFromOpenWeatherMap } = require('../services/weatherProvider');
const weatherCache = require('../services/weatherCache');
const { loadThresholds } = require('../services/thresholds');
const { computeSnapshot } = require('../services/riskEngine');

async function getCurrentWeather(req, res) {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lng ?? req.query.lon);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json(fail('INVALID_COORDS', 'Thiếu hoặc sai lat/lng.'));
  }

  const { rows } = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.userId]);
  const profileRow = rows[0] || null;
  const profile = profileRow
    ? {
        jobType: profileRow.job_type,
        workStart: String(profileRow.work_start).slice(0, 5),
        workEnd: String(profileRow.work_end).slice(0, 5),
      }
    : null;

  let raw = await weatherCache.getCached(lat, lon);
  let stale = false;

  if (!raw) {
    try {
      raw = await fetchFromOpenWeatherMap(lat, lon);
      await weatherCache.setCache(lat, lon, raw);
    } catch (err) {
      const fallback = await weatherCache.getCached(lat, lon, { ignoreExpiry: true });
      if (!fallback) throw err;
      raw = fallback;
      stale = true;
    }
  }

  const thresholds = await loadThresholds(profile ? profile.jobType : null);
  const snapshot = computeSnapshot({ current: raw.current, hourly: raw.hourly, profile, thresholds });

  res.json(ok({ ...snapshot, stale }));
}

module.exports = { getCurrentWeather };

const pool = require('../config/db');

const CACHE_TTL_MINUTES = 20;

function roundCoord(value) {
  return Math.round(value * 100) / 100; // ~1.1km
}

async function getCached(lat, lon, { ignoreExpiry = false } = {}) {
  const latR = roundCoord(lat);
  const lonR = roundCoord(lon);

  const query = ignoreExpiry
    ? `SELECT raw_payload FROM weather_cache
       WHERE lat_rounded = $1 AND lng_rounded = $2
       ORDER BY fetched_at DESC LIMIT 1`
    : `SELECT raw_payload FROM weather_cache
       WHERE lat_rounded = $1 AND lng_rounded = $2 AND expires_at > now()
       ORDER BY fetched_at DESC LIMIT 1`;

  const { rows } = await pool.query(query, [latR, lonR]);
  return rows[0] ? rows[0].raw_payload : null;
}

async function setCache(lat, lon, payload) {
  const latR = roundCoord(lat);
  const lonR = roundCoord(lon);

  await pool.query(
    `INSERT INTO weather_cache (lat_rounded, lng_rounded, raw_payload, expires_at)
     VALUES ($1, $2, $3, now() + interval '${CACHE_TTL_MINUTES} minutes')`,
    [latR, lonR, JSON.stringify(payload)]
  );
}

module.exports = { getCached, setCache };

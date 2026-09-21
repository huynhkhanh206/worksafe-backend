const pool = require('../config/db');
const { ok, fail } = require('../utils/response');

const VALID_JOB_TYPES = ['delivery', 'rideHailing', 'construction', 'streetVendor', 'scrapCollector', 'other'];

function normalizeTime(t) {
  return t ? String(t).slice(0, 5) : t; // "07:00:00" -> "07:00"
}

function toApiShape(row) {
  return {
    jobType: row.job_type,
    area: row.area,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    workStart: normalizeTime(row.work_start),
    workEnd: normalizeTime(row.work_end),
  };
}

async function getProfile(req, res) {
  const { rows } = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [req.userId]);
  if (rows.length === 0) {
    return res.status(404).json(fail('PROFILE_NOT_FOUND', 'Chưa thiết lập hồ sơ.'));
  }
  res.json(ok(toApiShape(rows[0])));
}

async function upsertProfile(req, res) {
  const { jobType, area, latitude, longitude, workStart, workEnd } = req.body || {};

  if (!VALID_JOB_TYPES.includes(jobType)) {
    return res.status(400).json(fail('INVALID_JOB_TYPE', 'jobType không hợp lệ.'));
  }
  if (!area || !workStart || !workEnd) {
    return res.status(400).json(fail('MISSING_FIELDS', 'Thiếu area, workStart hoặc workEnd.'));
  }

  const { rows } = await pool.query(
    `INSERT INTO profiles (user_id, job_type, area, latitude, longitude, work_start, work_end)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id) DO UPDATE SET
       job_type = EXCLUDED.job_type,
       area = EXCLUDED.area,
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       work_start = EXCLUDED.work_start,
       work_end = EXCLUDED.work_end,
       updated_at = now()
     RETURNING *`,
    [req.userId, jobType, area, latitude ?? null, longitude ?? null, workStart, workEnd]
  );

  res.json(ok(toApiShape(rows[0])));
}

module.exports = { getProfile, upsertProfile, VALID_JOB_TYPES };

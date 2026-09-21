const pool = require('../config/db');
const { DEFAULT_THRESHOLDS } = require('./riskEngine');

// Doc nguong rui ro tu bang risk_thresholds (uu tien nguong rieng cho
// jobType, sau do fallback ve nguong chung job_type IS NULL). Neu DB
// chua co du lieu hoac loi ket noi, dung DEFAULT_THRESHOLDS de he thong
// van chay duoc.
async function loadThresholds(jobType) {
  try {
    const { rows } = await pool.query(
      `SELECT risk_level, min_heat_index, max_heat_index
       FROM risk_thresholds
       WHERE job_type = $1 OR job_type IS NULL
       ORDER BY job_type NULLS LAST, min_heat_index ASC NULLS FIRST`,
      [jobType || null]
    );

    if (rows.length === 0) return DEFAULT_THRESHOLDS;

    return rows.map((r) => ({
      risk_level: r.risk_level,
      min_heat_index: r.min_heat_index === null ? -Infinity : Number(r.min_heat_index),
      max_heat_index: r.max_heat_index === null ? Infinity : Number(r.max_heat_index),
    }));
  } catch (err) {
    console.warn('Không đọc được risk_thresholds từ DB, dùng ngưỡng mặc định:', err.message);
    return DEFAULT_THRESHOLDS;
  }
}

module.exports = { loadThresholds };

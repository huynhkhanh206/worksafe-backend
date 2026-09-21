require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');

  await pool.query(schema);

  const { rows } = await pool.query('SELECT COUNT(*) FROM risk_thresholds');
  if (Number(rows[0].count) === 0) {
    await pool.query(seed);
    console.log('Đã seed bảng risk_thresholds với ngưỡng mặc định.');
  }

  console.log('Migrate xong.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migrate lỗi:', err);
  process.exit(1);
});

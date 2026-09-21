CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone_or_email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  job_type VARCHAR(30) NOT NULL,
  area TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  work_start TIME NOT NULL,
  work_end TIME NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS risk_thresholds (
  id SERIAL PRIMARY KEY,
  job_type VARCHAR(30),
  risk_level VARCHAR(10) NOT NULL,
  min_heat_index NUMERIC,
  max_heat_index NUMERIC
);

CREATE TABLE IF NOT EXISTS weather_cache (
  id SERIAL PRIMARY KEY,
  lat_rounded NUMERIC NOT NULL,
  lng_rounded NUMERIC NOT NULL,
  raw_payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weather_cache_coords ON weather_cache (lat_rounded, lng_rounded, expires_at);

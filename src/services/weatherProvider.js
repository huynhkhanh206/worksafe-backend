// Tich hop OpenWeatherMap (goi API "2.5" mien phi - khong can gan the thanh toan,
// khac voi One Call 3.0 phai bat subscription rieng).

function padTime(n) {
  return String(n).padStart(2, '0');
}

// Quy doi timestamp UTC (giay) + offset mui gio (giay) ve chuoi "HH:mm" gio dia phuong,
// khong phu thuoc mui gio cua may chu.
function formatLocalHour(unixSeconds, tzOffsetSeconds) {
  const localMs = (unixSeconds + tzOffsetSeconds) * 1000;
  const d = new Date(localMs);
  return `${padTime(d.getUTCHours())}:${padTime(d.getUTCMinutes())}`;
}

async function fetchFromOpenWeatherMap(lat, lon) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    const err = new Error('Thiếu OPENWEATHER_API_KEY trong biến môi trường.');
    err.status = 500;
    err.code = 'MISSING_API_KEY';
    throw err;
  }

  const base = 'https://api.openweathermap.org/data/2.5';
  const [currentRes, forecastRes] = await Promise.all([
    fetch(`${base}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`),
    fetch(`${base}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`),
  ]);

  if (!currentRes.ok || !forecastRes.ok) {
    const err = new Error('Không lấy được dữ liệu từ OpenWeatherMap.');
    err.status = 502;
    err.code = 'WEATHER_PROVIDER_ERROR';
    throw err;
  }

  const currentJson = await currentRes.json();
  const forecastJson = await forecastRes.json();
  const tzOffsetSeconds = currentJson.timezone || 0;

  const current = {
    temperature: currentJson.main.temp,
    humidity: currentJson.main.humidity,
  };

  // Forecast API tra ve moi 3 gio; lay 8 muc dau (~24h) de khop voi
  // hourlyForecast ben Flutter.
  const hourly = (forecastJson.list || []).slice(0, 8).map((item) => ({
    hour: formatLocalHour(item.dt, tzOffsetSeconds),
    temperature: item.main.temp,
    humidity: item.main.humidity,
  }));

  return { current, hourly };
}

module.exports = { fetchFromOpenWeatherMap, formatLocalHour };

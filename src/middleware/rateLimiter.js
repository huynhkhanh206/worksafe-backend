const rateLimit = require('express-rate-limit');

const weatherLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Gọi API thời tiết quá nhanh, thử lại sau ít phút.' },
  },
});

module.exports = { weatherLimiter };

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const requireAuth = require('../middleware/auth');
const { weatherLimiter } = require('../middleware/rateLimiter');
const { getCurrentWeather } = require('../controllers/weather.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/current', weatherLimiter, asyncHandler(getCurrentWeather));

module.exports = router;

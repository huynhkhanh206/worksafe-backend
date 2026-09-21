const express = require('express');
const authRoutes = require('./auth.routes');
const profileRoutes = require('./profile.routes');
const weatherRoutes = require('./weather.routes');
const healthRoutes = require('./health.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/weather', weatherRoutes);
router.use('/health', healthRoutes);

module.exports = router;

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const requireAuth = require('../middleware/auth');
const { getProfile, upsertProfile } = require('../controllers/profile.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/', asyncHandler(getProfile));
router.put('/', asyncHandler(upsertProfile));

module.exports = router;

const express = require('express');
const { ok } = require('../utils/response');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(ok({ status: 'ok', time: new Date().toISOString() }));
});

module.exports = router;

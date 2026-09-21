const { fail } = require('../utils/response');

function notFoundHandler(req, res) {
  res.status(404).json(fail('NOT_FOUND', 'Không tìm thấy endpoint này.'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json(fail(err.code || 'INTERNAL_ERROR', err.message || 'Đã có lỗi xảy ra.'));
}

module.exports = { notFoundHandler, errorHandler };

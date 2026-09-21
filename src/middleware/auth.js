const { verifyToken } = require('../utils/jwt');
const { fail } = require('../utils/response');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json(fail('UNAUTHORIZED', 'Thiếu hoặc sai định dạng token xác thực.'));
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json(fail('INVALID_TOKEN', 'Token không hợp lệ hoặc đã hết hạn.'));
  }
}

module.exports = requireAuth;

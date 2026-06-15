const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.sub) throw new Error('Invalid token payload');
    req.userId = decoded.sub;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// Returns false and sends 403 if the authenticated user doesn't own the resource.
function assertOwner(req, res, paramName = 'userId') {
  const requestedId = parseInt(req.params[paramName], 10);
  if (req.userId !== requestedId) {
    res.status(403).json({ message: 'Forbidden' });
    return false;
  }
  return true;
}

module.exports = requireAuth;
module.exports.assertOwner = assertOwner;

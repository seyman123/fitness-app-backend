const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token eksik veya geçersiz' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // req.user → { id, email }
    req.userId = decoded.id; // Add userId for backward compatibility
    next();
  } catch (err) {
    console.error('JWT verification error:', err.message);
    res.status(401).json({ success: false, message: 'Geçersiz token' });
  }
};

module.exports = protect;

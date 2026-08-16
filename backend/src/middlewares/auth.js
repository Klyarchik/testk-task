const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  const token = header.slice(7);

  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret",
      { algorithms: ["HS256"] }
    );
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { authMiddleware };

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../db");

function signToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function validate(username, password) {
  if (!username || !password) return "Username и password обязательны";
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return "Username: 3-24 символа, только латиница, цифры и _";
  }
  if (password.length < 6 || password.length > 64) {
    return "Пароль должен содержать от 6 до 64 символов";
  }
  return null;
}

async function register(req, res) {
  try {
    const { username, password } = req.body;
    const validation = validate(username, password);
    if (validation) return res.status(400).json({ error: validation });

    const normalized = username.trim().toLowerCase();
    const exists = await prisma.user.findUnique({ where: { username: normalized } });
    if (exists) return res.status(409).json({ error: "Username уже занят" });

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username: normalized,
        passwordHash,
        gameState: { create: {} }
      }
    });

    return res.status(201).json({
      token: signToken(user),
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username и password обязательны" });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() }
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Неверный username или password" });
    }

    return res.json({
      token: signToken(user),
      user: { id: user.id, username: user.username }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: { id: true, username: true }
  });

  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user });
}

module.exports = { register, login, me };
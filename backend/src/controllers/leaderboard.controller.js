const prisma = require("../db");

async function leaderboard(req, res) {
  try {
    const rows = await prisma.gameState.findMany({
      take: 100,
      orderBy: { lifetimeHype: "desc" },
      select: {
        lifetimeHype: true,
        user: { select: { id: true, username: true } }
      }
    });

    res.json(rows.map((row, index) => ({
      rank: index + 1,
      userId: row.user.id,
      username: row.user.username,
      lifetimeHype: Number(row.lifetimeHype)
    })));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not load leaderboard" });
  }
}

module.exports = { leaderboard };

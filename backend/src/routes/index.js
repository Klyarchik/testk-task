const router = require("express").Router();

router.get("/health", (req, res) => res.json({ ok: true, service: "pepe-hype-empire" }));

router.use("/auth", require("./auth.routes"));
router.use("/game", require("./game.routes"));
router.use("/leaderboard", require("./leaderboard.routes"));

module.exports = router;

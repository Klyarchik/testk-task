const router = require("express").Router();
const { leaderboard } = require("../controllers/leaderboard.controller");

router.get("/", leaderboard);

module.exports = router;

const game = require("../services/game.service");

async function state(req, res) {
  try {
    res.json(await game.getState(req.user.userId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Could not load game" });
  }
}

async function click(req, res) {
  try {
    res.json(await game.click(req.user.userId));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Click failed" });
  }
}

async function upgrade(req, res) {
  try {
    res.json(await game.buyUpgrade(req.user.userId, req.body.type));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function booster(req, res) {
  try {
    res.json(await game.buyBooster(req.user.userId));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function ad(req, res) {
  try {
    res.json(await game.rewardAd(req.user.userId));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function skin(req, res) {
  try {
    res.json(await game.buySkin(req.user.userId, req.body.skin));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

module.exports = { state, click, upgrade, booster, ad, skin };

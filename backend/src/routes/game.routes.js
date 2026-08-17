const router = require("express").Router();
const { authMiddleware } = require("../middleware/auth");
const controller = require("../controllers/game.controller");

router.use(authMiddleware);
router.get("/", controller.state);
router.post("/click", controller.click);
router.post("/upgrade", controller.upgrade);
router.post("/booster", controller.booster);
router.post("/ad", controller.ad);
router.post("/skin", controller.skin);

module.exports = router;

const prisma = require("../db");

const STAGES = [
  { id: 1, name: "Pepe Underground", threshold: 0, asset: "stage-1.png" },
  { id: 2, name: "Meme Page", threshold: 10000, asset: "stage-2.png" },
  { id: 3, name: "Viral Pepe", threshold: 100000, asset: "stage-3.png" },
  { id: 4, name: "Pepe Media Agency", threshold: 1000000, asset: "stage-4.png" },
  { id: 5, name: "Pepe Meme Empire", threshold: 10000000, asset: "stage-5.png" }
];

const UPGRADES = {
  COMBO: { name: "Pepe Combo", baseHype: 1000, baseMemes: 0 },
  BOT: { name: "Pepe Bot", baseHype: 5000, baseMemes: 0 },
  TREND: { name: "Trend Detector", baseHype: 15000, baseMemes: 0 },
  STUDIO: { name: "Hype Studio", baseHype: 100000, baseMemes: 100 }
};

function money(n) {
  return Number(n);
}

function upgradeCost(type, level) {
  const config = UPGRADES[type];
  return Math.ceil(config.baseHype * Math.pow(1.7, level));
}

function stageFor(lifetime) {
  let current = STAGES[0];
  for (const stage of STAGES) {
    if (lifetime >= stage.threshold) current = stage;
  }
  return current;
}

function comboMultiplier(comboCount, comboLevel) {
  if (comboLevel <= 0) return 1;
  if (comboCount >= 30) return 3;
  if (comboCount >= 20) return 2;
  if (comboCount >= 10) return 1.5;
  if (comboCount >= 5) return 1.2;
  return 1;
}

function currentSkinBonus(state) {
  const map = { classic: 0, business: 1, golden: 2, diamond: 5 };
  return map[state.activeSkin] || 0;
}

function eventMultiplier(state, now) {
  if (!state.eventExpiresAt || state.eventExpiresAt <= now) return 1;
  return money(state.eventMultiplier);
}

function boosterMultiplier(state, now) {
  return state.boosterExpiresAt && state.boosterExpiresAt > now ? 3 : 1;
}

function parseOwnedSkins(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed : ["classic"];
  } catch {
    return ["classic"];
  }
}

async function ownedSkinsFor(userId, activeSkin) {
  const rows = await prisma.skinUnlock.findMany({ where: { userId }, select: { skin: true } });
  const skins = new Set(["classic", activeSkin, ...rows.map((row) => row.skin)]);
  return [...skins];
}

async function serialize(state, extra = {}) {
  const now = new Date();
  const stage = stageFor(money(state.lifetimeHype));
  const comboActive = state.comboExpiresAt && state.comboExpiresAt > now;
  return {
    hype: money(state.hype),
    lifetimeHype: money(state.lifetimeHype),
    clickPower: money(state.clickPower) + currentSkinBonus(state),
    hypePerSecond: money(state.hypePerSecond),
    premiumCurrency: state.premiumCurrency,
    stage: stage.id,
    stageName: stage.name,
    stageAsset: stage.asset,
    comboLevel: state.comboLevel,
    comboCount: comboActive ? state.comboCount : 0,
    comboMultiplier: comboMultiplier(comboActive ? state.comboCount : 0, state.comboLevel),
    botLevel: state.botLevel,
    trendLevel: state.trendLevel,
    skinLevel: state.skinLevel,
    studioLevel: state.studioLevel,
    activeSkin: state.activeSkin,
    ownedSkins: await ownedSkinsFor(state.userId, state.activeSkin),
    activeEvent: state.activeEvent && state.eventExpiresAt > now ? state.activeEvent : null,
    eventMultiplier: eventMultiplier(state, now),
    eventExpiresAt: state.eventExpiresAt,
    boosterExpiresAt: state.boosterExpiresAt,
    stages: STAGES,
    upgrades: Object.keys(UPGRADES).map((type) => ({
      type,
      name: UPGRADES[type].name,
      level: state[typeToLevelField(type)],
      hypeCost: upgradeCost(type, state[typeToLevelField(type)]),
      memCost: type === "SKIN" ? 50 : type === "STUDIO" ? 100 : null
    })),
    ...extra
  };
}

function typeToLevelField(type) {
  return {
    COMBO: "comboLevel",
    BOT: "botLevel",
    TREND: "trendLevel",
    SKIN: "skinLevel",
    STUDIO: "studioLevel"
  }[type];
}

async function accrue(state, now = new Date()) {
  const elapsed = Math.max(0, Math.min(3600, (now - state.lastTickAt) / 1000));
  if (elapsed <= 0) return state;

  const passive = money(state.hypePerSecond) * elapsed;
  const event = eventMultiplier(state, now);
  const booster = boosterMultiplier(state, now);
  const earned = passive * event * booster;

  return prisma.gameState.update({
    where: { id: state.id },
    data: {
      hype: { increment: earned },
      lifetimeHype: { increment: earned },
      lastTickAt: now
    }
  });
}

async function getState(userId) {
  let state = await prisma.gameState.findUnique({ where: { userId } });
  if (!state) {
    state = await prisma.gameState.create({ data: { userId } });
  }
  state = await accrue(state);
  return await serialize(state);
}

async function maybeStageEvent(userId, oldLifetime, newLifetime, state) {
  const oldStage = stageFor(oldLifetime).id;
  const newStage = stageFor(newLifetime).id;
  if (newStage <= oldStage) return null;

  const codes = {
    2: ["FIRST_VIRAL", 2, 20, "BONUS"],
    3: ["PEPE_EVERYWHERE", 5, 30, "BONUS"],
    4: ["BRANDS_WANT_PEPE", 3, 45, "BONUS"],
    5: ["GLOBAL_PEPE", 10, 60, "BONUS"]
  };

  const data = codes[newStage] || ["STAGE_UP", 2, 20, "BONUS"];
  const [code, multiplier, durationSec, type] = data;
  const now = new Date();
  await prisma.gameEvent.create({
    data: { userId, code, type, multiplier, durationSec }
  });

  return prisma.gameState.update({
    where: { id: state.id },
    data: {
      stage: newStage,
      activeEvent: code,
      eventMultiplier: multiplier,
      eventExpiresAt: new Date(now.getTime() + durationSec * 1000)
    }
  });
}

async function rollRandomEvent(userId, state) {
  if (state.activeEvent && state.eventExpiresAt > new Date()) return state;

  const trend = state.trendLevel;
  const bonusChance = Math.min(75, 55 + trend * 4);
  const crisisChance = Math.max(10, 30 - trend * 4);
  const roll = Math.random() * 100;

  let code;
  let type;
  let multiplier;
  let durationSec;

  if (roll < bonusChance) {
    code = "VIRAL_PEPE";
    type = "BONUS";
    multiplier = 5;
    durationSec = 30;
  } else if (roll < bonusChance + crisisChance) {
    code = "CRINGE_CRISIS";
    type = "CRISIS";
    multiplier = 0.5;
    durationSec = 30;
  } else {
    code = "ALGORITHM_RESET";
    type = "TWIST";
    multiplier = 1;
    durationSec = 45;
  }

  const now = new Date();
  await prisma.gameEvent.create({
    data: { userId, code, type, multiplier, durationSec }
  });

  return prisma.gameState.update({
    where: { id: state.id },
    data: {
      activeEvent: code,
      eventMultiplier: multiplier,
      eventExpiresAt: new Date(now.getTime() + durationSec * 1000)
    }
  });
}

async function click(userId) {
  let state = await prisma.gameState.findUnique({ where: { userId } });
  if (!state) state = await prisma.gameState.create({ data: { userId } });

  state = await accrue(state);
  const now = new Date();

  let comboCount = state.comboCount;
  if (!state.comboExpiresAt || state.comboExpiresAt <= now) comboCount = 0;
  comboCount += 1;

  const comboMult = comboMultiplier(comboCount, state.comboLevel);
  const eventMult = eventMultiplier(state, now);
  const boosterMult = boosterMultiplier(state, now);
  const skinBonus = currentSkinBonus(state);

  // Algorithm Reset: every 10th click gives an extra 100 Hype.
  const twistBonus =
    state.activeEvent === "ALGORITHM_RESET" &&
    state.eventExpiresAt > now &&
    comboCount % 10 === 0 ? 100 : 0;

  const reward = (money(state.clickPower) + skinBonus) *
    comboMult * eventMult * boosterMult + twistBonus;

  const newLifetime = money(state.lifetimeHype) + reward;

  let updated = await prisma.gameState.update({
    where: { id: state.id },
    data: {
      hype: { increment: reward },
      lifetimeHype: { increment: reward },
      comboCount,
      comboExpiresAt: new Date(now.getTime() + 2500),
      lastTickAt: now
    }
  });

  const stageEventState = await maybeStageEvent(
    userId,
    money(state.lifetimeHype),
    newLifetime,
    updated
  );

  if (stageEventState) updated = stageEventState;

  // Small chance of a random event after a click once the player has progressed.
  if (!stageEventState && updated.lifetimeHype >= 10000 && Math.random() < 0.018) {
    updated = await rollRandomEvent(userId, updated);
  }

  return await serialize(updated, { lastClickReward: reward });
}

async function buyUpgrade(userId, type) {
  if (!UPGRADES[type]) throw new Error("Unknown upgrade");

  let state = await prisma.gameState.findUnique({ where: { userId } });
  state = await accrue(state);

  const field = typeToLevelField(type);
  const level = state[field];
  const config = UPGRADES[type];
  const hypeCost = upgradeCost(type, level);

  if (type === "STUDIO" && state.premiumCurrency >= 100) {
    await prisma.gameState.update({
      where: { id: state.id },
      data: { premiumCurrency: { decrement: 100 }, studioLevel: { increment: 1 } }
    });
  } else {
    if (money(state.hype) < hypeCost) {
      throw new Error(`Нужно ${hypeCost.toLocaleString()} Hype`);
    }

    const data = { hype: { decrement: hypeCost }, [field]: { increment: 1 } };

    if (type === "COMBO") {
      data.clickPower = { increment: 1 };
    }
    if (type === "BOT") {
      data.hypePerSecond = { increment: 10 * (level + 1) };
    }
    if (type === "TREND") {
      // Probability is calculated from trendLevel.
    }
    if (type === "STUDIO") {
      data.hypePerSecond = { increment: 25 * (level + 1) };
    }

    await prisma.gameState.update({ where: { id: state.id }, data });
  }

  await prisma.upgradePurchase.create({
    data: {
      userId,
      type,
      level: level + 1,
      costHype: type === "STUDIO" ? 0 : hypeCost,
      costMemes: type === "STUDIO" ? 100 : null
    }
  });

  return getState(userId);
}

async function buyBooster(userId) {
  let state = await prisma.gameState.findUnique({ where: { userId } });
  state = await accrue(state);

  if (state.premiumCurrency < 50) throw new Error("Нужно 50 Memecoins");

  const now = new Date();
  const base = state.boosterExpiresAt && state.boosterExpiresAt > now
    ? state.boosterExpiresAt
    : now;

  const expires = new Date(base.getTime() + 60_000);

  await prisma.gameState.update({
    where: { id: state.id },
    data: {
      premiumCurrency: { decrement: 50 },
      boosterExpiresAt: expires
    }
  });

  return getState(userId);
}

async function rewardAd(userId) {
  let state = await prisma.gameState.findUnique({ where: { userId } });
  state = await accrue(state);

  const reward = 1000 + state.stage * 1000;
  await prisma.gameState.update({
    where: { id: state.id },
    data: {
      hype: { increment: reward },
      lifetimeHype: { increment: reward }
    }
  });

  return getState(userId);
}

async function buySkin(userId, skin) {
  const costs = {
    classic: { hype: 0, memes: 0, bonus: 0 },
    business: { hype: 25000, memes: 0, bonus: 1 },
    golden: { hype: 0, memes: 100, bonus: 2 },
    diamond: { hype: 0, memes: 300, bonus: 5 }
  };

  if (!costs[skin]) throw new Error("Unknown skin");

  let state = await prisma.gameState.findUnique({ where: { userId } });
  if (!state) state = await prisma.gameState.create({ data: { userId } });
  state = await accrue(state);

  // Backfill the currently equipped legacy skin into permanent ownership.
  if (state.activeSkin && state.activeSkin !== "classic") {
    await prisma.skinUnlock.upsert({
      where: { userId_skin: { userId, skin: state.activeSkin } },
      update: {},
      create: { userId, skin: state.activeSkin }
    });
  }

  const owned = skin === "classic" || state.activeSkin === skin || await prisma.skinUnlock.findUnique({
    where: { userId_skin: { userId, skin } }
  });

  // Ownership is permanent. Selecting an already unlocked skin is always free.
  if (owned) {
    const updated = await prisma.gameState.update({
      where: { id: state.id },
      data: { activeSkin: skin }
    });
    return getState(userId);
  }

  const cost = costs[skin];
  if (cost.hype && money(state.hype) < cost.hype) throw new Error("Недостаточно Hype");
  if (cost.memes && state.premiumCurrency < cost.memes) throw new Error("Недостаточно Memecoins");

  await prisma.$transaction([
    prisma.gameState.update({
      where: { id: state.id },
      data: {
        ...(cost.hype ? { hype: { decrement: cost.hype } } : {}),
        ...(cost.memes ? { premiumCurrency: { decrement: cost.memes } } : {}),
        activeSkin: skin,
        skinLevel: { increment: 1 }
      }
    }),
    prisma.skinUnlock.create({ data: { userId, skin } })
  ]);

  return getState(userId);
}

module.exports = {
  getState,
  click,
  buyUpgrade,
  buyBooster,
  rewardAd,
  buySkin,
  STAGES
};

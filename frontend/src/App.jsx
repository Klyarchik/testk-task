import React, { useEffect, useMemo, useState } from "react";
import { Trophy, Sparkles, LogOut, Zap, ShoppingBag, Shield, Bot, Radio, Megaphone, Palette, MousePointer2 } from "lucide-react";
import { api, clearToken, getToken, setToken } from "./api";

const ASSET_BASE = import.meta.env.VITE_ASSET_URL || "http://localhost:9000/pepe-hype-assets";

const format = (n) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(n || 0));

function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("game");

  useEffect(() => {
    if (!getToken()) return;
    api("/auth/me").then((r) => setUser(r.user)).catch(() => clearToken());
  }, []);

  if (!user) {
    return <Auth onSuccess={setUser} />;
  }

  return (
    <div className="app-shell">
      <Header user={user} onLogout={() => { clearToken(); setUser(null); }} onScreen={setScreen} />
      {screen === "game" && <Game />}
      {screen === "leaderboard" && <Leaderboard user={user} />}
      {screen === "shop" && <Shop />}
    </div>
  );
}

function Auth({ onSuccess }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api(`/auth/${mode === "login" ? "login" : "register"}`, {
        method: "POST",
        body: JSON.stringify({ username, password })
      });
      setToken(data.token);
      onSuccess(data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="brand-mark">🐸</div>
        <span className="eyebrow">MEME CLICKER TYCOON</span>
        <h1>Pepe Hype Empire</h1>
        <p className="muted">Постишь Pepe → набираешь хайп → захватываешь интернет.</p>

        <div className="tabs">
          <button className={mode === "login" ? "tab active" : "tab"} onClick={() => setMode("login")}>Войти</button>
          <button className={mode === "register" ? "tab active" : "tab"} onClick={() => setMode("register")}>Регистрация</button>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label>Username<input value={username} onChange={e => setUsername(e.target.value)} placeholder="pepe_master" autoComplete="username" /></label>
          <label>Пароль<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Минимум 6 символов" autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
          {error && <div className="error-box">{error}</div>}
          <button className="primary-btn big" disabled={loading}>{loading ? "Загрузка..." : mode === "login" ? "Войти в империю" : "Создать империю"}</button>
        </form>
      </div>
    </main>
  );
}

function Header({ user, onLogout, onScreen }) {
  return (
    <header className="topbar">
      <button className="logo" onClick={() => onScreen("game")}>
        <span>🐸</span>
        <span>PEPE HYPE EMPIRE</span>
      </button>

      <nav>
        <button onClick={() => onScreen("game")}><Zap size={17} /> Игра</button>
        <button onClick={() => onScreen("leaderboard")}><Trophy size={17} /> Рейтинг</button>
        <button onClick={() => onScreen("shop")}><ShoppingBag size={17} /> Shop</button>
      </nav>

      <div className="user-chip">
        <span>@{user.username}</span>
        <button className="icon-btn" title="Выйти" onClick={onLogout}><LogOut size={17} /></button>
      </div>
    </header>
  );
}

function Game() {
  const [state, setState] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  async function load() {
    try {
      const data = await api("/game");
      setState(data);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 1000);
    return () => clearInterval(id);
  }, []);

  async function clickPepe() {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api("/game/click", { method: "POST", body: "{}" });
      setState(data);
      if (data.lastClickReward) {
        setNotice(`+${format(data.lastClickReward)} HYPE`);
        setTimeout(() => setNotice(null), 500);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function buyUpgrade(type) {
    try {
      const data = await api("/game/upgrade", { method: "POST", body: JSON.stringify({ type }) });
      setState(data);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(""), 1800);
    }
  }

  async function booster() {
    try {
      setState(await api("/game/booster", { method: "POST", body: "{}" }));
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(""), 1800);
    }
  }

  async function ad() {
    try {
      setState(await api("/game/ad", { method: "POST", body: "{}" }));
      setNotice("📺 AD REWARD: +HYPE");
      setTimeout(() => setNotice(null), 900);
    } catch (e) {
      setError(e.message);
    }
  }

  if (!state) return <main className="loading">Загрузка империи...</main>;

  const eventAsset = state.activeEvent === "VIRAL_PEPE"
    ? "event-viral.png"
    : state.activeEvent === "CRINGE_CRISIS"
      ? "event-cringe.png"
      : state.activeEvent === "ALGORITHM_RESET"
        ? "event-twist.png"
        : null;

  const pepeImage = eventAsset
    ? `${ASSET_BASE}/pepe/${eventAsset}`
    : `${ASSET_BASE}/pepe/${state.activeSkin === "classic" ? "skin-classic.png" : state.activeSkin === "business" ? "skin-business.png" : state.activeSkin === "golden" ? "skin-golden.png" : "skin-diamond.png"}`;

  const eventLabel = {
    VIRAL_PEPE: "🔥 VIRAL PEPE",
    CRINGE_CRISIS: "💀 CRINGE CRISIS",
    ALGORITHM_RESET: "🧠 ALGORITHM RESET (каждый 10-й клик +100)",
    FIRST_VIRAL: "🎉 FIRST VIRAL",
    PEPE_EVERYWHERE: "🌎 PEPE EVERYWHERE",
    BRANDS_WANT_PEPE: "💼 BRANDS WANT PEPE",
    GLOBAL_PEPE: "👑 GLOBAL PEPE"
  }[state.activeEvent];

  return (
    <main className="game-page">
      <section className="stats-grid">
        <Stat label="HYPE" value={format(state.hype)} accent />
        <Stat label="LIFETIME HYPE" value={format(state.lifetimeHype)} />
        <Stat label="PER SECOND" value={`+${format(state.hypePerSecond)}`} />
        <Stat label="MEMECOINS" value={`💎 ${format(state.premiumCurrency)}`} />
      </section>

      <section className="game-layout">
        <div className={`hero-card stage-${state.stage} ${state.activeEvent ? `event-${state.activeEvent.toLowerCase()}` : ""}`}>
          <div className="stage-row">
            <div>
              <span className="eyebrow">STAGE {state.stage} / 5</span>
              <h2>{state.stageName}</h2>
            </div>
            <div className="stage-progress">
              <span>{format(state.lifetimeHype)} lifetime</span>
            </div>
          </div>

          <div className="pepe-wrap">
            <img className="stage-background" src={`${ASSET_BASE}/pepe/${state.stageAsset}`} alt="" aria-hidden="true" draggable="false" />
            <div className="stage-vignette" aria-hidden="true" />
            <img className={`pepe-image ${eventAsset ? "event-pepe" : ""}`} src={pepeImage} alt={eventAsset ? "Pepe event" : `${state.activeSkin} Pepe`} draggable="false" />
            {notice && <div className="float-reward">{notice}</div>}
          </div>

          <button className="pepe-button" onClick={clickPepe} disabled={busy}>
            <MousePointer2 size={20} />
            POST PEPE
            <span>+{format(state.clickPower * state.comboMultiplier)} HYPE</span>
          </button>

          {state.comboLevel > 0 && (
            <div className="combo">
              🔥 COMBO x{state.comboCount} <b>×{state.comboMultiplier}</b>
            </div>
          )}

          {eventLabel && (
            <div className={`event-banner ${state.activeEvent === "CRINGE_CRISIS" ? "crisis" : ""}`}>
              <div><strong>{eventLabel}</strong><span>Активное мемное событие</span></div>
              <b>×{state.eventMultiplier}</b>
            </div>
          )}
        </div>

        <aside className="side-column">
          <UpgradePanel state={state} onBuy={buyUpgrade} />
          <div className="monetization-card">
            <div className="card-title"><Sparkles size={18} /> Monetization demo</div>
            <p>Премиальные механики без реальной оплаты.</p>
            <button className="secondary-btn" onClick={booster}>🚀 x3 Hype — 50 💎</button>
            <button className="secondary-btn" onClick={ad}>📺 Rewarded Ad — получить Hype</button>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Stat({ label, value, accent }) {
  return <div className={`stat-card ${accent ? "accent" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

function UpgradePanel({ state, onBuy }) {
  const icons = {
    COMBO: <Zap size={18} />,
    BOT: <Bot size={18} />,
    TREND: <Radio size={18} />,
    SKIN: <Palette size={18} />,
    STUDIO: <Megaphone size={18} />
  };

  const descriptions = {
    COMBO: "Быстрые клики дают всё больший множитель.",
    BOT: "Добавляет пассивный Hype / sec.",
    TREND: "Меньше кризисов, больше бонусов.",
    SKIN: "Premium Pepe и бонус к клику.",
    STUDIO: "Увеличивает пассивное производство."
  };

  return (
    <div className="panel">
      <div className="card-title"><Sparkles size={18} /> Улучшения</div>
      <div className="upgrade-list">
        {state.upgrades.map(u => (
          <button key={u.type} className="upgrade" onClick={() => onBuy(u.type)}>
            <span className="upgrade-icon">{icons[u.type]}</span>
            <span className="upgrade-copy">
              <strong>{u.name} <small>LV.{u.level}</small></strong>
              <em>{descriptions[u.type]}</em>
            </span>
            <span className="upgrade-cost">{u.memCost ? `💎 ${u.memCost}` : `⚡ ${format(u.hypeCost)}`}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Leaderboard({ user }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/leaderboard").then(setRows).catch(e => setError(e.message));
  }, []);

  return (
    <main className="content-page">
      <div className="page-heading">
        <span className="eyebrow">GLOBAL RANKING</span>
        <h1>🏆 Pepe Hype Leaderboard</h1>
        <p className="muted">Рейтинг по lifetime Hype — потраченный ресурс не уменьшает позицию.</p>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="leaderboard">
        {rows.map(row => (
          <div className={`leader-row ${row.username === user.username ? "me" : ""}`} key={row.userId}>
            <span className="rank">#{row.rank}</span>
            <span className="rank-name">{row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : "🐸"} @{row.username}</span>
            <strong>{format(row.lifetimeHype)} Hype</strong>
          </div>
        ))}
      </div>
    </main>
  );
}

function Shop() {
  const [state, setState] = useState(null);
  const [section, setSection] = useState("skins");
  const [message, setMessage] = useState("");

  useEffect(() => { api("/game").then(setState).catch(e => setMessage(e.message)); }, []);

  async function selectSkin(skin) {
    try {
      const data = await api("/game/skin", { method: "POST", body: JSON.stringify({ skin }) });
      setState(data);
      setMessage(`${skin === "classic" ? "Classic" : skin[0].toUpperCase() + skin.slice(1)} Pepe выбран`);
    } catch (e) {
      setMessage(e.message);
    }
  }

  if (!state) return <main className="loading">Загрузка магазина...</main>;

  const skins = [
    ["classic", "Classic Pepe", "Бесплатно", "skin-classic.png"],
    ["business", "Business Pepe", "25,000 Hype", "skin-business.png"],
    ["golden", "Golden Pepe", "100 💎", "skin-golden.png"],
    ["diamond", "Diamond Pepe", "300 💎", "skin-diamond.png"]
  ];

  return (
    <main className="content-page shop-page">
      <div className="page-heading">
        <span className="eyebrow">PEPE MARKET</span>
        <h1>🛍️ Магазин</h1>
        <p className="muted">Выбирай внешний вид Pepe или загляни в раздел Memecoins.</p>
      </div>

      <div className="shop-tabs">
        <button className={section === "skins" ? "shop-tab active" : "shop-tab"} onClick={() => setSection("skins")}>
          🎨 Скины
        </button>
        <button className={section === "memecoins" ? "shop-tab active" : "shop-tab"} onClick={() => setSection("memecoins")}>
          💎 Memecoins
        </button>
      </div>

      {section === "skins" ? (
        <>
          <div className="shop-note">🔓 Купленный скин остаётся разблокирован навсегда. После покупки его можно выбирать бесплатно.</div>
          <div className="skin-grid">
            {skins.map(([id, name, price, asset]) => {
              const owned = state.ownedSkins?.includes(id) || id === "classic";
              const selected = state.activeSkin === id;
              return (
                <div className={`skin-card ${selected ? "selected" : ""}`} key={id}>
                  <div className="skin-preview"><img src={`${ASSET_BASE}/pepe/${asset}`} alt={name} /></div>
                  <div className="skin-card-copy">
                    <h3>{name}</h3>
                    <p>{owned ? "Разблокирован" : price}</p>
                  </div>
                  <button className={selected ? "secondary-btn selected-btn" : "secondary-btn"} disabled={selected} onClick={() => selectSkin(id)}>
                    {selected ? "✓ Выбран" : owned ? "Выбрать" : "Разблокировать"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <section className="memecoin-shop">
          <div className="memecoin-hero">
            <div>
              <span className="eyebrow">PREMIUM CURRENCY</span>
              <h2>💎 Memecoins</h2>
              <p className="muted">Сейчас это демонстрационный раздел. Покупка пока не подключена.</p>
            </div>
            <strong>💎 {format(state.premiumCurrency)}</strong>
          </div>
          <div className="coin-packages">
            {[[100, "€0.99"], [550, "€4.99"], [1200, "€9.99"], [3000, "€19.99"]].map(([coins, price]) => (
              <div className="coin-card" key={coins}>
                <div className="coin-icon">💎</div>
                <h3>{format(coins)} Memecoins</h3>
                <p>{price}</p>
                <button className="secondary-btn" disabled>Купить — скоро</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {message && <div className="toast-static">{message}</div>}
    </main>
  );
}

export default App;

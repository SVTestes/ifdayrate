import { useState, useMemo, useEffect } from "react";

// ─── API ────────────────────────────────────────────────────────
const API_BASE = "https://ifdayrate-production.up.railway.app/api";

async function apiFetch(path, options: RequestInit = {}, tok = null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (tok) headers["Authorization"] = `Bearer ${tok}`;
  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.error || "Erro na requisição");
  return data;
}

// ─── Temas ──────────────────────────────────────────────────────
const THEMES = {
  default: {
    primary:   "#16a34a",
    primaryDk: "#14532d",
    primaryLt: "#dcfce7",
    primaryMid:"#bbf7d0",
    accent:    "#86efac",
    logoText:  "IFDR",
    logoSub:   "IFDayRate",
    navActive: "#16a34a",
    headerBg:  "#16a34a",
    btnShadow: "#16a34a44",
    badgeBg:   "#dcfce7",
    badgeText: "#14532d",
  },
  ff: {
    primary:   "#be123c",
    primaryDk: "#881337",
    primaryLt: "#fff1f2",
    primaryMid:"#fecdd3",
    accent:    "#fda4af",
    logoText:  "FFDR",
    logoSub:   "Femme Fatale",
    navActive: "#be123c",
    headerBg:  "#881337",
    btnShadow: "#be123c44",
    badgeBg:   "#fff1f2",
    badgeText: "#881337",
  },
};

const G_BASE = {
  white:   "#ffffff",
  offWhite:"#fafafa",
  gray50:  "#f5f5f5",
  gray100: "#e8e8e8",
  gray300: "#aaaaaa",
  gray500: "#666666",
  gray700: "#333333",
  gray900: "#111111",
  text:    "#1a1a1a",
  textMuted:"#555555",
};

// ─── Cores das notas ────────────────────────────────────────────
const RATING_COLOR = (r) => {
  if (r === null || r === undefined) return { bg:"#f5f5f5", border:"#e8e8e8", text:"#aaa", glow:"none" };
  if (r === 10)  return { bg:"#e0f2fe", border:"#7dd3fc", text:"#0369a1" };
  if (r >= 8)    return { bg:"#dcfce7", border:"#86efac", text:"#16a34a" };
  if (r >= 6)    return { bg:"#f0fdf4", border:"#bbf7d0", text:"#15803d" };
  if (r >= 5)    return { bg:"#fefce8", border:"#fde047", text:"#854d0e" };
  if (r >= 4)    return { bg:"#fef2f2", border:"#fca5a5", text:"#b91c1c" };
  return          { bg:"#f5f3ff", border:"#c4b5fd", text:"#6d28d9" };
};

const RATING_LABEL = (r) => {
  if (!r && r!==0) return "";
  if (r===10) return "Perfeito ✦";
  if (r>=8)   return "Ótimo";
  if (r>=6)   return "Bom";
  if (r>=5)   return "Regular";
  if (r>=4)   return "Ruim";
  return "Péssimo";
};

const today = new Date(); today.setHours(0,0,0,0);
const fmtDate = (d) => d.toISOString().split("T")[0];

const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_PT = ["D","S","T","Q","Q","S","S"];

const FF_PHOTO_PATH = "/mnt/user-data/uploads/IMG-20251130-WA0007.jpg";

export default function App() {
  const [screen, setScreen]   = useState("login");
  const [token, setToken]     = useState(null);
  const [user, setUser]       = useState(null);
  const [ffMode, setFfMode]   = useState(false);
  const [ratings, setRatings] = useState({});
  const [stats, setStats]     = useState({ weekAvg: null, monthAvg: null, overallAvg: null });
  const [groups, setGroups]   = useState([]);
  const [groupDetails, setGroupDetails] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Auth
  const [isRegister, setIsRegister]   = useState(false);
  const [loginEmail, setLoginEmail]   = useState("");
  const [loginPass, setLoginPass]     = useState("");
  const [registerName, setRegisterName] = useState("");
  const [loginError, setLoginError]   = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Ratings
  const [ratingInput, setRatingInput] = useState("");
  const [ratingError, setRatingError] = useState("");
  const [backdateInput, setBackdateInput] = useState("");
  const [backdateVal, setBackdateVal] = useState("");
  const [backdateErr, setBackdateErr] = useState("");

  // Calendar
  const [calMonth, setCalMonth]     = useState(new Date(today.getFullYear(),today.getMonth(),1));
  const [selectedDay, setSelectedDay] = useState(null);

  // Groups
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode]       = useState("");
  const [groupsMsg, setGroupsMsg]     = useState("");

  // Profile
  const [codeInput, setCodeInput]   = useState("");
  const [codeErr, setCodeErr]       = useState("");
  const [codeSuccess, setCodeSuccess] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameMsg, setUsernameMsg] = useState("");

  // ─── Auto-login ──────────────────────────────────────────────
  useEffect(() => {
    const tok = localStorage.getItem("ifdr_token");
    const usr = localStorage.getItem("ifdr_user");
    if (tok && usr) {
      try {
        const parsedUser = JSON.parse(usr);
        setToken(tok);
        setUser(parsedUser);
        setScreen("home");
        loadAllData(tok);
      } catch {
        localStorage.removeItem("ifdr_token");
        localStorage.removeItem("ifdr_user");
      }
    }
  }, []);

  // ─── Carrega detalhes dos grupos ao entrar na tela ───────────
  useEffect(() => {
    if (screen === "groups" && token) {
      refreshGroups(token);
    }
  }, [screen]);

  // ─── Funções de dados ────────────────────────────────────────
  async function loadAllData(tok) {
    try {
      const [ratingsData, statsData, groupsData] = await Promise.all([
        apiFetch("/ratings", {}, tok),
        apiFetch("/ratings/stats", {}, tok),
        apiFetch("/groups", {}, tok),
      ]);
      const ratingsObj = {};
      (Array.isArray(ratingsData) ? ratingsData : []).forEach(r => {
        if (r.date && r.rating != null) ratingsObj[r.date] = parseFloat(r.rating);
      });
      setRatings(ratingsObj);
      setStats({
        weekAvg:    statsData.weekAvg    ?? null,
        monthAvg:   statsData.monthAvg   ?? null,
        overallAvg: statsData.overallAvg ?? null,
      });
      setGroups(Array.isArray(groupsData) ? groupsData : []);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    }
  }

  async function refreshGroups(tok) {
    if (loadingGroups) return;
    setLoadingGroups(true);
    try {
      const grpList = await apiFetch("/groups", {}, tok);
      const list = Array.isArray(grpList) ? grpList : [];
      setGroups(list);
      const details = await Promise.all(
        list.map(g => apiFetch(`/groups/${g.id}`, {}, tok).catch(() => g))
      );
      setGroupDetails(details);
    } catch (e) {
      console.error("Erro ao carregar grupos:", e);
    } finally {
      setLoadingGroups(false);
    }
  }

  async function handleLogin() {
    if (!loginEmail.trim() || !loginPass.trim()) { setLoginError("Preencha todos os campos"); return; }
    setLoginLoading(true); setLoginError("");
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      localStorage.setItem("ifdr_token", data.accessToken);
      localStorage.setItem("ifdr_user", JSON.stringify(data.user));
      setToken(data.accessToken);
      setUser(data.user);
      setScreen("home");
      await loadAllData(data.accessToken);
    } catch (e) {
      setLoginError(e.message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister() {
    if (!registerName.trim() || !loginEmail.trim() || !loginPass.trim()) { setLoginError("Preencha todos os campos"); return; }
    setLoginLoading(true); setLoginError("");
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name: registerName, email: loginEmail, password: loginPass }),
      });
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      localStorage.setItem("ifdr_token", data.accessToken);
      localStorage.setItem("ifdr_user", JSON.stringify(data.user));
      setToken(data.accessToken);
      setUser(data.user);
      setScreen("home");
      await loadAllData(data.accessToken);
    } catch (e) {
      setLoginError(e.message);
    } finally {
      setLoginLoading(false);
    }
  }

  async function submitRating() {
    const v = parseFloat(ratingInput.replace(",", "."));
    if (isNaN(v) || v < 0 || v > 10) { setRatingError("Nota entre 0 e 10"); return; }
    const rounded = Math.round(v * 10) / 10;
    try {
      await apiFetch("/ratings", { method: "POST", body: JSON.stringify({ date: todayKey, rating: rounded }) }, token);
      setRatings(r => ({ ...r, [todayKey]: rounded }));
      setRatingInput(""); setRatingError("");
      const statsData = await apiFetch("/ratings/stats", {}, token);
      setStats({ weekAvg: statsData.weekAvg ?? null, monthAvg: statsData.monthAvg ?? null, overallAvg: statsData.overallAvg ?? null });
    } catch (e) {
      setRatingError(e.message);
    }
  }

  async function submitBackdate() {
    if (!backdateInput) { setBackdateErr("Escolha uma data"); return; }
    const d = new Date(backdateInput + "T00:00:00");
    if (d > today) { setBackdateErr("Não pode dar nota para o futuro"); return; }
    const key = fmtDate(d);
    if (ratings[key] !== undefined) { setBackdateErr("Esse dia já tem nota"); return; }
    const v = parseFloat(backdateVal.replace(",", "."));
    if (isNaN(v) || v < 0 || v > 10) { setBackdateErr("Nota inválida"); return; }
    const rounded = Math.round(v * 10) / 10;
    try {
      await apiFetch("/ratings", { method: "POST", body: JSON.stringify({ date: key, rating: rounded }) }, token);
      setRatings(r => ({ ...r, [key]: rounded }));
      setBackdateInput(""); setBackdateVal(""); setBackdateErr("");
      const statsData = await apiFetch("/ratings/stats", {}, token);
      setStats({ weekAvg: statsData.weekAvg ?? null, monthAvg: statsData.monthAvg ?? null, overallAvg: statsData.overallAvg ?? null });
    } catch (e) {
      setBackdateErr(e.message);
    }
  }

  async function createGroup() {
    if (!newGroupName.trim()) return;
    try {
      await apiFetch("/groups", { method: "POST", body: JSON.stringify({ name: newGroupName }) }, token);
      setNewGroupName("");
      setGroupsMsg("Grupo criado!");
      setTimeout(() => setGroupsMsg(""), 2500);
      if (token) refreshGroups(token);
    } catch (e) {
      setGroupsMsg(e.message);
      setTimeout(() => setGroupsMsg(""), 2500);
    }
  }

  async function joinGroup() {
    if (!joinCode.trim()) return;
    try {
      await apiFetch("/groups/join", { method: "POST", body: JSON.stringify({ inviteCode: joinCode }) }, token);
      setJoinCode("");
      setGroupsMsg("Entrou no grupo!");
      setTimeout(() => setGroupsMsg(""), 2500);
      if (token) refreshGroups(token);
    } catch (e) {
      setGroupsMsg(e.message);
      setTimeout(() => setGroupsMsg(""), 2500);
    }
  }

  function handleLogout() {
    localStorage.removeItem("ifdr_token");
    localStorage.removeItem("ifdr_user");
    setToken(null); setUser(null);
    setRatings({}); setStats({ weekAvg: null, monthAvg: null, overallAvg: null });
    setGroups([]); setGroupDetails([]);
    setScreen("login");
  }

  function submitCode() {
    if (codeInput.trim().toLowerCase() === "femme fatale forever") {
      setFfMode(true); setCodeSuccess(true); setCodeErr(""); setCodeInput("");
    } else {
      setCodeErr("Código incorreto"); setCodeSuccess(false);
    }
  }

  // ─── Derivados ───────────────────────────────────────────────
  const T = ffMode ? THEMES.ff : THEMES.default;
  const G = { ...G_BASE };

  const todayKey    = fmtDate(today);
  const todayRating = ratings[todayKey];

  const weekAvgStr    = stats.weekAvg    != null ? parseFloat(stats.weekAvg).toFixed(1)    : null;
  const monthAvgStr   = stats.monthAvg   != null ? parseFloat(stats.monthAvg).toFixed(1)   : null;
  const overallAvgStr = stats.overallAvg != null ? parseFloat(stats.overallAvg).toFixed(1) : null;

  const allVals = Object.values(ratings);

  const calDays = useMemo(() => {
    const days = []; const first = new Date(calMonth);
    const last = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0);
    for (let i = 0; i < first.getDay(); i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(calMonth.getFullYear(), calMonth.getMonth(), d));
    return days;
  }, [calMonth]);

  // ─── Styles factory ──────────────────────────────────────────
  const css = {
    app: { minHeight:"100vh", background:G.offWhite, color:G.text, fontFamily:"'Plus Jakarta Sans',sans-serif", maxWidth:430, margin:"0 auto", position:"relative" },
    topbar: { background:T.headerBg, padding:"0 18px", display:"flex", alignItems:"center", justifyContent:"space-between", height:58, position:"sticky", top:0, zIndex:200, boxShadow:`0 2px 12px ${T.primary}44` },
    nav: { display:"flex", justifyContent:"space-around", alignItems:"center", background:G.white, borderTop:`1px solid ${G.gray100}`, position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, zIndex:100, height:62, boxShadow:"0 -2px 16px #0000000a" },
    navBtn: (a) => ({ background:"none", border:"none", color:a?T.navActive:G.gray300, fontSize:9, cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"8px 12px", borderRadius:10, fontFamily:"inherit", fontWeight:a?700:400, borderBottom:a?`2px solid ${T.primary}`:"2px solid transparent", transition:"all 0.15s" }),
    card: { background:G.white, borderRadius:16, padding:"18px 20px", margin:"10px 14px", border:`1px solid ${G.gray100}`, boxShadow:"0 1px 4px #00000006" },
    cardAccent: { background:T.primaryLt, borderRadius:16, padding:"18px 20px", margin:"10px 14px", border:`1px solid ${T.primaryMid}` },
    input: { background:G.gray50, border:`1.5px solid ${G.gray100}`, borderRadius:10, color:G.text, padding:"11px 14px", fontSize:15, width:"100%", outline:"none", boxSizing:"border-box", fontFamily:"inherit" },
    btnPrimary: { background:T.primary, border:"none", borderRadius:10, color:"#fff", fontWeight:700, fontSize:15, padding:"12px 24px", cursor:"pointer", width:"100%", fontFamily:"inherit", boxShadow:`0 2px 8px ${T.btnShadow}` },
    btnOutline: { background:"transparent", border:`1.5px solid ${G.gray100}`, borderRadius:10, color:T.primary, fontWeight:600, fontSize:15, padding:"12px 24px", cursor:"pointer", width:"100%", fontFamily:"inherit" },
    sectionLabel: { fontSize:11, fontWeight:700, color:G.gray500, textTransform:"uppercase", letterSpacing:"0.8px", margin:"16px 14px 6px" },
  };

  // ─── Logo ────────────────────────────────────────────────────
  const LogoMark = () => ffMode ? (
    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
      <div style={{ width:38, height:38, borderRadius:10, overflow:"hidden", border:"2px solid #fda4af", flexShrink:0 }}>
        <img src={FF_PHOTO_PATH} alt="FF" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }} />
      </div>
      <div>
        <div style={{ color:"#fff", fontWeight:800, fontSize:16, letterSpacing:"-0.3px" }}>FFDR</div>
        <div style={{ color:"#fda4af", fontSize:9, fontWeight:500, letterSpacing:"0.5px" }}>Femme Fatale Day Rate</div>
      </div>
    </div>
  ) : (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ background:"#fff", borderRadius:6, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:T.primary }}>IF</div>
      <div>
        <div style={{ color:"#fff", fontWeight:800, fontSize:17, letterSpacing:"-0.3px" }}>IFDR</div>
        <div style={{ color:T.accent, fontSize:10, fontWeight:500, letterSpacing:"0.5px" }}>IFDayRate</div>
      </div>
    </div>
  );

  const Topbar = ({title = null}) => (
    <div style={css.topbar}>
      <LogoMark />
      {title && <div style={{ color:T.primaryLt, fontSize:13, fontWeight:600 }}>{title}</div>}
    </div>
  );

  const Nav = () => (
    <nav style={css.nav}>
      {[["🏠","Início","home"],["📅","Calendário","calendar"],["👥","Grupos","groups"],["👤","Perfil","profile"]].map(([icon,label,sc]) => (
        <button key={sc} style={css.navBtn(screen===sc)} onClick={() => setScreen(sc)}>
          <span style={{fontSize:20}}>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );

  const StatCard = ({label, val}) => {
    const c = RATING_COLOR(val ? parseFloat(val) : null);
    return (
      <div style={{ flex:1, background:c.bg, border:`1px solid ${c.border}`, borderRadius:12, padding:"12px 10px", textAlign:"center" }}>
        <div style={{ fontSize:10, color:G.gray500, marginBottom:3, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.5px" }}>{label}</div>
        <div style={{ fontSize:22, fontWeight:800, color:val?c.text:G.gray300 }}>{val ? val.replace(".",",") : "—"}</div>
      </div>
    );
  };

  // ════════════════════════════════════════════════════════════════
  // LOGIN / CADASTRO
  // ════════════════════════════════════════════════════════════════
  if (screen === "login") return (
    <div style={css.app}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <div style={{ background:T.primary, height:8 }}/>
      <div style={{ padding:"48px 28px 40px", minHeight:"92vh", display:"flex", flexDirection:"column", justifyContent:"center" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:72, height:72, background:T.primary, borderRadius:20, marginBottom:16, boxShadow:`0 8px 24px ${T.btnShadow}` }}>
            <span style={{ color:"#fff", fontWeight:900, fontSize:24, letterSpacing:"-1px" }}>IF</span>
          </div>
          <div style={{ fontSize:30, fontWeight:900, color:G.gray900, letterSpacing:"-1px" }}>IFDayRate</div>
          <div style={{ fontSize:13, color:G.textMuted, marginTop:4 }}>Registre como foi seu dia</div>
        </div>
        <div style={{ background:G.white, borderRadius:20, padding:"28px 24px", border:`1px solid ${G.gray100}`, boxShadow:"0 4px 24px #00000008" }}>
          <div style={{ display:"flex", marginBottom:20, borderRadius:10, overflow:"hidden", border:`1px solid ${G.gray100}` }}>
            <button
              style={{ flex:1, padding:"10px 0", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:13, background:!isRegister?T.primary:G.gray50, color:!isRegister?"#fff":G.gray500, transition:"all 0.15s" }}
              onClick={() => { setIsRegister(false); setLoginError(""); }}
            >Entrar</button>
            <button
              style={{ flex:1, padding:"10px 0", border:"none", cursor:"pointer", fontFamily:"inherit", fontWeight:700, fontSize:13, background:isRegister?T.primary:G.gray50, color:isRegister?"#fff":G.gray500, transition:"all 0.15s" }}
              onClick={() => { setIsRegister(true); setLoginError(""); }}
            >Criar conta</button>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {isRegister && (
              <input
                style={css.input}
                placeholder="Nome de usuário"
                value={registerName}
                onChange={e => setRegisterName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleRegister()}
              />
            )}
            <input
              style={css.input}
              placeholder="E-mail"
              type="email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (isRegister ? handleRegister() : handleLogin())}
            />
            <input
              style={css.input}
              placeholder="Senha"
              type="password"
              value={loginPass}
              onChange={e => setLoginPass(e.target.value)}
              onKeyDown={e => e.key === "Enter" && (isRegister ? handleRegister() : handleLogin())}
            />
            {loginError && <div style={{ color:"#b91c1c", fontSize:12, marginTop:-4 }}>{loginError}</div>}
            <button
              style={{ ...css.btnPrimary, opacity: loginLoading ? 0.7 : 1 }}
              onClick={isRegister ? handleRegister : handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? "Aguarde..." : isRegister ? "Criar conta" : "Entrar"}
            </button>
          </div>
        </div>
        <div style={{ textAlign:"center", marginTop:20, fontSize:11, color:G.gray300 }}>Instituto Federal · Sistema de Avaliação Diária</div>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // HOME
  // ════════════════════════════════════════════════════════════════
  if (screen === "home") {
    const rc = RATING_COLOR(todayRating);
    return (
      <div style={css.app}>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
        <Topbar/>
        <div style={{ paddingBottom:70 }}>
          <div style={{ padding:"16px 20px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:13, color:G.textMuted }}>Olá, <strong>{user?.name}</strong> {ffMode?"🥀":""}</div>
              <div style={{ fontSize:17, fontWeight:800, color:G.gray900 }}>{today.toLocaleDateString("pt-BR",{weekday:"long"})}, {today.getDate()} de {MONTHS_PT[today.getMonth()]}</div>
            </div>
            <div style={{ background:T.primaryLt, border:`1px solid ${T.primaryMid}`, borderRadius:10, padding:"6px 12px", fontSize:11, fontWeight:700, color:T.primary }}>{new Date().getFullYear()}</div>
          </div>

          {/* Nota de hoje */}
          <div style={{ ...css.card, background:todayRating!==undefined?rc.bg:G.white, border:`1.5px solid ${todayRating!==undefined?rc.border:G.gray100}`, marginTop:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:G.gray500, textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:4 }}>Nota de hoje</div>
                <div style={{ fontSize:68, fontWeight:900, lineHeight:1, color:todayRating!==undefined?rc.text:G.gray100, letterSpacing:"-3px" }}>
                  {todayRating!==undefined ? todayRating.toFixed(1).replace(".",",") : "—"}
                </div>
                {todayRating!==undefined && (
                  <div style={{ marginTop:6, display:"inline-block", background:rc.text+"18", borderRadius:6, padding:"3px 10px", fontSize:12, fontWeight:700, color:rc.text }}>{RATING_LABEL(todayRating)}</div>
                )}
              </div>
              {todayRating!==undefined && (
                <div style={{ width:48, height:48, borderRadius:12, background:rc.text, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:"#fff" }}>
                  {todayRating===10?"✦":todayRating>=8?"✓":todayRating>=6?"→":todayRating>=4?"↓":"✗"}
                </div>
              )}
            </div>
            {todayRating===undefined && (
              <div style={{ marginTop:16 }}>
                <div style={{ fontSize:13, color:G.textMuted, marginBottom:8 }}>Ainda não registrou sua nota hoje</div>
                <div style={{ display:"flex", gap:8 }}>
                  <input style={{ ...css.input, textAlign:"center", fontSize:22, fontWeight:800, flex:1 }} placeholder="0,0" value={ratingInput} onChange={e => setRatingInput(e.target.value)} onKeyDown={e => e.key==="Enter"&&submitRating()}/>
                  <button style={{ ...css.btnPrimary, width:"auto", padding:"11px 20px", fontSize:20 }} onClick={submitRating}>✓</button>
                </div>
                {ratingError && <div style={{ color:"#b91c1c", fontSize:12, marginTop:6 }}>{ratingError}</div>}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ display:"flex", gap:8, margin:"0 14px 4px" }}>
            <StatCard label="Semana" val={weekAvgStr}/>
            <StatCard label="Mês" val={monthAvgStr}/>
            <StatCard label="Geral" val={overallAvgStr}/>
          </div>

          {/* Dia anterior */}
          <div style={css.cardAccent}>
            <div style={{ fontSize:12, fontWeight:700, color:T.primary, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:10 }}>📅 Registrar dia anterior</div>
            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
              <input type="date" style={{ ...css.input, flex:2 }} max={todayKey} value={backdateInput} onChange={e => setBackdateInput(e.target.value)}/>
              <input style={{ ...css.input, flex:1 }} placeholder="Nota" value={backdateVal} onChange={e => setBackdateVal(e.target.value)}/>
            </div>
            {backdateErr && <div style={{ color:"#b91c1c", fontSize:12, marginBottom:8 }}>{backdateErr}</div>}
            <button style={css.btnPrimary} onClick={submitBackdate}>Salvar registro</button>
          </div>

          {/* Últimos 7 dias */}
          <div style={css.sectionLabel}>Últimos 7 dias</div>
          <div style={{ margin:"0 14px", display:"flex", flexDirection:"column", gap:5 }}>
            {[-6,-5,-4,-3,-2,-1,0].map(offset => {
              const d = new Date(today); d.setDate(today.getDate()+offset);
              const key = fmtDate(d); const r = ratings[key]; const c = RATING_COLOR(r);
              return (
                <div key={key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:r!==undefined?c.bg:G.white, border:`1px solid ${r!==undefined?c.border:G.gray100}`, borderRadius:11, padding:"10px 14px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:r!==undefined?c.text:G.gray300 }}/>
                    <div style={{ fontSize:13, fontWeight:600, color:G.gray700 }}>{offset===0?"Hoje":offset===-1?"Ontem":d.toLocaleDateString("pt-BR",{weekday:"short",day:"numeric"})}</div>
                  </div>
                  <div style={{ fontSize:18, fontWeight:800, color:r!==undefined?c.text:G.gray300 }}>{r!==undefined ? r.toFixed(1).replace(".",",") : "—"}</div>
                </div>
              );
            })}
          </div>
        </div>
        <Nav/>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════
  // CALENDÁRIO
  // ════════════════════════════════════════════════════════════════
  if (screen === "calendar") return (
    <div style={css.app}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <Topbar title="Calendário"/>
      <div style={{ paddingBottom:70 }}>
        <div style={css.card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <button style={{ background:G.gray50, border:`1px solid ${G.gray100}`, borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:18, color:G.gray700, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setCalMonth(new Date(calMonth.getFullYear(),calMonth.getMonth()-1,1))}>‹</button>
            <div style={{ fontWeight:700, fontSize:15 }}>{MONTHS_PT[calMonth.getMonth()]} {calMonth.getFullYear()}</div>
            <button style={{ background:G.gray50, border:`1px solid ${G.gray100}`, borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:18, color:G.gray700, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={() => setCalMonth(new Date(calMonth.getFullYear(),calMonth.getMonth()+1,1))}>›</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3, marginBottom:4 }}>
            {DAYS_PT.map((d,i) => <div key={i} style={{ textAlign:"center", fontSize:10, color:G.gray500, padding:"3px 0", fontWeight:700 }}>{d}</div>)}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
            {calDays.map((d,i) => {
              if (!d) return <div key={i}/>;
              const key = fmtDate(d); const r = ratings[key]; const isFuture = d > today; const c = RATING_COLOR(r); const isToday = key === todayKey;
              return (
                <div key={key} onClick={() => !isFuture&&setSelectedDay(key)} style={{ aspectRatio:"1", borderRadius:8, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontSize:11, cursor:isFuture?"default":"pointer", background:r!==undefined?c.bg:isFuture?"#fafafa":G.white, color:r!==undefined?c.text:isFuture?G.gray300:G.gray500, border:isToday?`2px solid ${T.primary}`:r!==undefined?`1px solid ${c.border}`:`1px solid ${G.gray100}`, fontWeight:r!==undefined?700:400, boxSizing:"border-box" }}>
                  <div style={{ fontWeight:isToday?800:undefined }}>{d.getDate()}</div>
                  {r!==undefined && <div style={{ fontSize:8, marginTop:1 }}>{r.toFixed(1).replace(".",",")}</div>}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ ...css.card, padding:"14px 18px" }}>
          <div style={{ fontSize:11, fontWeight:700, color:G.gray500, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:10 }}>Legenda</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {[["0–3","#7c3aed"],["4–5","#ef4444"],["5–6","#eab308"],["6–7","#15803d"],["8–9,9","#16a34a"],["10","#0369a1"]].map(([label,color]) => (
              <div key={label} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11 }}>
                <div style={{ width:12, height:12, borderRadius:3, background:color }}/>
                <span style={{ color:G.gray500, fontWeight:500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {selectedDay && (() => {
          const r = ratings[selectedDay]; const c = RATING_COLOR(r);
          return (
            <div style={{ ...css.card, border:`1.5px solid ${c.border}`, background:c.bg }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:12, color:G.gray500, marginBottom:4, fontWeight:600 }}>{new Date(selectedDay+"T00:00:00").toLocaleDateString("pt-BR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
                  <div style={{ fontSize:52, fontWeight:900, color:r!==undefined?c.text:G.gray300, letterSpacing:"-2px" }}>{r!==undefined ? r.toFixed(1).replace(".",",") : "Sem nota"}</div>
                  {r!==undefined && <div style={{ fontSize:13, color:c.text, fontWeight:600 }}>{RATING_LABEL(r)}</div>}
                </div>
                <button style={{ background:"none", border:"none", color:G.gray500, cursor:"pointer", fontSize:18, padding:4 }} onClick={() => setSelectedDay(null)}>✕</button>
              </div>
            </div>
          );
        })()}
      </div>
      <Nav/>
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // GRUPOS
  // ════════════════════════════════════════════════════════════════
  if (screen === "groups") return (
    <div style={css.app}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <Topbar title="Grupos"/>
      <div style={{ paddingBottom:70 }}>
        <div style={{ display:"flex", gap:8, margin:"10px 14px" }}>
          <div style={{ ...css.cardAccent, flex:1, margin:0, padding:"14px 16px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:T.primary, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Criar grupo</div>
            <input style={{ ...css.input, marginBottom:8 }} placeholder="Nome do grupo" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}/>
            <button style={css.btnPrimary} onClick={createGroup}>Criar</button>
          </div>
          <div style={{ ...css.card, flex:1, margin:0, padding:"14px 16px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:G.gray500, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Entrar</div>
            <input style={{ ...css.input, marginBottom:8 }} placeholder="Código do grupo" value={joinCode} onChange={e => setJoinCode(e.target.value)}/>
            <button style={css.btnOutline} onClick={joinGroup}>Entrar</button>
          </div>
        </div>

        {groupsMsg && (
          <div style={{ margin:"0 14px 4px", padding:"10px 14px", borderRadius:10, background:groupsMsg.includes("!")?T.primaryLt:"#fef2f2", border:`1px solid ${groupsMsg.includes("!")?T.primaryMid:"#fca5a5"}`, fontSize:13, fontWeight:600, color:groupsMsg.includes("!")?T.primary:"#b91c1c" }}>
            {groupsMsg}
          </div>
        )}

        <div style={css.sectionLabel}>Meus grupos</div>

        {loadingGroups && (
          <div style={{ ...css.card, textAlign:"center", color:G.gray300, fontSize:13 }}>
            Carregando grupos...
          </div>
        )}

        {!loadingGroups && groupDetails.length === 0 && groups.length === 0 && (
          <div style={{ ...css.card, textAlign:"center", color:G.gray300, fontSize:13, padding:"28px 20px" }}>
            Você ainda não faz parte de nenhum grupo.{"\n"}Crie ou entre em um usando os campos acima.
          </div>
        )}

        {!loadingGroups && (groupDetails.length > 0 ? groupDetails : groups).map((group) => {
          const members = group.members ?? [];
          const todayAvgRaw = group.todayAvg ??
            (members.filter(m => m.todayRating != null).length
              ? members.filter(m => m.todayRating != null).reduce((s, m) => s + m.todayRating, 0) / members.filter(m => m.todayRating != null).length
              : null);
          const c = RATING_COLOR(todayAvgRaw);
          return (
            <div key={group.id} style={css.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: members.length ? 14 : 0 }}>
                <div>
                  <div style={{ fontWeight:800, fontSize:16, color:G.gray900 }}>{group.name}</div>
                  <div style={{ fontSize:11, color:G.gray500, marginTop:2 }}>
                    {members.length || group.memberCount || 0} membros
                    {group.inviteCode && <> · <span style={{ fontFamily:"monospace", color:T.primary, fontWeight:700 }}>{group.inviteCode}</span></>}
                  </div>
                </div>
                {todayAvgRaw != null && (
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:10, color:G.gray500, textTransform:"uppercase", letterSpacing:"0.5px" }}>Hoje</div>
                    <div style={{ fontSize:28, fontWeight:900, color:c.text }}>{todayAvgRaw.toFixed(1).replace(".",",")}</div>
                  </div>
                )}
              </div>
              {members.length > 0 && (
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  {members.map(member => {
                    const mc = RATING_COLOR(member.todayRating ?? null);
                    return (
                      <div key={member.id || member.name} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 12px", borderRadius:9, background:mc.bg, border:`1px solid ${mc.border}` }}>
                        <div style={{ fontSize:13, fontWeight:500 }}>{member.name}</div>
                        <div style={{ fontWeight:800, fontSize:15, color:mc.text }}>
                          {member.todayRating != null ? member.todayRating.toFixed(1).replace(".",",") : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Nav/>
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // PERFIL
  // ════════════════════════════════════════════════════════════════
  if (screen === "profile") return (
    <div style={css.app}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
      <Topbar title="Perfil"/>
      <div style={{ paddingBottom:70 }}>

        {/* Header */}
        <div style={{ background:T.headerBg, padding:"24px 20px 36px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {ffMode ? (
              <div style={{ width:60, height:60, borderRadius:16, overflow:"hidden", border:"3px solid #fda4af", flexShrink:0 }}>
                <img src={FF_PHOTO_PATH} alt="FF" style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top" }}/>
              </div>
            ) : (
              <div style={{ width:60, height:60, borderRadius:16, background:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:900, color:T.primary, flexShrink:0 }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ fontSize:20, fontWeight:800, color:"#fff" }}>{user?.name} {ffMode?"🥀":""}</div>
              <div style={{ fontSize:12, color:T.accent, marginTop:2 }}>{Object.keys(ratings).length} dias registrados</div>
              {ffMode && <div style={{ marginTop:4, background:"#fff2", borderRadius:6, padding:"2px 8px", display:"inline-block", fontSize:10, fontWeight:700, color:"#fda4af" }}>✦ Femme Fatale</div>}
            </div>
          </div>
        </div>

        {/* Stats com overlap */}
        <div style={{ display:"flex", gap:8, margin:"-16px 14px 0", position:"relative", zIndex:10 }}>
          <StatCard label="Semana" val={weekAvgStr}/>
          <StatCard label="Mês" val={monthAvgStr}/>
          <StatCard label="Geral" val={overallAvgStr}/>
        </div>

        {/* Distribuição */}
        <div style={{ ...css.card, marginTop:16 }}>
          <div style={{ fontSize:12, fontWeight:700, color:G.gray500, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:14 }}>Distribuição de notas</div>
          {[["10 ✦",r=>r===10,"#0369a1"],["8–9,9",r=>r>=8&&r<10,"#16a34a"],["6–7,9",r=>r>=6&&r<8,"#15803d"],["5–5,9",r=>r>=5&&r<6,"#854d0e"],["4–4,9",r=>r>=4&&r<5,"#b91c1c"],["0–3,9",r=>r<4,"#6d28d9"]].map(([label,fn,color]) => {
            const count = allVals.filter(fn as any).length;
            const pct = allVals.length ? (count / allVals.length) * 100 : 0;
            return (
              <div key={label as string} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9 }}>
                <div style={{ fontSize:11, color:G.gray500, width:46, fontWeight:600 }}>{label}</div>
                <div style={{ flex:1, height:7, borderRadius:4, background:G.gray50, overflow:"hidden", border:`1px solid ${G.gray100}` }}>
                  <div style={{ width:`${pct}%`, height:"100%", borderRadius:4, background:color as string }}/>
                </div>
                <div style={{ fontSize:11, color:G.gray500, width:16, textAlign:"right", fontWeight:600 }}>{count}</div>
              </div>
            );
          })}
        </div>

        {/* Conta */}
        <div style={css.card}>
          <div style={{ fontSize:12, fontWeight:700, color:G.gray500, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>Conta</div>

          {/* Alterar nome de usuário */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:13, fontWeight:600, color:G.gray700, marginBottom:8 }}>Alterar nome de usuário</div>
            <div style={{ display:"flex", gap:8 }}>
              <input style={{ ...css.input, flex:1 }} placeholder="Novo nome de usuário" value={newUsername} onChange={e => setNewUsername(e.target.value)}/>
              <button style={{ ...css.btnPrimary, width:"auto", padding:"11px 16px", fontSize:13 }} onClick={() => {
                if (newUsername.trim()) {
                  const updated = { ...user, name: newUsername.trim() };
                  setUser(updated);
                  localStorage.setItem("ifdr_user", JSON.stringify(updated));
                  setUsernameMsg("Nome atualizado!");
                  setNewUsername("");
                  setTimeout(() => setUsernameMsg(""), 2500);
                }
              }}>Salvar</button>
            </div>
            {usernameMsg && <div style={{ color:T.primary, fontSize:12, marginTop:6, fontWeight:600 }}>{usernameMsg}</div>}
          </div>

          <div style={{ height:1, background:G.gray100, margin:"4px 0 14px" }}/>

          {[["🔒 Alterar senha"],["🔔 Notificações"]].map(([item]) => (
            <div key={item} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 0", borderBottom:`1px solid ${G.gray50}`, fontSize:14, color:G.gray700, cursor:"pointer" }}>
              {item} <span style={{ color:G.gray300 }}>›</span>
            </div>
          ))}
        </div>

        {/* Modo Femme Fatale */}
        <div style={{ ...css.card, border: ffMode ? "1.5px solid #fecdd3" : `1px solid ${G.gray100}`, background: ffMode ? "#fff1f2" : G.white }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            <span style={{ fontSize:20 }}>🥀</span>
            <div>
              <div style={{ fontSize:14, fontWeight:800, color: ffMode ? "#881337" : G.gray700 }}>Modo Femme Fatale</div>
              <div style={{ fontSize:11, color: ffMode ? "#be123c88" : G.gray300 }}>{ffMode ? "✦ Ativado nesta conta" : "Insira o código secreto para ativar"}</div>
            </div>
          </div>

          {ffMode ? (
            <div style={{ background:"#fff", border:"1px solid #fecdd3", borderRadius:10, padding:"12px 14px", textAlign:"center" }}>
              <div style={{ fontSize:13, color:"#be123c", fontWeight:600 }}>🥀 Modo ativo permanentemente nesta conta</div>
              <div style={{ fontSize:11, color:"#be123c88", marginTop:4 }}>O design femme fatale está habilitado para você</div>
            </div>
          ) : (
            <>
              <div style={{ display:"flex", gap:8 }}>
                <input
                  style={{ ...css.input, flex:1, fontSize:13 }}
                  type="password"
                  placeholder="Código especial"
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value)}
                  onKeyDown={e => e.key==="Enter"&&submitCode()}
                />
                <button style={{ ...css.btnPrimary, width:"auto", padding:"11px 16px", fontSize:13, background:"#be123c", boxShadow:"0 2px 8px #be123c33" }} onClick={submitCode}>Ativar</button>
              </div>
              {codeErr && <div style={{ color:"#b91c1c", fontSize:12, marginTop:6 }}>{codeErr}</div>}
            </>
          )}
        </div>

        <div style={{ margin:"0 14px 8px" }}>
          <button style={{ ...css.btnOutline, color:"#b91c1c", borderColor:"#fca5a5" }} onClick={handleLogout}>Sair da conta</button>
        </div>
      </div>
      <Nav/>
    </div>
  );
}

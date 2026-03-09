import { useState, useEffect, useRef } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ── Google Sheets config ──────────────────────────────────────────────────────
const SHEET_ID  = "1GFHDfNERLpVwrs5MM8OyXRhSEsZbbdfzXX_H4QsF4BA";
const SHEETS_KEY = "AIzaSyDJ2sS4eMJAW9yjbzxkOpJF17IVS1UnljE";
const BASE_URL  = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values`;

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  bg: "#07070f", surface: "#0e0e1c", surfaceAlt: "#13131f", border: "#1c1c2e",
  teal: "#00D4AA", blue: "#4A9EFF", red: "#FF5E7A", amber: "#FFB547",
  purple: "#9B7FFF", text: "#e8e8f0", textMid: "#888899", textDim: "#44445a",
};
const mono  = { fontFamily: "'DM Mono', monospace" };
const bebas = { fontFamily: "'Bebas Neue', cursive" };

const css = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:#0e0e1c}
::-webkit-scrollbar-thumb{background:#2a2a42;border-radius:2px}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.5)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.fu{animation:fadeUp .3s ease forwards}
.tb{transition:color .15s,border-color .15s;cursor:pointer}
.tb:hover{color:#00D4AA !important}
input[type=range]{-webkit-appearance:none;appearance:none;height:4px;border-radius:2px;outline:none;cursor:pointer}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;cursor:pointer}
.ci{background:#0a0a16;border:1px solid #1c1c2e;border-radius:8px;color:#e8e8f0;font-family:'DM Sans',sans-serif;font-size:14px;transition:border-color .2s}
.ci:focus{outline:none;border-color:#00D4AA44}
.card{transition:border-color .2s}
.card:hover{border-color:#2a2a42 !important}
`;

// ── Shared UI components ──────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div className="card" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22, ...style }}>
    {children}
  </div>
);

const KPI = ({ label, value, unit, sub, color, delta }) => (
  <div className="card" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 14, padding: "16px 20px", position: "relative", overflow: "hidden" }}>
    <div style={{ ...mono, fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 2 }}>{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 6 }}>
      <span style={{ ...bebas, fontSize: 32, color: T.text, letterSpacing: 1 }}>{value}</span>
      <span style={{ ...mono, fontSize: 12, color: T.textMid }}>{unit}</span>
    </div>
    {delta !== undefined && (
      <div style={{ ...mono, fontSize: 11, color: delta <= 0 ? T.teal : T.red, marginTop: 2 }}>
        {delta <= 0 ? "▼" : "▲"} {Math.abs(delta)} {unit}
      </div>
    )}
    {sub && <div style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>{sub}</div>}
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, borderRadius: "0 0 14px 14px" }} />
  </div>
);

const ST = ({ children, sub }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ ...bebas, fontSize: 19, letterSpacing: 1.5, color: T.text }}>{children}</div>
    {sub && <div style={{ ...mono, fontSize: 9, color: T.textDim, letterSpacing: 2, marginTop: 2 }}>{sub}</div>}
  </div>
);

const Pill = ({ children, color = T.teal }) => (
  <span style={{ background: `${color}18`, color, border: `1px solid ${color}30`, borderRadius: 5, padding: "2px 9px", fontSize: 11, ...mono }}>{children}</span>
);

const Tag = ({ type }) => {
  const m = { Push: T.red, Pull: T.blue, Legs: T.teal, Cardio: T.amber };
  return <Pill color={m[type] || T.textMid}>{type}</Pill>;
};

const CTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0a0a18", border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 14px", ...mono, fontSize: 12 }}>
      <div style={{ color: T.textDim, marginBottom: 5 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, display: "flex", gap: 10, justifyContent: "space-between" }}>
          <span>{p.name}</span><span style={{ fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const Slider = ({ label, value, onChange, min = 1, max = 10, color = T.teal, unit = "/10" }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ ...mono, fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1.5 }}>{label}</span>
        <span style={{ ...bebas, fontSize: 20, color, letterSpacing: 1 }}>{value}<span style={{ ...mono, fontSize: 10, color: T.textDim }}>{unit}</span></span>
      </div>
      <input type="range" min={min} max={max} step={unit === " hrs" ? 0.5 : 0.1} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: "100%", background: `linear-gradient(90deg, ${color} ${pct}%, #1c1c2e ${pct}%)` }} />
      <style>{`input[type=range]::-webkit-slider-thumb{background:${color};box-shadow:0 0 6px ${color}88}`}</style>
    </div>
  );
};

const Photo = ({ photo, size = 160, selected, onClick }) => (
  <div onClick={onClick} style={{ borderRadius: 10, overflow: "hidden", cursor: onClick ? "pointer" : "default",
    border: selected ? `2px solid ${T.teal}` : `1px solid ${T.border}`,
    transition: "all .2s", transform: selected ? "scale(1.02)" : "scale(1)", position: "relative" }}>
    <div style={{ height: size, background: `linear-gradient(160deg, ${photo.color || "#0a2020"} 0%, #07070f 100%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {photo.file_url
        ? <img src={photo.file_url} alt={photo.date} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <><div style={{ fontSize: size > 200 ? 40 : 24, opacity: 0.25 }}>📷</div><div style={{ ...mono, fontSize: 9, color: T.textDim }}>PHOTO</div></>
      }
    </div>
    <div style={{ padding: "8px 10px", background: T.surfaceAlt }}>
      <div style={{ ...mono, fontSize: 10, color: T.textMid }}>{photo.date}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
        <span style={{ ...mono, fontSize: 10, color: T.teal }}>{photo.weight}kg</span>
        <span style={{ ...mono, fontSize: 10, color: T.red }}>{photo.fat}%bf</span>
      </div>
    </div>
    {selected && <div style={{ position: "absolute", top: 6, right: 6, background: T.teal, borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#000" }}>✓</div>}
  </div>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const avg = (arr, key) => arr.length ? Math.round(arr.reduce((s, d) => s + (d[key] || 0), 0) / arr.length) : 0;
const fmtNum = n => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

// ── Main component ────────────────────────────────────────────────────────────
export default function PhysiqueOS() {
  const [tab, setTab]               = useState("overview");
  const [photoView, setPhotoView]   = useState("grid");
  const [compareA, setCompareA]     = useState(0);
  const [compareB, setCompareB]     = useState(1);
  const [sliderPos, setSliderPos]   = useState(50);
  const [ci, setCi]                 = useState({ mood: 7, sleep: 7.5, energy: 7, stress: 4, water: 2.5, notes: "" });
  const [ciDone, setCiDone]         = useState(false);
  const [ciSaving, setCiSaving]     = useState(false);
  const [messages, setMessages]     = useState([{
    role: "assistant",
    content: "Hey! I'm your physique coach. I have full access to your body composition, workouts, nutrition, steps, and daily check-ins. Ask me anything — or just tell me how today went."
  }]);
  const [chatInput, setChatInput]   = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEnd = useRef(null);

  // ── Sheet data state ──────────────────────────────────────────────────────
  const [weightData,    setWeightData]    = useState([]);
  const [stepsData,     setStepsData]     = useState([]);
  const [nutritionData, setNutritionData] = useState([]);
  const [workouts,      setWorkouts]      = useState([]);
  const [checkins,      setCheckins]      = useState([]);
  const [photos,        setPhotos]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [fetchError,    setFetchError]    = useState(null);

  // ── Fetch all tabs on mount ───────────────────────────────────────────────
  useEffect(() => {
    const PHOTO_COLORS = ["#0a2020","#0a1020","#0a1030","#102010","#201010","#201020"];
    const fetchAll = async () => {
      try {
        const tabs = ["weight!A:E","checkins!A:G","steps!A:B","nutrition!A:E","workouts!A:E","photos!A:D"];
        const responses = await Promise.all(
          tabs.map(t => fetch(`${BASE_URL}/${encodeURIComponent(t)}?key=${SHEETS_KEY}`))
        );
        const jsons = await Promise.all(responses.map(r => r.json()));
        const [wRaw, cRaw, sRaw, nRaw, wkRaw, pRaw] = jsons.map(j => (j.values || []).slice(1));

        setWeightData(wRaw
          .map(r => ({ date: r[0]||"", weight: parseFloat(r[1])||0, fat: parseFloat(r[2])||0, muscle: parseFloat(r[3])||0, water: parseFloat(r[4])||0 }))
          .filter(r => r.date));

        setCheckins(cRaw
          .map(r => ({ date: r[0]||"", mood: parseFloat(r[1])||0, sleep: parseFloat(r[2])||0, energy: parseFloat(r[3])||0, stress: parseFloat(r[4])||0, water: parseFloat(r[5])||0, notes: r[6]||"" }))
          .filter(r => r.date));

        setStepsData(sRaw
          .map(r => ({ day: r[0]||"", steps: parseInt(r[1])||0 }))
          .filter(r => r.day));

        setNutritionData(nRaw
          .map(r => ({ day: r[0]||"", calories: parseInt(r[1])||0, protein: parseInt(r[2])||0, carbs: parseInt(r[3])||0, fat: parseInt(r[4])||0 }))
          .filter(r => r.day));

        setWorkouts(wkRaw
          .map(r => ({ date: r[0]||"", type: r[1]||"", duration: parseInt(r[2])||0, volume: parseInt(r[3])||0, exercises: r[4] ? r[4].split("|").map(e => e.trim()) : [] }))
          .filter(r => r.date));

        setPhotos(pRaw
          .map((r, i) => ({ date: r[0]||"", weight: parseFloat(r[1])||0, fat: parseFloat(r[2])||0, file_url: r[3]||"", color: PHOTO_COLORS[i % PHOTO_COLORS.length] }))
          .filter(r => r.date));

      } catch (err) {
        console.error("Sheets fetch error:", err);
        setFetchError("Could not load data — make sure the sheet is shared publicly (Anyone with link → Viewer).");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chatLoading]);

  // ── Derived values ────────────────────────────────────────────────────────
  const EMPTY_ENTRY = { weight: 0, fat: 0, muscle: 0, water: 0, date: "-" };
  const latest       = weightData.length > 0 ? weightData[weightData.length - 1] : EMPTY_ENTRY;
  const prev         = weightData.length > 1 ? weightData[weightData.length - 2] : latest;
  const latestCheckin = checkins.length > 0 ? checkins[0] : { date: "-", mood: 0, sleep: 0, energy: 0, stress: 0, water: 0, notes: "" };
  const latestWorkout = workouts.length > 0 ? workouts[0] : null;
  const todaySteps    = stepsData.length > 0 ? stepsData[stepsData.length - 1].steps : 0;
  const todayCalories = nutritionData.length > 0 ? nutritionData[nutritionData.length - 1].calories : 0;
  const stepsGoal     = 10000;
  const calorieGoal   = 2200;
  const totalVolume   = workouts.reduce((s, w) => s + w.volume, 0);
  const avgDuration   = workouts.length > 0 ? Math.round(workouts.reduce((s, w) => s + w.duration, 0) / workouts.length) : 0;
  const safeCompareA  = Math.min(compareA, Math.max(0, photos.length - 1));
  const safeCompareB  = Math.min(compareB, Math.max(0, photos.length - 1));

  const TABS = ["overview", "body", "nutrition", "training", "photos", "checkin", "coach"];

  // ── Save check-in → append to Google Sheet ────────────────────────────────
  const submitCheckin = async () => {
    setCiSaving(true);
    try {
      const today = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/checkins!A:G:append?valueInputOption=USER_ENTERED&key=${SHEETS_KEY}`;
      await fetch(appendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [[today, ci.mood, ci.sleep, ci.energy, ci.stress, ci.water, ci.notes]] }),
      });
      // Refresh checkins from sheet
      const res  = await fetch(`${BASE_URL}/${encodeURIComponent("checkins!A:G")}?key=${SHEETS_KEY}`);
      const data = await res.json();
      setCheckins((data.values || []).slice(1)
        .map(r => ({ date: r[0]||"", mood: parseFloat(r[1])||0, sleep: parseFloat(r[2])||0, energy: parseFloat(r[3])||0, stress: parseFloat(r[4])||0, water: parseFloat(r[5])||0, notes: r[6]||"" }))
        .filter(r => r.date));
    } catch (err) {
      console.warn("Check-in write failed (sheet may need edit permissions):", err);
    } finally {
      setCiDone(true);
      setCiSaving(false);
    }
  };

  const buildCtx = () => `You are a personal physique coach. You have access to real data below. Be specific, concise, reference actual numbers. Max 3 paragraphs.
BODY COMPOSITION: ${weightData.map(d => `${d.date}: ${d.weight}kg | ${d.fat}%fat | ${d.muscle}kg muscle`).join("\n")}
RECENT CHECK-INS: ${checkins.slice(0, 7).map(c => `${c.date}: mood ${c.mood}/10, sleep ${c.sleep}h, energy ${c.energy}/10, stress ${c.stress}/10, water ${c.water}L — "${c.notes}"`).join("\n")}
TODAY'S CHECK-IN: mood ${ci.mood}/10 | sleep ${ci.sleep}h | energy ${ci.energy}/10 | stress ${ci.stress}/10 | water ${ci.water}L | "${ci.notes}"
THIS WEEK STEPS: ${stepsData.map(d => `${d.day}:${d.steps}`).join(", ")}
THIS WEEK NUTRITION: ${nutritionData.map(d => `${d.day}:${d.calories}kcal,${d.protein}gP`).join(", ")}
RECENT WORKOUTS: ${workouts.slice(0, 5).map(w => `${w.date} ${w.type} ${w.duration}min ${w.volume}kg`).join(" | ")}`;

  const send = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: buildCtx(), messages: next.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data  = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Could not get a response.";
      setMessages(p => [...p, { role: "assistant", content: reply }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Connection error." }]);
    }
    setChatLoading(false);
  };

  // ── Loading / error banner ────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <style>{css}</style>
      <div style={{ width: 36, height: 36, border: `3px solid ${T.border}`, borderTopColor: T.teal, borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <div style={{ ...mono, fontSize: 12, color: T.textDim, letterSpacing: 2 }}>LOADING FROM GOOGLE SHEETS…</div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'DM Sans',sans-serif" }}>
      <style>{css}</style>

      {fetchError && (
        <div style={{ background: `${T.red}18`, border: `1px solid ${T.red}33`, padding: "10px 24px", ...mono, fontSize: 11, color: T.red, letterSpacing: 1 }}>
          ⚠ {fetchError}
        </div>
      )}

      {/* HEADER */}
      <header style={{ position: "sticky", top: 0, zIndex: 200, background: `${T.bg}ee`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 58 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${T.teal},${T.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚡</div>
          <div>
            <div style={{ ...bebas, fontSize: 19, letterSpacing: 2.5, lineHeight: 1 }}>PHYSIQUE OS</div>
            <div style={{ ...mono, fontSize: 8, color: T.textDim, letterSpacing: 3 }}>PERSONAL ANALYTICS</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 0 }}>
          {TABS.map(t => (
            <button key={t} className="tb" onClick={() => setTab(t)} style={{ background: "none", border: "none", ...mono, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: tab === t ? T.teal : T.textDim, padding: "6px 11px", borderBottom: tab === t ? `2px solid ${T.teal}` : "2px solid transparent" }}>
              {t === "coach" ? "⚡ coach" : t}
            </button>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: T.teal, boxShadow: `0 0 7px ${T.teal}`, animation: "pulse 2s infinite" }} />
          <span style={{ ...mono, fontSize: 10, color: T.textDim }}>LIVE · SHEETS</span>
        </div>
      </header>

      <main style={{ padding: "24px 24px 60px", maxWidth: 1300, margin: "0 auto" }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="fu">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 11, marginBottom: 20 }}>
              <KPI label="Body Weight"  value={latest.weight}           unit="kg"   color={T.teal}   delta={+(latest.weight - prev.weight).toFixed(1)} />
              <KPI label="Body Fat"     value={`${latest.fat}%`}        unit=""     color={T.red}    delta={+(latest.fat - prev.fat).toFixed(1)} />
              <KPI label="Muscle Mass"  value={latest.muscle}           unit="kg"   color={T.blue}   delta={-(+(latest.muscle - prev.muscle).toFixed(1))} />
              <KPI label="Steps Today"  value={todaySteps.toLocaleString()} unit="" color={T.amber}  sub={`${Math.round((todaySteps / stepsGoal) * 100)}% of ${(stepsGoal/1000).toFixed(0)}k goal`} />
              <KPI label="Calories"     value={todayCalories.toLocaleString()} unit="kcal" color={T.purple} sub={`${todayCalories < calorieGoal ? calorieGoal - todayCalories : todayCalories - calorieGoal} ${todayCalories < calorieGoal ? "under" : "over"} target`} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14, marginBottom: 14 }}>
              <Card>
                <ST sub="RENPHO · ROLLING">WEIGHT TREND</ST>
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={weightData}>
                    <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.teal} stopOpacity={0.25} /><stop offset="95%" stopColor={T.teal} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                    <YAxis domain={["auto","auto"]} tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CTip />} />
                    <Area type="monotone" dataKey="weight" stroke={T.teal} strokeWidth={2.5} fill="url(#wg)" dot={{ fill: T.teal, r: 3 }} name="weight" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <ST sub="THIS WEEK">DAILY STEPS</ST>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={stepsData} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CTip />} />
                    <ReferenceLine y={stepsGoal} stroke={`${T.amber}44`} strokeDasharray="4 4" />
                    <Bar dataKey="steps" fill={T.amber} radius={[4,4,0,0]} name="steps" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <ST sub="LATEST">LATEST CHECK-IN</ST>
                  <Pill color={T.teal}>DAILY</Pill>
                </div>
                {checkins.length === 0 ? (
                  <div style={{ ...mono, fontSize: 12, color: T.textDim, padding: "20px 0", textAlign: "center" }}>No check-ins yet — add your first on the Check-in tab.</div>
                ) : (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
                      {[["Mood", latestCheckin.mood, "/10", T.amber], ["Sleep", latestCheckin.sleep, "hrs", T.blue], ["Energy", latestCheckin.energy, "/10", T.teal]].map(([l, v, u, c]) => (
                        <div key={l} style={{ background: T.surfaceAlt, borderRadius: 9, padding: "11px 8px", textAlign: "center" }}>
                          <div style={{ ...bebas, fontSize: 28, color: c, lineHeight: 1 }}>{v}</div>
                          <div style={{ ...mono, fontSize: 9, color: T.textDim, textTransform: "uppercase", marginTop: 3 }}>{l}{u}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      {[["Stress", latestCheckin.stress, "/10", T.red], ["Water", latestCheckin.water, "L", T.purple]].map(([l, v, u, c]) => (
                        <div key={l} style={{ background: T.surfaceAlt, borderRadius: 9, padding: "9px", textAlign: "center" }}>
                          <div style={{ ...bebas, fontSize: 22, color: c, lineHeight: 1 }}>{v}</div>
                          <div style={{ ...mono, fontSize: 9, color: T.textDim, textTransform: "uppercase", marginTop: 2 }}>{l} {u}</div>
                        </div>
                      ))}
                    </div>
                    {latestCheckin.notes && (
                      <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: "11px 13px", fontSize: 13, color: T.textMid, lineHeight: 1.7, fontStyle: "italic" }}>
                        "{latestCheckin.notes}"
                      </div>
                    )}
                  </>
                )}
              </Card>
              <Card>
                {latestWorkout ? (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <ST sub={`${latestWorkout.date} · STRONG APP`}>LAST WORKOUT</ST>
                      <Tag type={latestWorkout.type} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      {[["Duration", latestWorkout.duration, "min", T.amber], ["Volume", `${(latestWorkout.volume / 1000).toFixed(1)}k`, "kg", T.amber]].map(([l, v, u, c]) => (
                        <div key={l} style={{ background: T.surfaceAlt, borderRadius: 9, padding: "11px 13px" }}>
                          <div style={{ ...bebas, fontSize: 28, color: c }}>{v}</div>
                          <div style={{ ...mono, fontSize: 9, color: T.textDim, textTransform: "uppercase" }}>{l} ({u})</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {latestWorkout.exercises.map((ex, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: T.textMid }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.amber, flexShrink: 0 }} />{ex}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", ...mono, fontSize: 12, color: T.textDim }}>No workouts logged yet.</div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── BODY ── */}
        {tab === "body" && (
          <div className="fu">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 11, marginBottom: 20 }}>
              <KPI label="Current Weight" value={latest.weight}          unit="kg" color={T.teal}   delta={+(latest.weight - prev.weight).toFixed(1)} />
              <KPI label="Body Fat"       value={`${latest.fat}%`}       unit=""   color={T.red} />
              <KPI label="Muscle Mass"    value={`${latest.muscle}kg`}   unit=""   color={T.blue} />
              <KPI label="Body Water"     value={`${latest.water}%`}     unit=""   color={T.purple} />
            </div>
            <Card>
              <ST sub="RENPHO · ALL METRICS OVER TIME">COMPOSITION TREND</ST>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CTip />} />
                  <Line type="monotone" dataKey="weight" stroke={T.teal}   strokeWidth={2.5} dot={{ r: 3 }} name="weight" />
                  <Line type="monotone" dataKey="muscle" stroke={T.blue}   strokeWidth={2}   dot={{ r: 3 }} name="muscle" />
                  <Line type="monotone" dataKey="fat"    stroke={T.red}    strokeWidth={2}   dot={{ r: 3 }} name="fat%" />
                  <Line type="monotone" dataKey="water"  stroke={T.purple} strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="water%" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 18, marginTop: 12, justifyContent: "center" }}>
                {[["Weight", T.teal], ["Muscle", T.blue], ["Fat %", T.red], ["Water %", T.purple]].map(([l, c]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, ...mono, fontSize: 11, color: T.textDim }}>
                    <div style={{ width: 16, height: 2, background: c, borderRadius: 2 }} />{l}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        i}

        {/* ── NUTRITION ── */}
        {tab === "nutrition" && (
          <div className="fu">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 11, marginBottom: 20 }}>
              <KPI label="Avg Calories" value={avg(nutritionData,"calories").toLocaleString()} unit="kcal" color={T.amber}  sub={`Goal: ${calorieGoal.toLocaleString()}`} />
              <KPI label="Avg Protein"  value={`${avg(nutritionData,"protein")}g`}             unit=""     color={T.teal}   sub="Goal: 175g" />
              <KPI label="Avg Carbs"    value={`${avg(nutritionData,"carbs")}g`}               unit=""     color={T.blue}   sub="Goal: 250g" />
              <KPI label="Avg Fat"      value={`${avg(nutritionData,"fat")}g`}                 unit=""     color={T.red}    sub="Goal: 75g" />
            </div>
            <Card>
              <ST sub="MYFITNESSPAL · THIS WEEK">MACRO BREAKDOWN</ST>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={nutritionData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CTip />} />
                  <ReferenceLine y={calorieGoal} stroke={`${T.amber}55`} strokeDasharray="5 3" />
                  <Bar dataKey="protein" stackId="a" fill={T.teal}               name="protein" />
                  <Bar dataKey="carbs"   stackId="a" fill={T.blue}               name="carbs" />
                  <Bar dataKey="fat"     stackId="a" fill={T.red} radius={[4,4,0,0]} name="fat" />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", gap: 18, marginTop: 12, justifyContent: "center" }}>
                {[["Protein", T.teal], ["Carbs", T.blue], ["Fat", T.red]].map(([l, c]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, ...mono, fontSize: 11, color: T.textDim }}>
                    <div style={{ width: 12, height: 12, background: c, borderRadius: 3 }} />{l}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── TRAINING ── */}
        {tab === "training" && (
          <div className="fu">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 11, marginBottom: 20 }}>
              <KPI label="Total Sessions"  value={workouts.length}              unit=""    color={T.amber} />
              <KPI label="Total Volume"    value={fmtNum(totalVolume)}           unit="kg"  color={T.blue} />
              <KPI label="Avg Duration"    value={avgDuration}                   unit="min" color={T.teal} />
              <KPI label="Types Logged"    value={[...new Set(workouts.map(w => w.type))].length} unit="" color={T.red} />
            </div>
            {workouts.length === 0 ? (
              <Card><div style={{ textAlign: "center", ...mono, fontSize: 12, color: T.textDim, padding: 32 }}>No workouts logged yet.</div></Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {workouts.map((w, i) => (
                  <Card key={i} style={{ display: "grid", gridTemplateColumns: "100px 65px 65px 70px 1fr", alignItems: "center", gap: 14, padding: "14px 20px" }}>
                    <div style={{ ...mono, fontSize: 12, color: T.textMid }}>{w.date}</div>
                    <Tag type={w.type} />
                    <div style={{ ...mono, fontSize: 12, color: T.textMid }}>{w.duration}m</div>
                    <div style={{ ...mono, fontSize: 12, color: T.textMid }}>{(w.volume / 1000).toFixed(1)}k kg</div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {w.exercises.slice(0, 3).map((ex, j) => (
                        <span key={j} style={{ fontSize: 12, color: T.textDim, background: T.surfaceAlt, borderRadius: 5, padding: "2px 8px" }}>{ex}</span>
                      ))}
                      {w.exercises.length > 3 && <span style={{ fontSize: 12, color: T.textDim }}>+{w.exercises.length - 3}</span>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PHOTOS ── */}
        {tab === "photos" && (
          <div className="fu">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <ST sub="GOOGLE SHEETS · file_url COLUMN">PROGRESS PHOTOS</ST>
              <div style={{ display: "flex", gap: 8 }}>
                {["grid", "compare", "slider"].map(v => (
                  <button key={v} onClick={() => setPhotoView(v)} style={{ ...mono, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", background: photoView === v ? `${T.teal}18` : "none", border: `1px solid ${photoView === v ? T.teal : T.border}`, color: photoView === v ? T.teal : T.textDim, borderRadius: 7, padding: "6px 13px", cursor: "pointer", transition: "all .15s" }}>{v}</button>
                ))}
              </div>
            </div>
            {photos.length === 0 ? (
              <Card><div style={{ textAlign: "center", ...mono, fontSize: 12, color: T.textDim, padding: 32 }}>No photos yet — add rows to the photos tab in your Google Sheet (date, weight, fat%, file_url).</div></Card>
            ) : (
              <>
                {photoView === "grid" && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                    {photos.map((p, i) => <Photo key={i} photo={p} size={160} />)}
                  </div>
                )}
                {photoView === "compare" && (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 16 }}>
                      {[["PHOTO A", safeCompareA, setCompareA], ["PHOTO B", safeCompareB, setCompareB]].map(([label, val, setter]) => (
                        <div key={label}>
                          <div style={{ ...mono, fontSize: 10, color: T.textDim, letterSpacing: 2, marginBottom: 8 }}>SELECT {label}</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 }}>
                            {photos.map((p, i) => <Photo key={i} photo={p} size={100} selected={val === i} onClick={() => setter(i)} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                      <Photo photo={photos[safeCompareA]} size={260} />
                      <Photo photo={photos[safeCompareB]} size={260} />
                    </div>
                    <Card style={{ marginTop: 12 }}>
                      <div style={{ display: "flex", gap: 28 }}>
                        {[
                          ["Weight Δ", `${(photos[safeCompareA].weight - photos[safeCompareB].weight).toFixed(1)} kg`, T.teal],
                          ["Fat % Δ",  `${(photos[safeCompareA].fat    - photos[safeCompareB].fat   ).toFixed(1)}%`,  T.red],
                          ["Time span", `${Math.abs(safeCompareB - safeCompareA)} entries`, T.blue],
                        ].map(([l, v, c]) => (
                          <div key={l}>
                            <div style={{ ...bebas, fontSize: 24, color: c }}>{v}</div>
                            <div style={{ ...mono, fontSize: 10, color: T.textDim, textTransform: "uppercase" }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
                {photoView === "slider" && (
                  <div>
                    <div style={{ display: "flex", gap: 14, marginBottom: 16, justifyContent: "center", alignItems: "center" }}>
                      {[["BEFORE", safeCompareB, setCompareB], ["AFTER", safeCompareA, setCompareA]].map(([label, val, setter]) => (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ ...mono, fontSize: 10, color: T.textDim }}>{label}:</span>
                          <select value={val} onChange={e => setter(+e.target.value)} style={{ ...mono, fontSize: 11, background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                            {photos.map((p, i) => <option key={i} value={i}>{p.date} · {p.weight}kg</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                    <Card style={{ padding: 0, overflow: "hidden" }}>
                      <div style={{ position: "relative", height: 340, userSelect: "none" }}>
                        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg,${photos[safeCompareB].color},#07070f)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <div style={{ textAlign: "center" }}><div style={{ fontSize: 36, opacity: 0.2 }}>📷</div><div style={{ ...mono, fontSize: 10, color: T.textDim, marginTop: 6 }}>BEFORE · {photos[safeCompareB].date}</div></div>
                        </div>
                        <div style={{ position: "absolute", top: 0, left: 0, width: `${sliderPos}%`, height: "100%", overflow: "hidden" }}>
                          <div style={{ width: `${10000 / sliderPos}%`, height: "100%", background: `linear-gradient(160deg,${photos[safeCompareA].color},#07070f)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ textAlign: "center" }}><div style={{ fontSize: 36, opacity: 0.2 }}>📷</div><div style={{ ...mono, fontSize: 10, color: T.textDim, marginTop: 6 }}>AFTER · {photos[safeCompareA].date}</div></div>
                          </div>
                        </div>
                        <div style={{ position: "absolute", top: 0, left: `${sliderPos}%`, width: 2, height: "100%", background: T.teal, transform: "translateX(-50%)", pointerEvents: "none" }}>
                          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 26, height: 26, borderRadius: "50%", background: T.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#000", fontWeight: 700 }}>⇔</div>
                        </div>
                        <input type="range" min={5} max={95} value={sliderPos} onChange={e => setSliderPos(+e.target.value)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "ew-resize", zIndex: 10 }} />
                      </div>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── CHECK-IN ── */}
        {tab === "checkin" && (
          <div className="fu" style={{ maxWidth: 660, margin: "0 auto" }}>
            <ST sub={`DAILY LOG · ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase()}`}>TODAY'S CHECK-IN</ST>
            {ciDone ? (
              <Card style={{ textAlign: "center", padding: 44 }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>✅</div>
                <div style={{ ...bebas, fontSize: 26, letterSpacing: 1, color: T.teal, marginBottom: 6 }}>SAVED TO GOOGLE SHEETS</div>
                <div style={{ color: T.textMid, fontSize: 14, marginBottom: 22 }}>Your check-in data is stored and your coach has been updated.</div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={() => { setCiDone(false); setCi({ mood: 7, sleep: 7.5, energy: 7, stress: 4, water: 2.5, notes: "" }); }} style={{ ...mono, fontSize: 11, letterSpacing: 2, background: `${T.teal}18`, border: `1px solid ${T.teal}44`, color: T.teal, borderRadius: 8, padding: "10px 18px", cursor: "pointer" }}>NEW CHECK-IN</button>
                  <button onClick={() => setTab("coach")} style={{ ...mono, fontSize: 11, letterSpacing: 2, background: `${T.blue}18`, border: `1px solid ${T.blue}44`, color: T.blue, borderRadius: 8, padding: "10px 18px", cursor: "pointer" }}>ASK COACH →</button>
                </div>
              </Card>
            ) : (
              <Card>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <Slider label="Mood"   value={ci.mood}   onChange={v => setCi(p => ({ ...p, mood: v }))}   color={T.amber} />
                  <Slider label="Sleep"  value={ci.sleep}  onChange={v => setCi(p => ({ ...p, sleep: v }))}  min={3} max={12} color={T.blue}   unit=" hrs" />
                  <Slider label="Energy" value={ci.energy} onChange={v => setCi(p => ({ ...p, energy: v }))} color={T.teal} />
                  <Slider label="Stress" value={ci.stress} onChange={v => setCi(p => ({ ...p, stress: v }))} color={T.red} />
                  <Slider label="Water"  value={ci.water}  onChange={v => setCi(p => ({ ...p, water: v }))}  min={0} max={5} color={T.purple} unit=" L" />
                  <div>
                    <div style={{ ...mono, fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7 }}>Notes</div>
                    <textarea className="ci" rows={3} placeholder="How did today feel? Wins, struggles, observations..." value={ci.notes} onChange={e => setCi(p => ({ ...p, notes: e.target.value }))} style={{ width: "100%", padding: "11px 13px", resize: "vertical", lineHeight: 1.6 }} />
                  </div>
                  <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 13, display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, textAlign: "center" }}>
                    {[["Mood", ci.mood, "/10", T.amber], ["Sleep", ci.sleep, "h", T.blue], ["Energy", ci.energy, "/10", T.teal], ["Stress", ci.stress, "/10", T.red], ["Water", ci.water, "L", T.purple]].map(([l, v, u, c]) => (
                      <div key={l}><div style={{ ...bebas, fontSize: 20, color: c }}>{v}</div><div style={{ ...mono, fontSize: 9, color: T.textDim, textTransform: "uppercase" }}>{l}</div></div>
                    ))}
                  </div>
                  <button onClick={submitCheckin} disabled={ciSaving} style={{ background: ciSaving ? T.surfaceAlt : `linear-gradient(135deg,${T.teal},${T.blue})`, border: "none", borderRadius: 10, padding: "13px 24px", color: ciSaving ? T.textDim : "#000", ...mono, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, cursor: ciSaving ? "not-allowed" : "pointer", transition: "all .2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    {ciSaving ? <><div style={{ width: 13, height: 13, border: `2px solid #333`, borderTopColor: T.teal, borderRadius: "50%", animation: "spin .7s linear infinite" }} /> SAVING TO GOOGLE SHEETS…</> : "SAVE CHECK-IN →"}
                  </button>
                </div>
              </Card>
            )}
            <div style={{ marginTop: 24 }}>
              <div style={{ ...mono, fontSize: 10, color: T.textDim, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>RECENT</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {checkins.slice(1).map((c, i) => (
                  <Card key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px" }}>
                    <div style={{ ...mono, fontSize: 11, color: T.textDim, minWidth: 48 }}>{c.date}</div>
                    <div style={{ display: "flex", gap: 10, flex: 1 }}>
                      {[["😊", c.mood, T.amber], ["😴", c.sleep, T.blue], ["⚡", c.energy, T.teal], ["😤", c.stress, T.red], ["💧", c.water, T.purple]].map(([icon, val, col], j) => (
                        <span key={j} style={{ ...mono, fontSize: 11, color: col }}>{icon} {val}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: T.textDim, flex: 2, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontStyle: "italic" }}>"{c.notes}"</div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── COACH ── */}
        {tab === "coach" && (
          <div className="fu" style={{ maxWidth: 740, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <ST sub="POWERED BY CLAUDE · LIVE DATA">⚡ AI COACH</ST>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Why has my weight stalled?", "How's my sleep affecting performance?", "Am I hitting protein targets?"].map((q, i) => (
                  <button key={i} onClick={() => setChatInput(q)} style={{ ...mono, fontSize: 9, letterSpacing: 1, background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.textMid, borderRadius: 6, padding: "5px 9px", cursor: "pointer" }}>{q}</button>
                ))}
              </div>
            </div>
            <div style={{ background: `${T.teal}08`, border: `1px solid ${T.teal}18`, borderRadius: 9, padding: "9px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: T.teal, animation: "pulse 2s infinite" }} />
              <span style={{ ...mono, fontSize: 10, color: T.textDim, letterSpacing: 1 }}>
                LIVE DATA: {weightData.length} weight entries · {checkins.length} check-ins · {workouts.length} workouts · {stepsData.length} step days · {nutritionData.length} nutrition days
              </span>
            </div>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ height: 420, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{ maxWidth: "84%", background: m.role === "user" ? `linear-gradient(135deg,${T.teal}20,${T.blue}20)` : T.surfaceAlt, border: `1px solid ${m.role === "user" ? `${T.teal}33` : T.border}`, borderRadius: m.role === "user" ? "13px 13px 3px 13px" : "13px 13px 13px 3px", padding: "11px 15px", fontSize: 14, lineHeight: 1.75, color: m.role === "user" ? T.text : T.textMid }}>
                      {m.role === "assistant" && <div style={{ ...mono, fontSize: 9, color: T.teal, letterSpacing: 2, marginBottom: 5 }}>PHYSIQUE COACH</div>}
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: "13px 13px 13px 3px", padding: "11px 16px", display: "flex", gap: 5, alignItems: "center" }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.teal, animation: `pulse 1.2s ${i*0.25}s infinite` }} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>
              <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 16px", display: "flex", gap: 9 }}>
                <input className="ci" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()} placeholder="Ask about your data, trends, or get coaching advice..." style={{ flex: 1, padding: "9px 13px", borderRadius: 9 }} />
                <button onClick={send} disabled={chatLoading || !chatInput.trim()} style={{ background: chatInput.trim() ? `linear-gradient(135deg,${T.teal},${T.blue})` : T.surfaceAlt, border: "none", borderRadius: 9, padding: "9px 16px", color: chatInput.trim() ? "#000" : T.textDim, ...mono, fontSize: 11, letterSpacing: 2, fontWeight: 600, cursor: chatInput.trim() ? "pointer" : "not-allowed", transition: "all .2s" }}>SEND</button>
              </div>
            </Card>
            <div style={{ marginTop: 10, ...mono, fontSize: 10, color: T.textDim, textAlign: "center" }}>
              Live data from Google Sheets is injected into every message — Claude responds based on your actual numbers.
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

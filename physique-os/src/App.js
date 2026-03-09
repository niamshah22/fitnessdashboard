import { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
const T = {
  bg: "#07070f", surface: "#0e0e1c", surfaceAlt: "#13131f", border: "#1c1c2e",
  teal: "#00D4AA", blue: "#4A9EFF", red: "#FF5E7A", amber: "#FFB547", purple: "#9B7FFF",
  text: "#e8e8f0", textMid: "#888899", textDim: "#44445a",
};
const weightData = [
  { date: "06 Jan", weight: 94.2, fat: 24.1, muscle: 68.4, water: 58.2 },
  { date: "13 Jan", weight: 93.8, fat: 23.8, muscle: 68.6, water: 58.5 },
  { date: "20 Jan", weight: 93.1, fat: 23.4, muscle: 68.9, water: 58.8 },
  { date: "27 Jan", weight: 92.6, fat: 23.0, muscle: 69.1, water: 59.1 },
  { date: "03 Feb", weight: 92.0, fat: 22.6, muscle: 69.4, water: 59.3 },
  { date: "10 Feb", weight: 91.4, fat: 22.2, muscle: 69.7, water: 59.6 },
  { date: "17 Feb", weight: 91.8, fat: 22.4, muscle: 69.5, water: 59.4 },
  { date: "24 Feb", weight: 91.0, fat: 21.9, muscle: 69.9, water: 59.8 },
  { date: "03 Mar", weight: 90.3, fat: 21.5, muscle: 70.2, water: 60.1 },
];
const stepsData = [
  { day: "Mon", steps: 8240 }, { day: "Tue", steps: 11340 },
  { day: "Wed", steps: 7890 }, { day: "Thu", steps: 12100 },
  { day: "Fri", steps: 9450 }, { day: "Sat", steps: 15200 }, { day: "Sun", steps: 6300 },
];
const nutritionData = [
  { day: "Mon", calories: 2180, protein: 168, carbs: 242, fat: 72 },
  { day: "Tue", calories: 2340, protein: 181, carbs: 261, fat: 78 },
  { day: "Wed", calories: 1980, protein: 155, carbs: 218, fat: 65 },
  { day: "Thu", calories: 2210, protein: 172, carbs: 246, fat: 74 },
  { day: "Fri", calories: 2090, protein: 163, carbs: 231, fat: 69 },
  { day: "Sat", calories: 2560, protein: 190, carbs: 287, fat: 86 },
  { day: "Sun", calories: 1870, protein: 148, carbs: 207, fat: 61 },
];
const workouts = [
  { date: "07 Mar", type: "Push", duration: 62, volume: 14820, exercises: ["Bench Press 4×8 @ 90kg", "OHP 3×10 @ 60kg", "Dips 3×12", "Lateral Raise 4×15"] },
  { date: "05 Mar", type: "Pull", duration: 55, volume: 13400, exercises: ["Deadlift 4×5 @ 140kg", "Pull-ups 4×8", "Cable Row 3×12 @ 75kg", "Face Pull 3×15"] },
  { date: "03 Mar", type: "Legs", duration: 70, volume: 18200, exercises: ["Squat 4×6 @ 120kg", "RDL 3×10 @ 100kg", "Leg Press 4×12 @ 180kg", "Calf Raise 4×20"] },
  { date: "01 Mar", type: "Push", duration: 58, volume: 14200, exercises: ["Bench Press 4×8 @ 87.5kg", "Incline DB 3×10 @ 32kg", "Cable Fly 3×15"] },
];
const mockCheckins = [
  { date: "09 Mar", mood: 8, sleep: 7.5, energy: 7, stress: 3, water: 2.8, notes: "Felt strong after pull session. Hit macros. Slight DOMS in lats.", weight: 90.3, steps: 9450 },
  { date: "08 Mar", mood: 6, sleep: 6.0, energy: 5, stress: 6, water: 2.1, notes: "Tired. Work was stressful. Skipped gym.", weight: 90.5, steps: 6200 },
  { date: "07 Mar", mood: 9, sleep: 8.0, energy: 9, stress: 2, water: 3.2, notes: "Best push session in weeks. New bench PR.", weight: 90.4, steps: 11200 },
  { date: "06 Mar", mood: 7, sleep: 7.0, energy: 7, stress: 4, water: 2.6, notes: "Solid rest day. Meal prepped for the week.", weight: 90.8, steps: 7800 },
];
const progressPhotos = [
  { date: "09 Mar", weight: 90.3, fat: 21.5, color: "#0a2020" },
  { date: "24 Feb", weight: 91.0, fat: 21.9, color: "#0a1020" },
  { date: "10 Feb", weight: 91.4, fat: 22.2, color: "#0a1030" },
  { date: "27 Jan", weight: 92.6, fat: 23.0, color: "#102010" },
  { date: "13 Jan", weight: 93.8, fat: 23.8, color: "#201010" },
  { date: "06 Jan", weight: 94.2, fat: 24.1, color: "#201020" },
];
const mono = { fontFamily: "'DM Mono', monospace" };
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
  <div onClick={onClick} style={{
    borderRadius: 10, overflow: "hidden", cursor: onClick ? "pointer" : "default",
    border: selected ? `2px solid ${T.teal}` : `1px solid ${T.border}`,
    transition: "all .2s", transform: selected ? "scale(1.02)" : "scale(1)", position: "relative",
  }}>
    <div style={{ height: size, background: `linear-gradient(160deg, ${photo.color} 0%, #07070f 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
      <div style={{ fontSize: size > 200 ? 40 : 24, opacity: 0.25 }}>📷</div>
      <div style={{ ...mono, fontSize: 9, color: T.textDim }}>PHOTO</div>
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
export default function PhysiqueOS() {
  const [tab, setTab] = useState("overview");
  const [photoView, setPhotoView] = useState("grid");
  const [compareA, setCompareA] = useState(0);
  const [compareB, setCompareB] = useState(5);
  const [sliderPos, setSliderPos] = useState(50);
  const [ci, setCi] = useState({ mood: 7, sleep: 7.5, energy: 7, stress: 4, water: 2.5, notes: "" });
  const [ciDone, setCiDone] = useState(false);
  const [ciSaving, setCiSaving] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hey! I'm your physique coach. I have full access to your body composition, workouts, nutrition, steps, and daily check-ins. Ask me anything — or just tell me how today went." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEnd = useRef(null);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chatLoading]);
  const latest = weightData[weightData.length - 1];
  const prev = weightData[weightData.length - 2];
  const TABS = ["overview", "body", "nutrition", "training", "photos", "checkin", "coach"];
  const submitCheckin = async () => {
    setCiSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setCiSaving(false);
    setCiDone(true);
  };
  const buildCtx = () => `You are a personal physique coach. You have access to real data below. Be specific, concise, reference actual numbers. Max 3 paragraphs.
BODY COMPOSITION (9 weeks):
${weightData.map(d => `${d.date}: ${d.weight}kg | ${d.fat}%fat | ${d.muscle}kg muscle`).join("\n")}
RECENT CHECK-INS:
${mockCheckins.map(c => `${c.date}: mood ${c.mood}/10, sleep ${c.sleep}h, energy ${c.energy}/10, stress ${c.stress}/10, water ${c.water}L — "${c.notes}"`).join("\n")}
TODAY'S CHECK-IN: mood ${ci.mood}/10 | sleep ${ci.sleep}h | energy ${ci.energy}/10 | stress ${ci.stress}/10 | water ${ci.water}L | "${ci.notes}"
THIS WEEK STEPS: ${stepsData.map(d => `${d.day}:${d.steps}`).join(", ")}
THIS WEEK NUTRITION: ${nutritionData.map(d => `${d.day}:${d.calories}kcal,${d.protein}gP`).join(", ")}
RECENT WORKOUTS: ${workouts.map(w => `${w.date} ${w.type} ${w.duration}min ${w.volume}kg`).join(" | ")}`;
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
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildCtx(),
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Could not get a response.";
      setMessages(p => [...p, { role: "assistant", content: reply }]);
    } catch {
      setMessages(p => [...p, { role: "assistant", content: "Connection error — make sure you're running this with an Anthropic API key configured." }]);
    }
    setChatLoading(false);
  };
  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'DM Sans',sans-serif" }}>
      <style>{css}</style>
      {/* HEADER */}
      <header style={{
        position: "sticky", top: 0, zIndex: 200,
        background: `${T.bg}ee`, backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: 58,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg,${T.teal},${T.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚡</div>
          <div>
            <div style={{ ...bebas, fontSize: 19, letterSpacing: 2.5, lineHeight: 1 }}>PHYSIQUE OS</div>
            <div style={{ ...mono, fontSize: 8, color: T.textDim, letterSpacing: 3 }}>PERSONAL ANALYTICS</div>
          </div>
        </div>
        <nav style={{ display: "flex", gap: 0 }}>
          {TABS.map(t => (
            <button key={t} className="tb" onClick={() => setTab(t)} style={{
              background: "none", border: "none",
              ...mono, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase",
              color: tab === t ? T.teal : T.textDim,
              padding: "6px 11px",
              borderBottom: tab === t ? `2px solid ${T.teal}` : "2px solid transparent",
            }}>{t === "coach" ? "⚡ coach" : t}</button>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: T.teal, boxShadow: `0 0 7px ${T.teal}`, animation: "pulse 2s infinite" }} />
          <span style={{ ...mono, fontSize: 10, color: T.textDim }}>LIVE · 09 MAR</span>
        </div>
      </header>
      <main style={{ padding: "24px 24px 60px", maxWidth: 1300, margin: "0 auto" }}>
        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="fu">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 11, marginBottom: 20 }}>
              <KPI label="Body Weight" value={latest.weight} unit="kg" color={T.teal} delta={+(latest.weight - prev.weight).toFixed(1)} />
              <KPI label="Body Fat" value={`${latest.fat}%`} unit="" color={T.red} delta={+(latest.fat - prev.fat).toFixed(1)} />
              <KPI label="Muscle Mass" value={latest.muscle} unit="kg" color={T.blue} delta={-(+(latest.muscle - prev.muscle).toFixed(1))} />
              <KPI label="Steps Today" value="9,450" unit="" color={T.amber} sub="94% of 10k goal" />
              <KPI label="Calories" value="2,090" unit="kcal" color={T.purple} sub="110 under target" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14, marginBottom: 14 }}>
              <Card>
                <ST sub="RENPHO · 9-WEEK ROLLING">WEIGHT TREND</ST>
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={weightData}>
                    <defs>
                      <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={T.teal} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={T.teal} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CTip />} />
                    <Area type="monotone" dataKey="weight" stroke={T.teal} strokeWidth={2.5} fill="url(#wg)" dot={{ fill: T.teal, r: 3 }} name="weight" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
              <Card>
                <ST sub="APPLE HEALTH · THIS WEEK">DAILY STEPS</ST>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={stepsData} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CTip />} />
                    <ReferenceLine y={10000} stroke={`${T.amber}44`} strokeDasharray="4 4" />
                    <Bar dataKey="steps" fill={T.amber} radius={[4, 4, 0, 0]} name="steps" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <ST sub="TODAY · 08:14">LATEST CHECK-IN</ST>
                  <Pill color={T.teal}>DAILY</Pill>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
                  {[["Mood", mockCheckins[0].mood, "/10", T.amber], ["Sleep", mockCheckins[0].sleep, "hrs", T.blue], ["Energy", mockCheckins[0].energy, "/10", T.teal]].map(([l, v, u, c]) => (
                    <div key={l} style={{ background: T.surfaceAlt, borderRadius: 9, padding: "11px 8px", textAlign: "center" }}>
                      <div style={{ ...bebas, fontSize: 28, color: c, lineHeight: 1 }}>{v}</div>
                      <div style={{ ...mono, fontSize: 9, color: T.textDim, textTransform: "uppercase", marginTop: 3 }}>{l}{u}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[["Stress", mockCheckins[0].stress, "/10", T.red], ["Water", mockCheckins[0].water, "L", T.purple]].map(([l, v, u, c]) => (
                    <div key={l} style={{ background: T.surfaceAlt, borderRadius: 9, padding: "9px", textAlign: "center" }}>
                      <div style={{ ...bebas, fontSize: 22, color: c, lineHeight: 1 }}>{v}</div>
                      <div style={{ ...mono, fontSize: 9, color: T.textDim, textTransform: "uppercase", marginTop: 2 }}>{l} {u}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: T.surfaceAlt, borderRadius: 8, padding: "11px 13px", fontSize: 13, color: T.textMid, lineHeight: 1.7, fontStyle: "italic" }}>
                  "{mockCheckins[0].notes}"
                </div>
              </Card>
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <ST sub="07 MAR · STRONG APP">LAST WORKOUT</ST>
                  <Tag type={workouts[0].type} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[["Duration", workouts[0].duration, "min", T.amber], ["Volume", `${(workouts[0].volume / 1000).toFixed(1)}k`, "kg", T.amber]].map(([l, v, u, c]) => (
                    <div key={l} style={{ background: T.surfaceAlt, borderRadius: 9, padding: "11px 13px" }}>
                      <div style={{ ...bebas, fontSize: 28, color: c }}>{v}</div>
                      <div style={{ ...mono, fontSize: 9, color: T.textDim, textTransform: "uppercase" }}>{l} ({u})</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {workouts[0].exercises.map((ex, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, color: T.textMid }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: T.amber, flexShrink: 0 }} />{ex}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
        {/* ── BODY ── */}
        {tab === "body" && (
          <div className="fu">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 11, marginBottom: 20 }}>
              <KPI label="Current Weight" value={latest.weight} unit="kg" color={T.teal} delta={+(latest.weight - prev.weight).toFixed(1)} />
              <KPI label="Body Fat" value={`${latest.fat}%`} unit="" color={T.red} />
              <KPI label="Muscle Mass" value={`${latest.muscle}kg`} unit="" color={T.blue} />
              <KPI label="Body Water" value={`${latest.water}%`} unit="" color={T.purple} />
            </div>
            <Card>
              <ST sub="RENPHO · ALL METRICS OVER TIME">COMPOSITION TREND</ST>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={weightData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CTip />} />
                  <Line type="monotone" dataKey="weight" stroke={T.teal} strokeWidth={2.5} dot={{ r: 3 }} name="weight" />
                  <Line type="monotone" dataKey="muscle" stroke={T.blue} strokeWidth={2} dot={{ r: 3 }} name="muscle" />
                  <Line type="monotone" dataKey="fat" stroke={T.red} strokeWidth={2} dot={{ r: 3 }} name="fat%" />
                  <Line type="monotone" dataKey="water" stroke={T.purple} strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="water%" />
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
        )}
        {/* ── NUTRITION ── */}
        {tab === "nutrition" && (
          <div className="fu">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 11, marginBottom: 20 }}>
              <KPI label="Avg Calories" value="2,176" unit="kcal" color={T.amber} sub="Goal: 2,200" />
              <KPI label="Avg Protein" value="168g" unit="" color={T.teal} sub="Goal: 175g" />
              <KPI label="Avg Carbs" value="242g" unit="" color={T.blue} sub="Goal: 250g" />
              <KPI label="Avg Fat" value="72g" unit="" color={T.red} sub="Goal: 75g" />
            </div>
            <Card>
              <ST sub="MYFITNESSPAL · THIS WEEK">MACRO BREAKDOWN</ST>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={nutritionData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: T.textDim, fontFamily: "DM Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CTip />} />
                  <ReferenceLine y={2200} stroke={`${T.amber}55`} strokeDasharray="5 3" />
                  <Bar dataKey="protein" stackId="a" fill={T.teal} name="protein" />
                  <Bar dataKey="carbs" stackId="a" fill={T.blue} name="carbs" />
                  <Bar dataKey="fat" stackId="a" fill={T.red} radius={[4, 4, 0, 0]} name="fat" />
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
              <KPI label="Sessions This Week" value="3/4" unit="" color={T.amber} />
              <KPI label="Total Volume" value="61.2k" unit="kg" color={T.blue} />
              <KPI label="Avg Duration" value="61" unit="min" color={T.teal} />
              <KPI label="Streak" value="14" unit="days" color={T.red} />
            </div>
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
          </div>
        )}
        {/* ── PHOTOS ── */}
        {tab === "photos" && (
          <div className="fu">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <ST sub="GOOGLE DRIVE · AUTO-SYNCED">PROGRESS PHOTOS</ST>
              <div style={{ display: "flex", gap: 8 }}>
                {["grid", "compare", "slider"].map(v => (
                  <button key={v} onClick={() => setPhotoView(v)} style={{
                    ...mono, fontSize: 10, letterSpacing: 2, textTransform: "uppercase",
                    background: photoView === v ? `${T.teal}18` : "none",
                    border: `1px solid ${photoView === v ? T.teal : T.border}`,
                    color: photoView === v ? T.teal : T.textDim,
                    borderRadius: 7, padding: "6px 13px", cursor: "pointer", transition: "all .15s",
                  }}>{v}</button>
                ))}
                <button style={{ ...mono, fontSize: 10, letterSpacing: 2, textTransform: "uppercase", background: `${T.blue}18`, border: `1px solid ${T.blue}44`, color: T.blue, borderRadius: 7, padding: "6px 13px", cursor: "pointer" }}>
                  + UPLOAD
                </button>
              </div>
            </div>
            {photoView === "grid" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {progressPhotos.map((p, i) => <Photo key={i} photo={p} size={160} />)}
              </div>
            )}
            {photoView === "compare" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 16 }}>
                  {[["PHOTO A", compareA, setCompareA], ["PHOTO B", compareB, setCompareB]].map(([label, val, setter]) => (
                    <div key={label}>
                      <div style={{ ...mono, fontSize: 10, color: T.textDim, letterSpacing: 2, marginBottom: 8 }}>SELECT {label}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 7 }}>
                        {progressPhotos.map((p, i) => <Photo key={i} photo={p} size={100} selected={val === i} onClick={() => setter(i)} />)}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <Photo photo={progressPhotos[compareA]} size={260} />
                  <Photo photo={progressPhotos[compareB]} size={260} />
                </div>
                <Card style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", gap: 28 }}>
                    {[
                      ["Weight Δ", `${(progressPhotos[compareA].weight - progressPhotos[compareB].weight).toFixed(1)} kg`, T.teal],
                      ["Fat % Δ", `${(progressPhotos[compareA].fat - progressPhotos[compareB].fat).toFixed(1)}%`, T.red],
                      ["Time span", `${Math.abs(compareB - compareA)} weeks`, T.blue],
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
                  {[["BEFORE", compareB, setCompareB], ["AFTER", compareA, setCompareA]].map(([label, val, setter]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ ...mono, fontSize: 10, color: T.textDim }}>{label}:</span>
                      <select value={val} onChange={e => setter(+e.target.value)}
                        style={{ ...mono, fontSize: 11, background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                        {progressPhotos.map((p, i) => <option key={i} value={i}>{p.date} · {p.weight}kg</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <Card style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{ position: "relative", height: 340, userSelect: "none" }}>
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg,${progressPhotos[compareB].color},#07070f)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ textAlign: "center" }}><div style={{ fontSize: 36, opacity: 0.2 }}>📷</div><div style={{ ...mono, fontSize: 10, color: T.textDim, marginTop: 6 }}>BEFORE · {progressPhotos[compareB].date}</div></div>
                    </div>
                    <div style={{ position: "absolute", top: 0, left: 0, width: `${sliderPos}%`, height: "100%", overflow: "hidden" }}>
                      <div style={{ width: `${10000 / sliderPos}%`, height: "100%", background: `linear-gradient(160deg,${progressPhotos[compareA].color},#07070f)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ textAlign: "center" }}><div style={{ fontSize: 36, opacity: 0.2 }}>📷</div><div style={{ ...mono, fontSize: 10, color: T.textDim, marginTop: 6 }}>AFTER · {progressPhotos[compareA].date}</div></div>
                      </div>
                    </div>
                    <div style={{ position: "absolute", top: 0, left: `${sliderPos}%`, width: 2, height: "100%", background: T.teal, transform: "translateX(-50%)", pointerEvents: "none" }}>
                      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 26, height: 26, borderRadius: "50%", background: T.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#000", fontWeight: 700 }}>⇔</div>
                    </div>
                    <input type="range" min={5} max={95} value={sliderPos} onChange={e => setSliderPos(+e.target.value)}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "ew-resize", zIndex: 10 }} />
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}
        {/* ── CHECK-IN ── */}
        {tab === "checkin" && (
          <div className="fu" style={{ maxWidth: 660, margin: "0 auto" }}>
            <ST sub={`DAILY LOG · 09 MAR 2026`}>TODAY'S CHECK-IN</ST>
            {ciDone ? (
              <Card style={{ textAlign: "center", padding: 44 }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>✅</div>
                <div style={{ ...bebas, fontSize: 26, letterSpacing: 1, color: T.teal, marginBottom: 6 }}>SAVED TO GOOGLE SHEETS</div>
                <div style={{ color: T.textMid, fontSize: 14, marginBottom: 22 }}>Your check-in data is stored and your coach has been updated.</div>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button onClick={() => { setCiDone(false); setCi({ mood: 7, sleep: 7.5, energy: 7, stress: 4, water: 2.5, notes: "" }); }}
                    style={{ ...mono, fontSize: 11, letterSpacing: 2, background: `${T.teal}18`, border: `1px solid ${T.teal}44`, color: T.teal, borderRadius: 8, padding: "10px 18px", cursor: "pointer" }}>
                    NEW CHECK-IN
                  </button>
                  <button onClick={() => setTab("coach")}
                    style={{ ...mono, fontSize: 11, letterSpacing: 2, background: `${T.blue}18`, border: `1px solid ${T.blue}44`, color: T.blue, borderRadius: 8, padding: "10px 18px", cursor: "pointer" }}>
                    ASK COACH →
                  </button>
                </div>
              </Card>
            ) : (
              <Card>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <Slider label="Mood" value={ci.mood} onChange={v => setCi(p => ({ ...p, mood: v }))} color={T.amber} />
                  <Slider label="Sleep" value={ci.sleep} onChange={v => setCi(p => ({ ...p, sleep: v }))} min={3} max={12} color={T.blue} unit=" hrs" />
                  <Slider label="Energy" value={ci.energy} onChange={v => setCi(p => ({ ...p, energy: v }))} color={T.teal} />
                  <Slider label="Stress" value={ci.stress} onChange={v => setCi(p => ({ ...p, stress: v }))} color={T.red} />
                  <Slider label="Water" value={ci.water} onChange={v => setCi(p => ({ ...p, water: v }))} min={0} max={5} color={T.purple} unit=" L" />
                  <div>
                    <div style={{ ...mono, fontSize: 11, color: T.textDim, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 7 }}>Notes</div>
                    <textarea className="ci" rows={3} placeholder="How did today feel? Wins, struggles, observations..."
                      value={ci.notes} onChange={e => setCi(p => ({ ...p, notes: e.target.value }))}
                      style={{ width: "100%", padding: "11px 13px", resize: "vertical", lineHeight: 1.6 }} />
                  </div>
                  <div style={{ background: T.surfaceAlt, borderRadius: 10, padding: 13, display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, textAlign: "center" }}>
                    {[["Mood", ci.mood, "/10", T.amber], ["Sleep", ci.sleep, "h", T.blue], ["Energy", ci.energy, "/10", T.teal], ["Stress", ci.stress, "/10", T.red], ["Water", ci.water, "L", T.purple]].map(([l, v, u, c]) => (
                      <div key={l}>
                        <div style={{ ...bebas, fontSize: 20, color: c }}>{v}</div>
                        <div style={{ ...mono, fontSize: 9, color: T.textDim, textTransform: "uppercase" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={submitCheckin} disabled={ciSaving} style={{
                    background: ciSaving ? T.surfaceAlt : `linear-gradient(135deg,${T.teal},${T.blue})`,
                    border: "none", borderRadius: 10, padding: "13px 24px",
                    color: ciSaving ? T.textDim : "#000",
                    ...mono, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600,
                    cursor: ciSaving ? "not-allowed" : "pointer", transition: "all .2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  }}>
                    {ciSaving
                      ? <><div style={{ width: 13, height: 13, border: `2px solid #333`, borderTopColor: T.teal, borderRadius: "50%", animation: "spin .7s linear infinite" }} /> SAVING TO GOOGLE SHEETS...</>
                      : "SAVE CHECK-IN →"}
                  </button>
                </div>
              </Card>
            )}
            <div style={{ marginTop: 24 }}>
              <div style={{ ...mono, fontSize: 10, color: T.textDim, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>RECENT</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {mockCheckins.slice(1).map((c, i) => (
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
              <ST sub="POWERED BY CLAUDE · DATA-GROUNDED COACHING">⚡ AI COACH</ST>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["Why has my weight stalled?", "How's my sleep affecting performance?", "Am I hitting protein targets?"].map((q, i) => (
                  <button key={i} onClick={() => setChatInput(q)}
                    style={{ ...mono, fontSize: 9, letterSpacing: 1, background: T.surfaceAlt, border: `1px solid ${T.border}`, color: T.textMid, borderRadius: 6, padding: "5px 9px", cursor: "pointer" }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background: `${T.teal}08`, border: `1px solid ${T.teal}18`, borderRadius: 9, padding: "9px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: T.teal, animation: "pulse 2s infinite" }} />
              <span style={{ ...mono, fontSize: 10, color: T.textDim, letterSpacing: 1 }}>
                CONTEXT LOADED: 9wk body comp · steps · nutrition · workouts · check-ins · today's data
              </span>
            </div>
            <Card style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ height: 420, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                    <div style={{
                      maxWidth: "84%",
                      background: m.role === "user" ? `linear-gradient(135deg,${T.teal}20,${T.blue}20)` : T.surfaceAlt,
                      border: `1px solid ${m.role === "user" ? `${T.teal}33` : T.border}`,
                      borderRadius: m.role === "user" ? "13px 13px 3px 13px" : "13px 13px 13px 3px",
                      padding: "11px 15px", fontSize: 14, lineHeight: 1.75,
                      color: m.role === "user" ? T.text : T.textMid,
                    }}>
                      {m.role === "assistant" && <div style={{ ...mono, fontSize: 9, color: T.teal, letterSpacing: 2, marginBottom: 5 }}>PHYSIQUE COACH</div>}
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ display: "flex", justifyContent: "flex-start" }}>
                    <div style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: "13px 13px 13px 3px", padding: "11px 16px", display: "flex", gap: 5, alignItems: "center" }}>
                      {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: T.teal, animation: `pulse 1.2s ${i * 0.25}s infinite` }} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>
              <div style={{ borderTop: `1px solid ${T.border}`, padding: "12px 16px", display: "flex", gap: 9 }}>
                <input className="ci" value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Ask about your data, trends, or get coaching advice..."
                  style={{ flex: 1, padding: "9px 13px", borderRadius: 9 }} />
                <button onClick={send} disabled={chatLoading || !chatInput.trim()} style={{
                  background: chatInput.trim() ? `linear-gradient(135deg,${T.teal},${T.blue})` : T.surfaceAlt,
                  border: "none", borderRadius: 9, padding: "9px 16px",
                  color: chatInput.trim() ? "#000" : T.textDim,
                  ...mono, fontSize: 11, letterSpacing: 2, fontWeight: 600,
                  cursor: chatInput.trim() ? "pointer" : "not-allowed", transition: "all .2s",
                }}>SEND</button>
              </div>
            </Card>
            <div style={{ marginTop: 10, ...mono, fontSize: 10, color: T.textDim, textAlign: "center" }}>
              Your full data history is injected into every message — Claude responds based on your actual numbers.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

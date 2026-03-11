import { useState, useEffect } from "react";
import {
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

// ── Config ────────────────────────────────────────────────────────────────────
const SHEET_ID = "1GFHDfNERLpVwrs5MM8OyXRhSEsZbbdfzXX_H4QsF4BA";
const API_KEY  = "AIzaSyDJ2sS4eMJAW9yjbzxkOpJF17lVS1UnIjE";
const BASE     = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values`;

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:      "#08080f",
  surface: "#10101a",
  card:    "#14141f",
  border:  "#1f1f32",
  accent:  "#7c6aff",
  green:   "#22c55e",
  amber:   "#f59e0b",
  red:     "#ef4444",
  text:    "#ededf5",
  muted:   "#6b6b88",
  dim:     "#282838",
};

// ── Global CSS ────────────────────────────────────────────────────────────────
const G = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:${C.bg};color:${C.text};font-family:'Inter',system-ui,sans-serif;-webkit-text-size-adjust:100%;overscroll-behavior:none}
::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-thumb{background:${C.dim};border-radius:2px}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.anim{animation:up .2s ease}
input,select,textarea{
  background:${C.dim};border:1px solid ${C.border};color:${C.text};
  border-radius:12px;outline:none;font-family:inherit;font-size:16px;
  -webkit-appearance:none;width:100%;padding:14px 16px
}
input:focus,select:focus,textarea:focus{border-color:${C.accent}}
button{font-family:inherit}
`;

// ── Utilities ─────────────────────────────────────────────────────────────────
const todayStr = () => {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
};

const shortDate = (s = "") => {
  const parts = s.split("/");
  if (parts.length !== 3) return s;
  const [dd, mm] = parts;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${parseInt(dd)} ${months[parseInt(mm)-1]}`;
};

const sheetRows = (json) => (json?.values || []).slice(1);

// ── Reusable UI ───────────────────────────────────────────────────────────────
const Spinner = ({ size = 20 }) => (
  <div style={{
    width: size, height: size,
    border: `2px solid ${C.border}`, borderTopColor: C.accent,
    borderRadius: "50%", animation: "spin .7s linear infinite", flexShrink: 0,
  }} />
);

const Card = ({ children, style = {}, onClick }) => (
  <div onClick={onClick} style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 20, padding: 20, ...style,
    cursor: onClick ? "pointer" : "default",
  }}>
    {children}
  </div>
);

const Label = ({ children }) => (
  <div style={{
    fontSize: 11, fontWeight: 600, color: C.muted,
    textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6,
  }}>
    {children}
  </div>
);

const ProgressBar = ({ value, target, color = C.accent, height = 8 }) => {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
  return (
    <div style={{ height, background: C.dim, borderRadius: height, overflow: "hidden" }}>
      <div style={{
        width: `${pct}%`, height: "100%", background: color,
        borderRadius: height, transition: "width .5s ease",
      }} />
    </div>
  );
};

const Btn = ({ children, onClick, color = C.accent, disabled = false, full = false, outline = false, style = {} }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      width: full ? "100%" : "auto",
      padding: "14px 22px", borderRadius: 14,
      border: outline ? `1px solid ${color}` : "none",
      background: outline ? "transparent" : disabled ? C.dim : color,
      color: outline ? color : disabled ? C.muted : "#fff",
      fontSize: 15, fontWeight: 700,
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "opacity .15s", opacity: disabled ? 0.6 : 1,
      ...style,
    }}
  >
    {children}
  </button>
);

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 10, padding: "10px 14px", fontSize: 13,
    }}>
      <div style={{ color: C.muted, marginBottom: 4, fontSize: 11 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>{p.value} {p.name}</div>
      ))}
    </div>
  );
};

// ── Tab: Dashboard ────────────────────────────────────────────────────────────
function DashboardTab({ weight, steps, calories, goals, last7 }) {
  const startW     = last7?.[0]?.weight || weight;
  const goalW      = goals.weight;
  const losing     = goalW > 0 && goalW < startW;
  const totalDelta = goalW > 0 && startW > 0 ? Math.abs(startW - goalW) : 0;
  const doneDelta  = goalW > 0 && startW > 0 ? Math.abs(startW - weight) : 0;
  const goalPct    = totalDelta > 0 ? Math.min(100, Math.round((doneDelta / totalDelta) * 100)) : 0;
  const onTarget   = goalW > 0 && (losing ? weight <= goalW : weight >= goalW);
  const weightColor = onTarget ? C.green : C.accent;

  return (
    <div className="anim">
      {/* Date header */}
      <div style={{ padding: "24px 0 20px" }}>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>Today</div>
      </div>

      {/* Weight card */}
      <Card style={{ marginBottom: 14 }}>
        <Label>Body Weight</Label>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 56, fontWeight: 900, color: weightColor, lineHeight: 1, letterSpacing: -2 }}>
              {weight > 0 ? weight : "—"}
            </span>
            <span style={{ fontSize: 20, color: C.muted, fontWeight: 500 }}>kg</span>
          </div>
          {goalW > 0 && (
            <div style={{ textAlign: "right", paddingBottom: 4 }}>
              <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Goal</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: C.green }}>{goalW} kg</div>
            </div>
          )}
        </div>
        {goalW > 0 && weight > 0 && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: C.muted }}>
                {losing
                  ? `${Math.max(0, weight - goalW).toFixed(1)} kg to go`
                  : `${Math.max(0, goalW - weight).toFixed(1)} kg to go`}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>{goalPct}%</span>
            </div>
            <ProgressBar value={goalPct} target={100} color={onTarget ? C.green : C.accent} height={10} />
          </>
        )}
      </Card>

      {/* Steps card */}
      <Card style={{ marginBottom: 14 }}>
        <Label>Steps Today</Label>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: 48, fontWeight: 900, color: steps >= goals.steps ? C.green : C.text, lineHeight: 1, letterSpacing: -1 }}>
            {steps > 0 ? steps.toLocaleString() : "—"}
          </span>
          <div style={{ textAlign: "right", paddingBottom: 4 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Goal</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.muted }}>{goals.steps.toLocaleString()}</div>
          </div>
        </div>
        <ProgressBar value={steps} target={goals.steps} color={steps >= goals.steps ? C.green : C.amber} height={10} />
        {steps > 0 && goals.steps > 0 && (
          <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
            {Math.round((steps / goals.steps) * 100)}% of daily goal
          </div>
        )}
      </Card>

      {/* Calories card */}
      <Card style={{ marginBottom: 14 }}>
        <Label>Calories Today</Label>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 48, fontWeight: 900, color: C.text, lineHeight: 1, letterSpacing: -1 }}>
              {calories > 0 ? calories.toLocaleString() : "—"}
            </span>
            <span style={{ fontSize: 16, color: C.muted }}>kcal</span>
          </div>
          <div style={{ textAlign: "right", paddingBottom: 4 }}>
            <div style={{ fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Target</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.muted }}>{goals.calories.toLocaleString()}</div>
          </div>
        </div>
        <ProgressBar
          value={calories} target={goals.calories} height={10}
          color={calories > goals.calories * 1.1 ? C.red : calories >= goals.calories * 0.85 ? C.green : C.accent}
        />
        {calories > 0 && goals.calories > 0 && (
          <div style={{ fontSize: 12, color: C.muted, marginTop: 8 }}>
            {calories < goals.calories
              ? `${(goals.calories - calories).toLocaleString()} kcal remaining`
              : `${(calories - goals.calories).toLocaleString()} kcal over target`}
          </div>
        )}
      </Card>

      {/* 7-day weight chart */}
      {last7.length > 1 && (
        <Card>
          <Label>7-Day Weight Trend</Label>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={last7} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.accent} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
              <YAxis domain={["auto","auto"]} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              {goals.weight > 0 && (
                <ReferenceLine y={goals.weight} stroke={`${C.green}55`} strokeDasharray="5 3" />
              )}
              <Area type="monotone" dataKey="weight" stroke={C.accent} strokeWidth={2.5} fill="url(#wGrad)" dot={{ fill: C.accent, r: 3, strokeWidth: 0 }} name="kg" />
            </AreaChart>
          </ResponsiveContainer>
          {goals.weight > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
              <div style={{ width: 20, height: 2, background: C.green, opacity: 0.4 }} />
              <span style={{ fontSize: 11, color: C.muted }}>Goal weight {goals.weight} kg</span>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── Tab: Photos ───────────────────────────────────────────────────────────────
function PhotosTab({ photos }) {
  const [view,    setView]    = useState("grid");
  const [a,       setA]       = useState(Math.max(0, photos.length - 1));
  const [b,       setB]       = useState(0);
  const [slider,  setSlider]  = useState(50);
  const [adding,  setAdding]  = useState(false);
  const [newUrl,  setNewUrl]  = useState("");
  const [newDate, setNewDate] = useState(todayStr());

  const safeA = Math.min(a, Math.max(0, photos.length - 1));
  const safeB = Math.min(b, Math.max(0, photos.length - 1));

  const PhotoCard = ({ photo, size = 160, selected, onClick }) => (
    <div onClick={onClick} style={{
      borderRadius: 14, overflow: "hidden",
      border: selected ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
      cursor: onClick ? "pointer" : "default",
      background: C.dim, transition: "border-color .15s",
    }}>
      <div style={{ height: size, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {photo.url
          ? <img src={photo.url} alt={photo.date} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 28, opacity: 0.3 }}>📷</span>
        }
      </div>
      <div style={{ padding: "8px 12px", background: C.card }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.muted }}>{shortDate(photo.date)}</div>
      </div>
    </div>
  );

  return (
    <div className="anim">
      <div style={{ padding: "24px 0 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Photos</div>
        <Btn onClick={() => setAdding(v => !v)} outline color={C.accent} style={{ padding: "9px 16px", fontSize: 13 }}>
          {adding ? "Cancel" : "+ Add"}
        </Btn>
      </div>

      {adding && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <Label>Photo URL</Label>
              <input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://…" />
            </div>
            <div>
              <Label>Date (DD/MM/YYYY)</Label>
              <input value={newDate} onChange={e => setNewDate(e.target.value)} placeholder="31/12/2024" />
            </div>
            <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
              Upload to Google Drive → right-click → Share → "Anyone with link can view" → copy the link.
              To persist across devices, add the row directly to your <strong style={{ color: C.text }}>photos</strong> sheet.
            </p>
            <Btn full disabled={!newUrl.trim() || !newDate.trim()} onClick={() => {
              const stored = JSON.parse(localStorage.getItem("extra_photos") || "[]");
              stored.push({ date: newDate.trim(), url: newUrl.trim() });
              localStorage.setItem("extra_photos", JSON.stringify(stored));
              setAdding(false); setNewUrl(""); setNewDate(todayStr());
            }}>
              Save Photo
            </Btn>
          </div>
        </Card>
      )}

      {photos.length === 0 ? (
        <Card style={{ textAlign: "center", padding: 52 }}>
          <div style={{ fontSize: 44, marginBottom: 16 }}>📷</div>
          <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.8 }}>
            No photos yet.<br />
            Add a <strong style={{ color: C.text }}>photos</strong> tab to your sheet<br />
            with columns: <strong style={{ color: C.text }}>date</strong>, <strong style={{ color: C.text }}>photo_url</strong>
          </div>
        </Card>
      ) : (
        <>
          {/* View toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {["grid","compare","slider"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                flex: 1, padding: "10px 4px", borderRadius: 12,
                fontSize: 13, fontWeight: 600, border: "none",
                background: view === v ? C.accent : C.dim,
                color: view === v ? "#fff" : C.muted,
                cursor: "pointer", transition: "all .15s", textTransform: "capitalize",
              }}>
                {v}
              </button>
            ))}
          </div>

          {/* Grid */}
          {view === "grid" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {photos.map((p, i) => <PhotoCard key={i} photo={p} size={170} />)}
            </div>
          )}

          {/* Compare */}
          {view === "compare" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                {[["Before", safeB, setB], ["After", safeA, setA]].map(([label, val, setter]) => (
                  <div key={label}>
                    <Label>{label}</Label>
                    <select value={val} onChange={e => setter(+e.target.value)} style={{ padding: "10px 12px", fontSize: 13 }}>
                      {photos.map((p, i) => (
                        <option key={i} value={i}>{shortDate(p.date)}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[[safeB, "Before"], [safeA, "After"]].map(([idx, lbl]) => (
                  <div key={lbl}>
                    <Label>{lbl} · {shortDate(photos[idx]?.date)}</Label>
                    <PhotoCard photo={photos[idx]} size={220} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Slider */}
          {view === "slider" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[["Before", safeB, setB], ["After", safeA, setA]].map(([label, val, setter]) => (
                  <div key={label}>
                    <Label>{label}</Label>
                    <select value={val} onChange={e => setter(+e.target.value)} style={{ padding: "10px 12px", fontSize: 13 }}>
                      {photos.map((p, i) => <option key={i} value={i}>{shortDate(p.date)}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <Card style={{ padding: 0, overflow: "hidden", borderRadius: 20, position: "relative", height: 400, userSelect: "none" }}>
                {/* Behind: Before */}
                <div style={{ position: "absolute", inset: 0, background: C.dim }}>
                  {photos[safeB]?.url
                    ? <img src={photos[safeB].url} alt="before" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <span style={{ fontSize: 32, opacity: 0.2 }}>📷</span>
                        <span style={{ fontSize: 12, color: C.muted }}>Before</span>
                      </div>
                  }
                </div>
                {/* Clipped: After */}
                <div style={{ position: "absolute", top: 0, left: 0, width: `${slider}%`, height: "100%", overflow: "hidden" }}>
                  <div style={{ width: `${10000 / slider}%`, height: "100%", background: C.dim }}>
                    {photos[safeA]?.url
                      ? <img src={photos[safeA].url} alt="after" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                          <span style={{ fontSize: 32, opacity: 0.2 }}>📷</span>
                          <span style={{ fontSize: 12, color: C.muted }}>After</span>
                        </div>
                    }
                  </div>
                </div>
                {/* Divider */}
                <div style={{ position: "absolute", top: 0, left: `${slider}%`, width: 2, height: "100%", background: "#fff", transform: "translateX(-50%)", pointerEvents: "none" }}>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 34, height: 34, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#000", fontWeight: 800, boxShadow: "0 2px 8px rgba(0,0,0,.4)" }}>⇔</div>
                </div>
                <input type="range" min={3} max={97} value={slider} onChange={e => setSlider(+e.target.value)}
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "ew-resize", zIndex: 10 }} />
                <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,.65)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#fff" }}>
                  Before · {shortDate(photos[safeB]?.date)}
                </div>
                <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,.65)", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, color: "#fff" }}>
                  After · {shortDate(photos[safeA]?.date)}
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Tab: History ──────────────────────────────────────────────────────────────
function HistoryTab({ weightData, stepsData, caloriesData }) {
  const empty = (
    <div style={{ padding: "28px 0", textAlign: "center", color: C.muted, fontSize: 13 }}>
      Not enough data yet
    </div>
  );

  return (
    <div className="anim">
      <div style={{ padding: "24px 0 20px" }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>History</div>
      </div>

      <Card style={{ marginBottom: 14 }}>
        <Label>Weight (kg)</Label>
        {weightData.length < 2 ? empty : (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={weightData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={["auto","auto"]} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="weight" stroke={C.accent} strokeWidth={2.5} dot={false} name="kg" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <Label>Steps</Label>
        {stepsData.length < 2 ? empty : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stepsData} barSize={Math.max(4, Math.min(18, Math.floor(320 / (stepsData.length || 1))))} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="steps" fill={C.amber} radius={[4,4,0,0]} name="steps" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card>
        <Label>Calories (kcal)</Label>
        {caloriesData.length < 2 ? empty : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={caloriesData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.green} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="calories" stroke={C.green} strokeWidth={2} fill="url(#cGrad)" dot={false} name="kcal" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  );
}

// ── Tab: Goals ────────────────────────────────────────────────────────────────
function GoalsTab({ goals, setGoals }) {
  const [form,   setForm]   = useState({ weight: goals.weight, calories: goals.calories, steps: goals.steps });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const save = async () => {
    setSaving(true);
    const next = {
      weight:   parseFloat(form.weight)   || goals.weight,
      calories: parseInt(form.calories)   || goals.calories,
      steps:    parseInt(form.steps)      || goals.steps,
    };
    setGoals(next);
    localStorage.setItem("physique_goals", JSON.stringify(next));

    // Attempt Sheets write (succeeds if sheet allows public edits; normally requires OAuth)
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/goals!A1:B4?valueInputOption=USER_ENTERED&key=${API_KEY}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            values: [
              ["goal_weight",     next.weight],
              ["calories_target", next.calories],
              ["steps_target",    next.steps],
            ],
          }),
        }
      );
    } catch {
      // Falls back to localStorage silently
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="anim">
      <div style={{ padding: "24px 0 20px" }}>
        <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>Goals</div>
      </div>

      <Card style={{ marginBottom: 20 }}>
        {[
          ["weight",   "Goal Weight (kg)",    "e.g. 75"],
          ["calories", "Daily Calorie Target", "e.g. 2000"],
          ["steps",    "Daily Steps Target",   "e.g. 10000"],
        ].map(([k, label, placeholder]) => (
          <div key={k} style={{ marginBottom: 20 }}>
            <Label>{label}</Label>
            <input
              type="number" inputMode="decimal"
              value={form[k]}
              onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
              placeholder={placeholder}
              style={{ fontSize: 20, fontWeight: 700, padding: "16px" }}
            />
          </div>
        ))}
        <Btn full onClick={save} disabled={saving}>
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Goals"}
        </Btn>
        <p style={{ marginTop: 14, fontSize: 12, color: C.muted, lineHeight: 1.7, textAlign: "center" }}>
          Saved to this device. To sync across devices, add a{" "}
          <strong style={{ color: C.text }}>goals</strong> sheet with rows:{" "}
          <strong style={{ color: C.text }}>goal_weight</strong>,{" "}
          <strong style={{ color: C.text }}>calories_target</strong>,{" "}
          <strong style={{ color: C.text }}>steps_target</strong>.
        </p>
      </Card>

      <Label>Current Goals</Label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 8 }}>
        {[
          ["⚖️", "Weight",   `${goals.weight} kg`],
          ["🔥", "Calories", goals.calories.toLocaleString()],
          ["👟", "Steps",    goals.steps.toLocaleString()],
        ].map(([icon, label, val]) => (
          <Card key={label} style={{ textAlign: "center", padding: "18px 8px" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: C.accent, lineHeight: 1 }}>{val}</div>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginTop: 5 }}>{label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Bottom Nav ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard", icon: "⚡", label: "Today" },
  { id: "photos",    icon: "📷", label: "Photos" },
  { id: "history",   icon: "📈", label: "History" },
  { id: "goals",     icon: "🎯", label: "Goals" },
];

function BottomNav({ tab, setTab }) {
  return (
    <nav style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
      background: `${C.surface}f0`, backdropFilter: "blur(16px)",
      borderTop: `1px solid ${C.border}`,
      display: "grid", gridTemplateColumns: "repeat(4,1fr)",
      padding: "8px 0 max(8px, env(safe-area-inset-bottom))",
    }}>
      {TABS.map(({ id, icon, label }) => {
        const active = tab === id;
        return (
          <button key={id} onClick={() => setTab(id)} style={{
            background: "none", border: "none",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            padding: "4px 0", cursor: "pointer",
            color: active ? C.accent : C.muted,
            transition: "color .15s",
          }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, letterSpacing: 0.5 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");

  const [weightData,   setWeightData]   = useState([]);
  const [stepsData,    setStepsData]    = useState([]);
  const [caloriesData, setCaloriesData] = useState([]);
  const [photos,       setPhotos]       = useState([]);

  const [goals, setGoals] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("physique_goals") || "null")
        || { weight: 0, calories: 2000, steps: 10000 };
    } catch {
      return { weight: 0, calories: 2000, steps: 10000 };
    }
  });

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const sheets = ["weight!A:B", "steps!A:B", "calories!A:B", "photos!A:B", "goals!A:B"];
        const jsons  = await Promise.all(
          sheets.map(s =>
            fetch(`${BASE}/${encodeURIComponent(s)}?key=${API_KEY}`).then(r => r.json())
          )
        );
        const [wRaw, sRaw, cRaw, pRaw, gRaw] = jsons.map(sheetRows);

        setWeightData(
          wRaw.map(r => ({ date: r[0] || "", weight: parseFloat(r[1]) || 0 }))
              .filter(r => r.date && r.weight)
        );
        setStepsData(
          sRaw.map(r => ({ date: r[0] || "", steps: parseInt(r[1]) || 0 }))
              .filter(r => r.date)
        );
        setCaloriesData(
          cRaw.map(r => ({ date: r[0] || "", calories: parseInt(r[1]) || 0 }))
              .filter(r => r.date)
        );

        // Merge Sheet photos + locally-added ones, sorted by date ascending
        const sheetPhotos = pRaw.map(r => ({ date: r[0] || "", url: r[1] || "" })).filter(r => r.date);
        const localPhotos = JSON.parse(localStorage.getItem("extra_photos") || "[]");
        const parseD = s => { const [d,m,y] = (s||"").split("/"); return new Date(+y,+m-1,+d); };
        setPhotos([...sheetPhotos, ...localPhotos].sort((a, b) => parseD(a.date) - parseD(b.date)));

        // Overlay Sheet goals (Sheet wins over localStorage defaults if non-zero)
        if (gRaw.length > 0) {
          const gMap = {};
          gRaw.forEach(r => { if (r[0] && r[1]) gMap[r[0]] = r[1]; });
          const sw = parseFloat(gMap.goal_weight     || 0);
          const sc = parseInt(gMap.calories_target   || 0);
          const ss = parseInt(gMap.steps_target      || 0);
          if (sw || sc || ss) {
            setGoals(prev => ({
              weight:   sw || prev.weight,
              calories: sc || prev.calories,
              steps:    ss || prev.steps,
            }));
          }
        }
      } catch {
        setError("Could not load data — make sure the sheet is shared publicly (Anyone with link → Viewer).");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today  = todayStr();
  const todayW = weightData.find(d => d.date === today)?.weight    ?? weightData.at(-1)?.weight    ?? 0;
  const todayS = stepsData.find(d => d.date === today)?.steps      ?? stepsData.at(-1)?.steps      ?? 0;
  const todayC = caloriesData.find(d => d.date === today)?.calories ?? caloriesData.at(-1)?.calories ?? 0;
  const last7  = weightData.slice(-7);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <style>{G}</style>
      <Spinner size={32} />
      <div style={{ fontSize: 13, color: C.muted }}>Loading your data…</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, paddingBottom: 80 }}>
      <style>{G}</style>

      {error && (
        <div style={{ background: "#1f0808", borderBottom: `1px solid ${C.red}44`, padding: "10px 20px", fontSize: 13, color: C.red }}>
          ⚠ {error}
        </div>
      )}

      <div style={{ padding: "0 16px", maxWidth: 540, margin: "0 auto" }}>
        {tab === "dashboard" && (
          <DashboardTab weight={todayW} steps={todayS} calories={todayC} goals={goals} last7={last7} />
        )}
        {tab === "photos"  && <PhotosTab photos={photos} />}
        {tab === "history" && <HistoryTab weightData={weightData} stepsData={stepsData} caloriesData={caloriesData} />}
        {tab === "goals"   && <GoalsTab goals={goals} setGoals={setGoals} />}
      </div>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

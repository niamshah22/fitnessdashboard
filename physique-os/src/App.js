import { useState, useEffect, useRef } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

// ── Google Sheets config ──────────────────────────────────────────────────────
const SHEET_ID  = "1GFHDfNERLpVwrs5MM8OyXRhSEsZbbdfzXX_H4QsF4BA";
const SHEETS_KEY = "AIzaSyDJ2sS4eMJAW9yjbzxkOpJF17lVS1UnIjE";
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
body{-webkit-text-size-adjust:100%}
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
.nav-scroll{display:flex;gap:0;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;flex-shrink:0}
.nav-scroll::-webkit-scrollbar{display:none}
.btn-tap{cursor:pointer;transition:all .15s;-webkit-tap-highlight-color:transparent;border:none;background:none}
.kpi-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:11px}
.two-col{display:grid;grid-template-columns:1.5fr 1fr;gap:14px}
.two-col-eq{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.four-col{display:grid;grid-template-columns:repeat(4,1fr);gap:11px}
.three-col{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.ex-grid{display:grid;grid-template-columns:40px 1fr 1fr 44px;gap:8px;align-items:center}
@media(max-width:768px){
  .kpi-grid{grid-template-columns:repeat(2,1fr)!important}
  .two-col{grid-template-columns:1fr!important}
  .two-col-eq{grid-template-columns:1fr!important}
  .four-col{grid-template-columns:repeat(2,1fr)!important}
  .three-col{grid-template-columns:repeat(2,1fr)!important}
  .main-pad{padding:12px 12px 90px!important}
  .hdr-status{display:none!important}
  .hdr-inner{padding:0 12px!important;height:52px!important}
  .hdr-logo-text{font-size:16px!important}
}
`;

// ── Exercise presets ──────────────────────────────────────────────────────────
const EXERCISE_PRESETS = {
  Chest:      ["Bench Press","Incline DB Press","Cable Fly","Chest Dips","Pec Dec","Push-Up","Decline Press","Dumbbell Fly"],
  Back:       ["Deadlift","Pull-Up","Barbell Row","Cable Row","Lat Pulldown","Face Pull","T-Bar Row","Shrug","Seal Row"],
  Shoulders:  ["Overhead Press","Lateral Raise","Front Raise","Rear Delt Fly","Arnold Press","Cable Lateral","DB Shoulder Press"],
  Arms:       ["Barbell Curl","Hammer Curl","Preacher Curl","Tricep Pushdown","Skull Crushers","Overhead Tri Ext","Cable Curl","Close-Grip Bench"],
  Legs:       ["Squat","Romanian Deadlift","Leg Press","Leg Curl","Leg Extension","Calf Raise","Hip Thrust","Walking Lunge","Hack Squat","Goblet Squat"],
  Core:       ["Plank","Crunch","Leg Raise","Russian Twist","Ab Wheel","Cable Crunch","Hanging Knee Raise","Bicycle Crunch"],
  Cardio:     ["Treadmill","Cycling","Rowing Machine","Jump Rope","Stairmaster","HIIT","Elliptical","Assault Bike"],
  "Full Body":["Clean & Press","Thruster","Burpee","Kettlebell Swing","Turkish Get-Up","Snatch","Push Press"],
};
const WORKOUT_TYPES  = ["Push","Pull","Legs","Upper","Lower","Full Body","Cardio","Arms","Shoulders","Back","Chest","Core"];
const MUSCLE_GROUPS  = Object.keys(EXERCISE_PRESETS);

// ── Food macro database [kcal, protein(g), carbs(g), fat(g)] per 100g ────────
const FOOD_DB = {
  // Proteins
  "chicken breast":[165,31,0,3.6],"chicken thigh":[209,26,0,11],"chicken":[177,27,0,7],
  "turkey breast":[135,30,0,1],"turkey":[189,29,0,7.4],
  "tuna":[130,30,0,1],"salmon":[208,20,0,13],"cod":[82,18,0,0.7],"sardines":[208,25,0,11.5],
  "shrimp":[99,24,0.2,0.3],"prawns":[99,24,0.2,0.3],"tilapia":[96,20,0,2],
  "egg":[155,13,1.1,11],"eggs":[155,13,1.1,11],"egg white":[52,11,0.7,0.2],"egg whites":[52,11,0.7,0.2],
  "greek yogurt":[59,10,3.6,0.4],"yogurt":[61,3.5,4.7,3.3],"cottage cheese":[98,11,3.4,4.3],
  "beef":[250,26,0,17],"steak":[271,26,0,19],"minced beef":[332,25,0,25],"ground beef":[332,25,0,25],
  "mince":[332,25,0,25],"pork":[242,27,0,14],"bacon":[541,37,0,42],"ham":[145,21,0,6],
  "tofu":[76,8,2,4.8],"tempeh":[193,19,9,11],"edamame":[121,11,9,5],
  "lentils":[116,9,20,0.4],"chickpeas":[164,8.9,27,2.6],"black beans":[132,8.9,24,0.5],"kidney beans":[127,8.7,22,0.5],
  "protein shake":[120,24,3,1.5],"whey protein":[120,24,3,1.5],"casein":[110,22,4,1],"protein powder":[120,24,3,1.5],
  "protein bar":[383,30,38,10],
  // Carbs
  "rice":[130,2.7,28,0.3],"white rice":[130,2.7,28,0.3],"brown rice":[123,2.7,23,1],
  "basmati rice":[121,3.5,25,0.4],"jasmine rice":[130,2.7,28,0.3],
  "oats":[389,17,66,7],"oatmeal":[71,2.5,12,1.5],"porridge":[71,2.5,12,1.5],
  "pasta":[131,5,25,1.1],"spaghetti":[131,5,25,1.1],"penne":[131,5,25,1.1],
  "bread":[265,9,49,3.2],"white bread":[265,7,51,3],"whole wheat bread":[247,13,41,4.2],"sourdough":[274,11,51,2],
  "toast":[265,9,49,3.2],"bagel":[257,10,50,1.6],"wrap":[234,6.1,42,5.3],"tortilla":[234,6.1,42,5.3],"pita":[275,9,56,1.2],
  "potato":[77,2,17,0.1],"potatoes":[77,2,17,0.1],"sweet potato":[86,1.6,20,0.1],
  "banana":[89,1.1,23,0.3],"apple":[52,0.3,14,0.2],"orange":[47,0.9,12,0.1],
  "grapes":[69,0.7,18,0.2],"blueberries":[57,0.7,14,0.3],"strawberries":[32,0.7,7.7,0.3],
  "mango":[60,0.8,15,0.4],"pineapple":[50,0.5,13,0.1],
  "cereal":[379,8,84,3.5],"granola":[471,11,65,19],"muesli":[374,11,66,8],
  "quinoa":[120,4.4,22,1.9],"couscous":[112,3.8,23,0.2],
  // Fats & dairy
  "olive oil":[884,0,0,100],"coconut oil":[862,0,0,100],"butter":[717,0.9,0.1,81],
  "avocado":[160,2,9,15],"avocados":[160,2,9,15],
  "almonds":[579,21,22,50],"walnuts":[654,15,14,65],"cashews":[553,18,30,44],
  "peanuts":[567,26,16,49],"peanut butter":[588,25,20,50],"almond butter":[614,21,20,56],"nut butter":[600,23,20,52],
  "nuts":[607,20,21,54],"mixed nuts":[607,20,21,54],
  "cheese":[402,25,1.3,33],"cheddar":[402,25,1.3,33],"mozzarella":[280,28,2.2,17],"feta":[264,14,4,21],
  "milk":[61,3.2,4.8,3.3],"whole milk":[61,3.2,4.8,3.3],"skimmed milk":[34,3.4,5,0.1],
  "cream":[340,2.7,3.7,35],"sour cream":[198,3.2,4.6,19],
  // Mixed / meals
  "pizza":[266,11,33,10],"burger":[295,17,24,14],"sandwich":[210,10,29,5],
  "salad":[20,1.5,3.5,0.2],"caesar salad":[110,7,7,7],"soup":[62,3.5,9,1.2],
  "sushi":[143,6,28,0.9],"sashimi":[109,22,0,2.5],
  "chips":[536,7,53,35],"crisps":[536,7,53,35],"fries":[312,3.4,41,15],"french fries":[312,3.4,41,15],
  "chocolate":[546,5,60,31],"dark chocolate":[598,8,46,42],
  "ice cream":[207,3.5,24,11],"cookie":[502,6,65,24],"cake":[371,4,56,15],
  // Drinks
  "coffee":[2,0.3,0,0],"black coffee":[2,0.3,0,0],"latte":[50,3.3,5,2],
  "orange juice":[45,0.7,10,0.2],"apple juice":[46,0.1,11,0.1],
  // Vegetables
  "broccoli":[34,2.8,7,0.4],"spinach":[23,2.9,3.6,0.4],"kale":[49,4.3,9,0.9],
  "cucumber":[16,0.7,3.6,0.1],"tomato":[18,0.9,3.9,0.2],"tomatoes":[18,0.9,3.9,0.2],
  "carrot":[41,0.9,10,0.2],"carrots":[41,0.9,10,0.2],"pepper":[31,1,7,0.3],
  "onion":[40,1.1,9.3,0.1],"mushrooms":[22,3.1,3.3,0.3],
  "corn":[86,3.3,19,1.4],"peas":[81,5.4,14,0.4],
};

// Default serving sizes (grams) when no quantity given
const SERVING_SIZE = {
  "egg":55,"eggs":55,"egg white":50,"egg whites":50,
  "banana":118,"apple":182,"orange":131,"grapes":80,"blueberries":80,"strawberries":100,
  "bread":30,"white bread":30,"toast":30,"whole wheat bread":30,"sourdough":35,
  "bagel":98,"wrap":60,"tortilla":45,"pita":60,
  "protein shake":300,"whey protein":35,"casein":35,"protein powder":35,"protein bar":60,
  "latte":240,"coffee":240,"black coffee":240,"orange juice":240,"apple juice":240,
  "milk":240,"whole milk":240,"skimmed milk":240,
  "cookie":30,"cake":80,"chocolate":30,"dark chocolate":30,"ice cream":100,
  "butter":10,"olive oil":10,"coconut oil":10,
  "oatmeal":250,"porridge":250,
  "salad":150,"caesar salad":200,"soup":300,
  "pizza":150,"burger":200,"sandwich":200,"sushi":150,
  "fries":100,"french fries":100,"chips":30,"crisps":25,
  "avocado":150,"almonds":30,"walnuts":30,"cashews":30,"peanuts":30,"nuts":30,"mixed nuts":30,
  "peanut butter":32,"almond butter":32,"nut butter":32,
  "bacon":60,"ham":80,"steak":200,"chicken breast":150,"chicken thigh":150,"chicken":150,
  "salmon":150,"tuna":130,"cod":150,"shrimp":100,"prawns":100,
  "greek yogurt":150,"yogurt":150,"cottage cheese":150,
  "lentils":200,"chickpeas":150,"black beans":150,"kidney beans":150,
  "potato":150,"sweet potato":150,"broccoli":150,"spinach":80,"kale":80,
};

// Parse free-text food entry ₒ macros
function estimateMacros(text) {
  const lower = text.toLowerCase();
  let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  // Split on connectors
  const parts = lower.split(/\band\b|\bwith\b|,|\+|&|\bthen\b|\bplus\b/);
  for (const part of parts) {
    let p = part.trim();
    if (!p) continue;
    let grams = null;
    let multiplier = 1;
    // Match "200g" or "200ml"
    const gmatch = p.match(/(\d+\.?\d*)\s*(?:g|grams?|ml)\b/);
    if (gmatch) { grams = parseFloat(gmatch[1]); p = p.replace(gmatch[0], "").trim(); }
    // Match leading number e.g. "2 eggs"
    if (!gmatch) {
      const nmatch = p.match(/^(\d+\.?\d*)\s+/);
      if (nmatch) { multiplier = parseFloat(nmatch[1]); p = p.replace(nmatch[0], "").trim(); }
    }
    // Strip "a " / "an "
    p = p.replace(/^an?\s+/, "").trim();
    // Strip size modifiers
    p = p.replace(/^(large|small|big|medium|bowl of|cup of|serving of|scoop of|glass of|slice of|slices? of|handful of|portion of|piece of|pieces? of)\s+/, m => {
      if (m.startsWith("large")) multiplier *= 1.5;
      else if (m.startsWith("small")) multiplier *= 0.7;
      return "";
    }).trim();
    // Find best matching food
    let bestKey = null, bestLen = 0;
    for (const key of Object.keys(FOOD_DB)) {
      if (p.includes(key) && key.length > bestLen) { bestKey = key; bestLen = key.length; }
    }
    if (bestKey) {
      const [kcal, prot, carbs, fat] = FOOD_DB[bestKey];
      const servingG = grams !== null ? grams : ((SERVING_SIZE[bestKey] || 150) * multiplier);
      const scale = servingG / 100;
      total.calories += kcal * scale;
      total.protein  += prot  * scale;
      total.carbs    += carbs * scale;
      total.fat      += fat   * scale;
    }
  }
  return { calories: Math.round(total.calories), protein: Math.round(total.protein), carbs: Math.round(total.carbs), fat: Math.round(total.fat) };
}

const todayKey = () => new Date().toISOString().slice(0, 10);

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
 (j.values || []).slice(1));

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

  // ── Workout timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!wlStartTime) return;
    const iv = setInterval(() => setWlElapsed(Math.floor((Date.now() - wlStartTime) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [wlStartTime]);

  // ── Food logger: load from localStorage + midnight reset ─────────────────
  useEffect(() => {
    const key = `physique_meals_${todayKey()}`;
    try { setFlMeals(JSON.parse(localStorage.getItem(key) || "[]")); } catch {}
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const ms = midnight - now;
    const t = setTimeout(() => { setFlMeals([]); try { localStorage.removeItem(key); } catch {} }, ms);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(`physique_meals_${todayKey()}`, JSON.stringify(flMeals)); } catch {}
  }, [flMeals]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chatLoading]);

  // ── Derived values ────────────────────────────────────────────────────────
  const EMPTY_ENTRY   = { weight: 0, fat: 0, muscle: 0, water: 0, date: "-" };
  const latest        = weightData.length > 0 ? weightData[weightData.length - 1] : EMPTY_ENTRY;
  const prev          = weightData.length > 1 ? weightData[weightData.length - 2] : latest;
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

  // Food totals
  const flTotals = flMeals.reduce((acc, m) => ({
    calories: acc.calories + m.calories,
    protein:  acc.protein  + m.protein,
    carbs:    acc.carbs    + m.carbs,
    fat:      acc.fat      + m.fat,
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const TABS = ["overview","body","nutrition","training","photos","checkin","coach","workout","food"];
  const TAB_LABELS = { overview:"Overview", body:"Body", nutrition:"Nutrition", training:"Training",
    photos:"Photos", checkin:"Check-in", coach:"⚡ Coach", workout:"🏋 Workout", food:"🍽 Food" };

  // ── Workout Logger actions ────────────────────────────────────────────────
  const addExercise = (name) => {
    if (wlExercises.find(e => e.name === name)) return;
    setWlExercises(prev => [...prev, { name, sets: [{ reps: "", weight: "", done: false }] }]);
    if (!wlStartTime) setWlStartTime(Date.now());
  };
  const removeExercise = (exIdx) => setWlExercises(prev => prev.filter((_, i) => i !== exIdx));
  const addSet = (exIdx) => setWlExercises(prev => prev.map((e, i) =>
    i === exIdx ? { ...e, sets: [...e.sets, { reps: "", weight: "", done: false }] } : e));
  const updateSet = (exIdx, setIdx, field, value) => setWlExercises(prev => prev.map((e, i) =>
    i === exIdx ? { ...e, sets: e.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) } : e));
  const resetWorkout = () => { setWlExercises([]); setWlStartTime(null); setWlElapsed(0); setWlSaved(false); };

  const saveWorkout = async () => {
    if (!wlExercises.length) return;
    setWlSaving(true);
    const today    = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    const duration = wlStartTime ? Math.floor((Date.now() - wlStartTime) / 60000) : 0;
    const totalVol = wlExercises.reduce((sum, ex) =>
      sum + ex.sets.reduce((s2, set) => s2 + (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0), 0), 0);
    const exerciseStr = wlExercises.map(ex =>
      `${ex.name}(${ex.sets.filter(s => s.reps || s.weight).map(s => `${s.reps}×${s.weight}kg`).join(",")})`
    ).join("|");
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/workouts!A:E:append?valueInputOption=USER_ENTERED&key=${SHEETS_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [[today, wlType, duration, Math.round(totalVol), exerciseStr]] }),
      });
    } catch {}
    setWlSaved(true);
    setWlSaving(false);
  };

  // ── Food Logger actions ───────────────────────────────────────────────────
  const addMeal = () => {
    if (!flInput.trim()) return;
    const macros = estimateMacros(flInput);
    const time   = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    setFlMeals(m => [...m, { time, text: flInput.trim(), ...macros }]);
    setFlInput("");
  };
  const deleteMeal = (idx) => setFlMeals(m => m.filter((_, i) => i !== idx));

  // ── Check-in submit ───────────────────────────────────────────────────────
  const submitCheckin = async () => {
    setCiSaving(true);
    try {
      const today     = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/checkins!A:G:append?valueInputOption=USER_ENTERED&key=${SHEETS_KEY}`;
      await fetch(appendUrl, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: [[today, ci.mood, ci.sleep, ci.energy, ci.stress, ci.water, ci.notes]] }),
      });
      const res  = await fetch(`${BASE_URL}/${encodeURIComponent("checkins!A:G")}?key=${SHEETS_KEY}`);
      const data = await res.json();
      setCheckins((data.values || []).slice(1)
        .map(r => ({ date: r[0]||"", mood: parseFloat(r[1])||0, sleep: parseFloat(r[2])||0, energy: parseFloat(r[3])||0, stress: parseFloat(r[4])||0, water: parseFloat(r[5])||0, notes: r[6]||"" }))
        .filter(r => r.date));
    } catch (err) {
      console.warn("Check-in write failed:", err);
    } finally { setCiDone(true); setCiSaving(false); }
  };

  const buildCtx = () => `You are a personal physique coach. You have access to real data below. Be specific, concise, reference actual numbers. Max 3 paragraphs.
BODY COMPOSITION: ${weightData.map(d => `${d.date}: ${d.weight}kg | ${d.fat}%fat | ${d.muscle}kg muscle`).join("\n")}
RECENT CHECK-INS: ${checkins.slice(0, 7).map(c => `${c.date}: mood ${c.mood}/10, sleep ${c.sleep}h, energy ${c.energy}/10, stress ${c.stress}/10, water ${c.water}L — "${c.notes}"`).join("\n")}
TODAY'S CHECK-IN: mood ${ci.mood}/10 | sleep ${ci.sleep}h | energy ${ci.energy}/10 | stress ${ci.stress}/10 | water ${ci.water}L | "${ci.notes}"
THIS WEEK STEPS: ${stepsData.map(d => `${d.day}:${d.steps}`).join(", ")}
THIS WEEK NUTRITION: ${nutritionData.map(d => `${d.day}:${d.calories}kcal,${d.protein}gP`).join(", ")}
RECENT WORKOUTS: ${workouts.slice(0, 5).map(w => `${w.date} ${w.type} ${w.duration}min ${w.volume}kg`).join(" | ")}
TODAY'S FOOD LOG: ${flMeals.length ? flMeals.map(m => `${m.time} ${m.text} (${m.calories}kcal, ${m.protein}gP)`).join(" | ") : "Nothing logged yet"}`;

  const send = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next); setChatInput(""); setChatLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: buildCtx(), messages: next.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data  = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "Could not get a response.";
      setMessages(p => [...p, { role: "assistant", content: reply }]);
    } catch { setMessages(p => [...p, { role: "assistant", content: "Connection error." }]); }
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
      <header style={{ position: "sticky", top: 0, zIndex: 200, background: `${T.bg}ee`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${T.border}` }}>
        <div className="hdr-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 58 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: `linear-gradient(135deg,${T.teal},${T.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
            <div>
              <div className="hdr-logo-text" style={{ ...bebas, fontSize: 19, letterSpacing: 2.5, lineHeight: 1 }}>PHYSIQUE OS</div>
              <div style={{ ...mono, fontSize: 8, color: T.textDim, letterSpacing: 3 }}>PERSONAL ANALYTICS</div>
            </div>
          </div>
          <nav className="nav-scroll" style={{ flex: 1, margin: "0 12px" }}>
            {TABS.map(t => (
              <button key={t} className="tb" onClick={() => setTab(t)} style={{ background: "none", border: "none", ...mono, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", whiteSpace: "nowrap", color: tab === t ? T.teal : T.textDim, padding: "6px 10px", borderBottom: tab === t ? `2px solid ${T.teal}` : "2px solid transparent" }}>
                {TAB_LABELS[t]}
              </button>
            ))}
          </nav>
          <div className="hdr-status" style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: T.teal, boxShadow: `0 0 7px ${T.teal}`, animation: "pulse 2s infinite" }} />
            <span style={{ ...mono, fontSize: 10, color: T.textDim }}>LIVE · SHEETS</span>
          </div>
        </div>
      </header>

      <main className="main-pad" style={{ padding: "24px 24px 60px", maxWidth: 1300, margin: "0 auto" }}>

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="fu">
            <div className="kpi-grid" style={{ marginBottom: 20 }}>
              <KPI label="Body Weight"  value={latest.weight}                unit="kg"   color={T.teal}   delta={+(latest.weight - prev.weight).toFixed(1)} />
              <KPI label="Body Fat"     value={`${latest.fat}%`}            unit=""     color={T.red}    delta={+(latest.fat - prev.fat).toFixed(1)} />
              <KPI label="Muscle Mass"  value={latest.muscle}               unit="kg"   color={T.blue}   delta={-(+(latest.muscle - prev.muscle).toFixed(1))} />
              <KPI label="Steps Today"  value={todaySteps.toLocaleString()} unit=""     color={T.amber}  sub={`${Math.round((todaySteps / stepsGoal) * 100)}% of ${(stepsGoal/1000).toFixed(0)}k goal`} />
              <KPI label="Calories"     value={todayCalories.toLocaleString()} unit="kcal" color={T.purple} sub={`${Math.abs(todayCalories - calorieGoal)} ${todayCalories < calorieGoal ? "under" : "over"} target`} />
            </div>
            <div className="two-col" style={{ marginBottom: 14 }}>
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
            <div className="two-col-eq">
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <ST sub="LATEST">LATEST CHECK-IN</ST>
                  <Pill color={T.teal}>DAILY</Pill>
                </div>
                {checkins.length === 0 ? (
                  <div style={{ ...mono, fontSize: 12, color: T.textDim, padding: "20px 0", textAlign: "center" }}>No check-ins yet.</div>
                ) : (
                  <>
                    <div className="three-col" style={{ marginBottom: 12 }}>
                      {[["Mood", latestCheckin.mood, "/10", T.amber], ["Sleep", latestCheckin.sleep, "hrs", T.blue], ["Energy", latestCheckin.energy, "/10", T.teal]].map(([l, v, u, c]) => (
                        <div key={l} style={{ background: T.surfaceAlt, borderRadius: 9, padding: "11px 8px", textAlign: "center" }}>
                          <div style={{ ...bebas, fontSize: 28, color: c, lineHeight: 1 }}>{v}</div>
                          <div style={{ ...mono, fontSize: 9, color: T.textDim, textTransform: "uppercase", marginTop: 3 }}>{l}{u}</div>
                        </div>
                      ))}
                    </div>
                    <div className="two-col-eq" style={{ marginBottom: 12 }}>
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
                    <div className="two-col-eq" style={{ marginBottom: 12 }}>
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
            <div className="four-col" style={{ marginBottom: 20 }}>
              <KPI label="Current Weight" value={latest.weight}        unit="kg" color={T.teal}   delta={+(latest.weight - prev.weight).toFixed(1)} />
              <KPI label="Body Fat"       value={`${latest.fat}%`}    unit=""   color={T.red} />
              <KPI label="Muscle Mass"    value={`${latest.muscle}kg`} unit=""   color={T.blue} />
              <KPI label="Body Water"     value={`${latest.water}%`}  unit=""   color={T.purple} />
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
        )}

        {/* ── NUTRITION ── */}
        {tab === "nutrition" && (
          <div className="fu">
            <div className="four-col" style={{ marginBottom: 20 }}>
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
            <div className="four-col" style={{ marginBottom: 20 }}>
              <KPI label="Total Sessions"  value={workouts.length}                                                    unit=""    color={T.amber} />
              <KPI label="Total Volume"    value={fmtNum(totalVolume)}                                                 unit="kg"  color={T.blue} />
              <KPI label="Avg Duration"    value={avgDuration}                                                         unit="min" color={T.teal} />
              <KPI label="Types Logged"    value={[...new Set(workouts.map(w => w.type))].length}                      unit=""    color={T.red} />
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
              <Card><div style={{ textAlign: "center", ...mono, fontSize: 12, color: T.textDim, padding: 32 }}>No photos yet — add rows to the photos tab in your Google Sheet.</div></Card>
            ) : (
              <>
                {photoView === "grid" && (
                  <div className="three-col">
                    {photos.map((p, i) => <Photo key={i} photo={p} size={160} />)}
                  </div>
                )}
                {photoView === "compare" && (
                  <div>
                    <div className="two-col-eq" style={{ marginBottom: 16 }}>
                      {[["PHOTO A", safeCompareA, setCompareA], ["PHOTO B", safeCompareB, setCompareB]].map(([label, val, setter]) => (
                        <div key={label}>
                          <div style={{ ...mono, fontSize: 10, color: T.textDim, letterSpacing: 2, marginBottom: 8 }}>SELECT {label}</div>
                          <div className="three-col">
                            {photos.map((p, i) => <Photo key={i} photo={p} size={100} selected={val === i} onClick={() => setter(i)} />)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="two-col-eq">
                      <Photo photo={photos[safeCompareA]} size={260} />
                      <Photo photo={photos[safeCompareB]} size={260} />
                    </div>
                    <Card style={{ marginTop: 12 }}>
                      <div style={{ display: "flex", gap: 28 }}>
                        {[["Weight Δ", `${(photos[safeCompareA].weight - photos[safeCompareB].weight).toFixed(1)} kg`, T.teal],["Fat % Δ", `${(photos[safeCompareA].fat - photos[safeCompareB].fat).toFixed(1)}%`, T.red],["Time span", `${Math.abs(safeCompareB - safeCompareA)} entries`, T.blue]].map(([l, v, c]) => (
                          <div key={l}><div style={{ ...bebas, fontSize: 24, color: c }}>{v}</div><div style={{ ...mono, fontSize: 10, color: T.textDim, textTransform: "uppercase" }}>{l}</div></div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
                {photoView === "slider" && (
                  <div>
                    <div style={{ display: "flex", gap: 14, marginBottom: 16, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
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
                    {ciSaving ? <><div style={{ width: 13, height: 13, border: `2px solid #333`, borderTopColor: T.teal, borderRadius: "50%", animation: "spin .7s linear infinite" }} /> SAVING…</> : "SAVE CHECK-IN →"}
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
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
                LIVE DATA: {weightData.length} weight · {checkins.length} check-ins · {workouts.length} workouts · {stepsData.length} step days · {flMeals.length} meals today
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
              Live data from Google Sheets + today's food log is injected into every message.
            </div>
          </div>
        )}

        {/* ── WORKOUT LOGGER ── */}
        {tab === "workout" && (
          <div className="fu" style={{ maxWidth: 700, margin: "0 auto" }}>
            {wlSaved ? (
              <Card style={{ textAlign: "center", padding: 44 }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>💪</div>
                <div style={{ ...bebas, fontSize: 28, letterSpacing: 1, color: T.teal, marginBottom: 8 }}>WORKOUT SAVED!</div>
                <div style={{ color: T.textMid, fontSize: 14, marginBottom: 6 }}>
                  {wlExercises.length} exercises · {wlExercises.reduce((s, e) => s + e.sets.length, 0)} sets · {fmtTime(wlElapsed)} elapsed
                </div>
                <div style={{ color: T.textDim, fontSize: 13, marginBottom: 24 }}>
                  {wlExercises.reduce((s, e) => s + e.sets.reduce((s2, st) => s2 + (parseFloat(st.weight)||0)*(parseInt(st.reps)||0), 0), 0).toLocaleString()} kg total volume
                </div>
                <button onClick={resetWorkout} style={{ background: `linear-gradient(135deg,${T.teal},${T.blue})`, border: "none", borderRadius: 12, padding: "14px 28px", color: "#000", ...mono, fontSize: 12, letterSpacing: 3, fontWeight: 600, cursor: "pointer" }}>
                  START NEW WORKOUT
                </button>
              </Card>
            ) : (
              <>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <ST sub="LOG YOUR SESSION">🏋 WORKOUT LOGGER</ST>
                  {wlStartTime && (
                    <div style={{ ...bebas, fontSize: 30, color: T.teal, letterSpacing: 3 }}>{fmtTime(wlElapsed)}</div>
                  )}
                </div>

                {/* Workout type */}
                <Card style={{ marginBottom: 12, padding: "16px 18px" }}>
                  <div style={{ ...mono, fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>WORKOUT TYPE</div>
                  <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                    {WORKOUT_TYPES.map(t => (
                      <button key={t} onClick={() => setWlType(t)} style={{ ...mono, fontSize: 11, letterSpacing: 1, background: wlType === t ? `${T.amber}22` : "none", border: `1px solid ${wlType === t ? T.amber : T.border}`, color: wlType === t ? T.amber : T.textDim, borderRadius: 8, padding: "9px 14px", cursor: "pointer", transition: "all .15s", minHeight: 40 }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Exercise picker */}
                <Card style={{ marginBottom: 12, padding: "16px 18px" }}>
                  <div style={{ ...mono, fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>ADD EXERCISES</div>
                  {/* Muscle group tabs */}
                  <div className="nav-scroll" style={{ gap: 7, marginBottom: 14, paddingBottom: 4 }}>
                    {MUSCLE_GROUPS.map(mg => (
                      <button key={mg} onClick={() => setWlMuscle(mg)} style={{ ...mono, fontSize: 11, whiteSpace: "nowrap", flexShrink: 0, background: wlMuscle === mg ? `${T.teal}22` : "none", border: `1px solid ${wlMuscle === mg ? T.teal : T.border}`, color: wlMuscle === mg ? T.teal : T.textDim, borderRadius: 8, padding: "10px 16px", cursor: "pointer", minHeight: 42, transition: "all .15s" }}>
                        {mg}
                      </button>
                    ))}
                  </div>
                  {/* Exercise buttons */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {EXERCISE_PRESETS[wlMuscle].map(ex => {
                      const added = !!wlExercises.find(e => e.name === ex);
                      return (
                        <button key={ex} onClick={() => addExercise(ex)} style={{ ...mono, fontSize: 12, background: added ? `${T.teal}22` : T.surfaceAlt, border: `1px solid ${added ? T.teal : T.border}`, color: added ? T.teal : T.text, borderRadius: 9, padding: "11px 16px", cursor: "pointer", transition: "all .15s", minHeight: 44 }}>
                          {added ? "✓ " : ""}{ex}
                        </button>
                      );
                    })}
                  </div>
                </Card>

                {/* Exercise list with sets */}
                {wlExercises.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
                    {wlExercises.map((ex, exIdx) => (
                      <Card key={exIdx} style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                          <div style={{ ...mono, fontSize: 14, fontWeight: 600, color: T.text }}>{ex.name}</div>
                          <button onClick={() => removeExercise(exIdx)} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 20, padding: "2px 8px", lineHeight: 1 }}>×</button>
                        </div>
                        {/* Set headers */}
                        <div className="ex-grid" style={{ marginBottom: 8 }}>
                          <div style={{ ...mono, fontSize: 10, color: T.textDim }}>SET</div>
                          <div style={{ ...mono, fontSize: 10, color: T.textDim, textAlign: "center" }}>KG</div>
                          <div style={{ ...mono, fontSize: 10, color: T.textDim, textAlign: "center" }}>REPS</div>
                          <div style={{ ...mono, fontSize: 10, color: T.textDim, textAlign: "center" }}>✓</div>
                        </div>
                        {/* Sets */}
                        {ex.sets.map((set, setIdx) => (
                          <div key={setIdx} className="ex-grid" style={{ marginBottom: 8 }}>
                            <div style={{ ...mono, fontSize: 13, color: T.textDim, textAlign: "center" }}>{setIdx + 1}</div>
                            <input type="number" inputMode="decimal" placeholder="0" value={set.weight} onChange={e => updateSet(exIdx, setIdx, "weight", e.target.value)}
                              className="ci" style={{ padding: "12px 8px", textAlign: "center", fontSize: 16, fontFamily: "DM Mono", borderRadius: 9, width: "100%" }} />
                            <input type="number" inputMode="numeric" placeholder="0" value={set.reps} onChange={e => updateSet(exIdx, setIdx, "reps", e.target.value)}
                              className="ci" style={{ padding: "12px 8px", textAlign: "center", fontSize: 16, fontFamily: "DM Mono", borderRadius: 9, width: "100%" }} />
                            <button onClick={() => updateSet(exIdx, setIdx, "done", !set.done)}
                              style={{ background: set.done ? `${T.teal}22` : "none", border: `1px solid ${set.done ? T.teal : T.border}`, borderRadius: 9, padding: 10, color: set.done ? T.teal : T.textDim, cursor: "pointer", fontSize: 16, minHeight: 44, width: "100%" }}>
                              {set.done ? "✓" : "○"}
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addSet(exIdx)} style={{ ...mono, fontSize: 11, letterSpacing: 1.5, background: `${T.blue}12`, border: `1px solid ${T.blue}33`, color: T.blue, borderRadius: 9, padding: "12px 16px", cursor: "pointer", width: "100%", marginTop: 6, minHeight: 44, transition: "all .15s" }}>
                          + ADD SET
                        </button>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Save button */}
                {wlExercises.length > 0 && (
                  <button onClick={saveWorkout} disabled={wlSaving} style={{ background: wlSaving ? T.surfaceAlt : `linear-gradient(135deg,${T.teal},${T.blue})`, border: "none", borderRadius: 14, padding: "18px 24px", color: wlSaving ? "#555" : "#000", ...mono, fontSize: 13, letterSpacing: 3, fontWeight: 600, cursor: wlSaving ? "not-allowed" : "pointer", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, transition: "all .2s", minHeight: 56 }}>
                    {wlSaving ? <><div style={{ width: 14, height: 14, border: `2px solid #333`, borderTopColor: T.teal, borderRadius: "50%", animation: "spin .7s linear infinite" }} /> SAVING WORKOUT…</> : `💾 SAVE WORKOUT · ${wlExercises.length} EXERCISES`}
                  </button>
                )}

                {wlExercises.length === 0 && (
                  <Card style={{ textAlign: "center", padding: 48 }}>
                    <div style={{ fontSize: 40, marginBottom: 14 }}>🏋️</div>
                    <div style={{ ...mono, fontSize: 12, color: T.textDim, lineHeight: 1.8 }}>Select a muscle group above and tap exercises to build your workout.</div>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* ── FOOD LOGGER ── */}
        {tab === "food" && (
          <div className="fu" style={{ maxWidth: 700, margin: "0 auto" }}>
            <ST sub={`DAILY MACRO TRACKER · ${new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }).toUpperCase()}`}>🍽 FOOD LOGGER</ST>

            {/* Daily totals progress bars */}
            <Card style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ ...mono, fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 2 }}>TODAY'S TOTALS</div>
                {flMeals.length > 0 && (
                  <div style={{ ...mono, fontSize: 10, color: T.textDim }}>{flMeals.length} meal{flMeals.length !== 1 ? "s" : ""} logged</div>
                )}
              </div>
              <ProgressBar label="Calories" value={flTotals.calories} target={flTargets.calories} unit="kcal" color={T.amber} />
              <ProgressBar label="Protein"  value={flTotals.protein}  target={flTargets.protein}  unit="g"    color={T.teal} />
              <ProgressBar label="Carbs"    value={flTotals.carbs}    target={flTargets.carbs}    unit="g"    color={T.blue} />
              <ProgressBar label="Fat"      value={flTotals.fat}      target={flTargets.fat}      unit="g"    color={T.red} />
              <div style={{ ...mono, fontSize: 9, color: T.textDim, marginTop: 4 }}>Targets: {flTargets.calories} kcal · {flTargets.protein}g protein · {flTargets.carbs}g carbs · {flTargets.fat}g fat · Resets at midnight</div>
            </Card>

            {/* Meal input */}
            <Card style={{ marginBottom: 14 }}>
              <div style={{ ...mono, fontSize: 10, color: T.textDim, textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>LOG A MEAL</div>
              <textarea className="ci" rows={3} value={flInput} onChange={e => setFlInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && e.metaKey && addMeal()}
                placeholder={"e.g. 200g chicken breast and 150g rice with broccoli\nor: 2 eggs, toast and a latte\nor: protein shake with banana"}
                style={{ width: "100%", padding: "13px 14px", resize: "vertical", lineHeight: 1.65, marginBottom: 11, borderRadius: 10, fontSize: 14 }} />
              <button onClick={addMeal} disabled={!flInput.trim()} style={{ background: flInput.trim() ? `linear-gradient(135deg,${T.teal},${T.blue})` : T.surfaceAlt, border: "none", borderRadius: 11, padding: "15px 24px", color: flInput.trim() ? "#000" : T.textDim, ...mono, fontSize: 12, letterSpacing: 3, fontWeight: 600, cursor: flInput.trim() ? "pointer" : "not-allowed", width: "100%", transition: "all .2s", minHeight: 52 }}>
                ESTIMATE & LOG MEAL →
              </button>
              <div style={{ ...mono, fontSize: 10, color: T.textDim, marginTop: 9, textAlign: "center" }}>
                Macros are estimated from a built-in food database. Specify grams for best accuracy.
              </div>
            </Card>

            {/* Meal history */}
            {flMeals.length === 0 ? (
              <Card style={{ textAlign: "center", padding: 48 }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>🥗</div>
                <div style={{ ...mono, fontSize: 12, color: T.textDim, lineHeight: 1.8 }}>
                  Log your meals in plain text above.<br />Macros are estimated automatically.
                </div>
              </Card>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[...flMeals].reverse().map((meal, ri) => {
                  const i = flMeals.length - 1 - ri;
                  return (
                    <Card key={i} style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ ...mono, fontSize: 10, color: T.textDim, marginBottom: 4 }}>{meal.time}</div>
                          <div style={{ fontSize: 13, color: T.textMid, lineHeight: 1.5 }}>{meal.text}</div>
                        </div>
                        <button onClick={() => deleteMeal(i)} style={{ background: "none", border: "none", color: T.textDim, cursor: "pointer", fontSize: 20, padding: "0 4px", lineHeight: 1, marginLeft: 8, flexShrink: 0 }}>×</button>
                      </div>
                      <div className="four-col">
                        {[["Kcal", meal.calories, T.amber], ["Protein", `${meal.protein}g`, T.teal], ["Carbs", `${meal.carbs}g`, T.blue], ["Fat", `${meal.fat}g`, T.red]].map(([l, v, c]) => (
                          <div key={l} style={{ textAlign: "center", background: T.surfaceAlt, borderRadius: 8, padding: "9px 4px" }}>
                            <div style={{ ...bebas, fontSize: 20, color: c, lineHeight: 1 }}>{v}</div>
                            <div style={{ ...mono, fontSize: 9, color: T.textDim, textTransform: "uppercase", marginTop: 3 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

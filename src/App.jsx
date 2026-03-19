import { useState, useEffect } from "react";

const KEY = "calorie_v2";

function startOfWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function loadData() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (!raw) return null;
    if (new Date(raw.weekStart).getTime() !== startOfWeek().getTime())
      return { meals: [], savedMeals: raw.savedMeals || [], weeklyLimit: raw.weeklyLimit || 14000, weekStart: startOfWeek().toISOString() };
    return raw;
  } catch { return null; }
}

function fmt(n) { return Math.round(n).toLocaleString(); }
function dateKey(d) { return new Date(d).toDateString(); }
function todayStr() { const d = new Date(); d.setHours(0, 0, 0, 0); return d.toDateString(); }
function formatTime(iso) { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function getWeekDays() {
  const s = startOfWeek();
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(s); d.setDate(s.getDate() + i); return d; });
}

export default function App() {
  const raw = loadData();
  const [meals, setMeals] = useState(raw?.meals || []);
  const [savedMeals, setSavedMeals] = useState(raw?.savedMeals || []);
  const [weeklyLimit, setWeeklyLimit] = useState(raw?.weeklyLimit || 14000);
  const [activeTab, setActiveTab] = useState("today");
  const [quickFilter, setQuickFilter] = useState("");
  const [addName, setAddName] = useState("");
  const [addCal, setAddCal] = useState("");
  const [saveName, setSaveName] = useState("");
  const [saveCal, setSaveCal] = useState("");
  const [saveFlash, setSaveFlash] = useState(false);
  const [flashIdx, setFlashIdx] = useState(null);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ meals, savedMeals, weeklyLimit, weekStart: startOfWeek().toISOString() }));
  }, [meals, savedMeals, weeklyLimit]);

  const calsForDay = (s) => meals.filter(m => dateKey(m.date) === s).reduce((a, m) => a + m.calories, 0);
  const weekCals = () => meals.reduce((a, m) => a + m.calories, 0);
  const daysLeft = () => 7 - new Date().getDay();
  const dailyTarget = () => { const r = weeklyLimit - weekCals(); const d = daysLeft(); return d > 0 ? Math.ceil(r / d) : 0; };

  const todayCals = calsForDay(todayStr());
  const dt = dailyTarget();
  const wc = weekCals();
  const wr = Math.min(wc / weeklyLimit, 1);
  const ratio = dt > 0 ? todayCals / dt : 0;

  function progressClass(r) { return r < 0.85 ? "fill-good" : r < 1.05 ? "fill-warn" : "fill-danger"; }
  function statusClass(c, t) { if (!t) return ""; const r = c / t; return r < 0.85 ? "good" : r < 1.05 ? "warn" : "danger"; }

  function addMeal() {
    const cal = parseInt(addCal);
    if (!cal || cal <= 0) return;
    setMeals([...meals, { name: addName.trim() || "Meal", calories: cal, date: new Date().toISOString() }]);
    setAddName(""); setAddCal("");
  }

  function saveMealToFav() {
    const cal = parseInt(addCal);
    if (!addName.trim() || !cal || cal <= 0) return;
    setSavedMeals([...savedMeals, { name: addName.trim(), calories: cal }]);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1200);
  }

  function quickAdd(idx) {
    const m = savedMeals[idx];
    setMeals([...meals, { name: m.name, calories: m.calories, date: new Date().toISOString() }]);
    setFlashIdx(idx);
    setTimeout(() => setFlashIdx(null), 420);
  }

  function deleteMeal(idx) { setMeals(meals.filter((_, i) => i !== idx)); }
  function deleteSaved(idx) { setSavedMeals(savedMeals.filter((_, i) => i !== idx)); }
  function createSaved() {
    const cal = parseInt(saveCal);
    if (!saveName.trim() || !cal || cal <= 0) return;
    setSavedMeals([...savedMeals, { name: saveName.trim(), calories: cal }]);
    setSaveName(""); setSaveCal("");
  }

  const days = getWeekDays();
  const todayMeals = meals.filter(m => dateKey(m.date) === todayStr()).reverse();
  const filtered = quickFilter ? savedMeals.filter(m => m.name.toLowerCase().includes(quickFilter.toLowerCase())) : savedMeals;

  const tabs = ["today", "week", "log", "saved", "settings"];

  let badgeText = "", badgeClass = "badge-good";
  if (dt <= 0) { badgeText = "Week done"; badgeClass = "badge-warn"; }
  else if (todayCals > dt * 1.05) { badgeText = "Over today"; badgeClass = "badge-danger"; }
  else if (todayCals < dt * 0.5) { badgeText = `${fmt(dt - todayCals)} left`; badgeClass = "badge-warn"; }
  else { badgeText = "On track"; badgeClass = "badge-good"; }

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1>Calorie Tracker</h1>
          <div className="header-sub">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
        </div>
        <span className={`badge ${badgeClass}`}>{badgeText}</span>
      </div>

      <div className="nav">
        {tabs.map(t => (
          <button key={t} className={activeTab === t ? "active" : ""} onClick={() => setActiveTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </div>

      {/* TODAY */}
      {activeTab === "today" && (
        <div>
          <div className="daily-hero">
            <div className={`num ${statusClass(todayCals, dt)}`}>{fmt(todayCals)}</div>
            <div className="denom">of {fmt(dt)} daily target</div>
          </div>

          <div className="card">
            <div className="progress-wrap">
              <div className="progress-label"><span>Today</span><span>{fmt(todayCals)} / {fmt(dt)}</span></div>
              <div className="progress-track"><div className={`progress-fill ${progressClass(ratio)}`} style={{ width: `${Math.min(ratio * 100, 100)}%` }} /></div>
            </div>
            <div className="progress-wrap" style={{ marginTop: 12 }}>
              <div className="progress-label"><span>Weekly</span><span>{fmt(wc)} / {fmt(weeklyLimit)}</span></div>
              <div className="progress-track"><div className="progress-fill fill-blue" style={{ width: `${Math.min(wr * 100, 100)}%` }} /></div>
            </div>
          </div>

          <div className="stats">
            <div className="stat">
              <div className="stat-label">Remaining today</div>
              <div className={`stat-value ${dt - todayCals < 0 ? "danger" : "good"}`}>{fmt(Math.max(dt - todayCals, 0))}</div>
              <div className="stat-sub">kcal left</div>
            </div>
            <div className="stat">
              <div className="stat-label">Weekly left</div>
              <div className="stat-value">{fmt(Math.max(weeklyLimit - wc, 0))}</div>
              <div className="stat-sub">over {daysLeft()} days</div>
            </div>
          </div>

          {savedMeals.length > 0 && (
            <div className="card">
              <div className="card-title">Quick add from saved</div>
              <input className="quick-search" type="text" placeholder="Search saved meals..." value={quickFilter} onChange={e => setQuickFilter(e.target.value)} />
              {filtered.length === 0
                ? <div className="quick-empty">No matches</div>
                : <div className="quick-grid">
                    {filtered.map((m, i) => {
                      const realIdx = savedMeals.indexOf(m);
                      return (
                        <button key={i} className={`quick-btn${flashIdx === realIdx ? " added-flash" : ""}`} onClick={() => quickAdd(realIdx)}>
                          <div style={{ minWidth: 0 }}>
                            <div className="qb-name">{m.name}</div>
                            <div className="qb-cal">{fmt(m.calories)} kcal</div>
                          </div>
                          <div className="qb-plus">+</div>
                        </button>
                      );
                    })}
                  </div>
              }
            </div>
          )}

          <div className="card">
            <div className="card-title">Add custom meal</div>
            <div className="input-row">
              <input className="input-field" type="text" placeholder="Meal name" value={addName} onChange={e => setAddName(e.target.value)} />
              <input className="input-field small" type="number" placeholder="kcal" value={addCal} onChange={e => setAddCal(e.target.value)} onKeyDown={e => e.key === "Enter" && addMeal()} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={addMeal} style={{ flex: 1 }}>Add meal</button>
              <button className="btn btn-outline" onClick={saveMealToFav}>{saveFlash ? "Saved!" : "Save ★"}</button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Today's meals</div>
            {todayMeals.length === 0 && <div className="empty">No meals logged yet</div>}
            {todayMeals.map(m => (
              <div key={meals.indexOf(m)} className="meal-item">
                <div>
                  <div className="meal-name">{m.name}<span className="meal-cal">{fmt(m.calories)} kcal</span></div>
                  <div className="meal-time">{formatTime(m.date)}</div>
                </div>
                <button className="btn-icon" onClick={() => deleteMeal(meals.indexOf(m))}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WEEK */}
      {activeTab === "week" && (
        <div>
          <div className="card">
            <div className="card-title">This week</div>
            <div className="progress-wrap">
              <div className="progress-label"><span>{fmt(wc)} kcal</span><span>of {fmt(weeklyLimit)}</span></div>
              <div className="progress-track"><div className={`progress-fill ${progressClass(wc / weeklyLimit)}`} style={{ width: `${Math.min(wr * 100, 100)}%` }} /></div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Daily breakdown</div>
            <div className="week-grid">
              {days.map((d, i) => {
                const cal = calsForDay(d.toDateString());
                const isTod = d.toDateString() === todayStr();
                const r = cal / (dt || 2000);
                const st = cal === 0 ? "" : r > 1.05 ? "over" : r > 0.85 ? "ok" : "partial";
                return (
                  <div key={i} className={`day-cell${isTod ? " today" : ""} ${st}`}>
                    <div className="day-name">{d.toLocaleDateString(undefined, { weekday: "short" })}</div>
                    <div className="day-cal">{cal > 0 ? cal : "–"}</div>
                    <div className="day-dot" />
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12 }}>
              {days.map((d, i) => {
                const cal = calsForDay(d.toDateString());
                const isTod = d.toDateString() === todayStr();
                const r = dt > 0 ? Math.min(cal / dt, 1) : 0;
                return (
                  <div key={i} className="progress-wrap" style={{ marginBottom: 6 }}>
                    <div className="progress-label">
                      <span style={isTod ? { fontWeight: 500 } : {}}>{d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span>
                      <span>{fmt(cal)} kcal</span>
                    </div>
                    <div className="progress-track"><div className={`progress-fill ${progressClass(cal / Math.max(dt, 1))}`} style={{ width: `${r * 100}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="stats">
            <div className="stat"><div className="stat-label">Daily average</div><div className="stat-value">{fmt(wc / 7)}</div><div className="stat-sub">kcal / day</div></div>
            <div className="stat"><div className="stat-label">Remaining</div><div className={`stat-value ${weeklyLimit - wc < 0 ? "danger" : ""}`}>{fmt(Math.max(weeklyLimit - wc, 0))}</div><div className="stat-sub">kcal this week</div></div>
          </div>
        </div>
      )}

      {/* LOG */}
      {activeTab === "log" && (
        <div>
          {getWeekDays().reverse().map((d, i) => {
            const dayMeals = meals.filter(m => dateKey(m.date) === d.toDateString()).reverse();
            const cal = dayMeals.reduce((s, m) => s + m.calories, 0);
            const isTod = d.toDateString() === todayStr();
            return (
              <div key={i} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: dayMeals.length ? 12 : 0 }}>
                  <div className="card-title" style={{ marginBottom: 0 }}>{isTod ? "Today" : d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</div>
                  {cal > 0 && <span style={{ fontFamily: "monospace", fontSize: 13, color: "var(--muted)" }}>{fmt(cal)} kcal</span>}
                </div>
                {dayMeals.length === 0 && <div className="empty" style={{ padding: "8px 0" }}>Nothing logged</div>}
                {dayMeals.map(m => (
                  <div key={meals.indexOf(m)} className="meal-item">
                    <div>
                      <div className="meal-name">{m.name}<span className="meal-cal">{fmt(m.calories)} kcal</span></div>
                      <div className="meal-time">{formatTime(m.date)}</div>
                    </div>
                    <button className="btn-icon" onClick={() => deleteMeal(meals.indexOf(m))}>✕</button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* SAVED */}
      {activeTab === "saved" && (
        <div>
          <div className="card">
            <div className="card-title">Save a new meal</div>
            <div className="input-row" style={{ marginBottom: 8 }}>
              <input className="input-field" type="text" placeholder="Meal name" value={saveName} onChange={e => setSaveName(e.target.value)} />
              <input className="input-field small" type="number" placeholder="kcal" value={saveCal} onChange={e => setSaveCal(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={createSaved} style={{ width: "100%" }}>Save meal</button>
          </div>
          <div className="card">
            <div className="card-title">Saved meals ({savedMeals.length})</div>
            {savedMeals.length === 0 && <div className="empty">No saved meals yet — add one above</div>}
            {savedMeals.map((m, i) => (
              <div key={i} className="saved-item">
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)" }}>{fmt(m.calories)} kcal</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button className="btn btn-outline" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => quickAdd(i)}>+ Add today</button>
                  <button className="btn-icon" onClick={() => deleteSaved(i)}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {activeTab === "settings" && (
        <div>
          <div className="card">
            <div className="card-title">Goals</div>
            <div className="setting-row">
              <div><div className="setting-label">Weekly calorie limit</div><div className="setting-sub">Spread across 7 days</div></div>
              <input className="setting-input" type="number" defaultValue={weeklyLimit} onBlur={e => { const v = parseInt(e.target.value); if (v > 0) setWeeklyLimit(v); }} />
            </div>
            <div className="setting-row">
              <div><div className="setting-label">Daily target (calculated)</div><div className="setting-sub">Remaining ÷ days left</div></div>
              <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 500 }}>{fmt(dt)}</span>
            </div>
          </div>
          <div className="card">
            <div className="card-title">This week</div>
            <div className="progress-wrap">
              <div className="progress-label"><span>Weekly progress</span><span>{fmt(wc)} / {fmt(weeklyLimit)}</span></div>
              <div className="progress-track"><div className={`progress-fill ${progressClass(wc / weeklyLimit)}`} style={{ width: `${Math.min(wr * 100, 100)}%` }} /></div>
            </div>
          </div>
          <div className="card">
            <div className="card-title">Data</div>
            <div className="setting-row"><div className="setting-label">Meals logged this week</div><span style={{ fontFamily: "monospace", fontSize: 14 }}>{meals.length}</span></div>
            <div className="setting-row"><div className="setting-label">Saved meals</div><span style={{ fontFamily: "monospace", fontSize: 14 }}>{savedMeals.length}</span></div>
            <div className="setting-row">
              <div><div className="setting-label">Reset this week's data</div><div className="setting-sub">Keeps saved meals</div></div>
              <button className="btn btn-outline" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => { if (window.confirm("Reset this week's meals?")) setMeals([]); }}>Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
    return raw;
  } catch {
    return null;
  }
}

function getDayKey(date) {
  return new Date(date).toISOString().split("T")[0];
}

function getWeekDays() {
  const s = startOfWeek();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(s);
    d.setDate(s.getDate() + i);
    return d;
  });
}

export default function App() {
  const raw = loadData();

  const [meals, setMeals] = useState(raw?.meals || {});
  const [selectedDay, setSelectedDay] = useState(getDayKey(new Date()));
  const [name, setName] = useState("");
  const [cal, setCal] = useState("");

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify({ meals }));
  }, [meals]);

  const addMeal = () => {
    if (!name || !cal) return;

    const newMeal = {
      name,
      calories: Number(cal),
    };

    setMeals((prev) => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), newMeal],
    }));

    setName("");
    setCal("");
  };

  const removeMeal = (index) => {
    setMeals((prev) => {
      const updated = [...(prev[selectedDay] || [])];
      updated.splice(index, 1);

      return {
        ...prev,
        [selectedDay]: updated,
      };
    });
  };

  const mealsForDay = meals[selectedDay] || [];

  const totalCalories = mealsForDay.reduce(
    (sum, meal) => sum + meal.calories,
    0
  );

  const weekDays = getWeekDays();

  return (
    <div style={{ padding: 20 }}>
      <h1>Calorie Tracker</h1>

      {/* Day Selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {weekDays.map((day) => {
          const key = getDayKey(day);
          const isSelected = key === selectedDay;

          return (
            <div
              key={key}
              onClick={() => setSelectedDay(key)}
              style={{
                padding: 10,
                cursor: "pointer",
                border: "1px solid #ccc",
                background: isSelected ? "#4caf50" : "#eee",
                color: isSelected ? "#fff" : "#000",
              }}
            >
              {day.toLocaleDateString("en-NZ", { weekday: "short" })}
            </div>
          );
        })}
      </div>

      {/* Selected Day */}
      <h2>
        {new Date(selectedDay).toLocaleDateString("en-NZ", {
          weekday: "long",
          day: "numeric",
          month: "short",
        })}
      </h2>

      <h3>Total: {totalCalories} cal</h3>

      {/* Add Meal */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Meal name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Calories"
          value={cal}
          onChange={(e) => setCal(e.target.value)}
          type="number"
        />
        <button onClick={addMeal}>Add</button>
      </div>

      {/* Meals List */}
      {mealsForDay.map((meal, i) => (
        <div key={i} style={{ marginBottom: 5 }}>
          {meal.name} - {meal.calories} cal
          <button onClick={() => removeMeal(i)} style={{ marginLeft: 10 }}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

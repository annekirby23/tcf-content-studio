"use client";

import { useState } from "react";
import { PLATFORM_MAP, STATUS_MAP, C } from "./constants";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function CalendarView({ posts, onEdit, onNewPost }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const today = now.toISOString().split("T")[0];
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);

  const postsByDate = {};
  posts.forEach((p) => {
    if (!p.scheduledDate) return;
    const [y, m] = p.scheduledDate.split("-").map(Number);
    if (y === viewYear && m === viewMonth + 1) {
      const d = parseInt(p.scheduledDate.split("-")[2], 10);
      if (!postsByDate[d]) postsByDate[d] = [];
      postsByDate[d].push(p);
    }
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const goToday = () => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); setSelectedDate(today); };

  const selectedPosts = selectedDate
    ? posts.filter((p) => p.scheduledDate === selectedDate).sort((a, b) => (a.scheduledTime || "").localeCompare(b.scheduledTime || ""))
    : [];

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ display: "grid", gridTemplateColumns: selectedDate ? "1fr 320px" : "1fr", gap: "20px" }}>
      <div>
        {/* Nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={prevMonth} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, width: "32px", height: "32px", cursor: "pointer", fontSize: "14px" }}>‹</button>
            <span style={{ fontSize: "18px", fontWeight: "700", color: C.text, minWidth: "180px", textAlign: "center" }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button onClick={nextMonth} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, width: "32px", height: "32px", cursor: "pointer", fontSize: "14px" }}>›</button>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={goToday} style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontSize: "12px", cursor: "pointer" }}>Today</button>
            <button
              onClick={() => {
                const d = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                onNewPost(d);
              }}
              style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
            >
              + New Post
            </button>
          </div>
        </div>

        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "6px" }}>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: "11px", fontWeight: "600", color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", padding: "4px 0" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const dateStr = isoDate(viewYear, viewMonth, day);
            const dayPosts = postsByDate[day] || [];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                style={{
                  minHeight: "80px",
                  padding: "8px",
                  borderRadius: "10px",
                  border: `1px solid ${isSelected ? C.accent : isToday ? C.borderLight : C.border}`,
                  background: isSelected ? C.accentLight : isToday ? "rgba(255,255,255,0.04)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  position: "relative",
                }}
                onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = isToday ? "rgba(255,255,255,0.04)" : "transparent")}
              >
                <div style={{
                  fontSize: "13px",
                  fontWeight: isToday ? "800" : "500",
                  color: isToday ? C.accentBright : C.text,
                  marginBottom: "5px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                  {isToday ? (
                    <span style={{ background: C.accent, color: "#fff", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>{day}</span>
                  ) : day}
                  {dayPosts.length > 0 && (
                    <span style={{ fontSize: "10px", color: C.muted, fontFamily: "monospace" }}>{dayPosts.length}</span>
                  )}
                </div>

                {/* Platform dots */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                  {dayPosts.slice(0, 6).map((p, idx) => {
                    const firstPlatform = p.platforms?.[0];
                    const color = firstPlatform ? (PLATFORM_MAP[firstPlatform]?.color || C.accent) : C.accent;
                    const statusCfg = STATUS_MAP[p.status];
                    return (
                      <div
                        key={p.id}
                        title={`${p.title} (${p.status})`}
                        style={{
                          width: "6px",
                          height: "6px",
                          borderRadius: "50%",
                          background: color,
                          opacity: p.status === "draft" ? 0.4 : 1,
                          outline: p.status === "published" ? `1px solid ${statusCfg?.color}` : "none",
                        }}
                      />
                    );
                  })}
                  {dayPosts.length > 6 && (
                    <span style={{ fontSize: "9px", color: C.muted }}>+{dayPosts.length - 6}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ marginTop: "16px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {[
            { label: "Draft", color: "#6B7280" },
            { label: "Scheduled", color: "#8B5CF6" },
            { label: "Published", color: "#10B981" },
            { label: "In Review", color: "#F59E0B" },
          ].map(({ label, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: C.muted }}>
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Day detail panel */}
      {selectedDate && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "11px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][new Date(selectedDate + "T12:00:00").getDay()]}
              </div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: C.text }}>
                {MONTHS[parseInt(selectedDate.split("-")[1]) - 1]} {parseInt(selectedDate.split("-")[2])}
              </div>
            </div>
            <button
              onClick={() => onNewPost(selectedDate)}
              style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
            >
              + Add
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {selectedPosts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 16px", color: C.muted, fontSize: "13px" }}>
                <div style={{ fontSize: "28px", marginBottom: "8px" }}>📅</div>
                Nothing scheduled
              </div>
            ) : (
              selectedPosts.map((p) => {
                const statusCfg = STATUS_MAP[p.status] || {};
                return (
                  <div
                    key={p.id}
                    onClick={() => onEdit(p)}
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${C.border}`,
                      background: "rgba(255,255,255,0.03)",
                      marginBottom: "8px",
                      cursor: "pointer",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: C.text, lineHeight: 1.3 }}>{p.title}</div>
                      <span style={{ padding: "2px 7px", borderRadius: "10px", background: statusCfg.bg, color: statusCfg.color, fontSize: "10px", fontWeight: "600", flexShrink: 0 }}>{statusCfg.label}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "12px", color: C.muted }}>
                        {p.platforms?.map((id) => PLATFORM_MAP[id]?.icon).join(" ") || "—"}
                      </div>
                      {p.scheduledTime && <div style={{ fontSize: "11px", color: C.muted, fontFamily: "monospace" }}>{p.scheduledTime}</div>}
                    </div>
                    {p.campaign && <div style={{ fontSize: "11px", color: C.muted, marginTop: "4px" }}>{p.campaign}</div>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

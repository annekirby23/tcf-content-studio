"use client";

import { useState } from "react";
import { PLATFORM_MAP, STATUS_MAP, THEME_MAP, AUDIENCE_MAP, C } from "./constants";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

/** Small pill shown inside a calendar cell for one post */
function PostMiniTag({ post, onClick }) {
  const firstPlatform = post.platforms?.[0];
  const platformCfg = firstPlatform ? PLATFORM_MAP[firstPlatform] : null;
  const brandColor = platformCfg?.color || C.accent;
  const themeCfg = post.theme ? THEME_MAP[post.theme] : null;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(post); }}
      title={post.title}
      style={{
        display: "flex",
        flexDirection: "column",
        borderLeft: `3px solid ${brandColor}`,
        background: `${brandColor}1A`, // ~10% opacity hex
        borderRadius: "4px",
        padding: "2px 5px",
        maxWidth: "100%",
        overflow: "hidden",
        cursor: "pointer",
        marginBottom: "2px",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          color: C.text,
          fontWeight: "500",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: "1.4",
          display: "flex",
          alignItems: "center",
          gap: "3px",
        }}
      >
        {platformCfg && (
          <span style={{ flexShrink: 0, fontSize: "10px" }}>{platformCfg.icon}</span>
        )}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {truncate(post.title, 20)}
        </span>
      </div>
      {themeCfg && (
        <div
          style={{
            fontSize: "9px",
            color: C.muted,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: "1.3",
          }}
        >
          {themeCfg.emoji} {themeCfg.label}
        </div>
      )}
    </div>
  );
}

/** Full post card shown in the day detail panel */
function PostDetailCard({ post, onEdit }) {
  const statusCfg = STATUS_MAP[post.status] || {};
  const themeCfg = post.theme ? THEME_MAP[post.theme] : null;
  const audienceCfg = post.audience ? AUDIENCE_MAP[post.audience] : null;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onEdit(post)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "12px",
        borderRadius: "10px",
        border: `1px solid ${C.border}`,
        background: hovered ? C.cardBg : C.card,
        marginBottom: "8px",
        cursor: "pointer",
        transition: "background 0.15s",
        boxShadow: hovered ? C.shadow : "none",
      }}
    >
      {/* Top row: title + status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "6px" }}>
        <div style={{ fontSize: "13px", fontWeight: "600", color: C.text, lineHeight: 1.3, flex: 1 }}>
          {post.title}
        </div>
        <span
          style={{
            padding: "2px 7px",
            borderRadius: "10px",
            background: statusCfg.bg || C.cardBg,
            color: statusCfg.color || C.muted,
            fontSize: "10px",
            fontWeight: "600",
            flexShrink: 0,
            whiteSpace: "nowrap",
          }}
        >
          {statusCfg.label || post.status}
        </span>
      </div>

      {/* Audience + theme badges */}
      {(audienceCfg || themeCfg) && (
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "6px" }}>
          {audienceCfg && (
            <span
              style={{
                padding: "2px 7px",
                borderRadius: "10px",
                background: audienceCfg.bg,
                color: audienceCfg.color,
                fontSize: "10px",
                fontWeight: "600",
                whiteSpace: "nowrap",
              }}
            >
              {audienceCfg.label}
            </span>
          )}
          {themeCfg && (
            <span
              style={{
                padding: "2px 7px",
                borderRadius: "10px",
                background: `${themeCfg.color}18`,
                color: themeCfg.color,
                fontSize: "10px",
                fontWeight: "500",
                whiteSpace: "nowrap",
              }}
            >
              {themeCfg.emoji} {themeCfg.label}
            </span>
          )}
        </div>
      )}

      {/* Platform icons + time */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "13px", color: C.muted, display: "flex", gap: "4px" }}>
          {post.platforms?.map((id) => {
            const p = PLATFORM_MAP[id];
            return p ? (
              <span key={id} title={p.label} style={{ fontSize: "12px" }}>{p.icon}</span>
            ) : null;
          })}
          {(!post.platforms || post.platforms.length === 0) && (
            <span style={{ fontSize: "11px" }}>—</span>
          )}
        </div>
        {post.scheduledTime && (
          <div style={{ fontSize: "11px", color: C.muted, fontFamily: "monospace" }}>
            {post.scheduledTime}
          </div>
        )}
      </div>

      {/* Campaign */}
      {post.campaign && (
        <div style={{ fontSize: "11px", color: C.muted, marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ opacity: 0.6 }}>📁</span>
          {post.campaign}
        </div>
      )}
    </div>
  );
}

export default function CalendarView({ posts, onEdit, onNewPost }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const today = now.toISOString().split("T")[0];
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);

  // Group posts by day number for the current view month
  const postsByDay = {};
  posts.forEach((p) => {
    if (!p.scheduledDate) return;
    const parts = p.scheduledDate.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (y === viewYear && m === viewMonth + 1) {
      if (!postsByDay[d]) postsByDay[d] = [];
      postsByDay[d].push(p);
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

  const goToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setSelectedDate(today);
  };

  const selectedPosts = selectedDate
    ? posts
        .filter((p) => p.scheduledDate === selectedDate)
        .sort((a, b) => (a.scheduledTime || "").localeCompare(b.scheduledTime || ""))
    : [];

  // Build grid cells: nulls for leading empty slots, then day numbers
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: selectedDate ? "1fr 340px" : "1fr",
        gap: "20px",
        alignItems: "start",
      }}
    >
      {/* ── Left: calendar grid ── */}
      <div>
        {/* Month navigation */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={prevMonth}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                color: C.text,
                width: "32px",
                height: "32px",
                cursor: "pointer",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: C.shadow,
              }}
            >
              ‹
            </button>
            <span
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: C.text,
                minWidth: "190px",
                textAlign: "center",
                letterSpacing: "-0.01em",
              }}
            >
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                color: C.text,
                width: "32px",
                height: "32px",
                cursor: "pointer",
                fontSize: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: C.shadow,
              }}
            >
              ›
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={goToday}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: `1px solid ${C.border}`,
                background: C.card,
                color: C.muted,
                fontSize: "12px",
                fontWeight: "500",
                cursor: "pointer",
                boxShadow: C.shadow,
              }}
            >
              Today
            </button>
            <button
              onClick={() => onNewPost(selectedDate || today)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: "none",
                background: C.accent,
                color: "#fff",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: C.shadow,
              }}
            >
              + New Post
            </button>
          </div>
        </div>

        {/* Day-of-week headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "2px",
            marginBottom: "4px",
          }}
        >
          {DAYS.map((d) => (
            <div
              key={d}
              style={{
                textAlign: "center",
                fontSize: "11px",
                fontWeight: "600",
                color: C.muted,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "4px 0",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "2px",
          }}
        >
          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} style={{ minHeight: "90px" }} />;

            const dateStr = isoDate(viewYear, viewMonth, day);
            const dayPosts = postsByDay[day] || [];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const visiblePosts = dayPosts.slice(0, 2);
            const overflow = dayPosts.length - 2;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                style={{
                  minHeight: "90px",
                  padding: "6px 6px 4px",
                  borderRadius: "10px",
                  border: `1px solid ${isSelected ? C.accent : C.border}`,
                  background: isSelected
                    ? "rgba(99,102,241,0.06)"
                    : isToday
                    ? "rgba(99,102,241,0.03)"
                    : C.card,
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = C.hover;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = isToday
                      ? "rgba(99,102,241,0.03)"
                      : C.card;
                  }
                }}
              >
                {/* Day number */}
                <div
                  style={{
                    marginBottom: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  {isToday ? (
                    <span
                      style={{
                        background: C.accent,
                        color: "#fff",
                        borderRadius: "50%",
                        width: "22px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "700",
                        flexShrink: 0,
                      }}
                    >
                      {day}
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: isSelected ? "700" : "500",
                        color: isSelected ? C.accent : C.text,
                      }}
                    >
                      {day}
                    </span>
                  )}
                </div>

                {/* Mini post tags */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  {visiblePosts.map((p) => (
                    <PostMiniTag key={p.id} post={p} onClick={onEdit} />
                  ))}
                  {overflow > 0 && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: C.muted,
                        fontWeight: "600",
                        paddingLeft: "4px",
                        marginTop: "1px",
                      }}
                    >
                      +{overflow} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ marginTop: "16px", display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {[
            { label: "Draft", color: "#94A3B8" },
            { label: "In Review", color: "#F59E0B" },
            { label: "Approved", color: "#3B82F6" },
            { label: "Scheduled", color: "#8B5CF6" },
            { label: "Published", color: "#10B981" },
          ].map(({ label, color }) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: C.muted }}
            >
              <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, flexShrink: 0 }} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: day detail panel ── */}
      {selectedDate && (
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: "14px",
            padding: "20px",
            boxShadow: C.shadow,
            display: "flex",
            flexDirection: "column",
            maxHeight: "calc(100vh - 180px)",
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: "16px",
              flexShrink: 0,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "11px",
                  color: C.muted,
                  fontWeight: "600",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "2px",
                }}
              >
                {DAYS_FULL[new Date(selectedDate + "T12:00:00").getDay()]}
              </div>
              <div style={{ fontSize: "20px", fontWeight: "700", color: C.text, letterSpacing: "-0.01em" }}>
                {MONTHS[parseInt(selectedDate.split("-")[1], 10) - 1]}{" "}
                {parseInt(selectedDate.split("-")[2], 10)}
              </div>
              {selectedPosts.length > 0 && (
                <div style={{ fontSize: "12px", color: C.muted, marginTop: "2px" }}>
                  {selectedPosts.length} post{selectedPosts.length !== 1 ? "s" : ""}
                </div>
              )}
            </div>
            <button
              onClick={() => onNewPost(selectedDate)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "none",
                background: C.accent,
                color: "#fff",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              + Add
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: "1px", background: C.border, marginBottom: "12px", flexShrink: 0 }} />

          {/* Posts list */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {selectedPosts.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 16px",
                  color: C.muted,
                  fontSize: "13px",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "10px" }}>📅</div>
                <div style={{ fontWeight: "600", marginBottom: "4px", color: C.text }}>Nothing scheduled</div>
                <div style={{ fontSize: "12px" }}>Add a post to get started.</div>
              </div>
            ) : (
              selectedPosts.map((p) => (
                <PostDetailCard key={p.id} post={p} onEdit={onEdit} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

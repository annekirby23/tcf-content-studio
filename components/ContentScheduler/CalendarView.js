"use client";

import { useState, useEffect } from "react";
import { PLATFORM_MAP, STATUS_MAP, THEME_MAP, AUDIENCE_MAP, C } from "./constants";

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const VIEW_OPTIONS = [
  { id: "month", label: "Month" },
  { id: "week", label: "Week" },
  { id: "day", label: "Day" },
  { id: "list", label: "List" },
  { id: "comments", label: "Comments" },
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay();
}

function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isoDateFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Returns Monday of the week containing `dateStr` (YYYY-MM-DD) */
function getMondayOfWeek(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow; // shift so Mon=0
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return isoDateFromDate(d);
}

function formatDisplayDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

function formatShortDate(dateStr) {
  const [, m, d] = dateStr.split("-").map(Number);
  return `${MONTHS[m - 1].slice(0, 3)} ${d}`;
}

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Deterministic color for an author's avatar based on their name
const AVATAR_COLORS = [
  "#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6",
  "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16", "#F97316",
];
function avatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Shared sub-components ────────────────────────────────────────────────────

/** Small pill shown inside a calendar cell for one post */
function PostMiniTag({ post, onClick, draggable, onDragStart, onDragEnd, dimmed }) {
  const firstPlatform = post.platforms?.[0];
  const platformCfg = firstPlatform ? PLATFORM_MAP[firstPlatform] : null;
  const brandColor = platformCfg?.color || C.accent;
  const themeCfg = post.theme ? THEME_MAP[post.theme] : null;

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={(e) => { e.stopPropagation(); onClick(post); }}
      title={post.title}
      style={{
        display: "flex",
        flexDirection: "column",
        borderLeft: `3px solid ${brandColor}`,
        background: `${brandColor}1A`,
        borderRadius: "4px",
        padding: "2px 5px",
        maxWidth: "100%",
        overflow: "hidden",
        cursor: draggable ? "grab" : "pointer",
        marginBottom: "2px",
        opacity: dimmed ? 0.45 : 1,
        transition: "opacity 0.15s",
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

/** Full post card shown in the day detail panel and Day view */
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "8px",
          marginBottom: "6px",
        }}
      >
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

      {post.caption && (
        <div
          style={{
            fontSize: "11px",
            color: C.muted,
            marginTop: "6px",
            lineHeight: 1.5,
          }}
        >
          {truncate(post.caption, 100)}
        </div>
      )}

      {post.campaign && (
        <div
          style={{
            fontSize: "11px",
            color: C.muted,
            marginTop: "4px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span style={{ opacity: 0.6 }}>📁</span>
          {post.campaign}
        </div>
      )}
    </div>
  );
}

// ─── View switcher ────────────────────────────────────────────────────────────

function ViewSwitcher({ calView, setCalView }) {
  return (
    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
      {VIEW_OPTIONS.map(({ id, label }) => {
        const active = calView === id;
        return (
          <button
            key={id}
            onClick={() => setCalView(id)}
            style={{
              padding: "5px 14px",
              borderRadius: "20px",
              border: active ? `1px solid ${C.accent}` : `1px solid ${C.border}`,
              background: active ? C.accentLight : C.card,
              color: active ? C.accentBright : C.muted,
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s",
              lineHeight: 1.4,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Nav button (reusable small arrow button) ─────────────────────────────────

function NavBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
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
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

// ─── Month view ───────────────────────────────────────────────────────────────

function MonthView({ posts, events = [], onEdit, onNewPost, onDateChange, viewYear, viewMonth, today }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [draggedPostId, setDraggedPostId] = useState(null);
  const [dropTargetDate, setDropTargetDate] = useState(null);
  const [selectedEvent, setSelectedEventLocal] = useState(null);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth);

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

  const eventsByDay = {};
  events.forEach((ev) => {
    if (!ev.date) return;
    const parts = ev.date.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (y === viewYear && m === viewMonth + 1) {
      if (!eventsByDay[d]) eventsByDay[d] = [];
      eventsByDay[d].push(ev);
    }
  });

  const selectedPosts = selectedDate
    ? posts
        .filter((p) => p.scheduledDate === selectedDate)
        .sort((a, b) => (a.scheduledTime || "").localeCompare(b.scheduledTime || ""))
    : [];

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
      {/* ── Calendar grid ── */}
      <div>
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
            const dayEvents = eventsByDay[day] || [];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const isDropTarget = dateStr === dropTargetDate;
            const visiblePosts = dayPosts.slice(0, 2);
            const overflow = dayPosts.length - 2;

            let cellBg = C.card;
            if (isSelected) cellBg = C.accentLight;
            else if (isToday) cellBg = "rgba(99,102,241,0.03)";

            let cellBorder = C.border;
            if (isDropTarget) cellBorder = C.accent;
            else if (isSelected) cellBorder = C.accent;

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropTargetDate(dateStr);
                }}
                onDragLeave={() => setDropTargetDate(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const postId = e.dataTransfer.getData("postId");
                  if (postId && onDateChange) onDateChange(postId, dateStr);
                  setDraggedPostId(null);
                  setDropTargetDate(null);
                }}
                style={{
                  minHeight: "90px",
                  padding: "6px 6px 4px",
                  borderRadius: "10px",
                  border: isDropTarget
                    ? `2px dashed ${C.accent}`
                    : `1px solid ${cellBorder}`,
                  background: isDropTarget
                    ? "rgba(99,102,241,0.08)"
                    : cellBg,
                  cursor: "pointer",
                  transition: "border-color 0.15s, background 0.15s",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isDropTarget) e.currentTarget.style.background = C.hover;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isDropTarget) {
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
                        color: isSelected ? C.accentBright : C.text,
                      }}
                    >
                      {day}
                    </span>
                  )}
                </div>

                {/* Mini event tags */}
                {dayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={(e) => { e.stopPropagation(); setSelectedEventLocal(ev); }}
                    style={{
                      fontSize: "10px", fontWeight: "600",
                      color: "#fff",
                      background: ev.color || "#6366F1",
                      borderRadius: "4px",
                      padding: "1px 5px",
                      marginBottom: "2px",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                    title={ev.title}
                  >
                    📅 {ev.title}
                  </div>
                ))}

                {/* Mini post tags */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  {visiblePosts.map((p) => (
                    <PostMiniTag
                      key={p.id}
                      post={p}
                      onClick={onEdit}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("postId", p.id);
                        setDraggedPostId(p.id);
                      }}
                      onDragEnd={() => {
                        setDraggedPostId(null);
                        setDropTargetDate(null);
                      }}
                      dimmed={draggedPostId === p.id}
                    />
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
              <div
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: color,
                  flexShrink: 0,
                }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Day detail side panel ── */}
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
            maxHeight: "calc(100vh - 240px)",
            overflow: "hidden",
          }}
        >
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

          <div style={{ height: "1px", background: C.border, marginBottom: "12px", flexShrink: 0 }} />

          <div style={{ flex: 1, overflowY: "auto" }}>
            {/* Events for this day */}
            {selectedDate && (eventsByDay[parseInt(selectedDate.split("-")[2], 10)] || []).map((ev) => (
              <div key={ev.id} style={{ padding: "10px 12px", background: C.cardBg, borderRadius: "8px", border: `1px solid ${C.border}`, borderLeft: `4px solid ${ev.color || "#6366F1"}`, marginBottom: "8px" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: C.text }}>📅 {ev.title}</div>
                {ev.description && <div style={{ fontSize: "11px", color: C.muted, marginTop: "3px" }}>{ev.description}</div>}
                {ev.status && <span style={{ fontSize: "10px", fontWeight: "600", color: ev.color || "#6366F1", marginTop: "4px", display: "inline-block" }}>{ev.status.toUpperCase()}</span>}
              </div>
            ))}
            {selectedPosts.length === 0 && !(selectedDate && (eventsByDay[parseInt(selectedDate.split("-")[2], 10)] || []).length) ? (
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

      {/* Event quick-view popup */}
      {selectedEvent && (
        <>
          <div onClick={() => setSelectedEventLocal(null)} style={{ position: "fixed", inset: 0, zIndex: 1999 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "360px", maxWidth: "90vw", background: C.card, border: `1px solid ${C.border}`, borderLeft: `5px solid ${selectedEvent.color || "#6366F1"}`, borderRadius: "14px", padding: "20px", zIndex: 2000, boxShadow: "0 12px 40px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
              <div>
                <div style={{ fontSize: "16px", fontWeight: "800", color: C.text }}>{selectedEvent.title}</div>
                {selectedEvent.date && <div style={{ fontSize: "12px", color: C.muted, marginTop: "4px" }}>📅 {new Date(selectedEvent.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}</div>}
              </div>
              <button onClick={() => setSelectedEventLocal(null)} style={{ background: "none", border: "none", color: C.muted, fontSize: "16px", cursor: "pointer", padding: "2px 4px" }}>✕</button>
            </div>
            {selectedEvent.description && <div style={{ fontSize: "13px", color: C.muted, lineHeight: "1.6", marginBottom: "10px" }}>{selectedEvent.description}</div>}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {selectedEvent.status && <span style={{ fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "10px", background: `${selectedEvent.color || "#6366F1"}20`, color: selectedEvent.color || "#6366F1" }}>{selectedEvent.status}</span>}
              {selectedEvent.club && <span style={{ fontSize: "11px", color: C.muted, padding: "2px 8px", borderRadius: "10px", background: C.cardBg, border: `1px solid ${C.border}` }}>{selectedEvent.club}</span>}
              {selectedEvent.slackChannel && <span style={{ fontSize: "11px", color: "#4A154B" }}>💬 {selectedEvent.slackChannel}</span>}
            </div>
            {selectedEvent.driveFolderUrl && (
              <a href={selectedEvent.driveFolderUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "12px", fontSize: "12px", color: C.accent, textDecoration: "none", padding: "5px 10px", borderRadius: "20px", border: `1px solid ${C.accent}`, background: C.accentLight }}>
                📂 Open Drive Folder
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Week view ────────────────────────────────────────────────────────────────

function WeekView({ posts, onEdit, today, selectedDate, setSelectedDate, setCalView }) {
  const anchorDate = selectedDate || today;
  const monday = getMondayOfWeek(anchorDate);
  const mondayStr = isoDateFromDate(monday);

  // Build array of 7 day strings Mon–Sun
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(mondayStr, i));

  const prevWeek = () => {
    const prev = addDays(mondayStr, -7);
    setSelectedDate(prev);
  };
  const nextWeek = () => {
    const next = addDays(mondayStr, 7);
    setSelectedDate(next);
  };

  const postsByDate = {};
  posts.forEach((p) => {
    if (!p.scheduledDate) return;
    if (!postsByDate[p.scheduledDate]) postsByDate[p.scheduledDate] = [];
    postsByDate[p.scheduledDate].push(p);
  });

  const weekLabel = (() => {
    const start = formatShortDate(weekDays[0]);
    const end = formatShortDate(weekDays[6]);
    return `${start} – ${end}`;
  })();

  return (
    <div>
      {/* Week navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        <NavBtn onClick={prevWeek}>‹</NavBtn>
        <span style={{ fontSize: "15px", fontWeight: "700", color: C.text, minWidth: "180px" }}>
          {weekLabel}
        </span>
        <NavBtn onClick={nextWeek}>›</NavBtn>
      </div>

      {/* 7 columns */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "8px",
          alignItems: "start",
        }}
      >
        {weekDays.map((dateStr) => {
          const [y, m, d] = dateStr.split("-").map(Number);
          const dow = new Date(dateStr + "T12:00:00").getDay();
          const isToday = dateStr === today;
          const dayPosts = (postsByDate[dateStr] || []).sort(
            (a, b) => (a.scheduledTime || "").localeCompare(b.scheduledTime || "")
          );

          return (
            <div key={dateStr} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {/* Day header */}
              <div
                onClick={() => {
                  setSelectedDate(dateStr);
                  setCalView("day");
                }}
                style={{
                  textAlign: "center",
                  cursor: "pointer",
                  padding: "6px 4px",
                  borderRadius: "8px",
                  background: isToday ? C.accent : C.cardBg,
                  border: `1px solid ${isToday ? C.accent : C.border}`,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!isToday) e.currentTarget.style.background = C.hover;
                }}
                onMouseLeave={(e) => {
                  if (!isToday) e.currentTarget.style.background = C.cardBg;
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "600",
                    color: isToday ? "#fff" : C.muted,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {DAYS[dow]}
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: isToday ? "#fff" : C.text,
                    lineHeight: 1.2,
                  }}
                >
                  {d}
                </div>
              </div>

              {/* Posts column */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", minHeight: "60px" }}>
                {dayPosts.length === 0 ? (
                  <div
                    style={{
                      fontSize: "10px",
                      color: C.muted,
                      textAlign: "center",
                      padding: "10px 0",
                      fontStyle: "italic",
                    }}
                  >
                    No posts
                  </div>
                ) : (
                  dayPosts.map((p) => (
                    <PostMiniTag key={p.id} post={p} onClick={onEdit} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day view ─────────────────────────────────────────────────────────────────

function DayView({ posts, onEdit, onNewPost, today, selectedDate, setSelectedDate }) {
  const currentDate = selectedDate || today;

  const prevDay = () => setSelectedDate(addDays(currentDate, -1));
  const nextDay = () => setSelectedDate(addDays(currentDate, 1));

  const dayPosts = posts
    .filter((p) => p.scheduledDate === currentDate)
    .sort((a, b) => (a.scheduledTime || "").localeCompare(b.scheduledTime || ""));

  const isToday = currentDate === today;
  const dow = DAYS_FULL[new Date(currentDate + "T12:00:00").getDay()];
  const [, m, d] = currentDate.split("-").map(Number);

  return (
    <div>
      {/* Day navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <NavBtn onClick={prevDay}>‹</NavBtn>
          <div>
            <div
              style={{
                fontSize: "11px",
                color: C.muted,
                fontWeight: "600",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {dow}{isToday ? " · Today" : ""}
            </div>
            <div style={{ fontSize: "22px", fontWeight: "700", color: C.text, letterSpacing: "-0.01em" }}>
              {MONTHS[m - 1]} {d}
            </div>
          </div>
          <NavBtn onClick={nextDay}>›</NavBtn>
        </div>

        <button
          onClick={() => onNewPost(currentDate)}
          style={{
            padding: "7px 16px",
            borderRadius: "8px",
            border: "none",
            background: C.accent,
            color: "#fff",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: C.shadow,
          }}
        >
          + Add post for this day
        </button>
      </div>

      {/* Posts */}
      {dayPosts.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 24px",
            color: C.muted,
            fontSize: "14px",
          }}
        >
          <div style={{ fontSize: "48px", marginBottom: "14px" }}>📅</div>
          <div style={{ fontWeight: "700", fontSize: "16px", color: C.text, marginBottom: "6px" }}>
            Nothing scheduled
          </div>
          <div>No posts for this day yet.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {dayPosts.map((p) => (
            <PostDetailCard key={p.id} post={p} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListView({ posts, onEdit, viewYear, viewMonth }) {
  const monthPosts = posts
    .filter((p) => {
      if (!p.scheduledDate) return false;
      const [y, m] = p.scheduledDate.split("-").map(Number);
      return y === viewYear && m === viewMonth + 1;
    })
    .sort((a, b) => {
      const dateA = (a.scheduledDate || "") + (a.scheduledTime || "");
      const dateB = (b.scheduledDate || "") + (b.scheduledTime || "");
      return dateA.localeCompare(dateB);
    });

  const colStyle = (flex, minWidth) => ({
    flex,
    minWidth: minWidth || 0,
    padding: "10px 12px",
    fontSize: "12px",
    color: C.text,
    display: "flex",
    alignItems: "center",
    overflow: "hidden",
  });

  const headerStyle = (flex, minWidth) => ({
    ...colStyle(flex, minWidth),
    fontSize: "11px",
    fontWeight: "700",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  });

  return (
    <div>
      {/* Table header */}
      <div
        style={{
          display: "flex",
          background: C.cardBg,
          border: `1px solid ${C.border}`,
          borderRadius: "10px 10px 0 0",
          borderBottom: "none",
        }}
      >
        <div style={headerStyle("0 0 100px", "100px")}>Date</div>
        <div style={headerStyle("0 0 70px", "70px")}>Time</div>
        <div style={headerStyle("1 1 160px", "160px")}>Title</div>
        <div style={headerStyle("0 0 110px", "110px")}>Platforms</div>
        <div style={headerStyle("0 0 90px", "90px")}>Status</div>
        <div style={headerStyle("0 0 130px", "130px")}>Theme</div>
        <div style={headerStyle("0 0 130px", "130px")}>Campaign</div>
      </div>

      {monthPosts.length === 0 ? (
        <div
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: "0 0 10px 10px",
            padding: "48px 24px",
            textAlign: "center",
            color: C.muted,
            background: C.card,
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "10px" }}>🗂️</div>
          <div style={{ fontWeight: "600", color: C.text, marginBottom: "4px" }}>No posts this month</div>
          <div style={{ fontSize: "12px" }}>Switch months or create new posts.</div>
        </div>
      ) : (
        <div
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: "0 0 10px 10px",
            overflow: "hidden",
          }}
        >
          {monthPosts.map((p, idx) => {
            const statusCfg = STATUS_MAP[p.status] || {};
            const themeCfg = p.theme ? THEME_MAP[p.theme] : null;
            const isEven = idx % 2 === 0;

            return (
              <div
                key={p.id}
                onClick={() => onEdit(p)}
                style={{
                  display: "flex",
                  background: isEven ? C.card : C.cardBg,
                  cursor: "pointer",
                  borderBottom: idx < monthPosts.length - 1 ? `1px solid ${C.border}` : "none",
                  transition: "background 0.12s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.hover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = isEven ? C.card : C.cardBg; }}
              >
                <div style={{ ...colStyle("0 0 100px", "100px"), color: C.muted, fontSize: "11px", fontFamily: "monospace" }}>
                  {p.scheduledDate ? formatShortDate(p.scheduledDate) : "—"}
                </div>
                <div style={{ ...colStyle("0 0 70px", "70px"), color: C.muted, fontSize: "11px", fontFamily: "monospace" }}>
                  {p.scheduledTime || "—"}
                </div>
                <div style={{ ...colStyle("1 1 160px", "160px"), fontWeight: "600" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.title || "Untitled"}
                  </span>
                </div>
                <div style={{ ...colStyle("0 0 110px", "110px"), gap: "3px", flexWrap: "wrap" }}>
                  {p.platforms?.map((id) => {
                    const pl = PLATFORM_MAP[id];
                    return pl ? <span key={id} title={pl.label} style={{ fontSize: "14px" }}>{pl.icon}</span> : null;
                  })}
                  {(!p.platforms || p.platforms.length === 0) && <span style={{ fontSize: "11px", color: C.muted }}>—</span>}
                </div>
                <div style={colStyle("0 0 90px", "90px")}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: "10px",
                      background: statusCfg.bg || C.cardBg,
                      color: statusCfg.color || C.muted,
                      fontSize: "10px",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {statusCfg.label || p.status || "—"}
                  </span>
                </div>
                <div style={{ ...colStyle("0 0 130px", "130px"), color: C.muted, fontSize: "11px" }}>
                  {themeCfg ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>{themeCfg.emoji}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {themeCfg.label}
                      </span>
                    </span>
                  ) : "—"}
                </div>
                <div style={{ ...colStyle("0 0 130px", "130px"), color: C.muted, fontSize: "11px" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.campaign || "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Comments view ────────────────────────────────────────────────────────────

function CommentsView({ posts, onEdit }) {
  const postsWithNotes = posts.filter((p) => p.notes && p.notes.length > 0);

  // Sort posts by the most recent note date so freshest activity is first
  const sorted = [...postsWithNotes].sort((a, b) => {
    const latestA = Math.max(...a.notes.map((n) => new Date(n.createdAt || 0).getTime()));
    const latestB = Math.max(...b.notes.map((n) => new Date(n.createdAt || 0).getTime()));
    return latestB - latestA;
  });

  if (sorted.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "64px 24px",
          color: C.muted,
          fontSize: "14px",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "14px" }}>💬</div>
        <div style={{ fontWeight: "700", fontSize: "16px", color: C.text, marginBottom: "6px" }}>
          No team notes yet
        </div>
        <div>Add notes to posts to see them here.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {sorted.map((post) => {
        const sortedNotes = [...post.notes].sort(
          (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        );

        return (
          <div
            key={post.id}
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: C.shadow,
            }}
          >
            {/* Post title header */}
            <div
              onClick={() => onEdit(post)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                background: C.cardBg,
                borderBottom: `1px solid ${C.border}`,
                cursor: "pointer",
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.hover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.cardBg; }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: C.text }}>
                  {post.title || "Untitled"}
                </div>
                {post.scheduledDate && (
                  <div style={{ fontSize: "11px", color: C.muted, marginTop: "1px" }}>
                    {formatDisplayDate(post.scheduledDate)}
                    {post.platforms?.map((id) => {
                      const pl = PLATFORM_MAP[id];
                      return pl ? (
                        <span key={id} style={{ marginLeft: "6px" }}>{pl.icon}</span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <div style={{ fontSize: "11px", color: C.muted, fontWeight: "600" }}>
                {sortedNotes.length} note{sortedNotes.length !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Notes feed */}
            <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {sortedNotes.map((note) => {
                const bgColor = avatarColor(note.authorName);
                const initials = getInitials(note.authorName);
                const timestamp = note.createdAt
                  ? new Date(note.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : null;

                return (
                  <div
                    key={note.id}
                    onClick={() => onEdit(post)}
                    style={{
                      display: "flex",
                      gap: "10px",
                      cursor: "pointer",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: bgColor,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: "700",
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>

                    {/* Bubble */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "8px",
                          marginBottom: "3px",
                        }}
                      >
                        <span style={{ fontSize: "12px", fontWeight: "700", color: C.text }}>
                          {note.authorName || "Unknown"}
                        </span>
                        {timestamp && (
                          <span style={{ fontSize: "10px", color: C.muted }}>{timestamp}</span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: C.text,
                          lineHeight: 1.5,
                          background: C.cardBg,
                          border: `1px solid ${C.border}`,
                          borderRadius: "8px",
                          padding: "8px 10px",
                        }}
                      >
                        {note.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CalendarView({ posts, onEdit, onNewPost, onDateChange, token }) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const [calView, setCalView] = useState("month");
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/events", { headers: { "x-session": token } })
      .then((r) => r.json())
      .then((data) => setEvents(Array.isArray(data) ? data.filter((e) => e.date) : []))
      .catch(() => {});
  }, [token]);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  // ── Month navigation (shared by Month, List, Comments) ──
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

  // ── Header varies by view ──
  const showMonthNav = calView === "month" || calView === "list" || calView === "comments";
  const showWeekNav = calView === "week";
  const showNewPostBtn = calView === "month" || calView === "day";

  return (
    <div>
      {/* ── Top bar: view switcher + nav ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <ViewSwitcher calView={calView} setCalView={setCalView} />

        {/* Month navigation (Month / List / Comments views) */}
        {showMonthNav && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <NavBtn onClick={prevMonth}>‹</NavBtn>
            <span
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: C.text,
                minWidth: "160px",
                textAlign: "center",
                letterSpacing: "-0.01em",
              }}
            >
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <NavBtn onClick={nextMonth}>›</NavBtn>
          </div>
        )}

        {/* Right side: Today + New Post */}
        <div style={{ display: "flex", gap: "8px" }}>
          {showMonthNav && (
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
          )}
          {showNewPostBtn && (
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
          )}
        </div>
      </div>

      {/* ── View body ── */}
      {calView === "month" && (
        <MonthView
          posts={posts}
          events={events}
          onEdit={onEdit}
          onNewPost={onNewPost}
          onDateChange={onDateChange}
          viewYear={viewYear}
          viewMonth={viewMonth}
          today={today}
        />
      )}

      {calView === "week" && (
        <WeekView
          posts={posts}
          onEdit={onEdit}
          today={today}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          setCalView={setCalView}
        />
      )}

      {calView === "day" && (
        <DayView
          posts={posts}
          onEdit={onEdit}
          onNewPost={onNewPost}
          today={today}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
        />
      )}

      {calView === "list" && (
        <ListView
          posts={posts}
          onEdit={onEdit}
          viewYear={viewYear}
          viewMonth={viewMonth}
        />
      )}

      {calView === "comments" && (
        <CommentsView
          posts={posts}
          onEdit={onEdit}
        />
      )}
    </div>
  );
}

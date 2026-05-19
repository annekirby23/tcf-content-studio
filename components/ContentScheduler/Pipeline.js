"use client";

import { useState } from "react";
import { STATUSES, STATUS_MAP, PLATFORM_MAP, PRIORITIES, AUDIENCE_MAP, C } from "./constants";

function PriorityDot({ priority }) {
  const colors = { urgent: "#DC2626", high: "#EF4444", medium: "#F59E0B", low: "#6B7280" };
  return <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: colors[priority] || colors.low, flexShrink: 0 }} title={priority} />;
}

function PipelineCard({ post, onEdit, onDragStart, isDragging }) {
  const today = new Date().toISOString().split("T")[0];
  const isOverdue = post.scheduledDate && post.scheduledDate < today && post.status !== "published";
  const dayLabel = (() => {
    if (!post.scheduledDate) return null;
    if (post.scheduledDate === today) return "Today";
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    if (post.scheduledDate === tomorrow) return "Tomorrow";
    const [y, m, d] = post.scheduledDate.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  })();

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, post.id)}
      onClick={() => onEdit(post)}
      style={{
        background: isDragging ? "rgba(99,102,241,0.12)" : C.card,
        border: `1px solid ${isDragging ? C.accent : isOverdue ? "rgba(239,68,68,0.3)" : C.border}`,
        borderRadius: "10px",
        padding: "12px",
        cursor: "grab",
        transition: "all 0.15s",
        marginBottom: "8px",
        opacity: isDragging ? 0.5 : 1,
        userSelect: "none",
      }}
      onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.background = C.cardBg; }}
      onMouseLeave={(e) => { if (!isDragging) e.currentTarget.style.background = C.card; }}
    >
      {/* Drag handle hint + platforms row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: C.muted, marginRight: "4px", cursor: "grab" }}>⠿</span>
          {(post.platforms || []).slice(0, 4).map((pid) => {
            const cfg = PLATFORM_MAP[pid];
            return cfg ? <span key={pid} style={{ fontSize: "13px" }} title={cfg.label}>{cfg.icon}</span> : null;
          })}
          {(!post.platforms || post.platforms.length === 0) && (
            <span style={{ fontSize: "11px", color: C.muted }}>No platform</span>
          )}
        </div>
        <PriorityDot priority={post.priority} />
      </div>

      <div style={{ fontSize: "13px", fontWeight: "600", color: C.text, lineHeight: "1.35", marginBottom: "8px" }}>
        {post.title}
      </div>

      {post.caption && (
        <div style={{ fontSize: "11px", color: C.muted, lineHeight: "1.4", marginBottom: "8px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {post.caption}
        </div>
      )}

      {post.audience && AUDIENCE_MAP[post.audience] && (
        <div style={{ marginBottom: "6px" }}>
          <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "8px", background: AUDIENCE_MAP[post.audience].bg, color: AUDIENCE_MAP[post.audience].color, fontWeight: "600" }}>
            {post.audience === "internal" ? "🏛" : "🌐"} {AUDIENCE_MAP[post.audience].label}
          </span>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
        <div>
          {post.campaign && (
            <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "10px", background: C.accentLight, color: C.accentBright, fontWeight: "600" }}>
              {post.campaign}
            </span>
          )}
        </div>
        {dayLabel && (
          <span style={{ fontSize: "10px", color: isOverdue ? "#EF4444" : C.muted, fontFamily: "monospace", fontWeight: isOverdue ? "700" : "400" }}>
            {isOverdue && "⚠ "}{dayLabel}
          </span>
        )}
      </div>
    </div>
  );
}

const ADMIN_ONLY_STATUSES = ["approved", "scheduled", "published"];

export default function Pipeline({ posts, onEdit, onNewPost, onStatusChange, currentUser }) {
  const isAdmin = currentUser?.role === "admin";
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);

  const grouped = {};
  STATUSES.forEach((s) => { grouped[s.id] = []; });
  posts.forEach((p) => {
    if (grouped[p.status]) grouped[p.status].push(p);
    else grouped["draft"].push(p);
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => {
      const pa = PRIORITIES.findIndex((p) => p.id === a.priority);
      const pb = PRIORITIES.findIndex((p) => p.id === b.priority);
      if (pa !== pb) return pa - pb;
      return (a.scheduledDate || "9999").localeCompare(b.scheduledDate || "9999");
    });
  });

  const handleDragStart = (e, postId) => {
    setDraggingId(postId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("postId", postId);
  };

  const handleDragOver = (e, statusId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(statusId);
  };

  const handleDragLeave = (e) => {
    // Only clear if leaving the column entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = (e, statusId) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData("postId");
    setDraggingId(null);
    setDragOverStatus(null);
    if (!isAdmin && ADMIN_ONLY_STATUSES.includes(statusId)) return;
    const post = posts.find((p) => p.id === postId);
    if (post && post.status !== statusId) {
      onStatusChange(postId, statusId);
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOverStatus(null);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
          {[
            { color: "#DC2626", label: "Urgent" },
            { color: "#EF4444", label: "High" },
            { color: "#F59E0B", label: "Medium" },
            { color: "#6B7280", label: "Low" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: C.muted }}>
              <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: color }} />
              {label}
            </div>
          ))}
          <span style={{ fontSize: "11px", color: C.muted, borderLeft: `1px solid ${C.border}`, paddingLeft: "16px" }}>
            Drag cards between columns to update status
          </span>
        </div>
        <button
          onClick={() => onNewPost()}
          style={{ padding: "7px 16px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
        >
          + New Post
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(190px, 1fr))", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
        {STATUSES.map((status) => {
          const col = grouped[status.id] || [];
          const isLocked = !isAdmin && ADMIN_ONLY_STATUSES.includes(status.id);
          const isDropTarget = dragOverStatus === status.id && !isLocked;
          const isDraggingFromThis = draggingId && col.some((p) => p.id === draggingId);

          return (
            <div
              key={status.id}
              style={{ minWidth: "190px" }}
              onDragOver={(e) => handleDragOver(e, status.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status.id)}
            >
              {/* Column header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", padding: "0 2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: status.color }} />
                  <span style={{ fontSize: "12px", fontWeight: "700", color: C.text }}>{status.label}</span>
                  {isLocked && <span title="Admin only" style={{ fontSize: "10px" }}>🔒</span>}
                </div>
                <span style={{ fontSize: "11px", color: C.muted, fontFamily: "monospace", background: "rgba(0,0,0,0.06)", padding: "1px 7px", borderRadius: "10px" }}>
                  {col.length}
                </span>
              </div>

              {/* Drop zone */}
              <div
                style={{
                  minHeight: "300px",
                  padding: "8px",
                  borderRadius: "12px",
                  background: isDropTarget ? `${status.color}1A` : C.cardBg,
                  border: `${isDropTarget ? "2px" : "1px"} ${isDropTarget ? "dashed" : "solid"} ${isDropTarget ? status.color : C.border}`,
                  transition: "all 0.15s",
                }}
              >
                {isDropTarget && col.length === 0 && (
                  <div style={{ textAlign: "center", padding: "24px 8px", fontSize: "12px", color: status.color, opacity: 0.7 }}>
                    Drop here
                  </div>
                )}

                {col.map((p) => (
                  <PipelineCard
                    key={p.id}
                    post={p}
                    onEdit={onEdit}
                    onDragStart={handleDragStart}
                    isDragging={draggingId === p.id}
                    onDragEnd={handleDragEnd}
                  />
                ))}

                <button
                  onClick={() => onNewPost(null, status.id)}
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: "8px",
                    border: `1px dashed ${C.border}`,
                    background: "transparent",
                    color: C.muted,
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accentBright; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
                >
                  + Add
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

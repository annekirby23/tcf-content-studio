"use client";

import { STATUSES, STATUS_MAP, PLATFORM_MAP, PRIORITIES, C } from "./constants";

function PriorityDot({ priority }) {
  const colors = { urgent: "#DC2626", high: "#EF4444", medium: "#F59E0B", low: "#6B7280" };
  return <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: colors[priority] || colors.low, flexShrink: 0 }} title={priority} />;
}

function PipelineCard({ post, onEdit }) {
  const statusCfg = STATUS_MAP[post.status] || {};
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
      onClick={() => onEdit(post)}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${isOverdue ? "rgba(239,68,68,0.3)" : C.border}`,
        borderRadius: "10px",
        padding: "12px",
        cursor: "pointer",
        transition: "all 0.15s",
        marginBottom: "8px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
    >
      {/* Platform icons */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ display: "flex", gap: "4px" }}>
          {(post.platforms || []).slice(0, 4).map((pid) => {
            const cfg = PLATFORM_MAP[pid];
            return cfg ? (
              <span key={pid} style={{ fontSize: "13px" }} title={cfg.label}>{cfg.icon}</span>
            ) : null;
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

export default function Pipeline({ posts, onEdit, onNewPost }) {
  const grouped = {};
  STATUSES.forEach((s) => { grouped[s.id] = []; });
  posts.forEach((p) => {
    if (grouped[p.status]) grouped[p.status].push(p);
    else grouped["draft"] = [...(grouped["draft"] || []), p];
  });

  Object.keys(grouped).forEach((key) => {
    grouped[key].sort((a, b) => {
      const pa = PRIORITIES.findIndex((p) => p.id === a.priority);
      const pb = PRIORITIES.findIndex((p) => p.id === b.priority);
      if (pa !== pb) return pa - pb;
      return (a.scheduledDate || "9999").localeCompare(b.scheduledDate || "9999");
    });
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
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
        </div>
        <button
          onClick={() => onNewPost()}
          style={{ padding: "7px 16px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
        >
          + New Post
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(180px, 1fr))", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
        {STATUSES.map((status) => {
          const col = grouped[status.id] || [];
          return (
            <div key={status.id} style={{ minWidth: "180px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", padding: "0 2px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: status.color }} />
                  <span style={{ fontSize: "12px", fontWeight: "700", color: C.text }}>{status.label}</span>
                </div>
                <span style={{ fontSize: "11px", color: C.muted, fontFamily: "monospace", background: "rgba(255,255,255,0.06)", padding: "1px 7px", borderRadius: "10px" }}>
                  {col.length}
                </span>
              </div>

              <div
                style={{
                  minHeight: "300px",
                  padding: "8px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${C.border}`,
                }}
              >
                {col.map((p) => <PipelineCard key={p.id} post={p} onEdit={onEdit} />)}
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

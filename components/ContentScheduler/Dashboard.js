"use client";

import { PLATFORMS, STATUSES, STATUS_MAP, PLATFORM_MAP, PILLARS, C } from "./constants";

function StatCard({ label, value, sub, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: "14px",
        padding: "20px",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.15s",
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.borderColor = C.accent)}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.borderColor = C.border)}
    >
      <div style={{ fontSize: "11px", color: C.muted, fontWeight: "600", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>{label}</div>
      <div style={{ fontSize: "36px", fontWeight: "800", color: color || C.text, lineHeight: 1, fontFamily: "monospace" }}>{value}</div>
      {sub && <div style={{ fontSize: "12px", color: C.muted, marginTop: "6px" }}>{sub}</div>}
    </div>
  );
}

function UpcomingItem({ post, onEdit }) {
  const platformColors = post.platforms?.map((p) => PLATFORM_MAP[p]?.color).filter(Boolean) || [];
  const statusCfg = STATUS_MAP[post.status] || {};
  const dayLabel = (() => {
    if (!post.scheduledDate) return "Unscheduled";
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    if (post.scheduledDate === today) return "Today";
    if (post.scheduledDate === tomorrow) return "Tomorrow";
    const [y, m, d] = post.scheduledDate.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  })();

  return (
    <div
      onClick={() => onEdit(post)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${C.border}`,
        cursor: "pointer",
        transition: "background 0.15s",
        marginBottom: "8px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        {platformColors.slice(0, 3).map((color, i) => (
          <div key={i} style={{ width: "4px", height: "4px", borderRadius: "50%", background: color }} />
        ))}
        {platformColors.length === 0 && <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: C.muted }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{post.title}</div>
        <div style={{ fontSize: "12px", color: C.muted, marginTop: "2px" }}>
          {post.platforms?.map((p) => PLATFORM_MAP[p]?.icon).join(" ") || "—"}
          {post.campaign && ` · ${post.campaign}`}
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "12px", fontWeight: "600", color: C.muted }}>{dayLabel}</div>
        {post.scheduledTime && <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>{post.scheduledTime}</div>}
      </div>
      <div
        style={{
          padding: "3px 8px",
          borderRadius: "20px",
          background: statusCfg.bg || "rgba(107,114,128,0.2)",
          color: statusCfg.color || C.muted,
          fontSize: "11px",
          fontWeight: "600",
          flexShrink: 0,
        }}
      >
        {statusCfg.label || post.status}
      </div>
    </div>
  );
}

export default function Dashboard({ posts, onEdit, onNewPost }) {
  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const scheduled = posts.filter((p) => p.status === "scheduled" && p.scheduledDate >= today);
  const pending = posts.filter((p) => p.status === "review");
  const publishedMonth = posts.filter((p) => p.status === "published" && p.scheduledDate?.startsWith(thisMonth));
  const drafts = posts.filter((p) => p.status === "draft");
  const upcoming = posts
    .filter((p) => p.scheduledDate && p.scheduledDate >= today && p.scheduledDate <= nextWeek)
    .sort((a, b) => (`${a.scheduledDate}T${a.scheduledTime || "00:00"}`).localeCompare(`${b.scheduledDate}T${b.scheduledTime || "00:00"}`));

  const platformCounts = {};
  posts.forEach((p) => {
    (p.platforms || []).forEach((plt) => {
      platformCounts[plt] = (platformCounts[plt] || 0) + 1;
    });
  });
  const topPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const pillarCounts = {};
  posts.forEach((p) => { if (p.pillar) pillarCounts[p.pillar] = (pillarCounts[p.pillar] || 0) + 1; });
  const topPillars = Object.entries(pillarCounts).sort((a, b) => b[1] - a[1]);
  const totalPillar = topPillars.reduce((s, [, v]) => s + v, 0);

  const pillarColors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#3B82F6", "#E1306C", "#69C9D0"];

  return (
    <div>
      {/* KPI grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "28px" }}>
        <StatCard label="Scheduled" value={scheduled.length} sub="upcoming posts" color="#8B5CF6" />
        <StatCard label="Pending Review" value={pending.length} sub="awaiting approval" color="#F59E0B" />
        <StatCard label="Published" value={publishedMonth.length} sub="this month" color="#10B981" />
        <StatCard label="Drafts" value={drafts.length} sub="in progress" color="#6B7280" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "28px" }}>
        {/* Upcoming queue */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: C.text, letterSpacing: "0.02em" }}>Upcoming — Next 7 Days</h3>
            <span style={{ fontSize: "12px", color: C.muted }}>{upcoming.length} posts</span>
          </div>
          {upcoming.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "12px",
                border: `1px dashed ${C.border}`,
                color: C.muted,
                fontSize: "13px",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>📭</div>
              No posts scheduled this week
              <div style={{ marginTop: "12px" }}>
                <button
                  onClick={onNewPost}
                  style={{
                    padding: "6px 16px",
                    borderRadius: "20px",
                    border: `1px solid ${C.accent}`,
                    background: C.accentLight,
                    color: C.accentBright,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  + Schedule Content
                </button>
              </div>
            </div>
          ) : (
            <div>{upcoming.map((p) => <UpcomingItem key={p.id} post={p} onEdit={onEdit} />)}</div>
          )}
        </div>

        {/* Platform breakdown */}
        <div>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: C.text, letterSpacing: "0.02em", marginBottom: "14px" }}>Platform Breakdown</h3>
          {topPlatforms.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: `1px dashed ${C.border}`, color: C.muted, fontSize: "13px" }}>
              No content yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {topPlatforms.map(([pid, count]) => {
                const cfg = PLATFORM_MAP[pid];
                if (!cfg) return null;
                const pct = Math.round((count / posts.length) * 100);
                return (
                  <div key={pid}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                      <span style={{ fontSize: "13px", color: C.text, display: "flex", alignItems: "center", gap: "6px" }}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <span style={{ fontSize: "12px", color: C.muted, fontFamily: "monospace" }}>{count} posts</span>
                    </div>
                    <div style={{ height: "5px", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: cfg.color, borderRadius: "3px", transition: "width 0.4s ease" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Content pillar breakdown */}
          {topPillars.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: C.text, letterSpacing: "0.02em", marginBottom: "14px" }}>Content Pillars</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {topPillars.map(([pid, count], i) => {
                  const pillar = PILLARS.find((p) => p.id === pid);
                  const pct = Math.round((count / totalPillar) * 100);
                  const color = pillarColors[i % pillarColors.length];
                  return (
                    <div key={pid} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: "12px", color: C.muted, flex: 1 }}>{pillar?.label || pid}</span>
                      <span style={{ fontSize: "12px", color: C.text, fontFamily: "monospace", fontWeight: "600" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status pipeline overview */}
      <div>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: C.text, letterSpacing: "0.02em", marginBottom: "14px" }}>Content Pipeline</h3>
        <div style={{ display: "flex", gap: "0", borderRadius: "12px", overflow: "hidden", border: `1px solid ${C.border}` }}>
          {STATUSES.map((s, i) => {
            const cnt = posts.filter((p) => p.status === s.id).length;
            return (
              <div
                key={s.id}
                style={{
                  flex: 1,
                  padding: "16px 12px",
                  borderRight: i < STATUSES.length - 1 ? `1px solid ${C.border}` : "none",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "22px", fontWeight: "800", color: s.color, fontFamily: "monospace" }}>{cnt}</div>
                <div style={{ fontSize: "11px", color: C.muted, marginTop: "4px", fontWeight: "600" }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

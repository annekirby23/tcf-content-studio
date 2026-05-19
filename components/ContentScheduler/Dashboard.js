"use client";

import { useState } from "react";
import { PLATFORMS, STATUSES, STATUS_MAP, PLATFORM_MAP, PILLARS, THEMES, THEME_MAP, AUDIENCES, C } from "./constants";

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.card,
        border: `1px solid ${hovered ? C.accent : C.border}`,
        borderRadius: "14px",
        padding: "20px 20px 18px",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: hovered ? C.shadowMd : C.shadow,
        position: "relative",
      }}
    >
      <div style={{ fontSize: "12px", color: C.muted, fontWeight: "600", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "10px" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ fontSize: "38px", fontWeight: "800", color: color || C.text, lineHeight: 1, fontFamily: "monospace" }}>
          {value}
        </div>
        {onClick && (
          <div style={{ fontSize: "16px", color: hovered ? C.accent : C.muted, transition: "color 0.15s", marginBottom: "4px" }}>→</div>
        )}
      </div>
      {sub && <div style={{ fontSize: "12px", color: C.muted, marginTop: "6px" }}>{sub}</div>}
    </div>
  );
}

// ─── Goals Section ───────────────────────────────────────────────────────────

function GoalsSection({ posts, goals, currentUser, onGoalsUpdate }) {
  const isAdmin = currentUser?.role === "admin";
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...goals });
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);

  // Published this month
  const publishedCount = posts.filter(
    (p) => p.status === "published" && p.scheduledDate?.startsWith(thisMonth)
  ).length;

  // Scheduled this week (next 7 days from today)
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const scheduledCount = posts.filter(
    (p) => p.status === "scheduled" && p.scheduledDate >= today && p.scheduledDate <= nextWeek
  ).length;

  const publishedPct = goals.publishedPerMonth > 0
    ? Math.min(100, Math.round((publishedCount / goals.publishedPerMonth) * 100))
    : 0;
  const scheduledPct = goals.scheduledPerWeek > 0
    ? Math.min(100, Math.round((scheduledCount / goals.scheduledPerWeek) * 100))
    : 0;

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/goals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onGoalsUpdate(form);
      setEditing(false);
    } catch (_) {
      // still update locally
      onGoalsUpdate(form);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: "14px",
        padding: "20px",
        boxShadow: C.shadow,
        marginBottom: "24px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700", color: C.text, letterSpacing: "0.02em" }}>
          Content Goals
        </h3>
        {isAdmin && !editing && (
          <button
            onClick={() => { setForm({ ...goals }); setEditing(true); }}
            style={{
              padding: "5px 14px",
              borderRadius: "20px",
              border: `1px solid ${C.border}`,
              background: C.cardBg,
              color: C.muted,
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Edit Goals
          </button>
        )}
        {isAdmin && editing && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setEditing(false)}
              style={{
                padding: "5px 14px",
                borderRadius: "20px",
                border: `1px solid ${C.border}`,
                background: C.cardBg,
                color: C.muted,
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "5px 14px",
                borderRadius: "20px",
                border: "none",
                background: C.accent,
                color: "#fff",
                fontSize: "12px",
                fontWeight: "600",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          {[
            { key: "publishedPerMonth", label: "Published / month goal" },
            { key: "scheduledPerWeek", label: "Scheduled / week goal" },
            { key: "reviewTargetDays", label: "Review target (days)" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: "12px", color: C.muted, fontWeight: "600", marginBottom: "6px" }}>
                {label}
              </label>
              <input
                type="number"
                min="0"
                value={form[key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: `1px solid ${C.border}`,
                  borderRadius: "8px",
                  background: C.cardBg,
                  color: C.text,
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <ProgressBar
            label="Published this month"
            current={publishedCount}
            goal={goals.publishedPerMonth}
            pct={publishedPct}
            color="#10B981"
          />
          <ProgressBar
            label="Scheduled this week"
            current={scheduledCount}
            goal={goals.scheduledPerWeek}
            pct={scheduledPct}
            color="#8B5CF6"
          />
          {goals.reviewTargetDays != null && (
            <div style={{ fontSize: "13px", color: C.muted }}>
              Review target: <span style={{ fontWeight: "700", color: C.text }}>{goals.reviewTargetDays} day{goals.reviewTargetDays !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProgressBar({ label, current, goal, pct, color }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ fontSize: "13px", color: C.text, fontWeight: "600" }}>{label}</span>
        <span style={{ fontSize: "12px", color: C.muted, fontFamily: "monospace" }}>
          {current} / {goal}
        </span>
      </div>
      <div style={{ height: "10px", background: C.cardBg, borderRadius: "6px", overflow: "hidden", border: `1px solid ${C.border}`, position: "relative" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: "6px",
            transition: "width 0.5s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            position: "relative",
          }}
        >
          {pct >= 20 && (
            <span style={{ fontSize: "9px", fontWeight: "800", color: "#fff", paddingRight: "5px" }}>
              {pct}%
            </span>
          )}
        </div>
        {pct < 20 && (
          <span
            style={{
              position: "absolute",
              left: `${pct + 2}%`,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "9px",
              fontWeight: "800",
              color: C.muted,
            }}
          >
            {pct}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Upcoming Item ────────────────────────────────────────────────────────────

function UpcomingItem({ post, onEdit }) {
  const [hovered, setHovered] = useState(false);
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

  const audienceCfg = AUDIENCES.find((a) => a.id === post.audience);

  return (
    <div
      onClick={() => onEdit(post)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "11px 14px",
        borderRadius: "10px",
        background: hovered ? C.hover : "transparent",
        border: `1px solid ${hovered ? C.accent : C.border}`,
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
        marginBottom: "8px",
      }}
    >
      {/* Platform color dots */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3px", flexShrink: 0 }}>
        {platformColors.slice(0, 3).map((color, i) => (
          <div key={i} style={{ width: "5px", height: "5px", borderRadius: "50%", background: color }} />
        ))}
        {platformColors.length === 0 && (
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: C.border }} />
        )}
      </div>

      {/* Title + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {post.title}
        </div>
        <div style={{ fontSize: "12px", color: C.muted, marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>{post.platforms?.map((p) => PLATFORM_MAP[p]?.icon).join(" ") || "—"}</span>
          {post.campaign && <span style={{ color: C.muted }}>· {post.campaign}</span>}
        </div>
      </div>

      {/* Audience badge */}
      {audienceCfg && (
        <div
          style={{
            padding: "3px 8px",
            borderRadius: "20px",
            background: audienceCfg.bg,
            color: audienceCfg.color,
            fontSize: "11px",
            fontWeight: "700",
            flexShrink: 0,
            letterSpacing: "0.04em",
          }}
        >
          {audienceCfg.label}
        </div>
      )}

      {/* Date */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "12px", fontWeight: "600", color: C.muted }}>{dayLabel}</div>
        {post.scheduledTime && (
          <div style={{ fontSize: "11px", color: C.muted, marginTop: "2px" }}>{post.scheduledTime}</div>
        )}
      </div>

      {/* Status pill */}
      <div
        style={{
          padding: "3px 8px",
          borderRadius: "20px",
          background: statusCfg.bg || "rgba(100,116,139,0.12)",
          color: statusCfg.color || C.muted,
          fontSize: "11px",
          fontWeight: "700",
          flexShrink: 0,
        }}
      >
        {statusCfg.label || post.status}
      </div>
    </div>
  );
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({ campaign, postCount, onClick }) {
  const [hovered, setHovered] = useState(false);
  const hasRange = campaign.startDate || campaign.endDate;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.card,
        border: `1px solid ${hovered ? C.accent : C.border}`,
        borderRadius: "12px",
        padding: "16px",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: hovered ? C.shadowMd : C.shadow,
      }}
    >
      <div style={{ fontSize: "14px", fontWeight: "700", color: C.text, marginBottom: "6px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {campaign.name || campaign}
      </div>
      {hasRange && (
        <div style={{ fontSize: "12px", color: C.muted, marginBottom: "6px" }}>
          {campaign.startDate || "—"} → {campaign.endDate || "ongoing"}
        </div>
      )}
      <div
        style={{
          display: "inline-block",
          padding: "3px 10px",
          borderRadius: "20px",
          background: "rgba(99,102,241,0.1)",
          color: C.accent,
          fontSize: "12px",
          fontWeight: "700",
        }}
      >
        {postCount} post{postCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({ posts, campaigns, goals, currentUser, onEdit, onNewPost, onNavigate, onGoalsUpdate }) {
  const safeGoals = goals || { publishedPerMonth: 0, scheduledPerWeek: 0, reviewTargetDays: 3 };

  const today = new Date().toISOString().split("T")[0];
  const thisMonth = today.slice(0, 7);
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

  const scheduled = posts.filter((p) => p.status === "scheduled" && p.scheduledDate >= today);
  const pending = posts.filter((p) => p.status === "review");
  const publishedMonth = posts.filter((p) => p.status === "published" && p.scheduledDate?.startsWith(thisMonth));
  const drafts = posts.filter((p) => p.status === "draft");

  const upcoming = posts
    .filter((p) => p.scheduledDate && p.scheduledDate >= today && p.scheduledDate <= nextWeek)
    .sort((a, b) =>
      `${a.scheduledDate}T${a.scheduledTime || "00:00"}`.localeCompare(
        `${b.scheduledDate}T${b.scheduledTime || "00:00"}`
      )
    );

  // Platform counts
  const platformCounts = {};
  posts.forEach((p) => {
    (p.platforms || []).forEach((plt) => {
      platformCounts[plt] = (platformCounts[plt] || 0) + 1;
    });
  });
  const topPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  // Pillar counts
  const pillarCounts = {};
  posts.forEach((p) => {
    if (p.pillar) pillarCounts[p.pillar] = (pillarCounts[p.pillar] || 0) + 1;
  });
  const topPillars = Object.entries(pillarCounts).sort((a, b) => b[1] - a[1]);
  const totalPillar = topPillars.reduce((s, [, v]) => s + v, 0);
  const pillarColors = ["#6366F1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#3B82F6", "#E1306C", "#69C9D0"];

  // Campaign post counts
  const campaignPostCounts = {};
  posts.forEach((p) => {
    if (p.campaign) campaignPostCounts[p.campaign] = (campaignPostCounts[p.campaign] || 0) + 1;
  });

  // Build campaigns list — support both array of objects and array of strings
  const campaignList = Array.isArray(campaigns)
    ? campaigns.map((c) => (typeof c === "string" ? { name: c } : c))
    : Object.keys(campaignPostCounts).map((name) => ({ name }));

  const sectionTitle = (text) => (
    <h3 style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: "700", color: C.text, letterSpacing: "0.02em" }}>
      {text}
    </h3>
  );

  return (
    <div>
      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <KpiCard
          label="Scheduled"
          value={scheduled.length}
          sub="upcoming posts"
          color="#8B5CF6"
          onClick={() => onNavigate("list", { status: "scheduled" })}
        />
        <KpiCard
          label="Pending Review"
          value={pending.length}
          sub="awaiting approval"
          color="#F59E0B"
          onClick={() => onNavigate("list", { status: "review" })}
        />
        <KpiCard
          label="Published This Month"
          value={publishedMonth.length}
          sub="this month"
          color="#10B981"
          onClick={() => onNavigate("list", { status: "published" })}
        />
        <KpiCard
          label="Drafts"
          value={drafts.length}
          sub="in progress"
          color="#94A3B8"
          onClick={() => onNavigate("list", { status: "draft" })}
        />
      </div>

      {/* Goals */}
      <GoalsSection
        posts={posts}
        goals={safeGoals}
        currentUser={currentUser}
        onGoalsUpdate={onGoalsUpdate}
      />

      {/* Upcoming + Platform/Pillar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>

        {/* Upcoming 7 days */}
        <div
          style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: "14px",
            padding: "20px",
            boxShadow: C.shadow,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            {sectionTitle("Upcoming — Next 7 Days")}
            <span style={{ fontSize: "12px", color: C.muted, marginTop: "-14px" }}>{upcoming.length} posts</span>
          </div>
          {upcoming.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "32px 16px",
                background: C.cardBg,
                borderRadius: "10px",
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
                    background: "rgba(99,102,241,0.08)",
                    color: C.accentBright,
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  + Schedule Content
                </button>
              </div>
            </div>
          ) : (
            <div>
              {upcoming.map((p) => (
                <UpcomingItem key={p.id} post={p} onEdit={onEdit} />
              ))}
            </div>
          )}
        </div>

        {/* Platform + Pillar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Platform Breakdown */}
          <div
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              borderRadius: "14px",
              padding: "20px",
              boxShadow: C.shadow,
            }}
          >
            {sectionTitle("Platform Breakdown")}
            {topPlatforms.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 16px",
                  background: C.cardBg,
                  borderRadius: "10px",
                  border: `1px dashed ${C.border}`,
                  color: C.muted,
                  fontSize: "13px",
                }}
              >
                No content yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {topPlatforms.map(([pid, count]) => {
                  const cfg = PLATFORM_MAP[pid];
                  if (!cfg) return null;
                  const pct = Math.round((count / posts.length) * 100);
                  return (
                    <PlatformBar
                      key={pid}
                      cfg={cfg}
                      count={count}
                      pct={pct}
                      onClick={() => onNavigate("list", { platform: pid })}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Content Pillar Breakdown */}
          {topPillars.length > 0 && (
            <div
              style={{
                background: C.card,
                border: `1px solid ${C.border}`,
                borderRadius: "14px",
                padding: "20px",
                boxShadow: C.shadow,
              }}
            >
              {sectionTitle("Content Pillars")}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {topPillars.map(([pid, count], i) => {
                  const pillar = PILLARS.find((p) => p.id === pid);
                  const pct = Math.round((count / totalPillar) * 100);
                  const color = pillarColors[i % pillarColors.length];
                  return (
                    <div key={pid} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: "13px", color: C.text, flex: 1 }}>{pillar?.label || pid}</span>
                      <span style={{ fontSize: "12px", fontFamily: "monospace", color: C.muted }}>{count}</span>
                      <span style={{ fontSize: "12px", fontFamily: "monospace", fontWeight: "700", color: C.text, width: "36px", textAlign: "right" }}>
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline status overview */}
      <div style={{ marginBottom: "24px" }}>
        {sectionTitle("Content Pipeline")}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${STATUSES.length}, 1fr)`,
            borderRadius: "14px",
            overflow: "hidden",
            border: `1px solid ${C.border}`,
            boxShadow: C.shadow,
            background: C.card,
          }}
        >
          {STATUSES.map((s, i) => {
            const cnt = posts.filter((p) => p.status === s.id).length;
            return (
              <PipelineCell
                key={s.id}
                status={s}
                count={cnt}
                isLast={i === STATUSES.length - 1}
                onClick={() => onNavigate("pipeline", { status: s.id })}
              />
            );
          })}
        </div>
      </div>

      {/* Campaigns */}
      {campaignList.length > 0 && (
        <div style={{ marginBottom: "8px" }}>
          {sectionTitle("Campaigns")}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
            {campaignList.map((campaign) => {
              const name = campaign.name || campaign;
              const count = campaignPostCounts[name] || 0;
              return (
                <CampaignCard
                  key={name}
                  campaign={campaign}
                  postCount={count}
                  onClick={() => onNavigate("list", { campaign: name })}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Platform Bar ─────────────────────────────────────────────────────────────

function PlatformBar({ cfg, count, pct, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
        <span
          style={{
            fontSize: "13px",
            color: hovered ? cfg.color : C.text,
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "color 0.15s",
            fontWeight: hovered ? "700" : "500",
          }}
        >
          {cfg.icon} {cfg.label}
        </span>
        <span style={{ fontSize: "12px", color: C.muted, fontFamily: "monospace" }}>{count} posts</span>
      </div>
      <div
        style={{
          height: "6px",
          background: C.cardBg,
          borderRadius: "4px",
          overflow: "hidden",
          border: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: cfg.color,
            borderRadius: "4px",
            transition: "width 0.4s ease, opacity 0.15s",
            opacity: hovered ? 1 : 0.8,
          }}
        />
      </div>
    </div>
  );
}

// ─── Pipeline Cell ────────────────────────────────────────────────────────────

function PipelineCell({ status, count, isLast, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "18px 12px",
        borderRight: isLast ? "none" : `1px solid ${C.border}`,
        textAlign: "center",
        cursor: "pointer",
        background: hovered ? C.hover : "transparent",
        transition: "background 0.15s",
      }}
    >
      <div
        style={{
          fontSize: "28px",
          fontWeight: "800",
          color: status.color,
          fontFamily: "monospace",
          lineHeight: 1,
          transition: "transform 0.15s",
          transform: hovered ? "scale(1.1)" : "scale(1)",
          display: "inline-block",
        }}
      >
        {count}
      </div>
      <div style={{ fontSize: "11px", color: C.muted, marginTop: "5px", fontWeight: "600", letterSpacing: "0.04em" }}>
        {status.label}
      </div>
    </div>
  );
}

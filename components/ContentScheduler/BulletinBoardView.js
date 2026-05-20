"use client";

import { useState, useEffect } from "react";
import { C } from "./constants";

function apiFetch(url, opts = {}, token) {
  return fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", "x-session": token, ...(opts.headers || {}) },
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function MemberInitials({ name, size = 32 }) {
  const cols = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F59E0B","#10B981","#3B82F6","#06B6D4"];
  let h = 0; for (let i = 0; i < (name||"").length; i++) h = (name||"").charCodeAt(i) + ((h << 5) - h);
  const bg = cols[Math.abs(h) % cols.length];
  const ini = (name||"?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: "700", flexShrink: 0 }}>
      {ini}
    </div>
  );
}

function textInput(extra = {}) {
  return {
    padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: "8px",
    background: C.inputBg, color: C.text, fontSize: "13px", outline: "none",
    boxSizing: "border-box", fontFamily: "inherit", ...extra,
  };
}

// ─── Member Count Tracker ─────────────────────────────────────────────────────

function MemberCountTracker({ token, isAdmin, memberCount, memberGoal, memberGoalDate, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [draftCount, setDraftCount] = useState(memberCount);
  const [draftGoal, setDraftGoal] = useState(memberGoal);
  const [draftDate, setDraftDate] = useState(memberGoalDate);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraftCount(memberCount);
    setDraftGoal(memberGoal);
    setDraftDate(memberGoalDate);
  }, [memberCount, memberGoal, memberGoalDate]);

  const pct = memberGoal > 0 ? Math.min(100, Math.round((memberCount / memberGoal) * 100)) : 0;

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiFetch("/api/bulletin", {
        method: "PUT",
        body: JSON.stringify({ memberCount: Number(draftCount), memberGoal: Number(draftGoal), memberGoalDate: draftDate }),
      }, token);
      const data = await res.json();
      onUpdate(data);
      setEditing(false);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px 24px", marginBottom: "20px", boxShadow: C.shadow }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px" }}>👥</span>
          <span style={{ fontSize: "15px", fontWeight: "800", color: C.text }}>Member Growth</span>
        </div>
        {isAdmin && !editing && (
          <button
            onClick={() => setEditing(true)}
            style={{ padding: "5px 12px", borderRadius: "8px", border: `1px solid ${C.border}`, background: C.cardBg, color: C.muted, fontSize: "11px", fontWeight: "600", cursor: "pointer" }}
          >
            ✏️ Edit
          </button>
        )}
      </div>

      {editing ? (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <div>
              <label style={{ fontSize: "10px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "4px" }}>Current Members</label>
              <input
                type="number"
                value={draftCount}
                onChange={(e) => setDraftCount(e.target.value)}
                style={{ ...textInput({ width: "100%" }) }}
              />
            </div>
            <div>
              <label style={{ fontSize: "10px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "4px" }}>Goal</label>
              <input
                type="number"
                value={draftGoal}
                onChange={(e) => setDraftGoal(e.target.value)}
                style={{ ...textInput({ width: "100%" }) }}
              />
            </div>
            <div>
              <label style={{ fontSize: "10px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "4px" }}>Goal Date</label>
              <input
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                placeholder="e.g. September 2026"
                style={{ ...textInput({ width: "100%" }) }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button onClick={() => setEditing(false)} style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", cursor: "pointer" }}>Cancel</button>
            <button onClick={save} disabled={saving} style={{ padding: "6px 16px", borderRadius: "8px", border: "none", background: C.accent, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>{saving ? "Saving…" : "Save"}</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "10px" }}>
            <span style={{ fontSize: "32px", fontWeight: "900", color: C.accent, lineHeight: 1 }}>{memberCount}</span>
            <span style={{ fontSize: "16px", color: C.muted, fontWeight: "600" }}>/ {memberGoal} members</span>
            <span style={{ fontSize: "12px", color: C.muted, marginLeft: "auto" }}>Goal by {memberGoalDate}</span>
          </div>
          <div style={{ height: "10px", background: C.cardBg, borderRadius: "99px", overflow: "hidden", border: `1px solid ${C.border}` }}>
            <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${C.accent}, #8B5CF6)`, borderRadius: "99px", transition: "width 0.4s ease" }} />
          </div>
          <div style={{ marginTop: "6px", fontSize: "11px", color: C.muted, fontWeight: "600" }}>{pct}% of goal reached · {Math.max(0, memberGoal - memberCount)} to go</div>
        </div>
      )}
    </div>
  );
}

// ─── New Announcement Form (admin) ────────────────────────────────────────────

function NewPostForm({ token, onSave, onClose }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [showOnWorkspace, setShowOnWorkspace] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/bulletin", {
        method: "POST",
        body: JSON.stringify({ type: "post", title: title.trim(), content: content.trim(), pinned, showOnWorkspace }),
      }, token);
      const data = await res.json();
      onSave(data);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px", marginBottom: "20px", boxShadow: C.shadow }}>
      <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: "700", color: C.text }}>📢 New Announcement</h3>
      <div style={{ marginBottom: "10px" }}>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)…"
          style={{ ...textInput({ width: "100%", marginBottom: "8px" }) }}
        />
      </div>
      <div style={{ marginBottom: "10px" }}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Write your announcement here…"
          style={{ ...textInput({ width: "100%", resize: "vertical", lineHeight: "1.6" }) }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: C.muted, cursor: "pointer" }}>
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} style={{ accentColor: C.accent }} />
            📌 Pin this announcement
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: C.muted, cursor: "pointer" }}>
            <input type="checkbox" checked={showOnWorkspace} onChange={(e) => setShowOnWorkspace(e.target.checked)} style={{ accentColor: C.accent }} />
            🏠 Show on all workspaces
          </label>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onClose} style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", cursor: "pointer" }}>Cancel</button>
          <button onClick={submit} disabled={!content.trim() || saving} style={{ padding: "7px 18px", borderRadius: "8px", border: "none", background: content.trim() ? C.accent : C.border, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: content.trim() ? "pointer" : "not-allowed" }}>
            {saving ? "Posting…" : "Post Announcement"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Shoutout Form ─────────────────────────────────────────────────────────────

function ShoutoutForm({ token, teamMembers, currentUser, onSave, onClose }) {
  const [toId, setToId] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const others = teamMembers.filter((m) => m.id !== currentUser?.id);

  const submit = async () => {
    if (!toId || !message.trim()) return;
    const recipient = others.find((m) => m.id === toId);
    if (!recipient) return;
    setSaving(true);
    try {
      const res = await apiFetch("/api/bulletin", { method: "POST", body: JSON.stringify({ type: "shoutout", toId: recipient.id, toName: recipient.name, message: message.trim() }) }, token);
      const data = await res.json();
      onSave(data);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "14px", padding: "20px", marginBottom: "20px", boxShadow: C.shadow }}>
      <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: "700", color: C.text }}>⭐ Give a Shoutout</h3>
      <div style={{ marginBottom: "10px" }}>
        <label style={{ fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "5px" }}>Who are you shouting out?</label>
        <select
          autoFocus
          value={toId}
          onChange={(e) => setToId(e.target.value)}
          style={{ ...textInput({ width: "100%" }), color: toId ? C.text : C.muted }}
        >
          <option value="">— Select a team member —</option>
          {others.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: "12px" }}>
        <label style={{ fontSize: "11px", color: C.muted, fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "5px" }}>Your message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="What did they do? Be specific — it means more!"
          style={{ ...textInput({ width: "100%", resize: "vertical", lineHeight: "1.6" }) }}
        />
      </div>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${C.border}`, background: "none", color: C.muted, fontSize: "12px", cursor: "pointer" }}>Cancel</button>
        <button onClick={submit} disabled={!toId || !message.trim() || saving} style={{ padding: "7px 18px", borderRadius: "8px", border: "none", background: (toId && message.trim()) ? "#F59E0B" : C.border, color: "#fff", fontSize: "12px", fontWeight: "600", cursor: (toId && message.trim()) ? "pointer" : "not-allowed" }}>
          {saving ? "Sending…" : "⭐ Send Shoutout"}
        </button>
      </div>
    </div>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────────

function AnnouncementCard({ post, canDelete, onDelete }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${C.accent}`,
        borderRadius: "12px",
        padding: "18px 20px",
        position: "relative",
        transition: "box-shadow 0.15s",
        boxShadow: hov ? C.shadowMd : C.shadow,
      }}
    >
      {post.pinned && (
        <div style={{ position: "absolute", top: "12px", right: "14px", fontSize: "14px" }} title="Pinned">📌</div>
      )}
      {post.showOnWorkspace && (
        <div style={{ position: "absolute", top: post.pinned ? "36px" : "12px", right: "14px", fontSize: "11px", color: C.accent, fontWeight: "700" }} title="Shown on all workspaces">🏠 Workspace</div>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <MemberInitials name={post.authorName} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "2px" }}>
            <span style={{ fontSize: "13px", fontWeight: "700", color: C.text }}>{post.authorName}</span>
            <span style={{ fontSize: "11px", color: C.muted }}>{timeAgo(post.createdAt)}</span>
          </div>
          {post.title && (
            <div style={{ fontSize: "15px", fontWeight: "700", color: C.text, marginBottom: "6px" }}>{post.title}</div>
          )}
          <div style={{ fontSize: "13px", color: C.text, lineHeight: "1.7", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{post.content}</div>
        </div>
      </div>
      {canDelete && hov && (
        <button
          onClick={() => onDelete(post.id, "post")}
          style={{ position: "absolute", bottom: "10px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: "11px", opacity: 0.7, padding: "2px 6px" }}
        >
          Delete
        </button>
      )}
    </div>
  );
}

// ─── Shoutout Card ────────────────────────────────────────────────────────────

function ShoutoutCard({ shoutout, canDelete, onDelete }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "rgba(245,158,11,0.06)",
        border: "1px solid rgba(245,158,11,0.25)",
        borderRadius: "12px",
        padding: "16px 18px",
        position: "relative",
        transition: "box-shadow 0.15s",
        boxShadow: hov ? C.shadowMd : C.shadow,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flexShrink: 0, textAlign: "center" }}>
          <div style={{ fontSize: "24px", lineHeight: 1 }}>⭐</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
            <MemberInitials name={shoutout.fromName} size={24} />
            <span style={{ fontSize: "12px", fontWeight: "700", color: C.text }}>{shoutout.fromName}</span>
            <span style={{ fontSize: "12px", color: C.muted }}>shouted out</span>
            <MemberInitials name={shoutout.toName} size={24} />
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#F59E0B" }}>{shoutout.toName}</span>
            <span style={{ fontSize: "11px", color: C.muted, marginLeft: "auto" }}>{timeAgo(shoutout.createdAt)}</span>
          </div>
          <div style={{ fontSize: "13px", color: C.text, lineHeight: "1.6", fontStyle: "italic", borderLeft: "2px solid rgba(245,158,11,0.4)", paddingLeft: "10px" }}>
            "{shoutout.message}"
          </div>
        </div>
      </div>
      {canDelete && hov && (
        <button
          onClick={() => onDelete(shoutout.id, "shoutout")}
          style={{ position: "absolute", bottom: "10px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "#EF4444", fontSize: "11px", opacity: 0.7, padding: "2px 6px" }}
        >
          Delete
        </button>
      )}
    </div>
  );
}

// ─── Main BulletinBoardView ───────────────────────────────────────────────────

export default function BulletinBoardView({ token, currentUser, teamMembers = [] }) {
  const [data, setData] = useState({ posts: [], shoutouts: [], memberCount: 356, memberGoal: 400, memberGoalDate: "September 2026" });
  const [loading, setLoading] = useState(true);
  const [showPostForm, setShowPostForm] = useState(false);
  const [showShoutoutForm, setShowShoutoutForm] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    setLoading(true);
    apiFetch("/api/bulletin", {}, token)
      .then((r) => r.json())
      .then((d) => setData(d || { posts: [], shoutouts: [], memberCount: 356, memberGoal: 400, memberGoalDate: "September 2026" }))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = (updated) => {
    setData(updated);
    setShowPostForm(false);
    setShowShoutoutForm(false);
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm("Delete this?")) return;
    try {
      const res = await apiFetch("/api/bulletin", { method: "DELETE", body: JSON.stringify({ id, type }) }, token);
      const updated = await res.json();
      setData(updated);
    } catch {}
  };

  const handleMemberUpdate = (updated) => {
    setData((prev) => ({ ...prev, memberCount: updated.memberCount, memberGoal: updated.memberGoal, memberGoalDate: updated.memberGoalDate }));
  };

  const posts = data.posts || [];
  const shoutouts = data.shoutouts || [];

  // Sort pinned posts first
  const sortedPosts = [...posts].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  // Build combined feed sorted by date
  const allItems = [
    ...sortedPosts.filter((p) => p.pinned).map((p) => ({ ...p, _type: "post" })),
    ...shoutouts.map((s) => ({ ...s, _type: "shoutout" })),
    ...sortedPosts.filter((p) => !p.pinned).map((p) => ({ ...p, _type: "post" })),
  ];

  const TABS = [
    { id: "all", label: "🏠 All" },
    { id: "posts", label: "📢 Announcements" },
    { id: "shoutouts", label: "⭐ Shoutouts" },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "860px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: "800", color: C.text }}>📋 Team Bulletin Board</h1>
        <p style={{ margin: 0, fontSize: "14px", color: C.muted }}>Announcements from leadership and shoutouts from the team.</p>
      </div>

      {/* Member Count Tracker */}
      {!loading && (
        <MemberCountTracker
          token={token}
          isAdmin={isAdmin}
          memberCount={data.memberCount ?? 356}
          memberGoal={data.memberGoal ?? 400}
          memberGoalDate={data.memberGoalDate ?? "September 2026"}
          onUpdate={handleMemberUpdate}
        />
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {isAdmin && (
          <button
            onClick={() => { setShowPostForm((v) => !v); setShowShoutoutForm(false); }}
            style={{
              padding: "10px 18px", borderRadius: "10px", border: "none",
              background: showPostForm ? C.accent : C.accentLight,
              color: showPostForm ? "#fff" : C.accent,
              fontSize: "13px", fontWeight: "700", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "6px",
            }}
          >
            📢 {showPostForm ? "Cancel" : "New Announcement"}
          </button>
        )}
        <button
          onClick={() => { setShowShoutoutForm((v) => !v); setShowPostForm(false); }}
          style={{
            padding: "10px 18px", borderRadius: "10px", border: "none",
            background: showShoutoutForm ? "#F59E0B" : "rgba(245,158,11,0.12)",
            color: showShoutoutForm ? "#fff" : "#F59E0B",
            fontSize: "13px", fontWeight: "700", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "6px",
          }}
        >
          ⭐ {showShoutoutForm ? "Cancel" : "Give a Shoutout"}
        </button>
      </div>

      {/* Forms */}
      {showPostForm && isAdmin && (
        <NewPostForm token={token} onSave={handleSave} onClose={() => setShowPostForm(false)} />
      )}
      {showShoutoutForm && (
        <ShoutoutForm token={token} teamMembers={teamMembers} currentUser={currentUser} onSave={handleSave} onClose={() => setShowShoutoutForm(false)} />
      )}

      {/* Stats bar */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Announcements", value: posts.length, color: C.accent },
          { label: "Shoutouts", value: shoutouts.length, color: "#F59E0B" },
        ].map((s) => (
          <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "12px 18px", boxShadow: C.shadow, display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px", fontWeight: "800", color: s.color }}>{s.value}</span>
            <span style={{ fontSize: "12px", color: C.muted, fontWeight: "600" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: `1px solid ${C.border}` }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 16px", borderRadius: "8px 8px 0 0",
              border: `1px solid ${activeTab === tab.id ? C.border : "transparent"}`,
              borderBottom: activeTab === tab.id ? `1px solid ${C.card}` : "1px solid transparent",
              background: activeTab === tab.id ? C.card : "transparent",
              color: activeTab === tab.id ? C.accent : C.muted,
              fontSize: "13px", fontWeight: "700", cursor: "pointer",
              marginBottom: "-1px", transition: "all 0.12s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: C.muted, fontSize: "14px" }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {activeTab === "all" && allItems.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", background: C.card, borderRadius: "14px", border: `1px dashed ${C.border}`, color: C.muted }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>📋</div>
              <div style={{ fontSize: "15px", fontWeight: "600", color: C.text, marginBottom: "4px" }}>Nothing here yet</div>
              <div style={{ fontSize: "13px" }}>
                {isAdmin ? "Post an announcement or give a shoutout above." : "Give a shoutout to a teammate above!"}
              </div>
            </div>
          )}

          {activeTab === "all" && allItems.map((item) => (
            item._type === "post"
              ? <AnnouncementCard key={item.id} post={item} canDelete={isAdmin} onDelete={handleDelete} />
              : <ShoutoutCard key={item.id} shoutout={item} canDelete={isAdmin || item.fromId === currentUser?.id} onDelete={handleDelete} />
          ))}

          {activeTab === "posts" && (
            sortedPosts.length === 0
              ? <div style={{ textAlign: "center", padding: "40px", color: C.muted, fontSize: "14px" }}>No announcements yet.</div>
              : sortedPosts.map((p) => <AnnouncementCard key={p.id} post={p} canDelete={isAdmin} onDelete={handleDelete} />)
          )}

          {activeTab === "shoutouts" && (
            shoutouts.length === 0
              ? <div style={{ textAlign: "center", padding: "40px", color: C.muted, fontSize: "14px" }}>No shoutouts yet. Be the first!</div>
              : shoutouts.map((s) => <ShoutoutCard key={s.id} shoutout={s} canDelete={isAdmin || s.fromId === currentUser?.id} onDelete={handleDelete} />)
          )}
        </div>
      )}
    </div>
  );
}
